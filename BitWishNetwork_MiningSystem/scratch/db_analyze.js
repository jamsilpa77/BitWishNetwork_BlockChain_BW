const mongoose = require('mongoose');

async function analyze() {
    try {
        await mongoose.connect('mongodb://localhost:27017/bitwish_mining');
        console.log('--- Database Analysis Start ---');

        // 1. 컬렉션 리스트 확인
        const cols = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', cols.map(c => c.name));

        // 2. 전체 유저 수 확인
        const userCount = await mongoose.connection.db.collection('users').countDocuments();
        console.log('Total Users:', userCount);

        // 3. MiningState 전수 조사
        const miningData = await mongoose.connection.db.collection('miningstates').find().toArray();
        console.log('--- MiningState Data ---');
        console.log(JSON.stringify(miningData, null, 2));

        // 4. MonthlySettlement 전수 조사
        const settlementData = await mongoose.connection.db.collection('monthlysettlements').find().toArray();
        console.log('--- MonthlySettlement Data ---');
        console.log(JSON.stringify(settlementData, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Analysis Error:', error);
        process.exit(1);
    }
}

analyze();
