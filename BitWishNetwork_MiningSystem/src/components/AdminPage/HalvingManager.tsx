import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/ApiService';

interface HalvingConfig {
    isEnabled: boolean;
    startDate: string;
    monthlyReductionRate: number;
    baseRate: number;
    description?: string;
    updatedAt?: string;
    updatedBy?: string;
}

interface HalvingStep {
    step: number;
    year: number;
    month: number;
    periodText: string;
    reductionPercent: number;
    baseRate: string;
    dailyMaxRate: string;
    statusNote: string;
}

interface HalvingStatusResponse {
    config: HalvingConfig;
    currentBaseRate: string;
    isActive: boolean;
    countdown: {
        isPassed: boolean;
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
        dDayText: string;
    };
    currentElapsedMonths: number;
    currentReductionPercent: number;
    schedule: HalvingStep[];
}

export const HalvingManager: React.FC = () => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isSyncing, setIsSyncing] = useState<boolean>(false);
    const [statusData, setStatusData] = useState<HalvingStatusResponse | null>(null);
    const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // 폼 입력 상태
    const [isEnabled, setIsEnabled] = useState<boolean>(false);
    const [startDate, setStartDate] = useState<string>('2028-01-01T00:00');
    const [monthlyReductionRate, setMonthlyReductionRate] = useState<number>(5.0);
    const [baseRate, setBaseRate] = useState<number>(0.25);
    const [description, setDescription] = useState<string>('');

    // 실시간 로컬 시뮬레이션 스케줄
    const [liveSchedule, setLiveSchedule] = useState<HalvingStep[]>([]);

    // [공정 4-1] 1초 단위 실시간 브라우저 D-Day 카운트다운 엔진 상태
    const [liveCountdownText, setLiveCountdownText] = useState<string>('');

    useEffect(() => {
        fetchHalvingStatus();
    }, []);

    // 폼 입력값이 바뀔 때마다 24개월 스케줄을 실시간으로 즉시 재계산
    useEffect(() => {
        calculateLiveSchedule();
    }, [startDate, monthlyReductionRate, baseRate]);

    // [공정 4-3 세부 작업 1] 스위치(ON/OFF) 상태 기반 카운트다운 및 D+XX일 경과 실시간 Live Tick 연산
    useEffect(() => {
        // 1. 🛡️ OFF (대기 모드)일 때: 타이머를 가동하지 않고 대기 안내로 완전 정지
        if (!isEnabled) {
            setLiveCountdownText('⏸️ 대기 모드 (가동 승인 대기 중)');
            return;
        }

        // 2. 🚀 ON (가동 승인)일 때: 시작일 기준 1초 단위 실시간 카운트다운 및 경과일 연산
        const calculateLiveDDay = () => {
            try {
                if (!startDate) return;
                // KST 기준 타임스탬프 계산 (+09:00 보정)
                const formattedDateStr = startDate.length === 16 ? `${startDate}:00+09:00` : startDate;
                const targetTime = new Date(formattedDateStr).getTime();
                const now = Date.now();
                const diffMs = targetTime - now;

                // [공정 4-3 핵심] 시작일이 이미 지난 경우 (과거 날짜 ➡️ 실시간 감산 가동 중)
                if (diffMs <= 0) {
                    const passedMs = now - targetTime;
                    const passedDays = Math.floor(passedMs / (1000 * 60 * 60 * 24));

                    // KST 기준 경과 개월(m) 정밀 산출
                    const targetKST = new Date(targetTime + 9 * 60 * 60 * 1000);
                    const nowKST = new Date(now + 9 * 60 * 60 * 1000);
                    const yearDiff = nowKST.getUTCFullYear() - targetKST.getUTCFullYear();
                    const monthDiff = nowKST.getUTCMonth() - targetKST.getUTCMonth();
                    const elapsedMonths = Math.max(0, yearDiff * 12 + monthDiff);

                    if (elapsedMonths === 0) {
                        setLiveCountdownText(`🚀 반감기 가동 중 (D+${passedDays}일 경과 / 시작월 정상 공급)`);
                    } else {
                        const reduction = Math.min(100, elapsedMonths * (monthlyReductionRate || 5.0));
                        setLiveCountdownText(`🚀 반감기 가동 중 (D+${passedDays}일 경과 / ${elapsedMonths}차 -${reduction.toFixed(1)}% 감산 중)`);
                    }
                    return;
                }

                // 시작일 이전인 경우 (미래 날짜 ➡️ 잔여 D-Day 카운트다운)
                const totalSeconds = Math.floor(diffMs / 1000);
                const days = Math.floor(totalSeconds / 86400);
                const hours = Math.floor((totalSeconds % 86400) / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;

                setLiveCountdownText(
                    `D-${days}일 ${String(hours).padStart(2, '0')}시간 ${String(minutes).padStart(2, '0')}분 ${String(seconds).padStart(2, '0')}초`
                );
            } catch (err) {
                console.error('Live D-Day calculation error:', err);
            }
        };

        calculateLiveDDay();
        const timer = setInterval(calculateLiveDDay, 1000);
        return () => clearInterval(timer);
    }, [startDate, isEnabled, monthlyReductionRate]);

    // [공정 4-3 세부 작업 1] 관리자 화면 입력값 기준 실시간 예상 기본 채굴률 산출 (Live Preview)
    const calculateCurrentEffectiveRate = (): string => {
        // 1. OFF 상태이면 관리자 안전 가드 작동: 100% 정상 기본 채굴률 유지
        if (!isEnabled) {
            return Number(baseRate || 0.25).toFixed(8);
        }

        if (!startDate) return Number(baseRate || 0.25).toFixed(8);
        const formattedDateStr = startDate.length === 16 ? `${startDate}:00+09:00` : startDate;
        const targetTime = new Date(formattedDateStr).getTime();
        const now = Date.now();

        // 2. 아직 시작일 이전이면 정상 기본 채굴률 유지
        if (now < targetTime) {
            return Number(baseRate || 0.25).toFixed(8);
        }

        // 3. 시작일 경과 시: KST 기준 경과 개월(m) 산출 후 백서 공식 적용
        const targetKST = new Date(targetTime + 9 * 60 * 60 * 1000);
        const nowKST = new Date(now + 9 * 60 * 60 * 1000);
        const yearDiff = nowKST.getUTCFullYear() - targetKST.getUTCFullYear();
        const monthDiff = nowKST.getUTCMonth() - targetKST.getUTCMonth();
        const m = Math.max(0, yearDiff * 12 + monthDiff);

        const r0 = Number(baseRate || 0.25);
        const ratePerMonth = (monthlyReductionRate || 5.0) / 100;
        const factor = 1 - (ratePerMonth * m);

        if (factor <= 0) return '0.00000000';
        return (r0 * factor).toFixed(8);
    };

    const fetchHalvingStatus = async () => {
        setIsLoading(true);
        try {
            // [공정 4-1 수복] 표준 ApiService를 통한 백엔드 5001번 직결 통신
            const json = await apiService.getHalvingConfig();
            if (json && json.success && json.data) {
                const data: HalvingStatusResponse = json.data;
                setStatusData(data);
                setIsEnabled(data.config.isEnabled);
                
                // datetime-local input 호환 포맷 (YYYY-MM-DDTHH:mm)
                if (data.config.startDate) {
                    const d = new Date(data.config.startDate);
                    const kstMs = d.getTime() + (9 * 60 * 60 * 1000);
                    const kstDate = new Date(kstMs);
                    const iso = kstDate.toISOString().slice(0, 16);
                    setStartDate(iso);
                }
                setMonthlyReductionRate(data.config.monthlyReductionRate ?? 5.0);
                setBaseRate(data.config.baseRate ?? 0.25);
                setDescription(data.config.description ?? '');
                setAlertMessage(null); // 통신 성공 시 기존 에러 메시지 자동 소멸
            }
        } catch (err: any) {
            console.error('반감기 상태 조회 오류:', err);
            setAlertMessage({ type: 'error', text: '반감기 설정을 불러오는 데 실패했습니다. (백엔드 서버 5001 포트 응답을 확인해주세요)' });
        } finally {
            setIsLoading(false);
        }
    };

    // 실시간 스케줄 계산기 (브라우저 즉시 렌더링 - KST 기준 무오차 동적 연산)
    const calculateLiveSchedule = () => {
        try {
            if (!startDate) return;
            const formattedDateStr = startDate.length === 16 ? `${startDate}:00+09:00` : startDate;
            const start = new Date(formattedDateStr);
            if (isNaN(start.getTime())) return;

            // KST 한국 표준시 기준 연/월 정확한 산출 (UTC + 9시간)
            const kstMs = start.getTime() + (9 * 60 * 60 * 1000);
            const kstDate = new Date(kstMs);
            const startYear = kstDate.getUTCFullYear();
            const startMonth = kstDate.getUTCMonth(); // 0 ~ 11
            const r0 = baseRate > 0 ? baseRate : 0.25;
            const ratePerMonth = (monthlyReductionRate || 5.0) / 100;

            const steps: HalvingStep[] = [];
            for (let m = 0; m < 24; m++) {
                const cur = new Date(Date.UTC(startYear, startMonth + m, 1));
                const year = cur.getUTCFullYear();
                const month = cur.getUTCMonth() + 1;
                const periodText = `${year}년 ${String(month).padStart(2, '0')}월`;

                const factor = 1 - (ratePerMonth * m);
                const calculatedRate = factor > 0 ? (r0 * factor) : 0;
                const dailyMax = calculatedRate * 24;
                const reduction = Math.min(100, m * monthlyReductionRate);

                let statusNote = '';
                if (m === 0) {
                    statusNote = '🚀 반감기 공식 개시 (100% 정상 공급)';
                } else if (calculatedRate <= 0) {
                    statusNote = '🛑 채굴 한도 도달 (보너스 전용 전환)';
                } else {
                    statusNote = `📉 ${m}차 선형 감산 (-${reduction.toFixed(1)}%)`;
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
            setLiveSchedule(steps);
        } catch (e) {
            console.error('스케줄 계산 오류:', e);
        }
    };

    // [설정 저장] 버튼 핸들러
    const handleSaveConfig = async () => {
        setIsSaving(true);
        setAlertMessage(null);
        try {
            // ISO 타임스탬프 (+09:00 KST) 조립
            const formattedStartDate = startDate.length === 16 ? `${startDate}:00+09:00` : startDate;

            // [공정 4-1 수복] 표준 ApiService를 통한 MongoDB 영구 저장 직결
            const json = await apiService.saveHalvingConfig({
                isEnabled,
                startDate: formattedStartDate,
                monthlyReductionRate: Number(monthlyReductionRate),
                baseRate: Number(baseRate),
                description
            });

            if (json && json.success) {
                setStatusData(json.data);
                // MongoDB에 영구 저장된 최신 설정값으로 화면 상태를 즉각 확정 동기화
                if (json.data?.config) {
                    setIsEnabled(json.data.config.isEnabled);
                    if (json.data.config.startDate) {
                        const d = new Date(json.data.config.startDate);
                        const kstMs = d.getTime() + (9 * 60 * 60 * 1000);
                        const kstDate = new Date(kstMs);
                        const iso = kstDate.toISOString().slice(0, 16);
                        setStartDate(iso);
                    }
                    setMonthlyReductionRate(json.data.config.monthlyReductionRate ?? 5.0);
                    setBaseRate(json.data.config.baseRate ?? 0.25);
                }
                setAlertMessage({
                    type: 'success',
                    text: '✅ 반감기 정책이 MongoDB에 안전하게 영구 저장되었습니다! (새로고침 시에도 유지됨)'
                });
            } else {
                setAlertMessage({ type: 'error', text: json?.message || '저장 실패' });
            }
        } catch (err: any) {
            console.error('반감기 저장 오류:', err);
            setAlertMessage({ type: 'error', text: '서버 통신 오류가 발생했습니다: ' + (err?.message || '저장 실패') });
        } finally {
            setIsSaving(false);
        }
    };

    // [전체 마이너 채굴률 즉시 동기화] 버튼 핸들러
    const handleSyncGlobal = async () => {
        if (!window.confirm('현재 채굴 중인 전체 마이너들의 기본 채굴률을 최신 반감기 정책으로 즉시 재계산 및 일괄 동기화하시겠습니까?')) {
            return;
        }

        setIsSyncing(true);
        setAlertMessage(null);
        try {
            // [공정 4-1 수복] 표준 ApiService를 통한 마이너 채굴률 즉시 동기화
            const json = await apiService.syncGlobalHalvingMiners();
            if (json && json.success) {
                setAlertMessage({
                    type: 'success',
                    text: `⚡ ${json.message}`
                });
                fetchHalvingStatus();
            } else {
                setAlertMessage({ type: 'error', text: json?.message || '동기화 실패' });
            }
        } catch (err: any) {
            console.error('마이너 동기화 오류:', err);
            setAlertMessage({ type: 'error', text: '마이너 동기화 중 오류가 발생했습니다: ' + (err?.message || '동기화 실패') });
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div style={{ padding: '10px 0', color: '#1F2937' }}>
            {/* 상단 헤더 & 새로고침 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        ⏰ 반감기 정책 거버넌스 관리 콘솔
                    </h2>
                    <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#6B7280' }}>
                        백서 v1.0 §1.4 선형 반감기 알고리즘을 제어하며, 폐쇄형 베타 및 메인넷 일정에 맞추어 시작일과 감소율을 자유롭게 조정합니다.
                    </p>
                </div>
                <button
                    onClick={fetchHalvingStatus}
                    disabled={isLoading}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#F3F4F6',
                        color: '#374151',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                >
                    🔄 {isLoading ? '조회 중...' : '상태 새로고침'}
                </button>
            </div>

            {/* 피드백 알림 메시지 */}
            {alertMessage && (
                <div style={{
                    padding: '12px 18px',
                    borderRadius: '10px',
                    marginBottom: '20px',
                    fontWeight: 600,
                    fontSize: '14px',
                    backgroundColor: alertMessage.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                    color: alertMessage.type === 'success' ? '#065F46' : '#991B1B',
                    border: `1px solid ${alertMessage.type === 'success' ? '#A7F3D0' : '#FECACA'}`
                }}>
                    {alertMessage.text}
                </div>
            )}

            {/* 1. 상단 3대 핵심 상태 요약 바 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '25px' }}>
                {/* 카드 1: 가동 상태 */}
                <div style={{ backgroundColor: 'white', padding: '18px 20px', borderRadius: '14px', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600, marginBottom: '8px' }}>반감기 엔진 가동 모드</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: '20px',
                            backgroundColor: isEnabled ? '#DEF7EC' : '#FEF3C7',
                            color: isEnabled ? '#03543F' : '#92400E'
                        }}>
                            {isEnabled ? '🟢 가동 승인 (ACTIVE)' : '🟠 대기·준비중 (STANDBY / OFF)'}
                        </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '8px' }}>
                        {isEnabled ? '시작일 도달 시 백서 공식에 따라 자동 감산됩니다.' : '🛡️ 관리자 안전 가드 작동 중: 100% 기본 채굴률 유지'}
                    </div>
                </div>

                {/* 카드 2: 카운트다운 */}
                <div style={{ backgroundColor: 'white', padding: '18px 20px', borderRadius: '14px', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600, marginBottom: '8px' }}>
                        반감기 개시 카운트다운 {isEnabled ? '(실시간 가동중)' : '(일시정지)'}
                    </div>
                    <div style={{
                        fontSize: '18px',
                        fontWeight: 800,
                        color: isEnabled ? '#1E40AF' : '#D97706',
                        fontVariantNumeric: 'tabular-nums',
                        letterSpacing: '-0.3px'
                    }}>
                        {liveCountdownText || (isEnabled ? (statusData?.countdown?.dDayText || '계산 중...') : '⏸️ 대기 모드 (가동 승인 대기 중)')}
                    </div>
                    <div style={{ fontSize: '11px', color: isEnabled ? '#2563EB' : '#9CA3AF', marginTop: '8px' }}>
                        {isEnabled
                            ? (startDate && new Date(startDate.length === 16 ? `${startDate}:00+09:00` : startDate).getTime() <= Date.now()
                                ? `🚀 반감기가 공식 가동 중이며, 백서 공식에 따라 현재 채굴량이 자동 감산되고 있습니다.`
                                : `🚀 반감기 공식이 승인되었으며, 시작일(${startDate ? startDate.replace('T', ' ') : '2028-01-01 00:00'} KST) 도달 시 자동 감산됩니다.`)
                            : '🛡️ 관리자 안전 가드가 작동 중이며, 카운트다운이 정지되어 있습니다.'}
                    </div>
                </div>

                {/* 카드 3: 현재 적용 채굴률 (실시간 Live Preview) */}
                <div style={{ backgroundColor: 'white', padding: '18px 20px', borderRadius: '14px', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>현재 네트워크 기본 채굴률</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', backgroundColor: '#ECFDF5', padding: '2px 6px', borderRadius: '4px' }}>
                            실시간 라이브
                        </span>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
                        {calculateCurrentEffectiveRate()} BW/h
                    </div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '8px' }}>
                        일일 기본 최대: {(Number(calculateCurrentEffectiveRate()) * 24).toFixed(6)} BW / 24h
                    </div>
                </div>
            </div>

            {/* 2. 정책 제어 패널 (수정 입력기) */}
            <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '24px', marginBottom: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                <h3 style={{ margin: '0 0 18px', fontSize: '16px', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ⚙️ 반감기 정책 설정 및 거버넌스 제어
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '22px' }}>
                    {/* 제어 1: ON/OFF 스위치 */}
                    <div style={{ padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
                            🛡️ 반감기 가동 스위치 (ON / OFF)
                        </label>
                        <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#6B7280', lineHeight: 1.4 }}>
                            OFF 시 2028년이 되어도 반감기가 발동하지 않고 기본 0.25 BW/h가 유지됩니다.
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={() => setIsEnabled(true)}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    border: isEnabled ? '2px solid #059669' : '1px solid #D1D5DB',
                                    backgroundColor: isEnabled ? '#059669' : '#FFFFFF',
                                    color: isEnabled ? '#FFFFFF' : '#6B7280',
                                    transition: 'all 0.2s'
                                }}
                            >
                                ON (가동 승인)
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsEnabled(false)}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    border: !isEnabled ? '2px solid #D97706' : '1px solid #D1D5DB',
                                    backgroundColor: !isEnabled ? '#D97706' : '#FFFFFF',
                                    color: !isEnabled ? '#FFFFFF' : '#6B7280',
                                    transition: 'all 0.2s'
                                }}
                            >
                                OFF (대기 모드)
                            </button>
                        </div>
                    </div>

                    {/* 제어 2: 시작 일시 수정 */}
                    <div style={{ padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>
                                📅 반감기 시작 일시 (KST 한국 표준시)
                            </label>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB', backgroundColor: '#EFF6FF', padding: '2px 8px', borderRadius: '4px' }}>
                                실시간 동적 신축 연동
                            </span>
                        </div>
                        <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#6B7280', lineHeight: 1.4 }}>
                            백서 기본값은 2028-01-01이며, 날짜를 변경하면 D-Day 카운트다운과 24개월 표가 즉시 자동 계산됩니다.
                        </p>
                        <input
                            type="datetime-local"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: '1px solid #D1D5DB',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#111827',
                                backgroundColor: 'white',
                                boxSizing: 'border-box',
                                marginBottom: '10px'
                            }}
                        />
                        {/* 빠른 테스트용 날짜 프리셋 버튼 4종 */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            <button
                                type="button"
                                onClick={() => setStartDate('2028-01-01T00:00')}
                                style={{
                                    flex: 1,
                                    minWidth: '80px',
                                    padding: '5px 8px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    borderRadius: '6px',
                                    border: startDate.startsWith('2028-01-01') ? '1px solid #2563EB' : '1px solid #D1D5DB',
                                    backgroundColor: startDate.startsWith('2028-01-01') ? '#EFF6FF' : '#FFFFFF',
                                    color: startDate.startsWith('2028-01-01') ? '#1E40AF' : '#4B5563',
                                    cursor: 'pointer'
                                }}
                            >
                                🎯 백서 2028년
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000);
                                    setStartDate(tomorrow.toISOString().slice(0, 10) + 'T00:00');
                                }}
                                style={{
                                    flex: 1,
                                    minWidth: '80px',
                                    padding: '5px 8px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    borderRadius: '6px',
                                    border: '1px solid #D1D5DB',
                                    backgroundColor: '#FFFFFF',
                                    color: '#4B5563',
                                    cursor: 'pointer'
                                }}
                            >
                                ⚡ 내일 (테스트)
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000);
                                    setStartDate(nextMonth.toISOString().slice(0, 10) + 'T00:00');
                                }}
                                style={{
                                    flex: 1,
                                    minWidth: '80px',
                                    padding: '5px 8px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    borderRadius: '6px',
                                    border: '1px solid #D1D5DB',
                                    backgroundColor: '#FFFFFF',
                                    color: '#4B5563',
                                    cursor: 'pointer'
                                }}
                            >
                                🗓️ 30일 뒤
                            </button>
                            <button
                                type="button"
                                onClick={() => setStartDate('2029-01-01T00:00')}
                                style={{
                                    flex: 1,
                                    minWidth: '80px',
                                    padding: '5px 8px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    borderRadius: '6px',
                                    border: startDate.startsWith('2029-01-01') ? '1px solid #2563EB' : '1px solid #D1D5DB',
                                    backgroundColor: startDate.startsWith('2029-01-01') ? '#EFF6FF' : '#FFFFFF',
                                    color: startDate.startsWith('2029-01-01') ? '#1E40AF' : '#4B5563',
                                    cursor: 'pointer'
                                }}
                            >
                                🔭 2029년 (미루기)
                            </button>
                        </div>
                    </div>

                    {/* 제어 3: 월별 감소율 (%) */}
                    <div style={{ padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>
                                📉 월별 채굴 감소율 (%)
                            </label>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: '#DC2626' }}>
                                {Number(monthlyReductionRate).toFixed(1)}% / 월
                            </span>
                        </div>
                        <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#6B7280', lineHeight: 1.4 }}>
                            백서 공식은 매월 5.0% 선형 감소이며, 1.0%~20.0%까지 임의 조정 가능합니다.
                        </p>
                        <input
                            type="range"
                            min="0.5"
                            max="20.0"
                            step="0.5"
                            value={monthlyReductionRate}
                            onChange={(e) => setMonthlyReductionRate(parseFloat(e.target.value))}
                            style={{ width: '100%', marginBottom: '8px', cursor: 'pointer' }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {[1.0, 3.0, 5.0, 10.0].map((rate) => (
                                <button
                                    key={rate}
                                    type="button"
                                    onClick={() => setMonthlyReductionRate(rate)}
                                    style={{
                                        flex: 1,
                                        padding: '4px',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        borderRadius: '6px',
                                        border: monthlyReductionRate === rate ? '1px solid #DC2626' : '1px solid #D1D5DB',
                                        backgroundColor: monthlyReductionRate === rate ? '#FEE2E2' : '#FFFFFF',
                                        color: monthlyReductionRate === rate ? '#991B1B' : '#4B5563',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {rate.toFixed(1)}%
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 제어 4: 기본 채굴률 (R0) */}
                    <div style={{ padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
                            🪙 기본 채굴률 기준값 (R₀)
                        </label>
                        <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#6B7280', lineHeight: 1.4 }}>
                            백서 공식 기준값 0.25 BW/h (일일 6.0 BW/24h)
                        </p>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max="10.0"
                            value={baseRate}
                            onChange={(e) => setBaseRate(parseFloat(e.target.value) || 0.25)}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: '1px solid #D1D5DB',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#111827',
                                backgroundColor: 'white',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                </div>

                {/* 거버넌스 버튼 2종 */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid #F3F4F6', paddingTop: '18px' }}>
                    <button
                        onClick={handleSaveConfig}
                        disabled={isSaving}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#2563EB',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: isSaving ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 2px 6px rgba(37,99,235,0.2)'
                        }}
                    >
                        💾 {isSaving ? '저장 중...' : '반감기 정책 설정 영구 저장'}
                    </button>

                    <button
                        onClick={handleSyncGlobal}
                        disabled={isSyncing}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#059669',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: isSyncing ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 2px 6px rgba(5,150,105,0.2)'
                        }}
                    >
                        ⚡ {isSyncing ? '동기화 중...' : '전체 마이너 채굴률 즉시 일괄 동기화'}
                    </button>
                </div>
            </div>

            {/* 3. 24개월 실시간 스케줄 시뮬레이터 (미리보기 표) */}
            <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111827' }}>
                            📊 선형 반감기 24개월 실시간 스케줄 시뮬레이션
                        </h3>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6B7280' }}>
                            위 설정 패널에서 시작일과 감소율을 변경하면, 아래 24단계 월별 채굴량 시뮬레이션 결과가 실시간으로 자동 갱신됩니다.
                        </p>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#059669', backgroundColor: '#ECFDF5', padding: '4px 10px', borderRadius: '12px' }}>
                        실시간 연산 동기화 중
                    </span>
                </div>

                <div style={{ overflowX: 'auto', maxHeight: '480px', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '12px' }}>
                        <thead style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 1 }}>
                            <tr>
                                <th style={{ padding: '12px 10px', color: '#374151', fontWeight: 700 }}>단계 (m)</th>
                                <th style={{ padding: '12px 10px', color: '#374151', fontWeight: 700 }}>적용 연월</th>
                                <th style={{ padding: '12px 10px', color: '#374151', fontWeight: 700 }}>누적 감소율</th>
                                <th style={{ padding: '12px 10px', color: '#374151', fontWeight: 700 }}>시간당 기본 채굴률</th>
                                <th style={{ padding: '12px 10px', color: '#374151', fontWeight: 700 }}>일일 기본 최대 (24h)</th>
                                <th style={{ padding: '12px 10px', color: '#374151', fontWeight: 700 }}>정책 상태 설명</th>
                            </tr>
                        </thead>
                        <tbody>
                            {liveSchedule.map((row) => (
                                <tr
                                    key={row.step}
                                    style={{
                                        borderBottom: '1px solid #F3F4F6',
                                        backgroundColor: row.step === 0 ? '#F0FDF4' : (row.step % 2 === 0 ? '#FFFFFF' : '#FAFAFA')
                                    }}
                                >
                                    <td style={{ padding: '10px', fontWeight: 700, color: '#6B7280' }}>
                                        {row.step === 0 ? '시작' : `${row.step}개월`}
                                    </td>
                                    <td style={{ padding: '10px', fontWeight: 700, color: '#111827' }}>
                                        {row.periodText}
                                    </td>
                                    <td style={{ padding: '10px', fontWeight: 700, color: row.reductionPercent > 0 ? '#DC2626' : '#059669' }}>
                                        {row.reductionPercent.toFixed(1)}%
                                    </td>
                                    <td style={{ padding: '10px', fontWeight: 800, color: '#2563EB', fontFamily: 'monospace', fontSize: '13px' }}>
                                        {row.baseRate} BW/h
                                    </td>
                                    <td style={{ padding: '10px', fontWeight: 700, color: '#4B5563', fontFamily: 'monospace' }}>
                                        {row.dailyMaxRate} BW
                                    </td>
                                    <td style={{ padding: '10px', color: '#4B5563', textAlign: 'left', paddingLeft: '20px' }}>
                                        {row.statusNote}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
export default HalvingManager;
