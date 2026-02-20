
import express from 'express';
import { body, validationResult } from 'express-validator';
import MiningState from '../models/MiningState';
import BonusRecord from '../models/BonusRecord';

const router = express.Router();

// 유틸리티: 날짜 범위 포맷팅 (YYYY년 MM월 DD일 am00:00:00~pm23:59:59)
function formatDateRange(dateString: string | Date): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    return `${year}년 ${month}월 ${day}일 am00:00:00~${year}년 ${month}월 ${day}일 pm23:59:59까지`;
}

// GET /api/admin/mining/:walletAddress
router.get('/mining/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;

        // 실제 DB 조회
        const miningState = await MiningState.findOne({ walletAddress });

        // 데이터가 없으면 없는 대로 null 반환 (임의 생성 금지)
        if (!miningState) {
            return res.json({
                success: true,
                data: null,
                message: 'No mining record found'
            });
        }

        return res.json({
            success: true,
            data: {
                walletAddress,
                isMining: miningState.isMining,
                miningStartTime: miningState.miningStartTime,
                accumulatedReward: parseFloat(miningState.accumulatedReward),
                lastSyncTime: miningState.lastSyncTime
            }
        });
    } catch (error) {
        console.error('Admin mining search error:', error);
        return res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다'
        });
    }
});

// POST /api/admin/mining/reset
router.post('/mining/reset', [
    body('walletAddress').notEmpty().withMessage('지갑 주소는 필수입니다')
], async (req: express.Request, res: express.Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { walletAddress } = req.body;

        console.log(`[Admin] Resetting mining data for wallet: ${walletAddress}`);

        // 1. MiningState 초기화
        const miningUpdate = await MiningState.findOneAndUpdate(
            { walletAddress },
            {
                $set: {
                    isMining: false,
                    miningStartTime: null,
                    lastSyncTime: new Date(),
                    accumulatedReward: "0",
                    isAttendanceActive: false,
                    attendanceDate: null,
                    referralCount: 0,
                    referralBonusRate: "0",
                    currentTotalRate: "0.25" // 기본값 복구
                }
            },
            { new: true }
        );

        // 2. BonusRecord 초기화
        const bonusUpdate = await BonusRecord.findOneAndUpdate(
            { walletAddress },
            {
                $set: {
                    referralBonusStorage: "0",
                    referralRewardStorage: "0",
                    referralList: [],
                    attendanceHistory: []
                }
            },
            { new: true }
        );

        if (!miningUpdate) {
            return res.status(404).json({
                success: false,
                message: '해당 지갑의 마이닝 상태를 찾을 수 없습니다'
            });
        }

        return res.json({
            success: true,
            message: '마이닝 데이터가 성공적으로 초기화되었습니다 (DB 적용 완료)',
            data: {
                walletAddress,
                resetTime: new Date().toISOString(),
                miningState: miningUpdate,
                bonusRecord: bonusUpdate
            }
        });

    } catch (error) {
        console.error('Admin mining reset error:', error);
        return res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다: ' + (error as any).message
        });
    }
});

// GET /api/admin/attendance/:walletAddress
router.get('/attendance/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const { year, month } = req.query;

        // 실제 DB 조회 (BonusRecord)
        const bonusRecord = await BonusRecord.findOne({ walletAddress });

        const records = [];
        let totalBonus = 0;

        const lastDay = new Date(Number(year), Number(month), 0).getDate();
        const attendanceSet = new Set();
        const attendanceMap = new Map();

        if (bonusRecord && bonusRecord.attendanceHistory) {
            bonusRecord.attendanceHistory.forEach((record: any) => {
                const d = new Date(record.checkInTime);
                if (d.getFullYear() === Number(year) && (d.getMonth() + 1) === Number(month)) {
                    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    attendanceSet.add(dateStr);
                    attendanceMap.set(dateStr, record);
                }
            });
        }

        // 달력 생성
        for (let i = 1; i <= lastDay; i++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const isAttended = attendanceSet.has(dateStr);
            const detail = attendanceMap.get(dateStr);

            if (isAttended) {
                const bonus = 1.25;
                totalBonus += bonus;

                const checkInTime = new Date(detail.checkInTime);
                const timeStr = checkInTime.toTimeString().split(' ')[0];

                records.push({
                    date: dateStr,
                    fullDate: `${year}년 ${String(month).padStart(2, '0')}월 ${String(i).padStart(2, '0')}일 ${timeStr}`,
                    bonusAmount: bonus.toFixed(2),
                    status: 'COMPLETED',
                    isActive: true
                });
            } else {
                records.push({
                    date: dateStr,
                    fullDate: `${year}년 ${String(month).padStart(2, '0')}월 ${String(i).padStart(2, '0')}일 -`,
                    bonusAmount: '0.00',
                    status: 'MISSED',
                    isActive: false
                });
            }
        }

        // 오늘 출석 여부 (보너스 기록 기준)
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const isTodayActive = attendanceSet.has(todayStr);

        return res.json({
            success: true,
            data: {
                walletAddress,
                year,
                month,
                isActive: isTodayActive,
                totalBonus: totalBonus.toFixed(2),
                records: records.reverse()
            }
        });

    } catch (error) {
        console.error('Admin attendance search error:', error);
        return res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다'
        });
    }
});

