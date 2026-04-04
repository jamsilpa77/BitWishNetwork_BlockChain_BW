const mongoose = require('mongoose');
const modelSchema = new mongoose.Schema({
    walletAddress: String,
    referralList: Array,
    referralCount: Number,
    referralBonusRate: String,
    currentTotalRate: String,
    currentBaseRate: String,
    isAttendanceActive: Boolean
});
const MiningState = mongoose.model('MiningState', modelSchema);
const BonusRecord = mongoose.model('BonusRecord', modelSchema);

async function runCleanup() {
    await mongoose.connect('mongodb://localhost:27017/bitwish_mining');
    console.log('Step 1: 중복 지갑 주소 정화 시작...');

    const records = await BonusRecord.find({});
    for (let r of records) {
        const uniqueList = [];
        const seen = new Set();
        let changed = false;

        for (let item of r.referralList) {
            if (item.childWalletAddress && !seen.has(item.childWalletAddress)) {
                seen.add(item.childWalletAddress);
                uniqueList.push(item);
            } else {
                changed = true; // 중복 발견
            }
        }

        if (changed) {
            console.log(`중복 제거 대상 발견: ${r.walletAddress}`);
            r.referralList = uniqueList;
            await r.save();

            const ms = await MiningState.findOne({ walletAddress: r.walletAddress });
            if (ms) {
                // 명수와 보너스율을 실제 유니크한 가입자 수로 정규화
                ms.referralCount = uniqueList.length;
                ms.referralBonusRate = (uniqueList.length * 0.02).toFixed(8);

                // 보정률 재계계산 (0.25 * (1 + 보너스))
                const base = parseFloat(ms.currentBaseRate || '0.25');
                const bonus = 1 + (uniqueList.length * 0.02);
                ms.currentTotalRate = (base * bonus).toFixed(8);

                await ms.save();
                console.log(`정규화 완료: ${r.walletAddress} -> 명수: ${ms.referralCount}, 보너스: ${ms.referralBonusRate}`);
            }
        }
    }
    console.log('Step 1 완료.');
    process.exit(0);
}

runCleanup().catch(err => { console.error(err); process.exit(1); });
