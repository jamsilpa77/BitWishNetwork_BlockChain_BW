/**
 * BitWishNetwork Mining System
 * Monthly Settlement Automation Engine (Worker)
 * 
 * [공정 5 - 2단계] 정산 자동화 엔진 및 이중 원장 데이터 동기화
 * ⚠️ 지시 사항 준수: KYC 승인 유저 대상, 매월 1일 정산 로직 구현
 */

import mongoose from 'mongoose';
import User from '../models/User';
import MiningState from '../models/MiningState';
import MonthlySettlement from '../models/MonthlySettlement';
import BonusRecord from '../models/BonusRecord';
import Decimal from 'decimal.js';

Decimal.set({ precision: 50 });

export class SettlementWorker {
    /**
     * 월별 정산 실행 엔진
     * @param targetYear 정산 연도
     * @param targetMonth 정산 월
     */
    public async runMonthlySettlement(targetYear: number, targetMonth: number): Promise<void> {
        console.log(`[Settlement] Starting settlement for ${targetYear}-${targetMonth}...`);

        try {
            // 1. KYC 승인된 유저만 추출
            const approvedUsers = await User.find({
                'kycApplication.status': 'APPROVED'
            });

            console.log(`[Settlement] Found ${approvedUsers.length} approved users.`);

            for (const user of approvedUsers) {
                const walletAddress = user.walletAddress;

                // 2. 현재 채굴 상태 및 보너스 기록 조회
                const miningState = await MiningState.findOne({ walletAddress });
                const bonusRecord = await BonusRecord.findOne({ walletAddress });

                if (!miningState) continue;

                // 3. 정산 금액 확정 (Decimal.js 사용)
                const currentMined = new Decimal(miningState.accumulatedReward);
                const currentBonus = new Decimal(bonusRecord?.referralBonusStorage || '0');
                const totalSettled = currentMined.plus(currentBonus);

                if (totalSettled.isZero()) continue;

                // 4. 영구 원장(MonthlySettlement)에 기록
                await MonthlySettlement.findOneAndUpdate(
                    { walletAddress, year: targetYear, month: targetMonth },
                    {
                        minedAmount: currentMined.toString(),
                        bonusAmount: currentBonus.toString(),
                        totalAmount: totalSettled.toString(),
                        settledAt: new Date(),
                        migrationStatus: 'LOCKED' // 정산 직후는 15일 타임락 대기 상태
                    },
                    { upsert: true, new: true }
                );

                // 5. 실시간 상태 수치 초기화 (정산된 금액 차감)
                // 중요: 보너스율이나 추천인 수는 유지하고 오직 '수량'만 원장으로 이동
                miningState.accumulatedReward = '0.00000000000000000000000000000000000000000000000000';
                await miningState.save();

                if (bonusRecord) {
                    bonusRecord.referralBonusStorage = '0.00000000000000000000000000000000000000000000000000';
                    await bonusRecord.save();
                }

                console.log(`[Settlement] Completed for ${walletAddress}: ${totalSettled.toString()} BW`);
            }

            console.log(`[Settlement] Monthly settlement finished successfully.`);
        } catch (error) {
            console.error(`[Settlement] Error during settlement:`, error);
            throw error;
        }
    }
}

export const settlementWorker = new SettlementWorker();
