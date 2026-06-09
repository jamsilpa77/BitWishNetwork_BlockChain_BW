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
    isActive?: boolean;
    onFocus?: () => void;
}

const ReferralModal: React.FC<ReferralModalProps> = ({
    isOpen,
    onClose,
    currentLanguage,
    walletAddress,
    isActive,
    onFocus
}) => {
    const [languageManager] = useState(() => new LanguageManager());
    const [, setForceUpdate] = useState(0);
    const [showSocialShare, setShowSocialShare] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    // Real data states
    const [myReferralCode, setMyReferralCode] = useState<string | null>(null);
    const [friendsInvited, setFriendsInvited] = useState<number>(0);
    const [bonusRate, setBonusRate] = useState<number>(0);

    // [Step 1-2] 드래그 및 위치 상태 관리 로직 이식
    // [Step 6] 1프레임 위치 오류(잔상) 방지를 위한 렌더링 즉시 초기값 할당
    const [position, setPosition] = useState(() => {
        if (typeof window !== 'undefined') {
            return { x: (window.innerWidth - 450) / 2, y: 450 };
        }
        return { x: 0, y: 450 };
    });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // [Step 5-2 & 6.3] 오픈/클로즈 양방향에서 좌표를 리셋하여 유령 궤적(Ghosting) 원천 차단
    useEffect(() => {
        // isOpen이 true든 false든 상태가 변할 때마다 무조건 중앙 좌표로 리셋해둠
        const width = 450; // Modal approx width
        const x = (window.innerWidth - width) / 2;
        const y = 450; // 지정 좌표 적용
        setPosition({ x, y });
    }, [isOpen]);

    // 드래그 이벤트 핸들러
    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.referral-header')) {
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
        <div
            className="referral-modal-overlay"
            onMouseDownCapture={onFocus} // 배경 클릭 시에도 포커스 전환
            style={{
                pointerEvents: 'none',
                backgroundColor: 'transparent',
                backdropFilter: 'none',
                zIndex: isActive ? 10100 : 10005 // [핵심] 최상위 레이어 우선순위 제어
            }}
        >
            <div
                className="referral-modal"
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
                    zIndex: isActive ? 10100 : 10005, // 포커스 시 격상
                    boxShadow: isActive ? '0 20px 50px rgba(0,0,0,0.4)' : '0 10px 30px rgba(0,0,0,0.2)',
                    transition: 'box-shadow 0.2s ease',
                    margin: 0
                }}
            >
                {/* 헤더 */}
                <div className="referral-header" style={{ cursor: 'grab', userSelect: 'none' }}>
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
