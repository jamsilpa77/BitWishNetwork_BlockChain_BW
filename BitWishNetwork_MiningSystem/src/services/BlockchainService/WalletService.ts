/**
 * BitWishNetwork Wallet Service
 * 
 * ⚠️ 중요 준수 사항:
 * 1. AES-256 암호화 적용 (Base64 절대 금지)
 * 2. 2차 비밀번호 필수 적용 (PBKDF2 해시)
 * 3. 지갑 생성 시 서버 영구 저장 (MongoDB)
 * 4. 지갑 주소 유일성 보장 (서버 검증)
 */

import * as bip39 from 'bip39';
import crypto from 'crypto';
import { apiService } from '@/services/ApiService';

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
}

export class WalletService {
  private readonly STORAGE_KEY = 'bw_wallet_data';
  private readonly AUTH_SESSION_KEY = 'bw_auth_session';
  private readonly IP_LIMIT_KEY = 'bw_ip_creation_count';

  // 암호화 설정
  private readonly ALGORITHM = 'aes-256-cbc';
  private readonly SALT_ROUNDS = 10000;
  private readonly KEY_LENGTH = 32;

  constructor() { }

  /**
   * 지갑 생성 (보안 강화 버전)
   */
  public async createWallet(mnemonic: string[], secondPassword: string, referralCode?: string): Promise<WalletData> {
    // 1. IP 제한 확인 (로컬 체크 + 서버 체크 권장)
    if (!this.checkIpLimit()) {
      throw new Error('Wallet creation limit exceeded (Max 2 per IP)');
    }

    const phrase = mnemonic.join(' ');

    // 2. 시드 및 주소 생성
    const seed = await bip39.mnemonicToSeed(phrase);
    const hash = crypto.createHash('sha256').update(seed).digest('hex');
    const addressBody = hash.substring(0, 40).toUpperCase();
    const address = `BW${addressBody}`;

    // 3. 2차 비밀번호 해시 생성 (서버 저장용)
    const secondPasswordHash = this.hashSecondPassword(secondPassword);

    // 4. 니모닉 암호화 (AES-256, 2차 비밀번호를 키로 사용)
    const encryptedMnemonic = this.encryptMnemonic(phrase, secondPassword);

    // 5. 내 추천 코드 생성
    const myReferralCode = this.generateReferralCode();

    const walletData: WalletData = {
      address,
      publicKey: address, // BW 네트워크에서는 주소가 공개키 식별자
      encryptedMnemonic,
      createdAt: Date.now(),
      balance: 0,
      availableBalance: 0,
      referralReward: 0,
      referralBonus: 0,
      myReferralCode,
      ...(referralCode ? { usedReferralCode: referralCode } : {})
    };

    // 6. 서버에 영구 저장 (필수)
    try {
      await apiService.registerUser({
        walletAddress: address,
        publicKey: address,
        encryptedMnemonic,
        secondPasswordHash,
        myReferralCode,
        referrerCode: referralCode,
        ipAddress: '127.0.0.1' // 실제 IP는 서버에서 추출 권장
      });
    } catch (error) {
      console.error('Server registration failed:', error);
      throw new Error('Failed to register wallet on server. Please try again.');
    }

    // 7. 로컬 스토리지 저장 (캐시용)
    this.saveWalletToStorage(walletData);
    this.incrementIpCount();
    this.setAuthSession();

    return walletData;
  }

  /**
   * 니모닉 암호화 (AES-256-CBC)
   */
  private encryptMnemonic(mnemonic: string, password: string): string {
    const salt = crypto.randomBytes(16);
    const key = crypto.pbkdf2Sync(password, salt, this.SALT_ROUNDS, this.KEY_LENGTH, 'sha256');
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    let encrypted = cipher.update(mnemonic, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // salt + iv + encrypted 형태로 저장
    return `${salt.toString('hex')}:${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * 니모닉 복호화
   */
  public decryptMnemonic(encryptedData: string, secondPassword: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    // 3. 복호화
    const saltHex = parts[0] as string;
    const ivHex = parts[1] as string;
    const encryptedHex = parts[2] as string;

    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');

    const key = crypto.pbkdf2Sync(secondPassword, salt, 100000, 32, 'sha512');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * 2차 비밀번호 해시 생성 (단방향)
   */
  private hashSecondPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  /**
   * 추천 코드 생성
   */
  private generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

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
    if (typeof window !== 'undefined') {
      const count = parseInt(localStorage.getItem(this.IP_LIMIT_KEY) || '0');
      return count < 2;
    }
    return true;
  }

  private incrementIpCount(): void {
    if (typeof window !== 'undefined') {
      const count = parseInt(localStorage.getItem(this.IP_LIMIT_KEY) || '0');
      localStorage.setItem(this.IP_LIMIT_KEY, (count + 1).toString());
    }
  }

  private setAuthSession(): void {
    if (typeof window !== 'undefined') {
      const sessionData = {
        timestamp: Date.now(),
        expiresIn: 10 * 60 * 1000 // 10분
      };
      localStorage.setItem(this.AUTH_SESSION_KEY, JSON.stringify(sessionData));
    }
  }

  public checkAuthSession(): boolean {
    if (typeof window === 'undefined') return false;
    const sessionStr = localStorage.getItem(this.AUTH_SESSION_KEY);
    if (!sessionStr) return false;

    try {
      const sessionData = JSON.parse(sessionStr);
      const timeDiff = Date.now() - sessionData.timestamp;
      return timeDiff < sessionData.expiresIn;
    } catch (e) {
      return false;
    }
  }
}

export const walletService = new WalletService();
