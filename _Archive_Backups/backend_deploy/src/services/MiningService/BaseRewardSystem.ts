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

import { PrecisionCalculator } from '@/utils/PrecisionCalculator/PrecisionCalculator';
import { MINING_CONSTANTS } from '@/constants';

/**
 * 기본 보상률 시스템 클래스 - 완벽한 독립성 보장
 * 50자리 부동소수점 정밀 계산으로 기본 보상률 관리
 */
export class BaseRewardSystem {
  private precisionCalculator: PrecisionCalculator;
  private readonly baseRates: {
    hourly: number;
    daily: number;
    monthly: number;
    yearly: number;
  };

  constructor() {
    // 절대 준수사항: 전역 변수 사용 금지
    this.precisionCalculator = new PrecisionCalculator();

    // 기본 보상률 설정 (고정값)
    this.baseRates = {
      hourly: MINING_CONSTANTS.HOURLY_BASE_RATE,    // 0.25 BW/시간
      daily: MINING_CONSTANTS.DAILY_MAX_REWARD,     // 6.0 BW/일
      monthly: MINING_CONSTANTS.MONTHLY_REWARD,      // 180 BW/월
      yearly: MINING_CONSTANTS.YEARLY_REWARD         // 2,190 BW/년
    };
  }

  /**
   * 시간당 기본 보상률 조회
   * @returns 시간당 기본 보상률 (BW/시간)
   */
  public getHourlyBaseRate(): number {
    return this.baseRates.hourly;
  }

  /**
   * 일일 기본 최대 보상률 조회
   * @returns 일일 기본 최대 보상률 (BW/일)
   */
  public getDailyMaxReward(): number {
    return this.baseRates.daily;
  }

  /**
   * 월간 기본 보상률 조회
   * @returns 월간 기본 보상률 (BW/월)
   */
  public getMonthlyReward(): number {
    return this.baseRates.monthly;
  }

  /**
   * 연간 기본 보상률 조회
   * @returns 연간 기본 보상률 (BW/년)
   */
  public getYearlyReward(): number {
    return this.baseRates.yearly;
  }

  /**
   * 시간당 기본 보상률을 50자리 정밀도로 조회
   * @returns 50자리 정밀도 시간당 기본 보상률
   */
  public getHourlyBaseRatePrecise(): import('decimal.js').Decimal {
    return this.precisionCalculator.multiply(this.baseRates.hourly, 1);
  }

  /**
   * 일일 기본 최대 보상률을 50자리 정밀도로 조회
   * @returns 50자리 정밀도 일일 기본 최대 보상률
   */
  public getDailyMaxRewardPrecise(): import('decimal.js').Decimal {
    return this.precisionCalculator.multiply(this.baseRates.daily, 1);
  }

  /**
   * 월간 기본 보상률을 50자리 정밀도로 조회
   * @returns 50자리 정밀도 월간 기본 보상률
   */
  public getMonthlyRewardPrecise(): import('decimal.js').Decimal {
    return this.precisionCalculator.multiply(this.baseRates.monthly, 1);
  }

  /**
   * 연간 기본 보상률을 50자리 정밀도로 조회
   * @returns 50자리 정밀도 연간 기본 보상률
   */
  public getYearlyRewardPrecise(): import('decimal.js').Decimal {
    return this.precisionCalculator.multiply(this.baseRates.yearly, 1);
  }

  /**
   * 시간당 기본 보상률을 UI 표시용으로 포맷팅
   * @returns UI 표시용 시간당 기본 보상률 문자열
   */
  public getHourlyBaseRateFormatted(): string {
    const preciseRate = this.getHourlyBaseRatePrecise();
    return this.precisionCalculator.formatBWForDisplay(preciseRate);
  }

  /**
   * 일일 기본 최대 보상률을 UI 표시용으로 포맷팅
   * @returns UI 표시용 일일 기본 최대 보상률 문자열
   */
  public getDailyMaxRewardFormatted(): string {
    const preciseRate = this.getDailyMaxRewardPrecise();
    return this.precisionCalculator.formatBWForDisplay(preciseRate);
  }

  /**
   * 월간 기본 보상률을 UI 표시용으로 포맷팅
   * @returns UI 표시용 월간 기본 보상률 문자열
   */
  public getMonthlyRewardFormatted(): string {
    const preciseRate = this.getMonthlyRewardPrecise();
    return this.precisionCalculator.formatBWForDisplay(preciseRate);
  }

