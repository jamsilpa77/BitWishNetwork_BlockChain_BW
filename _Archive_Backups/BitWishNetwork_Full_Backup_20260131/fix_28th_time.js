const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';
const WALLET_ADDRESS = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';

mongoose.connect(MONGODB_URI).then(async () => {
    console.log('🔧 Fixing 28th checkInTime...\n');

    const BonusRecordSchema = new mongoose.Schema({}, { strict: false });
    const BonusRecord = mongoose.model('BonusRecord', BonusRecordSchema);

    const record = await BonusRecord.findOne({ walletAddress: WALLET_ADDRESS });

    const record28th = record.attendanceHistory.find(h => h.date === '2025-11-28');

    if (record28th) {
        console.log('BEFORE checkInTime:', record28th.checkInTime);

        // 28일 00:19:36 KST로 설정 (원래 29일 00:19였던 것)
        record28th.checkInTime = new Date('2025-11-28T00:19:36+09:00');

        await record.save();
        console.log('AFTER checkInTime:', record28th.checkInTime);
        console.log('✅ Fixed!');
    } else {
        console.log('❌ No 28th record found!');
    }

    process.exit(0);
}).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
