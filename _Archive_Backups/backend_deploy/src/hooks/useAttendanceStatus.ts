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

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Decimal } from 'decimal.js';
import { AttendanceRecord, AttendanceStatus, Language } from '@/types';

/**
 * 출석 상태 훅 - 완벽한 독립성 보장
 * 실시간 출석 상태 관리, 보너스율 계산, 출석 기록 동기화
 */
export const useAttendanceStatus = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>('AVAILABLE');
  const [bonusRate, setBonusRate] = useState<number>(0);
  const [monthlyAttendance, setMonthlyAttendance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('ko');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  /**
   * 출석 기록 로드
   */
  const loadAttendanceRecords = useCallback((): void => {
    try {
      setIsLoading(true);
      const savedRecords = localStorage.getItem('bw-attendance-records');
      if (savedRecords) {
        const records = JSON.parse(savedRecords);
        setAttendanceRecords(records);
      }
    } catch (error) {
      console.error('출석 기록 로드 오류:', error);
      setError('출석 기록을 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 출석 기록 저장
   */
  const saveAttendanceRecords = useCallback((records: AttendanceRecord[]): void => {
    try {
      localStorage.setItem('bw-attendance-records', JSON.stringify(records));
      setAttendanceRecords(records);
    } catch (error) {
      console.error('출석 기록 저장 오류:', error);
      setError('출석 기록을 저장할 수 없습니다.');
    }
  }, []);

  /**
   * 출석 가능 시간 확인
   */
  const checkAttendanceTime = useCallback((): boolean => {
    try {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const second = now.getSeconds();

      // 출석 가능 시간: 오전 9시 ~ 다음날 오전 8시 59분 59초
      return (hour >= 9) || (hour < 8 || (hour === 8 && minute === 59 && second === 59));
    } catch (error) {
      console.error('출석 시간 확인 오류:', error);
      return false;
    }
  }, []);

  /**
   * 출석 상태 업데이트
   */
  const updateAttendanceStatus = useCallback((): void => {
    try {
      const isAvailable = checkAttendanceTime();
      setAttendanceStatus(isAvailable ? 'AVAILABLE' : 'EXPIRED');
    } catch (error) {
      console.error('출석 상태 업데이트 오류:', error);
      setAttendanceStatus('EXPIRED');
    }
  }, [checkAttendanceTime]);

  /**
   * 보너스율 계산
   */
  const calculateBonusRate = useCallback((): void => {
    try {
      const today = new Date();
      const todayStr = today.toDateString();

      const todayRecord = attendanceRecords.find(record =>
        new Date(record.date).toDateString() === todayStr
      );

      if (todayRecord && todayRecord.status === 'COMPLETED') {
        setBonusRate(0.05); // 5% 보너스
      } else {
        setBonusRate(0.00); // 0% 보너스
      }
    } catch (error) {
      console.error('보너스율 계산 오류:', error);
      setBonusRate(0);
    }
  }, [attendanceRecords]);

  /**
   * 월별 출석 일수 계산
   */
  const calculateMonthlyAttendance = useCallback((): void => {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      const monthlyRecords = attendanceRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === currentMonth &&
          recordDate.getFullYear() === currentYear;
      });

      setMonthlyAttendance(monthlyRecords.length);
    } catch (error) {
      console.error('월별 출석 일수 계산 오류:', error);
      setMonthlyAttendance(0);
    }
  }, [attendanceRecords]);

  /**
   * 출석 체크
   */
  const checkAttendance = useCallback((): boolean => {
    try {
      if (!checkAttendanceTime()) {
        setError('출석 가능 시간이 아닙니다.');
        return false;
      }

      const today = new Date();
      const todayStr = today.toDateString();

      // 중복 출석 체크 방지
      const existingRecord = attendanceRecords.find(record =>
        new Date(record.date).toDateString() === todayStr
      );

      if (existingRecord) {
        setError('이미 출석 체크를 완료했습니다.');
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
      const updatedRecords = [...attendanceRecords, newRecord];
      saveAttendanceRecords(updatedRecords);

      // 보너스율 업데이트
      calculateBonusRate();

      // 월별 출석 일수 업데이트
      calculateMonthlyAttendance();

      setError(null);
      return true;
    } catch (error) {
      console.error('출석 체크 오류:', error);
      setError('출석 체크 중 오류가 발생했습니다.');
      return false;
    }
  }, [attendanceRecords, checkAttendanceTime, saveAttendanceRecords, calculateBonusRate, calculateMonthlyAttendance]);

  /**
   * 실시간 동기화 시작
   */
  const startRealTimeSync = useCallback((): (() => void) => {
    try {
      const interval = setInterval(() => {
        updateAttendanceStatus();
        calculateBonusRate();
        calculateMonthlyAttendance();
      }, 1000); // 1초마다 실시간 업데이트

      return () => clearInterval(interval);
    } catch (error) {
      console.error('실시간 동기화 시작 오류:', error);
      return () => { };
    }
  }, [updateAttendanceStatus, calculateBonusRate, calculateMonthlyAttendance]);

  /**
   * 초기화
   */
  useEffect(() => {
    if (!isInitialized) {
      loadAttendanceRecords();
      updateAttendanceStatus();
      calculateBonusRate();
      calculateMonthlyAttendance();
      setIsInitialized(true);
    }
  }, [isInitialized, loadAttendanceRecords, updateAttendanceStatus, calculateBonusRate, calculateMonthlyAttendance]);

  /**
   * 실시간 동기화
   */
  useEffect(() => {
    const cleanup = startRealTimeSync();
    return cleanup;
  }, [startRealTimeSync]);

  // 성능 최적화를 위한 메모이제이션된 반환값
  const memoizedReturn = useMemo(() => ({
    attendanceRecords,
    attendanceStatus,
    bonusRate,
    monthlyAttendance,
    isLoading,
    error,
    currentLanguage,
    isInitialized,
    checkAttendance,
    updateAttendanceStatus,
    calculateBonusRate,
    calculateMonthlyAttendance,
    loadAttendanceRecords,
    saveAttendanceRecords
  }), [
    attendanceRecords,
    attendanceStatus,
    bonusRate,
    monthlyAttendance,
    isLoading,
    error,
    currentLanguage,
    isInitialized,
    checkAttendance,
    updateAttendanceStatus,
    calculateBonusRate,
    calculateMonthlyAttendance,
    loadAttendanceRecords,
    saveAttendanceRecords
  ]);

  return memoizedReturn;
};
