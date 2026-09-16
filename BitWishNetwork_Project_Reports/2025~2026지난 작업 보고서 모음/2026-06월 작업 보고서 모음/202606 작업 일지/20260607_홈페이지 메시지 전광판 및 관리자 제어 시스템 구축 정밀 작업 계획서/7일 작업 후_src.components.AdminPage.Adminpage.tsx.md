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
import KYCManager from './KYCManager';

const AdminPage: React.FC = () => {
    // --- [플랫폼 및 전광판 제어용 신규 상태 변수] ---
    const [tickerInputs, setTickerInputs] = useState({
        ko: '📢 [공지] BitWish Network에 오신 것을 환영합니다. 실시간 채굴 시스템이 가동 중입니다. 추후 코인 마이그레이션을 위해 KYC 승인을 받아주세요.',
        en: '📢 [Notice] Welcome to BitWish Network. Real-time mining is currently active. Please complete KYC verification for coin migration.',
        ja: '📢 [お知らせ] BitWish Networkへようこそ。リアルタイムマイニング가有効입니다. KYC認証를 완료해주세요.',
        zh: '📢 [公告] 欢迎来到 BitWish 网络。实时挖矿正在运行。请完成 KYC 验证以进行代币迁移。'
    });

    // --- [신규 삽입] 마우스 클릭형 이모지 입력 시스템 (상자 바깥에 배치) ---
    const [activeInput, setActiveInput] = useState<'ko' | 'en' | 'ja' | 'zh'>('ko');
    const handleInsertEmoji = (emoji: string) => {
        // 현재 브라우저 상에서 커서가 깜빡이며 초점이 맞춰진 입력창을 감지합니다.
        const activeElement = document.activeElement as HTMLInputElement;

        if (activeElement && activeElement.tagName === 'INPUT') {
            const start = activeElement.selectionStart || 0; // 커서 시작 위치
            const end = activeElement.selectionEnd || 0;     // 커서 끝 위치
            const currentValue = activeElement.value;

            // 커서 기준 앞부분텍스트 + 이모지 + 뒷부분텍스트를 정교하게 슬라이싱하여 조립합니다.
            const newValue = currentValue.substring(0, start) + emoji + currentValue.substring(end);

            setTickerInputs(prev => ({
                ...prev,
                [activeInput]: newValue
            }));

            // 데이터가 입력된 후 커서가 맨 뒤로 튕기는 현상을 방지하고, 이모지 바로 뒤에 깜빡이도록 강제 조정합니다.
            setTimeout(() => {
                activeElement.focus();
                const nextPosition = start + emoji.length;
                activeElement.setSelectionRange(nextPosition, nextPosition);
            }, 0);
        } else {
            // 혹시 커서 위치를 찾지 못할 경우의 대비책으로 맨 뒤에 이모지를 붙여넣습니다.
            setTickerInputs(prev => ({
                ...prev,
                [activeInput]: (prev as any)[activeInput] + emoji
            }));
        }
    };
    // --------------------------------------------------

    const [subAdmins] = useState([
        { email: 'admin@bitwish.network', nickname: '최고 관리자', grade: 'Super-Admin' },
        { email: 'sub_01@bitwish.network', nickname: '보안 담당자', grade: 'Sub-Admin' }
    ]);

    const [systemLogs, setSystemLogs] = useState([
        { action: '메인 전광판 메시지 수정 및 동기화', operator: '최고 관리자', time: '2026-06-06 21:05:40' },
        { action: '대시보드 시스템 초기 연결 성립', operator: 'System', time: '2026-06-06 12:00:00' }
    ]);

    const handleUpdateTicker = async () => {
        const currentLangKey = (localStorage.getItem('bw_lang') || 'ko') as 'ko' | 'en' | 'ja' | 'zh';
        const updatedText = tickerInputs[currentLangKey];

        localStorage.setItem('BW_TICKER_TEXT_LOCAL', JSON.stringify(tickerInputs));
        localStorage.setItem('BW_TICKER_UPDATE', Date.now().toString());

        setSystemLogs(prev => [
            { action: `[전광판 공지수정] ${updatedText}`, operator: '최고 관리자', time: new Date().toLocaleString() },
            ...prev
        ]);

        try {
            await fetch('http://localhost:5001/api/admin/system/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticker: tickerInputs })
            });
        } catch (e) {
            console.log('Backend server is offline, running on local storage fallback.');
        }

        alert('✅ 전광판 문구 수정을 완료했습니다. 홈페이지 창에서 글자가 실시간으로 바뀌었는지 확인해보세요.');
    };
    // ----------------------------------------------------

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
    const [isSearchMode, setIsSearchMode] = useState<boolean>(false); // 검색 모드 상태 추가
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false); // [작업 1 개선] 새로고침 전용 로딩 상태 추가

    // [추천 보상 현황] 전용 state 추가
    const [rewardStatusDetail, setRewardStatusDetail] = useState<any>(null);
    const [totalRewardIssued, setTotalRewardIssued] = useState<number>(0);
    const [totalBonusRateSum, setTotalBonusRateSum] = useState<string>("0.00");
    const [rewardSearchAddress, setRewardSearchAddress] = useState<string>('');
    const [rewardLoading, setRewardLoading] = useState<boolean>(false);

    // 1. 추천 보상 전체 합계 조회
    const fetchTotalRewards = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/admin/rewards/total');
            const data = await response.json();
            if (data.success) {
                setTotalRewardIssued(data.totalIssued);
                setTotalBonusRateSum(data.totalBonusRate); // [수리] 0.00% 원인 해결
            }
        } catch (err) {
            console.error('전체 보상 합계 조회 실패:', err);
        }
    };

    // 2. 추천 보상 개별 상세 조회
    const handleSearchRewardStatus = async () => {
        if (!rewardSearchAddress.trim()) {
            alert('지갑 주소를 입력하세요');
            return;
        }

        setRewardLoading(true);
        try {
            const response = await fetch(`http://localhost:5001/api/admin/rewards/detail/${rewardSearchAddress}`);
            const data = await response.json();
            if (data.success) {
                setRewardStatusDetail(data.data);
            } else {
                alert(data.message || '데이터를 찾을 수 없습니다');
                setRewardStatusDetail(null);
            }
        } catch (err) {
            console.error('상세 조회 실패:', err);
            alert('서버 연결 실패');
        } finally {
            setRewardLoading(false);
        }
    };

    // [작업 1 개정] 개별 데이터 기반 통합 실시간 엔진탑재
    const [realTimeTotal, setRealTimeTotal] = useState<number>(0);

    // 데이터가 로드될 때마다 기준점 합계 동기화
    React.useEffect(() => {
        if (referralData && referralData.monthlyTotal) {
            setRealTimeTotal(parseFloat(referralData.monthlyTotal));
        }
    }, [referralData]);

    React.useEffect(() => {
        const timer = setInterval(() => {
            setReferralData((prev: any) => {
                if (!prev || !prev.records) return prev;

                // 1. 개별 유저의 진짜 채굴량 실시간 가운팅
                const newRecords = prev.records.map((r: any) => {
                    if (r.isMining) {
                        const rate = parseFloat(r.currentTotalRate || '0.25');
                        const increment = rate / 3600;
                        return {
                            ...r,
                            dailyMiningAmount: (parseFloat(r.dailyMiningAmount) + increment).toFixed(8)
                        };
                    }
                    return r;
                });

                // 2. 가공된 개별 수치를 모두 더해 "전체 가입자 총 채굴량" 실시간 산출
                const newTotal = newRecords.reduce((sum: number, r: any) => {
                    return sum + parseFloat(r.dailyMiningAmount);
                }, 0);

                setRealTimeTotal(newTotal);

                return {
                    ...prev,
                    monthlyTotal: newTotal.toFixed(8),
                    records: newRecords
                };
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [referralData === null]);


    // 탭 변경 시 전체 통계 로딩
    React.useEffect(() => {
        if (activeTab === 'rewardStatus') {
            fetchTotalRewards();
        }
    }, [activeTab]);


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

        if (!window.confirm('정말로 이 지갑의 마이닝 데이터를 초기화하시겠습니까?\n\n초기화 후:\n- 누적 보상: 0 BW\n- 마이닝 상태: 중지\n- 추천 보너스 보관함: 0 BW\n- 월별 정산내역: 0 BW\n- 다시 마이닝 시작 시 0부터 새로 채굴')) {
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
                console.log(`[Admin] 초기화 신호 전송 준비: ${searchAddress}`);

                localStorage.setItem('BW_SYSTEM_RESET_TRIGGER', JSON.stringify({
                    type: 'RESET',
                    target: searchAddress,
                    timestamp: Date.now()
                }));

                alert('✅ 마이닝 데이터가 초기화되었습니다\n\n초기화된 데이터:\n- 누적 보상: 0 BW\n- 마이닝 상태: 중지\n- 추천 보너스 보관함: 0 BW\n- 월별 정산내역: 0 BW');

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


    // 추천 보너스 데이터 검색 (개별 주소 검색 로직 고도화)
    const handleSearchReferral = async () => {
        if (!referralSearchAddress.trim()) {
            alert('지갑 주소를 입력하세요');
            return;
        }

        setReferralLoading(true);
        setReferralError('');

        try {
            const response = await fetch(`http://localhost:5001/api/admin/referral/${referralSearchAddress}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success && data.data && data.data.records) {
                const filtered = data.data.records.filter((r: any) =>
                    r.referrerAddress.toLowerCase() === referralSearchAddress.toLowerCase() ||
                    r.referredAddress.toLowerCase() === referralSearchAddress.toLowerCase()
                );

                setReferralData({
                    ...data.data,
                    records: filtered
                });
                setIsSearchMode(true);
            } else {
                setReferralError('데이터를 찾을 수 없습니다');
                setReferralData(null);
                setIsSearchMode(false);
            }
        } catch (err: any) {
            console.error('추천 검색 오류:', err);
            setReferralError('서버 연결 실패');
            setReferralData(null);
        } finally {
            setReferralLoading(false);
        }
    };

    // [작업 1 개선] 지능형 새로고침 함수 (검색 모드 유지 및 로딩 분리)
    const handleSmartRefresh = async () => {
        setIsRefreshing(true);
        try {
            if (isSearchMode && referralSearchAddress) {
                await handleSearchReferral(); // 검색 중이면 기존 검색 결과 최신화
            } else {
                await fetchAllReferrals(); // 전체 목록이면 전체 목록 최신화
            }
        } finally {
            setIsRefreshing(false);
        }
    };

    // 전체 추천 보너스 목록 조회 (초기 로딩용)
    const fetchAllReferrals = async () => {
        setReferralLoading(true);
        setReferralError('');

        try {
            const response = await fetch(`http://localhost:5001/api/admin/referral/all`);

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
        if (activeTab === 'referral' && !referralData) {
            fetchAllReferrals();
        }
    }, [activeTab]);

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
            'APPLIED': '신청',
            'NOT_APPLIED': '미신청',
            'REVIEWING': '심사중',
            'APPROVED': '승인',
            'REJECTED': '미승인',
            'PENDING': '보류'
        };
        return statusMap[status] || status || '알 수 없음';
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
                    🎁 가입자 목록
                </button>
                <button
                    className={`admin-tab ${activeTab === 'rewardStatus' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rewardStatus')}
                >
                    💰 추천 보상 현황
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
                    <div className="admin-panel animate-fade-in">
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

                        {/* =======================================================
                           [신규 삽입] 최고 관리자를 위한 제어 및 로그 시스템 UI판 
                           ======================================================= */}
                        <div className="admin-system-container">
                            <h3 className="admin-system-title">⚙️ 플랫폼 제어 및 관리자 시스템 (Admin Controls)</h3>

                            <div className="admin-system-grid">
                                {/* 1. 홈페이지 메시지 원격 수정 입력란 */}
                                <div className="admin-system-card">
                                    <h4>📢 실시간 흐르는 전광판 메시지 제어</h4>
                                    {/* --- [신규 이식] 원클릭 이모지 빠른 선택 바 --- */}
                                    <div style={{ display: 'flex', gap: '6px', marginBottom: '15px', flexWrap: 'wrap', background: '#f1f5f9', padding: '10px', borderRadius: '8px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                                            {activeInput === 'ko' ? '🇰🇷 한국어 칸 입력중' : activeInput === 'en' ? '🇺🇸 English 입력중' : activeInput === 'ja' ? '🇯🇵 日本語 입력중' : '🇨🇳 中文 입력중'} (원클릭 입력):
                                        </span>
                                        {['📢', '🔥', '🚀', '💎', '🏆', '💰', '⚠️', '⭐', '🎁', '🔔', '🟢', '🔴', '⚡'].map(emoji => (
                                            <button
                                                key={emoji}
                                                type="button"
                                                onClick={() => handleInsertEmoji(emoji)}
                                                style={{ padding: '4px 8px', fontSize: '1.2rem', background: '#fff', border: '1px solid #cbd5e1', cursor: 'pointer', borderRadius: '4px', transition: 'transform 0.1s' }}
                                                onMouseDown={e => e.preventDefault()} // 마우스 클릭 시 입력창 커서가 풀리는 현상 방지
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="ticker-form">
                                        <div className="form-group" style={{ marginBottom: '10px' }}>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#666' }}>🇰🇷 한국어 공지 문구</label>
                                            <input type="text" className="admin-input" style={{ width: '100%', marginTop: '5px' }} value={tickerInputs.ko} onChange={e => setTickerInputs({ ...tickerInputs, ko: e.target.value })} onFocus={() => setActiveInput('ko')} />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: '10px' }}>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#666' }}>🇺🇸 English Notice</label>
                                            <input type="text" className="admin-input" style={{ width: '100%', marginTop: '5px' }} value={tickerInputs.en} onChange={e => setTickerInputs({ ...tickerInputs, en: e.target.value })} onFocus={() => setActiveInput('en')} />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: '10px' }}>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#666' }}>🇯🇵 日本語 お知らせ</label>
                                            <input type="text" className="admin-input" style={{ width: '100%', marginTop: '5px' }} value={tickerInputs.ja} onChange={e => setTickerInputs({ ...tickerInputs, ja: e.target.value })} onFocus={() => setActiveInput('ja')} />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: '15px' }}>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#666' }}>🇨🇳 中文 公告</label>
                                            <input type="text" className="admin-input" style={{ width: '100%', marginTop: '5px' }} value={tickerInputs.zh} onChange={e => setTickerInputs({ ...tickerInputs, zh: e.target.value })} onFocus={() => setActiveInput('zh')} />
                                        </div>
                                        <button className="admin-button primary" onClick={handleUpdateTicker} style={{ width: '100%', padding: '12px', fontWeight: 'bold' }}>
                                            💾 입력한 전광판 공지 실시간 일괄 업데이트 적용
                                        </button>
                                    </div>
                                </div>

                                {/* 2. 부관리자 권한 계정 승인 관리 테이블 */}
                                <div className="admin-system-card">
                                    <h4>👥 어드민 권한 부여 계정 관리</h4>
                                    <table className="admin-system-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                                        <thead>
                                            <tr style={{ background: '#f1f5f9' }}>
                                                <th style={{ padding: '8px', textAlign: 'left' }}>어드민 계정</th>
                                                <th style={{ padding: '8px', textAlign: 'left' }}>별칭</th>
                                                <th style={{ padding: '8px', textAlign: 'left' }}>권한 등급</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {subAdmins.map((adm, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                    <td style={{ padding: '10px 8px', fontFamily: 'monospace' }}>{adm.email}</td>
                                                    <td style={{ padding: '10px 8px' }}>{adm.nickname}</td>
                                                    <td style={{ padding: '10px 8px' }}>
                                                        <span style={{
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            fontSize: '11px',
                                                            fontWeight: 'bold',
                                                            background: adm.grade === 'Super-Admin' ? '#fee2e2' : '#e0f2fe',
                                                            color: adm.grade === 'Super-Admin' ? '#ef4444' : '#0284c7'
                                                        }}>
                                                            {adm.grade}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                                        <input type="text" className="admin-input" placeholder="어드민으로 등록할 이메일 주소 입력" style={{ flex: 1 }} />
                                        <button className="admin-button primary" style={{ padding: '10px 20px' }}>임명하기</button>
                                    </div>
                                </div>
                            </div>

                            {/* 3. 보안 행위 이력 로그 콘솔 */}
                            <div className="admin-system-card" style={{ marginTop: '20px' }}>
                                <h4>📜 실시간 시스템 보안 로그 (System Timeline Logs)</h4>
                                <div className="admin-log-console" style={{
                                    background: '#0f172a',
                                    color: '#38bdf8',
                                    fontFamily: 'monospace',
                                    padding: '15px',
                                    borderRadius: '8px',
                                    maxHeight: '130px',
                                    overflowY: 'auto',
                                    fontSize: '13px'
                                }}>
                                    {systemLogs.map((log, idx) => (
                                        <div key={idx} style={{ marginBottom: '6px' }}>
                                            <span style={{ color: '#64748b' }}>[{log.time}]</span>{' '}
                                            <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{log.operator}</span> :{' '}
                                            <span>{log.action}</span>
                                        </div>
                                    ))}
                                </div>
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
                        <h2>🎁 가입자 목록 관리</h2>
                        <div className="test-section">
                            <p className="warning-text">⚠️ 가입자 현황 조회</p>

                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="지갑 주소 입력"
                                    className="admin-input"
                                    value={referralSearchAddress}
                                    onChange={(e) => setReferralSearchAddress(e.target.value)}
                                    disabled={referralLoading}
                                />
                                <button
                                    className="admin-button primary search-button-fixed"
                                    onClick={handleSearchReferral}
                                    disabled={referralLoading || isRefreshing}
                                >
                                    {referralLoading && !isRefreshing ? '검색 중...' : '주소 검색'}
                                </button>
                                {/* [작업 1 개정] 진짜 데이터 기반 지능형 새로고침 적용 */}
                                <button
                                    className="admin-button secondary refresh-icon-button"
                                    onClick={handleSmartRefresh}
                                    title="목록 새로고침"
                                    disabled={referralLoading || isRefreshing}
                                >
                                    {isRefreshing ? '...' : '🔄'}
                                </button>
                            </div>


                            {referralError && (
                                <div className="error-message">{referralError}</div>
                            )}

                            {referralData && (
                                <div className={`attendance-result-box ${isRefreshing ? 'refreshing' : ''}`}>
                                    <h3>✅ 가입자 정보 확인</h3>
                                    <div className="attendance-summary">
                                        <div className="summary-item">
                                            <span className="summary-label">전체 가입자 총 채굴량:</span>
                                            <span className="summary-value active">
                                                {parseFloat(realTimeTotal.toString()).toFixed(8)} BW
                                            </span>
                                        </div>
                                    </div>

                                    {referralData.records && referralData.records.length > 0 ? (
                                        <div className="attendance-table-container">
                                            <h4>
                                                {isSearchMode && referralSearchAddress.trim()
                                                    ? `가입자: ${referralSearchAddress} 전체 검색 결과`
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
                                            <p className="no-data-text">추천 가입자가 없습니다</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'rewardStatus' && (
                    <div className="admin-panel">
                        <h2>💎 보상 현황 상태</h2>

                        <div className="test-section">
                            <h3>추천 보상 전체 지급 상태</h3>

                            <div className="summary-split-container">
                                <div className="total-summary-card reward-card">
                                    <span className="total-label">전체 지급 보상</span>
                                    <span className="total-value">{formatPrecise(totalRewardIssued)} BW</span>
                                </div>
                                <div className="total-summary-card bonus-card">
                                    <span className="total-label">전체 지급 보너스</span>
                                    <span className="total-value" style={{ color: '#a855f7' }}>
                                        {totalBonusRateSum} %
                                    </span>
                                </div>
                            </div>

                            <div className="search-box" style={{ marginTop: '30px' }}>
                                <input
                                    type="text"
                                    placeholder="검색할 지갑 주소 입력"
                                    className="admin-input"
                                    value={rewardSearchAddress}
                                    onChange={(e) => setRewardSearchAddress(e.target.value)}
                                />
                                <button
                                    className="admin-button primary"
                                    onClick={handleSearchRewardStatus}
                                    disabled={rewardLoading}
                                >
                                    {rewardLoading ? '검색 중...' : '지갑 검색'}
                                </button>
                            </div>

                            {rewardStatusDetail && (
                                <div className="reward-detail-container" style={{ marginTop: '30px' }}>
                                    <h4>👤 개별 보상 상세 정보</h4>
                                    <div className="data-grid">
                                        <div className="data-item">
                                            <span className="data-label">지갑 주소:</span>
                                            <span className="data-value">{rewardStatusDetail.walletAddress}</span>
                                        </div>
                                        <div className="data-item">
                                            <span className="data-label">본인 추천 코드:</span>
                                            <span className="data-value">{rewardStatusDetail.myReferralCode}</span>
                                        </div>
                                        <div className="data-item">
                                            <span className="data-label">가입 날짜:</span>
                                            <span className="data-value">{formatDateTime(rewardStatusDetail.joinDate)}</span>
                                        </div>
                                        <div className="data-item">
                                            <span className="data-label">총 받은 보상:</span>
                                            <span className="data-value" style={{ color: '#ffd700', fontWeight: 'bold' }}>
                                                {formatPrecise(rewardStatusDetail.totalReward)} BW
                                            </span>
                                        </div>
                                        <div className="data-item">
                                            <span className="data-label">본인 코드로 가입한 가입자 수:</span>
                                            <span className="data-value">{rewardStatusDetail.referralCount}명</span>
                                        </div>
                                    </div>

                                    <div className="referral-list-section" style={{ marginTop: '40px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                            <h4 style={{ margin: 0 }}>👥 내 코드로 가입된 가입자 목록</h4>
                                            <div style={{ display: 'flex', gap: '15px', fontSize: '0.95rem', fontWeight: 'bold' }}>
                                                <span style={{ color: '#f59e0b' }}>전체 보상 ({parseFloat(rewardStatusDetail.totalReward || "0").toFixed(2)} BW)</span>
                                                <span style={{ color: '#a855f7' }}>전체 보너스 ({rewardStatusDetail.totalBonusRate || "0.00"} %)</span>
                                            </div>
                                        </div>

                                        {rewardStatusDetail.referralList && rewardStatusDetail.referralList.length > 0 ? (
                                            <table className="attendance-table">
                                                <thead>
                                                    <tr>
                                                        <th>가입자 지갑 주소</th>
                                                        <th>가입 날짜</th>
                                                        <th>보상 지급 상태</th>
                                                        <th>보너스 지급 상태</th>
                                                        <th>KYC 상태</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {rewardStatusDetail.referralList.map((ref: any, idx: number) => (
                                                        <tr key={idx}>
                                                            <td className="wallet-cell">{ref.childWalletAddress}</td>
                                                            <td>{formatDateTime(ref.joinedAt)}</td>
                                                            <td style={{ color: '#4caf50', fontWeight: 'bold' }}>✅ 지급완료 (1 BW)</td>
                                                            <td style={{ color: '#a855f7', fontWeight: 'bold' }}>지급완료 ({parseFloat(ref.bonusRate || "0").toFixed(0)} %)</td>
                                                            <td>
                                                                <span className={`kyc-status-${(ref.kycStatus || 'NOT_APPLIED').toLowerCase()}`}>
                                                                    {getKycStatusText(ref.kycStatus || 'NOT_APPLIED')}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="no-data-message" style={{ padding: '20px' }}>
                                                추천 가입자가 없습니다.
                                            </div>
                                        )}
                                    </div>
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
                        <h2>🆔 KYC 거버넌스 제어</h2>
                        <KYCManager />
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