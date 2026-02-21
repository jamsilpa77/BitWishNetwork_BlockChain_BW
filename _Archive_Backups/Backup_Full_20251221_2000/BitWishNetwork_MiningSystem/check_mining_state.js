const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';
const WALLET_ADDRESS = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';

mongoose.connect(MONGODB_URI).then(async () => {
    console.log('🔍 Checking MiningState...\n');

    const MiningStateSchema = new mongoose.Schema({}, { strict: false });
    const MiningState = mongoose.model('MiningState', MiningStateSchema);

    const state = await MiningState.findOne({ walletAddress: WALLET_ADDRESS });

    if (state) {
        console.log('✅ Found MiningState:');
        console.log('isAttendanceActive:', state.isAttendanceActive);
        console.log('attendanceDate:', state.attendanceDate);
        console.log('isMining:', state.isMining);
        console.log('accumulatedReward:', state.accumulatedReward);
    } else {
        console.log('❌ No MiningState found.');
    }

    process.exit(0);
}).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
