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

import { PrecisionCalculator } from '../../src/utils/PrecisionCalculator/PrecisionCalculator';

describe('PrecisionCalculator', () => {
  let precisionCalculator: PrecisionCalculator;

  beforeEach(() => {
    // 절대 준수사항: 전역 변수 사용 금지
    precisionCalculator = new PrecisionCalculator();
  });

  describe('기본 연산 테스트', () => {
    test('덧셈 연산 정확성', () => {
      const result = precisionCalculator.add(0.1, 0.2);
      expect(result).toBe('0.3');
    });

    test('뺄셈 연산 정확성', () => {
      const result = precisionCalculator.subtract(0.3, 0.1);
      expect(result).toBe('0.2');
    });

    test('곱셈 연산 정확성', () => {
      const result = precisionCalculator.multiply(0.1, 0.2);
      expect(result).toBe('0.02');
    });

    test('나눗셈 연산 정확성', () => {
      const result = precisionCalculator.divide(0.1, 0.2);
      expect(result).toBe('0.5');
    });
  });

  describe('50자리 정밀도 테스트', () => {
    test('50자리 정밀도 덧셈', () => {
      const a = '0.12345678901234567890123456789012345678901234567890';
      const b = '0.98765432109876543210987654321098765432109876543210';
      const result = precisionCalculator.add(a, b);
      expect(result).toBe('1.1111111101111111110111111111011111111011111111011111111');
    });

    test('50자리 정밀도 곱셈', () => {
      const a = '0.12345678901234567890123456789012345678901234567890';
      const b = '2';
      const result = precisionCalculator.multiply(a, b);
      expect(result).toBe('0.2469135780246913578024691357802469135780246913578');
    });
  });

  describe('UI 표시 형식 테스트', () => {
    test('8자리 소수점 표시', () => {
      const value = '0.12345678901234567890123456789012345678901234567890';
      const formatted = precisionCalculator.format(value, 8);
      expect(formatted).toBe('0.12345679');
    });

    test('정수 표시', () => {
      const value = '123.45678901234567890123456789012345678901234567890';
      const formatted = precisionCalculator.format(value, 8);
      expect(formatted).toBe('123.45678901');
    });
  });

  describe('보너스 계산 테스트', () => {
    test('출석 보너스 5% 계산', () => {
      const baseAmount = 100;
      const bonusRate = 0.05;
      const bonusAmount = precisionCalculator.multiply(baseAmount, bonusRate);
      expect(bonusAmount).toBe('5');
    });

    test('추천 보너스 2% 계산', () => {
      const baseAmount = 100;
      const bonusRate = 0.02;
      const bonusAmount = precisionCalculator.multiply(baseAmount, bonusRate);
      expect(bonusAmount).toBe('2');
    });

    test('가맹점 보너스 125% 계산', () => {
      const baseAmount = 100;
      const bonusRate = 1.25;
      const bonusAmount = precisionCalculator.multiply(baseAmount, bonusRate);
      expect(bonusAmount).toBe('125');
    });
  });

  describe('마이닝 보상 계산 테스트', () => {
    test('시간당 기본 보상 0.25 BW', () => {
      const hourlyRate = 0.25;
      const hours = 1;
      const totalReward = precisionCalculator.multiply(hourlyRate, hours);
      expect(totalReward).toBe('0.25');
    });

    test('일일 기본 보상 6.0 BW', () => {
      const dailyRate = 6.0;
      const days = 1;
      const totalReward = precisionCalculator.multiply(dailyRate, days);
      expect(totalReward).toBe('6');
    });

    test('보너스 포함 총 보상 계산', () => {
      const baseReward = 6.0;
      const attendanceBonus = precisionCalculator.multiply(baseReward, 0.05);
      const referralBonus = precisionCalculator.multiply(baseReward, 0.02);
      const partnerBonus = precisionCalculator.multiply(baseReward, 1.25);
      
      const totalBonus = precisionCalculator.add(
        precisionCalculator.add(attendanceBonus, referralBonus),
        partnerBonus
      );
      
      const totalReward = precisionCalculator.add(baseReward, totalBonus);
      expect(totalReward).toBe('7.92');
    });
  });

  describe('에러 처리 테스트', () => {
    test('잘못된 입력값 처리', () => {
      expect(() => {
        precisionCalculator.add('invalid', '0.1');
      }).toThrow();
    });

    test('0으로 나누기 방지', () => {
      expect(() => {
        precisionCalculator.divide('1', '0');
      }).toThrow();
    });

    test('음수 처리', () => {
      const result = precisionCalculator.add('-1', '1');
      expect(result).toBe('0');
    });
  });

  describe('성능 테스트', () => {
    test('대량 계산 성능', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        precisionCalculator.add('0.1', '0.2');
      }
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(1000); // 1초 미만
    });

    test('복잡한 계산 성능', () => {
      const startTime = Date.now();
      
      let result = '1';
      for (let i = 0; i < 100; i++) {
        result = precisionCalculator.multiply(result, '1.01');
      }
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(500); // 0.5초 미만
      expect(result).toBeDefined();
    });
  });
});

