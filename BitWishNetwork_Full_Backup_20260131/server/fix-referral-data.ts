/**
 * 기존 가입자 데이터 수정 스크립트
 * 추천 보너스 시스템 업데이트
 */

import mongoose from 'mongoose';
import User from './models/User';
import MiningState from './models/MiningState';
import BonusRecord from './models/BonusRecord';
import Decimal from 'decimal.js';

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';

async function fixReferralData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB 연결 성공');

        // 추천 코드로 가입한 모든 사용자 찾기
        const usersWithReferrer = await User.find({ referrerCode: { $exists: true, $ne: null } });
        console.log(`📊 추천 코드로 가입한 사용자: ${usersWithReferrer.length}명`);

        for (const user of usersWithReferrer) {
            console.log(`\n처리 중: ${user.walletAddress}`);
            console.log(`추천 코드: ${user.referrerCode}`);

            // 추천인 찾기
            const referrer = await User.findOne({ myReferralCode: user.referrerCode });
            if (!referrer) {
                console.log(`⚠️ 추천인을 찾을 수 없음`);
                continue;
            }
            console.log(`추천인: ${referrer.walletAddress}`);

            // 1. 추천인의 BonusRecord 확인 및 수정
            let referrerBonusRecord = await BonusRecord.findOne({ walletAddress: referrer.walletAddress });
            if (!referrerBonusRecord) {
                console.log(`⚠️ 추천인의 BonusRecord 없음 - 생성`);
                referrerBonusRecord = new BonusRecord({
                    walletAddress: referrer.walletAddress,
                    referralBonusStorage: '0.00000000000000000000000000000000000000000000000000',
                    referralRewardStorage: '0.00000000000000000000000000000000000000000000000000',
                    referralList: [],
                    attendanceHistory: []
                });
            }

            // referralRewardStorage 필드 확인 및 추가
            if (!referrerBonusRecord.referralRewardStorage) {
                referrerBonusRecord.referralRewardStorage = '0.00000000000000000000000000000000000000000000000000';
            }

            // referralList에 이미 있는지 확인
            const alreadyExists = referrerBonusRecord.referralList.some(
                item => item.childWalletAddress === user.walletAddress
            );

            if (!alreadyExists) {
                // referralList에 추가
                referrerBonusRecord.referralList.push({
                    childWalletAddress: user.walletAddress,
                    joinedAt: user.createdAt || new Date(),
                    accumulatedBonus: '0.00000000000000000000000000000000000000000000000000',
                    isKycVerified: false,
                    rewardStatus: 'PENDING'
                });
                console.log(`✅ referralList에 추가됨`);

                // 1BW 지급
                const currentReward = new Decimal(referrerBonusRecord.referralRewardStorage);
                referrerBonusRecord.referralRewardStorage = currentReward.plus(1).toString();
                console.log(`✅ 추천인에게 1BW 지급: ${referrerBonusRecord.referralRewardStorage}`);
            } else {
                console.log(`ℹ️ 이미 referralList에 존재함`);
            }

            await referrerBonusRecord.save();

            // 2. 추천인의 MiningState 확인 및 수정
            const referrerMiningState = await MiningState.findOne({ walletAddress: referrer.walletAddress });
            if (referrerMiningState) {
                const correctCount = referrerBonusRecord.referralList.length;

                if (referrerMiningState.referralCount !== correctCount) {
                    referrerMiningState.referralCount = correctCount;
                    console.log(`✅ referralCount 수정: ${correctCount}`);

                    // referralBonusRate 계산
                    const newReferralRate = new Decimal(correctCount).mul(0.02);
                    referrerMiningState.referralBonusRate = newReferralRate.toString();
                    console.log(`✅ referralBonusRate: ${newReferralRate.toString()}`);

                    // currentTotalRate 재계산
                    const baseRate = new Decimal(referrerMiningState.currentBaseRate || '0.25');
                    const attendanceRate = referrerMiningState.isAttendanceActive ? new Decimal(0.05) : new Decimal(0);
                    const partnerRate = referrerMiningState.partnerStatus === 'REGISTERED' ? new Decimal(1.25) : new Decimal(0);

                    referrerMiningState.currentTotalRate = baseRate
                        .mul(new Decimal(1).plus(attendanceRate).plus(newReferralRate).plus(partnerRate))
                        .toString();
                    console.log(`✅ currentTotalRate: ${referrerMiningState.currentTotalRate}`);

                    await referrerMiningState.save();
                }
            }

            // 3. 가입자의 BonusRecord 확인 및 수정
            let userBonusRecord = await BonusRecord.findOne({ walletAddress: user.walletAddress });
            if (!userBonusRecord) {
                console.log(`⚠️ 가입자의 BonusRecord 없음 - 생성`);
                userBonusRecord = new BonusRecord({
                    walletAddress: user.walletAddress,
                    referralBonusStorage: '0.00000000000000000000000000000000000000000000000000',
                    referralRewardStorage: '1.00000000000000000000000000000000000000000000000000',
                    referralList: [],
                    attendanceHistory: []
                });
                await userBonusRecord.save();
                console.log(`✅ 가입자에게 1BW 지급`);
            } else {
                if (!userBonusRecord.referralRewardStorage) {
                    userBonusRecord.referralRewardStorage = '0.00000000000000000000000000000000000000000000000000';
                }

                const currentReward = new Decimal(userBonusRecord.referralRewardStorage);
                if (currentReward.isZero()) {
                    userBonusRecord.referralRewardStorage = '1.00000000000000000000000000000000000000000000000000';
                    await userBonusRecord.save();
                    console.log(`✅ 가입자에게 1BW 지급`);
                } else {
                    console.log(`ℹ️ 가입자는 이미 보상 받음: ${currentReward.toString()}`);
                }
            }
        }

        console.log('\n✅ 모든 데이터 수정 완료');
        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('❌ 오류 발생:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

fixReferralData();
