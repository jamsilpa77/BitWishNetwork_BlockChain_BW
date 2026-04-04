/**
 * BitWishNetwork 긴급 데이터 정화 및 전수 조사 스크립트 (Step 3 - Final)
 * 2026-03-01 하드코딩 오류(1BW 초기화)를 로직 기반으로 정밀 복구
 */
const mongoose = require('mongoose');
const Decimal = require('decimal.js');

const MONGO_URI = 'mongodb://localhost:27017/bitwish_mining';

async function performDataPurification() {
    try {
        console.log('--- [Step 3] 데이터 전수 조사 및 정밀 복구 시작 ---');
        await mongoose.connect(MONGO_URI);

        // 모델 정의
        const User = mongoose.model('User', new mongoose.Schema({
            walletAddress: String,
            referrerCode: String
        }));
        const BonusRecord = mongoose.model('BonusRecord', new mongoose.Schema({
            walletAddress: String,
            referralRewardStorage: String,
            referralList: Array
        }));

        const allUsers = await User.find({});
        console.log(`📊 전체 가입자 수: ${allUsers.length}명`);

        let fixCount = 0;
        let warningCount = 0;

        for (const user of allUsers) {
            const record = await BonusRecord.findOne({ walletAddress: user.walletAddress });
            if (!record) {
                console.log(`⚠️  [Skipped] 보너스 기록 없음: ${user.walletAddress}`);
                continue;
            }

            // [진실의 공식 적용]
            // 1. 내가 추천한 사람 수 (1인당 1BW)
            const countReferrals = record.referralList ? record.referralList.length : 0;
            // 2. 내가 추천인을 타고 왔는가 (가입 보상 1BW)
            const hasReferrer = (user.referrerCode && user.referrerCode.trim().length > 0) ? 1 : 0;

            // 3. 이론적으로 가져야 할 정답 수치
            const targetScore = new Decimal(countReferrals).plus(hasReferrer);
            const currentAmount = new Decimal(record.referralRewardStorage || '0');

            if (!currentAmount.equals(targetScore)) {
                console.log(`🔧 [수정 필요] ${user.walletAddress}`);
                console.log(`   - 추천인 여부: ${hasReferrer ? 'YES' : 'NO'}`);
                console.log(`   - 내가 추천한 수: ${countReferrals}명`);
                console.log(`   - 현재값: ${currentAmount.toString()} -> 목표값: ${targetScore.toString()}`);

                record.referralRewardStorage = targetScore.toString();
                await record.save();
                fixCount++;
            } else {
                console.log(`✅ [정상] ${user.walletAddress} (현재: ${currentAmount.toString()} BW)`);
            }
        }

        console.log('\n--- 작업 결과 보고 ---');
        console.log(`✅ 데이터 정규화 완료: ${fixCount}명 수정`);
        console.log(`✨ 이제 홈페이지 현황판은 100% 진실된 수치만 표출됩니다.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ 정화 작업 중 치명적 오류:', error);
        process.exit(1);
    }
}

performDataPurification();
