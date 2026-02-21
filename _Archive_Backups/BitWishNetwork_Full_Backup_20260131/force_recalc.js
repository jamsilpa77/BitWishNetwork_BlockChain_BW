const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';
const REFERRER_WALLET = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';

async function forceRecalculate() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('=== 🔄 출석 보너스 강제 재계산 ===\n');

        const MiningState = mongoose.model('MiningState', new mongoose.Schema({}, { strict: false }), 'miningstates');

        // 출석 날짜를 과거로 설정하여 만료 유도
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 2);

        const result = await MiningState.updateOne(
            { walletAddress: REFERRER_WALLET },
            { $set: { attendanceDate: yesterday } }
        );

        console.log('attendanceDate를 과거로 설정:', result);
        console.log('\n✅ 이제 서버 API를 호출하면 출석 보너스가 만료 처리되고');
        console.log('   currentTotalRate가 재계산됩니다.');
        console.log('\n📌 브라우저를 새로고침해주세요.');

    } catch (error) {
        console.error('❌ 오류:', error);
    } finally {
        await mongoose.disconnect();
    }
}

forceRecalculate();
