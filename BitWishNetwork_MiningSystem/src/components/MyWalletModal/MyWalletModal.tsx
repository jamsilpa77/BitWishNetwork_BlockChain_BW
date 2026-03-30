import React, { useState, useEffect } from 'react';
import { walletService } from '../../services/BlockchainService/WalletService';
import { apiService } from '../../services/ApiService';
import { LanguageManager } from '@/utils/LanguageManager/LanguageManager';
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
        myReferralCode?: string;
        referralList?: any[];
    }>({
        balance: 0,
        availableBalance: 0,
        referralReward: 0,
        referralBonus: 0,
        myReferralCode: '',
        referralList: []
    }); // [Step 4 Fix] null 상태 제거하여 실시간 동기화 즉시 활성화
    const [isRotating, setIsRotating] = useState(false);

    const fetchWalletData = async () => {
        // [Step 2-2 Fix] 로컬 스토리지 대신 서버 API 호출로 변경 (데이터 동기화 보장)
        const currentAddress = walletService.getCurrentWalletAddress();
        if (!currentAddress) return;

        setWalletAddress(currentAddress);

        try {
            // [중요] ApiService.getUserStatus는 { success, user, miningState }를 반환함
            const response = await apiService.getUserStatus(currentAddress);
            if (response?.success) {
                const u = response.user;
                const m = response.miningState;

                // [Step 4 Fix] response.data가 아닌 실제 필드(user, miningState)로 정확히 매핑
                setWalletData({
                    balance: parseFloat(m?.accumulatedReward || '0'),
                    availableBalance: parseFloat(m?.availableBalance || '0'),

                    // [중요] 사용자 보상 정보 매핑
                    referralReward: parseFloat(u?.referralRewardStorage || '0'), // 1BW
                    referralBonus: parseFloat(u?.referralBonusStorage || '0'),   // 2%

                    myReferralCode: u?.myReferralCode || '',
                    referralList: u?.referralList || []
                });
            }
        } catch (e) {
            console.error('Wallet fetch error:', e);
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
                                    if (!window.confirm(getTranslation('wallet.logout.confirm') || '로그아웃 하시겠습니까?')) return;

                                    localStorage.removeItem('wallet_auth_session');
                                    localStorage.removeItem('bw_auth_session');
                                    localStorage.removeItem('bw_mining_auth');

                                    setWalletAddress('');
                                    setWalletData({
                                        balance: 0,
                                        availableBalance: 0,
                                        referralReward: 0,
                                        referralBonus: 0,
                                        myReferralCode: ''
                                    });

                                    window.dispatchEvent(new Event('BW_WALLET_LOGOUT'));
                                    onClose();
                                }}>{getTranslation('wallet.dashboard.logout')}</button>

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
                                    backgroundColor: '#4CAF50', // Green
                                    color: 'white',
                                    border: 'none',
                                    padding: '5px 12px',
                                    borderRadius: '5px',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}
                                onClick={() => {
                                    if (onOpenMining) {
                                        onClose(); // Close wallet modal first
                                        onOpenMining(walletAddress); // [Fix] Pass walletAddress
                                    } else {
                                        alert('Mining function not connected.');
                                    }
                                }}
                            >
                                ⛏️ 마이닝 시작
                            </button>

                            {/* 2차 비번 초기화 버튼 (Moved Here) */}
                            <button
                                className="reset-pw-btn"
                                style={{
                                    backgroundColor: '#FF9800',
                                    color: 'white',
                                    border: 'none',
                                    padding: '5px 12px',
                                    borderRadius: '5px',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}
                                onClick={async () => {
                                    if (window.confirm('정말로 2차 비밀번호를 초기화하시겠습니까?\n(마이닝 페이지 접속 시 새로 설정해야 합니다)')) {
                                        const success = await walletService.resetSecondPassword(walletAddress);
                                        if (success) {
                                            alert('2차 비밀번호가 초기화되었습니다.\n마이닝 페이지에서 새 비밀번호를 설정해주세요.');
                                            onClose();
                                        } else {
                                            alert('초기화 실패. 다시 시도해주세요.');
                                        }
                                    }
                                }}
                            >
                                2차 비번 초기화
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
                                    <h3 className="card-title" style={{ display: 'block', fontSize: '1.2rem', fontWeight: 800, color: '#111827', marginBottom: '20px', marginTop: 0 }}>잔액</h3>

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
                                    <h3 className="card-title purple-text" style={{ display: 'block', fontSize: '1.2rem', fontWeight: 800, color: '#7C3AED', marginBottom: '20px', marginTop: 0 }}>추천 보너스</h3>

                                    <div className="balance-row">
                                        {/* [Step 2-2 Fix] UI 텍스트 강제 표준화 (1BW 가입보상) */}
                                        <span className="balance-label">추천 보상 보관함:</span>
                                        <span className="balance-value orange">{(walletData?.referralReward || 0).toFixed(8)}<span className="unit">BW</span></span>
                                    </div>

                                    <div className="balance-row mt-20">
                                        <div className="balance-label-multiline">
                                            {/* [Step 2-2 Fix] UI 텍스트 강제 표준화 (마이닝 페이지와 100% 일치) */}
                                            <div>추천 보너스 보관함</div>
                                        </div>
                                        <span className="balance-value-wrapper">
                                            <span className="balance-value orange">{(walletData?.referralBonus || 0).toFixed(8)}<span className="unit">BW</span></span>
                                        </span>
                                    </div>

                                    <div className="referral-code-box" style={{ marginTop: '20px', marginBottom: '15px', padding: '12px', backgroundColor: '#e0f7fa', borderRadius: '8px', border: '1px solid #b2ebf2', textAlign: 'center' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#006064', marginBottom: '5px' }}>
                                            추천인 코드:
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

                            <div className="action-buttons-grid">
                                <button className="action-btn receive-btn">
                                    ↓ {getTranslation('wallet.dashboard.actions.receive')} ↓
                                </button>
                                <button className="action-btn send-btn">
                                    ↑ {getTranslation('wallet.dashboard.actions.send')} ↑
                                </button>
                                <button className="action-btn otp-btn">
                                    🗝️ {getTranslation('wallet.dashboard.actions.otp')}
                                </button>
                                <button className="action-btn kyc-btn">
                                    🛡️ {getTranslation('wallet.dashboard.actions.kyc')}
                                </button>
                            </div>

                            <button className="kyc-disabled-btn">
                                🆔 {getTranslation('wallet.dashboard.actions.kycDisabled')}
                            </button>

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
                            <h4 style={{ color: '#111827', marginBottom: '15px', fontSize: '16px', fontWeight: 'bold' }}>- 가입자 목록 -</h4>
                            <div className="referral-history-table-wrapper" style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '12px' }}>
                                    <thead style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                                        <tr>
                                            <th style={{ padding: '12px 5px', color: '#374151' }}>가입자</th>
                                            <th style={{ padding: '12px 5px', color: '#374151' }}>가입날짜</th>
                                            <th style={{ padding: '12px 5px', color: '#374151' }}>지급 보상(1BW)</th>
                                            <th style={{ padding: '12px 5px', color: '#374151' }}>지급 보너스(2%)</th>
                                            <th style={{ padding: '12px 5px', color: '#374151' }}>KYC 현황</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {((walletData as any)?.referralList || []).length > 0 ? (
                                            ((walletData as any).referralList).map((ref: any, idx: number) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                                    <td style={{ padding: '10px 5px', fontWeight: 'bold', color: '#374151' }}>
                                                        {ref.childWalletAddress ? `BW${ref.childWalletAddress.substring(2, 8)}...` : '-'}
                                                    </td>
                                                    <td style={{ padding: '10px 5px', color: '#6B7280' }}>
                                                        {new Date(ref.joinedAt).toLocaleString('ko-KR', {
                                                            year: 'numeric', month: '2-digit', day: '2-digit',
                                                            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
                                                        }).replace(/\//g, '.')}
                                                    </td>
                                                    <td style={{ padding: '10px 5px', fontWeight: 'bold', color: ref.is1BWMePaid ? '#2563EB' : '#DC2626' }}>
                                                        {ref.is1BWMePaid ? '지급' : '미지급'}
                                                    </td>
                                                    <td style={{ padding: '10px 5px', fontWeight: 'bold', color: ref.is2PercentMePaid ? '#2563EB' : '#DC2626' }}>
                                                        {ref.is2PercentMePaid ? '지급' : '미지급'}
                                                    </td>
                                                    <td style={{ padding: '10px 5px', fontWeight: 'bold', color: ref.kycDetailStatus === '승인' ? '#2563EB' : '#DC2626' }}>
                                                        {ref.kycDetailStatus || '미승인'}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} style={{ padding: '40px', color: '#9CA3AF' }}>가입 내역이 없습니다.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#F3F4F6', borderRadius: '5px', fontSize: '11px', color: '#4B5563' }}>
                                💡 본인의 추천 코드로 가입자가 발생하면 내역에 즉시 등록됩니다.
                            </div>
                        </div>
                    )}
                    {(activeTab !== 'overview' && activeTab !== 'referralRewards') && (
                        <div className="overview-container">
                            <p style={{ textAlign: 'center', color: '#999', marginTop: '50px' }}>
                                {getTranslation('wallet.dashboard.tabs.' + activeTab)} - Coming Soon
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="wallet-footer">
                    <button className="close-modal-btn" onClick={() => {
                        if (activeTab === 'overview') {
                            onClose();
                        } else {
                            setActiveTab('overview');
                        }
                    }}>
                        {getTranslation('wallet.dashboard.footer.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// 로그아웃 핸들러는 컴포넌트 내부로 이동


export default MyWalletModal;
