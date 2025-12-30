const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';
const WALLET_ADDRESS = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';

mongoose.connect(MONGODB_URI).then(async () => {
    console.log('🔍 Checking 28th record details...');

    const BonusRecordSchema = new mongoose.Schema({}, { strict: false });
    const BonusRecord = mongoose.model('BonusRecord', BonusRecordSchema);

    const record = await BonusRecord.findOne({ walletAddress: WALLET_ADDRESS });

    if (!record) {
        console.log('❌ No BonusRecord found.');
        process.exit(1);
    }

    const record28th = record.attendanceHistory.find(h => h.date === '2025-11-28');

    if (record28th) {
        console.log('\n✅ Found 28th record:');
        console.log('Date:', record28th.date);
        console.log('CheckInTime:', record28th.checkInTime);
        console.log('Timestamp:', record28th.timestamp);
        console.log('FixedBonusAmount:', record28th.fixedBonusAmount);
        console.log('\nFull record:', JSON.stringify(record28th, null, 2));
    } else {
        console.log('❌ No 28th record found!');
    }

    process.exit(0);
}).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
