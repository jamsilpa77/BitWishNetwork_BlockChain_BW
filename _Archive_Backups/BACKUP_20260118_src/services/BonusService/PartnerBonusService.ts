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
 * ✅ 모든 텍스트는 한국어, 영어, 일어, 중국어포함 언어 변경 되도록 모든 기능에 완벽하게 구현한다. 
 *        단 절대 복잡하게 파일들을 만들지 않도록한다. 
 * ✅ 마이닝 페이지는 완벽한 독립성 보장과 완벽한 데이터베이스 MongDB 하이브리드 완벽 저장소 구현한다. 
 * ✅ 유저는 1명이든 천만명이든 개인 단독 데이터베이스 MongDB 하이브리드 완벽 저장소를 구현한다.
 */

import { PrecisionCalculator } from '@/utils/PrecisionCalculator/PrecisionCalculator';
import { LanguageManager } from '@/utils/LanguageManager/LanguageManager';
import {
  PartnerRecord,
  PartnerStatus,
  PartnerBonus,
  ContactInfo,
  DocumentInfo,
  User
} from '@/types';
import {
  BONUS_CONSTANTS,
  PARTNER_STATUS,
  PARTNER_BONUS_RATE
} from '@/constants';

/**
 * 가맹점 보너스 서비스 클래스 - 완벽한 독립성 보장
 * 125% 가맹점 보너스 시스템, 사업자 등록증 업로드, KYC 인증, 가맹점 심사
 */
export class PartnerBonusService {
  private precisionCalculator: PrecisionCalculator;
  private languageManager: LanguageManager;
  private partnerRecords: Map<string, PartnerRecord>;
  private userPartnerStatus: Map<string, PartnerBonus>;
  private pendingApprovals: Map<string, PartnerRecord>;

  constructor() {
    // 절대 준수사항: 전역 변수 사용 금지
    this.precisionCalculator = new PrecisionCalculator();
    this.languageManager = new LanguageManager();
    this.partnerRecords = new Map<string, PartnerRecord>();
    this.userPartnerStatus = new Map<string, PartnerBonus>();
    this.pendingApprovals = new Map<string, PartnerRecord>();
  }

  /**
   * 가맹점 등록 신청
   * @param userId 사용자 ID
   * @param businessName 사업자명
   * @param businessLicense 사업자 등록번호
   * @param contactInfo 연락처 정보
   * @param documents 문서 정보
   * @returns 가맹점 등록 신청 결과
   */
  public applyPartnerRegistration(
    userId: string,
    businessName: string,
    businessLicense: string,
    contactInfo: ContactInfo,
    documents: DocumentInfo[]
  ): {
    success: boolean;
    partnerId?: string;
    status?: PartnerStatus;
    message?: string;
  } {
    try {
      // 기존 가맹점 등록 확인
      const existingStatus = this.userPartnerStatus.get(userId);
      if (existingStatus && existingStatus.status !== PARTNER_STATUS.NOT_REGISTERED) {
        return {
          success: false,
          message: this.languageManager.translate('partner.alreadyRegistered')
        };
      }

      // 사업자 등록번호 중복 확인
      if (this.isBusinessLicenseDuplicate(businessLicense)) {
        return {
          success: false,
          message: this.languageManager.translate('partner.duplicateLicense')
        };
      }

      // 가맹점 등록 기록 생성
      const partnerId = `partner_${userId}_${Date.now()}`;
      const submittedAt = new Date();

      const partnerRecord: PartnerRecord = {
        id: partnerId,
        userId: userId,
        businessName: businessName,
        businessLicense: businessLicense,
        contactInfo: contactInfo,
        documents: documents,
        status: PARTNER_STATUS.PENDING,
        submittedAt: submittedAt,
        createdAt: submittedAt,
        updatedAt: submittedAt
      };

      this.partnerRecords.set(partnerId, partnerRecord);
      this.pendingApprovals.set(partnerId, partnerRecord);

      // 사용자 가맹점 상태 업데이트
      const partnerBonus: PartnerBonus = {
        status: PARTNER_STATUS.PENDING,
        registrationDate: submittedAt,
        approvalDate: null,
        businessLicense: businessLicense,
        bonusRate: 0, // 승인 전까지는 0%
        totalBonus: 0
      };

      this.userPartnerStatus.set(userId, partnerBonus);

      return {
        success: true,
        partnerId: partnerId,
        status: PARTNER_STATUS.PENDING,
        message: this.languageManager.translate('partner.registrationSubmitted')
      };
    } catch (error) {
      return {
        success: false,
        message: this.languageManager.translate('partner.registrationError')
      };
    }
  }

