/**
 * BitWishNetwork BW 포인트 채굴 시스템
 * 현재 토큰 이코노미는 완벽한 가상 이코노미입니다.
 * 추후 KYC 시스템 구현과 블록체인 연결 지갑까지 완성하면 
 * KYC 승인 후 실제 BW 토큰이 마이그레이션 되는 방식입니다.
 * 
 * ⚠️ 중요 준수 사항: 전역 모달, 공통 변수 함수 절대 포함하지 않는다
 * ❌ 전역 변수 사용 금지
 * ❌ 공통 함수 사용 금지  
 * ❌ 공통 클래스 사용 금지
 * ❌ 전역 모달 사용 금지
 * ❌ 중복 코드 사용 금지
 * ❌ 다른 컴포넌트와 상태 공유 금지
 * ❌ 전역 상태 관리 라이브러리 사용 금지
 * 
 * ✅ 모든 파일 첫 줄부터 주석에 절대 준수사항 명시 추가
 * ✅ 자체 보안 검증만 사용
 * ✅ 50단위 부동소수점 정밀 계산형식으로 구현 하지만 UI 홈페이지 이미지상 소수즘 8자리만 표기한다. 
 * ✅ BitWish Network 전용 시스템만 사용
 * ✅ 모든 텍스트는 한국어, 영어, 일어, 중국어포함 동남아권 언어 변경 되도록 모든 기능에 완벽하게 구현한다. 
 *        단 절대 복잡하게 파일들을 만들지 않도록한다. 
 * ✅ 마이닝 페이지는 완벽한 독립성 보장과 완벽한 데이터베이스 MongDB 하이브리드 완벽 저장소 구현한다. 
 * ✅ 유저는 1명이든 천만명이든 개인 단독 데이터베이스 MongDB 하이브리드 완벽 저장소를 구현한다.
 */

import { 
  User, 
  MiningRecord, 
  AttendanceRecord, 
  ReferralRecord, 
  PartnerRecord,
  Wallet,
  Transaction,
  Block
} from '@/types';
import { DatabaseSchema } from './DatabaseSchema';

/**
 * 데이터 검증 서비스 클래스 - 완벽한 독립성 보장
 * 자체 보안 검증만 사용, 50자리 부동소수점 정밀 계산
 */
export class DataValidator {
  private validationRules: any;

  constructor() {
    // 절대 준수사항: 전역 변수 사용 금지
    this.validationRules = DatabaseSchema.getValidationRules();
  }

