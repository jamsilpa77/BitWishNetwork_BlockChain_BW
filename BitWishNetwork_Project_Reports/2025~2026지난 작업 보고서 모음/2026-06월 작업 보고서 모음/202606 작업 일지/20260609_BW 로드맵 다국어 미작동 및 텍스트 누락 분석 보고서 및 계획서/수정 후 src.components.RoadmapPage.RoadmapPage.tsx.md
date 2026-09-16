/**
 * BitWishNetwork BW 포인트 채굴 시스템 - 로드맵 전용 독립 페이지
 * 
 * ⚠️ 중요 준수 사항: 전역 모달, 공통 변수 함수 절대 포함하지 않는다
 * ❌ 전역 변수 사용 금지
 * ❌ 공통 함수 사용 금지  
 * ❌ 공통 클래스 사용 금지
 * ❌ 전역 모달 사용 금지
 * ❌ 중복 코드 사용 금지
 * ❌ 다른 컴포넌트와 상태 공유 금지
 * ❌ 전역 상태 관리 라이브러리 사용 금지
 */

import React, { useState, useEffect } from 'react';
import { LanguageManager } from '../../utils/LanguageManager/LanguageManager';
import { Language } from '../../types';
import './RoadmapPage.css';

const RoadmapPage: React.FC = () => {
    const [languageManager] = useState(() => new LanguageManager());
    const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
        return (localStorage.getItem('bw_lang') as Language) || 'ko';
    });
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const [customRoadmap, setCustomRoadmap] = useState<any>(null);

    useEffect(() => {
        // 다크모드 테마 동기화
        const savedTheme = localStorage.getItem('bw-theme');
        if (savedTheme === 'dark') {
            setIsDarkMode(true);
            document.body.classList.add('dark-mode');
        } else {
            setIsDarkMode(false);
            document.body.classList.remove('dark-mode');
        }

        // 언어 설정 동기화
        languageManager.setLanguage(currentLanguage);

        // 관리자가 설정한 커스텀 문구 불러오기
        const savedRoadmap = localStorage.getItem('BW_CUSTOM_ROADMAP');
        if (savedRoadmap) {
            try {
                setCustomRoadmap(JSON.parse(savedRoadmap));
            } catch (e) {
                console.log("기본 로드맵 문구를 적용합니다.");
            }
        }
    }, [currentLanguage]);

    const handleLanguageChange = (lang: Language) => {
        setCurrentLanguage(lang);
        localStorage.setItem('bw_lang', lang);
    };

    const toggleTheme = () => {
        const nextTheme = !isDarkMode;
        setIsDarkMode(nextTheme);
        if (nextTheme) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('bw-theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('bw-theme', 'light');
        }
    };

    const getTxt = (key: string): string => {
        return languageManager.getTranslation(key, currentLanguage);
    };

    // 관리자창에서 고친 텍스트가 있으면 그것을 보여주고, 없으면 다국어 사전에서 기본값을 가져오는 함수
    const fetchVal = (step: string, field: string, defaultValue: string): string => {
        if (customRoadmap) {
            // [신규 다국어 구조] customRoadmap[lang][step][field]
            if (customRoadmap[currentLanguage] && customRoadmap[currentLanguage][step] && customRoadmap[currentLanguage][step][field]) {
                return customRoadmap[currentLanguage][step][field];
            }
            // [구버전 호환] 플랫 구조 customRoadmap[step][field] → ko 환경에서만 표시
            if (currentLanguage === 'ko' && customRoadmap[step] && customRoadmap[step][field]) {
                return customRoadmap[step][field];
            }
        }
        return defaultValue;
    };

    return (
        <div className={`bw-roadmap-page ${isDarkMode ? 'dark' : 'light'}`}>
            {/* 로드맵 전용 깔끔한 헤더 */}
            <header className="roadmap-header">
                <div className="roadmap-header-container">
                    <div className="roadmap-brand" onClick={() => window.close()}>
                        <span className="brand-logo">🌐</span>
                        <h1 className="brand-name">BitWishNetwork</h1>
                    </div>
                    <div className="roadmap-header-controls">
                        <div className="roadmap-lang-selector">
                            <button className={currentLanguage === 'ko' ? 'active' : ''} onClick={() => handleLanguageChange('ko')}>KO</button>
                            <button className={currentLanguage === 'en' ? 'active' : ''} onClick={() => handleLanguageChange('en')}>EN</button>
                            <button className={currentLanguage === 'ja' ? 'active' : ''} onClick={() => handleLanguageChange('ja')}>JA</button>
                            <button className={currentLanguage === 'zh' ? 'active' : ''} onClick={() => handleLanguageChange('zh')}>ZH</button>
                        </div>
                        <button className="roadmap-theme-btn" onClick={toggleTheme}>
                            {isDarkMode ? '🌙' : '☀️'}
                        </button>
                    </div>
                </div>
            </header>

            <main className="roadmap-main">
                <div className="roadmap-intro">
                    <h2 className="roadmap-main-title">{getTxt('roadmap.mainTitle')}</h2>
                    <p className="roadmap-sub-title">{getTxt('roadmap.subTitle')}</p>
                    <p className="roadmap-guide-hint">{getTxt('roadmap.hoverGuide')}</p>
                </div>

                {/* S자형 구불구불한 도로 레이아웃 트랙 */}
                <div className="roadmap-path-container">
                    <svg className="roadmap-svg-road" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1200" preserveAspectRatio="none">
                        <path
                            d="M 500,50 C 900,100 950,250 500,300 C 50,350 100,500 500,550 C 900,600 950,750 500,800 C 50,850 100,1000 500,1050"
                            fill="none"
                            stroke={isDarkMode ? "rgba(100, 181, 246, 0.2)" : "rgba(102, 126, 234, 0.15)"}
                            strokeWidth="48"
                            strokeLinecap="round"
                        />
                        <path
                            d="M 500,50 C 900,100 950,250 500,300 C 50,350 100,500 500,550 C 900,600 950,750 500,800 C 50,850 100,1000 500,1050"
                            fill="none"
                            stroke={isDarkMode ? "#64b5f6" : "#667eea"}
                            strokeWidth="4"
                            strokeDasharray="12,12"
                            strokeLinecap="round"
                        />
                    </svg>

                    <div className="roadmap-timeline-nodes">

                        {/* Milestone 1 (마우스 오버 시 가변 툴팁 표시) */}
                        <div className="roadmap-node-row left-align">
                            <div className="roadmap-node-point pt1"><span>01</span></div>
                            <div
                                className={`roadmap-node-card first-milestone ${isHovered ? 'parent-hovered' : ''}`}
                                onMouseEnter={() => setIsHovered(true)}
                                onMouseLeave={() => setIsHovered(false)}
                            >
                                <span className="node-date">{fetchVal('step1', 'date', getTxt('roadmap.step1.date'))}</span>
                                <h3 className="node-title hover-trigger">
                                    {fetchVal('step1', 'title', getTxt('roadmap.step1.title'))} <span className="hover-icon">🔍</span>
                                </h3>
                                <p className="node-desc">{fetchVal('step1', 'desc', getTxt('roadmap.step1.desc'))}</p>

                                {/* 마우스를 올리면 내용 크기에 맞추어 크기가 변하는 프리미엄 메시지 박스 */}
                                <div className="premium-adjustable-tooltip">
                                    <div className="tooltip-inner-content">
                                        <div className="tooltip-header-badge">TECHNICAL ANNOUNCEMENT</div>
                                        <h4 className="tooltip-system-name">{fetchVal('step1', 'tooltipTitle', getTxt('roadmap.step1.tooltipTitle'))}</h4>
                                        <p className="tooltip-subphrase">{fetchVal('step1', 'tooltipSubtitle', getTxt('roadmap.step1.tooltipSubtitle'))}</p>
                                        <div className="tooltip-divider"></div>
                                        <p className="tooltip-body-text">{fetchVal('step1', 'tooltipContent', getTxt('roadmap.step1.tooltipContent'))}</p>
                                    </div>
                                    <div className="tooltip-glow-border"></div>
                                </div>
                            </div>
                        </div>

                        {/* Milestone 2 */}
                        <div className="roadmap-node-row right-align">
                            <div className="roadmap-node-point pt2"><span>02</span></div>
                            <div className="roadmap-node-card">
                                <span className="node-date">{fetchVal('step2', 'date', getTxt('roadmap.step2.date'))}</span>
                                <h3 className="node-title">{fetchVal('step2', 'title', getTxt('roadmap.step2.title'))}</h3>
                                <p className="node-desc">{fetchVal('step2', 'desc', getTxt('roadmap.step2.desc'))}</p>
                            </div>
                        </div>

                        {/* Milestone 3 */}
                        <div className="roadmap-node-row left-align">
                            <div className="roadmap-node-point pt3"><span>03</span></div>
                            <div className="roadmap-node-card">
                                <span className="node-date">{fetchVal('step3', 'date', getTxt('roadmap.step3.date'))}</span>
                                <h3 className="node-title">{fetchVal('step3', 'title', getTxt('roadmap.step3.title'))}</h3>
                                <p className="node-desc">{fetchVal('step3', 'desc', getTxt('roadmap.step3.desc'))}</p>
                            </div>
                        </div>

                        {/* Milestone 4 */}
                        <div className="roadmap-node-row right-align">
                            <div className="roadmap-node-point pt4"><span>04</span></div>
                            <div className="roadmap-node-card">
                                <span className="node-date">{fetchVal('step4', 'date', getTxt('roadmap.step4.date'))}</span>
                                <h3 className="node-title">{fetchVal('step4', 'title', getTxt('roadmap.step4.title'))}</h3>
                                <p className="node-desc">{fetchVal('step4', 'desc', getTxt('roadmap.step4.desc'))}</p>
                            </div>
                        </div>

                        {/* Milestone 5 */}
                        <div className="roadmap-node-row left-align">
                            <div className="roadmap-node-point pt5"><span>05</span></div>
                            <div className="roadmap-node-card">
                                <span className="node-date">{fetchVal('step5', 'date', getTxt('roadmap.step5.date'))}</span>
                                <h3 className="node-title">{fetchVal('step5', 'title', getTxt('roadmap.step5.title'))}</h3>
                                <p className="node-desc">{fetchVal('step5', 'desc', getTxt('roadmap.step5.desc'))}</p>
                            </div>
                        </div>

                        {/* Milestone 6 */}
                        <div className="roadmap-node-row right-align">
                            <div className="roadmap-node-point pt6"><span>06</span></div>
                            <div className="roadmap-node-card">
                                <span className="node-date">{fetchVal('step6', 'date', getTxt('roadmap.step6.date'))}</span>
                                <h3 className="node-title">{fetchVal('step6', 'title', getTxt('roadmap.step6.title'))}</h3>
                                <p className="node-desc">{fetchVal('step6', 'desc', getTxt('roadmap.step6.desc'))}</p>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            {/* 하단 푸터 */}
            <footer className="roadmap-footer">
                <p className="footer-copyright">© 2026 BitWishNetwork Roadmap. All rights reserved.</p>
                <button className="footer-close-btn" onClick={() => window.close()}>창 닫기</button>
            </footer>
        </div>
    );
};

export default RoadmapPage;