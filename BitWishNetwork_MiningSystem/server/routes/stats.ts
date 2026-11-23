import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import MiningState from '../models/MiningState';
import BonusRecord from '../models/BonusRecord';
import MonthlySettlement from '../models/MonthlySettlement';
import Decimal from 'decimal.js';

const router = express.Router();

/**
 * GET /api/stats/realtime
 * 홈페이지 실시간 채굴 현황 데이터를 반환합니다.
 */
router.get('/realtime', async (req, res) => {
    try {
        // 1. 지갑 생성 수 (User Count)
        const totalWallets = await User.countDocuments({});

        // 2. 실시간 BW 발행량 계산
        // 2-1. DB에 저장된 기초 채굴 합계 조회
        const miningRewardAgg = await MiningState.aggregate([
            {
                $group: {
                    _id: null,
                    totalAccumulated: { $sum: { $toDouble: { $ifNull: ["$accumulatedReward", "0"] } } }
                }
            }
        ]);
        let totalMiningReward = new Decimal(miningRewardAgg[0]?.totalAccumulated || 0);

        // [핵심] 실시간 보정: 현재 채굴 중인 인원의 미동기화 채굴량 합산
        const activeMiners = await MiningState.find({ isMining: true });
        const now = Date.now();
        let liveBoost = new Decimal(0);

        activeMiners.forEach(miner => {
            const lastSync = miner.lastSyncTime ? new Date(miner.lastSyncTime).getTime() : now;
            const elapsed = Math.max(0, (now - lastSync) / 1000); // 초 단위 경과 시간
            if (elapsed > 0) {
                const ratePerSec = new Decimal(miner.currentTotalRate || '0.25').div(3600);
                liveBoost = liveBoost.plus(ratePerSec.mul(elapsed));
            }
        });

        // 2-1-1. [최종 수복] 메인 정산 장부(MonthlySettlement) 기반 전역 합산 (Section 4.2 정정 계획 반영)
        // 지갑 앱의 '정산 내역'과 100% 동기화하기 위해 동일한 컬렉션을 전수 조사함.
        const settlementAgg = await MonthlySettlement.aggregate([
            {
                $group: {
                    _id: null,
                    locked: {
                        $sum: {
                            $cond: [
                                { $in: ["$migrationStatus", ["LOCKED", "WAITING_KYC"]] },
                                { $toDouble: { $ifNull: ["$totalAmount", "0"] } },
                                0
                            ]
                        }
                    },
                    released: {
                        $sum: {
                            $cond: [
                                { $in: ["$migrationStatus", ["UNLOCKED", "MIGRATED"]] },
                                { $toDouble: { $ifNull: ["$totalAmount", "0"] } },
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        const totalLockedAmount = new Decimal(settlementAgg[0]?.locked || 0);
        const totalReleasedAmount = new Decimal(settlementAgg[0]?.released || 0);

        // [안전망 (Fail-Safe)] 총 발행량 로직 훼손 방지를 위한 원상복구 합산
        const totalSettlementAmount = totalLockedAmount.plus(totalReleasedAmount);

        // 실시간 참값 = DB 미정산 저장값 + 현재 흐르고 있는 채굴량 + 과거 정산 누적 합계
        totalMiningReward = totalMiningReward.plus(liveBoost).plus(totalSettlementAmount);

        // 2-2. [1공정 수복] 가입/추천 보상 3대 보관함 (referralRewardStorage + referralBonusStorage + bonusStorage) 100% 무조건 전수 합산
        const bonusRewardAgg = await BonusRecord.aggregate([
            {
                $group: {
                    _id: null,
                    totalRewardStorage: { $sum: { $toDouble: { $ifNull: ["$referralRewardStorage", "0"] } } },
                    totalReferralBonusStorage: { $sum: { $toDouble: { $ifNull: ["$referralBonusStorage", "0"] } } },
                    totalOtherBonusStorage: { $sum: { $toDouble: { $ifNull: ["$bonusStorage", "0"] } } }
                }
            }
        ]);
        const totalBonusReward = new Decimal(bonusRewardAgg[0]?.totalRewardStorage || 0)
            .plus(new Decimal(bonusRewardAgg[0]?.totalReferralBonusStorage || 0))
            .plus(new Decimal(bonusRewardAgg[0]?.totalOtherBonusStorage || 0));

        // 총 발행량 = 채굴 보상 + 보너스 보상
        const currentSupply = totalMiningReward.plus(totalBonusReward);

        // 3. 총 공급량 (210억 고정)
        const totalSupply = new Decimal('21000000000');

        // 4. 잔여 발행량
        const remainingSupply = totalSupply.minus(currentSupply);

        // 5. 발행률 (%)
        const issuanceRate = currentSupply.div(totalSupply).times(100).toNumber();

        // [1공정 수복] bitwish_network.blocks DB에 실재하는 PoW 물리 블록 문서 개수를 그대로 리턴 (mongoose 커넥션 재사용)
        let totalBlocks = 0;
        let blockCreationFee = '0';
        let ecosystemFund = '0';
        let foundationFund = '0';
        try {
            const networkDb = mongoose.connection.useDb('bitwish_network');
            const dbCount = await networkDb.collection('blocks').countDocuments({}) || 0;
            totalBlocks = dbCount;

            // network_stats 에서 기금 정보 가져오기
            const fundStats = await networkDb.collection('network_stats').findOne({ id: 'global_fund_stats' });
            if (fundStats) {
                blockCreationFee = fundStats.totalAccumulatedFees || '0';
                ecosystemFund = fundStats.ecosystemFund || '0';
                foundationFund = fundStats.foundationFund || '0';
            }
        } catch (blockError) {
            console.warn('Block count check failed:', blockError);
        }

        // 네트워크 상태
        const networkStatus = 'CONNECTED';

        res.json({
            success: true,
            data: {
                totalUsers: totalWallets,
                totalBlocks,
                totalReward: 0, // 프론트엔드 타입 호환성 (any)
                currentIssued: currentSupply.toFixed(8),
                remainingSupply: remainingSupply.toFixed(8),
                issuanceRate: issuanceRate.toString(),
                totalSettlementAmount: totalSettlementAmount.toFixed(8), // [프리미엄 UI 신설 데이터 - 호환성 보존]
                totalLockedAmount: totalLockedAmount.toFixed(8), // [Phase 4: 분리된 잠금 자산]
                totalReleasedAmount: totalReleasedAmount.toFixed(8), // [Phase 4: KYC 승인 후 해제 자산]
                networkStatus,
                blockCreationFee,
                ecosystemFund,
                foundationFund
            }
        });

    } catch (error) {
        console.error('Stats API Error:', error);
        res.status(500).json({ success: false, message: '서버 에러가 발생했습니다.' });
    }
});

/**
 * GET /api/stats/blocks
 * 최신 블록 리스트 20개를 반환합니다. (익스플로러 용)
 */
router.get('/blocks', async (req, res) => {
    try {
        const networkDb = mongoose.connection.useDb('bitwish_network');
        const blocks = await networkDb.collection('blocks')
            .find({})
            .sort({ 'header.blockHeight': -1 })
            .limit(20)
            .toArray();
        res.json({ success: true, data: blocks });
    } catch (error) {
        console.error('Explorer Blocks API Error:', error);
        res.status(500).json({ success: false, message: '블록 데이터를 불러오는 데 실패했습니다.' });
    }
});

export default router;
