const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';
const WALLET_ADDRESS = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';

mongoose.connect(MONGODB_URI).then(async () => {
    console.log('🧹 Wiping attendance history...');

    const BonusRecordSchema = new mongoose.Schema({}, { strict: false });
    const BonusRecord = mongoose.model('BonusRecord', BonusRecordSchema);

    const record = await BonusRecord.findOne({ walletAddress: WALLET_ADDRESS });

    // 1. 배열 비우기
    record.attendanceHistory = [];
    await record.save();
    console.log('✅ Wiped. Current history:', record.attendanceHistory);

    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
