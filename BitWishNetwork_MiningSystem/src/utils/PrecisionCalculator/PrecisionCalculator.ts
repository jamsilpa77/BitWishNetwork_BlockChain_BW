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
 * ✅ 주석에 명시 추가
 * ✅ 자체 보안 검증만 사용
 * ✅ 50단위 부동소수점 정밀 계산형식으로 구현 하지만 UI 홈페이지 이미지상 소수즘 8자리만 표기한다. 
 * ✅ BitWish Network 전용 시스템만 사용
 * ✅ 모든 텍스트는 한국어, 영어, 일어, 중국어포함 언어 변경 되도록 모든 기능에 완벽하게 구현한다. 
 *        단 절대 복잡하게 파일들을 만들지 않도록한다. 
 * ✅ 마이닝 페이지는 완벽한 독립성 보장과 완벽한 데이터베이스 MongDB 하이브리드 완벽 저장소 구현한다. 
 * ✅ 유저는 1명이든 천만명이든 개인 단독 데이터베이스 MongDB 하이브리드 완벽 저장소를 구현한다.
 */

import { Decimal } from 'decimal.js';

// 50자리 정밀도 설정
Decimal.set({ precision: 50, rounding: Decimal.ROUND_HALF_UP });

/**
 * 정밀 계산기 클래스 - 50자리 부동소수점 정밀 계산
 * UI에서는 소수점 8자리까지만 표시
 */
export class PrecisionCalculator {
  private readonly precision: number = 50;
  private readonly displayPrecision: number = 8;

  constructor() {
    // 절대 준수사항: 전역 변수 사용 금지
    // 인스턴스 변수만 사용
  }

  /**
   * 50자리 정밀도로 덧셈 계산
   * @param a 첫 번째 숫자
   * @param b 두 번째 숫자
   * @returns 50자리 정밀도 결과
   */
  public add(a: number | string, b: number | string): Decimal {
    const decimalA = new Decimal(a);
    const decimalB = new Decimal(b);
    return decimalA.add(decimalB);
  }

  /**
   * 50자리 정밀도로 뺄셈 계산
   * @param a 첫 번째 숫자
   * @param b 두 번째 숫자
   * @returns 50자리 정밀도 결과
   */
  public subtract(a: number | string, b: number | string): Decimal {
    const decimalA = new Decimal(a);
    const decimalB = new Decimal(b);
    return decimalA.sub(decimalB);
  }

  /**
   * 50자리 정밀도로 곱셈 계산
   * @param a 첫 번째 숫자
   * @param b 두 번째 숫자
   * @returns 50자리 정밀도 결과
   */
  public multiply(a: number | string, b: number | string): Decimal {
    const decimalA = new Decimal(a);
    const decimalB = new Decimal(b);
    return decimalA.mul(decimalB);
  }

  /**
   * 50자리 정밀도로 나눗셈 계산
   * @param a 첫 번째 숫자
   * @param b 두 번째 숫자
   * @returns 50자리 정밀도 결과
   */
  public divide(a: number | string, b: number | string): Decimal {
    const decimalA = new Decimal(a);
    const decimalB = new Decimal(b);
    return decimalA.div(decimalB);
  }

  /**
   * 50자리 정밀도로 백분율 계산
   * @param value 기준값
   * @param percentage 백분율 (예: 5 = 5%)
   * @returns 50자리 정밀도 결과
   */
  public calculatePercentage(value: number | string, percentage: number | string): Decimal {
    const decimalValue = new Decimal(value);
    const decimalPercentage = new Decimal(percentage);
    const percentageDecimal = decimalPercentage.div(100);
    return decimalValue.mul(percentageDecimal);
  }

  /**
   * 50자리 정밀도로 복리 계산
   * @param principal 원금
   * @param rate 이자율 (예: 0.05 = 5%)
   * @param time 시간 (시간 단위)
   * @returns 50자리 정밀도 결과
   */
  public calculateCompoundInterest(
    principal: number | string,
    rate: number | string,
    time: number | string
  ): Decimal {
    const decimalPrincipal = new Decimal(principal);
    const decimalRate = new Decimal(rate);
    const decimalTime = new Decimal(time);

    // 복리 공식: A = P(1 + r)^t
    const onePlusRate = new Decimal(1).add(decimalRate);
    const compoundFactor = onePlusRate.pow(decimalTime);

    return decimalPrincipal.mul(compoundFactor);
  }

