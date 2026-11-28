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

import { BlockMiningService } from '../services/BlockMiningService';
import { HalvingPolicyEngine } from '../services/HalvingPolicyEngine';

Decimal.set({ precision: 50 });

export class SettlementWorker {
    private isBlockSyncRunning: boolean = false;

    constructor() {
        console.log('⚙️ [SettlementWorker] Mongoose 무인 정산 및 타임락 오토메이션 엔진 기동 완료');
        this.initializeMidnightPatrol();
        this.initializeMonthlySnapshot();
        this.initializeMonthlyHalvingSchedule();
        this.initializeGlobalBlockHeartbeat();
    }

    /**
     * [오토 하트비트 타이머] 24시간 무인 실시간 총발행량-물리블록 1:1 칼동기화 엔진
     * 10초 주기 정밀 감시: 오직 [Math.floor(totalSupply) > currentBlockCount] 일 때만 부족분 1:1 생성
     */
    private initializeGlobalBlockHeartbeat(): void {
        console.log('💓 [SettlementWorker] 백엔드 오토 하트비트 타이머(1:1 칼동기화 엔진) 기동 완료');
        setInterval(async () => {
            if (this.isBlockSyncRunning) {
                return;
            }
            this.isBlockSyncRunning = true;
            try {
                await BlockMiningService.syncGlobalBlocks();
            } catch (error) {
                console.error('[Heartbeat Engine Error] 블록 무인 동기화 감시 예외 발생:', error);
            } finally {
                this.isBlockSyncRunning = false;
            }
        }, 10000); // 10초 주기 정밀 체크
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
     * [스냅샷] 매월 말일 23:59:59 월간 정산 자동 가동 (KST 한국 표준시 기준)
     */
    private initializeMonthlySnapshot(): void {
        cron.schedule('59 59 23 * * *', async () => {
            const now = new Date();
            // 한국 표준시(KST) 기준 현재 연, 월, 일 정밀 추출
            const kstDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' }); // YYYY-MM-DD
            const [year, month, day] = kstDateStr.split('-').map(Number);

            // 해당 월의 실제 마지막 날짜 계산 (11월: 30, 12월: 31, 2월: 28/29)
            const lastDayOfMonth = new Date(year, month, 0).getDate();

            if (day === lastDayOfMonth) {
                console.log(`[SettlementWorker] 📸 KST 말일 도래 확인(${kstDateStr}): 월간 채굴 보존 및 이관 스냅샷 가동`);
                await this.executeMonthlySnapshot();
            }
        }, {
            timezone: 'Asia/Seoul' // KST 한국 표준시 엄격 지정
        });
    }

    /**
     * [공정 4-3 세부 작업 3] 매월 1일 AM 00:00:00(KST) 무인 자동 선형 반감기 스케줄러
     */
    private initializeMonthlyHalvingSchedule(): void {
        // 매월 1일 AM 00:00:00 (KST 한국 표준시 정각 기준)
        cron.schedule('0 0 1 * *', async () => {
            console.log(`[SettlementWorker] ⏰ 매월 1일 KST 자정 도래: 무인 선형 반감기 자동 판별 및 전파 시작`);
            await this.executeMonthlyHalvingRoutine();
        }, {
            timezone: 'Asia/Seoul'
        });
    }

    /**
     * 매월 1일 자정 무인 자동 반감기 판별, 전체 마이너 DB 동기화 및 터미널 정밀 브리핑 실행 로직
     */
    public async executeMonthlyHalvingRoutine(): Promise<void> {
        try {
            // 1. 메모리 캐시 즉각 무효화하여 최신 상태 유도
            HalvingPolicyEngine.invalidateCache();

            // 2. 최신 반감기 상태 판별
            const status = await HalvingPolicyEngine.getHalvingStatus();

            // 3. 반감기가 활성화(ON)되어 있고 시작일이 경과/도달한 경우
            if (status.config.isEnabled && status.isActive) {
                console.log('\n' +
                    '═══════════════════════════════════════════════════════════════════════════════\n' +
                    ' [BitWish Monthly Halving] ⏰ 새 월(Month) 진입: 무인 선형 반감기 자동 정밀 가동\n' +
                    '───────────────────────────────────────────────────────────────────────────────\n' +
                    ` • 발동 일시         : 매월 01일 AM 00:00:00 (KST 한국 표준시 정각)\n` +
                    ` • 적용 상태         : ${status.currentElapsedMonths}차 선형 감산 (-${status.currentReductionPercent.toFixed(1)}%) 정밀 발동\n` +
                    ` • 신규 기본 채굴률 : ${status.currentBaseRate} BW/h\n` +
                    '═══════════════════════════════════════════════════════════════════════════════\n'
                );

                // 4. 전체 활성 마이너들의 DB 장부(MiningState)에 새 기본 채굴률 무인 일괄 영구 동기화
                const syncResult = await HalvingPolicyEngine.syncGlobalMiners();
                console.log(`[BitWish Monthly Halving] ✅ 전체 활성 마이너 ${syncResult.updatedCount}명에게 새 기본 채굴률(${syncResult.currentBaseRate} BW/h)이 무인 자동 동기화되었습니다.`);
            }

            // 5. 정밀 거버넌스 종합 브리핑 터미널 출력
            HalvingPolicyEngine.printGovernanceBriefing(status);

        } catch (error) {
            console.error('[SettlementWorker] ❌ 월간 무인 반감기 스케줄 처리 중 오류 발생:', error);
        }
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
                const user = await User.findOne({ walletAddress: new RegExp('^' + record.walletAddress.trim() + '$', 'i') });
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
    public async executeMonthlySnapshot(): Promise<{ success: boolean; settledCount: number; targetYear: number; targetMonth: number; message: string }> {
        try {
            const now = new Date();
            const kstDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
            const [kstYear, kstMonth] = kstDateStr.split('-').map(Number);
            const targetYear = kstYear;
            const targetMonth = kstMonth; // 1~12 (KST 기준 정밀 연월)

            // [공정 4-1 안전 방어선] 이전 비정상 실행 등으로 발생했을 수 있는 walletAddress null/빈값 결함 레코드 사전 정리
            await MonthlySettlement.deleteMany({
                $or: [
                    { walletAddress: null },
                    { walletAddress: '' },
                    { walletAddress: { $exists: false } }
                ]
            });

            const users = await User.find({});
            console.log(`[SettlementWorker] ${targetYear}-${targetMonth} 월간 정산 스냅샷 대상 회원: 총 ${users.length}명`);

            let settledCount = 0;

            for (const user of users) {
                const walletAddress = user.walletAddress;
                const normalizedAddress = walletAddress.trim();
                const isKycApproved = Boolean(user.isKycVerified || user.kycApplication?.status === 'APPROVED');
                const migrationStatus = isKycApproved ? 'LOCKED' : 'WAITING_KYC';

                const miningState = await MiningState.findOne({
                    walletAddress: new RegExp('^' + normalizedAddress + '$', 'i')
                });
                const bonusRecord = await BonusRecord.findOne({
                    walletAddress: new RegExp('^' + normalizedAddress + '$', 'i')
                });

                if (!miningState) continue;

                // [공정 2 수복] 스냅샷 직전 미동기화 실시간 채굴량(Pending LiveBoost) 50자리 전수 소급 결산
                if (miningState.isMining) {
                    const lastSync = miningState.lastSyncTime || (miningState as any).updatedAt || now;
                    const diffSeconds = Math.max(0, (now.getTime() - new Date(lastSync).getTime()) / 1000);
                    if (diffSeconds > 0) {
                        // 1. 메인 채굴 보상 실시간 증분 소급 합산 (50자리 초정밀 연산)
                        const currentReward = new Decimal(miningState.accumulatedReward || '0');
                        const ratePerHour = new Decimal(miningState.currentTotalRate || '0.25');
                        const ratePerSecond = ratePerHour.div(3600);
                        const livePendingMined = ratePerSecond.mul(diffSeconds);
                        miningState.accumulatedReward = currentReward.plus(livePendingMined).toFixed(50);

                        // 2. 추천 보너스 보관함 실시간 증분 소급 합산 (50자리 초정밀 연산)
                        if (bonusRecord && new Decimal(miningState.referralBonusRate || '0').gt(0)) {
                            const baseRate = new Decimal(miningState.currentBaseRate || '0.25');
                            const referralRate = new Decimal(miningState.referralBonusRate || '0');
                            const referralRatePerSecond = baseRate.mul(referralRate).div(3600);
                            const livePendingBonus = referralRatePerSecond.mul(diffSeconds);
                            const currentBonusStorage = new Decimal(bonusRecord.referralBonusStorage || '0');
                            bonusRecord.referralBonusStorage = currentBonusStorage.plus(livePendingBonus).toFixed(50);
                        }
                        miningState.lastSyncTime = now;
                    }
                }

                const currentMined = new Decimal(miningState.accumulatedReward || '0');
                const currentBonus = new Decimal(bonusRecord?.referralBonusStorage || '0');
                const totalSettled = currentMined.plus(currentBonus);

                if (totalSettled.isZero()) continue;

                const minedAmountStr = currentMined.toFixed(50);
                const bonusAmountStr = currentBonus.toFixed(50);
                const totalAmountStr = totalSettled.toFixed(50);

                // [공정 4-1 수복] MonthlySettlement 영구 장부에 정산 레코드 생성/업데이트 (정규식 제거 및 $setOnInsert 완전 방어)
                await MonthlySettlement.findOneAndUpdate(
                    { 
                        walletAddress: normalizedAddress, 
                        year: targetYear, 
                        month: targetMonth 
                    },
                    {
                        $set: {
                            minedAmount: minedAmountStr,
                            bonusAmount: bonusAmountStr,
                            totalAmount: totalAmountStr,
                            settledAt: now,
                            migrationStatus: migrationStatus
                        },
                        $setOnInsert: {
                            walletAddress: normalizedAddress,
                            year: targetYear,
                            month: targetMonth,
                            createdAt: now
                        }
                    },
                    { upsert: true, new: true }
                );

                // 2. 실시간 당월 채굴량 '0'으로 초기화하여 다음 달로 이관 (추천 수/속도는 영구 유지)
                miningState.accumulatedReward = '0.00000000000000000000000000000000000000000000000000';
                miningState.lastSyncTime = now;
                // [4공정 수복] 채굴량 기준점도 0으로 리셋 — 다음 달부터 0→1 BW 도달 시 블록 생성 재개
                // (기준점을 리셋하지 않으면 다음 달에 1 BW씩 쌓여도 블록 생성 고리가 끊김)
                miningState.lastBlockRewardThreshold = '0';
                await miningState.save();

                // 3. 추천 보너스 보관함 초기화 (있는 경우)
                if (bonusRecord && !new Decimal(bonusRecord.referralBonusStorage || '0').isZero()) {
                    bonusRecord.referralBonusStorage = '0.00000000000000000000000000000000000000000000000000';
                    // [4공정 수복] 보너스 기준점도 0으로 리셋 — 다음 달부터 0→1 BW 도달 시 블록 생성 재개
                    (bonusRecord as any).lastBonusBlockThreshold = '0';
                    await bonusRecord.save();
                }

                settledCount++;
                console.log(`[SettlementWorker] ✅ 정산 완료: ${walletAddress} (${targetYear}-${targetMonth}) [${migrationStatus}] - 수량: ${totalSettled.toFixed(8)} BW`);
            }

            console.log(`[SettlementWorker] 🎉 ${targetYear}-${targetMonth} 월간 무인 스냅샷 공정 성공적 종료! 총 ${settledCount}명 정산 적립 완료.`);
            return {
                success: true,
                settledCount,
                targetYear,
                targetMonth,
                message: `${targetYear}년 ${targetMonth}월 정산 스냅샷이 성공적으로 완료되었습니다. (정산 인원: ${settledCount}명)`
            };
        } catch (error: any) {
            console.error(`[SettlementWorker] ❌ 월간 스냅샷 처리 중 심각한 오류 발생:`, error);
            return {
                success: false,
                settledCount: 0,
                targetYear: 0,
                targetMonth: 0,
                message: error.message || '월간 정산 스냅샷 처리 중 오류가 발생했습니다.'
            };
        }
    }
}

export const settlementWorker = new SettlementWorker();
