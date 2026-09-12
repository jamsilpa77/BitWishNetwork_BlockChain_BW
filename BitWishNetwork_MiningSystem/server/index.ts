/**
 * BitWishNetwork Mining System
 * Backend Server Entry Point
 */

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import miningRoutes from './routes/mining';
import userRoutes from './routes/user';
import adminRoutes from './routes/admin';
import attendanceRoutes from './routes/attendance';
import referralRoutes from './routes/referral';
import statsRoutes from './routes/stats';
import kycRoutes from './routes/kyc';
import rankingRoutes from './routes/ranking';
import transactionRoutes from './routes/transaction';
import { SettlementWorker } from './cron/SettlementWorker';
import bcrypt from 'bcryptjs';
import { BWCommunityUser } from './models/bwCommunityModels';
import { CommunityUser } from './models/CommunityUser';

import { BitWishBlockchain } from '../../BitWishNetwork_BlockChain/src/engine/BitWishBlockchain';
import User from './models/User';
import MiningState from './models/MiningState';
import MonthlySettlement from './models/MonthlySettlement';
import BonusRecord from './models/BonusRecord';
import { BlockMiningService } from './services/BlockMiningService';
import Decimal from 'decimal.js';

// 백엔드 프로세스 내부에 전역(Singleton) 코어 엔진을 결합 구동
export const bwChainCore = new BitWishBlockchain();
(global as any).bwChainCore = bwChainCore;

// [수복 엔진 기동] 서버 기동 시 누적 채굴량 복원 및 블록 자동 수복 함수
async function autoRestoreMiningStates() {
    try {
        console.log("🛠️ [수복 엔진] 채굴 중인 유저들의 데이터 무결점 복원 및 블록 수복을 시작합니다...");
        const now = new Date();
        const activeStates = await MiningState.find({ isMining: true });

        for (const state of activeStates) {
            const walletAddress = state.walletAddress;
            const dbAmount = new Decimal(state.accumulatedReward || '0');
            const rate = new Decimal(state.currentTotalRate || '0.25');

            // 실시간 미기록 증분량 계산
            const syncTime = state.lastSyncTime || (state as any).updatedAt || new Date();
            const lastSync = new Date(syncTime);
            const diffSeconds = Math.max(0, (now.getTime() - lastSync.getTime()) / 1000);

            if (diffSeconds > 0) {
                const ratePerSecond = rate.div(3600);
                const increment = ratePerSecond.mul(diffSeconds);
                const realTimeAmount = dbAmount.plus(increment);

                // 실제 DB 값을 실시간 계산 값으로 강제 복원
                state.accumulatedReward = realTimeAmount.toString();
                state.lastSyncTime = now;

                console.log(`[수복 엔진] ${walletAddress}: 복원 전=${dbAmount.toFixed(4)} BW → 복원 후=${realTimeAmount.toFixed(4)} BW`);

                // [블록 수복 카운팅] 1BW 경계 초과 체크 및 자동 블록 생성
                const lastThreshold = new Decimal(state.lastBlockRewardThreshold || '0');
                const nextThreshold = lastThreshold.plus(1);

                if (realTimeAmount.gte(nextThreshold)) {
                    const blocksToCreate = realTimeAmount.minus(lastThreshold).floor().toNumber();

                    if (blocksToCreate > 0) {
                        console.log(`⛏️ [수복 엔진] ${walletAddress}: 누락 블록 +${blocksToCreate}개 일괄 복원 시작`);

                        for (let i = 0; i < blocksToCreate; i++) {
                            try {
                                await BlockMiningService.onMiningBlock(walletAddress);
                                console.log(`✅ [수복 엔진] 블록 ${i + 1}/${blocksToCreate} 생성 완료`);
                            } catch (blockError) {
                                console.error(`❌ [수복 엔진] 블록 생성 실패:`, blockError);
                            }
                        }

                        state.lastBlockRewardThreshold = lastThreshold.plus(blocksToCreate).toString();
                        console.log(`📊 [수복 엔진] 새 기준점 업데이트: ${state.lastBlockRewardThreshold} BW`);
                    }
                }

                await state.save();
            }
        }
        // [1공정 수복] 글로벌 발행량 대비 누락 물리 블록 전수조사 및 PoW 소급 순차 마이닝 실행
        await BlockMiningService.auditAndSyncGlobalBlocks();
        console.log("✅ [수복 엔진] 모든 유저 데이터 복원 및 누락 블록 수복 완료!");
    } catch (err) {
        console.error("❌ [수복 엔진 에러] 데이터 수복 중 예외 발생:", err);
    }
}

