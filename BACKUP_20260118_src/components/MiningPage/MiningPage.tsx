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
      // 서비스가 초기화되면서 localStorage 데이터를 이미 로드했으므로 바로 조회 가능
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
      if (referralResult.success && referralResult.bonusRate) {
        totalRate += baseRate * referralResult.bonusRate; // bonusRate를 사용하여 계산
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

  // [최종 수정] 1초마다 직접 확인하는 폴링(Polling) 방식 적용
  useEffect(() => {
    const checkResetSignal = () => {
      try {
        const triggerRaw = localStorage.getItem('BW_SYSTEM_RESET_TRIGGER');
        if (!triggerRaw) return;

        const signal = JSON.parse(triggerRaw);

        // [수정] 대소문자/공백 무시하고 정확히 비교 (일치 오류 해결)
        const normalize = (val: string) => val ? val.trim().toLowerCase() : '';
        const normTarget = normalize(signal.target);
        const normWallet = normalize(walletAddress);

        if (normTarget !== normWallet) return;

        const lastProcessedKey = `BW_RESET_PROCESSED_${normWallet}`;
        const lastProcessed = parseInt(localStorage.getItem(lastProcessedKey) || '0');
        if (signal.timestamp <= lastProcessed) return;

        console.log('[MiningPage] 폴링 감지: 초기화 신호 확인됨');

        localStorage.setItem(`BW_RESET_PROCESSED_${walletAddress}`, signal.timestamp.toString());

        setMiningStatus(MINING_STATUS.STOPPED);
        setMiningTime(0);
        setAccumulatedReward(0);
        setAttendanceBonus(null);
        setReferralBonus(null);
        setPartnerBonus(null);

        miningService.stopMining(walletAddress).catch(e => console.error(e));

        alert('관리자에 의해 마이닝 데이터가 초기화되었습니다.');

      } catch (e) {
        console.error('초기화 폴링 오류:', e);
      }
    };

    const intervalId = setInterval(checkResetSignal, 1000);
    checkResetSignal();

    return () => clearInterval(intervalId);
  }, [walletAddress, miningService]);

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
            </select>
            <button className="theme-toggle" onClick={toggleDarkMode}>
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button className="profile-button" onClick={handleProfileSettings}>
              👤
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="mining-content">
        {/* 마이닝 상태 카드 */}
        <div className="mining-status-card">
          <div className="status-header">
            <h2>{getTranslation('mining.miningStatus')}</h2>
            <span className={`status-badge ${miningStatus.toLowerCase()}`}>
              {miningStatus}
            </span>
          </div>

          <div className="mining-timer">
            <span className="timer-label">{getTranslation('mining.miningTime')}</span>
            <span className="timer-value">{formatTime(miningTime)}</span>
          </div>

          <div className="mining-reward">
            <span className="reward-label">{getTranslation('mining.accumulatedReward')}</span>
            <div className="reward-value-container">
              <span className="reward-value">{formatNumber(accumulatedReward)}</span>
              <span className="reward-unit">BW</span>
            </div>
          </div>

          <div className="mining-controls">
            {miningStatus === MINING_STATUS.STOPPED && (
              <button className="control-button start" onClick={handleStartMining}>
                {getTranslation('mining.startMining')}
              </button>
            )}
            {miningStatus === MINING_STATUS.MINING && (
              <>
                <button className="control-button pause" onClick={handlePauseMining}>
                  {getTranslation('mining.pauseMining')}
                </button>
                <button className="control-button stop" onClick={handleStopMining}>
                  {getTranslation('mining.stopMining')}
                </button>
              </>
            )}
            {miningStatus === MINING_STATUS.PAUSED && (
              <>
                <button className="control-button resume" onClick={handleResumeMining}>
                  {getTranslation('mining.resumeMining')}
                </button>
                <button className="control-button stop" onClick={handleStopMining}>
                  {getTranslation('mining.stopMining')}
                </button>
              </>
            )}
          </div>
        </div>

        {/* 보너스 카드 그리드 */}
        <div className="bonus-grid">
          {/* 출석 보너스 */}
          <div className="bonus-card attendance">
            <div className="bonus-icon">📅</div>
            <h3>{getTranslation('bonus.attendance.title')}</h3>
            <p className="bonus-desc">{getTranslation('bonus.attendance.desc')}</p>
            <div className="bonus-status">
              {attendanceBonus === 'COMPLETED' ? (
                <span className="status-completed">✅ {getTranslation('common.completed')}</span>
              ) : (
                <button className="bonus-action-button" onClick={handleAttendanceBonus}>
                  {getTranslation('bonus.attendance.action')}
                </button>
              )}
            </div>
          </div>

          {/* 추천 보너스 */}
          <div className="bonus-card referral">
            <div className="bonus-icon">👥</div>
            <h3>{getTranslation('bonus.referral.title')}</h3>
            <p className="bonus-desc">{getTranslation('bonus.referral.desc')}</p>
            <div className="bonus-info">
              <div className="info-row">
                <span>{getTranslation('bonus.referral.count')}:</span>
                <span>{referralBonus?.referredUsers?.length || 0}명</span>
              </div>
              <div className="info-row">
                <span>{getTranslation('bonus.referral.rate')}:</span>
                <span>{((referralBonus?.bonusRate || 0) * 100).toFixed(1)}%</span>
              </div>
            </div>
            <button className="bonus-action-button" onClick={handleReferralBonus}>
              {getTranslation('bonus.referral.action')}
            </button>
          </div>

          {/* 가맹점 보너스 */}
          <div className="bonus-card partner">
            <div className="bonus-icon">🏪</div>
            <h3>{getTranslation('bonus.partner.title')}</h3>
            <p className="bonus-desc">{getTranslation('bonus.partner.desc')}</p>
            <div className="bonus-status">
              {partnerBonus?.status === 'APPROVED' ? (
                <span className="status-active">✨ {getTranslation('bonus.partner.active')} (125%)</span>
              ) : (
                <button className="bonus-action-button" onClick={handlePartnerBonus}>
                  {getTranslation('bonus.partner.action')}
                </button>
              )}
            </div>
          </div>

          {/* 보안 설정 */}
          <div className="bonus-card security">
            <div className="bonus-icon">🔒</div>
            <h3>{getTranslation('security.title')}</h3>
            <p className="bonus-desc">{getTranslation('security.desc')}</p>
            <button className="bonus-action-button" onClick={handleProfileSettings}>
              {getTranslation('security.action')}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MiningPage;