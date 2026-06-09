const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/stats/realtime',
    method: 'GET'
};

console.log('📡 Fetching /api/stats/realtime ...');

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('✅ Response:', JSON.stringify(json, null, 2));
        } catch (e) {
            console.error('❌ Parse error:', e);
            console.log('Raw response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error('❌ Request error:', e.message);
});

req.end();
