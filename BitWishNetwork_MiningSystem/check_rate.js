const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';
const REFERRER_WALLET = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';

async function checkRate() {
    try {
        await mongoose.connect(MONGODB_URI);
        const MiningState = mongoose.model('MiningState', new mongoose.Schema({}, { strict: false }), 'miningstates');
        const state = await MiningState.findOne({ walletAddress: REFERRER_WALLET });

        console.log('currentTotalRate:', state.currentTotalRate);
        console.log('referralBonusRate:', state.referralBonusRate);
        console.log('isAttendanceActive:', state.isAttendanceActive);
        console.log('extensionBonusRate:', state.extensionBonusRate);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkRate();
