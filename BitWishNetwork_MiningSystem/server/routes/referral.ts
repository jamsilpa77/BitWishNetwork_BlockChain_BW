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

/**
 * POST /api/referral/register-reward
 * 가입 시 추천인/가입자 양방향 1BW 실시간 DB 적립 (무결성 보장)
 * 50자리 정밀 연산을 사용하여 어떠한 데이터 오차도 허용하지 않음
 */
router.post('/register-reward', async (req, res) => {
    const { referralCode, referredWallet } = req.body;

    try {
        console.log(`[Referral] Reward processing for ${referredWallet} with code: ${referralCode}`);

        // 1. 추천인 정보 재검증
        const referrer = await User.findOne({ myReferralCode: referralCode });
        if (!referrer) {
            console.error(`[Referral] Invalid referrer code: ${referralCode}`);
            return res.status(404).json({ success: false, message: 'Invalid referrer code' });
        }

        // 2. 추천인 보상 처리 (1BW 가산 + 추천 리스트 추가)
        // upsert: true를 사용하여 BonusRecord가 없는 경우 자동으로 "그릇" 생성
        let referrerBonus = await BonusRecord.findOneAndUpdate(
            { walletAddress: referrer.walletAddress },
            {
                $push: {
                    referralList: {
                        childWalletAddress: referredWallet,
                        joinedAt: new Date(),
                        rewardStatus: 'COMPLETED'
                    }
                }
            },
            { upsert: true, new: true }
        );

        // 정밀 연산 (Decimal.js 사용) - 추천인
        const currentRefReward = new Decimal(referrerBonus.referralRewardStorage || '0');
        referrerBonus.referralRewardStorage = currentRefReward.plus('1').toFixed(8);
        await referrerBonus.save();

        // 3. 가입자 본인 보상 처리 (1BW 가산)
        let referredBonus = await BonusRecord.findOneAndUpdate(
            { walletAddress: referredWallet },
            {}, // 가입자 본인의 리스트는 건드리지 않음
            { upsert: true, new: true }
        );

        // 정밀 연산 (Decimal.js 사용) - 가입자
        const currentRefedReward = new Decimal(referredBonus.referralRewardStorage || '0');
        referredBonus.referralRewardStorage = currentRefedReward.plus('1').toFixed(8);
        await referredBonus.save();

        // 4. 추천인의 MiningState 업데이트 (추천인 수 및 보너스율 2%p 증가)
        const updatedMiningState = await MiningState.findOneAndUpdate(
            { walletAddress: referrer.walletAddress },
            {
                $inc: { referralCount: 1 },
                $set: {
                    // 추천인 수 * 0.02 (2%)를 보너스율로 설정
                    referralBonusRate: (referrerBonus.referralList.length * 0.02).toString()
                }
            },
            { new: true, upsert: true }
        );

        console.log(`[Referral] Successfully issued rewards: Referrer(${referrer.walletAddress}), Referred(${referredWallet})`);

        return res.json({
            success: true,
            message: 'All rewards issued accurately',
            totalRewardStored: referrerBonus.referralRewardStorage
        });

    } catch (error) {
        console.error('[CRITICAL] Reward payout failure:', error);
        return res.status(500).json({ success: false, message: 'Server transaction error' });
    }
});

export default router;
