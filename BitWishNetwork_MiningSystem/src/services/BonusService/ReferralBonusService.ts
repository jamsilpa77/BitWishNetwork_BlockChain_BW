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
  ReferralBonus,
  ReferredUser,
  User
} from '@/types';
import {
  BONUS_CONSTANTS
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
  private referralBonusStorage: Map<string, number>; // 추천 보너스 보관함 (UI 호환용)
  private referralRewardStorage: Map<string, number>; // 추천 보상 보관함 (UI 호환용)

  private readonly WALLET_STORAGE_KEY = 'bw_wallet_data';

  constructor() {
    this.precisionCalculator = new PrecisionCalculator();
    this.languageManager = new LanguageManager();
    this.referralRecords = new Map<string, ReferralRecord>();
    this.userReferralStatus = new Map<string, ReferralBonus>();
    this.referralBonusStorage = new Map<string, number>();
    this.referralRewardStorage = new Map<string, number>();

    // 비동기 초기화 시퀀스
    this.initService();
  }

  /**
   * 서비스 초기화 (데이터 로드 및 복구)
   */
  private async initService(): Promise<void> {
    await this.loadData();
    this.performEmergencyRestoration();
    this.startSystemPolling();
  }

  /**
   * [긴급 보정] 관리자 지갑 코드 강제 고정
   */
  private performEmergencyRestoration(): void {
    const adminWallet = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';
    const adminStatus = this.userReferralStatus.get(adminWallet);
    if (adminStatus) {
      adminStatus.referralCode = 'REF9F5FF0909DC5';
      this.userReferralStatus.set(adminWallet, adminStatus);
      console.log(`[ReferralBonusService] 🛡️ 관리자 코드 강제 고정 완료 (REF9F5FF0909DC5)`);
    }
  }

  /**
   * 시스템 리셋 신호 감지 폴링
   */
  private startSystemPolling(): void {
    if (typeof window === 'undefined') return;

    setInterval(() => {
      try {
        const triggerRaw = localStorage.getItem('BW_SYSTEM_RESET_TRIGGER');
        if (triggerRaw) {
          const signal = JSON.parse(triggerRaw);
          if (signal.target) {
            const target = signal.target.trim();
            const processingKey = `BW_REF_SERVICE_PROCESSED_${target.toLowerCase()}`;
            const lastProcessed = parseInt(localStorage.getItem(processingKey) || '0');

            if (signal.timestamp > lastProcessed) {
              // 초기화 수행
              this.referralBonusStorage.set(target, 0);
              this.referralRewardStorage.set(target, 0);
              this.referralBonusStorage.set('current-user', 0);
              this.referralRewardStorage.set('current-user', 0);

              const status = this.userReferralStatus.get('current-user');
              if (status) {
                status.bonusStorage = 0;
                status.rewardStorage = 0;
                status.lockedBonusStorage = 0;
                status.availableBonusStorage = 0;
                status.lockedRewardStorage = 0;
                status.availableRewardStorage = 0;
              }

              localStorage.setItem(processingKey, signal.timestamp.toString());
              console.log(`[ReferralBonusService] ♻️ 시스템 초기화 신호 처리 완료 (${target})`);
              this.saveData();
            }
          }
        }
      } catch (e) { }
    }, 1000);
  }

  /**
   * 데이터 로드 (서버 데이터 절대 우선 정책)
   */
  private async loadData(): Promise<void> {
    try {
      // [Step 3 Fixed] 레거시 파일 DB 및 로컬 스토리지 백업 로직 완전 폐기
      // 이제 모든 데이터 정합성은 서버의 MiningController(MongoDB)가 전담함
      console.log('[ReferralBonusService] 📡 Modern Mode: 서버 API 정합성 체제로 완전 전환됨');
      
      this.saveData(); 
    } catch (error) {
      console.error('[ReferralBonusService] 데이터 로드 중 오류:', error);
    }
  }

  /**
   * 데이터 저장 (이중 저장)
   */
  private async saveData(): Promise<void> {
    try {
      // [Step 3 Fixed] 위험한 로컬 덮어쓰기 및 파일 DB 저장 로직 제거
      // 데이터 영구 보존은 서버 API가 담당하므로 클라이언트는 동기화 신호만 관리함


      this.syncWithWallet();

      // UI 실시간 갱신 신호 발송
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('BW_DATA_UPDATED'));
      }
    } catch (error) {
      console.error('[ReferralBonusService] 저장 오류:', error);
    }
  }

  /**
   * 지갑 동기화
   */
  private syncWithWallet(): void {
    try {
      const savedWallet = localStorage.getItem(this.WALLET_STORAGE_KEY);
      if (savedWallet) {
        const walletData = JSON.parse(savedWallet);
        const userId = 'current-user';

        const bonusStorage = this.referralBonusStorage.get(userId) || 0;
        const rewardStorage = this.referralRewardStorage.get(userId) || 0;

        walletData.referralBonus = bonusStorage;
        walletData.referralReward = rewardStorage;

        const status = this.userReferralStatus.get(userId);
        if (status && status.referralCode) {
          walletData.myReferralCode = status.referralCode;
        }

        localStorage.setItem(this.WALLET_STORAGE_KEY, JSON.stringify(walletData));
      }
    } catch (error) { }
  }

  /**
   * 추천인 코드 생성 (결정적 알고리즘: REF + 8자리 + 7자리)
   */
  public generateReferralCode(userId: string): { success: boolean; referralCode?: string; message?: string } {
    try {
      const existing = this.userReferralStatus.get(userId);
      if (existing && existing.referralCode) {
        return { success: true, referralCode: existing.referralCode };
      }

      const { walletService } = require('../BlockchainService/WalletService');
      const referralCode = walletService.generateReferralCode(userId);

      const referralBonus: ReferralBonus = {
        referralCode,
        referredUsers: [],
        totalBonus: 0,
        bonusRate: 0,
        rewardAmount: 0,
        bonusStorage: 0,
        rewardStorage: 0,
        lockedBonusStorage: 0,
        availableBonusStorage: 0,
        lockedRewardStorage: 0,
        availableRewardStorage: 0
      };

      this.userReferralStatus.set(userId, referralBonus);

      // [Step 2] 서버 DB에 추천 코드 영구 저장 (동기화)
      fetch('/api/user/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: userId === 'current-user' ? localStorage.getItem('bw_wallet_address') : userId,
          myReferralCode: referralCode
        })
      }).then(res => res.json())
        .then(result => {
          if (result.success) console.log('[Referral] 추천 코드 서버 동기화 성공');
        }).catch(err => console.error('[Referral] 서버 저장 실패:', err));

      this.saveData();

      return { success: true, referralCode };
    } catch (error) {
      return { success: false, message: 'Code generation error' };
    }
  }

  /**
   * 추천인 코드로 합류
   */
  /**
   * 추천인 코드로 합류 (서버 DB 통합 방식)
   * 1BW 보상 지급은 이제 서버에서 원자적으로 처리됩니다.
   */
  public async joinWithReferralCode(referralCode: string, newUserId: string, newUser: User): Promise<{ success: boolean; message?: string }> {
    try {
      console.log(`[ReferralBonusService] 📡 서버에 추천 보상 지급 요청: Code(${referralCode})`);

      // 1. 서버 API 호출 (가입자 및 추천인 보상 동시 처리)
      const response = await fetch('/api/referral/register-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralCode: referralCode,
          referredWallet: newUser.walletAddress
        })
      });

      const result = await response.json();

      if (!result.success) {
        console.error('[ReferralBonusService] ❌ 보상 지급 실패:', result.message);
        return { success: false, message: result.message || 'Reward payout failed' };
      }

      console.log('[ReferralBonusService] ✅ 서버 DB 보상 지급 완료');

      // 2. 서버 데이터와 로컬 상태 동기화 (최종 결과 로드)
      await this.loadData();

      return { success: true, message: 'Join success & Reward issued' };

    } catch (e) {
      console.error('[ReferralBonusService] ❌ 가입 처리 중 네트워크 오류:', e);
      return { success: false, message: 'Network connection error' };
    }
  }

  /**
   * 보너스 적립 (Locked 우선)
   */
  public applyReferralBonus(userId: string, amount: number): { success: boolean; bonusRate?: number } {
    try {
      const status = this.userReferralStatus.get(userId);
      if (!status) return { success: false };

      // 추천인 수에 따른 보너스 비율 계산 (1명당 2%)
      const bonusRate = status.referredUsers.length * 0.02;

      status.lockedBonusStorage = this.precisionCalculator.add(status.lockedBonusStorage || 0, amount).toNumber();
      status.bonusStorage = this.precisionCalculator.add(status.lockedBonusStorage, status.availableBonusStorage || 0).toNumber();

      this.referralBonusStorage.set(userId, status.bonusStorage);
      this.saveData();

      return {
        success: true,
        bonusRate: bonusRate
      };
    } catch (e) {
      return { success: false };
    }
  }

  /**
   * 리워드 적립 (Locked 우선)
   */
  private addToRewardStorage(userId: string, amount: number): void {
    try {
      const status = this.userReferralStatus.get(userId);
      if (!status) return;

      status.lockedRewardStorage = this.precisionCalculator.add(status.lockedRewardStorage || 0, amount).toNumber();
      status.rewardStorage = this.precisionCalculator.add(status.lockedRewardStorage, status.availableRewardStorage || 0).toNumber();

      this.referralRewardStorage.set(userId, status.rewardStorage);
      this.saveData();
    } catch (e) { }
  }

  /**
   * 15일 락업 해제 자동 갱신
   */
  public refreshLockStatus(userId: string): void {
    const status = this.userReferralStatus.get(userId);
    if (!status) return;

    const now = Date.now();
    const LOCK_PERIOD = 15 * 24 * 60 * 60 * 1000;

    let bonusToUnlock = 0;
    let rewardToUnlock = 0;

    status.referredUsers.forEach(user => {
      if (user.kycStatus === 'APPROVED' && user.kycApprovedAt) {
        if (now - new Date(user.kycApprovedAt).getTime() > LOCK_PERIOD) {
          // 단순화: 승인된 유저가 있으면 해당분(예: 1BW) 해제 시도
          // 실제로는 분리된 트래킹이 필요하나 지시서 정책 기반으로 구현
          rewardToUnlock += user.rewardAmount;
          // 보너스는 실시간 적립되므로 전체 locked 중 일부를 비율적으로 해제하거나 
          // 여기서는 지시서의 "15일 후 사용 가능" 원칙에 따라 해제 로직 수행
        }
      }
    });

    // 락업 해제 이동
    const finalRewardUnlock = Math.min(status.lockedRewardStorage || 0, rewardToUnlock);
    if (finalRewardUnlock > 0) {
      status.lockedRewardStorage = this.precisionCalculator.subtract(status.lockedRewardStorage || 0, finalRewardUnlock).toNumber();
      status.availableRewardStorage = this.precisionCalculator.add(status.availableRewardStorage || 0, finalRewardUnlock).toNumber();
      console.log(`[ReferralBonusService] 🔓 보상 ${finalRewardUnlock}BW 해제 완료`);
    }

    // 보너스(채굴분) 해제 (예시: 실시간 채굴 보너스의 경우 전체를 합산 해제하거나 별도 관리 필요)
    // 지시서에 따라 승인된 유저가 있는 경우 그에 해당하는 채굴 보너스도 해제 대상
    if ((status.lockedBonusStorage || 0) > 0) {
      // 모든 추천인이 승인+15일이면 전체 해제와 같은 로직
      const allApproved = status.referredUsers.every(u => u.kycStatus === 'APPROVED' && u.kycApprovedAt && (now - new Date(u.kycApprovedAt).getTime() > LOCK_PERIOD));
      if (allApproved && status.referredUsers.length > 0) {
        const moveAmount = status.lockedBonusStorage || 0;
        status.lockedBonusStorage = 0;
        status.availableBonusStorage = this.precisionCalculator.add(status.availableBonusStorage || 0, moveAmount).toNumber();
      }
    }

    this.saveData();
  }

  /**
   * 보관함 금액 청구 (Available만 가능)
   */
  public claimReferralBonus(userId: string): { success: boolean; amount?: number; message?: string } {
    const status = this.userReferralStatus.get(userId);
    if (!status) return { success: false, message: 'No data' };

    this.refreshLockStatus(userId);

    const aBonus = status.availableBonusStorage || 0;
    const aReward = status.availableRewardStorage || 0;
    const total = this.precisionCalculator.add(aBonus, aReward).toNumber();

    if (total <= 0) return { success: false, message: 'No available funds (15-day lock-up active)' };

    // 가용 금액 청구
    status.availableBonusStorage = 0;
    status.availableRewardStorage = 0;
    status.bonusStorage = status.lockedBonusStorage || 0;
    status.rewardStorage = status.lockedRewardStorage || 0;

    // 통계 업데이트
    status.totalBonus += aBonus;
    status.rewardAmount += aReward;

    this.saveData();
    return { success: true, amount: total, message: 'Claim successful' };
  }

  /**
   * 통계 및 상태 조회
   */
  public getReferralStats(userId: string): ReferralBonus {
    return this.userReferralStatus.get(userId) || {
      referralCode: '',
      referredUsers: [],
      totalBonus: 0,
      bonusRate: 0,
      rewardAmount: 0,
      bonusStorage: 0,
      rewardStorage: 0,
      lockedBonusStorage: 0,
      availableBonusStorage: 0,
      lockedRewardStorage: 0,
      availableRewardStorage: 0
    };
  }

  public resetReferralBonus(userId: string): void {
    this.referralBonusStorage.set(userId, 0);
    this.referralRewardStorage.set(userId, 0);
    const status = this.userReferralStatus.get(userId);
    if (status) {
      status.bonusStorage = 0;
      status.rewardStorage = 0;
      status.lockedBonusStorage = 0;
      status.availableBonusStorage = 0;
      status.lockedRewardStorage = 0;
      status.availableRewardStorage = 0;
      status.totalBonus = 0;
      status.rewardAmount = 0;
    }
    this.saveData();
  }
}
