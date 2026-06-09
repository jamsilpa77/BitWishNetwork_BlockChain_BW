// AuditMiningTime.js - 데이터베이스 실시간 채굴 개시 시각 전수 감사 도구
const mongoose = require('mongoose');

// MongoDB 커넥션 설정 (서버 환경에 맞춰 포트 및 DB명 조율)
const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bitwish_network';

async function auditActiveMiners() {
    try {
        await mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('⚙️ [Audit] BitWish Network DB 연결 성공. 전수 조사를 시작합니다.');

        // MiningState 스키마 및 모델 임시 정의
        const MiningStateSchema = new mongoose.Schema({
            walletAddress: String,
            isMining: Boolean,
            miningStartTime: Date,
            accumulatedReward: String,
            currentTotalRate: String
        }, { collection: 'miningstates' });

        const MiningState = mongoose.models.MiningState || mongoose.model('MiningState', MiningStateSchema);

        // 현재 채굴 중인 유저(isMining: true) 목록 확보
        const activeMiners = await MiningState.find({ isMining: true });

        console.log(`\n📊 [검사 결과] 현재 채굴 활성화 유저 수: ${activeMiners.length}명\n`);
        console.log('--------------------------------------------------------------------------------------');
        console.log('지갑 주소                                   | 실제 채굴 시작 시간 (KST)');
        console.log('--------------------------------------------------------------------------------------');

        activeMiners.forEach((miner, index) => {
            if (miner.miningStartTime) {
                // UTC 시간을 한국 시간(KST, UTC+9)으로 포맷팅하여 정확한 년.월.일 시:분:초 출력
                const kstDate = new Date(miner.miningStartTime.getTime() + (9 * 60 * 60 * 1000));
                const formattedKST = kstDate.toISOString()
                    .replace('T', ' ')
                    .replace(/\..+/, '')
                    .replace(/-/g, '.');

                console.log(`[${index + 1}] ${miner.walletAddress} | ${formattedKST} (정상 기록 완료)`);
            } else {
                console.log(`[${index + 1}] ${miner.walletAddress} | ⚠️ 마이닝 시작 시각 데이터 누락(Null)`);
            }
        });
        console.log('--------------------------------------------------------------------------------------');

    } catch (error) {
        console.error('검사 중 오류 발생:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 DB 연결 해제 완료.');
    }
}

auditActiveMiners();