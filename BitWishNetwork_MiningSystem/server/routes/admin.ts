
import express from 'express';
import { body, validationResult } from 'express-validator';
import MiningState from '../models/MiningState';
import BonusRecord from '../models/BonusRecord';
import User from '../models/User'; // [추가] 가입 정보 조회를 위한 User 모델 추가
import SystemConfig from '../models/SystemConfig';
import MonthlySettlement from '../models/MonthlySettlement'; // [추가] 마이그레이션 상태 승격을 위한 모델 추가

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
        // [Step 1] 날짜 필터링(year, month)을 무시하고 전체 12명 가입자를 MiningState 기준으로 조회
        const pipeline: any[] = [
            {
                $lookup: {
                    from: "users",
                    localField: "walletAddress",
                    foreignField: "walletAddress",
                    as: "userInfo"
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
                    isMining: 1,
                    accumulatedReward: 1,
                    lastSyncTime: 1,
                    currentTotalRate: 1, // [추가] 정밀한 채굴률 반영
                    updatedAt: 1,        // [추가] 예비용 시간 데이터
                    joinedDate: { $arrayElemAt: ["$userInfo.createdAt", 0] },
                    kycStatus: { $arrayElemAt: ["$userInfo.isKycVerified", 0] },
                    referrerCode: { $arrayElemAt: ["$userInfo.referrerCode", 0] },
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

        const results = await MiningState.aggregate(pipeline);

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

        // 2. [추천인 측] 보너스율(2%p) 합산 - MiningState에서 추출
        const bonusRateResults = await MiningState.aggregate([
            { $group: { _id: null, total: { $sum: { $toDouble: { $ifNull: ["$referralBonusRate", "0"] } } } } }
        ]);

        // 3. [가입자 측] 보너스율(2%) 합산 - referrerCode 보유 유저 수 추출
        const joinerCount = await User.countDocuments({ referrerCode: { $ne: null } });

        // 4. 양방향 합산 처리 (추천인 합계 + 가입자 합계)
        const referrerSum = bonusRateResults.length > 0 ? bonusRateResults[0].total : 0;
        const joinerSum = joinerCount * 0.02;
        const finalTotalRate = (referrerSum + joinerSum) * 100;

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

export default router;

