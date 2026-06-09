/**
 * BitWishNetwork 관리자 페이지 스타일
 */

.admin-page {
    min-height: 100vh;
    background: #f5f5f5;
    font-family: 'Noto Sans KR', sans-serif;
}

/* 헤더 */
.admin-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px 0;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.admin-header-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.admin-title {
    font-size: 1.8rem;
    font-weight: 700;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
}

.admin-icon {
    font-size: 2rem;
}

.logout-button {
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid white;
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s;
}

.logout-button:hover {
    background: white;
    color: #667eea;
}

/* 탭 네비게이션 */
.admin-tabs {
    background: white;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    display: flex;
    gap: 5px;
    padding: 10px 20px;
    /* 드롭다운이 잘리지 않고 바깥으로 나오도록 설정 */
    overflow: visible !important;
    position: relative;
    z-index: 1500;
}

/* ==========================================
   대시보드 호버형 계단식 드롭다운 메뉴 스타일 추가
   ========================================== */
.admin-tab-dropdown-wrapper {
    position: relative;
    display: inline-block;
}

.admin-dropdown-menu {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    background: #ffffff;
    min-width: 170px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    border-radius: 10px;
    z-index: 2000;
    border: 1px solid #e2e8f0;
    padding: 6px 0;
    animation: adminSlideDown 0.2s ease-out;
}

.admin-tab-dropdown-wrapper:hover .admin-dropdown-menu {
    display: block;
}

.admin-dropdown-menu button {
    display: block;
    width: 100%;
    padding: 10px 16px;
    background: transparent;
    border: none;
    text-align: left;
    font-size: 0.9rem;
    font-weight: 700;
    color: #475569;
    cursor: pointer;
    transition: all 0.2s ease;
}

.admin-dropdown-menu button:hover {
    background: #f1f5f9;
    color: #667eea;
}

@keyframes adminSlideDown {
    from {
        opacity: 0;
        transform: translateY(-5px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 로드맵 에디터 다국어 언어 선택 탭 */
.roadmap-lang-tabs {
    display: flex;
    gap: 6px;
    margin-bottom: 20px;
    background: #f1f5f9;
    padding: 6px;
    border-radius: 10px;
}

.roadmap-lang-tab-btn {
    flex: 1;
    padding: 10px 16px;
    border: none;
    border-radius: 8px;
    background: transparent;
    font-weight: 700;
    font-size: 0.95rem;
    color: #64748b;
    cursor: pointer;
    transition: all 0.25s ease;
}

.roadmap-lang-tab-btn:hover {
    background: rgba(102, 126, 234, 0.1);
    color: #667eea;
}

.roadmap-lang-tab-btn.active {
    background: #667eea;
    color: #fff;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
}

/* 로드맵 에디터용 카드 및 폼 레이아웃 */
.roadmap-editor-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-top: 20px;
}

.roadmap-editor-card {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    padding: 20px;
}

.roadmap-editor-card h3 {
    margin: 0 0 15px 0;
    color: #475569;
    font-size: 1.15rem;
    border-left: 4px solid #667eea;
    padding-left: 10px;
}

.editor-field-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-bottom: 15px;
}

.editor-single-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.editor-single-field label {
    font-size: 0.85rem;
    font-weight: 700;
    color: #64748b;
}

.editor-single-field input,
.editor-single-field textarea {
    padding: 10px 14px;
    border: 1.5px solid #cbd5e1;
    border-radius: 6px;
    font-size: 0.95rem;
}

.editor-single-field input:focus,
.editor-single-field textarea:focus {
    outline: none;
    border-color: #667eea;
}

.admin-tab {
    background: transparent;
    border: none;
    padding: 12px 20px;
    cursor: pointer;
    font-weight: 600;
    color: #666;
    border-bottom: 3px solid transparent;
    transition: all 0.3s;
    white-space: nowrap;
}

.admin-tab:hover {
    color: #667eea;
    background: #f8f9ff;
}

.admin-tab.active {
    color: #667eea;
    border-bottom-color: #667eea;
    background: #f8f9ff;
}

/* 메인 콘텐츠 */
.admin-main {
    max-width: 1400px;
    margin: 30px auto;
    padding: 0 20px;
}

.admin-panel {
    background: white;
    border-radius: 12px;
    padding: 30px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.admin-panel h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 20px 0;
    color: #333;
}

/* 대시보드 */
.dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

.dashboard-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.dashboard-card .card-value {
    font-size: 2rem;
    font-weight: 800;
    margin-bottom: 10px;
}

.dashboard-card .card-label {
    font-size: 0.9rem;
    opacity: 0.9;
}

/* 테스트 섹션 */
.test-section {
    margin-top: 20px;
}

.warning-text {
    background: #fff3cd;
    border: 1px solid #ffc107;
    color: #856404;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-weight: 600;
}

.search-box {
    display: flex;
    gap: 10px;
    max-width: 800px;
    flex-wrap: wrap;
}

.admin-input {
    flex: 1;
    padding: 12px 15px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s;
    min-width: 200px;
}

.admin-input:focus {
    outline: none;
    border-color: #667eea;
}

.admin-button {
    padding: 12px 30px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    white-space: nowrap;
}

.admin-button.primary {
    background: #667eea;
    color: white;
}

.admin-button.primary:hover {
    background: #5568d3;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.admin-button.danger {
    background: #dc3545;
    color: white;
}

.admin-button.danger:hover {
    background: #c82333;
}

.admin-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* 에러 메시지 */
.error-message {
    background: #fee;
    border: 1px solid #fcc;
    color: #c33;
    padding: 12px;
    border-radius: 8px;
    margin-top: 15px;
    font-weight: 600;
}

/* 마이닝 데이터 박스 */
.mining-data-box {
    background: #f8f9ff;
    border: 2px solid #667eea;
    border-radius: 12px;
    padding: 25px;
    margin-top: 20px;
}

.mining-data-box h3 {
    color: #667eea;
    margin: 0 0 20px 0;
    font-size: 1.2rem;
}

.data-grid {
    display: grid;
    gap: 15px;
    margin-bottom: 20px;
}

.data-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: white;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
}

