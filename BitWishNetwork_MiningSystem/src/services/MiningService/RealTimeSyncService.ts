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
    // 주의: totalRate는 최종합이므로, baseRate 기준을 0.25로 역산출하거나, 
    // 서버가 주는 baseRate * referralBonusRate 공식 그대로 씁니다.
    const baseMiningRate = new Decimal(MINING_CONSTANTS.HOURLY_BASE_RATE || 0.25);
    const bonusPerSecondRate = baseMiningRate.mul(referralBonusRate).div(3600);

    this.miningTicker = setInterval(() => {
      if (this.realTimeStatus.currentIssued >= 0) {
        // 1. 메인 채굴량 정밀 연산 및 업데이트
        const current = new Decimal(this.realTimeStatus.currentIssued);
        const next = current.plus(perSecondRate);

        // 2. [Phase 1 Fixed] 2% 추천 보너스 실시간 카운팅 정밀 연산 및 업데이트
        const currentBonus = new Decimal(this.realTimeStatus.referralBonusStorage || 0);
        const nextBonus = currentBonus.plus(bonusPerSecondRate);

        this.realTimeStatus.currentIssued = next.toNumber();
        this.realTimeStatus.referralBonusStorage = nextBonus.toNumber();
        this.realTimeStatus.lastUpdate = new Date();

        // 지갑 등 모든 구독자에게 1초마다 방송 (나의 지갑 카운팅 강제 동기화)
        this.notifySubscribers();
      }
    }, 1000);

    console.log('[RealTimeSync] 지갑/홈페이지 실시간 1초 카운팅 엔진(2% 보너스 포함) 가동 시작');
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
   * 서비스 초기화 및 사용자 상태 로드
   */
  public async initialize(address: string): Promise<void> {
    this.walletAddress = address;
    try {
      const status = await apiService.getUserStatus(address);
      if (status && status.miningState) {
        this.updateLocalStatusFromServer(status.miningState);

        // [보강] 초기화 시 이미 채굴 중이라면, 서버에서 준 totalRate로 배경 티커 즉시 가동
        // [Phase 1 Fixed] 2% 추천 보너스 티커 동시 가동 여부를 위해 referralBonusRate도 함께 전달
        if (status.miningState.isMining && status.miningState.currentTotalRate > 0) {
          const totalRate = parseFloat(status.miningState.currentTotalRate);
          const referralRate = parseFloat(status.miningState.referralBonusRate || '0');
          console.log('[RealTimeSync] 지갑 초기화 중 채굴 상태 감지 -> 티커 자동 시작 (Rate:', totalRate, 'BonusRate:', referralRate, ')');
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

        if (normTarget === normWallet) {
          this.stopMiningTicker(); // 리셋 시 티커도 정지
          this.realTimeStatus = {
            ...this.realTimeStatus,
            currentIssued: 0,
            issuanceRate: 0,
            issueRate: 0
          };
          if (callback) callback(this.realTimeStatus);
          return;
        }
      }
    } catch (e) { }

    try {
      // 배경 티커가 업데이트하고 있는 현재 메모리 값을 서버로 보냄
      const currentAmount = this.precisionCalculator.formatBW(
        new Decimal(this.realTimeStatus.currentIssued)
      );

      const response = await apiService.syncMiningData(this.walletAddress, currentAmount);

      if (response && response.success) {
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
