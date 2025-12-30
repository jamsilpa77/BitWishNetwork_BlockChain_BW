const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';
const WALLET_ADDRESS = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';

mongoose.connect(MONGODB_URI).then(async () => {
    console.log('🔍 Debugging Data State...');

    const MiningStateSchema = new mongoose.Schema({}, { strict: false });
    const MiningState = mongoose.model('MiningState', MiningStateSchema);

    const BonusRecordSchema = new mongoose.Schema({}, { strict: false });
    const BonusRecord = mongoose.model('BonusRecord', BonusRecordSchema);

    // 1. MiningState 확인
    const miningState = await MiningState.findOne({ walletAddress: WALLET_ADDRESS });
    console.log('\n[MiningState]');
    if (miningState) {
        console.log('isMining:', miningState.isMining);
        console.log('isAttendanceActive:', miningState.isAttendanceActive);
    } else {
        console.log('NOT FOUND');
    }

    // 2. BonusRecord 확인 (오늘 날짜)
    const bonusRecord = await BonusRecord.findOne({ walletAddress: WALLET_ADDRESS });
    console.log('\n[BonusRecord]');
    if (bonusRecord) {
        const today = new Date().toISOString().split('T')[0];
        console.log('Today (UTC):', today);

        const records = bonusRecord.attendanceHistory;
        records.forEach((r, i) => {
            if (r.date.includes('2025-11-29')) {
                console.log(`Record ${i}:`);
                console.log('  Date:', r.date);
                console.log('  CheckInTime:', r.checkInTime);
                console.log('  CheckInTime (Local):', new Date(r.checkInTime).toLocaleString());
            }
        });
    }

    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
