/**
 * BitWishNetwork Unified Wallet Service (v2.0)
 * 
 * ⚠️ 중요 준수 사항:
 * 1. AES-256-CBC 암호화 및 PBKDF2 (100,000회) 적용
 * 2. 추천 코드는 지갑 주소 기반 결정적 알고리즘 사용 (불변)
 * 3. 모든 데이터는 지갑 주소를 Key로 하여 서버(MongoDB/File) 연동
 */

import * as bip39 from 'bip39';
import { Buffer } from 'buffer';
import crypto from 'crypto';
import { apiService } from '@/services/ApiService';

// 브라우저 환경 Buffer 설정
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
}

export interface WalletData {
  address: string;
  publicKey: string;
  encryptedMnemonic: string;
  createdAt: number;
  balance: number;
  availableBalance: number;
  referralReward: number;
  referralBonus: number;
  myReferralCode: string;
  usedReferralCode?: string;
  secondPasswordHash?: string;
}

export class WalletService {
  private readonly STORAGE_KEY = 'bw_wallet_data';
  private readonly AUTH_SESSION_KEY = 'bw_auth_session';
  private readonly IP_LIMIT_KEY = 'bw_ip_creation_count';

  // 암호화 설정 (표준화)
  private readonly ALGORITHM = 'aes-256-cbc';
  private readonly PBKDF2_ITERATIONS = 100000;
  private readonly KEY_LENGTH = 32;

  constructor() { }

  /**
   * 24단어 시드 구문 생성 (256비트 엔트로피)
   */
  public generateMnemonic(): string[] {
    const mnemonic = bip39.generateMnemonic(256);
    return mnemonic.split(' ');
  }

  /**
   * 검증을 위한 4개의 랜덤 인덱스 생성 (1~24)
   */
  public generateVerificationIndices(): number[] {
    const indices = new Set<number>();
    while (indices.size < 4) {
      const randomIndex = Math.floor(Math.random() * 24) + 1;
      indices.add(randomIndex);
    }
    return Array.from(indices).sort((a, b) => a - b);
  }

  /**
   * 지갑 생성 (표준화 로직)
   */
  public async createWallet(mnemonic: string[], secondPassword: string, referralCode?: string): Promise<WalletData> {
    if (!this.checkIpLimit()) {
      throw new Error('Wallet creation limit exceeded (Max 2 per IP)');
    }

    const phrase = mnemonic.join(' ');
    const seed = await bip39.mnemonicToSeed(phrase);

    // 1. 주소 생성 (SHA256 해시 기반 표준)
    const hash = crypto.createHash('sha256').update(seed).digest('hex');
    const addressBody = hash.substring(0, 40).toUpperCase();
    const address = `BW${addressBody}`;

    // 2. 2차 비밀번호 해시 (PBKDF2 SHA512 고정)
    const salt = crypto.randomBytes(16).toString('hex');
    const secondPasswordHash = this.generateHash(secondPassword, salt);

    // 3. 시드문구 암호화 (AES-256-CBC)
    const encryptedMnemonic = this.encryptMnemonic(phrase, secondPassword);

    // 4. 추천 코드 생성 (지갑 주소 기반 절대 불변 알고리즘)
    const myReferralCode = this.generateReferralCode(address);

    const walletData: WalletData = {
      address,
      publicKey: address,
      encryptedMnemonic,
      createdAt: Date.now(),
      balance: 0,
      availableBalance: 0,
      referralReward: referralCode ? 1 : 0,
      referralBonus: 0,
      myReferralCode,
      secondPasswordHash: `${salt}:${secondPasswordHash}`,
      ...(referralCode ? { usedReferralCode: referralCode } : {})
    };

    // 5. 서버 영구 저장 (MongoDB)
    try {
      await apiService.registerUser({
        walletAddress: address,
        publicKey: address,
        encryptedMnemonic,
        secondPasswordHash: walletData.secondPasswordHash,
        myReferralCode,
        referrerCode: referralCode || null,
        ipAddress: '127.0.0.1'
      });
    } catch (error) {
      console.error('[WalletService] Server registration failed:', error);
    }

    this.saveWalletToStorage(walletData);
    this.incrementIpCount();
    this.setAuthSession(address);

    return walletData;
  }

  /**
   * 추천인 코드 생성 (관리자 표준: REF + 주소[2-9] + 주소[마지막7])
   */
  public generateReferralCode(address: string): string {
    // BW 접두사 제외한 실제 데이터 영역(3번째 글자부터 8자리)
    const prefix = address.substring(2, 10).toUpperCase();
    // 마지막 7자리
    const suffix = address.substring(address.length - 7).toUpperCase();
    return `REF${prefix}${suffix}`;
  }

  /**
   * 2차 비밀번호 검증 (로컬 또는 서버)
   */
  public async verifySecondPassword(address: string, password: string): Promise<boolean> {
    let wallet = this.getWalletFromStorage();
    let storedPasswordHash = '';

    if (wallet && wallet.address === address && wallet.secondPasswordHash) {
      storedPasswordHash = wallet.secondPasswordHash;
    } else {
      // 로컬에 없으면 서버에서 확인
      try {
        const status = await apiService.getUserStatus(address);
        if (status && status.success && status.data && status.data.secondPasswordHash) {
          storedPasswordHash = status.data.secondPasswordHash;
        }
      } catch (e) {
        console.error('[WalletService] Remote password verification failed:', e);
      }
    }

    if (!storedPasswordHash) return false;

    const [salt, storedHash] = storedPasswordHash.split(':');
    if (!salt || !storedHash) return false;

    const currentHash = this.generateHash(password, salt);
    return currentHash === storedHash;
  }

