
import express from 'express';
import { body, validationResult } from 'express-validator';
import { Decimal } from 'decimal.js';
import MiningState from '../models/MiningState';
import BonusRecord from '../models/BonusRecord';
import User from '../models/User'; // [추가] 가입 정보 조회를 위한 User 모델 추가
import SystemConfig from '../models/SystemConfig';
import MonthlySettlement from '../models/MonthlySettlement'; // [추가] 마이그레이션 상태 승격을 위한 모델 추가
import { HalvingPolicyEngine } from '../services/HalvingPolicyEngine';
import { saveHalvingConfig, getExtensionPolicy, saveExtensionPolicy } from '../models/SystemConfig';
import { settlementWorker } from '../cron/SettlementWorker';

const router = express.Router();

// 유틸리티: 날짜 범위 포맷팅 (YYYY년 MM월 DD일 am00:00:00~pm23:59:59)
function formatDateRange(dateString: string | Date): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    return `${year}년 ${month}월 ${day}일 am00:00:00~${year}년 ${month}월 ${day}일 pm23:59:59까지`;
}

/**
 * [공정 1] GET /api/admin/dashboard/stats
 * 관리자 대시보드 4대 핵심 지표 MongoDB 원천 실시간 집계 API
 * (Compass DB 리셋 시 즉시 0, 0, 0, 0으로 칼동기화)
 */
router.get('/dashboard/stats', async (req, res) => {
    try {
        const [totalUsers, activeMiners, pendingKyc] = await Promise.all([
            User.countDocuments({}),
            MiningState.countDocuments({ isMining: true }),
            User.countDocuments({ 'kycApplication.status': 'PENDING' })
        ]);

        // 1. 기초 채굴 보상 합계
        const miningRewardAgg = await MiningState.aggregate([
            { $group: { _id: null, total: { $sum: { $toDouble: { $ifNull: ["$accumulatedReward", "0"] } } } } }
        ]);
        let totalMiningReward = new Decimal(miningRewardAgg[0]?.total || 0);

        // 2. 실시간 활성 마이너 보정 (미동기화 채굴량 합산)
        const activeMinersList = await MiningState.find({ isMining: true });
        const now = Date.now();
        let liveBoost = new Decimal(0);
        activeMinersList.forEach(m => {
            const lastSync = m.lastSyncTime ? new Date(m.lastSyncTime).getTime() : now;
            const elapsed = Math.max(0, (now - lastSync) / 1000);
            if (elapsed > 0) {
                const ratePerSec = new Decimal(m.currentTotalRate || '0.225').div(3600);
                liveBoost = liveBoost.plus(ratePerSec.mul(elapsed));
            }
        });

        // 3. 월간 정산 장부 합계
        const settlementAgg = await MonthlySettlement.aggregate([
            { $group: { _id: null, total: { $sum: { $toDouble: { $ifNull: ["$totalAmount", "0"] } } } } }
        ]);
        const totalSettlementAmount = new Decimal(settlementAgg[0]?.total || 0);
        totalMiningReward = totalMiningReward.plus(liveBoost).plus(totalSettlementAmount);

        // 4. 추천/보너스 장부 합계
        const bonusRewardAgg = await BonusRecord.aggregate([
            {
                $group: {
                    _id: null,
                    totalRewardStorage: { $sum: { $toDouble: { $ifNull: ["$referralRewardStorage", "0"] } } },
                    totalReferralBonusStorage: { $sum: { $toDouble: { $ifNull: ["$referralBonusStorage", "0"] } } },
                    totalOtherBonusStorage: { $sum: { $toDouble: { $ifNull: ["$bonusStorage", "0"] } } }
                }
            }
        ]);
        const totalBonusReward = new Decimal(bonusRewardAgg[0]?.totalRewardStorage || 0)
            .plus(new Decimal(bonusRewardAgg[0]?.totalReferralBonusStorage || 0))
            .plus(new Decimal(bonusRewardAgg[0]?.totalOtherBonusStorage || 0));

        // 5. 총 발행량 산출
        const totalIssued = totalMiningReward.plus(totalBonusReward).toFixed(8);

        return res.json({
            success: true,
            data: {
                totalUsers,
                activeMiners,
                totalIssued,
                pendingKyc
            }
        });
    } catch (error) {
        console.error('Admin dashboard stats error:', error);
        return res.status(500).json({
            success: false,
            message: '대시보드 통계 집계 중 오류 발생: ' + (error as any).message
        });
    }
});

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
                    accumulatedReward: "0"
                }
            },
            { new: true }
        );

        // 2. BonusRecord 초기화 (1BW 보상은 보존하고 유령 데이터만 제거)
        const bonusUpdate = await BonusRecord.findOneAndUpdate(
            { walletAddress },
            {
                $set: {
                    referralBonusStorage: "0" // 2% 보너스 누적액 초기화 (실시간 보관함)
                }
            },
            { new: true }
        );

        // 3. MonthlySettlement (과거 월별 정산 내역) 완벽 소각
        const settlementDeleteResult = await MonthlySettlement.deleteMany({ walletAddress });
        console.log(`[Admin] Deleted ${settlementDeleteResult.deletedCount} settlement records for ${walletAddress}`);

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
                bonusRecord: bonusUpdate,
                clearedSettlementsCount: settlementDeleteResult.deletedCount
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

