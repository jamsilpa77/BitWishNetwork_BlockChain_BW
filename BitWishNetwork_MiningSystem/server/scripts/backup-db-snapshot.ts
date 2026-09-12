import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';

/**
 * BitWish Network 100% 무결점 DB 물리 스냅샷 백업 스크립트
 * 백업 대상: bitwish_network, bitwish_mining 데이터베이스 전체 컬렉션
 */
async function backupDatabaseSnapshot() {
    const mongoUri = 'mongodb://localhost:27017';
    const backupBaseDir = path.resolve(__dirname, '../../../database_backups/20260911_snapshot');

    console.log('📦 [DB 백업 워커] 2026-09-11 현재 시점 DB 스냅샷 물리 백업을 개시합니다...');
    console.log(`📂 백업 저장 경로: ${backupBaseDir}`);

    if (!fs.existsSync(backupBaseDir)) {
        fs.mkdirSync(backupBaseDir, { recursive: true });
    }

    const client = new MongoClient(mongoUri);

    try {
        await client.connect();
        console.log('✅ MongoDB 연결 성공!');

        const targetDatabases = ['bitwish_network', 'bitwish_mining'];
        let totalCount = 0;

        for (const dbName of targetDatabases) {
            const db = client.db(dbName);
            const collections = await db.listCollections().toArray();
            const dbBackupDir = path.join(backupBaseDir, dbName);

            if (!fs.existsSync(dbBackupDir)) {
                fs.mkdirSync(dbBackupDir, { recursive: true });
            }

            console.log(`\n📂 DB 백업 시작: [${dbName}] (총 ${collections.length}개 컬렉션)`);

            for (const colInfo of collections) {
                const colName = colInfo.name;
                const collection = db.collection(colName);
                const docs = await collection.find({}).toArray();

                const filePath = path.join(dbBackupDir, `${colName}.json`);
                fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf8');

                console.log(`  └ 📄 [${colName}] 백업 완료: ${docs.length}개 문서 저장 -> ${colName}.json`);
                totalCount += docs.length;
            }
        }

        console.log(`\n🎉 [DB 백업 성공] 모든 데이터베이스 스냅샷 백업이 완벽히 완료되었습니다! (총 ${totalCount}개 문서 백업)`);
    } catch (error) {
        console.error('❌ [DB 백업 실패] 예외 발생:', error);
    } finally {
        await client.close();
    }
}

backupDatabaseSnapshot();
