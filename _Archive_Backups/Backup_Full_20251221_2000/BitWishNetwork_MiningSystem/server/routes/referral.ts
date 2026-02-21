/**
 * BitWishNetwork Mining System
 * Referral Bonus API Routes
 * 
 * ⚠️ 중요 준수 사항:
 * 1. 가입자 목록 조회 및 관리
 * 2. 지급 내역 조회
 * 3. 50자리 정밀도 유지
 */

import express from 'express';
import BonusRecord from '../models/BonusRecord';
import MiningState from '../models/MiningState';
import User from '../models/User';
import Decimal from 'decimal.js';

const router = express.Router();

// 50자리 정밀도 설정
Decimal.set({ precision: 50 });

/**
 * GET /api/referral/list/:walletAddress
 * 가입자 목록 조회
 */
router.get('/list/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;

        // 1. BonusRecord 조회
        const bonusRecord = await BonusRecord.findOne({ walletAddress });

        if (!bonusRecord) {
            return res.json({
                success: true,
                data: {
                    referralList: [],
                    totalBonus: '0.00000000',
                    totalReward: '0.00000000',
                    referralCount: 0
                }
            });
        }

        // 2. MiningState 조회 (추천인 수 확인)
        const miningState = await MiningState.findOne({ walletAddress });

        // 3. 가입자 목록 포맷팅
        const formattedList = bonusRecord.referralList.map(item => ({
            walletAddress: item.childWalletAddress,
            joinedAt: item.joinedAt,
            accumulatedBonus: new Decimal(item.accumulatedBonus || '0').toFixed(8),
            accumulatedBonusFull: item.accumulatedBonus, // 50자리 전체
            isKycVerified: item.isKycVerified,
            rewardStatus: item.rewardStatus
        }));

        // 4. 응답 데이터 구성
        return res.json({
            success: true,
            data: {
                referralList: formattedList,
                totalBonus: new Decimal(bonusRecord.referralBonusStorage || '0').toFixed(8),
                totalBonusFull: bonusRecord.referralBonusStorage,
                totalReward: new Decimal(bonusRecord.referralRewardStorage || '0').toFixed(8),
                totalRewardFull: bonusRecord.referralRewardStorage,
                referralCount: miningState?.referralCount || 0
            }
        });
    } catch (error) {
        console.error('Referral list error:', error);
        return res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다'
        });
    }
});

/**
 * GET /api/referral/stats/:walletAddress
 * 추천 통계 조회 (완전한 버전 - 프론트엔드용)
 */
router.get('/stats/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;

        const user = await User.findOne({ walletAddress });
        const bonusRecord = await BonusRecord.findOne({ walletAddress });
        const miningState = await MiningState.findOne({ walletAddress });

        if (!user || !bonusRecord || !miningState) {
            return res.json({
                success: true,
                data: {
                    referralCode: user?.myReferralCode || '',
                    referralCount: 0,
                    referralBonusRate: 0,
                    referralBonusStorage: '0.00000000',
                    referralRewardStorage: '0.00000000',
                    referralList: []
                }
            });
        }

        return res.json({
            success: true,
            data: {
                referralCode: user.myReferralCode,
                referralCount: miningState.referralCount,
                referralBonusRate: parseFloat(miningState.referralBonusRate || '0'),
                referralBonusStorage: new Decimal(bonusRecord.referralBonusStorage || '0').toFixed(8),
                referralRewardStorage: new Decimal(bonusRecord.referralRewardStorage || '0').toFixed(8),
                referralList: bonusRecord.referralList.map(item => ({
                    childWalletAddress: item.childWalletAddress,
                    joinedAt: item.joinedAt,
                    accumulatedBonus: new Decimal(item.accumulatedBonus || '0').toFixed(8),
                    isKycVerified: item.isKycVerified,
                    rewardStatus: item.rewardStatus
                }))
            }
        });
    } catch (error) {
        console.error('Referral stats error:', error);
        return res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다'
        });
    }
});

export default router;
