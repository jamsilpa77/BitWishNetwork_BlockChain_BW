import mongoose from 'mongoose';

// 1. 커뮤니티 전용 유저 스키마 (마이닝 지갑 정보 없음, 이메일/구글 기반 완전 격리)
const BWCommunityUserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false }, // 소셜 로그인(Google) 연동 시에는 비밀번호가 불필요할 수 있으므로 false
    nickname: { type: String, required: true, unique: true },
    role: { type: String, default: 'USER' }, // 'USER', 'ADMIN'
    isBanned: { type: Boolean, default: false }
}, { timestamps: true });

// 2. 프리미엄 6대 카테고리 지원 커뮤니티 게시글 스키마
const BWCommunityPostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, required: true }, // 'HUMOR' | 'INFO' | 'FREE' | 'QUESTION' | 'GAME' | 'ANONYMOUS' | 'NOTICE'
    views: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    dislikeCount: { type: Number, default: 0 },
    heartCount: { type: Number, default: 0 },
    funnyCount: { type: Number, default: 0 },
    hotScore: { type: Number, default: 0 }, // 핫 게시물 실시간 알고리즘 점수
    isNotice: { type: Boolean, default: false },
    images: { type: [String], default: [] },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'BWCommunityUser', required: true }
}, { timestamps: true });

// 3. 커뮤니티 전용 댓글 스키마
const BWCommunityCommentSchema = new mongoose.Schema({
    content: { type: String, required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'BWCommunityPost', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'BWCommunityUser', required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'BWCommunityComment', default: null }
}, { timestamps: true });

// 4. 리액션 스키마 (👍 ❤️ 😂 👎 마이크로 인터랙션용)
const BWCommunityReactionSchema = new mongoose.Schema({
    type: { type: String, required: true }, // 'LIKE' | 'DISLIKE' | 'HEART' | 'FUNNY'
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'BWCommunityUser', required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'BWCommunityPost', required: true }
}, { timestamps: true });

// 중복 리액션 방지 인덱싱
BWCommunityReactionSchema.index({ userId: 1, postId: 1 }, { unique: true });

// Mongoose 컴파일 및 안전 모델 내보내기 (마이닝 DB와 이름이 겹치지 않도록 BWCommunity 접두어 사용)
export const BWCommunityUser = mongoose.models.BWCommunityUser || mongoose.model('BWCommunityUser', BWCommunityUserSchema);
export const BWCommunityPost = mongoose.models.BWCommunityPost || mongoose.model('BWCommunityPost', BWCommunityPostSchema);
export const BWCommunityComment = mongoose.models.BWCommunityComment || mongoose.model('BWCommunityComment', BWCommunityCommentSchema);
export const BWCommunityReaction = mongoose.models.BWCommunityReaction || mongoose.model('BWCommunityReaction', BWCommunityReactionSchema);

// 5. 금칙어 스키마 (관리자가 등록한 금칙어 목록 — 게시글/댓글 작성 시 실시간 필터링)
const BWBannedWordSchema = new mongoose.Schema({
    word: { type: String, required: true, unique: true },
}, { timestamps: true });

export const BWBannedWord = mongoose.models.BWBannedWord || mongoose.model('BWBannedWord', BWBannedWordSchema);
