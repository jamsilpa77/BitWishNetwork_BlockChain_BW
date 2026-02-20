const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';
const WALLET_ADDRESS = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';

mongoose.connect(MONGODB_URI).then(async () => {
    console.log('✅ Connected to MongoDB');

    // BonusRecord 스키마 정의 (간략하게)
    const BonusRecordSchema = new mongoose.Schema({
        walletAddress: String,
        attendanceHistory: Array
    }, { strict: false });

    const BonusRecord = mongoose.model('BonusRecord', BonusRecordSchema);

    const record = await BonusRecord.findOne({ walletAddress: WALLET_ADDRESS });

    console.log('--- BonusRecord Check ---');
    if (record) {
        console.log('Found BonusRecord:', JSON.stringify(record, null, 2));
    } else {
        console.log('❌ No BonusRecord found for this wallet.');
    }

    process.exit(0);
}).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
