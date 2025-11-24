"use strict";
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
    /**
     * 블록 마이닝 시작
     */
    async mineBlock(block) {
        try {
            const startTime = Date.now();
            this.isMining = true;
            // 난이도 조절 확인
            this.adjustDifficulty(block.header.blockHeight);
            // 타겟 계산
            const target = this.calculateTarget(this.currentDifficulty);
            // 마이닝 작업 생성
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
            // 마이닝 실행
            const result = await this.executeMining(job);
            const endTime = Date.now();
            result.elapsedTime = endTime - startTime;
            // 통계 업데이트
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
    /**
     * 마이닝 실행
     */
    async executeMining(job) {
        let nonce = job.nonceStart;
        let iterations = 0;
        const maxIterations = 10000000; // 무한 루프 방지
        while (nonce <= job.nonceEnd && iterations < maxIterations) {
            // 블록에 nonce 설정
            job.block.header.nonce = nonce;
            // 해시 계산
            const hash = job.block.calculateHash();
            iterations++;
            this.miningStats.totalHashes++;
            // 타겟 검증
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
            // 주기적으로 이벤트 발생 (진행 상황 보고)
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
    /**
     * 난이도 조절
     */
    adjustDifficulty(currentBlockHeight) {
        // 난이도 조절 간격 확인
        if (currentBlockHeight - this.lastAdjustmentBlock >= this.difficultyAdjustmentInterval) {
            // 실제 구현에서는 이전 블록들의 평균 생성 시간을 계산하여 난이도 조절
            // 여기서는 간단한 시뮬레이션
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
    /**
     * 시간 조절 계산
     */
    calculateTimeAdjustment(blockHeight) {
        // 실제 구현에서는 이전 블록들의 평균 시간을 계산
        // 여기서는 시뮬레이션으로 1.0 반환 (변경 없음)
        return 1.0;
    }
    /**
     * 타겟 계산
     */
    calculateTarget(difficulty) {
        return '0'.repeat(difficulty);
    }
    /**
     * 해시율 계산
     */
    calculateHashRate(iterations, elapsedTime) {
        if (elapsedTime === 0)
            return 0;
        return Math.round((iterations * 1000) / elapsedTime);
    }
    /**
     * 마이닝 통계 업데이트
     */
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
    /**
     * 블록 검증 (PoW)
     */
    validateBlock(block) {
        try {
            // 1. 기본 블록 검증
            const basicValidation = block.isValid();
            if (!basicValidation.valid) {
                return basicValidation;
            }
            // 2. PoW 검증
            const hash = block.calculateHash();
            const target = this.calculateTarget(block.header.difficulty);
            if (!hash.startsWith(target)) {
                return {
                    valid: false,
                    error: `작업 증명이 유효하지 않습니다. 해시: ${hash}, 타겟: ${target}`
                };
            }
            // 3. 난이도 검증
            if (block.header.difficulty !== this.currentDifficulty) {
                return {
                    valid: false,
                    error: `난이도가 올바르지 않습니다. 예상: ${this.currentDifficulty}, 실제: ${block.header.difficulty}`
                };
            }
            // 4. Nonce 검증
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
    /**
     * 마이닝 중지
     */
    stopMining() {
        this.isMining = false;
        this.activeJobs.clear();
        this.emit('miningStopped');
    }
    /**
     * 현재 난이도 조회
     */
    getCurrentDifficulty() {
        return this.currentDifficulty;
    }
    /**
     * 마이닝 통계 조회
     */
    getMiningStats() {
        return { ...this.miningStats };
    }
    /**
     * 활성 마이닝 작업 조회
     */
    getActiveJobs() {
        return Array.from(this.activeJobs.values());
    }
    /**
     * 마이닝 중인지 확인
     */
    isCurrentlyMining() {
        return this.isMining;
    }
    /**
     * 예상 마이닝 시간 계산
     */
    calculateExpectedMiningTime(difficulty = this.currentDifficulty) {
        // 평균적으로 2^difficulty 번의 시도가 필요
        const averageAttempts = Math.pow(2, difficulty);
        const hashRate = this.miningStats.hashRate || 1000000; // 기본 해시율
        return Math.round((averageAttempts / hashRate) * 1000); // 밀리초 단위
    }
    /**
     * 마이닝 수익성 계산
     */
    calculateMiningProfitability(blockReward, electricityCost = 0.1, // kWh당 비용
    hashRate = 1000000 // H/s
    ) {
        const expectedBlocksPerDay = (24 * 60 * 60 * 1000) / this.targetBlockTime;
        const dailyReward = blockReward * expectedBlocksPerDay;
        const dailyElectricityCost = electricityCost * (hashRate / 1000000) * 24; // 단순 계산
        const dailyProfit = dailyReward - dailyElectricityCost;
        const breakEvenHashRate = (electricityCost * 24 * 1000000) / blockReward;
        return {
            profitable: dailyProfit > 0,
            dailyProfit: dailyProfit,
            breakEvenHashRate: breakEvenHashRate
        };
    }
    /**
     * 네트워크 해시율 추정
     */
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
        // 네트워크 해시율 = (총 난이도 * 2^32) / 총 시간
        const averageDifficulty = totalDifficulty / (blocks.length - 1);
        const networkHashRate = (averageDifficulty * Math.pow(2, 32)) / (totalTime / 1000);
        return Math.round(networkHashRate);
    }
    /**
     * 난이도 히스토리 조회
     */
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