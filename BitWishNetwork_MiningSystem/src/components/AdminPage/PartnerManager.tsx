/**
 * BitWishNetwork Admin System
 * Partner Management Tab Component (가맹점 승인/반려 관리 탭)
 *
 * ⚠️ 주요 기능:
 * 1. 상태별 필터링 탭 (전체 | 심사대기 | 승인완료 | 반려)
 * 2. 신청 내역 목록 테이블 & 페이지네이션
 * 3. 상세보기 갤러리 모달 (사업자등록증, 매장사진 5장, 마스킹 신분증 뷰어)
 * 4. 관리자 승인 (POST /api/partner/admin/approve/:id) 및 반려 (POST /api/partner/admin/reject/:id)
 */

import React, { useState, useEffect, useCallback } from 'react';
import './PartnerManager.css';

export interface PartnerApplicationData {
  _id: string;
  walletAddress: string;
  businessRegNumber: string;
  businessRegImage: string;
  photoEntrance: string;
  photoCounter: string;
  photoHall: string;
  photoKitchen: string;
  photoExtra?: string;
  idCardMasked: string;
  idCardType: 'resident' | 'driver';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  registrationBonusPaid: boolean;
  approvalBonusPaid: boolean;
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const PartnerManager: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [applications, setApplications] = useState<PartnerApplicationData[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // 상세보기 모달 상태
  const [selectedApp, setSelectedApp] = useState<PartnerApplicationData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [adminNoteInput, setAdminNoteInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // 이미지 크게 보기 라이트박스 팝업 상태
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // ── 목록 조회 API 호출 ───────────────────────────────────────────────────
  const fetchApplications = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');

      const url = `/api/partner/admin/list?status=${filterStatus}&page=${page}&limit=10`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success && data.data) {
        setApplications(data.data.applications || []);
        setTotalCount(data.data.pagination?.total || 0);
        setTotalPages(data.data.pagination?.totalPages || 1);
      } else {
        setErrorMsg(data.message || '신청 목록을 불러오지 못했습니다.');
      }
    } catch (err: any) {
      console.error('가맹점 신청 목록 조회 에러:', err);
      setErrorMsg('서버 연동 실패: ' + (err.message || '네트워크 오류'));
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, page]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // ── 필터 변경 ─────────────────────────────────────────────────────────────
  const handleFilterChange = (status: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED') => {
    setFilterStatus(status);
    setPage(1);
  };

