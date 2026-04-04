const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';
const WALLET_ADDRESS = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';

mongoose.connect(MONGODB_URI).then(async () => {
    console.log('🔧 COMPLETE FIX - Removing duplicates and adding correct records...\n');

    const BonusRecordSchema = new mongoose.Schema({}, { strict: false });
    const BonusRecord = mongoose.model('BonusRecord', BonusRecordSchema);

    const record = await BonusRecord.findOne({ walletAddress: WALLET_ADDRESS });

    if (!record) {
        console.log('❌ No BonusRecord found.');
        process.exit(1);
    }

    console.log('BEFORE:', record.attendanceHistory.map(h => `${h.date} (${h.checkInTime})`));

    // 27일 레코드 모두 제거
    record.attendanceHistory = record.attendanceHistory.filter(h => h.date !== '2025-11-27');

    console.log('After removing 27th:', record.attendanceHistory.map(h => h.date));

    // 27일 레코드 1개 추가 (정상)
    record.attendanceHistory.push({
        date: '2025-11-27',
        checkInTime: new Date('2025-11-27T09:00:00+09:00'),
        timestamp: new Date('2025-11-27T09:00:00+09:00').toISOString(),
        fixedBonusAmount: '0.30000000'
    });

    // 28일 레코드 1개 추가 (원래 29일 00:19에 체크한 것)
    record.attendanceHistory.push({
        date: '2025-11-28',
        checkInTime: new Date('2025-11-28T00:19:36+09:00'),
        timestamp: new Date('2025-11-28T00:19:36+09:00').toISOString(),
        fixedBonusAmount: null  // 아직 확정 안 됨
    });

    // 날짜순 정렬
    record.attendanceHistory.sort((a, b) => new Date(a.date) - new Date(b.date));

    await record.save();

    console.log('\n✅ COMPLETE!');
    console.log('AFTER:', record.attendanceHistory.map(h => `${h.date} (${h.checkInTime})`));

    process.exit(0);
}).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
