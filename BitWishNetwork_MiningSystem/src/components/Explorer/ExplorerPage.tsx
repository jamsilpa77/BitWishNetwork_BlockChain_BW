/**
 * BitWishNetwork BW 블록 익스플로러
 * 
 * ⚠️ 중요 준수 사항: 전역 모달, 공통 변수 함수 절대 포함하지 않는다
 * ✅ 모든 파일 첫 줄부터 주석에 절대 준수사항 명시 추가
 * ✅ 50단위 부동소수점 정밀 계산형식으로 구현 하지만 UI 홈페이지 이미지상 소수즘 8자리만 표기한다.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ExplorerPage.css';
import { LanguageManager } from '../../utils/LanguageManager/LanguageManager';
import { apiService } from '../../services/ApiService';

interface TransactionRecord {
    txHash: string;
    senderAddress: string;
    recipientAddress: string;
    amount: number;
    fee: number;
    timestamp: Date;
    status: string;
}

interface Block {
    header: {
        blockHeight: number;
        timestamp: number;
        previousHash: string;
        merkleRoot: string;
        miner: string;
    };
    hash: string;
}

const ExplorerPage: React.FC = () => {
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [p2pTransactions, setP2pTransactions] = useState<TransactionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(localStorage.getItem('bw-theme') === 'dark');

    const [languageManager] = useState(() => new LanguageManager());
    const [currentLang, setCurrentLang] = useState(localStorage.getItem('bw_lang') || 'ko');
    const [expandedTx, setExpandedTx] = useState<string | null>(null);
    const [globalStats, setGlobalStats] = useState({ totalUsers: 0 });
    const [isTestnet, setIsTestnet] = useState(false);
    const [viewMode, setViewMode] = useState<'main' | 'all'>('main'); // [4단계] 뷰 모드 추가
    const [searchQuery, setSearchQuery] = useState(''); // [4단계] 검색어 상태
    const [currentPage, setCurrentPage] = useState(1); // [4단계] 현재 페이지
    const [totalPages, setTotalPages] = useState(1); // [4단계] 전체 페이지
    const [searchResult, setSearchResult] = useState<any>(null); // [4단계] 검색 결과
    const [currentTime, setCurrentTime] = useState(new Date()); // [3단계] 실시간 타이머 기준 시간
    const [migrationStats, setMigrationStats] = useState({
        totalPaid: '0',
        remainingPool: '13650000000',
        recentMigrations: [] as any[]
    });

    // [3단계] 1초 단위 리얼타임 타이머 엔진 가동
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // 실시간 P2P 거래 내역 가져오기 [Phase 5]
    const fetchP2pTransactions = async () => {
        try {
            const response = await apiService.getLatestTransactions();
            if (response.success && Array.isArray(response.data)) {
                setP2pTransactions(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch P2P transactions:', error);
        }
    };

    // 실시간 블록 데이터 가져오기
    const fetchBlocks = async (page: number = 1, search: string = '') => {
        try {
            // [작업 계획 2단계: 데이터 소스 완전 격리]
            const blocksUrl = isTestnet ? '/api/testnet/blocks' : '/api/stats/blocks';
            const statsUrl = isTestnet ? '/api/testnet/realtime' : '/api/stats/realtime';
            
            // [4단계] 페이징 및 검색 파라미터 적용
            const migrationStatsUrl = `/api/mining/global-stats?page=${page}&search=${encodeURIComponent(search)}`;

            const response = await axios.get(blocksUrl);
            if (response.data.success && Array.isArray(response.data.data)) {
                setBlocks(response.data.data);
            } else {
                setBlocks([]); 
            }

            // [실시간 동기화] 홈페이지 지갑 생성 수 데이터 연동
            const statsResponse = await axios.get(statsUrl);
            if (statsResponse.data.success) {
                setGlobalStats(statsResponse.data.data);
            }

            // [4단계] 마이너 풀 차감 및 페이징 통계 연동
            const mStatsResponse = await axios.get(migrationStatsUrl);
            if (mStatsResponse.data.success) {
                setMigrationStats({
                    totalPaid: mStatsResponse.data.totalPaid,
                    remainingPool: mStatsResponse.data.remainingPool,
                    recentMigrations: mStatsResponse.data.recentMigrations
                });
                setSearchResult(mStatsResponse.data.searchResult);
                setTotalPages(mStatsResponse.data.totalPages);
                setCurrentPage(mStatsResponse.data.currentPage);
            }

            // [Phase 5] P2P 거래 내역 동시 동기화
            await fetchP2pTransactions();
        } catch (error) {
            console.error('Failed to fetch blockchain data:', error);
            setBlocks([]); 
        } finally {
            setLoading(false);
        }
    };

    // [4단계] 통합 검색 실행 엔진 (마이그레이션 전수 조사 + 기존 블록/TX 검색)
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const query = searchQuery.trim();
        if (!query) return;

        // A. 마이그레이션 전수 조사 모드일 경우: API 연동 검색
        if (viewMode === 'all') {
            setCurrentPage(1);
            fetchBlocks(1, query);
            return;
        }

        // B. 메인 모드일 경우: 기존 블록/트랜잭션 검색 로직 (기존 기능 유지)
        const isWalletAddress = /^BW[0-9a-fA-F]{40}$/.test(query);
        const isTxHash = /^[0-9a-fA-F]{64}$/.test(query);

        if (isWalletAddress) {
            const foundBlock = blocks.find(b => b.header?.miner === query);
            if (foundBlock) {
                const element = document.getElementById(`block-${foundBlock.hash}`);
                element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setExpandedTx(foundBlock.hash);
            } else {
                alert(`${t('mining.myWallet')} ${query}\n${t('explorer.searchResultNotFound')}`);
            }
        } else if (isTxHash) {
            const foundBlock = blocks.find(b => b.hash === query);
            if (foundBlock) {
                const element = document.getElementById(`block-${foundBlock.hash}`);
                element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setExpandedTx(foundBlock.hash);
            } else {
                alert(`Hash: ${query}\n${t('explorer.searchResultNotFound')}`);
            }
        } else {
            alert(t('explorer.invalidQuery'));
        }
    };

    // [4단계] 페이지 변경 함수
    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        setLoading(true);
        setCurrentPage(newPage);
        fetchBlocks(newPage, searchQuery);
    };

    useEffect(() => {
        // 모드 전환 시 로딩 상태 강제 발동 (데이터 초기화 보증)
        setLoading(true);

        // [최종 보강] Mount 시점 전역 설정 강제 동기화 (Key 정격화)
        const savedTheme = localStorage.getItem('bw-theme');
        const savedLang = localStorage.getItem('bw_lang') || 'ko';

        // 테마 강제 주입
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            setDarkMode(true);
        } else {
            document.body.classList.remove('dark-mode');
            setDarkMode(false);
        }

        // 언어 인스턴스 초기화
        languageManager.setLanguage(savedLang);
        setCurrentLang(savedLang);

        fetchBlocks();
        const interval = setInterval(fetchBlocks, 10000);

        // [보강 2] 전역 설정 변화 실시간 트래킹 (Global Storage Listener)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'bw-theme') {
                const isDark = e.newValue === 'dark';
                setDarkMode(isDark);
                document.body.classList.toggle('dark-mode', isDark);
            }
            if (e.key === 'bw_lang') {
                const lang = e.newValue || 'ko';
                setCurrentLang(lang);
                languageManager.setLanguage(lang);
            }
        };
        window.addEventListener('storage', handleStorageChange);

        // 테마 및 언어 실시간 감지 (MutationObserver - 내부 전환용)
        const observer = new MutationObserver(() => {
            const isDark = document.body.classList.contains('dark-mode');
            setDarkMode(isDark);
        });

        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        return () => {
            clearInterval(interval);
            observer.disconnect();
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [currentLang, languageManager, isTestnet]);

    const formatTimestamp = (ts: number) => {
        return new Date(ts).toLocaleString();
    };

    const shortenHash = (hash: string) => {
        if (!hash) return '---';
        return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
    };

    const formatAddress = (addr: string) => {
        if (!addr || addr.length < 12) return addr || t('explorer.unknown');
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 6)}`;
    };

    const toggleTxDetail = (hash: string) => {
        setExpandedTx(expandedTx === hash ? null : hash);
    };



    // 번역 헬퍼
    const t = (key: string) => languageManager.getTranslation(key);

    return (
        <div className={`explorer-container ${darkMode ? 'dark-mode' : ''}`}>
            <header className="explorer-header">
                <div className="header-inner">
                    <button className="back-button" onClick={() => window.location.href = '/'}>
                        ← {t('navigation.home')}
                    </button>
                    <h1>{t('explorer.title')}</h1>
                    <div className="header-stats">
                        <button
                            className={`mode-toggle-btn ${isTestnet ? 'testnet' : 'mainnet'}`}
                            onClick={() => setIsTestnet(!isTestnet)}
                        >
                            {isTestnet ? 'MAINNET' : 'TESTNET'}
                        </button>
                        <span className="network-status">NETWORK ONLINE</span>
                    </div>
                </div>
            </header>

            <main className="explorer-main">
                {/* [4단계] viewMode에 따른 전체 화면 스왑 로직 */}
                {viewMode === 'main' ? (
                    <>
                        <section className="search-section">
                            <form onSubmit={handleSearch} className="search-form">
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder={t('explorer.searchPlaceholder')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <button type="submit" className="search-button">{t('explorer.searchBtn')}</button>
                            </form>
                        </section>

                        {!isTestnet && (
                            <section className="unified-economic-center premium-glass-panel">
                                <div className="center-header">
                                    <div className="dashboard-title">
                                        <span className="neon-icon">💎</span>
                                        <h2>{currentLang === 'ko' ? '빗위시 통합 경제 센터' : 'BitWish Unified Economic Center'}</h2>
                                    </div>
                                    <div className="global-supply-capsule">
                                        <label>{t('explorer.totalCirculating')}</label>
                                        <span>21,000,000,000 <small>BW</small></span>
                                    </div>
                                </div>

                                <div className="economic-hybrid-grid">
                                    <div className="supply-side-box">
                                        <div className="side-label">
                                            <span className="dot blue"></span> {currentLang === 'ko' ? '자산 배분 규정 (100%)' : 'Asset Allocation Rules'}
                                        </div>
                                        <div className="supply-multi-grid">
                                            <div className="s-card miner-card-enhanced">
                                                <div className="allocation-row">
                                                    <div className="sc-label">⛏️ {t('explorer.minerAllocation')}</div>
                                                    <div className="sc-value">{parseFloat(migrationStats.remainingPool).toLocaleString()} <small>BW</small></div>
                                                </div>
                                                <div className="allocation-divider"></div>
                                                <div className="payout-row">
                                                    <div className="sc-label">💰 {currentLang === 'ko' ? '개인채굴자 BW 지급 현황' : (currentLang === 'en' ? 'Miner BW Payout Status' : (currentLang === 'ja' ? '個人マイ너BW支給現況' : '个人矿工BW发放现状'))} ({((parseFloat(migrationStats.totalPaid) / 13650000000) * 100).toFixed(4)}%)</div>
                                                    <div className="sc-value payout-gold">{parseFloat(migrationStats.totalPaid).toLocaleString()} <small>BW</small></div>
                                                </div>
                                            </div>
                                            <div className="s-card">
                                                <div className="sc-label">🤝 {t('explorer.partnerAllocation')}</div>
                                                <div className="sc-value">3,150,000,000 <small>BW</small></div>
                                            </div>
                                            <div className="s-card highlight">
                                                <div className="sc-label">🏢 {t('explorer.foundationAllocation')}</div>
                                                <div className="sc-value highlight-gold">4,200,000,000 <small>BW</small></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="treasury-side-box">
                                        <div className="side-label">
                                            <span className="dot gold pulse"></span> {t('explorer.ecosystemFundTitle')} (Live)
                                        </div>
                                        <div className="treasury-flow-card">
                                            <div className="flow-item">
                                                <div className="fi-header">
                                                    <label>{t('explorer.txFees')}</label>
                                                    <span>0.0000 <small>BW</small></span>
                                                </div>
                                                <div className="fi-gauge"><div className="gauge-fill eco" style={{ width: '60%' }}></div></div>
                                            </div>
                                            <div className="flow-item">
                                                <div className="fi-header">
                                                    <label>{t('explorer.blockFees')}</label>
                                                    <span>0.0000 <small>BW</small></span>
                                                </div>
                                                <div className="fi-gauge"><div className="gauge-fill foundation" style={{ width: '40%' }}></div></div>
                                            </div>
                                            <div className="total-accumulated-box">
                                                <label>{t('explorer.totalFees')}</label>
                                                <span className="neon-gold">0.00000000 <small>BW</small></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="center-footer">
                                    <div className="f-stats">
                                        <span>👥 {t('explorer.createdWallets')}: <strong>{globalStats.totalUsers}</strong></span>
                                    </div>
                                    <button className="transparency-audit-btn">
                                        🛡️ {currentLang === 'ko' ? '기금 지갑 투명성 감사' : 'Fund Transparency Audit'}
                                    </button>
                                </div>
                                <div className="dashboard-scan-line"></div>
                            </section>
                        )}

                        {!isTestnet && (
                            <section className="operations-section premium-migration-section animate-fade-in">
                                <div className="section-header">
                                    <h2>{currentLang === 'ko' ? '최근 마이그레이션 대기자 목록' : 'Recent Migration Waiting List'}</h2>
                                    <button className="view-all-btn" onClick={() => { setViewMode('all'); setCurrentPage(1); fetchBlocks(1, ''); }}>
                                        {t('explorer.viewAll')}
                                    </button>
                                </div>
                                <div className="migration-table-container">
                                    <table className="migration-live-table">
                                        <thead>
                                            <tr>
                                                <th>{currentLang === 'ko' ? '지갑 주소' : 'Wallet Address'}</th>
                                                <th>{currentLang === 'ko' ? '정산 확정 일자' : 'Approval Date'}</th>
                                                <th>{currentLang === 'ko' ? '전송 대기시간' : 'Waiting Time'}</th>
                                                <th>{currentLang === 'ko' ? '마이그레이션 상태' : 'Status'}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {migrationStats.recentMigrations.slice(0, 10).map((item: any, idx: number) => {
                                                // [Phase 3: Point Zero Reset 반영] 카운트다운 기준점을 KYC 승인일로 변경
                                                const baseDate = item.kycVerifiedDate ? new Date(item.kycVerifiedDate) : new Date(item.settledAt);
                                                const unlockDate = new Date(baseDate.getTime() + (15 * 24 * 60 * 60 * 1000));
                                                const now = currentTime;
                                                const diff = unlockDate.getTime() - now.getTime();
                                                const isUnlocked = diff <= 0 || item.migrationStatus === 'UNLOCKED' || item.migrationStatus === 'MIGRATED';

                                                const days = Math.floor(Math.max(0, diff) / (1000 * 60 * 60 * 24));
                                                const hours = Math.floor((Math.max(0, diff) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                                const mins = Math.floor((Math.max(0, diff) % (1000 * 60 * 60)) / (1000 * 60));
                                                const secs = Math.floor((Math.max(0, diff) % (1000 * 60)) / 1000);

                                                return (
                                                    <tr key={idx} className={`migration-row-item ${isUnlocked ? 'completed' : ''}`}>
                                                        <td className="addr-cell">{item.walletAddress.substring(0, 10)}...{item.walletAddress.substring(34)}</td>
                                                        <td className="date-cell">{new Date(item.settledAt).toLocaleString()}</td>
                                                        <td className="time-cell">
                                                            {isUnlocked ? (
                                                                <span className="transfer-done-text">{currentLang === 'ko' ? '전송 완료' : 'Transfer Done'}</span>
                                                            ) : (
                                                                <span className="countdown-raw">{days}일 {hours.toString().padStart(2, '0')}:{mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}</span>
                                                            )}
                                                        </td>
                                                        <td className="status-cell">
                                                            <span className={`m-badge ${isUnlocked ? 'completed-glow' : 'waiting-pulse'}`}>
                                                                {isUnlocked ? (currentLang === 'ko' ? '완료' : 'Done') : (currentLang === 'ko' ? '대기' : 'Waiting')}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}

                        <section className="transactions-section">
                            <div className="section-header">
                                <div className="title-with-badge">
                                    <h2>{currentLang === 'ko' ? '실시간 뱅킹 이체 내역' : 'Real-time Banking Transactions'}</h2>
                                    <span className="live-badge">LIVE</span>
                                </div>
                                <button className="view-all-btn">{t('explorer.viewAll')}</button>
                            </div>
                            <div className="transactions-list">
                                {loading ? (
                                    <div className="loading-state">{t('explorer.loading')}</div>
                                ) : p2pTransactions.length > 0 ? (
                                    p2pTransactions.map((tx) => (
                                        <div key={tx.txHash} className={`tx-receipt-card ${expandedTx === tx.txHash ? 'expanded' : ''}`}>
                                            <div className="tx-receipt-main" onClick={() => toggleTxDetail(tx.txHash)}>
                                                <div className="tx-flow">
                                                    <div className="tx-party sender">
                                                        <span className="party-label">{t('explorer.txFrom')}</span>
                                                        <span className="party-address">{formatAddress(tx.senderAddress)}</span>
                                                    </div>
                                                    <div className="tx-arrow-wrap">
                                                        <div className="tx-amount-badge p2p">💸 {tx.amount.toFixed(8)} BW</div>
                                                        <div className="tx-arrow">➡️</div>
                                                    </div>
                                                    <div className="tx-party receiver">
                                                        <span className="party-label">{t('explorer.txTo')}</span>
                                                        <span className="party-address">{formatAddress(tx.recipientAddress)}</span>
                                                    </div>
                                                </div>
                                                <div className="tx-action-area">
                                                    <div className="tx-time-ago">{formatTimestamp(new Date(tx.timestamp).getTime())}</div>
                                                    <button className="tx-expand-btn">
                                                        {expandedTx === tx.txHash ? t('explorer.txDetail') : t('explorer.txShowDetail')}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="tx-receipt-details">
                                                <div className="tx-detail-row">
                                                    <span className="detail-label">{t('explorer.hash')}</span>
                                                    <span className="detail-value tx-hash-full">{tx.txHash}</span>
                                                </div>
                                                <div className="tx-detail-row">
                                                    <span className="detail-label">{currentLang === 'ko' ? '거래 유형' : 'TX Type'}</span>
                                                    <span className="detail-value">P2P TRANSFER</span>
                                                </div>
                                                <div className="tx-detail-row">
                                                    <span className="detail-label">{t('explorer.txFee')}</span>
                                                    <span className="detail-value">{tx.fee.toFixed(8)} BW</span>
                                                </div>
                                                <div className="tx-detail-row">
                                                    <span className="detail-label">Status</span>
                                                    <span className="detail-value status-success">{tx.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-data-state">{currentLang === 'ko' ? '최근 뱅킹 거래 내역이 없습니다.' : 'No recent banking transactions.'}</div>
                                )}
                            </div>
                        </section>

                        <section className="transactions-section blocks-section">
                            <div className="section-header">
                                <h2>{t('explorer.latestTransactions')} (Blocks)</h2>
                                <button className="view-all-btn">{t('explorer.viewAll')}</button>
                            </div>
                            <div className="transactions-list">
                                {loading ? (
                                    <div className="loading-state">{t('explorer.loading')}</div>
                                ) : blocks.filter(b => b && b.header).map((block) => (
                                    <div key={block.hash} id={`block-${block.hash}`} className={`tx-receipt-card block-card ${expandedTx === block.hash ? 'expanded' : ''}`}>
                                        <div className="tx-receipt-main" onClick={() => toggleTxDetail(block.hash)}>
                                            <div className="tx-flow">
                                                <div className="tx-party sender">
                                                    <span className="party-label">{t('explorer.txFrom')}</span>
                                                    <span className="party-address">{t('explorer.txCoinbase')}</span>
                                                </div>
                                                <div className="tx-arrow-wrap">
                                                    <div className="tx-amount-badge">⛏️ 50.00 BW</div>
                                                    <div className="tx-arrow">➡️</div>
                                                </div>
                                                <div className="tx-party receiver">
                                                    <span className="party-label">{t('explorer.txTo')}</span>
                                                    <span className="party-address">{formatAddress(block.header?.miner)}</span>
                                                </div>
                                            </div>
                                            <div className="tx-action-area">
                                                <div className="tx-time-ago">{formatTimestamp(block.header?.timestamp || Date.now())}</div>
                                                <button className="tx-expand-btn">
                                                    {expandedTx === block.hash ? t('explorer.txDetail') : t('explorer.txShowDetail')}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="tx-receipt-details">
                                            <div className="tx-detail-row">
                                                <span className="detail-label">{t('explorer.hash')}</span>
                                                <span className="detail-value tx-hash-full">{block.hash}</span>
                                            </div>
                                            <div className="tx-detail-row">
                                                <span className="detail-label">{t('explorer.height')}</span>
                                                <span className="detail-value">#{block.header?.blockHeight || 0}</span>
                                            </div>
                                            <div className="tx-detail-row">
                                                <span className="detail-label">{t('explorer.txFee')}</span>
                                                <span className="detail-value">0.005 BW</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                ) : (
                    /* [4단계] 전용 전수 조사 풀스크린 뷰 (Dedicated Investigation View) */
                    <section className="dedicated-investigation-view animate-fade-in">
                        <div className="investigation-header">
                            <button className="back-to-main-btn" onClick={() => setViewMode('main')}>
                                ⬅️ {currentLang === 'ko' ? '메인 익스플로러로 돌아가기' : 'Back to Main Explorer'}
                            </button>
                            <div className="investigation-title-area">
                                <h1>{currentLang === 'ko' ? '마이그레이션 15일 대기자 전수 조사 시스템' : 'Migration 15-day Waiting List Investigation System'}</h1>
                                <p>{currentLang === 'ko' ? '실시간 30줄 페이징 및 지갑 주소 전수 검색 엔진 가동 중' : 'Live 30-row paging and wallet address search engine active'}</p>
                            </div>
                        </div>

                        <div className="investigation-search-bar">
                            <form onSubmit={handleSearch} className="m-search-form large">
                                <input 
                                    type="text" 
                                    placeholder={currentLang === 'ko' ? '검색할 지갑 주소를 입력하세요 (BW...)' : 'Enter wallet address to search (BW...)'} 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="m-search-input"
                                />
                                <button type="submit" className="m-search-btn">🔍 SEARCH</button>
                            </form>
                        </div>

                        <div className="investigation-content premium-glass-panel">
                            <table className="migration-live-table investigation-table">
                                <thead>
                                    <tr>
                                        <th>{currentLang === 'ko' ? '지갑 주소' : 'Wallet Address'}</th>
                                        <th>{currentLang === 'ko' ? '정산 확정 일자' : 'Approval Date'}</th>
                                        <th>{currentLang === 'ko' ? '전송 대기시간' : 'Waiting Time'}</th>
                                        <th>{currentLang === 'ko' ? '마이그레이션 상태' : 'Status'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {searchResult && (
                                        <tr className="migration-row-item search-highlight">
                                            <td className="addr-cell">
                                                <span className="search-tag">SEARCH RESULT</span>
                                                {searchResult.walletAddress}
                                            </td>
                                            <td className="date-cell">{new Date(searchResult.settledAt).toLocaleString()}</td>
                                            <td className="time-cell">
                                                {(() => {
                                                    const sDate = new Date(searchResult.settledAt);
                                                    const uDate = new Date(sDate.getTime() + (15 * 24 * 60 * 60 * 1000));
                                                    const diff = uDate.getTime() - currentTime.getTime();
                                                    const isUnlocked = diff <= 0 || searchResult.migrationStatus === 'UNLOCKED' || searchResult.migrationStatus === 'MIGRATED';
                                                    const d = Math.floor(Math.max(0, diff) / (1000 * 60 * 60 * 24));
                                                    const h = Math.floor((Math.max(0, diff) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                                    const m = Math.floor((Math.max(0, diff) % (1000 * 60 * 60)) / (1000 * 60));
                                                    const s = Math.floor((Math.max(0, diff) % (1000 * 60)) / 1000);
                                                    return isUnlocked ? <span className="transfer-done-text">DONE</span> : <span className="countdown-raw highlight-text">{d}d {h}:{m}:{s}</span>;
                                                })()}
                                            </td>
                                            <td className="status-cell">
                                                <span className="m-badge search-badge">{searchResult.migrationStatus}</span>
                                            </td>
                                        </tr>
                                    )}

                                    {migrationStats.recentMigrations.map((item: any, idx: number) => {
                                        const settledDate = new Date(item.settledAt);
                                        const unlockDate = new Date(settledDate.getTime() + (15 * 24 * 60 * 60 * 1000));
                                        const diff = unlockDate.getTime() - currentTime.getTime();
                                        const isUnlocked = diff <= 0 || item.migrationStatus === 'UNLOCKED' || item.migrationStatus === 'MIGRATED';
                                        const d = Math.floor(Math.max(0, diff) / (1000 * 60 * 60 * 24));
                                        const h = Math.floor((Math.max(0, diff) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
                                        const m = Math.floor((Math.max(0, diff) % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
                                        const s = Math.floor((Math.max(0, diff) % (1000 * 60)) / 1000).toString().padStart(2, '0');

                                        return (
                                            <tr key={idx} className={`migration-row-item ${isUnlocked ? 'completed' : ''}`}>
                                                <td className="addr-cell">{item.walletAddress}</td>
                                                <td className="date-cell">{new Date(item.settledAt).toLocaleString()}</td>
                                                <td className="time-cell">
                                                    {isUnlocked ? <span className="transfer-done-text">DONE</span> : <span className="countdown-raw">{d}d {h}:{m}:{s}</span>}
                                                </td>
                                                <td className="status-cell">
                                                    <span className={`m-badge ${isUnlocked ? 'completed-glow' : 'waiting-pulse'}`}>{item.migrationStatus}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            <div className="migration-pagination">
                                <button className="page-btn" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>PREV 30</button>
                                <span className="page-indicator">{currentPage} / {totalPages}</span>
                                <button className="page-btn" disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>NEXT 30</button>
                            </div>
                        </div>
                    </section>
                )}
            </main>

            <footer className="explorer-footer">
                <p>&copy; 2026 BitWish Network. All Rights Reserved.</p>
            </footer>
        </div>
    );
};

export default ExplorerPage;
