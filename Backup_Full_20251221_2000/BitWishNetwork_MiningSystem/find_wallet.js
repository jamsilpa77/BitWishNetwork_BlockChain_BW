const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/bitwish_mining', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function findWallet() {
    try {
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));

        // 지갑 주소로 검색 (부분 일치)
        const users = await User.find({ walletAddress: /^BW9F5FF/ });

        console.log('Found users:', users.length);
        users.forEach(u => {
            console.log('\nWallet:', u.walletAddress);
            console.log('My Referral Code:', u.myReferralCode);
            console.log('Used Referral Code:', u.referrerCode || 'NONE');
        });

        // 모든 사용자 확인
        const allUsers = await User.find({});
        console.log('\n\nAll users in database:');
        allUsers.forEach(u => {
            console.log(`${u.walletAddress.substring(0, 15)}... | Code: ${u.myReferralCode} | Used: ${u.referrerCode || 'NONE'}`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

findWallet();
