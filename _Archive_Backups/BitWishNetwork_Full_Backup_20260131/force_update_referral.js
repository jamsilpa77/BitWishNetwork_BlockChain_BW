const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/bitwish_mining', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function forceUpdate() {
    try {
        console.log('=== 🚨 강제 업데이트 시작 ===');
        const walletAddress = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';

        // 1. MiningState 강제 업데이트
        const MiningState = mongoose.model('MiningState', new mongoose.Schema({}, { strict: false, collection: 'miningstates' }));

        const miningResult = await MiningState.updateOne(
            { walletAddress: walletAddress },
            {
                $set: {
                    referralCount: 3,
                    referralBonusRate: '0.06000000000000000000000000000000000000000000000000',
                    currentTotalRate: '0.26500000000000000000000000000000000000000000000000'
                }
            },
            { upsert: true } // 없으면 생성
        );
        console.log('MiningState 업데이트 결과:', miningResult);

        // 2. BonusRecord 강제 업데이트
        const BonusRecord = mongoose.model('BonusRecord', new mongoose.Schema({}, { strict: false, collection: 'bonusrecords' }));

        // 가입자 목록 데이터 준비
        const referees = [
            'BW958ACBEA657953450332FFF0FD66ABB0FA994005',
            'BW69527012159E5A3CF2EFB3E07D8DC7FCFA385EF6',
            'BW6330A20CAFA9EF6F0203DE34F8C3E3F076C9B0E8'
        ];

        const referralList = referees.map(addr => ({
            childWalletAddress: addr,
            joinedAt: new Date(),
            accumulatedBonus: '0.00000000000000000000000000000000000000000000000000',
            isKycVerified: false,
            rewardStatus: 'PENDING'
        }));

        const bonusResult = await BonusRecord.updateOne(
            { walletAddress: walletAddress },
            {
                $set: {
                    referralList: referralList,
                    referralRewardStorage: '3.00000000000000000000000000000000000000000000000000'
                }
            },
            { upsert: true }
        );
        console.log('BonusRecord 업데이트 결과:', bonusResult);

        console.log('=== ✅ 강제 업데이트 완료 ===');

    } catch (error) {
        console.error('❌ 에러:', error);
    } finally {
        await mongoose.connection.close();
    }
}

forceUpdate();
