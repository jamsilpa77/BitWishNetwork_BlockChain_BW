import Decimal from 'decimal.js';
import { getHalvingConfig, saveHalvingConfig, IHalvingPolicyConfig, DEFAULT_HALVING_CONFIG } from '../models/SystemConfig';
import MiningState from '../models/MiningState';

/**
 * ════════════════════════════════════════════════════════════════════════════════
 * BitWish Network - Halving Policy Engine (선형 반감기 정책 코어 엔진)
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * [백서 v1.0 §1.4 & 관리자 거버넌스 제어 원칙]
 * 1. 무단 발동 원천 차단 (안전 가드):
 *    - isEnabled === false (대기/OFF 모드)인 경우, 날짜와 무관하게 100% 기본 채굴률(0.25 BW/h) 유지.
 *    - 관리자가 관리자 페이지에서 직접 ON으로 활성화하고 시작일에 도달해야만 반감기가 발동.
 * 2. 관리자 완전 통제:
 *    - 시작 일시(startDate) 및 월별 채굴 감소율(monthlyReductionRate)을 관리자가 실시간 변경 가능.
 * 3. 50자리 초정밀 연산:
 *    - Decimal.js 기반으로 오차 없이 연산.
 */

export interface IHalvingStatus {
    config: IHalvingPolicyConfig;
    currentBaseRate: string;         // 현재 적용 중인 기본 채굴률 (소수점 8자리)
    isActive: boolean;               // 실제 반감기가 발동 중인지 여부 (isEnabled && now >= startDate)
    countdown: {
        isPassed: boolean;           // 시작일 도래 여부
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
        dDayText: string;            // 예: "D-403" 또는 "가동 진행 중"
    };
    currentElapsedMonths: number;    // 시작일로부터 경과한 개월 수 (시작 전이면 0)
    currentReductionPercent: number; // 현재 적용된 총 감소율 (%)
    schedule: IHalvingStep[];         // 24개월 시뮬레이션 스케줄표
}

export interface IHalvingStep {
    step: number;                    // 경과 개월 (m = 0, 1, 2 ...)
    year: number;                    // 해당 연도 (예: 2028)
    month: number;                   // 해당 월 (1 ~ 12)
    periodText: string;              // 예: "2028년 01월"
    reductionPercent: number;        // 누적 감소율 (%)
    baseRate: string;                // 적용 기본 채굴률 (BW/h)
    dailyMaxRate: string;            // 일일 기본 최대 채굴량 (24h)
    statusNote: string;              // 정책 설명 메모
}

export class HalvingPolicyEngine {
    // 5초 메모리 캐시 (채굴 동기화 중 DB 반복 쿼리 부하 방지)
    private static cachedConfig: IHalvingPolicyConfig | null = null;
    private static cacheTimestamp: number = 0;
    private static readonly CACHE_TTL_MS = 5000;

    /**
     * 캐시 무효화 (관리자가 정책 변경 시 즉시 호출)
     */
    public static invalidateCache(): void {
        this.cachedConfig = null;
        this.cacheTimestamp = 0;
    }

    /**
     * 현재 캐싱된 또는 DB에서 조회한 반감기 정책 반환
     */
    public static async getConfig(): Promise<IHalvingPolicyConfig> {
        const now = Date.now();
        if (this.cachedConfig && (now - this.cacheTimestamp < this.CACHE_TTL_MS)) {
            return this.cachedConfig;
        }

        const config = await getHalvingConfig();
        this.cachedConfig = config;
        this.cacheTimestamp = now;
        return config;
    }

    /**
     * ⚡ [핵심] 현재 시각 기준 적용 기본 채굴률 산출 (50자리 Decimal)
     * - isEnabled === false: 무조건 config.baseRate (0.25) 반환
     * - now < startDate: 아직 시작일 전이므로 config.baseRate (0.25) 반환
     * - now >= startDate: 백서 공식 R(m) = max(0, R0 * (1 - rate * m)) 적용
     */
    public static async getCurrentBaseRate(): Promise<Decimal> {
        const config = await this.getConfig();
        const base = new Decimal(config.baseRate || 0.25);

        // 🛡️ 1차 가드: 관리자가 반감기를 켜지 않은 경우 (기본 OFF 모드)
        if (!config.isEnabled) {
            return base;
        }

        const now = new Date();
        const start = new Date(config.startDate);

        // 🛡️ 2차 가드: 아직 시작일시 이전인 경우
        if (now.getTime() < start.getTime()) {
            return base;
        }

        // 🚀 반감기 발동 구간: 경과 개월(m) 계산 (KST 기준)
        const m = this.calculateElapsedMonths(start, now);
        const ratePerMonth = new Decimal(config.monthlyReductionRate || 5.0).div(100);

        // 공식: R(m) = max(0, R0 * (1 - ratePerMonth * m))
        const factor = new Decimal(1).minus(ratePerMonth.mul(m));
        if (factor.lessThanOrEqualTo(0)) {
            return new Decimal(0);
        }

        return base.mul(factor);
    }

