const mongoose = require('mongoose');

async function runSafeRestore() {
    try {
        // 1. 데이터베이스 연결 설정
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bitwish_mining';
        await mongoose.connect(MONGODB_URI);
        console.log("🔌 [데이터베이스] 연결에 성공했습니다.");

        const networkDb = mongoose.connection.useDb('bitwish_network');

        // 2. 데이터베이스의 모든 컬렉션(장부) 목록 조회
        const collections = await networkDb.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        // 3. 백업 장부들만 필터링
        const backups = collectionNames.filter(name => name.startsWith('blocktransactions_backup_'));

        if (backups.length === 0) {
            console.log("❌ [원상복구 실패] 복구할 수 있는 백업 장부를 데이터베이스에서 찾지 못했습니다.");
            await mongoose.disconnect();
            return;
        }

        // 4. 가장 최근에 만들어진 백업 장부 찾기
        backups.sort((a, b) => {
            const numA = parseInt(a.replace('blocktransactions_backup_', '')) || 0;
            const numB = parseInt(b.replace('blocktransactions_backup_', '')) || 0;
            return numB - numA; // 가장 최근 백업이 맨 앞으로 오게 정렬
        });

        const targetBackup = backups[0];
        console.log(`🔍 [복구 대상 식별] 가장 최근 백업 장부를 찾았습니다: ${targetBackup}`);

        // 5. 현재 문제가 생긴 장부를 지우고 백업본으로 덮어쓰기
        console.log("🧹 [1단계] 현재 꼬인 장부(blocktransactions)를 비우는 중...");
        await networkDb.collection('blocktransactions').drop().catch(() => { });

        console.log(`🔄 [2단계] 백업본(${targetBackup})에서 원래 데이터를 복사해 오는 중...`);
        await networkDb.collection(targetBackup).aggregate([{ $out: "blocktransactions" }]).toArray();

        console.log("✅ [원상복구 완료] 성공적으로 작업을 실행하기 바로 직전의 상태로 100% 돌려놓았습니다!");
        await mongoose.disconnect();
    } catch (error) {
        console.error("❌ [복구 실패] 원상복구 중 예기치 못한 오류가 발생했습니다:", error);
    }
}

runSafeRestore();