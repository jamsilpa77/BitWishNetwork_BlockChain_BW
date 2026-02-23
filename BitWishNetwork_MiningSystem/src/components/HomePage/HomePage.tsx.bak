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

import React, { useState, useEffect } from 'react';
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
import MiningAuthModal from '../MiningAuthModal/MiningAuthModal';
import SecondPasswordModal from '../SecondPasswordModal/SecondPasswordModal';
import { walletService } from '../../services/BlockchainService/WalletService';
import './HomePage.css';

/**
 * 홈페이지 컴포넌트 - 완벽한 독립성 보장
 * BitWishNetwork 로고, 네비게이션, 실시간 BW 채굴 상태, 6개 정보 카드
 */
const HomePage: React.FC = () => {
    // 절대 준수사항: 전역 변수 사용 금지
    const [languageManager] = useState(() => new LanguageManager());
    const [realTimeSyncService] = useState(() => new RealTimeSyncService());
    const [precisionCalculator] = useState(() => new PrecisionCalculator());

    const [currentLanguage, setCurrentLanguage] = useState<Language>('ko');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [miningStatus, setMiningStatus] = useState<RealTimeMiningStatus | null>(null);
    const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('DISCONNECTED');
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    // [New] 전역 통계 데이터 (실시간 연동)
    const [globalStats, setGlobalStats] = useState<any>({
        totalUsers: 0,
        totalBlocks: 0,
        totalReward: 0,
        currentIssued: '0',
        remainingSupply: '21000000000',
        issuanceRate: '0.00'
    });

    // Modals State
    const [isMiningModalOpen, setIsMiningModalOpen] = useState(false);
    const [isCreateWalletModalOpen, setIsCreateWalletModalOpen] = useState(false);
    const [isMyWalletModalOpen, setIsMyWalletModalOpen] = useState(false);
    const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
    const [isWalletAuthModalOpen, setIsWalletAuthModalOpen] = useState(false);
    const [isMiningAuthModalOpen, setIsMiningAuthModalOpen] = useState(false);
    const [isSecondPasswordModalOpen, setIsSecondPasswordModalOpen] = useState(false);

    const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
    const [isConnected, setIsConnected] = useState(true);
    const [authenticatedAddress, setAuthenticatedAddress] = useState<string>('');

    /**
     * 컴포넌트 마운트 시 초기화
     */
    useEffect(() => {
        initializeHomePage();
        startRealTimeSync();
        startAutoRefresh();

        return () => {
            stopRealTimeSync();
            stopAutoRefresh();
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
            fetchGlobalStats(); // [New] 초기 통계 로드
        } catch (error) {
            console.error('홈페이지 초기화 오류:', error);
        }
    };

    /**
     * [New] 전역 통계 데이터 가져오기 (API 연동)
     */
    const fetchGlobalStats = async () => {
        try {
            // [Modified] 백엔드 실시간 통계 API 연동
            const response = await fetch('/api/stats/realtime');
            const result = await response.json();
            if (result.success && result.data) {
                setGlobalStats(result.data);
            }
        } catch (e) {
            console.error('Global stats fetch failed:', e);
        }
    };

    /**
     * 실시간 동기화 시작
     */
    const startRealTimeSync = (): void => {
        try {
            realTimeSyncService.startSync((status) => {
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
     * 자동 새로고침 시작 (30초마다)
     */
    const startAutoRefresh = (): void => {
        try {
            const interval = setInterval(() => {
                refreshHomePage();
                fetchGlobalStats(); // [New] 주기적 통계 갱신
            }, 3000); // 3초마다 갱신 (실시간 느낌)
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
            setIsMiningAuthModalOpen(true);
        } catch (error) {
            console.error('마이닝 모달 열기 오류:', error);
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
    const useCountUp = (targetValue: string | number, duration: number = 2000) => {
        const [count, setCount] = useState('0');

        useEffect(() => {
            let startTime: number;
            let animationFrameId: number;
            const targetNum = new Decimal(targetValue || 0);

            // 목표값이 0이면 애니메이션 없이 0 반환
            if (targetNum.isZero()) {
                setCount('0');
                return;
            }

            const animate = (currentTime: number) => {
                if (!startTime) startTime = currentTime;
                const progress = Math.min((currentTime - startTime) / duration, 1);

                // Ease-out 효과 (빠르게 시작해서 천천히 끝남)
                const easeOut = 1 - Math.pow(1 - progress, 3);

                const currentVal = targetNum.times(easeOut);
                setCount(currentVal.toFixed(8)); // 8자리 소수점 유지

                if (progress < 1) {
                    animationFrameId = requestAnimationFrame(animate);
                }
            };

            animationFrameId = requestAnimationFrame(animate);

            return () => cancelAnimationFrame(animationFrameId);
        }, [targetValue, duration]);

        return count;
    };

    // 애니메이션 값 적용
    const animatedIssued = useCountUp(globalStats.currentIssued);
    const animatedRemaining = useCountUp(globalStats.remainingSupply);

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
                                <button onClick={() => window.location.href = '/explorer'}>{getTranslation('navigation.explorer')}</button>
                                <button onClick={() => window.location.href = '/node'}>{getTranslation('navigation.node')}</button>
                            </div>
                        </div>
                        <button className="nav-button hover-button" onClick={() => window.location.href = '/community'}>
                            {getTranslation('navigation.community')}
                        </button>
                        <button className="nav-button hover-button" onClick={() => window.location.href = '/dashboard'}>
                            {getTranslation('navigation.dashboard')}
                        </button>
                        <div className="nav-item dropdown">
                            <button className="nav-button hover-button">
                                {getTranslation('navigation.whitepaper')}
                            </button>
                            <div className="dropdown-content">
                                <button onClick={() => window.location.href = '/roadmap'}>{getTranslation('navigation.roadmap')}</button>
                            </div>
                        </div>
                        <button className="nav-button hover-button" onClick={() => window.location.href = '/node'}>
                            {getTranslation('navigation.node')}
                        </button>
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

            {/* 메인 콘텐츠 */}
            <main className="home-main">
                <section className="blockchain-status-section">
                    <div className="status-header">
                        <h1 className="status-main-title">
                            <span className="chain-icon">⛓️</span>
                            {getTranslation('mining.title')}
                        </h1>
                        <button className="mining-bonus-button" onClick={handleStartMining}>
                            <span className="pickaxe-icon">⛏️</span>
                            {getTranslation('mining.miningBonus')}
                        </button>
                        <p className="status-description">{getTranslation('mining.description')}</p>
                        <p className="last-update-time">
                            {getTranslation('mining.lastUpdate')}: {lastUpdate.toLocaleTimeString('ko-KR', {
                                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
                            })}
                        </p>
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
                                    <div className="card-value">{globalStats.issuanceRate}%</div>
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
                    onOpenReferralModal={() => setIsReferralModalOpen(true)}
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
                    setIsMyWalletModalOpen(false);
                    setIsMiningModalOpen(true);
                }}
            />

            {isWalletAuthModalOpen && (
                <WalletAuthModal
                    isOpen={isWalletAuthModalOpen}
                    onClose={() => setIsWalletAuthModalOpen(false)}
                    onSuccess={() => {
                        setIsWalletAuthModalOpen(false);
                        setIsMyWalletModalOpen(true);
                    }}
                />
            )}

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

            {isReferralModalOpen && (
                <ReferralModal
                    isOpen={isReferralModalOpen}
                    onClose={() => setIsReferralModalOpen(false)}
                    currentLanguage={currentLanguage}
                    walletAddress={authenticatedAddress}
                />
            )}
        </div>
    );
};

export default HomePage;