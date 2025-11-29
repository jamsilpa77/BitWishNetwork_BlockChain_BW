/**
 * BitWishNetwork 관리자 API 라우트
 * 
 * 기능:
 * - 마이닝 데이터 조회
 * - 마이닝 데이터 초기화 (테스트용)
 * - 출석 보너스 조회 (과거/현재 구분)
 */

import express from 'express';
import MiningState from '../models/MiningState';
import BonusRecord from '../models/BonusRecord';
import Decimal from 'decimal.js';

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
                currentTotalRate: '0.25',
                isAttendanceActive: false, // [Fix] 보너스 상태도 확실하게 초기화
                attendanceDate: null       // [Fix] 출석 날짜도 초기화
            },
            { upsert: true, new: true }
        );

        // [Fix] BonusRecord에서 '오늘' 날짜의 출석 기록 삭제 (완전한 재테스트 환경 보장)
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

        await BonusRecord.findOneAndUpdate(
            { walletAddress },
            {
                $pull: {
                    attendanceHistory: { date: todayStr }
                }
            }
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
        const { year, month } = req.query;

        // BonusRecord에서 출석 기록 조회
        const bonusRecord = await BonusRecord.findOne({ walletAddress });

        if (!bonusRecord) {
            return res.json({
                success: true,
                data: {
                    isActive: false,
                    records: [],
                    totalBonus: '0.00000000'
                }
            });
        }

        // MiningState 조회 (실시간 보상 계산용)
        const miningState = await MiningState.findOne({ walletAddress });
        const currentReward = miningState ? new Decimal(miningState.accumulatedReward) : new Decimal(0);

        // 오늘 날짜 확인
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

        // 오늘 출석 여부 확인
        const todayAttendance = bonusRecord.attendanceHistory.find(
            (record: any) => record.date === todayStr
        );
        const isActive = !!todayAttendance;

        // 필터링 및 정렬
        let filteredRecords = [...bonusRecord.attendanceHistory];

        // 월별 검색 필터 적용
        if (year && month) {
            const targetYear = parseInt(year as string);
            const targetMonth = parseInt(month as string);

            filteredRecords = filteredRecords.filter((record: any) => {
                const recordDate = new Date(record.date);
                return recordDate.getFullYear() === targetYear && (recordDate.getMonth() + 1) === targetMonth;
            });
        }

        // 날짜 내림차순 정렬
        filteredRecords.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        let totalBonusSum = new Decimal(0);

        // 응답 데이터 포맷팅
        const records = filteredRecords.map((record: any) => {
            // 날짜 파싱 - 타임존 문제 해결
            let checkInTime = record.checkInTime ? new Date(record.checkInTime) : null;
            let recordDateStr = record.date; // "2025-11-28"

            // checkInTime이 없으면 date 문자열로 추정 (09:00:00 KST)
            if (!checkInTime) {
                // YYYY-MM-DD를 로컬 타임존으로 파싱
                const [year, month, day] = recordDateStr.split('-').map(Number);
                checkInTime = new Date(year, month - 1, day, 9, 0, 0, 0);
            }

            // 종료 시간 계산 (다음날 오전 08:59:59 KST)
            // recordDateStr을 로컬 타임존으로 파싱
            const [year, month, day] = recordDateStr.split('-').map(Number);
            const endTime = new Date(year, month - 1, day + 1, 8, 59, 59, 999);

            // 포맷팅: YYYY.MM.DD HH:mm:ss 시작 ~ YYYY.MM.DD HH:mm:ss 종료
            const startTimeStr = checkInTime.toLocaleString('ko-KR', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
            });
            const endTimeStr = endTime.toLocaleString('ko-KR', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
            });

            const fullDateRange = `${startTimeStr} 시작 ~ ${endTimeStr} 종료`;

            let finalAmount = '0.00000000';

            if (record.fixedBonusAmount) {
                // 확정된 보너스 금액이 있으면 사용
                finalAmount = record.fixedBonusAmount;
            } else if (record.date === todayStr && isActive && miningState && miningState.isMining) {
                // [오늘] 진행 중인 경우: 실시간 누적 보상의 5% 지분 계산
                // 공식: 현재 누적 보상 * (0.05 / 1.05)
                finalAmount = currentReward.mul(0.05).div(1.05).toFixed(8);
            } else {
                // [과거] 확정 금액이 누락된 경우: 시간 비례 추정 계산
                // 총 시간(초) = (종료 시간 - 체크인 시간) / 1000
                // 시간당 보너스 = 0.25 * 0.05 = 0.0125 BW
                const durationMs = endTime.getTime() - checkInTime.getTime();
                const durationHours = durationMs / (1000 * 60 * 60);

                if (durationHours > 0) {
                    const estimatedBonus = new Decimal(0.0125).mul(durationHours);
                    finalAmount = estimatedBonus.toFixed(8);
                }
            }

            // 총합 계산
            totalBonusSum = totalBonusSum.plus(new Decimal(finalAmount));

            return {
                fullDate: fullDateRange,
                bonusAmount: finalAmount,
                isActive: true
            };
        });

        return res.json({
            success: true,
            data: {
                isActive,
                records,
                totalBonus: totalBonusSum.toFixed(8)
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

// Server restarted at 2025-11-29 14:30

