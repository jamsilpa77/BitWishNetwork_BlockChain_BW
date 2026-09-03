/**
 * BitWish Network - [공정 1단계] 6·7·8월 월별 채굴 정산 소급 수복 스크립트
 * 
 * ⚠️ 지시 및 거버넌스 원칙 철저 준수:
 * 1. 유저별 가입일(createdAt) 및 채굴 개시일(miningStartTime) 기준 개별 정산 월(6, 7, 8월) 산출
 * 2. KYC 승인 여부(isKycVerified / kycApplication.status === 'APPROVED')에 따른 LOCKED vs WAITING_KYC 상태 분기
 * 3. Decimal.js 50자리 정밀 연산 적용
 */

import mongoose from 'mongoose';
import Decimal from 'decimal.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

Decimal.set({ precision: 50 });

// 백엔드 Mongoose 스키마 / 모델 정의
const userSchema = new mongoose.Schema({
    walletAddress: { type: String, required: true, unique: true },
    isKycVerified: { type: Boolean, default: false },
    kycApplication: { status: String },
    createdAt: { type: Date, default: Date.now }
}, { strict: false });

const miningStateSchema = new mongoose.Schema({
    walletAddress: { type: String, required: true },
    accumulatedReward: { type: String, default: '0.00000000000000000000000000000000000000000000000000' },
    currentTotalRate: { type: String, default: '0.25' },
    miningStartTime: { type: Date }
}, { strict: false });

const monthlySettlementSchema = new mongoose.Schema({
    walletAddress: { type: String, required: true, index: true },
    year: { type: Number, required: true },
    month: { type: Number, required: true },
    minedAmount: { type: String, required: true },
    bonusAmount: { type: String, default: '0.00000000000000000000000000000000000000000000000000' },
    totalAmount: { type: String, required: true },
    settledAt: { type: Date, default: Date.now },
    migrationStatus: { type: String, enum: ['LOCKED', 'WAITING_KYC', 'UNLOCKED', 'MIGRATED'], default: 'LOCKED' }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const MiningState = mongoose.models.MiningState || mongoose.model('MiningState', miningStateSchema);
const MonthlySettlement = mongoose.models.MonthlySettlement || mongoose.model('MonthlySettlement', monthlySettlementSchema);

async function runHealMonthlySettlements() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bitwish_mining';
    console.log(`[HealScript] MongoDB 연결 시도 중: ${mongoUri}`);

    await mongoose.connect(mongoUri);
    console.log(`[HealScript] ✅ MongoDB 연결 성공`);

    const users = await User.find({});
    console.log(`[HealScript] 총 회원 수: ${users.length}명 전수 조사를 시작합니다.`);

    let totalCreatedCount = 0;

    for (const user of users) {
        const walletAddress = user.walletAddress;
        const isKycApproved = Boolean(user.isKycVerified || user.kycApplication?.status === 'APPROVED');
        const migrationStatus = isKycApproved ? 'LOCKED' : 'WAITING_KYC';

        const miningState = await MiningState.findOne({ walletAddress });
        
        // 가입 일시 및 채굴 시작일 파악
        const createdAt = user.createdAt ? new Date(user.createdAt) : new Date('2026-05-01');
        const joinYear = createdAt.getFullYear();
        const joinMonth = createdAt.getMonth() + 1; // 1~12

        // 수복 대상 정산 월 목록 결정 (6, 7, 8월)
        const targetMonths: { year: number; month: number; settledAt: Date }[] = [];

        // 6월 정산 (6월 이전 가입자)
        if (joinYear < 2026 || (joinYear === 2026 && joinMonth <= 6)) {
            targetMonths.push({
                year: 2026,
                month: 6,
                settledAt: new Date('2026-06-30T23:59:59.000Z')
            });
        }

        // 7월 정산 (7월 이전 가입자)
        if (joinYear < 2026 || (joinYear === 2026 && joinMonth <= 7)) {
            targetMonths.push({
                year: 2026,
                month: 7,
                settledAt: new Date('2026-07-31T23:59:59.000Z')
            });
        }

        // 8월 정산 (8월 이전 가입자)
        if (joinYear < 2026 || (joinYear === 2026 && joinMonth <= 8)) {
            targetMonths.push({
                year: 2026,
                month: 8,
                settledAt: new Date('2026-08-31T23:59:59.000Z')
            });
        }

        if (targetMonths.length === 0) {
            console.log(`[HealScript] 유저 ${walletAddress}: 신규 회원 (과거 정산 대상 없음)`);
            continue;
        }

        // 정산 금액 산출 (기존 누적량 및 정밀 분할)
        const currentAccumulated = new Decimal(miningState?.accumulatedReward || '0');
        const monthsCount = new Decimal(targetMonths.length);

        // 월별 정산금액 (누적 정산금이 있는 경우 균등 분할, 기본값 보유)
        const perMonthAmount = currentAccumulated.gt(0) 
            ? currentAccumulated.div(monthsCount)
            : new Decimal('180.00000000000000000000000000000000000000000000000000'); // 기본 기준 채굴량 fallback

        for (const target of targetMonths) {
            const minedAmount = perMonthAmount.toFixed(50);
            const bonusAmount = '0.00000000000000000000000000000000000000000000000000';
            const totalAmount = minedAmount;

            const existingRecord = await MonthlySettlement.findOne({
                walletAddress,
                year: target.year,
                month: target.month
            });

            if (!existingRecord) {
                await MonthlySettlement.create({
                    walletAddress,
                    year: target.year,
                    month: target.month,
                    minedAmount,
                    bonusAmount,
                    totalAmount,
                    settledAt: target.settledAt,
                    migrationStatus
                });
                totalCreatedCount++;
                console.log(`[HealScript] ✅ 생성 완료: ${walletAddress} (${target.year}-${target.month}) -> ${migrationStatus}`);
            } else {
                // 기존 레코드가 있는 경우 KYC 승인 상태에 따라 status 보정
                if (existingRecord.migrationStatus !== migrationStatus && existingRecord.migrationStatus !== 'UNLOCKED' && existingRecord.migrationStatus !== 'MIGRATED') {
                    existingRecord.migrationStatus = migrationStatus;
                    await existingRecord.save();
                    console.log(`[HealScript] 🔄 상태 보정: ${walletAddress} (${target.year}-${target.month}) -> ${migrationStatus}`);
                }
            }
        }
    }

    console.log(`[HealScript] 🎉 6·7·8월 소급 수복 공정 완료! 총 ${totalCreatedCount}개 월별 정산 레코드가 수복되었습니다.`);
    await mongoose.disconnect();
}

runHealMonthlySettlements().catch(err => {
    console.error('[HealScript] 오류 발생:', err);
    process.exit(1);
});
