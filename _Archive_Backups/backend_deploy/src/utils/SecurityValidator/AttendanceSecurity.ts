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
 * 출석 보안 검증자 - 완벽한 독립성 보장
 * 출석 보안 검증, 부정 출석 방지, 데이터 무결성 보장
 */
export class AttendanceSecurityValidator {
  private isInitialized: boolean;
  private currentLanguage: Language;
  private securityRules: Map<string, any>;
  private maxAttempts: number;
  private attemptCount: number;

  constructor() {
    this.isInitialized = false;
    this.currentLanguage = 'ko';
    this.securityRules = new Map();
    this.maxAttempts = 5;
    this.attemptCount = 0;
  }

  /**
   * 보안 검증자 초기화
   */
  public initializeSecurityValidator(): void {
    try {
      if (this.isInitialized) {
        console.warn('출석 보안 검증자가 이미 초기화되었습니다.');
        return;
      }

      // 언어 설정
      this.currentLanguage = (localStorage.getItem('bw-language') as Language) || 'ko';
      
      // 보안 규칙 설정
      this.setupSecurityRules();
      
      this.isInitialized = true;
      console.log('출석 보안 검증자 초기화 완료');
    } catch (error) {
      console.error('출석 보안 검증자 초기화 오류:', error);
    }
  }

  /**
   * 보안 규칙 설정
   */
  private setupSecurityRules(): void {
    try {
      // 출석 시간 제한
      this.securityRules.set('attendanceTimeLimit', {
        startHour: 9,
        endHour: 8,
        endMinute: 59,
        endSecond: 59
      });
      
      // 최대 출석 시도 횟수
      this.securityRules.set('maxAttempts', 5);
      
      // 보너스율 제한
      this.securityRules.set('bonusRateLimit', {
        min: 0,
        max: 0.05
      });
      
      // 시간 조작 감지 임계값
      this.securityRules.set('timeManipulationThreshold', 3600000); // 1시간
      
      // 중복 출석 방지
      this.securityRules.set('preventDuplicateAttendance', true);
      
      // 보안 해시 검증
      this.securityRules.set('validateSecurityHash', true);
    } catch (error) {
      console.error('보안 규칙 설정 오류:', error);
    }
  }

  /**
   * 출석 시간 검증
   */
  public validateAttendanceTime(): boolean {
    try {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const second = now.getSeconds();
      
      const timeLimit = this.securityRules.get('attendanceTimeLimit');
      
      // 출석 가능 시간: 오전 9시 ~ 다음날 오전 8시 59분 59초
      const isAvailable = (hour >= timeLimit.startHour) || 
                         (hour < timeLimit.endHour || 
                          (hour === timeLimit.endHour && 
                           minute === timeLimit.endMinute && 
                           second === timeLimit.endSecond));
      
      return isAvailable;
    } catch (error) {
      console.error('출석 시간 검증 오류:', error);
      return false;
    }
  }

  /**
   * 중복 출석 방지
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
   * 시간 조작 감지
   */
  public detectTimeManipulation(record: AttendanceRecord): boolean {
    try {
      const now = new Date();
      const recordTime = new Date(record.checkTime || new Date());
      const timeDiff = Math.abs(now.getTime() - recordTime.getTime());
      
      const threshold = this.securityRules.get('timeManipulationThreshold');
      
      // 1시간 이상 차이나면 의심
      if (timeDiff > threshold) {
        console.warn('시간 조작이 감지되었습니다.');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('시간 조작 감지 오류:', error);
      return true;
    }
  }

  /**
   * 보너스율 검증
   */
  public validateBonusRate(rate: number): boolean {
    try {
      const bonusLimit = this.securityRules.get('bonusRateLimit');
      
      if (rate < bonusLimit.min || rate > bonusLimit.max) {
        console.warn('보너스율이 허용 범위를 벗어났습니다.');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('보너스율 검증 오류:', error);
      return false;
    }
  }

  /**
   * 보안 해시 검증
   */
  public validateSecurityHash(record: AttendanceRecord): boolean {
    try {
      const expectedHash = this.generateSecurityHash(record);
      
      if ((record as any).securityHash && (record as any).securityHash !== expectedHash) {
        console.warn('보안 해시가 일치하지 않습니다.');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('보안 해시 검증 오류:', error);
      return false;
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
   * 출석 시도 횟수 검증
   */
  public validateAttemptCount(): boolean {
    try {
      this.attemptCount++;
      
      if (this.attemptCount > this.maxAttempts) {
        console.warn('최대 출석 시도 횟수를 초과했습니다.');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('출석 시도 횟수 검증 오류:', error);
      return false;
    }
  }

  /**
   * 종합 보안 검증
   */
  public performComprehensiveSecurityCheck(record: AttendanceRecord, records: AttendanceRecord[]): boolean {
    try {
      // 1. 출석 시간 검증
      if (!this.validateAttendanceTime()) {
        console.warn('출석 가능 시간이 아닙니다.');
        return false;
      }
      
      // 2. 중복 출석 방지
      if (!this.validateDuplicateAttendance(records, new Date(record.date))) {
        console.warn('중복 출석이 감지되었습니다.');
        return false;
      }
      
      // 3. 시간 조작 감지
      if (this.detectTimeManipulation(record)) {
        console.warn('시간 조작이 감지되었습니다.');
        return false;
      }
      
      // 4. 보너스율 검증
      if (!this.validateBonusRate(record.bonusRate)) {
        console.warn('보너스율이 유효하지 않습니다.');
        return false;
      }
      
      // 5. 보안 해시 검증
      if (!this.validateSecurityHash(record)) {
        console.warn('보안 해시가 유효하지 않습니다.');
        return false;
      }
      
      // 6. 출석 시도 횟수 검증
      if (!this.validateAttemptCount()) {
        console.warn('출석 시도 횟수가 초과되었습니다.');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('종합 보안 검증 오류:', error);
      return false;
    }
  }

  /**
   * 보안 로그 기록
   */
  public logSecurityEvent(event: string, details: any): void {
    try {
      const securityLog = {
        event: event,
        details: details,
        timestamp: new Date(),
        userId: 'current_user',
        language: this.currentLanguage
      };
      
      console.log('보안 이벤트:', securityLog);
    } catch (error) {
      console.error('보안 로그 기록 오류:', error);
    }
  }

  /**
   * 정리
   */
  public cleanup(): void {
    try {
      this.isInitialized = false;
      this.securityRules.clear();
      this.attemptCount = 0;
    } catch (error) {
      console.error('출석 보안 검증자 정리 오류:', error);
    }
  }
}
