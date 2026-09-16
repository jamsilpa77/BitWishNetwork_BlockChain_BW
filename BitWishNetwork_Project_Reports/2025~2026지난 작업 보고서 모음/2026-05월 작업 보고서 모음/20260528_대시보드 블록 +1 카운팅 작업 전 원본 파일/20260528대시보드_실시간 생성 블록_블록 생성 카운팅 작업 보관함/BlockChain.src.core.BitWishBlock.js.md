"use strict";
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
    calculateMerkleRoot() {
        if (this.transactions.length === 0) {
            return BitWishConfig_1.BITWISH_BLOCK_CONFIG.MERKLE_ROOT_EMPTY;
        }
        if (this.transactions.length === 1) {
            return (0, crypto_1.createHash)('sha256').update(this.transactions[0].hash).digest('hex');
        }
        let hashes = this.transactions.map(tx => (0, crypto_1.createHash)('sha256').update(tx.hash).digest('hex'));
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
    isValid() {
        try {
            if (!this.header || !this.transactions) {
                return { valid: false, error: '블록 구조가 올바르지 않습니다' };
            }
            const calculatedHash = this.calculateHash();
            if (this.hash && this.hash !== calculatedHash) {
                return { valid: false, error: '블록 해시가 일치하지 않습니다' };
            }
            const calculatedMerkleRoot = this.calculateMerkleRoot();
            if (this.header.merkleRoot !== calculatedMerkleRoot) {
                return { valid: false, error: '머클 루트가 일치하지 않습니다' };
            }
            if (this.header.difficulty > 0) {
                const target = '0'.repeat(this.header.difficulty);
                if (!calculatedHash.startsWith(target)) {
                    return { valid: false, error: '작업 증명이 유효하지 않습니다' };
                }
            }
            for (const tx of this.transactions) {
                if (!tx.isValid().valid) {
                    return { valid: false, error: '유효하지 않은 트랜잭션이 포함되어 있습니다' };
                }
            }
            if (this.size > 1024 * 1024) {
                return { valid: false, error: '블록 크기가 너무 큽니다' };
            }
            return { valid: true };
        }
        catch (error) {
            return { valid: false, error: `블록 검증 중 오류: ${error}` };
        }
    }
    sign(privateKey) {
        const blockData = this.calculateHash();
        return (0, crypto_1.createHmac)('sha256', privateKey).update(blockData).digest('hex');
    }
    verifySignature(publicKey, signature) {
        try {
            const blockData = this.calculateHash();
            const expectedSignature = (0, crypto_1.createHmac)('sha256', publicKey).update(blockData).digest('hex');
            return signature === expectedSignature;
        }
        catch (error) {
            return false;
        }
    }
    calculateSize() {
        const blockData = JSON.stringify(this);
        return Buffer.byteLength(blockData, 'utf8');
    }
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
    toJSON() {
        return {
            header: this.header,
            transactions: this.transactions,
            signature: this.signature,
            hash: this.hash
        };
    }
    static fromJSON(data) {
        const block = new BitWishBlock(data);
        block.hash = block.calculateHash();
        return block;
    }
    mine(targetDifficulty) {
        const target = '0'.repeat(targetDifficulty);
        let nonce = 0;
        let hash = '';
        while (!hash.startsWith(target)) {
            this.header.nonce = nonce;
            hash = this.calculateHash();
            nonce++;
            if (nonce > 10000000) {
                return { success: false };
            }
        }
        this.hash = hash;
        return { success: true, hash, nonce };
    }
    isValidTimestamp(previousBlock) {
        const now = Date.now();
        const blockTime = this.header.timestamp;
        if (blockTime > now + 2 * 60 * 60 * 1000) {
            return false;
        }
        if (previousBlock) {
            const timeDiff = blockTime - previousBlock.header.timestamp;
            if (timeDiff < 1000) {
                return false;
            }
        }
        return true;
    }
    calculateBlockReward() {
        const blockHeight = this.header.blockHeight;
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