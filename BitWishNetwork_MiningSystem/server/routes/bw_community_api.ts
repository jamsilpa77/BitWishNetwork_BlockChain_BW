import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { BWCommunityUser, BWCommunityPost, BWCommunityComment, BWCommunityReaction } from '../models/bwCommunityModels';

const router = express.Router();

// 커뮤니티 전용 안전 격리 JWT 시크릿 키
const JWT_SECRET = process.env.JWT_SECRET || 'bw-community-isolated-secret-v5';

// 관리자 권한 검증 미들웨어
const verifyCommunityAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        if (decoded.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden. Admin access required.' });
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// ==============================================
// 1. 인증 로직 (Authentication)
// ==============================================

// 이메일 기반 기본 회원가입
router.post('/auth/register', async (req, res) => {
    try {
        const { email, password, nickname } = req.body;
        if (!email || !password || !nickname) return res.status(400).json({ error: 'Missing required fields' });

        const existing = await BWCommunityUser.findOne({ $or: [{ email }, { nickname }] });
        if (existing) return res.status(400).json({ error: 'Email or Nickname already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        // 특정 관리자 이메일 하드코딩 식별 (운영 환경에서는 환경변수 처리 권장)
        const role = email === 'admin@bitwish.network' ? 'ADMIN' : 'USER';

        const user = new BWCommunityUser({ email, password: hashedPassword, nickname, role });
        await user.save();

        const accessToken = jwt.sign({ id: user._id, email: user.email, role: user.role, nickname: user.nickname }, JWT_SECRET);
        return res.status(201).json({ success: true, tokens: { accessToken }, user: { id: user._id, email: user.email, nickname: user.nickname, role: user.role } });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// 이메일 기반 기본 로그인
router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await BWCommunityUser.findOne({ email });

        if (!user || user.isBanned) return res.status(400).json({ error: 'Invalid user or account is banned' });

        // 구글 로그인 전용 유저가 비밀번호 없이 시도할 때의 예외 처리 방어
        if (!user.password) return res.status(400).json({ error: 'Please login via Google' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid password' });

        const accessToken = jwt.sign({ id: user._id, email: user.email, role: user.role, nickname: user.nickname }, JWT_SECRET);
        return res.json({ success: true, tokens: { accessToken }, user: { id: user._id, email: user.email, nickname: user.nickname, role: user.role } });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// ==============================================
// 2. 프리미엄 6대 카테고리 게시판 로직
// ==============================================

// 게시글 목록 페이징 및 필터링 조회
router.get('/posts', async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const category = req.query.category as string;
        const limit = 20;
        const skip = (page - 1) * limit;

        const query: any = {};
        if (category) {
            if (category === 'NOTICE') query.isNotice = true;
            else query.category = category.toUpperCase();
        }

        const totalPosts = await BWCommunityPost.countDocuments(query);
        const totalPages = Math.ceil(totalPosts / limit) || 1;

        // 핫 스코어 및 최신순 정렬
        const posts = await BWCommunityPost.find(query)
            .populate('authorId', 'nickname')
            .sort({ isNotice: -1, hotScore: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // 프론트엔드로 안전하게 매핑 전달
        const formatted = posts.map((post: any) => ({
            id: post._id,
            title: post.title,
            content: post.content,
            category: post.category,
            views: post.views,
            likeCount: post.likeCount,
            dislikeCount: post.dislikeCount,
            heartCount: post.heartCount,
            funnyCount: post.funnyCount,
            hotScore: post.hotScore,
            isNotice: post.isNotice,
            createdAt: post.createdAt,
            author: post.authorId ? { id: post.authorId._id, nickname: post.authorId.nickname } : { id: null, nickname: 'Unknown' }
        }));

        return res.json({ success: true, data: { posts: formatted, totalPages, currentPage: page } });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// 신규 게시글 작성
router.post('/posts', async (req, res) => {
    try {
        const { title, content, category, authorId } = req.body;
        if (!title || !content || !category || !authorId) return res.status(400).json({ error: 'Missing required fields' });

        const post = new BWCommunityPost({
            title,
            content,
            category: category.toUpperCase(),
            authorId: new mongoose.Types.ObjectId(authorId)
        });
        await post.save();

        return res.status(201).json({ success: true, data: post });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// 게시글 상세 보기 (조회수 증가 및 댓글 포함)
router.get('/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid post ID format' });

        const post = await BWCommunityPost.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true })
            .populate('authorId', 'nickname').lean() as any;

        if (!post) return res.status(404).json({ error: 'Post not found' });

        const comments = await BWCommunityComment.find({ postId: id })
            .populate('userId', 'nickname')
            .sort({ createdAt: 1 })
            .lean();

        const formattedComments = comments.map((c: any) => ({
            id: c._id,
            content: c.content,
            postId: c.postId,
            userId: c.userId?._id,
            parentId: c.parentId,
            user: { nickname: c.userId?.nickname || 'Unknown' },
            createdAt: c.createdAt
        }));

        return res.json({
            success: true,
            data: {
                id: post._id,
                title: post.title,
                content: post.content,
                category: post.category,
                views: post.views,
                likeCount: post.likeCount,
                dislikeCount: post.dislikeCount,
                heartCount: post.heartCount,
                funnyCount: post.funnyCount,
                hotScore: post.hotScore,
                isNotice: post.isNotice,
                createdAt: post.createdAt,
                author: post.authorId ? { id: post.authorId._id, nickname: post.authorId.nickname } : { id: null, nickname: 'Unknown' },
                comments: formattedComments
            }
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// ==============================================
// 3. 댓글 및 리액션 로직
// ==============================================

router.post('/comments', async (req, res) => {
    try {
        const { content, postId, userId, parentId } = req.body;
        if (!content || !postId || !userId) return res.status(400).json({ error: 'Missing fields' });

        const comment = new BWCommunityComment({
            content,
            postId: new mongoose.Types.ObjectId(postId),
            userId: new mongoose.Types.ObjectId(userId),
            parentId: parentId ? new mongoose.Types.ObjectId(parentId) : null
        });
        await comment.save();
        return res.json({ success: true, data: comment });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// 마이크로 인터랙션을 위한 리액션 및 핫 스코어 실시간 정산 엔진
router.post('/reactions', async (req, res) => {
    try {
        const { type, postId, userId } = req.body;
        const pId = new mongoose.Types.ObjectId(postId);
        const uId = new mongoose.Types.ObjectId(userId);

        const existing = await BWCommunityReaction.findOne({ postId: pId, userId: uId });

        if (existing) {
            // 이미 누른 버튼을 다시 누르면 취소 토글 로직
            const oldType = existing.type;
            const dec: any = {};
            if (oldType === 'LIKE') dec.likeCount = -1;
            else if (oldType === 'DISLIKE') dec.dislikeCount = -1;
            else if (oldType === 'HEART') dec.heartCount = -1;
            else if (oldType === 'FUNNY') dec.funnyCount = -1;

            await BWCommunityPost.findByIdAndUpdate(pId, { $inc: dec });

            if (oldType === type) {
                // 완전히 취소된 경우 삭제 및 핫 점수 재계산
                await BWCommunityReaction.deleteOne({ _id: existing._id });
                const post = await BWCommunityPost.findById(pId);
                if (post) {
                    post.hotScore = post.likeCount * 3 + post.heartCount * 5 + post.funnyCount * 2 - post.dislikeCount * 2;
                    await post.save();
                }
                return res.json({ success: true, message: 'Reaction removed' });
            } else {
                // 다른 리액션으로 스위칭
                existing.type = type;
                await existing.save();
            }
        } else {
            // 신규 리액션
            const reaction = new BWCommunityReaction({ type, postId: pId, userId: uId });
            await reaction.save();
        }

        // 새 리액션 카운트 1 증가
        const inc: any = {};
        if (type === 'LIKE') inc.likeCount = 1;
        else if (type === 'DISLIKE') inc.dislikeCount = 1;
        else if (type === 'HEART') inc.heartCount = 1;
        else if (type === 'FUNNY') inc.funnyCount = 1;

        const updated = await BWCommunityPost.findByIdAndUpdate(pId, { $inc: inc }, { new: true });

        // 핫 알고리즘 실시간 반영 (Like*3 + Heart*5 + Funny*2 - Dislike*2)
        if (updated) {
            updated.hotScore = updated.likeCount * 3 + updated.heartCount * 5 + updated.funnyCount * 2 - updated.dislikeCount * 2;
            await updated.save();
        }

        return res.json({ success: true });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// ==============================================
// 4. 관리자 전용 로직
// ==============================================

router.post('/admin/notice', verifyCommunityAdmin, async (req, res) => {
    try {
        const { title, content, authorId } = req.body;
        const notice = new BWCommunityPost({ title, content, category: 'NOTICE', isNotice: true, authorId: new mongoose.Types.ObjectId(authorId) });
        await notice.save();
        return res.json({ success: true, data: notice });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

export default router;
