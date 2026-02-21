const axios = require('axios');

async function checkApi() {
    const walletAddress = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';
    const url = `http://localhost:5001/api/referral/stats/${walletAddress}`;

    console.log(`=== 📡 API 응답 확인 시작 ===`);
    console.log(`Target URL: ${url}`);

    try {
        const response = await axios.get(url);
        console.log('✅ API 응답 성공 (Status 200)');
        console.log('응답 데이터:');
        console.log(JSON.stringify(response.data, null, 2));

        const data = response.data.data;
        if (data) {
            console.log('\n--- 분석 ---');
            console.log(`추천인 수(API 반환값): ${data.referralCount}`);
            console.log(`보너스율(API 반환값): ${data.referralBonusRate}`);
            console.log(`가입자 목록 수: ${data.referralList ? data.referralList.length : 0}`);
        }

    } catch (error) {
        console.error('❌ API 호출 실패:', error.message);
        if (error.response) {
            console.error('응답 상태:', error.response.status);
            console.error('응답 데이터:', error.response.data);
        }
    }
}

checkApi();
