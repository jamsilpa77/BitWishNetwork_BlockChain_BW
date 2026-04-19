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

    // 실시간 블록 데이터 가져오기
    const fetchBlocks = async () => {
        try {
            const response = await axios.get('/api/stats/blocks');
            if (response.data.success && Array.isArray(response.data.data)) {
                setBlocks(response.data.data);
            }
            
            // [실시간 동기화] 홈페이지 지갑 생성 수 데이터 연동
            const statsResponse = await axios.get('/api/stats/realtime');
            if (statsResponse.data.success) {
                setGlobalStats(statsResponse.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch blockchain data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
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
    }, [currentLang, languageManager]);

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

                <section className="metrics-dashboard">
                    <div className="metric-tile highlight-tile">
                        <div className="metric-icon">🏦</div>
                        <div className="metric-content">
                            <h3>{t('explorer.ecosystemFundTitle')}</h3>
                            <div className="fund-sub-dash">
                                <div className="fund-item">
                                    <span className="fund-label">{t('explorer.txFees')}</span>
                                    <span className="fund-value highlight-blue">0.00000000 <small>BW</small></span>
                                </div>
                                <div className="fund-divider"></div>
                                <div className="fund-item">
                                    <span className="fund-label">{t('explorer.blockFees')}</span>
                                    <span className="fund-value highlight-blue">0.00000000 <small>BW</small></span>
                                </div>
                                <div className="fund-divider"></div>
                                <div className="fund-item total-item">
                                    <span className="fund-label">{t('explorer.totalFees')}</span>
                                    <span className="fund-value highlight-gold">0.00000000 <small>BW</small></span>
                                </div>
                            </div>
                            <div className="fund-actions">
                                <button className="transparency-btn">
                                    🔍 {currentLang === 'ko' ? '기금 지갑 투명성 확인' : 'Check Fund Wallet Transparency'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="metrics-vertical-list">
                        <div className="metric-row">
                            <div className="row-label">
                                <span className="row-icon">💰</span>
                                <h3>{t('explorer.totalCirculating')}</h3>
                            </div>
                            <div className="row-value">21,000,000,000 <span className="currency">BW</span></div>
                        </div>
                        <div className="metric-row">
                            <div className="row-label">
                                <span className="row-icon">🏢</span>
                                <h3>{t('explorer.foundationAllocation')}</h3>
                            </div>
                            <div className="row-value">4,200,000,000 <span className="currency">BW</span></div>
                        </div>
                        <div className="metric-row">
                            <div className="row-label">
                                <span className="row-icon">🌍</span>
                                <h3>{t('explorer.ecosystemAllocation')}</h3>
                            </div>
                            <div className="row-value">16,800,000,000 <span className="currency">BW</span></div>
                        </div>
                        <div className="metric-row">
                            <div className="row-label">
                                <span className="row-icon">⛏️</span>
                                <h3>{t('explorer.minerAllocation')}</h3>
                            </div>
                            <div className="row-value">13,650,000,000 <span className="currency">BW</span></div>
                        </div>
                        <div className="metric-row">
                            <div className="row-label">
                                <span className="row-icon">🤝</span>
                                <h3>{t('explorer.partnerAllocation')}</h3>
                            </div>
                            <div className="row-value">3,150,000,000 <span className="currency">BW</span></div>
                        </div>
                        <div className="metric-row live-row">
                            <div className="row-label">
                                <span className="row-icon">👥</span>
                                <h3>{t('explorer.createdWallets')}</h3>
                            </div>
                            <div className="row-value">{globalStats.totalUsers}</div>
                        </div>
                    </div>
                </section>

                <section className="operations-section">
                    <div className="section-header">
                        <h2>{t('explorer.latestOperations')}</h2>
                        <button className="view-all-btn">{t('explorer.viewAll')}</button>
                    </div>
                    <div className="operations-timeline">
                        <div className="op-card">
                            <div className="op-icon shield-bg">🛡️</div>
                            <div className="op-details">
                                <p className="op-message">{t('explorer.opAdminFundTx')}</p>
                                <span className="op-time">Just now</span>
                            </div>
                        </div>
                        <div className="op-card">
                            <div className="op-icon bot-bg">👤</div>
                            <div className="op-details">
                                <p className="op-message">{t('explorer.opKycBotTx')}</p>
                                <span className="op-time">5 mins ago</span>
                            </div>
                        </div>
                        <div className="op-card">
                            <div className="op-icon fire-bg">🔥</div>
                            <div className="op-details">
                                <p className="op-message">{t('explorer.opBurnEvent')}</p>
                                <span className="op-time">1 hour ago</span>
                            </div>
                        </div>
                    </div>
                </section>

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
