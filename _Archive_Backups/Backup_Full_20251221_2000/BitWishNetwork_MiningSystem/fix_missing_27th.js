const mongoose = require('mongoose');
const Decimal = require('decimal.js');

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';
const WALLET_ADDRESS = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';

mongoose.connect(MONGODB_URI).then(async () => {
    console.log('🛠️ Fixing Missing 27th Record...');

    const BonusRecordSchema = new mongoose.Schema({}, { strict: false });
    const BonusRecord = mongoose.model('BonusRecord', BonusRecordSchema);

    const record = await BonusRecord.findOne({ walletAddress: WALLET_ADDRESS });

    if (record) {
        // 27일 기록이 이미 있는지 확인
        const has27th = record.attendanceHistory.some(h => h.date === '2025-11-27');

        if (!has27th) {
            console.log('❌ 27th record missing. Inserting now...');

            // 27일 기록 강제 삽입
            record.attendanceHistory.push({
                date: '2025-11-27',
                checkInTime: new Date('2025-11-27T09:05:00'), // 임의의 시간
                bonusRate: '0.05000000000000000000000000000000000000000000000000',
                fixedBonusAmount: null // 과거 기록이지만 실시간 계산 로직을 따르거나, 필요시 고정값 부여 가능
            });

            // 날짜순 정렬
            record.attendanceHistory.sort((a, b) => new Date(a.date) - new Date(b.date));

            await record.save();
            console.log('✅ 27th record inserted successfully.');
        } else {
            console.log('✅ 27th record already exists.');
        }
    } else {
        console.log('❌ BonusRecord not found.');
    }

    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
