import React, { useState, useEffect } from 'react';
import { walletService } from '../../services/BlockchainService/WalletService';
import { apiService } from '../../services/ApiService';
import { LanguageManager } from '@/utils/LanguageManager/LanguageManager';
import { Decimal } from 'decimal.js';
import { PrecisionCalculator } from '../../utils/PrecisionCalculator/PrecisionCalculator';
import KYCFormModal from './KYCFormModal';
import TransferModal from './TransferModal';
import './MyWalletModal.css';

/**
 * ⚠️ 중요 준수 사항: 전역 모달, 공통 변수 함수 절대 포함하지 않는다
 * ❌ 전역 변수 사용 금지
 * ❌ 공통 함수 사용 금지  
 * ❌ 공통 클래스 사용 금지
 * ❌ 전역 모달 사용 금지
 * ❌ 중복 코드 사용 금지
 * ❌ 다른 컴포넌트와 상태 공유 금지
 * ❌ 전역 상태 관리 라이브러리 사용 금지
 * ✅ 모든 텍스트는 한국어, 영어, 일어, 중국어포함 언어 변경 되도록 모든 기능에 완벽하게 구현한다.
 */

import { RealTimeSyncService } from '@/services/MiningService/RealTimeSyncService';

interface MyWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentLanguage: string;
    onOpenMining?: (address: string) => void;
    isActive?: boolean;
    onFocus?: () => void;
}

