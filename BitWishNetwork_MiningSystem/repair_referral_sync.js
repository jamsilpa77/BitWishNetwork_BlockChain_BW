const mongoose = require('mongoose');
const Decimal = require('decimal.js');

// 1. 필요한 DB 스키마 불러오기 (이미 정의된 경우 대체 가능)
// 이 스크립트는 자체적으로 스키마를 구성하여 실행 독립성을 보장합니다.
mongoose.connect('mongodb://localhost:27017/bitwish_mining', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const bonusRecordSchema = new mongoose.Schema({}, { strict: false });
const BonusRecord = mongoose.models.BonusRecord || mongoose.model('BonusRecord', bonusRecordSchema, 'bonusrecords');

const miningStateSchema = new mongoose.Schema({}, { strict: false });
const MiningState = mongoose.models.MiningState || mongoose.model('MiningState', miningStateSchema, 'miningstates');

async function repairReferralData() {
    console.log("===============================================================");
    console.log("[START] 과거 오염 데이터 일괄 정비 스크립트 가동 (2-1단계: 3번)");
    console.log("===============================================================");

    try {
        const allBonusRecords = await BonusRecord.find({});
        console.log(`[INFO] 총 탐색된 BonusRecord 개수: ${allBonusRecords.length}개`);

        let repairedCount = 0;

        for (const record of allBonusRecords) {
            const walletAddress = record.walletAddress;
            const referralList = record.referralList || [];
            const realReferralCount = referralList.length;

            // 1. 추천보상보관함 (1BW) 무결성 복구
            // 원칙: 가입기본 1.0 BW + 내가 추천으로 데려온 명당 1.0 BW
            // 이미 1.0 이상인 경우(신규가입자)는 명수만큼만 합산하여 중복 계산을 물리적으로 차단함.
            const correctReferralReward = new Decimal(1).plus(new Decimal(realReferralCount)).toString();
            
            let isUpdated = false;

            if (record.referralRewardStorage !== correctReferralReward) {
                console.log(`[REPAIR] 지갑(${walletAddress}) 1BW 보상 오류 감지: 현재 ${record.referralRewardStorage} -> ${correctReferralReward} 로 수리`);
                record.referralRewardStorage = correctReferralReward;
                isUpdated = true;
            }

            if (isUpdated) {
                await BonusRecord.updateOne({ _id: record._id }, { $set: { referralRewardStorage: record.referralRewardStorage } });
            }

            // 2. MiningState 명수(Count) 및 2% 배율(Rate) 무결성 복구
            const miningState = await MiningState.findOne({ walletAddress: walletAddress });
            if (miningState) {
                const currentCount = miningState.referralCount || 0;
                
                // [Phase 2-1 로직 적용] 명수가 틀리거나 강제 재검증
                const initialBonus = new Decimal(0.02);
                const correctRate = initialBonus.plus(new Decimal(realReferralCount).mul(0.02)).toString();

                if (currentCount !== realReferralCount || miningState.referralBonusRate !== correctRate) {
                    console.log(`[REPAIR] 지갑(${walletAddress}) 2% 배율 오류 감지: 명수 ${currentCount}->${realReferralCount}, 배율 ${miningState.referralBonusRate}->${correctRate}`);
                    
                    miningState.referralCount = realReferralCount;
                    miningState.referralBonusRate = correctRate;

                    // 전체 퍼센티지 재소립
                    const baseRate = new Decimal(miningState.currentBaseRate || '0.25');
                    const attendanceRate = miningState.isAttendanceActive ? new Decimal(0.05) : new Decimal(0);
                    const partnerRate = miningState.partnerStatus === 'REGISTERED' ? new Decimal(1.25) : new Decimal(0);

                    miningState.currentTotalRate = baseRate
                        .mul(new Decimal(1).plus(attendanceRate))
                        .mul(new Decimal(1).plus(new Decimal(correctRate)))
                        .mul(new Decimal(1).plus(partnerRate))
                        .toString();

                    await MiningState.updateOne(
                        { _id: miningState._id }, 
                        { $set: { 
                            referralCount: miningState.referralCount,
                            referralBonusRate: miningState.referralBonusRate,
                            currentTotalRate: miningState.currentTotalRate
                        }}
                    );
                    isUpdated = true;
                }
            }

            if (isUpdated) {
                repairedCount++;
            }
        }

        console.log("===============================================================");
        console.log(`[SUCCESS] 정비 완료! 오염 및 불일치가 발견되어 수리된 총 지갑 수: ${repairedCount}개`);
        console.log("===============================================================");
        process.exit(0);

    } catch (err) {
        console.error("[ERROR] 정비 중 치명적 오류 발생:", err);
        process.exit(1);
    }
}

repairReferralData();
