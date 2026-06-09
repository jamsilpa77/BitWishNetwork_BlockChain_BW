const { MongoClient } = require('mongodb');
const Decimal = require('decimal.js');

async function main() {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const db = client.db('bitwish_mining');

    // 모든 MiningState 조회
    const states = await db.collection('miningstates').find({}).toArray();
    
    console.log('=== 기존 유저 lastBlockRewardThreshold 초기화 ===');
    
    for (const state of states) {
        const accumulated = new Decimal(state.accumulatedReward || '0');
        // 현재 누적 보상의 정수 부분 = 이미 넘긴 1BW 경계 수
        const threshold = accumulated.floor().toString();
        
        console.log(`${state.walletAddress}: accumulatedReward=${accumulated.toFixed(4)}, threshold 설정: ${threshold}`);
        
        await db.collection('miningstates').updateOne(
            { _id: state._id },
            { $set: { lastBlockRewardThreshold: threshold } }
        );
    }
    
    console.log('\n✅ 초기화 완료');
    await client.close();
}
main().catch(e => { console.error(e); process.exit(1); });
