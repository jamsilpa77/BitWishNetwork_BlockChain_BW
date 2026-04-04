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
import { AttendanceRecord, AttendanceStatus, Language } from '@/types';

/**
 * 출석 보너스 서비스 - 완벽한 독립성 보장
 * 출석 체크, 보너스율 계산, 출석 기록 관리
 */
export class AttendanceBonusService {
  private precisionCalculator: any;
  private languageManager: any;
  private currentLanguage: Language;
  private attendanceRecords: AttendanceRecord[];
  private bonusRate: number;
  private isInitialized: boolean;

  constructor() {
    this.precisionCalculator = null;
    this.languageManager = null;
    this.currentLanguage = 'ko';
    this.attendanceRecords = [];
    this.bonusRate = 0;
    this.isInitialized = false;
  }

  /**
   * 서비스 초기화
   */
  public initializeService(): void {
    try {
      if (this.isInitialized) {
        console.warn('출석 보너스 서비스가 이미 초기화되었습니다.');
        return;
      }

      // 언어 설정
      this.currentLanguage = (localStorage.getItem('bw-language') as Language) || 'ko';

      // 출석 기록 로드
      this.loadAttendanceRecords();

      // 보너스율 계산
      this.calculateBonusRate();

      this.isInitialized = true;
      console.log('출석 보너스 서비스 초기화 완료');
    } catch (error) {
      console.error('출석 보너스 서비스 초기화 오류:', error);
    }
  }

  /**
   * 출석 기록 로드
   */
  private loadAttendanceRecords(): void {
    try {
      const savedRecords = localStorage.getItem('bw-attendance-records');
      if (savedRecords) {
        this.attendanceRecords = JSON.parse(savedRecords);
      }
    } catch (error) {
      console.error('출석 기록 로드 오류:', error);
      this.attendanceRecords = [];
    }
  }

  /**
   * 출석 기록 저장
   */
  private saveAttendanceRecords(): void {
    try {
      localStorage.setItem('bw-attendance-records', JSON.stringify(this.attendanceRecords));
    } catch (error) {
      console.error('출석 기록 저장 오류:', error);
    }
  }

  /**
   * 출석 가능 시간 확인
   */
  public isAttendanceAvailable(): boolean {
    try {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const second = now.getSeconds();

      // 출석 가능 시간: 오전 9시 ~ 다음날 오전 8시 59분 59초
      return (hour >= 9) || (hour < 8 || (hour === 8 && minute === 59 && second === 59));
    } catch (error) {
      console.error('출석 가능 시간 확인 오류:', error);
      return false;
    }
  }

  /**
   * 출석 체크
   */
  public checkAttendance(): boolean {
    try {
      if (!this.isAttendanceAvailable()) {
        return false;
      }

      const today = new Date();
      const todayStr = today.toDateString();

      // 중복 출석 체크 방지
      const existingRecord = this.attendanceRecords.find(record =>
        new Date(record.date).toDateString() === todayStr
      );

      if (existingRecord) {
        return false;
      }

      // 출석 기록 생성
      const todayDateStr: string = today.toISOString().split('T')[0] as string;
      const newRecord: AttendanceRecord = {
        id: `attendance_${Date.now()}`,
        userId: 'current_user',
        date: todayDateStr,
        checkTime: new Date(today),
        bonusRate: 0.05, // 5% 보너스
        bonusAmount: 0,
        status: 'COMPLETED',
        createdAt: new Date(today),
        isCompleted: true,
        timestamp: new Date().toISOString()
      };

      // 출석 기록 저장
      this.attendanceRecords.push(newRecord);
      this.saveAttendanceRecords();

      // 보너스율 업데이트
      this.calculateBonusRate();

      return true;
    } catch (error) {
      console.error('출석 체크 오류:', error);
      return false;
    }
  }

  /**
   * 보너스율 계산
   */
  public calculateBonusRate(): number {
    try {
      const today = new Date();
      const todayStr = today.toDateString();

      // 오늘 출석 체크 여부 확인
      const todayRecord = this.attendanceRecords.find(record =>
        new Date(record.date).toDateString() === todayStr
      );

      if (todayRecord && todayRecord.status === 'COMPLETED') {
        this.bonusRate = 0.05; // 5% 보너스
      } else {
        this.bonusRate = 0.00; // 0% 보너스
      }

      return this.bonusRate;
    } catch (error) {
      console.error('보너스율 계산 오류:', error);
      return 0;
    }
  }

