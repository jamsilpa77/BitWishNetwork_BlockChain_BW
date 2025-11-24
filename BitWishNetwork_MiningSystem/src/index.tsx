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
 * ✅ 모든 텍스트는 한국어, 영어, 일어, 중국어포함 동남아권 언어 변경 되도록 모든 기능에 완벽하게 구현한다. 
 *        단 절대 복잡하게 파일들을 만들지 않도록한다. 
 * ✅ 마이닝 페이지는 완벽한 독립성 보장과 완벽한 데이터베이스 MongDB 하이브리드 완벽 저장소 구현한다. 
 * ✅ 유저는 1명이든 천만명이든 개인 단독 데이터베이스 MongDB 하이브리드 완벽 저장소를 구현한다.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import HomePage from './components/HomePage/HomePage';
import MiningPage from './components/MiningPage/MiningPage';
import Navigation from './components/Navigation/Navigation';
import LanguageSelector from './components/Language/LanguageSelector';
import { Language } from './types';
import './styles/global.css';

interface AppState {
  currentPage: string;
  currentLanguage: Language;
  isDarkMode: boolean;
}

interface AppProps { }

// Navigation 컴포넌트 props 인터페이스
interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

// LanguageSelector 컴포넌트 props 인터페이스
interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

// HomePage 컴포넌트 props 인터페이스
interface HomePageProps {
  currentLanguage: Language;
}

// MiningPage 컴포넌트 props 인터페이스
interface MiningPageProps {
  currentLanguage: Language;
}

/**
 * BitWishNetwork 메인 애플리케이션 컴포넌트 - 완벽한 독립성 보장
 * 프론트엔드 5000포트에서 실행
 */
class BitWishNetworkApp extends React.Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);
    // 절대 준수사항: 전역 변수 사용 금지
    this.state = {
      currentPage: 'home',
      currentLanguage: 'ko' as Language,
      isDarkMode: false
    };
  }

  /**
   * 페이지 변경
   */
  changePage = (page: string) => {
    this.setState({ currentPage: page });
  };

  /**
   * 언어 변경
   */
  changeLanguage = (language: Language) => {
    this.setState({ currentLanguage: language });
  };

  /**
   * 다크 모드 토글
   */
  toggleDarkMode = () => {
    this.setState(prevState => ({ isDarkMode: !prevState.isDarkMode }));
  };

  /**
   * 현재 페이지 렌더링
   */
  renderCurrentPage = () => {
    const { currentPage, currentLanguage } = this.state;

    switch (currentPage) {
      // case 'mining':
      //   return <MiningPage />;
      case 'home':
      default:
        return <HomePage />;
    }
  };

  override render() {
    const { currentPage, currentLanguage, isDarkMode } = this.state;

    return (
      <div className={`bitwish-app ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
        <main className="main-content">
          {this.renderCurrentPage()}
        </main>

        <LanguageSelector />
      </div>
    );
  }
}

// React 18 방식으로 렌더링
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <BrowserRouter>
      <BitWishNetworkApp />
    </BrowserRouter>
  );
} else {
  console.error('Root element not found');
}
