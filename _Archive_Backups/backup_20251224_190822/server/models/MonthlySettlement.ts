/**
 * BitWishNetwork Mining System
 * Monthly Settlement Model Schema
 * 
 * ⚠️ 중요 준수 사항:
 * 1. 매월 1일 00:00:00 기준 확정 데이터 저장
 * 2. 마이그레이션(사용 가능 금액 전환)을 위한 원천 데이터
 * 3. "채굴 보상 내역"에 표시될 영구 기록
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IMonthlySettlement extends Document {
    walletAddress: string;        // 소유자 지갑 주소

    year: number;                 // 해당 연도 (예: 2025)
    month: number;                // 해당 월 (예: 11)

    // 해당 월에 채굴된 확정 수량
    minedAmount: string;          // 순수 채굴량
    bonusAmount: string;          // 보너스 채굴량
    totalAmount: string;          // 합계 (mined + bonus)

    settledAt: Date;              // 정산 확정 일시 (매월 말일 23:59:59)

    migrationStatus: 'LOCKED' | 'UNLOCKED' | 'MIGRATED'; // 마이그레이션 상태
    migrationDate: Date | null;   // 마이그레이션(전환) 완료일
}

const MonthlySettlementSchema: Schema = new Schema({
    walletAddress: {
        type: String,
        required: true,
        ref: 'User'
    },

    year: { type: Number, required: true },
    month: { type: Number, required: true },

    minedAmount: { type: String, required: true },
    bonusAmount: { type: String, required: true },
    totalAmount: { type: String, required: true },

    settledAt: { type: Date, default: Date.now },

    migrationStatus: {
        type: String,
        enum: ['LOCKED', 'UNLOCKED', 'MIGRATED'],
        default: 'LOCKED'
    },
    migrationDate: { type: Date, default: null }
}, {
    timestamps: true
});

// 복합 인덱스: 한 유저는 한 달에 하나의 정산 내역만 가져야 함
MonthlySettlementSchema.index({ walletAddress: 1, year: 1, month: 1 }, { unique: true });

export default mongoose.model<IMonthlySettlement>('MonthlySettlement', MonthlySettlementSchema);
