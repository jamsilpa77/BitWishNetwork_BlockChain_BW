/**
 * BitWishNetwork Mining System
 * Bonus Record Model Schema
 * 
 * ⚠️ 중요 준수 사항:
 * 1. 추천 보너스와 출석 보너스의 별도 분리 저장
 * 2. "추천 보너스 보관함" 및 "추천 보상 보관함" 구현
 * 3. 가입자 목록 및 지급 목록의 영구적 관리
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IBonusRecord extends Document {
    walletAddress: string;          // 소유자 지갑 주소

    // 1. 추천 보너스 보관함 (2% 채굴분)
    referralBonusStorage: string;   // 누적된 2% 보너스 총량

    // 2. 추천 보상 보관함 (1BW 일회성)
    referralRewardStorage: string;  // 누적된 1BW 보상 총량

    // 3. 추천인 목록 (가입자 상세 정보)
    referralList: Array<{
        childWalletAddress: string;   // 가입자 지갑 주소
        joinedAt: Date;               // 가입 일시
        accumulatedBonus: string;     // 이 사람으로 인해 얻은 총 보너스 양
        isKycVerified: boolean;       // 가입자의 KYC 통과 여부
        rewardStatus: 'PENDING' | 'PAID'; // 1BW 지급 상태
    }>;

    // 4. 출석 체크 기록
    attendanceHistory: Array<{
        date: string;                 // YYYY-MM-DD
        checkInTime: Date;            // 체크인 시간
        bonusRate: string;            // 적용된 보너스율 (0.05)
    }>;
}

const BonusRecordSchema: Schema = new Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        ref: 'User'
    },

    referralBonusStorage: { type: String, default: '0.00000000000000000000000000000000000000000000000000' },
    referralRewardStorage: { type: String, default: '0.00000000000000000000000000000000000000000000000000' },

    referralList: [{
        childWalletAddress: { type: String, required: true },
        joinedAt: { type: Date, default: Date.now },
        accumulatedBonus: { type: String, default: '0.00000000000000000000000000000000000000000000000000' },
        isKycVerified: { type: Boolean, default: false },
        rewardStatus: {
            type: String,
            enum: ['PENDING', 'PAID'],
            default: 'PENDING'
        }
    }],

    attendanceHistory: [{
        date: { type: String, required: true }, // YYYY-MM-DD
        checkInTime: { type: Date, default: Date.now },
        bonusRate: { type: String, default: '0.05000000000000000000000000000000000000000000000000' },
        fixedBonusAmount: { type: String, required: false } // 과거 데이터 고정값 저장용
    }]
}, {
    timestamps: true
});

export default mongoose.model<IBonusRecord>('BonusRecord', BonusRecordSchema);
