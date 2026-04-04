/**
 * BitWishNetwork BW 포인트 채굴 시스템
 * MiningService - 프론트엔드와 백엔드 API 연동
 * 
 * ✅ 백엔드 API와 통신하여 실제 데이터 동기화
 */

import { MiningStatus } from '@/types';
import { MINING_STATUS } from '@/constants';

export class MiningService {

  /**
   * 마이닝 시작
   */
  public async startMining(walletAddress: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch('/api/mining/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress })
      });
      return await response.json();
    } catch (error) {
      console.error('Mining start error:', error);
      return { success: false, message: 'Network error' };
    }
  }

  /**
   * 마이닝 정지
   */
  public async stopMining(walletAddress: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch('/api/mining/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress })
      });
      return await response.json();
    } catch (error) {
      console.error('Mining stop error:', error);
      return { success: false, message: 'Network error' };
    }
  }

  /**
   * 마이닝 일시정지
   * (현재 서버 API 미지원이므로 클라이언트 상태 관리용으로 둠, 추후 구현)
   */
  public async pauseMining(walletAddress: string): Promise<{ success: boolean }> {
    // TODO: 서버 API 구현 필요
    return { success: true };
  }

  /**
   * 마이닝 재개
   * (현재 서버 API 미지원이므로 startMining으로 대체)
   */
  public async resumeMining(walletAddress: string): Promise<{ success: boolean }> {
    return this.startMining(walletAddress);
  }

  /**
   * 마이닝 상태 조회
   * 백엔드에서 최신 상태를 가져와서 UI에 맞는 형식으로 반환
   */
  public async getMiningStatus(walletAddress: string): Promise<{
    status: MiningStatus;
    miningTime: number;
    accumulatedReward: number;
    currentRate: number;
    isAttendanceActive: boolean;
    referralBonusStorage: number;
    referralRewardStorage: number;
    referralBonusRate: number;
  }> {
    try {
      if (!walletAddress) {
        throw new Error('Wallet address is required');
      }

      const response = await fetch(`/api/mining/status/${walletAddress}`);
      const data = await response.json();

      if (data.success && data.miningState) {
        const state = data.miningState;
        const user = data.user;

        let status: MiningStatus = MINING_STATUS.STOPPED as MiningStatus;
        if (state.isMining) {
          status = MINING_STATUS.MINING;
        }

        // 마이닝 시간 계산
        let miningTime = 0;
        if (state.isMining && state.miningStartTime) {
          const startTime = new Date(state.miningStartTime).getTime();
          const now = new Date().getTime();
          miningTime = Math.floor((now - startTime) / 1000);
        }

        return {
          status,
          miningTime,
          accumulatedReward: parseFloat(state.accumulatedReward || '0'),
          currentRate: parseFloat(state.currentTotalRate || '0.25'),
          isAttendanceActive: state.isAttendanceActive || false,
          referralBonusStorage: user ? parseFloat(user.referralBonusStorage || '0') : 0,
          referralRewardStorage: user ? parseFloat(user.referralRewardStorage || '0') : 0,
          referralBonusRate: parseFloat(state.referralBonusRate || '0')
        };
      }

      return {
        status: MINING_STATUS.STOPPED,
        miningTime: 0,
        accumulatedReward: 0,
        currentRate: 0.25,
        isAttendanceActive: false,
        referralBonusStorage: 0,
        referralRewardStorage: 0,
        referralBonusRate: 0
      };
    } catch (error) {
      console.error('Get mining status error:', error);
      return {
        status: MINING_STATUS.STOPPED,
        miningTime: 0,
        accumulatedReward: 0,
        currentRate: 0.25,
        isAttendanceActive: false,
        referralBonusStorage: 0,
        referralRewardStorage: 0,
        referralBonusRate: 0
      };
    }
  }

}
