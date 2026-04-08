import express from 'express';
import { miningController } from '../controllers/MiningController';

const router = express.Router();

// 마이닝 시작
router.post('/start', (req, res) => miningController.startMining(req, res));

// 마이닝 정지
router.post('/stop', (req, res) => miningController.stopMining(req, res));

// 마이닝 데이터 동기화 (30초 주기)
router.post('/sync', (req, res) => miningController.syncMiningData(req, res));

// 사용자 상태 조회 (초기 접속 시)
router.get('/status/:walletAddress', (req, res) => miningController.getUserStatus(req, res));

/**
 * [최종복구] 월별 채굴 보상 내역 조회 (나의 지갑용)
 * 진짜 DB (bitwish_mining)의 MonthlySettlement 컬렉션에서 데이터를 가져옵니다.
 */
router.get('/history/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const MonthlySettlement = require('../models/MonthlySettlement').default;
        
        // 지갑 주소 대소문자 무시 검색 (데이터 정밀 복구)
        const history = await MonthlySettlement.find({ 
            walletAddress: { $regex: new RegExp("^" + walletAddress + "$", "i") } 
        }).sort({ year: -1, month: -1 });

        res.json({ success: true, history });
    } catch (error) {
        console.error('Mining history restore error:', error);
        res.json({ success: false, history: [] });
    }
});

export default router;
