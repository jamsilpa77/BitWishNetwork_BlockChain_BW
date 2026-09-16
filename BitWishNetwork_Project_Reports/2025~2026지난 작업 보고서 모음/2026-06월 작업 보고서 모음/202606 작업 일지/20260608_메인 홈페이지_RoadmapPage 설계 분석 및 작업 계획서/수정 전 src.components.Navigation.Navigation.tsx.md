/**
 * BitWishNetwork BW 포인트 채굴 시스템 - 유저 전용
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
 * ❌ 스텔라 관련 코드 사용 금지
 * 
 * ✅ 주석에 "유저/관리자에 따라 전용" 명시 추가
 * ✅ 자체 보안 검증만 사용
 * ✅ 50단위 부동소수점 정밀 계산 로직구현 하지만 UI에 표시 될때는 소수점 8자리까지 표시되도록. 길면 화면 문제 생김.
 * ✅ BitWish Network 전용 시스템만 사용
 * ✅ 모든 텍스트는 한국어, 영어, 일어, 중국어포함 언어 변경 되도록 모든 기능에 완벽하게 구현한다. 단 절대 복잡하게 파일들을 만들지 않도록한다.
 * ✅ 마이닝 페이지는 완벽한 독립성 보장(유저 파일에는 유저로 표기하고 관리자 파일에는 관리자로표기)
 * ✅ 마이닝 페이지는 완벽한 각 완벽한 데이터베이스 MongoDB 하이브리드 저장소를 완벽하게 가진다. 절대 복잡해서는 안된다.
 * ✅ 마이닝은 1명이든 천만명이든 개인 단독 데이터베이스 MongoDB 하이브리드 저장소를 완벽하게 가진다. 절대 복잡해서는 안된다.
 */

import React, { useState, useEffect } from 'react';
import { LanguageManager } from '@/utils/LanguageManager/LanguageManager';
import { Language } from '@/types';
import './Navigation.css';

/**
 * 네비게이션 컴포넌트 - 유저 전용 완벽한 독립성 보장
 * 호버형 버튼, 다국어 지원, 다크 모드 토글, 지갑 기능 통합
 */
