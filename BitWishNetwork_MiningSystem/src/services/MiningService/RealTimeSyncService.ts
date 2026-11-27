/**
 * BitWishNetwork BW 포인트 채굴 시스템
 * RealTimeSyncService.ts
 * 
 * ⚠️ 중요 준수 사항:
 * 1. 서버와의 실시간 데이터 동기화 (30초 간격)
 * 2. 가짜 데이터(Math.random) 완전 제거
 * 3. 서버 시간 기준의 정확한 채굴량 계산
 * 4. 리셋 방지를 위한 영구 저장소 연동
 */

import { PrecisionCalculator } from '@/utils/PrecisionCalculator/PrecisionCalculator';
import { apiService } from '@/services/ApiService';
import { Decimal } from 'decimal.js';
import {
  RealTimeMiningStatus,
  NetworkStatus
} from '@/types';
import {
  MINING_CONSTANTS,
  NETWORK_STATUS,
  AUTO_REFRESH_INTERVAL
} from '@/constants';

export class RealTimeSyncService {
  private static instance: RealTimeSyncService;
  private precisionCalculator: PrecisionCalculator;
  private realTimeStatus: RealTimeMiningStatus;
  private syncInterval: NodeJS.Timeout | null;
  private miningTicker: NodeJS.Timeout | null = null; // [신규] 배경 채굴 계산기
  private isRunning: boolean;
  private currentBaseRate: Decimal = new Decimal(0); // [신규] 초당 증가량 계산용 기본율
  private lastSyncTime: Date;
  private walletAddress: string | null;
  private syncCount: number;
  private uninstalledDetectionCount: number = 0; // [공정 5] Crawl-Back Guard 오판 방지 유예 버퍼 카운터 (3회 연속 미감지 시에만 회수)
  private subscribers: Array<(status: RealTimeMiningStatus) => void> = [];

  constructor() {
    this.precisionCalculator = new PrecisionCalculator();
    this.realTimeStatus = this.initializeRealTimeStatus();
    this.syncInterval = null;
    this.isRunning = false;
    this.lastSyncTime = new Date();
    this.walletAddress = null;
    this.syncCount = 0;
  }

  public static getInstance(): RealTimeSyncService {
    if (!RealTimeSyncService.instance) {
      RealTimeSyncService.instance = new RealTimeSyncService();
    }
    return RealTimeSyncService.instance;
  }

  private initializeRealTimeStatus(): RealTimeMiningStatus {
    return {
      totalSupply: MINING_CONSTANTS.TOTAL_SUPPLY,
      currentIssued: 0,
      referralBonusStorage: 0,
      referralBonusRate: 0, // [추가] 초기화
      remainingSupply: MINING_CONSTANTS.TOTAL_SUPPLY,
      remainingIssued: MINING_CONSTANTS.TOTAL_SUPPLY,
      issuanceRate: 0.00,
      issueRate: 0.00,
      totalBlocks: 1,
      generatedBlocks: 1,
      walletCount: 0,
      networkStatus: NETWORK_STATUS.CONNECTED,
      lastUpdate: new Date()
    };
  }

