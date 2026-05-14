import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { LanguageManager } from '../../utils/LanguageManager/LanguageManager';
import { walletService } from '../../services/BlockchainService/WalletService';
import { apiService } from '../../services/ApiService';

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'send' | 'receive';
    walletAddress: string;
    availableBalance: number;
    currentLanguage: string;
}

const TransferModal: React.FC<TransferModalProps> = ({
    isOpen,
    onClose,
    type,
    walletAddress,
    availableBalance,
    currentLanguage
}) => {
    const [langManager] = useState(() => new LanguageManager());
    
    const getTranslation = (key: string) => {
        return langManager.getTranslation(key, currentLanguage);
    };

    const p2p = {
        receive: {
            title: getTranslation('wallet.p2p.receive.title'),
            addressLabel: getTranslation('wallet.p2p.receive.addressLabel'),
            copyBtn: getTranslation('wallet.p2p.receive.copyBtn')
        },
        send: {
            title: getTranslation('wallet.p2p.send.title'),
            addressLabel: getTranslation('wallet.p2p.send.addressLabel'),
            addressPlaceholder: getTranslation('wallet.p2p.send.addressPlaceholder'),
            amountLabel: getTranslation('wallet.p2p.send.amountLabel'),
            amountPlaceholder: getTranslation('wallet.p2p.send.amountPlaceholder'),
            otpLabel: getTranslation('wallet.p2p.send.otpLabel'),
            otpPlaceholder: getTranslation('wallet.p2p.send.otpPlaceholder'),
            feeLabel: getTranslation('wallet.p2p.send.feeLabel'),
            cautionTitle: getTranslation('wallet.p2p.send.cautionTitle'),
            cautionText: getTranslation('wallet.p2p.send.cautionText'),
            confirmBtn: getTranslation('wallet.p2p.send.confirmBtn'),
            cancelBtn: getTranslation('wallet.p2p.send.cancelBtn')
        }
    };

    const [recipientAddress, setRecipientAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [fee, setFee] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (amount) {
            const calculatedFee = parseFloat(amount) * 0.0001;
            setFee(isNaN(calculatedFee) ? 0 : calculatedFee);
        } else {
            setFee(0);
        }
    }, [amount]);

    if (!isOpen) return null;

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(walletAddress);
        alert(getTranslation('wallet.dashboard.copyAddress') + '!');
    };

    const handleSend = async () => {
        if (!recipientAddress || !amount || !otpCode) {
            alert(getTranslation('messages.error') || 'Please fill all fields.');
            return;
        }

        // [Phase 3] WalletService를 통한 정밀 검증 (availableBalance 기반)
        const validation = walletService.validateTransferAmount(parseFloat(amount) + fee, availableBalance);
        if (!validation.success) {
            alert(getTranslation(validation.messageKey));
            return;
        }

        setIsProcessing(true);
        try {
            const txData = {
                senderAddress: walletAddress,
                recipientAddress,
                amount: parseFloat(amount),
                fee
            };

            const response = await apiService.recordTransaction(txData);
            
            if (response && response.success) {
                alert(getTranslation('wallet.p2p.send.messages.transferSuccess') || 'Transfer Requested Successfully!');
                onClose();
            } else {
                alert(getTranslation('wallet.p2p.send.messages.transferFailed') || 'Transfer Failed.');
            }
        } catch (error) {
            console.error('Transfer error:', error);
            alert(getTranslation('wallet.p2p.send.messages.transferFailed') || 'Transfer Failed.');
        } finally {
            setIsProcessing(false);
        }
    };

    const styles = {
        overlay: {
            position: 'fixed' as const,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(10px)',
        },
        modal: {
            width: '90%',
            maxWidth: '450px',
            background: 'linear-gradient(145deg, rgba(30, 30, 40, 0.9), rgba(15, 15, 20, 0.95))',
            borderRadius: '24px',
            padding: '30px',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(255, 215, 0, 0.05)',
            position: 'relative' as const,
            color: '#fff',
            fontFamily: "'Inter', sans-serif",
            overflow: 'hidden',
        },
        header: {
            textAlign: 'center' as const,
            marginBottom: '25px',
        },
        title: {
            fontSize: '24px',
            fontWeight: 700,
            background: 'linear-gradient(to right, #ffd700, #ffcc00)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 10px 0',
        },
        content: {
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '20px',
        },
        inputGroup: {
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '8px',
        },
        label: {
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.6)',
            fontWeight: 500,
        },
        input: {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '12px 16px',
            color: '#fff',
            fontSize: '16px',
            outline: 'none',
            transition: 'border-color 0.3s ease',
        },
        qrContainer: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            gap: '20px',
            padding: '20px 0',
        },
        qrImage: {
            width: '200px',
            height: '200px',
            borderRadius: '16px',
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.2)',
            backgroundColor: '#fff',
            padding: '10px',
        },
        addressBox: {
            width: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '12px',
            fontSize: '12px',
            wordBreak: 'break-all' as const,
            textAlign: 'center' as const,
            color: 'rgba(255, 255, 255, 0.8)',
            border: '1px dashed rgba(255, 215, 0, 0.3)',
        },
        feeInfo: {
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.5)',
            textAlign: 'right' as const,
            marginTop: '-15px',
        },
        cautionBox: {
            backgroundColor: 'rgba(255, 0, 0, 0.05)',
            border: '1px solid rgba(255, 0, 0, 0.2)',
            borderRadius: '12px',
            padding: '15px',
            fontSize: '13px',
        },
        cautionTitle: {
            color: '#ff4444',
            fontWeight: 700,
            marginBottom: '5px',
            display: 'block',
        },
        buttonGroup: {
            display: 'flex',
            gap: '12px',
            marginTop: '10px',
        },
        primaryBtn: {
            flex: 1,
            background: 'linear-gradient(135deg, #ffd700, #ffcc00)',
            border: 'none',
            borderRadius: '12px',
            padding: '15px',
            color: '#000',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        },
        secondaryBtn: {
            flex: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '15px',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '16px',
        },
        copyBtn: {
            marginTop: '10px',
            background: 'transparent',
            border: '1px solid rgba(255, 215, 0, 0.5)',
            color: '#ffd700',
            padding: '8px 20px',
            borderRadius: '20px',
            fontSize: '14px',
            cursor: 'pointer',
            fontWeight: 600,
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <h2 style={styles.title}>{type === 'receive' ? p2p.receive.title : p2p.send.title}</h2>
                </div>

                <div style={styles.content}>
                    {type === 'receive' ? (
                        <div style={styles.qrContainer}>
                            <QRCodeSVG 
                                value={walletAddress || 'BW_WALLET_UNAVAILABLE'}
                                size={200}
                                bgColor={"#ffffff"}
                                fgColor={"#000000"}
                                level={"Q"}
                                style={styles.qrImage}
                            />
                            <div style={styles.inputGroup}>
                                <span style={styles.label}>{p2p.receive.addressLabel}</span>
                                <div style={styles.addressBox}>{walletAddress}</div>
                            </div>
                            <button style={styles.copyBtn} onClick={handleCopyAddress}>
                                {p2p.receive.copyBtn}
                            </button>
                        </div>
                    ) : (
                        <>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>{p2p.send.addressLabel}</label>
                                <input 
                                    style={styles.input} 
                                    placeholder={p2p.send.addressPlaceholder}
                                    value={recipientAddress}
                                    onChange={e => setRecipientAddress(e.target.value)}
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>{p2p.send.amountLabel}</label>
                                <input 
                                    style={styles.input} 
                                    type="number"
                                    placeholder={p2p.send.amountPlaceholder}
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                />
                                <span style={styles.feeInfo}>
                                    {p2p.send.feeLabel}: {fee.toFixed(8)} BW
                                </span>
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>{p2p.send.otpLabel}</label>
                                <input 
                                    style={styles.input} 
                                    maxLength={6}
                                    placeholder={p2p.send.otpPlaceholder}
                                    value={otpCode}
                                    onChange={e => setOtpCode(e.target.value)}
                                />
                            </div>
                            <div style={styles.cautionBox}>
                                <span style={styles.cautionTitle}>{p2p.send.cautionTitle}</span>
                                <p style={{ margin: 0, whiteSpace: 'pre-line', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.4' }}>
                                    {p2p.send.cautionText}
                                </p>
                            </div>

                            {/* [Phase 3] 정산 안내 메시지 (15일 타임락) */}
                            <div style={{
                                fontSize: '12px',
                                color: 'rgba(255, 215, 0, 0.7)',
                                padding: '10px',
                                borderTop: '1px solid rgba(255, 215, 0, 0.1)',
                                marginTop: '10px',
                                lineHeight: '1.5'
                            }}>
                                {walletService.getSettlementGuide(currentLanguage)}
                            </div>
                        </>
                    )}

                    <div style={styles.buttonGroup}>
                        {type === 'send' && (
                            <button 
                                style={{
                                    ...styles.primaryBtn,
                                    opacity: isProcessing ? 0.7 : 1,
                                    cursor: isProcessing ? 'not-allowed' : 'pointer'
                                }} 
                                onClick={handleSend}
                                disabled={isProcessing}
                            >
                                {isProcessing ? 'Processing...' : p2p.send.confirmBtn}
                            </button>
                        )}
                        <button style={styles.secondaryBtn} onClick={onClose}>
                            {type === 'send' ? p2p.send.cancelBtn : getTranslation('wallet.dashboard.footer.close')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransferModal;
