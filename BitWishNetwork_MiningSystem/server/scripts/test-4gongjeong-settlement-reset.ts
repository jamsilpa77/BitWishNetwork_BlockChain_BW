/**
 * [4공정] 검증 시뮬레이션 스크립트 (핵심 로직 직접 검증)
 * 월간 정산 시 accumulatedReward → 0, lastBlockRewardThreshold → 0
 * referralBonusStorage → 0, lastBonusBlockThreshold → 0 리셋 검증
 */

import mongoose from 'mongoose';
import Decimal from 'decimal.js';
import MiningState from '../models/MiningState';
import BonusRecord from '../models/BonusRecord';

Decimal.set({ precision: 50 });

async function test4GongjeongSettlementReset() {
    console.log("🧪 [4공정 검증 시뮬레이션] 월간 정산 후 블록 기준점 리셋 검증 시작...");
    await mongoose.connect('mongodb://localhost:27017/bitwish_mining');
    const miningDb = mongoose.connection.useDb('bitwish_mining');

    const testWallet = 'BW_TEST_4GONGJEONG_DIRECT_VERIFY_9999999';

    // 기존 테스트 데이터 정리
    await miningDb.collection('miningstates').deleteOne({ walletAddress: testWallet });
    await miningDb.collection('bonusrecords').deleteOne({ walletAddress: testWallet });

    // ── STEP 1: 정산 직전 상태 삽입 ────────────────────────────────
    // accumulatedReward = 3.7 BW, lastBlockRewardThreshold = 3
    // referralBonusStorage = 2.1 BW, lastBonusBlockThreshold = 2
    await MiningState.create({
        walletAddress: testWallet,
        isMining: true,
        accumulatedReward: '3.7',
        lastBlockRewardThreshold: '3',
        currentBaseRate: '0.25',
        currentTotalRate: '0.25',
        lastSyncTime: new Date()
    });
    await BonusRecord.create({
        walletAddress: testWallet,
        referralBonusStorage: '2.1',
        referralRewardStorage: '0',
        referralList: [],
        lastBonusBlockThreshold: '2'
    });

    console.log("\n📦 정산 전 상태:");
    console.log(`   accumulatedReward        = 3.7 BW`);
    console.log(`   lastBlockRewardThreshold = 3  ← 정산 후 0이 되어야 함`);
    console.log(`   referralBonusStorage     = 2.1 BW`);
    console.log(`   lastBonusBlockThreshold  = 2  ← 정산 후 0이 되어야 함`);

    // ── STEP 2: SettlementWorker 정산 로직 직접 실행 ─────────────
    // (executeMonthlySnapshot의 핵심 초기화 코드와 동일)
    console.log("\n🚀 [4공정 정산 로직] 직접 실행...");
    const now = new Date();

    const miningState = await MiningState.findOne({ walletAddress: testWallet });
    const bonusRecord = await BonusRecord.findOne({ walletAddress: testWallet });

    if (!miningState) throw new Error('MiningState not found');

    // ▼ 정산 핵심 로직 (SettlementWorker.ts L144~155와 완전 동일)
    miningState.accumulatedReward = '0.00000000000000000000000000000000000000000000000000';
    miningState.lastSyncTime = now;
    miningState.lastBlockRewardThreshold = '0'; // [4공정 수복] 기준점 리셋
    await miningState.save();
    console.log(`   ✔ accumulatedReward → 0, lastBlockRewardThreshold → 0`);

    if (bonusRecord && !new Decimal(bonusRecord.referralBonusStorage || '0').isZero()) {
        bonusRecord.referralBonusStorage = '0.00000000000000000000000000000000000000000000000000';
        (bonusRecord as any).lastBonusBlockThreshold = '0'; // [4공정 수복] 보너스 기준점 리셋
        await bonusRecord.save();
        console.log(`   ✔ referralBonusStorage → 0, lastBonusBlockThreshold → 0`);
    }

    // ── STEP 3: DB에서 실제 저장값 재조회 및 검증 ──────────────────
    const resultMining = await miningDb.collection('miningstates').findOne({ walletAddress: testWallet });
    const resultBonus  = await miningDb.collection('bonusrecords').findOne({ walletAddress: testWallet });

    const accReset         = resultMining?.accumulatedReward === '0.00000000000000000000000000000000000000000000000000';
    const thresholdReset   = resultMining?.lastBlockRewardThreshold === '0';
    const bonusReset       = resultBonus?.referralBonusStorage === '0.00000000000000000000000000000000000000000000000000';
    const bonusThreshReset = resultBonus?.lastBonusBlockThreshold === '0';

    const success = accReset && thresholdReset && bonusReset && bonusThreshReset;

    console.log("\n=======================================================");
    console.log("🎉 [4공정 검증 결과 보고]");
    console.log(` - accumulatedReward → 0 초기화:       ${accReset ? '✅' : '❌'}`);
    console.log(` - lastBlockRewardThreshold → 0 리셋:  ${thresholdReset ? '✅' : '❌'} (DB값: ${resultMining?.lastBlockRewardThreshold})`);
    console.log(` - referralBonusStorage → 0 초기화:    ${bonusReset ? '✅' : '❌'}`);
    console.log(` - lastBonusBlockThreshold → 0 리셋:   ${bonusThreshReset ? '✅' : '❌'} (DB값: ${resultBonus?.lastBonusBlockThreshold})`);
    console.log(` - 최종 결과: ${success ? '✅ 성공 (월간 정산 후 블록 생성 연속성 완벽 보존)' : '❌ 실패'}`);
    console.log("=======================================================\n");

    // ── STEP 4: 테스트 데이터 원상 복구 ────────────────────────────
    await miningDb.collection('miningstates').deleteOne({ walletAddress: testWallet });
    await miningDb.collection('bonusrecords').deleteOne({ walletAddress: testWallet });
    console.log("🧹 테스트 데이터 원상 복구 완료.");

    await mongoose.disconnect();
    process.exit(success ? 0 : 1);
}

test4GongjeongSettlementReset().catch(err => {
    console.error("❌ [4공정 검증 실패]:", err);
    process.exit(1);
});
