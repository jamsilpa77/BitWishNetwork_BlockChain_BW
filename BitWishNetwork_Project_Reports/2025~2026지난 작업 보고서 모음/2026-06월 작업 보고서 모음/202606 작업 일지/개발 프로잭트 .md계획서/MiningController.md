/**
 * BitWishNetwork Mining System
 * Mining Controller
 * 
 * ⚠️ 중요 준수 사항:
 * 1. 서버 시간 기준의 엄격한 채굴량 계산
 * 2. 50자리 정밀도 연산 (Decimal.js 사용)
 * 3. 리셋 방지 및 오프라인 채굴 보상 로직 구현
 */

import { Request, Response } from 'express';
import MiningState from '../models/MiningState';
import User from '../models/User';
import BonusRecord from '../models/BonusRecord';
import MonthlySettlement from '../models/MonthlySettlement';
import Decimal from 'decimal.js';

// 50자리 정밀도 설정
Decimal.set({ precision: 50 });

export class MiningController {

    /**
     * 마이닝 시작
     */
    public async startMining(req: Request, res: Response): Promise<void> {
        try {
            const { walletAddress } = req.body;

            let state = await MiningState.findOne({ walletAddress });

            if (!state) {
                // 최초 시작 시 상태 생성
                state = new MiningState({
                    walletAddress,
                    isMining: true,
                    miningStartTime: new Date(),
                    lastSyncTime: new Date()
                });
            } else {
                // 이미 존재하는 경우 상태 업데이트
                if (!state.isMining) {
                    state.isMining = true;
                    state.miningStartTime = new Date(); // 재시작 시간 기록
                    state.lastSyncTime = new Date();
                }
            }

            // [7단계 수술] 실시간 동기화 보정 엔진 (Sync Guard) 이식
            // 채굴을 시작하는 시점에 실제 자식 수를 다시 카운트하여 마이닝 상태를 강제 동기화함
            const user = await User.findOne({ walletAddress: new RegExp('^' + walletAddress + '$', 'i') });
            if (user) {
                // 1. 실제 자식 수 전수 조사 (신/구 버전 및 지갑주소 변종 동시 대응)
                const parentBase = (user.myReferralCode || '').substring(0, 11);
                const searchQuery = {
                    $or: [
                        { referrerCode: new RegExp('^\\s*' + (user.myReferralCode || '').trim() + '\\s*$', 'i') },
                        { referrerCode: new RegExp('^\\s*' + (user.walletAddress || '').trim() + '\\s*$', 'i') },
                        { referrerCode: new RegExp('^' + parentBase, 'i') }
                    ]
                };
                const actualReferralCount = await User.countDocuments(searchQuery);

                console.log(`[SyncGuard] Re-counting for ${walletAddress}: Actual=${actualReferralCount}, Stored=${state.referralCount}`);

                // 2. 수치 강제 보정 및 보너스율 재계산
                const initialBonus = new Decimal(0.02);
                const correctedReferralRate = initialBonus.plus(new Decimal(actualReferralCount).mul(0.02));

                state.referralCount = actualReferralCount;
                state.referralBonusRate = correctedReferralRate.toString();

                // 3. 최종 채굴률(currentTotalRate) 합산 업데이트
                const baseRate = new Decimal(state.currentBaseRate || '0.25');
                const attendanceRate = state.isAttendanceActive ? new Decimal(0.05) : new Decimal(0);
                const partnerRate = state.partnerStatus === 'REGISTERED' ? new Decimal(1.25) : new Decimal(0);

                state.currentTotalRate = baseRate
                    .mul(new Decimal(1).plus(attendanceRate))
                    .mul(new Decimal(1).plus(correctedReferralRate))
                    .mul(new Decimal(1).plus(partnerRate))
                    .toString();

                console.log(`[SyncGuard] ${walletAddress} rate corrected to: ${state.currentTotalRate}`);
            }

            await state.save();

            res.status(200).json({ success: true, data: state });
        } catch (error) {
            console.error('Start mining error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    /**
     * 마이닝 정지
     */
    public async stopMining(req: Request, res: Response): Promise<void> {
        try {
            const { walletAddress } = req.body;

            const state = await MiningState.findOne({ walletAddress });

            if (state && state.isMining) {
                // 정지 전까지의 채굴량 정산
                await this.calculatePendingReward(state);

                state.isMining = false;
                state.miningStartTime = null;
                state.lastSyncTime = new Date();
                await state.save();
            }

            res.status(200).json({ success: true, data: state });
        } catch (error) {
            console.error('Stop mining error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    /**
     * 마이닝 데이터 동기화 (30초 주기)
     * 핵심 로직: 클라이언트가 보낸 데이터가 아닌, 서버 시간 기준으로 계산하여 업데이트
     * 추천 보너스 2% 분리 계산 및 저장
     */
    public async syncMiningData(req: Request, res: Response): Promise<void> {
        try {
            const { walletAddress } = req.body;

            const state = await MiningState.findOne({ walletAddress });

            if (!state) {
                res.status(404).json({ success: false, message: 'Mining state not found' });
                return;
            }

            // [Step 2: Healer Engine] 실시간 동기화 중 데이터 정합성 상시 수복 (자식 0명 유저 포함)
            const user = await User.findOne({ walletAddress: new RegExp('^' + walletAddress + '$', 'i') });
            if (user) {
                const parentBase = (user.myReferralCode || '').substring(0, 11);
                const referrals = await User.find({
                    $or: [
                        { referrerCode: new RegExp('^\\s*' + (user.myReferralCode || '').trim() + '\\s*$', 'i') },
                        { referrerCode: new RegExp('^\\s*' + (user.walletAddress || '').trim() + '\\s*$', 'i') },
                        { referrerCode: new RegExp('^' + parentBase, 'i') }
                    ]
                });

                const actualCount = referrals.length;
                const initialBonus = new Decimal(0.02);
                const correctedRate = initialBonus.plus(new Decimal(actualCount).mul(0.02));

                let isChanged = false;
                if (state.referralCount !== actualCount) {
                    state.referralCount = actualCount;
                    isChanged = true;
                }
                if (!new Decimal(state.referralBonusRate || '0').equals(correctedRate)) {
                    state.referralBonusRate = correctedRate.toString();
                    isChanged = true;
                }

                if (isChanged) {
                    const baseRate = new Decimal(state.currentBaseRate || '0.25');
                    const attendanceRate = state.isAttendanceActive ? new Decimal(0.05) : new Decimal(0);
                    const partnerRate = state.partnerStatus === 'REGISTERED' ? new Decimal(1.25) : new Decimal(0);
                    
                    state.currentTotalRate = baseRate
                        .mul(new Decimal(1).plus(attendanceRate))
                        .mul(new Decimal(1).plus(correctedRate))
                        .mul(new Decimal(1).plus(partnerRate))
                        .toString();
                    
                    console.log(`[HEALER-SYNC] Corrected for ${walletAddress}: Count=${actualCount}`);
                }
            }

            if (state.isMining) {
                const now = new Date();
                const lastSync = new Date(state.lastSyncTime);
                const diffSeconds = (now.getTime() - lastSync.getTime()) / 1000;

                if (diffSeconds > 0) {
                    // 1. 전체 보상 계산 (기본 + 출석 + 추천 + 가맹점)
                    const currentReward = new Decimal(state.accumulatedReward);
                    const ratePerSecond = new Decimal(state.currentTotalRate).div(3600);
                    const totalAdditionalReward = ratePerSecond.mul(diffSeconds);

                    // 2. 추천 보너스가 있는 경우 2% 분리 계산 (대소문자 무시 검색 적용)
                    if (new Decimal(state.referralBonusRate).gt(0)) {
                        const bonusRecord = await BonusRecord.findOne({ walletAddress: new RegExp('^' + walletAddress + '$', 'i') });

                        if (bonusRecord) {
                            // 2-1. 추천 보너스 2% 계산
                            const baseRate = new Decimal(state.currentBaseRate);
                            const referralRate = new Decimal(state.referralBonusRate); // 예: 0.02, 0.04, 0.06...
                            const referralRatePerSecond = baseRate.mul(referralRate).div(3600);
                            const referralBonus = referralRatePerSecond.mul(diffSeconds);

                            // 2-2. referralBonusStorage 업데이트 (전체 추천 보너스 누적)
                            const currentStorage = new Decimal(bonusRecord.referralBonusStorage || '0');
                            bonusRecord.referralBonusStorage = currentStorage.plus(referralBonus).toString();

                            // 2-3. 각 가입자별 accumulatedBonus 업데이트
                            if (bonusRecord.referralList.length > 0) {
                                // 가입자 수로 나눠서 각각 저장
                                const bonusPerReferral = referralBonus.div(bonusRecord.referralList.length);

                                for (let i = 0; i < bonusRecord.referralList.length; i++) {
                                    const currentAccumulated = new Decimal(bonusRecord.referralList[i].accumulatedBonus || '0');
                                    bonusRecord.referralList[i].accumulatedBonus = currentAccumulated.plus(bonusPerReferral).toString();
                                }
                            }

                            await bonusRecord.save();
                        }
                    }

                    // 3. 전체 누적 보상 업데이트 (추천 보너스 포함)
                    state.accumulatedReward = currentReward.plus(totalAdditionalReward).toString();
                    state.lastSyncTime = now;
                    await state.save();
                }
            }

            // [Step 4 Fix] 최신 보너스 잔액도 함께 반환하여 프론트엔드 동기화 보장 (대소문자 무시 검색 적용)
            const bonusRecord = await BonusRecord.findOne({ walletAddress: new RegExp('^' + walletAddress + '$', 'i') });

            res.status(200).json({
                success: true,
                data: {
                    ...state.toObject(),
                    referralBonusStorage: bonusRecord?.referralBonusStorage || '0.00000000',
                    referralRewardStorage: bonusRecord?.referralRewardStorage || '0.00000000'
                }
            });
        } catch (error) {
            console.error('Sync mining error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    /**
     * 사용자 상태 조회 (초기 접속 시 복구용)
     */
    public async getUserStatus(req: Request, res: Response): Promise<void> {
        try {
            const { walletAddress } = req.params;

            const user = await User.findOne({ walletAddress: new RegExp('^' + walletAddress + '$', 'i') });
            const miningState = await MiningState.findOne({ walletAddress: new RegExp('^' + walletAddress + '$', 'i') });
            // [Step 2-1 Fix] BonusRecord 조회 추가 (대소문자 무시 검색 적용)
            const bonusRecord = await BonusRecord.findOne({ walletAddress: new RegExp('^' + walletAddress + '$', 'i') });

            // [Step 2: Healer Engine] 데이터 정합성 수복 로직 (자식 0명 유저 포함 전수 조사)
            if (miningState) {
                // 1. 실제 추천인 데이터 전수 조사 (Robust Search Query)
                const parentBase = (user?.myReferralCode || '').substring(0, 11);
                const referrals = await User.find({
                    $or: [
                        { referrerCode: new RegExp('^\\s*' + (user?.myReferralCode || '').trim() + '\\s*$', 'i') },
                        { referrerCode: new RegExp('^\\s*' + (user?.walletAddress || '').trim() + '\\s*$', 'i') },
                        { referrerCode: new RegExp('^' + parentBase, 'i') }
                    ]
                });

                const actualCount = referrals.length;

                // 2. MiningState 카운트 및 보너스율 강제 보정
                const initialBonus = new Decimal(0.02);
                const correctedRate = initialBonus.plus(new Decimal(actualCount).mul(0.02));
                
                let isChanged = false;
                if (miningState.referralCount !== actualCount) {
                    miningState.referralCount = actualCount;
                    isChanged = true;
                }
                
                // 보너스율 정밀 비교 (Decimal.js 사용)
                if (!new Decimal(miningState.referralBonusRate || '0').equals(correctedRate)) {
                    miningState.referralBonusRate = correctedRate.toString();
                    isChanged = true;
                }

                if (isChanged) {
                    const baseRate = new Decimal(miningState.currentBaseRate || '0.25');
                    const attendanceRate = miningState.isAttendanceActive ? new Decimal(0.05) : new Decimal(0);
                    const partnerRate = miningState.partnerStatus === 'REGISTERED' ? new Decimal(1.25) : new Decimal(0);
                    
                    miningState.currentTotalRate = baseRate
                        .mul(new Decimal(1).plus(attendanceRate))
                        .mul(new Decimal(1).plus(correctedRate))
                        .mul(new Decimal(1).plus(partnerRate))
                        .toString();
                    
                    await miningState.save();
                    console.log(`[HEALER] MiningState corrected for ${walletAddress}: Count=${actualCount}, Rate=${miningState.currentTotalRate}`);
                }

                // 3. BonusRecord 수복 (리스트가 비어있거나 레코드가 없는 경우)
                if (!bonusRecord || (actualCount > 0 && bonusRecord.referralList.length === 0)) {
                    let record = bonusRecord;
                    if (!record) {
                        record = new BonusRecord({
                            walletAddress: walletAddress.toUpperCase(),
                            referralBonusStorage: '0',
                            referralRewardStorage: '0',
                            referralList: []
                        });
                    }

                    if (actualCount > 0) {
                        record.referralList = referrals.map((ref: any) => ({
                            childWalletAddress: ref.walletAddress,
                            joinedAt: ref.createdAt || new Date(),
                            accumulatedBonus: '0',
                            isKycVerified: ref.isKycVerified || false,
                            rewardStatus: 'PENDING'
                        }));
                    }
                    
                    await record.save();
                    // 하단 응답에서 최신 데이터를 사용하도록 변수 업데이트
                    (bonusRecord as any) = record;
                    console.log(`[HEALER] BonusRecord restored for ${walletAddress}: Referrals=${actualCount}`);
                }
            }

            if (miningState) {
                // [Auto-Expire Check] 출석 보너스 유효기간 검사 (매일 오전 9시 기준)
                const now = new Date();
                const cutoffTime = new Date();
                cutoffTime.setHours(9, 0, 0, 0);

                // 현재 시간이 9시 이전이면, 기준은 어제 9시
                if (now.getHours() < 9) {
                    cutoffTime.setDate(cutoffTime.getDate() - 1);
                }

                // 마지막 출석 시간이 기준 시간보다 이전이면 만료 처리
                if (miningState.isAttendanceActive && miningState.attendanceDate) {
                    const lastAttendance = new Date(miningState.attendanceDate);
                    if (lastAttendance < cutoffTime) {
                        console.log('[AUTO-EXPIRE] Attendance bonus expired for:', walletAddress);
                        miningState.isAttendanceActive = false;

                        // [FIX] 추천 보너스 유지하면서 재계산
                        const baseRate = new Decimal(miningState.currentBaseRate);
                        const referralRate = new Decimal(miningState.referralBonusRate || 0);
                        miningState.currentTotalRate = baseRate.mul(new Decimal(1).plus(referralRate)).toString();

                        await miningState.save();
                    }
                }
            }

            if (miningState && miningState.isMining) {
                // 접속하지 않았던 시간(오프라인) 동안의 보상 계산 및 반영
                await this.calculatePendingReward(miningState);
                miningState.lastSyncTime = new Date();
                await miningState.save();
            }

            // [3단계 핵심] 실시간 상태 전환 (LOCKED -> UNLOCKED)
            const now = new Date();
            const timelockDuration = 15 * 24 * 60 * 60 * 1000;
            await MonthlySettlement.updateMany(
                {
                    walletAddress,
                    migrationStatus: 'LOCKED',
                    settledAt: { $lte: new Date(now.getTime() - timelockDuration) }
                },
                { $set: { migrationStatus: 'UNLOCKED' } }
            );

            // [2단계 핵심] 영구 장부(MonthlySettlement)에서 최신 정산 이력 조회 (대소문자 무시 검색 적용)
            const miningHistory = await MonthlySettlement.find({ walletAddress: new RegExp('^' + walletAddress + '$', 'i') }).sort({ year: -1, month: -1 });

            // [수복 로직] 과거 모든 정산 내역 전수 합산 (Decimal.js 50자리 정밀도)
            const totalSettledAmount = miningHistory.reduce((sum: any, item: any) => {
                return sum.plus(new Decimal(item.totalAmount || '0'));
            }, new Decimal(0));

            // [수복 2차] 랭킹 시스템과 100% 동일한 실시간 보정(LiveBoost) 엔진 가동
            let liveBoostAmount = new Decimal(0);

            if (miningState?.isMining) {
                const lastSync = miningState.lastSyncTime || (miningState as any).updatedAt || now;
                const diffSeconds = (now.getTime() - new Date(lastSync).getTime()) / 1000;
                const ratePerHour = new Decimal(miningState.currentTotalRate || '0.25');
                // 초단위 실시간 증분 계산 (50자리 정밀도)
                liveBoostAmount = new Decimal(diffSeconds).mul(ratePerHour).div(3600);
            }

            // [수복 로직] 현재 채굴량 + 과거 정산 합계 + 실시간 보정치 = 진짜 전체 누적 보상 (랭킹 100% 동기화)
            const trueLifeTimeMined = new Decimal(miningState?.accumulatedReward || '0')
                .plus(totalSettledAmount)
                .plus(liveBoostAmount)
                .toString();

            res.status(200).json({
                success: true,
                user: user ? {
                    ...user.toObject(),
                    referralBonusStorage: bonusRecord?.referralBonusStorage || '0',
                    referralRewardStorage: bonusRecord?.referralRewardStorage || '0',
                    referralList: bonusRecord?.referralList || []
                } : null,
                miningState: {
                    ...miningState?.toObject(),
                    miningHistory, // 지갑 UI '이중 원장' 표출용 데이터
                    trueLifeTimeMined, // 랭킹과 100% 동기화된 실시간 전체 누적 보상
                    totalSettledAmount: totalSettledAmount.toString() // [수복 2차] 순수 과거 정산금 합계 (기준점)
                }
            });
        } catch (error) {
            console.error('Get user status error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    /**
     * 보상 계산 내부 로직 (Private)
     * 시간 차이(초) * 초당 채굴률
     */
    private async calculatePendingReward(state: any): Promise<void> {
        const now = new Date();
        const lastSync = new Date(state.lastSyncTime);

        // 밀리초 단위 차이 -> 초 단위 변환
        const diffSeconds = (now.getTime() - lastSync.getTime()) / 1000;

        if (diffSeconds > 0) {
            const currentReward = new Decimal(state.accumulatedReward);
            const ratePerSecond = new Decimal(state.currentTotalRate).div(3600); // 시간당 -> 초당

            const additionalReward = ratePerSecond.mul(diffSeconds);

            // 누적 보상 업데이트
            state.accumulatedReward = currentReward.plus(additionalReward).toString();
        }
    }

    /**
     * 마이닝 데이터 초기화 (관리자 전용 - 테스트 목적)
     */
    public async resetMiningData(walletAddress: string): Promise<boolean> {
        try {
            const result = await MiningState.findOneAndUpdate(
                { walletAddress },
                {
                    isMining: false,
                    miningStartTime: null,
                    lastSyncTime: new Date(),
                    accumulatedReward: '0.0',
                    currentBaseRate: '0.25',
                    currentTotalRate: '0.25'
                }
            );

            return !!result;
        } catch (error) {
            console.error('Reset mining data error:', error);
            return false;
        }
    }
}

export const miningController = new MiningController();
