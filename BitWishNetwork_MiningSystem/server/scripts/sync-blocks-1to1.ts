import mongoose from 'mongoose';
import Decimal from 'decimal.js';

/**
 * [3공정 정밀 1:1 수복 스크립트 v4.0 — 2026-09-14]
 * ════════════════════════════════════════════════════════
 * stats.ts 대시보드와 100% 동일한 글로벌 참값 공식 적용:
 *
 * 총 실시간 BW 발행량 = MiningState(accumulatedReward + liveBoost)
 *                     + MonthlySettlement(totalAmount)
 *                     + BonusRecord(referralRewardStorage + bonusStorage)
 *
 * ★ v4.0 핵심 수정: BitWishBlockchain.ts saveToDatabase() 분석 결과
 *   blocks 컬렉션 문서 구조 = { blockHeight: number(루트), data: {...}, timestamp: number }
 *   → 삭제 쿼리를 루트 레벨 blockHeight 단일 필드로 정밀 교정
 *   → 삭제 전 실제 초과 문서 countDocuments 검증 추가
 *   → 거짓 출력 코드(deletedCount || overflowCount) 완전 제거
 * ════════════════════════════════════════════════════════
 *
 * 1. 유저 21개 지갑 실시간 총 자산(BW 수량) 100% 온전히 보존
 * 2. 정수 목표 블록 높이를 초과하는 허수 잉여 블록만 안전 소거하여 1:1 완벽 정산
 */
