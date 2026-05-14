const mongoose = require('mongoose');
const Decimal = require('decimal.js');
const fs = require('fs');

Decimal.set({ precision: 50 });

const MONGODB_URI = 'mongodb://localhost:27017/bitwish_mining';

// 스키마 정의
const UserSchema = new mongoose.Schema({ walletAddress: String, myReferralCode: String, referrerCode: String, createdAt: Date }, { collection: 'users' });
const MiningStateSchema = new mongoose.Schema({ walletAddress: String, referralCount: Number, referralBonusRate: String }, { collection: 'miningstates' });
const BonusRecordSchema = new mongoose.Schema({ walletAddress: String, referralRewardStorage: String }, { collection: 'bonusrecords' });

const User = mongoose.model('User', UserSchema);
const MiningState = mongoose.model('MiningState', MiningStateSchema);
const BonusRecord = mongoose.model('BonusRecord', BonusRecordSchema);

async function runTotalAudit() {
    try {
        await mongoose.connect(MONGODB_URI);
        const users = await User.find().lean();
        console.log(`\n🚀 [BitWish Network] 전수 데이터 무결성 감사 시작 (총 ${users.length}명)`);
        console.log('='.repeat(100));

        const report = [];

        for (const user of users) {
            const addr = user.walletAddress;
            const addrRegex = new RegExp('^\\s*' + addr + '\\s*$', 'i');

            // 1. 실시간 실제 추천인(자식) 카운트
            const parentBase = (user.myReferralCode || '').substring(0, 11);
            const actualChildren = await User.find({
                $or: [
                    { referrerCode: new RegExp('^\\s*' + (user.myReferralCode || '').trim() + '\\s*$', 'i') },
                    { referrerCode: new RegExp('^\\s*' + (user.walletAddress || '').trim() + '\\s*$', 'i') },
                    { referrerCode: new RegExp('^' + parentBase, 'i') }
                ]
            }).lean();
            const actualChildCount = actualChildren.length;

            // 2. 부모 존재 여부 확인
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

            // 3. DB 수치 조회
            const state = await MiningState.findOne({ walletAddress: addrRegex }).lean();
            const bonus = await BonusRecord.findOne({ walletAddress: addrRegex }).lean();

            // 4. 수치 분석 (기대값 vs 실제값)
            const expectedReward = hasParent ? (actualChildCount + 1) : actualChildCount;
            const currentReward = new Decimal(bonus?.referralRewardStorage || 0);
            const rewardDiff = currentReward.minus(expectedReward);

            const expectedRate = new Decimal(0.02).plus(new Decimal(actualChildCount).mul(0.02));
            const currentRate = new Decimal(state?.referralBonusRate || 0);
            const rateDiff = currentRate.minus(expectedRate);

            // 5. 상태 판별
            let status = '✅ 정상';
            const issues = [];
            if (!rewardDiff.isZero()) {
                status = rewardDiff.gt(0) ? '❌ 과지급' : '⚠️ 미지급';
                issues.push(`Reward: ${rewardDiff.toFixed(2)}`);
            }
            if (!rateDiff.isZero()) {
                status = (status === '✅ 정상') ? (rateDiff.gt(0) ? '❌ 과지급' : '⚠️ 미지급') : '🔥 복합오류';
                issues.push(`Rate: ${rateDiff.mul(100).toFixed(0)}%`);
            }

            report.push({
                wallet: addr,
                createdAt: user.createdAt,
                parent: user.referrerCode || 'N/A',
                children: actualChildCount,
                reward: currentReward.toFixed(2),
                expectedReward: expectedReward.toFixed(2),
                rate: (currentRate.mul(100)).toFixed(0) + '%',
                expectedRate: (expectedRate.mul(100)).toFixed(0) + '%',
                status: status,
                issueDetail: issues.join(' | ')
            });
        }

        // 결과 출력 (표 형식)
        console.log('지갑주소 | 부모 | 자식 | 현재보상 | 기대보상 | 현재보너스 | 기대보너스 | 상태 | 세부내용');
        console.log('-'.repeat(100));
        report.forEach(r => {
            const dateStr = r.createdAt ? new Date(r.createdAt).toISOString().replace('T', ' ').substring(0, 19) : 'N/A';
            console.log(`${r.wallet} | ${dateStr} | ${r.children} | ${r.reward} | ${r.expectedReward} | ${r.rate} | ${r.expectedRate} | ${r.status} | ${r.issueDetail}`);
        });

        console.log('='.repeat(100));
        console.log(`✅ 전수 감사 완료: 총 ${users.length}명 분석됨.`);

    } catch (error) {
        console.error('감사 중 오류:', error);
    } finally {
        await mongoose.connection.close();
    }
}

runTotalAudit();
