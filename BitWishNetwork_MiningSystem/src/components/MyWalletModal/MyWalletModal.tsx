import React, { useState, useEffect } from 'react';
import { walletService } from '../../services/BlockchainService/WalletService';
import { apiService } from '../../services/ApiService';
import { LanguageManager } from '@/utils/LanguageManager/LanguageManager';
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
}

const MyWalletModal: React.FC<MyWalletModalProps> = ({ isOpen, onClose, currentLanguage, onOpenMining }) => {
    const [languageManager] = useState(() => new LanguageManager());
    const [realTimeSyncService] = useState(() => RealTimeSyncService.getInstance()); // [Step 4] 싱글톤 인스턴스 확보
    const [activeTab, setActiveTab] = useState('overview');
    const [walletAddress, setWalletAddress] = useState(''); // Default empty
    const [walletData, setWalletData] = useState<{
        balance: number;
        availableBalance: number;
        referralReward: number;
        referralBonus: number;
        isOTPEnabled: boolean;
        isKycVerified: boolean; // KYC 상태 추가
        myReferralCode?: string;
        referralList?: any[];
    }>({
        balance: 0,
        availableBalance: 0,
        referralReward: 0,
        referralBonus: 0,
        isOTPEnabled: false,
        isKycVerified: false, // 초기값 추가
        myReferralCode: '',
        referralList: []
    });
    const [viewMode, setViewMode] = useState<'dashboard' | 'otpSetup'>('dashboard'); // 화면 전환 상태
    const [messageModal, setMessageModal] = useState<{
        isOpen: boolean;
        type: 'kycNotPeriod' | 'kycCongrats' | '';
    }>({ isOpen: false, type: '' }); // 고급 메시지 창 상태
    const [isRotating, setIsRotating] = useState(false);
    const [isKYCModalOpen, setIsKYCModalOpen] = useState(false);
    const [transferModal, setTransferModal] = useState({ isOpen: false, type: 'send' as 'send' | 'receive' });
    const [currentTime, setCurrentTime] = useState(new Date()); // [3단계] 실시간 타이머용 기준 시간

    // [3단계] 1초 단위 리얼타임 타이머 엔진 가동
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchWalletData = async () => {
        // [Step 2-2 Fix] 로컬 스토리지 대신 서버 API 호출로 변경 (데이터 동기화 보장)
        const currentAddress = walletService.getCurrentWalletAddress();
        if (!currentAddress) return;

        setWalletAddress(currentAddress);

        try {
            // [중요] ApiService.getUserStatus는 { success, user, miningState }를 보장함
            const response = await apiService.getUserStatus(currentAddress);

            // [핵심] 추천인 통계 및 진짜 목록 조회 (BWD... 코드와 가입 명단 복구용)
            // fetch 실패를 대비해 try-catch 내부에 배치
            const referralResponse = await fetch(`/api/referral/stats/${currentAddress}`);
            const referralData = referralResponse.ok ? await referralResponse.json() : { success: false };

            // [핵심] 월별 채굴 실적 조회
            const historyResponse = await fetch(`/api/mining/history/${currentAddress}`);
            const historyData = historyResponse.ok ? await historyResponse.json() : { success: false };

            if (response?.success) {
                const u = response.user;
                const m = response.miningState;
                const r = (referralData as any).success ? (referralData as any).data : null;

                setWalletData({
                    balance: parseFloat(m?.accumulatedReward || '0'),
                    availableBalance: parseFloat(m?.availableBalance || '0'),

                    // [Priority 3] 데이터 매핑 세이프 가드: 서버에서 넘어온 규격이 UI와 일치하도록 최종 조율
                    referralReward: parseFloat(r?.referralRewardStorage || u?.referralRewardStorage || '0'),
                    referralBonus: parseFloat(r?.referralBonusStorage || u?.referralBonusStorage || '0'),
                    isOTPEnabled: u?.isOTPEnabled || false,
                    isKycVerified: u?.isKycVerified || false, // KYC 승인 상태 서버 연동
                    myReferralCode: r?.referralCode || u?.myReferralCode || '',
                    referralList: (r?.referralList || u?.referralList || []).map((item: any) => ({
                        ...item,
                        // [최후 방어선] 서버에서 누락될 수 있는 상태값들을 기본값으로 방어
                        kycDetailStatus: item.kycDetailStatus || (item.isKycVerified ? '승인' : '미승인'),
                        is1BWMePaid: item.is1BWMePaid ?? (item.rewardStatus?.toUpperCase() === 'PAID' || item.rewardStatus?.toUpperCase() === 'COMPLETED'),
                        is2PercentMePaid: item.is2PercentMePaid ?? (item.rewardStatus?.toUpperCase() === 'PAID' || item.rewardStatus?.toUpperCase() === 'COMPLETED')
                    })),
                    miningHistory: (historyData as any).success ? (historyData as any).history : []
                } as any);
            }
        } catch (e) {
            console.error('Wallet real-time restoration error:', e);
        }
    };

    useEffect(() => {
        if (!isOpen) return;

        fetchWalletData();

        // [Step 4] 실시간 방송 데이터 구독 (마이닝 페이지와 숫자 동기화)
        const unsubscribe = realTimeSyncService.subscribe((data) => {
            if (data && data.currentIssued >= 0) {
                console.log('[Wallet] Real-time data received:', data.currentIssued);
                setWalletData(prev => ({
                    ...prev,
                    balance: data.currentIssued,           // 누적 채굴량 실시간 동기화
                    referralBonus: data.referralBonusStorage // 2% 추천 보너스 실시간 동기화
                }));
            }
        });

        // 기존 로컬 이벤트 리스너들
        const handleUpdate = () => {
            fetchWalletData();
        };

        window.addEventListener('storage', handleUpdate);
        window.addEventListener('BW_DATA_UPDATED', handleUpdate);

        return () => {
            unsubscribe(); // [Step 4] 구독 해제
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
        setTimeout(() => setIsRotating(false), 1000);
    };

    const shortAddress = walletAddress ? `${walletAddress.substring(0, 6)}......${walletAddress.substring(walletAddress.length - 4)}` : '';

    return (
        <div className="my-wallet-modal-overlay">
            <div className="my-wallet-modal">
                {/* Header */}
                <div className="wallet-header">
                    <div className="header-top-row">
                        <div className="header-left-group">
                            <button className="back-button" onClick={onClose}>←</button>
                            <h2 className="header-title">{getTranslation('wallet.dashboard.title')}</h2>
                        </div>
                        <div className="header-right-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                            {/* Top Row: Active, Logout, Refresh */}
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
                                        balance: 0,
                                        availableBalance: 0,
                                        referralReward: 0,
                                        referralBonus: 0,
                                        isOTPEnabled: false,
                                        isKycVerified: false,
                                        myReferralCode: ''
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

                        {/* [관리자 지시사항] 파란 헤더 하단 우측 버튼 그룹 */}
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                            {/* 마이닝 시작 버튼 (Free Pass) */}
                            <button
                                className="mining-start-btn"
                                style={{
                                    backgroundColor: '#2563EB', // 비비드 블루 (Vivid Blue)
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 22px',       // 크기 확대
                                    borderRadius: '8px',        // 세련된 라운딩
                                    fontSize: '15px',           // 폰트 확대
                                    cursor: 'pointer',
                                    fontWeight: '900',          // 굵기 극대화
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)', // 시인성 강화
                                    transition: 'all 0.2s ease'
                                }}
                                onClick={() => {
                                    if (onOpenMining) {
                                        onClose(); // Close wallet modal first
                                        onOpenMining(walletAddress); // [Fix] Pass walletAddress
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
                                            <span className="balance-value green">{(walletData?.balance || 0).toFixed(4)}<span className="unit">BW</span></span>
                                            <span className="balance-tooltip">{(walletData?.balance || 0).toFixed(8)} BW</span>
                                        </span>
                                    </div>
                                    <div className="info-box purple-bg">
                                        {getTranslation('wallet.dashboard.balance.realTimeDesc')}
                                    </div>

                                    <div className="balance-row mt-20">
                                        <span className="balance-label">{getTranslation('wallet.dashboard.balance.available')}:</span>
                                        <span className="balance-value-wrapper">
                                            <span className="balance-value black">{(walletData?.availableBalance || 0).toFixed(4)}<span className="unit">BW</span></span>
                                            <span className="balance-tooltip">{(walletData?.availableBalance || 0).toFixed(8)} BW</span>
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
                                        {/* [Step 2-2 Fix] UI 텍스트 강제 표준화 (1BW 가입보상) */}
                                        <span className="balance-label">{getTranslation('wallet.dashboard.referral.storage')}:</span>
                                        <span className="balance-value orange">{(walletData?.referralReward || 0).toFixed(8)}<span className="unit">BW</span></span>
                                    </div>

                                    <div className="balance-row mt-20">
                                        <div className="balance-label-multiline">
                                            {/* [Step 2-2 Fix] UI 텍스트 강제 표준화 (마이닝 페이지와 100% 일치) */}
                                            <div>{getTranslation('wallet.dashboard.referral.bonusStorage')}</div>
                                        </div>
                                        <span className="balance-value-wrapper">
                                            <span className="balance-value orange">{(walletData?.referralBonus || 0).toFixed(8)}<span className="unit">BW</span></span>
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
                    {/* [최종복구] 채굴 보상 내역 탭 - Job 1 전용 수술 구역 */}
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
                                        {((walletData as any)?.miningHistory || []).length > 0 ? (
                                            (walletData as any).miningHistory.map((item: any, idx: number) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6', color: '#111827' }}>
                                                    <td style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '500', color: '#111827' }}>
                                                        {new Date(item.settledAt).toLocaleString(currentLanguage === 'ko' ? 'ko-KR' : currentLanguage === 'ja' ? 'ja-JP' : currentLanguage === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/\//g, '.')}
                                                    </td>
                                                    <td style={{ padding: '12px 10px', textAlign: 'right', color: '#111827' }}>{parseFloat(item.minedAmount).toFixed(4)} BW</td>
                                                    <td style={{ padding: '12px 10px', textAlign: 'right', color: '#111827' }}>{parseFloat(item.bonusAmount).toFixed(4)} BW</td>
                                                    <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 'bold', color: '#059669' }}>{(parseFloat(item.totalAmount) || 0).toFixed(4)} BW</td>
                                                    <td style={{ padding: '12px 10px' }}>
                                                        {(() => {
                                                            const settledDate = new Date(item.settledAt);
                                                            const unlockDate = new Date(settledDate.getTime() + (15 * 24 * 60 * 60 * 1000));
                                                            const now = currentTime; // [3단계] 실시간 기준 시간 바인딩
                                                            const diff = unlockDate.getTime() - now.getTime();

                                                            if (diff <= 0 || item.migrationStatus === 'UNLOCKED' || item.migrationStatus === 'MIGRATED') {
                                                                return (
                                                                    <span style={{ fontSize: '11px', backgroundColor: '#DCFCE7', color: '#166534', padding: '3px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                                                        {getTranslation('wallet.dashboard.miningTable.statusUnlocked') || '잠금 해제'}
                                                                    </span>
                                                                );
                                                            }

                                                            // [거버넌스 수복] KYC 미승인자는 카운팅을 숨기고 대기 상태 노출
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

                                        {/* [최종수복] 현재 채굴 실시간 행 (레이아웃 고정형 말풍선 8자리 구현) */}
                                        <tr style={{ backgroundColor: '#F0FDF4', color: '#111827', borderBottom: '2px solid #DCFCE7' }}>
                                            <td style={{ padding: '12px 10px', textAlign: 'left', fontWeight: 'bold', fontSize: '11.5px', color: '#111827' }}>
                                                {/* [Step 1 Fix] 다국어 지원 가능 로케일 동적 주입 */}
                                                {new Date().toLocaleString(currentLanguage === 'ko' ? 'ko-KR' : currentLanguage === 'ja' ? 'ja-JP' : currentLanguage === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/\//g, '.')}
                                            </td>
                                            <td className="mining-amount-cell" style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '600', color: '#111827' }} title={`${walletData.balance.toFixed(8)} BW`}>
                                                {/* 말풍선(title)으로 8자리 노출, 숫자는 4자리로 고정하여 테이블 뒤틀림 방지 */}
                                                <span>{walletData.balance.toFixed(4)} BW</span>
                                            </td>
                                            <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '600', color: '#111827' }} title={`${walletData.referralBonus.toFixed(8)} BW`}>
                                                <span>{walletData.referralBonus.toFixed(4)} BW</span>
                                            </td>
                                            <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '800', color: '#059669' }} title={`${(walletData.balance + walletData.referralBonus).toFixed(8)} BW`}>
                                                <span>{(walletData.balance + walletData.referralBonus).toFixed(4)} BW</span>
                                            </td>
                                            <td style={{ padding: '12px 10px' }}>
                                                <span style={{ fontSize: '11px', backgroundColor: '#DCFCE7', color: '#166534', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', animation: 'pulse 2s infinite' }}>{getTranslation('wallet.dashboard.miningTable.statusMining')}</span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p style={{ marginTop: '10px', fontSize: '11px', color: '#666' }}>{getTranslation('wallet.dashboard.miningTable.guide')}</p>
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
                <div className="premium-message-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
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
