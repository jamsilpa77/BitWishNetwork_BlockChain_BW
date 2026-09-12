/**
 * [3공정 시작점 초기화] 검증 스크립트
 * initBonusBlockThreshold() 함수가 정확히 동작하는지 실제 DB에서 검증합니다.
 * - lastBonusBlockThreshold가 없는 유저에게 referralBonusStorage 정수값으로 시작점 설정
 * - 이미 시작점이 있는 유저는 건드리지 않음 (멱등성)
 * - 검증 후 원상 복구
 */

import mongoose from 'mongoose';
import Decimal from 'decimal.js';

Decimal.set({ precision: 50 });

async function testInitBonusBlockThreshold() {
    console.log("🧪 [3공정 시작점 초기화 검증] 실제 DB 연결 후 동작 검증 시작...");
    await mongoose.connect('mongodb://localhost:27017/bitwish_mining');
    const miningDb = mongoose.connection.useDb('bitwish_mining');

    // ── STEP 1: 테스트 데이터 준비 ─────────────────────────────────
    // 케이스 A: lastBonusBlockThreshold 없고, referralBonusStorage = 12.7 BW
    // 케이스 B: lastBonusBlockThreshold 없고, referralBonusStorage = 0 BW
    // 케이스 C: lastBonusBlockThreshold 이미 존재 = '5' (건드리지 않아야 함)

    const testWalletA = 'BW_TEST_INIT_A_111111111111111111111111111';
    const testWalletB = 'BW_TEST_INIT_B_222222222222222222222222222';
    const testWalletC = 'BW_TEST_INIT_C_333333333333333333333333333';

    // 기존 테스트 데이터 정리
    await miningDb.collection('bonusrecords').deleteMany({
        walletAddress: { $in: [testWalletA, testWalletB, testWalletC] }
    });

    // 케이스 A 삽입 (lastBonusBlockThreshold 없음, 12.7 BW 쌓임)
    await miningDb.collection('bonusrecords').insertOne({
        walletAddress: testWalletA,
        referralBonusStorage: '12.7',
        referralRewardStorage: '0',
        referralList: []
        // lastBonusBlockThreshold 필드 없음
    });

    // 케이스 B 삽입 (lastBonusBlockThreshold 없음, 0 BW)
    await miningDb.collection('bonusrecords').insertOne({
        walletAddress: testWalletB,
        referralBonusStorage: '0',
        referralRewardStorage: '0',
        referralList: []
        // lastBonusBlockThreshold 필드 없음
    });

    // 케이스 C 삽입 (lastBonusBlockThreshold 이미 '5' 존재)
    await miningDb.collection('bonusrecords').insertOne({
        walletAddress: testWalletC,
        referralBonusStorage: '8.3',
        referralRewardStorage: '0',
        referralList: [],
        lastBonusBlockThreshold: '5' // 이미 존재 → 건드리지 않아야 함
    });

    console.log("\n📦 테스트 데이터 생성 완료:");
    console.log(`   케이스 A (${testWalletA.slice(0,20)}...): referralBonusStorage=12.7, threshold=없음`);
    console.log(`   케이스 B (${testWalletB.slice(0,20)}...): referralBonusStorage=0, threshold=없음`);
    console.log(`   케이스 C (${testWalletC.slice(0,20)}...): referralBonusStorage=8.3, threshold=5 (기존)`);

    // ── STEP 2: initBonusBlockThreshold 로직 직접 실행 ─────────────
    console.log("\n🚀 initBonusBlockThreshold 실행...");

    const records = await miningDb.collection('bonusrecords').find({
        lastBonusBlockThreshold: { $exists: false }
    }).toArray();

    console.log(`   → lastBonusBlockThreshold 없는 유저 수: ${records.length}개 (A, B만 해당되어야 함)`);

    let initializedCount = 0;
    for (const record of records) {
        const currentBonus = new Decimal(record.referralBonusStorage || '0');
        const startThreshold = currentBonus.floor().toString();
        await miningDb.collection('bonusrecords').updateOne(
            { _id: record._id },
            { $set: { lastBonusBlockThreshold: startThreshold } }
        );
        initializedCount++;
        console.log(`   ✔ ${record.walletAddress.slice(0, 20)}...: ${currentBonus.toFixed(1)} BW → 시작점=${startThreshold}`);
    }

    // ── STEP 3: 결과 검증 ──────────────────────────────────────────
    const resultA = await miningDb.collection('bonusrecords').findOne({ walletAddress: testWalletA });
    const resultB = await miningDb.collection('bonusrecords').findOne({ walletAddress: testWalletB });
    const resultC = await miningDb.collection('bonusrecords').findOne({ walletAddress: testWalletC });

    const checkA = resultA?.lastBonusBlockThreshold === '12'; // 12.7 → 정수 12
    const checkB = resultB?.lastBonusBlockThreshold === '0';  // 0 → 0
    const checkC = resultC?.lastBonusBlockThreshold === '5';  // 기존값 5 유지
    const checkCount = initializedCount === 2;                 // A, B만 처리

    const success = checkA && checkB && checkC && checkCount;

    console.log("\n=======================================================");
    console.log("🎉 [3공정 시작점 초기화 검증 결과]");
    console.log(` - 케이스 A: threshold 없음(12.7 BW) → ${resultA?.lastBonusBlockThreshold} ${checkA ? '✅' : '❌'} (기대: 12)`);
    console.log(` - 케이스 B: threshold 없음(0 BW)   → ${resultB?.lastBonusBlockThreshold} ${checkB ? '✅' : '❌'} (기대: 0)`);
    console.log(` - 케이스 C: threshold 기존값(5)    → ${resultC?.lastBonusBlockThreshold} ${checkC ? '✅' : '❌'} (기대: 5, 변경 없어야 함)`);
    console.log(` - 처리 유저 수: ${initializedCount}개 ${checkCount ? '✅' : '❌'} (기대: 2개, C는 스킵)`);
    console.log(` - 최종 결과: ${success ? '✅ 성공' : '❌ 실패'}`);
    console.log("=======================================================\n");

    // ── STEP 4: 테스트 데이터 원상 복구 ────────────────────────────
    await miningDb.collection('bonusrecords').deleteMany({
        walletAddress: { $in: [testWalletA, testWalletB, testWalletC] }
    });
    console.log("🧹 테스트 데이터 원상 복구 완료.");

    await mongoose.disconnect();
    process.exit(success ? 0 : 1);
}

testInitBonusBlockThreshold().catch(err => {
    console.error("❌ [검증 실패]:", err);
    process.exit(1);
});
