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
    /**
     * 제네시스 블록 생성
     */
    static createGenesisBlock(): BitWishBlock;
    /**
     * 블록 해시 계산 (BitWish-256)
     */
    calculateHash(): string;
    /**
     * 머클 루트 계산
     */
    calculateMerkleRoot(): string;
    /**
     * 블록 검증
     */
    isValid(): {
        valid: boolean;
        error?: string;
    };
    /**
     * 블록 서명 생성
     */
    sign(privateKey: string): string;
    /**
     * 블록 서명 검증
     */
    verifySignature(publicKey: string, signature: string): boolean;
    /**
     * 블록 크기 계산
     */
    private calculateSize;
    /**
     * 블록 요약 정보
     */
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
    /**
     * 블록을 JSON으로 직렬화
     */
    toJSON(): BitWishBlockData;
    /**
     * JSON에서 블록 객체 생성
     */
    static fromJSON(data: BitWishBlockData): BitWishBlock;
    /**
     * 블록 마이닝 (PoW)
     */
    mine(targetDifficulty: number): {
        success: boolean;
        hash?: string;
        nonce?: number;
    };
    /**
     * 블록 시간 검증
     */
    isValidTimestamp(previousBlock?: BitWishBlock): boolean;
    /**
     * 블록 보상 계산
     */
    calculateBlockReward(): Decimal;
}
//# sourceMappingURL=BitWishBlock.d.ts.map