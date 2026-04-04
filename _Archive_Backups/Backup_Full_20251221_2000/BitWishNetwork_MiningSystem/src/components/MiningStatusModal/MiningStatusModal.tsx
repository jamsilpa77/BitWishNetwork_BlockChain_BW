import React, { useState, useEffect } from 'react';
import { LanguageManager } from '@/utils/LanguageManager/LanguageManager';
import { Decimal } from 'decimal.js';
import { PrecisionCalculator } from '@/utils/PrecisionCalculator/PrecisionCalculator';
import { RealTimeSyncService } from '@/services/MiningService/RealTimeSyncService';
import { apiService } from '@/services/ApiService';
import { ReferralBonusService } from '@/services/BonusService/ReferralBonusService';
import {
    NetworkStatus,
    RealTimeMiningStatus
} from '@/types';
import './MiningStatusModal.css';
import AttendanceModal from '../AttendanceModal/AttendanceModal';

interface MiningStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentLanguage: string;
    onOpenReferralModal?: () => void;
    walletAddress: string;
}

interface UserMiningStats {
    baseRate: Decimal;
    dailyMaxRate: Decimal;
    attendanceBonusRate: Decimal;
    referralBonusRate: Decimal;
    referralCount: number;
    isAttendanceActive: boolean;
    referralBonusStorage: Decimal;
    lockedBonusStorage: Decimal;
    availableBonusStorage: Decimal;
    partnerStatus: string;
    referralRewardStorage: Decimal;
    lockedRewardStorage: Decimal;
    availableRewardStorage: Decimal;
}

