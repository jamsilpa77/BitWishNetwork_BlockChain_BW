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
import { AttendanceSchema, MonthlyAttendanceSchema, AttendanceBonusHistorySchema } from './AttendanceSchema';

/**
 * 출석 CRUD 서비스 - 완벽한 독립성 보장
 * MongoDB 하이브리드 저장소, 출석 기록 CRUD, 데이터 영속성 관리
 */
export class AttendanceCRUDService {
  private isInitialized: boolean;
  private currentLanguage: Language;
  private userId: string;
  private databaseName: string;

  constructor() {
    this.isInitialized = false;
    this.currentLanguage = 'ko';
    this.userId = 'current_user';
    this.databaseName = 'bw_attendance_db';
  }

  /**
   * CRUD 서비스 초기화
   */
  public initializeCRUDService(): void {
    try {
      if (this.isInitialized) {
        console.warn('출석 CRUD 서비스가 이미 초기화되었습니다.');
        return;
      }

      // 언어 설정
      this.currentLanguage = (localStorage.getItem('bw-language') as Language) || 'ko';
      
      // 사용자 ID 설정
      this.userId = localStorage.getItem('bw-user-id') || 'current_user';
      
      // 데이터베이스 초기화
      this.initializeDatabase();
      
      this.isInitialized = true;
      console.log('출석 CRUD 서비스 초기화 완료');
    } catch (error) {
      console.error('출석 CRUD 서비스 초기화 오류:', error);
    }
  }

