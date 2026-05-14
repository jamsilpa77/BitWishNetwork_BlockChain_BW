const mongoose = require('mongoose');
const Decimal = require('decimal.js');

// 50자리 정밀도 설정
Decimal.set({ precision: 50 });

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';

// 1. 스키마 정의
const UserSchema = new mongoose.Schema({
    walletAddress: String,
    myReferralCode: String,
    referrerCode: String,
    createdAt: Date
}, { collection: 'users' });

const MiningStateSchema = new mongoose.Schema({
    walletAddress: String,
    isMining: Boolean,
    accumulatedReward: String,
    currentBaseRate: String,
    currentTotalRate: String,
    referralCount: Number,
    referralBonusRate: String,
    lastSyncTime: Date
}, { collection: 'miningstates' });

const BonusRecordSchema = new mongoose.Schema({
    walletAddress: String,
    referralBonusStorage: String,
    referralRewardStorage: String,
    referralList: Array
}, { collection: 'bonusrecords' });

const User = mongoose.model('User', UserSchema);
const MiningState = mongoose.model('MiningState', MiningStateSchema);
const BonusRecord = mongoose.model('BonusRecord', BonusRecordSchema);

async function runUnifiedQuery(targetAddress) {
    try {
        await mongoose.connect(MONGODB_URI);

        const addr = targetAddress.trim();
        const addrRegex = new RegExp('^\\s*' + addr + '\\s*$', 'i');

        console.log(`\n🔍 [BW Intelligent Query Engine] 분석 타겟: ${addr}`);
        console.log('='.repeat(70));

        // 1. 기초 데이터 병렬 조회
        const [user, state, bonus] = await Promise.all([
            User.findOne({ walletAddress: addrRegex }).lean(),
            MiningState.findOne({ walletAddress: addrRegex }).lean(),
            BonusRecord.findOne({ walletAddress: addrRegex }).lean()
        ]);

        if (!user) {
            console.log('❌ 유저 데이터를 찾을 수 없습니다. (지갑 주소를 확인하세요)');
            return;
        }

        // 2. [핵심] 실시간 실제 추천인 전수 조사 (User DB 기준)
        const parentBase = (user.myReferralCode || '').substring(0, 11);
        const childSearchQuery = {
            $or: [
                { referrerCode: new RegExp('^\\s*' + (user.myReferralCode || '').trim() + '\\s*$', 'i') },
                { referrerCode: new RegExp('^\\s*' + (user.walletAddress || '').trim() + '\\s*$', 'i') },
                { referrerCode: new RegExp('^' + parentBase, 'i') }
            ]
        };
        const actualChildren = await User.find(childSearchQuery).lean();
        const actualChildCount = actualChildren.length;

        // 3. 분석 결과 출력 - 기본 정보
        console.log('\n[1] 기본 프로필 및 관계 (Profile & Relation)');
        console.log(`- 지갑 주소: ${user.walletAddress}`);
        console.log(`- 내 추천코드: ${user.myReferralCode || 'N/A'}`);
        console.log(`- 나의 추천인(부모): ${user.referrerCode || '없음 (ROOT)'}`);

        // 부모 존재 여부 확인
        let hasParent = false;
        if (user.referrerCode && user.referrerCode.trim() !== '' && user.referrerCode.toUpperCase() !== 'N/A') {
            const parent = await User.findOne({
                $or: [
                    { myReferralCode: new RegExp('^' + user.referrerCode.trim() + '$', 'i') },
                    { walletAddress: new RegExp('^' + user.referrerCode.trim() + '$', 'i') }
                ]
            }).lean();
            hasParent = !!parent;
            console.log(`  ㄴ 부모 확인: ${hasParent ? '✅ 연결됨 (' + parent.walletAddress + ')' : '⚠️ 코드만 존재 (실제 유저 미발견)'}`);
        }

        // 4. 수치 분석 - 보상 및 보너스 (Analysis)
        console.log('\n[2] 데이터 정밀 분석 (Data Delta Analysis)');

        // (A) 보상(Reward) 분석
        const expectedReward = hasParent ? (actualChildCount + 1) : actualChildCount;
        const currentReward = new Decimal(bonus?.referralRewardStorage || 0);
        const rewardDiff = currentReward.minus(expectedReward);

        let rewardStatus = '✅ 정상';
        if (rewardDiff.gt(0)) rewardStatus = `❌ 과지급 (+${rewardDiff.toFixed(2)} BW)`;
        else if (rewardDiff.lt(0)) rewardStatus = `⚠️ 미지급 (${rewardDiff.toFixed(2)} BW)`;

        console.log(`- 추천 보상(1BW): 현재 ${currentReward.toFixed(2)} BW | 기대값 ${expectedReward}.00 BW -> ${rewardStatus}`);

        // (B) 보너스율(Rate) 분석
        const expectedRate = new Decimal(0.02).plus(new Decimal(actualChildCount).mul(0.02));
        const currentRate = new Decimal(state?.referralBonusRate || 0);
        const rateDiff = currentRate.minus(expectedRate);

        let rateStatus = '✅ 정상';
        if (rateDiff.gt(0)) rateStatus = `❌ 과지급 (+${rateDiff.mul(100).toFixed(0)}%)`;
        else if (rateDiff.lt(0)) rateStatus = `⚠️ 미지급 (${rateDiff.mul(100).toFixed(0)}%)`;

        console.log(`- 추천 보너스(%): 현재 ${currentRate.mul(100).toFixed(0)}% | 기대값 ${expectedRate.mul(100).toFixed(0)}% -> ${rateStatus}`);

        // (C) 추천인 수 일치 여부
        const stateCount = state?.referralCount || 0;
        console.log(`- 추천인 명수: DB기록 ${stateCount}명 | 실시간조사 ${actualChildCount}명 -> ${stateCount === actualChildCount ? '✅ 일치' : '⚠️ 불일치'}`);

        // 5. 채굴 상태
        console.log('\n[3] 실시간 채굴 현황 (Mining Real-time)');
        if (state) {
            const now = new Date();
            const lastSync = new Date(state.lastSyncTime);
            const diffSeconds = Math.max(0, (now.getTime() - lastSync.getTime()) / 1000);

            const dbAccumulated = new Decimal(state.accumulatedReward || 0);
            const ratePerSecond = new Decimal(state.currentTotalRate || 0).div(3600);
            const additional = state.isMining ? ratePerSecond.mul(diffSeconds) : new Decimal(0);
            const realTimeAccumulated = dbAccumulated.plus(additional).toFixed(18);

            console.log(`- 채굴 상태: ${state.isMining ? '🚀 마이닝 중' : '💤 정지'}`);
            console.log(`- 실시간 예상: ${realTimeAccumulated} BW`);
            console.log(`- 최종 채굴률: ${state.currentTotalRate} BW/h`);
        }

        // 6. 추천인 명단 상세
        console.log('\n[4] 추천인 명단 전수 조사 (Referral List Details)');
        if (actualChildren.length > 0) {
            actualChildren.forEach((child, index) => {
                const prefix = (index === actualChildren.length - 1) ? '  └─' : '  ├─';
                console.log(`${prefix} [${index + 1}] ${child.walletAddress} (${new Date(child.createdAt).toLocaleDateString()})`);
            });
        } else {
            console.log('  └─ (데이터 없음)');
        }

        console.log('\n' + '='.repeat(70));
        console.log('✅ 분석 조회가 완료되었습니다.');

    } catch (error) {
        console.error('❌ 조회 중 치명적 오류 발생:', error);
    } finally {
        await mongoose.connection.close();
    }
}

// CLI 인자 처리
const target = process.argv[2];
if (!target) {
    console.log('사용법: node scripts/unified_admin_tool.js [지갑주소]');
    process.exit(1);
}

runUnifiedQuery(target);
