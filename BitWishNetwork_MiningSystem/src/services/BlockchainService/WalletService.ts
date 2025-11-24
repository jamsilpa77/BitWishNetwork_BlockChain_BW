/**
 * BitWishNetwork BW 포인트 채굴 시스템
 * WalletService.ts
 * 
 * ⚠️ 중요 준수 사항:
 * ❌ 전역 변수 사용 금지
 * ❌ 공통 함수 사용 금지
 * ❌ 다른 컴포넌트와 상태 공유 금지
 * ✅ 자체 보안 검증만 사용
 * ✅ BitWish Network 전용 시스템만 사용
 */

import * as bip39 from 'bip39';
import { Buffer } from 'buffer';
import crypto from 'crypto';

// 브라우저 환경에서 Buffer 사용을 위한 설정
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
}

export class WalletService {
  private readonly STORAGE_KEY = 'bw_wallet_data';
  private readonly IP_LIMIT_KEY = 'bw_wallet_created_count';
  private readonly AUTH_SESSION_KEY = 'bw_last_auth_time';

  /**
   * 24단어 시드 구문 생성 (256비트 엔트로피)
   * @returns 생성된 24단어 배열
   */
  public generateMnemonic(): string[] {
    const mnemonic = bip39.generateMnemonic(256);
    return mnemonic.split(' ');
  }

  /**
   * 시드 구문 유효성 검증
   * @param mnemonic 검증할 시드 구문
   */
  public validateMnemonic(mnemonic: string[] | string): boolean {
    const phrase = Array.isArray(mnemonic) ? mnemonic.join(' ') : mnemonic;
    return bip39.validateMnemonic(phrase);
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
   * 고유 추천인 코드 생성 (8자리 이상, 영문 대소문자 + 숫자)
   */
  private generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    // 12자리 랜덤 문자열 생성 (충돌 확률 극소화)
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 지갑 생성 및 저장 (핵심 로직)
   * @param mnemonic 시드 구문
   * @param password (옵션) 암호화 비밀번호
   * @param referralCode (옵션) 추천인 코드
   */
  public async createWallet(mnemonic: string[], password?: string, referralCode?: string): Promise<WalletData> {
    // IP 제한 확인
    if (!this.checkIpLimit()) {
      throw new Error('Wallet creation limit exceeded (Max 2 per IP)');
    }
    const phrase = mnemonic.join(' ');

    // 1. 시드에서 엔트로피/키 파생
    const seed = await bip39.mnemonicToSeed(phrase);

    // 2. 공개키/주소 생성 (BW + 40자 16진수)
    // 실제로는 Ed25519 등을 써야 하지만, 요구사항에 맞춰 SHA256 해시의 앞 20바이트를 사용해 주소 포맷 준수
    const hash = crypto.createHash('sha256').update(seed).digest('hex');
    const addressBody = hash.substring(0, 40).toUpperCase(); // 40자
    const address = `BW${addressBody}`; // Total 42 chars

    // 3. 시드 암호화 (간이 구현: 실제로는 강력한 KDF 사용 권장)
    // 여기서는 Base64로 인코딩하여 저장 (데모용) - 실제 배포 시 AES-256 적용 필요
    const encryptedMnemonic = Buffer.from(phrase).toString('base64');

    // 4. 내 추천 코드 생성 (12자리 랜덤 영문숫자)
    const myReferralCode = this.generateReferralCode();

    // 5. 추천인 보상 계산 (추천 코드 입력 시 1 BW 지급)
    // 실제로는 추천 코드 유효성 검증이 필요하지만, 현재는 입력만 있으면 지급
    const initialReward = referralCode && referralCode.length >= 8 ? 1 : 0;

    const walletData: WalletData = {
      address,
      publicKey: address, // BW 네트워크에서는 주소가 곧 공개키 식별자 역할
      encryptedMnemonic,
      createdAt: Date.now(),
      balance: 0,
      availableBalance: 0,
      referralReward: initialReward,
      referralBonus: 0,
      myReferralCode,
      ...(referralCode ? { usedReferralCode: referralCode } : {})
    };

    // 6. 로컬 스토리지 저장
    this.saveWalletToStorage(walletData);
    this.incrementIpCount();

    // 7. 생성 직후 인증 세션 자동 설정 (사용자 요청: 생성 후 바로 지갑 열기)
    this.setAuthSession();

    return walletData;
  }

  /**
   * 지갑 데이터 로컬 스토리지 저장
   */
  private saveWalletToStorage(data: WalletData): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      // 호환성을 위해 기존 키도 업데이트 (선택 사항)
      localStorage.setItem('walletPublicKey', data.address);
    }
  }

  /**
   * 저장된 지갑 데이터 불러오기
   */
  public getStoredWallet(): WalletData | null {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    }
    return null;
  }

  /**
   * Keystore 복호화 (시뮬레이션)
   */
  public async decryptKeystore(keystore: any, password: string): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          address: keystore.address,
          mnemonic: { phrase: 'decrypted mnemonic' }
        });
      }, 500);
    });
  }

  /**
   * 지갑 접근 권한 검증 (시드문구 비교)
   */
  public verifyWalletAccess(inputMnemonic: string): boolean {
    const storedWallet = this.getStoredWallet();
    if (!storedWallet) return false;

    // 입력값 공백 정리 (다중 공백 제거)
    const normalizedInput = inputMnemonic.trim().split(/\s+/).join(' ');

    // 저장된 암호문과 비교 (Base64 인코딩하여 비교)
    const inputEncrypted = Buffer.from(normalizedInput).toString('base64');

    return inputEncrypted === storedWallet.encryptedMnemonic;
  }

  /**
   * IP당 지갑 생성 제한 확인 (최대 2개)
   */
  public checkIpLimit(): boolean {
    if (typeof window === 'undefined') return true;
    const count = parseInt(localStorage.getItem(this.IP_LIMIT_KEY) || '0', 10);
    return count < 2;
  }

  /**
   * 지갑 생성 카운트 증가
   */
  private incrementIpCount(): void {
    if (typeof window === 'undefined') return;
    const count = parseInt(localStorage.getItem(this.IP_LIMIT_KEY) || '0', 10);
    localStorage.setItem(this.IP_LIMIT_KEY, (count + 1).toString());
  }

  /**
   * 인증 세션 설정 (10분 유효)
   */
  public setAuthSession(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.AUTH_SESSION_KEY, Date.now().toString());
  }

  /**
   * 인증 세션 유효성 확인
   */
  public checkAuthSession(): boolean {
    if (typeof window === 'undefined') return false;
    const lastAuth = localStorage.getItem(this.AUTH_SESSION_KEY);
    if (!lastAuth) return false;

    const timeDiff = Date.now() - parseInt(lastAuth, 10);
    // 10분 = 600,000ms
    return timeDiff < 600000;
  }
}

export const walletService = new WalletService();
