
import express from 'express';
import { body, validationResult } from 'express-validator';
import MiningState from '../models/MiningState';
import BonusRecord from '../models/BonusRecord';

const router = express.Router();

// 더미 데이터: 추천 보너스 레코드 (전역 스코프)
const dummyReferrals = [
    {
        referrerAddress: 'BW9F5FF090231236037F250A523B4FC320FB44BFA8',
        referredAddress: 'BW958ACBEA657953450332FFF0FD66ABB0FA994005',
        joinedDate: new Date('2025-12-01T10:30:00').toISOString(),
        dailyMiningAmount: 0.15234567,
        kycStatus: 'NOT_APPLIED',
        date: '2025-12-01'
    },
    {
        referrerAddress: 'BW9F5FF090231236037F250A523B4FC320FB44BFA8',
        referredAddress: 'BW69527012159E5A3CF2EFB3E07D8DC7FCFA385EF6',
        joinedDate: new Date('2025-12-02T14:20:00').toISOString(),
        dailyMiningAmount: 0.12456789,
        kycStatus: 'NOT_APPLIED',
        date: '2025-12-02'
    },
    {
        referrerAddress: 'BW9F5FF090231236037F250A523B4FC320FB44BFA8',
        referredAddress: 'BW6330A20CAFA9EF6F0203DE34F8C3E3F076C9B0E8',
        joinedDate: new Date('2025-12-03T09:15:00').toISOString(),
        dailyMiningAmount: 0.18765432,
        kycStatus: 'NOT_APPLIED',
        date: '2025-12-03'
    }
];

