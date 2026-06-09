const { MongoClient } = require('mongodb');
async function main() {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const db = client.db('bitwish_network');
    const count = await db.collection('blocks').countDocuments({});
    console.log('=== bitwish_network.blocks count:', count);
    const blocks = await db.collection('blocks').find({}).toArray();
    blocks.forEach(b => {
        console.log(`  blockHeight: ${b.blockHeight}, hash: ${b.data?.hash || 'N/A'}, headerHeight: ${b.data?.header?.blockHeight}`);
    });
    await client.close();
}
main().catch(e => { console.error(e); process.exit(1); });
