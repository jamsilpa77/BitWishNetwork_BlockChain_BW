const { MongoClient } = require('mongodb');
const Decimal = require('decimal.js');

async function runOneTimeCleanup() {
    try {
        const client = new MongoClient('mongodb://localhost:27017');
        await client.connect();
        
        const miningDb = client.db('bitwish_mining');
        const networkDb = client.db('bitwish_network');
        
        console.log("🚨 [독립 수복 스크립트] DB 무결점 정리 시작...");
        
        // 1. bitwish_network.blocks 에서 blockHeight > 0 인 모든 블록 제거 (제네시스 0번만 남김)
        const blockDeleteResult = await networkDb.collection('blocks').deleteMany({ blockHeight: { $gt: 0 } });
        console.log(`👉 초과 생성된 블록 ${blockDeleteResult.deletedCount}개 삭제 완료.`);
        
        // 2. bitwish_network.accounts 에서 3대 파이낸셜 풀 계정을 제외한 모든 계정의 잔액을 '0.0'으로 안전하게 리셋
        const allowedAccounts = ['BitWish-Miner-Pool', 'BitWish-Partner-Pool', 'BitWish-Foundation'];
        const accountResetResult = await networkDb.collection('accounts').updateMany(
            { address: { $nin: allowedAccounts } },
            { $set: { balance: '0.0', lastActivity: Date.now() } }
        );
        console.log(`👉 블록체인 유저 계정 ${accountResetResult.modifiedCount}개 잔액 안전 리셋 완료.`);
        
        // 3. 3대 파이낸셜 풀 계정의 잔액을 제네시스 주입 비율로 원상복구
        const totalSupply = new Decimal('21000000000');
        const minerPoolBalance = totalSupply.mul(0.65).toString();
        const partnerPoolBalance = totalSupply.mul(0.15).toString();
        const foundationBalance = totalSupply.mul(0.20).toString();
        
        await networkDb.collection('accounts').updateOne(
            { address: 'BitWish-Miner-Pool' },
            { $set: { balance: minerPoolBalance, lastActivity: Date.now() } },
            { upsert: true }
        );
        await networkDb.collection('accounts').updateOne(
            { address: 'BitWish-Partner-Pool' },
            { $set: { balance: partnerPoolBalance, lastActivity: Date.now() } },
            { upsert: true }
        );
        await networkDb.collection('accounts').updateOne(
            { address: 'BitWish-Foundation' },
            { $set: { balance: foundationBalance, lastActivity: Date.now() } },
            { upsert: true }
        );
        console.log("👉 제네시스 3대 파이낸셜 자산 금고 100% 원상복구 완료.");
        
        // 4. bitwish_network.network_stats 의 기금 상태 초기화 (30개 추천 보상 블록 수수료 반영)
        await networkDb.collection('network_stats').updateOne(
            { id: 'global_fund_stats' },
            {
                $set: {
                    ecosystemFund: '0.018',
                    foundationFund: '0.012',
                    totalAccumulatedFees: '0.03',
                    lastUpdatedAt: Date.now()
                }
            },
            { upsert: true }
        );
        console.log("👉 생태계 기금 및 글로벌 펀드 수수료 30블록분(0.03 BW) 반영하여 초기화 완료.");
        
        // 5. bitwish_mining.miningstates 에서 모든 유저의 accumulatedReward를 0으로 맞추고 lastBlockRewardThreshold 필드 삭제
        const miningStateUpdateResult = await miningDb.collection('miningstates').updateMany(
            {},
            {
                $set: {
                    accumulatedReward: '0.0',
                    isMining: false,
                    miningStartTime: null,
                    lastSyncTime: new Date()
                },
                $unset: {
                    lastBlockRewardThreshold: ""
                }
            }
        );
        console.log(`👉 마이닝 상태 ${miningStateUpdateResult.modifiedCount}개 초기화 및 기준값(lastBlockRewardThreshold) 제거 완료.`);
        
        // 완료 플래그 기록
        const configColl = miningDb.collection('system_configs');
        await configColl.updateOne(
            { id: 'one_time_cleanup_v3' },
            { $set: { completed: true, updatedAt: new Date() } },
            { upsert: true }
        );
        
        console.log("✅ [독립 수복 스크립트] 일회성 블록 수복 및 자산 정리 무결점 완료!");
        await client.close();
    } catch (cleanupError) {
        console.error("❌ 에러 발생:", cleanupError);
    }
}

runOneTimeCleanup();