// 유틸리티 함수: 날짜 범위 포맷팅 (YYYY년 MM월 DD일 am00:00:00~pm23:59:59)
function formatDateRange(dateString: string): string {
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

        // 실제로는 DB에서 조회해야 함
        // 현재는 NetworkStatusService를 통해 상태 확인 시뮬레이션
        // const isMining = await NetworkStatusService.checkConnection();
        const isMining = true; // 테스트용 강제 true

        // 더미 데이터 반환
        return res.json({
            success: true,
            data: {
                walletAddress,
                isMining: true, // 테스트용 강제 true
                miningStartTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24시간 전
                accumulatedReward: 123.45678901,
                lastSyncTime: new Date().toISOString()
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
        // - 채굴 중지, 시작 시간 삭제, 누적 보상 0
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

        // 2. BonusRecord 초기화
        // - 추천 보너스 보관함, 리워드 보관함 0
        const bonusUpdate = await BonusRecord.findOneAndUpdate(
            { walletAddress },
            {
                $set: {
                    referralBonusStorage: "0",
                    referralRewardStorage: "0",
                    lastUpdated: new Date()
                }
            },
            { new: true }
        );

        if (!miningUpdate) {
            return res.status(404).json({
                success: false,
                message: '해당 지갑의 마이닝 상태를 찾을 수 없습니다 (아직 마이닝 시도 안함)'
            });
        }

        console.log(`[Admin] Reset Complete. MiningState: ${!!miningUpdate}, BonusRecord: ${!!bonusUpdate}`);

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

        // 더미 데이터 생성
        const records = [];
        const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
        let totalBonus = 0;

        for (let i = 1; i <= daysInMonth; i++) {
            // 랜덤한 상태 생성 (테스트용)
            // 실제로는 DB에서 조회
            const date = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const isActive = Math.random() > 0.3; // 70% 확률로 출석
            const isRunning = i === new Date().getDate(); // 오늘은 진행 중

            if (isActive || isRunning) {
                const bonus = 1.25; // 5% of 25 BW
                totalBonus += bonus;

                records.push({
                    date: date,
                    fullDate: `${year}년 ${String(month).padStart(2, '0')}월 ${String(i).padStart(2, '0')}일 14:26:10 ~ 14:26:10`,
                    bonusAmount: bonus.toFixed(2),
                    status: isRunning ? 'RUNNING' : 'COMPLETED',
                    isActive: true
                });
            } else {
                records.push({
                    date: date,
                    fullDate: `${year}년 ${String(month).padStart(2, '0')}월 ${String(i).padStart(2, '0')}일 -`,
                    bonusAmount: '0.00',
                    status: 'MISSED',
                    isActive: false
                });
            }
        }

        return res.json({
            success: true,
            data: {
                walletAddress,
                year,
                month,
                isActive: true, // 오늘 출석 여부
                totalBonus: totalBonus.toFixed(2),
                records: records.reverse() // 최신순 정렬
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

/**
 * GET /api/admin/referral/all
 * 모든 추천 보너스 현황 조회 (전체 목록)
 * 위치 변경: 다른 라우트 핸들러 밖으로 이동
 */
router.get('/referral/all', async (req, res) => {
    try {
        const { year, month } = req.query;

        // 월별 필터링
        let filteredRecords = dummyReferrals;
        if (year && month) {
            const targetYear = parseInt(year as string);
            const targetMonth = parseInt(month as string);

            filteredRecords = dummyReferrals.filter((record: any) => {
                const recordDate = new Date(record.date);
                return recordDate.getFullYear() === targetYear && (recordDate.getMonth() + 1) === targetMonth;
            });
        }

        // 총 채굴량 계산
        const monthlyTotal = filteredRecords.reduce((sum, record) => sum + record.dailyMiningAmount, 0);

        return res.json({
            success: true,
            data: {
                totalReferrals: filteredRecords.length,
                monthlyTotal: monthlyTotal.toFixed(8),
                records: filteredRecords.map(record => ({
                    referrerAddress: record.referrerAddress,
                    referredAddress: record.referredAddress,
                    joinedDate: record.joinedDate,
                    dateRange: formatDateRange(record.date),
                    dailyMiningAmount: record.dailyMiningAmount.toFixed(8),
                    kycStatus: record.kycStatus,
                    date: record.date
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

/**
 * GET /api/admin/referral/:walletAddress
 * 추천 보너스 내역 조회 (검색)
 * 검색 조건 수정: 추천인(Referrer) OR 가입자(Referred) 모두 검색 가능하도록 변경
 */
router.get('/referral/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const { year, month } = req.query;

        // 월별 필터링 + 지갑 주소 필터링 (추천인 OR 가입자)
        let filteredRecords = dummyReferrals.filter(record =>
            record.referrerAddress === walletAddress || record.referredAddress === walletAddress
        );

        if (year && month) {
            const targetYear = parseInt(year as string);
            const targetMonth = parseInt(month as string);

            filteredRecords = filteredRecords.filter((record: any) => {
                const recordDate = new Date(record.date);
                return recordDate.getFullYear() === targetYear && (recordDate.getMonth() + 1) === targetMonth;
            });
        }

        // 총 채굴량 계산 (검색된 기록들의 합)
        // 주의: 가입자로 검색 시 본인의 채굴량만 나옴. 추천인 검색 시 산하 가입자들의 합이 나옴.
        const monthlyTotal = filteredRecords.reduce((sum, record) => sum + record.dailyMiningAmount, 0);

        // 검색 결과가 없으면 에러 반환하기보다 빈 리스트 반환 (프론트에서 처리)
        // 하지만 사용자 경험상 데이터가 없으면 '데이터 없음' 처리하는 것이 맞을 수도 있음
        // 여기서는 빈 리스트여도 success: true로 보냄

        return res.json({
            success: true,
            data: {
                walletAddress, // 검색한 주소
                year,
                month,
                totalReferrals: filteredRecords.length,
                monthlyTotal: monthlyTotal.toFixed(8),
                records: filteredRecords.map(record => ({
                    referrerAddress: record.referrerAddress,
                    referredAddress: record.referredAddress,
                    joinedDate: record.joinedDate,
                    dailyMiningAmount: record.dailyMiningAmount.toFixed(8),
                    kycStatus: record.kycStatus,
                    date: record.date,
                    // 날짜 범위 포맷 추가 (사용자 요구사항 3-1)
                    dateRange: formatDateRange(record.date)
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
