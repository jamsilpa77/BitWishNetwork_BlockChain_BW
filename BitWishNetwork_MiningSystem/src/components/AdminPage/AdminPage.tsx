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

        if (!window.confirm('정말로 이 지갑의 마이닝 데이터를 초기화하시겠습니까?\n\n초기화 후:\n- 누적 보상: 0 BW\n- 마이닝 상태: 중지\n- 다시 마이닝 시작 시 0부터 새로 채굴')) {
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
                alert('✅ 마이닝 데이터가 초기화되었습니다\n\n초기화된 데이터:\n- 누적 보상: 0 BW\n- 마이닝 상태: 중지');

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
            const response = await fetch(`http://localhost:5001/api/admin/attendance/${attendanceSearchAddress}`);

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
                                <button
                                    className="admin-button primary"
                                    onClick={handleSearchAttendance}
                                    disabled={attendanceLoading}
                                >
                                    {attendanceLoading ? '검색 중...' : '검색'}
                                </button>
                            </div>

                            {attendanceError && (
                                <div className="error-message">{attendanceError}</div>
                            )}

                            {attendanceData && (
                                <div className="attendance-result-box">
                                    <h3>✅ 출석 현황</h3>
                                    <div className="attendance-summary">
                                        <div className="summary-item">
                                            <span className="summary-label">출석 보너스 상태:</span>
                                            <span className={`summary-value ${attendanceData.isActive ? 'active' : 'inactive'}`}>
                                                {attendanceData.isActive ? '🟢 ON' : '🔴 OFF'}
                                            </span>
                                        </div>
                                    </div>

                                    {attendanceData.records && attendanceData.records.length > 0 ? (
                                        <div className="attendance-table-container">
                                            <h4>출석 이력 (최근 30일)</h4>
                                            <table className="attendance-table">
                                                <thead>
                                                    <tr>
                                                        <th>년</th>
                                                        <th>월</th>
                                                        <th>일</th>
                                                        <th>5% 채굴 BW 수량</th>
                                                        <th>ON/OFF 여부</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {attendanceData.records.map((record: any, index: number) => (
                                                        <tr key={index}>
                                                            <td>{record.year}</td>
                                                            <td>{record.month}</td>
                                                            <td>{record.day}</td>
                                                            <td>{record.bonusAmount || '-'} BW</td>
                                                            <td>
                                                                <span className={record.isActive ? 'status-on' : 'status-off'}>
                                                                    {record.isActive ? '✅ ON' : '❌ OFF'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="no-data-message">
                                            <p className="no-data-icon">📭</p>
                                            <p className="no-data-text">출석 기록이 없습니다</p>
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
                        <p>추천 보너스 현황 및 관리</p>
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