  /**
   * 50자리 정밀도로 마이닝 보상 계산
   * @param baseRate 기본 보상률
   * @param bonusRate 보너스 비율 (예: 0.05 = 5%)
   * @param time 시간 (시간 단위)
   * @returns 50자리 정밀도 결과
   */
  public calculateMiningReward(
    baseRate: number | string,
    bonusRate: number | string,
    time: number | string
  ): Decimal {
    const decimalBaseRate = new Decimal(baseRate);
    const decimalBonusRate = new Decimal(bonusRate);
    const decimalTime = new Decimal(time);

    // 최종 보상률 = 기본 보상률 × (1 + 보너스 비율)
    const finalRate = decimalBaseRate.mul(new Decimal(1).add(decimalBonusRate));

    // 총 보상 = 최종 보상률 × 시간
    return finalRate.mul(decimalTime);
  }

  /**
   * 50자리 정밀도로 출석 보너스 계산
   * @param baseRate 기본 보상률
   * @param attendanceBonusRate 출석 보너스 비율 (0.05 = 5%)
   * @returns 50자리 정밀도 결과
   */
  public calculateAttendanceBonus(
    baseRate: number | string,
    attendanceBonusRate: number | string
  ): Decimal {
    const decimalBaseRate = new Decimal(baseRate);
    const decimalBonusRate = new Decimal(attendanceBonusRate);

    // 출석 보너스 = 기본 보상률 × 출석 보너스 비율
    return decimalBaseRate.mul(decimalBonusRate);
  }

  /**
   * 50자리 정밀도로 추천 보너스 계산
   * @param baseRate 기본 보상률
   * @param referralBonusRate 추천 보너스 비율 (0.02 = 2%)
   * @param referralCount 추천인 수
   * @returns 50자리 정밀도 결과
   */
  public calculateReferralBonus(
    baseRate: number | string,
    referralBonusRate: number | string,
    referralCount: number | string
  ): Decimal {
    const decimalBaseRate = new Decimal(baseRate);
    const decimalBonusRate = new Decimal(referralBonusRate);
    const decimalCount = new Decimal(referralCount);

    // 추천 보너스 = 기본 보상률 × 추천 보너스 비율 × 추천인 수
    return decimalBaseRate.mul(decimalBonusRate).mul(decimalCount);
  }

  /**
   * 50자리 정밀도로 가맹점 보너스 계산
   * @param baseRate 기본 보상률
   * @param partnerBonusRate 가맹점 보너스 비율 (1.25 = 125%)
   * @returns 50자리 정밀도 결과
   */
  public calculatePartnerBonus(
    baseRate: number | string,
    partnerBonusRate: number | string
  ): Decimal {
    const decimalBaseRate = new Decimal(baseRate);
    const decimalBonusRate = new Decimal(partnerBonusRate);

    // 가맹점 보너스 = 기본 보상률 × 가맹점 보너스 비율
    return decimalBaseRate.mul(decimalBonusRate);
  }

  /**
   * 50자리 정밀도로 총 보상률 계산
   * @param baseRate 기본 보상률
   * @param attendanceBonusRate 출석 보너스 비율
   * @param referralBonusRate 추천 보너스 비율
   * @param partnerBonusRate 가맹점 보너스 비율
   * @returns 50자리 정밀도 결과
   */
  public calculateTotalRate(
    baseRate: number | string,
    attendanceBonusRate: number | string,
    referralBonusRate: number | string,
    partnerBonusRate: number | string
  ): Decimal {
    const decimalBaseRate = new Decimal(baseRate);
    const decimalAttendanceBonus = new Decimal(attendanceBonusRate);
    const decimalReferralBonus = new Decimal(referralBonusRate);
    const decimalPartnerBonus = new Decimal(partnerBonusRate);

    // 총 보상률 = 기본 보상률 × (1 + 출석 보너스 + 추천 보너스 + 가맹점 보너스)
    const totalBonusRate = new Decimal(1)
      .add(decimalAttendanceBonus)
      .add(decimalReferralBonus)
      .add(decimalPartnerBonus);

    return decimalBaseRate.mul(totalBonusRate);
  }

