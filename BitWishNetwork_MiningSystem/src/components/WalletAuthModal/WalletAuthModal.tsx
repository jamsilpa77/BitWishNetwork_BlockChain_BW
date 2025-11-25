import React, { useState } from 'react';
import { walletService } from '../../services/WalletService/WalletService';
import { LanguageManager } from '../../utils/LanguageManager/LanguageManager';
import './WalletAuthModal.css';

interface WalletAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    currentLanguage?: string;
}

const WalletAuthModal: React.FC<WalletAuthModalProps> = ({ isOpen, onClose, onSuccess, currentLanguage = 'ko' }) => {
    const [mnemonic, setMnemonic] = useState('');
    const [error, setError] = useState('');
    const [languageManager] = useState(() => new LanguageManager());

    if (!isOpen) return null;

    const t = (key: string) => languageManager.getTranslation(key, currentLanguage);

    const handleLogin = () => {
        setError('');

        if (!mnemonic.trim()) {
            setError(t('walletAuth.error'));
            return;
        }

        // 시드 구문 검증
        if (walletService.verifyWalletAccess(mnemonic)) {
            walletService.setAuthSession(); // 세션 저장
            onSuccess();
        } else {
            setError(t('walletAuth.error'));
        }
    };

    return (
        <div className="wallet-auth-modal-overlay">
            <div className="wallet-auth-modal-content">
                <div className="wallet-auth-modal-header">
                    <h2>{t('walletAuth.title')}</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="wallet-auth-modal-body">
                    <p className="auth-description">{t('walletAuth.desc')}</p>

                    <div className="input-group">
                        <textarea
                            className="auth-textarea"
                            placeholder={t('walletAuth.placeholder')}
                            value={mnemonic}
                            onChange={(e) => setMnemonic(e.target.value)}
                            rows={4}
                        />
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <div className="button-group">
                        <button className="cancel-button" onClick={onClose}>
                            {t('wallet.dashboard.footer.close')}
                        </button>
                        <button className="confirm-button" onClick={handleLogin}>
                            {t('walletAuth.verify')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WalletAuthModal;
// Force update trigger
