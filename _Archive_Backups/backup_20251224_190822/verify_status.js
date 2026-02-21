const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';
const WALLET_ADDRESS = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';

mongoose.connect(MONGODB_URI).then(async () => {
    console.log('🔍 Checking Database Status...');

    const MiningStateSchema = new mongoose.Schema({}, { strict: false });
    const MiningState = mongoose.model('MiningState', MiningStateSchema);

    const state = await MiningState.findOne({ walletAddress: WALLET_ADDRESS });

    if (state) {
        console.log('---------------------------------------------------');
        console.log(`Wallet: ${WALLET_ADDRESS}`);
        console.log(`Attendance Active: ${state.isAttendanceActive}`); // Should be true
        console.log(`Current Total Rate: ${state.currentTotalRate}`);
        console.log(`Last Sync Time: ${state.lastSyncTime}`);
        console.log('---------------------------------------------------');
    } else {
        console.log('❌ No MiningState found for this wallet.');
    }

    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
