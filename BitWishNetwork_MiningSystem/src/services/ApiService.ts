/**
 * BitWishNetwork Mining System
 * API Service
 * 
 * ⚠️ 중요 준수 사항:
 * 1. 백엔드 서버와의 통신을 전담하는 모듈
 * 2. 모든 요청에 지갑 주소 및 인증 토큰 포함
 * 3. 에러 처리 및 재시도 로직 구현
 */

import axios, { AxiosInstance } from 'axios';

// 환경 변수에서 API URL 로드 (없으면 기본값)
// 환경 변수 안전하게 로드
let apiUrl = 'http://localhost:5001/api';
try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
        // @ts-ignore
        apiUrl = process.env.REACT_APP_API_URL;
    }
} catch (error) {
    console.warn('Failed to load environment variable, using default URL');
}
// 환경 변수 제거하고 하드코딩 (안전성 확보)
const API_BASE_URL = 'http://localhost:5001/api';

class ApiService {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            timeout: 10000, // 10초 타임아웃
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // 요청 인터셉터: 인증 헤더 추가
        this.client.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('bw_auth_token');
                if (token) {
                    config.headers['Authorization'] = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );
    }

    /**
     * 마이닝 시작 요청
     * @param walletAddress 지갑 주소
     */
    public async startMining(walletAddress: string): Promise<any> {
        try {
            const response = await this.client.post('/mining/start', { walletAddress });
            return response.data;
        } catch (error) {
            console.error('Failed to start mining:', error);
            throw error;
        }
    }

    /**
     * 마이닝 정지 요청
     * @param walletAddress 지갑 주소
     */
    public async stopMining(walletAddress: string): Promise<any> {
        try {
            const response = await this.client.post('/mining/stop', { walletAddress });
            return response.data;
        } catch (error) {
            console.error('Failed to stop mining:', error);
            throw error;
        }
    }

    /**
     * 마이닝 데이터 동기화 (30초마다 호출)
     * @param walletAddress 지갑 주소
     * @param currentAmount 현재 클라이언트 측 계산값 (검증용)
     */
    public async syncMiningData(walletAddress: string, currentAmount: string): Promise<any> {
        try {
            const response = await this.client.post('/mining/sync', {
                walletAddress,
                clientAmount: currentAmount
            });
            return response.data;
        } catch (error) {
            console.error('Failed to sync mining data:', error);
            // 동기화 실패 시 에러를 던지지 않고 무시 (사용자 경험 저해 방지)
            return null;
        }
    }

    /**
     * 사용자 등록 (지갑 생성 시)
     * @param userData 사용자 등록 정보
     */
    public async registerUser(userData: any): Promise<any> {
        try {
            const response = await this.client.post('/user/register', userData);
            return response.data;
        } catch (error) {
            console.error('Failed to register user:', error);
            throw error;
        }
    }

    /**
     * 추천인 코드 유효성 검사
     * @param code 추천인 코드
     */
    public async checkReferralCode(code: string): Promise<any> {
        try {
            const response = await this.client.get(`/user/referral/${code}`);
            return response.data;
        } catch (error) {
            console.error('Failed to check referral code:', error);
            return { success: false, isValid: false };
        }
    }

    /**
     * 사용자 상태 조회 (초기 로딩 시)
     * @param walletAddress 지갑 주소
     */
    public async getUserStatus(walletAddress: string): Promise<any> {
        try {
            // mining 라우트의 status 엔드포인트 사용
            const response = await this.client.get(`/mining/status/${walletAddress}`);
            return response.data;
        } catch (error) {
            console.error('Failed to get user status:', error);
            throw error;
        }
    }

    /**
     * 추천 보상 상태 조회 (Step 4 실시간 연동용)
     * @param walletAddress 지갑 주소
     */
    public async getBonusStatus(walletAddress: string): Promise<any> {
        try {
            const response = await this.client.get(`/referral/stats/${walletAddress}`);
            if (response.data && response.data.success) {
                return {
                    referral: {
                        bonusStorage: parseFloat(response.data.data.referralBonusStorage),
                        rewardStorage: parseFloat(response.data.data.referralRewardStorage)
                    }
                };
            }
            return null;
        } catch (error) {
            console.error('Failed to get bonus status:', error);
            return null;
        }
    }

    /**
     * 추천인 코드 서버 동기화 (Step 2 작업)
     * @param walletAddress 지갑 주소
     * @param myReferralCode 추천 코드
     */
    public async updateReferralCode(walletAddress: string, myReferralCode: string): Promise<any> {
        try {
            const response = await this.client.post('/user/code', { walletAddress, myReferralCode });
            return response.data;
        } catch (error) {
            console.error('Failed to update referral code:', error);
            throw error;
        }
    }
}

export const apiService = new ApiService();
