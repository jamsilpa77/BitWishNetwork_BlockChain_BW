import Decimal from 'decimal.js';
export interface BitWishTransactionData {
    hash?: string;
    from: string;
    to: string;
    amount: string;
    gasLimit: number;
    gasPrice: string;
    gasUsed?: number;
    data: string;
    timestamp: number;
    nonce: number;
    type: string;
    signature?: string;
    status?: string;
}
export declare class BitWishTransaction {
    hash?: string;
    from: string;
    to: string;
    amount: Decimal;
    gasLimit: number;
    gasPrice: Decimal;
    gasUsed: number;
    data: string;
    timestamp: number;
    nonce: number;
    type: string;
    signature?: string;
    status: string;
    size: number;
    constructor(data: BitWishTransactionData);
    calculateHash(): string;
    isValid(): {
        valid: boolean;
        error?: string;
    };
    sign(privateKey: string): string;
    verifySignature(publicKey: string, signature: string): boolean;
    calculateTotalCost(): Decimal;
    private calculateSize;
    getSummary(): {
        hash: string | undefined;
        from: string;
        to: string;
        amount: string;
        gasLimit: number;
        gasPrice: string;
        gasUsed: number;
        data: string;
        timestamp: number;
        nonce: number;
        type: string;
        status: string;
        size: number;
        totalCost: string;
    };
    toJSON(): BitWishTransactionData;
    static fromJSON(data: BitWishTransactionData): BitWishTransaction;
    static createMiningRewardTransaction(to: string, amount: string, blockHeight: number): BitWishTransaction;
    static createStakingRewardTransaction(to: string, amount: string, stakeId: string): BitWishTransaction;
    static createSystemTransaction(from: string, to: string, amount: string, data: string): BitWishTransaction;
    static createTransferTransaction(from: string, to: string, amount: string, gasLimit?: number, gasPrice?: string, data?: string): BitWishTransaction;
    updateStatus(status: string): void;
    canExecute(senderBalance: string): boolean;
    calculateNewBalance(currentBalance: string): string;
    calculateFee(): Decimal;
}
//# sourceMappingURL=BitWishTransaction.d.ts.map