  /**
   * 보너스율 포맷팅 (8자리)
   */
  public formatBonusRate(): string {
    try {
      const decimal = new Decimal(this.bonusRate);
      const formatted = decimal.toFixed(8);
      return `${formatted}%`;
    } catch (error) {
      console.error('보너스율 포맷팅 오류:', error);
      return '0.00000000%';
    }
  }

  /**
   * 월별 출석 일수 계산
   */
  public getMonthlyAttendanceCount(): number {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      const monthlyRecords = this.attendanceRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === currentMonth &&
          recordDate.getFullYear() === currentYear;
      });

      return monthlyRecords.length;
    } catch (error) {
      console.error('월별 출석 일수 계산 오류:', error);
      return 0;
    }
  }

  /**
   * 출석 상태 확인
   */
  public getAttendanceStatus(): AttendanceStatus {
    try {
      if (this.isAttendanceAvailable()) {
        return 'AVAILABLE';
      } else {
        return 'EXPIRED';
      }
    } catch (error) {
      console.error('출석 상태 확인 오류:', error);
      return 'EXPIRED';
    }
  }

  /**
   * 출석 통계 조회
   */
  public getAttendanceStats(): {
    isActive: boolean;
    totalAttendanceDays: number;
    consecutiveDays: number;
    bonusRate: number;
  } {
    try {
      const totalDays = this.attendanceRecords.length;
      const consecutiveDays = this.calculateConsecutiveDays();
      const isActive = this.isAttendanceAvailable();

      return {
        isActive,
        totalAttendanceDays: totalDays,
        consecutiveDays,
        bonusRate: this.bonusRate
      };
    } catch (error) {
      console.error('출석 통계 조회 오류:', error);
      return {
        isActive: false,
        totalAttendanceDays: 0,
        consecutiveDays: 0,
        bonusRate: 0
      };
    }
  }

  /**
   * 연속 출석일 계산
   */
  private calculateConsecutiveDays(): number {
    try {
      if (this.attendanceRecords.length === 0) return 0;

      const sortedRecords = [...this.attendanceRecords].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      let consecutiveDays = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < sortedRecords.length; i++) {
        const record = sortedRecords[i];
        if (!record || !record.date) continue;

        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);

        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);

        if (recordDate.getTime() === expectedDate.getTime()) {
          consecutiveDays++;
        } else {
          break;
        }
      }

      return consecutiveDays;
    } catch (error) {
      console.error('연속 출석일 계산 오류:', error);
      return 0;
    }
  }

  /**
   * 출석 보너스 적용
   */
  public applyAttendanceBonus(): { success: boolean; message: string } {
    try {
      if (!this.isAttendanceAvailable()) {
        return {
          success: false,
          message: '출석 가능 시간이 아닙니다.'
        };
      }

      const today: string = new Date().toISOString().split('T')[0] as string;
      const existingRecord = this.attendanceRecords.find(record =>
        record.date === today
      );

      if (existingRecord) {
        return {
          success: false,
          message: '이미 출석 체크를 완료했습니다.'
        };
      }

      const newRecord: AttendanceRecord = {
        id: `attendance_${Date.now()}`,
        userId: 'current_user',
        date: today,
        isCompleted: true,
        bonusRate: 0.05,
        timestamp: new Date().toISOString()
      };

      this.attendanceRecords.push(newRecord);
      this.saveAttendanceRecords();
      this.calculateBonusRate();

      return {
        success: true,
        message: '출석 체크가 완료되었습니다.'
      };
    } catch (error) {
      console.error('출석 보너스 적용 오류:', error);
      return {
        success: false,
        message: '출석 체크 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 출석 기록 조회
   */
  public getAttendanceRecords(): AttendanceRecord[] {
    try {
      return [...this.attendanceRecords];
    } catch (error) {
      console.error('출석 기록 조회 오류:', error);
      return [];
    }
  }

  /**
   * 서비스 정리
   */
  public cleanup(): void {
    try {
      this.attendanceRecords = [];
      this.bonusRate = 0;
      this.isInitialized = false;
    } catch (error) {
      console.error('서비스 정리 오류:', error);
    }
  }
}