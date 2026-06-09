import React, { useState, useEffect } from 'react';
import { LanguageManager } from '../../utils/LanguageManager/LanguageManager';
import './MiningAuthModal.css';

interface MiningAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (address: string) => void;
    onOpenSecondPassword: () => void;
    currentLanguage?: string;
}

const MiningAuthModal: React.FC<MiningAuthModalProps> = ({
    isOpen, onClose, onSuccess, onOpenSecondPassword, currentLanguage = 'ko'
}) => {
    const [address, setAddress] = useState('');
    const [error, setError] = useState('');
    const languageManager = new LanguageManager();

    useEffect(() => {
        if (isOpen) {
            // 10분 유예 타임 체크
            const authData = localStorage.getItem('bw_mining_auth');
            if (authData) {
                try {
                    const { walletAddress, timestamp } = JSON.parse(authData);
                    const now = Date.now();
                    const gracePeriod = 10 * 60 * 1000; // 10분

                    if (now - timestamp < gracePeriod) {
                        onSuccess(walletAddress);
                        return;
                    } else {
                        localStorage.removeItem('bw_mining_auth');
                    }
                } catch {
                    localStorage.removeItem('bw_mining_auth');
                }
            }

            // 초기화
            setAddress('');
            setError('');
        }
    }, [isOpen, onSuccess]);

    if (!isOpen) return null;

    const t = (key: string) => languageManager.getTranslation(key, currentLanguage);

    const handleVerifyAddress = () => {
        setError('');

        if (!address) {
            setError('지갑 주소를 입력해주세요.');
            return;
        }

        // 1. 로컬 저장소에서 저장된 지갑 주소 조회 (나의 지갑을 열었을 때 저장됨)
        const savedAddress = localStorage.getItem('bw-wallet-address');

        // 2. 단 한 번도 나의 지갑을 열지 않아 주소가 없는 경우 차단
        if (!savedAddress) {
            setError('인증 실패: 로컬에 등록된 지갑 정보가 없습니다. 상단 [나의 지갑] 메뉴에서 지갑을 먼저 열어주세요.');
            return;
        }

        // 3. 입력한 주소와 로컬 주소가 일치하는지 확인
        if (address.trim() === savedAddress.trim()) {
            const authData = {
                walletAddress: address.trim(),
                timestamp: Date.now()
            };
            localStorage.setItem('bw_mining_auth', JSON.stringify(authData));
            onSuccess(address.trim());
        } else {
            setError('입력하신 지갑 주소가 일치하지 않습니다.');
        }
    };

    return (
        <div className="mining-auth-modal-overlay">
            <div className="mining-auth-modal-content">
                <div className="mining-auth-modal-header">
                    <h2>
                        <span className="shield-icon">🛡️</span>
                        {t('miningAuth.title') || '니모닉 파편 보안 인증'}
                    </h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="mining-auth-modal-body">
                    <p className="auth-subtitle">{t('miningAuth.subtitle') || '보안 유예 시간이 만료되었습니다'}</p>

                    {/* 노란색 경고 박스 */}
                    <div className="warning-box">
                        ⚠️ 브라우저 캐시 삭제 또는 기기 변경 후 첫 접속이신가요? "나의 지갑" 메뉴에서 단 한번만 지갑을 열어주세요. 그 즉시 보안 지문이 재설정되어, 이후부터는 다시 이 가벼운 인증만으로 즉시 마이닝장에 입장하실 수 있습니다.
                    </div>

                    <div className="input-group">
                        <label className="address-check-label">지갑 주소 확인</label>
                        <div className="address-input-wrapper">
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="BW + 40자리 주소를 입력하세요"
                                className="auth-input"
                            />
                            <button className="address-confirm-button" onClick={handleVerifyAddress}>
                                주소 확인
                            </button>
                        </div>
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <button className="login-button close-modal-btn" onClick={onClose}>
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MiningAuthModal;