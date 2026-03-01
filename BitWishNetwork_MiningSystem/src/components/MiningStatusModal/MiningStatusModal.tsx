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
    partnerStatus: string;
    referralRewardStorage: Decimal;
}

const MiningStatusModal: React.FC<MiningStatusModalProps> = ({ isOpen, onClose, currentLanguage, onOpenReferralModal, walletAddress }) => {
    const [languageManager] = useState(() => new LanguageManager());
    const [precisionCalculator] = useState(() => new PrecisionCalculator());
    const [realTimeSyncService] = useState(() => RealTimeSyncService.getInstance()); // [Step 4 Fix] 싱글톤 인스턴스 사용
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
        partnerStatus: 'NOT_REGISTERED',
        referralRewardStorage: new Decimal(0)
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

                    // 3. [핵심] 데이터 영구 저장소(ReferralBonusService)와 동기화 및 복구
                    // 실제 지갑 주소를 키로 사용
                    let referralStats = referralBonusService.getReferralStats(walletAddress);

                    // 지갑에는 추천인이 있는데 서비스 데이터(저장소)에는 없는 경우 -> 복구 수행
                    if (realReferralCount > 0 && referralStats.referredUsers.length < realReferralCount) {
                        console.log(`[MiningStatusModal] 데이터 복구 시작: 지갑(${realReferralCount}명) vs 저장소(${referralStats.referredUsers.length}명)`);

                        // 3-1. 내 추천 코드 확보 (없으면 생성)
                        let myCode = referralStats.referralCode;
                        if (!myCode) {
                            const codeResult = referralBonusService.generateReferralCode(walletAddress);
                            if (codeResult.success) myCode = codeResult.referralCode!;
                        }

                        // 3-2. 부족한 수만큼 서비스의 정식 가입 메서드를 호출하여 데이터 생성 및 저장
                        if (myCode) {
                            const missingCount = realReferralCount - referralStats.referredUsers.length;
                            for (let i = 0; i < missingCount; i++) {
                                // 가상의 유저 생성하여 정식 가입 절차 밟음 -> 서비스가 알아서 저장소에 기록함
                                const fakeUserId = `recovered_${Date.now()}_${i}`;
                                referralBonusService.joinWithReferralCode(myCode, fakeUserId, {
                                    walletAddress: fakeUserId,
                                    kycStatus: 'APPROVED' // 승인 상태로 가정
                                } as any);
                            }
                            // 복구 후 데이터 다시 로드
                            referralStats = referralBonusService.getReferralStats(walletAddress);
                            console.log('[MiningStatusModal] 데이터 복구 및 영구 저장 완료');
                        }
                    }

                    // 4. 상태 업데이트 (화면 표시)
                    // 추천 보너스 비율 계산 (1명당 2%)
                    const referralBonusRateVal = new Decimal(referralStats.referredUsers.length).mul(2.0);

                    // 출석 상태
                    const isAttendanceActive = userData.miningState?.isAttendanceActive || false;
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
                        referralCount: referralStats.referredUsers.length, // 서비스 데이터 기준 표시
                        referralBonusRate: referralBonusRateVal,
                        isAttendanceActive: isAttendanceActive,
                        attendanceBonusRate: attendanceBonusRateVal,
                        // 저장소에서 가져온 실제 데이터 표시
                        referralBonusStorage: new Decimal(referralStats.bonusStorage || 0),
                        referralRewardStorage: new Decimal(referralStats.rewardStorage || 0),
                        partnerStatus: 'NOT_REGISTERED'
                    });

                    // 마이닝 상태 반영
                    if (userData.miningState) {
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

        // [복구됨] 실시간 관리자 초기화 감지 리스너
        const handleResetSignal = (e: StorageEvent) => {
            if (e.key === 'BW_SYSTEM_RESET_TRIGGER') {
                const targetAddress = e.newValue;
                if (targetAddress === walletAddress || targetAddress === 'ALL') {
                    console.log('[MiningStatusModal] System Reset Signal Received. Resetting local state...');
                    // 즉시 UI 상태 초기화
                    setIsMining(false);
                    setMiningTime(0);
                    setAccumulatedReward(new Decimal(0));
                    setUserStats(prev => ({
                        ...prev,
                        referralBonusStorage: new Decimal(0),
                        referralRewardStorage: new Decimal(0)
                    }));
                    // 데이터 재동기화 (DB 최신값 반영)
                    setTimeout(() => initializeData(), 500);
                }
            }
        };
        window.addEventListener('storage', handleResetSignal);

        // 실시간 동기화 시작 (API 동기화)
        realTimeSyncService.startSync((status: RealTimeMiningStatus) => {
            setLastUpdate(new Date());
            setNetworkStatus(status.networkStatus);
            // [중요] API 동기화 시에도 현재 메모리 값을 최우선으로 반영 (UI 튕김 방지)
            if (status.currentIssued > 0) {
                setAccumulatedReward(new Decimal(status.currentIssued));
            }
        });

        // [핵심] 실시간 채굴량 방송 구독 (1초 단위)
        const unsubscribeMining = realTimeSyncService.subscribe((status) => {
            if (status.currentIssued >= 0) {
                setAccumulatedReward(new Decimal(status.currentIssued));
            }
            if (status.referralBonusStorage >= 0) {
                setUserStats(prev => ({
                    ...prev,
                    referralBonusStorage: new Decimal(status.referralBonusStorage)
                }));
            }
        });

        return () => {
            window.removeEventListener('storage', handleResetSignal);
            realTimeSyncService.stopSync();
            unsubscribeMining(); // 구독 해제 (하지만 티커는 서비스에서 계속 돌아감)
        };
    }, [isOpen, walletAddress, realTimeSyncService, referralBonusService]);

    // 진행 시간(Mining Time) 관리 전용 타이머
    useEffect(() => {
        let timerId: NodeJS.Timeout;
        if (isMining) {
            timerId = setInterval(() => {
                setMiningTime(prev => prev + 1);

                // [신규] 10초마다 보너스 보관함 로직 수행 (창이 열려있을 때)
                const currentTime = miningTime + 1;
                if (currentTime > 0 && currentTime % 10 === 0) {
                    const result = referralBonusService.applyReferralBonus(walletAddress, 0.25);
                    if (result.success && (result as any).bonusAmount) {
                        // 서비스 메모리에 보너스 합산 반영 (그러면 모든 창이 동기화됨)
                        realTimeSyncService.updateBonusStorage((result as any).bonusAmount!);
                    }
                }
            }, 1000);
        }
        return () => {
            if (timerId) clearInterval(timerId);
        };
    }, [isMining, miningTime, walletAddress]);

    // [신규] 마이닝 상태 변화 시 서비스 티커 제어
    useEffect(() => {
        if (isMining && userStats.baseRate.gt(0)) {
            // 마이닝 시작 시 서비스에 채굴 엔진 가동 명령 (Rate 전달)
            realTimeSyncService.startMiningTicker(userStats.baseRate.toNumber());
        } else {
            // 마이닝 중지 시 엔진 정지
            realTimeSyncService.stopMiningTicker();
        }
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
                    <button
                        className="logout-header-button"
                        onClick={() => {
                            if (window.confirm('로그아웃 하시겠습니까?')) {
                                localStorage.removeItem('bw_mining_auth');
                                window.location.reload();
                            }
                        }}
                        style={{
                            backgroundColor: '#ff4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            height: '24px',
                            lineHeight: '16px'
                        }}
                    >
                        Logout
                    </button>
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
