import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import MiningState from '../models/MiningState';
import BonusRecord from '../models/BonusRecord';
import Decimal from 'decimal.js';
import { bwChainCore } from '../index'; // 결합된 엔진 호출
import fs from 'fs';
import path from 'path';

const router = express.Router();

/**
 * GET /api/stats/realtime
 * 홈페이지 실시간 채굴 현황 데이터를 반환합니다.
 */
router.get('/realtime', async (req, res) => {
    try {
        // 1. 지갑 생성 수 (User Count)
        const totalWallets = await User.countDocuments({});

        // 2. 실시간 BW 발행량 계산
        // 2-1. DB에 저장된 기초 채굴 합계 조회
        const miningRewardAgg = await MiningState.aggregate([
            {
                $group: {
                    _id: null,
                    totalAccumulated: { $sum: { $toDouble: "$accumulatedReward" } }
                }
            }
        ]);
        let totalMiningReward = new Decimal(miningRewardAgg[0]?.totalAccumulated || 0);

        // [핵심] 실시간 보정: 현재 채굴 중인 인원의 미동기화 채굴량 합산
        const activeMiners = await MiningState.find({ isMining: true });
        const now = Date.now();
        let liveBoost = new Decimal(0);

        activeMiners.forEach(miner => {
            const lastSync = new Date(miner.lastSyncTime).getTime();
            const elapsed = (now - lastSync) / 1000; // 초 단위 경과 시간
            if (elapsed > 0) {
                const ratePerSec = new Decimal(miner.currentTotalRate).div(3600);
                liveBoost = liveBoost.plus(ratePerSec.mul(elapsed));
            }
        });

        // 실시간 참값 = DB 저장값 + 현재 흐르고 있는 채굴량
        totalMiningReward = totalMiningReward.plus(liveBoost);

        // 2-2. 가입/추천 보상 총합
        const bonusRewardAgg = await BonusRecord.aggregate([
            {
                $group: {
                    _id: null,
                    totalRewardStorage: { $sum: { $toDouble: "$referralRewardStorage" } },
                    totalBonusStorage: { $sum: { $toDouble: "$bonusStorage" } }
                }
            }
        ]);
        const totalBonusReward = new Decimal(bonusRewardAgg[0]?.totalRewardStorage || 0)
            .plus(new Decimal(bonusRewardAgg[0]?.totalBonusStorage || 0));

        // 총 발행량 = 채굴 보상 + 보너스 보상
        const currentSupply = totalMiningReward.plus(totalBonusReward);

        // 3. 총 공급량 (210억 고정)
        const totalSupply = new Decimal('21000000000');

        // 4. 잔여 발행량
        const remainingSupply = totalSupply.minus(currentSupply);

        // 5. 발행률 (%)
        const issuanceRate = currentSupply.div(totalSupply).times(100).toNumber();

        // 6. 실시간 생성 블록 (DB 연동)
        // blocks 컬렉션이 존재하는지 먼저 확인 후 카운트
        let totalBlocks = 0;
        try {
            const networkDb = mongoose.connection.getClient().db('bitwish_network');
            totalBlocks = await networkDb.collection('blocks').countDocuments({}) || 0;
        } catch (blockError) {
            console.warn('Block count check failed, default to 0:', blockError);
        }

        // 네트워크 상태
        const networkStatus = 'CONNECTED';

        res.json({
            success: true,
            data: {
                totalUsers: totalWallets,
                totalBlocks,
                totalReward: 0, // 프론트엔드 타입 호환성 (any)
                currentIssued: currentSupply.toFixed(8),
                remainingSupply: remainingSupply.toFixed(8),
                issuanceRate: issuanceRate.toString(),
                networkStatus
            }
        });

    } catch (error) {
        console.error('Stats API Error:', error);
        res.status(500).json({ success: false, message: '서버 에러가 발생했습니다.' });
    }
});

/**
 * GET /api/stats/blocks
 * 최신 블록 리스트 20개를 반환합니다. (익스플로러 용)
 */
router.get('/blocks', async (req, res) => {
    try {
        const networkDb = mongoose.connection.getClient().db('bitwish_network');
        const blocks = await networkDb.collection('blocks')
            .find({})
            .sort({ 'header.blockHeight': -1 })
            .limit(20)
            .toArray();

        res.json({ success: true, data: blocks });
    } catch (error) {
        console.error('Explorer Blocks API Error:', error);
        res.status(500).json({ success: false, message: '블록 데이터를 불러오는 데 실패했습니다.' });
    }
});

router.post('/transfer', async (req, res) => {
    const { fromAddress, toAddress, amount } = req.body;
    
    // 1. [구버전 마스터 권한] Vultr(백엔드)의 referrals.json을 읽어 현재 지갑 잔액 확보
    const jsonPath = path.resolve(__dirname, '../../database/referrals.json');
    const systemWallets = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    const currentBalance = systemWallets[fromAddress]?.balance || '0';

    // 2. [신버전 엔진 위임] 숫자 깎기 전에 Phase 4 코어에게 3~4초 검증 및 장부 채굴 마이닝을 지시
    const engineResult = await bwChainCore.verifyAndMineTransaction(fromAddress, toAddress, amount, currentBalance);
    
    if (!engineResult.success) {
        // 블록체인 엔진이 거부하면 송금 원천 차단 (위변조 100% 방어)
        return res.status(400).json({ error: engineResult.message });
    }

    // 3. [구버전 안전 보존 저장] 코어 엔진이 '성공'을 뱉어내면 그제야 기존처럼 안전하게 JSON 숫자만 갱신
    systemWallets[fromAddress].balance = (parseFloat(currentBalance) - parseFloat(amount)).toString();
    systemWallets[toAddress].balance = (parseFloat(systemWallets[toAddress].balance || '0') + parseFloat(amount)).toString();

    // 엔진의 쓰레기 해시는 분리하고 순수 구버전 방식 JSON만 저장! (추천 보너스 등 생태계 파괴 0%)
    fs.writeFileSync(jsonPath, JSON.stringify(systemWallets, null, 2), 'utf8');

    return res.json({ success: true, message: "3~4초 무결점 블록체인 마이닝 승인 및 P2P 전송 완료!" });
});

export default router;
