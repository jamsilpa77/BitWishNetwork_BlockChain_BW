const mongoose = require('mongoose');
const Decimal = require('decimal.js');

Decimal.set({ precision: 50 });

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';

// 1. 스키마 정의
const UserSchema = new mongoose.Schema({ walletAddress: String, myReferralCode: String, referrerCode: String, createdAt: Date }, { collection: 'users' });
const MiningStateSchema = new mongoose.Schema({ walletAddress: String, isMining: Boolean, currentBaseRate: String, currentTotalRate: String, referralCount: Number, referralBonusRate: String }, { collection: 'miningstates' });
const BonusRecordSchema = new mongoose.Schema({ walletAddress: String, referralRewardStorage: String }, { collection: 'bonusrecords' });

const User = mongoose.model('User', UserSchema);
const MiningState = mongoose.model('MiningState', MiningStateSchema);
const BonusRecord = mongoose.model('BonusRecord', BonusRecordSchema);

async function runGlobalDataSync() {
    const DRY_RUN = false; // true: 조회 및 분석만 수행 (DB 수정 안 함) / false: 실제 DB 수정

    try {
        await mongoose.connect(MONGODB_URI);
        const users = await User.find({ walletAddress: /BW29DFB/i }).lean();
        console.log(`\n🚀 [BitWish Global Sync Engine] ${DRY_RUN ? '시뮬레이션(조회)' : '실제교정(수술)'} 모드 가동`);
        console.log(`- 분석 대상: 총 ${users.length}명`);
        console.log('='.repeat(100));

        let targetCount = 0;

        for (const user of users) {
            const addr = user.walletAddress;
            const addrRegex = new RegExp('^\\s*' + addr + '\\s*$', 'i');

            // (1) 실시간 실제 추천인(자식) 전수 조사
            const parentBase = (user.myReferralCode || '').substring(0, 11);
            const actualChildren = await User.find({
                $or: [
                    { referrerCode: new RegExp('^\\s*' + (user.myReferralCode || '').trim() + '\\s*$', 'i') },
                    { referrerCode: new RegExp('^\\s*' + (user.walletAddress || '').trim() + '\\s*$', 'i') },
                    { referrerCode: new RegExp('^' + parentBase, 'i') }
                ]
            }).lean();
            const actualChildCount = actualChildren.length;

            // (2) 부모 실제 존재 여부 확인
            let hasParent = false;
            if (user.referrerCode && user.referrerCode.trim() !== '' && user.referrerCode.toUpperCase() !== 'N/A') {
                const parent = await User.findOne({
                    $or: [
                        { myReferralCode: new RegExp('^' + user.referrerCode.trim() + '$', 'i') },
                        { walletAddress: new RegExp('^' + user.referrerCode.trim() + '$', 'i') }
                    ]
                }).lean();
                hasParent = !!parent;
            }

            // (3) 기대값(정답) 계산 (수정된 정책 반영)
            // 보상 = (부모 있으면 1) + 자식수
            // 보너스 = (부모 있으면 0.02) + (자식수 * 0.02)
            const expectedReward = new Decimal(hasParent ? 1 : 0).plus(actualChildCount);
            const expectedRate = new Decimal(hasParent ? 0.02 : 0).plus(new Decimal(actualChildCount).mul(0.02));

            // (4) 현재 DB 상태 조회
            const state = await MiningState.findOne({ walletAddress: addrRegex });
            const bonus = await BonusRecord.findOne({ walletAddress: addrRegex });

            if (!state || !bonus) {
                console.log(`⚠️  [건너뜀] ${addr.substring(0, 10)}... : 마이닝 데이터가 생성되지 않은 유저입니다.`);
                continue;
            }

            const currentReward = new Decimal(bonus.referralRewardStorage || 0);
            const currentRate = new Decimal(state.referralBonusRate || 0);
            const currentCount = state.referralCount || 0;

            // (5) 불일치 판별 및 자동 교정
            const isRewardMismatch = !currentReward.equals(expectedReward);
            const isRateMismatch = !currentRate.equals(expectedRate);
            const isCountMismatch = currentCount !== actualChildCount;

            if (isRewardMismatch || isRateMismatch || isCountMismatch) {
                console.log(`\n🔧 [교정 대상 발견] ${addr}`);
                console.log(`  - 추천인수: ${currentCount} -> ${actualChildCount} (실시간조사)`);
                console.log(`  - 보상수치: ${currentReward.toFixed(2)} -> ${expectedReward.toFixed(2)} (자동동기화)`);
                console.log(`  - 보너스율: ${currentRate.mul(100).toFixed(0)}% -> ${expectedRate.mul(100).toFixed(0)}% (자동동기화)`);

                // A. MiningState 교정 (보너스율 반영 및 채굴 속도 재계산)
                const baseRate = new Decimal(state.currentBaseRate || '0.25');
                const newTotalRate = baseRate.plus(baseRate.mul(expectedRate)); // 공식: Base * (1 + BonusRate)

                state.referralCount = actualChildCount;
                state.referralBonusRate = expectedRate.toString();
                state.currentTotalRate = newTotalRate.toString();

                bonus.referralRewardStorage = expectedReward.toString();

                if (!DRY_RUN) {
                    await state.save();
                    await bonus.save();
                    console.log(`  ✅ [동기화 완료] 데이터 무결성 복구됨.`);
                } else {
                    console.log(`  🔍 [시뮬레이션] 위 수치로 교정될 예정입니다.`);
                }

                targetCount++;
            }
        }

        console.log('\n' + '='.repeat(100));
        console.log(`✅ 분석 완료: 총 ${users.length}명 중 ${targetCount}명이 교정 대상입니다. ${DRY_RUN ? '(현재 시뮬레이션 모드)' : '(수정 완료)'}`);

    } catch (error) {
        console.error('❌ 동기화 중 치명적 오류 발생:', error);
    } finally {
        await mongoose.connection.close();
    }
}

runGlobalDataSync();
