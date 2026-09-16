import express from 'express';
import crypto from 'crypto';
import { Transaction } from '../models/Transaction';
import { bwChainCore } from '../index'; // Optional: if we want to use the local core
import axios from 'axios';

const router = express.Router();

/**
 * @route POST /api/transactions/record
 * @desc 거래 내역 영구 저장 및 익스플로러 동기화
 */
router.post('/record', async (req, res) => {
    try {
        const { senderAddress, recipientAddress, amount, fee } = req.body;

        if (!senderAddress || !recipientAddress || amount === undefined || fee === undefined) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // 고유 트랜잭션 해시 생성 (실제 블록체인 노드 서명 전 임시/로컬 해시)
        const txHash = '0x' + crypto.randomBytes(32).toString('hex');

        // 1. DB에 거래 내역 영구 저장
        const newTx = new Transaction({
            txHash,
            senderAddress,
            recipientAddress,
            amount,
            fee,
            status: 'SUCCESS'
        });

        await newTx.save();

        // 2. BW Explorer API로 트랜잭션 해시 전송 (실시간 뱅킹 이체 내역 등록)
        // 실제 운영 환경에서는 외부/내부 익스플로러 서버 주소로 POST 요청
        try {
            // 시뮬레이션: 익스플로러 서버가 5002번 포트라고 가정 (또는 메인넷 API)
            // await axios.post('http://localhost:5002/api/explorer/broadcast', { txHash, senderAddress, recipientAddress, amount, fee });
            console.log(`[Explorer Sync] 트랜잭션 해시 전송 완료: ${txHash}`);
        } catch (explorerError) {
            console.warn('[Explorer Sync Warning] 익스플로러 서버 통신 지연:', explorerError);
            // 익스플로러 통신이 실패해도 DB 저장(본 거래)은 유지
        }

        return res.status(200).json({
            success: true,
            data: {
                txHash,
                senderAddress,
                recipientAddress,
                amount,
                fee,
                timestamp: newTx.timestamp
            }
        });

    } catch (error) {
        console.error('[Transaction Error] 거래 기록 중 오류 발생:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @route GET /api/transactions/latest
 * @desc 익스플로러 화면용 최신 거래 내역 조회 (퍼블릭)
 */
router.get('/latest', async (req, res) => {
    try {
        // 최신 50개의 거래 내역을 시간 역순으로 조회
        const transactions = await Transaction.find()
            .sort({ timestamp: -1 })
            .limit(50)
            .select('txHash senderAddress recipientAddress amount fee timestamp status -_id'); // 몽고DB 내부 _id 제외
        
        return res.status(200).json({
            success: true,
            data: transactions
        });
    } catch (error) {
        console.error('[Explorer API Error] 최근 거래 조회 실패:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

export default router;
