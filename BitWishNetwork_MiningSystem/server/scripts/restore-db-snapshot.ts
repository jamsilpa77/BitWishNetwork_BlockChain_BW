import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';

/**
 * BitWish Network 100% 무결점 DB 원상복구(Rollback) 복원 스크립트
 * 복원 대상: 20260911_snapshot 백업 덤프에서 bitwish_network, bitwish_mining 데이터베이스 전체 덮어쓰기 복원
 */
async function restoreDatabaseSnapshot() {
    const mongoUri = 'mongodb://localhost:27017';
    const backupBaseDir = path.resolve(__dirname, '../../../database_backups/20260911_snapshot');

    console.log('🔄 [DB 복원 워커] 2026-09-11 현재 시점 스냅샷으로 100% 원상복구(Rollback)를 진행합니다...');
    console.log(`📂 복원 소스 경로: ${backupBaseDir}`);

    if (!fs.existsSync(backupBaseDir)) {
        console.error('❌ [복원 실패] 백업 스냅샷 폴더를 찾을 수 없습니다.');
        return;
    }

    const client = new MongoClient(mongoUri);

    try {
        await client.connect();
        console.log('✅ MongoDB 연결 성공!');

        const targetDatabases = ['bitwish_network', 'bitwish_mining'];
        let restoredTotalCount = 0;

        for (const dbName of targetDatabases) {
            const dbBackupDir = path.join(backupBaseDir, dbName);

            if (!fs.existsSync(dbBackupDir)) {
                console.warn(`⚠️ [복원 경고] 백업 폴더 없음: ${dbName}`);
                continue;
            }

            const db = client.db(dbName);
            const files = fs.readdirSync(dbBackupDir).filter(f => f.endsWith('.json'));

            console.log(`\n🔄 DB 덮어쓰기 복원 시작: [${dbName}] (총 ${files.length}개 파일)`);

            for (const file of files) {
                const colName = file.replace('.json', '');
                const filePath = path.join(dbBackupDir, file);
                const docsRaw = fs.readFileSync(filePath, 'utf8');
                const docs = JSON.parse(docsRaw);

                const collection = db.collection(colName);
                
                // 기존 컬렉션 비우기 (Clean Restore)
                await collection.deleteMany({});

                if (docs.length > 0) {
                    // Date 및 ObjectId 타입 복원 보정
                    const parsedDocs = docs.map((doc: any) => {
                        if (doc.createdAt) doc.createdAt = new Date(doc.createdAt);
                        if (doc.updatedAt) doc.updatedAt = new Date(doc.updatedAt);
                        if (doc.lastSyncTime) doc.lastSyncTime = new Date(doc.lastSyncTime);
                        if (doc.settledAt) doc.settledAt = new Date(doc.settledAt);
                        return doc;
                    });
                    await collection.insertMany(parsedDocs);
                }

                console.log(`  └ ↩️ [${colName}] 100% 복원 완료: ${docs.length}개 문서 복구`);
                restoredTotalCount += docs.length;
            }
        }

        console.log(`\n🎉 [DB 복원 성공] 2026-09-11 현재 시점 데이터베이스로 100% 완벽 원상복구되었습니다! (총 ${restoredTotalCount}개 문서 복구)`);
    } catch (error) {
        console.error('❌ [DB 복원 실패] 예외 발생:', error);
    } finally {
        await client.close();
    }
}

restoreDatabaseSnapshot();
