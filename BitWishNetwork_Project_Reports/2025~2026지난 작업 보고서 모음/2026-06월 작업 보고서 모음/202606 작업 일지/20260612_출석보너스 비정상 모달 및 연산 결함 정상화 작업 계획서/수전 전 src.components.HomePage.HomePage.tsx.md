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

import React, { useState, useEffect, useRef } from 'react';
import { LanguageManager } from '../../utils/LanguageManager/LanguageManager';
import { Decimal } from 'decimal.js';
import { RealTimeSyncService } from '../../services/MiningService/RealTimeSyncService';
import { PrecisionCalculator } from '../../utils/PrecisionCalculator/PrecisionCalculator';
import {
    RealTimeMiningStatus,
    NetworkStatus,
    Language
} from '../../types';
import MiningStatusModal from '../MiningStatusModal/MiningStatusModal';
import CreateWalletModal from '../../components/CreateWalletModal/CreateWalletModal';
import MyWalletModal from '../../components/MyWalletModal/MyWalletModal';
import ReferralModal from '../../components/ReferralModal/ReferralModal';
import WalletAuthModal from '../../components/WalletAuthModal/WalletAuthModal';
import MnemonicAuthModal from '../MnemonicAuthModal/MnemonicAuthModal';
// import MiningAuthModal from '../MiningAuthModal/MiningAuthModal';
// import SecondPasswordModal from '../SecondPasswordModal/SecondPasswordModal';
import { walletService } from '../../services/BlockchainService/WalletService';
import './HomePage.css';

/**
 * 홈페이지 컴포넌트 - 완벽한 독립성 보장
 * BitWishNetwork 로고, 네비게이션, 실시간 BW 채굴 상태, 6개 정보 카드
 */
