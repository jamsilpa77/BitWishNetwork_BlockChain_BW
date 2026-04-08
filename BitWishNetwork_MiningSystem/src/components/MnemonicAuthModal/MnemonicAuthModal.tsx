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
    const langManager = new LanguageManager();
    const [isAddressVerified, setIsAddressVerified] = useState(false);
    const [addressInput, setAddressInput] = useState('');
    const [indices, setIndices] = useState<number[]>([]);
    const [inputs, setInputs] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // 언어 설정 초기화
    useEffect(() => {
        langManager.setLanguage(currentLanguage);
    }, [currentLanguage]);

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
            setError(langManager.getTranslation('mnemonicAuth.addressError'));
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
        try {
            // 니모닉 파편 검증 (캐시된 데이터 대조)
            // [결정적 보강] 로그아웃 상태에서도 검증 가능하도록, 사용자가 입력한 addressInput을 직접 전달
            const isValid = await walletService.verifyMnemonicFragment(indices, inputs, addressInput);
            if (isValid) {
                walletService.setAuthSession(addressInput);
                onSuccess(addressInput);
                onClose();
            } else {
                setError(langManager.getTranslation('mnemonicAuth.error'));
            }
        } catch (err) {
            console.error('[MnemonicAuthModal] Verification error:', err);
            setError(langManager.getTranslation('messages.error'));
        } finally {
            setIsLoading(false);
        }
    };

    const getTranslation = (key: string) => langManager.getTranslation(key);

    return (
        <div className="mnemonic-auth-overlay">
            <div className="mnemonic-auth-container">
                <div className="mnemonic-auth-header">
                    <h2>{getTranslation('mnemonicAuth.title')}</h2>
                    <p className="subtitle">{getTranslation('mnemonicAuth.subtitle')}</p>
                </div>

                <div className="mnemonic-auth-body">
                    {!isAddressVerified ? (
                        /* 1단계: 지갑 주소 식별 섹션 */
                        <div className="address-verify-stage animate-fade-in">
                            <div className="cache-recovery-warning">
                                {getTranslation('mnemonicAuth.cacheGuide')}
                            </div>
                            <p className="description">{getTranslation('mnemonicAuth.addressLabel')}</p>
                            <div className="address-input-group">
                                <input
                                    type="text"
                                    value={addressInput}
                                    onChange={(e) => setAddressInput(e.target.value)}
                                    placeholder={getTranslation('mnemonicAuth.addressPlaceholder')}
                                    className="premium-input"
                                />
                                <button className="address-check-btn" onClick={handleAddressVerify}>
                                    {getTranslation('mnemonicAuth.verifyAddress')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* 2단계: 니모닉 파편 입력 섹션 */
                        <div className="mnemonic-verify-stage animate-slide-up">
                            <p className="description success-text">
                                <span className="check-icon">✓</span> {getTranslation('mnemonicAuth.addressSuccess')}
                            </p>
                            <p className="description">{getTranslation('mnemonicAuth.desc')}</p>
                            
                            <div className="mnemonic-inputs-grid">
                                {indices.map((idx, i) => (
                                    <div key={idx} className="mnemonic-input-group">
                                        <label>{idx}{getTranslation('mnemonicAuth.wordLabel')}</label>
                                        <input
                                            type="text"
                                            value={inputs[i]}
                                            onChange={(e) => handleInputChange(i, e.target.value)}
                                            placeholder={getTranslation('mnemonicAuth.placeholder')}
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
                            {isLoading ? '...' : getTranslation('mnemonicAuth.verify')}
                        </button>
                    )}
                    <button className="close-btn" onClick={onClose}>
                        {getTranslation('buttons.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MnemonicAuthModal;