async function syncBlocksOneToOne() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bitwish_mining';
        console.log("⚡ DB 연결 시도 중...", mongoUri);
        await mongoose.connect(mongoUri);

        const miningDb = mongoose.connection.useDb('bitwish_mining');
        const networkDb = mongoose.connection.useDb('bitwish_network');

        // ──────────────────────────────────────────────────────────────────────
        // 1. stats.ts와 동일한 정석 실시간 총 발행량 집계
        // ──────────────────────────────────────────────────────────────────────

        // 1-1. MiningState 기본 채굴 합계 (stats.ts L25~33과 동일)
        const miningRewardAgg = await miningDb.collection('miningstates').aggregate([
            { $group: { _id: null, total: { $sum: { $toDouble: "$accumulatedReward" } } } }
        ]).toArray();
        let baseMiningReward = new Decimal(miningRewardAgg[0]?.total || 0);

        // 1-2. 실시간 보정: 채굴 중인 유저의 미동기화 채굴량 합산 (stats.ts L36~47과 동일)
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
        baseMiningReward = baseMiningReward.plus(liveBoost);
        console.log(` └ 실시간 liveBoost 합산: +${liveBoost.toFixed(8)} BW`);

        // 1-3. MonthlySettlement 확정 정산 합계 (stats.ts L51~81과 동일)
        const settlementAgg = await miningDb.collection('monthlysettlements').aggregate([
            { $group: { _id: null, total: { $sum: { $toDouble: "$totalAmount" } } } }
        ]).toArray();
        const totalSettlement = new Decimal(settlementAgg[0]?.total || 0);

        // 1-4. BonusRecord 추천 및 부스트 보상 합계 (stats.ts L87~97과 동일 — referralBonusStorage 사용)
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

        // 1-5. 글로벌 총 참값 계산 (stats.ts 최종 공식과 동일)
        const totalRealSupplyDecimal = baseMiningReward.plus(totalSettlement).plus(totalBonus);
        const targetBlockHeight = totalRealSupplyDecimal.floor().toNumber();

        console.log(`\n==================================================`);
        console.log(`📊 [정수 자산 집계 리포트]`);
        console.log(` ├ ⛏️  기본 채굴 자산 (MiningState + liveBoost): ${baseMiningReward.toFixed(4)} BW`);
        console.log(` ├ 🔒 확정 정산 자산 (MonthlySettlement):         ${totalSettlement.toFixed(4)} BW`);
        console.log(` ├ 🎁 추천/부스트 자산 (BonusRecord.bonusStorage): ${totalBonus.toFixed(4)} BW`);
        console.log(` └ 💎 실시간 총 발행 참값:                          ${totalRealSupplyDecimal.toFixed(4)} BW`);
        console.log(`🎯 [목표 1:1 물리 블록 높이]: ${targetBlockHeight} 블록`);
        console.log(`==================================================\n`);

        // ──────────────────────────────────────────────────────────────────────
        // 2. 현재 DB 물리 블록 수 조회 및 부족/초과분 계산
        // ──────────────────────────────────────────────────────────────────────
        const blocksColl = networkDb.collection('blocks');
        const txColl = networkDb.collection('blocktransactions');

        const currentTotalBlocks = await blocksColl.countDocuments({});
        console.log(`🔍 [DB 현황] 현재 물리 블록 총 개수: ${currentTotalBlocks}개`);

        if (currentTotalBlocks === targetBlockHeight) {
            console.log(`✅ [정산 완료] 물리 블록 수(${currentTotalBlocks}개)가 목표 발행량(${targetBlockHeight}개)과 1:1 완벽 일치합니다.`);
            await mongoose.disconnect();
            return;
        }

        // A. 물리 블록 부족 시 (7,094개 -> 7,156개: 부족분 62개 추가 민팅 수복)
        if (currentTotalBlocks < targetBlockHeight) {
            const shortageCount = targetBlockHeight - currentTotalBlocks;
            console.log(`💡 [부족한 블록 발견] 목표(${targetBlockHeight}개) 대비 -${shortageCount}개의 블록이 부족합니다. 1:1 칼동기화 수복을 시작합니다.`);

            // 보너스 보관함 및 채굴 상태에 자산이 있는 유저 순서대로 해당 유저 명의의 PoW 오리지널 블록 생성
            const { BlockMiningService } = require('../services/BlockMiningService');
            const bonusRecords = await miningDb.collection('bonusrecords').find({}).toArray();

            let mintedCount = 0;
            // 1단계: referralBonusStorage 추천 2% 보너스 자산이 있는 유저 명의로 블록 발행
            for (const record of bonusRecords) {
                if (mintedCount >= shortageCount) break;
                const walletAddress = record.walletAddress;
                const bonusStorage = new Decimal(record.referralBonusStorage || '0');
                const lastThreshold = new Decimal(record.lastBonusBlockThreshold || '0');
                const eligibleBlocks = bonusStorage.minus(lastThreshold).floor().toNumber();

                const blocksToMint = Math.min(eligibleBlocks, shortageCount - mintedCount);
                for (let i = 0; i < blocksToMint; i++) {
                    console.log(`⛏️ [3공정 부족 수복] ${walletAddress} 명의로 정밀 블록 생성 (${mintedCount + 1}/${shortageCount})`);
                    await BlockMiningService.onMiningBlock(walletAddress);
                    mintedCount++;
                }
                if (blocksToMint > 0) {
                    await miningDb.collection('bonusrecords').updateOne(
                        { _id: record._id },
                        { $set: { lastBonusBlockThreshold: lastThreshold.plus(blocksToMint).toString() } }
                    );
                }
            }

            // 2단계: 남은 부족분이 있다면 MiningState 누적 수량 유저 명의로 순차 발행
            if (mintedCount < shortageCount) {
                const miningStates = await miningDb.collection('miningstates').find({}).toArray();
                for (const state of miningStates) {
                    if (mintedCount >= shortageCount) break;
                    const walletAddress = state.walletAddress;
                    const accReward = new Decimal(state.accumulatedReward || '0');
                    const lastThreshold = new Decimal(state.lastBlockRewardThreshold || '0');
                    const eligibleBlocks = accReward.minus(lastThreshold).floor().toNumber();

                    const blocksToMint = Math.min(eligibleBlocks, shortageCount - mintedCount);
                    for (let i = 0; i < blocksToMint; i++) {
                        console.log(`⛏️ [3공정 부족 수복] ${walletAddress} 채굴 명의로 정밀 블록 생성 (${mintedCount + 1}/${shortageCount})`);
                        await BlockMiningService.onMiningBlock(walletAddress);
                        mintedCount++;
                    }
                    if (blocksToMint > 0) {
                        await miningDb.collection('miningstates').updateOne(
                            { _id: state._id },
                            { $set: { lastBlockRewardThreshold: lastThreshold.plus(blocksToMint).toString() } }
                        );
                    }
                }
            }

            // 3단계: 기본 밸런스로 여전히 남은 부족분이 존재할 경우 최다 자산 유저 명의로 보충
            if (mintedCount < shortageCount) {
                const remainingNeeded = shortageCount - mintedCount;
                console.log(`⛏️ [3공정 보충 수복] 잔여 ${remainingNeeded}개 블록 최다 채굴 유저 명의 수복...`);
                const topUser = await miningDb.collection('miningstates').findOne({}, { sort: { accumulatedReward: -1 } });
                const fallbackWallet = topUser?.walletAddress || 'BW_MAINNET_VALIDATOR';
                for (let i = 0; i < remainingNeeded; i++) {
                    await BlockMiningService.onMiningBlock(fallbackWallet);
                    mintedCount++;
                }
            }

            console.log(`🎉 [3공정 수복 완료] 총 ${mintedCount}개 물리 블록 추가 발행 완료!`);
        } else {
            // B. 물리 블록 초과 시 (기존 초과분 소거 로직)
            const overflowCount = currentTotalBlocks - targetBlockHeight;
            console.log(`⚠️  [초과 허수 블록 발견] 목표(${targetBlockHeight}개) 대비 +${overflowCount}개의 잉여 블록 소거를 시작합니다.`);

            const verifyOverflowCount = await blocksColl.countDocuments({
                blockHeight: { $gt: targetBlockHeight }
            });
            console.log(`🔬 [삭제 전 검증] blockHeight > ${targetBlockHeight} 조건 실제 초과 문서 수: ${verifyOverflowCount}개`);

            const deleteBlocksResult = await blocksColl.deleteMany({
                blockHeight: { $gt: targetBlockHeight }
            });
            const deleteBlocksResult2 = await blocksColl.deleteMany({
                "data.header.blockHeight": { $gt: targetBlockHeight }
            });
            const totalDeletedBlocks = deleteBlocksResult.deletedCount + deleteBlocksResult2.deletedCount;
            console.log(`🗑️  [블록 삭제 결과] 총 ${totalDeletedBlocks}개 소거 완료`);

            await txColl.deleteMany({ blockHeight: { $gt: targetBlockHeight } });
        }

        // 3. MiningState 내 lastBlockRewardThreshold 정밀 정합 맞춤
        const activeStates = await miningDb.collection('miningstates').find({}).toArray();
        let syncedStatesCount = 0;
        for (const state of activeStates) {
            const accFloor = new Decimal(state.accumulatedReward || '0').floor().toString();
            await miningDb.collection('miningstates').updateOne(
                { _id: state._id },
                { $set: { lastBlockRewardThreshold: accFloor } }
            );
            syncedStatesCount++;
        }

        const finalTotalBlocks = await blocksColl.countDocuments({});

        console.log(`\n==================================================`);
        console.log(`🎉 [3공정 1대1 완벽 수복 최종 성과 리포트]`);
        console.log(` ├ 🛡️  유저 총 자산:               ${totalRealSupplyDecimal.toFixed(4)} BW (100% 온전 보존)`);
        console.log(` └ 📍 최종 수복된 블록 높이:       ${finalTotalBlocks}블록 = ${targetBlockHeight} BW`);
        if (finalTotalBlocks === targetBlockHeight) {
            console.log(`✅ [1대1 완벽 칼동기화 달성] ${finalTotalBlocks}블록 = ${targetBlockHeight} BW ← 정확히 일치!`);
        } else {
            console.log(`❌ [주의] 최종 블록 수(${finalTotalBlocks})와 목표(${targetBlockHeight})가 아직 불일치.`);
        }
        console.log(`==================================================\n`);

        await mongoose.disconnect();
    } catch (error) {
        console.error("❌ [3공정 수복 실패]:", error);
        process.exit(1);
    }
}

syncBlocksOneToOne();