    /**
     * 시작일과 대상 일시 사이의 경과 월 수(m) 계산 (KST 기준)
     */
    public static calculateElapsedMonths(startDate: Date, targetDate: Date): number {
        const kstOffsetMs = 9 * 60 * 60 * 1000;
        const startKST = new Date(startDate.getTime() + kstOffsetMs);
        const targetKST = new Date(targetDate.getTime() + kstOffsetMs);

        const yearDiff = targetKST.getUTCFullYear() - startKST.getUTCFullYear();
        const monthDiff = targetKST.getUTCMonth() - startKST.getUTCMonth();

        return Math.max(0, yearDiff * 12 + monthDiff);
    }

    /**
     * 반감기 종합 현황 및 카운트다운/스케줄 조회 (관리자 UI용)
     */
    public static async getHalvingStatus(): Promise<IHalvingStatus> {
        const config = await this.getConfig();
        const currentRateDecimal = await this.getCurrentBaseRate();
        const now = new Date();
        const start = new Date(config.startDate);

        // D-Day 카운트다운 연산
        const diffMs = start.getTime() - now.getTime();
        const isPassed = diffMs <= 0;

        let days = 0, hours = 0, minutes = 0, seconds = 0;
        let dDayText = 'D-Day 도달';

        if (!isPassed) {
            const totalSeconds = Math.floor(diffMs / 1000);
            days = Math.floor(totalSeconds / 86400);
            hours = Math.floor((totalSeconds % 86400) / 3600);
            minutes = Math.floor((totalSeconds % 3600) / 60);
            seconds = totalSeconds % 60;
            dDayText = `D-${days}일 ${hours}시간`;
        } else {
            dDayText = config.isEnabled ? '🚀 반감기 가동 중' : '대기 모드 (OFF)';
        }

        const elapsedMonths = isPassed ? this.calculateElapsedMonths(start, now) : 0;
        const reductionPercent = Math.min(100, elapsedMonths * (config.monthlyReductionRate || 5.0));

        // 24개월 선형 반감기 스케줄 시뮬레이션 표 생성
        const schedule = this.generateSchedule(
            config.startDate,
            config.monthlyReductionRate || 5.0,
            config.baseRate || 0.25,
            24
        );

        return {
            config,
            currentBaseRate: currentRateDecimal.toFixed(8),
            isActive: config.isEnabled && isPassed,
            countdown: {
                isPassed,
                days,
                hours,
                minutes,
                seconds,
                dDayText
            },
            currentElapsedMonths: elapsedMonths,
            currentReductionPercent: reductionPercent,
            schedule
        };
    }

    /**
     * 24개월(또는 n개월) 반감기 시뮬레이션 스케줄표 생성
     */
    public static generateSchedule(
        startDateStr: string,
        monthlyReductionRate: number,
        baseRate: number,
        totalMonths: number = 24
    ): IHalvingStep[] {
        const steps: IHalvingStep[] = [];
        const start = new Date(startDateStr);
        const kstOffsetMs = 9 * 60 * 60 * 1000;
        const startKST = new Date(start.getTime() + kstOffsetMs);

        const startYear = startKST.getUTCFullYear();
        const startMonth = startKST.getUTCMonth(); // 0 ~ 11
        const r0 = new Decimal(baseRate || 0.25);
        const ratePerMonth = new Decimal(monthlyReductionRate).div(100);

        for (let m = 0; m < totalMonths; m++) {
            // 해당 연월 계산
            const curDate = new Date(Date.UTC(startYear, startMonth + m, 1));
            const year = curDate.getUTCFullYear();
            const month = curDate.getUTCMonth() + 1; // 1 ~ 12
            const periodText = `${year}년 ${String(month).padStart(2, '0')}월`;

            // 공식: R(m) = max(0, R0 * (1 - ratePerMonth * m))
            const factor = new Decimal(1).minus(ratePerMonth.mul(m));
            const calculatedRate = factor.greaterThan(0) ? r0.mul(factor) : new Decimal(0);
            const dailyMax = calculatedRate.mul(24);
            const reduction = Math.min(100, m * monthlyReductionRate);

            let statusNote = '';
            if (m === 0) {
                statusNote = '🚀 반감기 공식 개시 (기본 보상률 100%)';
            } else if (calculatedRate.equals(0)) {
                statusNote = '🛑 채굴 한도 도달 (보너스 전용 전환)';
            } else {
                statusNote = `📉 ${m}차 감소 적용 (-${reduction.toFixed(1)}%)`;
            }

            steps.push({
                step: m,
                year,
                month,
                periodText,
                reductionPercent: reduction,
                baseRate: calculatedRate.toFixed(6),
                dailyMaxRate: dailyMax.toFixed(6),
                statusNote
            });
        }

        return steps;
    }

