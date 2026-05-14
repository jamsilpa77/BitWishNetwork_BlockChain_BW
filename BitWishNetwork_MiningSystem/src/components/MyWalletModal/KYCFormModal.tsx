import React, { useState, useRef, useEffect } from 'react';
import { LanguageManager } from '@/utils/LanguageManager/LanguageManager';
import { apiService } from '../../services/ApiService';
import './KYCFormModal.css';

interface KYCFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentLanguage: string;
    walletAddress: string;
}

const KYCFormModal: React.FC<KYCFormModalProps> = ({ isOpen, onClose, currentLanguage, walletAddress }) => {
    const [languageManager] = useState(() => new LanguageManager());
    const t = (key: string) => languageManager.translate(key, currentLanguage);

    const [fullName, setFullName] = useState('');
    const [birthDate, setBirthDate] = useState(''); // 생년월일 상태 추가
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
    const [roadAddress, setRoadAddress] = useState('');
    const [detailAddress, setDetailAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isAgreed, setIsAgreed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isKYCActive, setIsKYCActive] = useState<boolean>(true); // 거버넌스 상태
    const [isCheckingConfig, setIsCheckingConfig] = useState<boolean>(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) {
            // 초기화
            setFullName('');
            setCountry('');
            setCity('');
            setRoadAddress('');
            setDetailAddress('');
            setPhone('');
            setSelectedFile(null);
            setPreviewUrl(null);
            setIsAgreed(false);
        } else {
            // 거버넌스 상태 체크
            checkGovernance();
        }
    }, [isOpen]);

    const checkGovernance = async () => {
        setIsCheckingConfig(true);
        try {
            const data = await apiService.getKYCConfig();
            if (data && typeof data.isActive === 'boolean') {
                setIsKYCActive(data.isActive);
            }
        } catch (error) {
            console.error('Failed to check KYC governance:', error);
            setIsKYCActive(true); // 에러 시 보수적으로 활성 유지
        } finally {
            setIsCheckingConfig(false);
        }
    };

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile || !isAgreed) {
            alert(t('kyc.required_fields_error'));
            return;
        }

        setIsSubmitting(true);

        try {
            // 파일을 Base64로 변환 (시스템 호환성 확보)
            const reader = new FileReader();
            const idImageBase64 = await new Promise<string>((resolve, reject) => {
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(selectedFile);
            });

            const kycData = {
                walletAddress,
                fullName,
                birthDate, // 생년월일 전송 추가
                country,
                phone,
                address: {
                    city,
                    roadAddress,
                    detailAddress
                },
                idImageBase64
            };

            const response = await apiService.submitKYC(kycData);
            
            if (response.success) {
                alert(t('kyc.submission_success'));
                onClose();
            } else {
                alert(t('kyc.submission_failed'));
            }
        } catch (error) {
            console.error('KYC submission error:', error);
            alert(t('kyc.submission_failed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="kyc-modal-overlay" onClick={onClose}>
            <div className="kyc-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="kyc-header">
                    <h2>{t('kyc.verification_title')}</h2>
                    <p>{t('kyc.upload_instruction')}</p>
                </div>

                <div className="kyc-notice-area">
                    <h4 className="kyc-notice-title">{t('kyc.notice_title')}</h4>
                    <p className="kyc-notice-content">{t('kyc.notice_content')}</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="kyc-form-group">
                        <label className="kyc-label">{t('kyc.full_name_label')}</label>
                        <input 
                            type="text" 
                            className="kyc-input" 
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder={t('kyc.full_name_placeholder')}
                            required
                        />
                    </div>

                    <div className="kyc-form-group">
                        <label className="kyc-label">{t('kyc.birth_date_label')}</label>
                        <input 
                            type="text" 
                            className="kyc-input" 
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            placeholder={t('kyc.birth_date_placeholder')}
                            required
                        />
                    </div>

                    <div className="kyc-address-row">
                        <div className="kyc-form-group">
                            <label className="kyc-label">{t('kyc.country_label')}</label>
                            <input 
                                type="text" 
                                className="kyc-input" 
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                placeholder={t('kyc.country_placeholder')}
                                required
                            />
                        </div>
                        <div className="kyc-form-group">
                            <label className="kyc-label">{t('kyc.phone_label')}</label>
                            <input 
                                type="tel" 
                                className="kyc-input" 
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder={t('kyc.phone_placeholder')}
                                required
                            />
                        </div>
                    </div>

                    <div className="kyc-form-group">
                        <label className="kyc-label">{t('kyc.address_label')}</label>
                        <div className="kyc-address-row">
                            <input 
                                type="text" 
                                className="kyc-input" 
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder={t('kyc.city_placeholder')}
                                required
                            />
                            <input 
                                type="text" 
                                className="kyc-input" 
                                value={roadAddress}
                                onChange={(e) => setRoadAddress(e.target.value)}
                                placeholder={t('kyc.road_address_placeholder')}
                                required
                            />
                        </div>
                        <input 
                            type="text" 
                            className="kyc-input" 
                            value={detailAddress}
                            onChange={(e) => setDetailAddress(e.target.value)}
                            placeholder={t('kyc.detail_address_placeholder')}
                            style={{ marginTop: '10px' }}
                        />
                    </div>

                    <div className="kyc-form-group">
                        <label className="kyc-label">{t('kyc.id_upload_label')}</label>
                        <div 
                            className="kyc-upload-area" 
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {!previewUrl ? (
                                <>
                                    <div className="kyc-upload-icon">📷</div>
                                    <div className="kyc-upload-text">{t('kyc.upload_instruction')}</div>
                                </>
                            ) : (
                                <div className="kyc-preview-container">
                                    <img src={previewUrl} alt="Preview" className="kyc-preview-image" />
                                    <button 
                                        type="button" 
                                        className="kyc-remove-file"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedFile(null);
                                            setPreviewUrl(null);
                                        }}
                                    >✕</button>
                                </div>
                            )}
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>

                    <div className="kyc-terms" onClick={() => setIsAgreed(!isAgreed)}>
                        <input 
                            type="checkbox" 
                            checked={isAgreed}
                            onChange={() => {}} // onClick으로 처리
                        />
                        <span className="kyc-terms-text">{t('kyc.terms_verify')}</span>
                    </div>

                    <div className="kyc-actions">
                        <button type="button" className="kyc-btn-cancel" onClick={onClose}>
                            {t('kyc.cancel_btn')}
                        </button>
                        <button 
                            type="submit" 
                            className="kyc-btn-submit"
                            disabled={isSubmitting || !isAgreed}
                        >
                            {isSubmitting ? t('kyc.submitting') : t('kyc.submit_btn')}
                        </button>
                    </div>
                </form>

                {/* 프리미엄 락다운 안내 팝업 (거버넌스 제어 레이어) */}
                {!isKYCActive && !isCheckingConfig && (
                    <div className="kyc-lockdown-overlay">
                        <div className="kyc-lockdown-popup">
                            <div className="lockdown-icon">⚠️</div>
                            <h3 className="lockdown-title">{t('kyc.lockdown_title')}</h3>
                            <p className="lockdown-message">{t('kyc.lockdown_message')}</p>
                            <button className="lockdown-close-btn" onClick={onClose}>
                                {t('kyc.lockdown_close_btn')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KYCFormModal;
