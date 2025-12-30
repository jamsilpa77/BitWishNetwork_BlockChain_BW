const mongoose = require('mongoose');
const Decimal = require('decimal.js');

mongoose.connect('mongodb://localhost:27017/bitwish_mining', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// 스키마 정의 (유연한 처리를 위해 strict: false)
const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
const MiningState = mongoose.model('MiningState', new mongoose.Schema({}, { strict: false, collection: 'miningstates' }));
const BonusRecord = mongoose.model('BonusRecord', new mongoose.Schema({}, { strict: false, collection: 'bonusrecords' }));

async function fixReferralSystem() {
    try {
        console.log('=== 🛠️ 추천 시스템 데이터 정밀 복구 시작 ===\n');

        // 1. 대상 데이터 정의
        const referrer = {
            walletAddress: 'BW9F5FF090231236037F250A523B4FC320FB44BFA8',
            referralCode: 'REF9F5FF0909DC5'
        };

        const referees = [
            'BW958ACBEA657953450332FFF0FD66ABB0FA994005',
            'BW69527012159E5A3CF2EFB3E07D8DC7FCFA385EF6',
            'BW6330A20CAFA9EF6F0203DE34F8C3E3F076C9B0E8'
        ];

        console.log(`추천인: ${referrer.walletAddress} (Code: ${referrer.referralCode})`);
        console.log(`가입자 수: ${referees.length}명`);

        // 2. 가입자 데이터 처리 (없으면 생성, 있으면 수정)
        const referralListForRecord = [];

        for (const refereeAddress of referees) {
            console.log(`\n➡️ 가입자 처리 중: ${refereeAddress}`);

            // 2-1. User 확인 및 생성
            let user = await User.findOne({ walletAddress: refereeAddress });
            if (!user) {
                console.log('   User 없음 -> 생성합니다.');
                user = new User({
                    walletAddress: refereeAddress,
                    publicKey: refereeAddress,
                    encryptedMnemonic: 'RESTORED_BY_SYSTEM', // 복구용 더미
                    secondPasswordHash: 'PENDING',
                    myReferralCode: 'REF' + refereeAddress.substring(2, 14), // 임시 코드
                    referrerCode: referrer.referralCode,
                    ipAddress: '127.0.0.1',
                    createdAt: new Date(),
                    isKycVerified: false
                });
            } else {
                console.log('   User 존재함 -> 추천인 코드 연결');
                user.referrerCode = referrer.referralCode;
            }
            await user.save();

            // 2-2. BonusRecord (보상 1BW 지급)
            let bonusRecord = await BonusRecord.findOne({ walletAddress: refereeAddress });
            if (!bonusRecord) {
                bonusRecord = new BonusRecord({
                    walletAddress: refereeAddress,
                    referralBonusStorage: '0.00000000000000000000000000000000000000000000000000',
                    referralRewardStorage: '0.00000000000000000000000000000000000000000000000000',
                    referralList: [],
                    attendanceHistory: []
                });
            }
            // 1BW 지급 (기존에 받았어도 1로 보정, 못 받았으면 1로 설정)
            // 사용자 요청: "1BW만 지급된 상태" -> 이미 1BW라면 유지, 아니면 1로 설정
            // 여기서는 확실하게 1.0으로 설정합니다.
            bonusRecord.referralRewardStorage = '1.00000000000000000000000000000000000000000000000000';
            await bonusRecord.save();
            console.log('   보상 1BW 지급 완료');

            // 2-3. MiningState (기본 상태 생성)
            let miningState = await MiningState.findOne({ walletAddress: refereeAddress });
            if (!miningState) {
                miningState = new MiningState({
                    walletAddress: refereeAddress,
                    isMining: false,
                    accumulatedReward: '0.00000000000000000000000000000000000000000000000000',
                    currentBaseRate: '0.25000000000000000000000000000000000000000000000000',
                    currentTotalRate: '0.25000000000000000000000000000000000000000000000000',
                    referralCount: 0,
                    referralBonusRate: '0.00000000000000000000000000000000000000000000000000'
                });
                await miningState.save();
            }

            // 추천인 목록용 데이터 준비
            referralListForRecord.push({
                childWalletAddress: refereeAddress,
                joinedAt: user.createdAt || new Date(),
                accumulatedBonus: '0.00000000000000000000000000000000000000000000000000',
                isKycVerified: false,
                rewardStatus: 'PENDING'
            });
        }

        // 3. 추천인 데이터 일괄 업데이트
        console.log(`\n➡️ 추천인(${referrer.walletAddress}) 데이터 업데이트 중...`);

        // 3-1. BonusRecord 업데이트 (목록 3명, 보상 3BW)
        let refBonusRecord = await BonusRecord.findOne({ walletAddress: referrer.walletAddress });
        if (!refBonusRecord) {
            console.log('   BonusRecord 생성');
            refBonusRecord = new BonusRecord({ walletAddress: referrer.walletAddress });
        }

        refBonusRecord.referralList = referralListForRecord; // 3명 리스트 덮어쓰기
        refBonusRecord.referralRewardStorage = '3.00000000000000000000000000000000000000000000000000'; // 3BW
        await refBonusRecord.save();
        console.log('   BonusRecord: 가입자 3명 목록 갱신, 보상 3BW 설정 완료');

        // 3-2. MiningState 업데이트 (카운트 3, 보너스율 6%, 총 채굴률 재계산)
        let refMiningState = await MiningState.findOne({ walletAddress: referrer.walletAddress });
        if (!refMiningState) {
            console.log('   MiningState 생성');
            refMiningState = new MiningState({
                walletAddress: referrer.walletAddress,
                accumulatedReward: '0.00000000000000000000000000000000000000000000000000',
                currentBaseRate: '0.25000000000000000000000000000000000000000000000000'
            });
        }

        // 값 설정
        const referralCount = 3;
        const referralBonusRate = 0.06; // 6%

        refMiningState.referralCount = referralCount;
        refMiningState.referralBonusRate = referralBonusRate.toString(); // "0.06"

        // 총 채굴률 계산: Base * (1 + BonusRate)
        // 0.25 * (1 + 0.06) = 0.265
        const baseRate = new Decimal(refMiningState.currentBaseRate || '0.25');
        const totalRate = baseRate.mul(new Decimal(1).plus(referralBonusRate));

        refMiningState.currentTotalRate = totalRate.toString();

        await refMiningState.save();
        console.log('   MiningState 업데이트 완료:');
        console.log(`     - 추천인 수: ${refMiningState.referralCount}명`);
        console.log(`     - 보너스율: ${refMiningState.referralBonusRate} (6%)`);
        console.log(`     - 기본 채굴률: ${refMiningState.currentBaseRate}`);
        console.log(`     - 최종 채굴률: ${refMiningState.currentTotalRate} (0.25 * 1.06 = 0.265)`);

        console.log('\n✅ 모든 복구 작업이 성공적으로 완료되었습니다.');

    } catch (error) {
        console.error('❌ 에러 발생:', error);
    } finally {
        await mongoose.connection.close();
    }
}

fixReferralSystem();
