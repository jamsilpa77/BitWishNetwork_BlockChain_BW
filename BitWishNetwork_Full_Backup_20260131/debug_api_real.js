const axios = require('axios');

async function checkApiReal() {
    const walletAddress = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';
    const url = `http://localhost:5001/api/referral/stats/${walletAddress}`;

    console.log(`Checking API: ${url}`);

    try {
        const response = await axios.get(url);
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.log('Response data:', error.response.data);
        }
    }
}

checkApiReal();
