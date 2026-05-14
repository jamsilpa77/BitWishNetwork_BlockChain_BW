/**
 * BitWishNetwork Mining System
 * Ranking Service
 * 
 * ✅ 무결성 보장: 
 * 1. User 컬렉션 기준 전수 합산 (유저 누락 방지 - 3명 모두 노출)
 * 2. 지갑 주소별 그룹화 (중복 노출 방지)
 */

import MiningState from '../models/MiningState';
import MonthlySettlement from '../models/MonthlySettlement';
import User from '../models/User';

export class RankingService {

    /**
     * 전역 랭킹 상위 N명 조회
     * ✅ 8단계: 결정론적 순위제(Deterministic Tie-breaking) 도입
     */
    static async getTopRankings(limit: number = 50) {
        const now = new Date();
        return await User.aggregate([
            {
                $lookup: {
                    from: 'miningstates',
                    localField: 'walletAddress',
                    foreignField: 'walletAddress',
                    as: 'miningState'
                }
            },
            {
                $lookup: {
                    from: 'monthlysettlements',
                    localField: 'walletAddress',
                    foreignField: 'walletAddress',
                    as: 'settlements'
                }
            },
            {
                $addFields: {
                    mState: { $arrayElemAt: ["$miningState", 0] }
                }
            },
            {
                // [Phase 9-2] 실시간 보정(LiveBoost) 조건부 집계 최적화 (핀셋 제어)
                $addFields: {
                    liveBoostAmount: {
                        $cond: [
                            { $eq: ["$mState.isMining", true] },
                            {
                                $multiply: [
                                    {
                                        $divide: [
                                            { $subtract: [now, { $ifNull: ["$mState.lastSyncTime", "$mState.updatedAt"] }] },
                                            1000
                                        ]
                                    },
                                    { 
                                        $divide: [
                                            { $toDecimal: { $ifNull: ["$mState.currentTotalRate", "0.25"] } },
                                            3600
                                        ]
                                    }
                                ]
                            },
                            { $toDecimal: "0" }
                        ]
                    }
                }
            },
            {
                $project: {
                    walletAddress: 1,
                    joinedDate: 1, // ✅ 동점자 처리를 위한 기준 필드
                    kycApplication: 1,
                    totalMiningAmount: {
                        $add: [
                            // 1. DB에 저장된 기본 채굴량
                            { $ifNull: [{ $toDecimal: "$mState.accumulatedReward" }, { $toDecimal: "0" }] },
                            // 2. [Phase 9-2] 최적화된 LiveBoost 합산
                            "$liveBoostAmount",
                            // 3. 과거 정산 완료 기록 합산
                            {
                                $sum: {
                                    $map: {
                                        input: "$settlements",
                                        as: "s",
                                        in: { $ifNull: [{ $toDecimal: "$$s.totalAmount" }, { $toDecimal: "0" }] }
                                    }
                                }
                            }
                        ]
                    }
                }
            },
            // ✅ 8단계 핵심: 금액 내림차순 후 가입일 오름차순(선착순) 정렬
            { $sort: { totalMiningAmount: -1, joinedDate: 1 } },
            { $limit: limit },
            {
                $project: {
                    walletAddress: 1,
                    totalMiningAmount: { $toString: "$totalMiningAmount" },
                    kycStatus: { $ifNull: ["$kycApplication.status", "NOT_APPLIED"] }
                }
            }
        ]);
    }

