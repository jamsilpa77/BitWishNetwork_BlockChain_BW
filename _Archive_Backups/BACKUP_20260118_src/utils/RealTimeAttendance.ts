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
 * 실시간 출석 유틸리티 - 완벽한 독립성 보장
 * 실시간 출석 상태 동기화, 보너스율 업데이트, 출석 기록 실시간 관리
 */
export class RealTimeAttendance {
  private attendanceRecords: AttendanceRecord[];
  private bonusRate: number;
  private attendanceStatus: AttendanceStatus;
  private monthlyAttendance: number;
  private currentLanguage: Language;
  private syncInterval: NodeJS.Timeout | null;
  private isRunning: boolean;
  private isInitialized: boolean;

  constructor() {
    this.attendanceRecords = [];
    this.bonusRate = 0;
    this.attendanceStatus = 'AVAILABLE';
    this.monthlyAttendance = 0;
    this.currentLanguage = 'ko';
    this.syncInterval = null;
    this.isRunning = false;
    this.isInitialized = false;
  }

  /**
   * 실시간 출석 초기화
   */
  public initializeRealTimeAttendance(): void {
    try {
      if (this.isInitialized) {
        console.warn('실시간 출석이 이미 초기화되었습니다.');
        return;
      }

      // 언어 설정
      this.currentLanguage = (localStorage.getItem('bw-language') as Language) || 'ko';

      // 출석 기록 로드
      this.loadAttendanceRecords();

      // 초기 상태 설정
      this.updateAttendanceStatus();
      this.calculateBonusRate();
      this.calculateMonthlyAttendance();

      this.isInitialized = true;
      console.log('실시간 출석 초기화 완료');
    } catch (error) {
      console.error('실시간 출석 초기화 오류:', error);
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
  private isAttendanceAvailable(): boolean {
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
   * 출석 상태 업데이트
   */
  public updateAttendanceStatus(): void {
    try {
      const isAvailable = this.isAttendanceAvailable();
      this.attendanceStatus = isAvailable ? 'AVAILABLE' : 'EXPIRED';
    } catch (error) {
      console.error('출석 상태 업데이트 오류:', error);
      this.attendanceStatus = 'EXPIRED';
    }
  }

  /**
   * 보너스율 계산
   */
  public calculateBonusRate(): void {
    try {
      const today = new Date();
      const todayStr = today.toDateString();

      const todayRecord = this.attendanceRecords.find(record =>
        new Date(record.date).toDateString() === todayStr
      );

      if (todayRecord && todayRecord.status === 'COMPLETED') {
        this.bonusRate = 0.05; // 5% 보너스
      } else {
        this.bonusRate = 0.00; // 0% 보너스
      }
    } catch (error) {
      console.error('보너스율 계산 오류:', error);
      this.bonusRate = 0;
    }
  }

  /**
   * 월별 출석 일수 계산
   */
  public calculateMonthlyAttendance(): void {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      const monthlyRecords = this.attendanceRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === currentMonth &&
          recordDate.getFullYear() === currentYear;
      });

      this.monthlyAttendance = monthlyRecords.length;
    } catch (error) {
      console.error('월별 출석 일수 계산 오류:', error);
      this.monthlyAttendance = 0;
    }
  }

  /**
   * 실시간 동기화 시작
   */
  public startRealTimeSync(): void {
    try {
      if (this.isRunning) {
        console.warn('실시간 동기화가 이미 실행 중입니다.');
        return;
      }

      this.syncInterval = setInterval(() => {
        this.updateAttendanceStatus();
        this.calculateBonusRate();
        this.calculateMonthlyAttendance();
      }, 1000); // 1초마다 실시간 업데이트

      this.isRunning = true;
      console.log('실시간 동기화 시작');
    } catch (error) {
      console.error('실시간 동기화 시작 오류:', error);
    }
  }

  /**
   * 실시간 동기화 중지
   */
  public stopRealTimeSync(): void {
    try {
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }

      this.isRunning = false;
      console.log('실시간 동기화 중지');
    } catch (error) {
      console.error('실시간 동기화 중지 오류:', error);
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
      const newRecord: AttendanceRecord = {
        id: `attendance_${Date.now()}`,
        userId: 'current_user',
        date: today.toISOString().split('T')[0] as string,
        checkTime: today,
        bonusRate: 0.05,
        bonusAmount: 0,
        status: 'COMPLETED',
        createdAt: today,
        isCompleted: true,
        timestamp: today.toISOString()
      };

      // 출석 기록 저장
      this.attendanceRecords.push(newRecord);
      this.saveAttendanceRecords();

      // 상태 업데이트
      this.updateAttendanceStatus();
      this.calculateBonusRate();
      this.calculateMonthlyAttendance();

      return true;
    } catch (error) {
      console.error('출석 체크 오류:', error);
      return false;
    }
  }

  /**
   * 현재 상태 조회
   */
  public getCurrentStatus(): {
    attendanceRecords: AttendanceRecord[];
    bonusRate: number;
    attendanceStatus: AttendanceStatus;
    monthlyAttendance: number;
    isRunning: boolean;
  } {
    return {
      attendanceRecords: [...this.attendanceRecords],
      bonusRate: this.bonusRate,
      attendanceStatus: this.attendanceStatus,
      monthlyAttendance: this.monthlyAttendance,
      isRunning: this.isRunning
    };
  }

  /**
   * 정리
   */
  public cleanup(): void {
    try {
      this.stopRealTimeSync();
      this.attendanceRecords = [];
      this.bonusRate = 0;
      this.attendanceStatus = 'AVAILABLE';
      this.monthlyAttendance = 0;
      this.isInitialized = false;
    } catch (error) {
      console.error('실시간 출석 정리 오류:', error);
    }
  }
}
