const mongoose = require('mongoose');
const Decimal = require('decimal.js');

async function test() {
    const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // ts-node 등록하여 typescript 파일 require 가능하도록 설정
    require('ts-node').register({
        project: './server/tsconfig.json'
    });

    // 1. BitWishBlockchain 로드
    const { BitWishBlockchain } = require('../../BitWishNetwork_BlockChain/src/engine/BitWishBlockchain');
    const bwChainCore = new BitWishBlockchain();
    global.bwChainCore = bwChainCore;

    console.log("Initializing Blockchain Core...");
    const initRes = await bwChainCore.initialize();
    console.log("Init Result:", initRes);

    // 2. BlockMiningService 테스트
    const { BlockMiningService } = require('../server/services/BlockMiningService');
    console.log("Calling onMiningBlock for TestWallet...");
    try {
        const result = await BlockMiningService.onMiningBlock('BW34FE4528EBDE737100AA8C5F656EB94FBB17A626');
        console.log("Success! Result:", result);
    } catch (err) {
        console.error("Failed with error:", err);
    }

    await mongoose.connection.close();
}

test().catch(console.error);
