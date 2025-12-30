const mongoose = require('mongoose');
const Decimal = require('decimal.js');

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';
const WALLET_ADDRESS = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';

mongoose.connect(MONGODB_URI).then(async () => {
    console.log('✅ Connected to MongoDB');

    // Schemas
    const MiningStateSchema = new mongoose.Schema({}, { strict: false });
    const MiningState = mongoose.model('MiningState', MiningStateSchema);

    // 무조건 강제 적용 (사용자 요청 최우선)
    console.log('⚠️ Forcing MiningState to Active (User Override).');

    const miningState = await MiningState.findOne({ walletAddress: WALLET_ADDRESS });
    if (miningState) {
        const baseRate = new Decimal(miningState.currentBaseRate || '0.25');
        const bonusRate = new Decimal('0.05');
        const newTotalRate = baseRate.mul(new Decimal(1).plus(bonusRate));

        await MiningState.updateOne(
            { walletAddress: WALLET_ADDRESS },
            {
                $set: {
                    isAttendanceActive: true,
                    currentTotalRate: newTotalRate.toString(),
                    attendanceDate: new Date()
                }
            }
        );
        console.log('✅ MiningState FORCED to Active (ON). Rate updated to:', newTotalRate.toString());
    } else {
        console.log('❌ MiningState not found.');
    }

    process.exit(0);
}).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
