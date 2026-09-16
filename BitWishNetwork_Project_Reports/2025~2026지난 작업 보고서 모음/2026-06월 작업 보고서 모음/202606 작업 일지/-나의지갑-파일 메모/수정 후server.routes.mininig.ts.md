import MiningState from '../models/MiningState';
import User from '../models/User';
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
// 사용자 상태 조회 (초기 접속 시) - [실시간 시간 및 KYC 날짜 무결성 보정 패치]
router.get('/status/:walletAddress', async (req, res) => {
    const { walletAddress } = req.params;

    // 기존 Express의 res.json 전송 함수를 임시 가로챕니다.
    const originalJson = res.json.bind(res);

    res.json = async function (body: any) {
        try {
            if (body && body.success && body.data) {
                // 1. DB에서 해당 지갑의 실제 마이닝 시작 시각(miningStartTime)을 가져옵니다.
                const state = await MiningState.findOne({
                    walletAddress: { $regex: new RegExp("^" + walletAddress + "$", "i") }
                });

                // 2. DB에서 해당 지갑의 실제 KYC 승인 날짜(kycVerifiedDate)를 가져옵니다.
                const userObj = await User.findOne({
                    walletAddress: { $regex: new RegExp("^" + walletAddress + "$", "i") }
                });

                // 3. 기존 컨트롤러의 가짜 기본값 대신 실제 데이터베이스 참값을 실시간 매핑합니다.
                body.data.miningStartedAt = state && state.miningStartTime ? state.miningStartTime.toISOString() : '';
                body.data.kycVerifiedDate = userObj && userObj.kycVerifiedDate ? userObj.kycVerifiedDate.toISOString() : null;
            }
        } catch (err) {
            console.error('[API Interceptor Error] 시간 무결성 보정 실패:', err);
        }
        return originalJson(body);
    };

    return miningController.getUserStatus(req, res);
});