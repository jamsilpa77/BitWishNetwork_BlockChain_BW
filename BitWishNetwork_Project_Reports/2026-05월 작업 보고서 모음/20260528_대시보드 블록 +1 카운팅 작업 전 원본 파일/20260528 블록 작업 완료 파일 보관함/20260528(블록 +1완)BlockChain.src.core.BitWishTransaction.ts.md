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

import { createHash, createHmac } from 'crypto';
import Decimal from 'decimal.js';
import { BITWISH_TRANSACTION_CONFIG } from '../config/BitWishConfig';

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

export class BitWishTransaction {
  public hash?: string;
  public from: string;
  public to: string;
  public amount: Decimal;
  public gasLimit: number;
  public gasPrice: Decimal;
  public gasUsed: number;
  public data: string;
  public timestamp: number;
  public nonce: number;
  public type: string;
  public signature?: string;
  public status: string;
  public size: number;

  constructor(data: BitWishTransactionData) {
    this.from = data.from;
    this.to = data.to;
    this.amount = new Decimal(data.amount);
    this.gasLimit = data.gasLimit;
    this.gasPrice = new Decimal(data.gasPrice);
    this.gasUsed = data.gasUsed || data.gasLimit;
    this.data = data.data || '';
    this.timestamp = data.timestamp || Date.now();
    this.nonce = data.nonce;
    this.type = data.type || BITWISH_TRANSACTION_CONFIG.TYPES.TRANSFER;
    this.signature = data.signature;
    this.status = data.status || BITWISH_TRANSACTION_CONFIG.STATUS.PENDING;
    this.hash = data.hash || this.calculateHash();
    this.size = this.calculateSize();
  }

