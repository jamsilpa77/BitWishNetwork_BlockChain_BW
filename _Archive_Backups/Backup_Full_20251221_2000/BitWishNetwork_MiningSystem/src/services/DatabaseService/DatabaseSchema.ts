/**
 * BitWishNetwork BW 포인트 채굴 시스템
 * 현재 토큰 이코노미는 완벽한 가상 이코노미입니다.
 * 추후 KYC 시스템 구현과 블록체인 연결 지갑까지 완성하면 
 * KYC 승인 후 실제 BW 토큰이 마이그레이션 되는 방식입니다.
 * 
 * ⚠️ 중요 준수 사항: 전역 모달, 공통 변수 함수 절대 포함하지 않는다
 * ❌ 전역 변수 사용 금지
 * ❌ 공통 함수 사용 금지  
 * ❌ 공통 클래스 사용 금지
 * ❌ 전역 모달 사용 금지
 * ❌ 중복 코드 사용 금지
 * ❌ 다른 컴포넌트와 상태 공유 금지
 * ❌ 전역 상태 관리 라이브러리 사용 금지
 * 
 * ✅ 모든 파일 첫 줄부터 주석에 절대 준수사항 명시 추가
 * ✅ 자체 보안 검증만 사용
 * ✅ 50단위 부동소수점 정밀 계산형식으로 구현 하지만 UI 홈페이지 이미지상 소수즘 8자리만 표기한다. 
 * ✅ BitWish Network 전용 시스템만 사용
 * ✅ 모든 텍스트는 한국어, 영어, 일어, 중국어포함 동남아권 언어 변경 되도록 모든 기능에 완벽하게 구현한다. 
 *        단 절대 복잡하게 파일들을 만들지 않도록한다. 
 * ✅ 마이닝 페이지는 완벽한 독립성 보장과 완벽한 데이터베이스 MongDB 하이브리드 완벽 저장소 구현한다. 
 * ✅ 유저는 1명이든 천만명이든 개인 단독 데이터베이스 MongDB 하이브리드 완벽 저장소를 구현한다.
 */

import { 
  User, 
  MiningRecord, 
  AttendanceRecord, 
  ReferralRecord, 
  PartnerRecord,
  Wallet,
  Transaction,
  Block,
  AttendanceStatus,
  ReferralStatus,
  PartnerStatus,
  MiningStatus
} from '@/types';

/**
 * 데이터베이스 스키마 클래스 - 완벽한 독립성 보장
 * 사용자 데이터, 마이닝 데이터, 보너스 데이터, 추천 관계 데이터, 가맹점 데이터
 */
