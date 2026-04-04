const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';
const WALLET_ADDRESS = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';

mongoose.connect(MONGODB_URI).then(async () => {
    console.log('🔍 [DIAGNOSTIC] Dumping User Data...');

    const BonusRecordSchema = new mongoose.Schema({}, { strict: false });
    const BonusRecord = mongoose.model('BonusRecord', BonusRecordSchema);

    const MiningStateSchema = new mongoose.Schema({}, { strict: false });
    const MiningState = mongoose.model('MiningState', MiningStateSchema);

    const bonusRecord = await BonusRecord.findOne({ walletAddress: WALLET_ADDRESS });
    const miningState = await MiningState.findOne({ walletAddress: WALLET_ADDRESS });

    console.log('\n--- BonusRecord (Attendance History) ---');
    if (bonusRecord) {
        bonusRecord.attendanceHistory.forEach((h, i) => {
            console.log(`[${i}] Date: ${h.date}, FixedBonus: ${h.fixedBonusAmount}, CheckIn: ${h.checkInTime}`);
        });
    } else {
        console.log('❌ No BonusRecord found.');
    }

    console.log('\n--- MiningState ---');
    if (miningState) {
        console.log(`isMining: ${miningState.isMining}`);
        console.log(`isAttendanceActive: ${miningState.isAttendanceActive}`);
        console.log(`attendanceDate: ${miningState.attendanceDate}`);
        console.log(`accumulatedReward: ${miningState.accumulatedReward}`);
    } else {
        console.log('❌ No MiningState found.');
    }

    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
