import mongoose from 'mongoose';
import { splitFee64 } from '../utils/decimalUtil';
import Decimal from 'decimal.js';

export interface BlockMiningResult {
    success: boolean;
    blockHeight: number;
    totalBlockCount: number;
    distributedFee: {
        ecosystemFund: string;
        foundationFund: string;
    };
}

export class BlockMiningService {

    /**
     * [마이닝 블록 생성 및 수수료 즉시 분배 실행 코어]
     * 마이닝 버튼이 트리거되면 호출되어 블록을 적재하고 장부를 업데이트합니다.
     * @param walletAddress 채굴을 요청한 유저의 지갑 주소
     * @param session 단일 DB 트랜잭션 보장을 위한 몽구스 세션 (선택 사항)
     */
    public static async onMiningBlock(walletAddress: string, session?: any): Promise<BlockMiningResult> {
        try {
            // 1단계: 블록체인 메인넷 코어를 호출하여 새 PoW 블록을 bitwish_network.blocks 컬렉션에 생성 및 저장
            const bwChainCore = (global as any).bwChainCore || require('../index').bwChainCore;
            if (!bwChainCore) {
                throw new Error("BitWishBlockchain Core Engine is not initialized yet globally!");
            }
            const newBlock = await bwChainCore.createBlock(walletAddress);
            const currentHeight = newBlock.header.blockHeight || 1;

            // [채굴 증명 및 발행 트랜잭션 비동기 보존]
            (async () => {
                try {
                    const db = mongoose.connection.useDb('bitwish_network');
                    let BlockTxModel;
                    try {
                        BlockTxModel = db.model('BlockTransaction');
                    } catch {
                        const BlockTxSchema = new mongoose.Schema({
                            txId: { type: String, required: true, unique: true },
                            walletAddress: { type: String, required: true, index: true },
                            blockHeight: { type: Number, required: true },
                            amount: { type: String, default: '1.00000000' },
                            type: { type: String, default: 'Minting' },
                            status: { type: String, default: 'Confirmed' }
                        }, { timestamps: { createdAt: true, updatedAt: false } });
                        BlockTxSchema.index({ walletAddress: 1, blockHeight: -1 });
                        BlockTxModel = db.model('BlockTransaction', BlockTxSchema);
                    }

                    // 1BW 채굴 증명 트랜잭션 생성 및 저장
                    await new BlockTxModel({
                        txId: newBlock.hash || 'BW_TX_' + Math.random().toString(36).substring(2, 15),
                        walletAddress: walletAddress,
                        blockHeight: currentHeight,
                        amount: '1.00000000',
                        type: 'Minting',
                        status: 'Confirmed'
                    }).save();
                    console.log(`📦 [증명 블록 보존 완료] #${currentHeight} (Validator: ${walletAddress})`);
                } catch (txSaveErr) {
                    console.error("❌ [채굴 증명 트랜잭션 저장 실패]:", txSaveErr);
                }
            })();

            // 2단계: 블록 생성에 따른 마이닝 가스 수수료 기본값인 0.001 BW를 decimalUtil을 통해 6:4로 정밀 분할
            const feeAmount = "0.001";
            const { ecosystemFund, foundationFund } = splitFee64(feeAmount);

            // 3단계: 단일 MongoDB 호환 구조의 network_stats 컬렉션에 생태계 기금과 재단 운영비를 원자적으로 누적 업데이트
            const networkDb = mongoose.connection.useDb('bitwish_network');
            const statsCollection = networkDb.collection('network_stats');

            // 트랜잭션 내에서 기존 값을 조회하여 정밀 누적 연산 진행
            const stats = await statsCollection.findOne({ id: 'global_fund_stats' }, { session });
            const currentEco = new Decimal(stats?.ecosystemFund || '0');
            const currentFound = new Decimal(stats?.foundationFund || '0');
            const currentFees = new Decimal(stats?.totalAccumulatedFees || '0');

            const nextEco = currentEco.plus(new Decimal(ecosystemFund)).toString();
            const nextFound = currentFound.plus(new Decimal(foundationFund)).toString();
            const nextFees = currentFees.plus(new Decimal(feeAmount)).toString();

            await statsCollection.updateOne(
                { id: 'global_fund_stats' },
                {
                    $set: {
                        ecosystemFund: nextEco,
                        foundationFund: nextFound,
                        totalAccumulatedFees: nextFees,
                        lastUpdatedAt: Date.now()
                    }
                },
                { upsert: true, session } // 세션이 존재하면 트랜잭션에 참여
            );

            // 4단계: 실시간 대시보드 갱신을 위해 현재까지 쌓인 전체 블록 개수를 DB에서 직접 실시간 카운팅
            const totalBlockCount = await this.getTotalBlockCount();

            return {
                success: true,
                blockHeight: currentHeight,
                totalBlockCount: totalBlockCount,
                distributedFee: { ecosystemFund, foundationFund }
            };

        } catch (error) {
            console.error("[블록 마이닝 서비스 에러] 블록 생성 및 수수료 분배 중 예외 발생:", error);
            throw error;
        }
    }

