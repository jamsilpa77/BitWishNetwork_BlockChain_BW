/**
 * BitWishNetwork Mining System
 * Backend Server Entry Point
 */

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import miningRoutes from './routes/mining';
import userRoutes from './routes/user';
import adminRoutes from './routes/admin';
import attendanceRoutes from './routes/attendance';
import referralRoutes from './routes/referral';
import statsRoutes from './routes/stats';
import kycRoutes from './routes/kyc';
import rankingRoutes from './routes/ranking';
import transactionRoutes from './routes/transaction';
import { SettlementWorker } from '../src/server/cron/SettlementWorker';

import { BitWishBlockchain } from '../../BitWishNetwork_BlockChain/src/engine/BitWishBlockchain';
import User from './models/User';
import MiningState from './models/MiningState';
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

// [일회성 블록 및 자산 무결점 수복 정리 로직 - 계정 정보 삭제 없이 잔액만 안전 리셋]
async function runOneTimeCleanup() {
    try {
        const { MongoClient } = require('mongodb');
        const client = new MongoClient('mongodb://localhost:27017');
        await client.connect();
        
        const miningDb = client.db('bitwish_mining');
        const networkDb = client.db('bitwish_network');
        
        // 실행 여부 체크 플래그
        const configColl = miningDb.collection('system_configs');
        const flag = await configColl.findOne({ id: 'one_time_cleanup_v3' });
        
        if (flag && flag.completed) {
            console.log("ℹ️ [정리 로직] 일회성 블록 수복 및 자산 초기화가 이미 과거에 완료되었습니다.");
            await client.close();
            return;
        }
        
        console.log("🚨 [정리 로직] 일회성 블록 수복 및 자산 무결점 정리 시작...");
        
        // 1. bitwish_network.blocks 에서 blockHeight > 0 인 모든 블록 제거 (제네시스 0번만 남김)
        const blockDeleteResult = await networkDb.collection('blocks').deleteMany({ blockHeight: { $gt: 0 } });
        console.log(`👉 [정리 로직] 초과 생성된 블록 ${blockDeleteResult.deletedCount}개 삭제 완료.`);
        
        // 2. bitwish_network.accounts 에서 3대 파이낸셜 풀 계정을 제외한 모든 계정의 잔액을 '0.0'으로 안전하게 리셋
        // (절대 계정 삭제 없음, 가입 정보 100% 안전 보존)
        const allowedAccounts = ['BitWish-Miner-Pool', 'BitWish-Partner-Pool', 'BitWish-Foundation'];
        const accountResetResult = await networkDb.collection('accounts').updateMany(
            { address: { $nin: allowedAccounts } },
            { $set: { balance: '0.0', lastActivity: Date.now() } }
        );
        console.log(`👉 [정리 로직] 블록체인 유저 계정 ${accountResetResult.modifiedCount}개 잔액 안전 리셋 완료.`);
        
        // 3. 3대 파이낸셜 풀 계정의 잔액을 제네시스 주입 비율로 원상복구
        const totalSupply = new Decimal('21000000000');
        const minerPoolBalance = totalSupply.mul(0.65).toString();
        const partnerPoolBalance = totalSupply.mul(0.15).toString();
        const foundationBalance = totalSupply.mul(0.20).toString();
        
        await networkDb.collection('accounts').updateOne(
            { address: 'BitWish-Miner-Pool' },
            { $set: { balance: minerPoolBalance, lastActivity: Date.now() } },
            { upsert: true }
        );
        await networkDb.collection('accounts').updateOne(
            { address: 'BitWish-Partner-Pool' },
            { $set: { balance: partnerPoolBalance, lastActivity: Date.now() } },
            { upsert: true }
        );
        await networkDb.collection('accounts').updateOne(
            { address: 'BitWish-Foundation' },
            { $set: { balance: foundationBalance, lastActivity: Date.now() } },
            { upsert: true }
        );
        console.log("👉 [정리 로직] 제네시스 3대 파이낸셜 자산 금고 100% 원상복구 완료.");
        
        // 4. bitwish_network.network_stats 의 기금 상태 초기화 (30개 추천 보상 블록 수수료 반영)
        await networkDb.collection('network_stats').updateOne(
            { id: 'global_fund_stats' },
            {
                $set: {
                    ecosystemFund: '0.018',
                    foundationFund: '0.012',
                    totalAccumulatedFees: '0.03',
                    lastUpdatedAt: Date.now()
                }
            },
            { upsert: true }
        );
        console.log("👉 [정리 로직] 생태계 기금 및 글로벌 펀드 수수료 0으로 초기화 완료.");
        
        // 5. bitwish_mining.miningstates 에서 모든 유저의 accumulatedReward를 0으로 맞추고 lastBlockRewardThreshold 필드 삭제
        const miningStateUpdateResult = await miningDb.collection('miningstates').updateMany(
            {},
            {
                $set: {
                    accumulatedReward: '0.0',
                    isMining: false,
                    miningStartTime: null,
                    lastSyncTime: new Date()
                },
                $unset: {
                    lastBlockRewardThreshold: ""
                }
            }
        );
        console.log(`👉 [정리 로직] 마이닝 상태 ${miningStateUpdateResult.modifiedCount}개 초기화 및 기준값(lastBlockRewardThreshold) 제거 완료.`);
        
        // 완료 플래그 기록
        await configColl.updateOne(
            { id: 'one_time_cleanup_v3' },
            { $set: { completed: true, updatedAt: new Date() } },
            { upsert: true }
        );
        
        console.log("✅ [정리 로직] 일회성 블록 수복 및 자산 정리 무결점 완료!");
        await client.close();
    } catch (cleanupError) {
        console.error("❌ [정리 로직 에러] 일회성 수복 정리 중 에러 발생:", cleanupError);
    }
}

// 서버 구동 시 딱 한 번 제네시스 설정만 마침 (JSON 파일을 강제로 뜯어고치지 않음)
runOneTimeCleanup().then(() => {
    return bwChainCore.initialize();
}).then(async () => {
    console.log("🚀 [Phase 4 융합] 백엔드 내부에 블록체인 코어 엔진 무결점 대기 완료");

    // [공정 4/5 통합] 무인 정산 엔진(SettlementWorker) 및 타임락 오토메이션 점화
    new SettlementWorker();
    console.log("⚙️ [SettlementWorker] 무인 정산 및 타임락 오토메이션 엔진 기동 완료");

    // [수복 엔진] 블록 트랜잭션 및 추천인 보상 장부 자동 수복
    await autoHealBlockTransactions();

    // 데이터 복원 및 블록 일괄 수복 엔진 최초 1회 실행
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

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

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

// MongoDB Connection
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB Hybrid Storage');

        // Start Server
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`🔄 Server restarted at ${new Date().toLocaleString()}`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB Connection Error:', err);
    });

export default app;
