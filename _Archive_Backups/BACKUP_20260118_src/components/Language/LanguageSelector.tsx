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
import { LanguageManager } from '@/utils/LanguageManager/LanguageManager';
import { Language } from '@/types';
import './LanguageSelector.css';

/**
 * 언어 선택기 컴포넌트 - 완벽한 독립성 보장
 * 기본 4개국 지원 (한국어, 영어, 일본어, 중국어)
 */
const LanguageSelector: React.FC = () => {
  // 절대 준수사항: 전역 변수 사용 금지
  const [languageManager] = useState(() => new LanguageManager());
  const [currentLanguage, setCurrentLanguage] = useState<Language>('ko');
  const [isOpen, setIsOpen] = useState(false);

  /**
   * 컴포넌트 마운트 시 초기화
   */
  useEffect(() => {
    initializeLanguageSelector();
  }, []);

  /**
   * 유효한 언어인지 확인
   */
  const isValidLanguage = (language: string): language is Language => {
    const validLanguages: Language[] = ['ko', 'en', 'ja', 'zh'];
    return validLanguages.includes(language as Language);
  };

  /**
   * 언어 선택기 초기화
   */
  const initializeLanguageSelector = (): void => {
    try {
      // 저장된 언어 설정 로드
      const savedLanguage = localStorage.getItem('bw-language') as Language;
      if (savedLanguage && isValidLanguage(savedLanguage)) {
        setCurrentLanguage(savedLanguage);
        languageManager.setLanguage(savedLanguage);
      } else {
        // 기본 언어 설정
        languageManager.setLanguage(currentLanguage);
      }
    } catch (error) {
      console.error('언어 선택기 초기화 오류:', error);
    }
  };

  /**
   * 언어 변경
   */
  const handleLanguageChange = (language: Language): void => {
    try {
      setCurrentLanguage(language);
      languageManager.setLanguage(language);
      localStorage.setItem('bw-language', language);
      setIsOpen(false);
    } catch (error) {
      console.error('언어 변경 오류:', error);
    }
  };

  /**
   * 드롭다운 토글
   */
  const toggleDropdown = (): void => {
    try {
      setIsOpen(!isOpen);
    } catch (error) {
      console.error('드롭다운 토글 오류:', error);
    }
  };

  /**
   * 언어 정보 가져오기
   */
  const getLanguageInfo = (code: Language): { name: string; flag: string; nativeName: string } => {
    const languageMap = {
      ko: { name: 'Korean', flag: '🇰🇷', nativeName: '한국어' },
      en: { name: 'English', flag: '🇺🇸', nativeName: 'English' },
      ja: { name: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
      zh: { name: 'Chinese', flag: '🇨🇳', nativeName: '中文' }
    };

    return languageMap[code] || { name: 'Unknown', flag: '🌐', nativeName: 'Unknown' };
  };

  /**
   * 번역 텍스트 가져오기
   */
  const getTranslation = (key: string): string => {
    return languageManager.getTranslation(key, currentLanguage);
  };

  const currentLanguageInfo = getLanguageInfo(currentLanguage);

  return (
    <div className="language-selector">
      <button
        className="language-button"
        onClick={toggleDropdown}
        aria-label="언어 선택"
        aria-expanded={isOpen}
      >
        <span className="language-flag">{currentLanguageInfo.flag}</span>
        <span className="language-name">{currentLanguageInfo.nativeName}</span>
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="language-dropdown">
          <div className="dropdown-content">
            {(['ko', 'en', 'ja', 'zh'] as Language[]).map((language) => {
              const languageInfo = getLanguageInfo(language);
              return (
                <button
                  key={language}
                  className={`language-option ${currentLanguage === language ? 'active' : ''}`}
                  onClick={() => handleLanguageChange(language)}
                >
                  <span className="option-flag">{languageInfo.flag}</span>
                  <div className="option-text">
                    <span className="option-native">{languageInfo.nativeName}</span>
                    <span className="option-english">{languageInfo.name}</span>
                  </div>
                  {currentLanguage === language && (
                    <span className="checkmark">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;