  // ── 상세보기 모달 열기 ───────────────────────────────────────────────────
  const handleOpenDetail = async (appId: string) => {
    try {
      setIsProcessing(true);
      const response = await fetch(`/api/partner/admin/detail/${appId}`);
      const data = await response.json();

      if (data.success && data.data) {
        setSelectedApp(data.data);
        setAdminNoteInput(data.data.adminNote || '');
        setIsDetailModalOpen(true);
      } else {
        alert(data.message || '상세 정보를 불러올 수 없습니다.');
      }
    } catch (err) {
      alert('상세 정보 로딩 오류');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── 승인 처리 ─────────────────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!selectedApp) return;

    if (!window.confirm(`사업자번호 [${selectedApp.businessRegNumber}]\n가맹점 신청을 승인하시겠습니까?\n\n- 채굴률 +30% 가산 적용\n- 승인 보상 3 BW 즉시 지급`)) {
      return;
    }

    try {
      setIsProcessing(true);

      // 백엔드 API 호환성: /api/partner/admin/approve/:id 및 /api/admin/partner/:id/approve 모두 지원
      const response = await fetch(`/api/partner/admin/approve/${selectedApp._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminWalletAddress: 'admin_master' })
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ 가맹점 승인이 완료되었습니다!\n\n- 승인 보너스 3 BW가 지급되었습니다.\n- 해당 지갑 채굴률이 +30% 가산되었습니다.`);
        setIsDetailModalOpen(false);
        fetchApplications();
      } else {
        alert(`승인 처리 실패: ${data.message}`);
      }
    } catch (err: any) {
      alert(`승인 중 에러 발생: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── 반려 처리 ─────────────────────────────────────────────────────────────
  const handleReject = async () => {
    if (!selectedApp) return;

    if (!adminNoteInput.trim()) {
      alert('반려 사유를 입력해주세요.');
      return;
    }

    if (!window.confirm(`가맹점 신청을 반려하시겠습니까?\n\n반려 사유: ${adminNoteInput}`)) {
      return;
    }

    try {
      setIsProcessing(true);

      const response = await fetch(`/api/partner/admin/reject/${selectedApp._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminNote: adminNoteInput,
          adminWalletAddress: 'admin_master'
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`❌ 가맹점 신청이 반려 처리되었습니다.`);
        setIsDetailModalOpen(false);
        fetchApplications();
      } else {
        alert(`반려 처리 실패: ${data.message}`);
      }
    } catch (err: any) {
      alert(`반려 처리 오류: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── 상태 배지 컴포넌트 ─────────────────────────────────────────────────────
  const renderStatusBadge = (status: 'PENDING' | 'APPROVED' | 'REJECTED') => {
    switch (status) {
      case 'PENDING':
        return <span className="partner-badge pending">⏳ 심사 대기</span>;
      case 'APPROVED':
        return <span className="partner-badge approved">✅ 승인 완료</span>;
      case 'REJECTED':
        return <span className="partner-badge rejected">❌ 반려 처리</span>;
      default:
        return <span className="partner-badge">{status}</span>;
    }
  };

  return (
    <div className="partner-manager-container">

      {/* 헤더 타이틀 & 설명 */}
      <div className="partner-header-section">
        <div className="partner-title-box">
          <h2>🏪 가맹점 신청 승인 및 거버넌스 관리</h2>
          <span className="count-pill">전체 {totalCount}건</span>
        </div>
        <p className="partner-sub-text">
          가맹점주가 제출한 사업자등록증, 매장 현장 사진 5장 및 마스킹 신분증을 검토하고 승인/반려를 수행합니다.
        </p>
      </div>

      {/* 상태별 필터 탭 버튼 바 */}
      <div className="partner-filter-bar">
        <button
          className={`filter-btn ${filterStatus === 'ALL' ? 'active' : ''}`}
          onClick={() => handleFilterChange('ALL')}
        >
          📋 전체 목록
        </button>
        <button
          className={`filter-btn ${filterStatus === 'PENDING' ? 'active' : ''}`}
          onClick={() => handleFilterChange('PENDING')}
        >
          ⏳ 심사 대기
        </button>
        <button
          className={`filter-btn ${filterStatus === 'APPROVED' ? 'active' : ''}`}
          onClick={() => handleFilterChange('APPROVED')}
        >
          ✅ 승인 완료
        </button>
        <button
          className={`filter-btn ${filterStatus === 'REJECTED' ? 'active' : ''}`}
          onClick={() => handleFilterChange('REJECTED')}
        >
          ❌ 반려 내역
        </button>
        <button className="refresh-btn" onClick={fetchApplications} title="새로고침">
          🔄 새로고침
        </button>
      </div>

      {/* 에러 메시지 표시 */}
      {errorMsg && (
        <div className="partner-error-box">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* 신청 목록 테이블 */}
      <div className="partner-table-wrapper">
        <table className="partner-table">
          <thead>
            <tr>
              <th>신청 일시</th>
              <th>신청자 지갑 주소</th>
              <th>사업자등록번호</th>
              <th>신분증 종류</th>
              <th>현재 상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <div className="loading-spinner">🔄 데이터를 불러오는 중입니다...</div>
                </td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 empty-msg">
                  신청 내역이 존재하지 않습니다.
                </td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr key={app._id} className="partner-table-row">
                  <td className="date-cell">
                    {new Date(app.createdAt).toLocaleString('ko-KR', {
                      year: 'numeric', month: '2-digit', day: '2-digit',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="wallet-cell">
                    <span className="wallet-code" title={app.walletAddress}>
                      {app.walletAddress}
                    </span>
                  </td>
                  <td className="bus-num-cell">
                    <strong>{app.businessRegNumber}</strong>
                  </td>
                  <td className="id-type-cell">
                    {app.idCardType === 'resident' ? '🪪 주민등록증' : '🪪 운전면허증'}
                  </td>
                  <td className="status-cell">
                    {renderStatusBadge(app.status)}
                  </td>
                  <td className="action-cell">
                    <button
                      className="btn-view-detail"
                      onClick={() => handleOpenDetail(app._id)}
                    >
                      👁️ 상세보기
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 Controls */}
      {totalPages > 1 && (
        <div className="partner-pagination">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="pg-btn"
          >
            ← 이전
          </button>
          <span className="pg-info">{page} / {totalPages} 페이지</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="pg-btn"
          >
            다음 →
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 🔍 상세보기 & 갤러리 검토 모달 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isDetailModalOpen && selectedApp && (
        <div className="partner-modal-overlay">
          <div className="partner-detail-modal">

            <div className="detail-modal-header">
              <div className="header-title">
                <h3>🏪 가맹점 신청 심사 상세 검토</h3>
                <span className="app-id">ID: {selectedApp._id}</span>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setIsDetailModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="detail-modal-body">
              {/* 상단 기본 정보 리스트 */}
              <div className="info-summary-grid">
                <div className="info-item">
                  <span className="info-label">신청 지갑 주소:</span>
                  <span className="info-val wallet">{selectedApp.walletAddress}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">사업자등록번호:</span>
                  <span className="info-val highlight">{selectedApp.businessRegNumber}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">신청 일시:</span>
                  <span className="info-val">{new Date(selectedApp.createdAt).toLocaleString('ko-KR')}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">현재 심사 상태:</span>
                  <span className="info-val">{renderStatusBadge(selectedApp.status)}</span>
                </div>
              </div>

              {/* 1. 사업자등록증 이미지 뷰어 */}
              <div className="document-section">
                <h4>📄 사업자등록증 첨부 이미지</h4>
                <div className="single-doc-viewer">
                  {selectedApp.businessRegImage ? (
                    <div className="doc-image-box" onClick={() => setPreviewImageUrl(selectedApp.businessRegImage)}>
                      <img src={selectedApp.businessRegImage} alt="사업자등록증" />
                      <span className="zoom-hint">🔍 클릭하여 크게 보기</span>
                    </div>
                  ) : (
                    <div className="no-image-box">첨부된 사업자등록증이 없습니다.</div>
                  )}
                </div>
              </div>

              {/* 2. 매장 사진 5장 갤러리 뷰어 */}
              <div className="document-section">
                <h4>🏪 매장 현장 사진 5장 갤러리</h4>
                <div className="store-gallery-grid">

                  {/* ① 입구 전면/간판 */}
                  <div className="gallery-card">
                    <span className="gallery-tag">① 입구 전면 / 간판</span>
                    <div className="gallery-img-box" onClick={() => selectedApp.photoEntrance && setPreviewImageUrl(selectedApp.photoEntrance)}>
                      {selectedApp.photoEntrance ? (
                        <img src={selectedApp.photoEntrance} alt="입구 전면" />
                      ) : (
                        <span className="no-img">미첨부</span>
                      )}
                    </div>
                  </div>

                  {/* ② 카운터 */}
                  <div className="gallery-card">
                    <span className="gallery-tag">② 카운터</span>
                    <div className="gallery-img-box" onClick={() => selectedApp.photoCounter && setPreviewImageUrl(selectedApp.photoCounter)}>
                      {selectedApp.photoCounter ? (
                        <img src={selectedApp.photoCounter} alt="카운터" />
                      ) : (
                        <span className="no-img">미첨부</span>
                      )}
                    </div>
                  </div>

                  {/* ③ 매장 홀 */}
                  <div className="gallery-card">
                    <span className="gallery-tag">③ 매장 홀</span>
                    <div className="gallery-img-box" onClick={() => selectedApp.photoHall && setPreviewImageUrl(selectedApp.photoHall)}>
                      {selectedApp.photoHall ? (
                        <img src={selectedApp.photoHall} alt="매장 홀" />
                      ) : (
                        <span className="no-img">미첨부</span>
                      )}
                    </div>
                  </div>

                  {/* ④ 주방 */}
                  <div className="gallery-card">
                    <span className="gallery-tag">④ 주방</span>
                    <div className="gallery-img-box" onClick={() => selectedApp.photoKitchen && setPreviewImageUrl(selectedApp.photoKitchen)}>
                      {selectedApp.photoKitchen ? (
                        <img src={selectedApp.photoKitchen} alt="주방" />
                      ) : (
                        <span className="no-img">미첨부</span>
                      )}
                    </div>
                  </div>

                  {/* ⑤ 추가 사진 */}
                  <div className="gallery-card">
                    <span className="gallery-tag">⑤ 추가 사진</span>
                    <div className="gallery-img-box" onClick={() => selectedApp.photoExtra && setPreviewImageUrl(selectedApp.photoExtra)}>
                      {selectedApp.photoExtra ? (
                        <img src={selectedApp.photoExtra} alt="추가 사진" />
                      ) : (
                        <span className="no-img">선택 미첨부</span>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* 3. 마스킹 처리된 대표자 신분증 뷰어 */}
              <div className="document-section">
                <h4>🪪 대표자 신분증 (클라이언트 마스킹 완료본)</h4>
                <div className="id-card-viewer-box">
                  {selectedApp.idCardMasked ? (
                    <div className="id-masked-img-box" onClick={() => setPreviewImageUrl(selectedApp.idCardMasked)}>
                      <img src={selectedApp.idCardMasked} alt="마스킹 신분증" />
                      <div className="privacy-secure-tag">🔒 주민등록번호 뒷자리 & 상세 주소 자동 마스킹 완료 (서버 원본 미저장)</div>
                    </div>
                  ) : (
                    <div className="no-image-box">신분증 이미지가 없습니다.</div>
                  )}
                </div>
              </div>

              {/* 4. 관리자 메모 및 사유 입력란 */}
              <div className="document-section">
                <h4>📝 관리자 사유 및 심사 메모</h4>
                <textarea
                  className="admin-note-textarea"
                  rows={3}
                  placeholder="승인 메모 또는 반려 사유를 입력하세요 (반려 시 필수)"
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  disabled={selectedApp.status !== 'PENDING' || isProcessing}
                />
              </div>

            </div>

            {/* 하단 심사 처리 액션 푸터 */}
            <div className="detail-modal-footer">
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setIsDetailModalOpen(false)}
                disabled={isProcessing}
              >
                닫기
              </button>

              {selectedApp.status === 'PENDING' ? (
                <div className="action-btn-group">
                  <button
                    type="button"
                    className="btn-action-reject"
                    onClick={handleReject}
                    disabled={isProcessing}
                  >
                    ❌ 반려 처리
                  </button>
                  <button
                    type="button"
                    className="btn-action-approve"
                    onClick={handleApprove}
                    disabled={isProcessing}
                  >
                    {isProcessing ? '처리 중...' : '✅ 승인 완료 (+30% 채굴률 & 3 BW)'}
                  </button>
                </div>
              ) : (
                <div className="reviewed-info">
                  <span>처리 완료일: {selectedApp.reviewedAt ? new Date(selectedApp.reviewedAt).toLocaleString('ko-KR') : '-'}</span>
                  <span>처리 담당자: {selectedApp.reviewedBy || 'admin'}</span>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 🖼️ 이미지 확대 라이트박스 팝업 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {previewImageUrl && (
        <div className="image-lightbox-overlay" onClick={() => setPreviewImageUrl(null)}>
          <div className="image-lightbox-card" onClick={(e) => e.stopPropagation()}>
            <img src={previewImageUrl} alt="확대 이미지" />
            <button className="lightbox-close-btn" onClick={() => setPreviewImageUrl(null)}>✕</button>
          </div>
        </div>
      )}

    </div>
  );
};
