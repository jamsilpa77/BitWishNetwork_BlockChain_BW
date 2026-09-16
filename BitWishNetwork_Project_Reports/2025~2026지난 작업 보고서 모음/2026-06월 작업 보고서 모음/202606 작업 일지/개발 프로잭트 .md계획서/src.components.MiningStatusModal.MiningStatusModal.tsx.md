import React, { useState, useEffect, useRef } from 'react';
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
    isActive?: boolean;
    onFocus?: () => void;
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

const MiningStatusModal: React.FC<MiningStatusModalProps> = ({
    isOpen,
    onClose,
    currentLanguage,
    onOpenReferralModal,
    walletAddress,
    isActive,
    onFocus
}) => {
    const [languageManager] = useState(() => new LanguageManager());
    const [precisionCalculator] = useState(() => new PrecisionCalculator());
    const [realTimeSyncService] = useState(() => RealTimeSyncService.getInstance()); // [Step 4 Fix] 싱글톤 인스턴스 사용
    const [referralBonusService] = useState(() => new ReferralBonusService());

    const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('CONNECTED');
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [isMining, setIsMining] = useState<boolean>(false);
    const [miningTime, setMiningTime] = useState<number>(0);
    // [최종 수복] 엔진 재가동 없이 최신 데이터를 주입하기 위한 레퍼런스 통로
    const totalSettledAmountRef = useRef<Decimal>(new Decimal(0));
    const [accumulatedReward, setAccumulatedReward] = useState<Decimal>(new Decimal(0));
    const [totalSettledAmount, setTotalSettledAmount] = useState<Decimal>(new Decimal(0));
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

    // [Step 1-2] 드래그 및 위치 상태 관리 로직 이식
    // [Step 6] 1프레임 위치 오류(잔상) 방지를 위한 렌더링 즉시 초기값 할당
    const [position, setPosition] = useState(() => {
        if (typeof window !== 'undefined') {
            return { x: (window.innerWidth - 600) / 2, y: 450 };
        }
        return { x: 0, y: 450 };
    });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // [Step 5-2 & 6.3] 오픈/클로즈 양방향에서 좌표를 리셋하여 유령 궤적(Ghosting) 원천 차단
    useEffect(() => {
        // isOpen이 true든 false든 상태가 변할 때마다 무조건 중앙 좌표로 리셋해둠
        const width = 600; // 정확한 CSS 폭 반영
        const x = (window.innerWidth - width) / 2;
        const y = 450; // 지정 좌표(마이닝 시작 버튼 아래) 적용
        setPosition({ x, y });
    }, [isOpen]);

    // 드래그 이벤트 핸들러
    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.modal-header')) {
            setIsDragging(true);
            setDragOffset({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                // [Step 5-3] 드래그 경계 제한 완전 철폐
                const newX = e.clientX - dragOffset.x;
                const newY = e.clientY - dragOffset.y;

                setPosition({ x: newX, y: newY });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

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

                    // [Step 1 집행] 가짜 유저 생성 및 데이터 오염(Poisoning) 회로 완전 삭제
                    // 시스템은 이제 임의로 숫자를 맞추지 않고 오직 서버의 실시간 데이터만 신뢰함.

                    // 4. 상태 업데이트 (화면 표시)
                    // [Step 3] UI의 자의적 보너스율 재계산 로직 제거
                    // 서버 DB에 기록된 실제 보너스 수치를 그대로 신뢰하여 표출
                    const referralCount = userData.miningState?.referralCount || 0;
                    const referralBonusRateValue = new Decimal(userData.miningState?.referralBonusRate || '0').mul(100);

                    // 출석 상태
                    const isAttendanceActive = userData.miningState?.isAttendanceActive || false;
                    const attendanceBonusRateVal = isAttendanceActive ? new Decimal(5.0) : new Decimal(0.0);

                    // 서버에서 이미 계산된 최종 보너스 및 보상률을 반영
                    const finalBaseRate = new Decimal(userData.miningState?.currentTotalRate || '0.25');
                    const dailyMaxOrigin = new Decimal(6.0);

                    // 일일 최대 보상률도 동일한 배율(multiplier) 적용을 위해 서버 보너스율 기반 계산
                    const multiplier = new Decimal(1).plus(new Decimal(userData.miningState?.referralBonusRate || '0'))
                        .plus(isAttendanceActive ? 0.05 : 0)
                        .plus(userData.miningState?.partnerStatus === 'REGISTERED' ? 0.25 : 0);
                    const finalDailyMaxRate = dailyMaxOrigin.mul(multiplier);

                    // [수복] 추천 보너스 데이터 주소 교정 (miningState가 아닌 user 객체에서 추출)
                    const userProfile = userData.user || {};
                    setUserStats({
                        baseRate: finalBaseRate,
                        dailyMaxRate: finalDailyMaxRate,
                        referralCount: referralCount,
                        referralBonusRate: referralBonusRateValue, // 2.0% (DB 값) 정상 표시
                        isAttendanceActive: isAttendanceActive,
                        attendanceBonusRate: attendanceBonusRateVal,
                        referralBonusStorage: new Decimal(userProfile.referralBonusStorage || 0),
                        // [Phase 1 Fixed] 로컬 스토리지 데이터 파기, 나의 지갑 탭과 100% 동일하게 서버 최신 API 데이터 직결
                        referralRewardStorage: new Decimal(userProfile.referralRewardStorage || 0),
                        partnerStatus: userData.miningState?.partnerStatus || 'NOT_REGISTERED'
                    });

                    // 마이닝 상태 반영
                    if (userData.miningState) {
                        setIsMining(userData.miningState.isMining);
                        if (userData.miningState.isMining && userData.miningState.miningStartTime) {
                            const startTime = new Date(userData.miningState.miningStartTime).getTime();
                            const diffSeconds = Math.floor((Date.now() - startTime) / 1000);
                            setMiningTime(diffSeconds > 0 ? diffSeconds : 0);
                        }

                        // [4차 최종 수복] 서버 전체 누계와 현재 티커 위치의 간극을 '기준점'으로 박제
                        const trueTotal = new Decimal(userData.miningState.trueLifeTimeMined || 0);
                        const currentTickerStatus = realTimeSyncService.getCurrentStatus();
                        const baselineAnchor = trueTotal.minus(new Decimal(currentTickerStatus.currentIssued || 0));

                        setTotalSettledAmount(new Decimal(userData.miningState.totalSettledAmount || 0)); // 화면 표시용
                        totalSettledAmountRef.current = baselineAnchor; // [핵심] 보정치까지 포함된 완벽한 시작점 박제
                        setAccumulatedReward(trueTotal); // 첫 프레임부터 진실된 수치 고정
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
            // [수복] 엔진을 다시 켜지 않고도 통로(Ref)를 통해 최신 정산금을 더함
            if (status.currentIssued > 0) {
                setAccumulatedReward(new Decimal(status.currentIssued).plus(totalSettledAmountRef.current));
            }
        });

        // [핵심] 실시간 채굴량 방송 구독 (1초 단위)
        const unsubscribeMining = realTimeSyncService.subscribe((status) => {
            if (status.currentIssued >= 0) {
                // [수복] 엔진 재시작 없이 실시간으로 최신 기준점 합산
                setAccumulatedReward(new Decimal(status.currentIssued).plus(totalSettledAmountRef.current));
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
            }, 1000);
        }
        return () => {
            if (timerId) clearInterval(timerId);
        };
    }, [isMining, miningTime, walletAddress]);

    // [신규] 마이닝 상태 변화 시 서비스 티커 제어
    useEffect(() => {
        if (isMining && userStats.baseRate.gt(0)) {
            // [Phase 1 추가수술] 마이닝 시작 시 엔진에 2% 추천 보너스율 함께 전달 (누락 버그 해결)
            realTimeSyncService.startMiningTicker(
                userStats.baseRate.toNumber(),
                userStats.referralBonusRate.toNumber() / 100
            );
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
        <div
            className="mining-status-modal-overlay"
            onMouseDownCapture={onFocus} // 배경 클릭 시에도 포커스 전환
            style={{
                pointerEvents: 'none',
                backgroundColor: 'transparent',
                backdropFilter: 'none',
                zIndex: isActive ? 10100 : 10000 // [핵심] 최상위 레이어 우선순위 제어
            }}
        >
            <div
                className="mining-status-modal"
                onMouseDown={(e) => {
                    handleMouseDown(e);
                    if (onFocus) onFocus();
                }}
                onMouseDownCapture={onFocus} // 내부 모든 클릭 감지
                style={{
                    position: 'fixed',
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    pointerEvents: 'auto',
                    cursor: isDragging ? 'grabbing' : 'default',
                    zIndex: isActive ? 10100 : 10003, // 포커스 시 격상
                    boxShadow: isActive ? '0 20px 50px rgba(0,0,0,0.4)' : '0 10px 30px rgba(0,0,0,0.2)',
                    transition: 'box-shadow 0.2s ease',
                    margin: 0
                }}
            >
                <div className="modal-header" style={{ cursor: 'grab', userSelect: 'none' }}>
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
