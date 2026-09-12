import mongoose from 'mongoose';
import Decimal from 'decimal.js';

async function checkRealSupply() {
    await mongoose.connect('mongodb://localhost:27017/bitwish_mining');
    const db = mongoose.connection.db;
    if (!db) {
        console.error("DB null");
        return;
    }

    const miningStateAgg = await db.collection('miningstates').aggregate([
        { $group: { _id: null, total: { $sum: { $toDouble: "$accumulatedReward" } } } }
    ]).toArray();
    console.log("MiningState total:", miningStateAgg[0]?.total);

    const bonusRecordAgg = await db.collection('bonusrecords').aggregate([
        {
            $group: {
                _id: null,
                totalReferral: { $sum: { $toDouble: "$referralRewardStorage" } },
                totalBonus: { $sum: { $toDouble: "$referralBonusStorage" } }
            }
        }
    ]).toArray();
    console.log("BonusRecord referral total:", bonusRecordAgg[0]?.totalReferral);
    console.log("BonusRecord bonus total:", bonusRecordAgg[0]?.totalBonus);

    const settlementAgg = await db.collection('monthlysettlements').aggregate([
        { $group: { _id: null, total: { $sum: { $toDouble: "$totalAmount" } } } }
    ]).toArray();
    console.log("MonthlySettlement total:", settlementAgg[0]?.total);

    const totalMined = new Decimal(miningStateAgg[0]?.total || 0);
    const totalBonus = new Decimal(bonusRecordAgg[0]?.totalReferral || 0).plus(new Decimal(bonusRecordAgg[0]?.totalBonus || 0));
    const totalSettled = new Decimal(settlementAgg[0]?.total || 0);

    const total = totalMined.plus(totalBonus).plus(totalSettled);
    console.log("Calculated Total Supply:", total.toString());

    const networkDb = mongoose.connection.useDb('bitwish_network');
    const blockCount = await networkDb.collection('blocks').countDocuments({});
    console.log("Actual PoW Blocks Count in bitwish_network:", blockCount);

    await mongoose.disconnect();
}

checkRealSupply();