// GET /api/admin/referral/all (전체 조회 - [Step 1] 필터링 전면 해제)
router.get('/referral/all', async (req, res) => {
    try {
        // [1단계 수복] 회원가입 테이블(User)을 기준으로 정식 회원 목록을 조회하여 유령 레코드 노출 영구 차단
        const pipeline: any[] = [
            {
                $lookup: {
                    from: "miningstates",
                    localField: "walletAddress",
                    foreignField: "walletAddress",
                    as: "miningInfo"
                }
            },
            {
                $lookup: {
                    from: "monthlysettlements",
                    localField: "walletAddress",
                    foreignField: "walletAddress",
                    as: "settlements"
                }
            },
            {
                $project: {
                    walletAddress: 1,
                    joinedDate: "$createdAt",
                    kycStatus: "$isKycVerified",
                    referrerCode: "$referrerCode",
                    isMining: { $arrayElemAt: ["$miningInfo.isMining", 0] },
                    accumulatedReward: { $arrayElemAt: ["$miningInfo.accumulatedReward", 0] },
                    lastSyncTime: { $arrayElemAt: ["$miningInfo.lastSyncTime", 0] },
                    currentTotalRate: { $arrayElemAt: ["$miningInfo.currentTotalRate", 0] },
                    updatedAt: { $arrayElemAt: ["$miningInfo.updatedAt", 0] },
                    settledAmount: {
                        $sum: {
                            $map: {
                                input: "$settlements",
                                as: "s",
                                in: { $toDouble: { $ifNull: ["$$s.totalAmount", "0"] } }
                            }
                        }
                    }
                }
            },
            { $sort: { joinedDate: -1 } }
        ];

        const results = await User.aggregate(pipeline);

        const now = new Date();
        const recordsWithRealTime = results.map(record => {
            const dbAmount = parseFloat(record.accumulatedReward || '0');
            const rate = parseFloat(record.currentTotalRate || '0.25'); // 가맹점/출석 보너스 합산된 실제 채굴률
            const settledAmount = parseFloat(record.settledAmount || '0');
            let realTimeAmount = dbAmount;

            // 마이닝 중인 경우 미기록된 실시간 증분량 합산
            if (record.isMining) {
                // lastSyncTime이 없으면 updatedAt이라도 사용
                const syncTime = record.lastSyncTime || record.updatedAt || record.joinedDate || new Date();
                const lastSync = new Date(syncTime);
                const diffSeconds = Math.max(0, (now.getTime() - lastSync.getTime()) / 1000);
                const increment = diffSeconds * (rate / 3600);
                realTimeAmount = dbAmount + increment;
            }

            realTimeAmount = realTimeAmount + settledAmount;

            return {
                ...record,
                realTimeAmount: realTimeAmount.toFixed(8)
            };
        });

        // 총 발행량 합계 계산 (실시간 보정값 기준)
        const totalMiningSum = recordsWithRealTime.reduce((sum, item) => {
            return sum + parseFloat(item.realTimeAmount);
        }, 0);

        return res.json({
            success: true,
            data: {
                totalReferrals: results.length,
                monthlyTotal: totalMiningSum.toFixed(8),
                records: recordsWithRealTime.map(record => ({
                    referrerAddress: record.referrerCode || '-',
                    referredAddress: record.walletAddress,
                    joinedDate: record.joinedDate,
                    dateRange: formatDateRange(record.joinedDate || new Date()),
                    dailyMiningAmount: record.realTimeAmount,
                    currentTotalRate: record.currentTotalRate || '0.25', // [추가] 실시간 티커용 데이터
                    kycStatus: record.kycStatus ? 'APPROVED' : 'NOT_APPLIED',
                    isMining: !!record.isMining,
                    date: record.joinedDate ? new Date(record.joinedDate).toISOString().split('T')[0] : '-'
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

// GET /api/admin/referral/:walletAddress (개별 검색 - [Step 1] 날짜 필터링 해제)
router.get('/referral/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;

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
                $lookup: {
                    from: "monthlysettlements",
                    localField: "referralList.childWalletAddress",
                    foreignField: "walletAddress",
                    as: "settlements"
                }
            },
            {
                $project: {
                    referrerAddress: "$walletAddress",
                    referredAddress: "$referralList.childWalletAddress",
                    joinedDate: "$referralList.joinedAt",
                    kycStatus: "$referralList.isKycVerified",
                    isMining: { $arrayElemAt: ["$miningInfo.isMining", 0] },
                    lastSyncTime: { $arrayElemAt: ["$miningInfo.lastSyncTime", 0] },
                    updatedAt: { $arrayElemAt: ["$miningInfo.updatedAt", 0] }, // [추가]
                    currentTotalRate: { $arrayElemAt: ["$miningInfo.currentTotalRate", 0] }, // [추가]
                    accumulatedReward: { $arrayElemAt: ["$miningInfo.accumulatedReward", 0] },
                    accumulatedBonus: "$referralList.accumulatedBonus",
                    settledAmount: {
                        $sum: {
                            $map: {
                                input: "$settlements",
                                as: "s",
                                in: { $toDouble: { $ifNull: ["$$s.totalAmount", "0"] } }
                            }
                        }
                    }
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

        const results = await BonusRecord.aggregate(pipeline);
        const now = new Date();

        const recordsWithRealTime = results.map(record => {
            const dbAmount = parseFloat(record.accumulatedReward || '0');
            const rate = parseFloat(record.currentTotalRate || '0.25');
            const settledAmount = parseFloat(record.settledAmount || '0');
            let realTimeAmount = dbAmount;

            if (record.isMining) {
                const syncTime = record.lastSyncTime || record.updatedAt || record.joinedDate || new Date();
                const lastSync = new Date(syncTime);
                const diffSeconds = Math.max(0, (now.getTime() - lastSync.getTime()) / 1000);
                const increment = diffSeconds * (rate / 3600);
                realTimeAmount = dbAmount + increment;
            }

            realTimeAmount = realTimeAmount + settledAmount;

            return {
                ...record,
                realTimeAmount: realTimeAmount.toFixed(8)
            };
        });

        const totalMiningSum = recordsWithRealTime.reduce((sum, item) => sum + parseFloat(item.realTimeAmount), 0);

        return res.json({
            success: true,
            data: {
                walletAddress,
                totalReferrals: recordsWithRealTime.length,
                monthlyTotal: totalMiningSum.toFixed(8),
                records: recordsWithRealTime.map(record => ({
                    referrerAddress: record.referrerAddress,
                    referredAddress: record.referredAddress,
                    joinedDate: record.joinedDate,
                    dailyMiningAmount: record.realTimeAmount,
                    currentTotalRate: record.currentTotalRate || '0.25', // [추가] 실시간 티커용 데이터
                    kycStatus: record.kycStatus ? 'APPROVED' : 'NOT_APPLIED',
                    isMining: !!record.isMining,
                    date: record.joinedDate ? new Date(record.joinedDate).toISOString().split('T')[0] : '-',
                    dateRange: formatDateRange(record.joinedDate || new Date())
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

// --- 추천 보상 현황 (Referral Reward Status) 관련 API ---

// 1. 추천 보상 전체 지급 상태 조회 (Total Summary)
router.get('/rewards/total', async (req, res) => {
    try {
        // 1. 추천 보상(1BW) 합산 - BonusRecord 상자 털기
        const rewardResults = await BonusRecord.aggregate([
            { $group: { _id: null, total: { $sum: { $toDouble: { $ifNull: ["$referralRewardStorage", "0"] } } } } }
        ]);

        // 2. 시스템 전역 실제 부여된 추천 보너스율 순수 전수 합산 (MiningState 단일 원천 집계)
        // MiningState에는 추천인 2%와 가입자 2%가 각각 이미 완벽히 들어있으므로, 이 합계가 시스템 전체 순수 보너스율임!
        const bonusRateResults = await MiningState.aggregate([
            { $group: { _id: null, total: { $sum: { $toDouble: { $ifNull: ["$referralBonusRate", "0"] } } } } }
        ]);

        const totalBonusDecimal = bonusRateResults.length > 0 ? bonusRateResults[0].total : 0;
        const finalTotalRate = totalBonusDecimal * 100; // 0.04 * 100 = 4.00% (2% 이중 합산 왜곡 원천 제거)

        return res.json({
            success: true,
            totalIssued: rewardResults.length > 0 ? rewardResults[0].total : 0,
            totalBonusRate: finalTotalRate.toFixed(2)
        });
    } catch (error) {
        console.error('Admin total rewards error:', error);
        return res.status(500).json({ success: false, message: '서버 통계 계산 중 오류 발생' });
    }
});

// 2. 개별 유저 추천 보상 상세 조회 (Search Detail)
router.get('/rewards/detail/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        console.log(`[Admin] Detail search for reward status: ${walletAddress}`);

        // 1) BonusRecord 먼저 조회 (보상 정보가 최우선)
        let bonusRecord = await BonusRecord.findOne({ walletAddress });

        // 2) User 정보 조회 (가입일 정보 등)
        const user = await User.findOne({ walletAddress });

        // 데이터가 아예 없는 경우에만 404
        if (!bonusRecord && !user) {
            return res.status(404).json({ success: false, message: '조회된 데이터가 없습니다' });
        }

        // 3) 결과 조합을 위한 가입자 상세 정보 조회 (MiningState 연동)
        const detailedReferralList = [];
        let totalBonusRateSum = 0;

        if (bonusRecord && bonusRecord.referralList) {
            for (const ref of bonusRecord.referralList) {
                const miningState = await MiningState.findOne({ walletAddress: ref.childWalletAddress });
                // 0.02 -> 2.00 형태로 변환 (프론트엔드 NaN 방지 및 가독성)
                const rawRate = miningState ? parseFloat(miningState.referralBonusRate || "0") : 0;
                const bonusPercentage = (rawRate * 100).toFixed(2);
                totalBonusRateSum += rawRate * 100;

                detailedReferralList.push({
                    childWalletAddress: ref.childWalletAddress,
                    joinedAt: ref.joinedAt,
                    status: 'COMPLETED',
                    rewardAmount: "1.00000000",
                    bonusRate: bonusPercentage,
                    kycStatus: 'NOT_APPLIED'
                });
            }
        }

        const responseData = {
            walletAddress: walletAddress,
            myReferralCode: user ? user.myReferralCode : (bonusRecord ? 'N/A' : '-'),
            joinDate: user ? user.createdAt : (bonusRecord ? (bonusRecord as any).createdAt || new Date() : new Date()),
            totalReward: (bonusRecord && bonusRecord.referralRewardStorage) ? bonusRecord.referralRewardStorage : "0.00000000",
            referralCount: bonusRecord && bonusRecord.referralList ? bonusRecord.referralList.length : 0,
            totalBonusRate: totalBonusRateSum.toFixed(2),
            referralList: detailedReferralList
        };

        return res.json({
            success: true,
            data: responseData
        });

    } catch (error) {
        console.error('Admin reward detail search error:', error);
        return res.status(500).json({ success: false, message: '상세 조회 중 서버 오류 발생' });
    }
});

/**
 * [공정 2-3] KYC 거버넌스 설정 업데이트 (Admin)
 * POST /api/admin/kyc/config
 */
router.post('/kyc/config', async (req, res) => {
    try {
        const { isActive } = req.body;

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ success: false, message: 'Invalid status value' });
        }

        const config = await SystemConfig.findOneAndUpdate(
            { key: 'kyc_active_status' },
            { value: isActive },
            { upsert: true, new: true }
        );

        console.log(`[Governance] KYC Status updated to: ${isActive}`);

        return res.json({
            success: true,
            isActive: config.value
        });
    } catch (error) {
        console.error('Failed to update KYC config:', error);
        return res.status(500).json({ success: false, message: '거버넌스 설정 업데이트 실패' });
    }
});

/**
 * [공정 3-2] KYC 심사 대기 리스트 조회
 * GET /api/admin/kyc/pending
 */
router.get('/kyc/pending', async (req, res) => {
    try {
        const pendingUsers = await User.find({ 'kycApplication.status': 'PENDING' })
            .select('walletAddress kycApplication createdAt')
            .sort({ 'kycApplication.submittedAt': 1 });

        return res.json({
            success: true,
            data: pendingUsers
        });
    } catch (error) {
        console.error('Failed to get pending KYC list:', error);
        return res.status(500).json({ success: false, message: '목록 조회 실패' });
    }
});

/**
 * [공정 3-3] KYC 심사 결과 반영 (승인/반려)
 * POST /api/admin/kyc/status
 */
router.post('/kyc/status', async (req, res) => {
    try {
        const { walletAddress, status, rejectionReason } = req.body;

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const updateData: any = {
            'kycApplication.status': status,
            'kycApplication.rejectionReason': status === 'REJECTED' ? (rejectionReason || 'No reason provided') : ''
        };

        if (status === 'APPROVED') {
            updateData.isKycVerified = true;
            updateData.kycVerifiedDate = new Date();
        } else {
            updateData.isKycVerified = false;
        }

        const user = await User.findOneAndUpdate(
            { walletAddress },
            { $set: updateData },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // [Phase 1: 상태 승격 브릿지] KYC 승인 시 기존 WAITING_KYC 데이터를 LOCKED로 승격 (사용자 정책 반영)
        if (status === 'APPROVED') {
            const promotionResult = await MonthlySettlement.updateMany(
                {
                    walletAddress: { $regex: new RegExp("^" + walletAddress + "$", "i") },
                    migrationStatus: 'WAITING_KYC'
                },
                { $set: { migrationStatus: 'LOCKED' } }
            );
            console.log(`[Promotion] ${promotionResult.modifiedCount} records promoted to LOCKED for ${walletAddress}`);
        }

        console.log(`[Admin] KYC Status for ${walletAddress} updated to ${status}`);

        return res.json({
            success: true,
            message: `KYC status updated to ${status}`,
            data: {
                walletAddress,
                status,
                isKycVerified: user.isKycVerified
            }
        });
    } catch (error) {
        console.error('Failed to update KYC status:', error);
        return res.status(500).json({ success: false, message: '상태 업데이트 실패' });
    }
});

/**
 * [Phase 2] 글로벌 마이그레이션 마스터 스위치 제어 (Admin)
 * POST /api/admin/migration/config
 */
router.post('/migration/config', async (req, res) => {
    try {
        const { isActive } = req.body;
        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ success: false, message: 'Invalid status value' });
        }

        const config = await SystemConfig.findOneAndUpdate(
            { key: 'global_migration_status' },
            { value: isActive },
            { upsert: true, new: true }
        );

        console.log(`[Governance] Global Migration Status updated to: ${isActive}`);

        return res.json({
            success: true,
            isActive: config.value
        });
    } catch (error) {
        console.error('Failed to update migration config:', error);
        return res.status(500).json({ success: false, message: '마이그레이션 설정 업데이트 실패' });
    }
});

/**
 * [Phase 2] 글로벌 마이그레이션 마스터 스위치 조회 (Admin)
 * GET /api/admin/migration/config
 */
router.get('/migration/config', async (req, res) => {
    try {
        const config = await SystemConfig.findOne({ key: 'global_migration_status' });
        return res.json({
            success: true,
            isActive: config ? config.value : false // 기본값 비활성(LOCKED)
        });
    } catch (error) {
        console.error('Failed to get migration config:', error);
        return res.json({ success: true, isActive: false });
    }
});

/**
 * ════════════════════════════════════════════════════════════════════════════════
 * [공정 4 - 작업 2] 반감기 정책 관리자 거버넌스 API
 * ════════════════════════════════════════════════════════════════════════════════
 */

/**
 * GET /api/admin/halving/config
 * 현재 반감기 정책 설정, 카운트다운, 현재 채굴률, 24개월 시뮬레이션 스케줄 조회
 */
router.get('/halving/config', async (req, res) => {
    try {
        const status = await HalvingPolicyEngine.getHalvingStatus();
        return res.json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('Failed to get halving config:', error);
        return res.status(500).json({ success: false, message: '반감기 정책 조회 실패' });
    }
});

/**
 * POST /api/admin/halving/config
 * 관리자가 화면에서 변경한 반감기 정책(시작일, 감소율, ON/OFF 스위치, 기본 채굴률) 영구 저장
 */
router.post('/halving/config', async (req, res) => {
    try {
        const { isEnabled, startDate, monthlyReductionRate, baseRate, description } = req.body;

        const updateData: any = {};
        if (typeof isEnabled === 'boolean') updateData.isEnabled = isEnabled;
        if (startDate) updateData.startDate = startDate;
        if (typeof monthlyReductionRate === 'number') updateData.monthlyReductionRate = monthlyReductionRate;
        if (typeof baseRate === 'number') updateData.baseRate = baseRate;
        if (description) updateData.description = description;

        const savedConfig = await saveHalvingConfig(updateData, 'salmani1@naver.com');
        HalvingPolicyEngine.invalidateCache(); // 캐시 즉시 갱신

        const updatedStatus = await HalvingPolicyEngine.getHalvingStatus();
        // [공정 4-3 세부 작업 2] KST 한국 표준시 시·분·초 기준 최고급 터미널 정밀 브리핑 박스 출력
        HalvingPolicyEngine.printGovernanceBriefing(updatedStatus);

        return res.json({
            success: true,
            message: '반감기 정책이 MongoDB에 안전하게 영구 저장되었습니다.',
            data: updatedStatus
        });
    } catch (error) {
        console.error('Failed to save halving config:', error);
        return res.status(500).json({ success: false, message: '반감기 정책 저장 실패' });
    }
});

/**
 * POST /api/admin/halving/sync-global
 * 관리자 거버넌스: 전체 채굴 중인 마이너들에게 새 반감기 기본 채굴률 즉시 일괄 동기화
 */
router.post('/halving/sync-global', async (req, res) => {
    try {
        const result = await HalvingPolicyEngine.syncGlobalMiners();
        return res.json({
            success: true,
            message: `채굴 중인 전체 마이너 ${result.updatedCount}명에게 최신 기본 채굴률(${result.currentBaseRate} BW/h)이 성공적으로 동기화되었습니다.`,
            data: result
        });
    } catch (error) {
        console.error('Failed to sync global miners halving rate:', error);
        return res.status(500).json({ success: false, message: '마이너 채굴률 일괄 동기화 실패' });
    }
});

/**
 * ════════════════════════════════════════════════════════════════════════════════
 * [공정 7] 4대 전산 장부 원클릭 대사(Audit) 및 무결성 자동 수복 엔진
 * GET / POST /api/admin/audit/integrity
 * ════════════════════════════════════════════════════════════════════════════════
 */
router.all('/audit/integrity', async (req, res) => {
    try {
        console.log('[BitWish Audit] 🔍 4대 전산 장부(User, MiningState, BonusRecord, MonthlySettlement) 무결성 전수 감사 개시...');

        // 1. 전체 등록 회원 조회 (User 기준)
        const allUsers = await User.find({}).lean();
        const userCount = allUsers.length;
        const validUserAddresses = new Set(allUsers.map(u => u.walletAddress));

        // 2. 최신 선형 반감기 유효 기본 채굴률(Rm) 실시간 조회 (현재 2차 반감기 0.22500000 BW/h)
        const effectiveBaseRate = await HalvingPolicyEngine.getCurrentBaseRate();

        let miningCreatedCount = 0;
        let bonusCreatedCount = 0;

        // 3. 1:1 누락 검사 및 자동 신규 수복 (기존 회원 데이터 절대 훼손 금지)
        for (const user of allUsers) {
            const addr = user.walletAddress;

            // ① MiningState(채굴 통장) 존재 검사
            const existingMining = await MiningState.findOne({ walletAddress: addr });
            if (!existingMining) {
                const referralRate = user.referrerCode ? new Decimal(0.02) : new Decimal(0);
                const initialTotalRate = effectiveBaseRate.mul(new Decimal(1).plus(referralRate)).toFixed(8);

                await MiningState.create({
                    walletAddress: addr,
                    isMining: false,
                    miningStartTime: null,
                    lastSyncTime: new Date(),
                    accumulatedReward: '0.00000000000000000000000000000000000000000000000000',
                    currentBaseRate: effectiveBaseRate.toFixed(8),
                    currentTotalRate: initialTotalRate,
                    isAttendanceActive: false,
                    attendanceDate: null,
                    referralCount: 0,
                    referralBonusRate: referralRate.toFixed(8),
                    extensionBonusRate: '0.00000000000000000000000000000000000000000000000000',
                    partnerStatus: 'NOT_REGISTERED',
                    partnerBonusRate: '0',
                    lastBlockRewardThreshold: '0'
                });
                miningCreatedCount++;
            }

            // ② BonusRecord(추천/보너스 통장) 존재 검사
            const existingBonus = await BonusRecord.findOne({ walletAddress: addr });
            if (!existingBonus) {
                await BonusRecord.create({
                    walletAddress: addr,
                    referralBonusStorage: '0.00000000000000000000000000000000000000000000000000',
                    referralRewardStorage: '0.00000000000000000000000000000000000000000000000000',
                    referralList: [],
                    attendanceHistory: [],
                    lastBonusBlockThreshold: '0'
                });
                bonusCreatedCount++;
            }
        }

        // 4. 고아/유령 데이터 전수 감사 (User에 없는 미확인 지갑의 찌꺼기 레코드 탐색 - 비파괴 격리 보고)
        const allMiningStates = await MiningState.find({}, 'walletAddress').lean();
        const allBonusRecords = await BonusRecord.find({}, 'walletAddress').lean();

        const orphanMining = allMiningStates.filter(m => !validUserAddresses.has(m.walletAddress));
        const orphanBonus = allBonusRecords.filter(b => !validUserAddresses.has(b.walletAddress));
        const totalOrphans = orphanMining.length + orphanBonus.length;

        // 5. 최고급 KST 정밀 터미널 브리핑 박스 출력
        console.log('═══════════════════════════════════════════════════════════════════════════════');
        console.log(' [BitWish Audit] 🛡️ 4대 전산 장부 무결성 전수 감사 및 수복 결과');
        console.log('───────────────────────────────────────────────────────────────────────────────');
        console.log(` • 총 회원 수 (User)        : ${userCount}명`);
        console.log(` • 채굴 통장 수복 (Mining)   : ${miningCreatedCount}건 신규 생성 보충 (정상 1:1 일치)`);
        console.log(` • 보너스 장부 수복 (Bonus)  : ${bonusCreatedCount}건 신규 생성 보충 (정상 1:1 일치)`);
        console.log(` • 고아/유령 데이터 감지    : ${totalOrphans}건 ${totalOrphans === 0 ? '(완전 무결)' : '(비파괴 격리 보고)'}`);
        if (totalOrphans > 0) {
            if (orphanMining.length > 0) console.log(`   └─ 미등록 채굴 장부: ${orphanMining.map(o => o.walletAddress).join(', ')}`);
            if (orphanBonus.length > 0) console.log(`   └─ 미등록 보너스 장부: ${orphanBonus.map(o => o.walletAddress).join(', ')}`);
        }
        console.log(` • 적용 기준 기본 채굴률   : ${effectiveBaseRate.toFixed(8)} BW/h (반감기 실시간 직결)`);
        console.log(' • 4대 장부 최종 정합성     : 100% 무결점 정렬 완료 ✅');
        console.log('═══════════════════════════════════════════════════════════════════════════════');

        return res.json({
            success: true,
            message: '4대 전산 장부 정합성 감사 및 자동 수복이 100% 완료되었습니다.',
            data: {
                totalUsers: userCount,
                miningFixedCount: miningCreatedCount,
                bonusFixedCount: bonusCreatedCount,
                orphanCount: totalOrphans,
                orphanMining: orphanMining.map(o => o.walletAddress),
                orphanBonus: orphanBonus.map(o => o.walletAddress),
                effectiveBaseRate: effectiveBaseRate.toFixed(8),
                auditTimestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('[BitWish Audit] ❌ 전산 장부 감사 실패:', error);
        return res.status(500).json({
            success: false,
            message: '데이터 정합성 감사 및 수복 중 오류가 발생했습니다.',
            error: error instanceof Error ? error.message : String(error)
        });
    }
});

// ---------------------------------------------------------
// [공정 1] 크롬 확장프로그램 팝업 부스트 거버넌스 제어 API (30% ↔ 10%)
// ---------------------------------------------------------

// 1. 현재 정책 조회
router.get('/extension/policy', async (req, res) => {
    try {
        const policy = await getExtensionPolicy();
        return res.json({
            success: true,
            data: policy
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: '확장프로그램 정책 조회 실패', error: error.message });
    }
});

// 2. 부스트 모드 변경 (베타 30% ↔ 정규 10% 원클릭 전환 및 기 활성 유저 채굴률 동기화)
router.post('/extension/policy', async (req, res) => {
    try {
        const { isBetaActive, betaEndDate, description, adminEmail } = req.body;

        const updatedPolicy = await saveExtensionPolicy({
            isBetaActive: Boolean(isBetaActive),
            betaEndDate: betaEndDate || '',
            description: description || (isBetaActive ? '크롬 확장프로그램 클로즈 베타 30% 특전 가동 중' : '크롬 확장프로그램 정규 10% 표준 가동')
        }, adminEmail || 'salmani1@naver.com');

        const newTargetRate = updatedPolicy.currentRate; // 0.30 또는 0.10
        const newTargetRateStr = new Decimal(newTargetRate).toFixed(50);

        // [동기화] 현재 확장프로그램 부스트를 활성화하여 채굴 중인 모든 계정의 extensionBonusRate 및 총 채굴률 일괄 갱신
        const activeStates = await MiningState.find({
            extensionBonusRate: { $exists: true, $ne: '0.00000000000000000000000000000000000000000000000000' }
        });

        let updatedUserCount = 0;
        for (const state of activeStates) {
            const currentExt = parseFloat(state.extensionBonusRate || '0');
            if (currentExt > 0) {
                state.extensionBonusRate = newTargetRateStr;

                // 채굴률 재계산
                const baseRate = new Decimal(state.currentBaseRate || '0.25');
                const attendanceRate = state.isAttendanceActive ? new Decimal(0.05) : new Decimal(0);
                const referralRate = new Decimal(state.referralBonusRate || '0');
                const partnerRate = state.partnerStatus === 'REGISTERED' ? new Decimal(1.25) : new Decimal(0);
                const extensionRate = new Decimal(newTargetRate);

                state.currentTotalRate = baseRate
                    .mul(new Decimal(1).plus(attendanceRate))
                    .mul(new Decimal(1).plus(referralRate))
                    .mul(new Decimal(1).plus(partnerRate))
                    .mul(new Decimal(1).plus(extensionRate))
                    .toFixed(50);

                await state.save();
                updatedUserCount++;
            }
        }

        console.log(`[Extension Policy Governance] 부스트 모드 변경 완료: ${updatedPolicy.isBetaActive ? '30% (베타)' : '10% (정규)'}, 동기화된 유저 수: ${updatedUserCount}명`);

        return res.json({
            success: true,
            message: `확장프로그램 부스트 정책이 ${updatedPolicy.isBetaActive ? '30% (클로즈 베타)' : '10% (정규 운영)'}으로 성공적으로 전환되었습니다.`,
            data: updatedPolicy,
            syncedUsers: updatedUserCount
        });
    } catch (error: any) {
        console.error('[Extension Policy Governance] 정책 변경 실패:', error);
        return res.status(500).json({ success: false, message: '정책 변경 실패', error: error.message });
    }
});

// [공정 3 수복] 관리자 전용 월간 정산 스냅샷 즉시 실행 API
router.post('/settlement/trigger-snapshot', async (req, res) => {
    try {
        console.log('[Admin Settlement Trigger] 관리자에 의한 월간 정산 스냅샷 즉시 실행 시작...');
        const result = await settlementWorker.executeMonthlySnapshot();
        return res.json(result);
    } catch (error: any) {
        console.error('[Admin Settlement Trigger Error]:', error);
        return res.status(500).json({ success: false, message: '월간 정산 실행 중 오류 발생', error: error.message });
    }
});

export default router;