const HomePage: React.FC = () => {
    // 절대 준수사항: 전역 변수 사용 금지
    const [languageManager] = useState(() => new LanguageManager());
    const [realTimeSyncService] = useState(() => RealTimeSyncService.getInstance()); // [Task B] 싱글톤으로 교체 (중요!)
    const [precisionCalculator] = useState(() => new PrecisionCalculator());

    const [currentLanguage, setCurrentLanguage] = useState<Language>(() => (localStorage.getItem('bw_lang') as Language) || 'ko');
    // --- [신규 삽입] 흐르는 전광판 메시지 제어 변수 ---
    const [tickerMessage, setTickerMessage] = useState<string>('');

    useEffect(() => {
        const fetchTickerMessage = async () => {
            // 1. 우선 로컬 저장소에 저장된 메시지가 있는지 확인합니다.
            const localDataStr = localStorage.getItem('BW_TICKER_TEXT_LOCAL');
            if (localDataStr) {
                try {
                    const localObj = JSON.parse(localDataStr);
                    const msg = localObj[currentLanguage] || localObj['en'];
                    if (msg) {
                        setTickerMessage(msg);
                        return;
                    }
                } catch (e) { }
            }

            // 2. 서버가 켜져 있다면 서버 데이터를 가져옵니다.
            try {
                const response = await fetch('/api/admin/system/config');
                const data = await response.json();
                if (data.success && data.config) {
                    const msg = data.config.ticker[currentLanguage] || data.config.ticker['en'];
                    setTickerMessage(msg);
                }
            } catch (error) {
                // 3. 서버가 꺼져 있을 때 기본으로 출력될 4개국어 메시지입니다.
                const fallbacks: any = {
                    ko: '📢 [공지] BitWish Network에 오신 것을 환영합니다. 실시간 채굴 시스템이 가동 중입니다. 추후 코인 마이그레이션을 위해 KYC 승인을 받아주세요.',
                    en: '📢 [Notice] Welcome to BitWish Network. Real-time mining is currently active. Please complete KYC verification for coin migration.',
                    ja: '📢 [お知らせ] BitWish Networkへようこそ。リアルタイムマイニング가有効です。KYC認証を完了してください。',
                    zh: '📢 [公告] 欢迎来到 BitWish 网络。实时挖矿正在运行。请完成 KYC 验证以进行代币迁移。'
                };
                setTickerMessage(fallbacks[currentLanguage] || fallbacks['en']);
            }
        };

        fetchTickerMessage();

        // 관리자 창에서 전광판 문구를 수정했을 때 실시간으로 즉시 글자가 바뀌도록 감지하는 신호기입니다.
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'BW_TICKER_UPDATE') {
                fetchTickerMessage();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [currentLanguage]);
    // ----------------------------------------------------
    const [isExtensionInstalled, setIsExtensionInstalled] = useState(false);

    useEffect(() => {
        const checkExtensionAndWallet = () => {
            if (document.documentElement.dataset['bitwishInstalled'] === "true") {
                setIsExtensionInstalled(true);
            } else {
                setIsExtensionInstalled(false);
            }
            
            const currentAddr = walletService.getCurrentWalletAddress();
            if (currentAddr) {
                window.postMessage({
                    type: "BITWISH_WALLET_CONNECTED",
                    walletAddress: currentAddr
                }, "*");
            }
        };

        checkExtensionAndWallet();
        const interval = setInterval(checkExtensionAndWallet, 3000);
        return () => clearInterval(interval);
    }, []);

    const [isDarkMode, setIsDarkMode] = useState(false);
    const [miningStatus, setMiningStatus] = useState<RealTimeMiningStatus | null>(null);
    const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('DISCONNECTED');
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    // [Task B] 전역 통계 인터페이스 정의
    interface GlobalStats {
        totalUsers: number;
        totalBlocks: number;
        currentIssued: Decimal;
        remainingSupply: Decimal;
        issuanceRate: string;
        totalSettlementAmount?: string; // [Phase 3 추가]
        totalLockedAmount?: string;     // [Phase 4 추가]
        totalReleasedAmount?: string;   // [Phase 4 추가]
    }

    // [Task B] 전역 통계 데이터 (Decimal 정밀도 유지 및 실시간 이동용)
    const [globalStats, setGlobalStats] = useState<GlobalStats>({
        totalUsers: 0,
        totalBlocks: 0,
        currentIssued: new Decimal(0),
        remainingSupply: new Decimal(21000000000),
        issuanceRate: '0.00',
        totalSettlementAmount: '0.00000000', // [Phase 3 추가]
        totalLockedAmount: '0.00000000',     // [Phase 4 추가]
        totalReleasedAmount: '0.00000000'    // [Phase 4 추가]
    });

    // Modals State
    const [isMiningModalOpen, setIsMiningModalOpen] = useState(false);
    const [isCreateWalletModalOpen, setIsCreateWalletModalOpen] = useState(false);
    const [isMyWalletModalOpen, setIsMyWalletModalOpen] = useState(false);
    const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
    const [isWalletAuthModalOpen, setIsWalletAuthModalOpen] = useState(false);
    const [isSecondPasswordModalOpen, setIsSecondPasswordModalOpen] = useState(false);
    const [isMnemonicModalOpen, setIsMnemonicModalOpen] = useState(false);

    // [Step 3-1] 멀티 포커스(Z-Index) 관리 상태 추가
    const [activeModal, setActiveModal] = useState<string>('');

    const handleFocus = (id: string) => {
        setActiveModal(id);
    };

    const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
    const [tickerInterval, setTickerInterval] = useState<NodeJS.Timeout | null>(null); // [신규] 홈페이지 전용 티커
    const [isConnected, setIsConnected] = useState(true);
    const [isMiningInProgress, setIsMiningInProgress] = useState(false);
    const [authenticatedAddress, setAuthenticatedAddress] = useState<string>('');

    /**
     * 컴포넌트 마운트 시 초기화
     */
    useEffect(() => {
        initializeHomePage();
        startRealTimeSync();
        startAutoRefresh();
        startHomePageTicker(); // [신규] 초당 통계 엔진 시작

        // 마이닝 시작 성공 시 최신 블록 카운트 즉시 반영용 이벤트 리스너 등록
        const handleBlockCreated = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail && detail.totalBlockCount !== undefined) {
                setGlobalStats(prev => ({
                    ...prev,
                    totalBlocks: detail.totalBlockCount
                }));
            }
        };
        window.addEventListener('mining-block-created', handleBlockCreated);

        return () => {
            stopRealTimeSync();
            stopAutoRefresh();
            if (tickerInterval) clearInterval(tickerInterval);
            window.removeEventListener('mining-block-created', handleBlockCreated);
        };
    }, []);

    /**
     * 홈페이지 초기화
     */
    const initializeHomePage = (): void => {
        try {
            // 언어 설정
            languageManager.setLanguage(currentLanguage);

            // 다크 모드 설정
            const savedTheme = localStorage.getItem('bw-theme');
            if (savedTheme === 'dark') {
                setIsDarkMode(true);
                document.body.classList.add('dark-mode');
            }

            // 초기 마이닝 상태 로드
            loadMiningStatus();
            fetchGlobalStats(); // 초기 서버 통계 로드
        } catch (error) {
            console.error('홈페이지 초기화 오류:', error);
        }
    };

    /**
     * [Task B] 전역 통계 데이터 가져오기 (초기 데이터 및 10초 주기 교정)
     */
    const fetchGlobalStats = async () => {
        try {
            const response = await fetch('/api/stats/realtime');
            const result = await response.json();
            if (result.success && result.data) {
                // 숫자를 Decimal 객체로 저장하여 누적 오류 방지
                setGlobalStats({
                    ...result.data,
                    currentIssued: new Decimal(result.data.currentIssued || 0),
                    remainingSupply: new Decimal(result.data.remainingSupply || 21000000000)
                });
            }
        } catch (e) {
            console.error('Global stats fetch failed:', e);
        }
    };

    /**
     * [Task B-2] 홈페이지 실시간 티커 (가상 로직 제거 완료)
     * 이제 오직 서버로부터 받은 실제 데이터(Global Stats)가 갱신될 때만 UI가 반응합니다.
     */
    const startHomePageTicker = () => {
        // [중요] 임의의 데이터 가공 로직을 전면 삭제했습니다.
        // 데이터 정합성을 위해 서버의 실제 데이터(fetchGlobalStats) 통제만 따릅니다.
        if (tickerInterval) clearInterval(tickerInterval);
    };

    /**
     * 실시간 동기화 시작 (서비스 구독)
     */
    const startRealTimeSync = (): void => {
        try {
            // 서비스 구독하여 현재 유저의 채굴량이 변할 때 홈페이지 상태도 갱신
            realTimeSyncService.subscribe((status) => {
                setMiningStatus(status);
                setLastUpdate(new Date());
            });
        } catch (error) {
            console.error('실시간 동기화 시작 오류:', error);
        }
    };

    /**
     * 실시간 동기화 중지
     */
    const stopRealTimeSync = (): void => {
        try {
            realTimeSyncService.stopSync();
        } catch (error) {
            console.error('실시간 동기화 중지 오류:', error);
        }
    };

    /**
     * 자동 새로고침 시작 (1초마다 실시간 데이터 수신)
     */
    const startAutoRefresh = (): void => {
        try {
            const interval = setInterval(() => {
                refreshHomePage();
                fetchGlobalStats(); // [Task B-3] 1초 주기로 서버의 실제 통계 수신
            }, 1000); // 1초마다 갱신 (100% 서버 데이터 기반)
            setRefreshInterval(interval);
        } catch (error) {
            console.error('자동 새로고침 시작 오류:', error);
        }
    };

    /**
     * 자동 새로고침 중지
     */
    const stopAutoRefresh = (): void => {
        try {
            if (refreshInterval) {
                clearInterval(refreshInterval);
                setRefreshInterval(null);
            }
        } catch (error) {
            console.error('자동 새로고침 중지 오류:', error);
        }
    };

    /**
     * 홈페이지 새로고침
     */
    const refreshHomePage = (): void => {
        try {
            // 마이닝 상태 로드
            loadMiningStatus();

            // 마지막 업데이트 시간 갱신
            setLastUpdate(new Date());

            // 네트워크 상태 확인
            setIsConnected(true);

            console.log('홈페이지 새로고침 완료');
        } catch (error) {
            console.error('홈페이지 새로고침 오류:', error);
        }
    };

    /**
     * 수동 새로고침
     */
    const handleManualRefresh = (): void => {
        try {
            refreshHomePage();
            console.log('수동 새로고침 완료');
        } catch (error) {
            console.error('수동 새로고침 오류:', error);
        }
    };

    /**
     * 마이닝 상태 로드
     */
    const loadMiningStatus = (): void => {
        try {
            const status = realTimeSyncService.getCurrentStatus();
            setMiningStatus(status);
            // [신규] 마이닝 진행 여부 실시간 감지
            setIsMiningInProgress(realTimeSyncService.isMiningActive());
        } catch (error) {
            console.error('마이닝 상태 로드 오류:', error);
        }
    };

    /**
     * 언어 변경
     */
    const handleLanguageChange = (language: Language): void => {
        try {
            setCurrentLanguage(language);
            languageManager.setLanguage(language);
            // [최종 보강] 시스템 전역 언어 설정 저장 로직 추가
            localStorage.setItem('bw_lang', language);
        } catch (error) {
            console.error('언어 변경 오류:', error);
        }
    };

    /**
     * 다크 모드 토글
     */
    const toggleDarkMode = (): void => {
        try {
            const newDarkMode = !isDarkMode;
            setIsDarkMode(newDarkMode);

            if (newDarkMode) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('bw-theme', 'dark');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('bw-theme', 'light');
            }
        } catch (error) {
            console.error('다크 모드 토글 오류:', error);
        }
    };

    /**
     * 마이닝 시작 (모달 열기) -> 마이닝 인증 모달 오픈
     */
    const handleStartMining = (): void => {
        try {
            // [Phase 2] 10분 하이패스 세션 연동
            // @ts-ignore
            if (walletService.checkAuthSession()) {
                const sessionStr = localStorage.getItem('bw_mining_auth');
                if (sessionStr) {
                    const sessionData = JSON.parse(sessionStr);
                    if (sessionData.address) {
                        setAuthenticatedAddress(sessionData.address);
                        setIsMiningModalOpen(true);
                        return;
                    }
                }
            }

            // [Phase 3] 세션 만료 시 니모닉 파편 인증 모달 호출
            const currentAddr = walletService.getCurrentWalletAddress();
            if (currentAddr) {
                setAuthenticatedAddress(currentAddr);
            }
            // 지갑 주소 저장 여부와 상관없이 무조건 "니모닉 파편 보안 인증" 창을 엽니다!
            setIsMnemonicModalOpen(true);
        } catch (error) {
            console.error('마이닝 시작 핸들러 오류:', error);
        }
    };

    /**
     * 번역 텍스트 가져오기
     */
    const getTranslation = (key: string): string => {
        return languageManager.getTranslation(key, currentLanguage);
    };

    /**
     * 나의 지갑
     */
    const handleMyWallet = (): void => {
        try {
            // 1. 인증 세션 확인 (10분 유예)
            // @ts-ignore
            if (walletService.checkAuthSession()) {
                setIsMyWalletModalOpen(true);
            } else {
                // 2. 세션 만료 시 인증 모달 오픈
                setIsWalletAuthModalOpen(true);
            }
        } catch (error) {
            console.error('나의 지갑 오류:', error);
        }
    };

    /**
     * 지갑 만들기 (또는 나의 지갑 열기)
     */
    const handleCreateWallet = (): void => {
        try {
            // 무조건 지갑 생성 모달 열기 (지갑 존재 여부 상관없음)
            setIsCreateWalletModalOpen(true);
        } catch (error) {
            console.error('지갑 열기 오류:', error);
        }
    };

    /**
     * 숫자 포맷팅 (8자리 소수점)
     */
    const formatNumber = (value: number | string | undefined): string => {
        if (value === undefined || value === null || value === '') {
            return '0';
        }
        return precisionCalculator.formatForUI(new Decimal(value));
    };

    /**
     * 숫자 분리 (정수부/소수부) - UI 오버플로우 방지용
     */
    const splitNumber = (value: string | number) => {
        const numVal = typeof value === 'string' ? parseFloat(value) : value;
        const formatted = formatNumber(numVal);
        const [integerPart, decimalPart] = formatted.split('.');
        return {
            integerPart,
            decimalPart: decimalPart ? `.${decimalPart}` : ''
        };
    };

    /**
     * [New] CountUp Animation Hook (커스텀 구현)
     * 0부터 목표값까지 부드럽게 숫자가 올라가는 효과
     */
    const useCountUp = (targetValue: string | number, duration: number = 800) => {
        const [count, setCount] = useState('0');
        // [Task B-1 핵심] 이전 값을 기억하기 위한 useRef 도입
        const prevValueRef = useRef<Decimal>(new Decimal(targetValue || 0));

        useEffect(() => {
            let startTime: number;
            let animationFrameId: number;

            const targetNum = new Decimal(targetValue || 0);
            const startNum = prevValueRef.current; // 0이 아닌 직전 숫자에서 시작
            const diff = targetNum.minus(startNum);

            // 값이 변하지 않았으면 애니메이션 생략
            if (diff.isZero()) {
                setCount(targetNum.toFixed(8));
                return;
            }

            const animate = (currentTime: number) => {
                if (!startTime) startTime = currentTime;
                const progress = Math.min((currentTime - startTime) / duration, 1);

                // Ease-out 효과
                const easeOut = 1 - Math.pow(1 - progress, 3);

                // [중요 로직] 시작값 + (차이값 * 진행도) = 부드러운 증분 효과
                const currentVal = startNum.plus(diff.times(easeOut));
                setCount(currentVal.toFixed(8));

                if (progress < 1) {
                    animationFrameId = requestAnimationFrame(animate);
                }
            };

            animationFrameId = requestAnimationFrame(animate);

            return () => {
                cancelAnimationFrame(animationFrameId);
                // [Task B-1 핵심] 다음 애니메이션을 위해 현재 목표값을 직전 값으로 저장
                prevValueRef.current = targetNum;
            };
        }, [targetValue, duration]);

        return count;
    };

    // 애니메이션 값 적용 (Decimal 객체를 숫자로 변환하여 전달)
    const animatedIssued = useCountUp(globalStats.currentIssued.toNumber());
    const animatedRemaining = useCountUp(globalStats.remainingSupply.toNumber());
    const animatedLocked = useCountUp(globalStats.totalLockedAmount || '0'); // [Phase 4 분리]
    const animatedReleased = useCountUp(globalStats.totalReleasedAmount || '0'); // [Phase 4 분리]

    // [Phase 3] 다국어 직접 지원 (외부 파일 간섭 방지)
    const getSettlementTitle = () => {
        switch (currentLanguage) {
            case 'en': return 'Global Settlement Ledger';
            case 'ja': return 'グローバル決済元帳';
            case 'zh': return '全球结算总账';
            case 'ko':
            default: return '월별 확정 정산 잠금 수량';
        }
    };

    const getSettlementDesc = () => {
        switch (currentLanguage) {
            case 'en': return 'Total verified and safely locked settlement amount';
            case 'ja': return '検証済みで安全にロックされた総決済額';
            case 'zh': return '经验证并安全锁定的总结算金额';
            case 'ko':
            default: return '검증 완료 및 안전하게 잠금 보관된 총 정산액';
        }
    };

    // [Phase 4] 해제된 자산 타이틀 및 설명 다국어 직접 지원
    const getReleasedTitle = () => {
        switch (currentLanguage) {
            case 'en': return 'KYC Verified & Released';
            case 'ja': return 'KYC 承認および支給完了';
            case 'zh': return 'KYC 认证并已发放';
            case 'ko':
            default: return 'KYC 승인 및 지급 완료 자산';
        }
    };

    const getReleasedDesc = () => {
        switch (currentLanguage) {
            case 'en': return 'Actual BW coins fully released and distributed to wallets';
            case 'ja': return '実際のBWコインが完全に解放され、ウォレットに配布されました';
            case 'zh': return '实际 BW 代币已完全释放并分配到钱包';
            case 'ko':
            default: return '실제 지갑으로 지급이 완료된 사용 가능 BW 코인입니다';
        }
    };

    return (
        <div className={`home-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
            {/* 헤더 */}
            <header className="home-header">
                <div className="header-content">
                    {/* BitWishNetwork 로고 */}
                    <div className="logo-section">
                        <h1 className="logo-text">BitWishNetwork</h1>
                        <span className="logo-subtitle">BW Mining System</span>
                    </div>

                    {/* 네비게이션 메뉴 */}
                    <nav className="navigation-menu">
                        <div className="nav-item dropdown">
                            <button className="nav-button hover-button">
                                {getTranslation('navigation.mainnet')}
                            </button>
                            <div className="dropdown-content">
                                <button onClick={() => { const win = window.open('/bw-explorer', 'BW_EXPLORER_WINDOW'); if (win) win.focus(); }}>{getTranslation('navigation.explorer')}</button>
                                <button onClick={() => window.location.href = '/node'}>{getTranslation('navigation.node')}</button>
                            </div>
                        </div>
                        <button className="nav-button hover-button" onClick={() => { const win = window.open('/bw-community', 'BW_COMMUNITY_WINDOW'); if (win) win.focus(); }}>
                            {getTranslation('navigation.community')}
                        </button>
                        <button className="nav-button hover-button" onClick={() => { const win = window.open('/ranking-board', 'BW_RANKING_WINDOW'); if (win) win.focus(); }}>
                            {getTranslation('navigation.rankingBoard')}
                        </button>
                        <div className="nav-item dropdown">
                            <button className="nav-button hover-button">
                                {getTranslation('navigation.whitepaper')}
                            </button>
                            <div className="dropdown-content">
                                <button onClick={() => {
                                    const win = window.open('/roadmap', 'BW_ROADMAP_WINDOW');
                                    if (win) win.focus();
                                }}>
                                    {getTranslation('navigation.roadmap')}
                                </button>
                            </div>
                        </div>
                    </nav>

                    {/* 오른쪽 컨트롤 버튼들 */}
                    <div className="header-controls">
                        <div className="nav-item dropdown">
                            <button className="nav-icon wallet-icon">💼</button>
                            <div className="dropdown-content">
                                <button onClick={handleCreateWallet}>{getTranslation('mining.createWallet')}</button>
                                <button onClick={handleMyWallet}>{getTranslation('mining.myWallet')}</button>
                            </div>
                        </div>
                        <div className="nav-item dropdown">
                            <button className="nav-icon language-icon">🌍</button>
                            <div className="dropdown-content language-dropdown">
                                <div className="language-scroll">
                                    <button onClick={() => handleLanguageChange('ko')}>한국어</button>
                                    <button onClick={() => handleLanguageChange('en')}>English</button>
                                    <button onClick={() => handleLanguageChange('ja')}>日本語</button>
                                    <button onClick={() => handleLanguageChange('zh')}>中文</button>
                                </div>
                            </div>
                        </div>
                        <div className="nav-item">
                            <button className="nav-icon theme-toggle" onClick={toggleDarkMode} title={isDarkMode ? '라이트 모드' : '다크 모드'}>
                                {isDarkMode ? '🌙' : '☀️'}
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            {/* [신규 수술] 크롬 확장프로그램 설치 유도 프리미엄 노란색 배너 바탕 영역 */}
            <div className="extension-banner-wrapper" style={{
                background: isExtensionInstalled 
                    ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' // 활성화 시 부드러운 그린 계열
                    : 'linear-gradient(135deg, #fef08a 0%, #fde047 100%)',
                padding: '20px 0 0 0',
                borderBottom: isExtensionInstalled ? '1px solid #22c55e' : '1px solid #eab308',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto 16px auto',
                    padding: '0 2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    zIndex: 1,
                    position: 'relative'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '24px', animation: 'pulse 1.5s infinite' }}>{isExtensionInstalled ? '⚡' : '🧩'}</span>
                        <div>
                            <strong style={{ color: isExtensionInstalled ? '#166534' : '#854d0e', fontSize: '15px', display: 'block' }}>
                                {isExtensionInstalled 
                                    ? 'Chrome Extension Active! (Max +35% Boost Connected)' 
                                    : 'Chrome Extension Promotion Bonus (Attendance 5% + Mnemonic 30% = Max 35% Boost)'}
                            </strong>
                            <span style={{ color: isExtensionInstalled ? '#15803d' : '#a16207', fontSize: '13px' }}>
                                {isExtensionInstalled 
                                    ? '확장프로그램 연결이 감지되었습니다. 출석(5%) & 니모닉(30%) 부스트가 활성화됩니다. (클로즈 베타가 끝나면 팝업 보너스 부스터는 10%로 내려갑니다.)'
                                    : 'Chrome 확장프로그램을 설치하고 출석 보너스(5%)와 안전 니모닉 인증(30%) 채굴률 부스트를 받으세요! (클로즈 베타가 끝나면 팝업 보너스 부스터는 10%로 내려갑니다.)'}
                            </span>
                        </div>
                    </div>
                    {!isExtensionInstalled ? (
                        <a 
                            href="https://chromewebstore.google.com" // 추후 크롬 웹스토어 등록 완료 시 실제 상세 페이지 URL로 대체 가능
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bw-btn" 
                            style={{
                                background: '#1e293b',
                                color: '#ffffff',
                                fontWeight: 'bold',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontSize: '13px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            ⚡ Chrome Web Store 설치하기
                        </a>
                    ) : (
                        <span style={{
                            background: '#15803d',
                            color: '#ffffff',
                            fontWeight: 'bold',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                            ✓ 연동 완료
                        </span>
                    )}
                </div>

                {/* --- [신규 삽입] 우측에서 좌측으로 흐르는 메시지 전광판 영역 --- */}
                <div className="home-ticker-banner" style={{ background: 'rgba(255, 255, 255, 0.4)', borderBottom: 'none', borderTop: '1px solid rgba(234, 179, 8, 0.3)' }}>
                    <div className="home-ticker-track">
                        <span className="home-ticker-text" style={{ color: '#854d0e' }}>{tickerMessage}</span>
                    </div>
                </div>
            </div>
            {/* 메인 콘텐츠 */}
            <main className="home-main">
                <section className="blockchain-status-section">
                    <div className="status-header">
                        <h1 className="status-main-title">
                            <span className="chain-icon">⛓️</span>
                            {getTranslation('mining.title')}
                        </h1>
                        <button
                            className={`mining-bonus-button ${isMiningInProgress ? 'mining-active-disabled' : ''}`}
                            onClick={handleStartMining}
                            disabled={isMiningInProgress}
                            title={isMiningInProgress ? '채굴이 진행 중입니다' : getTranslation('mining.startMiningTooltip')}
                        >
                            <span className="pickaxe-icon">{isMiningInProgress ? '🔄' : '⛏️'}</span>
                            {isMiningInProgress ? '채굴 진행중' : getTranslation('mining.startMining')}
                        </button>
                        <p className="status-description">{getTranslation('mining.description')}</p>
                        <p className="last-update-time">
                            {getTranslation('mining.lastUpdate')}: {lastUpdate.toLocaleTimeString('ko-KR', {
                                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
                            })}
                        </p>
                    </div>

                    {/* [Phase 4] KYC 승인 연동 자산 유동화 증명 듀얼 UI */}
                    <div className="premium-settlement-ledger">
                        <div className="ledger-glass-container dual-ledger">
                            {/* 좌측: 보존된 자산 (LOCKED) */}
                            <div className="ledger-side locked-side">
                                <div className="ledger-icon-wrapper">
                                    <span className="ledger-icon">🔒</span>
                                </div>
                                <div className="ledger-content">
                                    <h2 className="ledger-title">{getSettlementTitle()}</h2>
                                    {(() => {
                                        const { integerPart, decimalPart } = splitNumber(animatedLocked);
                                        return (
                                            <div className="ledger-value-wrapper">
                                                <span className="ledger-value-integer">{integerPart}</span>
                                                <span className="ledger-value-decimal">{decimalPart} BW</span>
                                            </div>
                                        );
                                    })()}
                                    <p className="ledger-description">{getSettlementDesc()}</p>
                                </div>
                            </div>

                            {/* 중앙: 네온 세로 구분선 */}
                            <div className="ledger-divider"></div>

                            {/* 우측: 지급 완료된 자산 (RELEASED) */}
                            <div className="ledger-side released-side">
                                <div className="ledger-icon-wrapper released-icon">
                                    <span className="ledger-icon">🔓</span>
                                </div>
                                <div className="ledger-content">
                                    <h2 className="ledger-title">{getReleasedTitle()}</h2>
                                    {(() => {
                                        const { integerPart, decimalPart } = splitNumber(animatedReleased);
                                        return (
                                            <div className="ledger-value-wrapper">
                                                <span className="ledger-value-integer">{integerPart}</span>
                                                <span className="ledger-value-decimal">{decimalPart} BW</span>
                                            </div>
                                        );
                                    })()}
                                    <p className="ledger-description">{getReleasedDesc()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="status-cards-grid">
                        <div className="status-card-row">
                            <div className="status-card">
                                <div className="card-icon trophy-icon">🏆</div>
                                <div className="card-content">
                                    <div className="card-value multi-line">
                                        <div className="value-integer">21,000,000,000</div>
                                        <div className="value-decimal">BW</div>
                                    </div>
                                    <div className="card-title">{getTranslation('mining.totalSupply')}</div>
                                    <div className="card-description">{getTranslation('mining.totalSupply')}</div>
                                </div>
                            </div>

                            <div className="status-card">
                                <div className="card-icon money-icon">💰</div>
                                <div className="card-content">
                                    {(() => {
                                        const { integerPart, decimalPart } = splitNumber(animatedIssued);
                                        return (
                                            <div className="card-value multi-line">
                                                <div className="value-integer">{integerPart}</div>
                                                <div className="value-decimal">{decimalPart} BW</div>
                                            </div>
                                        );
                                    })()}
                                    <div className="card-title">{getTranslation('mining.currentIssued')}</div>
                                    <div className="card-description">{getTranslation('mining.realtimeData')}</div>
                                </div>
                            </div>

                            <div className="status-card">
                                <div className="card-icon chart-icon">📈</div>
                                <div className="card-content">
                                    {(() => {
                                        const { integerPart, decimalPart } = splitNumber(animatedRemaining);
                                        return (
                                            <div className="card-value multi-line">
                                                <div className="value-integer">{integerPart}</div>
                                                <div className="value-decimal">{decimalPart} BW</div>
                                            </div>
                                        );
                                    })()}
                                    <div className="card-title">{getTranslation('mining.remainingSupply')}</div>
                                    <div className="card-description">{getTranslation('mining.realtimeData')}</div>
                                </div>
                            </div>
                        </div>

                        <div className="status-card-row">
                            <div className="status-card">
                                <div className="card-icon bar-chart-icon">📊</div>
                                <div className="card-content">
                                    <div
                                        className="card-value"
                                        title={`${new Decimal(globalStats.issuanceRate || 0).toFixed(8)}%`}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {new Decimal(globalStats.issuanceRate || 0).toFixed(2)}%
                                    </div>
                                    <div className="card-title">{getTranslation('mining.issuanceRate')}</div>
                                    <div className="card-description">{getTranslation('mining.realtimeData')}</div>
                                </div>
                            </div>

                            <div className="status-card">
                                <div className="card-icon chain-icon">🔗</div>
                                <div className="card-content">
                                    <div className="card-value">{(globalStats.totalBlocks || 0).toLocaleString()}</div>
                                    <div className="card-title">{getTranslation('mining.totalBlocks')}</div>
                                    <div className="card-description">{getTranslation('mining.generatedBlocks')}</div>
                                </div>
                            </div>

                            <div className="status-card">
                                <div className="card-icon users-icon">👥</div>
                                <div className="card-content">
                                    <div className="card-value">{(globalStats.totalUsers || 0).toLocaleString()}</div>
                                    <div className="card-title">{getTranslation('mining.walletCount')}</div>
                                    <div className="card-description">{getTranslation('mining.registeredUsers')}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="refresh-section">
                        <button className="refresh-button" onClick={handleManualRefresh}>
                            <span className="refresh-icon">🔄</span>
                            {getTranslation('mining.refreshStatus')}
                        </button>
                    </div>
                </section>
            </main>

            <footer className="home-footer">
                <div className="footer-content">
                    <p className="footer-text">© 2024 BitWishNetwork. All rights reserved.</p>
                    <div className="footer-links">
                        <a href="/whitepaper" className="footer-link">{getTranslation('navigation.whitepaper')}</a>
                        <a href="/roadmap" className="footer-link">{getTranslation('navigation.roadmap')}</a>
                        <a href="/terms" className="footer-link">{getTranslation('navigation.terms')}</a>
                    </div>
                </div>
            </footer>

            {isMiningModalOpen && (
                <MiningStatusModal
                    isOpen={isMiningModalOpen}
                    onClose={() => setIsMiningModalOpen(false)}
                    currentLanguage={currentLanguage as string}
                    walletAddress={authenticatedAddress}
                    onOpenReferralModal={() => {
                        setIsReferralModalOpen(true);
                        handleFocus('referral');
                    }}
                    isActive={activeModal === 'mining'}
                    onFocus={() => handleFocus('mining')}
                />
            )}

            {isReferralModalOpen && (
                <ReferralModal
                    isOpen={isReferralModalOpen}
                    onClose={() => setIsReferralModalOpen(false)}
                    currentLanguage={currentLanguage}
                    walletAddress={authenticatedAddress}
                    isActive={activeModal === 'referral'}
                    onFocus={() => handleFocus('referral')}
                />
            )}

            {isCreateWalletModalOpen && (
                <CreateWalletModal
                    isOpen={isCreateWalletModalOpen}
                    onClose={() => setIsCreateWalletModalOpen(false)}
                    onComplete={(newAddress) => {
                        if (newAddress) setAuthenticatedAddress(newAddress);
                        setIsCreateWalletModalOpen(false);
                        setIsMyWalletModalOpen(true);
                    }}
                    currentLanguage={currentLanguage}
                />
            )}

            <MyWalletModal
                isOpen={isMyWalletModalOpen}
                onClose={() => setIsMyWalletModalOpen(false)}
                currentLanguage={currentLanguage}
                onOpenMining={(address) => {
                    setAuthenticatedAddress(address);
                    const sessionData = {
                        address: address,
                        timestamp: Date.now(),
                        method: 'WALLET_DIRECT_ACCESS'
                    };
                    localStorage.setItem('bw_mining_auth', JSON.stringify(sessionData));
                    // [Step 4 Fix] 지갑 창을 닫지 않고 마이닝 창을 나란히 띄움
                    setIsMiningModalOpen(true);
                    handleFocus('mining');
                }}
                isActive={activeModal === 'wallet'}
                onFocus={() => handleFocus('wallet')}
            />

            {isWalletAuthModalOpen && (
                <WalletAuthModal
                    isOpen={isWalletAuthModalOpen}
                    onClose={() => setIsWalletAuthModalOpen(false)}
                    currentLanguage={currentLanguage}
                    onSuccess={() => {
                        setIsWalletAuthModalOpen(false);
                        setIsMyWalletModalOpen(true);
                    }}
                />
            )}

            {/* 
            {isMiningAuthModalOpen && (
                <MiningAuthModal
                    isOpen={isMiningAuthModalOpen}
                    onClose={() => setIsMiningAuthModalOpen(false)}
                    onSuccess={(address) => {
                        setAuthenticatedAddress(address);
                        setIsMiningAuthModalOpen(false);
                        setIsMiningModalOpen(true);
                    }}
                    onOpenSecondPassword={() => {
                        setIsMiningAuthModalOpen(false);
                        setIsSecondPasswordModalOpen(true);
                    }}
                    currentLanguage={currentLanguage}
                />
            )}

            {isSecondPasswordModalOpen && (
                <SecondPasswordModal
                    isOpen={isSecondPasswordModalOpen}
                    onClose={() => {
                        setIsSecondPasswordModalOpen(false);
                        setIsMiningAuthModalOpen(true);
                    }}
                    onSuccess={() => {
                        setIsSecondPasswordModalOpen(false);
                        setIsMiningAuthModalOpen(true);
                    }}
                    currentLanguage={currentLanguage}
                />
            )}
            */}

            {isReferralModalOpen && (
                <ReferralModal
                    isOpen={isReferralModalOpen}
                    onClose={() => setIsReferralModalOpen(false)}
                    currentLanguage={currentLanguage}
                    walletAddress={authenticatedAddress}
                />
            )}

            {isMnemonicModalOpen && (
                <MnemonicAuthModal
                    isOpen={isMnemonicModalOpen}
                    onClose={() => setIsMnemonicModalOpen(false)}
                    onSuccess={(address) => {
                        setAuthenticatedAddress(address);
                        const sessionData = {
                            address: address,
                            timestamp: Date.now(),
                            method: 'MNEMONIC_FRAGMENT_AUTH'
                        };
                        localStorage.setItem('bw_mining_auth', JSON.stringify(sessionData));
                        setIsMnemonicModalOpen(false);
                        setIsMiningModalOpen(true);
                    }}
                    walletAddress={authenticatedAddress}
                    currentLanguage={currentLanguage}
                />
            )}

        </div>
    );
};

export default HomePage;