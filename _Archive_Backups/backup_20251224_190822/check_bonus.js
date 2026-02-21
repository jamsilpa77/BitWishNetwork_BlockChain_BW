const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';
const WALLET_ADDRESS = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';

mongoose.connect(MONGODB_URI).then(async () => {
    console.log('🔍 Checking BonusRecord...');

    const BonusRecordSchema = new mongoose.Schema({}, { strict: false });
    const BonusRecord = mongoose.model('BonusRecord', BonusRecordSchema);

    const record = await BonusRecord.findOne({ walletAddress: WALLET_ADDRESS });

    if (record) {
        console.log('Found BonusRecord.');
        console.log('History Dates:', record.attendanceHistory.map(h => h.date));
    } else {
        console.log('❌ No BonusRecord found.');
    }

    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
