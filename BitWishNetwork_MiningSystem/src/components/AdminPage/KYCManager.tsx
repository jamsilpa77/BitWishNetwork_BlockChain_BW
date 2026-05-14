/**
 * BitWishNetwork KYC Governance Manager
 * [공정 2-2] 실시간 거버넌스 제어 시스템
 * 
 * ⚠️ 절대 준수 사항: 
 * 1. 전역 상태/변수/함수 사용 금지
 * 2. 독립적 데이터 라이프사이클 관리
 * 3. 4개국어 다국어 및 다크/라이트 테마 완벽 대응
 */

import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/ApiService';
import { LanguageManager } from '../../utils/LanguageManager/LanguageManager';
import './KYCManager.css';

const KYCManager: React.FC = () => {
    const [isActive, setIsActive] = useState<boolean>(true);
    const [isMigrationActive, setIsMigrationActive] = useState<boolean>(false); // [Phase 2] 신규 마스터 스위치
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const [isMigrationUpdating, setIsMigrationUpdating] = useState<boolean>(false);
    
    // 현재 언어 및 번역 함수 (독립적 운용)
    const [languageManager] = useState(() => new LanguageManager());
    const t = (key: string) => languageManager.translate(key, languageManager.getCurrentLanguage());

    // 초기 상태 로드
    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setIsLoading(true);
        try {
            const data = await apiService.getKYCConfig();
            if (data && typeof data.isActive === 'boolean') {
                setIsActive(data.isActive);
            }
            
            // [Phase 2] 마이그레이션 글로벌 설정 로드
            const migrationData = await apiService.getMigrationConfig();
            if (migrationData && typeof migrationData.isActive === 'boolean') {
                setIsMigrationActive(migrationData.isActive);
            }
        } catch (error) {
            console.error('Failed to fetch config:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 거버넌스 스위치 토글
    const handleToggle = async () => {
        if (isUpdating) return;
        
        const nextState = !isActive;
        setIsUpdating(true);
        
        try {
            const result = await apiService.updateKYCConfig(nextState);
            if (result && result.success) {
                setIsActive(nextState);
            } else {
                alert(t('kyc.submission_failed'));
            }
        } catch (error) {
            console.error('Failed to update KYC config:', error);
            alert(t('kyc.submission_failed'));
        } finally {
            setIsUpdating(false);
        }
    };

    // [Phase 2] 마이그레이션 글로벌 스위치 토글
    const handleMigrationToggle = async () => {
        if (isMigrationUpdating) return;
        
        const nextState = !isMigrationActive;
        setIsMigrationUpdating(true);
        
        try {
            const result = await apiService.updateMigrationConfig(nextState);
            if (result && result.success) {
                setIsMigrationActive(nextState);
            } else {
                alert("설정 업데이트 실패");
            }
        } catch (error) {
            console.error('Failed to update migration config:', error);
            alert("통신 오류 발생");
        } finally {
            setIsMigrationUpdating(false);
        }
    };

    const [pendingList, setPendingList] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [rejectionReason, setRejectionReason] = useState<string>('');
    const [showRejectionModal, setShowRejectionModal] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    // 심사 리스트 로드
    useEffect(() => {
        if (!isLoading) {
            loadPendingList();
        }
    }, [isLoading]);

    const loadPendingList = async () => {
        try {
            const result = await apiService.getKYCPendingList();
            if (result && result.success) {
                setPendingList(result.data);
            }
        } catch (error) {
            console.error('Failed to load pending list:', error);
        }
    };

    // 심사 처리 (승인/반려)
    const handleProcessKYC = async (status: 'APPROVED' | 'REJECTED') => {
        if (!selectedUser || isProcessing) return;
        
        if (status === 'REJECTED' && !rejectionReason.trim()) {
            alert(t('kyc.input_rejection_reason'));
            return;
        }

        setIsProcessing(true);
        try {
            const result = await apiService.updateKYCStatus(selectedUser.walletAddress, status, rejectionReason);
            if (result && result.success) {
                alert(status === 'APPROVED' ? 'KYC 승인 완료' : 'KYC 반려 처리 완료');
                setSelectedUser(null);
                setRejectionReason('');
                setShowRejectionModal(false);
                loadPendingList(); // 리스트 갱신
            }
        } catch (error) {
            console.error('Failed to process KYC:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return <div className="kyc-manager-loading">{t('kyc.submitting')}</div>;
    }

    return (
        <div className="kyc-governance-container">
            {/* [Phase 2] 최상단 글로벌 마이그레이션 마스터 스위치 */}
            <div className="governance-header migration-master-header">
                <div className="governance-info">
                    <h3 className="governance-title master-title">
                        {t('kyc.migration_master_title')}
                    </h3>
                    <p className="governance-desc">
                        {isMigrationActive 
                            ? t('kyc.migration_master_desc_active')
                            : t('kyc.migration_master_desc_inactive')}
                    </p>
                </div>
                
                <div className="governance-control">
                    <div className={`governance-switch master-switch ${isMigrationActive ? 'active' : 'inactive'} ${isMigrationUpdating ? 'processing' : ''}`} onClick={handleMigrationToggle}>
                        <div className="switch-handle"></div>
                        <span className="switch-label">
                            {isMigrationActive ? 'OPEN' : 'CLOSED'}
                        </span>
                    </div>
                </div>
            </div>

            {/* 상단 거버넌스 스위치 (기존 로직 보존) */}
            <div className="governance-header">
                <div className="governance-info">
                    <h3 className="governance-title">
                        {t('kyc.verification_title')} {t('explorer.network')} {t('kyc.lockdown_title')}
                    </h3>
                    <p className="governance-desc">
                        {isActive 
                            ? "현재 전 세계 유저의 KYC 신청이 활성화된 상태입니다." 
                            : "현재 모든 유저의 KYC 신청이 차단(락다운)된 상태입니다."}
                    </p>
                </div>
                
                <div className="governance-control">
                    <div className={`governance-switch ${isActive ? 'active' : 'inactive'} ${isUpdating ? 'processing' : ''}`} onClick={handleToggle}>
                        <div className="switch-handle"></div>
                        <span className="switch-label">
                            {isActive ? 'ACTIVE' : 'LOCKED'}
                        </span>
                    </div>
                </div>
            </div>

            {/* [공정 3] 실시간 KYC 심사 센터 본체 */}
            <div className="kyc-review-center">
                <div className="review-header">
                    <h3 className="review-title">{t('kyc.review_list_title')} ({pendingList.length})</h3>
                    <button className="refresh-btn" onClick={loadPendingList}>🔄</button>
                </div>

                <div className="review-grid">
                    {/* 왼쪽: 신청자 리스트 */}
                    <div className="review-list-panel">
                        {pendingList.length === 0 ? (
                            <div className="empty-list">심사 대기 중인 신청자가 없습니다.</div>
                        ) : (
                            pendingList.map((user) => (
                                <div 
                                    key={user.walletAddress} 
                                    className={`review-card ${selectedUser?.walletAddress === user.walletAddress ? 'selected' : ''}`}
                                    onClick={() => setSelectedUser(user)}
                                >
                                    <div className="user-info">
                                        <span className="user-name">{user.kycApplication?.fullName}</span>
                                        <span className="user-address">{user.walletAddress.substring(0, 10)}...</span>
                                    </div>
                                    <div className="status-badge pending">PENDING</div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* 오른쪽: 상세 심사 패널 */}
                    <div className="review-detail-panel">
                        {selectedUser ? (
                            <div className="detail-content animate-fade-in">
                                <div className="detail-section">
                                    <h4>기본 정보</h4>
                                    <div className="info-grid">
                                        <div className="info-item"><label>{t('kyc.full_name_label')}:</label> <span>{selectedUser.kycApplication?.fullName}</span></div>
                                        <div className="info-item"><label>{t('kyc.birth_date_label')}:</label> <span>{selectedUser.kycApplication?.birthDate}</span></div>
                                        <div className="info-item"><label>{t('kyc.phone_label')}:</label> <span>{selectedUser.kycApplication?.phone}</span></div>
                                        <div className="info-item"><label>{t('kyc.country_label')}:</label> <span>{selectedUser.kycApplication?.country}</span></div>
                                        <div className="info-item"><label>지갑:</label> <span className="addr">{selectedUser.walletAddress}</span></div>
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <h4>{t('kyc.id_upload_label')} (High-Res)</h4>
                                    <div className="id-viewer-container">
                                        <img 
                                            src={selectedUser.kycApplication?.idImageBase64 || '/assets/images/no-image.png'} 
                                            alt="ID Preview" 
                                            className="id-image-preview" 
                                            onClick={() => window.open(selectedUser.kycApplication?.idImageBase64, '_blank')}
                                        />
                                        <p className="viewer-hint">이미지를 클릭하면 원본 고해상도 뷰어로 열립니다.</p>
                                    </div>
                                </div>

                                <div className="detail-actions">
                                    <button 
                                        className="btn-approve" 
                                        onClick={() => handleProcessKYC('APPROVED')}
                                        disabled={isProcessing}
                                    >
                                        {t('kyc.approve_action')}
                                    </button>
                                    <button 
                                        className="btn-reject" 
                                        onClick={() => setShowRejectionModal(true)}
                                        disabled={isProcessing}
                                    >
                                        {t('kyc.reject_action')}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="detail-placeholder">
                                <p>심사할 유저를 리스트에서 선택해 주세요.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 반려 사유 입력 모달 */}
            {showRejectionModal && (
                <div className="rejection-modal-overlay">
                    <div className="rejection-modal-content">
                        <h3>{t('kyc.rejection_reason_title')}</h3>
                        <textarea 
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder={t('kyc.rejection_placeholder')}
                        />
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowRejectionModal(false)}>{t('kyc.cancel_btn')}</button>
                            <button className="btn-confirm-reject" onClick={() => handleProcessKYC('REJECTED')}>{t('kyc.reject_action')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KYCManager;
