const axios = require('axios');

async function testRegister() {
    try {
        console.log('테스트 사용자 등록 중...');

        const response = await axios.post('http://localhost:5001/api/user/register', {
            walletAddress: 'BW9f5ff09023123603f7250a5238fc320fb4abfa8',
            publicKey: 'BW9f5ff09023123603f7250a5238fc320fb4abfa8',
            encryptedMnemonic: 'test_encrypted_mnemonic',
            secondPasswordHash: 'test_password_hash',
            myReferralCode: 'REF9F5FF0909DC5',
            referrerCode: null,
            ipAddress: '127.0.0.1'
        });

        console.log('✅ 등록 성공:', response.data);
    } catch (error) {
        console.error('❌ 등록 실패:', error.response?.data || error.message);
    }
}

testRegister();
