const { MongoClient } = require('mongodb');
async function main() {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const db = client.db('bitwish_mining');

    // 1. MiningState - accumulatedReward 총합
    const miningAgg = await db.collection('miningstates').aggregate([
        { $group: { _id: null, total: { $sum: { $toDouble: "$accumulatedReward" } } } }
    ]).toArray();
    console.log('=== MiningState 총 accumulatedReward:', miningAgg[0]?.total || 0);

    // 2. BonusRecord - referralRewardStorage + bonusStorage
    const bonusAgg = await db.collection('bonusrecords').aggregate([
        { $group: { _id: null, totalRef: { $sum: { $toDouble: "$referralRewardStorage" } }, totalBonus: { $sum: { $toDouble: "$bonusStorage" } } } }
    ]).toArray();
    console.log('=== BonusRecord referralRewardStorage 총합:', bonusAgg[0]?.totalRef || 0);
    console.log('=== BonusRecord bonusStorage 총합:', bonusAgg[0]?.totalBonus || 0);
    console.log('=== BonusRecord 합산 (referral + bonus):', (bonusAgg[0]?.totalRef || 0) + (bonusAgg[0]?.totalBonus || 0));

    // 3. MonthlySettlement
    const settlementAgg = await db.collection('monthlysettlements').aggregate([
        { $group: { _id: null, locked: { $sum: { $cond: [{ $in: ["$migrationStatus", ["LOCKED", "WAITING_KYC"]] }, { $toDouble: "$totalAmount" }, 0] } }, released: { $sum: { $cond: [{ $in: ["$migrationStatus", ["UNLOCKED", "MIGRATED"]] }, { $toDouble: "$totalAmount" }, 0] } } } }
    ]).toArray();
    console.log('=== MonthlySettlement locked:', settlementAgg[0]?.locked || 0);
    console.log('=== MonthlySettlement released:', settlementAgg[0]?.released || 0);

    // 4. 합산
    const miningTotal = miningAgg[0]?.total || 0;
    const bonusTotal = (bonusAgg[0]?.totalRef || 0) + (bonusAgg[0]?.totalBonus || 0);
    const settlementTotal = (settlementAgg[0]?.locked || 0) + (settlementAgg[0]?.released || 0);
    const grandTotal = miningTotal + bonusTotal + settlementTotal;
    console.log('\n=== 최종 currentIssued 계산 ===');
    console.log('채굴 보상 (miningStates):', miningTotal);
    console.log('+ liveBoost (실시간 미동기화): 별도 계산됨');
    console.log('+ 정산 (settlement):', settlementTotal);
    console.log('= totalMiningReward:', miningTotal + settlementTotal);
    console.log('+ 보너스 보상 (bonusRecords):', bonusTotal);
    console.log('= currentIssued (currentSupply):', grandTotal);

    await client.close();
}
main().catch(e => { console.error(e); process.exit(1); });
