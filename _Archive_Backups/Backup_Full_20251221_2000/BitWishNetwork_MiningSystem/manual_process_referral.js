const mongoose = require('mongoose');
const Decimal = require('decimal.js');

mongoose.connect('mongodb://localhost:27017/bitwish_mining', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const MiningStateSchema = new mongoose.Schema({}, { strict: false, collection: 'miningstates' });
const BonusRecordSchema = new mongoose.Schema({}, { strict: false, collection: 'bonusrecords' });

const User = mongoose.model('User', UserSchema);
const MiningState = mongoose.model('MiningState', MiningStateSchema);
const BonusRecord = mongoose.model('BonusRecord', BonusRecordSchema);

async function manualProcessReferral() {
    try {
        const referrerCode = 'REF9F5FF0909DC5';
        const newWalletAddress = 'BW6330A20CAFA9EF6F0203DE34F8C3E3F076C9B0E8';

        console.log(`Processing referral: ${newWalletAddress} -> ${referrerCode}`);

        // 1. 추천인 찾기
        const referrer = await User.findOne({ myReferralCode: referrerCode });
        if (!referrer) {
            console.log('❌ Referrer not found!');
            return;
        }
        console.log(`✅ Referrer found: ${referrer.walletAddress}`);

        // 2. 추천인의 BonusRecord 업데이트
        let referrerBonusRecord = await BonusRecord.findOne({ walletAddress: referrer.walletAddress });
        if (!referrerBonusRecord) {
            console.log('Creating new BonusRecord for referrer...');
            referrerBonusRecord = new BonusRecord({
                walletAddress: referrer.walletAddress,
                referralBonusStorage: '0.00000000000000000000000000000000000000000000000000',
                referralRewardStorage: '0.00000000000000000000000000000000000000000000000000',
                referralList: [],
                attendanceHistory: []
            });
        }

        // 가입자가 이미 목록에 있는지 확인
        const existing = referrerBonusRecord.referralList.find(r => r.childWalletAddress === newWalletAddress);
        if (!existing) {
            referrerBonusRecord.referralList.push({
                childWalletAddress: newWalletAddress,
                joinedAt: new Date(),
                accumulatedBonus: '0.00000000000000000000000000000000000000000000000000',
                isKycVerified: false,
                rewardStatus: 'PENDING'
            });
            console.log('✅ Added to referral list');
        } else {
            console.log('Already in referral list');
        }

        // 1BW 지급
        const currentReward = new Decimal(referrerBonusRecord.referralRewardStorage || '0');
        referrerBonusRecord.referralRewardStorage = currentReward.plus(1).toString();
        await referrerBonusRecord.save();
        console.log(`✅ Referrer reward updated: ${referrerBonusRecord.referralRewardStorage}`);

        // 3. 추천인의 MiningState 업데이트
        let referrerMiningState = await MiningState.findOne({ walletAddress: referrer.walletAddress });
        if (!referrerMiningState) {
            console.log('Creating new MiningState for referrer...');
            referrerMiningState = new MiningState({
                walletAddress: referrer.walletAddress,
                isMining: false,
                accumulatedReward: '0.00000000000000000000000000000000000000000000000000',
                referralCount: 0
            });
        }

        referrerMiningState.referralCount += 1;
        const newReferralRate = new Decimal(referrerMiningState.referralCount).mul(0.02);
        referrerMiningState.referralBonusRate = newReferralRate.toString();

        // currentTotalRate 재계산
        const baseRate = new Decimal(referrerMiningState.currentBaseRate || '0.25');
        const attendanceRate = referrerMiningState.isAttendanceActive ? new Decimal(0.05) : new Decimal(0);
        const partnerRate = referrerMiningState.partnerStatus === 'REGISTERED' ? new Decimal(1.25) : new Decimal(0);

        referrerMiningState.currentTotalRate = baseRate
            .mul(new Decimal(1).plus(attendanceRate).plus(newReferralRate).plus(partnerRate))
            .toString();

        await referrerMiningState.save();
        console.log(`✅ Referrer mining state updated:`);
        console.log(`   Referral count: ${referrerMiningState.referralCount}`);
        console.log(`   Referral bonus rate: ${referrerMiningState.referralBonusRate}`);
        console.log(`   Total rate: ${referrerMiningState.currentTotalRate}`);

        // 4. 가입자에게도 1BW 지급
        let newUserBonusRecord = await BonusRecord.findOne({ walletAddress: newWalletAddress });
        if (!newUserBonusRecord) {
            console.log('Creating new BonusRecord for new user...');
            newUserBonusRecord = new BonusRecord({
                walletAddress: newWalletAddress,
                referralBonusStorage: '0.00000000000000000000000000000000000000000000000000',
                referralRewardStorage: '0.00000000000000000000000000000000000000000000000000',
                referralList: [],
                attendanceHistory: []
            });
        }

        const newUserReward = new Decimal(newUserBonusRecord.referralRewardStorage || '0');
        newUserBonusRecord.referralRewardStorage = newUserReward.plus(1).toString();
        await newUserBonusRecord.save();
        console.log(`✅ New user reward: ${newUserBonusRecord.referralRewardStorage}`);

        console.log('\n✅ All done!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

manualProcessReferral();
