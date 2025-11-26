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

import React, { useState, useEffect, useCallback } from 'react';
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

  // 1. Helper Functions Definitions
  const getTranslation = useCallback((key: string) => {
    return languageManager.getTranslation(key, currentLanguage);
  }, [languageManager, currentLanguage]);

  const formatNumber = useCallback((value: number) => {
    return precisionCalculator.formatForUI(new Decimal(value));
  }, [precisionCalculator]);

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // 2. Data Loading Functions
  const loadWalletAddress = useCallback(() => {
    try {
      const savedAddress = localStorage.getItem('bw-wallet-address');
      if (savedAddress) {
        setWalletAddress(savedAddress);
      }
    } catch (error) {
      console.error('지갑 주소 로드 오류:', error);
    }
  }, []);

  const loadBonusStatus = useCallback(() => {
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
  }, [attendanceBonusService, referralBonusService, partnerBonusService]);

  const loadMiningStatus = useCallback(async () => {
    try {
      if (!walletAddress) return;
      const status = await miningService.getMiningStatus(walletAddress);
      setMiningStatus(status.status);
      setMiningTime(status.miningTime);
      setAccumulatedReward(status.accumulatedReward);

      // 서버에서 출석 보너스가 활성화되어 있다면 UI 상태도 업데이트
      if (status.isAttendanceActive) {
        setAttendanceBonus('COMPLETED');
      }
    } catch (error) {
      console.error('마이닝 상태 로드 오류:', error);
    }
  }, [walletAddress, miningService]);

  // 3. Reward Calculation
  const updateAccumulatedReward = useCallback(() => {
    try {
      // 기본 채굴률
      const baseRate = MINING_CONSTANTS.HOURLY_BASE_RATE;
      let totalRate: number = baseRate;

      // 보너스 적용
      if (attendanceBonus === 'COMPLETED') {
        totalRate += baseRate * 0.05; // 5%
      }

      // 추천 보너스 적용
      const referralResult = referralBonusService.applyReferralBonus('current-user', baseRate);
      if (referralResult.success) {
        totalRate = referralResult.totalRate || totalRate;
      }

      // 가맹점 보너스 적용
      if (partnerBonus?.status === 'APPROVED') {
        const partnerResult = partnerBonusService.applyPartnerBonus('current-user', baseRate);
        if (partnerResult.success) {
          totalRate = partnerResult.totalRate || totalRate;
        }
      }

      const rewardPerSecond = totalRate / 3600;
      setAccumulatedReward(prev => prev + rewardPerSecond);
    } catch (error) {
      console.error('누적 보상 업데이트 오류:', error);
    }
  }, [attendanceBonus, referralBonusService, partnerBonus, partnerBonusService]);

  // 4. Effects
  useEffect(() => {
    try {
      // 언어 설정
      languageManager.setLanguage(currentLanguage);

      // 다크 모드 설정
      const savedTheme = localStorage.getItem('bw-theme');
      if (savedTheme === 'dark') {
        setIsDarkMode(true);
        document.body.classList.add('dark-mode');
      }

      loadWalletAddress();
      loadBonusStatus();
    } catch (error) {
      console.error('마이닝 페이지 초기화 오류:', error);
    }
  }, [currentLanguage, languageManager, loadWalletAddress, loadBonusStatus]);

  useEffect(() => {
    if (walletAddress) {
      loadMiningStatus();
    }
  }, [walletAddress, loadMiningStatus]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (miningStatus === MINING_STATUS.MINING) {
      interval = setInterval(() => {
        setMiningTime(prev => prev + 1);
        updateAccumulatedReward();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [miningStatus, updateAccumulatedReward]);

  // 5. Event Handlers
  const handleStartMining = async (): Promise<void> => {
    try {
      if (!walletAddress) {
        alert(getTranslation('mining.walletRequired'));
        return;
      }

      const result = await miningService.startMining(walletAddress);
      if (result.success) {
        setMiningStatus(MINING_STATUS.MINING);
        loadMiningStatus();
      } else {
        console.error(result.message);
      }
    } catch (error) {
      console.error('마이닝 시작 오류:', error);
    }
  };

  const handleStopMining = async (): Promise<void> => {
    try {
      if (!walletAddress) return;

      const result = await miningService.stopMining(walletAddress);
      if (result.success) {
        setMiningStatus(MINING_STATUS.STOPPED);
        loadMiningStatus();
      }
    } catch (error) {
      console.error('마이닝 정지 오류:', error);
    }
  };

  const handlePauseMining = async (): Promise<void> => {
    try {
      if (!walletAddress) return;

      await miningService.pauseMining(walletAddress);
      setMiningStatus(MINING_STATUS.PAUSED);
    } catch (error) {
      console.error('마이닝 일시정지 오류:', error);
    }
  };

  const handleResumeMining = async (): Promise<void> => {
    try {
      if (!walletAddress) return;

      await miningService.resumeMining(walletAddress);
      setMiningStatus(MINING_STATUS.MINING);
    } catch (error) {
      console.error('마이닝 재개 오류:', error);
    }
  };

  const handleAttendanceBonus = async (): Promise<void> => {
    try {
      const result = await attendanceBonusService.applyAttendanceBonus(walletAddress);
      if (result.success) {
        loadBonusStatus();
        loadMiningStatus();
      }
    } catch (error) {
      console.error('출석 보너스 설정 오류:', error);
    }
  };

  const handleReferralBonus = () => {
    console.log('추천 보너스 설정');
  };

  const handlePartnerBonus = () => {
    console.log('가맹점 보너스 설정');
  };

  const handleProfileSettings = () => {
    console.log('프로필 설정');
  };

  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language);
    languageManager.setLanguage(language);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('bw-theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('bw-theme', 'light');
    }
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

        {/* 보너스 설정 */}
        <section className="bonus-section">
          <div className="bonus-container">
            <h2 className="section-title">
              {getTranslation('mining.bonusSettings')}
            </h2>
            <div className="bonus-buttons">
              <button
                className={`bonus-button ${attendanceBonus === 'COMPLETED' ? 'active' : ''}`}
                onClick={handleAttendanceBonus}
                disabled={attendanceBonus === 'COMPLETED'}
              >
                <span className="bonus-icon">📅</span>
                <span className="bonus-label">{getTranslation('mining.attendanceBonus')}</span>
                <span className="bonus-status">
                  {attendanceBonus === 'COMPLETED' ? '✅' : ''}
                </span>
              </button>
              <button
                className="bonus-button"
                onClick={handleReferralBonus}
              >
                <span className="bonus-icon">👥</span>
                <span className="bonus-label">{getTranslation('mining.referralBonus')}</span>
              </button>
              <button
                className="bonus-button"
                onClick={handlePartnerBonus}
              >
                <span className="bonus-icon">🏢</span>
                <span className="bonus-label">{getTranslation('mining.partnerBonus')}</span>
              </button>
              <button
                className="bonus-button"
                onClick={handleProfileSettings}
              >
                <span className="bonus-icon">⚙️</span>
                <span className="bonus-label">{getTranslation('mining.profileSettings')}</span>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MiningPage;