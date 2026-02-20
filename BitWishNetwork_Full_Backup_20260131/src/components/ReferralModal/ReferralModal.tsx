import React, { useState, useEffect } from 'react';
import { LanguageManager } from '../../utils/LanguageManager/LanguageManager';
import { apiService } from '@/services/ApiService';
import { Decimal } from 'decimal.js';
import './ReferralModal.css';

interface ReferralModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentLanguage?: string;
    walletAddress?: string; // 지갑 주소 prop 추가 필요
}

const ReferralModal: React.FC<ReferralModalProps> = ({
    isOpen,
    onClose,
    currentLanguage,
    walletAddress
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

    // Load user data from server on open
    useEffect(() => {
        if (isOpen && walletAddress) {
            apiService.getUserStatus(walletAddress).then((data) => {
                if (data) {
                    // User 정보에서 추천 코드 가져오기 (API 응답 구조에 따라 조정 필요)
                    // 현재 getUserStatus는 mining/status를 호출하므로 User 정보가 없을 수 있음.
                    // 따라서 User 정보를 포함하도록 백엔드 API 수정이 필요할 수 있으나,
                    // 일단 miningState의 referralCount는 확실히 있음.
                    // myReferralCode는 User 모델에 있으므로, 별도 조회 혹은 통합 조회가 필요.
                    // 임시로 localStorage 백업 사용 혹은 API 확장이 이상적.
                    // 여기서는 API가 확장되었다고 가정하거나, WalletService에서 가져온 로컬 데이터를 1차로 쓰고
                    // 서버 데이터로 보정하는 방식을 사용.

                    // 1. [절대 원칙] 관리자 지갑 주소일 경우 추천 코드 강제 박제
                    if (walletAddress === 'BW9F5FF090231236037F250A523B4FC320FB44BFA8') {
                        setMyReferralCode('REF9F5FF0909DC5');
                    } else {
                        // 일반 유저인 경우 로컬에서 코드 가져오기 (지갑 생성 시 저장된 것)
                        const savedWallet = localStorage.getItem('bw_wallet_data');
                        if (savedWallet) {
                            const parsed = JSON.parse(savedWallet);
                            setMyReferralCode(parsed.myReferralCode || null);
                        }
                    }

                    // 2. 서버에서 통계 가져오기
                    if (data.miningState) {
                        const count = data.miningState.referralCount || 0;
                        setFriendsInvited(count);
                        setBonusRate(data.miningState.totalBonusRate || 0); // 서버에서 내려주는 정확한 합계 보너스율 사용
                    }
                }
            }).catch(err => console.error('Failed to load referral stats:', err));
        }
    }, [isOpen, walletAddress]);

    const getTranslation = (key: string) => languageManager.getTranslation(key);

    if (!isOpen) return null;

    const handleCopyCode = () => {
        if (!myReferralCode) return;
        navigator.clipboard.writeText(myReferralCode).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };

    const handleShareToggle = () => {
        setShowSocialShare(!showSocialShare);
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
                        <span className="code-text">{myReferralCode || 'Loading...'}</span>
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

                {/* 공유하기 버튼 */}
                <button className="issue-code-btn" onClick={handleShareToggle}>
                    {'🎁 ' + getTranslation('referral.modal.shareVia')}
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
