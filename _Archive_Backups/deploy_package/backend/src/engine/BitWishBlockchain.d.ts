import { EventEmitter } from 'events';
import Decimal from 'decimal.js';
import { BitWishBlock } from '../core/BitWishBlock';
import { BitWishTransaction } from '../core/BitWishTransaction';
export interface BitWishAccount {
    address: string;
    balance: Decimal;
    nonce: number;
    createdAt: number;
    lastActivity: number;
    isActive: boolean;
}
export interface BitWishBlockchainStats {
    totalBlocks: number;
    totalTransactions: number;
    totalAccounts: number;
    pendingTransactions: number;
    currentBlockHeight: number;
    totalSupply: Decimal;
    averageBlockTime: number;
    networkHashRate: number;
}
export declare class BitWishBlockchain extends EventEmitter {
    private blocks;
    private transactions;
    private accounts;
    private pendingTransactions;
    private currentBlockHeight;
    private genesisBlock;
    private pow;
    private isInitialized;
    constructor();
    initialize(): Promise<{
        success: boolean;
        message: string;
    }>;
    createBlock(validatorAddress: string): Promise<BitWishBlock>;
    addBlock(block: BitWishBlock): {
        success: boolean;
        error?: string;
    };
    validateBlock(block: BitWishBlock): {
        valid: boolean;
        error?: string;
    };
    addTransaction(transaction: BitWishTransaction): {
        success: boolean;
        error?: string;
    };
    validateTransaction(transaction: BitWishTransaction): {
        valid: boolean;
        error?: string;
    };
    executeTransaction(transaction: BitWishTransaction): {
        success: boolean;
        error?: string;
    };
    createAccount(address: string, initialBalance?: string): BitWishAccount;
    getBalance(address: string): string;
    getNonce(address: string): number;
    getBlock(height: number): BitWishBlock | undefined;
    getCurrentBlock(): BitWishBlock | undefined;
    getTransaction(hash: string): BitWishTransaction | undefined;
    private calculateBlockReward;
    private removePendingTransactions;
    private setupEventListeners;
    private loadFromDatabase;
    private saveToDatabase;
    getStats(): BitWishBlockchainStats;
    getStatus(): {
        isInitialized: boolean;
        currentBlockHeight: number;
        totalBlocks: number;
        totalTransactions: number;
        totalAccounts: number;
        pendingTransactions: number;
        currentDifficulty: number;
        miningStats: import("../consensus/BitWishPoW").BitWishMiningStats;
        networkId: string;
    };
}
//# sourceMappingURL=BitWishBlockchain.d.ts.map