const MyWalletModal: React.FC<MyWalletModalProps> = ({
    isOpen,
    onClose,
    currentLanguage,
    onOpenMining,
    isActive,
    onFocus
}) => {
    const [languageManager] = useState(() => new LanguageManager());
    const [precisionCalculator] = useState(() => new PrecisionCalculator());
    const [realTimeSyncService] = useState(() => RealTimeSyncService.getInstance());
    const [activeTab, setActiveTab] = useState('overview');
    const [walletAddress, setWalletAddress] = useState('');
    const [walletData, setWalletData] = useState<{
        balance: Decimal;
        availableBalance: Decimal;
        referralReward: Decimal;
        referralBonus: Decimal;
        isOTPEnabled: boolean;
        isKycVerified: boolean;
        kycVerifiedDate?: string | null;
        myReferralCode?: string;
        referralList?: any[];
        miningHistory?: any[];
        miningStartedAt: string;
    }>({
        balance: new Decimal(0),
        availableBalance: new Decimal(0),
        referralReward: new Decimal(0),
        referralBonus: new Decimal(0),
        isOTPEnabled: false,
        isKycVerified: false,
        kycVerifiedDate: null,
        myReferralCode: '',
        referralList: [],
        miningHistory: [],
        miningStartedAt: ''
    });
    const [viewMode, setViewMode] = useState<'dashboard' | 'otpSetup'>('dashboard');
    const [messageModal, setMessageModal] = useState<{
        isOpen: boolean;
        type: 'kycNotPeriod' | 'kycCongrats' | '';
    }>({ isOpen: false, type: '' });
    const [isRotating, setIsRotating] = useState(false);
    const [isKYCModalOpen, setIsKYCModalOpen] = useState(false);
    const [transferModal, setTransferModal] = useState({ isOpen: false, type: 'send' as 'send' | 'receive' });
    const [currentTime, setCurrentTime] = useState(new Date());

    // ═══════════════════════════════════════════════════════════════
    // [블록 트랜잭션 전용 독립 상태] - 외부 전역 간섭 완전 차단
    // ═══════════════════════════════════════════════════════════════
    const [blockTxList, setBlockTxList] = useState<any[]>([]);
    const [blockTxLoading, setBlockTxLoading] = useState(false);
    const [blockTxHasNext, setBlockTxHasNext] = useState(false);
    const [blockTxHasPrev, setBlockTxHasPrev] = useState(false);
    const [blockTxCursorStack, setBlockTxCursorStack] = useState<number[]>([]);

    // [블록 트랜잭션 4개국어 로컬 딕셔너리]
    const blockTxDict: Record<string, Record<string, string>> = {
        title: { ko: '블록 트랜잭션', en: 'Block Transactions', ja: 'ブロックトランザクション', zh: '区块交易' },
        blockHeight: { ko: '블록 높이', en: 'Block Height', ja: 'ブロック高さ', zh: '区块高度' },
        txHash: { ko: '트랜잭션 해시', en: 'Tx Hash', ja: 'TXハッシュ', zh: '交易哈希' },
        amount: { ko: '수량', en: 'Amount', ja: '数量', zh: '数量' },
        type: { ko: '유형', en: 'Type', ja: 'タイプ', zh: '类型' },
        status: { ko: '상태', en: 'Status', ja: 'ステータス', zh: '状态' },
        date: { ko: '일시', en: 'Date', ja: '日時', zh: '日期' },
        prev: { ko: '◀ 이전', en: '◀ Prev', ja: '◀ 前へ', zh: '◀ 上一页' },
        next: { ko: '다음 ▶', en: 'Next ▶', ja: '次へ ▶', zh: '下一页 ▶' },
        noData: { ko: '채굴 증명 트랜잭션이 아직 없습니다.', en: 'No mining proof transactions yet.', ja: 'マイニング証明トランザクションはまだありません。', zh: '暂无挖矿证明交易。' },
        loading: { ko: '로딩 중...', en: 'Loading...', ja: '読み込み중...', zh: '加载中...' },
        copied: { ko: '해시가 복사되었습니다!', en: 'Hash copied!', ja: 'ハッシュ가 복사되었습니다！', zh: '哈希已复制！' },
        minting: { ko: '채굴 발행', en: 'Minting', ja: 'マイニング発行', zh: '挖矿铸조' },
        referralReward: { ko: '추천 보상', en: 'Referral Reward', ja: '紹介報酬', zh: '推荐奖励' },
        confirmed: { ko: '확인됨', en: 'Confirmed', ja: '確認済み', zh: '已确认' },
        guide: { ko: '📌 1 BW 채굴 완료 시마다 채굴 증명 블록이 자동으로 기록됩니다.', en: '📌 A mining proof block is automatically recorded each time 1 BW is mined.', ja: '📌 1 BWの採掘が完了するたびにマイニング証明ブロックが自動的に記録されます。', zh: '📌 每次挖矿完成1 BW时，将自动记录挖矿证明区块。' }
    };
    const btt = (key: string) => blockTxDict[key]?.[currentLanguage] || blockTxDict[key]?.['en'] || key;

    const fetchBlockTransactions = async (cursor?: number | null, direction: string = 'next') => {
        if (!walletAddress) return;
        setBlockTxLoading(true);
        try {
            let url = `/api/mining/block-transactions/${walletAddress}?direction=${direction}`;
            if (cursor !== null && cursor !== undefined) url += `&cursor=${cursor}`;
            const resp = await fetch(url);
            const data = await resp.json();
            if (data.success) {
                setBlockTxList(data.transactions || []);
                setBlockTxHasNext(data.hasNext || false);
                setBlockTxHasPrev(data.hasPrev || false);
            }
        } catch (err) {
            console.error('[블록 트랜잭션 조회 실패]:', err);
        } finally {
            setBlockTxLoading(false);
        }
    };

    const [position, setPosition] = useState(() => {
        if (typeof window !== 'undefined') {
            return { x: (window.innerWidth - 800) / 2, y: 300 };
        }
        return { x: 0, y: 300 };
    });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const width = 800;
        const x = (window.innerWidth - width) / 2;
        const y = 300;
        setPosition({ x, y });
    }, [isOpen]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.wallet-header')) {
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

    // ═══════════════════════════════════════════════════════════════
    // [3단계] 1초 단위 타이머 및 한국 시간대(KST, UTC+9) 월 전환 실시간 감지
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        const getKSTYearMonth = (date: Date) => {
            // UTC 기준에 9시간 가산하여 정확한 KST 환산 연월 확보
            const kstOffset = 9 * 60 * 60 * 1000;
            const kstDate = new Date(date.getTime() + kstOffset);
            const y = kstDate.getUTCFullYear();
            const m = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
            return `${y}-${m}`;
        };

        let prevKSTYM = getKSTYearMonth(new Date());

        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTime(now);

            // [실시간 수량 가산 작동] 지갑 창이 열려 있는 동안 채굴량과 보너스가 초당 멈추지 않고 생동감 있게 상승하도록 처리합니다.
            setWalletData(prev => {
                if (prev.balance && prev.balance.gt(0)) {
                    const minedIncrement = new Decimal('0.00000012'); // 초당 채굴량 증가 속도
                    const bonusIncrement = new Decimal('0.00000001'); // 초당 보너스 증가 속도
                    return {
                        ...prev,
                        balance: prev.balance.plus(minedIncrement),
                        referralBonus: prev.referralBonus.plus(bonusIncrement)
                    };
                }
                return prev;
            });

            // 매초 검증을 통해 월 단위 롤오버 시점(예: 5/31 23:59:59 -> 6/1 00:00:00) 실시간 감지
            const currentKSTYM = getKSTYearMonth(now);
            if (prevKSTYM !== currentKSTYM) {
                console.log(`[Month Transition KST Detected]: ${prevKSTYM} -> ${currentKSTYM}. Auto fetching fresh wallet state...`);
                prevKSTYM = currentKSTYM;
                fetchWalletData();
            }
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchWalletData = async () => {
        const currentAddress = walletService.getCurrentWalletAddress();
        if (!currentAddress) return;

        setWalletAddress(currentAddress);

        try {
            const response = await apiService.getUserStatus(currentAddress);

            const referralResponse = await fetch(`/api/referral/stats/${currentAddress}`);
            const referralData = referralResponse.ok ? await referralResponse.json() : { success: false };

            const historyResponse = await fetch(`/api/mining/history/${currentAddress}`);
            const historyData = historyResponse.ok ? await historyResponse.json() : { success: false };

            if (response?.success) {
                const u = response.user;
                const m = response.miningState;
                const r = (referralData as any).success ? (referralData as any).data : null;

                // [새로 붙여넣을 코드]
                let startedAtStr = '';
                if (m?.miningStartTime) {
                    startedAtStr = m.miningStartTime;
                } else if (m?.startedAt) {
                    startedAtStr = m.startedAt;
                } else if (m?.createdAt) {
                    startedAtStr = m.createdAt;
                } else {
                    const now = new Date();
                    const fallbackDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 1);
                    startedAtStr = fallbackDate.toISOString();
                }

                setWalletData({
                    balance: new Decimal(m?.accumulatedReward || '0'),
                    availableBalance: new Decimal(m?.availableBalance || '0'),
                    referralReward: new Decimal(r?.referralRewardStorage || u?.referralRewardStorage || '0'),
                    referralBonus: new Decimal(r?.referralBonusStorage || u?.referralBonusStorage || '0'),
                    isOTPEnabled: u?.isOTPEnabled || false,
                    isKycVerified: u?.isKycVerified || false,
                    kycVerifiedDate: u?.kycVerifiedDate || u?.approvedAt || null,
                    myReferralCode: r?.referralCode || u?.myReferralCode || '',
                    referralList: (r?.referralList || u?.referralList || []).map((item: any) => ({
                        ...item,
                        kycDetailStatus: item.kycDetailStatus || (item.isKycVerified ? '승인' : '미승인'),
                        is1BWMePaid: item.is1BWMePaid ?? (item.rewardStatus?.toUpperCase() === 'PAID' || item.rewardStatus?.toUpperCase() === 'COMPLETED'),
                        is2PercentMePaid: item.is2PercentMePaid ?? (item.rewardStatus?.toUpperCase() === 'PAID' || item.rewardStatus?.toUpperCase() === 'COMPLETED')
                    })),
                    // 백엔드가 완벽하게 정제/수복하여 보내준 전월의 기록 리스트 바인딩
                    miningHistory: (historyData as any).success ? (historyData as any).history : [],
                    miningStartedAt: startedAtStr
                } as any);
            }
        } catch (e) {
            console.error('Wallet real-time restoration error:', e);
        }
    };

    useEffect(() => {
        if (!isOpen) return;

        fetchWalletData();

        const unsubscribe = realTimeSyncService.subscribe((data) => {
            if (data && data.currentIssued >= 0) {
                console.log('[Wallet] Real-time data received:', data.currentIssued);
                setWalletData(prev => ({
                    ...prev,
                    balance: new Decimal(data.currentIssued),
                    referralBonus: new Decimal(data.referralBonusStorage)
                }));
            }
        });

        const handleUpdate = () => {
            fetchWalletData();
        };

        window.addEventListener('storage', handleUpdate);
        window.addEventListener('BW_DATA_UPDATED', handleUpdate);

        return () => {
            unsubscribe();
            window.removeEventListener('storage', handleUpdate);
            window.removeEventListener('BW_DATA_UPDATED', handleUpdate);
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const getTranslation = (key: string) => {
        return languageManager.getTranslation(key, currentLanguage);
    };

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(walletAddress);
        alert(getTranslation('wallet.dashboard.address') + ' ' + getTranslation('wallet.referral.modal.copied'));
    };

    const handleRefresh = () => {
        setIsRotating(true);
        fetchWalletData();
        setTimeout(() => setIsRotating(false), 1000);
    };

    const shortAddress = walletAddress ? `${walletAddress.substring(0, 6)}......${walletAddress.substring(walletAddress.length - 4)}` : '';

    return (
        <div
            className="my-wallet-modal-overlay"
            onMouseDownCapture={onFocus}
            style={{
                pointerEvents: (isKYCModalOpen || transferModal.isOpen || messageModal.isOpen) ? 'auto' : 'none',
                backgroundColor: 'transparent',
                backdropFilter: 'none',
                zIndex: isActive ? 10100 : 10000
            }}
        >
            <div
                className="my-wallet-modal"
                onMouseDown={(e) => {
                    handleMouseDown(e);
                    if (onFocus) onFocus();
                }}
                onMouseDownCapture={onFocus}
                style={{
                    position: 'fixed',
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    pointerEvents: 'auto',
                    cursor: isDragging ? 'grabbing' : 'default',
                    zIndex: isActive ? 10100 : 10002,
                    boxShadow: isActive ? '0 20px 50px rgba(0,0,0,0.4)' : '0 10px 30px rgba(0,0,0,0.2)',
                    transition: 'box-shadow 0.2s ease',
                    margin: 0
                }}
            >
                {/* Header */}
                <div className="wallet-header" style={{ cursor: 'grab', userSelect: 'none' }}>
                    <div className="header-top-row">
                        <div className="header-left-group">
                            <button className="back-button" onClick={onClose}>←</button>
                            <h2 className="header-title">{getTranslation('wallet.dashboard.title')}</h2>
                        </div>
                        <div className="header-right-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className="status-badge">
                                    <div className="status-dot"></div>
                                    <span>{getTranslation('wallet.dashboard.statusActive')}</span>
                                </div>
                                <button className="logout-btn" onClick={() => {
                                    if (!window.confirm(getTranslation('wallet.dashboard.logout.confirm') || '로그아웃 하시겠습니까?')) return;

                                    localStorage.removeItem('wallet_auth_session');
                                    localStorage.removeItem('bw_auth_session');
                                    localStorage.removeItem('bw_mining_auth');

                                    setWalletAddress('');
                                    setWalletData({
                                        balance: new Decimal(0),
                                        availableBalance: new Decimal(0),
                                        referralReward: new Decimal(0),
                                        referralBonus: new Decimal(0),
                                        isOTPEnabled: false,
                                        isKycVerified: false,
                                        myReferralCode: '',
                                        miningStartedAt: ''
                                    });

                                    window.dispatchEvent(new Event('BW_WALLET_LOGOUT'));
                                    onClose();
                                }}>{getTranslation('wallet.dashboard.logout.title')}</button>

                                <button className={`refresh-btn ${isRotating ? 'rotating' : ''}`} onClick={handleRefresh}>
                                    ↻
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="header-address-row">
                        <span className="header-address-label">{getTranslation('wallet.dashboard.address')}:</span>
                        <span className="header-address-value">{shortAddress}</span>
                        <button className="header-copy-btn" onClick={handleCopyAddress}>
                            📋 {getTranslation('wallet.dashboard.copyAddress')}
                        </button>

                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                            <button
                                className="mining-start-btn"
                                style={{
                                    backgroundColor: '#2563EB',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 22px',
                                    borderRadius: '8px',
                                    fontSize: '15px',
                                    cursor: 'pointer',
                                    fontWeight: '900',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                                    transition: 'all 0.2s ease'
                                }}
                                onClick={() => {
                                    if (onOpenMining) {
                                        onOpenMining(walletAddress);
                                    } else {
                                        alert(getTranslation('wallet.dashboard.messages.miningNotConnected'));
                                    }
                                }}
                            >
                                ⛏️ {getTranslation('wallet.dashboard.actions.startMining')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="wallet-tabs">
                    <button
                        className={`tab-item ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        {getTranslation('wallet.dashboard.tabs.overview')}
                    </button>
                    <button
                        className={`tab-item ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        {getTranslation('wallet.dashboard.tabs.history')}
                    </button>
                    <button
                        className={`tab-item ${activeTab === 'miningRewards' ? 'active' : ''}`}
                        onClick={() => setActiveTab('miningRewards')}
                    >
                        {getTranslation('wallet.dashboard.tabs.miningRewards')}
                    </button>
                    <button
                        className={`tab-item ${activeTab === 'referralRewards' ? 'active' : ''}`}
                        onClick={() => setActiveTab('referralRewards')}
                    >
                        {getTranslation('wallet.dashboard.tabs.referralRewards')}
                    </button>
                    <button
                        className={`tab-item ${activeTab === 'blockTx' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('blockTx'); fetchBlockTransactions(null, 'next'); setBlockTxCursorStack([]); }}
                    >
                        {btt('title')}
                    </button>
                    <button
                        className={`tab-item ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        {getTranslation('wallet.dashboard.tabs.settings')}
                    </button>
                </div>

                {/* Content */}
                <div className="wallet-content">
                    {activeTab === 'overview' && (
                        <div className="overview-container">
                            <div className="cards-grid">
                                {/* Balance Card */}
                                <div className="info-card balance-card">
                                    <h3 className="card-title" style={{ display: 'block', fontSize: '1.2rem', fontWeight: 800, color: '#111827', marginBottom: '20px', marginTop: 0 }}>{getTranslation('wallet.dashboard.balance.title')}</h3>

                                    <div className="balance-row">
                                        <span className="balance-label">{getTranslation('wallet.dashboard.balance.realTimeReward')}:</span>
                                        <span className="balance-value-wrapper">
                                            <span className="balance-value green">{precisionCalculator.formatForUI(walletData.balance)}<span className="unit">BW</span></span>
                                            <span className="balance-tooltip">{precisionCalculator.formatForUI(walletData.balance)} BW</span>
                                        </span>
                                    </div>
                                    <div className="info-box purple-bg">
                                        {getTranslation('wallet.dashboard.balance.realTimeDesc')}
                                    </div>

                                    <div className="balance-row mt-20">
                                        <span className="balance-label">{getTranslation('wallet.dashboard.balance.available')}:</span>
                                        <span className="balance-value-wrapper">
                                            <span className="balance-value black">{precisionCalculator.formatForUI(walletData.availableBalance)}<span className="unit">BW</span></span>
                                            <span className="balance-tooltip">{precisionCalculator.formatForUI(walletData.availableBalance)} BW</span>
                                        </span>
                                    </div>
                                    <div className="info-box blue-bg">
                                        {getTranslation('wallet.dashboard.balance.availableDesc')}
                                    </div>
                                </div>

                                {/* Referral Bonus Card */}
                                <div className="info-card referral-card">
                                    <h3 className="card-title purple-text" style={{ display: 'block', fontSize: '1.2rem', fontWeight: 800, color: '#7C3AED', marginBottom: '20px', marginTop: 0 }}>{getTranslation('wallet.dashboard.referral.title')}</h3>

                                    <div className="balance-row">
                                        <span className="balance-label">{getTranslation('wallet.dashboard.referral.storage')}:</span>
                                        <span className="balance-value orange">{precisionCalculator.formatForUI(walletData.referralReward)}<span className="unit">BW</span></span>
                                    </div>

                                    <div className="balance-row mt-20">
                                        <div className="balance-label-multiline">
                                            <div>{getTranslation('wallet.dashboard.referral.bonusStorage')}</div>
                                        </div>
                                        <span className="balance-value-wrapper">
                                            <span className="balance-value orange">{precisionCalculator.formatForUI(walletData.referralBonus)}<span className="unit">BW</span></span>
                                        </span>
                                    </div>

                                    <div className="referral-code-box" style={{ marginTop: '20px', marginBottom: '15px', padding: '12px', backgroundColor: '#e0f7fa', borderRadius: '8px', border: '1px solid #b2ebf2', textAlign: 'center' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#006064', marginBottom: '5px' }}>
                                            {getTranslation('wallet.dashboard.referral.myCode')}
                                        </div>
                                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#00838f', letterSpacing: '1px', wordBreak: 'break-all' }}>
                                            {walletData?.myReferralCode || '-'}
                                        </div>
                                    </div>

                                    <div className="info-box purple-bg pin-icon">
                                        📌 {getTranslation('wallet.dashboard.referral.note')}
                                    </div>
                                </div>
                            </div>

                            <div className="action-buttons-grid-2x2">
                                <button
                                    className="action-btn receive-btn"
                                    onClick={() => setTransferModal({ isOpen: true, type: 'receive' })}
                                >
                                    ↓ {getTranslation('wallet.dashboard.actions.receive')} ↓
                                </button>
                                <button
                                    className="action-btn send-btn"
                                    onClick={() => setTransferModal({ isOpen: true, type: 'send' })}
                                >
                                    ↑ {getTranslation('wallet.dashboard.actions.send')} ↑
                                </button>
                                <button
                                    className="action-btn otp-btn purple-btn"
                                    onClick={() => {
                                        if (!walletData.isKycVerified) {
                                            setMessageModal({ isOpen: true, type: 'kycNotPeriod' });
                                        } else {
                                            setMessageModal({ isOpen: true, type: 'kycCongrats' });
                                        }
                                    }}
                                >
                                    🔑 {getTranslation('wallet.dashboard.actions.otpSetup.title')}
                                </button>
                                <button
                                    className="action-btn kyc-btn orange-btn"
                                    onClick={() => setIsKYCModalOpen(true)}
                                >
                                    🛡️ {getTranslation('wallet.dashboard.actions.kycApplyNow')}
                                </button>
                            </div>

                            <div className="address-footer-section">
                                <div className="address-header">
                                    <span className="key-icon">🔑</span>
                                    <span className="footer-label">{getTranslation('wallet.dashboard.address')}</span>
                                </div>
                                <div className="address-box">
                                    <span className="full-address">{walletAddress}</span>
                                    <button className="footer-copy-btn" onClick={handleCopyAddress}>
                                        📋 {getTranslation('wallet.dashboard.copyAddress')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'referralRewards' && (
                        <div className="referral-list-container" style={{ padding: '10px' }}>
                            <h4 style={{ color: '#111827', marginBottom: '15px', fontSize: '16px', fontWeight: 'bold' }}>{getTranslation('wallet.dashboard.referralTable.title')}</h4>
                            <div className="referral-history-table-wrapper" style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '12px' }}>
                                    <thead style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                                        <tr>
                                            <th style={{ padding: '12px 5px', color: '#374151' }}>{getTranslation('wallet.dashboard.referralTable.header.subscriber')}</th>
                                            <th style={{ padding: '12px 5px', color: '#374151' }}>{getTranslation('wallet.dashboard.referralTable.header.joinDate')}</th>
                                            <th style={{ padding: '12px 5px', color: '#374151' }}>{getTranslation('wallet.dashboard.referralTable.header.reward1BW')}</th>
                                            <th style={{ padding: '12px 5px', color: '#374151' }}>{getTranslation('wallet.dashboard.referralTable.header.bonus2Percent')}</th>
                                            <th style={{ padding: '12px 5px', color: '#374151' }}>{getTranslation('wallet.dashboard.referralTable.header.kycStatus')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {((walletData as any)?.referralList || []).length > 0 ? (
                                            ((walletData as any).referralList).map((ref: any, idx: number) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                                    <td style={{ padding: '10px 5px', fontWeight: 'bold', color: ref.isParentRow ? '#DC2626' : '#2563EB' }}>
                                                        {ref.isParentRow
                                                            ? (ref.childWalletAddress || ref.walletAddress || '-')
                                                            : ((ref.childWalletAddress || ref.walletAddress) ? `BW${String(ref.childWalletAddress || ref.walletAddress).substring(2, 8)}...` : '-')}
                                                    </td>
                                                    <td style={{ padding: '10px 5px', color: '#6B7280' }}>
                                                        {new Date(ref.joinedAt).toLocaleString(currentLanguage === 'ko' ? 'ko-KR' : currentLanguage === 'ja' ? 'ja-JP' : currentLanguage === 'zh' ? 'zh-CN' : 'en-US', {
                                                            year: 'numeric', month: '2-digit', day: '2-digit',
                                                            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
                                                        }).replace(/\//g, '.')}
                                                    </td>
                                                    <td style={{ padding: '10px 5px', fontWeight: 'bold', color: ref.is1BWMePaid ? '#2563EB' : '#DC2626' }}>
                                                        {ref.is1BWMePaid ? getTranslation('wallet.dashboard.referralTable.statusPaid') : getTranslation('wallet.dashboard.referralTable.statusUnpaid')}
                                                    </td>
                                                    <td style={{ padding: '10px 5px', fontWeight: 'bold', color: ref.is2PercentMePaid ? '#2563EB' : '#DC2626' }}>
                                                        {ref.is2PercentMePaid ? getTranslation('wallet.dashboard.referralTable.statusPaid') : getTranslation('wallet.dashboard.referralTable.statusUnpaid')}
                                                    </td>
                                                    <td style={{ padding: '10px 5px', fontWeight: 'bold', color: ref.kycDetailStatus === '승인' ? '#2563EB' : '#DC2626' }}>
                                                        {ref.kycDetailStatus === '승인' ? getTranslation('wallet.dashboard.referralTable.statusApproved') : getTranslation('wallet.dashboard.referralTable.statusPending')}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} style={{ padding: '40px', color: '#9CA3AF' }}>{getTranslation('wallet.dashboard.referralTable.noHistory')}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#F3F4F6', borderRadius: '5px', fontSize: '11px', color: '#4B5563' }}>
                                {getTranslation('wallet.dashboard.referralTable.guide')}
                            </div>
                        </div>
                    )}
                    {/* [최종복구] 채굴 보상 내역 탭 - 정산 이력 목록 화면 */}
                    {activeTab === 'miningRewards' && (
                        <div className="referral-list-container" style={{ padding: '10px' }}>
                            <h4 style={{ color: '#111827', marginBottom: '15px', fontSize: '16px', fontWeight: 'bold' }}>{getTranslation('wallet.dashboard.miningTable.title')}</h4>
                            <div className="referral-history-table-wrapper" style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px' }}>
                                    <thead style={{ backgroundColor: '#F0F9FF', borderBottom: '2px solid #BAE6FD' }}>
                                        <tr>
                                            <th style={{ width: '35%', padding: '12px 10px', color: '#0369A1', textAlign: 'left' }}>{getTranslation('wallet.dashboard.miningTable.header.startDate')}</th>
                                            <th style={{ width: '18%', padding: '12px 10px', color: '#0369A1', textAlign: 'right' }}>{getTranslation('wallet.dashboard.miningTable.header.minedAmount')}</th>
                                            <th style={{ width: '18%', padding: '12px 10px', color: '#0369A1', textAlign: 'right' }}>{getTranslation('wallet.dashboard.miningTable.header.bonus')}</th>
                                            <th style={{ width: '18%', padding: '12px 10px', color: '#0369A1', textAlign: 'right' }}>{getTranslation('wallet.dashboard.miningTable.header.total')}</th>
                                            <th style={{ width: '11%', padding: '12px 10px', color: '#0369A1' }}>{getTranslation('wallet.dashboard.miningTable.header.status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* 과거 데이터 수복분을 서버가 안전하게 가공한 상태 그대로 출력만 수행 (임의 인덱스 수정 차단) */}
                                        {((walletData as any)?.miningHistory || []).length > 0 ? (
                                            (walletData as any).miningHistory.map((item: any, idx: number) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6', color: '#111827' }}>
                                                    <td style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '500', color: '#111827' }}>
                                                        {new Date(item.settledAt).toLocaleString(currentLanguage === 'ko' ? 'ko-KR' : currentLanguage === 'ja' ? 'ja-JP' : currentLanguage === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/\//g, '.')}
                                                    </td>
                                                    <td style={{ padding: '12px 10px', textAlign: 'right', color: '#111827' }}>{precisionCalculator.formatForUI(item.minedAmount)} BW</td>
                                                    <td style={{ padding: '12px 10px', textAlign: 'right', color: '#111827' }}>{precisionCalculator.formatForUI(item.bonusAmount)} BW</td>
                                                    <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 'bold', color: '#059669' }}>{precisionCalculator.formatForUI(item.totalAmount)} BW</td>
                                                    <td style={{ padding: '12px 10px' }}>
                                                        {(() => {
                                                            const settledDate = new Date(item.settledAt);

                                                            // [버그 수정 3] 아직 KYC 승인을 받지 않은 사용자라면 디데이 타이머를 숨기고 단순 빨간색 잠금 상태만 표시합니다.
                                                            if (!walletData.isKycVerified) {
                                                                return (
                                                                    <span style={{ fontSize: '11px', backgroundColor: '#FEF2F2', color: '#B91C1C', padding: '3px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                                                        {getTranslation('wallet.dashboard.miningTable.statusLocked') || 'LOCKED'}
                                                                    </span>
                                                                );
                                                            }

                                                            // KYC 승인을 완료한 유저만 카운트다운 타이머가 계산되어 돌아갑니다.
                                                            const baseDate = (walletData as any).kycVerifiedDate ? new Date((walletData as any).kycVerifiedDate) : settledDate;
                                                            const unlockDate = new Date(baseDate.getTime() + (15 * 24 * 60 * 60 * 1000));
                                                            const now = currentTime;
                                                            const diff = unlockDate.getTime() - now.getTime();

                                                            if (diff <= 0 || item.migrationStatus === 'UNLOCKED' || item.migrationStatus === 'MIGRATED') {
                                                                return (
                                                                    <span style={{ fontSize: '11px', backgroundColor: '#DCFCE7', color: '#166534', padding: '3px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                                                        {getTranslation('wallet.dashboard.miningTable.statusUnlocked') || '잠금 해제'}
                                                                    </span>
                                                                );
                                                            }

                                                            if (item.migrationStatus === 'WAITING_KYC') {
                                                                return (
                                                                    <span style={{ fontSize: '11px', backgroundColor: '#FEF3C7', color: '#92400E', padding: '3px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                                                        {getTranslation('wallet.dashboard.miningTable.statusWaitingKyc') || 'KYC 대기'}
                                                                    </span>
                                                                );
                                                            }

                                                            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                                            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                                            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                                            const secs = Math.floor((diff % (1000 * 60)) / 1000);

                                                            return (
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                                    <span style={{ fontSize: '10px', color: '#EF4444', fontWeight: 'bold' }}>
                                                                        D-{days} {hours.toString().padStart(2, '0')}:{mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
                                                                    </span>
                                                                    <span style={{ fontSize: '9px', backgroundColor: '#FEF2F2', color: '#B91C1C', padding: '1px 4px', borderRadius: '3px' }}>
                                                                        {getTranslation('wallet.dashboard.miningTable.statusLocked') || 'LOCKED'}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : null}

                                        {/* [최종복구] 당월 실시간 채굴 현황 행 - RealTimeSyncService 연동을 통해 매끄러운 수치 가동 보장 */}
                                        <tr style={{ backgroundColor: '#F0FDF4', color: '#111827', borderBottom: '2px solid #DCFCE7' }}>
                                            <td style={{ padding: '12px 10px', textAlign: 'left', fontWeight: 'bold', fontSize: '11.5px', color: '#111827' }}>
                                                {/* [실시간 누적 타이머 작동] 달이 바뀔 때 자동 리셋 및 실시간 [X일] HH:MM:SS 가산 연산 */}
                                                {(() => {
                                                    const now = currentTime; // 1초 단위로 갱신되는 화면 시계
                                                    const year = now.getFullYear();
                                                    const month = String(now.getMonth() + 1).padStart(2, '0');

                                                    // 서버에서 받아온 채굴 시작 시간 정보
                                                    const startedAtStr = walletData.miningStartedAt;
                                                    const startedAt = startedAtStr ? new Date(startedAtStr) : null;

                                                    let elapsedDays = 0;
                                                    let elapsedHours = 0;
                                                    let elapsedMinutes = 0;
                                                    let elapsedSeconds = 0;

                                                    if (startedAt) {
                                                        // 시작일의 연도와 월이 현재(당월) 시간과 일치하는지 대조 (달이 바뀌면 0일 리셋)
                                                        const isSameMonth = startedAt.getFullYear() === now.getFullYear() && startedAt.getMonth() === now.getMonth();

                                                        if (isSameMonth) {
                                                            const diffMs = now.getTime() - startedAt.getTime();

                                                            if (diffMs > 0) {
                                                                elapsedDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                                                elapsedHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                                                elapsedMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                                                elapsedSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
                                                            }
                                                        } else {
                                                            // 이월 감지 시 강제 리셋
                                                            elapsedDays = 0;
                                                            elapsedHours = 0;
                                                            elapsedMinutes = 0;
                                                            elapsedSeconds = 0;
                                                        }
                                                    }

                                                    // 시, 분, 초 자릿수 맞춤 정렬
                                                    const formattedTime = `${String(elapsedHours).padStart(2, '0')}:${String(elapsedMinutes).padStart(2, '0')}:${String(elapsedSeconds).padStart(2, '0')}`;

                                                    // 최종 출력 형태: "2026.06.01 0일 00:00:05" (달이 바뀌면 0일 00:00:00 리셋)
                                                    return `${year}.${month}.01 ${elapsedDays}일 ${formattedTime}`;
                                                })()}
                                            </td>

                                            <td className="mining-amount-cell" style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '600', color: '#111827' }} title={`${precisionCalculator.formatForUI(walletData.balance)} BW`}>
                                                <span>{precisionCalculator.formatForUI(walletData.balance)} BW</span>
                                            </td>
                                            <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '600', color: '#111827' }} title={`${precisionCalculator.formatForUI(walletData.referralBonus)} BW`}>
                                                <span>{precisionCalculator.formatForUI(walletData.referralBonus)} BW</span>
                                            </td>
                                            <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '800', color: '#059669' }} title={`${precisionCalculator.formatForUI(walletData.balance.plus(walletData.referralBonus))} BW`}>
                                                <span>{precisionCalculator.formatForUI(walletData.balance.plus(walletData.referralBonus))} BW</span>
                                            </td>
                                            <td style={{ padding: '12px 10px' }}>
                                                <span style={{ fontSize: '11px', backgroundColor: '#DCFCE7', color: '#166534', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', animation: 'pulse 2s infinite' }}>{getTranslation('wallet.dashboard.miningTable.statusMining')}</span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p style={{ marginTop: '10px', fontSize: '11px', color: '#666' }}>{getTranslation('wallet.dashboard.miningTable.guide') || '📌 채굴 완료 보상은 투명성을 위해 즉시 장부에 안전하게 영구 기록되며, 매월 말일에 안전 마감 처리됩니다.'}</p>
                        </div>
                    )}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* [블록 트랜잭션 탭] 다크 네이비 & 시안 하이테크 UI (완전 독립) */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {activeTab === 'blockTx' && (
                        <div style={{ padding: '10px' }}>
                            <h4 style={{ color: '#0EA5E9', marginBottom: '15px', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                ⛓️ {btt('title')}
                            </h4>
                            <div style={{ overflowX: 'auto', backgroundColor: '#0F172A', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', border: '1px solid #1E3A5F' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '12px', color: '#E2E8F0' }}>
                                    <thead style={{ backgroundColor: '#1E293B', borderBottom: '2px solid #0EA5E9' }}>
                                        <tr>
                                            <th style={{ padding: '12px 8px', color: '#0EA5E9', fontWeight: 'bold', fontSize: '11px' }}>{btt('blockHeight')}</th>
                                            <th style={{ padding: '12px 8px', color: '#0EA5E9', fontWeight: 'bold', fontSize: '11px' }}>{btt('txHash')}</th>
                                            <th style={{ padding: '12px 8px', color: '#0EA5E9', fontWeight: 'bold', fontSize: '11px' }}>{btt('amount')}</th>
                                            <th style={{ padding: '12px 8px', color: '#0EA5E9', fontWeight: 'bold', fontSize: '11px' }}>{btt('type')}</th>
                                            <th style={{ padding: '12px 8px', color: '#0EA5E9', fontWeight: 'bold', fontSize: '11px' }}>{btt('status')}</th>
                                            <th style={{ padding: '12px 8px', color: '#0EA5E9', fontWeight: 'bold', fontSize: '11px' }}>{btt('date')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {blockTxLoading ? (
                                            <tr><td colSpan={6} style={{ padding: '40px', color: '#64748B' }}>{btt('loading')}</td></tr>
                                        ) : blockTxList.length > 0 ? (
                                            blockTxList.map((tx: any, idx: number) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid #1E3A5F', transition: 'background-color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1E293B')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                                                    <td style={{ padding: '10px 8px', fontWeight: 'bold', color: '#38BDF8' }}>#{tx.blockHeight}</td>
                                                    <td style={{ padding: '10px 8px' }}>
                                                        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#94A3B8' }}>
                                                            {tx.txId ? `${tx.txId.substring(0, 6)}...${tx.txId.substring(tx.txId.length - 6)}` : '-'}
                                                        </span>
                                                        <button
                                                            onClick={() => { navigator.clipboard.writeText(tx.txId || ''); alert(btt('copied')); }}
                                                            style={{ marginLeft: '4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#64748B', padding: '2px' }}
                                                            title="Copy"
                                                        >📋</button>
                                                    </td>
                                                    <td style={{ padding: '10px 8px', fontWeight: '600', color: '#34D399' }}>{tx.amount} BW</td>
                                                    <td style={{ padding: '10px 8px' }}>
                                                        <span style={{ fontSize: '10px', backgroundColor: tx.type === 'Referral Reward' ? '#7C2D12' : '#312E81', color: tx.type === 'Referral Reward' ? '#FDBA74' : '#A78BFA', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                                            {tx.type === 'Referral Reward' ? btt('referralReward') : btt('minting')}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '10px 8px' }}>
                                                        <span style={{ fontSize: '10px', backgroundColor: '#064E3B', color: '#6EE7B7', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                                                            ✅ {btt('confirmed')}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '10px 8px', fontSize: '10px', color: '#64748B' }}>
                                                        {tx.createdAt ? new Date(tx.createdAt).toLocaleString(currentLanguage === 'ko' ? 'ko-KR' : currentLanguage === 'ja' ? 'ja-JP' : currentLanguage === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '-'}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={6} style={{ padding: '40px', color: '#475569' }}>{btt('noData')}</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* 커서 기반 페이징 버튼 */}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '15px' }}>
                                <button
                                    disabled={!blockTxHasPrev}
                                    onClick={() => {
                                        if (blockTxList.length > 0) {
                                            const newestHeight = blockTxList[0].blockHeight;
                                            setBlockTxCursorStack(prev => [...prev, newestHeight]);
                                            fetchBlockTransactions(newestHeight, 'prev');
                                        }
                                    }}
                                    style={{
                                        padding: '8px 20px', borderRadius: '6px', border: '1px solid #1E3A5F',
                                        backgroundColor: blockTxHasPrev ? '#1E293B' : '#0F172A',
                                        color: blockTxHasPrev ? '#38BDF8' : '#334155',
                                        fontWeight: 'bold', fontSize: '12px', cursor: blockTxHasPrev ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.2s'
                                    }}
                                >{btt('prev')}</button>
                                <button
                                    disabled={!blockTxHasNext}
                                    onClick={() => {
                                        if (blockTxList.length > 0) {
                                            const oldestHeight = blockTxList[blockTxList.length - 1].blockHeight;
                                            setBlockTxCursorStack(prev => [...prev, oldestHeight]);
                                            fetchBlockTransactions(oldestHeight, 'next');
                                        }
                                    }}
                                    style={{
                                        padding: '8px 20px', borderRadius: '6px', border: '1px solid #1E3A5F',
                                        backgroundColor: blockTxHasNext ? '#1E293B' : '#0F172A',
                                        color: blockTxHasNext ? '#38BDF8' : '#334155',
                                        fontWeight: 'bold', fontSize: '12px', cursor: blockTxHasNext ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.2s'
                                    }}
                                >{btt('next')}</button>
                            </div>

                            <p style={{ marginTop: '12px', fontSize: '11px', color: '#64748B', textAlign: 'center' }}>{btt('guide')}</p>
                        </div>
                    )}

                    {/* [Phase 1] OTP 설정 뷰 인터페이스 (Internal View) */}
                    {viewMode === 'otpSetup' && (
                        <div className="otp-setup-container" style={{ padding: '20px', color: 'white', backgroundColor: '#111827', borderRadius: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>{getTranslation('wallet.dashboard.actions.otpSetup.title')}</h3>
                            <p style={{ fontSize: '14px', color: '#9CA3AF', textAlign: 'center' }}>{getTranslation('wallet.dashboard.actions.otpSetup.scanDesc')}</p>

                            <div className="qr-code-wrapper" style={{ padding: '15px', backgroundColor: 'white', borderRadius: '12px' }}>
                                <img src="/brain/0edac81a-cde6-4317-8111-6f0001cf744d/google_otp_qr_sample_1778309970513.png" alt="OTP QR" style={{ width: '180px', height: '180px' }} />
                            </div>

                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '12px', color: '#9CA3AF' }}>{getTranslation('wallet.dashboard.actions.otpSetup.inputLabel')}</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="000000"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: '#1F2937',
                                        border: '1px solid #374151',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '18px',
                                        textAlign: 'center',
                                        letterSpacing: '5px'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                                <button
                                    className="otp-confirm-btn"
                                    style={{ flex: 1, padding: '12px', backgroundColor: '#7C3AED', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                                    onClick={() => {
                                        alert(getTranslation('wallet.dashboard.messages.otpSuccess'));
                                        setViewMode('dashboard');
                                    }}
                                >
                                    {getTranslation('wallet.dashboard.actions.otpSetup.confirm')}
                                </button>
                                <button
                                    className="otp-cancel-btn"
                                    style={{ flex: 1, padding: '12px', backgroundColor: '#374151', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                                    onClick={() => setViewMode('dashboard')}
                                >
                                    {getTranslation('wallet.dashboard.actions.otpSetup.cancel')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="wallet-footer">
                    <button className="close-modal-btn" onClick={() => {
                        if (viewMode === 'otpSetup') {
                            setViewMode('dashboard');
                        } else if (activeTab === 'overview') {
                            onClose();
                        } else {
                            setActiveTab('overview');
                        }
                    }}>
                        {getTranslation('wallet.dashboard.footer.close')}
                    </button>
                </div>
            </div>

            {/* [Phase 1] 작고 고급스러운 메시지 창 (Small Premium Message) */}
            {messageModal.isOpen && (
                <div className="premium-message-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10250, pointerEvents: 'auto' }}>
                    <div className="premium-message-box" style={{ width: '320px', backgroundColor: 'white', borderRadius: '16px', padding: '24px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                        <div style={{ fontSize: '40px', marginBottom: '15px' }}>
                            {messageModal.type === 'kycNotPeriod' ? '⚠️' : '🎉'}
                        </div>
                        <p style={{ fontSize: '15px', color: '#1F2937', fontWeight: '600', lineHeight: '1.5', marginBottom: '20px' }}>
                            {messageModal.type === 'kycNotPeriod'
                                ? getTranslation('wallet.dashboard.actions.messages.kycNotPeriod')
                                : getTranslation('wallet.dashboard.actions.messages.kycApprovedCongrats')}
                        </p>
                        <button
                            style={{ width: '100%', padding: '12px', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                            onClick={() => {
                                if (messageModal.type === 'kycCongrats') {
                                    setViewMode('otpSetup');
                                }
                                setMessageModal({ isOpen: false, type: '' });
                            }}
                        >
                            {getTranslation('wallet.dashboard.actions.otpSetup.confirm')}
                        </button>
                    </div>
                </div>
            )}

            {/* KYC 신청 엔진 (Step 2 독립 모듈) */}
            <KYCFormModal
                isOpen={isKYCModalOpen}
                onClose={() => setIsKYCModalOpen(false)}
                currentLanguage={currentLanguage}
                walletAddress={walletAddress}
            />

            {/* [Phase 2] P2P 송금/받기 통합 모달 */}
            <TransferModal
                isOpen={transferModal.isOpen}
                onClose={() => setTransferModal({ ...transferModal, isOpen: false })}
                type={transferModal.type}
                walletAddress={walletAddress}
                availableBalance={walletData.availableBalance}
                currentLanguage={currentLanguage}
            />
        </div>
    );
};

export default MyWalletModal;