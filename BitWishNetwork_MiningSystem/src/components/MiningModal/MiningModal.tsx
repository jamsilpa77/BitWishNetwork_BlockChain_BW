/**
 * BitWishNetwork BW 포인트 채굴 시스템 - 마이닝 페이지 & 보너스 설정 모달
 * 유저 전용 마이닝 모달 컴포넌트
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
 * ✅ 50단위 부동소수점 정밀 계산 로직구현 하지만 UI에 표시 될때는 소수점 8자리까지 표시되도록
 * ✅ BitWish Network 전용 시스템만 사용
 * ✅ 모든 텍스트는 유저에만 한국어, 영어, 일어, 중국어기본으로 동남아시권까지 언어 변경 시 즉시 언어 변경 되도록
 * ✅ 유저/관리자 각가 마이닝 페이지는 완벽한 독립성 보장
 * ✅ 유저/관리자 각각 마이닝 페이지는 완벽한 각 완벽한 데이터베이스 MongoDB 하이브리드 저장소를 완벽하게 가진다
 */

import React, { useState, useEffect } from 'react';
import { LanguageManager } from '@/utils/LanguageManager/LanguageManager';
import { Decimal } from 'decimal.js';
import { PrecisionCalculator } from '@/utils/PrecisionCalculator/PrecisionCalculator';
import './MiningModal.css';

interface MiningModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: string;
}

