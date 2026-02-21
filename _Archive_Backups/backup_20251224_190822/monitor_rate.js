const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';
const REFERRER_WALLET = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';

async function monitorRate() {
    try {
        await mongoose.connect(MONGODB_URI);
        const MiningState = mongoose.model('MiningState', new mongoose.Schema({}, { strict: false }), 'miningstates');

        console.log('=== 🕵️‍♀️ DB 값 실시간 감시 시작 (Ctrl+C로 중지) ===');
        console.log('목표 값: 0.27825 (기본 0.25 * 출석 1.05 * 추천 1.06)');

        setInterval(async () => {
            const state = await MiningState.findOne({ walletAddress: REFERRER_WALLET });
            if (state) {
                const now = new Date().toLocaleTimeString();
                const isCorrect = state.currentTotalRate === '0.27825';
                const status = isCorrect ? '✅ 정상' : '❌ 변조됨';

                console.log(`[${now}] Rate: ${state.currentTotalRate} | ${status}`);

                if (!isCorrect) {
                    console.log('⚠️ 값이 변경되었습니다! 서버 로직이 덮어쓰고 있습니다.');
                }
            }
        }, 2000);

    } catch (error) {
        console.error('Error:', error);
    }
}

monitorRate();