  /**
   * 50자리 정밀도로 발행률 계산
   * @param currentIssued 현재 발행량
   * @param totalSupply 총 공급량
   * @returns 50자리 정밀도 결과 (백분율)
   */
  public calculateIssuanceRate(
    currentIssued: number | string,
    totalSupply: number | string
  ): Decimal {
    const decimalCurrent = new Decimal(currentIssued);
    const decimalTotal = new Decimal(totalSupply);

    // 발행률 = (현재 발행량 / 총 공급량) × 100
    return decimalCurrent.div(decimalTotal).mul(100);
  }

  /**
   * 50자리 정밀도로 잔여 발행량 계산
   * @param totalSupply 총 공급량
   * @param currentIssued 현재 발행량
   * @returns 50자리 정밀도 결과
   */
  public calculateRemainingSupply(
    totalSupply: number | string,
    currentIssued: number | string
  ): Decimal {
    const decimalTotal = new Decimal(totalSupply);
    const decimalCurrent = new Decimal(currentIssued);

    // 잔여 발행량 = 총 공급량 - 현재 발행량
    return decimalTotal.sub(decimalCurrent);
  }

  /**
   * 50자리 정밀도 결과를 UI 표시용 8자리로 변환
   * @param value 50자리 정밀도 값
   * @returns 8자리 소수점 문자열
   */
  public formatForDisplay(value: Decimal): string {
    return value.toFixed(this.displayPrecision);
  }

  /**
   * 50자리 정밀도 결과를 백분율로 변환 (UI 표시용)
   * @param value 50자리 정밀도 값
   * @returns 8자리 소수점 백분율 문자열
   */
  public formatPercentageForDisplay(value: Decimal): string {
    return value.toFixed(2) + '%';
  }

  /**
   * 50자리 정밀도 결과를 BW 단위로 포맷팅
   * @param value 50자리 정밀도 값
   * @returns BW 단위 문자열
   */
  public formatBWForDisplay(value: Decimal): string {
    return this.formatForDisplay(value) + ' BW';
  }

