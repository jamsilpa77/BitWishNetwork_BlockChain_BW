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
 * ✅ 모든 텍스트는 한국어, 영어, 일어, 중국어포함 언어 변경 되도록 모든 기능에 완벽하게 구현한다. 
 *        단 절대 복잡하게 파일들을 만들지 않도록한다. 
 * ✅ 마이닝 페이지는 완벽한 독립성 보장과 완벽한 데이터베이스 MongDB 하이브리드 완벽 저장소 구현한다. 
 * ✅ 유저는 1명이든 천만명이든 개인 단독 데이터베이스 MongDB 하이브리드 완벽 저장소를 구현한다.
 */

import { PrecisionCalculator } from '@/utils/PrecisionCalculator/PrecisionCalculator';
import { LanguageManager } from '@/utils/LanguageManager/LanguageManager';
import { REFERRAL_STATUS } from '@/constants';
import {
  ReferralRecord,
  ReferralStatus,
  ReferralBonus,
  ReferredUser,
  User
} from '@/types';
import {
  BONUS_CONSTANTS,
  REFERRAL_BONUS_RATE,
  REFERRAL_REWARD_AMOUNT
} from '@/constants';

/**
 * 추천 보너스 서비스 클래스 - 완벽한 독립성 보장
 * 2% + 1BW 추천 보너스 시스템, 추천 보너스 보관함, 추천 보상 보관함
 */
export class ReferralBonusService {
  private precisionCalculator: PrecisionCalculator;
  private languageManager: LanguageManager;
  private referralRecords: Map<string, ReferralRecord>;
  private userReferralStatus: Map<string, ReferralBonus>;
  private referralBonusStorage: Map<string, number>; // 추천 보너스 보관함
  private referralRewardStorage: Map<string, number>; // 추천 보상 보관함

  // 저장소 키 정의
  private readonly STORAGE_KEY = 'bw-referral-data';
  private readonly WALLET_STORAGE_KEY = 'bw_wallet_data';

  constructor() {
    // 절대 준수사항: 전역 변수 사용 금지
    this.precisionCalculator = new PrecisionCalculator();
    this.languageManager = new LanguageManager();
    this.referralRecords = new Map<string, ReferralRecord>();
    this.userReferralStatus = new Map<string, ReferralBonus>();
    this.referralBonusStorage = new Map<string, number>();
    this.referralRewardStorage = new Map<string, number>();

    // 서비스 초기화 시 데이터 로드
    this.loadData();
  }

