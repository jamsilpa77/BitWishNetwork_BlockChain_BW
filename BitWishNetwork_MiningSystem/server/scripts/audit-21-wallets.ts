import mongoose from 'mongoose';
import Decimal from 'decimal.js';

// 50자리 정밀도 설정
Decimal.set({ precision: 50 });

/**
 * 🔍 [1공정 초정밀 감사 스크립트] 21개 전 지갑 & 8명 채굴 유저 100% 전수조사
 * 
 * ⚠️ 원칙:
 * 1. DB의 어떠한 데이터도 수정하거나 조작하지 않는 100% 조회 전용(Read-Only) 스크립트
 * 2. 50자리 부동소수점 정밀도(Decimal.js)로 각 유저별 보유 BW 참값 계산
 * 3. 각 유저별 실물 블록 수(blocks, blocktransactions) 전수 대조
 */
async function audit21Wallets() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bitwish_mining';
        console.log("⚡ DB 연결 시도 중...", mongoUri);
        await mongoose.connect(mongoUri);

        const miningDb = mongoose.connection.useDb('bitwish_mining');
        const networkDb = mongoose.connection.useDb('bitwish_network');

        // 1. 전체 가입 유저 목록 조회
        const users = await miningDb.collection('users').find({}).sort({ createdAt: 1 }).toArray();
        console.log(`\n==================================================================================================`);
        console.log(`🔍 [1공정 초정밀 21개 지갑 전수조사 시작] 등록된 전체 지갑 수: ${users.length}개`);
        console.log(`==================================================================================================\n`);

        const nowMs = Date.now();
        let activeMinerCount = 0;
        let grandTotalBW = new Decimal(0);
        let grandTotalBlocksInDb = 0;

        const walletAuditReports: any[] = [];

        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const wallet = user.walletAddress;
            const walletRegex = new RegExp('^' + wallet.trim() + '$', 'i');

            // A. MiningState 조회
            const miningState = await miningDb.collection('miningstates').findOne({ walletAddress: walletRegex });
            const isMining = miningState?.isMining || false;
            if (isMining) activeMinerCount++;

            const accumulatedRewardStr = miningState?.accumulatedReward || '0';
            const baseAccReward = new Decimal(accumulatedRewardStr);

            // 실시간 liveBoost 연산 (채굴 중인 경우만 초단위 계산)
            let liveBoost = new Decimal(0);
            if (isMining && miningState) {
                const lastSync = miningState.lastSyncTime ? new Date(miningState.lastSyncTime).getTime() : nowMs;
                const elapsed = Math.max(0, (nowMs - lastSync) / 1000);
                if (elapsed > 0) {
                    const ratePerSec = new Decimal(miningState.currentTotalRate || '0.25').div(3600);
                    liveBoost = ratePerSec.mul(elapsed);
                }
            }
            const totalMiningReward = baseAccReward.plus(liveBoost);

            // B. MonthlySettlement 과거 확정 정산 조회
            const settlements = await miningDb.collection('monthlysettlements').find({ walletAddress: walletRegex }).toArray();
            let totalSettled = new Decimal(0);
            settlements.forEach(s => {
                totalSettled = totalSettled.plus(new Decimal(s.totalAmount || '0'));
            });

            // C. BonusRecord 추천 보상 및 추천 보너스 보관함 정밀 조회
            const bonusRecord = await miningDb.collection('bonusrecords').findOne({ walletAddress: walletRegex });
            const referralRewardStorage = new Decimal(bonusRecord?.referralRewardStorage || '0'); // 추천인 가입 1BW 보상 보관함
            const referralBonusStorage = new Decimal(bonusRecord?.referralBonusStorage || '0');   // 2% 채굴 누적 보너스 보관함
            const bonusStorage = new Decimal(bonusRecord?.bonusStorage || '0');                   // 기타 보너스 보관함

            // 총 보너스 자산 (referralRewardStorage + referralBonusStorage + bonusStorage)
            const totalBonusReward = referralRewardStorage.plus(referralBonusStorage).plus(bonusStorage);

            // D. 해당 유저의 최종 참값 보유 자산 (50자리 정밀도 연산)
            const userTotalBW = totalMiningReward.plus(totalSettled).plus(totalBonusReward);
            grandTotalBW = grandTotalBW.plus(userTotalBW);

            // E. 해당 유저의 DB 적재 물리 블록 수 전수 조사 (blocks 컬렉션)
            const userBlockCount = await networkDb.collection('blocks').countDocuments({
                $or: [
                    { "data.header.validator": walletRegex },
                    { "validator": walletRegex },
                    { "walletAddress": walletRegex }
                ]
            });

            // F. 해당 유저의 트랜잭션 수 조사 (blocktransactions 컬렉션)
            const userTxCount = await networkDb.collection('blocktransactions').countDocuments({
                walletAddress: walletRegex
            });

            grandTotalBlocksInDb += userBlockCount;

            const userFloorBW = userTotalBW.floor().toNumber();
            const blockDiff = userBlockCount - userFloorBW;

            walletAuditReports.push({
                index: i + 1,
                walletAddress: wallet,
                isMining,
                miningRate: miningState?.currentTotalRate || '0.25',
                pureMiningReward: totalMiningReward.toFixed(8), // 순수 채굴 누적 (accumulatedReward + liveBoost)
                referralRewardStorage: referralRewardStorage.toFixed(8), // 추천 보상 보관함 (1BW 등)
                referralBonusStorage: referralBonusStorage.toFixed(8),   // 추천 보너스 보관함 (2% 누적)
                settledAmount: totalSettled.toFixed(8),          // 확정 정산액
                totalBonusReward: totalBonusReward.toFixed(8),
                totalBW: userTotalBW.toFixed(8),                 // 참값 총 보유 BW
                floorBW: userFloorBW,
                userBlockCount,
                userTxCount,
                lastThreshold: miningState?.lastBlockRewardThreshold || '0',
                blockDiff
            });
        }

        // ──────────────────────────────────────────────────────────────────────────────────────────────────
        // 🔍 초정밀 21개 지갑 개별 항목 세부 분리 전수조사 리포트 출력
        // ──────────────────────────────────────────────────────────────────────────────────────────────────
        walletAuditReports.forEach(r => {
            const statusStr = r.isMining ? '⛏️ ACTIVE (채굴중)' : '💤 IDLE   (대기중)';
            const diffStr = r.blockDiff > 0 ? `⚠️ ${r.blockDiff}개 초과` : (r.blockDiff < 0 ? `⚠️ ${Math.abs(r.blockDiff)}개 부족` : '✅ 1:1일치');
            console.log(` ───────────── [지갑 ${String(r.index).padStart(2)}/21] ${r.walletAddress} ─────────────`);
            console.log(`  ├ 📌 상태: ${statusStr}`);
            console.log(`  ├ ① 실시간 순수 마이닝 누적 채굴량:  ${r.pureMiningReward} BW`);
            console.log(`  ├ ② 추천인 1BW 보상 보관함:       ${r.referralRewardStorage} BW`);
            console.log(`  ├ ③ 추천인 2% 마이닝 보너스 보관함: ${r.referralBonusStorage} BW`);
            console.log(`  ├ ④ 과거 확정 정산 원장 자산:      ${r.settledAmount} BW`);
            console.log(`  ├ 💎 [합계 참값 총 보유 자산]:      ${r.totalBW} BW (정수: ${r.floorBW} BW)`);
            console.log(`  └ 📦 DB 실제 저장된 실물 블록 수:  ${r.userBlockCount}개 (상태: ${diffStr})`);
            console.log(``);
        });

        // ──────────────────────────────────────────────────────────────────────────────────────────────────
        // ⛏️ 8명 채굴 유저 심층 감사 요약
        // ──────────────────────────────────────────────────────────────────────────────────────────────────
        const activeReports = walletAuditReports.filter(r => r.isMining);
        console.log(`==================================================================================================`);
        console.log(`⛏️ [실제 채굴 중인 유저 명확한 세부 보관함 항목 분리 리포트]`);
        console.log(`==================================================================================================`);

        activeReports.forEach(r => {
            console.log(` └ ⛏️ 지갑 주소: ${r.walletAddress}`);
            console.log(`    ├ ① 실시간 순수 마이닝 누적 채굴량 (대시보드 표시): ${r.pureMiningReward} BW (속도: ${r.miningRate} BW/h)`);
            console.log(`    ├ ② 추천 보상 보관함 수량 (1BW 지정 보상):         ${r.referralRewardStorage} BW`);
            console.log(`    ├ ③ 추천 보너스 보관함 수량 (2% 마이닝 누적 보너스):   ${r.referralBonusStorage} BW`);
            console.log(`    ├ ④ 과거 확정 정산 원장 자산 (MonthlySettlement):  ${r.settledAmount} BW`);
            console.log(`    ├ 💎 [합계 참값 총 보유 자산] (① + ② + ③ + ④):       ${r.totalBW} BW (정수 참값: ${r.floorBW} BW)`);
            console.log(`    └ 📦 DB 내 실제 저장된 실물 블록 수:                ${r.userBlockCount}개 (상태: ${r.blockDiff > 0 ? `⚠️ ${r.blockDiff}개 초과 양산` : '✅ 1:1일치'})`);
        });

        // ──────────────────────────────────────────────────────────────────────────────────────────────────
        // 🌐 메인넷 전체 참값 종합 검증 보고서
        // ──────────────────────────────────────────────────────────────────────────────────────────────────
        const netDbBlocks = await networkDb.collection('blocks').countDocuments({});
        const netDbTx = await networkDb.collection('blocktransactions').countDocuments({});

        console.log(`\n==================================================================================================`);
        console.log(`📊 [메인넷 전체 참값 종합 검증 보고서]`);
        console.log(` ├ 👥 총 가입 지갑 수:               ${users.length}개 지갑`);
        console.log(` ├ ⛏️ 실제 채굴 가동 유저:           ${activeReports.length}명 유저`);
        console.log(` ├ 💎 메인넷 전체 참값 총 BW 발행량:  ${grandTotalBW.toFixed(8)} BW (정수 참값: ${grandTotalBW.floor().toString()} BW)`);
        console.log(` ├ 📦 DB 내 실제 물리 블록 수 (blocks): ${netDbBlocks}개 블록`);
        console.log(` ├ 📝 DB 내 실제 트랜잭션 수 (blocktx): ${netDbTx}개 트랜잭션`);
        console.log(` └ ⚖️ 참값 BW 정수 대비 블록 수 오차:   ${netDbBlocks - grandTotalBW.floor().toNumber()}개 (물리 블록 ${netDbBlocks}개 vs 발행량 ${grandTotalBW.floor().toString()} BW)`);
        console.log(`==================================================================================================\n`);

        await mongoose.disconnect();

        await mongoose.disconnect();
    } catch (error) {
        console.error("❌ [감사 스크립트 실행 오류]:", error);
        process.exit(1);
    }
}

audit21Wallets();