export class DatabaseSchema {
  /**
   * 사용자 데이터 스키마
   */
  public static getUserSchema(): any {
    return {
      userId: { type: String, required: true, unique: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      walletAddress: { type: String, required: true, unique: true },
      kycStatus: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
      isActive: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
      lastLoginAt: { type: Date },
      totalMiningAmount: { type: Number, default: 0 },
      totalBonusAmount: { type: Number, default: 0 },
      referralCode: { type: String },
      referrerId: { type: String },
      partnerStatus: { type: String, enum: ['NOT_REGISTERED', 'PENDING', 'APPROVED', 'REJECTED'], default: 'NOT_REGISTERED' }
    };
  }

  /**
   * 마이닝 기록 스키마
   */
  public static getMiningRecordSchema(): any {
    return {
      id: { type: String, required: true, unique: true },
      userId: { type: String, required: true },
      status: { type: String, enum: ['running', 'stopped', 'paused'], required: true },
      startTime: { type: Date, required: true },
      endTime: { type: Date },
      miningTime: { type: Number, default: 0 },
      baseReward: { type: Number, required: true },
      bonusReward: { type: Number, default: 0 },
      totalReward: { type: Number, required: true },
      attendanceBonus: { type: Number, default: 0 },
      referralBonus: { type: Number, default: 0 },
      partnerBonus: { type: Number, default: 0 },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    };
  }

  /**
   * 출석 기록 스키마
   */
  public static getAttendanceRecordSchema(): any {
    return {
      id: { type: String, required: true, unique: true },
      userId: { type: String, required: true },
      date: { type: Date, required: true },
      checkTime: { type: Date, required: true },
      bonusRate: { type: Number, required: true },
      bonusAmount: { type: Number, required: true },
      status: { type: String, enum: ['AVAILABLE', 'COMPLETED', 'EXPIRED', 'FUTURE'], required: true },
      consecutiveDays: { type: Number, default: 0 },
      totalBonus: { type: Number, default: 0 },
      createdAt: { type: Date, default: Date.now }
    };
  }

  /**
   * 추천 기록 스키마
   */
  public static getReferralRecordSchema(): any {
    return {
      id: { type: String, required: true, unique: true },
      referrerId: { type: String, required: true },
      referredId: { type: String, required: true },
      referralCode: { type: String, required: true },
      bonusRate: { type: Number, required: true },
      bonusAmount: { type: Number, default: 0 },
      rewardAmount: { type: Number, required: true },
      status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'EXPIRED'], default: 'ACTIVE' },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    };
  }

  /**
   * 가맹점 기록 스키마
   */
  public static getPartnerRecordSchema(): any {
    return {
      id: { type: String, required: true, unique: true },
      userId: { type: String, required: true },
      businessName: { type: String, required: true },
      businessLicense: { type: String, required: true, unique: true },
      contactInfo: {
        phone: { type: String, required: true },
        email: { type: String, required: true },
        address: { type: String, required: true }
      },
      documents: [{
        type: { type: String, required: true },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now }
      }],
      status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
      submittedAt: { type: Date, default: Date.now },
      reviewedAt: { type: Date },
      approvedAt: { type: Date },
      rejectedAt: { type: Date },
      rejectionReason: { type: String },
      bonusRate: { type: Number, default: 0 },
      totalBonus: { type: Number, default: 0 },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    };
  }

  /**
   * 지갑 스키마
   */
  public static getWalletSchema(): any {
    return {
      id: { type: String, required: true, unique: true },
      userId: { type: String, required: true },
      address: { type: String, required: true, unique: true },
      privateKey: { type: String, required: true },
      publicKey: { type: String, required: true },
      balance: { type: Number, default: 0 },
      totalReceived: { type: Number, default: 0 },
      totalSent: { type: Number, default: 0 },
      isActive: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    };
  }

  /**
   * 거래 기록 스키마
   */
  public static getTransactionSchema(): any {
    return {
      id: { type: String, required: true, unique: true },
      userId: { type: String, required: true },
      fromAddress: { type: String, required: true },
      toAddress: { type: String, required: true },
      amount: { type: Number, required: true },
      type: { type: String, enum: ['MINING', 'BONUS', 'TRANSFER', 'REFERRAL', 'PARTNER'], required: true },
      status: { type: String, enum: ['PENDING', 'CONFIRMED', 'FAILED'], default: 'PENDING' },
      blockHash: { type: String },
      transactionHash: { type: String },
      gasUsed: { type: Number },
      gasPrice: { type: Number },
      createdAt: { type: Date, default: Date.now },
      confirmedAt: { type: Date }
    };
  }

  /**
   * 블록 스키마
   */
  public static getBlockSchema(): any {
    return {
      id: { type: String, required: true, unique: true },
      blockNumber: { type: Number, required: true, unique: true },
      previousHash: { type: String, required: true },
      hash: { type: String, required: true, unique: true },
      merkleRoot: { type: String, required: true },
      timestamp: { type: Date, required: true },
      nonce: { type: Number, required: true },
      difficulty: { type: Number, required: true },
      miner: { type: String, required: true },
      transactions: [{ type: String }],
      transactionCount: { type: Number, default: 0 },
      size: { type: Number, required: true },
      gasUsed: { type: Number, default: 0 },
      gasLimit: { type: Number, required: true },
      createdAt: { type: Date, default: Date.now }
    };
  }

  /**
   * 인덱스 생성
   */
  public static getIndexes(): any {
    return {
      users: [
        { userId: 1 },
        { email: 1 },
        { walletAddress: 1 },
        { createdAt: -1 }
      ],
      mining_records: [
        { userId: 1 },
        { status: 1 },
        { createdAt: -1 },
        { startTime: -1 }
      ],
      attendance_records: [
        { userId: 1 },
        { date: 1 },
        { status: 1 },
        { createdAt: -1 }
      ],
      referral_records: [
        { referrerId: 1 },
        { referredId: 1 },
        { referralCode: 1 },
        { status: 1 },
        { createdAt: -1 }
      ],
      partner_records: [
        { userId: 1 },
        { businessLicense: 1 },
        { status: 1 },
        { createdAt: -1 }
      ],
      wallets: [
        { userId: 1 },
        { address: 1 },
        { isActive: 1 },
        { createdAt: -1 }
      ],
      transactions: [
        { userId: 1 },
        { fromAddress: 1 },
        { toAddress: 1 },
        { type: 1 },
        { status: 1 },
        { createdAt: -1 }
      ],
      blocks: [
        { blockNumber: 1 },
        { hash: 1 },
        { miner: 1 },
        { timestamp: -1 }
      ]
    };
  }

  /**
   * 데이터 검증 규칙
   */
  public static getValidationRules(): any {
    return {
      userId: {
        required: true,
        minLength: 3,
        maxLength: 50,
        pattern: /^[a-zA-Z0-9_]+$/
      },
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      },
      password: {
        required: true,
        minLength: 8,
        maxLength: 128
      },
      walletAddress: {
        required: true,
        length: 42,
        pattern: /^0x[a-fA-F0-9]{40}$/
      },
      businessLicense: {
        required: true,
        minLength: 10,
        maxLength: 20,
        pattern: /^[0-9-]+$/
      },
      phone: {
        required: true,
        pattern: /^[0-9+\-\s()]+$/
      },
      amount: {
        required: true,
        min: 0,
        max: 1000000000
      }
    };
  }

  /**
   * 데이터 마이그레이션 스키마
   */
  public static getMigrationSchema(): any {
    return {
      version: { type: String, required: true },
      description: { type: String, required: true },
      changes: [{
        collection: { type: String, required: true },
        operation: { type: String, enum: ['CREATE', 'UPDATE', 'DELETE'], required: true },
        field: { type: String },
        oldValue: { type: String },
        newValue: { type: String }
      }],
      appliedAt: { type: Date, default: Date.now },
      appliedBy: { type: String, required: true }
    };
  }

  /**
   * 백업 스키마
   */
  public static getBackupSchema(): any {
    return {
      id: { type: String, required: true, unique: true },
      userId: { type: String, required: true },
      backupType: { type: String, enum: ['FULL', 'INCREMENTAL', 'DIFFERENTIAL'], required: true },
      collections: [{ type: String }],
      data: { type: Object, required: true },
      size: { type: Number, required: true },
      checksum: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      expiresAt: { type: Date }
    };
  }

  /**
   * 통계 스키마
   */
  public static getStatisticsSchema(): any {
    return {
      id: { type: String, required: true, unique: true },
      userId: { type: String, required: true },
      date: { type: Date, required: true },
      totalMiningTime: { type: Number, default: 0 },
      totalMiningAmount: { type: Number, default: 0 },
      totalBonusAmount: { type: Number, default: 0 },
      attendanceDays: { type: Number, default: 0 },
      referralCount: { type: Number, default: 0 },
      partnerStatus: { type: String },
      walletBalance: { type: Number, default: 0 },
      transactionCount: { type: Number, default: 0 },
      createdAt: { type: Date, default: Date.now }
    };
  }
}
