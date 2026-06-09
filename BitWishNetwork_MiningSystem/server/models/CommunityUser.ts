import mongoose from 'mongoose';

// 지갑 주소가 필요 없는, 순수 커뮤니티 전용 독립 유저 스키마
const CommunityUserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    nickname: { type: String, required: true, unique: true },
    role: { type: String, default: 'USER' }, // 'USER' | 'ADMIN' (마이닝 어드민과 완전 독립)
    isBanned: { type: Boolean, default: false }
}, { timestamps: true });

export const CommunityUser = mongoose.models.CommunityUser || mongoose.model('CommunityUser', CommunityUserSchema);