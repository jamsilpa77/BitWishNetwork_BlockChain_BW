import express from 'express';
import User from '../models/User';
import MiningState from '../models/MiningState';
import BonusRecord from '../models/BonusRecord';
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

        // 2. 실시간 BW 발행량 계산 (Aggregation)
        // 2-1. 채굴 보상 총합
        const miningRewardAgg = await MiningState.aggregate([
            {
                $group: {
                    _id: null,
                    totalAccumulated: { $sum: { $toDouble: "$accumulatedReward" } }
                }
            }
        ]);
        const totalMiningReward = new Decimal(miningRewardAgg[0]?.totalAccumulated || 0);

        // 2-2. 가입/추천 보상 총합
        const bonusRewardAgg = await BonusRecord.aggregate([
            {
                $group: {
                    _id: null,
                    totalRewardStorage: { $sum: { $toDouble: "$referralRewardStorage" } },
                    totalBonusStorage: { $sum: { $toDouble: "$bonusStorage" } }
                }
            }
        ]);
        const totalBonusReward = new Decimal(bonusRewardAgg[0]?.totalRewardStorage || 0)
            .plus(new Decimal(bonusRewardAgg[0]?.totalBonusStorage || 0));

        // 총 발행량 = 채굴 보상 + 보너스 보상
        const currentSupply = totalMiningReward.plus(totalBonusReward);

        // 3. 총 공급량 (210억 고정)
        const totalSupply = new Decimal('21000000000');

        // 4. 잔여 발행량
        const remainingSupply = totalSupply.minus(currentSupply);

        // 5. 발행률 (%)
        const issuanceRate = currentSupply.div(totalSupply).times(100).toNumber();

        // 6. 실시간 생성 블록 (추후 연동)
        const totalBlocks = 0;

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
                issuanceRate: issuanceRate.toFixed(2),
                networkStatus
            }
        });

    } catch (error) {
        console.error('Stats API Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

export default router;
