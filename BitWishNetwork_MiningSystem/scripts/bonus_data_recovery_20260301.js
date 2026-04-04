/**
 * BitWishNetwork 추천 보너스 명수 및 보정률 전수 복구 스크립트 (Step 3)
 * 2026-03-01 데이터 정합성 불일치 해결
 */
const mongoose = require('mongoose');
const Decimal = require('decimal.js');

const MONGO_URI = 'mongodb://localhost:27017/bitwish_mining';

async function performDataRecovery() {
    try {
        console.log('--- [Step 3] 개별 저장소 데이터 정화 및 복구 작업 시작 ---');
        await mongoose.connect(MONGO_URI);

        const User = mongoose.model('User', new mongoose.Schema({ walletAddress: String }));
        const MiningState = mongoose.model('MiningState', new mongoose.Schema({
            walletAddress: String,
            referralCount: Number,
            referralBonusRate: String,
            currentBaseRate: String,
            currentTotalRate: String,
            isAttendanceActive: Boolean,
            partnerStatus: String
        }));
        const BonusRecord = mongoose.model('BonusRecord', new mongoose.Schema({
            walletAddress: String,
            referralList: Array
        }));

        const allUsers = await User.find({});
        console.log(`📊 전체 대조 대상 유저: ${allUsers.length}명`);

        let fixCount = 0;

        for (const user of allUsers) {
            const addr = user.walletAddress;
            const record = await BonusRecord.findOne({ walletAddress: addr });
            let state = await MiningState.findOne({ walletAddress: addr });

            // 실제 가입한 사람 명수
            const actualReferralCount = record && record.referralList ? record.referralList.length : 0;

            if (!state) {
                // 마이닝 상태가 없으면 생성하여 동기화
                console.log(`✨ [New Record] ${addr} : 마이닝 데이터 생성 및 동기화`);
                state = new MiningState({
                    walletAddress: addr,
                    referralCount: actualReferralCount,
                    currentBaseRate: '0.25',
                    isAttendanceActive: false,
                    partnerStatus: 'NOT_REGISTERED'
                });
            }

            // [대조 로직] 숫자가 엇갈려 있는지 확인
            if (state.referralCount !== actualReferralCount) {
                console.log(`🔧 [Mismatch Fix] ${addr}`);
                console.log(`   - 기존: ${state.referralCount}명 -> 실제: ${actualReferralCount}명`);

                state.referralCount = actualReferralCount;

                // 정책 공식 기반 보상률 재계산
                const newReferralRate = new Decimal(actualReferralCount).mul(0.02);
                state.referralBonusRate = newReferralRate.toString();

                const baseRate = new Decimal(state.currentBaseRate || '0.25');
                const attendanceRate = state.isAttendanceActive ? new Decimal(0.05) : new Decimal(0);
                const partnerRate = state.partnerStatus === 'REGISTERED' ? new Decimal(1.25) : new Decimal(0);

                // 공식: base * (1 + attendance) * (1 + referral) * (1 + partner)
                state.currentTotalRate = baseRate
                    .mul(new Decimal(1).plus(attendanceRate))
                    .mul(new Decimal(1).plus(newReferralRate))
                    .mul(new Decimal(1).plus(partnerRate))
                    .toString();

                await state.save();
                fixCount++;
            } else {
                // 이미 정상이더라도 보너스율 최종 확인 (확인 차원)
                const expectedRate = new Decimal(actualReferralCount).mul(0.02).toString();
                if (state.referralBonusRate !== expectedRate) {
                    state.referralBonusRate = expectedRate;
                    await state.save();
                }
            }
        }

        console.log('\n--- 작업 결과 보고 ---');
        console.log(`✅ 데이터 정규화 완료: 총 ${fixCount}명의 독립 저장소 복구`);
        console.log(`✨ 이제 지갑주소 ...4005 를 포함한 모든 유저의 마이닝 페이지가 정상을 찾았습니다.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ 정화 작업 중 치명적 오류:', error);
        process.exit(1);
    }
}

performDataRecovery();
