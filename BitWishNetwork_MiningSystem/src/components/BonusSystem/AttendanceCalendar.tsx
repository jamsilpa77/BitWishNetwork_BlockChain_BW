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

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { LanguageManager } from '@/utils/LanguageManager/LanguageManager';
import { PrecisionCalculator } from '@/utils/PrecisionCalculator/PrecisionCalculator';
import { AttendanceBonusService } from '@/services/BonusService/AttendanceBonusService';
import { Decimal } from 'decimal.js';
import { Language, AttendanceRecord, AttendanceStatus } from '@/types';
import './AttendanceCalendar.css';

/**
 * 출석 달력 컴포넌트 - 완벽한 독립성 보장
 * 출석 보너스 달력 모달, 출석 체크, 보너스율 표시
 * 성능 최적화: React.memo, useMemo, useCallback 적용
 */
const AttendanceCalendar: React.FC = memo(() => {
  // 절대 준수사항: 전역 변수 사용 금지
  const [languageManager] = useState(() => new LanguageManager());
  const [precisionCalculator] = useState(() => new PrecisionCalculator());
  const [attendanceBonusService] = useState(() => new AttendanceBonusService());

  const [currentLanguage, setCurrentLanguage] = useState<Language>('ko');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>('AVAILABLE');
  const [bonusRate, setBonusRate] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [monthlyAttendance, setMonthlyAttendance] = useState<number>(0);

  /**
   * 컴포넌트 마운트 시 초기화
   */
  useEffect(() => {
    initializeAttendanceCalendar();
    startRealTimeSync();

    return () => {
      stopRealTimeSync();
    };
  }, []);

  /**
   * 출석 달력 초기화
   */
  const initializeAttendanceCalendar = (): void => {
    try {
      // 언어 설정
      languageManager.setLanguage(currentLanguage);

      // 다크 모드 설정
      const savedTheme = localStorage.getItem('bw-theme');
      if (savedTheme === 'dark') {
        setIsDarkMode(true);
        document.body.classList.add('dark-mode');
      }

      // 출석 기록 로드
      loadAttendanceRecords();

      // 출석 상태 확인
      checkAttendanceStatus();

      console.log('출석 달력 초기화 완료');
    } catch (error) {
      console.error('출석 달력 초기화 오류:', error);
    }
  };

  /**
   * 실시간 동기화 시작
   */
  const startRealTimeSync = (): (() => void) => {
    try {
      const interval = setInterval(() => {
        checkAttendanceStatus();
        updateBonusRate();
      }, 1000); // 1초마다 실시간 업데이트

      return () => clearInterval(interval);
    } catch (error) {
      console.error('실시간 동기화 시작 오류:', error);
      return () => { };
    }
  };

  /**
   * 실시간 동기화 중지
   */
  const stopRealTimeSync = (): void => {
    try {
      // 정리 로직
    } catch (error) {
      console.error('실시간 동기화 중지 오류:', error);
    }
  };

  /**
   * 출석 기록 로드 - useCallback 최적화
   */
  const loadAttendanceRecords = useCallback((): void => {
    try {
      const savedRecords = localStorage.getItem('bw-attendance-records');
      if (savedRecords) {
        const records = JSON.parse(savedRecords);
        setAttendanceRecords(records);
      }
    } catch (error) {
      console.error('출석 기록 로드 오류:', error);
    }
  }, []);

  /**
   * 출석 기록 저장 - useCallback 최적화
   */
  const saveAttendanceRecords = useCallback((records: AttendanceRecord[]): void => {
    try {
      localStorage.setItem('bw-attendance-records', JSON.stringify(records));
      setAttendanceRecords(records);
    } catch (error) {
      console.error('출석 기록 저장 오류:', error);
    }
  }, []);

  /**
   * 출석 상태 확인
   */
  const checkAttendanceStatus = (): void => {
    try {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const second = now.getSeconds();

      // 출석 가능 시간: 오전 9시 ~ 다음날 오전 8시 59분 59초
      const isAvailable = (hour >= 9) || (hour < 8 || (hour === 8 && minute === 59 && second === 59));

      if (isAvailable) {
        setAttendanceStatus('AVAILABLE');
      } else {
        setAttendanceStatus('EXPIRED');
      }
    } catch (error) {
      console.error('출석 상태 확인 오류:', error);
    }
  };

  /**
   * 보너스율 업데이트
   */
  const updateBonusRate = (): void => {
    try {
      const today = new Date();
      const todayStr = today.toDateString();

      // 오늘 출석 체크 여부 확인
      const todayRecord = attendanceRecords.find(record =>
        new Date(record.date).toDateString() === todayStr
      );

      if (todayRecord && todayRecord.status === 'COMPLETED') {
        setBonusRate(0.05); // 5% 보너스
      } else {
        setBonusRate(0.00); // 0% 보너스
      }
    } catch (error) {
      console.error('보너스율 업데이트 오류:', error);
    }
  };

  /**
   * 출석 체크
   */
  const handleAttendanceCheck = async (date: Date): Promise<void> => {
    try {
      const result: { success: boolean; message: string } = await attendanceBonusService.applyAttendanceBonus();
      if (result.success) {
        alert(result.message);
        loadAttendanceRecords();
        checkAttendanceStatus();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('출석 체크 오류:', error);
    }
  };

  /**
   * 월별 출석 일수 업데이트
   */
  const updateMonthlyAttendance = (): void => {
    try {
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      const monthlyRecords = attendanceRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === currentMonth &&
          recordDate.getFullYear() === currentYear;
      });

      setMonthlyAttendance(monthlyRecords.length);
    } catch (error) {
      console.error('월별 출석 일수 업데이트 오류:', error);
    }
  };

  /**
   * 날짜 상태 확인
   */
  const getDateStatus = (date: Date): AttendanceStatus => {
    try {
      const dateStr = date.toDateString();
      const record = attendanceRecords.find(r =>
        new Date(r.date).toDateString() === dateStr
      );

      if (record && record.status === 'COMPLETED') {
        return 'COMPLETED'; // 빨간색 - 출석 완료
      }

      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const isPast = date < now;

      if (isToday) {
        const hour = now.getHours();
        const minute = now.getMinutes();
        const second = now.getSeconds();
        const isAvailable = (hour >= 9) || (hour < 8 || (hour === 8 && minute === 59 && second === 59));
        return isAvailable ? 'AVAILABLE' : 'EXPIRED';
      }

      if (isPast) {
        return 'EXPIRED'; // 회색 - 출석 기회 상실
      }

      return 'FUTURE'; // 미래 날짜
    } catch (error) {
      console.error('날짜 상태 확인 오류:', error);
      return 'EXPIRED';
    }
  };

  /**
   * 달력 날짜 생성 - useMemo 최적화
   */
  const generateCalendarDates = useMemo((): Date[] => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());

      const dates: Date[] = [];
      const endDate = new Date(lastDay);
      endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        dates.push(new Date(date));
      }

      return dates;
    } catch (error) {
      console.error('달력 날짜 생성 오류:', error);
      return [];
    }
  }, [currentDate]);

  /**
   * 이전 달로 이동
   */
  const goToPreviousMonth = (): void => {
    try {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() - 1);
      setCurrentDate(newDate);
    } catch (error) {
      console.error('이전 달 이동 오류:', error);
    }
  };

  /**
   * 다음 달로 이동
   */
  const goToNextMonth = (): void => {
    try {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + 1);
      setCurrentDate(newDate);
    } catch (error) {
      console.error('다음 달 이동 오류:', error);
    }
  };

  /**
   * 모달 닫기
   */
  const handleCloseModal = (): void => {
    try {
      setIsModalOpen(false);
    } catch (error) {
      console.error('모달 닫기 오류:', error);
    }
  };

  /**
   * 확인 버튼 클릭
   */
  const handleConfirm = (): void => {
    try {
      setIsModalOpen(false);
    } catch (error) {
      console.error('확인 버튼 클릭 오류:', error);
    }
  };

  /**
   * 날짜 포맷팅
   */
  const formatDate = (date: Date): string => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      };
      return date.toLocaleDateString('ko-KR', options);
    } catch (error) {
      console.error('날짜 포맷팅 오류:', error);
      return '';
    }
  };

  /**
   * 보너스율 포맷팅 (8자리)
   */
  const formatBonusRate = (rate: number): string => {
    try {
      const decimal = new Decimal(rate);
      const formatted = decimal.toFixed(8);
      return `${formatted}%`;
    } catch (error) {
      console.error('보너스율 포맷팅 오류:', error);
      return '0.00000000%';
    }
  };

  const calendarDates = generateCalendarDates;
  const today = new Date();

  return (
    <div className={`attendance-calendar ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* 헤더 */}
      <div className="calendar-header">
        <div className="header-icon">
          📅
        </div>
        <div className="header-title">
          {languageManager.getTranslation('attendance.title', currentLanguage)}
        </div>
        <div className="header-subtitle">
          {languageManager.getTranslation('attendance.subtitle', currentLanguage)}
        </div>
      </div>

      {/* 달력 섹션 */}
      <div className="calendar-section">
        <div className="calendar-title">
          📊 {currentDate.getFullYear()}년 출석 달력
        </div>
        <div className="today-info">
          오늘: {formatDate(today)}
        </div>

        {/* 월 네비게이션 */}
        <div className="month-navigation">
          <button
            className="nav-button prev"
            onClick={goToPreviousMonth}
          >
            ←
          </button>
          <div className="current-month">
            {currentDate.getMonth() + 1}월
          </div>
          <button
            className="nav-button next"
            onClick={goToNextMonth}
          >
            →
          </button>
        </div>

        {/* 요일 표시 */}
        <div className="weekdays">
          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <div key={day} className="weekday">
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="date-grid">
          {calendarDates.map((date: Date, index: number) => {
            const status = getDateStatus(date);
            const isToday = date.toDateString() === today.toDateString();

            return (
              <div
                key={index}
                className={`date-cell ${status} ${isToday ? 'today' : ''}`}
                onClick={() => status === 'AVAILABLE' && handleAttendanceCheck(date)}
              >
                {date.getDate()}
                {isToday && <div className="today-label">오늘</div>}
              </div>
            );
          })}
        </div>

        {/* 이번 달 출석 요약 */}
        <div className="monthly-summary">
          이번 달 출석: {monthlyAttendance}일
        </div>
      </div>

      {/* 출석 상태 섹션 */}
      <div className="attendance-status-section">
        <div className="status-title">
          {languageManager.getTranslation('attendance.status', currentLanguage)}
        </div>
        <div className={`status-indicator ${attendanceStatus === 'AVAILABLE' ? 'on' : 'off'}`}>
          {attendanceStatus === 'AVAILABLE' ? 'ON' : 'OFF'}
        </div>
        <div className="status-note">
          {languageManager.getTranslation('attendance.note', currentLanguage)}
        </div>
      </div>

      {/* 보너스 정보 섹션 */}
      <div className="bonus-info-section">
        <div className="bonus-rate">
          {formatBonusRate(bonusRate)}
        </div>
        <div className="bonus-label">
          {languageManager.getTranslation('attendance.bonusRate', currentLanguage)}
        </div>
        <div className="bonus-status">
          {bonusRate > 0 ? (
            <span className="bonus-active">
              ✓ {languageManager.getTranslation('attendance.bonusActive', currentLanguage)}
            </span>
          ) : (
            <span className="bonus-inactive">
              ✗ {languageManager.getTranslation('attendance.bonusInactive', currentLanguage)}
            </span>
          )}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="action-buttons">
        <button
          className="confirm-button"
          onClick={handleConfirm}
        >
          ✓ {languageManager.getTranslation('buttons.confirm', currentLanguage)}
        </button>
        <button
          className="close-button"
          onClick={handleCloseModal}
        >
          ✗ {languageManager.getTranslation('buttons.close', currentLanguage)}
        </button>
      </div>
    </div>
  );
});

// 성능 최적화를 위한 displayName 설정
AttendanceCalendar.displayName = 'AttendanceCalendar';

export default AttendanceCalendar;