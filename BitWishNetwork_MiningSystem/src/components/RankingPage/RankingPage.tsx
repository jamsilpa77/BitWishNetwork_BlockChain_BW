/**
 * BitWishNetwork Ranking Page Component
 * Premium Explorer-level Design
 */

import React, { useState, useEffect, useCallback } from 'react';
import { LanguageManager } from '../../utils/LanguageManager/LanguageManager';
import { PrecisionCalculator } from '../../utils/PrecisionCalculator/PrecisionCalculator';
import { Decimal } from 'decimal.js';
import axios from 'axios';
import './RankingPage.css';

interface Ranker {
    walletAddress: string;
    totalMiningAmount: string;
    kycStatus: string;
}

const RankingPage: React.FC = () => {
    const [languageManager] = useState(() => new LanguageManager());
    const [precisionCalculator] = useState(() => new PrecisionCalculator());
    const [currentLanguage] = useState(() => (localStorage.getItem('bw_lang') as any) || 'ko');

    const [topRankers, setTopRankers] = useState<Ranker[]>([]);
    const [myRankInfo, setMyRankInfo] = useState<{ rank: number; totalAmount: string } | null>(null);
    const [searchAddress, setSearchAddress] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [lastSync, setLastSync] = useState<Date>(new Date());
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('bw-theme') === 'dark');

    /**
     * [Step 3] 테마 실시간 동기화 (익스플로러 표준 이식)
     */
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'bw-theme') {
                setIsDarkMode(e.newValue === 'dark');
            }
        };
        window.addEventListener('storage', handleStorage);

        const themeSync = setInterval(() => {
            const currentTheme = localStorage.getItem('bw-theme') === 'dark';
            if (currentTheme !== isDarkMode) {
                setIsDarkMode(currentTheme);
            }
        }, 1000);

        return () => {
            window.removeEventListener('storage', handleStorage);
            clearInterval(themeSync);
        };
    }, [isDarkMode]);

    /**
     * 전역 랭킹 데이터 동기화
     */
    const fetchRankings = useCallback(async () => {
        try {
            const response = await axios.get('/api/ranking/top50');
            if (response.data.success) {
                // ✅ 2중 중복 차단: 주소 기반 유니크 필터링 적용 (계획서 1단계 준수)
                const rawRankings: Ranker[] = response.data.rankings;
                const uniqueRankings = rawRankings.filter((v, i, a) =>
                    a.findIndex(t => t.walletAddress === v.walletAddress) === i
                );

                setTopRankers(uniqueRankings);
                setLastSync(new Date());
            }
        } catch (error) {
            console.error('Failed to fetch rankings:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * 나의 랭킹 정보 조회
     */
    const fetchMyRank = useCallback(async () => {
        const savedAddr = localStorage.getItem('bw_wallet_address');
        if (!savedAddr) return;

        try {
            const response = await axios.get(`/api/ranking/user/${savedAddr}`);
            if (response.data.success) {
                setMyRankInfo({
                    rank: response.data.rank,
                    totalAmount: response.data.totalAmount
                });
            }
        } catch (error) {
            console.error('Failed to fetch my rank:', error);
        }
    }, []);

    /**
     * 주소 검색
     */
    const handleSearch = async () => {
        if (!searchAddress.trim()) return;

        try {
            const response = await axios.get(`/api/ranking/user/${searchAddress.trim()}`);
            if (response.data.success) {
                setMyRankInfo({
                    rank: response.data.rank,
                    totalAmount: response.data.totalAmount
                });
            }
        } catch (error) {
            alert(getTranslation('ranking.noData'));
        }
    };

    /**
     * KYC 상태별 배지 렌더링
     */
    const renderKycBadge = (status: string) => {
        let label = '';
        let className = 'kyc-badge ';

        switch (status) {
            case 'APPROVED':
                label = getTranslation('ranking.kycApproved');
                className += 'kyc-approved';
                break;
            case 'WAITING_KYC':
                label = getTranslation('ranking.kycWaiting');
                className += 'kyc-waiting';
                break;
            default:
                label = getTranslation('ranking.kycNotApplied');
                className += 'kyc-none';
        }

        return <span className={className}>{label}</span>;
    };

    useEffect(() => {
        fetchRankings();
        fetchMyRank();

        // ✅ 30초마다 전역 랭킹 및 나의 정보 자동 동기화 엔진 (계획서 1단계 준수)
        const interval = setInterval(() => {
            fetchRankings();
            fetchMyRank();
        }, 30000);

        return () => clearInterval(interval);
    }, [fetchRankings, fetchMyRank]);

    const getTranslation = (key: string): string => {
        return languageManager.getTranslation(key, currentLanguage);
    };

    const formatAmount = (amount: string) => {
        return precisionCalculator.formatForUI(new Decimal(amount || 0));
    };

    const shortenAddress = (addr: string) => {
        if (!addr) return '';
        return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
    };

    return (
        <div className={`ranking-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
            {/* [Step 1.5] 헤더 바 전체를 ranking-container 바깥으로 분리하여 100vw 폭 달성 */}
            <div className="ranking-header-bar">
                <div className="header-inner">
                    {/* 좌측: 홈 버튼 */}
                    <div className="header-left">
                        {/* 독립 윈도우 환경: 브라우저 닫기 버튼 사용을 위해 내부 버튼 제거 */}
                    </div>

                    {/* 중앙: 메인 타이틀 & 서브타이틀 */}
                    <div className="header-center">
                        <h1 className="ranking-title">{getTranslation('ranking.title')}</h1>
                        <p className="ranking-subtitle">{getTranslation('ranking.subtitle')}</p>
                    </div>

                    {/* 우측: 중앙 정렬 균형을 맞추기 위한 투명 더미 블록 */}
                    <div className="header-right"></div>
                </div>
            </div>

            <div className="ranking-container">

                {/* Search */}
                <section className="ranking-search-section">
                    <div className="search-box">
                        <input
                            type="text"
                            className="search-input"
                            placeholder={getTranslation('ranking.searchPlaceholder')}
                            value={searchAddress}
                            onChange={(e) => setSearchAddress(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <span className="search-icon" onClick={handleSearch}>🔍</span>
                    </div>
                </section>

                {/* My Rank Card */}
                {myRankInfo && (
                    <section className="my-rank-card">
                        <div>
                            <div className="my-rank-label">{getTranslation('ranking.myRankTitle')}</div>
                            <div className="my-rank-value">
                                {myRankInfo.rank > 0 ? `# ${myRankInfo.rank}` : getTranslation('ranking.notRanked')}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div className="my-rank-label">{getTranslation('ranking.amount')}</div>
                            <div className="my-rank-value">
                                {formatAmount(myRankInfo.totalAmount)} <span className="amount-unit">BW</span>
                            </div>
                        </div>
                    </section>
                )}

                {/* Top 10 Premium */}
                <h2 style={{ color: '#f3ba2f', marginBottom: '30px', fontWeight: '700' }}>
                    👑 {getTranslation('ranking.top10Title')}
                </h2>
                <div className="top-rankers-grid">
                    {topRankers.slice(0, 10).map((ranker, index) => (
                        <div key={ranker.walletAddress} className={`premium-card rank-${index + 1}`}>
                            {/* 1~5위 전용 각 색상별 아우라 배후 배치 */}
                            {(index === 0 || index === 1 || index === 2 || index === 3 || index === 4) && <div className="aura-bg"></div>}

                            {/* 메탈릭 심볼 삭제 (애니메이션 중복 결함 수정) */}

                            <div className="rank-badge">{index + 1}</div>
                            <div className="text-visibility-wrapper">
                                <div className="kyc-badge-container">{renderKycBadge(ranker.kycStatus)}</div>
                                <div className="wallet-address-short">{shortenAddress(ranker.walletAddress)}</div>
                                <div className="mining-amount-display">
                                    {formatAmount(ranker.totalMiningAmount)}
                                    <span className="amount-unit">BW</span>
                                </div>
                            </div>


                            {/* 1위 전용 골드 프리미엄 윙 엠블럼 (심화 그라데이션 및 금실 테두리 적용) */}
                            {index === 0 && (
                                <div className="premium-emblem-gold">
                                    <svg viewBox="0 0 200 80" width="160" height="64" xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                            <linearGradient id="goldWingsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#FFDF73" />
                                                <stop offset="20%" stopColor="#FFF8D6" />
                                                <stop offset="45%" stopColor="#D4AF37" />
                                                <stop offset="70%" stopColor="#AA7C11" />
                                                <stop offset="100%" stopColor="#8B6508" />
                                            </linearGradient>
                                            <filter id="goldWingsGlow" x="-20%" y="-20%" width="140%" height="140%">
                                                <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
                                                <feMerge>
                                                    <feMergeNode in="blur" />
                                                    <feMergeNode in="SourceGraphic" />
                                                </feMerge>
                                            </filter>
                                        </defs>

                                        <g filter="url(#goldWingsGlow)" fill="url(#goldWingsGrad)" stroke="url(#goldWingsGrad)" strokeWidth="0.5">
                                            {/* 3-Leaf Wings Left (Fine Stroke 적용) */}
                                            <path d="M 45 40 C 25 35, 20 20, 30 10 C 33 20, 40 25, 50 30 Z" opacity="0.95" />
                                            <path d="M 40 50 C 15 50, 10 35, 20 25 C 25 35, 30 40, 40 45 Z" opacity="0.8" />
                                            <path d="M 45 60 C 25 65, 20 55, 30 50 C 35 55, 40 58, 45 58 Z" opacity="0.6" />

                                            {/* 3-Leaf Wings Right (Mirrored) */}
                                            <g transform="scale(-1, 1) translate(-200, 0)">
                                                <path d="M 45 40 C 25 35, 20 20, 30 10 C 33 20, 40 25, 50 30 Z" opacity="0.95" />
                                                <path d="M 40 50 C 15 50, 10 35, 20 25 C 25 35, 30 40, 40 45 Z" opacity="0.8" />
                                                <path d="M 45 60 C 25 65, 20 55, 30 50 C 35 55, 40 58, 45 58 Z" opacity="0.6" />
                                            </g>

                                            {/* PREMIUM Text (Fine Outline 적용) */}
                                            <text x="100" y="48" fontFamily="Serif, 'Times New Roman'" fontSize="16" fontWeight="900" textAnchor="middle" letterSpacing="4" strokeWidth="0.3">PREMIUM</text>

                                            {/* 하단 장식 곡선 (Flourish) */}
                                            <path d="M 60 55 Q 100 65 140 55" fill="none" strokeWidth="1.2" />
                                            <path d="M 80 62 Q 100 72 120 62" fill="none" strokeWidth="0.8" opacity="0.7" />
                                            <path d="M 100 60 Q 100 70 95 70 M 100 60 Q 100 70 105 70" fill="none" strokeWidth="0.8" />
                                        </g>
                                    </svg>
                                </div>
                            )}

                            {/* 3위 전용 브론즈 프리미엄 윙 엠블럼 (85% 축소 및 정교한 예리함 적용) */}
                            {index === 2 && (
                                <div className="premium-emblem-bronze">
                                    <svg viewBox="0 0 200 80" width="136" height="54" xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                            <linearGradient id="bronzeWingsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#CD7F32" />
                                                <stop offset="25%" stopColor="#E2A76F" />
                                                <stop offset="50%" stopColor="#CD7F32" />
                                                <stop offset="75%" stopColor="#8B4513" />
                                                <stop offset="100%" stopColor="#6B3E26" />
                                            </linearGradient>
                                            <filter id="bronzeWingsGlow" x="-20%" y="-20%" width="140%" height="140%">
                                                <feGaussianBlur in="SourceGraphic" stdDeviation="1.0" result="blur" />
                                                <feMerge>
                                                    <feMergeNode in="blur" />
                                                    <feMergeNode in="SourceGraphic" />
                                                </feMerge>
                                            </filter>
                                        </defs>

                                        <g filter="url(#bronzeWingsGlow)" fill="url(#bronzeWingsGrad)" stroke="url(#bronzeWingsGrad)" strokeWidth="0.3">
                                            {/* 3-Leaf Wings Left (Thinner & Sharper) */}
                                            <path d="M 45 40 C 25 35, 20 20, 30 10 C 33 20, 40 25, 50 30 Z" opacity="0.9" />
                                            <path d="M 40 50 C 15 50, 10 35, 20 25 C 25 35, 30 40, 40 45 Z" opacity="0.75" />
                                            <path d="M 45 60 C 25 65, 20 55, 30 50 C 35 55, 40 58, 45 58 Z" opacity="0.55" />

                                            {/* 3-Leaf Wings Right (Mirrored) */}
                                            <g transform="scale(-1, 1) translate(-200, 0)">
                                                <path d="M 45 40 C 25 35, 20 20, 30 10 C 33 20, 40 25, 50 30 Z" opacity="0.9" />
                                                <path d="M 40 50 C 15 50, 10 35, 20 25 C 25 35, 30 40, 40 45 Z" opacity="0.75" />
                                                <path d="M 45 60 C 25 65, 20 55, 30 50 C 35 55, 40 58, 45 58 Z" opacity="0.55" />
                                            </g>

                                            {/* PREMIUM Text (Refined Stroke - 0.15) */}
                                            <text x="100" y="48" fontFamily="Serif, 'Times New Roman'" fontSize="16" fontWeight="900" textAnchor="middle" letterSpacing="4" strokeWidth="0.15">PREMIUM</text>

                                            {/* 하단 장식 곡선 (Refined Flourish) */}
                                            <path d="M 60 55 Q 100 65 140 55" fill="none" strokeWidth="0.8" />
                                            <path d="M 80 62 Q 100 72 120 62" fill="none" strokeWidth="0.5" opacity="0.6" />
                                        </g>
                                    </svg>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* 11-50 Standard List */}
                <div className="ranking-list-container">
                    <table className="ranking-table">
                        <thead>
                            <tr>
                                <th>{getTranslation('ranking.rank')}</th>
                                <th>{getTranslation('ranking.address')}</th>
                                <th style={{ textAlign: 'center' }}>KYC</th>
                                <th style={{ textAlign: 'right' }}>{getTranslation('ranking.amount')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topRankers.slice(10).map((ranker, index) => (
                                <tr key={ranker.walletAddress}>
                                    <td><span className="standard-rank">{index + 11}</span></td>
                                    <td><span className="standard-address">{ranker.walletAddress}</span></td>
                                    <td style={{ textAlign: 'center' }}>{renderKycBadge(ranker.kycStatus)}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span className="standard-amount">{formatAmount(ranker.totalMiningAmount)}</span>
                                        <span className="amount-unit">BW</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ textAlign: 'center', marginTop: '40px', color: '#555', fontSize: '0.9rem' }}>
                    {getTranslation('ranking.lastSync')}: {lastSync.toLocaleTimeString()}
                </div>
            </div>
        </div>
    );
};

export default RankingPage;
