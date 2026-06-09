import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { CommunityUser } from '../models/CommunityUser';
import { CommunityPost, CommunityComment, CommunityReaction } from '../models/CommunityPost';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'bw-community-secret-key-129847120';

// [어드민 검증 미들웨어]
const verifyAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden. Admin required.' });
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// [Auth API - 닉네임 기반 커뮤니티 독립 회원체계]
router.post('/auth/register', async (req, res) => {
    try {
        const { email, password, nickname } = req.body;
        if (!email || !password || !nickname) return res.status(400).json({ error: 'Missing fields' });
        const existing = await CommunityUser.findOne({ $or: [{ email }, { nickname }] });
        if (existing) return res.status(400).json({ error: 'Email or Nickname already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const role = email === 'admin@bitwish.network' ? 'ADMIN' : 'USER';
        const user = new CommunityUser({ email, password: hashedPassword, nickname, role });
        await user.save();

        const accessToken = jwt.sign({ id: user._id, email: user.email, role: user.role, nickname: user.nickname }, JWT_SECRET);
        return res.status(201).json({ success: true, tokens: { accessToken }, user: { id: user._id, email: user.email, nickname: user.nickname, role: user.role } });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await CommunityUser.findOne({ email });
        if (!user || user.isBanned) return res.status(400).json({ error: 'Invalid user or banned account' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid password' });

        const accessToken = jwt.sign({ id: user._id, email: user.email, role: user.role, nickname: user.nickname }, JWT_SECRET);
        return res.json({ success: true, tokens: { accessToken }, user: { id: user._id, email: user.email, nickname: user.nickname, role: user.role } });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// [게시글 API]
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

        const totalPosts = await CommunityPost.countDocuments(query);
        const totalPages = Math.ceil(totalPosts / limit) || 1;

        const posts = await CommunityPost.find(query)
            .populate('authorId', 'nickname')
            .sort({ isNotice: -1, hotScore: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

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
            author: post.authorId ? { id: post.authorId._id, nickname: post.authorId.nickname } : { id: 0, nickname: 'Unknown' }
        }));

        return res.json({ success: true, data: { posts: formatted, totalPages, currentPage: page } });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

router.get('/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid post ID' });

        const post = await CommunityPost.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true }).populate('authorId', 'nickname').lean() as any;
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const comments = await CommunityComment.find({ postId: id }).populate('userId', 'nickname').sort({ createdAt: 1 }).lean();
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
                author: post.authorId ? { id: post.authorId._id, nickname: post.authorId.nickname } : { id: 0, nickname: 'Unknown' },
                comments: formattedComments
            }
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

router.post('/posts', async (req, res) => {
    try {
        const { title, content, category, authorId } = req.body;
        if (!title || !content || !category || !authorId) return res.status(400).json({ error: 'Missing fields' });

        const post = new CommunityPost({
            title,
            content,
            category: category.toUpperCase(),
            authorId: new mongoose.Types.ObjectId(authorId)
        });
        await post.save();
        return res.json({ success: true, data: post });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// [댓글 API]
router.post('/comments', async (req, res) => {
    try {
        const { content, postId, userId, parentId } = req.body;
        if (!content || !postId || !userId) return res.status(400).json({ error: 'Missing fields' });

        const comment = new CommunityComment({
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

// [리액션 API - 핫스코어 실시간 자동 집계 엔진 내장]
router.post('/reactions', async (req, res) => {
    try {
        const { type, postId, userId } = req.body;
        const pId = new mongoose.Types.ObjectId(postId);
        const uId = new mongoose.Types.ObjectId(userId);

        const existing = await CommunityReaction.findOne({ postId: pId, userId: uId });
        if (existing) {
            const oldType = existing.type;
            const dec: any = {};
            if (oldType === 'LIKE') dec.likeCount = -1;
            else if (oldType === 'DISLIKE') dec.dislikeCount = -1;
            else if (oldType === 'HEART') dec.heartCount = -1;
            else if (oldType === 'FUNNY') dec.funnyCount = -1;

            await CommunityPost.findByIdAndUpdate(pId, { $inc: dec });

            if (oldType === type) {
                await CommunityReaction.deleteOne({ _id: existing._id });
                const post = await CommunityPost.findById(pId);
                if (post) {
                    post.hotScore = post.likeCount * 3 + post.heartCount * 5 + post.funnyCount * 2 - post.dislikeCount * 2;
                    await post.save();
                }
                return res.json({ success: true, message: 'Reaction removed' });
            } else {
                existing.type = type;
                await existing.save();
            }
        } else {
            const reaction = new CommunityReaction({ type, postId: pId, userId: uId });
            await reaction.save();
        }

        const inc: any = {};
        if (type === 'LIKE') inc.likeCount = 1;
        else if (type === 'DISLIKE') inc.dislikeCount = 1;
        else if (type === 'HEART') inc.heartCount = 1;
        else if (type === 'FUNNY') inc.funnyCount = 1;

        const updated = await CommunityPost.findByIdAndUpdate(pId, { $inc: inc }, { new: true });
        if (updated) {
            updated.hotScore = updated.likeCount * 3 + updated.heartCount * 5 + updated.funnyCount * 2 - updated.dislikeCount * 2;
            await updated.save();
        }
        return res.json({ success: true });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// [커뮤니티 독자적 관리자 제어 API]
router.post('/admin/notice', verifyAdmin, async (req, res) => {
    try {
        const { title, content, authorId } = req.body;
        const notice = new CommunityPost({ title, content, category: 'NOTICE', isNotice: true, authorId: new mongoose.Types.ObjectId(authorId) });
        await notice.save();
        return res.json({ success: true, data: notice });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

router.delete('/admin/post/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await CommunityPost.findByIdAndDelete(id);
        await CommunityComment.deleteMany({ postId: id });
        await CommunityReaction.deleteMany({ postId: id });
        return res.json({ success: true });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

router.post('/admin/user/ban', verifyAdmin, async (req, res) => {
    try {
        const { userId } = req.body;
        await CommunityUser.findByIdAndUpdate(userId, { isBanned: true });
        return res.json({ success: true });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

export default router;