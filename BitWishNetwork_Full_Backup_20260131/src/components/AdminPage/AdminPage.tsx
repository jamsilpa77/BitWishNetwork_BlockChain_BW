/**
 * BitWishNetwork 관리자 페이지
 * URL: /bitwish/testadmin
 * 
 * 기능:
 * 1. 마이닝 테스트 관리 (초기화)
 * 2. 추천 보너스 관리
 * 3. 가맹점 등록 관리
 * 4. KYC 신청 관리
 * 5. 반감기 정책 관리
 */

import React, { useState } from 'react';
import './AdminPage.css';

const AdminPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<string>('dashboard');
    const [searchAddress, setSearchAddress] = useState<string>('');
    const [miningData, setMiningData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    // 출석 보너스 관련 state
    const [attendanceSearchAddress, setAttendanceSearchAddress] = useState<string>('');
    const [attendanceData, setAttendanceData] = useState<any>(null);
    const [attendanceLoading, setAttendanceLoading] = useState<boolean>(false);
    const [attendanceError, setAttendanceError] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

    // 추천 보너스 관련 state
    const [referralSearchAddress, setReferralSearchAddress] = useState<string>('');
    const [referralData, setReferralData] = useState<any>(null);
    const [referralLoading, setReferralLoading] = useState<boolean>(false);
    const [referralError, setReferralError] = useState<string>('');
    const [hasLoadedInitialData, setHasLoadedInitialData] = useState<boolean>(false);
    const [isSearchMode, setIsSearchMode] = useState<boolean>(false); // 검색 모드 상태 추가


    // 마이닝 데이터 검색
    const handleSearchMining = async () => {
        if (!searchAddress.trim()) {
            setError('지갑 주소를 입력하세요');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`http://localhost:5001/api/admin/mining/${searchAddress}`);

            // 응답 상태 확인
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                setMiningData(data.data);
            } else {
                setError(data.message || '데이터를 찾을 수 없습니다');
                setMiningData(null);
            }
        } catch (err: any) {
            console.error('검색 오류:', err);
            setError(`서버 오류: ${err.message || '알 수 없는 오류'}`);
            setMiningData(null);
        } finally {
            setIsLoading(false);
        }
    };

    // 마이닝 초기화
    const handleResetMining = async () => {
        if (!searchAddress.trim()) {
            setError('지갑 주소를 입력하세요');
            return;
        }

        if (!window.confirm('정말로 이 지갑의 마이닝 데이터를 초기화하시겠습니까?\n\n초기화 후:\n- 누적 보상: 0 BW\n- 마이닝 상태: 중지\n- 추천 보너스 보관함: 0 BW\n- 추천 보상 보관함: 0 BW\n- 다시 마이닝 시작 시 0부터 새로 채굴')) {
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:5001/api/admin/mining/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress: searchAddress })
            });

            const data = await response.json();

            if (data.success) {
                // [추가] 추천 보너스 localStorage 초기화
                // [수정] 관리자 페이지에서 직접 데이터를 삭제하지 않습니다.
                // 대신 'BW_SYSTEM_RESET_TRIGGER' 신호를 보내 각 서비스가 스스로 
                // "금액은 0으로, 족보(추천인)는 유지"하도록 처리합니다.
                console.log(`[Admin] 초기화 신호 전송 준비: ${searchAddress}`);

                // [핵심] 다른 탭(마이닝 페이지)에 변경 사항을 알리기 위한 트리거 설정
                // 이 코드가 실행되면 브라우저의 'storage' 이벤트가 발생하여 마이닝 페이지가 즉시 감지합니다.
                localStorage.setItem('BW_SYSTEM_RESET_TRIGGER', JSON.stringify({
                    type: 'RESET',
                    target: searchAddress,
                    timestamp: Date.now()
                }));

                alert('✅ 마이닝 데이터가 초기화되었습니다\n\n초기화된 데이터:\n- 누적 보상: 0 BW\n- 마이닝 상태: 중지\n- 추천 보너스 보관함: 0 BW\n- 추천 보상 보관함: 0 BW');

                // 초기화 후 자동으로 다시 검색하여 초기화된 데이터 표시
                await handleSearchMining();
            } else {
                setError(data.message || '초기화 실패');
            }
        } catch (err) {
            setError('서버 오류가 발생했습니다');
        } finally {
            setIsLoading(false);
        }
    };

    // 출석 보너스 데이터 검색
    const handleSearchAttendance = async () => {
        if (!attendanceSearchAddress.trim()) {
            setAttendanceError('지갑 주소를 입력하세요');
            return;
        }

        setAttendanceLoading(true);
        setAttendanceError('');

        try {
            const response = await fetch(`http://localhost:5001/api/admin/attendance/${attendanceSearchAddress}?year=${selectedYear}&month=${selectedMonth}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                setAttendanceData(data.data);
            } else {
                setAttendanceError(data.message || '데이터를 찾을 수 없습니다');
                setAttendanceData(null);
            }
        } catch (err: any) {
            console.error('출석 검색 오류:', err);
            setAttendanceError(`서버 오류: ${err.message || '알 수 없는 오류'}`);
            setAttendanceData(null);
        } finally {
            setAttendanceLoading(false);
        }
    };


    // 추천 보너스 데이터 검색
    const handleSearchReferral = async () => {
        if (!referralSearchAddress.trim()) {
            setReferralError('지갑 주소를 입력하세요');
            return;
        }

        setReferralLoading(true);
        setReferralError('');

        try {
            const response = await fetch(`http://localhost:5001/api/admin/referral/${referralSearchAddress}?year=${selectedYear}&month=${selectedMonth}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                setReferralData(data.data);
                setIsSearchMode(true); // 검색 성공 시 검색 모드 활성화
            } else {
                setReferralError(data.message || '데이터를 찾을 수 없습니다');
                setReferralData(null);
                setIsSearchMode(false);
            }
        } catch (err: any) {
            console.error('추천 검색 오류:', err);
            setReferralError(`서버 오류: ${err.message || '알 수 없는 오류'}`);
            setReferralData(null);
        } finally {
            setReferralLoading(false);
        }
    };

    // 전체 추천 보너스 목록 조회 (초기 로딩용)
    const fetchAllReferrals = async () => {
        setReferralLoading(true);
        setReferralError('');

        try {
            const response = await fetch(`http://localhost:5001/api/admin/referral/all?year=${selectedYear}&month=${selectedMonth}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                setReferralData(data.data);
                setReferralSearchAddress(''); // 검색어 초기화
                setIsSearchMode(false); // 전체 목록 모드
            } else {
                setReferralError(data.message || '데이터를 찾을 수 없습니다');
            }
        } catch (err: any) {
            console.error('전체 목록 조회 오류:', err);
            setReferralError('서버 연결 실패');
        } finally {
            setReferralLoading(false);
        }
    };

    // 탭 변경 감지 및 자동 데이터 로딩
    React.useEffect(() => {
        if (activeTab === 'referral' && !hasLoadedInitialData) {
            fetchAllReferrals();
            setHasLoadedInitialData(true);
        }
    }, [activeTab, hasLoadedInitialData]);

    // 유틸리티 함수: 날짜 포맷팅 (년, 월, 일, 시, 분, 초)
    const formatDateTime = (isoString: string): string => {
        const date = new Date(isoString);
        return `${date.getFullYear()}년 ${(date.getMonth() + 1).toString().padStart(2, '0')}월 ${date.getDate().toString().padStart(2, '0')}일 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
    };

    // 유틸리티 함수: 짧은 형식 (소수점 4자리)
    const formatShort = (value: string | number): string => {
        return Number(value).toFixed(4);
    };

    // 유틸리티 함수: 정밀 형식 (소수점 8자리)
    const formatPrecise = (value: string | number): string => {
        return Number(value).toFixed(8);
    };

    // 유틸리티 함수: KYC 상태 텍스트
    const getKycStatusText = (status: string): string => {
        const statusMap: { [key: string]: string } = {
            'APPROVED': '✅ 승인',
            'REJECTED': '❌ 불승인',
            'PENDING': '⏳ 보류',
            'NOT_APPLIED': '미신청' // 미신청 추가 (텍스트 수정됨)
        };
        return statusMap[status] || '알 수 없음';
    };



    return (
        <div className="admin-page">
            {/* 헤더 */}
            <header className="admin-header">
                <div className="admin-header-content">
                    <h1 className="admin-title">
                        <span className="admin-icon">⚙️</span>
                        BitWish Network 관리자 페이지
                    </h1>
                    <button className="logout-button" onClick={() => window.location.href = '/'}>
                        🏠 홈으로
                    </button>
                </div>
            </header>

            {/* 탭 네비게이션 */}
            <nav className="admin-tabs">
                <button
                    className={`admin-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dashboard')}
                >
                    📊 대시보드
                </button>
                <button
                    className={`admin-tab ${activeTab === 'mining' ? 'active' : ''}`}
                    onClick={() => setActiveTab('mining')}
                >
                    🧪 마이닝 테스트
                </button>
                <button
                    className={`admin-tab ${activeTab === 'attendance' ? 'active' : ''}`}
                    onClick={() => setActiveTab('attendance')}
                >
                    📅 출석 보너스
                </button>
                <button
                    className={`admin-tab ${activeTab === 'referral' ? 'active' : ''}`}
                    onClick={() => setActiveTab('referral')}
                >
                    🎁 추천 보너스
                </button>
                <button
                    className={`admin-tab ${activeTab === 'partner' ? 'active' : ''}`}
                    onClick={() => setActiveTab('partner')}
                >
                    🏪 가맹점 관리
                </button>
                <button
                    className={`admin-tab ${activeTab === 'kyc' ? 'active' : ''}`}
                    onClick={() => setActiveTab('kyc')}
                >
                    🆔 KYC 관리
                </button>
                <button
                    className={`admin-tab ${activeTab === 'halving' ? 'active' : ''}`}
                    onClick={() => setActiveTab('halving')}
                >
                    ⏰ 반감기 관리
                </button>
            </nav>

            {/* 메인 콘텐츠 */}
            <main className="admin-main">
                {activeTab === 'dashboard' && (
                    <div className="admin-panel">
                        <h2>📊 대시보드</h2>
                        <div className="dashboard-grid">
                            <div className="dashboard-card">
                                <div className="card-value">1,234</div>
                                <div className="card-label">총 사용자</div>
                            </div>
                            <div className="dashboard-card">
                                <div className="card-value">987</div>
                                <div className="card-label">활성 마이너</div>
                            </div>
                            <div className="dashboard-card">
                                <div className="card-value">12,345,678 BW</div>
                                <div className="card-label">총 발행량</div>
                            </div>
                            <div className="dashboard-card">
                                <div className="card-value">15</div>
                                <div className="card-label">대기 중인 KYC</div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'mining' && (
                    <div className="admin-panel">
                        <h2>🧪 마이닝 테스트 관리</h2>
                        <div className="test-section">
                            <p className="warning-text">⚠️ 테스트 목적으로만 사용하세요</p>

                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="지갑 주소 입력"
                                    className="admin-input"
                                    value={searchAddress}
                                    onChange={(e) => setSearchAddress(e.target.value)}
                                    disabled={isLoading}
                                />
                                <button
                                    className="admin-button primary"
                                    onClick={handleSearchMining}
                                    disabled={isLoading}
                                >
                                    {isLoading ? '검색 중...' : '검색'}
                                </button>
                            </div>

                            {error && (
                                <div className="error-message">{error}</div>
                            )}

                            {/* 검색 실행 후 결과 표시 영역 */}
                            {(miningData || (!isLoading && searchAddress && !miningData && !error)) && (
                                <div className="mining-data-box">
                                    {miningData ? (
                                        <>
                                            <h3>✅ 마이닝 정보</h3>
                                            <div className="data-grid">
                                                <div className="data-item">
                                                    <span className="data-label">지갑 주소:</span>
                                                    <span className="data-value">{miningData.walletAddress}</span>
                                                </div>
                                                <div className="data-item">
                                                    <span className="data-label">마이닝 상태:</span>
                                                    <span className={`data-value ${miningData.isMining ? 'active' : 'inactive'}`}>
                                                        {miningData.isMining ? '🟢 진행 중' : '🔴 중지'}
                                                    </span>
                                                </div>
                                                <div className="data-item">
                                                    <span className="data-label">누적 보상:</span>
                                                    <span className="data-value">{miningData.accumulatedReward} BW</span>
                                                </div>
                                                <div className="data-item">
                                                    <span className="data-label">마이닝 시작 시간:</span>
                                                    <span className="data-value">
                                                        {miningData.miningStartTime
                                                            ? new Date(miningData.miningStartTime).toLocaleString('ko-KR')
                                                            : '-'
                                                        }
                                                    </span>
                                                </div>
                                                <div className="data-item">
                                                    <span className="data-label">마지막 동기화:</span>
                                                    <span className="data-value">
                                                        {new Date(miningData.lastSyncTime).toLocaleString('ko-KR')}
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="no-data-message">
                                            <p className="no-data-icon">📭</p>
                                            <p className="no-data-text">마이닝 기록이 없습니다</p>
                                            <p className="no-data-hint">
                                                이 지갑은 아직 마이닝을 시작하지 않았거나,<br />
                                                이전에 초기화된 상태입니다.
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        className="admin-button danger"
                                        onClick={handleResetMining}
                                        disabled={isLoading}
                                    >
                                        {miningData
                                            ? '⚠️ 마이닝 데이터 초기화'
                                            : '🔄 초기 상태로 설정'
                                        }
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div className="admin-panel">
                        <h2>📅 출석 보너스 관리</h2>
                        <div className="test-section">
                            <p className="warning-text">⚠️ 출석 보너스 현황 조회</p>

                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="지갑 주소 입력"
                                    className="admin-input"
                                    value={attendanceSearchAddress}
                                    onChange={(e) => setAttendanceSearchAddress(e.target.value)}
                                    disabled={attendanceLoading}
                                />
                                <div className="date-selectors">
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        className="admin-select"
                                    >
                                        <option value={2024}>2024년</option>
                                        <option value={2025}>2025년</option>
                                        <option value={2026}>2026년</option>
                                    </select>
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                        className="admin-select"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                            <option key={m} value={m}>{m}월</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    className="admin-button primary"
                                    onClick={handleSearchAttendance}
                                    disabled={attendanceLoading}
                                >
                                    {attendanceLoading ? '검색 중...' : '월별 검색'}
                                </button>
                            </div>

                            {attendanceError && (
                                <div className="error-message">{attendanceError}</div>
                            )}

                            {attendanceData && (
                                <div className="attendance-result-box">
                                    <h3>✅ {selectedMonth}월 출석 현황</h3>
                                    <div className="attendance-summary">
                                        <div className="summary-item">
                                            <span className="summary-label">오늘 출석 상태:</span>
                                            <span className={`summary-value ${attendanceData.isActive ? 'active' : 'inactive'}`}>
                                                {attendanceData.isActive ? '🟢 ON' : '🔴 OFF'}
                                            </span>
                                        </div>
                                    </div>

                                    {attendanceData.records && attendanceData.records.length > 0 ? (
                                        <div className="attendance-table-container">
                                            <h4>{selectedMonth}월 출석 이력</h4>
                                            <table className="attendance-table">
                                                <thead>
                                                    <tr>
                                                        <th>일시 (시작 ~ 종료)</th>
                                                        <th>5% 채굴 BW 수량</th>
                                                        <th>상태</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {attendanceData.records.map((record: any, index: number) => (
                                                        <tr key={index}>
                                                            <td className="date-cell">{record.fullDate}</td>
                                                            <td>{record.bonusAmount} BW</td>
                                                            <td>
                                                                {record.status === 'RUNNING' ? (
                                                                    <span className="status-running">🔥 진행 중</span>
                                                                ) : (
                                                                    <span className={record.isActive ? 'status-on' : 'status-off'}>
                                                                        {record.isActive ? '✅ 완료' : '❌ 미완료'}
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="total-row">
                                                        <td><strong>{selectedMonth}월 총 합산 금액</strong></td>
                                                        <td colSpan={2} className="total-amount">
                                                            <strong>{attendanceData.totalBonus} BW</strong>
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="no-data-message">
                                            <p className="no-data-icon">📭</p>
                                            <p className="no-data-text">{selectedMonth}월 출석 기록이 없습니다</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'referral' && (
                    <div className="admin-panel">
                        <h2>🎁 추천 보너스 관리</h2>
                        <div className="test-section">
                            <p className="warning-text">⚠️ 추천 보너스 현황 조회</p>

                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="추천인 지갑 주소 입력"
                                    className="admin-input"
                                    value={referralSearchAddress}
                                    onChange={(e) => setReferralSearchAddress(e.target.value)}
                                    disabled={referralLoading}
                                />
                                <div className="date-selectors">
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        className="admin-select"
                                    >
                                        <option value={2024}>2024년</option>
                                        <option value={2025}>2025년</option>
                                        <option value={2026}>2026년</option>
                                    </select>
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                        className="admin-select"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                            <option key={m} value={m}>{m}월</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    className="admin-button primary"
                                    onClick={handleSearchReferral}
                                    disabled={referralLoading}
                                >
                                    {referralLoading ? '검색 중...' : '월별 검색'}
                                </button>
                            </div>

                            {referralError && (
                                <div className="error-message">{referralError}</div>
                            )}

                            {referralData && (
                                <div className="attendance-result-box">
                                    <h3>✅ {selectedMonth}월 추천 보너스 현황</h3>
                                    <div className="attendance-summary">
                                        <div className="summary-item">
                                            <span className="summary-label">전체 가입자 총 채굴량:</span>
                                            <span
                                                className="summary-value hoverable-amount"
                                                title={formatPrecise(referralData.monthlyTotal)}
                                            >
                                                {formatShort(referralData.monthlyTotal)} BW
                                            </span>
                                        </div>
                                    </div>

                                    {referralData.records && referralData.records.length > 0 ? (
                                        <div className="attendance-table-container">
                                            <h4>
                                                {isSearchMode && referralSearchAddress.trim()
                                                    ? `가입자: ${referralSearchAddress} ${selectedMonth}월 전체 목록`
                                                    : '전체 가입자 목록'
                                                }
                                            </h4>
                                            <table className="attendance-table">
                                                <thead>
                                                    <tr>
                                                        <th>가입자 지갑 주소</th>
                                                        <th>{isSearchMode ? '채굴 일자' : '가입 일자'}</th>
                                                        <th>일 채굴량</th>
                                                        <th>KYC 상태</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {referralData.records.map((record: any, index: number) => (
                                                        <tr key={index}>
                                                            <td className="wallet-cell">
                                                                {isSearchMode && record.referrerAddress
                                                                    ? record.referrerAddress
                                                                    : record.referredAddress
                                                                }
                                                            </td>
                                                            <td>
                                                                {isSearchMode && record.dateRange
                                                                    ? record.dateRange
                                                                    : formatDateTime(record.joinedDate)
                                                                }
                                                            </td>
                                                            <td
                                                                className="hoverable-amount"
                                                                title={formatPrecise(record.dailyMiningAmount)}
                                                            >
                                                                {formatShort(record.dailyMiningAmount)} BW
                                                            </td>
                                                            <td>
                                                                <span className={`kyc-status-${record.kycStatus.toLowerCase()}`}>
                                                                    {getKycStatusText(record.kycStatus)}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="total-row">
                                                        <td colSpan={3} style={{ textAlign: 'right', paddingRight: '20px' }}>
                                                            <strong>총 합산 금액</strong>
                                                        </td>
                                                        <td className="total-amount">
                                                            <strong
                                                                className="hoverable-amount"
                                                                title={formatPrecise(referralData.monthlyTotal)}
                                                            >
                                                                {formatShort(referralData.monthlyTotal)} BW
                                                            </strong>
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="no-data-message">
                                            <p className="no-data-icon">📭</p>
                                            <p className="no-data-text">{selectedMonth}월 추천 가입자가 없습니다</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'partner' && (
                    <div className="admin-panel">
                        <h2>🏪 가맹점 등록 관리</h2>
                        <p>가맹점 신청 목록 및 승인/거부</p>
                    </div>
                )}

                {activeTab === 'kyc' && (
                    <div className="admin-panel">
                        <h2>🆔 KYC 신청 관리</h2>
                        <p>KYC 신청 목록 및 승인/거부</p>
                    </div>
                )}

                {activeTab === 'halving' && (
                    <div className="admin-panel">
                        <h2>⏰ 반감기 정책 관리</h2>
                        <p>반감기 스케줄 및 이력</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminPage;
