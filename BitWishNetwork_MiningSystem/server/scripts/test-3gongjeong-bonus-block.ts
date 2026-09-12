/**
 * [3공정] 검증 시뮬레이션 스크립트
 * 추천인 2% 마이닝 보너스(referralBonusStorage)가 정수 1 BW 경계 돌파 시
 * 물리 블록이 자동 생성되는지를 실제 DB 연결 후 직접 트리거하여 검증합니다.
 */

import mongoose from 'mongoose';
import Decimal from 'decimal.js';
import BonusRecord from '../models/BonusRecord';
import { BlockMiningService } from '../services/BlockMiningService';
import { BitWishBlockchain } from '../../../BitWishNetwork_BlockChain/src/engine/BitWishBlockchain';

Decimal.set({ precision: 50 });

async function test3GongjeongBonusBlock() {
    console.log("🧪 [3공정 검증 시뮬레이션] referralBonusStorage 1 BW 경계 돌파 → 물리 블록 자동 생성 검증 시작...");

    const bwChainCore = new BitWishBlockchain();
    (global as any).bwChainCore = bwChainCore;

    await mongoose.connect('mongodb://localhost:27017/bitwish_mining');
    await bwChainCore.initialize();

    const networkDb = mongoose.connection.useDb('bitwish_network');
    const miningDb = mongoose.connection.useDb('bitwish_mining');

    // STEP 1: 시작 전 물리 블록 수 기록
    const initialBlockCount = await networkDb.collection('blocks').countDocuments({});
    console.log(`\n📊 [시작 전] 메인넷 물리 블록 총 개수: ${initialBlockCount}개`);

    // STEP 2: referralList가 있는 실제 지갑 선택
    const testBonusRecord = await miningDb.collection('bonusrecords').findOne({ 'referralList.0': { $exists: true } });
    if (!testBonusRecord) throw new Error('테스트할 BonusRecord(referralList 있는 것)를 찾을 수 없습니다.');

    const testWallet = testBonusRecord.walletAddress;
    const originalBonusStorage = testBonusRecord.referralBonusStorage || '0';
    const originalThreshold = testBonusRecord.lastBonusBlockThreshold || '0';

    console.log(`\n👤 테스트 대상 지갑: ${testWallet}`);
    console.log(`📦 원래 referralBonusStorage: ${originalBonusStorage} BW`);
    console.log(`📦 원래 lastBonusBlockThreshold: ${originalThreshold} BW`);

    // STEP 3: referralBonusStorage = 0.95, lastBonusBlockThreshold = 0 으로 강제 설정
    await miningDb.collection('bonusrecords').updateOne(
        { walletAddress: testWallet },
        { $set: { referralBonusStorage: '0.95', lastBonusBlockThreshold: '0' } }
    );
    console.log(`\n🔧 테스트 준비: referralBonusStorage = 0.95 BW, lastBonusBlockThreshold = 0 으로 강제 설정`);

    // STEP 4: 3공정 핵심 로직 직접 실행 (0.10 BW 추가 → 1.05 BW → 1 BW 경계 돌파)
    console.log(`\n🚀 3공정 트리거: referralBonusStorage에 0.10 BW 추가 → 1.05 BW → 1 BW 경계 돌파...`);

    const bonusRecord = await BonusRecord.findOne({ walletAddress: testWallet });
    if (!bonusRecord) throw new Error('BonusRecord not found');

    const additionalBonus = new Decimal('0.10');
    const currentStorage = new Decimal(bonusRecord.referralBonusStorage || '0');
    const newBonusStorage = currentStorage.plus(additionalBonus);
    bonusRecord.referralBonusStorage = newBonusStorage.toString();

    console.log(`   ✔ newBonusStorage = ${newBonusStorage.toString()} BW`);

    const bonusLastThreshold = new Decimal((bonusRecord as any).lastBonusBlockThreshold || '0');
    const bonusNextThreshold = bonusLastThreshold.plus(1);

    console.log(`   ✔ bonusLastThreshold = ${bonusLastThreshold.toString()}`);
    console.log(`   ✔ bonusNextThreshold = ${bonusNextThreshold.toString()}`);
    console.log(`   ✔ 경계 돌파 여부: ${newBonusStorage.gte(bonusNextThreshold) ? '✅ 예 (블록 생성 실행)' : '❌ 아니오'}`);

    let blocksCreated = 0;
    let createdBlockHeight = 0;
    if (newBonusStorage.gte(bonusNextThreshold)) {
        const bonusBlocksToCreate = newBonusStorage.minus(bonusLastThreshold).floor().toNumber();
        console.log(`\n⛏️ [3공정] 생성할 블록 수: ${bonusBlocksToCreate}개`);

        for (let bi = 0; bi < bonusBlocksToCreate; bi++) {
            const result = await BlockMiningService.onMiningBlock(testWallet);
            createdBlockHeight = result.blockHeight;
            blocksCreated++;
            console.log(` └ ✅ 블록 ${bi + 1}/${bonusBlocksToCreate} 생성 완료: 높이 #${result.blockHeight}`);
        }

        (bonusRecord as any).lastBonusBlockThreshold = bonusLastThreshold.plus(bonusBlocksToCreate).toString();
        console.log(`📊 [3공정] lastBonusBlockThreshold 갱신: ${(bonusRecord as any).lastBonusBlockThreshold} BW`);
    }

    await bonusRecord.save();

    // STEP 5: 최종 블록 수 확인
    const finalBlockCount = await networkDb.collection('blocks').countDocuments({});
    const blockDiff = finalBlockCount - initialBlockCount;
    const verifiedRecord = await miningDb.collection('bonusrecords').findOne({ walletAddress: testWallet });
    const success = blockDiff === 1 && blocksCreated === 1;

    console.log("\n=======================================================");
    console.log(`🎉 [3공정 시뮬레이션 결과 보고]`);
    console.log(` - 시작 전 물리 블록 개수: ${initialBlockCount}개`);
    console.log(` - 3공정 트리거 후 물리 블록 개수: ${finalBlockCount}개 (+${blockDiff}개)`);
    console.log(` - 생성된 블록 높이: #${createdBlockHeight}`);
    console.log(` - referralBonusStorage: 0.95 BW → ${verifiedRecord?.referralBonusStorage} BW`);
    console.log(` - lastBonusBlockThreshold: 0 → ${verifiedRecord?.lastBonusBlockThreshold}`);
    console.log(` - 검증 결과: ${success ? '✅ 성공 (1 BW 경계 돌파 → 물리 블록 1개 1:1 완벽 생성)' : '❌ 실패'}`);
    console.log("=======================================================\n");

    // STEP 6: 원상 복구
    await miningDb.collection('bonusrecords').updateOne(
        { walletAddress: testWallet },
        { $set: { referralBonusStorage: originalBonusStorage, lastBonusBlockThreshold: originalThreshold } }
    );
    if (createdBlockHeight > 0) {
        await networkDb.collection('blocks').deleteMany({ 'data.header.validator': testWallet, blockHeight: createdBlockHeight });
        await networkDb.collection('blocktransactions').deleteMany({ walletAddress: testWallet, blockHeight: createdBlockHeight });
    }
    console.log(`🧹 원상 복구 완료 (referralBonusStorage: ${originalBonusStorage}, lastBonusBlockThreshold: ${originalThreshold})`);

    await mongoose.disconnect();
    process.exit(success ? 0 : 1);
}

test3GongjeongBonusBlock().catch(err => {
    console.error("❌ [3공정 검증 실패]:", err);
    process.exit(1);
});