.data-label {
    font-weight: 600;
    color: #666;
}

.data-value {
    font-weight: 700;
    color: #333;
}

.data-value.active {
    color: #4caf50;
}

.data-value.inactive {
    color: #f44336;
}

/* 데이터 없음 메시지 */
.no-data-message {
    text-align: center;
    padding: 40px 20px;
}

.no-data-icon {
    font-size: 4rem;
    margin: 0 0 15px 0;
}

.no-data-text {
    font-size: 1.2rem;
    font-weight: 700;
    color: #666;
    margin: 0 0 10px 0;
}

.no-data-hint {
    font-size: 0.9rem;
    color: #999;
    line-height: 1.6;
    margin: 0;
}

/* 출석 보너스 스타일 */
.attendance-result-box {
    background: #f8f9ff;
    border: 2px solid #667eea;
    border-radius: 12px;
    padding: 25px;
    margin-top: 20px;
}

.attendance-result-box h3 {
    color: #667eea;
    margin: 0 0 20px 0;
    font-size: 1.2rem;
}

.attendance-result-box h4 {
    color: #667eea;
    margin: 20px 0 15px 0;
    font-size: 1.1rem;
}

.attendance-summary {
    background: white;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 20px;
}

.summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.summary-label {
    font-weight: 600;
    color: #666;
}

.summary-value {
    font-weight: 700;
    font-size: 1.1rem;
}

.summary-value.active {
    color: #4caf50;
}

.summary-value.inactive {
    color: #f44336;
}

.attendance-table-container {
    margin-top: 20px;
    overflow-x: auto;
}

.attendance-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    min-width: 600px;
}

.attendance-table thead {
    background: #667eea;
    color: white;
}

.attendance-table th {
    padding: 12px;
    text-align: center;
    font-weight: 600;
}

.attendance-table td {
    padding: 12px;
    text-align: center;
    border-bottom: 1px solid #e0e0e0;
}

.attendance-table tbody tr:hover {
    background: #f8f9ff;
}

.attendance-table tbody tr:last-child td {
    border-bottom: none;
}

.status-on {
    color: #4caf50;
    font-weight: 600;
}

.status-off {
    color: #f44336;
    font-weight: 600;
}

/* 날짜 선택기 스타일 */
.date-selectors {
    display: flex;
    gap: 10px;
}

.admin-select {
    padding: 12px 15px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1rem;
    background: white;
}

.total-amount {
    color: #667eea;
    font-size: 1.1rem;
    text-align: right;
    padding-right: 20px !important;
}

