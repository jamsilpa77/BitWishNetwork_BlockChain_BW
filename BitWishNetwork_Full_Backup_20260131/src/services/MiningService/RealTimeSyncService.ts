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
  private precisionCalculator: PrecisionCalculator;
  private realTimeStatus: RealTimeMiningStatus;
  private syncInterval: NodeJS.Timeout | null;
  private isRunning: boolean;
  private lastSyncTime: Date;
  private walletAddress: string | null;
  private syncCount: number;

  constructor() {
    this.precisionCalculator = new PrecisionCalculator();
    this.realTimeStatus = this.initializeRealTimeStatus();
    this.syncInterval = null;
    this.isRunning = false;
    this.lastSyncTime = new Date();
    this.walletAddress = null;
    this.syncCount = 0;
  }

  private initializeRealTimeStatus(): RealTimeMiningStatus {
    return {
      totalSupply: MINING_CONSTANTS.TOTAL_SUPPLY,
      currentIssued: 0,
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
   * 서비스 초기화 및 사용자 상태 로드
   * @param address 지갑 주소
   */
  public async initialize(address: string): Promise<void> {
    this.walletAddress = address;
    try {
      const status = await apiService.getUserStatus(address);
      if (status && status.miningState) {
        this.updateLocalStatusFromServer(status.miningState);
      }
    } catch (error) {
      console.error('Failed to initialize mining service:', error);
    }
  }

  /**
   * 실시간 동기화 시작 (Legacy 호환용)
   */
  public startRealTimeSync(): { success: boolean; message?: string } {
    if (this.isRunning) {
      return { success: false, message: 'Already running' };
    }
    this.startSync();
    return { success: true, message: 'Started' };
  }

  /**
   * 실시간 동기화 정지 (Legacy 호환용)
   */
  public stopRealTimeSync(): { success: boolean; message?: string } {
    if (!this.isRunning) {
      return { success: false, message: 'Not running' };
    }
    this.stopSync();
    return { success: true, message: 'Stopped' };
  }

  /**
   * 실시간 동기화 시작
   */
  public startSync(callback?: (status: RealTimeMiningStatus) => void): void {
    if (this.isRunning || !this.walletAddress) return;

    this.isRunning = true;

    // 즉시 1회 실행
    this.performDataSync(callback);

    // 30초마다 주기적 실행
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

    // [핵심 추가] 좀비 복구 방지 전용 코드
    // 동기화 직전에 관리자 초기화 신호가 있는지 확인합니다.
    try {
      const triggerRaw = localStorage.getItem('BW_SYSTEM_RESET_TRIGGER');
      if (triggerRaw) {
        const signal = JSON.parse(triggerRaw);
        const normTarget = signal.target ? signal.target.trim().toLowerCase() : '';
        const normWallet = this.walletAddress.trim().toLowerCase();

        if (normTarget === normWallet) {
          // 신호가 감지되면 즉시 동기화 중단 및 메모리 자폭(0으로 리셋)
          // 이렇게 해야 서버 DB를 옛날 값으로 덮어쓰지 않습니다.
          console.log('[RealTimeSync] 초기화 신호 감지 -> 동기화 중단 및 메모리 리셋');

          this.realTimeStatus = {
            ...this.realTimeStatus,
            currentIssued: 0,
            issuanceRate: 0,
            issueRate: 0
          };

          // 콜백이 있다면 0으로 업데이트된 상태를 UI에 전달
          if (callback) callback(this.realTimeStatus);
          return; // 서버 전송 취소
        }
      }
    } catch (e) {
      // JSON 파싱 에러 무시
    }

    try {
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
    const totalSupply = new Decimal(MINING_CONSTANTS.TOTAL_SUPPLY);

    const remaining = totalSupply.minus(currentIssued);
    const issuanceRate = currentIssued.div(totalSupply).mul(100);

    this.realTimeStatus = {
      ...this.realTimeStatus,
      currentIssued: currentIssued.toNumber(),
      remainingSupply: remaining.toNumber(),
      remainingIssued: remaining.toNumber(),
      issuanceRate: issuanceRate.toNumber(),
      issueRate: issuanceRate.toNumber(),
      lastUpdate: new Date()
    };
  }

  public getCurrentStatus(): RealTimeMiningStatus {
    return { ...this.realTimeStatus };
  }

  /**
   * 동기화 상태 조회 (Legacy 호환용)
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
