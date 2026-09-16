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

// [4단계 핵심] 익스플로러 전수 조사 (페이징/검색) 및 통계 API
router.get('/global-stats', async (req, res) => {
    try {
        const MonthlySettlement = require('../models/MonthlySettlement').default;
        const Decimal = require('decimal.js');
        const page = parseInt(req.query.page as string) || 1;
        const search = (req.query.search as string || '').trim();
        const limit = 30;
        const skip = (page - 1) * limit;
        const SystemConfig = require('../models/SystemConfig').default;

        // [Phase 2: 보안 스위치] 글로벌 마이그레이션 활성화 여부 전수 체크 (API Hard-Blocking)
        const migrationConfig = await SystemConfig.findOne({ key: 'global_migration_status' });
        const isGlobalActive = migrationConfig ? migrationConfig.value : false; // 기본값 false (절대 통제)

        if (!isGlobalActive) {
            return res.json({
                success: true,
                totalPaid: '0.00000000000000000000000000000000000000000000000000',
                remainingPool: '13650000000.00000000000000000000000000000000000000000000000000',
                recentMigrations: [],
                totalCount: 0,
                message: 'BW Migration is currently deactivated by the Foundation.'
            });
        }

        Decimal.set({ precision: 50 });
        const now = new Date();
        const timelockDuration = 15 * 24 * 60 * 60 * 1000;

        // 1. [초정밀] 연금형 릴레이 상태 전환 (Monthly Relay Unlock)
        const User = require('../models/User').default;
        const verifiedUsers = await User.find({ isKycVerified: true, kycVerifiedDate: { $exists: true } });

        for (const user of verifiedUsers) {
            const T0 = new Date(user.kycVerifiedDate.getTime() + timelockDuration); // KYC 15일 대기 종료점
            if (now < T0) continue; // 아직 최초 해제 시점도 안 됨

            // 해당 유저의 모든 정산 내역을 날짜순으로 정렬하여 가져옴
            const userSettlements = await MonthlySettlement.find({ 
                walletAddress: { $regex: new RegExp("^" + user.walletAddress + "$", "i") } 
            }).sort({ year: 1, month: 1 });

            for (let i = 0; i < userSettlements.length; i++) {
                const settlement = userSettlements[i];
                if (settlement.migrationStatus !== 'LOCKED') continue;

                // N번째 정산분의 해제 예정 시각: T0 + (i개월 * 30일)
                const unlockTime = new Date(T0.getTime() + (i * 30 * 24 * 60 * 60 * 1000));
                
                if (now >= unlockTime) {
                    await MonthlySettlement.updateOne(
                        { _id: settlement._id },
                        { $set: { migrationStatus: 'UNLOCKED' } }
                    );
                }
            }
        }

        // 2. 전체 풀 통계 계산 (이건 페이징과 관계없이 전체 합산)
        const allSettled = await MonthlySettlement.find({});
        let totalPaid = new Decimal(0);
        allSettled.forEach((s: any) => {
            if (s.migrationStatus === 'UNLOCKED' || s.migrationStatus === 'MIGRATED') {
                totalPaid = totalPaid.plus(new Decimal(s.totalAmount || 0));
            }
        });

        const totalAllocation = new Decimal('13650000000');
        const remainingPool = totalAllocation.minus(totalPaid);

        // 3. [Phase 3: Zero-Leak] MongoDB Aggregation Pipeline 도입
        // Users와 MonthlySettlement를 Full Outer Join하여 누락된 유저까지 전수 조사
        const pipeline: any[] = [
            { $match: { isKycVerified: true } }, // KYC 승인자 전원 대상
            {
                $lookup: {
                    from: 'monthlysettlements',
                    localField: 'walletAddress',
                    foreignField: 'walletAddress',
                    as: 'settlements'
                }
            },
            {
                $project: {
                    walletAddress: 1,
                    kycVerifiedDate: 1,
                    settlements: {
                        $filter: {
                            input: "$settlements",
                            as: "s",
                            cond: { $in: ["$$s.migrationStatus", ['LOCKED', 'UNLOCKED', 'MIGRATED']] }
                        }
                    }
                }
            },
            {
                $project: {
                    walletAddress: 1,
                    kycVerifiedDate: 1,
                    totalAmount: {
                        $sum: {
                            $map: {
                                input: "$settlements",
                                as: "s",
                                in: { $toDouble: { $ifNull: ["$$s.totalAmount", "0"] } }
                            }
                        }
                    },
                    // 가장 최근의 마이그레이션 상태를 대표로 사용
                    migrationStatus: {
                        $cond: {
                            if: { $gt: [{ $size: "$settlements" }, 0] },
                            then: { $arrayElemAt: ["$settlements.migrationStatus", 0] },
                            else: "LOCKED" // 데이터 누락 시 기본 LOCKED로 노출하여 가시성 확보
                        }
                    },
                    settledAt: {
                        $cond: {
                            if: { $gt: [{ $size: "$settlements" }, 0] },
                            then: { $arrayElemAt: ["$settlements.settledAt", 0] },
                            else: "$kycVerifiedDate" // 데이터 누락 시 승인일을 기준점으로 사용
                        }
                    }
                }
            }
        ];

        // 검색 필터 적용
        if (search) {
            pipeline.push({
                $match: {
                    walletAddress: { $regex: new RegExp(search, 'i') }
                }
            });
        }

        // 전체 카운트 조회 (페이징용)
        const countPipeline = [...pipeline, { $count: "total" }];
        const countResult = await User.aggregate(countPipeline);
        const totalCount = countResult.length > 0 ? countResult[0].total : 0;

        // 최종 목록 조회 (정렬 및 페이징)
        pipeline.push({ $sort: { settledAt: -1 } });
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });

        const recentMigrations = await User.aggregate(pipeline);

        return res.json({
            success: true,
            totalPaid: totalPaid.toFixed(50),
            remainingPool: remainingPool.toFixed(50),
            recentMigrations,
            totalCount
        });
    } catch (error) {
        console.error('Failed to get global stats:', error);
        return res.status(500).json({ success: false, message: '서버 오류 발생' });
    }
});

export default router;
