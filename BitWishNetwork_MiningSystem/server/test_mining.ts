process.env.PORT = '5999';
import mongoose from 'mongoose';
import { BlockMiningService } from './services/BlockMiningService';
import { bwChainCore } from './index';

async function test() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect('mongodb://localhost:27017/bitwish_mining');
        console.log("Connected to MongoDB.");

        console.log("Initializing Blockchain Core...");
        await bwChainCore.initialize();
        console.log("Blockchain Core Initialized.");

        console.log("Current block count from service:", await BlockMiningService.getTotalBlockCount());

        console.log("Triggering onMiningBlock...");
        const result = await BlockMiningService.onMiningBlock('TestWalletAddress123');
        console.log("onMiningBlock result:", JSON.stringify(result, null, 2));

        console.log("New block count from service:", await BlockMiningService.getTotalBlockCount());

        const networkDb = mongoose.connection.useDb('bitwish_network');
        const stats = await networkDb.collection('network_stats').findOne({ id: 'global_fund_stats' });
        console.log("Updated network fund stats in DB:", stats);

        const blocks = await networkDb.collection('blocks').find({}).toArray();
        console.log("All blocks in DB heights:", blocks.map(b => b.blockHeight));

    } catch (err) {
        console.error("Test execution failed:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

test();
