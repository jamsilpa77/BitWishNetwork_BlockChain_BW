const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/bitwish_mining', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const UserSchema = new mongoose.Schema({
    walletAddress: String,
    publicKey: String,
    encryptedMnemonic: String,
    secondPasswordHash: String,
    myReferralCode: String,
    referrerCode: String,
    ipAddress: String,
    createdAt: Date,
    lastLoginAt: Date,
    isKycVerified: Boolean
}, { collection: 'users' });

const MiningStateSchema = new mongoose.Schema({
    walletAddress: String,
    isMining: Boolean,
    miningStartTime: Date,
    lastSyncTime: Date,
    accumulatedReward: String,
    currentBaseRate: String,
    currentTotalRate: String,
    isAttendanceActive: Boolean,
    attendanceDate: Date,
    referralCount: Number,
    referralBonusRate: String,
    partnerStatus: String
}, { collection: 'miningstates' });

const BonusRecordSchema = new mongoose.Schema({
    walletAddress: String,
    referralBonusStorage: String,
    referralRewardStorage: String,
    referralList: Array,
    attendanceHistory: Array
}, { collection: 'bonusrecords' });

const User = mongoose.model('User', UserSchema);
const MiningState = mongoose.model('MiningState', MiningStateSchema);
const BonusRecord = mongoose.model('BonusRecord', BonusRecordSchema);

async function registerReferrer() {
    try {
        const walletAddress = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';

        // 이미 존재하는지 확인
        const existing = await User.findOne({ walletAddress });
        if (existing) {
            console.log('User already exists');
            return;
        }

        console.log('Registering referrer...');

        // 1. User 생성
        const user = new User({
            walletAddress: walletAddress,
            publicKey: walletAddress,
            encryptedMnemonic: 'cHJvdGVjdCBhcnQgd2luayBwb3ZlcnR5IHNvdXAgd2lkdGggZWFybiBjcmFkbGUgZW1wb3dlciBqb2Igd3Jlc3RsZSBicmFja2V0IGx1bWJlciBjb3JyZWN0IGlnbm9yZSBjYXZlIGNhbmNlbCBwb3NpdGlvbiBwb3dlciB1c2FnZSBzdWZmZXIgc29kYSBob3N0IGNhc3VhbA==',
            secondPasswordHash: '9e44b3aba2650a9beba48f07a0c269a3:f1ded8fa01b755d86bd885c1b82f2f7edb7b31efa45d801f659014675b27454483fbdd2ec53439fa3a799db14426e5652628da8b544a2221088deb7b87c8f394',
            myReferralCode: 'REF9F5FF0909DC5',
            referrerCode: null,
            ipAddress: '127.0.0.1',
            createdAt: new Date(),
            lastLoginAt: new Date(),
            isKycVerified: false
        });
        await user.save();
        console.log('✅ User saved');

        // 2. MiningState 생성
        const miningState = new MiningState({
            walletAddress: walletAddress,
            isMining: false,
            miningStartTime: null,
            lastSyncTime: new Date(),
            accumulatedReward: '0.00000000000000000000000000000000000000000000000000',
            currentBaseRate: '0.25000000000000000000000000000000000000000000000000',
            currentTotalRate: '0.25000000000000000000000000000000000000000000000000',
            isAttendanceActive: false,
            attendanceDate: null,
            referralCount: 0,
            referralBonusRate: '0.00000000000000000000000000000000000000000000000000',
            partnerStatus: 'NOT_REGISTERED'
        });
        await miningState.save();
        console.log('✅ MiningState saved');

        // 3. BonusRecord 생성
        const bonusRecord = new BonusRecord({
            walletAddress: walletAddress,
            referralBonusStorage: '0.00000000000000000000000000000000000000000000000000',
            referralRewardStorage: '0.00000000000000000000000000000000000000000000000000',
            referralList: [],
            attendanceHistory: []
        });
        await bonusRecord.save();
        console.log('✅ BonusRecord saved');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

registerReferrer();
