const mongoose = require('mongoose');
const Decimal = require('decimal.js');

Decimal.set({ precision: 50 });

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';
const REFERRER_WALLET = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';

async function updateTotalRate() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('=== 📊 currentTotalRate 업데이트 시작 ===\n');

        const MiningState = mongoose.model('MiningState', new mongoose.Schema({}, { strict: false }), 'miningstates');

        const state = await MiningState.findOne({ walletAddress: REFERRER_WALLET });

        if (!state) {
            console.log('❌ MiningState를 찾을 수 없습니다.');
            process.exit(1);
        }

        console.log('현재 상태:');
        console.log(`  - currentBaseRate: ${state.currentBaseRate}`);
        console.log(`  - referralBonusRate: ${state.referralBonusRate}`);
        console.log(`  - isAttendanceActive: ${state.isAttendanceActive}`);
        console.log(`  - currentTotalRate (현재): ${state.currentTotalRate}\n`);

        // 계산: 0.25 * 1.05 * 1.06 = 0.27825
        const baseRate = new Decimal(state.currentBaseRate || '0.25');
        const attendanceBonus = state.isAttendanceActive ? new Decimal('0.05') : new Decimal('0');
        const referralBonus = new Decimal(state.referralBonusRate || '0');
        const partnerBonus = state.partnerStatus === 'REGISTERED' ? new Decimal('1.25') : new Decimal('0');

        const newTotalRate = baseRate
            .mul(new Decimal(1).plus(attendanceBonus))
            .mul(new Decimal(1).plus(referralBonus))
            .mul(new Decimal(1).plus(partnerBonus));

        console.log('계산 과정:');
        console.log(`  - baseRate: ${baseRate.toString()}`);
        console.log(`  - (1 + attendanceBonus): ${new Decimal(1).plus(attendanceBonus).toString()}`);
        console.log(`  - (1 + referralBonus): ${new Decimal(1).plus(referralBonus).toString()}`);
        console.log(`  - (1 + partnerBonus): ${new Decimal(1).plus(partnerBonus).toString()}`);
        console.log(`  - newTotalRate: ${newTotalRate.toString()}\n`);

        const result = await MiningState.updateOne(
            { walletAddress: REFERRER_WALLET },
            { $set: { currentTotalRate: newTotalRate.toString() } }
        );

        console.log('업데이트 결과:', result);
        console.log(`\n✅ currentTotalRate가 ${newTotalRate.toString()}로 업데이트되었습니다.`);

    } catch (error) {
        console.error('❌ 오류 발생:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n=== 작업 완료 ===');
    }
}

updateTotalRate();
