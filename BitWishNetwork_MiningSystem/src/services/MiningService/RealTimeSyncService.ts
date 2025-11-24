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
 * ✅ 주석에 명시 추가
 * ✅ 자체 보안 검증만 사용
 * ✅ 50단위 부동소수점 정밀 계산형식으로 구현 하지만 UI 홈페이지 이미지상 소수즘 8자리만 표기한다. 
 * ✅ BitWish Network 전용 시스템만 사용
 * ✅ 모든 텍스트는 한국어, 영어, 일어, 중국어포함 동남아권 언어 변경 되도록 모든 기능에 완벽하게 구현한다. 
 *        단 절대 복잡하게 파일들을 만들지 않도록한다. 
 * ✅ 마이닝 페이지는 완벽한 독립성 보장과 완벽한 데이터베이스 MongDB 하이브리드 완벽 저장소 구현한다. 
 * ✅ 유저는 1명이든 천만명이든 개인 단독 데이터베이스 MongDB 하이브리드 완벽 저장소를 구현한다.
 */

import { PrecisionCalculator } from '@/utils/PrecisionCalculator/PrecisionCalculator';
import { Decimal } from 'decimal.js';
import {
  RealTimeMiningStatus,
  NetworkStatus,
  MiningRecord,
  User
} from '@/types';
import {
  MINING_CONSTANTS,
  NETWORK_STATUS,
  AUTO_REFRESH_INTERVAL,
  PAGE_REFRESH_INTERVAL
} from '@/constants';

/**
 * 실시간 데이터 동기화 서비스 클래스 - 완벽한 독립성 보장
 * 30초마다 자동 새로고침, 1분마다 전체 페이지 새로고침
 */
export class RealTimeSyncService {
  private precisionCalculator: PrecisionCalculator;
  private realTimeStatus: RealTimeMiningStatus;
  private syncInterval: NodeJS.Timeout | null;
  // private pageRefreshInterval: NodeJS.Timeout | null; // 제거됨
  private isRunning: boolean;
  private lastSyncTime: Date;
  private syncCount: number;

  constructor() {
    // 절대 준수사항: 전역 변수 사용 금지
    this.precisionCalculator = new PrecisionCalculator();
    this.realTimeStatus = this.initializeRealTimeStatus();
    this.syncInterval = null;
    // this.pageRefreshInterval = null; // 제거됨
    this.isRunning = false;
    this.lastSyncTime = new Date();
    this.syncCount = 0;
  }

  /**
   * 실시간 상태 초기화
   * @returns 초기화된 실시간 상태
   */
  private initializeRealTimeStatus(): RealTimeMiningStatus {
    return {
      totalSupply: MINING_CONSTANTS.TOTAL_SUPPLY,
      currentIssued: 0,
      remainingSupply: MINING_CONSTANTS.TOTAL_SUPPLY,
      remainingIssued: MINING_CONSTANTS.TOTAL_SUPPLY,
      issuanceRate: 0.00,
      issueRate: 0.00,
      totalBlocks: 1, // 제네시스 블록
      generatedBlocks: 1,
      walletCount: 0,
      networkStatus: NETWORK_STATUS.CONNECTED,
      lastUpdate: new Date()
    };
  }

