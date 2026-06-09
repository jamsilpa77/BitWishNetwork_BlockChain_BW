const { MongoClient } = require('mongodb');

async function main() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('bitwish_network');

        const blockCount = await db.collection('blocks').countDocuments({});
        console.log('Block count:', blockCount);

        const genesisBlock = await db.collection('blocks').findOne({ blockHeight: 0 });
        console.log('Genesis Block exists:', !!genesisBlock);
        if (genesisBlock) {
            console.log('Genesis Block data:', JSON.stringify(genesisBlock, null, 2));
        }

        const allBlocks = await db.collection('blocks').find({}).toArray();
        console.log('All blocks heights:', allBlocks.map(b => b.blockHeight));

        const stats = await db.collection('network_stats').findOne({ id: 'global_fund_stats' });
        console.log('Global fund stats:', stats);

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

main();