  /**
   * 연간 기본 보상률을 UI 표시용으로 포맷팅
   * @returns UI 표시용 연간 기본 보상률 문자열
   */
  public getYearlyRewardFormatted(): string {
    const preciseRate = this.getYearlyRewardPrecise();
    return this.precisionCalculator.formatBWForDisplay(preciseRate);
  }

  /**
   * 시간당 기본 보상률을 천 단위 구분자로 포맷팅
   * @returns 천 단위 구분자 시간당 기본 보상률 문자열
   */
  public getHourlyBaseRateWithCommas(): string {
    const preciseRate = this.getHourlyBaseRatePrecise();
    return this.precisionCalculator.formatBWWithCommas(preciseRate);
  }

  /**
   * 일일 기본 최대 보상률을 천 단위 구분자로 포맷팅
   * @returns 천 단위 구분자 일일 기본 최대 보상률 문자열
   */
  public getDailyMaxRewardWithCommas(): string {
    const preciseRate = this.getDailyMaxRewardPrecise();
    return this.precisionCalculator.formatBWWithCommas(preciseRate);
  }

  /**
   * 월간 기본 보상률을 천 단위 구분자로 포맷팅
   * @returns 천 단위 구분자 월간 기본 보상률 문자열
   */
  public getMonthlyRewardWithCommas(): string {
    const preciseRate = this.getMonthlyRewardPrecise();
    return this.precisionCalculator.formatBWWithCommas(preciseRate);
  }

  /**
   * 연간 기본 보상률을 천 단위 구분자로 포맷팅
   * @returns 천 단위 구분자 연간 기본 보상률 문자열
   */
  public getYearlyRewardWithCommas(): string {
    const preciseRate = this.getYearlyRewardPrecise();
    return this.precisionCalculator.formatBWWithCommas(preciseRate);
  }

  /**
   * 시간당 기본 보상률 계산
   * @param hours 시간 (시간 단위)
   * @returns 50자리 정밀도 총 보상량
   */
  public calculateHourlyReward(hours: number): import('decimal.js').Decimal {
    return this.precisionCalculator.multiply(this.baseRates.hourly, hours);
  }

  /**
   * 일일 기본 보상률 계산
   * @param days 일수 (일 단위)
   * @returns 50자리 정밀도 총 보상량
   */
  public calculateDailyReward(days: number): import('decimal.js').Decimal {
    return this.precisionCalculator.multiply(this.baseRates.daily, days);
  }

  /**
   * 월간 기본 보상률 계산
   * @param months 개월수 (월 단위)
   * @returns 50자리 정밀도 총 보상량
   */
  public calculateMonthlyReward(months: number): import('decimal.js').Decimal {
    return this.precisionCalculator.multiply(this.baseRates.monthly, months);
  }

  /**
   * 연간 기본 보상률 계산
   * @param years 년수 (년 단위)
   * @returns 50자리 정밀도 총 보상량
   */
  public calculateYearlyReward(years: number): import('decimal.js').Decimal {
    return this.precisionCalculator.multiply(this.baseRates.yearly, years);
  }

  /**
   * 시간당 기본 보상률 계산 (UI 표시용)
   * @param hours 시간 (시간 단위)
   * @returns UI 표시용 총 보상량 문자열
   */
  public calculateHourlyRewardFormatted(hours: number): string {
    const reward = this.calculateHourlyReward(hours);
    return this.precisionCalculator.formatBWForDisplay(reward);
  }

  /**
   * 일일 기본 보상률 계산 (UI 표시용)
   * @param days 일수 (일 단위)
   * @returns UI 표시용 총 보상량 문자열
   */
  public calculateDailyRewardFormatted(days: number): string {
    const reward = this.calculateDailyReward(days);
    return this.precisionCalculator.formatBWForDisplay(reward);
  }

  /**
   * 월간 기본 보상률 계산 (UI 표시용)
   * @param months 개월수 (월 단위)
   * @returns UI 표시용 총 보상량 문자열
   */
  public calculateMonthlyRewardFormatted(months: number): string {
    const reward = this.calculateMonthlyReward(months);
    return this.precisionCalculator.formatBWForDisplay(reward);
  }

