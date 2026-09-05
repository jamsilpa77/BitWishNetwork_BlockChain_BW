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

// CommonJS 및 ts-node 호환 환경 설정
const scriptDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

dotenv.config({ path: path.join(scriptDir, '../.env') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

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
    let totalVerifiedCount = 0;

    for (const user of users) {
        const walletAddress = user.walletAddress;
        if (!walletAddress) continue;

        const isKycApproved = Boolean(user.isKycVerified || user.kycApplication?.status === 'APPROVED');
        const migrationStatus = isKycApproved ? 'LOCKED' : 'WAITING_KYC';

        // 대소문자 구애 없는 지갑 주소 정밀 검색
        const miningState = await MiningState.findOne({ 
            walletAddress: new RegExp('^' + walletAddress.trim() + '$', 'i') 
        });
        
        // 유저 가입일시 및 채굴 시작일 정밀 파악
        const userCreatedAt = user.createdAt 
            ? new Date(user.createdAt) 
            : (miningState?.miningStartTime ? new Date(miningState.miningStartTime) : new Date('2025-12-01'));

        // 2026년 6, 7, 8월 각 월별 정산 정의
        const allMonths = [
            { year: 2026, month: 6, start: new Date('2026-06-01T00:00:00.000Z'), end: new Date('2026-06-30T23:59:59.000Z') },
            { year: 2026, month: 7, start: new Date('2026-07-01T00:00:00.000Z'), end: new Date('2026-07-31T23:59:59.000Z') },
            { year: 2026, month: 8, start: new Date('2026-08-01T00:00:00.000Z'), end: new Date('2026-08-31T23:59:59.000Z') }
        ];

        // 규칙 1: 회원의 가입일보다 말일이 같거나 뒤인 월만 정산 대상으로 동적 선정 (가입 전 달은 100% 정산 제외!)
        const activeTargetMonths = allMonths.filter(m => userCreatedAt <= m.end);

        // 규칙 2: 가입 전 달에 잘못 생성되어 있던 기존 정산 레코드가 있다면 무조건 청소(Delete/Purge)
        const invalidMonths = allMonths.filter(m => userCreatedAt > m.end);
        for (const inv of invalidMonths) {
            const deleted = await MonthlySettlement.deleteMany({
                walletAddress: new RegExp('^' + walletAddress.trim() + '$', 'i'),
                year: inv.year,
                month: inv.month
            });
            if (deleted.deletedCount > 0) {
                console.log(`[HealScript] 🧹 가입 전 잘못 생성된 레코드 청소 완료: ${walletAddress} (${inv.year}-${inv.month}) [${deleted.deletedCount}건 삭제]`);
            }
        }

        const currentAccumulated = new Decimal(miningState?.accumulatedReward || '0');

        // 규칙 3: 채굴량이 0인 미채굴자(13명)는 가짜 데이터 180 BW를 주지 않고 스킵하며, 기존에 오적재된 가짜 데이터 청소
        if (currentAccumulated.isZero()) {
            const fakeDeleted = await MonthlySettlement.deleteMany({
                walletAddress: new RegExp('^' + walletAddress.trim() + '$', 'i'),
                year: { $in: [2026] },
                month: { $in: [6, 7, 8] }
            });
            if (fakeDeleted.deletedCount > 0) {
                console.log(`[HealScript] 🧹 미채굴자 가짜 데이터 청소 완료: ${walletAddress} [${fakeDeleted.deletedCount}건 삭제]`);
            }
            continue;
        }

        // 각 대상 월별 실질 채굴 활성 초 수(Seconds) 산출
        let totalActiveSeconds = new Decimal(0);
        const monthSecondsList = activeTargetMonths.map(m => {
            const actStart = userCreatedAt > m.start ? userCreatedAt : m.start;
            const actEnd = m.end;
            const diffMs = actEnd.getTime() - actStart.getTime();
            const sec = new Decimal(Math.max(0, diffMs / 1000));
            totalActiveSeconds = totalActiveSeconds.plus(sec);
            return { ...m, activeSeconds: sec, settledAt: m.end };
        });

        // 월별 비례 배분(Pro-rata) 및 장부 생성
        for (const target of monthSecondsList) {
            const weight = totalActiveSeconds.gt(0) 
                ? target.activeSeconds.div(totalActiveSeconds) 
                : new Decimal(0);

            const monthMinedAmount = currentAccumulated.mul(weight);
            const minedAmountStr = monthMinedAmount.toFixed(50);
            const bonusAmountStr = '0.00000000000000000000000000000000000000000000000000';
            const totalAmountStr = minedAmountStr;

            const existingRecord = await MonthlySettlement.findOne({
                walletAddress: new RegExp('^' + walletAddress.trim() + '$', 'i'),
                year: target.year,
                month: target.month
            });

            if (!existingRecord) {
                await MonthlySettlement.create({
                    walletAddress,
                    year: target.year,
                    month: target.month,
                    minedAmount: minedAmountStr,
                    bonusAmount: bonusAmountStr,
                    totalAmount: totalAmountStr,
                    settledAt: target.settledAt,
                    migrationStatus
                });
                totalCreatedCount++;
                console.log(`[HealScript] ✅ 정밀 소급 생성 완료: ${walletAddress} (${target.year}-${target.month}) [Pro-rata: ${(weight.toNumber() * 100).toFixed(2)}%] -> ${migrationStatus}`);
            } else {
                totalVerifiedCount++;
                existingRecord.minedAmount = minedAmountStr;
                existingRecord.bonusAmount = bonusAmountStr;
                existingRecord.totalAmount = totalAmountStr;
                existingRecord.migrationStatus = migrationStatus;
                await existingRecord.save();
                console.log(`[HealScript] 🔄 정밀 소급 갱신 완료: ${walletAddress} (${target.year}-${target.month}) [Pro-rata: ${(weight.toNumber() * 100).toFixed(2)}%] -> ${migrationStatus}`);
            }
        }
    }

    console.log(`[HealScript] 🎉 유저 가입일 기반 무결점 소급 수복 공정 완료! (신규 생성: ${totalCreatedCount}개, 정밀 보정/검증: ${totalVerifiedCount}개)`);
    await mongoose.disconnect();
}

runHealMonthlySettlements().catch(err => {
    console.error('[HealScript] 오류 발생:', err);
    process.exit(1);
});
