/**
 * BitWishNetwork Mining System
 * Mining State Model Schema
 * 
 * ⚠️ 중요 준수 사항:
 * 1. 실시간 채굴 상태의 영구적 저장 (리셋 방지 핵심)
 * 2. 50자리 정밀도 지원을 위해 String 타입으로 수치 저장 (Decimal.js 호환)
 * 3. 보너스 적용 상태의 실시간 추적 (추천인 수/보너스율/출석 데이터는 초기화 대상에서 영구 제외)
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IMiningState extends Document {
    walletAddress: string;        // 소유자 지갑 주소

    isMining: boolean;            // 현재 채굴 진행 중 여부
    miningStartTime: Date | null; // 이번 세션 채굴 시작 시간 (서버 시간 기준)
    lastSyncTime: Date;           // 마지막으로 동기화된 시간

    // 누적 채굴량 (소수점 50자리 정밀도 유지를 위해 String 저장)
    accumulatedReward: string;    // 총 누적 채굴량

    // 현재 적용된 채굴률 (시간당)
    currentBaseRate: string;      // 기본 채굴률
    currentTotalRate: string;     // 보너스 포함 최종 채굴률

    // 보너스 상태 스냅샷
    isAttendanceActive: boolean;  // 출석 보너스 적용 중 여부
    attendanceDate: Date | null;  // 출석 체크한 날짜 (중복 방지)

    referralCount: number;        // 현재 반영된 추천인 수
    referralBonusRate: string;    // 현재 적용된 추천 보너스율

    partnerStatus: string;        // 가맹점 상태 (NOT_REGISTERED, PENDING, REGISTERED)
    lastBlockRewardThreshold: string; // 마지막으로 블록이 생성된 BW 기준점 (1BW 도달 시마다 블록 생성 추적)
}

const MiningStateSchema: Schema = new Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        ref: 'User'
    },

    isMining: { type: Boolean, default: false },
    miningStartTime: { type: Date, default: null },
    lastSyncTime: { type: Date, default: Date.now },

    // Decimal128 대신 String을 사용하여 50자리 정밀도 완벽 보장
    accumulatedReward: { type: String, default: '0.00000000000000000000000000000000000000000000000000' },

    currentBaseRate: { type: String, default: '0.25000000000000000000000000000000000000000000000000' },
    currentTotalRate: { type: String, default: '0.25000000000000000000000000000000000000000000000000' },

    isAttendanceActive: { type: Boolean, default: false },
    attendanceDate: { type: Date, default: null },

    referralCount: { type: Number, default: 0 },
    referralBonusRate: { type: String, default: '0.00000000000000000000000000000000000000000000000000' },

    partnerStatus: {
        type: String,
        enum: ['NOT_REGISTERED', 'PENDING', 'REGISTERED'],
        default: 'NOT_REGISTERED'
    },

    // [블록 +1 카운팅] 마지막으로 블록이 생성된 BW 기준점
    // 유저의 accumulatedReward가 이 값 + 1 을 초과하면 블록을 +1 생성하고 이 값을 갱신
    lastBlockRewardThreshold: { type: String, default: '0' }
}, {
    timestamps: true
});

export default mongoose.model<IMiningState>('MiningState', MiningStateSchema);