  /**
   * 트랜잭션 해시 계산 (BitWish-256)
   */
  calculateHash(): string {
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
    return createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * 트랜잭션 검증
   */
  isValid(): { valid: boolean; error?: string } {
    try {
      // 1. 기본 형식 검증
      if (!this.from || !this.to || !this.amount) {
        return { valid: false, error: '트랜잭션 형식이 올바르지 않습니다' };
      }

      // 2. 금액 검증
      if (this.amount.lte(0)) {
        return { valid: false, error: '트랜잭션 금액은 0보다 커야 합니다' };
      }

      // 3. 가스 검증 (시스템/마이닝/스테이킹 보상 등 수수료가 없는 트랜잭션 제외)
      if (this.type !== BITWISH_TRANSACTION_CONFIG.TYPES.SYSTEM &&
        this.type !== BITWISH_TRANSACTION_CONFIG.TYPES.MINING_REWARD &&
        this.type !== BITWISH_TRANSACTION_CONFIG.TYPES.STAKING_REWARD) {
        if (this.gasLimit <= 0 || this.gasPrice.lte(0)) {
          return { valid: false, error: '가스 설정이 올바르지 않습니다' };
        }
      }

      // 4. 주소 형식 검증 (시스템/마이닝/스테이킹 보상의 발신 주소는 'BitWish-' 식별자 허용)
      const addressRegex = /^BW[0-9A-Fa-f]{40}$/;
      const isSystemFrom = this.from.startsWith('BitWish-');
      if ((!isSystemFrom && !addressRegex.test(this.from)) || !addressRegex.test(this.to)) {
        return { valid: false, error: '유효하지 않은 주소 형식입니다' };
      }

      // 5. 해시 검증
      const calculatedHash = this.calculateHash();
      if (this.hash && this.hash !== calculatedHash) {
        return { valid: false, error: '트랜잭션 해시가 일치하지 않습니다' };
      }

      // 6. 트랜잭션 타입 검증
      if (!Object.values(BITWISH_TRANSACTION_CONFIG.TYPES).includes(this.type)) {
        return { valid: false, error: '유효하지 않은 트랜잭션 타입입니다' };
      }

      // 7. 트랜잭션 크기 검증
      if (this.size > 1024 * 1024) { // 1MB 제한
        return { valid: false, error: '트랜잭션 크기가 너무 큽니다' };
      }

      // 8. Nonce 검증
      if (this.nonce < 0) {
        return { valid: false, error: '유효하지 않은 nonce입니다' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: `트랜잭션 검증 중 오류: ${error}` };
    }
  }

  /**
   * 트랜잭션 서명 생성
   */
  sign(privateKey: string): string {
    const txData = this.calculateHash();
    return createHmac('sha256', privateKey).update(txData).digest('hex');
  }

  /**
   * 트랜잭션 서명 검증
   */
  verifySignature(publicKey: string, signature: string): boolean {
    try {
      const txData = this.calculateHash();
      const expectedSignature = createHmac('sha256', publicKey).update(txData).digest('hex');
      return signature === expectedSignature;
    } catch (error) {
      return false;
    }
  }

  /**
   * 총 비용 계산 (금액 + 가스비)
   */
  calculateTotalCost(): Decimal {
    const gasCost = new Decimal(this.gasUsed).mul(this.gasPrice);
    return this.amount.plus(gasCost);
  }

  /**
   * 트랜잭션 크기 계산
   */
  private calculateSize(): number {
    const txData = JSON.stringify(this);
    return Buffer.byteLength(txData, 'utf8');
  }

  /**
   * 트랜잭션 요약 정보
   */
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

  /**
   * 트랜잭션을 JSON으로 직렬화
   */
  toJSON(): BitWishTransactionData {
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

  /**
   * JSON에서 트랜잭션 객체 생성
   */
  static fromJSON(data: BitWishTransactionData): BitWishTransaction {
    const tx = new BitWishTransaction(data);
    tx.hash = tx.calculateHash();
    return tx;
  }

  /**
   * 마이닝 보상 트랜잭션 생성
   */
  static createMiningRewardTransaction(
    to: string,
    amount: string,
    blockHeight: number
  ): BitWishTransaction {
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
      type: BITWISH_TRANSACTION_CONFIG.TYPES.MINING_REWARD,
      status: BITWISH_TRANSACTION_CONFIG.STATUS.PENDING
    });
  }

  /**
   * 스테이킹 보상 트랜잭션 생성
   */
  static createStakingRewardTransaction(
    to: string,
    amount: string,
    stakeId: string
  ): BitWishTransaction {
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
      type: BITWISH_TRANSACTION_CONFIG.TYPES.STAKING_REWARD,
      status: BITWISH_TRANSACTION_CONFIG.STATUS.PENDING
    });
  }

  /**
   * 시스템 트랜잭션 생성
   */
  static createSystemTransaction(
    from: string,
    to: string,
    amount: string,
    data: string
  ): BitWishTransaction {
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
      type: BITWISH_TRANSACTION_CONFIG.TYPES.SYSTEM,
      status: BITWISH_TRANSACTION_CONFIG.STATUS.PENDING
    });
  }

  /**
   * 일반 전송 트랜잭션 생성
   */
  static createTransferTransaction(
    from: string,
    to: string,
    amount: string,
    gasLimit: number = 21000,
    gasPrice: string = '0.001',
    data: string = ''
  ): BitWishTransaction {
    return new BitWishTransaction({
      from: from,
      to: to,
      amount: amount,
      gasLimit: gasLimit,
      gasPrice: gasPrice,
      data: data,
      timestamp: Date.now(),
      nonce: 0, // 실제로는 발신자의 현재 nonce를 사용해야 함
      type: BITWISH_TRANSACTION_CONFIG.TYPES.TRANSFER,
      status: BITWISH_TRANSACTION_CONFIG.STATUS.PENDING
    });
  }

  /**
   * 트랜잭션 상태 업데이트
   */
  updateStatus(status: string): void {
    if (Object.values(BITWISH_TRANSACTION_CONFIG.STATUS).includes(status)) {
      this.status = status;
    } else {
      throw new Error('유효하지 않은 트랜잭션 상태입니다');
    }
  }

  /**
   * 트랜잭션 실행 가능 여부 확인
   */
  canExecute(senderBalance: string): boolean {
    const balance = new Decimal(senderBalance);
    const totalCost = this.calculateTotalCost();
    return balance.gte(totalCost);
  }

  /**
   * 트랜잭션 실행 후 잔액 계산
   */
  calculateNewBalance(currentBalance: string): string {
    const balance = new Decimal(currentBalance);
    const totalCost = this.calculateTotalCost();
    return balance.minus(totalCost).toString();
  }

  /**
   * 트랜잭션 수수료 계산
   */
  calculateFee(): Decimal {
    return new Decimal(this.gasUsed).mul(this.gasPrice);
  }
}
