import Decimal from 'decimal.js';
import { BitWishTransaction } from './BitWishTransaction';
export interface BitWishBlockHeader {
    version: number;
    previousHash: string;
    merkleRoot: string;
    timestamp: number;
    difficulty: number;
    nonce: number;
    networkId: string;
    blockHeight: number;
    validator: string;
    blockReward: string;
}
export interface BitWishBlockData {
    header: BitWishBlockHeader;
    transactions: BitWishTransaction[];
    signature?: string;
    hash?: string;
}
export declare class BitWishBlock {
    header: BitWishBlockHeader;
    transactions: BitWishTransaction[];
    signature?: string;
    hash?: string;
    size: number;
    constructor(data: BitWishBlockData);
    static createGenesisBlock(): BitWishBlock;
    calculateHash(): string;
    calculateMerkleRoot(): string;
    isValid(): {
        valid: boolean;
        error?: string;
    };
    sign(privateKey: string): string;
    verifySignature(publicKey: string, signature: string): boolean;
    private calculateSize;
    getSummary(): {
        hash: string | undefined;
        blockHeight: number;
        timestamp: number;
        previousHash: string;
        merkleRoot: string;
        difficulty: number;
        nonce: number;
        validator: string;
        blockReward: string;
        transactionCount: number;
        size: number;
        networkId: string;
    };
    toJSON(): BitWishBlockData;
    static fromJSON(data: BitWishBlockData): BitWishBlock;
    mine(targetDifficulty: number): {
        success: boolean;
        hash?: string;
        nonce?: number;
    };
    isValidTimestamp(previousBlock?: BitWishBlock): boolean;
    calculateBlockReward(): Decimal;
}
//# sourceMappingURL=BitWishBlock.d.ts.map