.date-cell {
    font-size: 0.9rem;
    color: #555;
    white-space: pre-wrap;
}

/* 호버 가능한 금액 표시 */
.hoverable-amount {
    position: relative;
    cursor: help;
    border-bottom: 1px dotted #999;
    display: inline-block;
}

.hoverable-amount::after {
    content: attr(title);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(240, 240, 240, 0.95);
    color: #333;
    padding: 8px 12px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
    margin-bottom: 5px;
    font-size: 0.9rem;
    z-index: 1000;
}

.hoverable-amount:hover::after {
    opacity: 1;
}

/* KYC 상태 뱃지 */
.kyc-status-approved {
    color: #22c55e;
    font-weight: bold;
}

.kyc-status-rejected {
    color: #ef4444;
    font-weight: bold;
}

.kyc-status-pending {
    color: #f59e0b;
    font-weight: bold;
}

/* 지갑 주소 셀 */
.wallet-cell {
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
    color: #667eea;
    font-weight: 600;
}

/* 진행 중 상태 */
.status-running {
    color: #ff6b6b;
    font-weight: 600;
    animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.6;
    }
}

/* 반응형 */
@media (max-width: 768px) {
    .admin-title {
        font-size: 1.3rem;
    }

    .admin-tabs {
        padding: 5px 10px;
    }

    .admin-tab {
        padding: 10px 15px;
        font-size: 0.9rem;
    }

    .dashboard-grid {
        grid-template-columns: 1fr;
    }

    .search-box {
        flex-direction: column;
    }

    .attendance-table {
        font-size: 0.85rem;
    }

    .attendance-table th,
    .attendance-table td {
        padding: 8px 4px;
    }

    .date-selectors {
        width: 100%;
    }

    .admin-select {
        flex: 1;
    }
}

/* KYC 상태 - 새로운 시스템 컬러 규정 */
.kyc-status-not_applied,
.kyc-status-rejected {
    color: #ef4444;
    /* 빨간색 */
    font-weight: bold;
}

.kyc-status-applied,
.kyc-status-approved {
    color: #3b82f6;
    /* 파란색 */
    font-weight: bold;
}

.kyc-status-reviewing {
    color: #22c55e;
    /* 녹색 */
    font-weight: bold;
}

.kyc-status-pending {
    color: #a855f7;
    /* 보라색 */
    font-weight: bold;
}

/* --- 추천 보상 현황 (Referral Reward Status) 추가 스타일 --- */

.summary-split-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin: 25px 0 40px 0;
}

.total-summary-card {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 30px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
    width: 100%;
}

.total-summary-card.reward-card {
    border-left: 5px solid #f59e0b;
}

.total-summary-card.bonus-card {
    border-left: 5px solid #a855f7;
}

.total-label {
    color: #94a3b8;
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.total-value {
    color: #f59e0b;
    /* 황금색 강조 */
    font-size: 3.2rem;
    font-weight: 900;
    text-shadow: 0 0 15px rgba(245, 158, 11, 0.4);
}

.reward-detail-container {
    background: #ffffff;
    border: 2px solid #e2e8f0;
    border-radius: 16px;
    padding: 30px;
    margin-top: 30px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    animation: rewardFadeIn 0.4s ease-out;
}

@keyframes rewardFadeIn {
    from {
        opacity: 0;
        transform: translateY(15px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.referral-list-section {
    border-top: 2px dashed #e2e8f0;
    padding-top: 30px;
}

.referral-list-section h4 {
    margin-bottom: 20px;
}

/* [작업 1 개정] 새로고침 시 시각적 피드백 (페이드 효과) */
.attendance-result-box.refreshing {
    opacity: 0.5;
    transition: opacity 0.2s ease;
    pointer-events: none;
}

.search-button-fixed {
    min-width: 120px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.refresh-icon-button {
    margin-left: 10px;
    padding: 0 15px !important;
    font-size: 1.2rem;
    background: #f1f5f9 !important;
    border: 1px solid #cbd5e1 !important;
    color: #475569 !important;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    min-width: 50px;
    /* 요동 방지용 너비 고정 */
}

.refresh-icon-button:hover {
    background: #e2e8f0 !important;
    transform: rotate(180deg);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.refresh-icon-button:active {
    transform: rotate(180deg) scale(0.95);
}