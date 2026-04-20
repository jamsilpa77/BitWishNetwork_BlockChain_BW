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
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(localStorage.getItem('bw-theme') === 'dark');
    const [searchQuery, setSearchQuery] = useState('');
    const [languageManager] = useState(() => new LanguageManager());
    const [currentLang, setCurrentLang] = useState(localStorage.getItem('bw_lang') || 'ko');
    const [expandedTx, setExpandedTx] = useState<string | null>(null);
    const [globalStats, setGlobalStats] = useState({ totalUsers: 0 });
    const [isTestnet, setIsTestnet] = useState(false);

    // 실시간 블록 데이터 가져오기
    const fetchBlocks = async () => {
        try {
            // [작업 계획 2단계: 데이터 소스 완전 격리]
            const blocksUrl = isTestnet ? '/api/testnet/blocks' : '/api/stats/blocks';
            const statsUrl = isTestnet ? '/api/testnet/realtime' : '/api/stats/realtime';

            const response = await axios.get(blocksUrl);
            if (response.data.success && Array.isArray(response.data.data)) {
                setBlocks(response.data.data);
            } else {
                setBlocks([]); // 데이터 소스 전환 시 이전 데이터 잔상 제거
            }

            // [실시간 동기화] 홈페이지 지갑 생성 수 데이터 연동
            const statsResponse = await axios.get(statsUrl);
            if (statsResponse.data.success) {
                setGlobalStats(statsResponse.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch blockchain data:', error);
            setBlocks([]); // 에러 발생 시 데이터 은닉
        } finally {
            setLoading(false);
        }
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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const query = searchQuery.trim();
        if (!query) return;

        // [해결 B & 최종 보강] 실시간 데이터 동기화 무결성 검증 (헤더 정보 유무 확인)
        if (!blocks.some(b => b?.header)) {
            alert(t('explorer.syncing'));
            return;
        }

        // [최종 보강 & 4순위] 실시간 검색 판별 엔진
        const isWalletAddress = /^BW[0-9a-fA-F]{40}$/.test(query);
        const isTxHash = /^[0-9a-fA-F]{64}$/.test(query);

        if (isWalletAddress) {
            const foundIndex = blocks.findIndex(b => b.header?.miner === query);
            const foundBlock = foundIndex !== -1 ? blocks[foundIndex] : null;

            if (foundBlock) {
                alert(`${t('mining.myWallet')} ${query} ${t('explorer.searchResultFound')} (Height: #${foundBlock.header?.blockHeight || 0})`);
                const element = document.getElementById(`block-${foundBlock.hash}`);
                element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                alert(`Wallet Address: ${query}\n${t('explorer.searchResultNotFound')}`);
            }
        } else if (isTxHash) {
            const foundIndex = blocks.findIndex(b => b.hash === query);
            const foundBlock = foundIndex !== -1 ? blocks[foundIndex] : null;

            if (foundBlock) {
                alert(`Transaction/Block Hash: ${query}\n${t('explorer.searchResultFound')}`);
                const element = document.getElementById(`block-${foundBlock.hash}`);
                element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                alert(`Hash: ${query}\n${t('explorer.searchResultNotFound')}`);
            }
        } else {
            alert(t('explorer.invalidQuery'));
        }
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
                            {/* 좌측: 고정 자산 배분 (Fixed Supply) */}
                            <div className="supply-side-box">
                                <div className="side-label">
                                    <span className="dot blue"></span> {currentLang === 'ko' ? '자산 배분 규정 (100%)' : 'Asset Allocation Rules'}
                                </div>
                                <div className="supply-multi-grid">
                                    <div className="s-card">
                                        <div className="sc-label">⛏️ {t('explorer.minerAllocation')}</div>
                                        <div className="sc-value">13,650,000,000 <small>BW</small></div>
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

                            {/* 우측: 실시간 기금 적립 (Live Treasury) */}
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
                                        <div className="fi-gauge"><div className="gauge-fill eco" style={{width: '60%'}}></div></div>
                                    </div>
                                    <div className="flow-item">
                                        <div className="fi-header">
                                            <label>{t('explorer.blockFees')}</label>
                                            <span>0.0000 <small>BW</small></span>
                                        </div>
                                        <div className="fi-gauge"><div className="gauge-fill foundation" style={{width: '40%'}}></div></div>
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

                {isTestnet && (
                    <section className="testnet-dashboard">
                        <div className="testnet-monitor-tile">
                            <div className="monitor-header">
                                <div className="live-pulse"></div>
                                <h2>{currentLang === 'ko' ? '테스트넷 실시간 모니터링' : 'Testnet Live Monitoring'}</h2>
                            </div>
                            <div className="monitor-grid">
                                <div className="monitor-item">
                                    <div className="m-icon">🚀</div>
                                    <div className="m-info">
                                        <label>{currentLang === 'ko' ? '테스트 트랜잭션 수수료 합계' : 'Test Tx Fees Total'}</label>
                                        <span className="m-value">0.00000000 <small>tBW</small></span>
                                    </div>
                                </div>
                                <div className="monitor-divider"></div>
                                <div className="monitor-item">
                                    <div className="m-icon">📦</div>
                                    <div className="m-info">
                                        <label>{currentLang === 'ko' ? '테스트 블록 생성 수수료 합계' : 'Test Block Fees Total'}</label>
                                        <span className="m-value">0.00000000 <small>tBW</small></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {!isTestnet && (
                    <section className="operations-section premium-migration-section animate-fade-in">
                        <div className="section-header">
                            <h2>{currentLang === 'ko' ? '새로운 KYC 승인된 유저의 마이그레이션(15일) 대기자' : 'New KYC Approved User Migration (15-day) Waiting List'}</h2>
                            <button className="view-all-btn">{t('explorer.viewAll')}</button>
                        </div>
                        <div className="migration-table-container">
                            <table className="migration-live-table">
                                <thead>
                                    <tr>
                                        <th>{currentLang === 'ko' ? '지갑 주소' : 'Wallet Address'}</th>
                                        <th>{currentLang === 'ko' ? 'KYC 승인 일자' : 'KYC Approval Date'}</th>
                                        <th>{currentLang === 'ko' ? '전송 대기시간' : 'Transfer Waiting Time'}</th>
                                        <th>{currentLang === 'ko' ? '마이그레이션 상태' : 'Migration Status'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="migration-row-item">
                                        <td className="addr-cell">BW958ACBEA657953450332FFF0FD66ABB0FA994005</td>
                                        <td className="date-cell">2027.02.22 am11:24:22</td>
                                        <td className="time-cell">
                                            <div className="waiting-progress-wrap">
                                                <div className="progress-bg"><div className="progress-fill" style={{ width: '74%' }}></div></div>
                                                <span className="countdown-raw">13일 21:45:32</span>
                                            </div>
                                        </td>
                                        <td className="status-cell">
                                            <span className="m-badge waiting-pulse">{currentLang === 'ko' ? '마이그레이션 대기 중' : 'Migration Waiting'}</span>
                                        </td>
                                    </tr>
                                    <tr className="migration-row-item completed">
                                        <td className="addr-cell">BW69527012159E5A3CF2EFB3E07D8DC7FCFA385EF6</td>
                                        <td className="date-cell">2027.01.11 pm15:22:40</td>
                                        <td className="time-cell">
                                            <span className="transfer-done-text">{currentLang === 'ko' ? '전송 완료' : 'Transfer Done'}</span>
                                        </td>
                                        <td className="status-cell">
                                            <span className="m-badge completed-glow">{currentLang === 'ko' ? '마이그레이션 완료' : 'Migration Completed'}</span>
                                        </td>
                                    </tr>
                                    <tr className="migration-row-item">
                                        <td className="addr-cell">BWD6CCB861E43DA7B213B9871CEC8C49E0F17577E5</td>
                                        <td className="date-cell">2027.03.01 am09:12:05</td>
                                        <td className="time-cell">
                                            <div className="waiting-progress-wrap">
                                                <div className="progress-bg"><div className="progress-fill" style={{ width: '21%' }}></div></div>
                                                <span className="countdown-raw">14일 23:12:45</span>
                                            </div>
                                        </td>
                                        <td className="status-cell">
                                            <span className="m-badge waiting-pulse">{currentLang === 'ko' ? '마이그레이션 대기 중' : 'Migration Waiting'}</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <div className="table-scan-line"></div>
                        </div>
                    </section>
                )}

                <section className="transactions-section">
                    <div className="section-header">
                        <h2>{t('explorer.latestTransactions')}</h2>
                        <button className="view-all-btn">{t('explorer.viewAll')}</button>
                    </div>
                    <div className="transactions-list">
                        {loading ? (
                            <div className="loading-state">{t('explorer.loading')}</div>
                        ) : blocks.filter(b => b && b.header).map((block) => (
                            <div key={block.hash} id={`block-${block.hash}`} className={`tx-receipt-card ${expandedTx === block.hash ? 'expanded' : ''}`}>
                                <div className="tx-receipt-main" onClick={() => toggleTxDetail(block.hash)}>
                                    <div className="tx-flow">
                                        <div className="tx-party sender">
                                            <span className="party-label">{t('explorer.txFrom')}</span>
                                            <span className="party-address">{t('explorer.txCoinbase')}</span>
                                        </div>
                                        <div className="tx-arrow-wrap">
                                            <div className="tx-amount-badge">💸 50.00 BW</div>
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
            </main>

            <footer className="explorer-footer">
                <p>&copy; 2026 BitWish Network. All Rights Reserved.</p>
            </footer>
        </div>
    );
};

export default ExplorerPage;