// GET /api/admin/referral/all (전체 조회 - Aggregation)
router.get('/referral/all', async (req, res) => {
    try {
        const { year, month } = req.query;

        // Aggregation Pipeline 시작
        const pipeline: any[] = [
            { $unwind: "$referralList" }, // 배열 풀기
            {
                $lookup: { // MiningState 조인
                    from: "miningstates",
                    localField: "referralList.childWalletAddress",
                    foreignField: "walletAddress",
                    as: "miningInfo"
                }
            },
            {
                $project: {
                    referrerAddress: "$walletAddress",
                    referredAddress: "$referralList.childWalletAddress",
                    joinedDate: "$referralList.joinedAt",
                    kycStatus: "$referralList.isKycVerified",
                    isMining: { $arrayElemAt: ["$miningInfo.isMining", 0] },
                    accumulatedBonus: "$referralList.accumulatedBonus"
                }
            },
            { $sort: { joinedDate: -1 } } // 최신순 정렬
        ];

        // 날짜 필터링 (옵션)
        if (year && month) {
            const targetYear = parseInt(year as string);
            const targetMonth = parseInt(month as string);
            const startDate = new Date(targetYear, targetMonth - 1, 1);
            const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

            pipeline.push({
                $match: {
                    joinedDate: { $gte: startDate, $lte: endDate }
                }
            });
        }

        const results = await BonusRecord.aggregate(pipeline);

        const totalBonusSum = results.reduce((sum, item) => {
            return sum + parseFloat(item.accumulatedBonus || '0');
        }, 0);

        return res.json({
            success: true,
            data: {
                totalReferrals: results.length,
                monthlyTotal: totalBonusSum.toFixed(8),
                records: results.map(record => ({
                    referrerAddress: record.referrerAddress,
                    referredAddress: record.referredAddress,
                    joinedDate: record.joinedDate,
                    dateRange: formatDateRange(record.joinedDate),
                    dailyMiningAmount: parseFloat(record.accumulatedBonus || '0').toFixed(8),
                    kycStatus: record.kycStatus ? 'APPROVED' : 'NOT_APPLIED',
                    isMining: !!record.isMining, // boolean 처리
                    date: new Date(record.joinedDate).toISOString().split('T')[0]
                }))
            }
        });
    } catch (error) {
        console.error('Admin all referral status error:', error);
        return res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다'
        });
    }
});

// GET /api/admin/referral/:walletAddress (개별 검색 - Aggregation)
router.get('/referral/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const { year, month } = req.query;

        const pipeline: any[] = [
            { $unwind: "$referralList" },
            {
                $lookup: {
                    from: "miningstates",
                    localField: "referralList.childWalletAddress",
                    foreignField: "walletAddress",
                    as: "miningInfo"
                }
            },
            {
                $project: {
                    referrerAddress: "$walletAddress",
                    referredAddress: "$referralList.childWalletAddress",
                    joinedDate: "$referralList.joinedAt",
                    kycStatus: "$referralList.isKycVerified",
                    isMining: { $arrayElemAt: ["$miningInfo.isMining", 0] },
                    accumulatedBonus: "$referralList.accumulatedBonus"
                }
            },
            {
                $match: {
                    $or: [
                        { referrerAddress: walletAddress },
                        { referredAddress: walletAddress }
                    ]
                }
            },
            { $sort: { joinedDate: -1 } }
        ];

        if (year && month) {
            const targetYear = parseInt(year as string);
            const targetMonth = parseInt(month as string);
            const startDate = new Date(targetYear, targetMonth - 1, 1);
            const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

            pipeline.push({
                $match: {
                    joinedDate: { $gte: startDate, $lte: endDate }
                }
            });
        }

        const filteredRecords = await BonusRecord.aggregate(pipeline);

        const totalBonusSum = filteredRecords.reduce((sum, item) => sum + parseFloat(item.accumulatedBonus || '0'), 0);

        return res.json({
            success: true,
            data: {
                walletAddress,
                year,
                month,
                totalReferrals: filteredRecords.length,
                monthlyTotal: totalBonusSum.toFixed(8),
                records: filteredRecords.map(record => ({
                    referrerAddress: record.referrerAddress,
                    referredAddress: record.referredAddress,
                    joinedDate: record.joinedDate,
                    dailyMiningAmount: parseFloat(record.accumulatedBonus || '0').toFixed(8),
                    kycStatus: record.kycStatus ? 'APPROVED' : 'NOT_APPLIED',
                    isMining: !!record.isMining,
                    date: new Date(record.joinedDate).toISOString().split('T')[0],
                    dateRange: formatDateRange(record.joinedDate)
                }))
            }
        });

    } catch (error) {
        console.error('Admin referral search error:', error);
        return res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다'
        });
    }
});

export default router;