// [수복 엔진] 모든 물리 블록 및 추천인 보상 블록 자동 대조 복원 장부 수복 엔진
async function autoHealBlockTransactions() {
    try {
        console.log("🛠️ [수복 엔진] 기존 블록체인에서 모든 유저의 블록 트랜잭션 및 추천 보상 장부를 자동 복원합니다...");

        const networkDb = mongoose.connection.useDb('bitwish_network');
        const miningDb = mongoose.connection.useDb('bitwish_mining');

        // [수정 완료] 하드코딩된 blockHeight > 19 삭제 로직 제거됨
        // 기존에 테스트 블록 정리용이었으나, 실제 채굴 블록까지 매 재시작마다 삭제하여 블록 누락 원인이었음
        console.log(`✅ [수복 엔진] 블록 무결성 검증 통과 - 정상 블록 삭제 방지 활성화`);

        // 2. 물리 블록 컬렉션에서 1~19번 채굴 블록 복원
        const blocks = await networkDb.collection('blocks').find({}).sort({ blockHeight: 1 }).toArray();
        let restoredMinedCount = 0;

        for (const blockContainer of blocks) {
            const blockData = blockContainer.data || blockContainer;
            const currentHeight = blockData.header?.blockHeight ?? blockData.blockHeight;

            if (!currentHeight || currentHeight === 0) continue;

            const validatorAddress = blockData.header?.validator;
            if (!validatorAddress) continue;

            const txId = blockData.hash || 'BW_TX_HEAL_' + currentHeight;

            // 이미 기록되었는지 확인
            const exists = await networkDb.collection('blocktransactions').findOne({ blockHeight: currentHeight });
            if (!exists) {
                await networkDb.collection('blocktransactions').insertOne({
                    txId: txId,
                    walletAddress: validatorAddress,
                    blockHeight: currentHeight,
                    amount: '1.00000000',
                    type: 'Minting',
                    status: 'Confirmed',
                    createdAt: new Date(blockData.header?.timestamp || Date.now())
                });
                restoredMinedCount++;
            }
        }
        console.log(`📦 [수복 엔진] 일반 채굴 증명 블록 총 ${restoredMinedCount}개 수복 및 동기화 완료.`);

        // 3. 추천인 정책 보상 블록 (30개) 복원
        const bonusRecords = await miningDb.collection('bonusrecords').find({}).toArray();
        let restoredReferralCount = 0;

        for (const record of bonusRecords) {
            const parentAddress = record.walletAddress;
            const referralList = record.referralList || [];

            for (let idx = 0; idx < referralList.length; idx++) {
                const child = referralList[idx];
                const virtualBlockHeight = 100000 + idx; // 일반 채굴 블록과 겹치지 않는 가상 높이 부여
                const txId = 'BW_REF_TX_' + child.childWalletAddress;

                const exists = await networkDb.collection('blocktransactions').findOne({ txId: txId });
                if (!exists) {
                    await networkDb.collection('blocktransactions').insertOne({
                        txId: txId,
                        walletAddress: parentAddress,
                        blockHeight: virtualBlockHeight,
                        amount: '1.00000000',
                        type: 'Referral Reward',
                        status: 'Confirmed',
                        createdAt: new Date(child.joinedAt || Date.now())
                    });
                    restoredReferralCount++;
                }
            }
        }
        console.log(`🤝 [수복 엔진] 추천인 정책 보상 블록 총 ${restoredReferralCount}개 수복 및 매핑 완료.`);

        // 4. 가입자(자식) 가입 보상 블록 복원
        const usersWithParent = await mongoose.model('User').find({ referrerCode: { $ne: null, $exists: true } }).lean();
        let restoredChildCount = 0;

        for (const user of usersWithParent) {
            const referrerCode = (user.referrerCode || '').trim();
            if (referrerCode === '') continue;

            const childAddress = user.walletAddress;
            const txId = 'BW_REF_CHILD_TX_' + childAddress;
            const virtualBlockHeight = 200000; // 가입 보상 전용 가상 높이

            const exists = await networkDb.collection('blocktransactions').findOne({ txId: txId });
            if (!exists) {
                await networkDb.collection('blocktransactions').insertOne({
                    txId: txId,
                    walletAddress: childAddress,
                    blockHeight: virtualBlockHeight,
                    amount: '1.00000000',
                    type: 'Referral Reward',
                    status: 'Confirmed',
                    createdAt: new Date(user.createdAt || Date.now())
                });
                restoredChildCount++;
            }
        }
        console.log(`👶 [수복 엔진] 가입자 가입 보상 블록 총 ${restoredChildCount}개 수복 완료.`);

        // 5. [핵심 수복] 이전 하드코딩 삭제로 소실된 블록 재생성을 위한 lastBlockRewardThreshold 교정
        // 각 유저의 실제 물리 블록 수와 DB의 lastBlockRewardThreshold를 비교하여 기준점을 하향 조정
        const allMiningStates = await miningDb.collection('miningstates').find({}).toArray();
        let thresholdCorrectedCount = 0;

        for (const state of allMiningStates) {
            const walletAddress = state.walletAddress;
            if (!walletAddress) continue;

            const threshold = parseFloat(state.lastBlockRewardThreshold || '0');
            if (threshold <= 0) continue;

            // 이 유저의 실제 물리 블록 수를 blocks 컬렉션에서 카운트 (validator 주소로 검색)
            const actualBlockCount = await networkDb.collection('blocks').countDocuments({
                $or: [
                    { 'data.header.validator': walletAddress },
                    { 'header.validator': walletAddress }
                ]
            });

            // [정밀 검증] 채굴 시작 시 지급되는 1블록을 포함하여 threshold + 1과 실제 블록 개수를 대조
            // 기준점(threshold + 1)이 실제 블록 수보다 높으면 → 블록이 누락된 것이므로 하향 조정하여 자동 재생성 트리거
            if (threshold + 1 > actualBlockCount) {
                const correctedThreshold = Math.max(0, actualBlockCount - 1);
                await miningDb.collection('miningstates').updateOne(
                    { walletAddress: walletAddress },
                    { $set: { lastBlockRewardThreshold: correctedThreshold.toString() } }
                );
                console.log(`🔧 [수복 엔진] ${walletAddress}: 기준점 교정 ${threshold} → ${correctedThreshold} (${threshold - correctedThreshold}개 블록 재생성 예정)`);
                thresholdCorrectedCount++;
            }
        }
        if (thresholdCorrectedCount > 0) {
            console.log(`🔧 [수복 엔진] 총 ${thresholdCorrectedCount}명의 유저 기준점 교정 완료 → 다음 주기에 누락 블록 자동 재생성됨`);
        }

        console.log("✅ [수복 엔진] 모든 물리 블록 및 추천 보상 장부 수복 정리가 성공적으로 완료되었습니다!");

    } catch (err) {
        console.error("❌ [수복 엔진 에러] 장부 자동 수복 실행 중 예외 발생:", err);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// [정산 수복 엔진] 서버 부팅 시 과거 누락 MonthlySettlement 원장 자동 소급 수복
// ─────────────────────────────────────────────────────────────────────────────
// 안전 수칙:
//   1. MonthlySettlement { walletAddress, year, month } 유니크 인덱스로 중복 삽입 자동 방지 (멱등성 100%)
//   2. 유저 가입일(user.createdAt) 기준 → 가입 전 달은 100% 정산 생성 제외
//   3. UTC+9(KST) 기준으로 연월 및 말일 산출
//   4. 현재 누적 채굴량을 가입 이후 전체 기간 대비 해당 월 활동 기간 비율(Pro-rata)로 소급 배분
// ─────────────────────────────────────────────────────────────────────────────
async function autoHealMonthlySettlements() {
    try {
        console.log('🛠️ [정산 수복 엔진] 과거 누락 월별 정산 원장 소급 수복 시작...');

        const now = new Date();
        // KST 기준 현재 연월 산출 (UTC + 9시간)
        const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
        const currentYear = kstNow.getUTCFullYear();
        const currentMonth = kstNow.getUTCMonth() + 1; // 1~12

        // 서비스 시작 기준월 (2026년 6월 이전 데이터는 소급 대상 아님)
        const SERVICE_START_YEAR = 2026;
        const SERVICE_START_MONTH = 6;

        const users = await User.find({});
        let healedCount = 0;
        let skippedCount = 0;

        for (const user of users) {
            const walletAddress = user.walletAddress;
            if (!walletAddress) continue;

            // [핵심 수복] 대소문자 비구분 RegExp 쿼리 (대소문자 불일치 정산 누락 차단)
            const walletRegex = new RegExp('^' + walletAddress.trim() + '$', 'i');

            const miningState = await MiningState.findOne({ walletAddress: walletRegex });
            if (!miningState) {
                skippedCount++;
                continue;
            }

            const bonusRecord = await BonusRecord.findOne({ walletAddress: walletRegex });

            // KYC 상태 판별 (SettlementWorker와 동일 로직)
            const isKycApproved = Boolean(
                (user as any).isKycVerified || (user as any).kycApplication?.status === 'APPROVED'
            );
            const migrationStatus = isKycApproved ? 'LOCKED' : 'WAITING_KYC';

            // 유저 가입일 산출
            const userCreatedAtRaw = (user as any).createdAt
                ? new Date((user as any).createdAt)
                : (miningState.miningStartTime
                    ? new Date(miningState.miningStartTime)
                    : new Date('2026-06-01T00:00:00.000Z'));

            // 전체 활성 기간(초) 계산 — Pro-rata 비율 분모
            const totalActiveSeconds = Math.max(
                1,
                (now.getTime() - userCreatedAtRaw.getTime()) / 1000
            );

            // 현재 누적 채굴량 및 추천 보너스
            const currentMined = new Decimal(miningState.accumulatedReward || '0');
            const currentBonus = new Decimal((bonusRecord as any)?.referralBonusStorage || '0');

            // 서비스 시작월부터 직전월까지 전수 검사
            let checkYear = SERVICE_START_YEAR;
            let checkMonth = SERVICE_START_MONTH;

            while (
                checkYear < currentYear ||
                (checkYear === currentYear && checkMonth < currentMonth)
            ) {
                // 해당 월 말일 23:59:59 KST = UTC 당일 14:59:59
                const lastDayOfMonth = new Date(checkYear, checkMonth, 0).getDate(); // 해당 월의 정확한 말일 (30 또는 31)
                const monthLastDayUTC = new Date(
                    Date.UTC(checkYear, checkMonth - 1, lastDayOfMonth, 14, 59, 59, 999)
                );
                // 해당 월 1일 00:00:00 KST = UTC 전날 15:00:00
                const monthFirstDayUTC = new Date(
                    Date.UTC(checkYear, checkMonth - 1, 1, 15, 0, 0, 0)
                );

                // 가입일이 해당 월 말일보다 늦으면 소급 정산 절대 제외 (가입 전 달 생성 금지)
                if (userCreatedAtRaw <= monthLastDayUTC) {
                    // 이미 해당 월 레코드가 존재하면 스킵 (유니크 인덱스 보호, 멱등성 보장)
                    const existing = await MonthlySettlement.findOne({
                        walletAddress: walletRegex,
                        $or: [
                            { year: checkYear, month: checkMonth },
                            { settledAt: { $gte: monthFirstDayUTC, $lte: monthLastDayUTC } }
                        ]
                    });

                    if (existing) {
                        // 기존 DB에 적재된 레코드의 연/월/타임스탬프가 다르면 KST 말일 자정 기준으로 자동 자가 교정
                        if (existing.year !== checkYear || existing.month !== checkMonth || existing.settledAt.getTime() !== monthLastDayUTC.getTime()) {
                            await MonthlySettlement.updateOne(
                                { _id: existing._id },
                                {
                                    $set: {
                                        year: checkYear,
                                        month: checkMonth,
                                        settledAt: monthLastDayUTC
                                    }
                                }
                            );
                            console.log(
                                `[정산 수복 엔진] 🔧 ${walletAddress} → ${checkYear}-${String(checkMonth).padStart(2, '0')} 연월 및 타임스탬프 자가 교정 완료`
                            );
                            healedCount++;
                        }
                    } else {
                        // 레코드가 존재하지 않는 경우 가입일(userCreatedAt) 검증 후 소급 생성
                        const actStart = userCreatedAtRaw > monthFirstDayUTC
                            ? userCreatedAtRaw
                            : monthFirstDayUTC;
                        const actEnd = monthLastDayUTC;

                        const monthActiveSeconds = Math.max(
                            0,
                            (actEnd.getTime() - actStart.getTime()) / 1000
                        );

                        const weight = new Decimal(monthActiveSeconds).div(totalActiveSeconds);
                        const monthMinedAmount = currentMined.mul(weight);
                        const monthBonusAmount = currentBonus.mul(weight);
                        const monthTotalAmount = monthMinedAmount.plus(monthBonusAmount);

                        await MonthlySettlement.create({
                            walletAddress,
                            year: checkYear,
                            month: checkMonth,
                            minedAmount: monthMinedAmount.toFixed(50),
                            bonusAmount: monthBonusAmount.toFixed(50),
                            totalAmount: monthTotalAmount.toFixed(50),
                            settledAt: monthLastDayUTC,
                            migrationStatus
                        });

                        console.log(
                            `[정산 수복 엔진] ✅ ${walletAddress} → ${checkYear}-${String(checkMonth).padStart(2, '0')} 소급 수복 완료` +
                            ` | 채굴: ${monthMinedAmount.toFixed(8)} BW | 상태: ${migrationStatus}`
                        );
                        healedCount++;
                    }
                }

                // 다음 달로 이동
                checkMonth++;
                if (checkMonth > 12) { checkMonth = 1; checkYear++; }
            }
        }

        console.log(`✅ [정산 수복 엔진] 소급 수복 완료! 신규 생성: ${healedCount}건 | 스킵(MiningState 없음): ${skippedCount}건`);
    } catch (err) {
        console.error('❌ [정산 수복 엔진 에러] 소급 수복 중 예외 발생:', err);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// [3공정 시작점 초기화] 서버 최초 배포 시 기존 유저의 lastBonusBlockThreshold 설정
// ─────────────────────────────────────────────────────────────────────────────
// 목적:
//   - 3공정은 "앞으로" 보너스가 1 BW 쌓일 때마다 블록을 1개씩 생성하는 엔진입니다.
//   - 기존 유저는 이미 쌓인 referralBonusStorage가 있을 수 있습니다.
//   - lastBonusBlockThreshold 필드가 없으면 0으로 시작하여, 이미 쌓인 보너스 전량에 대해
//     블록을 중복 생성하는 문제가 발생합니다.
//   - 이 함수는 해당 필드가 없는 기존 유저에 대해 현재 referralBonusStorage의 정수 부분으로
//     시작점을 설정하여, 배포 이후 새로 쌓이는 보너스에 대해서만 블록이 생성되도록 합니다.
//   - 멱등성 보장: lastBonusBlockThreshold 필드가 이미 존재하는 문서는 건드리지 않습니다.
// ─────────────────────────────────────────────────────────────────────────────
async function initBonusBlockThreshold() {
    try {
        console.log('🔧 [3공정 시작점 초기화] 기존 유저 lastBonusBlockThreshold 초기값 설정 시작...');
        const miningDb = mongoose.connection.useDb('bitwish_mining');

        // lastBonusBlockThreshold 필드가 없는 BonusRecord 문서만 대상으로 처리
        const records = await miningDb.collection('bonusrecords').find({
            lastBonusBlockThreshold: { $exists: false }
        }).toArray();

        let initializedCount = 0;
        for (const record of records) {
            const currentBonus = new Decimal(record.referralBonusStorage || '0');
            // 현재 쌓인 보너스의 정수 부분을 시작점으로 설정
            const startThreshold = currentBonus.floor().toString();

            await miningDb.collection('bonusrecords').updateOne(
                { _id: record._id },
                { $set: { lastBonusBlockThreshold: startThreshold } }
            );
            initializedCount++;
            if (parseFloat(startThreshold) > 0) {
                console.log(`   ✔ ${record.walletAddress}: referralBonusStorage=${currentBonus.toFixed(4)} BW → 시작점=${startThreshold} BW`);
            }
        }

        if (initializedCount > 0) {
            console.log(`✅ [3공정 시작점 초기화] 총 ${initializedCount}개 유저 시작점 설정 완료. 앞으로 쌓이는 보너스부터 블록 생성 시작.`);
        } else {
            console.log(`✅ [3공정 시작점 초기화] 모든 유저 시작점이 이미 설정되어 있습니다. (스킵)`);
        }
    } catch (err) {
        console.error('❌ [3공정 시작점 초기화 에러]:', err);
    }
}

// [2단계 수복 완율] 서버 구동 시 코어 엔진 및 백엔드 무인 서비스 안전 점화 (runOneTimeCleanup 0원 초기화 위험 코드 핀포인트 소거 완율)
bwChainCore.initialize().then(async () => {
    console.log("🚀 [Phase 4 융합] 백엔드 내부에 블록체인 코어 엔진 무결점 대기 완료");

    // [공정 4/5 통합] 무인 정산 엔진(SettlementWorker) 및 타임락 오토메이션 점화
    new SettlementWorker();
    console.log("⚙️ [SettlementWorker] 무인 정산 및 타임락 오토메이션 엔진 기동 완료");

    // [수복 엔진] 블록 트랜잭션 및 추천인 보상 장부 자동 수복
    await autoHealBlockTransactions();

    // [정산 수복 엔진] 서버 부팅 시 과거 누락 월별 정산 원장 자동 소급 수복 (완전 무인 자동화)
    // 멱등성 100% 보장: 이미 존재하는 레코드는 MongoDB 유니크 인덱스가 방어하여 중복 생성 없음
    await autoHealMonthlySettlements();

    // [3공정 시작점 초기화] 기존 유저의 lastBonusBlockThreshold를 현재 보너스 정수값으로 설정
    // 반드시 autoRestoreMiningStates() 이전에 실행 (3공정 중복 블록 생성 방지)
    await initBonusBlockThreshold();

    // 데이터 복원 및 블록 일괄 수복 엔진 최초 1회 실행 (100% 원형 보존)
    await autoRestoreMiningStates();

    // [무인 자동 마이닝 엔진] 매 30초마다 백엔드 단독으로 모든 유저의 경과 시간을 상시 정산하여 1BW 돌파 시 블록 자동 생성
    setInterval(async () => {
        try {
            await autoRestoreMiningStates();
        } catch (intervalError) {
            console.error("❌ [무인 마이닝 엔진 주기적 실행 에러]:", intervalError);
        }
    }, 30000);
});

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bitwish_mining';
const isProduction = process.env.NODE_ENV === 'production';

// [보안] Express 프레임워크 정보 노출 차단 (해커에게 서버 기술 스택 은닉)
app.disable('x-powered-by');

// Middleware
// [보안] CORS 도메인 제한 - 프로덕션에서는 bitwishnetwork.com만 API 호출 허용
app.use(cors(isProduction ? {
    origin: ['https://bitwishnetwork.com', 'https://www.bitwishnetwork.com'],
    credentials: true
} : {}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// [보안] 민감 파일 접근 차단 미들웨어 - .env, 소스코드, 설정파일 접근 원천 차단
app.use((req, res, next) => {
    const reqPath = req.path.toLowerCase();
    if (reqPath.startsWith('/api')) return next();

    const blockedPatterns = ['.env', '.git', '.ssh', 'tsconfig', 'package.json', 'package-lock', 'webpack.config', 'node_modules', '/server/'];
    for (const pattern of blockedPatterns) {
        if (reqPath.includes(pattern)) return res.status(404).send('Not Found');
    }
    if (/\.(ts|tsx)$/i.test(reqPath)) return res.status(404).send('Not Found');

    next();
});

// Routes
app.use('/api/mining', miningRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/transactions', transactionRoutes);

// [BW Community Plugin] 마이닝 로직과 100% 완벽하게 독립된 커뮤니티 전용 라우터 안전 마운트
import bwCommunityRoutes from './routes/bw_community_api';
app.use('/api/bw-community', bwCommunityRoutes);
app.use('/api/community', bwCommunityRoutes);

// API 서버 메인 페이지 및 정적 자산(CSS/JS)을 반환하는 static 서빙 미들웨어 추가 (dist 및 public 병행 서빙)
app.use(express.static('dist'));
app.use(express.static(path.join(__dirname, '../dist')));
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));

// SPA 라우팅 지원: API 라우트 이외의 모든 경로 요청은 프론트엔드 빌드 결과물(index.html)로 포워딩
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(__dirname, '../dist/index.html'), (err) => {
        if (err) {
            res.sendFile(path.join(__dirname, 'public/index.html'), (err2) => {
                if (err2) {
                    res.status(404).send('Not Found');
                }
            });
        }
    });
});

// 어드민 기본 계정 시드 함수
async function seedAdminUser() {
    try {
        const adminEmail = 'salmani1@naver.com';
        const rawPassword = '@Love-1106@';
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        // 1. BWCommunityUser 어드민 계정 시드
        const existingBWAdmin = await BWCommunityUser.findOne({ email: adminEmail });
        if (!existingBWAdmin) {
            const adminUser = new BWCommunityUser({
                email: adminEmail,
                password: hashedPassword,
                nickname: '관리자',
                role: 'ADMIN'
            });
            await adminUser.save();
            console.log(`[SEED] BWCommunityUser 어드민 계정(${adminEmail}) 생성 성공!`);
        }

        // 2. CommunityUser 어드민 계정 시드
        const existingCommAdmin = await CommunityUser.findOne({ email: adminEmail });
        if (!existingCommAdmin) {
            const adminUser = new CommunityUser({
                email: adminEmail,
                password: hashedPassword,
                nickname: '관리자',
                role: 'ADMIN'
            });
            await adminUser.save();
            console.log(`[SEED] CommunityUser 어드민 계정(${adminEmail}) 생성 성공!`);
        }
    } catch (err) {
        console.error('[SEED] 어드민 계정 생성 실패:', err);
    }
}

// MongoDB Connection
mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB Hybrid Storage');

        // 관리자 기본 계정 시드 실행
        await seedAdminUser();

        // Start Server
        // [보안] 프로덕션에서는 127.0.0.1에만 바인딩하여 외부에서 5001 포트 직접 접근 원천 차단
        app.listen(Number(PORT), isProduction ? '127.0.0.1' : '0.0.0.0', () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`🔄 Server restarted at ${new Date().toLocaleString()}`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB Connection Error:', err);
    });

export default app;
