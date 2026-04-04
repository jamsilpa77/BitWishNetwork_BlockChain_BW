const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';
const WALLET_ADDRESS = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';

mongoose.connect(MONGODB_URI).then(async () => {
    console.log('🔧 Fixing attendance records (FINAL)...\n');

    const BonusRecordSchema = new mongoose.Schema({}, { strict: false });
    const BonusRecord = mongoose.model('BonusRecord', BonusRecordSchema);

    const record = await BonusRecord.findOne({ walletAddress: WALLET_ADDRESS });

    if (!record) {
        console.log('❌ No BonusRecord found.');
        process.exit(1);
    }

    console.log('BEFORE:', record.attendanceHistory.map(h => h.date));

    // 모든 레코드를 날짜순으로 정렬
    record.attendanceHistory.sort((a, b) => new Date(a.date) - new Date(b.date));

    // 27일 레코드들 찾기
    const indices27th = [];
    record.attendanceHistory.forEach((h, i) => {
        if (h.date === '2025-11-27') {
            indices27th.push(i);
        }
    });

    console.log(`Found ${indices27th.length} records with date 2025-11-27`);

    if (indices27th.length >= 2) {
        // 마지막 27일 레코드를 28일로 변경
        const lastIndex = indices27th[indices27th.length - 1];
        console.log(`Converting record at index ${lastIndex} to 2025-11-28...`);

        record.attendanceHistory[lastIndex].date = '2025-11-28';

        // checkInTime도 있으면 하루 추가
        if (record.attendanceHistory[lastIndex].checkInTime) {
            const oldTime = new Date(record.attendanceHistory[lastIndex].checkInTime);
            const newTime = new Date(oldTime.getTime() + 24 * 60 * 60 * 1000);
            record.attendanceHistory[lastIndex].checkInTime = newTime;
            console.log(`Updated checkInTime: ${oldTime} -> ${newTime}`);
        }

        // 저장
        await record.save();
        console.log('\n✅ SAVED!');
        console.log('AFTER:', record.attendanceHistory.map(h => h.date));
    } else {
        console.log('⚠️ Not enough 27th records to fix.');
    }

    process.exit(0);
}).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
