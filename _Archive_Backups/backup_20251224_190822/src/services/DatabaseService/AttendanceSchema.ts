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

import { Decimal } from 'decimal.js';
import { AttendanceRecord, AttendanceStatus, Language } from '@/types';

/**
 * 출석 스키마 인터페이스
 */
export interface AttendanceSchema {
  id: string;
  userId: string;
  date: Date;
  checkTime: Date;
  bonusRate: number;
  bonusAmount: number;
  status: AttendanceStatus;
  createdAt: Date;
  updatedAt: Date;
  language: Language;
  timezone: string;
  deviceInfo: string;
  ipAddress: string;
  securityHash: string;
}

/**
 * 월별 출석 통계 스키마
 */
export interface MonthlyAttendanceSchema {
  id: string;
  userId: string;
  year: number;
  month: number;
  totalDays: number;
  attendedDays: number;
  attendanceRate: number;
  totalBonus: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 출석 보너스 이력 스키마
 */
export interface AttendanceBonusHistorySchema {
  id: string;
  userId: string;
  attendanceId: string;
  bonusRate: number;
  bonusAmount: number;
  appliedAt: Date;
  status: 'PENDING' | 'APPLIED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 출석 스키마 서비스 - 완벽한 독립성 보장
 * MongoDB 스키마 정의, 데이터 검증, 스키마 관리
 */
export class AttendanceSchemaService {
  private isInitialized: boolean;
  private currentLanguage: Language;

  constructor() {
    this.isInitialized = false;
    this.currentLanguage = 'ko';
  }

  /**
   * 스키마 서비스 초기화
   */
  public initializeSchemaService(): void {
    try {
      if (this.isInitialized) {
        console.warn('출석 스키마 서비스가 이미 초기화되었습니다.');
        return;
      }

      // 언어 설정
      this.currentLanguage = (localStorage.getItem('bw-language') as Language) || 'ko';
      
      this.isInitialized = true;
      console.log('출석 스키마 서비스 초기화 완료');
    } catch (error) {
      console.error('출석 스키마 서비스 초기화 오류:', error);
    }
  }

  /**
   * 출석 기록 스키마 생성
   */
  public createAttendanceRecord(record: AttendanceRecord): AttendanceSchema {
    try {
      const now = new Date();
      const securityHash = this.generateSecurityHash(record);
      
      const schema: AttendanceSchema = {
        id: record.id,
        userId: record.userId || '',
        date: new Date(record.date),
        checkTime: record.checkTime || new Date(),
        bonusRate: record.bonusRate || 0,
        bonusAmount: record.bonusAmount || 0,
        status: record.status || 'AVAILABLE',
        createdAt: record.createdAt || new Date(),
        updatedAt: now,
        language: this.currentLanguage,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        deviceInfo: navigator.userAgent,
        ipAddress: 'localhost', // 실제로는 IP 주소
        securityHash: securityHash
      };
      
      return schema;
    } catch (error) {
      console.error('출석 기록 스키마 생성 오류:', error);
      throw error;
    }
  }

  /**
   * 월별 출석 통계 스키마 생성
   */
  public createMonthlyAttendanceSchema(
    userId: string,
    year: number,
    month: number,
    totalDays: number,
    attendedDays: number
  ): MonthlyAttendanceSchema {
    try {
      const attendanceRate = totalDays > 0 ? (attendedDays / totalDays) : 0;
      const totalBonus = this.calculateTotalBonus(attendedDays);
      
      const schema: MonthlyAttendanceSchema = {
        id: `monthly_${userId}_${year}_${month}`,
        userId: userId,
        year: year,
        month: month,
        totalDays: totalDays,
        attendedDays: attendedDays,
        attendanceRate: attendanceRate,
        totalBonus: totalBonus,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return schema;
    } catch (error) {
      console.error('월별 출석 통계 스키마 생성 오류:', error);
      throw error;
    }
  }

  /**
   * 출석 보너스 이력 스키마 생성
   */
  public createAttendanceBonusHistorySchema(
    userId: string,
    attendanceId: string,
    bonusRate: number,
    bonusAmount: number
  ): AttendanceBonusHistorySchema {
    try {
      const schema: AttendanceBonusHistorySchema = {
        id: `bonus_${Date.now()}`,
        userId: userId,
        attendanceId: attendanceId,
        bonusRate: bonusRate,
        bonusAmount: bonusAmount,
        appliedAt: new Date(),
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return schema;
    } catch (error) {
      console.error('출석 보너스 이력 스키마 생성 오류:', error);
      throw error;
    }
  }

  /**
   * 보안 해시 생성
   */
  private generateSecurityHash(record: AttendanceRecord): string {
    try {
      const data = `${record.id}_${record.userId}_${new Date(record.date).getTime()}_${(record.checkTime || new Date()).getTime()}`;
      return btoa(data); // Base64 인코딩
    } catch (error) {
      console.error('보안 해시 생성 오류:', error);
      return '';
    }
  }

  /**
   * 총 보너스 계산
   */
  private calculateTotalBonus(attendedDays: number): number {
    try {
      const dailyBonus = 0.05; // 5% 보너스
      const decimal = new Decimal(attendedDays).mul(dailyBonus);
      return decimal.toNumber();
    } catch (error) {
      console.error('총 보너스 계산 오류:', error);
      return 0;
    }
  }

  /**
   * 스키마 유효성 검증
   */
  public validateSchema(schema: any): boolean {
    try {
      if (!schema || typeof schema !== 'object') {
        return false;
      }
      
      // 필수 필드 검증
      const requiredFields = ['id', 'userId', 'date', 'status'];
      for (const field of requiredFields) {
        if (!schema[field]) {
          return false;
        }
      }
      
      // 날짜 유효성 검증
      if (schema.date && isNaN(new Date(schema.date).getTime())) {
        return false;
      }
      
      // 보너스율 검증 (0-5% 범위)
      if (schema.bonusRate && (schema.bonusRate < 0 || schema.bonusRate > 0.05)) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('스키마 유효성 검증 오류:', error);
      return false;
    }
  }

  /**
   * 정리
   */
  public cleanup(): void {
    try {
      this.isInitialized = false;
    } catch (error) {
      console.error('출석 스키마 서비스 정리 오류:', error);
    }
  }
}