  /**
   * 가맹점 승인 처리
   * @param partnerId 가맹점 ID
   * @param approved 승인 여부
   * @param rejectionReason 거부 사유 (거부 시)
   * @returns 승인 처리 결과
   */
  public processPartnerApproval(
    partnerId: string,
    approved: boolean,
    rejectionReason?: string
  ): {
    success: boolean;
    status?: PartnerStatus;
    message?: string;
  } {
    try {
      const partnerRecord = this.partnerRecords.get(partnerId);
      if (!partnerRecord) {
        return {
          success: false,
          message: this.languageManager.translate('partner.recordNotFound')
        };
      }

      const reviewedAt = new Date();
      const newStatus = approved ? PARTNER_STATUS.APPROVED : PARTNER_STATUS.REJECTED;

      // 가맹점 기록 업데이트
      partnerRecord.status = newStatus;
      partnerRecord.reviewedAt = reviewedAt;
      partnerRecord.updatedAt = reviewedAt;

      if (approved) {
        partnerRecord.approvedAt = reviewedAt;
        delete partnerRecord.rejectionReason;
      } else {
        partnerRecord.rejectedAt = reviewedAt;
        if (typeof rejectionReason === 'string') {
          partnerRecord.rejectionReason = rejectionReason;
        } else {
          delete partnerRecord.rejectionReason;
        }
      }

      // 사용자 가맹점 상태 업데이트
      const userId = partnerRecord.userId;
      const userPartnerStatus = this.userPartnerStatus.get(userId);

      if (userPartnerStatus) {
        userPartnerStatus.status = newStatus;
        userPartnerStatus.approvalDate = approved ? reviewedAt : null;

        if (approved) {
          userPartnerStatus.bonusRate = PARTNER_BONUS_RATE; // 125% 보너스 적용
        }
      }

      // 대기 목록에서 제거
      this.pendingApprovals.delete(partnerId);

      return {
        success: true,
        status: newStatus,
        message: approved
          ? this.languageManager.translate('partner.approved')
          : this.languageManager.translate('partner.rejected')
      };
    } catch (error) {
      return {
        success: false,
        message: this.languageManager.translate('partner.approvalError')
      };
    }
  }

  /**
   * 가맹점 보너스 적용
   * @param userId 사용자 ID
   * @param baseRate 기본 보상률
   * @returns 가맹점 보너스 적용 결과
   */
  public applyPartnerBonus(userId: string, baseRate: number): {
    success: boolean;
    bonusRate?: number;
    bonusAmount?: number;
    totalRate?: number;
    isActive?: boolean;
  } {
    try {
      const partnerStatus = this.userPartnerStatus.get(userId);

      if (!partnerStatus || partnerStatus.status !== PARTNER_STATUS.APPROVED) {
        return {
          success: false,
          isActive: false
        };
      }

      // 125% 보너스 계산
      const bonusRate = partnerStatus.bonusRate;
      const bonusAmount = this.precisionCalculator.calculatePartnerBonus(
        baseRate,
        bonusRate
      );
      const totalRate = this.precisionCalculator.add(baseRate, bonusAmount.toNumber());

      return {
        success: true,
        bonusRate: bonusRate,
        bonusAmount: bonusAmount.toNumber(),
        totalRate: totalRate.toNumber(),
        isActive: true
      };
    } catch (error) {
      return {
        success: false,
        isActive: false
      };
    }
  }

  /**
   * 가맹점 상태 조회
   * @param userId 사용자 ID
   * @returns 가맹점 상태
   */
  public getPartnerStatus(userId: string): {
    status: PartnerStatus;
    registrationDate: Date | null;
    approvalDate: Date | null;
    businessLicense: string | null;
    bonusRate: number;
    totalBonus: number;
    partnerRecord?: PartnerRecord;
  } {
    const partnerStatus = this.userPartnerStatus.get(userId);

    if (!partnerStatus) {
      return {
        status: PARTNER_STATUS.NOT_REGISTERED,
        registrationDate: null,
        approvalDate: null,
        businessLicense: null,
        bonusRate: 0,
        totalBonus: 0
      };
    }

    // 가맹점 기록 조회
    const partnerRecord = this.findPartnerRecordByUserId(userId);

    return {
      status: partnerStatus.status,
      registrationDate: partnerStatus.registrationDate,
      approvalDate: partnerStatus.approvalDate,
      businessLicense: partnerStatus.businessLicense ?? null,
      bonusRate: partnerStatus.bonusRate,
      totalBonus: partnerStatus.totalBonus,
      ...(partnerRecord ? { partnerRecord } : {})
    };
  }

  /**
   * 대기 중인 가맹점 신청 목록 조회
   * @returns 대기 중인 가맹점 신청 목록
   */
  public getPendingApprovals(): {
    pendingApprovals: PartnerRecord[];
    totalCount: number;
  } {
    const pendingApprovals = Array.from(this.pendingApprovals.values());

    return {
      pendingApprovals: pendingApprovals,
      totalCount: pendingApprovals.length
    };
  }

