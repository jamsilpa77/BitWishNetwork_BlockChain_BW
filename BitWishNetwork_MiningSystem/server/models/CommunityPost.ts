import mongoose from 'mongoose';

// 1. 게시글 테이블 스키마
const CommunityPostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, required: true }, // 'HUMOR' | 'INFO' | 'FREE' | 'QUESTION' | 'GAME' | 'ANONYMOUS' | 'NOTICE'
    views: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    dislikeCount: { type: Number, default: 0 },
    heartCount: { type: Number, default: 0 },
    funnyCount: { type: Number, default: 0 },
    hotScore: { type: Number, default: 0 },
    isNotice: { type: Boolean, default: false },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityUser', required: true }
}, { timestamps: true });

// 2. 댓글 테이블 스키마 (자가참조 parentId 적용으로 무한 대댓글 지원)
const CommunityCommentSchema = new mongoose.Schema({
    content: { type: String, required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityPost', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityUser', required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityComment', default: null }
}, { timestamps: true });

// 3. 리액션 방지 중복 방지 인덱싱 스키마 (1인 1표 보장)
const CommunityReactionSchema = new mongoose.Schema({
    type: { type: String, required: true }, // 'LIKE' | 'DISLIKE' | 'HEART' | 'FUNNY'
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityUser', required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityPost', required: true }
}, { timestamps: true });

CommunityReactionSchema.index({ userId: 1, postId: 1 }, { unique: true });

export const CommunityPost = mongoose.models.CommunityPost || mongoose.model('CommunityPost', CommunityPostSchema);
export const CommunityComment = mongoose.models.CommunityComment || mongoose.model('CommunityComment', CommunityCommentSchema);
export const CommunityReaction = mongoose.models.CommunityReaction || mongoose.model('CommunityReaction', CommunityReactionSchema);