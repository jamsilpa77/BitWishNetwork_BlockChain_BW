const mongoose = require('mongoose');

async function runSafeFix() {
    try {
        // 1. 데이터베이스 연결 설정
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bitwish_mining';
        await mongoose.connect(MONGODB_URI);
        console.log("🔌 [데이터베이스] 연결에 성공했습니다.");

        const networkDb = mongoose.connection.useDb('bitwish_network');
        const collection = networkDb.collection('blocktransactions');

        // [안전장치 1] 만에 하나 실패할 경우를 대비해, 지우기 전 실시간 백업본(복사 장부) 생성
        console.log("🚨 [1단계] 만약의 사태에 대비해 자동 백업을 시작합니다...");
        const backupCollectionName = `blocktransactions_backup_${Date.now()}`;
        await collection.aggregate([{ $out: backupCollectionName }]).toArray();
        console.log(`✅ 백업 완료! 문제 발생 시 복구용 임시 장부 이름: ${backupCollectionName}`);

        // [안전장치 2] 지우기 전에 삭제될 대상(type: 'Minting')이 몇 개인지 먼저 카운트
        const countToDelete = await collection.countDocuments({ type: 'Minting' });
        console.log(`🔍 [2단계] 삭제 대상인 구 채굴 발행(Minting) 영수증 개수: ${countToDelete}개`);

        if (countToDelete === 0) {
            console.log("ℹ️ 삭제할 가짜 채굴 영수증이 없습니다. 이미 깨끗한 상태입니다. 작업을 안전하게 종료합니다.");
            await mongoose.disconnect();
            return;
        }

        // [본 작업] 구 채굴 영수증 일괄 삭제
        console.log("🧹 [3단계] 지갑용 장부에서 구 채굴 영수증 삭제 작업을 진행합니다...");
        const result = await collection.deleteMany({ type: 'Minting' });
        console.log(`✅ 수복 정비 완료! 총 ${result.deletedCount}개의 잘못된 채굴 영수증이 삭제되었습니다.`);
        console.log(`⚠️ 만약 지갑 화면에 예기치 못한 문제가 생긴다면, 백업본 컬렉션(${backupCollectionName})을 다시 돌려놓으면 즉시 원복됩니다.`);

        await mongoose.disconnect();
    } catch (error) {
        console.error("❌ [수복 실패] 작업 중 에러가 발생하여 안전하게 중단되었습니다:", error);
    }
}

runSafeFix();