  /**
   * 2차 비밀번호 설정
   */
  public async setSecondPassword(address: string, password: string): Promise<boolean> {
    const wallet = this.getWalletFromStorage();
    if (!wallet || wallet.address !== address) return false;

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = this.generateHash(password, salt);
    wallet.secondPasswordHash = `${salt}:${hash}`;

    this.saveWalletToStorage(wallet);

    // 서버 동기화
    try {
      await apiService.syncMiningData(address, "0"); // 보상 전송은 아니지만 트리거 역할
    } catch (e) { }

    return true;
  }

  /**
   * 지갑 복구 (새 기기/브라우저 접속 시)
   */
  public async restoreWallet(mnemonic: string | string[], secondPassword: string): Promise<WalletData | null> {
    try {
      const phrase = Array.isArray(mnemonic) ? mnemonic.join(' ') : mnemonic.trim().split(/\s+/).join(' ');
      if (!this.validateMnemonic(phrase)) return null;

      const seed = await bip39.mnemonicToSeed(phrase);
      const hash = crypto.createHash('sha256').update(seed).digest('hex');
      const addressBody = hash.substring(0, 40).toUpperCase();
      const address = `BW${addressBody}`;

      // 2차 비밀번호 해시
      const salt = crypto.randomBytes(16).toString('hex');
      const secondPasswordHash = this.generateHash(secondPassword, salt);
      const encryptedMnemonic = this.encryptMnemonic(phrase, secondPassword);
      const myReferralCode = this.generateReferralCode(address);

      const walletData: WalletData = {
        address,
        publicKey: address,
        encryptedMnemonic,
        createdAt: Date.now(),
        balance: 0,
        availableBalance: 0,
        referralReward: 0,
        referralBonus: 0,
        myReferralCode,
        secondPasswordHash: `${salt}:${secondPasswordHash}`
      };

      // 스토리지 저장 및 세션 설정
      this.saveWalletToStorage(walletData);
      this.setAuthSession(address);

      // 서버와 데이터 동기화 시도 (기존 데이터가 있다면 가져옴)
      try {
        await apiService.syncMiningData(address, "0");
      } catch (e) {
        console.warn('[WalletService] Sync after restore failed:', e);
      }

      return walletData;
    } catch (e) {
      console.error('[WalletService] Restore failed:', e);
      return null;
    }
  }

  /**
   * 지갑 주소 유효성 검증
   */
  public validateWalletAddress(address: string): boolean {
    return /^BW[0-9A-F]{40}$/.test(address);
  }

  /**
   * 시드 구문 유효성 검증
   */
  public validateMnemonic(mnemonic: string[] | string): boolean {
    const phrase = Array.isArray(mnemonic) ? mnemonic.join(' ') : mnemonic;
    return bip39.validateMnemonic(phrase);
  }

  public verifyWalletAccess(inputMnemonic: string): boolean {
    const storedWallet = this.getWalletFromStorage();
    const normalizedInput = inputMnemonic.trim().split(/\s+/).join(' ');

    try {
      // 1. 저장된 지갑이 있을 경우 기존 로직 수행 (암호화된 시드 구문과 대조)
      if (storedWallet && storedWallet.encryptedMnemonic) {
        return Buffer.from(normalizedInput).toString('base64') === storedWallet.encryptedMnemonic ||
          storedWallet.encryptedMnemonic.includes(Buffer.from(normalizedInput).toString('hex'));
      }

      // 2. 저장된 지갑이 없을 경우 (새 기기), 시드 구문 자체의 유효성 검사
      // 니모닉이 유효하면 일단 접근 허용 (이후 restoreWallet 과정으로 이어짐)
      return this.validateMnemonic(normalizedInput);
    } catch (e) {
      return false;
    }
  }

  private generateHash(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, this.PBKDF2_ITERATIONS, 64, 'sha512').toString('hex');
  }

  /**
   * 니모닉 암호화 (AES-256-CBC)
   */
  private encryptMnemonic(mnemonic: string, password: string): string {
    const salt = crypto.randomBytes(16);
    const key = crypto.pbkdf2Sync(password, salt, this.PBKDF2_ITERATIONS, this.KEY_LENGTH, 'sha256');
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    let encrypted = cipher.update(mnemonic, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${salt.toString('hex')}:${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * 니모닉 복호화
   */
  public decryptMnemonic(encryptedData: string, password: string): string {
    const [saltHex, ivHex, encryptedHex] = encryptedData.split(':');
    if (!saltHex || !ivHex || !encryptedHex) throw new Error('Invalid format');

    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.pbkdf2Sync(password, salt, this.PBKDF2_ITERATIONS, this.KEY_LENGTH, 'sha256');

    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // --- 유틸리티 메서드 ---

  private saveWalletToStorage(data: WalletData): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }
  }

  public getWalletFromStorage(): WalletData | null {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  private checkIpLimit(): boolean {
    if (typeof window === 'undefined') return true;
    const count = parseInt(localStorage.getItem(this.IP_LIMIT_KEY) || '0');
    return count < 2;
  }

  private incrementIpCount(): void {
    if (typeof window === 'undefined') return;
    const count = parseInt(localStorage.getItem(this.IP_LIMIT_KEY) || '0');
    localStorage.setItem(this.IP_LIMIT_KEY, (count + 1).toString());
  }

  public setAuthSession(address: string): void {
    if (typeof window === 'undefined') return;
    const sessionData = { address, timestamp: Date.now() };
    localStorage.setItem(this.AUTH_SESSION_KEY, JSON.stringify(sessionData));
  }

  public checkAuthSession(): boolean {
    if (typeof window === 'undefined') return false;
    const data = localStorage.getItem(this.AUTH_SESSION_KEY);
    if (!data) return false;
    const session = JSON.parse(data);
    return Date.now() - session.timestamp < 10 * 60 * 1000;
  }
}

export const walletService = new WalletService();
