import Decimal from 'decimal.js';
// 50자리 정밀도 전역 설정
Decimal.set({ precision: 50 });
/**
 * 수수료를 6:4 비율로 분할하는 함수 (생태계 기금 60% : 재단 기금 40%)
 * @param feeAmount 분할할 수수료 양 (문자열 또는 숫자)
 * @returns 분할된 ecosystemFund와 foundationFund 문자열 객체
 */
export function splitFee64(feeAmount: string | number | Decimal): { ecosystemFund: string; foundationFund: string } {
    const total = new Decimal(feeAmount);
    const ecosystemShare = total.mul(0.6);
    const foundationShare = total.minus(ecosystemShare); // 정밀 잔여 분배 처리
    return {
        ecosystemFund: ecosystemShare.toString(),
        foundationFund: foundationShare.toString()
    };
}
/**
 * 두 값을 50자리 정밀도로 더하는 함수
 */
export function preciseAdd(a: string | number, b: string | number): string {
    return new Decimal(a).plus(new Decimal(b)).toString();
}
