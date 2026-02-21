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
    /**
     * 블록체인 초기화
     */
    initialize(): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * 새 블록 생성
     */
    createBlock(validatorAddress: string): Promise<BitWishBlock>;
    /**
     * 블록 추가
     */
    addBlock(block: BitWishBlock): {
        success: boolean;
        error?: string;
    };
    /**
     * 블록 검증
     */
    validateBlock(block: BitWishBlock): {
        valid: boolean;
        error?: string;
    };
    /**
     * 트랜잭션 추가
     */
    addTransaction(transaction: BitWishTransaction): {
        success: boolean;
        error?: string;
    };
    /**
     * 트랜잭션 검증
     */
    validateTransaction(transaction: BitWishTransaction): {
        valid: boolean;
        error?: string;
    };
    /**
     * 트랜잭션 실행
     */
    executeTransaction(transaction: BitWishTransaction): {
        success: boolean;
        error?: string;
    };
    /**
     * 계정 생성
     */
    createAccount(address: string, initialBalance?: string): BitWishAccount;
    /**
     * 계정 잔액 조회
     */
    getBalance(address: string): string;
    /**
     * 계정 Nonce 조회
     */
    getNonce(address: string): number;
    /**
     * 블록 조회
     */
    getBlock(height: number): BitWishBlock | undefined;
    /**
     * 현재 블록 조회
     */
    getCurrentBlock(): BitWishBlock | undefined;
    /**
     * 트랜잭션 조회
     */
    getTransaction(hash: string): BitWishTransaction | undefined;
    /**
     * 블록 보상 계산
     */
    private calculateBlockReward;
    /**
     * 대기 중인 트랜잭션 제거
     */
    private removePendingTransactions;
    /**
     * 이벤트 리스너 설정
     */
    private setupEventListeners;
    /**
     * MongoDB에서 데이터 로드
     */
    private loadFromDatabase;
    /**
     * MongoDB에 데이터 저장
     */
    private saveToDatabase;
    /**
     * 블록체인 통계 조회
     */
    getStats(): BitWishBlockchainStats;
    /**
     * 블록체인 상태 조회
     */
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