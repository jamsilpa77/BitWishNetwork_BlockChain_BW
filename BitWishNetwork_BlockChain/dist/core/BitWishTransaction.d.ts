/**
 * ====================================================================================
 * 🚀 BitWish Transaction 클래스 - BitWish Network 독립 블록체인 트랜잭션
 * ====================================================================================
 *
 * 🎯 핵심 기능:
 * - BitWish Network 전용 트랜잭션 구조
 * - BW 토큰 지원
 * - 50자리 정밀도 계산
 * - 완벽한 독립성 보장
 *
 * 🔒 보안 기능:
 * - BitWish-256 해시 알고리즘
 * - 디지털 서명 검증
 * - 트랜잭션 무결성 보장
 * - 완벽한 보안 검증 시스템
 *
 * 🔢 50자리 부동소수점 정밀도:
 * - 모든 계산에 Decimal.js 사용
 * - 부동소수점 오차 완전 제거
 * - 정밀한 금액 계산 및 전송
 *
 * ====================================================================================
 */
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
    /**
     * 트랜잭션 해시 계산 (BitWish-256)
     */
    calculateHash(): string;
    /**
     * 트랜잭션 검증
     */
    isValid(): {
        valid: boolean;
        error?: string;
    };
    /**
     * 트랜잭션 서명 생성
     */
    sign(privateKey: string): string;
    /**
     * 트랜잭션 서명 검증
     */
    verifySignature(publicKey: string, signature: string): boolean;
    /**
     * 총 비용 계산 (금액 + 가스비)
     */
    calculateTotalCost(): Decimal;
    /**
     * 트랜잭션 크기 계산
     */
    private calculateSize;
    /**
     * 트랜잭션 요약 정보
     */
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
    /**
     * 트랜잭션을 JSON으로 직렬화
     */
    toJSON(): BitWishTransactionData;
    /**
     * JSON에서 트랜잭션 객체 생성
     */
    static fromJSON(data: BitWishTransactionData): BitWishTransaction;
    /**
     * 마이닝 보상 트랜잭션 생성
     */
    static createMiningRewardTransaction(to: string, amount: string, blockHeight: number): BitWishTransaction;
    /**
     * 스테이킹 보상 트랜잭션 생성
     */
    static createStakingRewardTransaction(to: string, amount: string, stakeId: string): BitWishTransaction;
    /**
     * 시스템 트랜잭션 생성
     */
    static createSystemTransaction(from: string, to: string, amount: string, data: string): BitWishTransaction;
    /**
     * 일반 전송 트랜잭션 생성
     */
    static createTransferTransaction(from: string, to: string, amount: string, gasLimit?: number, gasPrice?: string, data?: string): BitWishTransaction;
    /**
     * 트랜잭션 상태 업데이트
     */
    updateStatus(status: string): void;
    /**
     * 트랜잭션 실행 가능 여부 확인
     */
    canExecute(senderBalance: string): boolean;
    /**
     * 트랜잭션 실행 후 잔액 계산
     */
    calculateNewBalance(currentBalance: string): string;
    /**
     * 트랜잭션 수수료 계산
     */
    calculateFee(): Decimal;
}
//# sourceMappingURL=BitWishTransaction.d.ts.map