/**
 * BitWishNetwork BW 무인 정산 엔진 및 타임락 오토메이션 워커
 * 
 * ⚠️ 안전 수칙 헌장 및 무결성 원칙 준수:
 * 1. 100% Mongoose ODM 모델(User, MiningState, MonthlySettlement, BonusRecord) 기반 운영 DB(bitwish_mining) 매핑
 * 2. Decimal.js 50자리 부동소수점 정밀 연산 준수
 * 3. 매월 말일 23:59:59 자동 월간 정산 스냅샷 영구 장부(MonthlySettlement) 적립
 * 4. 매일 자정 00:00:00 15일 타임락 만료 순찰대 (LOCKED -> UNLOCKED 전환) 가동
 */

import * as cron from 'node-cron';
import Decimal from 'decimal.js';
import User from '../models/User';
import MiningState from '../models/MiningState';
import MonthlySettlement from '../models/MonthlySettlement';
import BonusRecord from '../models/BonusRecord';

Decimal.set({ precision: 50 });

export class SettlementWorker {
    constructor() {
        console.log('⚙️ [SettlementWorker] Mongoose 무인 정산 및 타임락 오토메이션 엔진 기동 완료');
        this.initializeMidnightPatrol();
        this.initializeMonthlySnapshot();
    }

    /**
     * [자정 순찰대] 매일 밤 자정(00:00:00) 15일 타임락 기한 도래 검증 및 LOCKED -> UNLOCKED 전환
     */
    private initializeMidnightPatrol(): void {
        cron.schedule('0 0 * * *', async () => {
            console.log(`[SettlementWorker] 🌙 자정 순찰대 가동: 타임락 15일 만료 유저 전수 검증 시작`);
            await this.executeTimelockRelease();
        });
    }

    /**
     * [스냅샷] 매월 말일 23:59:59 월간 정산 자동 가동
     */
    private initializeMonthlySnapshot(): void {
        cron.schedule('59 59 23 * * *', async () => {
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 1000); // 1초 뒤 (다음 달 1일 00:00:00)

            // 현재 달과 1초 뒤 달이 달라지는 순간이 바로 말일 23:59:59
            if (now.getMonth() !== tomorrow.getMonth()) {
                console.log(`[SettlementWorker] 📸 말일 스냅샷 가동: 월간 채굴 보존 및 이관 공정 시작`);
                await this.executeMonthlySnapshot();
            }
        });
    }

    /**
     * 15일 타임락 해제 순찰대 실행 로직
     */
    public async executeTimelockRelease(): Promise<void> {
        try {
            const lockedRecords = await MonthlySettlement.find({ migrationStatus: 'LOCKED' });
            const now = new Date();
            let unlockedCount = 0;

            for (const record of lockedRecords) {
                const user = await User.findOne({ walletAddress: record.walletAddress });
                if (!user) continue;

                const isKycApproved = Boolean(user.isKycVerified || user.kycApplication?.status === 'APPROVED');
                if (!isKycApproved) {
                    record.migrationStatus = 'WAITING_KYC';
                    await record.save();
                    continue;
                }

                // settledAt 기준 15일 경과 여부 측정 (15일 = 15 * 24 * 60 * 60 * 1000 ms)
                const settledTime = record.settledAt ? new Date(record.settledAt).getTime() : record.createdAt ? new Date(record.createdAt).getTime() : now.getTime();
                const diffTime = now.getTime() - settledTime;
                const diffDays = diffTime / (1000 * 60 * 60 * 24);

                if (diffDays >= 15) {
                    record.migrationStatus = 'UNLOCKED';
                    record.migrationDate = now;
                    await record.save();
                    unlockedCount++;
                    console.log(`[SettlementWorker] 🔓 타임락 해제 완료: ${record.walletAddress} (${record.year}-${record.month}) -> UNLOCKED`);
                }
            }

            console.log(`[SettlementWorker] 🌙 자정 순찰대 검증 종료: 총 ${unlockedCount}개 레코드 UNLOCKED 전환 완료.`);
        } catch (error) {
            console.error(`[SettlementWorker] ❌ 타임락 해제 처리 중 예외 발생:`, error);
        }
    }

    /**
     * 월간 말일 정산 스냅샷 실행 로직
     */
    public async executeMonthlySnapshot(): Promise<void> {
        try {
            const now = new Date();
            const targetYear = now.getFullYear();
            const targetMonth = now.getMonth() + 1; // 1~12

            const users = await User.find({});
            console.log(`[SettlementWorker] ${targetYear}-${targetMonth} 월간 정산 스냅샷 대상 회원: 총 ${users.length}명`);

            let settledCount = 0;

            for (const user of users) {
                const walletAddress = user.walletAddress;
                const isKycApproved = Boolean(user.isKycVerified || user.kycApplication?.status === 'APPROVED');
                const migrationStatus = isKycApproved ? 'LOCKED' : 'WAITING_KYC';

                const miningState = await MiningState.findOne({ walletAddress });
                const bonusRecord = await BonusRecord.findOne({ walletAddress });

                if (!miningState) continue;

                const currentMined = new Decimal(miningState.accumulatedReward || '0');
                const currentBonus = new Decimal(bonusRecord?.referralBonusStorage || '0');
                const totalSettled = currentMined.plus(currentBonus);

                if (totalSettled.isZero()) continue;

                const minedAmountStr = currentMined.toFixed(50);
                const bonusAmountStr = currentBonus.toFixed(50);
                const totalAmountStr = totalSettled.toFixed(50);

                // 1. MonthlySettlement 영구 장부에 정산 레코드 생성/업데이트
                await MonthlySettlement.findOneAndUpdate(
                    { walletAddress, year: targetYear, month: targetMonth },
                    {
                        minedAmount: minedAmountStr,
                        bonusAmount: bonusAmountStr,
                        totalAmount: totalAmountStr,
                        settledAt: now,
                        migrationStatus
                    },
                    { upsert: true, new: true }
                );

                // 2. 실시간 당월 채굴량 '0'으로 초기화하여 다음 달로 이관 (추천 수/속도는 영구 유지)
                miningState.accumulatedReward = '0.00000000000000000000000000000000000000000000000000';
                miningState.lastSyncTime = now;
                await miningState.save();

                // 3. 추천 보너스 보관함 초기화 (있는 경우)
                if (bonusRecord && !new Decimal(bonusRecord.referralBonusStorage || '0').isZero()) {
                    bonusRecord.referralBonusStorage = '0.00000000000000000000000000000000000000000000000000';
                    await bonusRecord.save();
                }

                settledCount++;
                console.log(`[SettlementWorker] ✅ 정산 완료: ${walletAddress} (${targetYear}-${targetMonth}) [${migrationStatus}] - 수량: ${totalSettled.toFixed(8)} BW`);
            }

            console.log(`[SettlementWorker] 🎉 ${targetYear}-${targetMonth} 월간 무인 스냅샷 공정 성공적 종료! 총 ${settledCount}명 정산 적립 완료.`);
        } catch (error) {
            console.error(`[SettlementWorker] ❌ 월간 스냅샷 처리 중 심각한 오류 발생:`, error);
        }
    }
}

export const settlementWorker = new SettlementWorker();