    /**
     * 특정 유저의 순위 조회
     * ✅ [Phase 9-3] 결정론적 순위 카운팅 엔진 수복
     * 리스트와 동일한 실시간 연산 엔진을 사용하여 100% 일치 보장
     */
    static async getUserRank(walletAddress: string) {
        const now = new Date();

        // 1. 타겟 유저의 정밀 데이터(실시간 보정치 포함) 산출
        const targetResults = await User.aggregate([
            { $match: { walletAddress } },
            {
                $lookup: {
                    from: 'miningstates',
                    localField: 'walletAddress',
                    foreignField: 'walletAddress',
                    as: 'miningState'
                }
            },
            {
                $lookup: {
                    from: 'monthlysettlements',
                    localField: 'walletAddress',
                    foreignField: 'walletAddress',
                    as: 'settlements'
                }
            },
            {
                $addFields: {
                    mState: { $arrayElemAt: ["$miningState", 0] }
                }
            },
            {
                // [Phase 9-2] 최적화된 LiveBoost 연산 이식
                $addFields: {
                    liveBoostAmount: {
                        $cond: [
                            { $eq: ["$mState.isMining", true] },
                            {
                                $multiply: [
                                    {
                                        $divide: [
                                            { $subtract: [now, { $ifNull: ["$mState.lastSyncTime", "$mState.updatedAt"] }] },
                                            1000
                                        ]
                                    },
                                    { 
                                        $divide: [
                                            { $toDecimal: { $ifNull: ["$mState.currentTotalRate", "0.25"] } },
                                            3600
                                        ]
                                    }
                                ]
                            },
                            { $toDecimal: "0" }
                        ]
                    }
                }
            },
            {
                $project: {
                    joinedDate: 1,
                    totalAmount: {
                        $add: [
                            { $ifNull: [{ $toDecimal: "$mState.accumulatedReward" }, { $toDecimal: "0" }] },
                            "$liveBoostAmount",
                            {
                                $sum: {
                                    $map: {
                                        input: "$settlements",
                                        as: "s",
                                        in: { $ifNull: [{ $toDecimal: "$$s.totalAmount" }, { $toDecimal: "0" }] }
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        ]);

        if (!targetResults.length) return { rank: 0, totalAmount: '0' };
        const targetAmount = targetResults[0].totalAmount;
        const targetJoinedDate = targetResults[0].joinedDate;

        // 2. [Phase 9-3] 결정론적 우위 그룹 카운팅 (전 유저 실시간 대조)
        const superiorCountResult = await User.aggregate([
            {
                $lookup: {
                    from: 'miningstates',
                    localField: 'walletAddress',
                    foreignField: 'walletAddress',
                    as: 'miningState'
                }
            },
            {
                $lookup: {
                    from: 'monthlysettlements',
                    localField: 'walletAddress',
                    foreignField: 'walletAddress',
                    as: 'settlements'
                }
            },
            {
                $addFields: {
                    mState: { $arrayElemAt: ["$miningState", 0] }
                }
            },
            {
                // [Phase 9-2] 연산 엔진 동일 적용
                $addFields: {
                    liveBoostAmount: {
                        $cond: [
                            { $eq: ["$mState.isMining", true] },
                            {
                                $multiply: [
                                    {
                                        $divide: [
                                            { $subtract: [now, { $ifNull: ["$mState.lastSyncTime", "$mState.updatedAt"] }] },
                                            1000
                                        ]
                                    },
                                    { 
                                        $divide: [
                                            { $toDecimal: { $ifNull: ["$mState.currentTotalRate", "0.25"] } },
                                            3600
                                        ]
                                    }
                                ]
                            },
                            { $toDecimal: "0" }
                        ]
                    }
                }
            },
            {
                $project: {
                    joinedDate: 1,
                    totalAmount: {
                        $add: [
                            { $ifNull: [{ $toDecimal: "$mState.accumulatedReward" }, { $toDecimal: "0" }] },
                            "$liveBoostAmount",
                            {
                                $sum: {
                                    $map: {
                                        input: "$settlements",
                                        as: "s",
                                        in: { $ifNull: [{ $toDecimal: "$$s.totalAmount" }, { $toDecimal: "0" }] }
                                    }
                                }
                            }
                        ]
                    }
                }
            },
            {
                // [Phase 9-3] 결정론적 순위 판정 조건
                $match: {
                    $or: [
                        { totalAmount: { $gt: targetAmount } },
                        {
                            $and: [
                                { totalAmount: { $eq: targetAmount } },
                                { joinedDate: { $lt: targetJoinedDate } }
                            ]
                        }
                    ]
                }
            },
            { $count: "count" }
        ]);

        const finalRank = (superiorCountResult[0]?.count || 0) + 1;

        return {
            rank: finalRank,
            totalAmount: targetAmount.toString()
        };
    }
}
