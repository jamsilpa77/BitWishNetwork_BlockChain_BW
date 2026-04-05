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
                referralRewardStorage: '1.00000000000000000000000000000000000000000000000000', // 가입 즉시 1BW 지급 원복
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

            // [Phase 2 최종완성] 1. 추천인 보너스 장부 '원자적 결합(upsert: true)' 으로 전면 교체
            // 비동기 지연으로 장부가 없어도 즉시 무조건 생성하여 추천인 명단을 절대 유실하지 않게 강제 보장함
            const referrerBonusRecord = await BonusRecord.findOneAndUpdate(
                { walletAddress: referrer.walletAddress },
                {
                    $push: {
                        referralList: {
                            childWalletAddress: newWalletAddress,
                            joinedAt: new Date(),
                            accumulatedBonus: '0.00000000000000000000000000000000000000000000000000',
                            isKycVerified: false,
                            rewardStatus: 'PENDING'
                        }
                    },
                    $setOnInsert: {
                        referralBonusStorage: '0.00000000000000000000000000000000000000000000000000'
                    }
                },
                { new: true, upsert: true }
            );

            // 추천인에게 코드 제공 대가 1BW 지정 지급
            const refCurrentReward = new Decimal(referrerBonusRecord.referralRewardStorage || '0');
            referrerBonusRecord.referralRewardStorage = refCurrentReward.plus(1).toString();
            await referrerBonusRecord.save();
            console.log(`[REFERRAL] Referrer bonus perfectly updated - Reward: ${referrerBonusRecord.referralRewardStorage}`);

            // [Phase 2 최종완성] 2. 단순 +1 명수놀이 파기, '진짜 식별된 명단 숫자'로 마이닝 속도 연동 결합
            const realReferralCount = referrerBonusRecord.referralList.length;

            const updatedMiningState = await MiningState.findOneAndUpdate(
                { walletAddress: referrer.walletAddress },
                { $set: { referralCount: realReferralCount } },
                { new: true, upsert: true }
            );

            if (updatedMiningState) {
                // 실존하는 명단 수(realReferralCount) 기반으로 2% 배율 철저 계산
                const initialBonus = new Decimal(0.02);
                const newReferralRate = initialBonus.plus(new Decimal(realReferralCount).mul(0.02));

                updatedMiningState.referralBonusRate = newReferralRate.toString();

                const baseRate = new Decimal(updatedMiningState.currentBaseRate || '0.25');
                const attendanceRate = updatedMiningState.isAttendanceActive ? new Decimal(0.05) : new Decimal(0);
                const partnerRate = updatedMiningState.partnerStatus === 'REGISTERED' ? new Decimal(1.25) : new Decimal(0);

                updatedMiningState.currentTotalRate = baseRate
                    .mul(new Decimal(1).plus(attendanceRate))
                    .mul(new Decimal(1).plus(newReferralRate))
                    .mul(new Decimal(1).plus(partnerRate))
                    .toString();

                await updatedMiningState.save();
                console.log(`[REFERRAL] Referrer mining correctly tied to RealCount: ${realReferralCount}, Rate: ${updatedMiningState.currentTotalRate}`);
            }

            // [Phase 2 최종완성] 3. 신규 가입자 2BW 중복 지급 결함 트리거 영구 삭제 (Dead Code 파기)
            // 신규 가입자(newUser)는 이미 위의 'register' 함수 실행 순간 무조건 1.0 BW를 받고 내려오기 때문에, 여기서 한 번 더 주면 생태계가 붕괴됨.
            // 기존에 불필요하게 newUserBonusRecord를 찾아서 currentReward.plus(1)을 중복 집행하던 논리적 오류 블록 전체를 완전 삭제함.

            // [3월 3일 Step 2 복구] 가입자 본인의 마이닝 2% 보항 보너스 엔진 장착
            let newUserMiningState = await MiningState.findOne({ walletAddress: newWalletAddress });
            if (!newUserMiningState) {
                newUserMiningState = new MiningState({
                    walletAddress: newWalletAddress,
                    isMining: false,
                    currentBaseRate: '0.25',
                    referralCount: 0,
                    referralBonusRate: '0.02',
                    isAttendanceActive: false,
                    attendanceBonusRate: '0',
                    partnerStatus: 'NOT_REGISTERED',
                    currentTotalRate: '0.255',
                    accumulatedReward: '0',
                });
            } else {
                if (new Decimal(newUserMiningState.referralBonusRate || '0').isZero()) {
                    newUserMiningState.referralBonusRate = '0.02';
                }
                const baseRate = new Decimal(newUserMiningState.currentBaseRate || '0.25');
                const attendanceRate = newUserMiningState.isAttendanceActive ? new Decimal(0.05) : new Decimal(0);
                const partnerRate = newUserMiningState.partnerStatus === 'REGISTERED' ? new Decimal(1.25) : new Decimal(0);
                const refRate = new Decimal(newUserMiningState.referralBonusRate || '0');

                newUserMiningState.currentTotalRate = baseRate
                    .mul(new Decimal(1).plus(attendanceRate))
                    .mul(new Decimal(1).plus(refRate))
                    .mul(new Decimal(1).plus(partnerRate))
                    .toString();
            }
            await newUserMiningState.save();
            console.log(`[REFERRAL] New user 2% policy engine restored: ${newWalletAddress}`);

            console.log(`[REFERRAL] Process completed successfully`);
        } catch (error) {
            console.error('[REFERRAL] Error:', error);
        }
    }
}

export const userController = new UserController();
