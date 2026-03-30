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

    // 실시간 블록 데이터 가져오기
    const fetchBlocks = async () => {
        try {
            const response = await axios.get('/api/stats/blocks');
            if (response.data.success && Array.isArray(response.data.data)) {
                setBlocks(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch blocks:', error);
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

                <section className="stats-overview">
                    <div className="stat-card">
                        <h3>{t('explorer.latestHeight')}</h3>
                        <p className="stat-value">{blocks[0]?.header?.blockHeight || '-'}</p>
                    </div>
                    <div className="stat-card">
                        <h3>{t('explorer.avgBlockTime')}</h3>
                        <p className="stat-value">10s</p>
                    </div>
                    <div className="stat-card">
                        <h3>{t('explorer.network')}</h3>
                        <p className="stat-value">MAINNET</p>
                    </div>
                </section>

                <section className="blocks-section">
                    <h2>{t('explorer.latestBlocks')}</h2>
                    <div className="blocks-table-container">
                        <table className="blocks-table">
                            <thead>
                                <tr>
                                    <th>{t('explorer.height')}</th>
                                    <th>{t('explorer.hash')}</th>
                                    <th>{t('explorer.miner')}</th>
                                    <th>{t('explorer.timestamp')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={4} className="loading-cell">{t('explorer.loading')}</td></tr>
                                ) : blocks.filter(b => b && b.header).map((block) => (
                                    <tr key={block.hash} id={`block-${block.hash}`} className="block-row">
                                        <td className="height-cell">#{block.header?.blockHeight || 0}</td>
                                        <td className="hash-cell" title={block.hash}>
                                            {shortenHash(block.hash)}
                                        </td>
                                        <td className="miner-cell">{block.header?.miner || t('explorer.unknown')}</td>
                                        <td className="time-cell">{formatTimestamp(block.header?.timestamp || Date.now())}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
