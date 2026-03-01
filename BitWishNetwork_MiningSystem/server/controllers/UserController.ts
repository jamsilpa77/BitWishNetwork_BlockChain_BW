/**
 * BitWishNetwork Mining System
 * User Controller
 * 
 * ⚠️ 중요 준수 사항:
 * 1. 지갑 생성 시 서버에 영구 저장 (데이터 손실 방지)
 * 2. 2차 비밀번호 해시 검증
 * 3. 추천인 코드 유효성 검사 및 보너스 관계 설정
 */

import { Request, Response } from 'express';
import User from '../models/User';
import MiningState from '../models/MiningState';
import BonusRecord from '../models/BonusRecord';
import Decimal from 'decimal.js';

export class UserController {

    /**
     * 사용자 등록 (지갑 생성 시 호출)
     */
    public async register(req: Request, res: Response): Promise<void> {
        try {
            const {
                walletAddress,
                publicKey,
                encryptedMnemonic,
                secondPasswordHash,
                myReferralCode,
                referrerCode,
                ipAddress
            } = req.body;

            console.log(`[REGISTER] New user registration: ${walletAddress}`);

            // 1. 중복 검사
            const existingUser = await User.findOne({ walletAddress });
            if (existingUser) {
                res.status(400).json({ success: false, message: 'Wallet address already exists' });
                return;
            }

            // 2. 사용자 생성
            const newUser = new User({
                walletAddress,
                publicKey,
                encryptedMnemonic,
                secondPasswordHash,
                myReferralCode,
                referrerCode,
                ipAddress
            });

            await newUser.save();
            console.log(`[REGISTER] User saved`);

            // 3. 마이닝 상태 초기화
            const miningState = new MiningState({
                walletAddress,
                isMining: false,
                accumulatedReward: '0.00000000000000000000000000000000000000000000000000',
                referralCount: 0
            });
            await miningState.save();
            console.log(`[REGISTER] MiningState created`);

            // 4. 보너스 레코드 초기화 (Step 1 수정: 기본값 0.0으로 정정)
            const bonusRecord = new BonusRecord({
                walletAddress,
                referralBonusStorage: '0.00000000000000000000000000000000000000000000000000',
                referralRewardStorage: '0.00000000000000000000000000000000000000000000000000', // ⚠️ 1.0에서 0.0으로 정정 완료
                referralList: [],
                attendanceHistory: []
            });
            await bonusRecord.save();
            console.log(`[REGISTER] BonusRecord created`);

            // 5. 추천인 관계 처리 (Step 2: 검증 강화 - 빈 문자열 및 공백 체크 강화)
            if (referrerCode && typeof referrerCode === 'string' && referrerCode.trim().length > 0) {
                const cleanCode = referrerCode.trim();
                console.log(`[REGISTER] Processing referral code: ${cleanCode}`);
                await this.processReferral(cleanCode, walletAddress);
            }

            res.status(201).json({ success: true, data: newUser });
        } catch (error: any) {
            console.error('[REGISTER] Error:', error);
            console.error('[REGISTER] Error message:', error.message);
            console.error('[REGISTER] Error stack:', error.stack);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message // 개발 중에만 사용
            });
        }
    }

    /**
     * 사용자 로그인 (지갑 주소로 상태 조회)
     */
    public async login(req: Request, res: Response): Promise<void> {
        try {
            const { walletAddress, secondPasswordHash } = req.body;

            const user = await User.findOne({ walletAddress });
            if (!user) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }

            // 2차 비밀번호 검증 (클라이언트에서 해시해서 보냄)
            if (user.secondPasswordHash !== secondPasswordHash) {
                res.status(401).json({ success: false, message: 'Invalid second password' });
                return;
            }

            // 로그인 시간 업데이트
            user.lastLoginAt = new Date();
            await user.save();

            res.status(200).json({ success: true, data: user });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    /**
     * 추천인 코드 검증
     */
    public async checkReferralCode(req: Request, res: Response): Promise<void> {
        try {
            const { code } = req.params;
            const user = await User.findOne({ myReferralCode: code });

            if (user) {
                res.status(200).json({ success: true, isValid: true, owner: user.walletAddress });
            } else {
                res.status(200).json({ success: true, isValid: false });
            }
        } catch (error) {
            console.error('Check referral code error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    /**
     * 내부 로직: 추천인 처리
     */
    private async processReferral(referrerCode: string, newWalletAddress: string): Promise<void> {
        try {
            console.log(`[REFERRAL] Start - Code: ${referrerCode}, New user: ${newWalletAddress}`);

            const referrer = await User.findOne({ myReferralCode: referrerCode });

            // [Step 2 강화] 추천인이 유효하지 않거나, 본인 지갑을 본인이 추천하는 경우 차단
            if (!referrer) {
                console.log(`[REFERRAL] Referrer not found: ${referrerCode}`);
                return;
            }
            if (referrer.walletAddress === newWalletAddress) {
                console.log(`[REFERRAL] Self-referral blocked: ${newWalletAddress}`);
                return;
            }

            console.log(`[REFERRAL] Referrer validated: ${referrer.walletAddress}`);

            // 추천인의 보너스 레코드 업데이트
            const referrerBonusRecord = await BonusRecord.findOne({ walletAddress: referrer.walletAddress });
            if (referrerBonusRecord) {
                referrerBonusRecord.referralList.push({
                    childWalletAddress: newWalletAddress,
                    joinedAt: new Date(),
                    accumulatedBonus: '0.00000000000000000000000000000000000000000000000000',
                    isKycVerified: false,
                    rewardStatus: 'PENDING'
                });

                // 추천인에게 1BW 즉시 지급
                const currentReward = new Decimal(referrerBonusRecord.referralRewardStorage || '0');
                referrerBonusRecord.referralRewardStorage = currentReward.plus(1).toString();

                await referrerBonusRecord.save();
                console.log(`[REFERRAL] Referrer bonus updated - Reward: ${referrerBonusRecord.referralRewardStorage}`);
            }

            // 추천인의 마이닝 상태 업데이트
            const referrerMiningState = await MiningState.findOne({ walletAddress: referrer.walletAddress });
            if (referrerMiningState) {
                referrerMiningState.referralCount += 1;

                // 추천 보너스율 계산 (1명당 2%)
                const newReferralRate = new Decimal(referrerMiningState.referralCount).mul(0.02);
                referrerMiningState.referralBonusRate = newReferralRate.toString();

                // currentTotalRate 재계산 (보너스 곱셈 적용)
                const baseRate = new Decimal(referrerMiningState.currentBaseRate || '0.25');
                const attendanceRate = referrerMiningState.isAttendanceActive ? new Decimal(0.05) : new Decimal(0);
                const partnerRate = referrerMiningState.partnerStatus === 'REGISTERED' ? new Decimal(1.25) : new Decimal(0);

                // 각 보너스를 곱셈으로 적용: baseRate * (1 + attendance) * (1 + referral) * (1 + partner)
                referrerMiningState.currentTotalRate = baseRate
                    .mul(new Decimal(1).plus(attendanceRate))
                    .mul(new Decimal(1).plus(newReferralRate))
                    .mul(new Decimal(1).plus(partnerRate))
                    .toString();

                await referrerMiningState.save();
                console.log(`[REFERRAL] Referrer mining updated - Count: ${referrerMiningState.referralCount}, Rate: ${referrerMiningState.currentTotalRate}`);
            }

            // 가입자에게도 1BW 즉시 지급
            const newUserBonusRecord = await BonusRecord.findOne({ walletAddress: newWalletAddress });
            if (newUserBonusRecord) {
                const currentReward = new Decimal(newUserBonusRecord.referralRewardStorage || '0');
                newUserBonusRecord.referralRewardStorage = currentReward.plus(1).toString();
                await newUserBonusRecord.save();
                console.log(`[REFERRAL] New user reward: ${newUserBonusRecord.referralRewardStorage}`);
            }

            console.log(`[REFERRAL] Process completed successfully`);
        } catch (error) {
            console.error('[REFERRAL] Error:', error);
        }
    }
}

export const userController = new UserController();
