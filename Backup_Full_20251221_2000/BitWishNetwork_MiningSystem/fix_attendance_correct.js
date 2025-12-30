// MongoDB에서 MiningState의 isAttendanceActive를 true로 강제 업데이트하는 스크립트 (수정된 지갑 주소)

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';
// 올바른 지갑 주소 (서버 로그 기반)
const WALLET_ADDRESS = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';

mongoose.connect(MONGODB_URI).then(async () => {
    console.log('✅ Connected to MongoDB');

    const MiningState = mongoose.model('MiningState', new mongoose.Schema({}, { strict: false }));

    const result = await MiningState.findOneAndUpdate(
        { walletAddress: WALLET_ADDRESS },
        {
            $set: {
                isAttendanceActive: true,
                attendanceDate: new Date(),
                currentTotalRate: '0.2625' // 0.25 * 1.05
            }
        },
        { new: true, upsert: true }
    );

    console.log('✅ Updated MiningState for CORRECT wallet:', result);

    process.exit(0);
}).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
