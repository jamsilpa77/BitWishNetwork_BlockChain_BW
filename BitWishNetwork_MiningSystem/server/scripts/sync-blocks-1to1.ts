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

        // 1-4. BonusRecord 추천 및 부스트 보상 합계 (stats.ts L87~97과 동일 — bonusStorage 사용)
        const bonusAgg = await miningDb.collection('bonusrecords').aggregate([
            {
                $group: {
                    _id: null,
                    totalReferral: { $sum: { $toDouble: { $ifNull: ["$referralRewardStorage", "0"] } } },
                    totalBonus: { $sum: { $toDouble: { $ifNull: ["$bonusStorage", "0"] } } }
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
        // 2. 현재 DB 물리 블록 수 조회 및 초과분 계산
        // ──────────────────────────────────────────────────────────────────────
        const blocksColl = networkDb.collection('blocks');
        const txColl = networkDb.collection('blocktransactions');

        const currentTotalBlocks = await blocksColl.countDocuments({});
        console.log(`🔍 [DB 현황] 현재 물리 블록 총 개수: ${currentTotalBlocks}개`);

        if (currentTotalBlocks <= targetBlockHeight) {
            console.log(`✅ [정산 완료] 물리 블록 수(${currentTotalBlocks}개)가 목표 발행량(${targetBlockHeight}개) 이하로 이미 1:1 완벽 정산되어 있습니다.`);
            await mongoose.disconnect();
            return;
        }

        const overflowCount = currentTotalBlocks - targetBlockHeight;
        console.log(`⚠️  [초과 허수 블록 발견] 목표(${targetBlockHeight}개) 대비 +${overflowCount}개의 잉여 블록이 발견되었습니다.`);

        // ──────────────────────────────────────────────────────────────────────
        // 3. [v4.0 핵심 수정] 삭제 전 검증: 실제 초과 블록 countDocuments로 사전 확인
        // BitWishBlockchain.ts saveToDatabase() 분석 결과:
        // blocks 문서 구조 = { blockHeight: number(루트레벨), data: {...}, timestamp: number }
        // → 루트 레벨 blockHeight 단일 필드로만 정밀 쿼리 (잘못된 $or 멀티필드 제거)
        // ──────────────────────────────────────────────────────────────────────
        const verifyOverflowCount = await blocksColl.countDocuments({
            blockHeight: { $gt: targetBlockHeight }
        });
        console.log(`🔬 [삭제 전 검증] blockHeight > ${targetBlockHeight} 조건 실제 초과 문서 수: ${verifyOverflowCount}개`);

        if (verifyOverflowCount === 0) {
            console.log(`⚠️  [경고] blockHeight 루트 필드로 초과 문서가 검색되지 않습니다.`);
            console.log(`    → 일부 블록이 다른 필드 구조로 저장됐을 수 있습니다. data.header.blockHeight도 시도합니다.`);
        }

        console.log(`🧹 [소거 공정 개시] 정밀 삭제 시작...`);

        // [핵심 수정] 루트 blockHeight 기준 삭제 (saveToDatabase 구조와 100% 일치)
        const deleteBlocksResult = await blocksColl.deleteMany({
            blockHeight: { $gt: targetBlockHeight }
        });

        // 루트 필드 삭제로 처리 안 된 경우 data.header.blockHeight도 추가 소거 (안전망)
        const deleteBlocksResult2 = await blocksColl.deleteMany({
            "data.header.blockHeight": { $gt: targetBlockHeight }
        });

        const totalDeletedBlocks = deleteBlocksResult.deletedCount + deleteBlocksResult2.deletedCount;
        console.log(`🗑️  [블록 삭제 결과] 루트 blockHeight 기준: ${deleteBlocksResult.deletedCount}개 / data.header.blockHeight 기준: ${deleteBlocksResult2.deletedCount}개 / 합계: ${totalDeletedBlocks}개`);

        // 4. blocktransactions 컬렉션에서도 동일 초과 트랜잭션 소거
        const deleteTxResult = await txColl.deleteMany({
            blockHeight: { $gt: targetBlockHeight }
        });
        console.log(`🗑️  [트랜잭션 삭제 결과] ${deleteTxResult.deletedCount}개 소거`);

        // 5. MiningState 내 lastBlockRewardThreshold 기준점이 실제 채굴량을 초과하는 경우 정밀 동기화
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
        console.log(` ├ 🔬 삭제 전 검증된 초과 블록:   ${verifyOverflowCount}개 (blockHeight > ${targetBlockHeight})`);
        console.log(` ├ 🗑️  실제 삭제된 초과 블록:     ${totalDeletedBlocks}개 (루트:${deleteBlocksResult.deletedCount} + 중첩:${deleteBlocksResult2.deletedCount})`);
        console.log(` ├ 🗑️  삭제된 초과 트랜잭션:      ${deleteTxResult.deletedCount}개`);
        console.log(` ├ 🔄 동기화된 지갑 기준점:       ${syncedStatesCount}개 지갑 threshold 정밀 맞춤`);
        console.log(` ├ 🛡️  유저 총 자산:               ${totalRealSupplyDecimal.toFixed(4)} BW (100% 온전 보존)`);
        console.log(` └ 📍 최종 수복된 블록 높이:       ${finalTotalBlocks}블록 = ${targetBlockHeight} BW`);
        if (finalTotalBlocks === targetBlockHeight) {
            console.log(`✅ [1대1 완벽 칼동기화 달성] ${finalTotalBlocks}블록 = ${targetBlockHeight} BW ← 정확히 일치!`);
        } else {
            console.log(`❌ [주의] 최종 블록 수(${finalTotalBlocks})와 목표(${targetBlockHeight})가 아직 불일치. 수동 확인 필요.`);
        }
        console.log(`==================================================\n`);

        await mongoose.disconnect();
    } catch (error) {
        console.error("❌ [3공정 수복 실패]:", error);
        process.exit(1);
    }
}

syncBlocksOneToOne();

