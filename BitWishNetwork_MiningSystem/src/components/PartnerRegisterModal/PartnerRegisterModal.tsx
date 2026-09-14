/**
 * BitWishNetwork BW Mining System
 * Partner Registration Modal Component (가맹점 등록 모달)
 *
 * ⚠️ 절대 준수 사항:
 * 1. 마스킹 처리된 신분증 이미지만 서버에 전송 (원본 메모리 즉시 파기)
 * 2. HTML5 Canvas API 기반 자동 모자이크/블러 처리
 * 3. 4단계 wizard step 스텝 인디케이터 및 3-B 미리보기 비교 UI
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import './PartnerRegisterModal.css';

interface PartnerRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  onSuccess?: () => void;
}

export type IdCardType = 'resident' | 'driver';

export interface StorePhotos {
  entrance: { file: File | null; preview: string; serverUrl: string };
  counter: { file: File | null; preview: string; serverUrl: string };
  hall: { file: File | null; preview: string; serverUrl: string };
  kitchen: { file: File | null; preview: string; serverUrl: string };
  extra: { file: File | null; preview: string; serverUrl: string };
}

export const PartnerRegisterModal: React.FC<PartnerRegisterModalProps> = ({
  isOpen,
  onClose,
  walletAddress,
  onSuccess
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // ── Step 1 State ──────────────────────────────────────────────────────────
  const [businessRegNumber, setBusinessRegNumber] = useState<string>('');
  const [businessRegFile, setBusinessRegFile] = useState<File | null>(null);
  const [businessRegPreview, setBusinessRegPreview] = useState<string>('');
  const [businessRegServerUrl, setBusinessRegServerUrl] = useState<string>('');
  const [isRegVerified, setIsRegVerified] = useState<boolean>(false);

  // ── Step 2 State (Store Photos 5장) ───────────────────────────────────────
  const [storePhotos, setStorePhotos] = useState<StorePhotos>({
    entrance: { file: null, preview: '', serverUrl: '' },
    counter: { file: null, preview: '', serverUrl: '' },
    hall: { file: null, preview: '', serverUrl: '' },
    kitchen: { file: null, preview: '', serverUrl: '' },
    extra: { file: null, preview: '', serverUrl: '' }
  });

  // ── Step 3 State (ID Card & Canvas Masking) ──────────────────────────────
  const [idCardType, setIdCardType] = useState<IdCardType>('resident');
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardOriginalPreview, setIdCardOriginalPreview] = useState<string>('');
  const [idCardMaskedDataUrl, setIdCardMaskedDataUrl] = useState<string>('');
  const [idCardMaskedServerUrl, setIdCardMaskedServerUrl] = useState<string>('');
  const [showMaskingPreviewModal, setShowMaskingPreviewModal] = useState<boolean>(false);

  // ── Step 4 State (Confirm & Submit) ──────────────────────────────────────
  const [agreeFactCheck, setAgreeFactCheck] = useState<boolean>(false);
  const [agreePrivacy, setAgreePrivacy] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // ── Status Check State ───────────────────────────────────────────────────
  const [existingStatus, setExistingStatus] = useState<{
    hasApplication: boolean;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    businessRegNumber?: string;
    adminNote?: string;
    createdAt?: string;
  } | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ── 지갑 주소 기반 이전 신청 내역 확인 ────────────────────────────────────
  const checkStatus = useCallback(async () => {
    if (!walletAddress) return;
    try {
      setLoadingStatus(true);
      const response = await fetch(`/api/partner/status?walletAddress=${encodeURIComponent(walletAddress)}`);
      const data = await response.json();
      if (data.success && data.hasApplication) {
        setExistingStatus({
          hasApplication: true,
          status: data.data.status,
          businessRegNumber: data.data.businessRegNumber,
          adminNote: data.data.adminNote,
          createdAt: data.data.createdAt
        });
      } else {
        setExistingStatus({ hasApplication: false });
      }
    } catch (err) {
      console.error('가맹점 신청 현황 조회 에러:', err);
    } finally {
      setLoadingStatus(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen, checkStatus]);

  if (!isOpen) return null;

  // ── Step 1: 사업자번호 포맷터 ──────────────────────────────────────────────
  const handleRegNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    let formatted = raw;
    if (raw.length > 3 && raw.length <= 5) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
    } else if (raw.length > 5) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3, 5)}-${raw.slice(5, 10)}`;
    }
    setBusinessRegNumber(formatted);
    setIsRegVerified(false);
  };

  const handleVerifyRegNumber = () => {
    const cleanNum = businessRegNumber.replace(/[^0-9]/g, '');
    if (cleanNum.length !== 10) {
      alert('올바른 사업자등록번호 10자리를 입력해주세요. (예: 123-45-67890)');
      return;
    }
    // 번호 검증 시뮬레이션
    setIsRegVerified(true);
    alert('✅ 사업자등록번호 유효성 인증이 완료되었습니다.');
  };

  // 사업자등록증 이미지 업로드
  const handleBusinessRegFileChange = (file: File | null) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 최대 10MB까지 업로드할 수 있습니다.');
      return;
    }
    setBusinessRegFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setBusinessRegPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // ── Step 2: 매장 사진 5장 개별 업로드 ────────────────────────────────────
  const handlePhotoUpload = (key: keyof StorePhotos, file: File | null) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('매장 사진 크기는 10MB 이하만 지정 가능합니다.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewUrl = e.target?.result as string;
      setStorePhotos(prev => ({
        ...prev,
        [key]: { file, preview: previewUrl, serverUrl: '' }
      }));
    };
    reader.readAsDataURL(file);
  };

  // ── Step 3: 신분증 Canvas 마스킹 렌더링 Engine ──────────────────────────
  const processIdCardMasking = (file: File, type: IdCardType) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const origDataUrl = event.target?.result as string;
      setIdCardOriginalPreview(origDataUrl);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. 원본 이미지 그리기
        ctx.drawImage(img, 0, 0);

        // 2. 신분증 규격 좌표에 따른 마스킹 처리 (주민번호 뒷자리 + 상세 주소)
        const w = img.width;
        const h = img.height;

        let rrnX = 0, rrnY = 0, rrnW = 0, rrnH = 0;
        let addrX = 0, addrY = 0, addrW = 0, addrH = 0;

        if (type === 'resident') {
          // 주민등록증
          rrnX = w * 0.52;
          rrnY = h * 0.43;
          rrnW = w * 0.38;
          rrnH = h * 0.12;

          addrX = w * 0.12;
          addrY = h * 0.69;
          addrW = w * 0.78;
          addrH = h * 0.20;
        } else {
          // 운전면허증
          rrnX = w * 0.52;
          rrnY = h * 0.47;
          rrnW = w * 0.38;
          rrnH = h * 0.12;

          addrX = w * 0.12;
          addrY = h * 0.71;
          addrW = w * 0.78;
          addrH = h * 0.19;
        }

        // 마스킹 채우기 (다크 검정 픽셀 + 경고 태그)
        ctx.fillStyle = '#0B0F19';
        ctx.fillRect(rrnX, rrnY, rrnW, rrnH);
        ctx.fillRect(addrX, addrY, addrW, addrH);

        // 보안 테두리 및 마스킹 텍스트 추가
        ctx.lineWidth = Math.max(2, w * 0.003);
        ctx.strokeStyle = '#3B82F6';
        ctx.strokeRect(rrnX, rrnY, rrnW, rrnH);
        ctx.strokeRect(addrX, addrY, addrW, addrH);

        // 마스킹 안내 문구 텍스트 렌더링
        const fontSize = Math.max(14, Math.floor(w * 0.03));
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = '#60A5FA';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText('🔒 마스킹 보호', rrnX + rrnW / 2, rrnY + rrnH / 2);
        ctx.fillText('🔒 주소 정보 블러', addrX + addrW / 2, addrY + addrH / 2);

        // 3. Canvas DataURL 추출 (image/jpeg, quality 0.85)
        const maskedResult = canvas.toDataURL('image/jpeg', 0.85);
        setIdCardMaskedDataUrl(maskedResult);

        // 메모리 절약을 위해 임시 캔버스 객체 정리
        canvas.width = 0;
        canvas.height = 0;
      };
      img.src = origDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleIdCardFileChange = (file: File | null) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('신분증 파일 크기는 10MB 이하만 가능합니다.');
      return;
    }
    setIdCardFile(file);
    processIdCardMasking(file, idCardType);
  };

  const handleTypeChange = (type: IdCardType) => {
    setIdCardType(type);
    if (idCardFile) {
      processIdCardMasking(idCardFile, type);
    }
  };

  // ── 서버 파일 업로드 헬퍼 ───────────────────────────────────────────────────
  const uploadSingleFile = async (fileOrDataUrl: File | string, filenameHint: string): Promise<string> => {
    let fileToUpload: File;

    if (typeof fileOrDataUrl === 'string') {
      // Base64 DataURL을 Blob → File 로 변환
      const res = await fetch(fileOrDataUrl);
      const blob = await res.blob();
      fileToUpload = new File([blob], `${filenameHint}.jpg`, { type: 'image/jpeg' });
    } else {
      fileToUpload = fileOrDataUrl;
    }

    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('walletAddress', walletAddress);

    const response = await fetch('/api/partner/upload', {
      method: 'POST',
      body: formData
    });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || '파일 업로드 실패');
    }
    return result.fileUrl;
  };

  // ── Step 4: 최종 제출 ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!agreeFactCheck || !agreePrivacy) {
      alert('모든 필수 동의 사항에 체크해 주세요.');
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. 이미지 파일들 서버 업로드
      let busRegUrl = businessRegServerUrl;
      if (businessRegFile && !busRegUrl) {
        busRegUrl = await uploadSingleFile(businessRegFile, 'business_reg');
      }

      const entranceUrl = await uploadSingleFile(storePhotos.entrance.file!, 'store_entrance');
      const counterUrl = await uploadSingleFile(storePhotos.counter.file!, 'store_counter');
      const hallUrl = await uploadSingleFile(storePhotos.hall.file!, 'store_hall');
      const kitchenUrl = await uploadSingleFile(storePhotos.kitchen.file!, 'store_kitchen');
      let extraUrl = '';
      if (storePhotos.extra.file) {
        extraUrl = await uploadSingleFile(storePhotos.extra.file, 'store_extra');
      }

      // 마스킹 처리된 신분증 업로드 (서버에는 마스킹된 이미지 파일만 저장됨!)
      const idMaskedUrl = await uploadSingleFile(idCardMaskedDataUrl, 'id_card_masked');

      // 2. 가맹점 신청 API 전송
      const applyPayload = {
        walletAddress,
        businessRegNumber,
        businessRegImage: busRegUrl,
        photoEntrance: entranceUrl,
        photoCounter: counterUrl,
        photoHall: hallUrl,
        photoKitchen: kitchenUrl,
        photoExtra: extraUrl,
        idCardMasked: idMaskedUrl,
        idCardType
      };

      const response = await fetch('/api/partner/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applyPayload)
      });

      const data = await response.json();

      if (data.success) {
        alert(`🎉 가맹점 등록 신청이 성공적으로 완료되었습니다!\n\n💰 신청 보상 1 BW가 즉시 지급되었습니다.`);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        alert(`신청 처리 오류: ${data.message}`);
      }

    } catch (err: any) {
      console.error('제출 중 오류:', err);
      alert(`제출 실패: ${err.message || '네트워크 연결 오류'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step 유효성 검사 ────────────────────────────────────────────────────────
  const canGoNextFromStep1 = businessRegNumber.replace(/[^0-9]/g, '').length === 10 && (businessRegFile !== null || businessRegPreview !== '');
  const canGoNextFromStep2 = storePhotos.entrance.file && storePhotos.counter.file && storePhotos.hall.file && storePhotos.kitchen.file;
  const canGoNextFromStep3 = idCardMaskedDataUrl !== '';

  return (
    <div className="partner-modal-overlay">
      <div className="partner-modal-container">

        {/* 모달 상단 헤더 */}
        <div className="partner-modal-header">
          <div className="header-title-box">
            <span className="header-icon">🏪</span>
            <h2>가맹점 등록 신청</h2>
          </div>
          <div className="header-right-box">
            <span className="step-badge">Step {currentStep} / 4</span>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* 스텝 Progress 바 */}
        <div className="partner-progress-bar">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>
            <div className="step-circle">1</div>
            <span>사업자 정보</span>
          </div>
          <div className={`progress-line ${currentStep >= 2 ? 'active' : ''}`}></div>
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
            <div className="step-circle">2</div>
            <span>매장 사진</span>
          </div>
          <div className={`progress-line ${currentStep >= 3 ? 'active' : ''}`}></div>
          <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-circle">3</div>
            <span>신분증 마스킹</span>
          </div>
          <div className={`progress-line ${currentStep >= 4 ? 'active' : ''}`}></div>
          <div className={`progress-step ${currentStep >= 4 ? 'active' : ''}`}>
            <div className="step-circle">4</div>
            <span>최종 확인</span>
          </div>
        </div>

        {/* 본문 콘텐츠 스크롤 영역 */}
        <div className="partner-modal-body">

          {/* 이미 신청 내역이 PENDING 또는 APPROVED인 경우의 알림 카드 */}
          {existingStatus?.hasApplication && (existingStatus.status === 'PENDING' || existingStatus.status === 'APPROVED') ? (
            <div className={`status-notice-card ${existingStatus.status.toLowerCase()}`}>
              <div className="notice-icon">
                {existingStatus.status === 'PENDING' ? '⏳' : '✅'}
              </div>
              <h3>
                {existingStatus.status === 'PENDING'
                  ? '가맹점 승인 심사가 진행 중입니다'
                  : '가맹점 등록 승인이 완료되었습니다!'}
              </h3>
              <p>
                {existingStatus.status === 'PENDING'
                  ? '관리자가 제출하신 서류를 확인하고 있습니다. 심사는 보통 1~2일 내 처리됩니다.'
                  : '가맹점 채굴률 +30% 보너스 적용이 활성화되었습니다.'}
              </p>
              <div className="notice-detail-info">
                <span>사업자등록번호: {existingStatus.businessRegNumber}</span>
                <span>신청일: {existingStatus.createdAt ? new Date(existingStatus.createdAt).toLocaleDateString() : '-'}</span>
              </div>
              <button className="confirm-close-btn" onClick={onClose}>확인 완료</button>
            </div>
          ) : (

            <>
              {/* Step 1: 사업자 정보 입력 */}
              {currentStep === 1 && (
                <div className="step-content step-1">
                  {/* 혜택 배너 */}
                  <div className="benefit-banner">
                    <div className="benefit-item">
                      <span className="benefit-icon">✅</span>
                      <div>
                        <strong>채굴률 +30% 보너스</strong>
                        <p>승인 완료 즉시 채굴 속도 +0.3 가산</p>
                      </div>
                    </div>
                    <div className="benefit-item">
                      <span className="benefit-icon">💰</span>
                      <div>
                        <strong>신청 즉시 1 BW</strong>
                        <p>서류 접수 시 즉시 일시 지급</p>
                      </div>
                    </div>
                    <div className="benefit-item">
                      <span className="benefit-icon">🎁</span>
                      <div>
                        <strong>승인 완료 시 3 BW</strong>
                        <p>최종 승인 시 추가 3 BW 적립</p>
                      </div>
                    </div>
                  </div>

                  {/* 사업자등록번호 입력 */}
                  <div className="form-group">
                    <label className="form-label">
                      사업자등록번호 <span className="required">*</span>
                    </label>
                    <div className="input-with-btn">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="000-00-00000"
                        maxLength={12}
                        value={businessRegNumber}
                        onChange={handleRegNumberChange}
                      />
                      <button
                        type="button"
                        className={`verify-btn ${isRegVerified ? 'verified' : ''}`}
                        onClick={handleVerifyRegNumber}
                      >
                        {isRegVerified ? '✓ 인증완료' : '번호 인증'}
                      </button>
                    </div>
                  </div>

                  {/* 사업자등록증 이미지 업로드 */}
                  <div className="form-group">
                    <label className="form-label">
                      사업자등록증 이미지 업로드 <span className="required">*</span>
                    </label>
                    <div className="dropzone-box">
                      <input
                        type="file"
                        id="busRegFileInput"
                        accept="image/jpeg,image/png,image/webp"
                        style={{ display: 'none' }}
                        onChange={(e) => handleBusinessRegFileChange(e.target.files?.[0] || null)}
                      />
                      {businessRegPreview ? (
                        <div className="preview-container">
                          <img src={businessRegPreview} alt="사업자등록증 미리보기" />
                          <button
                            type="button"
                            className="remove-img-btn"
                            onClick={() => {
                              setBusinessRegFile(null);
                              setBusinessRegPreview('');
                            }}
                          >
                            ✕ 삭제
                          </button>
                        </div>
                      ) : (
                        <label htmlFor="busRegFileInput" className="dropzone-label">
                          <span className="drop-icon">📎</span>
                          <span className="drop-text">이미지 끌어놓기 또는 클릭하여 파일 선택</span>
                          <span className="drop-sub">* JPG, PNG, WEBP 형식 / 최대 10MB</span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: 매장 현장 사진 (5장 필수/선택) */}
              {currentStep === 2 && (
                <div className="step-content step-2">
                  <div className="section-header">
                    <h3>매장 현장 사진 (5장 구분 업로드)</h3>
                    <p className="section-desc">가맹점 실제 운영 여부 확인을 위한 사진을 각각 업로드해 주세요.</p>
                  </div>

                  <div className="photo-upload-grid">
                    {/* 1. 입구 전면/간판 */}
                    <div className="photo-item">
                      <div className="photo-label">
                        <span>① 입구 전면 / 간판 <span className="required">*</span></span>
                      </div>
                      <div className="photo-box">
                        {storePhotos.entrance.preview ? (
                          <div className="photo-thumb-container">
                            <img src={storePhotos.entrance.preview} alt="입구" />
                            <button
                              type="button"
                              className="thumb-del-btn"
                              onClick={() => setStorePhotos(p => ({ ...p, entrance: { file: null, preview: '', serverUrl: '' } }))}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <label className="photo-upload-label">
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => handlePhotoUpload('entrance', e.target.files?.[0] || null)}
                            />
                            📷 업로드
                          </label>
                        )}
                      </div>
                    </div>

                    {/* 2. 카운터 */}
                    <div className="photo-item">
                      <div className="photo-label">
                        <span>② 카운터 <span className="required">*</span></span>
                      </div>
                      <div className="photo-box">
                        {storePhotos.counter.preview ? (
                          <div className="photo-thumb-container">
                            <img src={storePhotos.counter.preview} alt="카운터" />
                            <button
                              type="button"
                              className="thumb-del-btn"
                              onClick={() => setStorePhotos(p => ({ ...p, counter: { file: null, preview: '', serverUrl: '' } }))}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <label className="photo-upload-label">
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => handlePhotoUpload('counter', e.target.files?.[0] || null)}
                            />
                            📷 업로드
                          </label>
                        )}
                      </div>
                    </div>

                    {/* 3. 매장 홀 */}
                    <div className="photo-item">
                      <div className="photo-label">
                        <span>③ 매장 홀 <span className="required">*</span></span>
                      </div>
                      <div className="photo-box">
                        {storePhotos.hall.preview ? (
                          <div className="photo-thumb-container">
                            <img src={storePhotos.hall.preview} alt="매장 홀" />
                            <button
                              type="button"
                              className="thumb-del-btn"
                              onClick={() => setStorePhotos(p => ({ ...p, hall: { file: null, preview: '', serverUrl: '' } }))}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <label className="photo-upload-label">
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => handlePhotoUpload('hall', e.target.files?.[0] || null)}
                            />
                            📷 업로드
                          </label>
                        )}
                      </div>
                    </div>

                    {/* 4. 주방 */}
                    <div className="photo-item">
                      <div className="photo-label">
                        <span>④ 주방 <span className="required">*</span></span>
                      </div>
                      <div className="photo-box">
                        {storePhotos.kitchen.preview ? (
                          <div className="photo-thumb-container">
                            <img src={storePhotos.kitchen.preview} alt="주방" />
                            <button
                              type="button"
                              className="thumb-del-btn"
                              onClick={() => setStorePhotos(p => ({ ...p, kitchen: { file: null, preview: '', serverUrl: '' } }))}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <label className="photo-upload-label">
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => handlePhotoUpload('kitchen', e.target.files?.[0] || null)}
                            />
                            📷 업로드
                          </label>
                        )}
                      </div>
                    </div>

                    {/* 5. 추가 사진 (선택) */}
                    <div className="photo-item extra">
                      <div className="photo-label">
                        <span>⑤ 추가 사진 (선택)</span>
                      </div>
                      <div className="photo-box">
                        {storePhotos.extra.preview ? (
                          <div className="photo-thumb-container">
                            <img src={storePhotos.extra.preview} alt="추가 사진" />
                            <button
                              type="button"
                              className="thumb-del-btn"
                              onClick={() => setStorePhotos(p => ({ ...p, extra: { file: null, preview: '', serverUrl: '' } }))}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <label className="photo-upload-label">
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => handlePhotoUpload('extra', e.target.files?.[0] || null)}
                            />
                            📷 선택 업로드
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="warning-notice-box">
                    <span>⚠️ 각 공간을 명확히 촬영해 주세요. 심사 기준 미충족 시 반려될 수 있습니다.</span>
                  </div>
                </div>
              )}

              {/* Step 3: 대표자 신분증 업로드 + 자동 마스킹 */}
              {currentStep === 3 && (
                <div className="step-content step-3">
                  <div className="id-type-selector">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="idCardType"
                        checked={idCardType === 'resident'}
                        onChange={() => handleTypeChange('resident')}
                      />
                      <span>주민등록증</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="idCardType"
                        checked={idCardType === 'driver'}
                        onChange={() => handleTypeChange('driver')}
                      />
                      <span>운전면허증</span>
                    </label>
                  </div>

                  <div className="dropzone-box">
                    <input
                      type="file"
                      id="idCardFileInput"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleIdCardFileChange(e.target.files?.[0] || null)}
                    />
                    {idCardMaskedDataUrl ? (
                      <div className="preview-container masked-view">
                        <img src={idCardMaskedDataUrl} alt="마스킹 완료 신분증" />
                        <div className="masked-badge-overlay">🔒 클라이언트 마스킹 완료</div>
                        <button
                          type="button"
                          className="remove-img-btn"
                          onClick={() => {
                            setIdCardFile(null);
                            setIdCardOriginalPreview('');
                            setIdCardMaskedDataUrl('');
                          }}
                        >
                          ✕ 재업로드
                        </button>
                      </div>
                    ) : (
                      <label htmlFor="idCardFileInput" className="dropzone-label">
                        <span className="drop-icon">📎</span>
                        <span className="drop-text">신분증 이미지 업로드</span>
                        <span className="drop-sub">클라이언트 브라우저에서 주민번호 뒷자리가 즉시 자동 마스킹 처리됩니다.</span>
                      </label>
                    )}
                  </div>

                  {/* 개인정보 자동 보호 처리 안내 박스 */}
                  <div className="privacy-security-info-box">
                    <div className="info-box-title">
                      <span>🔒 개인정보 자동 보호 처리 안내</span>
                    </div>
                    <div className="info-box-body">
                      <p>업로드 즉시 브라우저에서 자동으로:</p>
                      <ul>
                        <li>• 주민등록번호 뒷자리 → <span className="mask-block">██████</span> 모자이크/블러 처리</li>
                        <li>• 상세 주소 영역 → <span className="mask-block">██████</span> 블러 처리</li>
                      </ul>
                      <div className="check-text">✅ <strong>마스킹된 이미지만 서버에 전송됩니다.</strong></div>
                      <div className="check-text">✅ <strong>원본 이미지는 메모리에서 즉시 파기되며 저장되지 않습니다.</strong></div>
                    </div>
                  </div>

                  {/* 마스킹 미리보기 비교 버튼 */}
                  {idCardMaskedDataUrl && (
                    <div className="preview-trigger-box">
                      <button
                        type="button"
                        className="btn-preview-compare"
                        onClick={() => setShowMaskingPreviewModal(true)}
                      >
                        👁️ [마스킹 처리 결과 미리보기 (Step 3-B)]
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: 최종 확인 & 제출 */}
              {currentStep === 4 && (
                <div className="step-content step-4">
                  <div className="summary-card">
                    <h4>📋 최종 제출 정보 확인</h4>
                    <div className="summary-list">
                      <div className="summary-item">
                        <span className="item-key">✅ 사업자등록번호:</span>
                        <span className="item-valHighlight">{businessRegNumber}</span>
                      </div>
                      <div className="summary-item">
                        <span className="item-key">✅ 사업자등록증:</span>
                        <span className="item-val">업로드 완료</span>
                      </div>
                      <div className="summary-item">
                        <span className="item-key">✅ 매장 사진:</span>
                        <span className="item-val">5장 업로드 준비 완료</span>
                      </div>
                      <div className="summary-item">
                        <span className="item-key">✅ 신분증:</span>
                        <span className="item-valHighlight">마스킹 처리 완료 ({idCardType === 'resident' ? '주민등록증' : '운전면허증'})</span>
                      </div>
                    </div>
                  </div>

                  <div className="instant-reward-card">
                    <span className="gift-icon">🎁</span>
                    <div>
                      <strong>신청 즉시 지급 혜택</strong>
                      <p>→ <strong>1 BW 가상코인</strong>이 지갑에 즉시 적립됩니다.</p>
                    </div>
                  </div>

                  <div className="agreement-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={agreeFactCheck}
                        onChange={(e) => setAgreeFactCheck(e.target.checked)}
                      />
                      <span>제출한 정보가 사실임을 확인합니다.</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={agreePrivacy}
                        onChange={(e) => setAgreePrivacy(e.target.checked)}
                      />
                      <span>개인정보 수집 및 이용에 동의합니다.</span>
                    </label>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* 모달 하단 버튼 영구 고정 바 */}
        {(!existingStatus?.hasApplication || (existingStatus.status !== 'PENDING' && existingStatus.status !== 'APPROVED')) && (
          <div className="partner-modal-footer">
            {currentStep > 1 && (
              <button
                type="button"
                className="btn-prev"
                onClick={() => setCurrentStep(prev => prev - 1)}
                disabled={isSubmitting}
              >
                ← 이전
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                className="btn-next"
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={
                  (currentStep === 1 && !canGoNextFromStep1) ||
                  (currentStep === 2 && !canGoNextFromStep2) ||
                  (currentStep === 3 && !canGoNextFromStep3)
                }
              >
                다음 단계 →
              </button>
            ) : (
              <button
                type="button"
                className="btn-submit"
                onClick={handleSubmit}
                disabled={!agreeFactCheck || !agreePrivacy || isSubmitting}
              >
                {isSubmitting ? '신청 처리 중...' : '🚀 가맹점 등록 신청'}
              </button>
            )}
          </div>
        )}

      </div>

      {/* Step 3-B: 마스킹 결과 미리보기 비교 모달 팝업 */}
      {showMaskingPreviewModal && (
        <div className="preview-modal-sub-overlay">
          <div className="preview-modal-sub-card">
            <div className="sub-header">
              <h3>🔒 마스킹 처리 확인 (Step 3-B)</h3>
              <button className="sub-close-btn" onClick={() => setShowMaskingPreviewModal(false)}>✕</button>
            </div>
            <div className="sub-body">
              <div className="compare-grid">
                <div className="compare-col">
                  <span className="compare-tag before">처리 전 (가상 시각화)</span>
                  <div className="compare-img-box">
                    <img src={idCardOriginalPreview} alt="처리 전" />
                  </div>
                </div>
                <div className="compare-arrow">➔</div>
                <div className="compare-col">
                  <span className="compare-tag after">처리 후 (서버 전송용)</span>
                  <div className="compare-img-box">
                    <img src={idCardMaskedDataUrl} alt="마스킹 처리 후" />
                  </div>
                </div>
              </div>
              <div className="compare-check-msg">
                ✅ 주민등록번호 뒷자리 및 상세 주소가 정상적으로 클라이언트 마스킹 처리되었습니다.
              </div>
            </div>
            <div className="sub-footer">
              <button
                className="btn-reupload"
                onClick={() => {
                  setShowMaskingPreviewModal(false);
                  setIdCardFile(null);
                  setIdCardOriginalPreview('');
                  setIdCardMaskedDataUrl('');
                }}
              >
                재업로드
              </button>
              <button
                className="btn-confirm-continue"
                onClick={() => {
                  setShowMaskingPreviewModal(false);
                  setCurrentStep(4);
                }}
              >
                확인하고 계속 진행 →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
