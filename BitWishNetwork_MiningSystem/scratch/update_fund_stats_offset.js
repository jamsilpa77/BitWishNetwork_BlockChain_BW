const { MongoClient } = require('mongodb');

async function run() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const networkDb = client.db('bitwish_network');
        const statsCollection = networkDb.collection('network_stats');

        const stats = await statsCollection.findOne({ id: 'global_fund_stats' });
        console.log('Before update:', stats);

        if (stats) {
            // 현재 수수료에 30개 추천 블록 수수료(0.030 BW)를 정밀하게 더해줌
            const Decimal = require('decimal.js');
            const currentEco = new Decimal(stats.ecosystemFund || '0');
            const currentFound = new Decimal(stats.foundationFund || '0');
            const currentFees = new Decimal(stats.totalAccumulatedFees || '0');

            const nextEco = currentEco.plus('0.018').toString(); // 30 * 0.0006
            const nextFound = currentFound.plus('0.012').toString(); // 30 * 0.0004
            const nextFees = currentFees.plus('0.030').toString(); // 30 * 0.0010

            await statsCollection.updateOne(
                { id: 'global_fund_stats' },
                {
                    $set: {
                        ecosystemFund: nextEco,
                        foundationFund: nextFound,
                        totalAccumulatedFees: nextFees,
                        lastUpdatedAt: Date.now()
                    }
                }
            );

            const updatedStats = await statsCollection.findOne({ id: 'global_fund_stats' });
            console.log('After update:', updatedStats);
        } else {
            console.log('global_fund_stats document not found!');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

run();
