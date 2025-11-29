/**
 * BitWishNetwork Mining System
 * Mining Controller
 * 
 * ⚠️ 중요 준수 사항:
 * 1. 서버 시간 기준의 엄격한 채굴량 계산
 * 2. 50자리 정밀도 연산 (Decimal.js 사용)
 * 3. 리셋 방지 및 오프라인 채굴 보상 로직 구현
 */

import { Request, Response } from 'express';
import MiningState from '../models/MiningState';
import User from '../models/User';
import Decimal from 'decimal.js';

// 50자리 정밀도 설정
Decimal.set({ precision: 50 });

export class MiningController {

    /**
     * 마이닝 시작
     */
    public async startMining(req: Request, res: Response): Promise<void> {
        try {
            const { walletAddress } = req.body;

            let state = await MiningState.findOne({ walletAddress });

            if (!state) {
                // 최초 시작 시 상태 생성
                state = new MiningState({
                    walletAddress,
                    isMining: true,
                    miningStartTime: new Date(),
                    lastSyncTime: new Date()
                });
            } else {
                // 이미 존재하는 경우 상태 업데이트
                if (!state.isMining) {
                    state.isMining = true;
                    state.miningStartTime = new Date(); // 재시작 시간 기록
                    state.lastSyncTime = new Date();
                }
            }

            await state.save();

            res.status(200).json({ success: true, data: state });
        } catch (error) {
            console.error('Start mining error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    /**
     * 마이닝 정지
     */
    public async stopMining(req: Request, res: Response): Promise<void> {
        try {
            const { walletAddress } = req.body;

            const state = await MiningState.findOne({ walletAddress });

            if (state && state.isMining) {
                // 정지 전까지의 채굴량 정산
                this.calculatePendingReward(state);

                state.isMining = false;
                state.miningStartTime = null;
                state.lastSyncTime = new Date();
                await state.save();
            }

            res.status(200).json({ success: true, data: state });
        } catch (error) {
            console.error('Stop mining error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    /**
     * 마이닝 데이터 동기화 (30초 주기)
     * 핵심 로직: 클라이언트가 보낸 데이터가 아닌, 서버 시간 기준으로 계산하여 업데이트
     */
    public async syncMiningData(req: Request, res: Response): Promise<void> {
        try {
            const { walletAddress } = req.body;

            const state = await MiningState.findOne({ walletAddress });

            if (!state) {
                res.status(404).json({ success: false, message: 'Mining state not found' });
                return;
            }

            if (state.isMining) {
                // 지난 동기화 이후 흐른 시간만큼 보상 추가
                this.calculatePendingReward(state);
                state.lastSyncTime = new Date();
                await state.save();
            }

            res.status(200).json({ success: true, data: state });
        } catch (error) {
            console.error('Sync mining error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    /**
     * 사용자 상태 조회 (초기 접속 시 복구용)
     */
    public async getUserStatus(req: Request, res: Response): Promise<void> {
        try {
            const { walletAddress } = req.params;

            const user = await User.findOne({ walletAddress });
            const miningState = await MiningState.findOne({ walletAddress });

            console.log('---------------------------------------------------');
            console.log('[DEBUG SERVER] getUserStatus Called');
            console.log('[DEBUG SERVER] Wallet:', walletAddress);
            console.log('[DEBUG SERVER] MiningState found:', !!miningState);
            if (miningState) {
                // [Auto-Expire Check] 출석 보너스 유효기간 검사 (매일 오전 9시 기준)
                const now = new Date();
                const cutoffTime = new Date();
                cutoffTime.setHours(9, 0, 0, 0);

                // 현재 시간이 9시 이전이면, 기준은 어제 9시 (아직 오늘 9시가 안 됐으므로)
                if (now.getHours() < 9) {
                    cutoffTime.setDate(cutoffTime.getDate() - 1);
                }

                // 마지막 출석 시간이 기준 시간보다 이전이면 만료 처리
                if (miningState.isAttendanceActive && miningState.attendanceDate) {
                    const lastAttendance = new Date(miningState.attendanceDate);
                    if (lastAttendance < cutoffTime) {
                        console.log('[AUTO-EXPIRE] Attendance bonus expired for:', walletAddress);
                        miningState.isAttendanceActive = false;
                        miningState.currentTotalRate = miningState.currentBaseRate; // 기본율로 복귀
                        await miningState.save();
                    }
                }

                console.log('---------------------------------------------------');
                console.log('[DEBUG SERVER] getUserStatus Called');
                console.log('[DEBUG SERVER] Wallet:', walletAddress);
                console.log('[DEBUG SERVER] MiningState found:', !!miningState);
                console.log('[DEBUG SERVER] isAttendanceActive:', miningState.isAttendanceActive);
                console.log('[DEBUG SERVER] currentTotalRate:', miningState.currentTotalRate);
            }
            console.log('---------------------------------------------------');

            if (miningState && miningState.isMining) {
                // 접속하지 않았던 시간(오프라인) 동안의 보상 계산 및 반영
                this.calculatePendingReward(miningState);
                miningState.lastSyncTime = new Date();
                await miningState.save();
            }

            res.status(200).json({
                success: true,
                user,
                miningState
            });
        } catch (error) {
            console.error('Get user status error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    /**
     * 보상 계산 내부 로직 (Private)
     * 시간 차이(초) * 초당 채굴률
     */
    private calculatePendingReward(state: any): void {
        const now = new Date();
        const lastSync = new Date(state.lastSyncTime);

        // 밀리초 단위 차이 -> 초 단위 변환
        const diffSeconds = (now.getTime() - lastSync.getTime()) / 1000;

        if (diffSeconds > 0) {
            const currentReward = new Decimal(state.accumulatedReward);
            const ratePerSecond = new Decimal(state.currentTotalRate).div(3600); // 시간당 -> 초당

            const additionalReward = ratePerSecond.mul(diffSeconds);

            // 누적 보상 업데이트
            state.accumulatedReward = currentReward.plus(additionalReward).toString();
        }
    }

    /**
     * 마이닝 데이터 초기화 (관리자 전용 - 테스트 목적)
     */
    public async resetMiningData(walletAddress: string): Promise<boolean> {
        try {
            const result = await MiningState.findOneAndUpdate(
                { walletAddress },
                {
                    isMining: false,
                    miningStartTime: null,
                    lastSyncTime: new Date(),
                    accumulatedReward: '0.0',
                    currentBaseRate: '0.25',
                    currentTotalRate: '0.25'
                }
            );

            return !!result;
        } catch (error) {
            console.error('Reset mining data error:', error);
            return false;
        }
    }
}

export const miningController = new MiningController();
