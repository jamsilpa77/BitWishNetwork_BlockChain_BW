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
    mineBlock(block: BitWishBlock): Promise<BitWishMiningResult>;
    private executeMining;
    private adjustDifficulty;
    private calculateTimeAdjustment;
    private calculateTarget;
    private calculateHashRate;
    private updateMiningStats;
    validateBlock(block: BitWishBlock): {
        valid: boolean;
        error?: string;
    };
    stopMining(): void;
    getCurrentDifficulty(): number;
    getMiningStats(): BitWishMiningStats;
    getActiveJobs(): BitWishMiningJob[];
    isCurrentlyMining(): boolean;
    calculateExpectedMiningTime(difficulty?: number): number;
    calculateMiningProfitability(blockReward: number, electricityCost?: number, hashRate?: number): {
        profitable: boolean;
        dailyProfit: number;
        breakEvenHashRate: number;
    };
    estimateNetworkHashRate(blocks: BitWishBlock[]): number;
    getDifficultyHistory(blocks: BitWishBlock[]): Array<{
        blockHeight: number;
        difficulty: number;
        timestamp: number;
    }>;
}
//# sourceMappingURL=BitWishPoW.d.ts.map