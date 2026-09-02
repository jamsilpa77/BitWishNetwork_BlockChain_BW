const mongoose = require('mongoose');

async function cleanupGhostWallets() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bitwish_mining';
    console.log(`🛠️ [1단계 공정] 데이터베이스 연결 중: ${mongoUri}`);
    
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;

    // 🔴 소각 대상 오타/유령 지갑 4개 핀포인트 명시
    const targetGhostWallets = [
        'TestWalletAddress656',
        'TestWalletAddress392',
        'TestWalletAddress98',
        'BW9F5FF090231236D37F250A5C3B4FC320FB44BFA8' // 오타/유령 레코드 (D37)
    ];

    // 🟢 정식 회원 지갑 보호 검증
    const protectedRealWallet = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8'; // 진짜 회원 지갑 (037)

    console.log(`📌 정식 회원 지갑 보호 상태 검증: ${protectedRealWallet}`);
    const realUser = await db.collection('users').findOne({ walletAddress: new RegExp('^' + protectedRealWallet + '$', 'i') });
    
    if (realUser) {
        console.log(`✅ [보호 확인] 진짜 회원 지갑 (${protectedRealWallet})이 User DB에 안전하게 확인되었습니다!`);
    } else {
        console.log(`⚠️ [주의] 진짜 회원 지갑 검색 결과 없음.`);
    }

    // 소각 안전 수행: User 컬렉션에 존재하지 않는 유령 지갑만 선별 삭제
    for (const ghostAddress of targetGhostWallets) {
        const userExist = await db.collection('users').findOne({ walletAddress: new RegExp('^' + ghostAddress + '$', 'i') });
        if (!userExist) {
            const res1 = await db.collection('miningstates').deleteMany({ walletAddress: new RegExp('^' + ghostAddress + '$', 'i') });
            const res2 = await db.collection('bonusrecords').deleteMany({ walletAddress: new RegExp('^' + ghostAddress + '$', 'i') });
            console.log(`🔥 [유령 지갑 소각 완율] ${ghostAddress} -> MiningState ${res1.deletedCount}건, BonusRecord ${res2.deletedCount}건 영구 소각 완료.`);
        } else {
            console.log(`🛡️ [소각 거부] ${ghostAddress} 는 회원 DB에 존재하므로 삭제하지 않았습니다.`);
        }
    }

    // 최종 정식 회원 수 확인
    const totalUsers = await db.collection('users').countDocuments({});
    const totalMiningStates = await db.collection('miningstates').countDocuments({});
    
    console.log(`\n📊 [1단계 소각 후 DB 상태 산출]`);
    console.log(` - User 회원 가입 수: ${totalUsers} 명`);
    console.log(` - MiningState 수: ${totalMiningStates} 개`);

    await mongoose.disconnect();
    console.log(`✅ [1단계 DB 수복 완료]`);
}

cleanupGhostWallets().catch(err => {
    console.error('❌ 스크립트 실행 오류:', err);
    process.exit(1);
});
