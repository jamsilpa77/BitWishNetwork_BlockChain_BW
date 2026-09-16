import mongoose from 'mongoose';
import { splitFee64 } from '../utils/decimalUtil';
import { bwChainCore } from '../index';
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
            const newBlock = await bwChainCore.createBlock(walletAddress);
            const currentHeight = newBlock.header.blockHeight || 1;

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
     * bitwish_network.blocks 컬렉션의 document 총 개수를 반환합니다.
     * 기본 제네시스 블록 1개 + 유저들의 추천 보상 총 30 BW 스냅샷(총 31)에서 출발합니다.
     */
    public static async getTotalBlockCount(): Promise<number> {
        try {
            const networkDb = mongoose.connection.useDb('bitwish_network');
            const count = await networkDb.collection('blocks').countDocuments({});
            return count + 30; // 30추천보상 스냅샷 오프셋 합산
        } catch (error) {
            console.error("[블록 카운트 조회 에러]:", error);
            return 31; // 기본 제네시스 1 + 추천 보상 30
        }
    }
}