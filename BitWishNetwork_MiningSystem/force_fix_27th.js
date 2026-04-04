const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';
const WALLET_ADDRESS = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';

mongoose.connect(MONGODB_URI).then(async () => {
    console.log('🛠️ Force Inserting 27th Record (Direct Query)...');

    const BonusRecordSchema = new mongoose.Schema({}, { strict: false });
    const BonusRecord = mongoose.model('BonusRecord', BonusRecordSchema);

    // $push를 사용하여 배열에 직접 추가 (가장 확실한 방법)
    const result = await BonusRecord.updateOne(
        { walletAddress: WALLET_ADDRESS },
        {
            $push: {
                attendanceHistory: {
                    date: '2025-11-27',
                    checkInTime: new Date('2025-11-27T09:00:00'),
                    bonusRate: '0.05000000000000000000000000000000000000000000000000',
                    fixedBonusAmount: '0.30000000' // 확실하게 고정값 부여
                }
            }
        }
    );

    console.log('Update Result:', result);

    // 확인 사살
    const check = await BonusRecord.findOne({ walletAddress: WALLET_ADDRESS });
    const has27th = check.attendanceHistory.some(h => h.date === '2025-11-27');
    console.log('✅ Verification: 27th record exists?', has27th);

    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
