"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BitWishTransaction = void 0;
const crypto_1 = require("crypto");
const decimal_js_1 = __importDefault(require("decimal.js"));
const BitWishConfig_1 = require("../config/BitWishConfig");
class BitWishTransaction {
    constructor(data) {
        this.from = data.from;
        this.to = data.to;
        this.amount = new decimal_js_1.default(data.amount);
        this.gasLimit = data.gasLimit;
        this.gasPrice = new decimal_js_1.default(data.gasPrice);
        this.gasUsed = data.gasUsed || data.gasLimit;
        this.data = data.data || '';
        this.timestamp = data.timestamp || Date.now();
        this.nonce = data.nonce;
        this.type = data.type || BitWishConfig_1.BITWISH_TRANSACTION_CONFIG.TYPES.TRANSFER;
        this.signature = data.signature;
        this.status = data.status || BitWishConfig_1.BITWISH_TRANSACTION_CONFIG.STATUS.PENDING;
        this.hash = data.hash;
        this.size = this.calculateSize();
    }
    calculateHash() {
        const txData = {
            from: this.from,
            to: this.to,
            amount: this.amount.toString(),
            gasLimit: this.gasLimit,
            gasPrice: this.gasPrice.toString(),
            data: this.data,
            timestamp: this.timestamp,
            nonce: this.nonce,
            type: this.type
        };
        const dataString = JSON.stringify(txData, Object.keys(txData).sort());
        return (0, crypto_1.createHash)('sha256').update(dataString).digest('hex');
    }
    isValid() {
        try {
            if (!this.from || !this.to || !this.amount) {
                return { valid: false, error: '트랜잭션 형식이 올바르지 않습니다' };
            }
            if (this.amount.lte(0)) {
                return { valid: false, error: '트랜잭션 금액은 0보다 커야 합니다' };
            }
            if (this.gasLimit <= 0 || this.gasPrice.lte(0)) {
                return { valid: false, error: '가스 설정이 올바르지 않습니다' };
            }
            const addressRegex = /^BW[0-9A-Fa-f]{40}$/;
            if (!addressRegex.test(this.from) || !addressRegex.test(this.to)) {
                return { valid: false, error: '유효하지 않은 주소 형식입니다' };
            }
            const calculatedHash = this.calculateHash();
            if (this.hash && this.hash !== calculatedHash) {
                return { valid: false, error: '트랜잭션 해시가 일치하지 않습니다' };
            }
            if (!Object.values(BitWishConfig_1.BITWISH_TRANSACTION_CONFIG.TYPES).includes(this.type)) {
                return { valid: false, error: '유효하지 않은 트랜잭션 타입입니다' };
            }
            if (this.size > 1024 * 1024) {
                return { valid: false, error: '트랜잭션 크기가 너무 큽니다' };
            }
            if (this.nonce < 0) {
                return { valid: false, error: '유효하지 않은 nonce입니다' };
            }
            return { valid: true };
        }
        catch (error) {
            return { valid: false, error: `트랜잭션 검증 중 오류: ${error}` };
        }
    }
    sign(privateKey) {
        const txData = this.calculateHash();
        return (0, crypto_1.createHmac)('sha256', privateKey).update(txData).digest('hex');
    }
    verifySignature(publicKey, signature) {
        try {
            const txData = this.calculateHash();
            const expectedSignature = (0, crypto_1.createHmac)('sha256', publicKey).update(txData).digest('hex');
            return signature === expectedSignature;
        }
        catch (error) {
            return false;
        }
    }
    calculateTotalCost() {
        const gasCost = new decimal_js_1.default(this.gasUsed).mul(this.gasPrice);
        return this.amount.plus(gasCost);
    }
    calculateSize() {
        const txData = JSON.stringify(this);
        return Buffer.byteLength(txData, 'utf8');
    }
    getSummary() {
        return {
            hash: this.hash,
            from: this.from,
            to: this.to,
            amount: this.amount.toString(),
            gasLimit: this.gasLimit,
            gasPrice: this.gasPrice.toString(),
            gasUsed: this.gasUsed,
            data: this.data,
            timestamp: this.timestamp,
            nonce: this.nonce,
            type: this.type,
            status: this.status,
            size: this.size,
            totalCost: this.calculateTotalCost().toString()
        };
    }
    toJSON() {
        return {
            hash: this.hash,
            from: this.from,
            to: this.to,
            amount: this.amount.toString(),
            gasLimit: this.gasLimit,
            gasPrice: this.gasPrice.toString(),
            gasUsed: this.gasUsed,
            data: this.data,
            timestamp: this.timestamp,
            nonce: this.nonce,
            type: this.type,
            signature: this.signature,
            status: this.status
        };
    }
    static fromJSON(data) {
        const tx = new BitWishTransaction(data);
        tx.hash = tx.calculateHash();
        return tx;
    }
    static createMiningRewardTransaction(to, amount, blockHeight) {
        return new BitWishTransaction({
            from: 'BitWish-Mining-Reward',
            to: to,
            amount: amount,
            gasLimit: 0,
            gasPrice: '0',
            gasUsed: 0,
            data: `Mining reward for block ${blockHeight}`,
            timestamp: Date.now(),
            nonce: blockHeight,
            type: BitWishConfig_1.BITWISH_TRANSACTION_CONFIG.TYPES.MINING_REWARD,
            status: BitWishConfig_1.BITWISH_TRANSACTION_CONFIG.STATUS.PENDING
        });
    }
    static createStakingRewardTransaction(to, amount, stakeId) {
        return new BitWishTransaction({
            from: 'BitWish-Staking-Reward',
            to: to,
            amount: amount,
            gasLimit: 0,
            gasPrice: '0',
            gasUsed: 0,
            data: `Staking reward for stake ${stakeId}`,
            timestamp: Date.now(),
            nonce: 0,
            type: BitWishConfig_1.BITWISH_TRANSACTION_CONFIG.TYPES.STAKING_REWARD,
            status: BitWishConfig_1.BITWISH_TRANSACTION_CONFIG.STATUS.PENDING
        });
    }
    static createSystemTransaction(from, to, amount, data) {
        return new BitWishTransaction({
            from: from,
            to: to,
            amount: amount,
            gasLimit: 0,
            gasPrice: '0',
            gasUsed: 0,
            data: data,
            timestamp: Date.now(),
            nonce: 0,
            type: BitWishConfig_1.BITWISH_TRANSACTION_CONFIG.TYPES.SYSTEM,
            status: BitWishConfig_1.BITWISH_TRANSACTION_CONFIG.STATUS.PENDING
        });
    }
    static createTransferTransaction(from, to, amount, gasLimit = 21000, gasPrice = '0.001', data = '') {
        return new BitWishTransaction({
            from: from,
            to: to,
            amount: amount,
            gasLimit: gasLimit,
            gasPrice: gasPrice,
            data: data,
            timestamp: Date.now(),
            nonce: 0,
            type: BitWishConfig_1.BITWISH_TRANSACTION_CONFIG.TYPES.TRANSFER,
            status: BitWishConfig_1.BITWISH_TRANSACTION_CONFIG.STATUS.PENDING
        });
    }
    updateStatus(status) {
        if (Object.values(BitWishConfig_1.BITWISH_TRANSACTION_CONFIG.STATUS).includes(status)) {
            this.status = status;
        }
        else {
            throw new Error('유효하지 않은 트랜잭션 상태입니다');
        }
    }
    canExecute(senderBalance) {
        const balance = new decimal_js_1.default(senderBalance);
        const totalCost = this.calculateTotalCost();
        return balance.gte(totalCost);
    }
    calculateNewBalance(currentBalance) {
        const balance = new decimal_js_1.default(currentBalance);
        const totalCost = this.calculateTotalCost();
        return balance.minus(totalCost).toString();
    }
    calculateFee() {
        return new decimal_js_1.default(this.gasUsed).mul(this.gasPrice);
    }
}
exports.BitWishTransaction = BitWishTransaction;
//# sourceMappingURL=BitWishTransaction.js.map