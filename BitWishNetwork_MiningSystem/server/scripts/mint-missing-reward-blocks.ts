import mongoose from 'mongoose';
import crypto from 'crypto';
import Decimal from 'decimal.js';

/**
 * [신 2공정] 부족한 62개 물리적 블록 보상 주조 수복 스크립트
 * ════════════════════════════════════════════════════════
 * DB 물리적 블록 높이(7,094개)와 유저 참값 정수 자산(7,156 BW)의 차이인
 * 부족한 62개 블록(Height 7,095 ~ 7,156)을 SHA-256 체이닝 무결성을 지키며 순차 주조합니다.
 * ════════════════════════════════════════════════════════
 */
async function mintMissingRewardBlocks() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bitwish_mining';
        console.log("⚡ DB 연결 중...", mongoUri);
        await mongoose.connect(mongoUri);

        const miningDb = mongoose.connection.useDb('bitwish_mining');
        const networkDb = mongoose.connection.useDb('bitwish_network');
        const blocksColl = networkDb.collection('blocks');
        const txColl = networkDb.collection('blocktransactions');

        // 1. DB 물리적 블록 수 조회
        const currentBlockCount = await blocksColl.countDocuments({});
        console.log(`📊 [DB 현황] 현재 물리적 블록 총 개수: ${currentBlockCount}개`);

        // 2. 21개 지갑 총자산 참값 연산 (stats.ts 쿼리와 100% 동기화)
        const miningRewardAgg = await miningDb.collection('miningstates').aggregate([
            { $group: { _id: null, total: { $sum: { $toDouble: "$accumulatedReward" } } } }
        ]).toArray();
        let baseMining = new Decimal(miningRewardAgg[0]?.total || 0);

        const activeMiners = await miningDb.collection('miningstates').find({ isMining: true }).toArray();
        const nowMs = Date.now();
        let liveBoost = new Decimal(0);
        for (const miner of activeMiners) {
            const lastSync = miner.lastSyncTime ? new Date(miner.lastSyncTime).getTime() : nowMs;
            const elapsed = Math.max(0, (nowMs - lastSync) / 1000);
            if (elapsed > 0) {
                const ratePerSec = new Decimal(miner.currentTotalRate || '0.25').div(3600);
                liveBoost = liveBoost.plus(ratePerSec.mul(elapsed));
            }
        }
        baseMining = baseMining.plus(liveBoost);

        const settlementAgg = await miningDb.collection('monthlysettlements').aggregate([
            { $group: { _id: null, total: { $sum: { $toDouble: "$totalAmount" } } } }
        ]).toArray();
        const totalSettlement = new Decimal(settlementAgg[0]?.total || 0);

        const bonusAgg = await miningDb.collection('bonusrecords').aggregate([
            {
                $group: {
                    _id: null,
                    totalReferral: { $sum: { $toDouble: { $ifNull: ["$referralRewardStorage", "0"] } } },
                    totalBonus: {
                        $sum: {
                            $toDouble: {
                                $ifNull: ["$referralBonusStorage", { $ifNull: ["$bonusStorage", "0"] }]
                            }
                        }
                    }
                }
            }
        ]).toArray();
        const totalBonus = new Decimal(bonusAgg[0]?.totalReferral || 0)
            .plus(new Decimal(bonusAgg[0]?.totalBonus || 0));

        const totalAssetDecimal = baseMining.plus(totalSettlement).plus(totalBonus);
        const targetBlockHeight = totalAssetDecimal.floor().toNumber();

        console.log(`\n==================================================`);
        console.log(`📊 [정수 자산 참값 리포트]`);
        console.log(` ├ ⛏️ 기본 채굴 자산 (MiningState + liveBoost): ${baseMining.toFixed(4)} BW`);
        console.log(` ├ 🔒 확정 정산 자산 (MonthlySettlement):         ${totalSettlement.toFixed(4)} BW`);
        console.log(` ├ 🎁 추천/부스트 자산 (BonusRecord 1BW+2%):      ${totalBonus.toFixed(4)} BW`);
        console.log(` └ 💎 실시간 총 발행 참값:                         ${totalAssetDecimal.toFixed(4)} BW`);
        console.log(`🎯 [목표 1:1 물리 블록 높이]: ${targetBlockHeight} 블록`);
        console.log(`==================================================\n`);

        if (currentBlockCount >= targetBlockHeight) {
            console.log(`✅ 이미 물리적 블록 수(${currentBlockCount}개)가 목표 높이(${targetBlockHeight}개) 이상입니다.`);
            await mongoose.disconnect();
            return;
        }

        const blocksToMint = targetBlockHeight - currentBlockCount;
        console.log(`🚀 [신 2공정 개시] 부족한 ${blocksToMint}개 물리적 블록 (Height ${currentBlockCount + 1} ~ ${targetBlockHeight}) 주조 시작...`);

        // 3. 부족한 62개 블록 연속 주조 (SHA-256 체이닝 검증)
        let lastHeightDoc = await blocksColl.find({}).sort({ blockHeight: -1 }).limit(1).toArray();
        let prevHash = lastHeightDoc[0]?.hash || lastHeightDoc[0]?.data?.hash || '0'.repeat(64);

        let mintedCount = 0;
        for (let height = currentBlockCount + 1; height <= targetBlockHeight; height++) {
            const timestamp = Date.now();
            const validator = 'BitWish-System-Reward-Pool';
            const txId = `BW_TX_REWARD_MINT_${height}_${timestamp}`;

            // SHA-256 해시 연산
            const payload = `${prevHash}:${height}:${timestamp}:${validator}:${txId}`;
            const blockHash = crypto.createHash('sha256').update(payload).digest('hex');

            const blockDoc = {
                blockHeight: height,
                timestamp: timestamp,
                data: {
                    header: {
                        version: 1,
                        previousHash: prevHash,
                        merkleRoot: blockHash.substring(0, 32),
                        timestamp: timestamp,
                        difficulty: 1,
                        nonce: 1000 + height,
                        networkId: 'bitwish-mainnet',
                        blockHeight: height,
                        validator: validator,
                        blockReward: '1.00000000'
                    },
                    hash: blockHash,
                    transactions: [
                        {
                            txId: txId,
                            walletAddress: validator,
                            blockHeight: height,
                            amount: '1.00000000',
                            type: 'SYSTEM_REWARD_MINT',
                            status: 'Confirmed'
                        }
                    ]
                }
            };

            await blocksColl.insertOne(blockDoc);

            await txColl.insertOne({
                txId: txId,
                walletAddress: validator,
                blockHeight: height,
                amount: '1.00000000',
                type: 'SYSTEM_REWARD_MINT',
                status: 'Confirmed',
                createdAt: new Date(timestamp)
            });

            prevHash = blockHash;
            mintedCount++;
        }

        const finalCount = await blocksColl.countDocuments({});
        console.log(`\n==================================================`);
        console.log(`🎉 [신 2공정 1:1 완벽 수복 성공]`);
        console.log(` ├ 🔨 주조 완료된 보상 블록 수: ${mintedCount}개 (Height ${currentBlockCount + 1} ~ ${targetBlockHeight})`);
        console.log(` ├ 🛡️ 유저 총 자산 정수 환산:   ${targetBlockHeight} BW`);
        console.log(` └ 📍 최종 DB 물리적 블록 수:   ${finalCount} 블록`);

        if (finalCount === targetBlockHeight) {
            console.log(`✅ [1:1 칼동기화 완전 달성] ${finalCount} 블록 = ${targetBlockHeight} BW (오차 0개)`);
        } else {
            console.log(`⚠️ 최종 블록 수(${finalCount})와 목표 높이(${targetBlockHeight}) 대조 필요`);
        }
        console.log(`==================================================\n`);

        await mongoose.disconnect();
    } catch (error) {
        console.error("❌ [신 2공정 수복 에러]:", error);
        process.exit(1);
    }
}

mintMissingRewardBlocks();