  /**
   * 가맹점 통계 조회
   * @returns 가맹점 통계
   */
  public getPartnerStats(): {
    totalApplications: number;
    approvedApplications: number;
    rejectedApplications: number;
    pendingApplications: number;
    totalPartners: number;
  } {
    let totalApplications = 0;
    let approvedApplications = 0;
    let rejectedApplications = 0;
    let pendingApplications = 0;
    let totalPartners = 0;

    for (const record of this.partnerRecords.values()) {
      totalApplications++;

      switch (record.status) {
        case PARTNER_STATUS.APPROVED:
          approvedApplications++;
          totalPartners++;
          break;
        case PARTNER_STATUS.REJECTED:
          rejectedApplications++;
          break;
        case PARTNER_STATUS.PENDING:
          pendingApplications++;
          break;
      }
    }

    return {
      totalApplications,
      approvedApplications,
      rejectedApplications,
      pendingApplications,
      totalPartners
    };
  }

  /**
   * 사업자 등록번호 중복 확인
   * @param businessLicense 사업자 등록번호
   * @returns 중복 여부
   */
  private isBusinessLicenseDuplicate(businessLicense: string): boolean {
    for (const record of this.partnerRecords.values()) {
      if (record.businessLicense === businessLicense) {
        return true;
      }
    }
    return false;
  }

  /**
   * 사용자 ID로 가맹점 기록 찾기
   * @param userId 사용자 ID
   * @returns 가맹점 기록
   */
  private findPartnerRecordByUserId(userId: string): PartnerRecord | undefined {
    for (const record of this.partnerRecords.values()) {
      if (record.userId === userId) {
        return record;
      }
    }
    return undefined;
  }

  /**
   * 가맹점 보너스 검증
   * @param userId 사용자 ID
   * @returns 검증 결과
   */
  public validatePartnerBonus(userId: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const partnerStatus = this.userPartnerStatus.get(userId);

    if (!partnerStatus) {
      errors.push(this.languageManager.translate('partner.noStatus'));
      return {
        isValid: false,
        errors: errors
      };
    }

    // 가맹점 상태 검증
    if (partnerStatus.status !== PARTNER_STATUS.APPROVED) {
      errors.push(this.languageManager.translate('partner.notApproved'));
    }

    // 보너스 비율 검증
    if (partnerStatus.bonusRate < 0 || partnerStatus.bonusRate > 2) {
      errors.push(this.languageManager.translate('partner.invalidBonusRate'));
    }

    // 총 보너스 검증
    if (partnerStatus.totalBonus < 0) {
      errors.push(this.languageManager.translate('partner.invalidTotalBonus'));
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * 가맹점 보너스 리셋
   * @param userId 사용자 ID
   * @returns 리셋 결과
   */
  public resetPartnerBonus(userId: string): {
    success: boolean;
    message?: string;
  } {
    try {
      const partnerStatus = this.userPartnerStatus.get(userId);

      if (partnerStatus) {
        partnerStatus.totalBonus = 0;
        partnerStatus.bonusRate = 0;
      }

      return {
        success: true,
        message: this.languageManager.translate('partner.reset')
      };
    } catch (error) {
      return {
        success: false,
        message: this.languageManager.translate('partner.resetError')
      };
    }
  }

  /**
   * 가맹점 등록 취소
   * @param userId 사용자 ID
   * @returns 취소 결과
   */
  public cancelPartnerRegistration(userId: string): {
    success: boolean;
    message?: string;
  } {
    try {
      const partnerRecord = this.findPartnerRecordByUserId(userId);

      if (!partnerRecord) {
        return {
          success: false,
          message: this.languageManager.translate('partner.recordNotFound')
        };
      }

      if (partnerRecord.status !== PARTNER_STATUS.PENDING) {
        return {
          success: false,
          message: this.languageManager.translate('partner.cannotCancel')
        };
      }

      // 가맹점 기록 삭제
      this.partnerRecords.delete(partnerRecord.id);
      this.pendingApprovals.delete(partnerRecord.id);

      // 사용자 상태 초기화
      const partnerStatus: PartnerBonus = {
        status: PARTNER_STATUS.NOT_REGISTERED,
        registrationDate: null,
        approvalDate: null,
        businessLicense: null,
        bonusRate: 0,
        totalBonus: 0
      };

      this.userPartnerStatus.set(userId, partnerStatus);

      return {
        success: true,
        message: this.languageManager.translate('partner.cancelled')
      };
    } catch (error) {
      return {
        success: false,
        message: this.languageManager.translate('partner.cancelError')
      };
    }
  }
}
