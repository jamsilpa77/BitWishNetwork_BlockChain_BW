import express from 'express';
import { userController } from '../controllers/UserController';

const router = express.Router();

// 사용자 등록 (지갑 생성)
router.post('/register', (req, res) => userController.register(req, res));

// 로그인 (지갑 복구/인증)
router.post('/login', (req, res) => userController.login(req, res));

// 추천인 코드 검증
router.get('/referral/:code', (req, res) => userController.checkReferralCode(req, res));

export default router;
