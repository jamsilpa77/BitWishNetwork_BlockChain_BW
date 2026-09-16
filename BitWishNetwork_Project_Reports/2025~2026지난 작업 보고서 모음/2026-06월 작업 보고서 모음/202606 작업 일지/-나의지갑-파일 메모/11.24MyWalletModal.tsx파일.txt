import React, { useState, useEffect } from 'react';
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

interface MyWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentLanguage: string;
}

const MyWalletModal: React.FC<MyWalletModalProps> = ({ isOpen, onClose, currentLanguage }) => {
    const [languageManager] = useState(() => new LanguageManager());
    const [activeTab, setActiveTab] = useState('overview');
    const [walletAddress, setWalletAddress] = useState('BW0000000000000000000000000000000000000000'); // Default placeholder
    const [walletData, setWalletData] = useState<{
        balance: number;
        availableBalance: number;
        referralReward: number;
        referralBonus: number;
        myReferralCode?: string;
    } | null>(null);
    const [isRotating, setIsRotating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Load wallet data from local storage if available (Independent)
            const savedWallet = localStorage.getItem('bw_wallet_data');
            if (savedWallet) {
                try {
                    const parsed = JSON.parse(savedWallet);
                    if (parsed.address) setWalletAddress(parsed.address);
                    setWalletData({
                        balance: parsed.balance || 0,
                        availableBalance: parsed.availableBalance || 0,
                        referralReward: parsed.referralReward || 0,
                        referralBonus: parsed.referralBonus || 0,
                        myReferralCode: parsed.myReferralCode || ''
                    });
                } catch (e) {
                    console.error('Failed to load wallet data', e);
                }
            }
        }
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
                        <div className="header-right-group">
                            <div className="status-badge">
                                <div className="status-dot"></div>
                                <span>{getTranslation('wallet.dashboard.statusActive')}</span>
                            </div>
                            <button className="logout-btn">{getTranslation('wallet.dashboard.logout')}</button>
                            <button className={`refresh-btn ${isRotating ? 'rotating' : ''}`} onClick={handleRefresh}>
                                ↻
                            </button>
                        </div>
                    </div>
                    <div className="header-address-row">
                        <span className="header-address-label">{getTranslation('wallet.dashboard.address')}:</span>
                        <span className="header-address-value">{shortAddress}</span>
                        <button className="header-copy-btn" onClick={handleCopyAddress}>
                            📋 {getTranslation('wallet.dashboard.copyAddress')}
                        </button>
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
                                        <span className="balance-label">{getTranslation('wallet.dashboard.referral.storage')}:</span>
                                        <span className="balance-value orange">{walletData?.referralReward || 0}<span className="unit">BW</span></span>
                                    </div>

                                    <div className="balance-row mt-20">
                                        <div className="balance-label-multiline">
                                            <div>추천보너스 보상</div>
                                            <div>보관함</div>
                                        </div>
                                        <span className="balance-value-wrapper">
                                            <span className="balance-value orange">{(walletData?.referralBonus || 0).toFixed(4)}<span className="unit">BW</span></span>
                                            <span className="balance-tooltip">{(walletData?.referralBonus || 0).toFixed(8)} BW</span>
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
                    {activeTab !== 'overview' && (
                        <div className="overview-container">
                            <p style={{ textAlign: 'center', color: '#999', marginTop: '50px' }}>
                                {getTranslation('wallet.dashboard.tabs.' + activeTab)} - Coming Soon
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="wallet-footer">
                    <button className="close-modal-btn" onClick={onClose}>
                        {getTranslation('wallet.dashboard.footer.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MyWalletModal;
