import React, { useState, useEffect } from 'react';
import { walletService } from '../../services/BlockchainService/WalletService';
import { LanguageManager } from '../../utils/LanguageManager/LanguageManager';
import './MnemonicAuthModal.css';

interface MnemonicAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (address: string) => void;
    walletAddress: string;
    currentLanguage: string;
}

const MnemonicAuthModal: React.FC<MnemonicAuthModalProps> = ({ isOpen, onClose, onSuccess, walletAddress, currentLanguage }) => {
    // LanguageManager 인스턴스 최적화 (useMemo 사용으로 불필요한 재생성 방지)
    const languageManager = React.useMemo(() => new LanguageManager(), []);

    const [isAddressVerified, setIsAddressVerified] = useState(false);
    const [addressInput, setAddressInput] = useState('');
    const [indices, setIndices] = useState<number[]>([]);
    const [inputs, setInputs] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // 단축 번역 함수: currentLanguage를 직접 전달하여 즉각적인 로컬 반응 보장
    const t = (key: string) => languageManager.getTranslation(key, currentLanguage);

    // 언어 설정 동기화
    useEffect(() => {
        if (currentLanguage) {
            languageManager.setLanguage(currentLanguage);
        }
    }, [currentLanguage, languageManager]);

    // 랜덤 인덱스 초기화
    useEffect(() => {
        if (isOpen) {
            setIsAddressVerified(false);
            setAddressInput('');
            const newIndices = walletService.generateVerificationIndices();
            setIndices(newIndices);
            setInputs(new Array(newIndices.length).fill(''));
            setError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    /**
     * 1단계: 지갑 주소 식별 및 확인
     */
    const handleAddressVerify = () => {
        if (!addressInput || addressInput.trim() !== walletAddress) {
            setError(t('mnemonicAuth.addressError'));
            return;
        }
        setError('');
        setIsAddressVerified(true);
    };

    const handleInputChange = (index: number, value: string) => {
        const newInputs = [...inputs];
        newInputs[index] = value;
        setInputs(newInputs);
    };

    const handleVerify = async () => {
        setError('');
        setIsLoading(true);
        try {
            // 니모닉 파편 검증 (캐시된 데이터 대조)
            const isValid = await walletService.verifyMnemonicFragment(indices, inputs, addressInput);
            if (isValid) {
                walletService.setAuthSession(addressInput);
                onSuccess(addressInput);
                onClose();
            } else {
                setError(t('mnemonicAuth.error'));
            }
        } catch (err) {
            console.error('[MnemonicAuthModal] Verification error:', err);
            setError(t('messages.error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mnemonic-auth-overlay">
            <div className="mnemonic-auth-container">
                <div className="mnemonic-auth-header">
                    <h2>{t('mnemonicAuth.title')}</h2>
                    <p className="subtitle">{t('mnemonicAuth.subtitle')}</p>
                </div>

                <div className="mnemonic-auth-body">
                    {!isAddressVerified ? (
                        /* 1단계: 지갑 주소 식별 섹션 */
                        <div className="address-verify-stage animate-fade-in">
                            <div className="cache-recovery-warning">
                                {t('mnemonicAuth.cacheGuide')}
                            </div>
                            <p className="description">{t('mnemonicAuth.addressLabel')}</p>
                            <div className="address-input-group">
                                <input
                                    type="text"
                                    value={addressInput}
                                    onChange={(e) => setAddressInput(e.target.value)}
                                    placeholder={t('mnemonicAuth.addressPlaceholder')}
                                    className="premium-input"
                                />
                                <button className="address-check-btn" onClick={handleAddressVerify}>
                                    {t('mnemonicAuth.verifyAddress')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* 2단계: 니모닉 파편 입력 섹션 */
                        <div className="mnemonic-verify-stage animate-slide-up">
                            <p className="description success-text">
                                <span className="check-icon">✓</span> {t('mnemonicAuth.addressSuccess')}
                            </p>
                            <p className="description">{t('mnemonicAuth.desc')}</p>

                            <div className="mnemonic-inputs-grid">
                                {indices.map((idx, i) => (
                                    <div key={idx} className="mnemonic-input-group">
                                        <label>{t('mnemonicAuth.wordLabel').replace('{index}', idx.toString())}</label>
                                        <input
                                            type="text"
                                            value={inputs[i]}
                                            onChange={(e) => handleInputChange(i, e.target.value)}
                                            placeholder={t('mnemonicAuth.placeholder')}
                                            autoComplete="off"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && <div className="error-message">{error}</div>}
                </div>

                <div className="mnemonic-auth-footer">
                    {isAddressVerified && (
                        <button
                            className="verify-btn"
                            onClick={handleVerify}
                            disabled={isLoading}
                        >
                            {isLoading ? '...' : t('mnemonicAuth.verify')}
                        </button>
                    )}
                    <button className="close-btn" onClick={onClose}>
                        {t('buttons.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MnemonicAuthModal;