  /**
   * 50자리 정밀도 결과를 천 단위 구분자로 포맷팅
   * @param value 50자리 정밀도 값
   * @returns 천 단위 구분자 문자열
   */
  public formatWithCommas(value: Decimal): string {
    const formatted = this.formatForDisplay(value);
    const parts = formatted.split('.');
    const integerPart = (parts[0] ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const fractionPart = parts.length > 1 ? parts[1] : undefined;
    return fractionPart !== undefined ? `${integerPart}.${fractionPart}` : integerPart;
  }

  /**
   * 50자리 정밀도 결과를 BW 단위 + 천 단위 구분자로 포맷팅
   * @param value 50자리 정밀도 값
   * @returns BW 단위 + 천 단위 구분자 문자열
   */
  public formatBWWithCommas(value: Decimal): string {
    return this.formatWithCommas(value) + ' BW';
  }

  /**
   * 두 50자리 정밀도 값 비교
   * @param a 첫 번째 값
   * @param b 두 번째 값
   * @returns 비교 결과 (-1: a < b, 0: a = b, 1: a > b)
   */
  public compare(a: Decimal, b: Decimal): number {
    return a.comparedTo(b);
  }

  /**
   * 50자리 정밀도 값이 0인지 확인
   * @param value 확인할 값
   * @returns 0이면 true, 아니면 false
   */
  public isZero(value: Decimal): boolean {
    return value.isZero();
  }

  /**
   * 50자리 정밀도 값이 양수인지 확인
   * @param value 확인할 값
   * @returns 양수면 true, 아니면 false
   */
  public isPositive(value: Decimal): boolean {
    return value.isPositive();
  }

  /**
   * 50자리 정밀도 값이 음수인지 확인
   * @param value 확인할 값
   * @returns 음수면 true, 아니면 false
   */
  public isNegative(value: Decimal): boolean {
    return value.isNegative();
  }

  /**
   * 50자리 정밀도 값의 절댓값 계산
   * @param value 절댓값을 계산할 값
   * @returns 절댓값
   */
  public absolute(value: Decimal): Decimal {
    return value.abs();
  }

  /**
   * 50자리 정밀도 값의 최댓값 계산
   * @param values 비교할 값들
   * @returns 최댓값
   */
  public maximum(...values: Decimal[]): Decimal {
    return Decimal.max(...values);
  }

  /**
   * 50자리 정밀도 값의 최솟값 계산
   * @param values 비교할 값들
   * @returns 최솟값
   */
  public minimum(...values: Decimal[]): Decimal {
    return Decimal.min(...values);
  }

  /**
   * 50자리 정밀도 값의 제곱 계산
   * @param value 제곱할 값
   * @returns 제곱 결과
   */
  public square(value: Decimal): Decimal {
    return value.pow(2);
  }

  /**
   * 50자리 정밀도 값의 제곱근 계산
   * @param value 제곱근을 계산할 값
   * @returns 제곱근 결과
   */
  public squareRoot(value: Decimal): Decimal {
    return value.sqrt();
  }

  /**
   * 50자리 정밀도 값의 거듭제곱 계산
   * @param value 밑
   * @param exponent 지수
   * @returns 거듭제곱 결과
   */
  public power(value: Decimal, exponent: number | string): Decimal {
    return value.pow(exponent);
  }

  /**
   * 50자리 정밀도 값의 자연로그 계산
   * @param value 자연로그를 계산할 값
   * @returns 자연로그 결과
   */
  public naturalLog(value: Decimal): Decimal {
    return value.ln();
  }

  /**
   * 50자리 정밀도 값의 상용로그 계산
   * @param value 상용로그를 계산할 값
   * @returns 상용로그 결과
   */
  public commonLog(value: Decimal): Decimal {
    return value.log();
  }

  /**
   * 50자리 정밀도 값의 지수 계산
   * @param value 지수를 계산할 값
   * @returns 지수 결과
   */
  public exponential(value: Decimal): Decimal {
    return value.exp();
  }

  /**
   * 50자리 정밀도 값의 반올림 계산
   * @param value 반올림할 값
   * @param decimalPlaces 소수점 자릿수
   * @returns 반올림 결과
   */
  public round(value: Decimal, decimalPlaces: number): Decimal {
    return value.toDecimalPlaces(decimalPlaces, Decimal.ROUND_HALF_UP);
  }

  /**
   * 50자리 정밀도 값의 올림 계산
   * @param value 올림할 값
   * @param decimalPlaces 소수점 자릿수
   * @returns 올림 결과
   */
  public ceiling(value: Decimal, decimalPlaces: number): Decimal {
    return value.toDecimalPlaces(decimalPlaces, Decimal.ROUND_CEIL);
  }

  /**
   * 50자리 정밀도 값의 내림 계산
   * @param value 내림할 값
   * @param decimalPlaces 소수점 자릿수
   * @returns 내림 결과
   */
  public floor(value: Decimal, decimalPlaces: number): Decimal {
    return value.toDecimalPlaces(decimalPlaces, Decimal.ROUND_FLOOR);
  }

  /**
   * 50자리 정밀도 값의 버림 계산
   * @param value 버림할 값
   * @param decimalPlaces 소수점 자릿수
   * @returns 버림 결과
   */
  public truncate(value: Decimal, decimalPlaces: number): Decimal {
    return value.toDecimalPlaces(decimalPlaces, Decimal.ROUND_DOWN);
  }

  /**
   * UI 표시용 포맷팅 (formatForUI 별칭)
   * @param value 50자리 정밀도 값
   * @returns 8자리 소수점 문자열
   */
  public formatForUI(value: Decimal | number | undefined): string {
    if (value === undefined || value === null) {
      return '0.00000000';
    }
    const v = value instanceof Decimal ? value : new Decimal(value);
    return this.formatForDisplay(v);
  }

  /**
   * 포맷팅 메서드 (format 별칭)
   * @param value 50자리 정밀도 값
   * @returns 8자리 소수점 문자열
   */
  public format(value: Decimal | number): string {
    const v = value instanceof Decimal ? value : new Decimal(value);
    return this.formatForDisplay(v);
  }
}
