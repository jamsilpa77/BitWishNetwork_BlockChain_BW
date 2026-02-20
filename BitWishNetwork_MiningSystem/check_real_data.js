const mongoose = require('mongoose');
const Decimal = require('decimal.js');
require('dotenv').config({ path: './.env' });

// 스키마 정의 (간소화)
const UserSchema = new mongoose.Schema({ walletAddress: String });
const MiningStateSchema = new mongoose.Schema({ accumulatedReward: String });
const BonusRecordSchema = new mongoose.Schema({ referralRewardStorage: String, bonusStorage: String });

const User = mongoose.model('User', UserSchema);
const MiningState = mongoose.model('MiningState', MiningStateSchema);
const BonusRecord = mongoose.model('BonusRecord', BonusRecordSchema);

async function checkData() {
    try {
        await mongoose.connect('mongodb://localhost:27017/bitwish_mining');
        console.log('✅ Connected to MongoDB');

        // 1. 유저 수 확인
        const userCount = await User.countDocuments({});
        console.log(`\n🧐 [지갑 수] DB 저장된 유저 수: ${userCount} 명`);

        // 2. 보너스 레코드 전수 조사
        const bonuses = await BonusRecord.find({});
        console.log(`\n🧐 [보너스 레코드] 총 ${bonuses.length} 건 발견`);

        let totalReferral = new Decimal(0);
        let totalBonus = new Decimal(0);

        bonuses.forEach((b, idx) => {
            console.log(`   [${idx + 1}] 추천보상: ${b.referralRewardStorage}, 보너스: ${b.bonusStorage}`);
            totalReferral = totalReferral.plus(new Decimal(b.referralRewardStorage || 0));
            totalBonus = totalBonus.plus(new Decimal(b.bonusStorage || 0));
        });

        const totalIssued = totalReferral.plus(totalBonus);
        console.log(`\n💰 [DB 계산 결과] 총 발행량 서류상 합계: ${totalIssued.toString()} BW`);
        console.log(`   - (관리자님 예상값 8BW와 비교 필요)`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkData();
