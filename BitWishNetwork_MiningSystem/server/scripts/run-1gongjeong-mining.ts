import mongoose from 'mongoose';
import { BlockMiningService } from '../services/BlockMiningService';
import { BitWishBlockchain } from '../../../BitWishNetwork_BlockChain/src/engine/BitWishBlockchain';

async function runFirstGongjeongRepair() {
    console.log("🚀 [1공정 직접 집행 스크립트] 누락 물리 블록 PoW 소급 순차 마이닝 수복 엔진 가동...");

    // 전역 비트위시 코어 엔진 결합
    const bwChainCore = new BitWishBlockchain();
    (global as any).bwChainCore = bwChainCore;

    // 몽고DB 연결
    await mongoose.connect('mongodb://localhost:27017/bitwish_mining');
    console.log("✅ MongoDB 데이터베이스 연결 완료");

    // 블록체인 코어 초기화
    await bwChainCore.initialize();

    // 1공정 소급 마이닝 엔진 실행!
    const result = await BlockMiningService.auditAndSyncGlobalBlocks();

    console.log("\n=======================================================");
    console.log(`🎉 [1공정 집행 결과 보고]`);
    console.log(` - 새로 소급 생성된 정규 PoW 물리 블록: ${result.createdBlocks}개`);
    console.log(` - 최종 메인넷 물리 블록 총 개수: ${result.totalBlocks}개`);
    console.log("=======================================================\n");

    await mongoose.disconnect();
    process.exit(0);
}

runFirstGongjeongRepair().catch(err => {
    console.error("❌ [1공정 집행 에러]:", err);
    process.exit(1);
});
