import React, { useState } from 'react';
import { walletService } from '../../services/BlockchainService/WalletService';
import { LanguageManager } from '../../utils/LanguageManager/LanguageManager';
import './WalletAuthModal.css';

interface WalletAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    currentLanguage?: string;
}

const WalletAuthModal: React.FC<WalletAuthModalProps> = ({ isOpen, onClose, onSuccess, currentLanguage = 'ko' }) => {
    // 비밀번호 상태 및 단계 제거 (1단계: 시드 문구 입력만 존재)
    const [mnemonic, setMnemonic] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [languageManager] = useState(() => new LanguageManager());

    if (!isOpen) return null;

    const t = (key: string) => languageManager.getTranslation(key, currentLanguage);

    const handleLogin = async () => {
        setError('');
        if (!mnemonic.trim()) {
            setError(t('walletAuth.error'));
            return;
        }

        const normalizedMnemonic = mnemonic.trim().split(/\s+/).join(' ');

        // 1. 시드 문구 유효성 검증
        if (!walletService.verifyWalletAccess(normalizedMnemonic)) {
            setError(t('walletAuth.error'));
            return;
        }

        setIsProcessing(true);
        try {
            // [관리자 원안 복구] 비밀번호 입력 없이, 시스템 기본값 '123456'으로 즉시 복구 시도
            // WalletService에서 비밀번호 불일치 시 자동 Reset 허용하도록 수정됨.
            const DEFAULT_PASSWORD = '123456';

            const restored = await walletService.restoreWallet(normalizedMnemonic, DEFAULT_PASSWORD);

            if (restored) {
                onSuccess();
                setMnemonic('');
            } else {
                setError(t('walletAuth.recoveryFailed'));
            }
        } catch (e) {
            setError('Error: ' + (e instanceof Error ? e.message : String(e)));
        } finally {
            setIsProcessing(false);
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
                    {/* 단일 단계: 시드 문구 입력 */}
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

                        <button className="confirm-button" onClick={handleLogin} disabled={isProcessing}>
                            {isProcessing ? t('walletAuth.processing') : t('walletAuth.verify')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WalletAuthModal;