  /**
   * [신규] 배경 채굴 티커 시작 (창이 닫혀도 유지됨)
   * @param baseRate 시간당 1차 채굴률
   * @param referralBonusRate 2% 추천 보너스율
   */
  public startMiningTicker(totalRate: number, referralBonusRate: number = 0): void {
    if (this.miningTicker) clearInterval(this.miningTicker);

    this.currentBaseRate = new Decimal(totalRate); // totalRate (이미 모든 보너스 포함된 최종 속도)
    const perSecondRate = this.currentBaseRate.div(3600);

    // [Phase 1 Fixed] 지갑의 '추천보너스보관함(2%)'을 위한 별도 초당 증분율 추출
    const baseMiningRate = new Decimal(MINING_CONSTANTS.HOURLY_BASE_RATE || 0.25);
    const bonusPerSecondRate = baseMiningRate.mul(referralBonusRate).div(3600);

    // [공정 1-3 수복] 절대 시간 기준 앵커 박제 — 누적 덧셈(current + perSecond) 완전 폐기
    // 티커 시작 시점의 기존 누적값과 시작 시각을 고정하고,
    // 매 tick마다 (경과 초 × 초당 채굴률)을 앵커에 더하여 시계와 1:1 칼동기화
    const anchorIssued = new Decimal(this.realTimeStatus.currentIssued);
    const anchorBonus = new Decimal(this.realTimeStatus.referralBonusStorage || 0);
    const tickerStartTime = Date.now();

    this.miningTicker = setInterval(() => {
      if (this.realTimeStatus.currentIssued >= 0) {
        // [공정 1-3] 절대 경과 초 산출 (브라우저 setInterval 지연 완전 무시)
        const elapsedSeconds = Math.max(0, Math.floor((Date.now() - tickerStartTime) / 1000));

        // 1. 메인 채굴량 = 앵커값 + (경과초 × 초당 채굴률) — 50자리 정밀 연산
        const nextIssued = anchorIssued.plus(perSecondRate.mul(elapsedSeconds));

        // 2. 추천 보너스 = 앵커값 + (경과초 × 보너스 초당률) — 50자리 정밀 연산
        const nextBonus = anchorBonus.plus(bonusPerSecondRate.mul(elapsedSeconds));

        this.realTimeStatus.currentIssued = nextIssued.toNumber();
        this.realTimeStatus.referralBonusStorage = nextBonus.toNumber();
        this.realTimeStatus.lastUpdate = new Date();

        // 지갑 등 모든 구독자에게 1초마다 방송 (나의 지갑 카운팅 강제 동기화)
        this.notifySubscribers();
      }
    }, 1000);

    console.log('[RealTimeSync] [공정 1-3] 절대시간 기반 1초 카운팅 엔진(2% 보너스 포함) 가동 시작');
  }

  /**
   * [신규] 배경 채굴 티커 중지
   */
  public stopMiningTicker(): void {
    if (this.miningTicker) {
      clearInterval(this.miningTicker);
      this.miningTicker = null;
      console.log('[RealTimeSync] 배경 채굴 티커 중지됨.');
    }
  }

  /**
   * [신규] 현재 마이닝이 활성 상태인지 확인
   * @returns boolean 마이닝 진행 여부
   */
  public isMiningActive(): boolean {
    return this.miningTicker !== null;
  }

  /**
   * 서비스 초기화 및 사용자 상태 로드
   */
  public async initialize(address: string): Promise<void> {
    this.walletAddress = address;
    try {
      const status = await apiService.getUserStatus(address);
      const miningData = status?.data?.miningState || status?.miningState;
      const userData = status?.data?.user || status?.user;
      if (miningData) {
        this.updateLocalStatusFromServer(miningData);

        // [보강] 초기화 시 이미 채굴 중이라면, 서버에서 준 totalRate로 배경 티커 즉시 가동
        if (miningData.isMining && miningData.currentTotalRate > 0) {
          const totalRate = parseFloat(miningData.currentTotalRate);
          const referralRate = parseFloat(miningData.referralBonusRate || '0');
          console.log('[RealTimeSync] 초기화 시 채굴 데이터 복구 성공 -> 티커 재가동');
          this.startMiningTicker(totalRate, referralRate);
        }
      }

      const bonusData = await apiService.getBonusStatus(address);
      if (bonusData && bonusData.referral) {
        this.realTimeStatus.referralBonusStorage = bonusData.referral.bonusStorage || 0;
      }
    } catch (error) {
      console.error('Failed to initialize mining service:', error);
    }
  }

  /**
   * 실시간 동기화 시작 (API Sync)
   */
  public startSync(callback?: (status: RealTimeMiningStatus) => void): void {
    if (this.isRunning || !this.walletAddress) return;

    this.isRunning = true;
    this.performDataSync(callback);

    this.syncInterval = setInterval(() => {
      this.performDataSync(callback);
    }, AUTO_REFRESH_INTERVAL);
  }

