// MongoDB에서 MiningState 데이터를 조회하는 스크립트

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';
const WALLET_ADDRESS = 'BW9F5FF090231236D37F250A5C3B4FC320FB44BFA8';

mongoose.connect(MONGODB_URI).then(async () => {
    console.log('✅ Connected to MongoDB');

    const MiningState = mongoose.model('MiningState', new mongoose.Schema({}, { strict: false }));

    const result = await MiningState.findOne({ walletAddress: WALLET_ADDRESS });

    console.log('📊 Current MiningState:');
    console.log(JSON.stringify(result, null, 2));

    console.log('\n🔍 isAttendanceActive:', result?.isAttendanceActive);
    console.log('🔍 currentTotalRate:', result?.currentTotalRate);

    process.exit(0);
}).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
