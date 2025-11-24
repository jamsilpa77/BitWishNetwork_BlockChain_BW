import React, { useState, useEffect } from 'react';
import './CreateWalletModal.css';
import { WalletService } from '@/services/WalletService/WalletService';
import { LanguageManager } from '@/utils/LanguageManager/LanguageManager';

interface CreateWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete?: () => void;
    currentLanguage?: string;
}

const CreateWalletModal: React.FC<CreateWalletModalProps> = ({ isOpen, onClose, onComplete, currentLanguage = 'ko' }) => {
    const [walletService] = useState(() => new WalletService());
    const [languageManager] = useState(() => new LanguageManager());
    const [referralCode, setReferralCode] = useState('');
    const [isGuideVisible, setIsGuideVisible] = useState(false);
    const [step, setStep] = useState<'intro' | 'seed_display' | 'seed_verification'>('intro');
    const [verificationInputs, setVerificationInputs] = useState<{ [key: number]: string }>({});

    // 검증할 단어 인덱스 (랜덤 생성)
    const [targetIndices, setTargetIndices] = useState<number[]>([]);

    // 초기에는 빈 배열로 시작, 생성 버튼 클릭 시 채워짐
    const [seedPhrase, setSeedPhrase] = useState<string[]>([]);

    // 언어 설정 업데이트
    useEffect(() => {
        if (currentLanguage) {
            languageManager.setLanguage(currentLanguage);
        }
    }, [currentLanguage, languageManager]);

    const t = (key: string) => languageManager.getTranslation(key, currentLanguage);

    if (!isOpen) return null;

    const handleMouseEnter = () => setIsGuideVisible(true);
    const handleMouseLeave = () => setIsGuideVisible(false);

    const handleStartCreation = () => {
        // 실제 24단어 랜덤 생성 (BIP-39)
        const newMnemonic = walletService.generateMnemonic();
        setSeedPhrase(newMnemonic);

        // 검증용 랜덤 인덱스 생성
        const indices = walletService.generateVerificationIndices();
        setTargetIndices(indices);

        // 입력값 초기화
        const initialInputs: { [key: number]: string } = {};
        indices.forEach(idx => {
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
        // 검증 로직 (동적 인덱스 사용)
        const isCorrect = targetIndices.every(index => {
            const inputWord = verificationInputs[index]?.trim().toLowerCase() || '';
            const targetWord = seedPhrase[index - 1]?.toLowerCase() || '';
            return inputWord === targetWord && targetWord !== '';
        });

        if (isCorrect) {
            // 실제 지갑 생성 및 저장 (비동기 처리)
            walletService.createWallet(seedPhrase, undefined, referralCode)
                .then(() => {
                    alert(t('wallet.createSuccess'));
                    if (onComplete) {
                        onComplete();
                    }
                })
                .catch(err => {
                    console.error('Wallet creation failed:', err);
                    if (err.message && err.message.includes('limit exceeded')) {
                        alert(t('wallet.limitExceeded'));
                    } else {
                        alert('Wallet creation failed. Please try again.');
                    }
                });
        } else {
            alert(t('wallet.verifyFail'));
        }
    };

    return (
        <div className="create-wallet-modal-overlay">
            <div className={`create-wallet-modal ${step !== 'intro' ? 'wide' : ''}`}>
                {/* Header */}
                <div className="modal-header">
                    <div className="header-title-group">
                        {step === 'intro' ? (
                            <>
                                <span className="money-bag-icon">💰</span>
                                <h2 className="modal-title">{t('wallet.createTitle')}</h2>
                            </>
                        ) : step === 'seed_display' ? (
                            <>
                                <span className="blue-wallet-icon">👛</span>
                                <div className="header-text-group">
                                    <h2 className="modal-title">{t('wallet.createSubtitle')}</h2>
                                    <span className="header-subtitle">{t('wallet.createDesc')}</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <span className="blue-wallet-icon">👛</span>
                                <div className="header-text-group">
                                    <h2 className="modal-title">{t('wallet.verificationTitle')}</h2>
                                    <span className="header-subtitle">{t('wallet.createDesc')}</span>
                                </div>
                            </>
                        )}
                    </div>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                {/* Body */}
                <div className="modal-body">
                    {step === 'intro' ? (
                        <>
                            <h3 className="body-title">{t('wallet.introTitle')}</h3>

                            {/* Referral Guide Section */}
                            <div className="referral-guide-container">
                                <button
                                    className="referral-guide-btn"
                                    onMouseEnter={handleMouseEnter}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    {t('wallet.referralGuideBtn')}
                                </button>

                                {/* Tooltip */}
                                {isGuideVisible && (
                                    <div className="referral-guide-tooltip">
                                        <p>{t('wallet.referralGuideTooltip')}</p>
                                    </div>
                                )}
                            </div>

                            <p className="body-description">
                                {t('wallet.introDesc')}
                            </p>

                            {/* Input Section */}
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

                            {/* Action Button */}
                            <button className="create-start-btn" onClick={handleStartCreation}>
                                <span className="btn-icon">💰</span>
                                {t('wallet.createStartBtn')}
                            </button>
                        </>
                    ) : step === 'seed_display' ? (
                        /* Seed Display Step */
                        <div className="seed-display-container">
                            <div className="green-key-icon">🗝️</div>
                            <h3 className="body-title">{t('wallet.seedDisplayTitle')}</h3>
                            <p className="body-description small">
                                {t('wallet.seedDisplayDesc')}
                            </p>

                            <div className="seed-grid">
                                {seedPhrase.map((word, index) => (
                                    <div key={index} className="seed-item">
                                        <span className="seed-number">{index + 1}</span>
                                        <span className="seed-word">{word}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="seed-actions">
                                <button className="copy-btn" onClick={handleCopySeed}>
                                    {t('wallet.copySeedBtn')}
                                </button>
                                <button className="next-step-btn" onClick={handleNextStep}>
                                    {t('wallet.nextStepBtn')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Seed Verification Step */
                        <div className="seed-display-container">
                            <div className="green-key-icon">🗝️</div>
                            <h3 className="body-title">{t('wallet.verificationTitle')}</h3>
                            <p className="body-description small">
                                {t('wallet.verificationDesc')}
                            </p>

                            <div className="verification-container">
                                {targetIndices.map((index) => (
                                    <div key={index} className="verification-input-group">
                                        <label className="verification-label">{index}{t('wallet.wordLabel')}</label>
                                        <input
                                            type="text"
                                            className="verification-input"
                                            placeholder={t('wallet.wordPlaceholder')}
                                            value={verificationInputs[index]}
                                            onChange={(e) => handleVerificationInputChange(index, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="seed-actions">
                                <button className="complete-btn" onClick={handleCompleteVerification}>
                                    {t('wallet.completeBtn')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateWalletModal;