  /**
   * 실시간 동기화 정지
   */
  public stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
  }

  /**
   * 서버와 데이터 동기화 수행
   */
  private async performDataSync(callback?: (status: RealTimeMiningStatus) => void): Promise<void> {
    if (!this.walletAddress) return;

    try {
      const triggerRaw = localStorage.getItem('BW_SYSTEM_RESET_TRIGGER');
      if (triggerRaw) {
        const signal = JSON.parse(triggerRaw);
        const normTarget = signal.target ? signal.target.trim().toLowerCase() : '';
        const normWallet = this.walletAddress.trim().toLowerCase();

        if (normTarget === normWallet || normTarget === 'all') {
          // [공정 5 추가] 타임스탬프 검증 로직 도입 (동일 시그널 무한 반복 처리 방지)
          const processingKey = `BW_REALTIME_SYNC_PROCESSED_${this.walletAddress.trim().toLowerCase()}`;
          const lastProcessed = parseInt(localStorage.getItem(processingKey) || '0');

          if (signal.timestamp > lastProcessed) {
            this.stopMiningTicker(); // 리셋 시 티커 정지 (단 1회만 수행)
            this.realTimeStatus = {
              ...this.realTimeStatus,
              currentIssued: 0,
              referralBonusStorage: 0, // [추가] 리셋 시 보너스함도 0으로 초기화
              issuanceRate: 0,
              issueRate: 0
            };
            // [공정 5 추가] 처리 완료 시간 박제
            localStorage.setItem(processingKey, signal.timestamp.toString());
            if (callback) callback(this.realTimeStatus);
            return;
          }
        }
      }
    } catch (e) { }

    try {
      // [Phase 3 집행] 배경 티커가 업데이트하고 있는 현재 메모리 값을 서버로 보냄 (보너스 포함)
      const currentAmount = this.precisionCalculator.formatBW(
        new Decimal(this.realTimeStatus.currentIssued)
      );
      const currentBonus = this.precisionCalculator.formatBW(
        new Decimal(this.realTimeStatus.referralBonusStorage || 0)
      );

      // 서버로 채굴량과 보너스량을 동시에 전송하여 동기화
      const response = await apiService.syncMiningData(this.walletAddress, currentAmount, currentBonus);

      if (response && response.success && response.data) {
        // [Crawl-Back Guard] 확장프로그램 설치 여부 검출 및 보너스 회수 (3회 연속 미감지 유예 버퍼 적용)
        const serverExtensionRate = parseFloat(response.data.extensionBonusRate || '0');
        const isInstalledFlag = typeof document !== 'undefined' && document.documentElement.dataset['bitwishInstalled'] === "true";

        if (isInstalledFlag) {
          // 정상 감지 시 카운터 리셋
          this.uninstalledDetectionCount = 0;
        } else if (serverExtensionRate > 0) {
          // 미감지 시 유예 카운트 증가
          this.uninstalledDetectionCount++;
          console.warn(`[Extension Guard] Extension not detected (${this.uninstalledDetectionCount}/3) for ${this.walletAddress}`);

          // 일시적 로딩 렉이나 탭 전환 지연을 방어하고, 3회 연속(약 90초) 확실하게 미감지될 때만 정상 회수
          if (this.uninstalledDetectionCount >= 3) {
            console.warn(`[Extension Guard] 3 consecutive uninstalled detections confirmed. Revoking bonus for ${this.walletAddress}`);
            try {
              await fetch('/api/mining/extension-bonus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress: this.walletAddress, bonusRate: '0.00000000000000000000000000000000000000000000000000' })
              });
              // 회수 후 로컬 데이터 강제 갱신
              response.data.extensionBonusRate = '0.00000000000000000000000000000000000000000000000000';
              // 전체 채굴 속도 재계산
              const baseRate = new Decimal(response.data.currentBaseRate || '0.25');
              const attendanceRate = response.data.isAttendanceActive ? new Decimal(0.05) : new Decimal(0);
              const referralRate = new Decimal(response.data.referralBonusRate || '0');
              const partnerRate = response.data.partnerStatus === 'REGISTERED' ? new Decimal(1.25) : new Decimal(0);
              response.data.currentTotalRate = baseRate
                .mul(new Decimal(1).plus(attendanceRate))
                .mul(new Decimal(1).plus(referralRate))
                .mul(new Decimal(1).plus(partnerRate))
                .toString();
              this.uninstalledDetectionCount = 0;
            } catch (guardErr) {
              console.error('[Extension Guard] Failed to revoke bonus:', guardErr);
            }
          }
        }

        // 서버에서 반환된 '최종 박제 데이터'로 로컬 상태 동기화 (리셋 방지)
        this.updateLocalStatusFromServer(response.data);
        this.syncCount++;
        this.lastSyncTime = new Date();

        if (callback) {
          callback(this.realTimeStatus);
        }
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  /**
   * 서버 데이터를 기반으로 로컬 상태 업데이트
   */
  private updateLocalStatusFromServer(serverData: any): void {
    const currentIssued = new Decimal(serverData.accumulatedReward || 0);
    const referralBonus = new Decimal(serverData.referralBonusStorage || 0);
    const totalSupply = new Decimal(MINING_CONSTANTS.TOTAL_SUPPLY);

    const remaining = totalSupply.minus(currentIssued);
    const issuanceRate = currentIssued.div(totalSupply).mul(100);

    this.realTimeStatus = {
      ...this.realTimeStatus,
      currentIssued: currentIssued.toNumber(),
      referralBonusStorage: referralBonus.toNumber(),
      referralBonusRate: parseFloat(serverData.referralBonusRate || '0'),
      extensionBonusRate: parseFloat(serverData.extensionBonusRate || '0'),
      remainingSupply: remaining.toNumber(),
      remainingIssued: remaining.toNumber(),
      issuanceRate: issuanceRate.toNumber(),
      issueRate: issuanceRate.toNumber(),
      lastUpdate: new Date()
    };
    this.notifySubscribers();
  }

  /**
   * 실시간 데이터 구독
   */
  public subscribe(callback: (status: RealTimeMiningStatus) => void): () => void {
    this.subscribers.push(callback);
    callback(this.getCurrentStatus());
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers(): void {
    const status = this.getCurrentStatus();
    this.subscribers.forEach(callback => callback(status));
  }

  /**
   * [공정 3 브릿지] 팝업 또는 외부 출석 완료 신호 수신 시 실시간 동기화
   */
  public triggerImmediateSync(): void {
    if (this.walletAddress) {
      this.performDataSync((status: RealTimeMiningStatus) => {
        this.notifySubscribers();
      });
    }
  }

  /**
   * 보너스 저장소 업데이트용 (ReferralBonusService 연동)
   */
  public updateBonusStorage(bonusAmountDelta: number): void {
    const currentBonus = new Decimal(this.realTimeStatus.referralBonusStorage || 0);
    this.realTimeStatus.referralBonusStorage = currentBonus.plus(bonusAmountDelta).toNumber();
    this.notifySubscribers();
  }

  public getCurrentStatus(): RealTimeMiningStatus {
    return { ...this.realTimeStatus };
  }

  /**
   * 동기화 상태 조회 (Legacy)
   */
  public getSyncStatus(): {
    isRunning: boolean;
    lastSyncTime: Date;
    syncCount: number;
    nextSyncTime: Date;
  } {
    const nextSyncTime = new Date(this.lastSyncTime.getTime() + AUTO_REFRESH_INTERVAL);
    return {
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime,
      syncCount: this.syncCount,
      nextSyncTime: nextSyncTime
    };
  }
}