  /**
   * 사용자 데이터 검증
   */
  public validateUser(userData: User): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    try {
      // userId 검증
      if (!userData.userId || !this.isValidUserId(userData.userId)) {
        errors.push('유효하지 않은 사용자 ID입니다');
      }

      // email 검증
      if (!userData.email || !this.isValidEmail(userData.email)) {
        errors.push('유효하지 않은 이메일 주소입니다');
      }

      // password 검증
      if (!userData.password || !this.isValidPassword(userData.password)) {
        errors.push('유효하지 않은 비밀번호입니다');
      }

      // walletAddress 검증
      if (!userData.walletAddress || !this.isValidWalletAddress(userData.walletAddress)) {
        errors.push('유효하지 않은 지갑 주소입니다');
      }

      // kycStatus 검증
      if (userData.kycStatus && !this.isValidKycStatus(userData.kycStatus)) {
        errors.push('유효하지 않은 KYC 상태입니다');
      }

      return {
        isValid: errors.length === 0,
        errors: errors
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`사용자 데이터 검증 오류: ${error}`]
      };
    }
  }

  /**
   * 마이닝 기록 검증
   */
  public validateMiningRecord(miningData: MiningRecord): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    try {
      // id 검증
      if (!miningData.id || !this.isValidId(miningData.id)) {
        errors.push('유효하지 않은 마이닝 기록 ID입니다');
      }

      // userId 검증
      if (!miningData.userId || !this.isValidUserId(miningData.userId)) {
        errors.push('유효하지 않은 사용자 ID입니다');
      }

      // status 검증
      if (!miningData.status || !this.isValidMiningStatus(miningData.status)) {
        errors.push('유효하지 않은 마이닝 상태입니다');
      }

      // startTime 검증
      if (!miningData.startTime || !this.isValidDate(miningData.startTime)) {
        errors.push('유효하지 않은 시작 시간입니다');
      }

      // baseReward 검증
      if (miningData.baseReward === undefined || !this.isValidAmount(miningData.baseReward)) {
        errors.push('유효하지 않은 기본 보상입니다');
      }

      // totalReward 검증
      if (miningData.totalReward === undefined || !this.isValidAmount(miningData.totalReward)) {
        errors.push('유효하지 않은 총 보상입니다');
      }

      return {
        isValid: errors.length === 0,
        errors: errors
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`마이닝 기록 검증 오류: ${error}`]
      };
    }
  }

  /**
   * 출석 기록 검증
   */
  public validateAttendanceRecord(attendanceData: AttendanceRecord): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    try {
      // id 검증
      if (!attendanceData.id || !this.isValidId(attendanceData.id)) {
        errors.push('유효하지 않은 출석 기록 ID입니다');
      }

      // userId 검증
      if (!attendanceData.userId || !this.isValidUserId(attendanceData.userId)) {
        errors.push('유효하지 않은 사용자 ID입니다');
      }

      // date 검증
      if (!attendanceData.date) {
        errors.push('날짜가 없습니다');
      } else {
        const dateObj = new Date(attendanceData.date);
        if (!this.isValidDate(dateObj)) {
          errors.push('유효하지 않은 날짜입니다');
        }
      }

      // checkTime 검증
      if (!attendanceData.checkTime || !this.isValidDate(attendanceData.checkTime)) {
        errors.push('유효하지 않은 체크 시간입니다');
      }

      // bonusRate 검증
      if (attendanceData.bonusRate === undefined || !this.isValidBonusRate(attendanceData.bonusRate)) {
        errors.push('유효하지 않은 보너스 비율입니다');
      }

      // bonusAmount 검증
      if (attendanceData.bonusAmount === undefined || !this.isValidAmount(attendanceData.bonusAmount)) {
        errors.push('유효하지 않은 보너스 금액입니다');
      }

      // status 검증
      if (!attendanceData.status || !this.isValidAttendanceStatus(attendanceData.status)) {
        errors.push('유효하지 않은 출석 상태입니다');
      }

      return {
        isValid: errors.length === 0,
        errors: errors
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`출석 기록 검증 오류: ${error}`]
      };
    }
  }

  /**
   * 추천 기록 검증
   */
  public validateReferralRecord(referralData: ReferralRecord): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    try {
      // id 검증
      if (!referralData.id || !this.isValidId(referralData.id)) {
        errors.push('유효하지 않은 추천 기록 ID입니다');
      }

      // referrerId 검증
      if (!referralData.referrerId || !this.isValidUserId(referralData.referrerId)) {
        errors.push('유효하지 않은 추천인 ID입니다');
      }

      // referredId 검증
      if (!referralData.referredId || !this.isValidUserId(referralData.referredId)) {
        errors.push('유효하지 않은 추천받은 사용자 ID입니다');
      }

      // referralCode 검증
      if (!referralData.referralCode || !this.isValidReferralCode(referralData.referralCode)) {
        errors.push('유효하지 않은 추천 코드입니다');
      }

      // bonusRate 검증
      if (referralData.bonusRate === undefined || !this.isValidBonusRate(referralData.bonusRate)) {
        errors.push('유효하지 않은 보너스 비율입니다');
      }

      // rewardAmount 검증
      if (referralData.rewardAmount === undefined || !this.isValidAmount(referralData.rewardAmount)) {
        errors.push('유효하지 않은 보상 금액입니다');
      }

      // status 검증
      if (!referralData.status || !this.isValidReferralStatus(referralData.status)) {
        errors.push('유효하지 않은 추천 상태입니다');
      }

      return {
        isValid: errors.length === 0,
        errors: errors
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`추천 기록 검증 오류: ${error}`]
      };
    }
  }

  /**
   * 가맹점 기록 검증
   */
  public validatePartnerRecord(partnerData: PartnerRecord): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    try {
      // id 검증
      if (!partnerData.id || !this.isValidId(partnerData.id)) {
        errors.push('유효하지 않은 가맹점 기록 ID입니다');
      }

      // userId 검증
      if (!partnerData.userId || !this.isValidUserId(partnerData.userId)) {
        errors.push('유효하지 않은 사용자 ID입니다');
      }

      // businessName 검증
      if (!partnerData.businessName || !this.isValidBusinessName(partnerData.businessName)) {
        errors.push('유효하지 않은 사업자명입니다');
      }

      // businessLicense 검증
      if (!partnerData.businessLicense || !this.isValidBusinessLicense(partnerData.businessLicense)) {
        errors.push('유효하지 않은 사업자 등록번호입니다');
      }

      // contactInfo 검증
      if (!partnerData.contactInfo || !this.isValidContactInfo(partnerData.contactInfo)) {
        errors.push('유효하지 않은 연락처 정보입니다');
      }

      // status 검증
      if (!partnerData.status || !this.isValidPartnerStatus(partnerData.status)) {
        errors.push('유효하지 않은 가맹점 상태입니다');
      }

      return {
        isValid: errors.length === 0,
        errors: errors
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`가맹점 기록 검증 오류: ${error}`]
      };
    }
  }

  /**
   * 지갑 검증
   */
  public validateWallet(walletData: Wallet): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    try {
      // id 검증
      if (!walletData.id || !this.isValidId(walletData.id)) {
        errors.push('유효하지 않은 지갑 ID입니다');
      }

      // userId 검증
      if (!walletData.userId || !this.isValidUserId(walletData.userId)) {
        errors.push('유효하지 않은 사용자 ID입니다');
      }

      // address 검증
      if (!walletData.address || !this.isValidWalletAddress(walletData.address)) {
        errors.push('유효하지 않은 지갑 주소입니다');
      }

      // privateKey 검증
      if (!walletData.privateKey || !this.isValidPrivateKey(walletData.privateKey)) {
        errors.push('유효하지 않은 개인키입니다');
      }

      // publicKey 검증
      if (!walletData.publicKey || !this.isValidPublicKey(walletData.publicKey)) {
        errors.push('유효하지 않은 공개키입니다');
      }

      // balance 검증
      if (walletData.balance === undefined || !this.isValidAmount(walletData.balance)) {
        errors.push('유효하지 않은 잔액입니다');
      }

      return {
        isValid: errors.length === 0,
        errors: errors
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`지갑 검증 오류: ${error}`]
      };
    }
  }

  /**
   * 거래 검증
   */
  public validateTransaction(transactionData: Transaction): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    try {
      // id 검증
      if (!transactionData.id || !this.isValidId(transactionData.id)) {
        errors.push('유효하지 않은 거래 ID입니다');
      }

      // userId 검증
      if (!transactionData.userId || !this.isValidUserId(transactionData.userId)) {
        errors.push('유효하지 않은 사용자 ID입니다');
      }

      // fromAddress 검증
      if (!transactionData.fromAddress || !this.isValidWalletAddress(transactionData.fromAddress)) {
        errors.push('유효하지 않은 발신 주소입니다');
      }

      // toAddress 검증
      if (!transactionData.toAddress || !this.isValidWalletAddress(transactionData.toAddress)) {
        errors.push('유효하지 않은 수신 주소입니다');
      }

      // amount 검증
      if (transactionData.amount === undefined || !this.isValidAmount(transactionData.amount)) {
        errors.push('유효하지 않은 거래 금액입니다');
      }

      // type 검증
      if (!transactionData.type || !this.isValidTransactionType(transactionData.type)) {
        errors.push('유효하지 않은 거래 유형입니다');
      }

      return {
        isValid: errors.length === 0,
        errors: errors
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`거래 검증 오류: ${error}`]
      };
    }
  }

  /**
   * 블록 검증
   */
  public validateBlock(blockData: Block): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    try {
      // id 검증
      if (!blockData.id || !this.isValidId(blockData.id)) {
        errors.push('유효하지 않은 블록 ID입니다');
      }

      // blockNumber 검증
      if (blockData.blockNumber === undefined || !this.isValidBlockNumber(blockData.blockNumber)) {
        errors.push('유효하지 않은 블록 번호입니다');
      }

      // previousHash 검증
      if (!blockData.previousHash || !this.isValidHash(blockData.previousHash)) {
        errors.push('유효하지 않은 이전 해시입니다');
      }

      // hash 검증
      if (!blockData.hash || !this.isValidHash(blockData.hash)) {
        errors.push('유효하지 않은 블록 해시입니다');
      }

      // merkleRoot 검증
      if (!blockData.merkleRoot || !this.isValidHash(blockData.merkleRoot)) {
        errors.push('유효하지 않은 머클 루트입니다');
      }

      // timestamp 검증
      if (!blockData.timestamp || !this.isValidDate(blockData.timestamp)) {
        errors.push('유효하지 않은 타임스탬프입니다');
      }

      return {
        isValid: errors.length === 0,
        errors: errors
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`블록 검증 오류: ${error}`]
      };
    }
  }

  // 개별 검증 메서드들
  private isValidUserId(userId: string): boolean {
    const rules = this.validationRules.userId;
    return rules.pattern.test(userId) && 
           userId.length >= rules.minLength && 
           userId.length <= rules.maxLength;
  }

  private isValidEmail(email: string): boolean {
    const rules = this.validationRules.email;
    return rules.pattern.test(email);
  }

  private isValidPassword(password: string): boolean {
    const rules = this.validationRules.password;
    return password.length >= rules.minLength && 
           password.length <= rules.maxLength;
  }

  private isValidWalletAddress(address: string): boolean {
    const rules = this.validationRules.walletAddress;
    return rules.pattern.test(address) && address.length === rules.length;
  }

  private isValidKycStatus(status: string): boolean {
    return ['PENDING', 'APPROVED', 'REJECTED'].includes(status);
  }

  private isValidId(id: string): boolean {
    return id.length > 0 && id.length <= 100;
  }

  private isValidMiningStatus(status: string): boolean {
    return ['running', 'stopped', 'paused'].includes(status);
  }

  private isValidDate(date: Date): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }

  private isValidAmount(amount: number): boolean {
    const rules = this.validationRules.amount;
    return typeof amount === 'number' && 
           amount >= rules.min && 
           amount <= rules.max;
  }

  private isValidBonusRate(rate: number): boolean {
    return typeof rate === 'number' && rate >= 0 && rate <= 1;
  }

  private isValidAttendanceStatus(status: string): boolean {
    return ['AVAILABLE', 'COMPLETED', 'EXPIRED', 'FUTURE'].includes(status);
  }

  private isValidReferralCode(code: string): boolean {
    return code.length >= 8 && code.length <= 20;
  }

  private isValidReferralStatus(status: string): boolean {
    return ['ACTIVE', 'INACTIVE', 'EXPIRED'].includes(status);
  }

  private isValidBusinessName(name: string): boolean {
    return name.length >= 2 && name.length <= 100;
  }

  private isValidBusinessLicense(license: string): boolean {
    const rules = this.validationRules.businessLicense;
    return rules.pattern.test(license) && 
           license.length >= rules.minLength && 
           license.length <= rules.maxLength;
  }

  private isValidContactInfo(contactInfo: any): boolean {
    return contactInfo && 
           contactInfo.phone && 
           contactInfo.email && 
           contactInfo.address;
  }

  private isValidPartnerStatus(status: string): boolean {
    return ['PENDING', 'APPROVED', 'REJECTED'].includes(status);
  }

  private isValidPrivateKey(key: string): boolean {
    return key.length === 64;
  }

  private isValidPublicKey(key: string): boolean {
    return key.length === 130;
  }

  private isValidTransactionType(type: string): boolean {
    return ['MINING', 'BONUS', 'TRANSFER', 'REFERRAL', 'PARTNER'].includes(type);
  }

  private isValidBlockNumber(number: number): boolean {
    return typeof number === 'number' && number >= 0;
  }

  private isValidHash(hash: string): boolean {
    return hash.length === 64;
  }
}
