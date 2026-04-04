// 특정 지갑의 마이닝 상태 및 보너스 기록 정밀 조회 스크립트

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';
const WALLET_ADDRESS = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';

mongoose.connect(MONGODB_URI).then(async () => {
    console.log('✅ Connected to MongoDB');

    // 1. MiningState 조회
    const MiningStateSchema = new mongoose.Schema({}, { strict: false });
    const MiningState = mongoose.model('MiningState', MiningStateSchema);

    const miningState = await MiningState.findOne({ walletAddress: WALLET_ADDRESS });
    console.log('\n--- [MiningState] ---');
    if (miningState) {
        console.log(`Last Sync Time: ${miningState.lastSyncTime}`);
        console.log(`Accumulated Reward: ${miningState.accumulatedReward}`);
        console.log(`Is Mining: ${miningState.isMining}`);
        console.log(`Start Time: ${miningState.miningStartTime}`);
    } else {
        console.log('No MiningState found.');
    }

    // 2. BonusRecord 조회
    const BonusRecordSchema = new mongoose.Schema({}, { strict: false });
    const BonusRecord = mongoose.model('BonusRecord', BonusRecordSchema);

    const bonusRecord = await BonusRecord.findOne({ walletAddress: WALLET_ADDRESS });
    console.log('\n--- [BonusRecord] ---');
    if (bonusRecord && bonusRecord.attendanceHistory) {
        console.log('Attendance History:');
        bonusRecord.attendanceHistory.forEach((record, index) => {
            console.log(`[${index}] Date: ${record.date}, CheckIn: ${record.checkInTime}, FixedAmount: ${record.fixedBonusAmount}`);
        });
    } else {
        console.log('No BonusRecord found.');
    }

    process.exit(0);
}).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
