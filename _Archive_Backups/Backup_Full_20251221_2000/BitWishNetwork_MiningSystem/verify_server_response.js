const axios = require('axios');

async function verifyServerResponse() {
    const walletAddress = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';
    const url = `http://localhost:5001/api/referral/stats/${walletAddress}`;

    console.log(`Checking Server Response for: ${walletAddress}`);

    try {
        const response = await axios.get(url);
        const data = response.data.data;

        console.log('\n=== [서버가 알고 있는 정보] ===');
        console.log(`1. 추천인 수 (referralCount): ${data.referralCount}명`);
        console.log(`2. 보너스율 (referralBonusRate): ${data.referralBonusRate}`);
        console.log(`3. 가입자 목록 수: ${data.referralList ? data.referralList.length : 0}명`);
        console.log(`4. 추천 코드: ${data.referralCode}`);
        console.log('==============================\n');

    } catch (error) {
        console.error('❌ 서버 통신 실패:', error.message);
    }
}

verifyServerResponse();
