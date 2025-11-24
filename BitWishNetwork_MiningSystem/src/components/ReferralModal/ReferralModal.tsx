import React, { useState, useEffect } from 'react';
import { LanguageManager } from '../../utils/LanguageManager/LanguageManager';
import './ReferralModal.css';

interface ReferralModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentLanguage?: string;
}

const ReferralModal: React.FC<ReferralModalProps> = ({
    isOpen,
    onClose,
    currentLanguage
}) => {
    const [languageManager] = useState(() => new LanguageManager());
    const [, setForceUpdate] = useState(0);
    const [showSocialShare, setShowSocialShare] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    // Real data states
    const [myReferralCode, setMyReferralCode] = useState<string | null>(null);
    const [friendsInvited, setFriendsInvited] = useState<number>(0);
    const [bonusRate, setBonusRate] = useState<number>(0);

    useEffect(() => {
        if (currentLanguage) {
            languageManager.setLanguage(currentLanguage);
            setForceUpdate(prev => prev + 1);
        }
    }, [currentLanguage, languageManager]);

    // Load wallet data on open
    useEffect(() => {
        if (isOpen) {
            const savedWallet = localStorage.getItem('bw_wallet_data');
            if (savedWallet) {
                try {
                    const parsed = JSON.parse(savedWallet);
                    setMyReferralCode(parsed.myReferralCode || null);
                    setFriendsInvited(parsed.referralCount || 0);
                    setBonusRate(parsed.referralBonusRate || 0);
                } catch (e) {
                    console.error('Failed to load wallet data', e);
                }
            }
        }
    }, [isOpen]);

    const getTranslation = (key: string) => languageManager.getTranslation(key);

    if (!isOpen) return null;

    const handleCopyCode = () => {
        if (!myReferralCode) return;
        navigator.clipboard.writeText(myReferralCode).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };

    const generateReferralCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'REF';
        for (let i = 0; i < 10; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const handleIssueCode = () => {
        // If code already exists, toggle share
        if (myReferralCode) {
            setShowSocialShare(!showSocialShare);
            return;
        }

        // Generate new code
        const newCode = generateReferralCode();
        const savedWallet = localStorage.getItem('bw_wallet_data');

        if (savedWallet) {
            try {
                const parsed = JSON.parse(savedWallet);
                parsed.myReferralCode = newCode;
                // Initialize stats if missing
                if (parsed.referralCount === undefined) parsed.referralCount = 0;
                if (parsed.referralBonusRate === undefined) parsed.referralBonusRate = 0;

                localStorage.setItem('bw_wallet_data', JSON.stringify(parsed));

                setMyReferralCode(newCode);
                setFriendsInvited(0);
                setBonusRate(0);

                alert(getTranslation('referral.codeGenerated'));
            } catch (e) {
                console.error('Failed to save referral code', e);
                alert(getTranslation('referral.codeGenerationError'));
            }
        } else {
            alert(getTranslation('secondPassword.addressNotFound')); // Wallet not found message
        }
    };

    const handleSocialShare = (platform: string) => {
        if (!myReferralCode) return;
        const message = getTranslation('referral.modal.shareMessage').replace('{code}', myReferralCode);
        const encodedMessage = encodeURIComponent(message);

        switch (platform) {
            case 'kakao':
                alert('Kakao SDK required.');
                break;
            case 'telegram':
                window.open(`https://t.me/share/url?url=${encodedMessage}`, '_blank');
                break;
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?text=${encodedMessage}`, '_blank');
                break;
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedMessage}`, '_blank');
                break;
            case 'email':
                window.location.href = `mailto:?subject=BitWish Network Invite&body=${encodedMessage}`;
                break;
        }
    };

    return (
        <div className="referral-modal-overlay" onClick={onClose}>
            <div className="referral-modal" onClick={(e) => e.stopPropagation()}>
                {/* 헤더 */}
                <div className="referral-header">
                    <div className="referral-icon">🎁</div>
                    <h2 className="referral-title">{getTranslation('referral.modal.title')}</h2>
                    <p className="referral-subtitle">{getTranslation('referral.modal.subtitle')}</p>
                </div>

                {/* 추천 코드 섹션 */}
                <div className="referral-code-section">
                    <label className="code-label">{getTranslation('referral.modal.myCode')}</label>
                    <div className="code-display">
                        <span className="code-text">{myReferralCode || '----------------'}</span>
                        {myReferralCode && (
                            <button
                                className={`copy-btn ${copySuccess ? 'success' : ''}`}
                                onClick={handleCopyCode}
                            >
                                {copySuccess ? '✓ ' + getTranslation('referral.modal.copied') : '📋 ' + getTranslation('referral.modal.copyCode')}
                            </button>
                        )}
                    </div>
                </div>

                {/* 코드 발급 버튼 (코드가 없을 때만 '발급', 있으면 '공유하기'로 변경 가능하지만 디자인 유지 위해 버튼 기능 분기) */}
                <button className="issue-code-btn" onClick={handleIssueCode}>
                    {myReferralCode ? '🎁 ' + getTranslation('referral.modal.shareVia') : '🎁 ' + getTranslation('referral.modal.issueCode')}
                </button>

                {/* 소셜 공유 그리드 */}
                {showSocialShare && myReferralCode && (
                    <div className="social-share-section">
                        <h3 className="share-title">{getTranslation('referral.modal.shareVia')}</h3>
                        <div className="social-grid">
                            <button className="social-btn kakao" onClick={() => handleSocialShare('kakao')}>
                                <span className="social-icon">💬</span>
                                <span className="social-name">{getTranslation('referral.modal.social.kakao')}</span>
                            </button>
                            <button className="social-btn telegram" onClick={() => handleSocialShare('telegram')}>
                                <span className="social-icon">✈️</span>
                                <span className="social-name">{getTranslation('referral.modal.social.telegram')}</span>
                            </button>
                            <button className="social-btn twitter" onClick={() => handleSocialShare('twitter')}>
                                <span className="social-icon">❌</span>
                                <span className="social-name">{getTranslation('referral.modal.social.twitter')}</span>
                            </button>
                            <button className="social-btn facebook" onClick={() => handleSocialShare('facebook')}>
                                <span className="social-icon">📘</span>
                                <span className="social-name">{getTranslation('referral.modal.social.facebook')}</span>
                            </button>
                            <button className="social-btn email" onClick={() => handleSocialShare('email')}>
                                <span className="social-icon">📧</span>
                                <span className="social-name">{getTranslation('referral.modal.social.email')}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* 통계 대시보드 */}
                <div className="stats-dashboard">
                    <div className="stat-card">
                        <div className="stat-icon">👥</div>
                        <div className="stat-value">{friendsInvited}</div>
                        <div className="stat-label">{getTranslation('referral.modal.stats.invited')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">⭐</div>
                        <div className="stat-value">{bonusRate}%</div>
                        <div className="stat-label">{getTranslation('referral.modal.stats.bonusRate')}</div>
                    </div>
                </div>

                {/* 푸터 */}
                <div className="referral-footer">
                    <button className="close-btn" onClick={onClose}>
                        {getTranslation('referral.modal.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReferralModal;
