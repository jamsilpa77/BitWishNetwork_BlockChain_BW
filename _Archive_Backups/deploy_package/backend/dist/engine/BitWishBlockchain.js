"use strict";
/**
 * ====================================================================================
 * 🚀 BitWish Blockchain 클래스 - BitWish Network 독립 블록체인 엔진
 * ====================================================================================
 *
 * 🎯 핵심 기능:
 * - BitWish Network 독립 블록체인 엔진
 * - 블록 생성, 검증, 저장
 * - 트랜잭션 처리 및 실행
 * - 완벽한 독립성 보장
 *
 * 🔒 보안 기능:
 * - BitWish 전용 보안 프로토콜
 * - 블록 무결성 검증
 * - 트랜잭션 검증
 * - 완벽한 보안 검증 시스템
 *
 * 🔢 50자리 부동소수점 정밀도:
 * - 모든 계산에 Decimal.js 사용
 * - 부동소수점 오차 완전 제거
 * - 정밀한 잔액 계산 및 전송
 *
 * ====================================================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BitWishBlockchain = void 0;
const events_1 = require("events");
const decimal_js_1 = __importDefault(require("decimal.js"));
const BitWishBlock_1 = require("../core/BitWishBlock");
const BitWishTransaction_1 = require("../core/BitWishTransaction");
const BitWishPoW_1 = require("../consensus/BitWishPoW");
const BitWishConfig_1 = require("../config/BitWishConfig");
class BitWishBlockchain extends events_1.EventEmitter {
    constructor() {
        super();
        this.blocks = new Map();
        this.transactions = new Map();
        this.accounts = new Map();
        this.pendingTransactions = [];
        this.currentBlockHeight = 0;
        this.genesisBlock = null;
        this.isInitialized = false;
        this.pow = new BitWishPoW_1.BitWishPoW();
        this.setupEventListeners();
    }
    /**
     * 블록체인 초기화
     */
    async initialize() {
        try {
            if (this.isInitialized) {
                return { success: true, message: '블록체인이 이미 초기화되었습니다' };
            }
            // MongoDB에서 기존 데이터 로드 시도
            const existingData = await this.loadFromDatabase();
            if (existingData && existingData.blocks.length > 0) {
                // 기존 데이터가 있으면 복원
                console.log('🔄 MongoDB에서 기존 블록체인 데이터 복원 중...');
                for (const blockData of existingData.blocks) {
                    const block = BitWishBlock_1.BitWishBlock.fromJSON(blockData);
                    this.blocks.set(block.header.blockHeight, block);
                }
                this.currentBlockHeight = existingData.currentBlockHeight;
                this.genesisBlock = this.blocks.get(0);
                // 기존 계정들 복원
                for (const accountData of existingData.accounts) {
                    this.accounts.set(accountData.address, accountData);
                }
                console.log(`🔄 기존 데이터 복원 완료: ${existingData.blocks.length}개 블록, ${existingData.accounts.length}개 계정`);
            }
            else {
                // 기존 데이터가 없으면 제네시스 블록 생성
                console.log('🌱 새로운 BitWish 블록체인 초기화...');
                this.genesisBlock = BitWishBlock_1.BitWishBlock.createGenesisBlock();
                this.blocks.set(0, this.genesisBlock);
                this.currentBlockHeight = 0;
                // 제네시스 계정 생성
                this.createAccount('BitWish-Foundation', BitWishConfig_1.BITWISH_NETWORK_CONFIG.TOTAL_SUPPLY.toString());
                // 데이터베이스에 저장
                await this.saveToDatabase();
            }
            this.isInitialized = true;
            console.log('🌱 BitWish 블록체인 초기화 완료');
            console.log(`🔗 제네시스 블록: ${this.blocks.size}개 생성 (블록 높이: ${this.currentBlockHeight})`);
            console.log(`📦 총 블록 개수: ${this.blocks.size}개`);
            console.log(`📊 총 발행량: ${BitWishConfig_1.BITWISH_NETWORK_CONFIG.TOTAL_SUPPLY.toString()} BW`);
            console.log(`💰 BitWish-Foundation 계정 잔액: ${BitWishConfig_1.BITWISH_NETWORK_CONFIG.TOTAL_SUPPLY.toString()} BW`);
            this.emit('blockchainInitialized', this.genesisBlock);
            return { success: true, message: '블록체인이 성공적으로 초기화되었습니다' };
        }
        catch (error) {
            console.error('블록체인 초기화 오류:', error);
            return { success: false, message: `블록체인 초기화 실패: ${error}` };
        }
    }
    /**
     * 새 블록 생성
     */
    async createBlock(validatorAddress) {
        try {
            if (!this.isInitialized) {
                throw new Error('블록체인이 초기화되지 않았습니다');
            }
            // 대기 중인 트랜잭션 가져오기
            const blockTransactions = this.pendingTransactions.slice(0, BitWishConfig_1.BITWISH_NETWORK_CONFIG.MAX_TRANSACTIONS_PER_BLOCK);
            // 마이닝 보상 트랜잭션 추가
            const blockReward = this.calculateBlockReward(this.currentBlockHeight + 1);
            const miningRewardTx = BitWishTransaction_1.BitWishTransaction.createMiningRewardTransaction(validatorAddress, blockReward.toString(), this.currentBlockHeight + 1);
            blockTransactions.unshift(miningRewardTx);
            // 블록 생성
            const newBlock = new BitWishBlock_1.BitWishBlock({
                header: {
                    version: 1,
                    previousHash: this.getCurrentBlock()?.hash || '0'.repeat(64),
                    merkleRoot: '',
                    timestamp: Date.now(),
                    difficulty: this.pow.getCurrentDifficulty(),
                    nonce: 0,
                    networkId: BitWishConfig_1.BITWISH_NETWORK_CONFIG.NETWORK_ID,
                    blockHeight: this.currentBlockHeight + 1,
                    validator: validatorAddress,
                    blockReward: blockReward.toString()
                },
                transactions: blockTransactions
            });
            // 머클 루트 계산
            newBlock.header.merkleRoot = newBlock.calculateMerkleRoot();
            // 블록 마이닝
            const miningResult = await this.pow.mineBlock(newBlock);
            if (!miningResult.success) {
                throw new Error(`블록 마이닝 실패: ${miningResult.error}`);
            }
            // 블록 추가
            this.addBlock(newBlock);
            console.log(`🔗 블록 생성 완료: 높이 ${newBlock.header.blockHeight}, 해시: ${newBlock.hash}`);
            this.emit('blockCreated', newBlock);
            return newBlock;
        }
        catch (error) {
            console.error('블록 생성 오류:', error);
            throw error;
        }
    }
    /**
     * 블록 추가
     */
    addBlock(block) {
        try {
            // 블록 검증
            const validation = this.validateBlock(block);
            if (!validation.valid) {
                return { success: false, error: validation.error };
            }
            // 블록 저장
            this.blocks.set(block.header.blockHeight, block);
            this.currentBlockHeight = block.header.blockHeight;
            // 트랜잭션 실행
            for (const tx of block.transactions) {
                this.executeTransaction(tx);
                this.transactions.set(tx.hash, tx);
            }
            // 대기 중인 트랜잭션에서 제거
            this.removePendingTransactions(block.transactions);
            console.log(`✅ 블록 추가됨: 높이 ${block.header.blockHeight}`);
            this.emit('blockAdded', block);
            return { success: true };
        }
        catch (error) {
            console.error('블록 추가 오류:', error);
            return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
        }
    }
    /**
     * 블록 검증
     */
    validateBlock(block) {
        try {
            // 1. 기본 블록 검증
            const basicValidation = block.isValid();
            if (!basicValidation.valid) {
                return basicValidation;
            }
            // 2. PoW 검증
            const powValidation = this.pow.validateBlock(block);
            if (!powValidation.valid) {
                return powValidation;
            }
            // 3. 이전 블록 검증
            if (block.header.blockHeight > 0) {
                const previousBlock = this.blocks.get(block.header.blockHeight - 1);
                if (!previousBlock) {
                    return { valid: false, error: '이전 블록을 찾을 수 없습니다' };
                }
                if (block.header.previousHash !== previousBlock.hash) {
                    return { valid: false, error: '이전 블록 해시가 일치하지 않습니다' };
                }
            }
            // 4. 블록 높이 검증
            if (block.header.blockHeight !== this.currentBlockHeight + 1) {
                return { valid: false, error: '블록 높이가 올바르지 않습니다' };
            }
            // 5. 트랜잭션 검증
            for (const tx of block.transactions) {
                const txValidation = this.validateTransaction(tx);
                if (!txValidation.valid) {
                    return { valid: false, error: `트랜잭션 검증 실패: ${txValidation.error}` };
                }
            }
            return { valid: true };
        }
        catch (error) {
            return { valid: false, error: `블록 검증 중 오류: ${error}` };
        }
    }
    /**
     * 트랜잭션 추가
     */
    addTransaction(transaction) {
        try {
            // 트랜잭션 검증
            const validation = this.validateTransaction(transaction);
            if (!validation.valid) {
                return { success: false, error: validation.error };
            }
            // 중복 트랜잭션 확인
            if (this.transactions.has(transaction.hash)) {
                return { success: false, error: '이미 존재하는 트랜잭션입니다' };
            }
            // 대기 중인 트랜잭션에 추가
            this.pendingTransactions.push(transaction);
            console.log(`📝 트랜잭션 추가됨: ${transaction.hash}`);
            this.emit('transactionAdded', transaction);
            return { success: true };
        }
        catch (error) {
            console.error('트랜잭션 추가 오류:', error);
            return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
        }
    }
    /**
     * 트랜잭션 검증
     */
    validateTransaction(transaction) {
        try {
            // 1. 기본 트랜잭션 검증
            const basicValidation = transaction.isValid();
            if (!basicValidation.valid) {
                return basicValidation;
            }
            // 2. 잔액 검증 (시스템 트랜잭션 제외)
            if (transaction.type !== BitWishConfig_1.BITWISH_TRANSACTION_CONFIG.TYPES.SYSTEM &&
                transaction.type !== BitWishConfig_1.BITWISH_TRANSACTION_CONFIG.TYPES.MINING_REWARD) {
                const account = this.accounts.get(transaction.from);
                if (!account) {
                    return { valid: false, error: '발신자 계정을 찾을 수 없습니다' };
                }
                if (!transaction.canExecute(account.balance.toString())) {
                    return { valid: false, error: '잔액이 부족합니다' };
                }
            }
            // 3. Nonce 검증
            const account = this.accounts.get(transaction.from);
            if (account && transaction.nonce !== account.nonce) {
                return { valid: false, error: '잘못된 nonce입니다' };
            }
            return { valid: true };
        }
        catch (error) {
            return { valid: false, error: `트랜잭션 검증 중 오류: ${error}` };
        }
    }
    /**
     * 트랜잭션 실행
     */
    executeTransaction(transaction) {
        try {
            // 시스템 및 마이닝 보상 트랜잭션 처리
            if (transaction.type === BitWishConfig_1.BITWISH_TRANSACTION_CONFIG.TYPES.MINING_REWARD ||
                transaction.type === BitWishConfig_1.BITWISH_TRANSACTION_CONFIG.TYPES.SYSTEM) {
                // 수신자 계정 생성 또는 업데이트
                let toAccount = this.accounts.get(transaction.to);
                if (!toAccount) {
                    toAccount = this.createAccount(transaction.to, '0');
                }
                toAccount.balance = toAccount.balance.plus(transaction.amount);
                toAccount.lastActivity = Date.now();
                this.accounts.set(transaction.to, toAccount);
                console.log(`💰 ${transaction.type} 실행: ${transaction.amount.toString()} BW → ${transaction.to}`);
                return { success: true };
            }
            // 일반 전송 트랜잭션 처리
            const fromAccount = this.accounts.get(transaction.from);
            const toAccount = this.accounts.get(transaction.to);
            if (!fromAccount) {
                return { success: false, error: '발신자 계정을 찾을 수 없습니다' };
            }
            // 잔액 확인
            if (!transaction.canExecute(fromAccount.balance.toString())) {
                return { success: false, error: '잔액이 부족합니다' };
            }
            // 발신자 잔액 차감
            fromAccount.balance = fromAccount.balance.minus(transaction.calculateTotalCost());
            fromAccount.nonce++;
            fromAccount.lastActivity = Date.now();
            // 수신자 계정 생성 또는 업데이트
            let receiverAccount = toAccount;
            if (!receiverAccount) {
                receiverAccount = this.createAccount(transaction.to, '0');
            }
            receiverAccount.balance = receiverAccount.balance.plus(transaction.amount);
            receiverAccount.lastActivity = Date.now();
            // 계정 업데이트
            this.accounts.set(transaction.from, fromAccount);
            this.accounts.set(transaction.to, receiverAccount);
            console.log(`💸 전송 완료: ${transaction.amount.toString()} BW (${transaction.from} → ${transaction.to})`);
            this.emit('transactionExecuted', transaction);
            return { success: true };
        }
        catch (error) {
            console.error('트랜잭션 실행 오류:', error);
            return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
        }
    }
    /**
     * 계정 생성
     */
    createAccount(address, initialBalance = '0') {
        const account = {
            address: address,
            balance: new decimal_js_1.default(initialBalance),
            nonce: 0,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            isActive: true
        };
        this.accounts.set(address, account);
        console.log(`👤 계정 생성: ${address} (잔액: ${account.balance.toString()} BW)`);
        this.emit('accountCreated', account);
        return account;
    }
    /**
     * 계정 잔액 조회
     */
    getBalance(address) {
        const account = this.accounts.get(address);
        return account ? account.balance.toString() : '0.000000000000000000000000000000000000000000000000000';
    }
    /**
     * 계정 Nonce 조회
     */
    getNonce(address) {
        const account = this.accounts.get(address);
        return account ? account.nonce : 0;
    }
    /**
     * 블록 조회
     */
    getBlock(height) {
        return this.blocks.get(height);
    }
    /**
     * 현재 블록 조회
     */
    getCurrentBlock() {
        return this.blocks.get(this.currentBlockHeight);
    }
    /**
     * 트랜잭션 조회
     */
    getTransaction(hash) {
        return this.transactions.get(hash);
    }
    /**
     * 블록 보상 계산
     */
    calculateBlockReward(blockHeight) {
        let reward = new decimal_js_1.default('50.000000000000000000000000000000000000000000000000000');
        // 반감기 계산
        if (blockHeight >= 210000)
            reward = reward.div(2);
        if (blockHeight >= 420000)
            reward = reward.div(2);
        if (blockHeight >= 630000)
            reward = reward.div(2);
        if (blockHeight >= 840000)
            reward = reward.div(2);
        return reward;
    }
    /**
     * 대기 중인 트랜잭션 제거
     */
    removePendingTransactions(executedTransactions) {
        const executedHashes = new Set(executedTransactions.map(tx => tx.hash));
        this.pendingTransactions = this.pendingTransactions.filter(tx => !executedHashes.has(tx.hash));
    }
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        this.pow.on('miningStarted', (job) => {
            this.emit('miningStarted', job);
        });
        this.pow.on('miningCompleted', (result) => {
            this.emit('miningCompleted', result);
        });
        this.pow.on('miningFailed', (error) => {
            this.emit('miningFailed', error);
        });
    }
    /**
     * MongoDB에서 데이터 로드
     */
    async loadFromDatabase() {
        try {
            // MongoDB 연결 확인
            const { MongoClient } = require('mongodb');
            const client = new MongoClient('mongodb://localhost:27017');
            await client.connect();
            const db = client.db('bitwish_network');
            // 블록 데이터 로드
            const blocksCollection = db.collection('blocks');
            const blocks = await blocksCollection.find({}).sort({ blockHeight: 1 }).toArray();
            // 계정 데이터 로드
            const accountsCollection = db.collection('accounts');
            const accounts = await accountsCollection.find({}).toArray();
            await client.close();
            if (blocks.length > 0) {
                console.log(`📊 MongoDB에서 ${blocks.length}개 블록, ${accounts.length}개 계정 로드 성공`);
                return {
                    blocks: blocks.map((block) => block.data || block),
                    accounts: accounts.map((account) => ({
                        ...account,
                        balance: new decimal_js_1.default(account.balance)
                    })),
                    currentBlockHeight: Math.max(...blocks.map((b) => b.blockHeight || b.data?.header?.blockHeight || 0))
                };
            }
            return null;
        }
        catch (error) {
            console.log('📊 MongoDB 데이터 로드 실패 (새로 시작):', error?.message || error);
            return null;
        }
    }
    /**
     * MongoDB에 데이터 저장
     */
    async saveToDatabase() {
        try {
            const { MongoClient } = require('mongodb');
            const client = new MongoClient('mongodb://localhost:27017');
            await client.connect();
            const db = client.db('bitwish_network');
            // 블록 데이터 저장
            const blocksCollection = db.collection('blocks');
            for (const [height, block] of this.blocks) {
                await blocksCollection.replaceOne({ blockHeight: height }, {
                    blockHeight: height,
                    data: block.toJSON(),
                    timestamp: Date.now()
                }, { upsert: true });
            }
            // 계정 데이터 저장
            const accountsCollection = db.collection('accounts');
            for (const [address, account] of this.accounts) {
                await accountsCollection.replaceOne({ address: address }, {
                    ...account,
                    balance: account.balance.toString()
                }, { upsert: true });
            }
            await client.close();
            console.log('💾 블록체인 데이터를 MongoDB에 저장 완료');
        }
        catch (error) {
            console.log('💾 MongoDB 데이터 저장 실패:', error?.message || error);
        }
    }
    /**
     * 블록체인 통계 조회
     */
    getStats() {
        const blocks = Array.from(this.blocks.values());
        const averageBlockTime = blocks.length > 1
            ? (blocks[blocks.length - 1].header.timestamp - blocks[0].header.timestamp) / (blocks.length - 1)
            : 0;
        return {
            totalBlocks: this.blocks.size,
            totalTransactions: this.transactions.size,
            totalAccounts: this.accounts.size,
            pendingTransactions: this.pendingTransactions.length,
            currentBlockHeight: this.currentBlockHeight,
            totalSupply: BitWishConfig_1.BITWISH_NETWORK_CONFIG.TOTAL_SUPPLY,
            averageBlockTime: averageBlockTime,
            networkHashRate: this.pow.getMiningStats().hashRate
        };
    }
    /**
     * 블록체인 상태 조회
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            currentBlockHeight: this.currentBlockHeight,
            totalBlocks: this.blocks.size,
            totalTransactions: this.transactions.size,
            totalAccounts: this.accounts.size,
            pendingTransactions: this.pendingTransactions.length,
            currentDifficulty: this.pow.getCurrentDifficulty(),
            miningStats: this.pow.getMiningStats(),
            networkId: BitWishConfig_1.BITWISH_NETWORK_CONFIG.NETWORK_ID
        };
    }
}
exports.BitWishBlockchain = BitWishBlockchain;
//# sourceMappingURL=BitWishBlockchain.js.map