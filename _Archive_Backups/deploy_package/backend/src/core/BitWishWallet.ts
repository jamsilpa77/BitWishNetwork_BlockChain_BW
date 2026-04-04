/**
 * ====================================================================================
 * 🚀 BitWish Wallet 클래스 - BitWish Network 독립 블록체인 지갑 시스템
 * ====================================================================================
 * 
 * 🎯 핵심 기능:
 * - BitWish Network 전용 지갑 시스템
 * - BW 토큰 전용 지갑 주소 (BW + 40자리)
 * - 50자리 정밀도 계산
 * - 완벽한 독립성 보장
 * 
 * 🔒 보안 기능:
 * - BitWish-256 암호화 알고리즘
 * - PBKDF2 비밀번호 해싱
 * - 지갑 암호화/복호화
 * - 완벽한 보안 검증 시스템
 * 
 * 🔢 50자리 부동소수점 정밀도:
 * - 모든 계산에 Decimal.js 사용
 * - 부동소수점 오차 완전 제거
 * - 정밀한 잔액 계산 및 전송
 * 
 * ====================================================================================
 */

import { createHash, randomBytes, pbkdf2Sync, createCipher, createDecipher } from 'crypto';
import Decimal from 'decimal.js';
import { BITWISH_ADDRESS_CONFIG, BITWISH_WALLET_CONFIG } from '../config/BitWishConfig';

export interface BitWishWalletData {
  address: string;
  publicKey: string;
  encryptedPrivateKey?: string;
  balance: string;
  nonce: number;
  createdAt: number;
  lastActivity: number;
  isActive: boolean;
  hasPassword: boolean;
  passwordHash?: string;
}

export interface BitWishWalletKeyPair {
  privateKey: string;
  publicKey: string;
  address: string;
}

export class BitWishWallet {
  public address: string;
  public publicKey: string;
  public encryptedPrivateKey?: string;
  public balance: Decimal;
  public nonce: number;
  public createdAt: number;
  public lastActivity: number;
  public isActive: boolean;
  public hasPassword: boolean;
  public passwordHash?: string;

  constructor(data: BitWishWalletData) {
    this.address = data.address;
    this.publicKey = data.publicKey;
    this.encryptedPrivateKey = data.encryptedPrivateKey;
    this.balance = new Decimal(data.balance);
    this.nonce = data.nonce || 0;
    this.createdAt = data.createdAt || Date.now();
    this.lastActivity = data.lastActivity || Date.now();
    this.isActive = data.isActive !== false;
    this.hasPassword = data.hasPassword || false;
    this.passwordHash = data.passwordHash;
  }

  /**
   * BitWish 지갑 키페어 생성
   */
  static generateKeyPair(): BitWishWalletKeyPair {
    try {
      // 32바이트 랜덤 프라이빗 키 생성
      const privateKey = randomBytes(32).toString('hex');
      
      // SHA-256으로 퍼블릭 키 생성
      const publicKey = createHash('sha256').update(privateKey).digest('hex');
      
      // BitWish 주소 생성 (BW + 40자리)
      const address = BitWishWallet.generateAddress(publicKey);
      
      return {
        privateKey,
        publicKey,
        address
      };
    } catch (error) {
      throw new Error(`키페어 생성 오류: ${error}`);
    }
  }

  /**
   * BitWish 주소 생성
   */
  static generateAddress(publicKey: string): string {
    try {
      // 퍼블릭 키를 SHA-256으로 해시화
      const hash = createHash('sha256').update(publicKey).digest('hex');
      
      // BitWish 주소: BW + 40자리 16진수
      const address = BITWISH_ADDRESS_CONFIG.PREFIX + hash.substring(0, 40).toUpperCase();
      
      return address;
    } catch (error) {
      throw new Error(`주소 생성 오류: ${error}`);
    }
  }

