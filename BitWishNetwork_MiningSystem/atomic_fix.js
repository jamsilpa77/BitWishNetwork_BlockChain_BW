const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';
const WALLET_ADDRESS = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';

mongoose.connect(MONGODB_URI).then(async () => {
    console.log('⚡ Atomic Update: Forcing correct data...');

    const BonusRecordSchema = new mongoose.Schema({}, { strict: false });
    const BonusRecord = mongoose.model('BonusRecord', BonusRecordSchema);

    // 우리가 원하는 정확한 데이터 리스트
    const correctHistory = [
        {
            date: '2025-11-21',
            checkInTime: new Date('2025-11-21T09:00:00+09:00'),
            timestamp: new Date('2025-11-21T09:00:00+09:00').toISOString(),
            fixedBonusAmount: '0.30000000'
        },
        {
            date: '2025-11-22',
            checkInTime: new Date('2025-11-22T09:00:00+09:00'),
            timestamp: new Date('2025-11-22T09:00:00+09:00').toISOString(),
            fixedBonusAmount: '0.30000000'
        },
        {
            date: '2025-11-26',
            checkInTime: new Date('2025-11-26T09:00:00+09:00'),
            timestamp: new Date('2025-11-26T09:00:00+09:00').toISOString(),
            fixedBonusAmount: '0.30000000'
        },
        {
            date: '2025-11-27',
            checkInTime: new Date('2025-11-27T09:00:00+09:00'),
            timestamp: new Date('2025-11-27T09:00:00+09:00').toISOString(),
            fixedBonusAmount: '0.30000000'
        },
        {
            date: '2025-11-28',
            checkInTime: new Date('2025-11-28T00:19:36+09:00'),
            timestamp: new Date('2025-11-28T00:19:36+09:00').toISOString(),
            fixedBonusAmount: null
        }
    ];

    // updateOne을 사용하여 DB 레벨에서 강제 업데이트 (Race Condition 방지)
    const result = await BonusRecord.updateOne(
        { walletAddress: WALLET_ADDRESS },
        { $set: { attendanceHistory: correctHistory } }
    );

    console.log('Update Result:', result);
    console.log('✅ Atomic update completed.');

    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
