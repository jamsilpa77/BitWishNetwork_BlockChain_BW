/**
 * BitWishNetwork Mining System
 * Ranking API Routes
 */

import express from 'express';
import { RankingService } from '../services/RankingService';
import rateLimit from 'express-rate-limit';

const router = express.Router();

/**
 * ✅ 8단계: 랭킹 검색 API 보안 강화 (Rate Limiting)
 * 무분별한 지갑 주소 수집 및 서버 과부하 공격 차단
 */
const rankingSearchLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1분 기준
    max: 20, // IP당 분당 최대 20회 요청 제한
    message: {
        success: false,
        message: 'Too many requests, please try again after a minute.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * [GET] /api/ranking/top50
 * 실시간 전역 랭킹 상위 50명 조회
 */
router.get('/top50', async (req, res) => {
    try {
        const rankings = await RankingService.getTopRankings(50);
        return res.json({
            success: true,
            rankings
        });
    } catch (error) {
        console.error('Failed to fetch top rankings:', error);
        return res.status(500).json({
            success: false,
            message: '랭킹 데이터를 불러오는 중 오류가 발생했습니다.'
        });
    }
});

/**
 * [GET] /api/ranking/user/:walletAddress
 * 특정 유저의 순위 및 상세 정보 조회
 */
router.get('/user/:walletAddress', rankingSearchLimiter, async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const result = await RankingService.getUserRank(walletAddress);
        
        if (!result) {
            return res.status(404).json({
                success: false,
                message: '유저 순위 정보를 찾을 수 없습니다.'
            });
        }

        return res.json({
            success: true,
            rank: result.rank,
            totalAmount: result.totalAmount
        });
    } catch (error) {
        console.error('Failed to fetch user rank:', error);
        return res.status(500).json({
            success: false,
            message: '유저 순위 정보를 조회하는 중 오류가 발생했습니다.'
        });
    }
});

export default router;