    /**
     * [전체 블록 수 조회 전용 유틸]
     * bitwish_network.blocks 컬렉션의 document 총 개수(실제 PoW 물리 블록 수)를 반환합니다.
     * [1공정 수복] 기존 가짜 숫자 +30 오프셋 하드코딩을 삭제하고 100% 실재하는 블록 개수만 반환합니다.
     */
    public static async getTotalBlockCount(): Promise<number> {
        try {
            const networkDb = mongoose.connection.useDb('bitwish_network');
            const count = await networkDb.collection('blocks').countDocuments({});
            return count;
        } catch (error) {
            console.error("[블록 카운트 조회 에러]:", error);
            return 0;
        }
    }

    /**
     * [1공정 수복] 발행량 대비 누락 물리 블록(약 2,364개) 정규 PoW 소급 순차 마이닝 수복 엔진
     * 기존 1~N번 블록의 불변성(Immutability)을 100% 보존하면서, 
     * 누락된 수량에 대해 체인 최상단 높이부터 정규 PoW 마이닝 트랜잭션으로 순차 블록을 생성 적재합니다.
     */
    public static async auditAndSyncGlobalBlocks(): Promise<{ createdBlocks: number; totalBlocks: number }> {
        try {
            console.log("⛏️ [1공정 수복] 메인넷 전체 발행량 대비 누락 물리 블록 전수조사 및 PoW 소급 마이닝을 개시합니다...");
            const networkDb = mongoose.connection.useDb('bitwish_network');
            const miningDb = mongoose.connection.useDb('bitwish_mining');

            // 1. 현재 DB에 저장된 실제 PoW 물리 블록 개수 집계
            const currentBlockCount = await networkDb.collection('blocks').countDocuments({});

            // 2. 전 지갑의 실시간 발행 수량(개인 채굴 + 보너스 보관함 + 월간 정산금) 집계
            const miningStateAgg = await miningDb.collection('miningstates').aggregate([
                { $group: { _id: null, total: { $sum: { $toDouble: "$accumulatedReward" } } } }
            ]).toArray();
            const totalMined = new Decimal(miningStateAgg[0]?.total || 0);

            const bonusRecordAgg = await miningDb.collection('bonusrecords').aggregate([
                {
                    $group: {
                        _id: null,
                        totalReferral: { $sum: { $toDouble: "$referralRewardStorage" } },
                        totalBonus: { $sum: { $toDouble: "$referralBonusStorage" } }
                    }
                }
            ]).toArray();
            const totalBonus = new Decimal(bonusRecordAgg[0]?.totalReferral || 0)
                .plus(new Decimal(bonusRecordAgg[0]?.totalBonus || 0));

            const settlementAgg = await miningDb.collection('monthlysettlements').aggregate([
                { $group: { _id: null, total: { $sum: { $toDouble: "$totalAmount" } } } }
            ]).toArray();
            const totalSettled = new Decimal(settlementAgg[0]?.total || 0);

            // 총 실시간 발행 수량 (정수 변환)
            const totalSupplyDecimal = totalMined.plus(totalBonus).plus(totalSettled);
            const targetBlockCount = totalSupplyDecimal.floor().toNumber();

            console.log(`📊 [1공정 수복] 현재 메인넷 물리 블록 수: ${currentBlockCount}개 | 목표 발행량 정수 블록 수: ${targetBlockCount}개`);

            if (targetBlockCount > currentBlockCount) {
                const blocksToCreate = targetBlockCount - currentBlockCount;
                console.log(`🚀 [1공정 수복] 총 ${blocksToCreate}개의 누락 블록 소급 순차 PoW 마이닝 생성을 시작합니다...`);

                // 대표 시스템 Validator 지갑 명의로 정규 블록 순차 마이닝
                const systemValidator = 'BitWish-Miner-Pool';
                let createdCount = 0;

                for (let i = 0; i < blocksToCreate; i++) {
                    await this.onMiningBlock(systemValidator);
                    createdCount++;
                    if (createdCount % 100 === 0 || createdCount === blocksToCreate) {
                        const progress = ((createdCount / blocksToCreate) * 100).toFixed(1);
                        console.log(` └ ⛏️ [1공정 진행율 ${progress}%] ${createdCount}/${blocksToCreate}개 물리 블록 생성 및 체인 연결 완료`);
                    }
                }

                const finalBlockCount = await this.getTotalBlockCount();
                console.log(`✅ [1공정 수복 완료] 총 ${createdCount}개 정규 PoW 블록 생성 완료! (최종 메인넷 블록 수: ${finalBlockCount}개)`);
                return { createdBlocks: createdCount, totalBlocks: finalBlockCount };
            } else {
                console.log(`✅ [1공정 수복 검증] 메인넷 물리 블록이 발행량과 이미 100% 일치합니다. (블록 수: ${currentBlockCount}개)`);
                return { createdBlocks: 0, totalBlocks: currentBlockCount };
            }
        } catch (error) {
            console.error("❌ [1공정 소급 마이닝 에러] 글로벌 블록 수복 실행 중 예외 발생:", error);
            return { createdBlocks: 0, totalBlocks: 0 };
        }
    }

