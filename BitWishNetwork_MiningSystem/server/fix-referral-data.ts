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

// 50자리 정밀도 문자열 변환 유틸리티
const to50Decimal = (value: string | number | Decimal): string => {
    return new Decimal(value).toFixed(50);
};

async function fixReferralData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB 연결 성공');

        // 추천 코드로 가입한 모든 사용자 찾기
        const usersWithReferrer = await User.find({ referrerCode: { $exists: true, $ne: null } });
        console.log(`📊 추천 코드로 가입한 사용자: ${usersWithReferrer.length}명`);

        for (const user of usersWithReferrer) {
            console.log(`\n처리 중: ${user.walletAddress}`);

            // 추천인 찾기
            const referrer = await User.findOne({ myReferralCode: user.referrerCode });
            if (!referrer) {
                console.log(`⚠️ 추천인을 찾을 수 없음`);
                continue;
            }

            // 1. 추천인의 BonusRecord 확인 및 수정
            let referrerBonusRecord = await BonusRecord.findOne({ walletAddress: referrer.walletAddress });
            if (!referrerBonusRecord) {
                referrerBonusRecord = new BonusRecord({
                    walletAddress: referrer.walletAddress,
                    referralBonusStorage: to50Decimal(0),
                    referralRewardStorage: to50Decimal(0),
                    referralList: [],
                    attendanceHistory: []
                });
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
                    accumulatedBonus: to50Decimal(0),
                    isKycVerified: false,
                    rewardStatus: 'PENDING'
                });

                // 1BW 지급 (50자리 정밀도)
                const currentReward = new Decimal(referrerBonusRecord.referralRewardStorage || '0');
                referrerBonusRecord.referralRewardStorage = to50Decimal(currentReward.plus(1));
                console.log(`✅ 추천인에게 1BW 지급됨`);
            }

            // 기존 referralList의 Enum 값들 일괄 정규화 (오류 방지)
            referrerBonusRecord.referralList.forEach(item => {
                if (!['PENDING', 'PAID'].includes(item.rewardStatus)) {
                    item.rewardStatus = 'PENDING';
                }
            });

            await referrerBonusRecord.save();

            // 2. 추천인의 MiningState 확인 및 수정
            const referrerMiningState = await MiningState.findOne({ walletAddress: referrer.walletAddress });
            if (referrerMiningState) {
                // partnerStatus Enum 정규화
                if (!['NOT_REGISTERED', 'PENDING', 'REGISTERED'].includes(referrerMiningState.partnerStatus)) {
                    referrerMiningState.partnerStatus = 'NOT_REGISTERED';
                }

                const correctCount = referrerBonusRecord.referralList.length;
                referrerMiningState.referralCount = correctCount;

                // 보너스율 계산 (명당 2%)
                const newReferralRate = new Decimal(correctCount).mul(0.02);
                referrerMiningState.referralBonusRate = to50Decimal(newReferralRate);

                // 최종 채굴률 재계산
                const baseRate = new Decimal(referrerMiningState.currentBaseRate || '0.25');
                const attendanceRate = referrerMiningState.isAttendanceActive ? new Decimal(0.05) : new Decimal(0);
                const partnerRate = referrerMiningState.partnerStatus === 'REGISTERED' ? new Decimal(1.25) : new Decimal(0);

                referrerMiningState.currentTotalRate = to50Decimal(baseRate
                    .mul(new Decimal(1).plus(attendanceRate).plus(newReferralRate).plus(partnerRate)));

                await referrerMiningState.save();
            }

            // 3. 가입자의 BonusRecord (웰컴 1BW)
            let userBonusRecord = await BonusRecord.findOne({ walletAddress: user.walletAddress });
            if (!userBonusRecord) {
                userBonusRecord = new BonusRecord({
                    walletAddress: user.walletAddress,
                    referralBonusStorage: to50Decimal(0),
                    referralRewardStorage: to50Decimal(1),
                    referralList: [],
                    attendanceHistory: []
                });
                await userBonusRecord.save();
            } else {
                const currentRes = new Decimal(userBonusRecord.referralRewardStorage || '0');
                if (currentRes.isZero()) {
                    userBonusRecord.referralRewardStorage = to50Decimal(1);
                    await userBonusRecord.save();
                }
            }
        }

        console.log('\n✅ 22.00 BW 전수 복구 및 정합성 동기화 완료');
        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('❌ 오류 발생:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

fixReferralData();
