import mongoose from 'mongoose';
import Decimal from 'decimal.js';
import User from '../server/models/User.ts';
import MiningState from '../server/models/MiningState.ts';
import MonthlySettlement from '../server/models/MonthlySettlement.ts';
import BonusRecord from '../server/models/BonusRecord.ts';

Decimal.set({ precision: 50 });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bitwish_mining';

/**
 * 4월/5월 마이닝 데이터 초정밀 분리 및 KYC 거버넌스 수복 스크립트
 * [수정 사항]: 
 * 1. 기존 잘못된 정산 내역 원상복구(Rollback) 로직 추가
 * 2. KYC 승인 여부에 따른 상태값(WAITING_KYC / LOCKED) 분리
 * 3. 타임락 카운팅 기점을 'KYC 승인 완료일'로 보정
 */
async function runRecovery() {
    try {
        console.log('⏳ [거버넌스 수복] 4월 데이터 원상복구 및 초정밀 재집도 가동...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB 연결 성공');

        // ---------------------------------------------------------
        // 1. 원상복구 (Rollback): 잘못된 4월 정산 내역 삭제 및 실시간 채굴판 복원
        // ---------------------------------------------------------
        const existingAprilSettlements = await MonthlySettlement.find({ year: 2026, month: 4 });
        if (existingAprilSettlements.length > 0) {
            console.log(`♻️  롤백 작업 개시: ${existingAprilSettlements.length}건`);
            for (const settlement of existingAprilSettlements) {
                const addr = settlement.walletAddress;
                const state = await MiningState.findOne({ walletAddress: addr });
                const bonus = await BonusRecord.findOne({ walletAddress: new RegExp('^' + addr + '$', 'i') });

                if (state) {
                    // 떼어냈던 4월분을 다시 현재 누적량에 합산 (원복)
                    const restored = new Decimal(state.accumulatedReward).plus(new Decimal(settlement.minedAmount));
                    state.accumulatedReward = restored.toString();
                    await state.save();
                }
                if (bonus) {
                    // 보너스도 합산 원복
                    const restoredBonus = new Decimal(bonus.referralBonusStorage || '0').plus(new Decimal(settlement.bonusAmount));
                    bonus.referralBonusStorage = restoredBonus.toString();
                    await bonus.save();
                }
                // 잘못된 장부 기록 삭제
                await MonthlySettlement.deleteOne({ _id: settlement._id });
                console.log(`   - [${addr}] 데이터 원상복구 완료`);
            }
        }

        // ---------------------------------------------------------
        // 2. 초정밀 재집도: 전수 조사 및 KYC 거버넌스 적용
        // ---------------------------------------------------------
        console.log('\n--- 롤백 완료, 거버넌스 기반 초정밀 재정산 개시 ---');
        
        const allStates = await MiningState.find({});
        const MAY_FIRST = new Date('2026-05-01T00:00:00+09:00');
        const NOW = new Date();
        let totalProcessed = 0;

        for (const state of allStates) {
            const walletAddress = state.walletAddress;
            const user = await User.findOne({ walletAddress });
            if (!user) continue;

            const totalReward = new Decimal(state.accumulatedReward);
            if (totalReward.isZero()) continue;

            // (A) 5월분 역산 로직
            let mayMinedAmount = new Decimal(0);
            if (state.lastSyncTime > MAY_FIRST) {
                const effectiveStartTime = state.miningStartTime && state.miningStartTime > MAY_FIRST ? state.miningStartTime : MAY_FIRST;
                const effectiveEndTime = state.isMining ? NOW : state.lastSyncTime;
                const diffSeconds = Math.max(0, (effectiveEndTime.getTime() - effectiveStartTime.getTime()) / 1000);
                const ratePerSecond = new Decimal(state.currentTotalRate).div(3600);
                mayMinedAmount = ratePerSecond.mul(diffSeconds);
            }
            if (mayMinedAmount.gt(totalReward)) mayMinedAmount = totalReward;
            const aprilMinedAmount = totalReward.minus(mayMinedAmount);

            // (B) 추천 보너스 분리 로직
            let aprilBonusAmount = new Decimal(0);
            let mayBonusAmount = new Decimal(0);
            const bonusRecord = await BonusRecord.findOne({ walletAddress: new RegExp('^' + walletAddress + '$', 'i') });
            if (bonusRecord) {
                const totalBonus = new Decimal(bonusRecord.referralBonusStorage || '0');
                if (totalBonus.gt(0)) {
                    if (state.lastSyncTime > MAY_FIRST && state.referralCount > 0) {
                        const effectiveStartTime = state.miningStartTime && state.miningStartTime > MAY_FIRST ? state.miningStartTime : MAY_FIRST;
                        const effectiveEndTime = state.isMining ? NOW : state.lastSyncTime;
                        const diffSeconds = Math.max(0, (effectiveEndTime.getTime() - effectiveStartTime.getTime()) / 1000);
                        const baseRate = new Decimal(state.currentBaseRate);
                        const referralRate = new Decimal(state.referralBonusRate);
                        const referralRatePerSecond = baseRate.mul(referralRate).div(3600);
                        mayBonusAmount = referralRatePerSecond.mul(diffSeconds);
                    }
                    if (mayBonusAmount.gt(totalBonus)) mayBonusAmount = totalBonus;
                    aprilBonusAmount = totalBonus.minus(mayBonusAmount);
                }
            }

            const totalApril = aprilMinedAmount.plus(aprilBonusAmount);
            if (totalApril.lte(0)) continue;

            // (C) 거버넌스(KYC) 필터링 로직
            let status = 'WAITING_KYC';
            let settledDate = MAY_FIRST;

            if (user.isKycVerified && user.kycVerifiedDate) {
                // KYC 승인자만 LOCKED 부여 및 승인 완료일 기준으로 카운팅 기점 설정
                status = 'LOCKED';
                settledDate = user.kycVerifiedDate; 
            }

            // (D) 최종 정산 장부 기록
            await MonthlySettlement.findOneAndUpdate(
                { walletAddress, year: 2026, month: 4 },
                {
                    minedAmount: aprilMinedAmount.toString(),
                    bonusAmount: aprilBonusAmount.toString(),
                    totalAmount: totalApril.toString(),
                    settledAt: settledDate,
                    migrationStatus: status
                },
                { upsert: true, new: true }
            );

            // 5월분 마이닝 데이터 정밀 보정
            state.accumulatedReward = mayMinedAmount.toString();
            await state.save();

            if (bonusRecord) {
                bonusRecord.referralBonusStorage = mayBonusAmount.toString();
                await bonusRecord.save();
            }

            console.log(`✅ [${walletAddress}] 재정산 완료: ${totalApril.toFixed(10)} BW (${status})`);
            totalProcessed++;
        }

        console.log(`\n🎉 총 ${totalProcessed}명의 데이터 거버넌스 재정산 및 수복 완료.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ 에러 발생:', error);
        process.exit(1);
    }
}

runRecovery();
