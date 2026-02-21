// MongoDB에서 BonusRecord에 출석 기록을 강제로 생성하는 스크립트

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';
const WALLET_ADDRESS = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';

mongoose.connect(MONGODB_URI).then(async () => {
    console.log('✅ Connected to MongoDB');

    const BonusRecordSchema = new mongoose.Schema({
        walletAddress: { type: String, required: true, unique: true },
        attendanceHistory: [{
            date: String,      // YYYY-MM-DD
            timestamp: Date,
            bonusRate: String
        }],
        referralHistory: Array,
        partnerHistory: Array,
        lastUpdated: { type: Date, default: Date.now }
    }, { strict: false });

    const BonusRecord = mongoose.model('BonusRecord', BonusRecordSchema);

    // 강제로 넣을 출석 기록 데이터
    const historyData = [
        {
            date: '2025-11-21',
            timestamp: new Date('2025-11-21T09:00:00'),
            bonusRate: '0.05'
        },
        {
            date: '2025-11-22',
            timestamp: new Date('2025-11-22T09:00:00'),
            bonusRate: '0.05'
        },
        {
            date: '2025-11-26', // 오늘 날짜 (가정)
            timestamp: new Date(),
            bonusRate: '0.05'
        }
    ];

    const result = await BonusRecord.findOneAndUpdate(
        { walletAddress: WALLET_ADDRESS },
        {
            $set: {
                walletAddress: WALLET_ADDRESS,
                attendanceHistory: historyData,
                lastUpdated: new Date()
            }
        },
        { new: true, upsert: true } // 없으면 생성, 있으면 업데이트
    );

    console.log('✅ Updated BonusRecord for wallet:', result);

    process.exit(0);
}).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
