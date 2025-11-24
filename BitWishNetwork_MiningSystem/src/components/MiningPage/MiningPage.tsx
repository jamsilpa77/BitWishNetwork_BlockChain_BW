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

import React, { useState, useEffect } from 'react';
import { LanguageManager } from '@/utils/LanguageManager/LanguageManager';
import { MiningService } from '@/services/MiningService/MiningService';
import { AttendanceBonusService } from '@/services/BonusService/AttendanceBonusService';
import { ReferralBonusService } from '@/services/BonusService/ReferralBonusService';
import { PartnerBonusService } from '@/services/BonusService/PartnerBonusService';
import { PrecisionCalculator } from '@/utils/PrecisionCalculator/PrecisionCalculator';
import { 
  MiningStatus, 
  Language,
  AttendanceBonus,
  ReferralBonus,
  PartnerBonus
} from '@/types';
import { MINING_CONSTANTS, BONUS_CONSTANTS, MINING_STATUS, ATTENDANCE_STATUS, REFERRAL_STATUS, PARTNER_STATUS } from '@/constants';
import { Decimal } from 'decimal.js';
import './MiningPage.css';

/**
 * 마이닝 페이지 컴포넌트 - 완벽한 독립성 보장
 * 마이닝 페이지 & 보너스 설정 창, 4개 보너스 설정 버튼, 마이닝 상태 확인 창, 실시간 마이닝 보상 창
 */
