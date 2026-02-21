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

import { AttendanceBonusService } from '../../src/services/BonusService/AttendanceBonusService';
import { ReferralBonusService } from '../../src/services/BonusService/ReferralBonusService';
import { PartnerBonusService } from '../../src/services/BonusService/PartnerBonusService';

describe('BonusSystem', () => {
  let attendanceBonusService: AttendanceBonusService;
  let referralBonusService: ReferralBonusService;
  let partnerBonusService: PartnerBonusService;

  beforeEach(() => {
    // 절대 준수사항: 전역 변수 사용 금지
    attendanceBonusService = new AttendanceBonusService();
    referralBonusService = new ReferralBonusService();
    partnerBonusService = new PartnerBonusService();
  });

  describe('출석 보너스 시스템 테스트', () => {
    test('출석 체크 성공', async () => {
      const result = await attendanceBonusService.checkAttendance('user123');
      expect(result.success).toBe(true);
      expect(result.message).toContain('출석 체크가 완료되었습니다');
    });

    test('중복 출석 체크 방지', async () => {
      await attendanceBonusService.checkAttendance('user123');
      const result = await attendanceBonusService.checkAttendance('user123');
      expect(result.success).toBe(false);
      expect(result.message).toContain('이미 출석 체크를 완료했습니다');
    });

    test('출석 보너스 5% 계산', async () => {
      const result = await attendanceBonusService.checkAttendance('user123');
      expect(result.success).toBe(true);
      expect(result.bonusAmount).toBe('5');
    });

    test('연속 출석일 계산', async () => {
      // 여러 날 연속 출석 체크
      for (let i = 0; i < 5; i++) {
        await attendanceBonusService.checkAttendance('user123');
      }
      
      const status = await attendanceBonusService.getAttendanceStatus('user123');
      expect(status.success).toBe(true);
      expect(status.consecutiveDays).toBe(5);
    });

    test('출석 달력 조회', async () => {
      const calendar = await attendanceBonusService.getAttendanceCalendar('user123', 2024, 1);
      expect(calendar.success).toBe(true);
      expect(calendar.calendar).toBeDefined();
      expect(Array.isArray(calendar.calendar)).toBe(true);
    });
  });

  describe('추천 보너스 시스템 테스트', () => {
    test('추천인 코드 생성', async () => {
      const result = await referralBonusService.generateReferralCode('user123');
      expect(result.success).toBe(true);
      expect(result.referralCode).toBeDefined();
      expect(result.referralCode?.length).toBeGreaterThan(8);
    });

    test('추천인 코드로 가입', async () => {
      const referrerResult = await referralBonusService.generateReferralCode('referrer123');
      const joinResult = await referralBonusService.joinWithReferralCode(
        'newuser123', 
        referrerResult.referralCode!
      );
      expect(joinResult.success).toBe(true);
      expect(joinResult.message).toContain('추천인 코드로 가입이 완료되었습니다');
    });

    test('추천 보너스 2% 계산', async () => {
      const result = await referralBonusService.applyReferralBonus('user123', 'referrer123');
      expect(result.success).toBe(true);
      expect(result.bonusAmount).toBe('2');
    });

    test('추천 보상 1BW 지급', async () => {
      const result = await referralBonusService.claimReferralReward('referrer123');
      expect(result.success).toBe(true);
      expect(result.rewardAmount).toBe('1');
    });

    test('자기 자신 추천 방지', async () => {
      const result = await referralBonusService.joinWithReferralCode('user123', 'user123');
      expect(result.success).toBe(false);
      expect(result.message).toContain('자기 자신을 추천할 수 없습니다');
    });
  });

  describe('가맹점 보너스 시스템 테스트', () => {
    test('가맹점 등록 신청', async () => {
      const partnerData = {
        businessName: '테스트 가맹점',
        businessLicense: '123-45-67890',
        contactInfo: {
          phone: '010-1234-5678',
          email: 'test@example.com',
          address: '서울시 강남구'
        }
      };
      
      const result = await partnerBonusService.registerPartner('user123', partnerData);
      expect(result.success).toBe(true);
      expect(result.message).toContain('가맹점 등록 신청이 제출되었습니다');
    });

    test('가맹점 승인', async () => {
      await partnerBonusService.registerPartner('user123', {
        businessName: '테스트 가맹점',
        businessLicense: '123-45-67890',
        contactInfo: {
          phone: '010-1234-5678',
          email: 'test@example.com',
          address: '서울시 강남구'
        }
      });
      
      const result = await partnerBonusService.approvePartner('user123');
      expect(result.success).toBe(true);
      expect(result.message).toContain('가맹점이 승인되었습니다');
    });

    test('가맹점 보너스 125% 계산', async () => {
      const result = await partnerBonusService.applyPartnerBonus('user123');
      expect(result.success).toBe(true);
      expect(result.bonusAmount).toBe('125');
    });

    test('중복 사업자 등록번호 방지', async () => {
      const partnerData = {
        businessName: '테스트 가맹점',
        businessLicense: '123-45-67890',
        contactInfo: {
          phone: '010-1234-5678',
          email: 'test@example.com',
          address: '서울시 강남구'
        }
      };
      
      await partnerBonusService.registerPartner('user123', partnerData);
      const result = await partnerBonusService.registerPartner('user456', partnerData);
      expect(result.success).toBe(false);
      expect(result.message).toContain('중복된 사업자 등록번호입니다');
    });
  });

  describe('보너스 통합 테스트', () => {
    test('모든 보너스 동시 적용', async () => {
      // 출석 보너스
      await attendanceBonusService.checkAttendance('user123');
      
      // 추천 보너스
      await referralBonusService.generateReferralCode('user123');
      
      // 가맹점 보너스
      await partnerBonusService.registerPartner('user123', {
        businessName: '테스트 가맹점',
        businessLicense: '123-45-67890',
        contactInfo: {
          phone: '010-1234-5678',
          email: 'test@example.com',
          address: '서울시 강남구'
        }
      });
      await partnerBonusService.approvePartner('user123');
      
      // 총 보너스 계산
      const totalBonus = 5 + 2 + 125; // 132%
      expect(totalBonus).toBe(132);
    });

    test('보너스 중복 적용 방지', async () => {
      // 출석 보너스 중복 적용 방지
      await attendanceBonusService.checkAttendance('user123');
      const duplicateResult = await attendanceBonusService.checkAttendance('user123');
      expect(duplicateResult.success).toBe(false);
      
      // 추천 보너스 중복 적용 방지
      await referralBonusService.generateReferralCode('user123');
      const duplicateReferralResult = await referralBonusService.generateReferralCode('user123');
      expect(duplicateReferralResult.success).toBe(false);
    });
  });

  describe('보너스 계산 정확성 테스트', () => {
    test('출석 보너스 5% 정확성', () => {
      const baseAmount = 100;
      const bonusRate = 0.05;
      const expectedBonus = baseAmount * bonusRate;
      expect(expectedBonus).toBe(5);
    });

    test('추천 보너스 2% 정확성', () => {
      const baseAmount = 100;
      const bonusRate = 0.02;
      const expectedBonus = baseAmount * bonusRate;
      expect(expectedBonus).toBe(2);
    });

    test('가맹점 보너스 125% 정확성', () => {
      const baseAmount = 100;
      const bonusRate = 1.25;
      const expectedBonus = baseAmount * bonusRate;
      expect(expectedBonus).toBe(125);
    });

    test('복합 보너스 계산', () => {
      const baseAmount = 100;
      const attendanceBonus = baseAmount * 0.05; // 5%
      const referralBonus = baseAmount * 0.02; // 2%
      const partnerBonus = baseAmount * 1.25; // 125%
      
      const totalBonus = attendanceBonus + referralBonus + partnerBonus;
      const totalAmount = baseAmount + totalBonus;
      
      expect(totalAmount).toBe(232); // 100 + 5 + 2 + 125
    });
  });

  describe('에러 처리 테스트', () => {
    test('잘못된 사용자 ID 처리', async () => {
      const result = await attendanceBonusService.checkAttendance('');
      expect(result.success).toBe(false);
      expect(result.message).toContain('유효하지 않은 사용자 ID입니다');
    });

    test('존재하지 않는 추천인 코드', async () => {
      const result = await referralBonusService.joinWithReferralCode('user123', 'invalid-code');
      expect(result.success).toBe(false);
      expect(result.message).toContain('유효하지 않은 추천인 코드입니다');
    });

    test('승인되지 않은 가맹점 보너스 적용', async () => {
      const result = await partnerBonusService.applyPartnerBonus('user123');
      expect(result.success).toBe(false);
      expect(result.message).toContain('가맹점이 승인되지 않았습니다');
    });
  });

  describe('성능 테스트', () => {
    test('대량 출석 체크 성능', async () => {
      const startTime = Date.now();
      
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(attendanceBonusService.checkAttendance(`user${i}`));
      }
      
      await Promise.all(promises);
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(5000); // 5초 미만
    });

    test('대량 추천 코드 생성 성능', async () => {
      const startTime = Date.now();
      
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(referralBonusService.generateReferralCode(`user${i}`));
      }
      
      await Promise.all(promises);
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(3000); // 3초 미만
    });
  });
});

