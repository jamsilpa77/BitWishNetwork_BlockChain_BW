// MongoDB에서 MiningState의 isAttendanceActive를 true로 강제 업데이트하는 스크립트

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';
const WALLET_ADDRESS = 'BW9F5FF090231236D37F250A5C3B4FC320FB44BFA8';

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

    console.log('✅ Updated MiningState:', result);

    process.exit(0);
}).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