const MiningStatusModal: React.FC<MiningStatusModalProps> = ({ isOpen, onClose, currentLanguage, onOpenReferralModal, walletAddress }) => {
    const [languageManager] = useState(() => new LanguageManager());
    const [precisionCalculator] = useState(() => new PrecisionCalculator());
    const [realTimeSyncService] = useState(() => new RealTimeSyncService());
    const [referralBonusService] = useState(() => new ReferralBonusService());

    const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('CONNECTED');
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [isMining, setIsMining] = useState<boolean>(false);
    const [miningTime, setMiningTime] = useState<number>(0);
    const [accumulatedReward, setAccumulatedReward] = useState<Decimal>(new Decimal(0));
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState<boolean>(false);

    const [userStats, setUserStats] = useState<UserMiningStats>({
        baseRate: new Decimal(0.25),
        dailyMaxRate: new Decimal(6.0),
        attendanceBonusRate: new Decimal(0.0),
        referralBonusRate: new Decimal(0.0),
        referralCount: 0,
        isAttendanceActive: false,
        referralBonusStorage: new Decimal(0),
        lockedBonusStorage: new Decimal(0),
        availableBonusStorage: new Decimal(0),
        partnerStatus: 'NOT_REGISTERED',
        referralRewardStorage: new Decimal(0),
        lockedRewardStorage: new Decimal(0),
        availableRewardStorage: new Decimal(0)
    });

    // 초기 데이터 로드, 복구 및 동기화
    useEffect(() => {
        if (!isOpen || !walletAddress) {
            return;
        }

        const initializeData = async () => {
            try {
                // 1. 서비스 초기화
                await realTimeSyncService.initialize(walletAddress);
                const status = realTimeSyncService.getCurrentStatus();
                if (status.currentIssued > 0) {
                    setAccumulatedReward(new Decimal(status.currentIssued));
                }

                // 2. 지갑 데이터(추천인 수 등) 조회
                const userData = await apiService.getUserStatus(walletAddress);

                if (userData) {
                    const realReferralCount = userData.miningState?.referralCount || 0;

                    // 3. [정화 완료] 서비스 내부 데이터 갱신 및 락업 해제 자동 처리
                    // 서비스 생성 시 이미 복구가 완료되었으므로, 여기서는 상태 갱신만 수행
                    referralBonusService.refreshLockStatus(walletAddress);
                    let referralStats = referralBonusService.getReferralStats(walletAddress);
                    console.log('[MiningStatusModal] 영구 보존 데이터 로드 및 락업 상태 갱신 완료');

                    // 4. 상태 업데이트 (화면 표시)
                    // 추천 보너스 비율 계산 (1명당 2%)
                    const referralBonusRateVal = new Decimal(referralStats.referredUsers.length).mul(2.0);

                    // 출석 상태
                    // [강제 보정] 서버가 ON(true)이라고 해도, 로컬(내 컴퓨터)에 오늘 도장이 없으면 OFF(false)로 끈다.
                    // 이유: 서버 초기화가 꼬여서 좀비 데이터가 남았을 때를 대비함.
                    let isAttendanceActive = userData.miningState?.isAttendanceActive || false;

                    try {
                        const today = new Date();
                        // 한국 시간 기준 YYYY-MM-DD 형식을 맞추기 위한 안전한 로직
                        const offset = today.getTimezoneOffset() * 60000;
                        const localISOTime = new Date(today.getTime() - offset).toISOString().split('T')[0];

                        const savedRecords = localStorage.getItem('bw-attendance-records');
                        let hasTodayRecord = false;

                        if (savedRecords) {
                            const records = JSON.parse(savedRecords);
                            // 날짜 문자열 비교 (AttendanceBonusService와 동일한 기준)
                            hasTodayRecord = records.some((r: any) => r.date === localISOTime && (r.status === 'COMPLETED' || r.isCompleted));
                        }

                        if (isAttendanceActive && !hasTodayRecord) {
                            console.warn('[MiningStatusModal] 서버는 ON이지만 로컬 기록이 없어 OFF로 강제 보정합니다.');
                            isAttendanceActive = false; // 강제 OFF
                        } else if (!isAttendanceActive && hasTodayRecord) {
                            // 반대의 경우(서버 OFF, 로컬 ON)는 로컬을 믿어줌
                            isAttendanceActive = true;
                        }
                    } catch (e) {
                        console.error('출석 상태 검증 중 오류:', e);
                    }

                    const attendanceBonusRateVal = isAttendanceActive ? new Decimal(5.0) : new Decimal(0.0);

                    // 기본 보상률 계산 (기본 0.25 + 출석 5% + 추천 6% 등)
                    // 수식: 기본 * (1 + 출석% + 추천%)
                    const baseRateOrigin = new Decimal(0.25);
                    const dailyMaxOrigin = new Decimal(6.0);

                    const totalBonusPercent = attendanceBonusRateVal.plus(referralBonusRateVal); // 예: 5 + 6 = 11
                    const multiplier = new Decimal(1).plus(totalBonusPercent.div(100)); // 1.11

                    const finalBaseRate = baseRateOrigin.mul(multiplier);
                    const finalDailyMaxRate = dailyMaxOrigin.mul(multiplier);

                    setUserStats({
                        baseRate: finalBaseRate,
                        dailyMaxRate: finalDailyMaxRate,
                        referralCount: referralStats.referredUsers.length,
                        referralBonusRate: referralBonusRateVal,
                        isAttendanceActive: isAttendanceActive,
                        attendanceBonusRate: attendanceBonusRateVal,
                        referralBonusStorage: new Decimal(referralStats.bonusStorage || 0),
                        lockedBonusStorage: new Decimal(referralStats.lockedBonusStorage || 0),
                        availableBonusStorage: new Decimal(referralStats.availableBonusStorage || 0),
                        referralRewardStorage: new Decimal(referralStats.rewardStorage || 0),
                        lockedRewardStorage: new Decimal(referralStats.lockedRewardStorage || 0),
                        availableRewardStorage: new Decimal(referralStats.availableRewardStorage || 0),
                        partnerStatus: 'NOT_REGISTERED'
                    });

                    // 마이닝 상태 반영 (서버 vs 로컬 우선순위 결정)
                    // [핵심] 로컬에 '중지'라고 되어있으면 서버의 '진행 중' 데이터는 오염된 것이므로 무시합니다.
                    let trustLocal = false;
                    try {
                        const localState = localStorage.getItem('bw-mining-state');
                        if (localState) {
                            const parsed = JSON.parse(localState);
                            // 로컬에 '채굴 중지'라고 명확히 적혀있으면 서버 데이터 무시
                            if (parsed.isMining === false) trustLocal = true;
                        }
                    } catch (e) { }

                    if (trustLocal) {
                        // 로컬 우선: 강제로 정지 상태 및 0 표시
                        setIsMining(false);
                        setMiningTime(0);
                        setAccumulatedReward(new Decimal(0));
                        console.log('[MiningStatusModal] 로컬 상태(중지)를 서버 데이터보다 우선시합니다.');
                    }
                    else if (userData.miningState) {
                        // 기존 로직: 서버 데이터 신뢰
                        setIsMining(userData.miningState.isMining);
                        if (userData.miningState.isMining && userData.miningState.miningStartTime) {
                            const startTime = new Date(userData.miningState.miningStartTime).getTime();
                            const diffSeconds = Math.floor((Date.now() - startTime) / 1000);
                            setMiningTime(diffSeconds > 0 ? diffSeconds : 0);
                        }
                        setAccumulatedReward(new Decimal(userData.miningState.accumulatedReward || 0));
                    }
                }
            } catch (error) {
                console.error('Data initialization failed:', error);
            }
        };

        initializeData();

        realTimeSyncService.startSync((status: RealTimeMiningStatus) => {
            setLastUpdate(new Date());
            setNetworkStatus(status.networkStatus);
            setAccumulatedReward(new Decimal(status.currentIssued));
        });

        return () => {
            realTimeSyncService.stopSync();
        };
    }, [isOpen, walletAddress, realTimeSyncService, referralBonusService]);

    // [핵심] 관리자 초기화 신호 감시 및 UI 강제 동기화 (1초 폴링)
    useEffect(() => {
        if (!isOpen) return;
        const checkResetSignal = () => {
            try {
                const triggerRaw = localStorage.getItem('BW_SYSTEM_RESET_TRIGGER');
                if (triggerRaw) {
                    const signal = JSON.parse(triggerRaw);
                    const normTarget = signal.target ? signal.target.trim().toLowerCase() : '';
                    const normWallet = walletAddress ? walletAddress.trim().toLowerCase() : '';

                    if (normTarget && normTarget === normWallet) {
                        const lastProcessedKey = `BW_MODAL_RESET_PROCESSED_${normWallet}`;
                        const lastProcessed = parseInt(localStorage.getItem(lastProcessedKey) || '0');

                        if (signal.timestamp > lastProcessed) {
                            console.log('[MiningStatusModal] 초기화 신호 감지 -> 서버 동기화 중단 및 강제 리셋 실행');

                            // 0. [핵심] 즉시 서버 동기화 중단 (MongoDB 재오염 방지)
                            // 메모리에 남은 옛날 데이터가 서버로 전송되는 것을 막습니다.
                            realTimeSyncService.stopSync();

                            // 1. [핵심] 복구의 원천인 localStorage 데이터 강제 파괴 (좀비 복구 방지)
                            localStorage.setItem('bw-mining-state', JSON.stringify({ isMining: false, startTime: null }));
                            localStorage.setItem('bw-accumulated-reward', '0');
                            localStorage.removeItem('bw-mining-start-time'); // 혹시 모를 구버전 키 삭제

                            // 2. 채굴 상태 및 시간 UI 리셋
                            setIsMining(false);
                            setMiningTime(0);
                            setAccumulatedReward(new Decimal(0));

                            // 3. 모달 화면의 텍스트(출석/추천) 강제 초기화
                            setUserStats(prev => ({
                                ...prev,
                                // 출석 보너스 화면 초기화 (0% / OFF)
                                attendanceBonusRate: new Decimal(0),
                                isAttendanceChecked: false,

                                // 추천 보너스 보관함 초기화 (단, 족보인 referralCount는 유지)
                                referralBonusStorage: new Decimal(0),
                                referralRewardStorage: new Decimal(0)
                            }));

                            // [강제 삭제] 화면만 0으로 하는 게 아니라 실제 데이터(localStorage)도 즉시 날려버림
                            // 폴링이 늦거나 안 돌 수도 있으므로 여기서 직접 처형함.
                            if (walletAddress) {
                                referralBonusService.resetReferralBonus(walletAddress);
                            }
                            // 'current-user' 찌꺼기도 반드시 삭제
                            referralBonusService.resetReferralBonus('current-user');
                            console.log('[MiningStatusModal] 추천 보너스 데이터 강제 소각 완료');

                            // 4. 처리 완료 마킹
                            localStorage.setItem(lastProcessedKey, signal.timestamp.toString());

                            alert('관리자에 의해 마이닝 데이터가 초기화되었습니다.');
                        }
                    }
                }
            } catch (e) { }
        };
        const intervalId = setInterval(checkResetSignal, 1000);
        return () => clearInterval(intervalId);
    }, [isOpen, walletAddress]);

    // 로컬 타이머 및 실시간 보너스 저장
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isMining) {
            interval = setInterval(() => {
                setMiningTime(prev => prev + 1);

                setAccumulatedReward(prev => prev.plus(userStats.baseRate.div(3600)));

                const referralCount = userStats.referralCount;
                if (referralCount > 0) {
                    const hourlyReferralBonus = new Decimal(0.25).mul(0.02).mul(referralCount);
                    const bonusPerSecond = hourlyReferralBonus.div(3600);

                    if (miningTime > 0 && miningTime % 10 === 0) {
                        const bonus10Seconds = bonusPerSecond.mul(10);
                        const result = referralBonusService.applyReferralBonus(
                            walletAddress,
                            bonus10Seconds.toNumber()
                        );

                        if (result.success) {
                            setUserStats(prev => ({
                                ...prev,
                                referralBonusStorage: prev.referralBonusStorage.plus(bonus10Seconds)
                            }));
                        }
                    }
                }
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isMining, userStats.baseRate, userStats.referralCount, miningTime, referralBonusService, walletAddress]);

    const getTranslation = (key: string): string => {
        return languageManager.getTranslation(key, currentLanguage);
    };

    const formatNumber = (value: Decimal | number): string => {
        return precisionCalculator.formatForUI(new Decimal(value));
    };

    const formatTime = (seconds: number): string => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleStartMining = async () => {
        try {
            const result = await apiService.startMining(walletAddress);
            if (result && result.success) {
                setIsMining(true);
                setMiningTime(0);
            }
        } catch (error) {
            console.error('Start mining failed:', error);
            alert('Failed to start mining. Please try again.');
        }
    };


    const handleOpenAttendance = () => {
        setIsAttendanceModalOpen(true);
    };

    const handleCheckInSuccess = (bonusRate: number) => {
        // 출석 체크 성공 시 즉시 반영
        const base = new Decimal(0.25);
        const dailyMax = new Decimal(6.0);

        // 기존 추천 보너스 비율 유지
        const currentReferralRate = userStats.referralBonusRate.div(100); // 0.06
        const newAttendanceRate = new Decimal(bonusRate); // 0.05

        const totalMultiplier = new Decimal(1).plus(currentReferralRate).plus(newAttendanceRate);

        setUserStats(prev => ({
            ...prev,
            baseRate: base.mul(totalMultiplier),
            dailyMaxRate: dailyMax.mul(totalMultiplier),
            attendanceBonusRate: new Decimal(bonusRate * 100),
            isAttendanceActive: true
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="mining-status-modal-overlay">
            <div className="mining-status-modal">
                <div className="modal-header">
                    <div className="header-title-group">
                        <span className="gear-icon">⚙️</span>
                        <h2 className="modal-title">{getTranslation('bonus.title')}</h2>
                    </div>
                    <button className="close-icon-button" onClick={onClose}>×</button>
                </div>

                <div className="modal-description-text">
                    {getTranslation('bonus.description')}
                </div>

                <div className="top-buttons-grid">
                    <button className="grid-button attendance" onClick={handleOpenAttendance}>
                        <span className="button-icon">🗓️</span>
                        <span className="button-text">{getTranslation('bonus.attendance')}</span>
                    </button>
                    <button
                        className="grid-button referral"
                        onClick={() => {
                            if (onOpenReferralModal) {
                                onOpenReferralModal();
                            }
                        }}
                    >
                        <span className="button-icon">👥</span>
                        <span className="button-text">{getTranslation('bonus.referral')}</span>
                    </button>
                    <button className="grid-button partner">
                        <span className="button-icon">🏢</span>
                        <span className="button-text">{getTranslation('bonus.partner')}</span>
                    </button>
                    <button className="grid-button profile">
                        <span className="button-icon">🔒</span>
                        <span className="button-text">{getTranslation('bonus.profile')}</span>
                    </button>
                </div>

                <div className="wallet-address-box">
                    <div className="wallet-box-header">
                        <span className="bulb-icon">💡</span>
                        <span className="wallet-label">{getTranslation('bonus.walletAddress')}</span>
                    </div>
                    <div className="wallet-address-value">
                        {walletAddress || 'Not Connected'}
                    </div>
                    <div className="wallet-note">
                        {getTranslation('bonus.walletNote')}
                    </div>
                </div>

                <div className="status-bar">
                    <div className="connection-indicator">
                        <span className={`status-dot ${networkStatus === 'CONNECTED' ? 'green' : 'red'}`}></span>
                        <span className={`status-dot ${networkStatus === 'CONNECTED' ? 'green-light' : 'red-light'}`}></span>
                        <span className="connection-text">{getTranslation('mining.connected')}</span>
                    </div>
                    <div className="last-update-time">
                        {getTranslation('mining.lastUpdate')}: {lastUpdate.toLocaleTimeString()}
                    </div>
                </div>

                <div className="mining-status-check-box">
                    <div className="box-title">
                        <span className="lightning-icon">⚡</span>
                        <span>{getTranslation('bonus.miningStatusCheck')}</span>
                    </div>

                    <div className="status-columns-container">
                        {/* 왼쪽 컬럼 */}
                        <div className="status-column left">
                            <div className="status-item">
                                <div className="status-value-large purple">{userStats.baseRate.toFixed(8)} BW</div>
                                <div className="status-label">{getTranslation('bonus.baseRate')}</div>
                            </div>
                            <div className="status-item">
                                <div className="status-value-medium purple">{userStats.attendanceBonusRate.toFixed(8)}%</div>
                                <div className="status-label">{getTranslation('bonus.attendanceBonus')}</div>
                            </div>
                            <div className="status-item">
                                <div className="status-value-medium red">{userStats.isAttendanceActive ? 'ON' : 'OFF'}</div>
                                <div className="status-label">{getTranslation('bonus.attendanceStatus')}</div>
                            </div>
                            <div className="status-item">
                                <div className="status-value-medium red">
                                    {userStats.partnerStatus === 'NOT_REGISTERED' ? '미등록' : getTranslation('bonus.registered')}
                                </div>
                                <div className="status-label">{getTranslation('bonus.partnerStatus')}</div>
                            </div>
                        </div>

                        {/* 오른쪽 컬럼 */}
                        <div className="status-column right">
                            <div className="status-item">
                                <div className="status-value-large purple">{userStats.dailyMaxRate.toFixed(8)} BW</div>
                                <div className="status-label">{getTranslation('bonus.dailyMaxRate')}</div>
                            </div>
                            <div className="status-item">
                                <div className="status-value-medium purple">{formatNumber(userStats.referralBonusRate)}%</div>
                                <div className="status-label">{getTranslation('bonus.referralBonus')}: ({userStats.referralCount}명)</div>
                            </div>
                            <div className="status-item">
                                <div className="status-value-medium purple display-flex-center">
                                    <span className="value-hover" data-full={userStats.availableBonusStorage.toFixed(8)}>
                                        {userStats.availableBonusStorage.toFixed(4)}
                                    </span>
                                    <span className="unit-sep">/</span>
                                    <span className="value-hover locked" data-full={userStats.lockedBonusStorage.toFixed(8)}>
                                        {userStats.lockedBonusStorage.toFixed(4)}
                                    </span>
                                </div>
                                <div className="status-label">{getTranslation('bonus.referralStorage')} (가용/잠금)</div>
                            </div>
                            <div className="status-item">
                                <div className="status-value-medium purple display-flex-center">
                                    <span className="value-hover" data-full={userStats.availableRewardStorage.toFixed(8)}>
                                        {userStats.availableRewardStorage.toFixed(4)}
                                    </span>
                                    <span className="unit-sep">/</span>
                                    <span className="value-hover locked" data-full={userStats.lockedRewardStorage.toFixed(8)}>
                                        {userStats.lockedRewardStorage.toFixed(4)}
                                    </span>
                                </div>
                                <div className="status-label">{getTranslation('bonus.referralRewardStorage')} (가용/잠금)</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="realtime-reward-box">
                    <div className="box-title green-text">
                        {getTranslation('realTimeMining.title')}
                    </div>

                    <div className="reward-grid">
                        <div className="reward-item">
                            <div className="reward-value green">{formatNumber(accumulatedReward)}BW</div>
                            <div className="reward-label">{getTranslation('realTimeMining.accumulatedReward')}</div>
                        </div>
                        <div className="reward-item">
                            <div className="reward-value green">{formatTime(miningTime)}</div>
                            <div className="reward-label">{getTranslation('realTimeMining.progressTime')}</div>
                        </div>
                    </div>

                    <div className="mining-active-text">
                        {isMining ? getTranslation('realTimeMining.currentStatus') : getTranslation('bonus.miningWaiting')}
                    </div>
                </div>

                <div className="footer-buttons">
                    <button
                        className={`footer-btn start ${isMining ? 'disabled' : ''}`}
                        onClick={handleStartMining}
                        disabled={isMining}
                    >
                        <span className="button-icon">⚡</span>
                        {getTranslation('buttons.start')}
                    </button>
                    <button className="footer-btn wallet">
                        <span className="button-icon">🔑</span>
                        {getTranslation('buttons.myWallet')}
                    </button>
                    <button className="footer-btn close" onClick={onClose}>
                        <span className="button-icon">❌</span>
                        {getTranslation('buttons.close')}
                    </button>
                </div>
            </div>

            {
                isAttendanceModalOpen && (
                    <AttendanceModal
                        isOpen={isAttendanceModalOpen}
                        onClose={() => setIsAttendanceModalOpen(false)}
                        onCheckIn={handleCheckInSuccess}
                        currentLanguage={currentLanguage}
                        walletAddress={walletAddress}
                    />
                )
            }
        </div >
    );
};

export default MiningStatusModal;
