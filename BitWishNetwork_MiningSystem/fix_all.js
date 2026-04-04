const mongoose = require('mongoose');
const Decimal = require('decimal.js');

Decimal.set({ precision: 50 });

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';
const REFERRER_WALLET = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';

async function fixAll() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('=== 🔧 전체 수정 시작 ===\n');

        const MiningState = mongoose.model('MiningState', new mongoose.Schema({}, { strict: false }), 'miningstates');

        // 출석 보너스 + 추천 보너스 모두 적용
        const baseRate = new Decimal('0.25');
        const attendanceBonus = new Decimal('0.05'); // 5%
        const referralBonus = new Decimal('0.06'); // 6%

        const totalRate = baseRate
            .mul(new Decimal(1).plus(attendanceBonus))
            .mul(new Decimal(1).plus(referralBonus));

        console.log('계산:');
        console.log(`  0.25 * 1.05 * 1.06 = ${totalRate.toString()}`);

        const result = await MiningState.updateOne(
            { walletAddress: REFERRER_WALLET },
            {
                $set: {
                    currentTotalRate: totalRate.toString(),
                    isAttendanceActive: true,
                    attendanceDate: new Date()
                }
            }
        );

        console.log('\n업데이트 결과:', result);
        console.log('\n✅ 완료');
        console.log('   - currentTotalRate: 0.27825');
        console.log('   - isAttendanceActive: true');
        console.log('   - attendanceDate: 오늘');

    } catch (error) {
        console.error('❌ 오류:', error);
    } finally {
        await mongoose.disconnect();
    }
}

fixAll();
