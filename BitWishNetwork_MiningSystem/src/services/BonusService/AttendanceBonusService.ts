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
   * [추가] 지갑 주소별 고유 Storage 키 생성 (독립성 보장)
   */
  private getStorageKey(walletAddress?: string): string {
    if (!walletAddress || walletAddress === 'current_user') return 'bw-attendance-records';
    return `bw-attendance-records-${walletAddress}`;
  }

  /**
   * [추가] 서버(MongoDB) 데이터와 로컬 데이터 강제 동기화
   */
  public async syncWithServer(walletAddress: string): Promise<void> {
    try {
      if (!walletAddress) return;
      const response = await fetch(`/api/attendance/history/${walletAddress}`);
      const data = await response.json();
      if (data.success && data.history) {
        // 서버의 단독 저장소 데이터를 로컬 기록으로 이관
        this.attendanceRecords = data.history.map((h: any) => ({
          ...h,
          isCompleted: true,
          status: 'COMPLETED'
        }));
        this.saveAttendanceRecords(walletAddress); // 분리된 키로 저장
        this.calculateBonusRate();
      }
    } catch (error) {
      console.error('서버 동기화 오류:', error);
    }
  }

  /**
   * [핵심] 논리적 '오늘' 날짜 구하기 (오전 9시 기준)
   * 오전 9시 이전이면 '어제' 날짜를 반환함.
   * 예: 16일 새벽 1시 -> 15일 반환
   */
  private getLogicalToday(): string {
    const now = new Date();
    // 9시 전이면 하루 빼기
    if (now.getHours() < 9) {
      now.setDate(now.getDate() - 1);
    }
    const isoString = now.toISOString();
    return isoString.split('T')[0] || '';
  }

  /**
   * 출석 기록 로드 (지갑 주소 분리)
   */
  public loadAttendanceRecords(walletAddress?: string): void {
    try {
      const key = this.getStorageKey(walletAddress); // 지갑별 키 생성
      const savedRecords = localStorage.getItem(key);
      if (savedRecords) {
        this.attendanceRecords = JSON.parse(savedRecords);
      } else {
        this.attendanceRecords = [];
      }
    } catch (error) {
      console.error('출석 기록 로드 오류:', error);
      this.attendanceRecords = [];
    }
  }

  /**
   * 출석 기록 저장 (지갑 주소 분리)
   */
  private saveAttendanceRecords(walletAddress?: string): void {
    try {
      const key = this.getStorageKey(walletAddress);
      localStorage.setItem(key, JSON.stringify(this.attendanceRecords));
    } catch (error) {
      console.error('출석 기록 저장 오류:', error);
    }
  }

  /**
   * 출석 가능 시간 확인
   * 정책상 오전 9시 ~ 다음날 08:59:59까지가 하루 사이클이므로,
   * 언제 접속하든 그 시점의 '논리적 오늘'에 대해 출석이 가능함.
   * 따라서 항상 true를 반환하되, 이미 했는지가 중요함.
   */
  public isAttendanceAvailable(): boolean {
    return true;
  }

  /**
   * 출석 체크
   */
  public checkAttendance(): boolean {
    try {
      // 1. 논리적 오늘 날짜 구하기 (9시 기준)
      const logicalToday = this.getLogicalToday();

      // 2. 이미 출석했는지 확인
      const existingRecord = this.attendanceRecords.find(record =>
        record.date === logicalToday
      );

      if (existingRecord) {
        return false;
      }

      // 3. 출석 기록 생성
      const now = new Date();
      const newRecord: AttendanceRecord = {
        id: `attendance_${Date.now()}`,
        userId: 'current_user',
        date: logicalToday, // 여기가 핵심: 실제 날짜가 아닌 논리 날짜 저장
        checkTime: now,
        bonusRate: 0.05, // 5% 보너스
        bonusAmount: 0,
        status: 'COMPLETED',
        createdAt: now,
        isCompleted: true,
        timestamp: now.toISOString()
      };

      // 4. 저장
      this.attendanceRecords.push(newRecord);
      this.saveAttendanceRecords();

      // 5. 보너스율 업데이트
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
      const logicalToday = this.getLogicalToday();

      // 오늘(논리적) 출석 체크 여부 확인
      const todayRecord = this.attendanceRecords.find(record =>
        record.date === logicalToday
      );

      if (todayRecord && (todayRecord.status === 'COMPLETED' || todayRecord.isCompleted)) {
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
      // 9시 전이면 지난 달 걸로 칠 수도 있지만,
      // 월별 통계는 대략적인 게 많으므로 단순하게 처리하거나
      // 논리 날짜 기준으로 필터링하는 것이 정확함.
      if (currentDate.getHours() < 9) {
        currentDate.setDate(currentDate.getDate() - 1);
      }

      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      const monthlyRecords = this.attendanceRecords.filter(record => {
        const recordDate = new Date(record.date); // record.date는 YYYY-MM-DD 스트링
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
      const logicalToday = this.getLogicalToday();

      const existingRecord = this.attendanceRecords.find(record =>
        record.date === logicalToday
      );

      if (existingRecord && existingRecord.isCompleted) {
        return 'COMPLETED';
      }

      // 항상 출석은 가능함 (안 했으면)
      return 'AVAILABLE';
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
      const isActive = this.getAttendanceStatus() === 'AVAILABLE';

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

      // 날짜순 내림차순 정렬 (최신순)
      const sortedRecords = [...this.attendanceRecords].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // 배열이 비어있지 않음을 위에서 체크했으므로 0번 인덱스는 안전하다고 가정할 수 있으나
      // TS는 이를 모르므로 옵셔널 체이닝 사용
      const latestRecord = sortedRecords[0];
      if (!latestRecord) return 0;

      let consecutiveDays = 0;

      const logicalTodayStr = this.getLogicalToday();
      const latestRecordDate = latestRecord.date;

      const todayDate = new Date(logicalTodayStr);
      const latestDate = new Date(latestRecordDate);

      // 차이 계산 (일 단위)
      const diffTime = Math.abs(todayDate.getTime() - latestDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // 2일 이상 차이나면 연속 끊김 (오늘:0, 어제:1)
      if (diffDays > 1) return 0;

      // 계산 로직: 최신 레코드부터 하루씩 빼가면서 매칭 확인
      let checkDate = new Date(latestRecordDate);

      for (let i = 0; i < sortedRecords.length; i++) {
        const record = sortedRecords[i];
        if (!record) continue;

        const recordDateStr = record.date;
        const checkDateStr = checkDate.toISOString().split('T')[0];

        if (recordDateStr === checkDateStr) {
          consecutiveDays++;
          // 하루 전으로 이동
          checkDate.setDate(checkDate.getDate() - 1);
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
  public async applyAttendanceBonus(walletAddress?: string): Promise<{ success: boolean; message: string }> {
    try {
      const logicalToday = this.getLogicalToday();

      const existingRecord = this.attendanceRecords.find(record =>
        record.date === logicalToday
      );

      if (existingRecord) {
        return {
          success: false,
          message: '이미 출석 체크를 완료했습니다.'
        };
      }

      const now = new Date();
      const newRecord: AttendanceRecord = {
        id: `attendance_${Date.now()}`,
        userId: 'current_user',
        date: logicalToday,
        isCompleted: true,
        bonusRate: 0.05,
        timestamp: now.toISOString()
      };

      this.attendanceRecords.push(newRecord);
      this.saveAttendanceRecords(walletAddress);
      this.calculateBonusRate();

      // 백엔드 API 호출 (walletAddress가 있을 경우)
      if (walletAddress) {
        try {
          const response = await fetch('/api/attendance/check', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ walletAddress, date: logicalToday })
          });

          // const data = await response.json();
          // console.log('백엔드 저장 결과:', data);
        } catch (apiError) {
          console.error('백엔드 API 호출 오류 (무시됨):', apiError);
          // localStorage는 저장되었으므로 계속 진행
        }
      }

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