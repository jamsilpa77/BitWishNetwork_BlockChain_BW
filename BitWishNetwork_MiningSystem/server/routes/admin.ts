/**
 * BitWishNetwork 관리자 API 라우트
 * 
 * 기능:
 * - 마이닝 데이터 조회
 * - 마이닝 데이터 초기화 (테스트용)
 */

import express from 'express';
import MiningState from '../models/MiningState';
import BonusRecord from '../models/BonusRecord';

const router = express.Router();

/**
 * GET /api/admin/mining/:walletAddress
 * 특정 지갑의 마이닝 정보 조회
 */
router.get('/mining/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;

        // MiningState에서 직접 조회
        const miningData = await MiningState.findOne({ walletAddress });

        if (miningData) {
            res.json({
                success: true,
                data: {
                    walletAddress: miningData.walletAddress,
                    isMining: miningData.isMining,
                    accumulatedReward: miningData.accumulatedReward,
                    miningStartTime: miningData.miningStartTime,
                    lastSyncTime: miningData.lastSyncTime,
                    currentBaseRate: miningData.currentBaseRate,
                    currentTotalRate: miningData.currentTotalRate
                }
            });
        } else {
            // 데이터 없어도 200 OK, success: false
            res.json({
                success: false,
                message: '마이닝 기록이 없습니다',
                walletAddress
            });
        }
    } catch (error) {
        console.error('Admin mining status error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다'
        });
    }
});

/**
 * POST /api/admin/mining/reset
 * 마이닝 데이터 초기화 (테스트용)
 * upsert: true로 데이터 없어도 생성 후 초기화
 */
router.post('/mining/reset', async (req, res) => {
    try {
        const { walletAddress } = req.body;

        if (!walletAddress) {
            return res.json({
                success: false,
                message: '지갑 주소가 필요합니다'
            });
        }

        // upsert: true → 없으면 생성, 있으면 업데이트
        const result = await MiningState.findOneAndUpdate(
            { walletAddress },
            {
                walletAddress,
                isMining: false,
                miningStartTime: null,
                lastSyncTime: new Date(),
                accumulatedReward: '0.0',
                currentBaseRate: '0.25',
                currentTotalRate: '0.25'
            },
            { upsert: true, new: true }
        );

        return res.json({
            success: !!result,
            message: result ? '마이닝 데이터가 초기화되었습니다' : '초기화 실패',
            data: result
        });
    } catch (error) {
        console.error('Admin mining reset error:', error);
        return res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다'
        });
    }
});

/**
 * GET /api/admin/attendance/:walletAddress
 * 특정 지갑의 출석 보너스 현황 조회
 */
router.get('/attendance/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;

        // BonusRecord에서 출석 기록 조회
        const bonusRecord = await BonusRecord.findOne({ walletAddress });

        if (!bonusRecord) {
            return res.json({
                success: true,
                data: {
                    isActive: false,
                    records: []
                }
            });
        }

        // 오늘 날짜 확인
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

        // 오늘 출석 여부 확인
        const todayAttendance = bonusRecord.attendanceHistory.find(
            record => record.date === todayStr
        );
        const isActive = !!todayAttendance;

        // 최근 30일 출석 기록 정렬 (최신순)
        const sortedRecords = [...bonusRecord.attendanceHistory]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 30);

        // 응답 데이터 포맷팅
        const records = sortedRecords.map(record => {
            const recordDate = new Date(record.date);
            return {
                year: recordDate.getFullYear(),
                month: recordDate.getMonth() + 1,
                day: recordDate.getDate(),
                bonusAmount: record.bonusRate || '0.05', // 5% 보너스율
                isActive: true
            };
        });

        return res.json({
            success: true,
            data: {
                isActive,
                records
            }
        });
    } catch (error) {
        console.error('Admin attendance status error:', error);
        return res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다'
        });
    }
});

export default router;
