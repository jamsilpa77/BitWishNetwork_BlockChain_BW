import React, { useState, useEffect } from 'react';
import { walletService } from '../../services/BlockchainService/WalletService';
import { LanguageManager } from '../../utils/LanguageManager/LanguageManager';
import './SecondPasswordModal.css';

interface SecondPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    currentLanguage?: string;
}

const SecondPasswordModal: React.FC<SecondPasswordModalProps> = ({
    isOpen, onClose, onSuccess, currentLanguage = 'ko'
}) => {
    const [address, setAddress] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const languageManager = new LanguageManager();

    useEffect(() => {
        if (isOpen) {
            setAddress('');
            setPassword('');
            setConfirmPassword('');
            setError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const t = (key: string) => languageManager.getTranslation(key, currentLanguage);

    const handleSubmit = async () => {
        setError('');

        if (!walletService.validateWalletAddress(address)) {
            setError(t('secondPassword.invalidAddress'));
            return;
        }

        // 비밀번호 확인 일치 검사
        if (password !== confirmPassword) {
            setError(t('secondPassword.mismatch'));
            return;
        }

        // [보안 정책 강화] 12자리 이상, 대문자 2개, 소문자 2개, 특수문자 3개
        const strongRegex = /^(?=(?:.*[A-Z]){2,})(?=(?:.*[a-z]){2,})(?=(?:.*[!@#\$%\^&\*\(\)_\+\|~=`\{\}\[\]:";'<>?,.\/-]){3,}).{12,}$/;

        if (!strongRegex.test(password)) {
            setError('비밀번호 보안 규칙을 준수해주세요. (12자리 이상, 대문자 2개, 소문자 2개, 특수문자 3개 필수)');
            return;
        }

        const success = await walletService.setSecondPassword(address, password);
        if (success) {
            alert(t('secondPassword.success'));
            onClose();
        } else {
            setError(t('secondPassword.fail'));
        }
    };

    return (
        <div className="second-password-modal-overlay">
            <div className="second-password-modal-content">
                <div className="second-password-modal-header">
                    <h2>{t('secondPassword.title')}</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="second-password-modal-body">
                    <p className="modal-desc">{t('secondPassword.desc')}</p>

                    <div className="input-group">
                        <label>{t('miningAuth.addressLabel')}</label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder={t('miningAuth.addressPlaceholder')}
                            className="auth-input"
                        />
                    </div>

                    <div className="input-group">
                        <label>{t('secondPassword.newPasswordPlaceholder')}</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t('secondPassword.newPasswordPlaceholder')}
                            className="auth-input"
                        />
                        {/* 보안 규칙 안내 (항상 표시) */}
                        <div className="password-rules" style={{ marginTop: '10px', padding: '10px', backgroundColor: 'rgba(255, 0, 0, 0.1)', borderRadius: '5px', border: '1px solid #ff4d4d' }}>
                            <p style={{ color: '#ff4d4d', fontSize: '13px', margin: 0, fontWeight: 'bold' }}>⚠️ 보안 설정 안내</p>
                            <ul style={{ color: '#ff4d4d', fontSize: '12px', margin: '5px 0 0 0', paddingLeft: '20px', listStyleType: 'disc' }}>
                                <li>안전한 자산 보호를 위해 아래 규칙을 <strong>반드시</strong> 준수해야 합니다.</li>
                                <li><strong>총 길이:</strong> 12자리 이상</li>
                                <li><strong>영문 대문자:</strong> 2개 이상 (예: A, B...)</li>
                                <li><strong>영문 소문자:</strong> 2개 이상 (예: a, b...)</li>
                                <li><strong>특수문자:</strong> 3개 이상 <br />(허용: ! @ # $ % ^ &amp; * ( ) _ + | ~ = ` {'{'} {'}'} [ ] : " ; ' &lt; &gt; ? , . / -)</li>
                            </ul>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>{t('secondPassword.confirmPasswordLabel')}</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder={t('secondPassword.confirmPasswordPlaceholder')}
                            className="auth-input"
                        />
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <div className="button-group">
                        <button className="cancel-button" onClick={onClose}>
                            {t('secondPassword.cancel')}
                        </button>
                        <button className="confirm-button" onClick={handleSubmit}>
                            {t('secondPassword.confirm')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecondPasswordModal;