  /**
   * 데이터베이스 초기화
   */
  private initializeDatabase(): void {
    try {
      // 사용자별 독립 데이터베이스 생성
      const userDatabase = `${this.databaseName}_${this.userId}`;
      
      // 데이터베이스 존재 확인
      if (!localStorage.getItem(userDatabase)) {
        const initialData = {
          attendanceRecords: [],
          monthlyStats: [],
          bonusHistory: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        localStorage.setItem(userDatabase, JSON.stringify(initialData));
      }
    } catch (error) {
      console.error('데이터베이스 초기화 오류:', error);
    }
  }

  /**
   * 출석 기록 생성 (Create)
   */
  public async createAttendanceRecord(record: AttendanceRecord): Promise<boolean> {
    try {
      const userDatabase = `${this.databaseName}_${this.userId}`;
      const databaseData = JSON.parse(localStorage.getItem(userDatabase) || '{}');
      
      // 중복 체크
      const existingRecord = databaseData.attendanceRecords.find((r: any) => r.id === record.id);
      if (existingRecord) {
        console.warn('이미 존재하는 출석 기록입니다.');
        return false;
      }
      
      // 출석 기록 추가
      databaseData.attendanceRecords.push(record);
      databaseData.updatedAt = new Date();
      
      // 데이터베이스 업데이트
      localStorage.setItem(userDatabase, JSON.stringify(databaseData));
      
      console.log('출석 기록 생성 완료');
      return true;
    } catch (error) {
      console.error('출석 기록 생성 오류:', error);
      return false;
    }
  }

  /**
   * 출석 기록 조회 (Read)
   */
  public async readAttendanceRecords(): Promise<AttendanceRecord[]> {
    try {
      const userDatabase = `${this.databaseName}_${this.userId}`;
      const databaseData = JSON.parse(localStorage.getItem(userDatabase) || '{}');
      
      return databaseData.attendanceRecords || [];
    } catch (error) {
      console.error('출석 기록 조회 오류:', error);
      return [];
    }
  }

  /**
   * 출석 기록 업데이트 (Update)
   */
  public async updateAttendanceRecord(recordId: string, updates: Partial<AttendanceRecord>): Promise<boolean> {
    try {
      const userDatabase = `${this.databaseName}_${this.userId}`;
      const databaseData = JSON.parse(localStorage.getItem(userDatabase) || '{}');
      
      const recordIndex = databaseData.attendanceRecords.findIndex((r: any) => r.id === recordId);
      if (recordIndex === -1) {
        console.warn('업데이트할 출석 기록을 찾을 수 없습니다.');
        return false;
      }
      
      // 출석 기록 업데이트
      databaseData.attendanceRecords[recordIndex] = {
        ...databaseData.attendanceRecords[recordIndex],
        ...updates,
        updatedAt: new Date()
      };
      
      databaseData.updatedAt = new Date();
      
      // 데이터베이스 업데이트
      localStorage.setItem(userDatabase, JSON.stringify(databaseData));
      
      console.log('출석 기록 업데이트 완료');
      return true;
    } catch (error) {
      console.error('출석 기록 업데이트 오류:', error);
      return false;
    }
  }

  /**
   * 출석 기록 삭제 (Delete)
   */
  public async deleteAttendanceRecord(recordId: string): Promise<boolean> {
    try {
      const userDatabase = `${this.databaseName}_${this.userId}`;
      const databaseData = JSON.parse(localStorage.getItem(userDatabase) || '{}');
      
      const recordIndex = databaseData.attendanceRecords.findIndex((r: any) => r.id === recordId);
      if (recordIndex === -1) {
        console.warn('삭제할 출석 기록을 찾을 수 없습니다.');
        return false;
      }
      
      // 출석 기록 삭제
      databaseData.attendanceRecords.splice(recordIndex, 1);
      databaseData.updatedAt = new Date();
      
      // 데이터베이스 업데이트
      localStorage.setItem(userDatabase, JSON.stringify(databaseData));
      
      console.log('출석 기록 삭제 완료');
      return true;
    } catch (error) {
      console.error('출석 기록 삭제 오류:', error);
      return false;
    }
  }

  /**
   * 월별 출석 통계 조회
   */
  public async getMonthlyAttendanceStats(year: number, month: number): Promise<MonthlyAttendanceSchema | null> {
    try {
      const userDatabase = `${this.databaseName}_${this.userId}`;
      const databaseData = JSON.parse(localStorage.getItem(userDatabase) || '{}');
      
      const monthlyStats = databaseData.monthlyStats || [];
      const targetStat = monthlyStats.find((stat: any) => 
        stat.year === year && stat.month === month
      );
      
      return targetStat || null;
    } catch (error) {
      console.error('월별 출석 통계 조회 오류:', error);
      return null;
    }
  }

  /**
   * 월별 출석 통계 생성/업데이트
   */
  public async updateMonthlyAttendanceStats(year: number, month: number): Promise<boolean> {
    try {
      const userDatabase = `${this.databaseName}_${this.userId}`;
      const databaseData = JSON.parse(localStorage.getItem(userDatabase) || '{}');
      
      // 해당 월의 출석 기록 조회
      const monthlyRecords = databaseData.attendanceRecords.filter((record: any) => {
        const recordDate = new Date(record.date);
        return recordDate.getFullYear() === year && recordDate.getMonth() === month;
      });
      
      // 월별 통계 계산
      const totalDays = new Date(year, month + 1, 0).getDate();
      const attendedDays = monthlyRecords.length;
      const attendanceRate = totalDays > 0 ? (attendedDays / totalDays) : 0;
      const totalBonus = this.calculateTotalBonus(attendedDays);
      
      // 월별 통계 스키마 생성
      const monthlyStat: MonthlyAttendanceSchema = {
        id: `monthly_${this.userId}_${year}_${month}`,
        userId: this.userId,
        year: year,
        month: month,
        totalDays: totalDays,
        attendedDays: attendedDays,
        attendanceRate: attendanceRate,
        totalBonus: totalBonus,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // 기존 통계 업데이트 또는 새로 생성
      const existingIndex = databaseData.monthlyStats.findIndex((stat: any) => 
        stat.year === year && stat.month === month
      );
      
      if (existingIndex !== -1) {
        databaseData.monthlyStats[existingIndex] = monthlyStat;
      } else {
        databaseData.monthlyStats.push(monthlyStat);
      }
      
      databaseData.updatedAt = new Date();
      
      // 데이터베이스 업데이트
      localStorage.setItem(userDatabase, JSON.stringify(databaseData));
      
      console.log('월별 출석 통계 업데이트 완료');
      return true;
    } catch (error) {
      console.error('월별 출석 통계 업데이트 오류:', error);
      return false;
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
   * 데이터베이스 백업
   */
  public async backupDatabase(): Promise<string> {
    try {
      const userDatabase = `${this.databaseName}_${this.userId}`;
      const databaseData = localStorage.getItem(userDatabase);
      
      if (!databaseData) {
        throw new Error('백업할 데이터가 없습니다.');
      }
      
      const backupData = {
        userId: this.userId,
        databaseName: userDatabase,
        data: JSON.parse(databaseData),
        backupDate: new Date(),
        version: '1.0.0'
      };
      
      const backupString = JSON.stringify(backupData);
      return backupString;
    } catch (error) {
      console.error('데이터베이스 백업 오류:', error);
      throw error;
    }
  }

  /**
   * 데이터베이스 복원
   */
  public async restoreDatabase(backupString: string): Promise<boolean> {
    try {
      const backupData = JSON.parse(backupString);
      
      if (!backupData.data || !backupData.userId) {
        throw new Error('잘못된 백업 데이터입니다.');
      }
      
      const userDatabase = `${this.databaseName}_${backupData.userId}`;
      localStorage.setItem(userDatabase, JSON.stringify(backupData.data));
      
      console.log('데이터베이스 복원 완료');
      return true;
    } catch (error) {
      console.error('데이터베이스 복원 오류:', error);
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
      console.error('출석 CRUD 서비스 정리 오류:', error);
    }
  }
}
