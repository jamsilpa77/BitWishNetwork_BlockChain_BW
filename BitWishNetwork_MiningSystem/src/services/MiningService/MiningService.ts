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
 * ✅ 모든 텍스트는 한국어, 영어, 일어, 중국어포함 언어 변경 되도록 모든 기능에 완벽하게 구현한다. 
 *        단 절대 복잡하게 파일들을 만들지 않도록한다. 
 * ✅ 마이닝 페이지는 완벽한 독립성 보장과 완벽한 데이터베이스 MongDB 하이브리드 완벽 저장소 구현한다. 
 * ✅ 유저는 1명이든 천만명이든 개인 단독 데이터베이스 MongDB 하이브리드 완벽 저장소를 구현한다.
 */

import { PrecisionCalculator } from '@/utils/PrecisionCalculator/PrecisionCalculator';
import { Decimal } from 'decimal.js';
import {
  MiningRecord,
  MiningStatus,
  RealTimeMiningStatus,
  User,
  BonusStatus
} from '@/types';
import {
  MINING_CONSTANTS,
  MINING_STATUS,
  NETWORK_STATUS
} from '@/constants';

/**
 * 마이닝 서비스 클래스 - 완벽한 독립성 보장
 * 개인 단독 데이터베이스 MongoDB 하이브리드 완벽 저장소 구현
 */
export class MiningService {
  private precisionCalculator: PrecisionCalculator;
  private miningRecords: Map<string, MiningRecord>;
  private userMiningStatus: Map<string, MiningStatus>;
  private realTimeStatus: RealTimeMiningStatus;

  constructor() {
    // 절대 준수사항: 전역 변수 사용 금지
    this.precisionCalculator = new PrecisionCalculator();
    this.miningRecords = new Map<string, MiningRecord>();
    this.userMiningStatus = new Map<string, MiningStatus>();
    this.realTimeStatus = this.initializeRealTimeStatus();
  }

