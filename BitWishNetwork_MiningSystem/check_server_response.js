const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/admin/attendance/BW9F5FF090231236037F250A523B4FC320FB44BFA8',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('✅ Server Response:\n');
            console.log(JSON.stringify(json, null, 2));

            if (json.success && json.data && json.data.records) {
                console.log('\n📋 Date Summary:');
                json.data.records.forEach((r, i) => {
                    // fullDate에서 날짜 부분만 추출
                    const dateMatch = r.fullDate.match(/(\d{4}\.\s*\d{1,2}\.\s*\d{1,2})/);
                    console.log(`${i + 1}. ${dateMatch ? dateMatch[0] : r.fullDate}`);
                });
            }
        } catch (e) {
            console.error('Parse error:', e);
            console.log('Raw response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error('Request error:', e.message);
});

req.end();
