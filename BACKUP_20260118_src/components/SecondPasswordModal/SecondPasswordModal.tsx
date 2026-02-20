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

        if (password !== confirmPassword) {
            setError(t('secondPassword.mismatch'));
            return;
        }

        if (password.length < 4) {
            setError('Password must be at least 4 characters.');
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

                    <div className="security-note">
                        <pre>{t('secondPassword.securityNote')}</pre>
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