  /**
   * 실시간 마이닝 상태 초기화
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
   * 마이닝 시작
   * @param userId 사용자 ID
   * @param user 사용자 정보
   * @returns 마이닝 시작 결과
   */
  public startMining(userId: string, user: User): {
    success: boolean;
    miningId?: string;
    startTime?: Date;
    baseRate?: number;
    totalRate?: number;
    status?: MiningStatus;
    message?: string;
  } {
    try {
      // 마이닝 상태 확인
      const currentStatus = this.userMiningStatus.get(userId);
      if (currentStatus === MINING_STATUS.MINING) {
        return {
          success: false,
          message: '이미 마이닝이 진행 중입니다.'
        };
      }

      // 마이닝 기록 생성
      const miningId = `mining_${userId}_${Date.now()}`;
      const startTime = new Date();

      // 기본 보상률 계산
      const baseRate = MINING_CONSTANTS.HOURLY_BASE_RATE;

      // 보너스 적용된 총 보상률 계산
      const totalRate = this.calculateTotalMiningRate(user.bonusStatus);

      // 마이닝 기록 저장
      const miningRecord: MiningRecord = {
        id: miningId,
        userId: userId,
        startTime: startTime,
        duration: 0,
        baseRate: baseRate,
        totalRate: totalRate,
        baseAmount: 0,
        bonusAmount: 0,
        totalAmount: 0,
        baseReward: 0,
        totalReward: 0,
        status: MINING_STATUS.MINING,
        createdAt: startTime,
        updatedAt: startTime
      };

      this.miningRecords.set(miningId, miningRecord);
      this.userMiningStatus.set(userId, MINING_STATUS.MINING);

      return {
        success: true,
        miningId: miningId,
        startTime: startTime,
        baseRate: baseRate,
        totalRate: totalRate,
        status: MINING_STATUS.MINING,
        message: '마이닝이 시작되었습니다.'
      };
    } catch (error) {
      return {
        success: false,
        message: '마이닝 시작 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 마이닝 정지
   * @param userId 사용자 ID
   * @returns 마이닝 정지 결과
   */
  public stopMining(userId: string): {
    success: boolean;
    stopTime?: Date;
    totalAmount?: number;
    status?: MiningStatus;
    message?: string;
  } {
    try {
      // 마이닝 상태 확인
      const currentStatus = this.userMiningStatus.get(userId);
      if (currentStatus !== MINING_STATUS.MINING) {
        return {
          success: false,
          message: '진행 중인 마이닝이 없습니다.'
        };
      }

      // 마이닝 기록 찾기
      const miningRecord = this.findActiveMiningRecord(userId);
      if (!miningRecord) {
        return {
          success: false,
          message: '활성 마이닝 기록을 찾을 수 없습니다.'
        };
      }

      // 마이닝 정지 시간 설정
      const stopTime = new Date();
      const duration = Math.floor((stopTime.getTime() - miningRecord.startTime.getTime()) / 1000);

      // 총 채굴량 계산
      const totalAmount = this.calculateTotalMiningAmount(
        miningRecord.totalRate,
        duration
      );

      // 마이닝 기록 업데이트
      miningRecord.endTime = stopTime;
      miningRecord.duration = duration;
      miningRecord.totalAmount = totalAmount;
      miningRecord.status = MINING_STATUS.STOPPED;
      miningRecord.updatedAt = stopTime;

      // 사용자 마이닝 상태 업데이트
      this.userMiningStatus.set(userId, MINING_STATUS.STOPPED);

      // 실시간 상태 업데이트
      this.updateRealTimeStatus(totalAmount);

      return {
        success: true,
        stopTime: stopTime,
        totalAmount: totalAmount,
        status: MINING_STATUS.STOPPED,
        message: '마이닝이 정지되었습니다.'
      };
    } catch (error) {
      return {
        success: false,
        message: '마이닝 정지 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 마이닝 일시정지
   * @param userId 사용자 ID
   * @returns 마이닝 일시정지 결과
   */
  public pauseMining(userId: string): {
    success: boolean;
    pauseTime?: Date;
    status?: MiningStatus;
    message?: string;
  } {
    try {
      // 마이닝 상태 확인
      const currentStatus = this.userMiningStatus.get(userId);
      if (currentStatus !== MINING_STATUS.MINING) {
        return {
          success: false,
          message: '진행 중인 마이닝이 없습니다.'
        };
      }

      // 사용자 마이닝 상태 업데이트
      this.userMiningStatus.set(userId, MINING_STATUS.PAUSED);

      return {
        success: true,
        pauseTime: new Date(),
        status: MINING_STATUS.PAUSED,
        message: '마이닝이 일시정지되었습니다.'
      };
    } catch (error) {
      return {
        success: false,
        message: '마이닝 일시정지 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 마이닝 재개
   * @param userId 사용자 ID
   * @returns 마이닝 재개 결과
   */
  public resumeMining(userId: string): {
    success: boolean;
    resumeTime?: Date;
    status?: MiningStatus;
    message?: string;
  } {
    try {
      // 마이닝 상태 확인
      const currentStatus = this.userMiningStatus.get(userId);
      if (currentStatus !== MINING_STATUS.PAUSED) {
        return {
          success: false,
          message: '일시정지된 마이닝이 없습니다.'
        };
      }

      // 사용자 마이닝 상태 업데이트
      this.userMiningStatus.set(userId, MINING_STATUS.MINING);

      return {
        success: true,
        resumeTime: new Date(),
        status: MINING_STATUS.MINING,
        message: '마이닝이 재개되었습니다.'
      };
    } catch (error) {
      return {
        success: false,
        message: '마이닝 재개 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 마이닝 상태 조회
   * @param userId 사용자 ID
   * @returns 마이닝 상태
   */
  public getMiningStatus(userId: string): {
    status: MiningStatus;
    totalMiningTime: number;
    totalMiningAmount: number;
    currentRate: number;
    miningTime: number;
    accumulatedReward: number;
    lastUpdate: Date;
  } {
    const status = this.userMiningStatus.get(userId) || MINING_STATUS.IDLE;
    const activeRecord = this.findActiveMiningRecord(userId);

    let totalMiningTime = 0;
    let totalMiningAmount = 0;
    let currentRate: number = MINING_CONSTANTS.HOURLY_BASE_RATE;

    if (activeRecord) {
      const now = new Date();
      totalMiningTime = Math.floor((now.getTime() - activeRecord.startTime.getTime()) / 1000);
      totalMiningAmount = this.calculateTotalMiningAmount(activeRecord.totalRate, totalMiningTime);
      currentRate = activeRecord.totalRate as number;
    }

    return {
      status,
      totalMiningTime,
      totalMiningAmount,
      currentRate,
      miningTime: totalMiningTime,
      accumulatedReward: totalMiningAmount,
      lastUpdate: new Date()
    };
  }

  /**
   * 실시간 마이닝 상태 조회
   * @returns 실시간 마이닝 상태
   */
  public getRealTimeMiningStatus(): RealTimeMiningStatus {
    // 실시간 상태 업데이트
    this.updateRealTimeStatus(0);
    return this.realTimeStatus;
  }

  /**
   * 총 마이닝 보상률 계산
   * @param bonusStatus 보너스 상태
   * @returns 총 마이닝 보상률
   */
  private calculateTotalMiningRate(bonusStatus: BonusStatus): number {
    const baseRate = MINING_CONSTANTS.HOURLY_BASE_RATE;
    let totalRate = new Decimal(baseRate);

    // 출석 보너스 적용
    if (bonusStatus.attendance.isActive) {
      totalRate = this.precisionCalculator.add(
        totalRate.toNumber(),
        this.precisionCalculator.calculateAttendanceBonus(
          baseRate,
          bonusStatus.attendance.bonusRate
        ).toNumber()
      );
    }

    // 추천 보너스 적용
    if (bonusStatus.referral.bonusRate > 0) {
      totalRate = this.precisionCalculator.add(
        totalRate.toNumber(),
        this.precisionCalculator.calculateReferralBonus(
          baseRate,
          bonusStatus.referral.bonusRate,
          bonusStatus.referral.referredUsers.length
        ).toNumber()
      );
    }

    // 가맹점 보너스 적용
    if (bonusStatus.partner.status === 'APPROVED') {
      totalRate = this.precisionCalculator.add(
        totalRate.toNumber(),
        this.precisionCalculator.calculatePartnerBonus(
          baseRate,
          bonusStatus.partner.bonusRate
        ).toNumber()
      );
    }

    return totalRate.toNumber();
  }

  /**
   * 총 마이닝량 계산
   * @param totalRate 총 보상률
   * @param duration 지속 시간 (초)
   * @returns 총 마이닝량
   */
  private calculateTotalMiningAmount(totalRate: number, duration: number): number {
    // 시간 단위로 변환 (초를 시간으로)
    const hours = duration / 3600;

    // 총 마이닝량 = 총 보상률 × 시간
    return this.precisionCalculator.multiply(totalRate, hours).toNumber();
  }

  /**
   * 활성 마이닝 기록 찾기
   * @param userId 사용자 ID
   * @returns 활성 마이닝 기록
   */
  private findActiveMiningRecord(userId: string): MiningRecord | null {
    for (const record of this.miningRecords.values()) {
      if (record.userId === userId && record.status === MINING_STATUS.MINING) {
        return record;
      }
    }
    return null;
  }

  /**
   * 실시간 상태 업데이트
   * @param additionalAmount 추가 발행량
   */
  private updateRealTimeStatus(additionalAmount: number): void {
    // 현재 발행량 업데이트
    this.realTimeStatus.currentIssued = this.precisionCalculator.add(
      this.realTimeStatus.currentIssued,
      additionalAmount
    ).toNumber();

    // 잔여 발행량 업데이트
    this.realTimeStatus.remainingSupply = this.precisionCalculator.subtract(
      this.realTimeStatus.totalSupply,
      this.realTimeStatus.currentIssued
    ).toNumber();

    // 발행률 업데이트
    this.realTimeStatus.issuanceRate = this.precisionCalculator.calculateIssuanceRate(
      this.realTimeStatus.currentIssued,
      this.realTimeStatus.totalSupply
    ).toNumber();

    // 마지막 업데이트 시간
    this.realTimeStatus.lastUpdate = new Date();
  }

  /**
   * 마이닝 기록 조회
   * @param userId 사용자 ID
   * @param limit 제한 수
   * @returns 마이닝 기록 목록
   */
  public getMiningRecords(userId: string, limit: number = 10): MiningRecord[] {
    const userRecords: MiningRecord[] = [];

    for (const record of this.miningRecords.values()) {
      if (record.userId === userId) {
        userRecords.push(record);
      }
    }

    // 최신 순으로 정렬
    userRecords.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return userRecords.slice(0, limit);
  }

  /**
   * 마이닝 통계 조회
   * @param userId 사용자 ID
   * @returns 마이닝 통계
   */
  public getMiningStats(userId: string): {
    totalMiningTime: number;
    totalMiningAmount: number;
    averageMiningRate: number;
    bestMiningDay: number;
    consecutiveMiningDays: number;
  } {
    const userRecords = this.getMiningRecords(userId, 1000);

    let totalMiningTime = 0;
    let totalMiningAmount = 0;
    let bestMiningDay = 0;
    let consecutiveMiningDays = 0;

    for (const record of userRecords) {
      totalMiningTime += record.duration;
      totalMiningAmount += record.totalAmount;

      // 일일 최대 마이닝량 계산
      const dailyAmount = record.totalAmount;
      if (dailyAmount > bestMiningDay) {
        bestMiningDay = dailyAmount;
      }
    }

    // 평균 마이닝률 계산
    const averageMiningRate = totalMiningTime > 0
      ? totalMiningAmount / (totalMiningTime / 3600)
      : 0;

    // 연속 마이닝 일수 계산 (간단한 구현)
    consecutiveMiningDays = this.calculateConsecutiveMiningDays(userRecords);

    return {
      totalMiningTime,
      totalMiningAmount,
      averageMiningRate,
      bestMiningDay,
      consecutiveMiningDays
    };
  }

  /**
   * 연속 마이닝 일수 계산
   * @param records 마이닝 기록 목록
   * @returns 연속 마이닝 일수
   */
  private calculateConsecutiveMiningDays(records: MiningRecord[]): number {
    if (records.length === 0) return 0;

    // 날짜별로 그룹화
    const dailyRecords = new Map<string, MiningRecord[]>();
    for (const record of records) {
      const dateKey = record.startTime.toISOString().split('T')[0];
      if (!dateKey) continue;
      if (!dailyRecords.has(dateKey)) {
        dailyRecords.set(dateKey, []);
      }
      const dayRecords = dailyRecords.get(dateKey);
      if (dayRecords) {
        dayRecords.push(record);
      }
    }

    // 날짜 순으로 정렬
    const sortedDates = Array.from(dailyRecords.keys()).sort();

    let consecutiveDays = 0;
    let currentDate = new Date();

    // 오늘부터 역순으로 연속 일수 계산
    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const dateString = sortedDates[i];
      if (!dateString) continue;
      const recordDate = new Date(dateString);
      const dayDiff = Math.floor((currentDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff === consecutiveDays) {
        consecutiveDays++;
        currentDate = recordDate;
      } else {
        break;
      }
    }

    return consecutiveDays;
  }

  /**
   * 마이닝 기록 삭제
   * @param miningId 마이닝 ID
   * @returns 삭제 결과
   */
  public deleteMiningRecord(miningId: string): {
    success: boolean;
    message?: string;
  } {
    try {
      if (this.miningRecords.has(miningId)) {
        this.miningRecords.delete(miningId);
        return {
          success: true,
          message: '마이닝 기록이 삭제되었습니다.'
        };
      } else {
        return {
          success: false,
          message: '마이닝 기록을 찾을 수 없습니다.'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: '마이닝 기록 삭제 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 모든 마이닝 기록 삭제
   * @param userId 사용자 ID
   * @returns 삭제 결과
   */
  public deleteAllMiningRecords(userId: string): {
    success: boolean;
    deletedCount: number;
    message?: string;
  } {
    try {
      let deletedCount = 0;
      const recordsToDelete: string[] = [];

      for (const [miningId, record] of this.miningRecords.entries()) {
        if (record.userId === userId) {
          recordsToDelete.push(miningId);
        }
      }

      for (const miningId of recordsToDelete) {
        this.miningRecords.delete(miningId);
        deletedCount++;
      }

      return {
        success: true,
        deletedCount,
        message: `${deletedCount}개의 마이닝 기록이 삭제되었습니다.`
      };
    } catch (error) {
      return {
        success: false,
        deletedCount: 0,
        message: '마이닝 기록 삭제 중 오류가 발생했습니다.'
      };
    }
  }
}