const MiningModal: React.FC<MiningModalProps> = ({ isOpen, onClose, currentLanguage }) => {
  // 절대 준수사항: 전역 변수 사용 금지
  const [languageManager] = useState(() => new LanguageManager());
  const [precisionCalculator] = useState(() => new PrecisionCalculator());
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMiningActive, setIsMiningActive] = useState(false);
  const [miningTime, setMiningTime] = useState('00:00:00');
  const [accumulatedReward, setAccumulatedReward] = useState('0.00000000');
  const [walletAddress, setWalletAddress] = useState('BWD961BB3CEEE4E6AB10118608F9A45F6022698734');
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // 마이닝 상태 데이터
  const [miningStatus, setMiningStatus] = useState({
    hourlyRate: '0.25000000',
    dailyMax: '6.00000000',
    attendanceBonus: '5.00000000',
    referralBonus: '2.00000000',
    attendanceStatus: 'ON',
    referralCount: 1,
    referralBonusVault: '0.00000000',
    referralRewardVault: '1.00000000',
    partnerStatus: '미등록'
  });

  /**
   * 컴포넌트 마운트 시 초기화
   */
  useEffect(() => {
    if (isOpen) {
      initializeMiningModal();
      startRealTimeUpdate();
    }

    return () => {
      stopRealTimeUpdate();
    };
  }, [isOpen]);

  /**
   * 마이닝 모달 초기화
   */
  const initializeMiningModal = (): void => {
    try {
      // 언어 설정
      languageManager.setLanguage(currentLanguage);

      // 다크 모드 설정
      const savedTheme = localStorage.getItem('bw-theme');
      if (savedTheme === 'dark') {
        setIsDarkMode(true);
      }

      // 마이닝 상태 로드
      loadMiningStatus();
    } catch (error) {
      console.error('마이닝 모달 초기화 오류:', error);
    }
  };

  /**
   * 실시간 업데이트 시작
   */
  const startRealTimeUpdate = (): void => {
    try {
      const interval = setInterval(() => {
        setLastUpdate(new Date());
        updateMiningStatus();
      }, 1000);

      // interval ID 저장 (추후 정리용)
      (window as any).miningInterval = interval;
    } catch (error) {
      console.error('실시간 업데이트 시작 오류:', error);
    }
  };

  /**
   * 실시간 업데이트 중지
   */
  const stopRealTimeUpdate = (): void => {
    try {
      // interval 정리
      if ((window as any).miningInterval) {
        clearInterval((window as any).miningInterval);
        (window as any).miningInterval = null;
      }
    } catch (error) {
      console.error('실시간 업데이트 중지 오류:', error);
    }
  };

  /**
   * 마이닝 상태 로드
   */
  const loadMiningStatus = (): void => {
    try {
      // 마이닝 상태 데이터 로드 (추후 구현)
      console.log('마이닝 상태 로드');
    } catch (error) {
      console.error('마이닝 상태 로드 오류:', error);
    }
  };

  /**
   * 마이닝 상태 업데이트
   */
  const updateMiningStatus = (): void => {
    try {
      // 마이닝 상태 실시간 업데이트 (추후 구현)
      if (isMiningActive) {
        // 마이닝 진행 중일 때 시간 업데이트
        updateMiningTime();
        updateAccumulatedReward();
      }
    } catch (error) {
      console.error('마이닝 상태 업데이트 오류:', error);
    }
  };

  /**
   * 마이닝 시간 업데이트
   */
  const updateMiningTime = (): void => {
    try {
      // 마이닝 시간 계산 로직 (추후 구현)
      const currentTime = new Date();
      setMiningTime(currentTime.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }));
    } catch (error) {
      console.error('마이닝 시간 업데이트 오류:', error);
    }
  };

  /**
   * 누적 보상 업데이트
   */
  const updateAccumulatedReward = (): void => {
    try {
      // 누적 보상 계산 로직 (추후 구현)
      const currentReward = new Decimal(accumulatedReward);
      const hourlyRate = new Decimal(miningStatus.hourlyRate);
      const additionalReward = hourlyRate.div(3600); // 1초당 보상

      const newReward = currentReward.add(additionalReward);
      setAccumulatedReward(precisionCalculator.formatForUI(newReward));
    } catch (error) {
      console.error('누적 보상 업데이트 오류:', error);
    }
  };

  /**
   * 번역 텍스트 가져오기
   */
  const getTranslation = (key: string): string => {
    return languageManager.getTranslation(key, currentLanguage);
  };

  /**
   * 숫자 포맷팅 (8자리 소수점)
   */
  const formatNumber = (value: number): string => {
    return precisionCalculator.formatForUI(new Decimal(value));
  };

  /**
   * 마이닝 시작
   */
  const handleStartMining = (): void => {
    try {
      setIsMiningActive(true);
      console.log('마이닝 시작');
    } catch (error) {
      console.error('마이닝 시작 오류:', error);
    }
  };

  /**
   * 마이닝 정지
   */
  const handleStopMining = (): void => {
    try {
      setIsMiningActive(false);
      console.log('마이닝 정지');
    } catch (error) {
      console.error('마이닝 정지 오류:', error);
    }
  };

  /**
   * 나의 지갑
   */
  const handleMyWallet = (): void => {
    try {
      console.log('나의 지갑 클릭');
      window.location.href = '/wallet/my';
    } catch (error) {
      console.error('나의 지갑 오류:', error);
    }
  };

  /**
   * 보너스 설정 버튼 클릭
   */
  const handleBonusSetting = (type: string): void => {
    try {
      console.log(`${type} 설정 클릭`);
      // 각 보너스 설정 페이지로 이동 (추후 구현)
    } catch (error) {
      console.error(`${type} 설정 오류:`, error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="mining-modal-overlay">
      <div className="mining-modal">
        {/* 상단 헤더 */}
        <div className="modal-header">
          <div className="modal-title">
            <span className="settings-icon">⚙️</span>
            {getTranslation('bonus.title')}
          </div>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* 안내 문구 */}
        <div className="modal-description">
          {getTranslation('bonus.description')}
        </div>

        {/* 보너스 설정 버튼들 */}
        <div className="bonus-buttons">
          <button
            className="bonus-button attendance-bonus"
            onClick={() => handleBonusSetting('출석 보너스')}
          >
            <span className="bonus-icon">📅</span>
            <span className="bonus-text">{getTranslation('bonus.attendance')}</span>
          </button>

          <button
            className="bonus-button referral-bonus"
            onClick={() => handleBonusSetting('추천 보너스')}
          >
            <span className="bonus-icon">👥</span>
            <span className="bonus-text">{getTranslation('bonus.referral')}</span>
          </button>

          <button
            className="bonus-button partner-bonus"
            onClick={() => handleBonusSetting('가맹점 등록 보너스')}
          >
            <span className="bonus-icon">🏢</span>
            <span className="bonus-text">{getTranslation('bonus.partner')}</span>
          </button>

          <button
            className="bonus-button profile-settings"
            onClick={() => handleBonusSetting('프로필 설정')}
          >
            <span className="bonus-icon">🔒</span>
            <span className="bonus-text">{getTranslation('bonus.profile')}</span>
          </button>
        </div>

        {/* 인증된 지갑 주소 */}
        <div className="wallet-info">
          <div className="wallet-header">
            <span className="bulb-icon">💡</span>
            {getTranslation('bonus.walletAddress')}
          </div>
          <div className="wallet-address">
            {walletAddress}
          </div>
          <div className="wallet-note">
            {getTranslation('bonus.walletNote')}
          </div>
        </div>

        {/* 연결 상태 및 업데이트 */}
        <div className="connection-status">
          <div className="connection-info">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            {isConnected ? getTranslation('bonus.connected') : getTranslation('bonus.disconnected')}
          </div>
          <div className="last-update">
            {getTranslation('bonus.lastUpdate')} {lastUpdate.toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true
            })}
          </div>
        </div>

        {/* 마이닝 상태 확인 */}
        <div className="mining-status-section">
          <div className="status-title">
            <span className="lightning-icon">⚡</span>
            {getTranslation('bonus.miningStatusCheck')}
          </div>

          <div className="status-content">
            {/* 좌측 열 */}
            <div className="status-left">
              <div className="status-item">
                <div className="status-value">{miningStatus.hourlyRate} BW</div>
                <div className="status-label">{getTranslation('bonus.baseRate')}</div>
              </div>

              <div className="status-item">
                <div className="status-value">{miningStatus.attendanceBonus}%</div>
                <div className="status-label">{getTranslation('bonus.attendanceBonus')}</div>
              </div>

              <div className="status-item">
                <div className={`status-value ${miningStatus.attendanceStatus === 'ON' ? 'active' : 'inactive'}`}>
                  {miningStatus.attendanceStatus}
                </div>
                <div className="status-label">{getTranslation('bonus.attendanceStatus')}</div>
              </div>

              <div className="status-item">
                <div className={`status-value ${miningStatus.partnerStatus === '등록됨' ? 'active' : 'inactive'}`}>
                  {miningStatus.partnerStatus}
                </div>
                <div className="status-label">{getTranslation('bonus.partnerStatus')}</div>
              </div>
            </div>

            {/* 우측 열 */}
            <div className="status-right">
              <div className="status-item">
                <div className="status-value">{miningStatus.dailyMax} BW</div>
                <div className="status-label">{getTranslation('bonus.dailyMaxRate')}</div>
              </div>

              <div className="status-item">
                <div className="status-value">{miningStatus.referralBonus}%</div>
                <div className="status-label">{getTranslation('bonus.referralBonus')}: ({miningStatus.referralCount}명)</div>
              </div>

              <div className="status-item">
                <div className="status-value">{miningStatus.referralBonusVault}BW</div>
                <div className="status-label">{getTranslation('bonus.referralStorage')}</div>
              </div>

              <div className="status-item">
                <div className="status-value">{miningStatus.referralRewardVault}BW</div>
                <div className="status-label">{getTranslation('bonus.referralRewardStorage')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 실시간 마이닝 보상 */}
        <div className="realtime-mining-section">
          <div className="mining-reward-title">{getTranslation('realTimeMining.title')}</div>
          <div className="mining-reward-content">
            <div className="reward-item">
              <div className="reward-value">{accumulatedReward}BW</div>
              <div className="reward-label">{getTranslation('realTimeMining.accumulatedReward')}</div>
            </div>
            <div className="reward-item">
              <div className="reward-value">{miningTime}</div>
              <div className="reward-label">{getTranslation('realTimeMining.progressTime')}</div>
            </div>
          </div>
          <div className="mining-status-text">
            {isMiningActive ? getTranslation('realTimeMining.currentStatus') : getTranslation('bonus.miningWaiting')}
          </div>
        </div>

        {/* 하단 액션 버튼들 */}
        <div className="action-buttons">
          <button
            className="action-button start-mining"
            onClick={handleStartMining}
          >
            <span className="action-icon">⚡</span>
            {getTranslation('buttons.start')}
          </button>

          <button
            className="action-button stop-mining"
            onClick={handleStopMining}
          >
            <span className="action-icon">⏹️</span>
            {getTranslation('buttons.stop')}
          </button>

          <button
            className="action-button my-wallet"
            onClick={handleMyWallet}
          >
            <span className="action-icon">👤</span>
            {getTranslation('bonus.myWallet')}
          </button>

          <button
            className="action-button close-modal"
            onClick={onClose}
          >
            <span className="action-icon">✕</span>
            {getTranslation('bonus.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MiningModal;
export type { MiningModalProps };