    /**
     * [5단계 수복] 정식 지갑 유저의 DB 누적 채굴량(정수 1 BW)과 물리 블록 1대1 동적 대조 및 자가 수복 엔진
     * 유저 수(17개/21개/N개)에 상관없이 DB를 동적 조회하여 부족한 블록을 즉시 매핑하고 잔여 소수점을 안전 보존합니다.
     * @param walletAddress 정식 가입 지갑 주소
     */
    public static async auditAndSyncUserBlocks(walletAddress: string): Promise<{ createdBlocks: number; currentThreshold: string }> {
        try {
            const miningDb = mongoose.connection.useDb('bitwish_mining');
            const stateColl = miningDb.collection('miningstates');
            const state = await stateColl.findOne({ walletAddress: new RegExp('^' + walletAddress + '$', 'i') });

            if (!state) return { createdBlocks: 0, currentThreshold: '0' };

            const accumulated = new Decimal(state.accumulatedReward || '0');
            const lastThreshold = new Decimal(state.lastBlockRewardThreshold || '0');
            const nextThreshold = lastThreshold.plus(1);

            if (accumulated.gte(nextThreshold)) {
                const blocksToCreate = accumulated.minus(lastThreshold).floor().toNumber();
                if (blocksToCreate > 0) {
                    console.log(`⛏️ [5단계 1대1 수복] ${walletAddress}: 누적 ${accumulated.toFixed(4)} BW → +${blocksToCreate}개 물리 블록 정밀 매핑`);
                    for (let i = 0; i < blocksToCreate; i++) {
                        await this.onMiningBlock(walletAddress);
                    }
                    const newThreshold = lastThreshold.plus(blocksToCreate).toString();
                    await stateColl.updateOne(
                        { _id: state._id },
                        { $set: { lastBlockRewardThreshold: newThreshold } }
                    );
                    return { createdBlocks: blocksToCreate, currentThreshold: newThreshold };
                }
            }
            return { createdBlocks: 0, currentThreshold: lastThreshold.toString() };
        } catch (err) {
            console.error(`❌ [5단계 1대1 대조 에러] ${walletAddress}:`, err);
            return { createdBlocks: 0, currentThreshold: '0' };
        }
    }
}