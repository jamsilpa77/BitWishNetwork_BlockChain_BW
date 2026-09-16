// Line 1: BitWishNetwork Mining System
// Line 2: Precision Math Utility (decimalUtil.ts)
// Line 3: 
// Line 4: import Decimal from 'decimal.js';
// Line 5: 
// Line 6: // 50자리 정밀도 전역 설정
// Line 7: Decimal.set({ precision: 50 });
// Line 8: 
// Line 9: /**
// Line 10:  * 수수료를 6:4 비율로 분할하는 함수 (생태계 기금 60% : 재단 기금 40%)
// Line 11:  * @param feeAmount 분할할 수수료 양 (문자열 또는 숫자)
// Line 12:  * @returns 분할된 ecosystemFund와 foundationFund 문자열 객체
// Line 13:  */
// Line 14: export function splitFee64(feeAmount: string | number | Decimal): { ecosystemFund: string; foundationFund: string } {
// Line 15:     const total = new Decimal(feeAmount);
// Line 16:     const ecosystemShare = total.mul(0.6);
// Line 17:     const foundationShare = total.minus(ecosystemShare); // 정밀 잔여 분배 처리
// Line 18: 
// Line 19:     return {
// Line 20:         ecosystemFund: ecosystemShare.toString(),
// Line 21:         foundationFund: foundationShare.toString()
// Line 22:     };
// Line 23: }
// Line 24: 
// Line 25: /**
// Line 26:  * 두 값을 50자리 정밀도로 더하는 함수
// Line 27:  */
// Line 28: export function preciseAdd(a: string | number, b: string | number): string {
// Line 29:     return new Decimal(a).plus(new Decimal(b)).toString();
// Line 30: }
