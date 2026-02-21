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

import { Decimal } from 'decimal.js';
import { AttendanceRecord, AttendanceStatus } from '@/types';

/**
 * 출석 검증 유틸리티 - 완벽한 독립성 보장
 * 출석 시간 검증, 중복 체크, 보안 검증
 */
export class AttendanceValidator {
  private precisionCalculator: any;
  private isInitialized: boolean;

  constructor() {
    this.precisionCalculator = null;
    this.isInitialized = false;
  }

  /**
   * 검증기 초기화
   */
  public initializeValidator(): void {
    try {
      if (this.isInitialized) {
        console.warn('출석 검증기가 이미 초기화되었습니다.');
        return;
      }

      this.isInitialized = true;
      console.log('출석 검증기 초기화 완료');
    } catch (error) {
      console.error('출석 검증기 초기화 오류:', error);
    }
  }

  /**
   * 출석 가능 시간 검증
   */
  public validateAttendanceTime(): boolean {
    try {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const second = now.getSeconds();

      // 출석 가능 시간: 오전 9시 ~ 다음날 오전 8시 59분 59초
      const isAvailable = (hour >= 9) || (hour < 8 || (hour === 8 && minute === 59 && second === 59));

      return isAvailable;
    } catch (error) {
      console.error('출석 시간 검증 오류:', error);
      return false;
    }
  }

  /**
   * 중복 출석 체크 방지
   */
  public validateDuplicateAttendance(records: AttendanceRecord[], targetDate: Date): boolean {
    try {
      const targetDateStr = targetDate.toDateString();

      const existingRecord = records.find(record =>
        new Date(record.date).toDateString() === targetDateStr
      );

      return !existingRecord; // 중복이 없으면 true
    } catch (error) {
      console.error('중복 출석 검증 오류:', error);
      return false;
    }
  }

  /**
   * 출석 기록 유효성 검증
   */
  public validateAttendanceRecord(record: AttendanceRecord): boolean {
    try {
      // 필수 필드 검증
      if (!record.id || !record.userId || !record.date || !record.status) {
        return false;
      }

      // 날짜 유효성 검증
      const recordDate = new Date(record.date);
      if (isNaN(recordDate.getTime())) {
        return false;
      }

      // 보너스율 검증 (0-5% 범위)
      if (record.bonusRate < 0 || record.bonusRate > 0.05) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('출석 기록 유효성 검증 오류:', error);
      return false;
    }
  }

  /**
   * 보너스율 계산 검증
   */
  public validateBonusRate(rate: number): boolean {
    try {
      const decimal = new Decimal(rate);

      // 0-5% 범위 검증
      if (decimal.lt(0) || decimal.gt(0.05)) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('보너스율 검증 오류:', error);
      return false;
    }
  }

  /**
   * 날짜 상태 검증
   */
  public validateDateStatus(date: Date, records: AttendanceRecord[]): AttendanceStatus {
    try {
      const dateStr = date.toDateString();
      const record = records.find(r =>
        new Date(r.date).toDateString() === dateStr
      );

      if (record && record.status === 'COMPLETED') {
        return 'COMPLETED'; // 빨간색 - 출석 완료
      }

      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const isPast = date < now;

      if (isToday) {
        return this.validateAttendanceTime() ? 'AVAILABLE' : 'EXPIRED';
      }

      if (isPast) {
        return 'EXPIRED'; // 회색 - 출석 기회 상실
      }

      return 'FUTURE'; // 미래 날짜
    } catch (error) {
      console.error('날짜 상태 검증 오류:', error);
      return 'EXPIRED';
    }
  }

  /**
   * 보안 검증
   */
  public validateSecurity(record: AttendanceRecord): boolean {
    try {
      // 시간 조작 방지
      const now = new Date();
      const recordTime = new Date(record.checkTime || new Date());
      const timeDiff = Math.abs(now.getTime() - recordTime.getTime());

      // 1시간 이상 차이나면 의심
      if (timeDiff > 3600000) { // 1시간
        return false;
      }

      // 사용자 ID 검증
      if (!record.userId || record.userId.length < 3) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('보안 검증 오류:', error);
      return false;
    }
  }

  /**
   * 검증기 정리
   */
  public cleanup(): void {
    try {
      this.isInitialized = false;
    } catch (error) {
      console.error('검증기 정리 오류:', error);
    }
  }
}