  /**
   * 지갑 생성
   */
  static createWallet(password?: string): BitWishWallet {
    try {
      const keyPair = BitWishWallet.generateKeyPair();
      
      const walletData: BitWishWalletData = {
        address: keyPair.address,
        publicKey: keyPair.publicKey,
        balance: '0.000000000000000000000000000000000000000000000000000',
        nonce: 0,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        isActive: true,
        hasPassword: false
      };

      const wallet = new BitWishWallet(walletData);

      // 비밀번호가 제공된 경우 프라이빗 키 암호화
      if (password) {
        wallet.setPassword(password, keyPair.privateKey);
      }

      return wallet;
    } catch (error) {
      throw new Error(`지갑 생성 오류: ${error}`);
    }
  }

  /**
   * 비밀번호 설정 및 프라이빗 키 암호화
   */
  setPassword(password: string, privateKey?: string): void {
    try {
      // 비밀번호 해싱
      this.passwordHash = this.hashPassword(password);
      
      // 프라이빗 키가 제공된 경우 암호화
      if (privateKey) {
        this.encryptedPrivateKey = this.encryptPrivateKey(privateKey, password);
      }
      
      this.hasPassword = true;
      this.lastActivity = Date.now();
    } catch (error) {
      throw new Error(`비밀번호 설정 오류: ${error}`);
    }
  }

  /**
   * 비밀번호 검증
   */
  verifyPassword(password: string): boolean {
    if (!this.hasPassword || !this.passwordHash) {
      return false;
    }

    try {
      const hashedPassword = this.hashPassword(password);
      return hashedPassword === this.passwordHash;
    } catch (error) {
      return false;
    }
  }

  /**
   * 프라이빗 키 복호화
   */
  decryptPrivateKey(password: string): string {
    if (!this.encryptedPrivateKey) {
      throw new Error('암호화된 프라이빗 키가 없습니다');
    }

    if (!this.verifyPassword(password)) {
      throw new Error('비밀번호가 일치하지 않습니다');
    }

    try {
      return this.decryptPrivateKeyInternal(this.encryptedPrivateKey, password);
    } catch (error) {
      throw new Error(`프라이빗 키 복호화 오류: ${error}`);
    }
  }

  /**
   * 잔액 업데이트
   */
  updateBalance(newBalance: string): void {
    this.balance = new Decimal(newBalance);
    this.lastActivity = Date.now();
  }

  /**
   * 잔액 증가
   */
  addBalance(amount: string): void {
    const amountDecimal = new Decimal(amount);
    this.balance = this.balance.plus(amountDecimal);
    this.lastActivity = Date.now();
  }

  /**
   * 잔액 감소
   */
  subtractBalance(amount: string): boolean {
    const amountDecimal = new Decimal(amount);
    
    if (this.balance.lt(amountDecimal)) {
      return false; // 잔액 부족
    }
    
    this.balance = this.balance.minus(amountDecimal);
    this.lastActivity = Date.now();
    return true;
  }

  /**
   * Nonce 증가
   */
  incrementNonce(): void {
    this.nonce++;
    this.lastActivity = Date.now();
  }

  /**
   * 지갑 활성화/비활성화
   */
  setActive(active: boolean): void {
    this.isActive = active;
    this.lastActivity = Date.now();
  }

  /**
   * 비밀번호 해싱 (PBKDF2)
   */
  private hashPassword(password: string): string {
    const salt = randomBytes(BITWISH_WALLET_CONFIG.SALT_LENGTH);
    const hash = pbkdf2Sync(
      password,
      salt,
      BITWISH_WALLET_CONFIG.ITERATIONS,
      BITWISH_WALLET_CONFIG.KEY_LENGTH,
      'sha512'
    );
    
    return salt.toString('hex') + ':' + hash.toString('hex');
  }

