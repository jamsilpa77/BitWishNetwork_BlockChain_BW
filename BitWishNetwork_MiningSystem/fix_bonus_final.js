// MongoDB에서 BonusRecord 데이터를 수정하여 과거/현재 데이터를 구분하는 스크립트

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';
const WALLET_ADDRESS = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';

mongoose.connect(MONGODB_URI).then(async () => {
    console.log('✅ Connected to MongoDB');

    const BonusRecordSchema = new mongoose.Schema({
        walletAddress: { type: String, required: true, unique: true },
        attendanceHistory: [{
            date: String,      // YYYY-MM-DD
            checkInTime: Date, // 실제 저장된 필드명 확인 필요 (timestamp or checkInTime)
            timestamp: Date,   // 호환성을 위해 둘 다 저장
            bonusRate: String,
            fixedBonusAmount: String // 과거 데이터 고정용 필드 추가
        }],
        lastUpdated: { type: Date, default: Date.now }
    }, { strict: false });

    const BonusRecord = mongoose.model('BonusRecord', BonusRecordSchema);

    // 1. 21일, 22일: 과거 데이터 (고정값 0.3 BW 적용)
    // 2. 26일: 현재 데이터 (실시간 계산을 위해 fixedBonusAmount: null)
    const historyData = [
        {
            date: '2025-11-21',
            checkInTime: new Date('2025-11-21T09:00:00'),
            timestamp: new Date('2025-11-21T09:00:00'),
            bonusRate: '0.05',
            fixedBonusAmount: '0.30000000' // 고정값
        },
        {
            date: '2025-11-22',
            checkInTime: new Date('2025-11-22T09:00:00'),
            timestamp: new Date('2025-11-22T09:00:00'),
            bonusRate: '0.05',
            fixedBonusAmount: '0.30000000' // 고정값
        },
        {
            date: '2025-11-26',
            checkInTime: new Date(), // 오늘 현재 시간
            timestamp: new Date(),
            bonusRate: '0.05',
            fixedBonusAmount: null // 실시간 계산
        }
    ];

    const result = await BonusRecord.findOneAndUpdate(
        { walletAddress: WALLET_ADDRESS },
        {
            $set: {
                attendanceHistory: historyData,
                lastUpdated: new Date()
            }
        },
        { new: true }
    );

    console.log('✅ BonusRecord Updated Successfully!');
    console.log(JSON.stringify(result.attendanceHistory, null, 2));

    process.exit(0);
}).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
