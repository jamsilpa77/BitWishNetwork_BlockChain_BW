import Decimal from 'decimal.js';
export interface BitWishWalletData {
    address: string;
    publicKey: string;
    encryptedPrivateKey?: string;
    balance: string;
    nonce: number;
    createdAt: number;
    lastActivity: number;
    isActive: boolean;
    hasPassword: boolean;
    passwordHash?: string;
}
export interface BitWishWalletKeyPair {
    privateKey: string;
    publicKey: string;
    address: string;
}
export declare class BitWishWallet {
    address: string;
    publicKey: string;
    encryptedPrivateKey?: string;
    balance: Decimal;
    nonce: number;
    createdAt: number;
    lastActivity: number;
    isActive: boolean;
    hasPassword: boolean;
    passwordHash?: string;
    constructor(data: BitWishWalletData);
    static generateKeyPair(): BitWishWalletKeyPair;
    static generateAddress(publicKey: string): string;
    static createWallet(password?: string): BitWishWallet;
    setPassword(password: string, privateKey?: string): void;
    verifyPassword(password: string): boolean;
    decryptPrivateKey(password: string): string;
    updateBalance(newBalance: string): void;
    addBalance(amount: string): void;
    subtractBalance(amount: string): boolean;
    incrementNonce(): void;
    setActive(active: boolean): void;
    private hashPassword;
    private encryptPrivateKey;
    private decryptPrivateKeyInternal;
    static isValidAddress(address: string): boolean;
    getSummary(): {
        address: string;
        publicKey: string;
        balance: string;
        nonce: number;
        createdAt: number;
        lastActivity: number;
        isActive: boolean;
        hasPassword: boolean;
    };
    toJSON(): BitWishWalletData;
    static fromJSON(data: BitWishWalletData): BitWishWallet;
    clone(): BitWishWallet;
    equals(other: BitWishWallet): boolean;
    isValid(): {
        valid: boolean;
        error?: string;
    };
    createBackup(password: string): string;
    static restoreFromBackup(backupData: string, password: string): BitWishWallet;
}
//# sourceMappingURL=BitWishWallet.d.ts.map