const Navigation: React.FC = () => {
  // 절대 준수사항: 전역 변수 사용 금지
  const [languageManager] = useState(() => new LanguageManager());
  const [currentLanguage, setCurrentLanguage] = useState<Language>('ko');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /**
   * 컴포넌트 마운트 시 초기화
   */
  useEffect(() => {
    initializeNavigation();
  }, []);

  /**
   * 네비게이션 초기화
   */
  const initializeNavigation = (): void => {
    try {
      // 언어 설정
      languageManager.setLanguage(currentLanguage);

      // 다크 모드 설정
      const savedTheme = localStorage.getItem('bw-theme');
      if (savedTheme === 'dark') {
        setIsDarkMode(true);
        document.body.classList.add('dark-mode');
      }
    } catch (error) {
      console.error('네비게이션 초기화 오류:', error);
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
   * 모바일 메뉴 토글
   */
  const toggleMobileMenu = (): void => {
    try {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    } catch (error) {
      console.error('모바일 메뉴 토글 오류:', error);
    }
  };

  /**
   * 네비게이션 클릭
   */
  const handleNavigationClick = (path: string): void => {
    try {
      window.location.href = path;
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('네비게이션 클릭 오류:', error);
    }
  };

  /**
   * 지갑 만들기
   */
  const handleCreateWallet = (): void => {
    try {
      // 지갑 생성 로직 (추후 구현)
      console.log('지갑 만들기 클릭');
      window.location.href = '/wallet/create';
    } catch (error) {
      console.error('지갑 만들기 오류:', error);
    }
  };

  /**
   * 나의 지갑
   */
  const handleMyWallet = (): void => {
    try {
      // 나의 지갑 로직 (추후 구현)
      console.log('나의 지갑 클릭');
      window.location.href = '/wallet/my';
    } catch (error) {
      console.error('나의 지갑 오류:', error);
    }
  };

  /**
   * 번역 텍스트 가져오기
   */
  const getTranslation = (key: string): string => {
    return languageManager.getTranslation(key, currentLanguage);
  };

  return (
    <nav className="main-navigation">
      {/* 왼쪽: BitWishNetwork 로고 */}
      <div className="nav-logo">
        <button
          className="logo-button"
          onClick={() => handleNavigationClick('/')}
        >
          <h1 className="logo-text">BitWishNetwork</h1>
        </button>
      </div>

      {/* 중앙: 메인 메뉴들 (호버형 버튼) */}
      <div className="nav-center-menu">
        <div className="nav-item dropdown">
          <button className="nav-button">{getTranslation('navigation.mainnet')}</button>
          <div className="dropdown-content">
            <button onClick={() => handleNavigationClick('/explorer')}>
              {getTranslation('navigation.explorer')}
            </button>
            <button onClick={() => handleNavigationClick('/node')}>
              {getTranslation('navigation.node')}
            </button>
          </div>
        </div>
        <button
          className="nav-button"
          onClick={() => handleNavigationClick('/community')}
        >
          {getTranslation('navigation.community')}
        </button>
        <button
          className="nav-button"
          onClick={() => handleNavigationClick('/dashboard')}
        >
          {getTranslation('navigation.dashboard')}
        </button>
        <div className="nav-item dropdown">
          <button className="nav-button">{getTranslation('navigation.whitepaper')}</button>
          <div className="dropdown-content">
            <button onClick={() => handleNavigationClick('/roadmap')}>
              {getTranslation('navigation.roadmap')}
            </button>
          </div>
        </div>
        <button
          className="nav-button"
          onClick={() => handleNavigationClick('/node')}
        >
          {getTranslation('navigation.node')}
        </button>
      </div>

      {/* 오른쪽: 컨트롤 버튼들 (순서 고정) */}
      <div className="nav-controls">
        {/* 1. 지갑 이모지 (호버 → 지갑 만들기, 나의 지갑) */}
        <div className="nav-item dropdown">
          <button className="nav-icon wallet-icon">💼</button>
          <div className="dropdown-content">
            <button onClick={handleCreateWallet}>
              {getTranslation('mining.createWallet')}
            </button>
            <button onClick={handleMyWallet}>
              {getTranslation('mining.myWallet')}
            </button>
          </div>
        </div>

        {/* 2. 언어 변경 이모지 (호버 → 스크롤 창) */}
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

        {/* 3. 다크/나이트 이모지 (호버 → 해/달 모양) */}
        <div className="nav-item">
          <button
            className="nav-icon theme-toggle"
            onClick={toggleDarkMode}
            title={isDarkMode ? '라이트 모드' : '다크 모드'}
          >
            {isDarkMode ? '🌙' : '☀️'}
          </button>
        </div>

        {/* 모바일 메뉴 토글 */}
        <button
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="메뉴 토글"
        >
          <span className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>

      {/* 모바일 메뉴 */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-content">
          <button
            className="mobile-nav-button"
            onClick={() => handleNavigationClick('/')}
          >
            {getTranslation('navigation.home')}
          </button>
          <button
            className="mobile-nav-button"
            onClick={() => handleNavigationClick('/mainnet')}
          >
            {getTranslation('navigation.mainnet')}
          </button>
          <button
            className="mobile-nav-button"
            onClick={() => handleNavigationClick('/explorer')}
          >
            {getTranslation('navigation.explorer')}
          </button>
          <button
            className="mobile-nav-button"
            onClick={() => handleNavigationClick('/community')}
          >
            {getTranslation('navigation.community')}
          </button>
          <button
            className="mobile-nav-button"
            onClick={() => handleNavigationClick('/dashboard')}
          >
            {getTranslation('navigation.dashboard')}
          </button>
          <button
            className="mobile-nav-button"
            onClick={() => handleNavigationClick('/whitepaper')}
          >
            {getTranslation('navigation.whitepaper')}
          </button>
          <button
            className="mobile-nav-button"
            onClick={() => handleNavigationClick('/roadmap')}
          >
            {getTranslation('navigation.roadmap')}
          </button>
          <button
            className="mobile-nav-button"
            onClick={() => handleNavigationClick('/node')}
          >
            {getTranslation('navigation.node')}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;