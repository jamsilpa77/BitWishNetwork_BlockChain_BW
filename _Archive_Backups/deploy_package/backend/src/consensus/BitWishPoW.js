"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BitWishPoW = void 0;
const events_1 = require("events");
const BitWishConfig_1 = require("../config/BitWishConfig");
class BitWishPoW extends events_1.EventEmitter {
    constructor() {
        super();
        this.isMining = false;
        this.activeJobs = new Map();
        this.currentDifficulty = BitWishConfig_1.BITWISH_CONSENSUS_CONFIG.MIN_DIFFICULTY;
        this.targetBlockTime = BitWishConfig_1.BITWISH_CONSENSUS_CONFIG.TARGET_BLOCK_TIME;
        this.difficultyAdjustmentInterval = BitWishConfig_1.BITWISH_CONSENSUS_CONFIG.DIFFICULTY_ADJUSTMENT_INTERVAL;
        this.lastAdjustmentBlock = 0;
        this.miningStats = {
            totalHashes: 0,
            hashRate: 0,
            averageTime: 0,
            successfulBlocks: 0,
            failedAttempts: 0,
            currentDifficulty: this.currentDifficulty
        };
    }
    async mineBlock(block) {
        try {
            const startTime = Date.now();
            this.isMining = true;
            this.adjustDifficulty(block.header.blockHeight);
            const target = this.calculateTarget(this.currentDifficulty);
            const job = {
                block: block,
                target: target,
                difficulty: this.currentDifficulty,
                nonceStart: 0,
                nonceEnd: Number.MAX_SAFE_INTEGER,
                timestamp: Date.now()
            };
            this.activeJobs.set(block.hash || 'unknown', job);
            this.emit('miningStarted', job);
            const result = await this.executeMining(job);
            const endTime = Date.now();
            result.elapsedTime = endTime - startTime;
            this.updateMiningStats(result);
            this.activeJobs.delete(block.hash || 'unknown');
            this.emit('miningCompleted', result);
            this.isMining = false;
            return result;
        }
        catch (error) {
            this.isMining = false;
            const errorResult = {
                success: false,
                error: error instanceof Error ? error.message : '알 수 없는 오류'
            };
            this.emit('miningFailed', errorResult);
            return errorResult;
        }
    }
    async executeMining(job) {
        let nonce = job.nonceStart;
        let iterations = 0;
        const maxIterations = 10000000;
        while (nonce <= job.nonceEnd && iterations < maxIterations) {
            job.block.header.nonce = nonce;
            const hash = job.block.calculateHash();
            iterations++;
            this.miningStats.totalHashes++;
            if (hash.startsWith(job.target)) {
                return {
                    success: true,
                    hash: hash,
                    nonce: nonce,
                    difficulty: job.difficulty,
                    iterations: iterations
                };
            }
            nonce++;
            if (iterations % 100000 === 0) {
                this.emit('miningProgress', {
                    iterations: iterations,
                    currentNonce: nonce,
                    hashRate: this.calculateHashRate(iterations, Date.now() - job.timestamp)
                });
            }
        }
        return {
            success: false,
            error: '마이닝 시간 초과',
            iterations: iterations
        };
    }
    adjustDifficulty(currentBlockHeight) {
        if (currentBlockHeight - this.lastAdjustmentBlock >= this.difficultyAdjustmentInterval) {
            const timeAdjustment = this.calculateTimeAdjustment(currentBlockHeight);
            const newDifficulty = Math.max(BitWishConfig_1.BITWISH_CONSENSUS_CONFIG.MIN_DIFFICULTY, Math.min(this.currentDifficulty * timeAdjustment, this.currentDifficulty * BitWishConfig_1.BITWISH_CONSENSUS_CONFIG.MAX_DIFFICULTY_CHANGE));
            if (newDifficulty !== this.currentDifficulty) {
                console.log(`📊 난이도 조절: ${this.currentDifficulty} → ${newDifficulty}`);
                this.currentDifficulty = newDifficulty;
                this.miningStats.currentDifficulty = newDifficulty;
                this.emit('difficultyAdjusted', {
                    oldDifficulty: this.currentDifficulty,
                    newDifficulty: newDifficulty,
                    blockHeight: currentBlockHeight
                });
            }
            this.lastAdjustmentBlock = currentBlockHeight;
        }
    }
    calculateTimeAdjustment(blockHeight) {
        return 1.0;
    }
    calculateTarget(difficulty) {
        return '0'.repeat(difficulty);
    }
    calculateHashRate(iterations, elapsedTime) {
        if (elapsedTime === 0)
            return 0;
        return Math.round((iterations * 1000) / elapsedTime);
    }
    updateMiningStats(result) {
        if (result.success) {
            this.miningStats.successfulBlocks++;
        }
        else {
            this.miningStats.failedAttempts++;
        }
        if (result.iterations && result.elapsedTime) {
            this.miningStats.hashRate = this.calculateHashRate(result.iterations, result.elapsedTime);
            this.miningStats.averageTime = result.elapsedTime;
        }
    }
    validateBlock(block) {
        try {
            const basicValidation = block.isValid();
            if (!basicValidation.valid) {
                return basicValidation;
            }
            const hash = block.calculateHash();
            const target = this.calculateTarget(block.header.difficulty);
            if (!hash.startsWith(target)) {
                return {
                    valid: false,
                    error: `작업 증명이 유효하지 않습니다. 해시: ${hash}, 타겟: ${target}`
                };
            }
            if (block.header.difficulty !== this.currentDifficulty) {
                return {
                    valid: false,
                    error: `난이도가 올바르지 않습니다. 예상: ${this.currentDifficulty}, 실제: ${block.header.difficulty}`
                };
            }
            if (block.header.nonce < 0) {
                return {
                    valid: false,
                    error: '유효하지 않은 nonce입니다'
                };
            }
            return { valid: true };
        }
        catch (error) {
            return {
                valid: false,
                error: `블록 검증 중 오류: ${error}`
            };
        }
    }
    stopMining() {
        this.isMining = false;
        this.activeJobs.clear();
        this.emit('miningStopped');
    }
    getCurrentDifficulty() {
        return this.currentDifficulty;
    }
    getMiningStats() {
        return { ...this.miningStats };
    }
    getActiveJobs() {
        return Array.from(this.activeJobs.values());
    }
    isCurrentlyMining() {
        return this.isMining;
    }
    calculateExpectedMiningTime(difficulty = this.currentDifficulty) {
        const averageAttempts = Math.pow(2, difficulty);
        const hashRate = this.miningStats.hashRate || 1000000;
        return Math.round((averageAttempts / hashRate) * 1000);
    }
    calculateMiningProfitability(blockReward, electricityCost = 0.1, hashRate = 1000000) {
        const expectedBlocksPerDay = (24 * 60 * 60 * 1000) / this.targetBlockTime;
        const dailyReward = blockReward * expectedBlocksPerDay;
        const dailyElectricityCost = electricityCost * (hashRate / 1000000) * 24;
        const dailyProfit = dailyReward - dailyElectricityCost;
        const breakEvenHashRate = (electricityCost * 24 * 1000000) / blockReward;
        return {
            profitable: dailyProfit > 0,
            dailyProfit: dailyProfit,
            breakEvenHashRate: breakEvenHashRate
        };
    }
    estimateNetworkHashRate(blocks) {
        if (blocks.length < 2)
            return 0;
        let totalTime = 0;
        let totalDifficulty = 0;
        for (let i = 1; i < blocks.length; i++) {
            const timeDiff = blocks[i].header.timestamp - blocks[i - 1].header.timestamp;
            totalTime += timeDiff;
            totalDifficulty += blocks[i].header.difficulty;
        }
        if (totalTime === 0)
            return 0;
        const averageDifficulty = totalDifficulty / (blocks.length - 1);
        const networkHashRate = (averageDifficulty * Math.pow(2, 32)) / (totalTime / 1000);
        return Math.round(networkHashRate);
    }
    getDifficultyHistory(blocks) {
        return blocks
            .filter(block => block.header.difficulty > 0)
            .map(block => ({
            blockHeight: block.header.blockHeight,
            difficulty: block.header.difficulty,
            timestamp: block.header.timestamp
        }))
            .sort((a, b) => a.blockHeight - b.blockHeight);
    }
}
exports.BitWishPoW = BitWishPoW;
//# sourceMappingURL=BitWishPoW.js.map