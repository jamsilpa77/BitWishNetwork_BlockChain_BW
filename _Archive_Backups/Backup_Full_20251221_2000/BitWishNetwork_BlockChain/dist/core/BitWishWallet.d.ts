/**
 * ====================================================================================
 * 🚀 BitWish Wallet 클래스 - BitWish Network 독립 블록체인 지갑 시스템
 * ====================================================================================
 *
 * 🎯 핵심 기능:
 * - BitWish Network 전용 지갑 시스템
 * - BW 토큰 전용 지갑 주소 (BW + 40자리)
 * - 50자리 정밀도 계산
 * - 완벽한 독립성 보장
 *
 * 🔒 보안 기능:
 * - BitWish-256 암호화 알고리즘
 * - PBKDF2 비밀번호 해싱
 * - 지갑 암호화/복호화
 * - 완벽한 보안 검증 시스템
 *
 * 🔢 50자리 부동소수점 정밀도:
 * - 모든 계산에 Decimal.js 사용
 * - 부동소수점 오차 완전 제거
 * - 정밀한 잔액 계산 및 전송
 *
 * ====================================================================================
 */
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
    /**
     * BitWish 지갑 키페어 생성
     */
    static generateKeyPair(): BitWishWalletKeyPair;
    /**
     * BitWish 주소 생성
     */
    static generateAddress(publicKey: string): string;
    /**
     * 지갑 생성
     */
    static createWallet(password?: string): BitWishWallet;
    /**
     * 비밀번호 설정 및 프라이빗 키 암호화
     */
    setPassword(password: string, privateKey?: string): void;
    /**
     * 비밀번호 검증
     */
    verifyPassword(password: string): boolean;
    /**
     * 프라이빗 키 복호화
     */
    decryptPrivateKey(password: string): string;
    /**
     * 잔액 업데이트
     */
    updateBalance(newBalance: string): void;
    /**
     * 잔액 증가
     */
    addBalance(amount: string): void;
    /**
     * 잔액 감소
     */
    subtractBalance(amount: string): boolean;
    /**
     * Nonce 증가
     */
    incrementNonce(): void;
    /**
     * 지갑 활성화/비활성화
     */
    setActive(active: boolean): void;
    /**
     * 비밀번호 해싱 (PBKDF2)
     */
    private hashPassword;
    /**
     * 프라이빗 키 암호화
     */
    private encryptPrivateKey;
    /**
     * 프라이빗 키 복호화
     */
    private decryptPrivateKeyInternal;
    /**
     * 주소 유효성 검증
     */
    static isValidAddress(address: string): boolean;
    /**
     * 지갑 요약 정보
     */
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
    /**
     * 지갑을 JSON으로 직렬화
     */
    toJSON(): BitWishWalletData;
    /**
     * JSON에서 지갑 객체 생성
     */
    static fromJSON(data: BitWishWalletData): BitWishWallet;
    /**
     * 지갑 복사본 생성
     */
    clone(): BitWishWallet;
    /**
     * 지갑 비교
     */
    equals(other: BitWishWallet): boolean;
    /**
     * 지갑 상태 검증
     */
    isValid(): {
        valid: boolean;
        error?: string;
    };
    /**
     * 지갑 백업 생성
     */
    createBackup(password: string): string;
    /**
     * 지갑 백업에서 복원
     */
    static restoreFromBackup(backupData: string, password: string): BitWishWallet;
}
//# sourceMappingURL=BitWishWallet.d.ts.map