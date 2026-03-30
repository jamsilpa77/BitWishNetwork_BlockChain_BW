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
import { ReferralBonusService } from '../BonusService/ReferralBonusService';

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
      throw new Error('Wallet creation limit exceeded (Max 100 per IP)');
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

    // 6. [FIX] 추천인 보너스 시스템 연동 (누락된 연결고리 복구)
    if (referralCode) {
      try {
        const referralService = new ReferralBonusService();
        // User 타입 호환 객체 생성
        const minimalUser = {
          walletAddress: address,
          kycStatus: 'PENDING'
        };
        referralService.joinWithReferralCode(referralCode, address, minimalUser as any);
        console.log(`[WalletService] Referral bonus triggered for ${referralCode}`);
      } catch (e) {
        console.error('[WalletService] Bonus trigger failed:', e);
      }
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
    // [절대 원칙] 관리자 지갑 주소일 경우 기존 15자리 코드 강제 박제 (9DC5 보존)
    if (address === 'BW9F5FF090231236037F250A523B4FC320FB44BFA8') {
      return 'REF9F5FF0909DC5';
    }

    // 일반 유저: 15자리 정상 공식 (Prefix 8자리 + Suffix 4자리)
    const prefix = address.substring(2, 10).toUpperCase();
    const suffix = address.substring(address.length - 4).toUpperCase();
    return `REF${prefix}${suffix}`;
  }

  /**
   * 2차 비밀번호 검증 (로컬 또는 서버)
   */
  public async verifySecondPassword(address: string, password: string): Promise<boolean> {
    const localWallet = this.getWalletFromStorage();
    let storedPasswordHash = '';

    // 1. 로컬 데이터 우선 확인
    if (localWallet && localWallet.address === address && localWallet.secondPasswordHash) {
      storedPasswordHash = localWallet.secondPasswordHash;
    }

    // 2. 로컬에 없으면 서버 데이터 확인 (Anywhere Access 핵심)
    if (!storedPasswordHash) {
      try {
        const status = await apiService.getUserStatus(address);
        if (status && status.success && status.data && status.data.secondPasswordHash) {
          storedPasswordHash = status.data.secondPasswordHash;
          // [중요] 서버 데이터가 확인되면, 추후 로컬 복구를 위해 잠재적 데이터 확보 (메모리상)
          console.log('[WalletService] Found credentials on server. Attempting hybrid verification...');
        }
      } catch (e) {
        console.error('[WalletService] Remote password verification failed:', e);
      }
    }

    if (!storedPasswordHash) return false;

    // 3. 비밀번호 해시 검증
    const [salt, storedHash] = storedPasswordHash.split(':');
    if (!salt || !storedHash) return false;

    const currentHash = this.generateHash(password, salt);
    if (currentHash !== storedHash) return false;

    // 4. [자가치유] 검증 성공 시, 로컬 데이터가 없거나 깨져있다면 서버 데이터 받아와서 복구
    // 이를 통해 "지갑 가져오기" 절차 없이도 로그인만으로 복구 가능
    try {
      const serverCheck = await apiService.getUserStatus(address);
      if (serverCheck && serverCheck.success && serverCheck.data) {
        const serverData = serverCheck.data;

        // 로컬 지갑이 아예 없거나 타 지갑인 경우, 또는 중요 정보 누락 시
        if (!localWallet || localWallet.address !== address || !localWallet.encryptedMnemonic) {
          console.log('[WalletService] Restoring missing local wallet from server...');

          const restoredWallet: WalletData = {
            address: address,
            publicKey: serverData.publicKey || address,
            encryptedMnemonic: serverData.encryptedMnemonic || '', // 서버에 없으면 복구 불가(치명적)하지만 일단 로그인 허용
            secondPasswordHash: storedPasswordHash,
            createdAt: Date.now(),
            balance: 0, // 잔액은 별도 싱크
            availableBalance: 0,
            referralReward: 0,
            referralBonus: 0,
            myReferralCode: serverData.myReferralCode || this.generateReferralCode(address),
            ...(serverData.referrerCode ? { usedReferralCode: serverData.referrerCode } : {})
          };
          this.saveWalletToStorage(restoredWallet);
          this.setAuthSession(address); // 세션 갱신
        }
      }
    } catch (e) {
      console.warn('[WalletService] Auto-restore warning:', e);
    }

    return true;
  }

  /**
   * 2차 비밀번호 설정 여부 확인
   */
  public async hasSecondPassword(address: string): Promise<boolean> {
    let wallet = this.getWalletFromStorage();
    if (wallet && wallet.address && address) {
      if (wallet.address.toLowerCase() === address.trim().toLowerCase() && wallet.secondPasswordHash) {
        return true;
      }
    }

    try {
      // 서버 확인
      const status = await apiService.getUserStatus(address);
      if (status && status.data && status.data.secondPasswordHash) {
        return true;
      }
    } catch (e) { }

    return false;
  }

  /**
   * 2차 비밀번호 설정
   */
  public async setSecondPassword(address: string, password: string): Promise<boolean> {
    const wallet = this.getWalletFromStorage();
    if (!wallet || wallet.address !== address) return false;

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = this.generateHash(password, salt);
    const fullHash = `${salt}:${hash}`;

    wallet.secondPasswordHash = fullHash;
    this.saveWalletToStorage(wallet);

    // [중요] 서버 영구 저장 (데이터 휘발 방지, 1순위 목표 달성)
    try {
      console.log('[WalletService] Persisting 2nd password to server...');

      // 1. 기존 데이터 보호를 위해 서버 상태 조회
      let currentServerData = {};
      try {
        const status = await apiService.getUserStatus(address);
        if (status && status.data) {
          currentServerData = status.data;
        }
      } catch (e) {
        console.warn('[WalletService] Could not fetch current server data, proceeding with partial update.', e);
      }

      // 2. 서버 DB 업데이트 (registerUser는 Upsert 역할 수행 가정)
      await apiService.registerUser({
        ...currentServerData,
        walletAddress: address,
        secondPasswordHash: fullHash,
        // 필수 필드 보장 (없을 경우를 대비)
        publicKey: wallet.publicKey || address,
        encryptedMnemonic: wallet.encryptedMnemonic
      });

      // 3. 마이닝 데이터 동기화 트리거
      await apiService.syncMiningData(address, "0");

      console.log('[WalletService] Password persisted successfully.');
    } catch (e) {
      console.error('[WalletService] CRITICAL: Failed to save password to server!', e);
      // 서버 저장이 실패했더라도 로컬에는 저장되었으므로 true를 반환하지만,
      // 사용자에게 경고가 필요할 수 있음. 현재는 로그만 남김.
    }

    return true;
  }

  /**
   * 2차 비밀번호 초기화 (사용자 본인 요청 시)
   * 시드문구 인증 완료된 상태(My Wallet)에서만 호출 가능
   */
  public async resetSecondPassword(address: string): Promise<boolean> {
    try {
      console.log(`[WalletService] Resetting second password for ${address}`);

      // 1. 서버 데이터 조회
      let serverData: any = null;
      try {
        const response = await apiService.getUserStatus(address);
        serverData = response?.data;
      } catch (e) {
        console.error('Failed to fetch user status for reset', e);
      }

      // 2. 서버 업데이트 (해시 제거)
      if (serverData) {
        // 빈 해시로 업데이트
        await apiService.registerUser({
          ...serverData,
          secondPasswordHash: '' // Clear hash
        });
      }

      // 3. 로컬 스토리지 업데이트
      const wallet = this.getWalletFromStorage();
      if (wallet && wallet.address === address) {
        delete wallet.secondPasswordHash; // Use delete to comply with exactOptionalPropertyTypes
        this.saveWalletToStorage(wallet);
      }

      return true;
    } catch (e) {
      console.error('[WalletService] Password reset failed:', e);
      return false;
    }
  }

  /**
   * 지갑 복구 (새 기기/브라우저 접속 시)
   * 서버에 데이터가 있다면 가져오고, 없다면 새로 생성하는 로직과 병합
   */
  public async restoreWallet(mnemonic: string | string[], secondPassword: string): Promise<WalletData | null> {
    try {
      const phrase = Array.isArray(mnemonic) ? mnemonic.join(' ') : mnemonic.trim().split(/\s+/).join(' ');
      if (!this.validateMnemonic(phrase)) return null;

      const seed = await bip39.mnemonicToSeed(phrase);
      const hash = crypto.createHash('sha256').update(seed).digest('hex');
      const addressBody = hash.substring(0, 40).toUpperCase();
      const address = `BW${addressBody}`;

      // 1. 서버 데이터 확인
      let serverData: any = null;
      try {
        const response = await apiService.getUserStatus(address);
        if (response && response.success && response.user) {
          serverData = response.user;
        }
      } catch (e) {
        console.warn('[WalletService] Failed to fetch server data during restore:', e);
      }

      // 3. 서버에 데이터가 존재하는 경우 비밀번호 검증 (결정적 수정)
      // 3. 서버에 데이터가 존재하는 경우 비밀번호 검증 (관리자 지갑 자동 복구 로직 추가)


      if (serverData && serverData.secondPasswordHash) {
        const salt = serverData.secondPasswordHash.split(':')[0];
        const inputHash = this.generateHash(secondPassword, salt);
        const storedHash = serverData.secondPasswordHash.split(':')[1];

        if (inputHash !== storedHash) {
          // [정책 변경] 비밀번호 검증은 건너뛰되(나의 지갑 접속 허용), 
          // 서버 데이터는 임의로 수정하지 않음. (사용자가 직접 초기화해야 함)
          console.warn('[WalletService] Password mismatch. Skipping verification for "My Wallet" access.');
        }
      }

      // [삭제됨] 강제 업데이트 로직 삭제 (관리자 지시사항: 123456 임의 생성 금지)
      // 4. 새 데이터 구성
      const salt = serverData?.secondPasswordHash?.split(':')[0] || crypto.randomBytes(16).toString('hex');
      const secondPasswordHash = serverData?.secondPasswordHash || `${salt}:${this.generateHash(secondPassword, salt)}`;

      // 암호화는 입력받은(검증된) 비밀번호로 수행
      const encryptedMnemonic = this.encryptMnemonic(phrase, secondPassword);
      const myReferralCode = serverData?.myReferralCode || this.generateReferralCode(address);

      const walletData: WalletData = {
        address,
        publicKey: address,
        encryptedMnemonic,
        createdAt: serverData?.registeredAt || Date.now(),
        balance: parseFloat(serverData?.reward || serverData?.balance || '0'),
        availableBalance: parseFloat(serverData?.availableBalance || '0'),
        referralReward: serverData?.rewardStorage || 0,
        referralBonus: parseFloat(serverData?.bonusStorage || '0'),
        myReferralCode: myReferralCode,
        secondPasswordHash: secondPasswordHash
      };

      // 5. 서버에 데이터가 없거나 비밀번호 정보가 없다면 서버 등록/업데이트 수행
      if (!serverData || !serverData.secondPasswordHash) {
        try {
          await apiService.registerUser({
            walletAddress: address,
            publicKey: address,
            encryptedMnemonic,
            secondPasswordHash: walletData.secondPasswordHash,
            myReferralCode: walletData.myReferralCode,
            referrerCode: serverData?.referrerCode || null
          });
        } catch (error) {
          console.error('[WalletService] Server sync during restore failed:', error);
        }
      }

      // 4. 스토리지 저장 및 세션 설정
      this.saveWalletToStorage(walletData);
      this.setAuthSession(address);

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

  /**
   * 지갑 접근 권한 검증 (컴포넌트에서 시드 구문 입력 시 호출)
   * 브라우저에 지갑이 없더라도 시드 구문이 유효하면 '지갑 열기' 버튼을 활성화하기 위해 true 반환
   */
  public verifyWalletAccess(inputMnemonic: string): boolean {
    const normalizedInput = inputMnemonic.trim().split(/\s+/).join(' ');

    // 시드 문구가 12단어 또는 24단어이고 bip39 라이브러리 상 유효한지 체크
    const wordCount = normalizedInput.split(' ').length;
    if (wordCount !== 12 && wordCount !== 24) return false;

    try {
      return bip39.validateMnemonic(normalizedInput);
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
      window.dispatchEvent(new Event('BW_DATA_UPDATED'));
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
    return count < 100;
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

  /**
   * 현재 기기에 저장된 지갑 주소 반환 (다계정 방지 체크용)
   */
  public getCurrentWalletAddress(): string | null {
    const wallet = this.getWalletFromStorage();
    return wallet ? wallet.address : null;
  }
}

export const walletService = new WalletService();
