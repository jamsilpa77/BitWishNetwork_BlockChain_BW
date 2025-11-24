import React, { useState, useEffect } from 'react';
import { walletService } from '../../services/WalletService/WalletService';
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
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const languageManager = new LanguageManager();

    useEffect(() => {
        if (isOpen) {
            setAddress('');
            setPassword('');
            setError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const t = (key: string) => languageManager.getTranslation(key, currentLanguage);

    const handleLogin = () => {
        setError('');
        if (!password) {
            setError(t('miningAuth.loginFail'));
            return;
        }

        if (walletService.verifySecondPassword(address, password)) {
            onSuccess(address);
        } else {
            setError(t('miningAuth.loginFail'));
        }
    };

    return (
        <div className="mining-auth-modal-overlay">
            <div className="mining-auth-modal-content">
                <div className="mining-auth-modal-header">
                    <h2>
                        <span className="shield-icon">🛡️</span>
                        {t('miningAuth.title')}
                    </h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="mining-auth-modal-body">
                    <p className="auth-subtitle">{t('miningAuth.subtitle')}</p>

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
                        <label>{t('miningAuth.passwordLabel')}</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t('miningAuth.passwordPlaceholder')}
                            className="auth-input"
                        />
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <div className="action-buttons">
                        <button className="link-button" onClick={onOpenSecondPassword}>
                            {t('miningAuth.setSecondPassword')}
                        </button>
                    </div>

                    <button className="login-button" onClick={handleLogin}>
                        {t('miningAuth.loginBtn')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MiningAuthModal;
