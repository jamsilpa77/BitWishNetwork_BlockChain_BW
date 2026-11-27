/**
 * BitWishNetwork 출석 체크 API 라우트
 * 
 * 기능:
 * - 출석 체크 및 MongoDB 저장
 */

import express from 'express';
import BonusRecord from '../models/BonusRecord';
import MiningState from '../models/MiningState';
import Decimal from 'decimal.js';
import { HalvingPolicyEngine } from '../services/HalvingPolicyEngine';

const router = express.Router();

/**
 * POST /api/attendance/check
 * 출석 체크 및 MongoDB 저장
 */
router.post('/check', async (req, res) => {
    try {
        const { walletAddress } = req.body;

        if (!walletAddress) {
            return res.status(400).json({
                success: false,
                message: '지갑 주소가 필요합니다'
            });
        }

        // [Fix] 오전 9시 기준 날짜 계산 (Day Shift Logic)
        // 00:00 ~ 08:59 사이에 체크인하면 '어제' 날짜로 기록해야 함
        const now = new Date();
        const currentHour = now.getHours();

        let recordDate = new Date(now);
        if (currentHour < 9) {
            recordDate.setDate(recordDate.getDate() - 1);
        }

        // [CRITICAL FIX] toISOString()은 UTC로 변환하므로 타임존 문제 발생!
        // 로컬 날짜를 YYYY-MM-DD 형식으로 직접 포맷팅
        const year = recordDate.getFullYear();
        const month = String(recordDate.getMonth() + 1).padStart(2, '0');
        const day = String(recordDate.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`; // YYYY-MM-DD (로컬 타임존 기준)


        // BonusRecord 조회 또는 생성
        let bonusRecord = await BonusRecord.findOne({ walletAddress });

        if (!bonusRecord) {
            bonusRecord = new BonusRecord({
                walletAddress,
                referralBonusStorage: '0.00000000000000000000000000000000000000000000000000',
                referralRewardStorage: '0.00000000000000000000000000000000000000000000000000',
                referralList: [],
                attendanceHistory: []
            });
        }

        // 중복 출석 체크
        const existingAttendance = bonusRecord.attendanceHistory.find(
            record => record.date === todayStr
        );

        if (existingAttendance) {
            // [Fix] 이미 출석했더라도 MiningState가 꺼져있으면 켜준다. (데이터 불일치 방지 및 초기화 후 복구 지원)
            const currentState = await MiningState.findOne({ walletAddress });
            if (currentState && !currentState.isAttendanceActive) {
                // [공정 5-1 수복] 반감기 최신 기본 채굴률(effectiveBaseRate) 반영 및 4대 보너스 완전 곱연산
                currentState.isAttendanceActive = true;
                currentState.attendanceDate = new Date();

                const effectiveBaseRate = await HalvingPolicyEngine.getCurrentBaseRate();
                currentState.currentBaseRate = effectiveBaseRate.toFixed(8);

                const attendanceBonus = new Decimal('0.05'); // 5%
                const referralBonus = new Decimal(currentState.referralBonusRate || '0');
                const partnerBonus = currentState.partnerStatus === 'REGISTERED' ? new Decimal('1.25') : new Decimal('0');
                const extensionBonus = new Decimal(currentState.extensionBonusRate || '0');

                // 각 보너스를 곱셈으로 완벽 적용 (50자리 정밀도 유지)
                currentState.currentTotalRate = effectiveBaseRate
                    .mul(new Decimal(1).plus(attendanceBonus))
                    .mul(new Decimal(1).plus(referralBonus))
                    .mul(new Decimal(1).plus(partnerBonus))
                    .mul(new Decimal(1).plus(extensionBonus))
                    .toFixed(50);

                await currentState.save();

                return res.json({
                    success: true,
                    message: '출석 상태가 동기화되었습니다',
                    miningState: {
                        isAttendanceActive: true,
                        currentBaseRate: currentState.currentBaseRate,
                        currentTotalRate: currentState.currentTotalRate,
                        extensionBonusRate: currentState.extensionBonusRate
                    }
                });
            }

            return res.json({
                success: false,
                message: '이미 출석 체크를 완료했습니다'
            });
        }

        // 출석 기록 추가
        bonusRecord.attendanceHistory.push({
            date: todayStr,
            checkInTime: new Date(),
            bonusRate: '0.05000000000000000000000000000000000000000000000000'
        });

        await bonusRecord.save();

        const effectiveBaseRate = await HalvingPolicyEngine.getCurrentBaseRate();

        // MiningState 업데이트 (출석 보너스 반영)
        let miningState = await MiningState.findOne({ walletAddress });

        // MiningState가 없으면 새로 생성
        if (!miningState) {
            miningState = new MiningState({
                walletAddress,
                isMining: false,
                currentBaseRate: effectiveBaseRate.toFixed(8),
                currentTotalRate: effectiveBaseRate.toFixed(8),
                accumulatedReward: '0',
                isAttendanceActive: false
            });
        }

        // [공정 5-1 수복] 출석 보너스 적용 (반감기 최신 기본 채굴률 직결 및 확장프로그램 보너스 포함 4대 곱연산)
        miningState.isAttendanceActive = true;
        miningState.attendanceDate = new Date();
        miningState.currentBaseRate = effectiveBaseRate.toFixed(8);

        const attendanceBonus = new Decimal('0.05'); // 5%
        const referralBonus = new Decimal(miningState.referralBonusRate || '0');
        const partnerBonus = miningState.partnerStatus === 'REGISTERED' ? new Decimal('1.25') : new Decimal('0');
        const extensionBonus = new Decimal(miningState.extensionBonusRate || '0');

        // 각 보너스를 곱셈으로 완벽하게 적용 (50자리 정밀도 유지)
        const newTotalRate = effectiveBaseRate
            .mul(new Decimal(1).plus(attendanceBonus))
            .mul(new Decimal(1).plus(referralBonus))
            .mul(new Decimal(1).plus(partnerBonus))
            .mul(new Decimal(1).plus(extensionBonus))
            .toFixed(50);

        miningState.currentTotalRate = newTotalRate;
        await miningState.save();

        return res.json({
            success: true,
            message: '출석 체크가 완료되었습니다',
            miningState: {
                isAttendanceActive: true,
                currentBaseRate: miningState.currentBaseRate,
                currentTotalRate: miningState.currentTotalRate,
                extensionBonusRate: miningState.extensionBonusRate
            }
        });
    } catch (error) {
        console.error('Attendance check error:', error);
        return res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다'
        });
    }
});

/**
 * [추가] 특정 사용자의 모든 출석 기록 조회 API
 * GET /api/attendance/history/:walletAddress
 */
router.get('/history/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        if (!walletAddress) {
            return res.status(400).json({ success: false, message: '지갑 주소가 필요합니다' });
        }

        // DB(BonusRecord)에서 해당 지갑의 이력만 단독 조회
        const bonusRecord = await BonusRecord.findOne({ walletAddress });

        return res.json({
            success: true,
            history: bonusRecord ? bonusRecord.attendanceHistory : []
        });
    } catch (error) {
        console.error('Get attendance history error:', error);
        return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
    }
});

export default router;
