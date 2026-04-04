import express from 'express';
import { userController } from '../controllers/UserController';
import User from '../models/User'; // [추가] 추천 코드 DB 저장을 위한 모델 임포트

const router = express.Router();

// 사용자 등록 (지갑 생성)
router.post('/register', (req, res) => userController.register(req, res));

// 로그인 (지갑 복구/인증)
router.post('/login', (req, res) => userController.login(req, res));

/**
 * POST /api/user/code
 * 추천인 코드를 서버 DB(User 컬렉션)에 영구 저장 (Step 2 작업)
 */
router.post('/code', async (req, res) => {
    const { walletAddress, myReferralCode } = req.body;
    try {
        console.log(`[User] Syncing referral code for ${walletAddress}: ${myReferralCode}`);

        const updateResult = await User.findOneAndUpdate(
            { walletAddress: walletAddress },
            { $set: { myReferralCode: myReferralCode } },
            { new: true }
        );

        if (!updateResult) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.json({ success: true, message: 'Referral code synced to server' });
    } catch (error) {
        console.error('[User] Code sync failure:', error);
        return res.status(500).json({ success: false, message: 'Server sync error' });
    }
});

// 추천인 코드 검증
router.get('/referral/:code', (req, res) => userController.checkReferralCode(req, res));

export default router;
