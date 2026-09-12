import mongoose from 'mongoose';
import Decimal from 'decimal.js';
import User from '../models/User';
import BonusRecord from '../models/BonusRecord';
import MiningState from '../models/MiningState';
import { BlockMiningService } from '../services/BlockMiningService';
import { BitWishBlockchain } from '../../../BitWishNetwork_BlockChain/src/engine/BitWishBlockchain';

async function testSecondGongjeongReferral() {
    console.log("🧪 [2공정 검증 시뮬레이션] 추천 가입 시 1 BW 보상 + PoW 물리 블록 1:1 실시간 생성 연동 테스트...");

    // 전역 비트위시 코어 엔진 결합
    const bwChainCore = new BitWishBlockchain();
    (global as any).bwChainCore = bwChainCore;

    // 몽고DB 연결
    await mongoose.connect('mongodb://localhost:27017/bitwish_mining');
    await bwChainCore.initialize();

    const networkDb = mongoose.connection.useDb('bitwish_network');
    const initialBlockCount = await networkDb.collection('blocks').countDocuments({});
    console.log(`📊 테스트 시작 전 메인넷 물리 블록 총 개수: ${initialBlockCount}개`);

    // BW 표준 규격 테스트 지갑 주소
    const mockReferrer = 'BW1111111111111111111111111111111111111111';
    const mockChild = 'BW2222222222222222222222222222222222222222';

    console.log(`👤 시뮬레이션 추천인 지갑: ${mockReferrer}`);
    console.log(`👶 시뮬레이션 신규 가입자 지갑: ${mockChild}`);

    // 1. 추천인 보상 1 BW 지급 및 2공정 트리거 집행
    console.log("\n🚀 1단계: 추천인 1 BW 보상 지급 및 물리 블록 소환 실행...");
    await BlockMiningService.onMiningBlock(mockReferrer);

    // 2. 신규 가입자 1 BW 보상 지급 및 2공정 트리거 집행
    console.log("🚀 2단계: 신규 가입자 1 BW 보상 지급 및 물리 블록 소환 실행...");
    await BlockMiningService.onMiningBlock(mockChild);

    const finalBlockCount = await networkDb.collection('blocks').countDocuments({});
    const blockDiff = finalBlockCount - initialBlockCount;

    console.log("\n=======================================================");
    console.log(`🎉 [2공정 시뮬레이션 결과 보고]`);
    console.log(` - 시작 전 물리 블록 개수: ${initialBlockCount}개`);
    console.log(` - 2공정 추천 가입 연동 후 물리 블록 개수: ${finalBlockCount}개 (+${blockDiff}개)`);
    console.log(` - 검증 결과: ${blockDiff === 2 ? '✅ 성공 (추천인 1개 + 가입자 1개 1:1 완벽 생성)' : '❌ 실패'}`);
    console.log("=======================================================\n");

    // 테스트용 생성된 물리 블록 정리
    await networkDb.collection('blocks').deleteMany({
        $or: [
            { 'data.header.validator': mockReferrer },
            { 'data.header.validator': mockChild }
        ]
    });

    await mongoose.disconnect();
    process.exit(0);
}

testSecondGongjeongReferral().catch(err => {
    console.error("❌ [2공정 검증 실패]:", err);
    process.exit(1);
});
