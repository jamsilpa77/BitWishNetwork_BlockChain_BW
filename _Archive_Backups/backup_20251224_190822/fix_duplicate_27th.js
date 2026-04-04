const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';
const WALLET_ADDRESS = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';

mongoose.connect(MONGODB_URI).then(async () => {
    console.log('🔧 Fixing duplicate 27th records...');

    const BonusRecordSchema = new mongoose.Schema({}, { strict: false });
    const BonusRecord = mongoose.model('BonusRecord', BonusRecordSchema);

    const record = await BonusRecord.findOne({ walletAddress: WALLET_ADDRESS });

    if (!record) {
        console.log('❌ No BonusRecord found.');
        process.exit(1);
    }

    console.log('Before fix:', record.attendanceHistory.map(h => h.date));

    // 27일 레코드 찾기
    const records27th = record.attendanceHistory.filter(h => h.date === '2025-11-27');

    if (records27th.length === 2) {
        console.log('✅ Found 2 duplicate 27th records. Fixing...');

        // 첫 번째 27일은 그대로 두고, 두 번째 27일을 28일로 변경
        let fixed = false;
        record.attendanceHistory = record.attendanceHistory.map(h => {
            if (h.date === '2025-11-27' && !fixed) {
                fixed = true; // 첫 번째는 스킵
                return h;
            } else if (h.date === '2025-11-27' && fixed) {
                // 두 번째를 28일로 변경
                console.log('🔄 Converting second 27th to 28th...');
                return {
                    ...h,
                    date: '2025-11-28',
                    checkInTime: h.checkInTime ? new Date(new Date(h.checkInTime).getTime() + 24 * 60 * 60 * 1000) : null
                };
            }
            return h;
        });

        await record.save();
        console.log('After fix:', record.attendanceHistory.map(h => h.date));
        console.log('✅ Fixed successfully!');
    } else {
        console.log('⚠️ Expected 2 records of 27th, but found:', records27th.length);
    }

    process.exit(0);
}).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
