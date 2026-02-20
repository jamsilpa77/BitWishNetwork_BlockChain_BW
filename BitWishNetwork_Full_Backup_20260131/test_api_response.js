const fetch = require('node-fetch');

const WALLET_ADDRESS = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';
const API_URL = `http://localhost:5001/api/admin/attendance/${WALLET_ADDRESS}`;

console.log('📡 Calling API:', API_URL);

fetch(API_URL)
    .then(res => res.json())
    .then(data => {
        console.log('\n✅ API Response:');
        console.log(JSON.stringify(data, null, 2));

        if (data.success && data.data && data.data.records) {
            console.log('\n📋 Records summary:');
            data.data.records.forEach((r, i) => {
                console.log(`${i + 1}. ${r.fullDate} - ${r.bonusAmount} BW`);
            });
        }
    })
    .catch(err => {
        console.error('❌ API Error:', err.message);
    });