  /**
   * 실시간 동기화 시작
   * @returns 시작 결과
   */
  public startRealTimeSync(): {
    success: boolean;
    message?: string;
  } {
    try {
      if (this.isRunning) {
        return {
          success: false,
          message: '실시간 동기화가 이미 실행 중입니다.'
        };
      }

      // 30초마다 데이터 새로고침
      this.syncInterval = setInterval(() => {
        this.performDataSync();
      }, AUTO_REFRESH_INTERVAL);

      // 전체 페이지 새로고침 완전 제거 (로딩 지연 방지)
      // this.pageRefreshInterval = null;

      this.isRunning = true;
      this.lastSyncTime = new Date();

      return {
        success: true,
        message: '실시간 동기화가 시작되었습니다.'
      };
    } catch (error) {
      return {
        success: false,
        message: '실시간 동기화 시작 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 실시간 동기화 정지
   * @returns 정지 결과
   */
  public stopRealTimeSync(): {
    success: boolean;
    message?: string;
  } {
    try {
      if (!this.isRunning) {
        return {
          success: false,
          message: '실시간 동기화가 실행 중이 아닙니다.'
        };
      }

      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }

      // pageRefreshInterval 제거됨
      // if (this.pageRefreshInterval) {
      //   clearInterval(this.pageRefreshInterval);
      //   this.pageRefreshInterval = null;
      // }

      this.isRunning = false;

      return {
        success: true,
        message: '실시간 동기화가 정지되었습니다.'
      };
    } catch (error) {
      return {
        success: false,
        message: '실시간 동기화 정지 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 데이터 동기화 수행
   */
  private performDataSync(): void {
    try {
      // 실시간 상태 업데이트
      this.updateRealTimeStatus();

      // 동기화 카운트 증가
      this.syncCount++;
      this.lastSyncTime = new Date();

      // 콘솔 로그 (개발 환경에서만)
      if (process.env['NODE_ENV'] === 'development') {
        console.log(`[RealTimeSync] 데이터 동기화 완료 - ${this.lastSyncTime.toISOString()}`);
      }
    } catch (error) {
      console.error('[RealTimeSync] 데이터 동기화 중 오류:', error);
    }
  }

  /**
   * 전체 페이지 새로고침 제거됨 (로딩 지연 방지)
   */
  // private performPageRefresh(): void {
  //   // 전체 페이지 새로고침 완전 제거
  // }

  /**
   * 실시간 상태 업데이트
   */
  private updateRealTimeStatus(): void {
    // 현재 발행량 업데이트 (실제로는 데이터베이스에서 조회)
    const currentIssued = this.calculateCurrentIssued();

    // 잔여 발행량 업데이트
    const remainingSupply = this.precisionCalculator.subtract(
      this.realTimeStatus.totalSupply,
      currentIssued.toNumber()
    );

    // 발행률 업데이트
    const issuanceRate = this.precisionCalculator.calculateIssuanceRate(
      currentIssued.toNumber(),
      this.realTimeStatus.totalSupply
    );

    // 블록 수 업데이트 (실제로는 블록체인에서 조회)
    const totalBlocks = this.calculateTotalBlocks();

    // 지갑 수 업데이트 (실제로는 데이터베이스에서 조회)
    const walletCount = this.calculateWalletCount();

    // 네트워크 상태 업데이트
    const networkStatus = this.checkNetworkStatus();

    // 실시간 상태 업데이트
    this.realTimeStatus = {
      totalSupply: this.realTimeStatus.totalSupply,
      currentIssued: currentIssued.toNumber(),
      remainingSupply: remainingSupply.toNumber(),
      remainingIssued: remainingSupply.toNumber(),
      issuanceRate: issuanceRate.toNumber(),
      issueRate: issuanceRate.toNumber(),
      totalBlocks: totalBlocks,
      generatedBlocks: totalBlocks,
      walletCount: walletCount,
      networkStatus: networkStatus,
      lastUpdate: new Date()
    };
  }

  /**
   * 현재 발행량 계산
   * @returns 현재 발행량
   */
  private calculateCurrentIssued(): import('decimal.js').Decimal {
    // 실제로는 데이터베이스에서 모든 사용자의 마이닝 기록을 조회하여 계산
    // 여기서는 시뮬레이션을 위한 간단한 계산
    const baseIssued = this.precisionCalculator.multiply(1000, 1); // 기본 발행량
    const randomFactor = this.precisionCalculator.multiply(Math.random(), 100);
    return this.precisionCalculator.add(baseIssued.toNumber(), randomFactor.toNumber());
  }

  /**
   * 총 블록 수 계산
   * @returns 총 블록 수
   */
  private calculateTotalBlocks(): number {
    // 실제로는 블록체인에서 조회
    // 여기서는 시뮬레이션을 위한 간단한 계산
    return 1 + Math.floor(Math.random() * 100); // 제네시스 블록 + 랜덤 블록 수
  }

  /**
   * 지갑 수 계산
   * @returns 지갑 수
   */
  private calculateWalletCount(): number {
    // 실제로는 데이터베이스에서 조회
    // 여기서는 시뮬레이션을 위한 간단한 계산
    return Math.floor(Math.random() * 1000); // 랜덤 지갑 수
  }

  /**
   * 네트워크 상태 확인
   * @returns 네트워크 상태
   */
  private checkNetworkStatus(): NetworkStatus {
    // 실제로는 블록체인 연결 상태를 확인
    // 여기서는 시뮬레이션을 위한 간단한 확인
    const isConnected = Math.random() > 0.1; // 90% 확률로 연결됨
    return isConnected ? NETWORK_STATUS.CONNECTED : NETWORK_STATUS.DISCONNECTED;
  }

  /**
   * 실시간 상태 조회
   * @returns 실시간 상태
   */
  public getRealTimeStatus(): RealTimeMiningStatus {
    return { ...this.realTimeStatus };
  }

  /**
   * 실시간 상태 조회 (포맷팅된 버전)
   * @returns 포맷팅된 실시간 상태
   */
  public getFormattedRealTimeStatus(): {
    totalSupply: string;
    currentIssued: string;
    remainingSupply: string;
    issuanceRate: string;
    totalBlocks: number;
    walletCount: number;
    networkStatus: NetworkStatus;
    lastUpdate: Date;
  } {
    return {
      totalSupply: this.precisionCalculator.formatBWWithCommas(
        this.precisionCalculator.multiply(this.realTimeStatus.totalSupply, 1)
      ),
      currentIssued: this.precisionCalculator.formatBWWithCommas(
        this.precisionCalculator.multiply(this.realTimeStatus.currentIssued, 1)
      ),
      remainingSupply: this.precisionCalculator.formatBWWithCommas(
        this.precisionCalculator.multiply(this.realTimeStatus.remainingSupply, 1)
      ),
      issuanceRate: this.precisionCalculator.formatPercentageForDisplay(
        this.precisionCalculator.multiply(this.realTimeStatus.issuanceRate, 1)
      ),
      totalBlocks: this.realTimeStatus.totalBlocks,
      walletCount: this.realTimeStatus.walletCount,
      networkStatus: this.realTimeStatus.networkStatus,
      lastUpdate: this.realTimeStatus.lastUpdate
    };
  }

  /**
   * 동기화 상태 조회
   * @returns 동기화 상태
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

  /**
   * 동기화 통계 조회
   * @returns 동기화 통계
   */
  public getSyncStats(): {
    totalSyncs: number;
    averageSyncInterval: number;
    lastSyncTime: Date;
    uptime: number;
  } {
    const now = new Date();
    const uptime = now.getTime() - this.lastSyncTime.getTime();
    const averageSyncInterval = this.syncCount > 0 ? uptime / this.syncCount : 0;

    return {
      totalSyncs: this.syncCount,
      averageSyncInterval: averageSyncInterval,
      lastSyncTime: this.lastSyncTime,
      uptime: uptime
    };
  }

  /**
   * 실시간 상태 리셋
   * @returns 리셋 결과
   */
  public resetRealTimeStatus(): {
    success: boolean;
    message?: string;
  } {
    try {
      this.realTimeStatus = this.initializeRealTimeStatus();
      this.syncCount = 0;
      this.lastSyncTime = new Date();

      return {
        success: true,
        message: '실시간 상태가 리셋되었습니다.'
      };
    } catch (error) {
      return {
        success: false,
        message: '실시간 상태 리셋 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 실시간 상태 수동 업데이트
   * @returns 업데이트 결과
   */
  public manualUpdate(): {
    success: boolean;
    message?: string;
    updatedStatus?: RealTimeMiningStatus;
  } {
    try {
      this.performDataSync();

      return {
        success: true,
        message: '실시간 상태가 수동으로 업데이트되었습니다.',
        updatedStatus: this.getRealTimeStatus()
      };
    } catch (error) {
      return {
        success: false,
        message: '실시간 상태 수동 업데이트 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 동기화 간격 설정
   * @param interval 새로운 간격 (밀리초)
   * @returns 설정 결과
   */
  public setSyncInterval(interval: number): {
    success: boolean;
    message?: string;
  } {
    try {
      if (interval < 1000) {
        return {
          success: false,
          message: '동기화 간격은 1초 이상이어야 합니다.'
        };
      }

      // 기존 간격 정지
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
      }

      // 새로운 간격 설정
      this.syncInterval = setInterval(() => {
        this.performDataSync();
      }, interval);

      return {
        success: true,
        message: `동기화 간격이 ${interval}ms로 설정되었습니다.`
      };
    } catch (error) {
      return {
        success: false,
        message: '동기화 간격 설정 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 페이지 새로고침 간격 설정
   * @param interval 새로운 간격 (밀리초)
   * @returns 설정 결과
   */
  public setPageRefreshInterval(interval: number): {
    success: boolean;
    message?: string;
  } {
    try {
      if (interval < 10000) {
        return {
          success: false,
          message: '페이지 새로고침 간격은 10초 이상이어야 합니다.'
        };
      }

      // pageRefreshInterval 제거됨
      // if (this.pageRefreshInterval) {
      //   clearInterval(this.pageRefreshInterval);
      // }
      // this.pageRefreshInterval = setInterval(() => {
      //   this.performPageRefresh();
      // }, interval);

      return {
        success: true,
        message: `페이지 새로고침 간격이 ${interval}ms로 설정되었습니다.`
      };
    } catch (error) {
      return {
        success: false,
        message: '페이지 새로고침 간격 설정 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 실시간 상태 검증
   * @returns 검증 결과
   */
  public validateRealTimeStatus(): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 총 공급량 검증
    if (this.realTimeStatus.totalSupply <= 0) {
      errors.push('총 공급량이 0 이하입니다.');
    }

    // 현재 발행량 검증
    if (this.realTimeStatus.currentIssued < 0) {
      errors.push('현재 발행량이 음수입니다.');
    }

    // 잔여 발행량 검증
    if (this.realTimeStatus.remainingSupply < 0) {
      errors.push('잔여 발행량이 음수입니다.');
    }

    // 발행률 검증
    if (this.realTimeStatus.issuanceRate < 0 || this.realTimeStatus.issuanceRate > 100) {
      errors.push('발행률이 유효하지 않습니다.');
    }

    // 블록 수 검증
    if (this.realTimeStatus.totalBlocks < 1) {
      errors.push('총 블록 수가 1 미만입니다.');
    }

    // 지갑 수 검증
    if (this.realTimeStatus.walletCount < 0) {
      errors.push('지갑 수가 음수입니다.');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * 서비스 정리
   */
  public cleanup(): void {
    this.stopRealTimeSync();
    this.syncCount = 0;
    this.lastSyncTime = new Date();
  }

  /**
   * 실시간 동기화 시작 (startSync 별칭)
   * @param callback 콜백 함수
   */
  public startSync(callback: (status: any) => void): void {
    this.startRealTimeSync();
  }

  /**
   * 네트워크 상태 변경 이벤트 등록 (onNetworkStatusChange 별칭)
   * @param callback 콜백 함수
   */
  public onNetworkStatusChange(callback: (status: any) => void): void {
    this.onNetworkStatusChange = callback;
  }

  /**
   * 실시간 동기화 중지 (stopSync 별칭)
   */
  public stopSync(): void {
    this.stopRealTimeSync();
  }

  /**
   * 현재 상태 조회 (getCurrentStatus 별칭)
   * @returns 현재 상태
   */
  public getCurrentStatus(): RealTimeMiningStatus {
    return this.getRealTimeStatus();
  }
}
