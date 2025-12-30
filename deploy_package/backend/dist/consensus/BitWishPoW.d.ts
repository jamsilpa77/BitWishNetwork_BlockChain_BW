/**
 * ====================================================================================
 * 🚀 BitWish PoW 클래스 - BitWish Network 독립 블록체인 작업 증명 합의 알고리즘
 * ====================================================================================
 *
 * 🎯 핵심 기능:
 * - BitWish Network 전용 작업 증명 (Proof of Work)
 * - SHA-256 기반 해시 알고리즘
 * - 동적 난이도 조절
 * - 완벽한 독립성 보장
 *
 * 🔒 보안 기능:
 * - BitWish-256 해시 알고리즘
 * - ASIC 저항성 설계
 * - 51% 공격 방지
 * - 완벽한 보안 검증 시스템
 *
 * ⛏️ 마이닝 기능:
 * - 멀티스레드 마이닝 지원
 * - 마이닝 풀 지원
 * - 난이도 자동 조절
 * - 보상 시스템
 *
 * ====================================================================================
 */
import { EventEmitter } from 'events';
import { BitWishBlock } from '../core/BitWishBlock';
export interface BitWishMiningJob {
    block: BitWishBlock;
    target: string;
    difficulty: number;
    nonceStart: number;
    nonceEnd: number;
    timestamp: number;
}
export interface BitWishMiningResult {
    success: boolean;
    hash?: string;
    nonce?: number;
    difficulty?: number;
    iterations?: number;
    elapsedTime?: number;
    error?: string;
}
export interface BitWishMiningStats {
    totalHashes: number;
    hashRate: number;
    averageTime: number;
    successfulBlocks: number;
    failedAttempts: number;
    currentDifficulty: number;
}
export declare class BitWishPoW extends EventEmitter {
    private currentDifficulty;
    private targetBlockTime;
    private difficultyAdjustmentInterval;
    private lastAdjustmentBlock;
    private isMining;
    private miningStats;
    private activeJobs;
    constructor();
    /**
     * 블록 마이닝 시작
     */
    mineBlock(block: BitWishBlock): Promise<BitWishMiningResult>;
    /**
     * 마이닝 실행
     */
    private executeMining;
    /**
     * 난이도 조절
     */
    private adjustDifficulty;
    /**
     * 시간 조절 계산
     */
    private calculateTimeAdjustment;
    /**
     * 타겟 계산
     */
    private calculateTarget;
    /**
     * 해시율 계산
     */
    private calculateHashRate;
    /**
     * 마이닝 통계 업데이트
     */
    private updateMiningStats;
    /**
     * 블록 검증 (PoW)
     */
    validateBlock(block: BitWishBlock): {
        valid: boolean;
        error?: string;
    };
    /**
     * 마이닝 중지
     */
    stopMining(): void;
    /**
     * 현재 난이도 조회
     */
    getCurrentDifficulty(): number;
    /**
     * 마이닝 통계 조회
     */
    getMiningStats(): BitWishMiningStats;
    /**
     * 활성 마이닝 작업 조회
     */
    getActiveJobs(): BitWishMiningJob[];
    /**
     * 마이닝 중인지 확인
     */
    isCurrentlyMining(): boolean;
    /**
     * 예상 마이닝 시간 계산
     */
    calculateExpectedMiningTime(difficulty?: number): number;
    /**
     * 마이닝 수익성 계산
     */
    calculateMiningProfitability(blockReward: number, electricityCost?: number, // kWh당 비용
    hashRate?: number): {
        profitable: boolean;
        dailyProfit: number;
        breakEvenHashRate: number;
    };
    /**
     * 네트워크 해시율 추정
     */
    estimateNetworkHashRate(blocks: BitWishBlock[]): number;
    /**
     * 난이도 히스토리 조회
     */
    getDifficultyHistory(blocks: BitWishBlock[]): Array<{
        blockHeight: number;
        difficulty: number;
        timestamp: number;
    }>;
}
//# sourceMappingURL=BitWishPoW.d.ts.map