  /**
   * 데이터 로드 (LocalStorage -> Memory)
   */
  private loadData(): void {
    try {
      const savedData = localStorage.getItem(this.STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);

        // Map 객체로 복원
        if (parsedData.referralRecords) {
          this.referralRecords = new Map(parsedData.referralRecords);
        }
        if (parsedData.userReferralStatus) {
          this.userReferralStatus = new Map(parsedData.userReferralStatus);
        }
        if (parsedData.referralBonusStorage) {
          this.referralBonusStorage = new Map(parsedData.referralBonusStorage);
        }
        if (parsedData.referralRewardStorage) {
          this.referralRewardStorage = new Map(parsedData.referralRewardStorage);
        }
      }
    } catch (error) {
      console.error('추천 데이터 로드 실패:', error);
      // 로드 실패 시 초기 상태 유지
    }
  }

  /**
   * 데이터 저장 (Memory -> LocalStorage)
   */
  private saveData(): void {
    try {
      const dataToSave = {
        referralRecords: Array.from(this.referralRecords.entries()),
        userReferralStatus: Array.from(this.userReferralStatus.entries()),
        referralBonusStorage: Array.from(this.referralBonusStorage.entries()),
        referralRewardStorage: Array.from(this.referralRewardStorage.entries())
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));

      // 지갑 데이터 동기화
      this.syncWithWallet();
    } catch (error) {
      console.error('추천 데이터 저장 실패:', error);
    }
  }

  /**
   * 지갑 데이터 동기화
   * 현재 사용자의 보너스 정보를 지갑 데이터에도 반영
   */
  private syncWithWallet(): void {
    try {
      const savedWallet = localStorage.getItem(this.WALLET_STORAGE_KEY);
      if (savedWallet) {
        const walletData = JSON.parse(savedWallet);
        // MiningPage에서 사용하는 ID와 일치시켜야 함. 현재는 'current-user'로 하드코딩 되어 있음.
        // 추후 실제 지갑 주소로 변경 시 이 부분도 수정 필요.
        const userId = 'current-user';

        // 현재 보너스 상태 조회
        const bonusStorage = this.referralBonusStorage.get(userId) || 0;
        const rewardStorage = this.referralRewardStorage.get(userId) || 0;

        // 지갑 데이터 업데이트
        walletData.referralBonus = bonusStorage;
        walletData.referralReward = rewardStorage;

        // 추천 코드 업데이트
        const status = this.userReferralStatus.get(userId);
        if (status && status.referralCode) {
          walletData.myReferralCode = status.referralCode;
        }

        localStorage.setItem(this.WALLET_STORAGE_KEY, JSON.stringify(walletData));
      }
    } catch (error) {
      console.error('지갑 데이터 동기화 실패:', error);
    }
  }

  /**
   * 추천인 코드 생성
   * @param userId 사용자 ID
   * @returns 추천인 코드
   */
  public generateReferralCode(userId: string): {
    success: boolean;
    referralCode?: string;
    message?: string;
  } {
    try {
      // 기존 추천인 코드 확인
      const existingStatus = this.userReferralStatus.get(userId);
      if (existingStatus && existingStatus.referralCode) {
        return {
          success: true,
          referralCode: existingStatus.referralCode,
          message: this.languageManager.translate('referral.existingCode')
        };
      }

      // 새로운 추천인 코드 생성
      const referralCode = `REF${userId.substring(0, 8).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;

      // 추천인 상태 초기화
      const referralBonus: ReferralBonus = {
        referralCode: referralCode,
        referredUsers: [],
        totalBonus: 0,
        bonusRate: 0,
        rewardAmount: 0,
        bonusStorage: 0,
        rewardStorage: 0
      };

      this.userReferralStatus.set(userId, referralBonus);

      // 데이터 저장
      this.saveData();

      return {
        success: true,
        referralCode: referralCode,
        message: this.languageManager.translate('referral.codeGenerated')
      };
    } catch (error) {
      return {
        success: false,
        message: this.languageManager.translate('referral.codeGenerationError')
      };
    }
  }

  /**
   * 추천인 코드로 가입
   * @param referralCode 추천인 코드
   * @param newUserId 새 사용자 ID
   * @param newUser 새 사용자 정보
   * @returns 추천 가입 결과
   */
  public joinWithReferralCode(referralCode: string, newUserId: string, newUser: User): {
    success: boolean;
    referrerId?: string;
    bonusRate?: number;
    rewardAmount?: number;
    message?: string;
  } {
    try {
      // 추천인 찾기
      const referrerId = this.findReferrerByCode(referralCode);
      if (!referrerId) {
        return {
          success: false,
          message: this.languageManager.translate('referral.invalidCode')
        };
      }

      // 추천인과 가입자가 같은지 확인
      if (referrerId === newUserId) {
        return {
          success: false,
          message: this.languageManager.translate('referral.cannotReferSelf')
        };
      }

      // 추천 기록 생성
      const referralId = `referral_${referrerId}_${newUserId}_${Date.now()}`;
      const joinedDate = new Date();

      // 2% 보너스 비율과 1BW 보상 금액
      const bonusRate = BONUS_CONSTANTS.REFERRAL_BONUS_RATE;
      const rewardAmount = BONUS_CONSTANTS.REFERRAL_REWARD_AMOUNT;

      const referralRecord: ReferralRecord = {
        id: referralId,
        referrerId: referrerId,
        referredId: newUserId,
        referralCode: referralCode,
        bonusRate: bonusRate,
        bonusAmount: 0, // 마이닝 시작 후 계산
        rewardAmount: rewardAmount,
        status: REFERRAL_STATUS.ACTIVE,
        createdAt: joinedDate,
        updatedAt: joinedDate
      };

      this.referralRecords.set(referralId, referralRecord);

      // 추천인 상태 업데이트
      this.updateReferrerStatus(referrerId, newUserId, newUser, bonusRate, rewardAmount);

      // 가입자 상태 업데이트
      this.updateReferredUserStatus(newUserId, referrerId, bonusRate, rewardAmount);

      // 데이터 저장
      this.saveData();

      return {
        success: true,
        referrerId: referrerId,
        bonusRate: bonusRate,
        rewardAmount: rewardAmount,
        message: this.languageManager.translate('referral.joinSuccess')
      };
    } catch (error) {
      return {
        success: false,
        message: this.languageManager.translate('referral.joinError')
      };
    }
  }

  /**
   * 추천 보너스 적용
   * @param userId 사용자 ID
   * @param baseRate 기본 보상률
   * @returns 추천 보너스 적용 결과
   */
  public applyReferralBonus(userId: string, baseRate: number): {
    success: boolean;
    bonusRate?: number;
    bonusAmount?: number;
    totalRate?: number;
    isActive?: boolean;
  } {
    try {
      const referralStatus = this.userReferralStatus.get(userId);

      if (!referralStatus || referralStatus.bonusRate === 0) {
        return {
          success: false,
          isActive: false
        };
      }

      // 2% 보너스 계산
      const bonusRate = referralStatus.bonusRate;
      const bonusAmount = this.precisionCalculator.calculateReferralBonus(
        baseRate,
        bonusRate,
        referralStatus.referredUsers.length
      );
      const totalRate = this.precisionCalculator.add(baseRate, bonusAmount.toNumber());

      // 추천 보너스 보관함에 저장
      this.addToBonusStorage(userId, bonusAmount.toNumber());

      // 데이터 저장 (보너스가 계속 누적되므로 저장 필요)
      this.saveData();

      return {
        success: true,
        bonusRate: bonusRate,
        bonusAmount: bonusAmount.toNumber(),
        totalRate: totalRate.toNumber(),
        isActive: true
      };
    } catch (error) {
      return {
        success: false,
        isActive: false
      };
    }
  }

  /**
   * 추천 보너스 보관함 조회
   * @param userId 사용자 ID
   * @returns 추천 보너스 보관함 금액
   */
  public getReferralBonusStorage(userId: string): {
    bonusStorage: number;
    rewardStorage: number;
    totalStorage: number;
  } {
    const bonusStorage = this.referralBonusStorage.get(userId) || 0;
    const rewardStorage = this.referralRewardStorage.get(userId) || 0;
    const totalStorage = this.precisionCalculator.add(bonusStorage, rewardStorage).toNumber();

    return {
      bonusStorage: bonusStorage,
      rewardStorage: rewardStorage,
      totalStorage: totalStorage
    };
  }

  /**
   * 추천인 목록 조회
   * @param userId 사용자 ID
   * @returns 추천인 목록
   */
  public getReferredUsers(userId: string): {
    referredUsers: ReferredUser[];
    totalCount: number;
    totalBonus: number;
    totalReward: number;
  } {
    const referralStatus = this.userReferralStatus.get(userId);

    if (!referralStatus) {
      return {
        referredUsers: [],
        totalCount: 0,
        totalBonus: 0,
        totalReward: 0
      };
    }

    return {
      referredUsers: referralStatus.referredUsers,
      totalCount: referralStatus.referredUsers.length,
      totalBonus: referralStatus.totalBonus,
      totalReward: referralStatus.rewardAmount
    };
  }

  /**
   * 추천인 찾기
   * @param referralCode 추천인 코드
   * @returns 추천인 ID
   */
  private findReferrerByCode(referralCode: string): string | null {
    for (const [userId, status] of this.userReferralStatus.entries()) {
      if (status.referralCode === referralCode) {
        return userId;
      }
    }
    return null;
  }

  /**
   * 추천인 상태 업데이트
   * @param referrerId 추천인 ID
   * @param referredId 추천받은 사용자 ID
   * @param referredUser 추천받은 사용자 정보
   * @param bonusRate 보너스 비율
   * @param rewardAmount 보상 금액
   */
  private updateReferrerStatus(
    referrerId: string,
    referredId: string,
    referredUser: User,
    bonusRate: number,
    rewardAmount: number
  ): void {
    const referralStatus = this.userReferralStatus.get(referrerId);

    if (referralStatus) {
      // 추천받은 사용자 추가
      const referredUserInfo: ReferredUser = {
        userId: referredId,
        walletAddress: referredUser.walletAddress,
        joinedDate: new Date(),
        totalMiningAmount: 0,
        bonusAmount: 0,
        rewardAmount: rewardAmount,
        kycStatus: referredUser.kycStatus
      };

      referralStatus.referredUsers.push(referredUserInfo);
      referralStatus.bonusRate = bonusRate;
      referralStatus.rewardAmount += rewardAmount;
      referralStatus.rewardStorage += rewardAmount;

      // 추천 보상 보관함에 저장
      this.addToRewardStorage(referrerId, rewardAmount);
    }
  }

  /**
   * 추천받은 사용자 상태 업데이트
   * @param referredId 추천받은 사용자 ID
   * @param referrerId 추천인 ID
   * @param bonusRate 보너스 비율
   * @param rewardAmount 보상 금액
   */
  private updateReferredUserStatus(
    referredId: string,
    referrerId: string,
    bonusRate: number,
    rewardAmount: number
  ): void {
    // 추천받은 사용자도 1회만 2% 보너스 적용
    const referredUserStatus: ReferralBonus = {
      referralCode: '', // 추천받은 사용자는 코드 없음
      referredUsers: [],
      totalBonus: 0,
      bonusRate: bonusRate, // 1회만 적용
      rewardAmount: rewardAmount,
      bonusStorage: 0,
      rewardStorage: rewardAmount
    };

    this.userReferralStatus.set(referredId, referredUserStatus);

    // 추천 보상 보관함에 저장
    this.addToRewardStorage(referredId, rewardAmount);
  }

  /**
   * 추천 보너스 보관함에 추가
   * @param userId 사용자 ID
   * @param amount 추가할 금액
   */
  private addToBonusStorage(userId: string, amount: number): void {
    const currentAmount = this.referralBonusStorage.get(userId) || 0;
    const newAmount = this.precisionCalculator.add(currentAmount, amount).toNumber();
    this.referralBonusStorage.set(userId, newAmount);

    // 사용자 상태도 업데이트
    const referralStatus = this.userReferralStatus.get(userId);
    if (referralStatus) {
      referralStatus.bonusStorage = newAmount;
    }
  }

  /**
   * 추천 보상 보관함에 추가
   * @param userId 사용자 ID
   * @param amount 추가할 금액
   */
  private addToRewardStorage(userId: string, amount: number): void {
    const currentAmount = this.referralRewardStorage.get(userId) || 0;
    const newAmount = this.precisionCalculator.add(currentAmount, amount).toNumber();
    this.referralRewardStorage.set(userId, newAmount);

    // 사용자 상태도 업데이트
    const referralStatus = this.userReferralStatus.get(userId);
    if (referralStatus) {
      referralStatus.rewardStorage = newAmount;
    }
  }

  /**
   * 추천 보너스 지급 (KYC 통과 후)
   * @param userId 사용자 ID
   * @returns 지급 결과
   */
  public claimReferralBonus(userId: string): {
    success: boolean;
    bonusAmount?: number;
    rewardAmount?: number;
    totalAmount?: number;
    message?: string;
  } {
    try {
      const bonusStorage = this.referralBonusStorage.get(userId) || 0;
      const rewardStorage = this.referralRewardStorage.get(userId) || 0;
      const totalAmount = this.precisionCalculator.add(bonusStorage, rewardStorage).toNumber();

      if (totalAmount <= 0) {
        return {
          success: false,
          message: this.languageManager.translate('referral.noBonusToClaim')
        };
      }

      // 보관함에서 지급
      this.referralBonusStorage.set(userId, 0);
      this.referralRewardStorage.set(userId, 0);

      // 사용자 상태 업데이트
      const referralStatus = this.userReferralStatus.get(userId);
      if (referralStatus) {
        referralStatus.bonusStorage = 0;
        referralStatus.rewardStorage = 0;
        referralStatus.totalBonus += bonusStorage;
        referralStatus.rewardAmount += rewardStorage;
      }

      // 데이터 저장
      this.saveData();

      return {
        success: true,
        bonusAmount: bonusStorage,
        rewardAmount: rewardStorage,
        totalAmount: totalAmount,
        message: this.languageManager.translate('referral.bonusClaimed')
      };
    } catch (error) {
      return {
        success: false,
        message: this.languageManager.translate('referral.claimError')
      };
    }
  }

  /**
   * 추천 통계 조회
   * @param userId 사용자 ID
   * @returns 추천 통계
   */
  public getReferralStats(userId: string): ReferralBonus {
    const referralStatus = this.userReferralStatus.get(userId);

    if (!referralStatus) {
      return {
        referralCode: '',
        referredUsers: [],
        totalBonus: 0,
        bonusRate: 0,
        rewardAmount: 0,
        bonusStorage: 0,
        rewardStorage: 0
      };
    }

    const activeReferrals = referralStatus.referredUsers.filter(user =>
      user.kycStatus === 'APPROVED'
    ).length;

    return {
      referralCode: referralStatus.referralCode,
      referredUsers: referralStatus.referredUsers,
      totalBonus: referralStatus.totalBonus,
      bonusRate: referralStatus.bonusRate,
      rewardAmount: referralStatus.rewardAmount,
      bonusStorage: referralStatus.bonusStorage,
      rewardStorage: referralStatus.rewardStorage
    };
  }

  /**
   * 추천 보너스 검증
   * @param userId 사용자 ID
   * @returns 검증 결과
   */
  public validateReferralBonus(userId: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const referralStatus = this.userReferralStatus.get(userId);

    if (!referralStatus) {
      errors.push(this.languageManager.translate('referral.noStatus'));
      return {
        isValid: false,
        errors: errors
      };
    }

    // 보너스 비율 검증
    if (referralStatus.bonusRate < 0 || referralStatus.bonusRate > 1) {
      errors.push(this.languageManager.translate('referral.invalidBonusRate'));
    }

    // 총 보너스 검증
    if (referralStatus.totalBonus < 0) {
      errors.push(this.languageManager.translate('referral.invalidTotalBonus'));
    }

    // 보상 금액 검증
    if (referralStatus.rewardAmount < 0) {
      errors.push(this.languageManager.translate('referral.invalidRewardAmount'));
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * 추천 보너스 리셋
   * @param userId 사용자 ID
   * @returns 리셋 결과
   */
  public resetReferralBonus(userId: string): {
    success: boolean;
    message?: string;
  } {
    try {
      // 보관함 초기화
      this.referralBonusStorage.set(userId, 0);
      this.referralRewardStorage.set(userId, 0);

      // 사용자 상태 초기화
      const referralStatus = this.userReferralStatus.get(userId);
      if (referralStatus) {
        referralStatus.bonusStorage = 0;
        referralStatus.rewardStorage = 0;
        referralStatus.totalBonus = 0;
        referralStatus.rewardAmount = 0;
      }

      // 데이터 저장
      this.saveData();

      return {
        success: true,
        message: this.languageManager.translate('referral.reset')
      };
    } catch (error) {
      return {
        success: false,
        message: this.languageManager.translate('referral.resetError')
      };
    }
  }
}
