import mongoose from 'mongoose';

/**
 * BitWishNetwork System Configuration Model
 * 거버넌스 제어 및 시스템 설정을 저장하는 하이브리드 모델
 */

interface ISystemConfig extends mongoose.Document {
    key: string;
    value: any;
    updatedAt: Date;
}

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

export default mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema);
