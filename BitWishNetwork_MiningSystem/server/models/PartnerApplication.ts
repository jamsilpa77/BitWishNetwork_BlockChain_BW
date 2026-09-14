/**
 * BitWishNetwork Mining System
 * PartnerApplication Model Schema
 *
 * ⚠️ 중요 준수 사항:
 * 1. 가맹점 등록 신청 데이터, 파일 경로, 승인 상태, 보너스 지급 이력 관리
 * 2. 마스킹 처리된 신분증 이미지만 저장 (원본 절대 저장 금지)
 * 3. 신청 즉시 1BW 보너스, 승인 완료 시 3BW 보너스 지급 이력 추적
 * 4. partnerBonusRate: 0.3 (기본 채굴률의 30% 가산 — +0.3 가산 방식)
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IPartnerApplication extends Document {
    walletAddress: string;          // 신청 사용자 지갑 주소 (FK → User)

    // ─── 사업자 정보 ───────────────────────────────────────
    businessRegNumber: string;      // 사업자등록번호 (예: 123-45-67890)
    businessRegImage: string;       // 사업자등록증 이미지 경로 (서버 저장 URL)

    // ─── 매장 현장 사진 (5장 구분 저장) ────────────────────
    photoEntrance: string;          // ① 입구 전면 / 간판
    photoCounter: string;           // ② 카운터
    photoHall: string;              // ③ 매장 홀
    photoKitchen: string;           // ④ 주방
    photoExtra: string;             // ⑤ 추가 사진 (선택)

    // ─── 대표자 신분증 (마스킹 처리된 이미지만 저장) ───────
    idCardMasked: string;           // 마스킹 처리된 신분증 이미지 경로
    idCardType: 'resident' | 'driver'; // 신분증 종류: 주민등록증 | 운전면허증

    // ─── 신청 상태 ─────────────────────────────────────────
    status: 'PENDING' | 'APPROVED' | 'REJECTED';

    // ─── 보너스 지급 이력 ──────────────────────────────────
    registrationBonusPaid: boolean; // 신청 즉시 1BW 지급 여부 (1회만)
    approvalBonusPaid: boolean;     // 승인 완료 3BW 지급 여부 (1회만)

    // ─── 관리자 처리 정보 ──────────────────────────────────
    adminNote: string;              // 관리자 메모 (반려 사유 등)
    reviewedBy: string;             // 처리한 관리자 지갑 주소
    reviewedAt: Date | null;        // 처리 일시

    createdAt: Date;
    updatedAt: Date;
}

const PartnerApplicationSchema: Schema = new Schema(
    {
        walletAddress: {
            type: String,
            required: true,
            ref: 'User',
            trim: true,
        },

        // ─── 사업자 정보 ───────────────────────────────────
        businessRegNumber: {
            type: String,
            required: true,
            trim: true,
        },
        businessRegImage: {
            type: String,
            default: '',
        },

        // ─── 매장 현장 사진 ────────────────────────────────
        photoEntrance: { type: String, default: '' },  // ① 입구/전면/간판
        photoCounter:  { type: String, default: '' },  // ② 카운터
        photoHall:     { type: String, default: '' },  // ③ 매장 홀
        photoKitchen:  { type: String, default: '' },  // ④ 주방
        photoExtra:    { type: String, default: '' },  // ⑤ 추가 사진 (선택)

        // ─── 신분증 (마스킹된 이미지만) ────────────────────
        idCardMasked: { type: String, default: '' },
        idCardType: {
            type: String,
            enum: ['resident', 'driver'],
            default: 'resident',
        },

        // ─── 신청 상태 ─────────────────────────────────────
        status: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'REJECTED'],
            default: 'PENDING',
        },

        // ─── 보너스 지급 이력 ──────────────────────────────
        // 신청 즉시 1BW 지급 여부 (중복 지급 방지)
        registrationBonusPaid: { type: Boolean, default: false },
        // 승인 완료 3BW 지급 여부 (중복 지급 방지)
        approvalBonusPaid:     { type: Boolean, default: false },

        // ─── 관리자 처리 정보 ──────────────────────────────
        adminNote:   { type: String, default: '' },
        reviewedBy:  { type: String, default: '' },  // 관리자 walletAddress
        reviewedAt:  { type: Date,   default: null },
    },
    {
        timestamps: true, // createdAt, updatedAt 자동 관리
    }
);

// ─── 인덱스 설정 (조회 성능 최적화) ──────────────────────────
// 지갑 주소별 신청 내역 조회 (중복 방지 쿼리에 활용)
PartnerApplicationSchema.index({ walletAddress: 1 });
// 상태별 필터링 (관리자 목록 조회 최적화)
PartnerApplicationSchema.index({ status: 1 });
// 복합 인덱스: 지갑+상태 동시 조회 최적화 (중복 신청 방지 쿼리)
PartnerApplicationSchema.index({ walletAddress: 1, status: 1 });

export default mongoose.model<IPartnerApplication>(
    'PartnerApplication',
    PartnerApplicationSchema
);
