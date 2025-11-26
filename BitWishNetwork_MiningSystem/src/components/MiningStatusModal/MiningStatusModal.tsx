import React, { useState, useEffect } from 'react';
import { LanguageManager } from '@/utils/LanguageManager/LanguageManager';
import { Decimal } from 'decimal.js';
import { PrecisionCalculator } from '@/utils/PrecisionCalculator/PrecisionCalculator';
import { RealTimeSyncService } from '@/services/MiningService/RealTimeSyncService';
import { apiService } from '@/services/ApiService';
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
    partnerStatus: string;
    referralRewardStorage: Decimal;
}

const MiningStatusModal: React.FC<MiningStatusModalProps> = ({ isOpen, onClose, currentLanguage, onOpenReferralModal, walletAddress }) => {
    const [languageManager] = useState(() => new LanguageManager());
    const [precisionCalculator] = useState(() => new PrecisionCalculator());
    const [realTimeSyncService] = useState(() => new RealTimeSyncService());

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
        partnerStatus: 'NOT_REGISTERED',
        referralRewardStorage: new Decimal(0)
    });

    // 초기 데이터 로드 및 동기화 시작
    useEffect(() => {
        if (!isOpen || !walletAddress) {
            return;
        }

        // 1. 서비스 초기화 (서버 상태 로드)
        realTimeSyncService.initialize(walletAddress).then(() => {
            // 초기 상태 반영
            const status = realTimeSyncService.getCurrentStatus();
            if (status.currentIssued > 0) {
                setAccumulatedReward(new Decimal(status.currentIssued));
            }
        });

        // 2. 실시간 동기화 시작 (30초 주기)
        realTimeSyncService.startSync((status: RealTimeMiningStatus) => {
            setLastUpdate(new Date());
            setNetworkStatus(status.networkStatus);
            // 서버에서 동기화된 최신 채굴량 반영
            setAccumulatedReward(new Decimal(status.currentIssued));
        });

        // 3. 서버에서 최신 채굴 상태 및 사용자 정보 조회
        console.log('[DEBUG] Calling getUserStatus with walletAddress:', walletAddress);
        apiService.getUserStatus(walletAddress).then((data) => {
            console.log('[DEBUG] getUserStatus response:', data);
            if (data) {
                // 마이닝 상태 업데이트
                if (data.miningState) {
                    setIsMining(data.miningState.isMining);
                    if (data.miningState.isMining && data.miningState.miningStartTime) {
                        const startTime = new Date(data.miningState.miningStartTime).getTime();
                        const now = Date.now();
                        const diffSeconds = Math.floor((now - startTime) / 1000);
                        setMiningTime(diffSeconds > 0 ? diffSeconds : 0);
                    }
                    setAccumulatedReward(new Decimal(data.miningState.accumulatedReward || 0));
                }

                // 추천인 및 보너스 정보 업데이트
                const referralCount = data.miningState?.referralCount || 0;
                const referralBonusRate = new Decimal(referralCount).mul(2.0);

                // 출석 보너스 상태 업데이트
                const isAttendanceActive = data.miningState?.isAttendanceActive || false;
                const attendanceBonusRate = isAttendanceActive ? new Decimal(5.0) : new Decimal(0.0);

                // 출석 보너스가 활성화되어 있으면 baseRate와 dailyMaxRate 재계산
                const baseRateValue = new Decimal(0.25);
                const dailyMaxRateValue = new Decimal(6.0);

                const finalBaseRate = isAttendanceActive
                    ? baseRateValue.mul(new Decimal(1.05))
                    : baseRateValue;

                const finalDailyMaxRate = isAttendanceActive
                    ? dailyMaxRateValue.mul(new Decimal(1.05))
                    : dailyMaxRateValue;

                setUserStats(prev => ({
                    ...prev,
                    baseRate: finalBaseRate,
                    dailyMaxRate: finalDailyMaxRate,
                    referralCount: referralCount,
                    referralBonusRate: referralBonusRate,
                    isAttendanceActive: isAttendanceActive,
                    attendanceBonusRate: attendanceBonusRate,
                    referralBonusStorage: new Decimal(0),
                    referralRewardStorage: new Decimal(0)
                }));
            }
        }).catch(err => console.error('Failed to load user status:', err));

        return () => {
            realTimeSyncService.stopSync();
        };
    }, [isOpen, walletAddress, realTimeSyncService]);

    // 로컬 타이머 (UI 업데이트용, 1초마다 증가)
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isMining) {
            interval = setInterval(() => {
                setMiningTime(prev => prev + 1);
                // UI상 부드러운 증가를 위해 로컬에서 예상치 더함 (실제 데이터는 30초마다 서버 동기화로 보정됨)
                setAccumulatedReward(prev => prev.plus(userStats.baseRate.div(3600)));
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isMining, userStats.baseRate]);

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
                setMiningTime(0); // 시작 시 0부터 (또는 서버 시간 기준)
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
        const base = new Decimal(0.25);
        const dailyMax = new Decimal(6.0);
        const bonusMultiplier = new Decimal(1).plus(new Decimal(bonusRate));

        setUserStats(prev => ({
            ...prev,
            baseRate: base.mul(bonusMultiplier),
            dailyMaxRate: dailyMax.mul(bonusMultiplier),
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
                                <div className="status-value-medium purple">{formatNumber(userStats.referralBonusStorage)}BW</div>
                                <div className="status-label">{getTranslation('bonus.referralStorage')}</div>
                            </div>
                            <div className="status-item">
                                <div className="status-value-medium purple">{formatNumber(userStats.referralRewardStorage)}BW</div>
                                <div className="status-label">{getTranslation('bonus.referralRewardStorage')}</div>
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

            {isAttendanceModalOpen && (
                <AttendanceModal
                    isOpen={isAttendanceModalOpen}
                    onClose={() => setIsAttendanceModalOpen(false)}
                    onCheckIn={handleCheckInSuccess}
                    currentLanguage={currentLanguage}
                />
            )}
        </div>
    );
};

export default MiningStatusModal;
