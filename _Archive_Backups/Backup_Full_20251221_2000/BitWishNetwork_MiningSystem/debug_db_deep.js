const mongoose = require('mongoose');

// 서버와 동일한 DB 주소 사용
mongoose.connect('mongodb://localhost:27017/bitwish_mining', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function deepDebug() {
    try {
        console.log('=== 🔍 DB 정밀 진단 시작 ===\n');

        // 1. 추천인 지갑 주소
        const referrerAddress = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';
        console.log(`대상 지갑: ${referrerAddress}`);

        // 2. User 컬렉션 확인
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
        const user = await User.findOne({ walletAddress: referrerAddress });

        if (!user) {
            console.log('❌ [CRITICAL] User 테이블에 지갑이 없습니다!');
        } else {
            console.log('✅ User 테이블: 존재함');
            console.log(`   - 내 추천코드: ${user.myReferralCode}`);
        }

        // 3. MiningState 컬렉션 확인 (추천인 수, 보너스율)
        const MiningState = mongoose.model('MiningState', new mongoose.Schema({}, { strict: false, collection: 'miningstates' }));
        const miningState = await MiningState.findOne({ walletAddress: referrerAddress });

        if (!miningState) {
            console.log('❌ [CRITICAL] MiningState 테이블에 데이터가 없습니다!');
        } else {
            console.log('✅ MiningState 테이블: 존재함');
            console.log(`   - referralCount (추천인 수): ${miningState.referralCount}`);
            console.log(`   - referralBonusRate (보너스율): ${miningState.referralBonusRate}`);

            if (miningState.referralCount === 0) {
                console.log('   ⚠️ [PROBLEM] 추천인 수가 0입니다. DB 업데이트가 안 되었습니다.');
            }
        }

        // 4. BonusRecord 컬렉션 확인 (가입자 목록)
        const BonusRecord = mongoose.model('BonusRecord', new mongoose.Schema({}, { strict: false, collection: 'bonusrecords' }));
        const bonusRecord = await BonusRecord.findOne({ walletAddress: referrerAddress });

        if (!bonusRecord) {
            console.log('❌ [CRITICAL] BonusRecord 테이블에 데이터가 없습니다!');
        } else {
            console.log('✅ BonusRecord 테이블: 존재함');
            console.log(`   - referralList 길이: ${bonusRecord.referralList ? bonusRecord.referralList.length : 0}`);
            console.log(`   - referralRewardStorage: ${bonusRecord.referralRewardStorage}`);

            if (bonusRecord.referralList && bonusRecord.referralList.length > 0) {
                console.log('   - 가입자 목록 상세:');
                bonusRecord.referralList.forEach((ref, idx) => {
                    console.log(`     [${idx + 1}] ${ref.childWalletAddress} (Date: ${ref.joinedAt})`);
                });
            } else {
                console.log('   ⚠️ [PROBLEM] 가입자 목록이 비어 있습니다.');
            }
        }

    } catch (error) {
        console.error('❌ 에러 발생:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n=== 진단 종료 ===');
    }
}

deepDebug();