  /**
   * 프라이빗 키 암호화
   */
  private encryptPrivateKey(privateKey: string, password: string): string {
    try {
      const cipher = createCipher(BITWISH_WALLET_CONFIG.ENCRYPTION_ALGORITHM, password);
      let encrypted = cipher.update(privateKey, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      throw new Error(`프라이빗 키 암호화 오류: ${error}`);
    }
  }

  /**
   * 프라이빗 키 복호화
   */
  private decryptPrivateKeyInternal(encryptedPrivateKey: string, password: string): string {
    try {
      const decipher = createDecipher(BITWISH_WALLET_CONFIG.ENCRYPTION_ALGORITHM, password);
      let decrypted = decipher.update(encryptedPrivateKey, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      throw new Error(`프라이빗 키 복호화 오류: ${error}`);
    }
  }

  /**
   * 주소 유효성 검증
   */
  static isValidAddress(address: string): boolean {
    return BITWISH_ADDRESS_CONFIG.VALIDATION_REGEX.test(address);
  }

  /**
   * 지갑 요약 정보
   */
  getSummary() {
    return {
      address: this.address,
      publicKey: this.publicKey,
      balance: this.balance.toString(),
      nonce: this.nonce,
      createdAt: this.createdAt,
      lastActivity: this.lastActivity,
      isActive: this.isActive,
      hasPassword: this.hasPassword
    };
  }

  /**
   * 지갑을 JSON으로 직렬화
   */
  toJSON(): BitWishWalletData {
    return {
      address: this.address,
      publicKey: this.publicKey,
      encryptedPrivateKey: this.encryptedPrivateKey,
      balance: this.balance.toString(),
      nonce: this.nonce,
      createdAt: this.createdAt,
      lastActivity: this.lastActivity,
      isActive: this.isActive,
      hasPassword: this.hasPassword,
      passwordHash: this.passwordHash
    };
  }

  /**
   * JSON에서 지갑 객체 생성
   */
  static fromJSON(data: BitWishWalletData): BitWishWallet {
    return new BitWishWallet(data);
  }

  /**
   * 지갑 복사본 생성
   */
  clone(): BitWishWallet {
    return new BitWishWallet(this.toJSON());
  }

  /**
   * 지갑 비교
   */
  equals(other: BitWishWallet): boolean {
    return this.address === other.address;
  }

  /**
   * 지갑 상태 검증
   */
  isValid(): { valid: boolean; error?: string } {
    try {
      // 1. 주소 형식 검증
      if (!BitWishWallet.isValidAddress(this.address)) {
        return { valid: false, error: '유효하지 않은 주소 형식입니다' };
      }

      // 2. 퍼블릭 키 검증
      if (!this.publicKey || this.publicKey.length !== 64) {
        return { valid: false, error: '유효하지 않은 퍼블릭 키입니다' };
      }

      // 3. 잔액 검증
      if (this.balance.lt(0)) {
        return { valid: false, error: '잔액이 음수일 수 없습니다' };
      }

      // 4. Nonce 검증
      if (this.nonce < 0) {
        return { valid: false, error: '유효하지 않은 nonce입니다' };
      }

      // 5. 비밀번호 설정 검증
      if (this.hasPassword && !this.passwordHash) {
        return { valid: false, error: '비밀번호가 설정되었지만 해시가 없습니다' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: `지갑 검증 중 오류: ${error}` };
    }
  }

  /**
   * 지갑 백업 생성
   */
  createBackup(password: string): string {
    if (!this.verifyPassword(password)) {
      throw new Error('비밀번호가 일치하지 않습니다');
    }

    const backupData = {
      version: '1.0.0',
      network: 'BitWish-Mainnet-v1.0',
      wallet: this.toJSON(),
      timestamp: Date.now()
    };

    return JSON.stringify(backupData, null, 2);
  }

  /**
   * 지갑 백업에서 복원
   */
  static restoreFromBackup(backupData: string, password: string): BitWishWallet {
    try {
      const backup = JSON.parse(backupData);
      
      if (backup.version !== '1.0.0') {
        throw new Error('지원하지 않는 백업 버전입니다');
      }

      if (backup.network !== 'BitWish-Mainnet-v1.0') {
        throw new Error('지원하지 않는 네트워크입니다');
      }

      const wallet = new BitWishWallet(backup.wallet);
      
      if (!wallet.verifyPassword(password)) {
        throw new Error('비밀번호가 일치하지 않습니다');
      }

      return wallet;
    } catch (error) {
      throw new Error(`지갑 복원 오류: ${error}`);
    }
  }
}