    /**
     * 👑 [관리자 거버넌스] 전체 활성 마이너 기본 채굴률 즉시 일괄 동기화
     */
    public static async syncGlobalMiners(): Promise<{ updatedCount: number; currentBaseRate: string }> {
        const newBaseRateDecimal = await this.getCurrentBaseRate();
        const activeMiners = await MiningState.find({ isMining: true });
        let updatedCount = 0;

        for (const state of activeMiners) {
            const baseRate = newBaseRateDecimal;
            const attendanceRate = state.isAttendanceActive ? new Decimal(0.05) : new Decimal(0);
            const partnerRate = state.partnerStatus === 'REGISTERED' ? new Decimal(1.25) : new Decimal(0);
            const referralRate = new Decimal(state.referralBonusRate || '0');
            const extensionRate = new Decimal(state.extensionBonusRate || '0');

            state.currentBaseRate = baseRate.toFixed(8);
            state.currentTotalRate = baseRate
                .mul(new Decimal(1).plus(attendanceRate))
                .mul(new Decimal(1).plus(referralRate))
                .mul(new Decimal(1).plus(partnerRate))
                .mul(new Decimal(1).plus(extensionRate))
                .toFixed(8);

            await state.save();
            updatedCount++;
        }

        console.log(`⚡ [HalvingPolicyEngine] 전체 마이너 ${updatedCount}명 새 기본 채굴률(${newBaseRateDecimal.toFixed(8)} BW/h) 동기화 완료`);
        return {
            updatedCount,
            currentBaseRate: newBaseRateDecimal.toFixed(8)
        };
    }

