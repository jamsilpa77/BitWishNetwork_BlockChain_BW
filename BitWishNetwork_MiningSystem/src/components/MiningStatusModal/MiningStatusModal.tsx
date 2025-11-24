import React, { useState, useEffect } from 'react';
import { LanguageManager } from '@/utils/LanguageManager/LanguageManager';
import { Decimal } from 'decimal.js';
import { PrecisionCalculator } from '@/utils/PrecisionCalculator/PrecisionCalculator';
import { RealTimeSyncService } from '@/services/MiningService/RealTimeSyncService';
import {
    NetworkStatus
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

    const stopRealTimeSync = () => {
        realTimeSyncService.stopSync();
    };

    const startRealTimeSync = () => {
        realTimeSyncService.startSync(() => { });
    };

    useEffect(() => {
        if (isOpen) {
            startRealTimeSync();

            // 출석 상태 확인 및 업데이트 로직 (9AM 기준)
            const updateAttendanceStatus = () => {
                const now = new Date();

                // 9AM 기준 날짜 계산 (AttendanceModal과 동일 로직 - 독립 구현)
                const checkInDate = new Date(now);
                if (checkInDate.getHours() < 9) {
                    checkInDate.setDate(checkInDate.getDate() - 1);
                }
                const todayStr = `${checkInDate.getFullYear()}-${String(checkInDate.getMonth() + 1).padStart(2, '0')}-${String(checkInDate.getDate()).padStart(2, '0')}`;

                // 로컬 스토리지 확인
                const savedData = localStorage.getItem('bw_attendance_data');
                let isCheckedToday = false;

                if (savedData) {
                    const parsedData = JSON.parse(savedData);
                    isCheckedToday = parsedData.includes(todayStr);
                }

                // 보너스 적용 여부에 따른 수치 계산
                const base = new Decimal(0.25);
                const dailyMax = new Decimal(6.0);
                const bonusMultiplier = isCheckedToday ? new Decimal(1.05) : new Decimal(1.0);

                setUserStats(prev => {
                    // 값이 실제 변경되었을 때만 업데이트 (불필요한 렌더링 방지)
                    if (prev.isAttendanceActive === isCheckedToday) {
                        return prev;
                    }

                    return {
                        ...prev,
                        baseRate: base.mul(bonusMultiplier),
                        dailyMaxRate: dailyMax.mul(bonusMultiplier),
                        attendanceBonusRate: isCheckedToday ? new Decimal(5.0) : new Decimal(0.0),
                        isAttendanceActive: isCheckedToday
                    };
                });
            };

            // 추천 보너스 데이터 로드 및 계산
            const loadReferralData = () => {
                const savedWallet = localStorage.getItem('bw_wallet_data');
                if (savedWallet) {
                    try {
                        const parsed = JSON.parse(savedWallet);
                        const count = parsed.referralCount || 0;
                        const rate = new Decimal(count).mul(2.0); // 1명당 2%

                        // Load storage values
                        // referralReward -> referralBonusStorage
                        // referralBonus -> referralRewardStorage
                        const bonusStorage = new Decimal(parsed.referralReward || 0);
                        const rewardStorage = new Decimal(parsed.referralBonus || 0);

                        setUserStats(prev => ({
                            ...prev,
                            referralCount: count,
                            referralBonusRate: rate,
                            referralBonusStorage: bonusStorage,
                            referralRewardStorage: rewardStorage
                        }));
                    } catch (e) {
                        console.error('Failed to load referral data', e);
                    }
                }
            };

            // 초기 실행
            updateAttendanceStatus();
            loadReferralData();

            // 1초마다 시간 업데이트 및 9시 리셋 체크
            const timeInterval = setInterval(() => {
                setLastUpdate(new Date());
                updateAttendanceStatus(); // 매 초마다 출석 상태(9시 경계) 체크
            }, 1000);

            return () => {
                stopRealTimeSync();
                clearInterval(timeInterval);
            };
        }
        return undefined;
    }, [isOpen]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isMining) {
            interval = setInterval(() => {
                setMiningTime(prev => prev + 1);
                // 현재 적용된 기본 보상률(보너스 포함)을 기준으로 초당 보상 계산
                // baseRate / 3600
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

    const handleStartMining = () => {
        setIsMining(true);
    };

    const handleStopMining = () => {
        setIsMining(false);
    };

    const handleOpenAttendance = () => {
        setIsAttendanceModalOpen(true);
    };

    const handleCheckInSuccess = (bonusRate: number) => {
        // 출석 성공 시 즉시 상태 업데이트
        // 50단위 부동소수점 정밀 계산 (decimal.js)
        const base = new Decimal(0.25);
        const dailyMax = new Decimal(6.0);
        const bonusMultiplier = new Decimal(1).plus(new Decimal(bonusRate));

        setUserStats(prev => ({
            ...prev,
            baseRate: base.mul(bonusMultiplier),
            dailyMaxRate: dailyMax.mul(bonusMultiplier),
            attendanceBonusRate: new Decimal(bonusRate * 100), // 0.05 -> 5.0
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
                    <button className="footer-btn start" onClick={handleStartMining}>
                        <span className="btn-icon">⚡</span>
                        {getTranslation('buttons.start')}
                    </button>
                    <button className="footer-btn stop" onClick={handleStopMining}>
                        <span className="btn-icon">⏹️</span>
                        {getTranslation('buttons.stop')}
                    </button>
                    <button className="footer-btn wallet">
                        <span className="btn-icon">🔑</span>
                        {getTranslation('buttons.myWallet')}
                    </button>
                    <button className="footer-btn close" onClick={onClose}>
                        <span className="btn-icon">❌</span>
                        {getTranslation('buttons.close')}
                    </button>
                </div>
            </div>

            {/* 출석 보너스 모달 */}
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
