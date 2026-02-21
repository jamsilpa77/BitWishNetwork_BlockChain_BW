const mongoose = require('mongoose');
const Decimal = require('decimal.js');
require('dotenv').config({ path: './.env' });

// 정밀도 설정
Decimal.set({ precision: 50 });

// 스키마 정의 (복구에 필요한 최소한의 정의)
const UserSchema = new mongoose.Schema({
    walletAddress: String,
    myReferralCode: String,
    referrerCode: String
});

const BonusRecordSchema = new mongoose.Schema({
    walletAddress: String,
    referralRewardStorage: String, // 1BW 단위 보상
    referralBonusStorage: String   // 2% 채굴 보너스 (이번엔 건드리지 않음)
});

const User = mongoose.model('User', UserSchema);
const BonusRecord = mongoose.model('BonusRecord', BonusRecordSchema);

const ONE_BW = new Decimal('1.00000000000000000000000000000000000000000000000000');
const ZERO_BW = new Decimal('0.00000000000000000000000000000000000000000000000000');

async function repairRewards() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/bitwish_mining');
        console.log('✅ Connected.');

        // 1. 모든 유저 가져오기
        const users = await User.find({});
        console.log(`📊 Total Users found: ${users.length}`);

        let totalFixedIssued = new Decimal(0);

        // 2. 각 유저별 정당한 보상 계산 및 업데이트
        for (const user of users) {
            console.log(`\n🔍 Checking User: ${user.walletAddress}`);

            // [A] 가입 축하금 (Welcome Bonus) - 정책: 누구나 1BW
            let rewardTotal = ONE_BW;
            let logMsg = `   + Welcome Bonus: 1 BW`;

            // [B] 내가 초대한 사람 수 계산 (Referral Reward) - 정책: 1명당 1BW
            // 내 코드를 referrerCode로 가지고 있는 유저 찾기
            const referralCount = await User.countDocuments({ referrerCode: user.myReferralCode });

            if (referralCount > 0) {
                const referralReward = ONE_BW.times(referralCount);
                rewardTotal = rewardTotal.plus(referralReward);
                logMsg += `\n   + Referral Bonus: ${referralReward.toString()} BW (${referralCount} invitees)`;
            }

            console.log(logMsg);
            console.log(`   = Total Expected: ${rewardTotal.toString()} BW`);

            // [C] DB 업데이트
            // referralBonusStorage(2% 채굴분)는 건드리지 않고, referralRewardStorage(1BW 보상)만 수정
            const result = await BonusRecord.findOneAndUpdate(
                { walletAddress: user.walletAddress },
                {
                    $set: {
                        referralRewardStorage: rewardTotal.toString()
                    }
                },
                { new: true, upsert: true } // 없으면 생성
            );

            console.log(`   ✅ DB Updated. Current Storage: ${result.referralRewardStorage}`);
            totalFixedIssued = totalFixedIssued.plus(rewardTotal);
        }

        console.log(`\n✨ Repair Complete.`);
        console.log(`💰 Total Issued Amount after Repair: ${totalFixedIssued.toString()} BW`);

    } catch (error) {
        console.error('❌ Repair Failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected.');
    }
}

repairRewards();