const MiningPage: React.FC = () => {
  // 절대 준수사항: 전역 변수 사용 금지
  const [languageManager] = useState(() => new LanguageManager());
  const [miningService] = useState(() => new MiningService());
  const [attendanceBonusService] = useState(() => new AttendanceBonusService());
  const [referralBonusService] = useState(() => new ReferralBonusService());
  const [partnerBonusService] = useState(() => new PartnerBonusService());
  const [precisionCalculator] = useState(() => new PrecisionCalculator());
  
  const [currentLanguage, setCurrentLanguage] = useState<Language>('ko');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [miningStatus, setMiningStatus] = useState<MiningStatus>(MINING_STATUS.STOPPED);
  const [miningTime, setMiningTime] = useState<number>(0);
  const [accumulatedReward, setAccumulatedReward] = useState<number>(0);
  const [attendanceBonus, setAttendanceBonus] = useState<string | null>(null);
  const [referralBonus, setReferralBonus] = useState<ReferralBonus | null>(null);
  const [partnerBonus, setPartnerBonus] = useState<PartnerBonus | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');

  /**
   * 컴포넌트 마운트 시 초기화
   */
  useEffect(() => {
    initializeMiningPage();
    startMiningTimer();
    
    return () => {
      stopMiningTimer();
    };
  }, []);

  /**
   * 마이닝 페이지 초기화
   */
  const initializeMiningPage = (): void => {
    try {
      // 언어 설정
      languageManager.setLanguage(currentLanguage);
      
      // 다크 모드 설정
      const savedTheme = localStorage.getItem('bw-theme');
      if (savedTheme === 'dark') {
        setIsDarkMode(true);
        document.body.classList.add('dark-mode');
      }
      
      // 지갑 주소 로드
      loadWalletAddress();
      
      // 보너스 상태 로드
      loadBonusStatus();
      
      // 마이닝 상태 로드
      loadMiningStatus();
    } catch (error) {
      console.error('마이닝 페이지 초기화 오류:', error);
    }
  };

  /**
   * 마이닝 타이머 시작
   */
  const startMiningTimer = (): (() => void) | void => {
    try {
      const interval = setInterval(() => {
        if (miningStatus === MINING_STATUS.MINING) {
          setMiningTime(prev => prev + 1);
          updateAccumulatedReward();
        }
      }, 1000);
      
      return () => clearInterval(interval);
    } catch (error) {
      console.error('마이닝 타이머 시작 오류:', error);
    }
  };

  /**
   * 마이닝 타이머 중지
   */
  const stopMiningTimer = (): void => {
    try {
      // 타이머 정리 로직
    } catch (error) {
      console.error('마이닝 타이머 중지 오류:', error);
    }
  };

  /**
   * 지갑 주소 로드
   */
  const loadWalletAddress = (): void => {
    try {
      const savedAddress = localStorage.getItem('bw-wallet-address');
      if (savedAddress) {
        setWalletAddress(savedAddress);
      }
    } catch (error) {
      console.error('지갑 주소 로드 오류:', error);
    }
  };

  /**
   * 보너스 상태 로드
   */
  const loadBonusStatus = (): void => {
    try {
      const userId = 'current-user'; // 실제로는 인증된 사용자 ID
      
      // 출석 보너스 상태
      const attendanceStatus = attendanceBonusService.getAttendanceStatus();
      setAttendanceBonus(attendanceStatus);
      
      // 추천 보너스 상태
      const referralStatus = referralBonusService.getReferralStats(userId);
      setReferralBonus(referralStatus);
      
      // 가맹점 보너스 상태
      const partnerStatus = partnerBonusService.getPartnerStatus(userId);
      setPartnerBonus(partnerStatus);
    } catch (error) {
      console.error('보너스 상태 로드 오류:', error);
    }
  };

  /**
   * 마이닝 상태 로드
   */
  const loadMiningStatus = (): void => {
    try {
      const userId = 'current-user'; // 실제로는 인증된 사용자 ID
      const status = miningService.getMiningStatus(userId);
      setMiningStatus(status.status);
      setMiningTime(status.miningTime);
      setAccumulatedReward(status.accumulatedReward);
    } catch (error) {
      console.error('마이닝 상태 로드 오류:', error);
    }
  };

  /**
   * 누적 보상 업데이트
   */
  const updateAccumulatedReward = (): void => {
    try {
      const baseRate = 0.25; // 시간당 기본 보상률
      let totalRate = baseRate;
      
      // 출석 보너스 적용
      if (attendanceBonus === 'AVAILABLE') {
        const attendanceResult = attendanceBonusService.applyAttendanceBonus();
        if (attendanceResult.success) {
          totalRate = baseRate * 1.05; // 5% 보너스 적용
        }
      }
      
      // 추천 보너스 적용
      if (referralBonus?.bonusRate && referralBonus.bonusRate > 0) {
        const referralResult = referralBonusService.applyReferralBonus('current-user', baseRate);
        if (referralResult.success) {
          totalRate = referralResult.totalRate || totalRate;
        }
      }
      
      // 가맹점 보너스 적용
      if (partnerBonus?.status === 'APPROVED') {
        const partnerResult = partnerBonusService.applyPartnerBonus('current-user', baseRate);
        if (partnerResult.success) {
          totalRate = partnerResult.totalRate || totalRate;
        }
      }
      
      // 누적 보상 계산
      const hourlyReward = totalRate;
      const currentReward = (miningTime / 3600) * hourlyReward;
      setAccumulatedReward(currentReward);
    } catch (error) {
      console.error('누적 보상 업데이트 오류:', error);
    }
  };

  /**
   * 마이닝 시작
   */
  const handleStartMining = (): void => {
    try {
      const userId = 'current-user'; // 실제로는 인증된 사용자 ID
      // 임시 사용자 객체 (실제로는 인증된 사용자 정보를 사용)
      const user = {
        id: userId,
        userId: userId,
        email: 'user@example.com',
        password: '',
        walletAddress: walletAddress,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        kycStatus: 'PENDING' as const,
        miningStatus: 'IDLE' as const,
        bonusStatus: {
          attendance: { isActive: false, lastCheckDate: null, consecutiveDays: 0, totalAttendanceDays: 0, totalBonus: 0, bonusRate: 0, attendanceHistory: [] },
          referral: { referralCode: '', referredUsers: [], totalBonus: 0, bonusRate: 0, rewardAmount: 0, bonusStorage: 0, rewardStorage: 0 },
          partner: { status: 'NOT_REGISTERED' as const, registrationDate: null, approvalDate: null, businessLicense: null, bonusRate: 0, totalBonus: 0 }
        },
        referralCode: '',
        partnerStatus: 'NOT_REGISTERED' as const
      };
      miningService.startMining(userId, user);
      setMiningStatus(MINING_STATUS.MINING);
    } catch (error) {
      console.error('마이닝 시작 오류:', error);
    }
  };

  /**
   * 마이닝 정지
   */
  const handleStopMining = (): void => {
    try {
      const userId = 'current-user'; // 실제로는 인증된 사용자 ID
      miningService.stopMining(userId);
      setMiningStatus(MINING_STATUS.STOPPED);
    } catch (error) {
      console.error('마이닝 정지 오류:', error);
    }
  };

  /**
   * 마이닝 일시정지
   */
  const handlePauseMining = (): void => {
    try {
      const userId = 'current-user'; // 실제로는 인증된 사용자 ID
      miningService.pauseMining(userId);
      setMiningStatus(MINING_STATUS.PAUSED);
    } catch (error) {
      console.error('마이닝 일시정지 오류:', error);
    }
  };

  /**
   * 마이닝 재개
   */
  const handleResumeMining = (): void => {
    try {
      const userId = 'current-user'; // 실제로는 인증된 사용자 ID
      miningService.resumeMining(userId);
      setMiningStatus(MINING_STATUS.MINING);
    } catch (error) {
      console.error('마이닝 재개 오류:', error);
    }
  };

  /**
   * 출석 보너스 설정
   */
  const handleAttendanceBonus = (): void => {
    try {
      const result = attendanceBonusService.applyAttendanceBonus();
      if (result.success) {
        loadBonusStatus();
      }
    } catch (error) {
      console.error('출석 보너스 설정 오류:', error);
    }
  };

  /**
   * 추천 보너스 설정
   */
  const handleReferralBonus = (): void => {
    try {
      const userId = 'current-user'; // 실제로는 인증된 사용자 ID
      // 추천 보너스 설정 로직
      console.log('추천 보너스 설정');
    } catch (error) {
      console.error('추천 보너스 설정 오류:', error);
    }
  };

  /**
   * 가맹점 보너스 설정
   */
  const handlePartnerBonus = (): void => {
    try {
      const userId = 'current-user'; // 실제로는 인증된 사용자 ID
      // 가맹점 보너스 설정 로직
      console.log('가맹점 보너스 설정');
    } catch (error) {
      console.error('가맹점 보너스 설정 오류:', error);
    }
  };

  /**
   * 프로필 설정
   */
  const handleProfileSettings = (): void => {
    try {
      const userId = 'current-user'; // 실제로는 인증된 사용자 ID
      // 프로필 설정 로직
      console.log('프로필 설정');
    } catch (error) {
      console.error('프로필 설정 오류:', error);
    }
  };

  /**
   * 언어 변경
   */
  const handleLanguageChange = (language: Language): void => {
    try {
      const userId = 'current-user'; // 실제로는 인증된 사용자 ID
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
      const userId = 'current-user'; // 실제로는 인증된 사용자 ID
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
   * 번역 텍스트 가져오기
   */
  const getTranslation = (key: string, params?: { [key: string]: string | number }): string => {
    const userId = 'current-user'; // 실제로는 인증된 사용자 ID
    return languageManager.getTranslation(key, currentLanguage);
  };

  /**
   * 숫자 포맷팅 (8자리 소수점)
   */
  const formatNumber = (value: number): string => {
    const userId = 'current-user'; // 실제로는 인증된 사용자 ID
    return precisionCalculator.formatForUI(new Decimal(value));
  };

  /**
   * 시간 포맷팅
   */
  const formatTime = (seconds: number): string => {
    const userId = 'current-user'; // 실제로는 인증된 사용자 ID
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`mining-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* 헤더 */}
      <header className="mining-header">
        <div className="header-content">
          <div className="header-left">
            <button 
              className="back-button"
              onClick={() => window.location.href = '/'}
            >
              ← {getTranslation('common.back')}
            </button>
            <h1 className="page-title">
              {getTranslation('mining.miningPageTitle')}
            </h1>
          </div>
          
          <div className="header-controls">
            <select 
              className="language-selector"
              value={currentLanguage}
              onChange={(e) => handleLanguageChange(e.target.value as Language)}
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
              <option value="zh">中文</option>
              <option value="th">ไทย</option>
              <option value="vi">Tiếng Việt</option>
              <option value="id">Bahasa Indonesia</option>
              <option value="ms">Bahasa Melayu</option>
              <option value="tl">Filipino</option>
              <option value="km">ខ្មែរ</option>
              <option value="lo">ລາວ</option>
              <option value="my">မြန်မာ</option>
            </select>
            
            <button 
              className="theme-toggle"
              onClick={toggleDarkMode}
              title={isDarkMode ? '라이트 모드' : '다크 모드'}
            >
              {isDarkMode ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="mining-main">
        {/* 마이닝 상태 확인 창 */}
        <section className="mining-status-section">
          <div className="status-container">
            <h2 className="section-title">
              {getTranslation('mining.miningStatus')}
            </h2>
            
            <div className="mining-info-grid">
              {/* 마이닝 상태 */}
              <div className="mining-status-card">
                <div className="card-header">
                  <h3>{getTranslation('mining.miningInProgress')}</h3>
                  <span className={`status-indicator ${miningStatus}`}>
                    {miningStatus === MINING_STATUS.MINING ? '🟢' : miningStatus === MINING_STATUS.PAUSED ? '🟡' : '🔴'}
                  </span>
                </div>
                <div className="card-content">
                  <p className="status-text">
                    {miningStatus === MINING_STATUS.MINING 
                      ? getTranslation('mining.miningInProgress')
                      : miningStatus === MINING_STATUS.PAUSED
                      ? getTranslation('mining.miningPaused')
                      : getTranslation('mining.miningStopped')
                    }
                  </p>
                  <p className="mining-time">
                    {getTranslation('mining.miningTime')}: {formatTime(miningTime)}
                  </p>
                </div>
              </div>

              {/* 실시간 누적 보상 */}
              <div className="reward-card">
                <div className="card-header">
                  <h3>{getTranslation('mining.realtimeAccumulatedReward')}</h3>
                </div>
                <div className="card-content">
                  <p className="reward-amount">
                    {formatNumber(accumulatedReward)} BW
                  </p>
                  <p className="reward-description">
                    {getTranslation('mining.accumulatedReward')}
                  </p>
                </div>
              </div>

              {/* 지갑 주소 */}
              <div className="wallet-card">
                <div className="card-header">
                  <h3>{getTranslation('mining.authenticatedWalletAddress')}</h3>
                </div>
                <div className="card-content">
                  <p className="wallet-address">
                    {walletAddress || getTranslation('mining.noWalletAddress')}
                  </p>
                  <p className="wallet-description">
                    {getTranslation('mining.walletDescription')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 마이닝 컨트롤 */}
        <section className="mining-control-section">
          <div className="control-container">
            <div className="mining-buttons">
              {miningStatus === MINING_STATUS.STOPPED && (
                <button 
                  className="mining-button start-button"
                  onClick={handleStartMining}
                >
                  {getTranslation('mining.startMining')}
                </button>
              )}
              
              {miningStatus === MINING_STATUS.MINING && (
                <>
                  <button 
                    className="mining-button pause-button"
                    onClick={handlePauseMining}
                  >
                    {getTranslation('mining.pauseMining')}
                  </button>
                  <button 
                    className="mining-button stop-button"
                    onClick={handleStopMining}
                  >
                    {getTranslation('mining.stopMining')}
                  </button>
                </>
              )}
              
              {miningStatus === MINING_STATUS.PAUSED && (
                <>
                  <button 
                    className="mining-button resume-button"
                    onClick={handleResumeMining}
                  >
                    {getTranslation('mining.resumeMining')}
                  </button>
                  <button 
                    className="mining-button stop-button"
                    onClick={handleStopMining}
                  >
                    {getTranslation('mining.stopMining')}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* 보너스 설정 섹션 */}
        <section className="bonus-settings-section">
          <div className="bonus-container">
            <h2 className="section-title">
              {getTranslation('mining.bonusSettings')}
            </h2>
            
            <div className="bonus-buttons-grid">
              {/* 출석 보너스 */}
              <button 
                className={`bonus-button attendance-button ${attendanceBonus === 'AVAILABLE' ? 'active' : ''}`}
                onClick={handleAttendanceBonus}
              >
                <div className="bonus-icon">📅</div>
                <div className="bonus-content">
                  <h3>{getTranslation('mining.attendanceBonus')}</h3>
                  <p className="bonus-rate">+5%</p>
                  <p className="bonus-status">
                    {attendanceBonus === 'AVAILABLE' ? getTranslation('mining.on') : getTranslation('mining.off')}
                  </p>
                </div>
              </button>

              {/* 추천 보너스 */}
              <button 
                className={`bonus-button referral-button ${referralBonus?.bonusRate && referralBonus.bonusRate > 0 ? 'active' : ''}`}
                onClick={handleReferralBonus}
              >
                <div className="bonus-icon">👥</div>
                <div className="bonus-content">
                  <h3>{getTranslation('mining.referralBonus')}</h3>
                  <p className="bonus-rate">+2%</p>
                  <p className="bonus-status">
                    {referralBonus?.bonusRate && referralBonus.bonusRate > 0 ? getTranslation('mining.on') : getTranslation('mining.off')}
                  </p>
                </div>
              </button>

              {/* 가맹점 보너스 */}
              <button 
                className={`bonus-button partner-button ${partnerBonus?.status === 'APPROVED' ? 'active' : ''}`}
                onClick={handlePartnerBonus}
              >
                <div className="bonus-icon">🏢</div>
                <div className="bonus-content">
                  <h3>{getTranslation('mining.merchantBonus')}</h3>
                  <p className="bonus-rate">+125%</p>
                  <p className="bonus-status">
                    {partnerBonus?.status === 'APPROVED' ? getTranslation('mining.on') : getTranslation('mining.off')}
                  </p>
                </div>
              </button>

              {/* 프로필 설정 */}
              <button 
                className="bonus-button profile-button"
                onClick={handleProfileSettings}
              >
                <div className="bonus-icon">⚙️</div>
                <div className="bonus-content">
                  <h3>{getTranslation('mining.profileSettings')}</h3>
                  <p className="bonus-description">
                    {getTranslation('mining.profileDescription')}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* 보너스 정보 */}
        <section className="bonus-info-section">
          <div className="info-container">
            <div className="info-card">
              <h3>{getTranslation('mining.bonusInfoTitle')}</h3>
              <p className="info-text">
                {getTranslation('mining.bonusSettingsInfo')}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MiningPage;