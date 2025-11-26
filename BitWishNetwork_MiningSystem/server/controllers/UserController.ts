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

            // 3. 마이닝 상태 초기화
            const miningState = new MiningState({
                walletAddress,
                isMining: false,
                accumulatedReward: '0.00000000000000000000000000000000000000000000000000',
                referralCount: 0
            });
            await miningState.save();

            // 4. 보너스 레코드 초기화
            const bonusRecord = new BonusRecord({
                walletAddress,
                referralBonusStorage: '0.00000000000000000000000000000000000000000000000000'
            });
            await bonusRecord.save();

            // 5. 추천인 관계 처리 (추천인이 존재할 경우)
            if (referrerCode) {
                await this.processReferral(referrerCode, walletAddress);
            }

            res.status(201).json({ success: true, data: newUser });
        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
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
            const referrer = await User.findOne({ myReferralCode: referrerCode });
            if (!referrer) return;

            // 추천인의 보너스 레코드 업데이트
            const bonusRecord = await BonusRecord.findOne({ walletAddress: referrer.walletAddress });
            if (bonusRecord) {
                bonusRecord.referralList.push({
                    childWalletAddress: newWalletAddress,
                    joinedAt: new Date(),
                    accumulatedBonus: '0.00000000000000000000000000000000000000000000000000',
                    isKycVerified: false,
                    rewardStatus: 'PENDING'
                });
                await bonusRecord.save();
            }

            // 추천인의 마이닝 상태 업데이트 (추천인 수 증가)
            const miningState = await MiningState.findOne({ walletAddress: referrer.walletAddress });
            if (miningState) {
                miningState.referralCount += 1;
                // 추천 보너스율 업데이트 로직은 별도 서비스에서 처리하거나 여기서 계산
                // 예: 1명당 0.02 증가
                // miningState.referralBonusRate = ... 
                await miningState.save();
            }
        } catch (error) {
            console.error('Process referral error:', error);
        }
    }
}

export const userController = new UserController();
