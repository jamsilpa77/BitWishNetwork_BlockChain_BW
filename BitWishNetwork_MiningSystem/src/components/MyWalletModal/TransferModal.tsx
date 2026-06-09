import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { LanguageManager } from '../../utils/LanguageManager/LanguageManager';
import { walletService } from '../../services/BlockchainService/WalletService';
import { apiService } from '../../services/ApiService';
import { Decimal } from 'decimal.js';
import { PrecisionCalculator } from '../../utils/PrecisionCalculator/PrecisionCalculator';

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'send' | 'receive';
    walletAddress: string;
    availableBalance: Decimal;
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
    const [precisionCalculator] = useState(() => new PrecisionCalculator());

    // 드래그 및 위치 상태 정의
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // 웹 브라우저 경고창(alert)을 대신할 고급 안내창의 상태값
    const [alertModal, setAlertModal] = useState({ isOpen: false, message: '' });

    // 입력 필드 상태값
    const [recipientAddress, setRecipientAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [fee, setFee] = useState<Decimal>(new Decimal(0));

    // [중요 수복] 누락되었던 송금 진행 상태 스위치(isProcessing) 추가 정의
    const [isProcessing, setIsProcessing] = useState(false);

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

    // "나의 지갑" 모달의 상하좌우를 감지해 정중앙으로 완벽 정렬시키는 공식
    useEffect(() => {
        if (isOpen) {
            const walletEl = document.querySelector('.my-wallet-modal');
            if (walletEl) {
                const rect = walletEl.getBoundingClientRect();
                const modalWidth = 450;
                const modalHeight = type === 'receive' ? 480 : 620;

                const x = rect.left + (rect.width - Math.min(window.innerWidth * 0.9, modalWidth)) / 2;
                const y = rect.top + (rect.height - modalHeight) / 2;
                setPosition({ x, y });
            } else {
                const width = 450;
                const x = (window.innerWidth - Math.min(window.innerWidth * 0.9, width)) / 2;
                const y = 140;
                setPosition({ x, y });
            }
        }
    }, [isOpen, type]);

    // 마우스 드래그 기능 수식
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const newX = e.clientX - dragOffset.x;
                const newY = e.clientY - dragOffset.y;
                setPosition({ x: newX, y: newY });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.transfer-header-handle')) {
            setIsDragging(true);
            setDragOffset({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    };

    useEffect(() => {
        if (amount && !isNaN(parseFloat(amount))) {
            const calculatedFee = new Decimal(amount).mul(0.0001);
            setFee(calculatedFee);
        } else {
            setFee(new Decimal(0));
        }
    }, [amount]);

    if (!isOpen) return null;

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(walletAddress);
        alert(getTranslation('wallet.dashboard.copyAddress') + '!');
    };

    // 송금하기 버튼 클릭 시 작동하는 함수
    const handleSend = async () => {
        setIsProcessing(true); // 로딩 시작

        // 브라우저 팝업 대신 커스텀 메시지 모달을 화면 한가운데에 노출합니다.
        setAlertModal({
            isOpen: true,
            message: currentLanguage === 'ko' ? '아직 KYC 신청 기간이 아닙니다.' : 'It is not the KYC application period yet.'
        });

        setIsProcessing(false); // 로딩 종료
    };

    const styles = {
        overlay: {
            position: 'fixed' as const,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 10200,
            backdropFilter: 'blur(10px)',
            pointerEvents: 'auto' as const
        },
        modal: {
            width: '90%',
            maxWidth: '450px',
            background: 'linear-gradient(145deg, rgba(30, 30, 40, 0.95), rgba(15, 15, 20, 0.98))',
            borderRadius: '24px',
            padding: '30px',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(255, 215, 0, 0.05)',
            position: 'fixed' as const,
            left: `${position.x}px`,
            top: `${position.y}px`,
            cursor: isDragging ? 'grabbing' : 'default',
            color: '#fff',
            fontFamily: "'Inter', sans-serif",
            overflow: 'hidden',
        },
        header: {
            textAlign: 'center' as const,
            marginBottom: '25px',
            paddingBottom: '10px',
            borderBottom: '1px solid rgba(255,255,255,0.05)'
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
            marginTop: '-10px',
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
        },
        // 모달 정중앙 고급 팝업창 스타일 정의
        alertOverlay: {
            position: 'absolute' as const,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10300,
            borderRadius: '24px',
            backdropFilter: 'blur(5px)',
        },
        alertBox: {
            width: '280px',
            backgroundColor: '#1E1E28',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center' as const,
            boxShadow: '0 15px 30px rgba(0,0,0,0.5)',
        },
        alertBtn: {
            width: '100%',
            padding: '12px',
            background: 'linear-gradient(135deg, #ffd700, #ffcc00)',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '14px',
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                {/* 헤더 바 부분 */}
                <div
                    style={{ ...styles.header, cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
                    className="transfer-header-handle"
                    onMouseDown={handleMouseDown}
                >
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
                                    {p2p.send.feeLabel}: {precisionCalculator.formatForUI(fee)} BW
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
                                {p2p.send.confirmBtn}
                            </button>
                        )}
                        <button style={styles.secondaryBtn} onClick={onClose}>
                            {type === 'send' ? p2p.send.cancelBtn : getTranslation('wallet.dashboard.footer.close')}
                        </button>
                    </div>
                </div>

                {/* 송금하기 모달 중앙에 뜨는 고급스러운 안내 모달 */}
                {alertModal.isOpen && (
                    <div style={styles.alertOverlay}>
                        <div style={styles.alertBox}>
                            <div style={{ fontSize: '40px', marginBottom: '15px' }}>⚠️</div>
                            <p style={{ fontSize: '14px', color: '#fff', fontWeight: '700', lineHeight: '1.6', marginBottom: '22px', textAlign: 'center' }}>
                                {alertModal.message}
                            </p>
                            <button
                                style={styles.alertBtn}
                                onClick={() => setAlertModal({ isOpen: false, message: '' })}
                            >
                                {currentLanguage === 'ko' ? '확인' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TransferModal;