import mongoose from 'mongoose';

/**
 * BitWishNetwork System Configuration Model
 * 거버넌스 제어 및 시스템 설정을 저장하는 하이브리드 모델
 */

export interface ISystemConfig extends mongoose.Document {
    key: string;
    value: any;
    updatedAt: Date;
}

/**
 * [공정 4 - 작업 1] 관리자 반감기 정책 데이터 규격 인터페이스
 */
export interface IHalvingPolicyConfig {
    isEnabled: boolean;           // 반감기 가동 여부 (기본값: false [대기/OFF 모드] ➡️ 관리자가 켜기 전까지 절대 자동 발동 안 됨)
    startDate: string;            // 반감기 시작 일시 (기본값: 2028-01-01T00:00:00+09:00 KST ➡️ 관리자가 임의 날짜로 변경 가능)
    monthlyReductionRate: number; // 월별 채굴 감소율 (%) (기본값: 5.0% ➡️ 관리자가 1%~10% 등 자유 변경)
    baseRate: number;             // 기본 채굴률 (기본값: 0.25 BW/h)
    description?: string;         // 정책 설명/메모
    updatedAt?: Date;             // 최종 수정 시각
    updatedBy?: string;           // 수정한 관리자 계정
}

/**
 * 백서 v1.0 §1.4 기준 정규 기본 반감기 정책 (안전 가드: 기본값 OFF)
 */
export const DEFAULT_HALVING_CONFIG: IHalvingPolicyConfig = {
    isEnabled: false, // 🛡️ [절대 안전 가드] 폐쇄형 베타/테스트 환경 보호를 위해 기본 OFF 모드로 대기
    startDate: '2028-01-01T00:00:00+09:00', // KST 기준 2028년 1월 1일 AM 00:00:00
    monthlyReductionRate: 5.0,              // 매월 5.0% 선형 감소
    baseRate: 0.25,                         // 시간당 0.25 BW 기본 채굴률
    description: '백서 v1.0 §1.4 선형 반감기 공식 정책 (관리자 승인 대기 모드)'
};

export const HALVING_CONFIG_KEY = 'halving_policy';

const SystemConfigSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    updatedAt: { type: Date, default: Date.now }
});

// 업데이트 시 자동으로 updatedAt 갱신
SystemConfigSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const SystemConfig = mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema);

/**
 * 반감기 정책 DB 조회 헬퍼 함수
 * DB에 레코드가 없으면 DEFAULT_HALVING_CONFIG를 안전하게 반환합니다.
 */
export async function getHalvingConfig(): Promise<IHalvingPolicyConfig> {
    try {
        const configDoc = await SystemConfig.findOne({ key: HALVING_CONFIG_KEY });
        if (!configDoc || !configDoc.value) {
            return { ...DEFAULT_HALVING_CONFIG };
        }
        return {
            ...DEFAULT_HALVING_CONFIG,
            ...configDoc.value,
            updatedAt: configDoc.updatedAt
        };
    } catch (err) {
        console.error('[SystemConfig] 반감기 정책 조회 실패 (기본값 사용):', err);
        return { ...DEFAULT_HALVING_CONFIG };
    }
}

/**
 * 반감기 정책 DB 저장/수정 헬퍼 함수
 * 관리자가 화면에서 변경한 시작일, 감소율, ON/OFF 스위치를 MongoDB에 영구 저장합니다.
 */
export async function saveHalvingConfig(
    config: Partial<IHalvingPolicyConfig>,
    adminEmail: string = 'salmani1@naver.com'
): Promise<IHalvingPolicyConfig> {
    const current = await getHalvingConfig();
    const updatedValue: IHalvingPolicyConfig = {
        ...current,
        ...config,
        updatedBy: adminEmail
    };

    const doc = await SystemConfig.findOneAndUpdate(
        { key: HALVING_CONFIG_KEY },
        {
            key: HALVING_CONFIG_KEY,
            value: updatedValue,
            updatedAt: new Date()
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return {
        ...updatedValue,
        updatedAt: doc.updatedAt
    };
}

export default SystemConfig;
