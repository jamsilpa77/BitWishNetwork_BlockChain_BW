const WALLET_ADDRESS = 'BW9F5FF090231236037F250A523B4FC320FB44BFA8';

async function checkApi() {
    try {
        console.log('📡 Checking Server API Response...');
        const response = await fetch(`http://localhost:5000/api/admin/attendance/${WALLET_ADDRESS}`);
        const data = await response.json();

        console.log('------------------------------------------------');
        console.log('API Response Status:', response.status);
        console.log('Is Active (Today)?', data.data.isActive);
        console.log('Records Count:', data.data.records.length);

        console.log('\n[Records List]');
        data.data.records.forEach(r => {
            console.log(`- Date: ${r.fullDate}, Amount: ${r.bonusAmount}`);
        });
        console.log('------------------------------------------------');

        if (data.data.isActive) {
            console.log('❌ FAIL: API says Active (28th exists). Reset failed.');
        } else {
            console.log('✅ PASS: API says Inactive (28th gone). DB is clean.');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

checkApi();
