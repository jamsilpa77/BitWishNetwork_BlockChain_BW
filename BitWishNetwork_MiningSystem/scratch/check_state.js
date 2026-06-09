const { MongoClient } = require('mongodb');
async function main() {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();

    // 1. MiningState 확인 - accumulatedReward vs lastBlockRewardThreshold
    const miningDb = client.db('bitwish_mining');
    const states = await miningDb.collection('miningstates').find({ isMining: true }).toArray();
    console.log('=== 채굴 중인 유저 상태 ===');
    states.forEach(s => {
        console.log(`  ${s.walletAddress}: reward=${s.accumulatedReward}, threshold=${s.lastBlockRewardThreshold}, isMining=${s.isMining}`);
    });

    // 2. 블록 수
    const netDb = client.db('bitwish_network');
    const blockCount = await netDb.collection('blocks').countDocuments({});
    console.log(`\n=== blocks 컬렉션: ${blockCount}개 (대시보드: ${blockCount + 30})`);

    await client.close();
}
main().catch(e => { console.error(e); process.exit(1); });
