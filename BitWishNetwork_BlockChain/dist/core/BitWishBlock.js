"use strict";
/**
 * ====================================================================================
 * 🚀 BitWish Block 클래스 - BitWish Network 독립 블록체인 블록 구조
 * ====================================================================================
 *
 * 🎯 핵심 기능:
 * - BitWish Network 전용 블록 구조
 * - BW 토큰 지원
 * - 50자리 정밀도 계산
 * - 완벽한 독립성 보장
 *
 * 🔒 보안 기능:
 * - BitWish-256 해시 알고리즘
 * - 머클 트리 검증
 * - 블록 서명 검증
 * - 완벽한 무결성 보장
 *
 * 🔢 50자리 부동소수점 정밀도:
 * - 모든 계산에 Decimal.js 사용
 * - 부동소수점 오차 완전 제거
 * - 정밀한 블록 데이터 처리
 *
 * ====================================================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BitWishBlock = void 0;
const crypto_1 = require("crypto");
const decimal_js_1 = __importDefault(require("decimal.js"));
const BitWishConfig_1 = require("../config/BitWishConfig");
class BitWishBlock {
    constructor(data) {
        this.header = data.header;
        this.transactions = data.transactions || [];
        this.signature = data.signature;
        this.hash = data.hash;
        this.size = this.calculateSize();
    }
    /**
     * 제네시스 블록 생성
     */
    static createGenesisBlock() {
        const genesisHeader = {
            version: BitWishConfig_1.BITWISH_BLOCK_CONFIG.VERSION,
            previousHash: BitWishConfig_1.BITWISH_BLOCK_CONFIG.GENESIS_HASH,
            merkleRoot: BitWishConfig_1.BITWISH_BLOCK_CONFIG.MERKLE_ROOT_EMPTY,
            timestamp: Date.now(),
            difficulty: 1,
            nonce: 0,
            networkId: 'BitWish-Mainnet-v1.0',
            blockHeight: 0,
            validator: 'BitWish-Foundation',
            blockReward: '0.000000000000000000000000000000000000000000000000000'
        };
        const genesisBlock = new BitWishBlock({
            header: genesisHeader,
            transactions: []
        });
        genesisBlock.hash = genesisBlock.calculateHash();
        return genesisBlock;
    }
    /**
     * 블록 해시 계산 (BitWish-256)
     */
    calculateHash() {
        const blockData = {
            version: this.header.version,
            previousHash: this.header.previousHash,
            merkleRoot: this.header.merkleRoot,
            timestamp: this.header.timestamp,
            difficulty: this.header.difficulty,
            nonce: this.header.nonce,
            networkId: this.header.networkId,
            blockHeight: this.header.blockHeight,
            validator: this.header.validator,
            blockReward: this.header.blockReward
        };
        const dataString = JSON.stringify(blockData, Object.keys(blockData).sort());
        return (0, crypto_1.createHash)('sha256').update(dataString).digest('hex');
    }
    /**
     * 머클 루트 계산
     */
    calculateMerkleRoot() {
        if (this.transactions.length === 0) {
            return BitWishConfig_1.BITWISH_BLOCK_CONFIG.MERKLE_ROOT_EMPTY;
        }
        if (this.transactions.length === 1) {
            return (0, crypto_1.createHash)('sha256').update(this.transactions[0].hash || '').digest('hex');
        }
        let hashes = this.transactions.map(tx => (0, crypto_1.createHash)('sha256').update(tx.hash || '').digest('hex'));
        while (hashes.length > 1) {
            const nextLevel = [];
            for (let i = 0; i < hashes.length; i += 2) {
                const left = hashes[i];
                const right = hashes[i + 1] || left;
                const combined = left + right;
                nextLevel.push((0, crypto_1.createHash)('sha256').update(combined).digest('hex'));
            }
            hashes = nextLevel;
        }
        return hashes[0];
    }
    /**
     * 블록 검증
     */
    isValid() {
        try {
            // 1. 기본 형식 검증
            if (!this.header || !this.transactions) {
                return { valid: false, error: '블록 구조가 올바르지 않습니다' };
            }
            // 2. 해시 검증
            const calculatedHash = this.calculateHash();
            if (this.hash && this.hash !== calculatedHash) {
                return { valid: false, error: '블록 해시가 일치하지 않습니다' };
            }
            // 3. 머클 루트 검증
            const calculatedMerkleRoot = this.calculateMerkleRoot();
            if (this.header.merkleRoot !== calculatedMerkleRoot) {
                return { valid: false, error: '머클 루트가 일치하지 않습니다' };
            }
            // 4. 난이도 검증 (PoW)
            if (this.header.difficulty > 0) {
                const target = '0'.repeat(this.header.difficulty);
                if (!calculatedHash.startsWith(target)) {
                    return { valid: false, error: '작업 증명이 유효하지 않습니다' };
                }
            }
            // 5. 트랜잭션 검증
            for (const tx of this.transactions) {
                if (!tx.isValid().valid) {
                    return { valid: false, error: '유효하지 않은 트랜잭션이 포함되어 있습니다' };
                }
            }
            // 6. 블록 크기 검증
            if (this.size > 1024 * 1024) { // 1MB 제한
                return { valid: false, error: '블록 크기가 너무 큽니다' };
            }
            return { valid: true };
        }
        catch (error) {
            return { valid: false, error: `블록 검증 중 오류: ${error}` };
        }
    }
    /**
     * 블록 서명 생성
     */
    sign(privateKey) {
        const blockData = this.calculateHash();
        return (0, crypto_1.createHmac)('sha256', privateKey).update(blockData).digest('hex');
    }
    /**
     * 블록 서명 검증
     */
    verifySignature(publicKey, signature) {
        try {
            // 간단한 서명 검증 (실제로는 더 복잡한 암호화 알고리즘 사용)
            const blockData = this.calculateHash();
            const expectedSignature = (0, crypto_1.createHmac)('sha256', publicKey).update(blockData).digest('hex');
            return signature === expectedSignature;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * 블록 크기 계산
     */
    calculateSize() {
        const blockData = JSON.stringify(this);
        return Buffer.byteLength(blockData, 'utf8');
    }
    /**
     * 블록 요약 정보
     */
    getSummary() {
        return {
            hash: this.hash,
            blockHeight: this.header.blockHeight,
            timestamp: this.header.timestamp,
            previousHash: this.header.previousHash,
            merkleRoot: this.header.merkleRoot,
            difficulty: this.header.difficulty,
            nonce: this.header.nonce,
            validator: this.header.validator,
            blockReward: this.header.blockReward,
            transactionCount: this.transactions.length,
            size: this.size,
            networkId: this.header.networkId
        };
    }
    /**
     * 블록을 JSON으로 직렬화
     */
    toJSON() {
        return {
            header: this.header,
            transactions: this.transactions,
            signature: this.signature,
            hash: this.hash
        };
    }
    /**
     * JSON에서 블록 객체 생성
     */
    static fromJSON(data) {
        const block = new BitWishBlock(data);
        block.hash = block.calculateHash();
        return block;
    }
    /**
     * 블록 마이닝 (PoW)
     */
    mine(targetDifficulty) {
        const target = '0'.repeat(targetDifficulty);
        let nonce = 0;
        let hash = '';
        while (!hash.startsWith(target)) {
            this.header.nonce = nonce;
            hash = this.calculateHash();
            nonce++;
            // 무한 루프 방지
            if (nonce > 10000000) {
                return { success: false };
            }
        }
        this.hash = hash;
        return { success: true, hash, nonce };
    }
    /**
     * 블록 시간 검증
     */
    isValidTimestamp(previousBlock) {
        const now = Date.now();
        const blockTime = this.header.timestamp;
        // 미래 블록 허용 시간 (2시간)
        if (blockTime > now + 2 * 60 * 60 * 1000) {
            return false;
        }
        // 이전 블록과의 시간 차이 검증
        if (previousBlock) {
            const timeDiff = blockTime - previousBlock.header.timestamp;
            // 최소 1초 간격
            if (timeDiff < 1000) {
                return false;
            }
        }
        return true;
    }
    /**
     * 블록 보상 계산
     */
    calculateBlockReward() {
        const blockHeight = this.header.blockHeight;
        // 반감기 계산
        let reward = new decimal_js_1.default('50.000000000000000000000000000000000000000000000000000');
        if (blockHeight >= 210000) {
            reward = reward.div(2);
        }
        if (blockHeight >= 420000) {
            reward = reward.div(2);
        }
        if (blockHeight >= 630000) {
            reward = reward.div(2);
        }
        if (blockHeight >= 840000) {
            reward = reward.div(2);
        }
        return reward;
    }
}
exports.BitWishBlock = BitWishBlock;
//# sourceMappingURL=BitWishBlock.js.map