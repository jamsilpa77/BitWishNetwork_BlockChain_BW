const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/bitwish_mining', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function quickCheck() {
    try {
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
        const MiningState = mongoose.model('MiningState', new mongoose.Schema({}, { strict: false, collection: 'miningstates' }));
        const BonusRecord = mongoose.model('BonusRecord', new mongoose.Schema({}, { strict: false, collection: 'bonusrecords' }));

        const userCount = await User.countDocuments();
        const miningCount = await MiningState.countDocuments();
        const bonusCount = await BonusRecord.countDocuments();

        console.log('User count:', userCount);
        console.log('MiningState count:', miningCount);
        console.log('BonusRecord count:', bonusCount);

        if (userCount > 0) {
            const users = await User.find({}).limit(5);
            console.log('\nUsers:');
            users.forEach(u => {
                console.log(`  - Wallet: ${u.walletAddress}`);
                console.log(`    My Code: ${u.myReferralCode}`);
                console.log(`    Used Code: ${u.referrerCode || 'NONE'}`);
            });
        }

        const targetUser = await User.findOne({ myReferralCode: 'REF9F5FF0909DC5' });
        if (targetUser) {
            console.log('\nTarget user found:', targetUser.walletAddress);

            const miningState = await MiningState.findOne({ walletAddress: targetUser.walletAddress });
            console.log('Referral count:', miningState?.referralCount || 0);

            const bonusRecord = await BonusRecord.findOne({ walletAddress: targetUser.walletAddress });
            console.log('Referral list length:', bonusRecord?.referralList?.length || 0);
            console.log('Reward storage:', bonusRecord?.referralRewardStorage || '0');
        } else {
            console.log('\nTarget user NOT FOUND (REF9F5FF0909DC5)');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

quickCheck();