    /**
     * 🖨️ [공정 4-3 세부 작업 2] KST 한국 표준시 시·분·초 기준 최고급 터미널 정밀 브리핑 박스 출력
     */
    public static printGovernanceBriefing(status: IHalvingStatus): void {
        try {
            const config = status.config;
            const now = new Date();
            const start = new Date(config.startDate);

            // KST 한국 표준시 포맷터 헬퍼 (YYYY년 MM월 DD일 AM/PM HH:MM:SS)
            const formatKST = (d: Date): string => {
                const kstMs = d.getTime() + (9 * 60 * 60 * 1000);
                const kst = new Date(kstMs);
                const year = kst.getUTCFullYear();
                const month = String(kst.getUTCMonth() + 1).padStart(2, '0');
                const day = String(kst.getUTCDate()).padStart(2, '0');
                const hours24 = kst.getUTCHours();
                const ampm = hours24 < 12 ? 'AM' : 'PM';
                const hours12 = String(hours24 % 12 === 0 ? 12 : hours24 % 12).padStart(2, '0');
                const minutes = String(kst.getUTCMinutes()).padStart(2, '0');
                const seconds = String(kst.getUTCSeconds()).padStart(2, '0');
                return `${year}년 ${month}월 ${day}일 ${ampm} ${hours12}:${minutes}:${seconds} (KST 한국 표준시)`;
            };

            const startDateKSTStr = formatKST(start);

            // 1. [Case C] 관리자가 OFF (대기 모드)로 설정한 경우
            if (!config.isEnabled) {
                console.log('\n' +
                    '═══════════════════════════════════════════════════════════════════════════════\n' +
                    ' [BitWish Governance] 🛡️ 선형 반감기 대기 모드 (안전 가드 작동 중)\n' +
                    '───────────────────────────────────────────────────────────────────────────────\n' +
                    ' • 엔진 가동 상태   : 🟠 OFF (관리자 안전 가드 활성화 - 반감기 미발동)\n' +
                    ` • 설정된 시작 일시 : ${startDateKSTStr}\n` +
                    ' • 현재 네트워크 채굴: 100% 정상 공급 유지 (0.25000000 BW/h)\n' +
                    ' • 정책 안내        : 관리자가 ON(가동 승인)을 누르기 전까지 채굴량이 절대 줄지 않습니다.\n' +
                    '═══════════════════════════════════════════════════════════════════════════════\n'
                );
                return;
            }

            const diffMs = start.getTime() - now.getTime();

            // 2. [Case A] 시작일이 미래인 경우 (예: 2029년 1월 1일 설정 시)
            if (diffMs > 0) {
                const totalSeconds = Math.floor(diffMs / 1000);
                const days = Math.floor(totalSeconds / 86400);
                const hours = Math.floor((totalSeconds % 86400) / 3600);

                // 시작월 기준 1개월 뒤 (1차 반감기 개시 시점) 계산
                const startKST = new Date(start.getTime() + (9 * 60 * 60 * 1000));
                const nextMonthDateUTC = new Date(Date.UTC(startKST.getUTCFullYear(), startKST.getUTCMonth() + 1, 1, 0, 0, 0));
                // KST 00:00:00은 UTC 전날 15:00:00이므로 KST 변환 고려
                const nextMonthDate = new Date(Date.UTC(startKST.getUTCFullYear(), startKST.getUTCMonth() + 1, 1) - (9 * 60 * 60 * 1000));
                const nextDateKSTStr = formatKST(nextMonthDate);

                const rate1st = (Number(config.baseRate || 0.25) * (1 - (config.monthlyReductionRate || 5.0) / 100)).toFixed(8);

                console.log('\n' +
                    '═══════════════════════════════════════════════════════════════════════════════\n' +
                    ' [BitWish Governance] ⏰ 선형 반감기 정책 설정 및 대기 브리핑\n' +
                    '───────────────────────────────────────────────────────────────────────────────\n' +
                    ' • 엔진 가동 상태   : 🟢 ON (관리자 공식 가동 승인 완료)\n' +
                    ` • 반감기 시작 일시 : ${startDateKSTStr}\n` +
                    ` • 시작 잔여 카운트 : 앞으로 D-${days}일 ${hours}시간 뒤 공식 개시\n` +
                    ` • 현재 적용 감소율 : 0.0% (현재 기본 채굴률: 0.25000000 BW/h 정상 유지)\n` +
                    ` • 1차 반감기 예정  : ${nextDateKSTStr}부터 1차 감산(-${(config.monthlyReductionRate || 5.0).toFixed(1)}%) 발동 (${rate1st} BW/h)\n` +
                    '═══════════════════════════════════════════════════════════════════════════════\n'
                );
                return;
            }

            // 3. [Case B] 시작일이 이미 지난 과거인 경우 (실시간 감산 발동 구간, 예: 2026-10-01)
            const passedMs = now.getTime() - start.getTime();
            const passedDays = Math.floor(passedMs / (1000 * 60 * 60 * 24));
            const elapsedMonths = status.currentElapsedMonths;
            const reductionPercent = status.currentReductionPercent;
            const currentBaseRate = status.currentBaseRate;
            const dailyMax = (Number(currentBaseRate) * 24).toFixed(6);

            // 다음 차수 반감기 일시 계산 (현재 월의 다음 달 1일 AM 00:00:00 KST)
            const nowKST = new Date(now.getTime() + (9 * 60 * 60 * 1000));
            const nextStageDate = new Date(Date.UTC(nowKST.getUTCFullYear(), nowKST.getUTCMonth() + 1, 1) - (9 * 60 * 60 * 1000));
            const nextStageKSTStr = formatKST(nextStageDate);

            const nextStep = elapsedMonths + 1;
            const nextReduction = Math.min(100, nextStep * (config.monthlyReductionRate || 5.0));
            const nextRate = (Number(config.baseRate || 0.25) * Math.max(0, 1 - nextReduction / 100)).toFixed(8);

            console.log('\n' +
                '═══════════════════════════════════════════════════════════════════════════════\n' +
                ' [BitWish Governance] 🚀 선형 반감기 실시간 발동 종합 브리핑\n' +
                '───────────────────────────────────────────────────────────────────────────────\n' +
                ' • 엔진 가동 상태   : 🚀 ON (선형 반감기 실시간 공식 발동 중)\n' +
                ` • 반감기 시작 일시 : ${startDateKSTStr}\n` +
                ` • 시작일 경과 일수 : 시작일 기준 D+${passedDays}일 경과 (현재 ${elapsedMonths > 0 ? elapsedMonths + '차 반감기 구간' : '시작월 정상 공급 구간'})\n` +
                ` • 현재 적용 감소율 : -${reductionPercent.toFixed(1)}% 선형 감산 적용 중\n` +
                ` • 현재 기본 채굴률 : ${currentBaseRate} BW/h (일일 최대 ${dailyMax} BW / 24h)\n` +
                ` • 다음 ${nextStep}차 반감기  : ${nextStageKSTStr}부터 누적 -${nextReduction.toFixed(1)}% 감산 발동 (${nextRate} BW/h)\n` +
                '═══════════════════════════════════════════════════════════════════════════════\n'
            );
        } catch (err) {
            console.error('[Governance Briefing Error]:', err);
        }
    }
}
