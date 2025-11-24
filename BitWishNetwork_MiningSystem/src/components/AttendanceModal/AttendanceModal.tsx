import React, { useState, useEffect } from 'react';
import { LanguageManager } from '@/utils/LanguageManager/LanguageManager';
import './AttendanceModal.css';

/**
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

interface AttendanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCheckIn: (bonusRate: number) => void; // 부모 컴포넌트에 보너스율 전달
    currentLanguage: string;
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({ isOpen, onClose, onCheckIn, currentLanguage }) => {
    const [languageManager] = useState(() => new LanguageManager());
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewDate, setViewDate] = useState(new Date());
    const [attendanceData, setAttendanceData] = useState<string[]>([]);
    const [isCheckedToday, setIsCheckedToday] = useState(false);

    // 초기화 및 데이터 로드 (로컬 스토리지 시뮬레이션)
    useEffect(() => {
        if (isOpen) {
            const now = new Date();
            setCurrentDate(now);
            setViewDate(now);

            // 로컬 스토리지에서 출석 데이터 로드 (독립성 보장)
            const savedData = localStorage.getItem('bw_attendance_data');
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                setAttendanceData(parsedData);
                checkIfCheckedToday(parsedData, now);
            }
        }
    }, [isOpen]);

    // 오늘 출석 여부 확인 (9AM 기준)
    const checkIfCheckedToday = (data: string[], now: Date) => {
        const todayStr = getCheckInDateString(now);
        setIsCheckedToday(data.includes(todayStr));
    };

    // 출석 기준 날짜 문자열 생성 (오전 9시 기준)
    // 오전 9시 이전이면 전날 날짜로 처리, 9시 이후면 오늘 날짜로 처리
    const getCheckInDateString = (date: Date): string => {
        const checkInDate = new Date(date);
        if (checkInDate.getHours() < 9) {
            checkInDate.setDate(checkInDate.getDate() - 1);
        }
        return `${checkInDate.getFullYear()}-${String(checkInDate.getMonth() + 1).padStart(2, '0')}-${String(checkInDate.getDate()).padStart(2, '0')}`;
    };

    // 달력 생성 로직
    const generateCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay(); // 0: 일요일, 1: 월요일 ...

        const calendarDays = [];

        // 빈 칸 채우기
        for (let i = 0; i < startDayOfWeek; i++) {
            calendarDays.push(null);
        }

        // 날짜 채우기
        for (let i = 1; i <= daysInMonth; i++) {
            calendarDays.push(new Date(year, month, i));
        }

        return calendarDays;
    };

    // 날짜 상태 결정 (Blue, Red, Gray)
    const getDateStatus = (date: Date | null) => {
        if (!date) return 'empty';

        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const todayStr = getCheckInDateString(currentDate);

        // 비교를 위한 타임스탬프 (시간 제거)
        const checkDate = new Date(dateStr).getTime();
        const currentCheckDate = new Date(todayStr).getTime();

        if (attendanceData.includes(dateStr)) {
            return 'checked'; // Red
        }

        if (checkDate === currentCheckDate) {
            return 'active'; // Blue (오늘, 미출석)
        }

        if (checkDate < currentCheckDate) {
            return 'missed'; // Gray (과거, 미출석)
        }

        return 'future'; // 미래
    };

    // 출석 체크 핸들러
    const handleDayClick = (date: Date | null) => {
        if (!date) return;

        const status = getDateStatus(date);
        if (status === 'active') {
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

            const newData = [...attendanceData, dateStr];
            setAttendanceData(newData);
            setIsCheckedToday(true);

            // 로컬 스토리지 저장
            localStorage.setItem('bw_attendance_data', JSON.stringify(newData));

            // 부모 컴포넌트에 알림 (보너스율 5% = 0.05)
            onCheckIn(0.05);

            alert(getTranslation('attendance.checked'));
        }
    };

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleConfirm = () => {
        onClose();
    };

    const getTranslation = (key: string): string => {
        return languageManager.getTranslation(key, currentLanguage);
    };

    if (!isOpen) return null;

    const calendarDays = generateCalendar();
    const currentMonthAttendance = calendarDays.filter(date => date && attendanceData.includes(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`)).length;

    const weekDays = [
        'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
    ];

    return (
        <div className="attendance-modal-overlay">
            <div className="attendance-modal">
                <div className="modal-glow-effect"></div>

                {/* Header */}
                <div className="attendance-header">
                    <div className="calendar-icon-wrapper">
                        <span className="calendar-icon">📅</span>
                    </div>
                    <h2 className="attendance-title">{getTranslation('attendance.title')}</h2>
                    <p className="attendance-subtitle">{getTranslation('attendance.subtitle')}</p>
                </div>

                {/* Calendar Section */}
                <div className="calendar-section">
                    <div className="calendar-year-header">
                        <span className="year-text">{viewDate.getFullYear()}</span>
                        <span className="month-text">{viewDate.getMonth() + 1}</span>
                    </div>

                    <div className="current-date-banner">
                        {getTranslation('attendance.todayAttendance')}: {currentDate.getFullYear()}-{String(currentDate.getMonth() + 1).padStart(2, '0')}-{String(currentDate.getDate()).padStart(2, '0')}
                    </div>

                    <div className="month-navigation">
                        <button className="nav-btn" onClick={handlePrevMonth}>◀</button>
                        <span className="month-title">{viewDate.getMonth() + 1}</span>
                        <button className="nav-btn" onClick={handleNextMonth}>▶</button>
                    </div>

                    <div className="calendar-grid">
                        {/* Weekday Headers */}
                        {weekDays.map(day => (
                            <div key={day} className="weekday-header">{day}</div>
                        ))}

                        {/* Days */}
                        {calendarDays.map((date, index) => {
                            const status = getDateStatus(date);
                            return (
                                <div
                                    key={index}
                                    className={`calendar-day ${status}`}
                                    onClick={() => handleDayClick(date)}
                                >
                                    {date ? date.getDate() : ''}
                                </div>
                            );
                        })}
                    </div>

                    <div className="calendar-footer">
                        {getTranslation('attendance.monthAttendance')}: <span className="bold">{currentMonthAttendance} {getTranslation('attendance.unitDays')}</span>
                    </div>
                </div>

                {/* Status Section */}
                <div className="status-section">
                    <h3 className="status-title">{getTranslation('attendance.status')}</h3>
                    <div className={`status-indicator ${isCheckedToday ? 'on' : 'off'}`}>
                        {isCheckedToday ? 'ON' : 'OFF'}
                    </div>
                    <p className="status-description">
                        {getTranslation('attendance.note')}
                    </p>
                </div>

                {/* Bonus Info Box */}
                <div className="bonus-info-box">
                    <div className="bonus-rate">
                        {isCheckedToday ? '5.0%' : '0.0%'} <span className="blue-text">{getTranslation('attendance.bonusRate')}</span>
                    </div>
                    <div className="bonus-warning">
                        {isCheckedToday ? (
                            <span className="hidden"></span>
                        ) : (
                            <span className="red-text">❌ {getTranslation('attendance.bonusInactive')}</span>
                        )}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="modal-footer">
                    <button className="confirm-btn" onClick={handleConfirm}>
                        ✅ {getTranslation('buttons.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AttendanceModal;
