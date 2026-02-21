// 모든 데이터 정상화 스크립트
// 1. MiningState: 오늘 출석 안 했으므로 isAttendanceActive = false
// 2. BonusRecord: 21, 22, 26일 데이터 복구 및 27일 데이터 삭제

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';
const WALLET_ADDRESS = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';

mongoose.connect(MONGODB_URI).then(async () => {
    console.log('✅ Connected to MongoDB');

    // 1. MiningState 스키마
    const MiningStateSchema = new mongoose.Schema({
        walletAddress: String,
        isAttendanceActive: Boolean,
        currentTotalRate: String,
        currentBaseRate: String
    }, { strict: false });
    const MiningState = mongoose.model('MiningState', MiningStateSchema);

    // 2. BonusRecord 스키마
    const BonusRecordSchema = new mongoose.Schema({
        walletAddress: String,
        attendanceHistory: Array,
        lastUpdated: Date
    }, { strict: false });
    const BonusRecord = mongoose.model('BonusRecord', BonusRecordSchema);

    // --- 작업 1: MiningState 수정 (출석 상태 OFF) ---
    // 출석 보너스(5%)를 뺀 기본율(0.25)로 복구
    await MiningState.findOneAndUpdate(
        { walletAddress: WALLET_ADDRESS },
        {
            $set: {
                isAttendanceActive: false,
                currentTotalRate: '0.25000000' // 기본율로 복귀
            }
        }
    );
    console.log('✅ MiningState Updated: isAttendanceActive = false');

    // --- 작업 2: BonusRecord 수정 (데이터 복구) ---
    const historyData = [
        {
            date: '2025-11-21',
            checkInTime: new Date('2025-11-21T09:00:00'),
            timestamp: new Date('2025-11-21T09:00:00'),
            bonusRate: '0.05',
            fixedBonusAmount: '0.30000000'
        },
        {
            date: '2025-11-22',
            checkInTime: new Date('2025-11-22T09:00:00'),
            timestamp: new Date('2025-11-22T09:00:00'),
            bonusRate: '0.05',
            fixedBonusAmount: '0.30000000'
        },
        {
            date: '2025-11-26',
            checkInTime: new Date('2025-11-26T23:59:59'), // 어제 날짜 확정
            timestamp: new Date('2025-11-26T23:59:59'),
            bonusRate: '0.05',
            fixedBonusAmount: '0.30000000' // 24시간 최대 채굴 보너스 (0.25 * 0.05 * 24)
        }
        // 27일 데이터는 삭제 (아직 출석 안함)
    ];

    await BonusRecord.findOneAndUpdate(
        { walletAddress: WALLET_ADDRESS },
        {
            $set: {
                attendanceHistory: historyData,
                lastUpdated: new Date()
            }
        }
    );
    console.log('✅ BonusRecord Updated: 21, 22, 26 restored. 27 removed.');

    process.exit(0);
}).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
