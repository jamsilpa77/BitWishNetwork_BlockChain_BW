const mongoose = require('mongoose');

// MongoDB 연결 설정
const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';

// 스키마 정의 (BonusRecord)
const BonusRecordSchema = new mongoose.Schema({
    walletAddress: { type: String, required: true, unique: true },
    attendanceHistory: [{
        date: String,
        checkInTime: Date,
        bonusRate: String,
        fixedBonusAmount: String
    }]
});

const BonusRecord = mongoose.model('BonusRecord', BonusRecordSchema);

async function fixAttendanceDates() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB Connected');

        const records = await BonusRecord.find({});
        let fixedCount = 0;

        for (const record of records) {
            let isModified = false;

            // 기록 순회
            record.attendanceHistory.forEach(history => {
                if (history.checkInTime) {
                    const checkInDate = new Date(history.checkInTime);
                    const hour = checkInDate.getHours();

                    // 9시 이전 체크인인데, 날짜 문자열(date)이 체크인 날짜와 같다면 -> 하루 빼야 함
                    // 예: checkInTime이 29일 00:19인데 date가 "2025-11-29"라면 잘못된 것.
                    if (hour < 9) {
                        const dateStr = history.date; // "2025-11-29"
                        const checkInDateStr = checkInDate.toISOString().split('T')[0]; // "2025-11-29"

                        if (dateStr === checkInDateStr) {
                            // 날짜 하루 빼기
                            const correctDate = new Date(checkInDate);
                            correctDate.setDate(correctDate.getDate() - 1);
                            const correctDateStr = correctDate.toISOString().split('T')[0];

                            console.log(`[Fixing] ${history.date} (${hour}시) -> ${correctDateStr}`);
                            history.date = correctDateStr;
                            isModified = true;
                            fixedCount++;
                        }
                    }
                }
            });

            if (isModified) {
                await record.save();
            }
        }

        console.log(`총 ${fixedCount}개의 잘못된 날짜 기록을 수정했습니다.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB Disconnected');
    }
}

fixAttendanceDates();
