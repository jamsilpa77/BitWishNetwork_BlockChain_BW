const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/bitwish_mining', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const UserSchema = new mongoose.Schema({
    walletAddress: String,
    myReferralCode: String,
    referrerCode: String
}, { collection: 'users' });

const MiningStateSchema = new mongoose.Schema({
    walletAddress: String,
    referralCount: Number,
    referralBonusRate: String
}, { collection: 'miningstates' });

const BonusRecordSchema = new mongoose.Schema({
    walletAddress: String,
    referralList: Array,
    referralBonusStorage: String,
    referralRewardStorage: String
}, { collection: 'bonusrecords' });

const User = mongoose.model('User', UserSchema);
const MiningState = mongoose.model('MiningState', MiningStateSchema);
const BonusRecord = mongoose.model('BonusRecord', BonusRecordSchema);

async function checkReferralSystem() {
    try {
        console.log('\n=== 사용자 목록 ===');
        const users = await User.find({}).select('walletAddress myReferralCode referrerCode');
        users.forEach(user => {
            console.log(`지갑: ${user.walletAddress.substring(0, 10)}...`);
            console.log(`  내 추천코드: ${user.myReferralCode}`);
            console.log(`  사용한 추천코드: ${user.referrerCode || '없음'}`);
            console.log('');
        });

        console.log('\n=== 마이닝 상태 (추천 통계) ===');
        const miningStates = await MiningState.find({ referralCount: { $gt: 0 } });
        for (const state of miningStates) {
            console.log(`지갑: ${state.walletAddress.substring(0, 10)}...`);
            console.log(`  추천인 수: ${state.referralCount}`);
            console.log(`  추천 보너스율: ${state.referralBonusRate}`);
            console.log('');
        }

        console.log('\n=== 보너스 레코드 (가입자 목록) ===');
        const bonusRecords = await BonusRecord.find({});
        for (const record of bonusRecords) {
            if (record.referralList && record.referralList.length > 0) {
                console.log(`지갑: ${record.walletAddress.substring(0, 10)}...`);
                console.log(`  가입자 수: ${record.referralList.length}`);
                console.log(`  추천 보너스 저장소: ${record.referralBonusStorage}`);
                console.log(`  추천 보상 저장소: ${record.referralRewardStorage}`);
                console.log('  가입자 목록:');
                record.referralList.forEach((ref, idx) => {
                    console.log(`    ${idx + 1}. ${ref.childWalletAddress?.substring(0, 10)}... (${new Date(ref.joinedAt).toLocaleString()})`);
                });
                console.log('');
            }
        }

        console.log('\n=== 추천 관계 분석 ===');
        for (const user of users) {
            if (user.referrerCode) {
                const referrer = await User.findOne({ myReferralCode: user.referrerCode });
                if (referrer) {
                    console.log(`${user.walletAddress.substring(0, 10)}... → ${referrer.walletAddress.substring(0, 10)}... (코드: ${user.referrerCode})`);
                } else {
                    console.log(`❌ ${user.walletAddress.substring(0, 10)}... → 추천인을 찾을 수 없음 (코드: ${user.referrerCode})`);
                }
            }
        }

    } catch (error) {
        console.error('에러:', error);
    } finally {
        await mongoose.connection.close();
    }
}

checkReferralSystem();
