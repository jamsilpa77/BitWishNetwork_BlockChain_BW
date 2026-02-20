import React, { useState, useEffect } from 'react';
import { LanguageManager } from '@/utils/LanguageManager/LanguageManager';
import { AttendanceBonusService } from '@/services/BonusService/AttendanceBonusService';
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
    walletAddress: string; // [추가] 지갑 주소 필수로 받음
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({ isOpen, onClose, onCheckIn, currentLanguage, walletAddress }) => {
    const [languageManager] = useState(() => new LanguageManager());
    // [수정] 직접 서비스 인스턴스 생성 (싱글톤 패턴이나 전역 사용 금지 규칙 준수 위해 내부 생성 혹은 props로 받아야 하나, 여기선 내부 인스턴스로 로컬스토리지 접근)
    const [attendanceService] = useState(() => new AttendanceBonusService());

    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewDate, setViewDate] = useState(new Date());
    const [attendanceData, setAttendanceData] = useState<string[]>([]);
    const [isCheckedToday, setIsCheckedToday] = useState(false);
    const [bonusRate, setBonusRate] = useState(0);

    // [중요] 초기화 및 데이터 로드 (서비스 이용)
    useEffect(() => {
        if (isOpen) {
            const now = new Date();
            setCurrentDate(now);
            setViewDate(now);

            // 서비스 초기화 및 데이터 로드
            attendanceService.initializeService();
            const records = attendanceService.getAttendanceRecords();
            const recordDates = records.map(r => r.date); // 'YYYY-MM-DD'
            setAttendanceData(recordDates);

            // 오늘 출석 및 보너스 상태 확인
            const status = attendanceService.getAttendanceStatus(); // 'COMPLETED', 'AVAILABLE', 'EXPIRED'
            const rate = attendanceService.calculateBonusRate();

            setIsCheckedToday(status === 'COMPLETED');
            setBonusRate(rate);
        }
    }, [isOpen, attendanceService]);

    // [폴링 추가] 관리자 초기화 신호를 이 모달에서도 감지하여 즉시 UI 갱신 (선택사항이나 안전장치로 추가)
    useEffect(() => {
        if (!isOpen) return;
        const interval = setInterval(() => {
            // 서비스 내부 데이터가 폴링에 의해 바뀌었는지 확인 (service 자체가 폴링 중이므로 get으로 확인)
            const rate = attendanceService.calculateBonusRate();
            if (rate === 0 && isCheckedToday) {
                // 초기화 감지됨
                setIsCheckedToday(false);
                setBonusRate(0);
                setAttendanceData(attendanceService.getAttendanceRecords().map(r => r.date));
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [isOpen, isCheckedToday, attendanceService]);


    // 출석 기준 날짜 문자열 생성 (오전 9시 기준)
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
        const startDayOfWeek = firstDay.getDay();

        const calendarDays = [];

        for (let i = 0; i < startDayOfWeek; i++) {
            calendarDays.push(null);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            calendarDays.push(new Date(year, month, i));
        }

        return calendarDays;
    };

    // 날짜 상태 결정 (Blue, Red, Gray)
    const getDateStatus = (date: Date | null) => {
        if (!date) return 'empty';

        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        // 데이터에 있으면 체크됨 (Red)
        if (attendanceData.includes(dateStr)) {
            return 'checked';
        }

        // 오늘 날짜인지 확인 (서비스 로직 활용 권장하나 UI용 간소화)
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        if (dateStr === todayStr) {
            return isCheckedToday ? 'checked' : 'active'; // 이미 했으면 Red, 안했으면 Blue
        }

        // 과거인지 미래인지
        if (new Date(dateStr) < new Date(todayStr)) return 'missed'; // Gray
        return 'future';
    };

    // 출석 체크 핸들러 (서비스 연동)
    const handleDayClick = async (date: Date | null) => {
        if (!date) return;
        const status = getDateStatus(date);

        if (status === 'active') { // 파란색(오늘, 미체크)일 때만 클릭 가능
            const result = await attendanceService.applyAttendanceBonus(walletAddress);

            if (result.success) {
                // UI 갱신
                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                setAttendanceData(prev => [...prev, dateStr]);
                setIsCheckedToday(true);
                setBonusRate(0.05);

                // 부모에게 알림 (5%)
                onCheckIn(0.05);
                alert(result.message || getTranslation('attendance.checked'));
            } else {
                alert(result.message);
            }
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
                        {attendanceService.isAttendanceAvailable() ?
                            '출석 가능 시간: 오전 9시 ~ 익일 오전 8시 59분 59초'
                            : getTranslation('attendance.note')}
                    </p>
                </div>

                {/* Bonus Info Box */}
                <div className="bonus-info-box">
                    <div className="bonus-rate">
                        {(bonusRate * 100).toFixed(1)}% <span className="blue-text">{getTranslation('attendance.bonusRate')}</span>
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
            {/* hidden dependency for re-render */}
            <div style={{ display: 'none' }}>{attendanceService.formatBonusRate()}</div>
        </div>
    );
};

export default AttendanceModal;