  /**
   * 연간 기본 보상률 계산 (UI 표시용)
   * @param years 년수 (년 단위)
   * @returns UI 표시용 총 보상량 문자열
   */
  public calculateYearlyRewardFormatted(years: number): string {
    const reward = this.calculateYearlyReward(years);
    return this.precisionCalculator.formatBWForDisplay(reward);
  }

  /**
   * 시간당 기본 보상률 계산 (천 단위 구분자)
   * @param hours 시간 (시간 단위)
   * @returns 천 단위 구분자 총 보상량 문자열
   */
  public calculateHourlyRewardWithCommas(hours: number): string {
    const reward = this.calculateHourlyReward(hours);
    return this.precisionCalculator.formatBWWithCommas(reward);
  }

  /**
   * 일일 기본 보상률 계산 (천 단위 구분자)
   * @param days 일수 (일 단위)
   * @returns 천 단위 구분자 총 보상량 문자열
   */
  public calculateDailyRewardWithCommas(days: number): string {
    const reward = this.calculateDailyReward(days);
    return this.precisionCalculator.formatBWWithCommas(reward);
  }

  /**
   * 월간 기본 보상률 계산 (천 단위 구분자)
   * @param months 개월수 (월 단위)
   * @returns 천 단위 구분자 총 보상량 문자열
   */
  public calculateMonthlyRewardWithCommas(months: number): string {
    const reward = this.calculateMonthlyReward(months);
    return this.precisionCalculator.formatBWWithCommas(reward);
  }

  /**
   * 연간 기본 보상률 계산 (천 단위 구분자)
   * @param years 년수 (년 단위)
   * @returns 천 단위 구분자 총 보상량 문자열
   */
  public calculateYearlyRewardWithCommas(years: number): string {
    const reward = this.calculateYearlyReward(years);
    return this.precisionCalculator.formatBWWithCommas(reward);
  }

  /**
   * 기본 보상률 검증
   * @param rate 검증할 보상률
   * @returns 검증 결과
   */
  public validateBaseRate(rate: number): {
    isValid: boolean;
    message?: string;
  } {
    if (rate < 0) {
      return {
        isValid: false,
        message: '보상률은 0 이상이어야 합니다.'
      };
    }

    if (rate > this.baseRates.hourly * 10) {
      return {
        isValid: false,
        message: '보상률이 최대 허용값을 초과했습니다.'
      };
    }

    return {
      isValid: true
    };
  }

  /**
   * 기본 보상률 비교
   * @param rate1 첫 번째 보상률
   * @param rate2 두 번째 보상률
   * @returns 비교 결과 (-1: rate1 < rate2, 0: rate1 = rate2, 1: rate1 > rate2)
   */
  public compareBaseRates(rate1: number, rate2: number): number {
    const decimal1 = this.precisionCalculator.multiply(rate1, 1);
    const decimal2 = this.precisionCalculator.multiply(rate2, 1);
    return this.precisionCalculator.compare(decimal1, decimal2);
  }

  /**
   * 기본 보상률 통계 조회
   * @returns 기본 보상률 통계
   */
  public getBaseRateStats(): {
    hourly: number;
    daily: number;
    monthly: number;
    yearly: number;
    hourlyFormatted: string;
    dailyFormatted: string;
    monthlyFormatted: string;
    yearlyFormatted: string;
  } {
    return {
      hourly: this.baseRates.hourly,
      daily: this.baseRates.daily,
      monthly: this.baseRates.monthly,
      yearly: this.baseRates.yearly,
      hourlyFormatted: this.getHourlyBaseRateFormatted(),
      dailyFormatted: this.getDailyMaxRewardFormatted(),
      monthlyFormatted: this.getMonthlyRewardFormatted(),
      yearlyFormatted: this.getYearlyRewardFormatted()
    };
  }

  /**
   * 기본 보상률 계산 예시
   * @param hours 시간 (시간 단위)
   * @returns 계산 예시 결과
   */
  public getCalculationExample(hours: number): {
    hours: number;
    baseRate: number;
    totalReward: number;
    totalRewardFormatted: string;
    totalRewardWithCommas: string;
  } {
    const baseRate = this.baseRates.hourly;
    const totalReward = this.calculateHourlyReward(hours);

    return {
      hours,
      baseRate,
      totalReward: totalReward.toNumber(),
      totalRewardFormatted: this.precisionCalculator.formatBWForDisplay(totalReward),
      totalRewardWithCommas: this.precisionCalculator.formatBWWithCommas(totalReward)
    };
  }
}
