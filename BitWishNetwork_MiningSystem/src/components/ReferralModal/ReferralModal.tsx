import React, { useState, useEffect } from 'react';
import { LanguageManager } from '../../utils/LanguageManager/LanguageManager';
import { apiService } from '@/services/ApiService';
import './ReferralModal.css';

interface ReferralModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentLanguage?: string;
    walletAddress?: string;
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
    const [copySuccess, setCopySuccess] = useState(false);

    // 실시간 데이터 상태
    const [myReferralCode, setMyReferralCode] = useState<string | null>(null);
    const [friendsInvited, setFriendsInvited] = useState<number>(0);
    const [bonusRate, setBonusRate] = useState<number>(0);

    // 모달 드래그 및 위치 상태 관리 (정확한 360px 슬림 규격 및 마이닝 모달 축과 칼일치)
    const [position, setPosition] = useState(() => {
        if (typeof window !== 'undefined') {
            const modalWidth = 360;
            const x = Math.max(10, Math.round((window.innerWidth - modalWidth) / 2));
            const y = Math.max(50, Math.round((window.innerHeight - 380) / 2));
            return { x, y };
        }
        return { x: 50, y: 150 };
    });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // 오픈/클로즈 시 위치 리셋 (마이닝 모달 정중앙 칼일치 정렬)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const modalWidth = 360;
            const x = Math.max(10, Math.round((window.innerWidth - modalWidth) / 2));
            const y = Math.max(50, Math.round((window.innerHeight - 380) / 2));
            setPosition({ x, y });
        }
    }, [isOpen]);

    // 드래그 마우스 이벤트 핸들러
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

    // 모달 열릴 때 사용자 추천 정보 및 통계 로드
    useEffect(() => {
        if (isOpen && walletAddress) {
            apiService.getUserStatus(walletAddress).then((data) => {
                if (data) {
                    // 1. 관리자 고정 추천 코드 및 일반 지갑 추천 코드 로드
                    if (walletAddress === 'BW9F5FF090231236037F250A523B4FC320FB44BFA8') {
                        setMyReferralCode('REF9F5FF0909DC5');
                    } else {
                        const savedWallet = localStorage.getItem('bw_wallet_data');
                        if (savedWallet) {
                            const parsed = JSON.parse(savedWallet);
                            setMyReferralCode(parsed.myReferralCode || null);
                        }
                    }

                    // 2. 서버 실시간 추천 인원 및 누적 보너스율 반영
                    if (data.miningState) {
                        const count = data.miningState.referralCount || 0;
                        setFriendsInvited(count);
                        setBonusRate(data.miningState.totalBonusRate || 0);
                    }
                }
            }).catch(err => console.error('Failed to load referral stats:', err));
        }
    }, [isOpen, walletAddress]);

    const getTranslation = (key: string) => languageManager.getTranslation(key);

    if (!isOpen) return null;

    // 추천 코드 복사 핸들러 (1.5초간 즉각적인 피드백 제공)
    const handleCopyCode = () => {
        if (!myReferralCode) return;
        navigator.clipboard.writeText(myReferralCode).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 1500);
        });
    };

    // 소셜 공유 핸들러 (4대 채널 최적화 인텐트)
    const handleSocialShare = (platform: string) => {
        if (!myReferralCode) return;
        const shareMessage = `[BitWish Network] 극초기 채굴 기회! 추천 코드 [${myReferralCode}] 입력 시 2 BW 즉시 지급 및 채굴 보너스 혜택!`;
        const shareUrl = window.location.origin;
        const fullShareText = `${shareMessage}\n${shareUrl}`;
        const encodedText = encodeURIComponent(shareMessage);
        const encodedUrl = encodeURIComponent(shareUrl);
        const encodedFull = encodeURIComponent(fullShareText);

        switch (platform) {
            case 'kakao':
                // 카카오톡: 클립보드에 초대 메시지 자동 복사 및 카카오 웹 공유 링크/인텐트 실행
                navigator.clipboard.writeText(fullShareText).then(() => {
                    // 카카오 스토리/웹 공유 창 팝업 호출 (모바일 및 PC 범용)
                    const kakaoWebUrl = `https://story.kakao.com/share?url=${encodedUrl}&text=${encodedText}`;
                    window.open(kakaoWebUrl, '_blank', 'width=550,height=600');
                }).catch(() => {
                    window.open(`https://story.kakao.com/share?url=${encodedUrl}&text=${encodedText}`, '_blank');
                });
                break;
            case 'telegram':
                // 텔레그램: https://t.me/share/url?url={링크}&text={메시지}
                window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`, '_blank');
                break;
            case 'twitter':
                // X (트위터): https://twitter.com/intent/tweet?text={메시지}&url={링크}
                window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank');
                break;
            case 'facebook':
                // 페이스북: https://www.facebook.com/sharer/sharer.php?u={링크}
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank', 'width=600,height=500');
                break;
        }
    };

    return (
        <div
            className="referral-modal-overlay"
            onMouseDownCapture={onFocus}
            style={{
                pointerEvents: 'none',
                backgroundColor: 'transparent',
                backdropFilter: 'none',
                zIndex: isActive ? 10100 : 10005
            }}
        >
            <div
                className="referral-modal"
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
                    zIndex: isActive ? 10100 : 10005,
                    boxShadow: isActive ? '0 20px 50px rgba(0,0,0,0.4)' : '0 10px 30px rgba(0,0,0,0.2)',
                    transition: 'box-shadow 0.2s ease',
                    margin: 0
                }}
            >
                {/* [단계 1-2] 상단 슬림 헤더: 타이틀과 원터치 닫기(✕) 버튼 */}
                <div className="referral-header" style={{ cursor: 'grab', userSelect: 'none' }}>
                    <div className="header-title-box">
                        <span className="header-icon">🎁</span>
                        <h3 className="referral-title">{getTranslation('referral.modal.title')}</h3>
                    </div>
                    <button className="header-close-btn" onClick={onClose} title="닫기">
                        ✕
                    </button>
                </div>

                <div className="referral-body">
                    {/* [단계 1-3] 4대 소셜 채널 상단 전면 배치 (카카오톡, 텔레그램, X, 페이스북) */}
                    <div className="social-share-section">
                        <div className="section-label">SNS 간편 공유</div>
                        <div className="social-grid">
                            <button className="social-btn kakao" onClick={() => handleSocialShare('kakao')} title="카카오톡 공유">
                                <span className="social-icon">💬</span>
                                <span className="social-name">카카오톡</span>
                            </button>
                            <button className="social-btn telegram" onClick={() => handleSocialShare('telegram')} title="텔레그램 공유">
                                <span className="social-icon">✈️</span>
                                <span className="social-name">텔레그램</span>
                            </button>
                            <button className="social-btn twitter" onClick={() => handleSocialShare('twitter')} title="X(트위터) 공유">
                                <span className="social-icon">𝕏</span>
                                <span className="social-name">X</span>
                            </button>
                            <button className="social-btn facebook" onClick={() => handleSocialShare('facebook')} title="페이스북 공유">
                                <span className="social-icon">📘</span>
                                <span className="social-name">페이스북</span>
                            </button>
                        </div>
                    </div>

                    {/* [단계 1-4] 추천 코드 표시창 + 복사 버튼 일체형 결합 컨테이너 */}
                    <div className="referral-code-section">
                        <div className="section-label">{getTranslation('referral.modal.myCode')}</div>
                        <div className="code-input-group">
                            <input
                                type="text"
                                className="code-input-field"
                                value={myReferralCode || '코드를 불러오는 중...'}
                                readOnly
                            />
                            <button
                                className={`copy-action-btn ${copySuccess ? 'success' : ''}`}
                                onClick={handleCopyCode}
                                disabled={!myReferralCode}
                            >
                                {copySuccess ? '복사됨! ✅' : '📋 코드복사'}
                            </button>
                        </div>
                        <p className="share-guide-tip">
                            💡 코드를 복사한 뒤 원하는 SNS를 클릭하면 즉시 초대 메시지가 전송됩니다!
                        </p>
                    </div>

                    {/* [단계 1-5] 하단 1줄 미니 통계 뱃지 바 */}
                    <div className="stats-mini-bar">
                        <div className="stat-pill">
                            <span className="pill-label">👥 초대 유저</span>
                            <span className="pill-value">{friendsInvited}명</span>
                        </div>
                        <div className="stat-divider">|</div>
                        <div className="stat-pill">
                            <span className="pill-label">⚡ 보너스율</span>
                            <span className="pill-value highlight">+{bonusRate}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReferralModal;
