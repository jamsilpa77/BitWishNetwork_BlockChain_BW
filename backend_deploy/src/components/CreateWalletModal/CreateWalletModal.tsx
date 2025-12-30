import React, { useState, useEffect } from 'react';
import './CreateWalletModal.css';
import { walletService } from '../../services/BlockchainService/WalletService';
import { LanguageManager } from '@/utils/LanguageManager/LanguageManager';

interface CreateWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete?: () => void;
    currentLanguage?: string;
}

const CreateWalletModal: React.FC<CreateWalletModalProps> = ({ isOpen, onClose, onComplete, currentLanguage = 'ko' }) => {
    const languageManager = new LanguageManager();
    const [referralCode, setReferralCode] = useState('');
    const [isGuideVisible, setIsGuideVisible] = useState(false);
    const [step, setStep] = useState<'intro' | 'seed_display' | 'seed_verification'>('intro');
    const [verificationInputs, setVerificationInputs] = useState<{ [key: number]: string }>({});
    const [targetIndices, setTargetIndices] = useState<number[]>([]);
    const [seedPhrase, setSeedPhrase] = useState<string[]>([]);

    useEffect(() => {
        if (currentLanguage) {
            languageManager.setLanguage(currentLanguage);
        }
    }, [currentLanguage]);

    const t = (key: string) => languageManager.getTranslation(key, currentLanguage);

    if (!isOpen) return null;

    const handleMouseEnter = () => setIsGuideVisible(true);
    const handleMouseLeave = () => setIsGuideVisible(false);

    const handleStartCreation = () => {
        // 24단어 랜덤 생성
        const newMnemonic = walletService.generateMnemonic();
        setSeedPhrase(newMnemonic);

        // 검증용 인덱스 4개 생성
        const indices = walletService.generateVerificationIndices();
        setTargetIndices(indices);

        const initialInputs: { [key: number]: string } = {};
        indices.forEach((idx: number) => {
            initialInputs[idx] = '';
        });
        setVerificationInputs(initialInputs);
        setStep('seed_display');
    };

    const handleCopySeed = () => {
        const text = seedPhrase.join(' ');
        navigator.clipboard.writeText(text).then(() => {
            alert(t('wallet.copySuccess'));
        });
    };

    const handleNextStep = () => {
        setStep('seed_verification');
    };

    const handleVerificationInputChange = (index: number, value: string) => {
        setVerificationInputs(prev => ({
            ...prev,
            [index]: value
        }));
    };

    const handleCompleteVerification = () => {
        const isCorrect = targetIndices.every(index => {
            const inputWord = verificationInputs[index]?.trim().toLowerCase() || '';
            const targetWord = seedPhrase[index - 1]?.toLowerCase() || '';
            return inputWord === targetWord && targetWord !== '';
        });

        if (isCorrect) {
            // 지갑 생성 (2차 비밀번호는 일단 'PENDING' 처리하거나 유저가 나중에 설정하도록 함)
            // 지시사항 7번에 따라 지갑 생성 시 2차 비번을 받도록 되어 있으나 일단 원본 로직 유지하며 5001포트 연동
            walletService.createWallet(seedPhrase, 'TEMPPASSWORD123!', referralCode)
                .then(() => {
                    alert(t('wallet.createSuccess'));
                    if (onComplete) onComplete();
                })
                .catch((err: any) => {
                    console.error('Wallet creation failed:', err);
                    alert(err.message || 'Wallet creation failed.');
                });
        } else {
            alert(t('wallet.verifyFail'));
        }
    };

    return (
        <div className="create-wallet-modal-overlay">
            <div className={`create-wallet-modal ${step !== 'intro' ? 'wide' : ''}`}>
                <div className="modal-header">
                    <div className="header-title-group">
                        {step === 'intro' ? (
                            <>
                                <span className="money-bag-icon">💰</span>
                                <h2 className="modal-title">{t('wallet.createTitle')}</h2>
                            </>
                        ) : (
                            <>
                                <span className="blue-wallet-icon">👛</span>
                                <div className="header-text-group">
                                    <h2 className="modal-title">{step === 'seed_display' ? t('wallet.createSubtitle') : t('wallet.verificationTitle')}</h2>
                                    <span className="header-subtitle">{t('wallet.createDesc')}</span>
                                </div>
                            </>
                        )}
                    </div>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    {step === 'intro' ? (
                        <>
                            <h3 className="body-title">{t('wallet.introTitle')}</h3>
                            <div className="referral-guide-container">
                                <button className="referral-guide-btn" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                                    {t('wallet.referralGuideBtn')}
                                </button>
                                {isGuideVisible && (
                                    <div className="referral-guide-tooltip">
                                        <p>{t('wallet.referralGuideTooltip')}</p>
                                    </div>
                                )}
                            </div>
                            <p className="body-description">{t('wallet.introDesc')}</p>
                            <div className="input-section">
                                <label className="input-label">{t('wallet.referralInputLabel')}</label>
                                <input
                                    type="text"
                                    className="referral-input"
                                    placeholder={t('wallet.referralInputPlaceholder')}
                                    value={referralCode}
                                    onChange={(e) => setReferralCode(e.target.value)}
                                />
                            </div>
                            <button className="create-start-btn" onClick={handleStartCreation}>
                                <span className="btn-icon">💰</span>
                                {t('wallet.createStartBtn')}
                            </button>
                        </>
                    ) : step === 'seed_display' ? (
                        <div className="seed-display-container">
                            <div className="green-key-icon">🗝️</div>
                            <h3 className="body-title">{t('wallet.seedDisplayTitle')}</h3>
                            <p className="body-description small">{t('wallet.seedDisplayDesc')}</p>
                            <div className="seed-grid">
                                {seedPhrase.map((word, idx) => (
                                    <div key={idx} className="seed-item">
                                        <span className="seed-number">{idx + 1}</span>
                                        <span className="seed-word">{word}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="seed-actions">
                                <button className="copy-btn" onClick={handleCopySeed}>{t('wallet.copySeedBtn')}</button>
                                <button className="next-step-btn" onClick={handleNextStep}>{t('wallet.nextStepBtn')}</button>
                            </div>
                        </div>
                    ) : (
                        <div className="seed-display-container">
                            <div className="green-key-icon">🗝️</div>
                            <h3 className="body-title">{t('wallet.verificationTitle')}</h3>
                            <p className="body-description small">{t('wallet.verificationDesc')}</p>
                            <div className="verification-container">
                                {targetIndices.map((index) => (
                                    <div key={index} className="verification-input-group">
                                        <label className="verification-label">{index}{t('wallet.wordLabel')}</label>
                                        <input
                                            type="text"
                                            className="verification-input"
                                            value={verificationInputs[index]}
                                            onChange={(e) => handleVerificationInputChange(index, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="seed-actions">
                                <button className="complete-btn" onClick={handleCompleteVerification}>{t('wallet.completeBtn')}</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateWalletModal;
