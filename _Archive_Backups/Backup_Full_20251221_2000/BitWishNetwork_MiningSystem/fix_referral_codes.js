const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/bitwish_mining', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function fixReferralCodes() {
    try {
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));

        // 공백이 포함된 추천 코드 찾기
        const users = await User.find({ referrerCode: /^\s|\s$/ });

        console.log(`Found ${users.length} users with whitespace in referrerCode`);

        for (const user of users) {
            const oldCode = user.referrerCode;
            const newCode = oldCode ? oldCode.trim() : null;

            if (oldCode !== newCode) {
                user.referrerCode = newCode;
                await user.save();
                console.log(`Fixed: ${user.walletAddress.substring(0, 15)}...`);
                console.log(`  Old: "${oldCode}"`);
                console.log(`  New: "${newCode}"`);
            }
        }

        console.log('\nDone! Now re-processing referrals...');

        // 수정된 사용자들의 추천 관계 재처리
        const axios = require('axios');
        for (const user of users) {
            if (user.referrerCode) {
                console.log(`Re-processing referral for ${user.walletAddress.substring(0, 15)}...`);
                // UserController.processReferral 호출 필요
                // 하지만 이미 등록된 사용자이므로 수동으로 BonusRecord 업데이트 필요
            }
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

fixReferralCodes();
