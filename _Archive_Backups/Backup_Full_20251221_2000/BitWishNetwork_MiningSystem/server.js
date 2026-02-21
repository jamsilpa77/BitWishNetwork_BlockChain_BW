/**
 * BitWishNetwork BW 포인트 채굴 시스템
 * 현재 토큰 이코노미는 완벽한 가상 이코노미입니다.
 * 추후 KYC 시스템 구현과 블록체인 연결 지갑까지 완성하면 
 * KYC 승인 후 실제 BW 토큰이 마이그레이션 되는 방식입니다.
 * 
 * ⚠️ 중요 준수 사항: 전역 모달, 공통 변수 함수 절대 포함하지 않는다
 * ❌ 전역 변수 사용 금지
 * ❌ 공통 함수 사용 금지  
 * ❌ 공통 클래스 사용 금지
 * ❌ 전역 모달 사용 금지
 * ❌ 중복 코드 사용 금지
 * ❌ 다른 컴포넌트와 상태 공유 금지
 * ❌ 전역 상태 관리 라이브러리 사용 금지
 * 
 * ✅ 모든 파일 첫 줄부터 주석에 절대 준수사항 명시 추가
 * ✅ 자체 보안 검증만 사용
 * ✅ 50단위 부동소수점 정밀 계산형식으로 구현 하지만 UI 홈페이지 이미지상 소수즘 8자리만 표기한다. 
 * ✅ BitWish Network 전용 시스템만 사용
 * ✅ 모든 텍스트는 한국어, 영어, 일어, 중국어포함 동남아권 언어 변경 되도록 모든 기능에 완벽하게 구현한다. 
 *        단 절대 복잡하게 파일들을 만들지 않도록한다. 
 * ✅ 마이닝 페이지는 완벽한 독립성 보장과 완벽한 데이터베이스 MongDB 하이브리드 완벽 저장소 구현한다. 
 * ✅ 유저는 1명이든 천만명이든 개인 단독 데이터베이스 MongDB 하이브리드 완벽 저장소를 구현한다.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * BitWishNetwork 서버 클래스 - 완벽한 독립성 보장
 * 백엔드 5001포트, 프론트엔드 5000포트 고정 설정
 */
class BitWishNetworkServer {
  constructor() {
    // 절대 준수사항: 전역 변수 사용 금지
    this.app = express();
    this.port = 5001; // 백엔드 포트 고정
    this.frontendPort = 5000; // 프론트엔드 포트 고정
    this.setupMiddleware();
    this.setupRoutes();
    this.setupProxy();
  }

  /**
   * 미들웨어 설정
   */
  setupMiddleware() {
    // CORS 설정
    this.app.use(cors({
      origin: `http://localhost:${this.frontendPort}`,
      credentials: true
    }));

    // JSON 파싱
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 정적 파일 서빙
    this.app.use(express.static(path.join(__dirname, 'dist')));
  }

  /**
   * 프록시 설정 (프론트엔드 연결)
   */
  setupProxy() {
    // 프론트엔드로의 프록시 설정
    this.app.use('/', createProxyMiddleware({
      target: `http://localhost:${this.frontendPort}`,
      changeOrigin: true,
      ws: true
    }));
  }

  /**
   * API 라우트 설정
   */
  setupRoutes() {
    // 헬스 체크
    this.app.get('/api/health', (req, res) => {
      res.json({
        success: true,
        message: 'BitWishNetwork 서버가 정상적으로 실행 중입니다',
        timestamp: new Date().toISOString(),
        port: this.port
      });
    });

    // 마이닝 API
    this.app.post('/api/mining/start', (req, res) => {
      res.json({
        success: true,
        message: '마이닝이 시작되었습니다',
        data: {
          userId: req.body.userId,
          status: 'running',
          startTime: new Date().toISOString()
        }
      });
    });

    this.app.post('/api/mining/stop', (req, res) => {
      res.json({
        success: true,
        message: '마이닝이 정지되었습니다',
        data: {
          userId: req.body.userId,
          status: 'stopped',
          endTime: new Date().toISOString()
        }
      });
    });

    this.app.get('/api/mining/status/:userId', (req, res) => {
      res.json({
        success: true,
        message: '마이닝 상태 조회 성공',
        data: {
          userId: req.params.userId,
          status: 'running',
          miningTime: 3600,
          reward: '0.25'
        }
      });
    });

    // 출석 보너스 API
    this.app.post('/api/attendance/check', (req, res) => {
      res.json({
        success: true,
        message: '출석 체크가 완료되었습니다',
        data: {
          userId: req.body.userId,
          bonusRate: '0.05',
          bonusAmount: '5',
          consecutiveDays: 1
        }
      });
    });

    this.app.get('/api/attendance/calendar/:userId', (req, res) => {
      res.json({
        success: true,
        message: '출석 달력 조회 성공',
        data: {
          userId: req.params.userId,
          calendar: this.generateAttendanceCalendar()
        }
      });
    });

    // 추천 보너스 API
    this.app.post('/api/referral/generate', (req, res) => {
      res.json({
        success: true,
        message: '추천인 코드가 생성되었습니다',
        data: {
          userId: req.body.userId,
          referralCode: this.generateReferralCode(),
          bonusRate: '0.02'
        }
      });
    });

    this.app.post('/api/referral/join', (req, res) => {
      res.json({
        success: true,
        message: '추천인 코드로 가입이 완료되었습니다',
        data: {
          userId: req.body.userId,
          referralCode: req.body.referralCode,
          bonusAmount: '2',
          rewardAmount: '1'
        }
      });
    });

    // 가맹점 보너스 API
    this.app.post('/api/partner/register', (req, res) => {
      res.json({
        success: true,
        message: '가맹점 등록 신청이 제출되었습니다',
        data: {
          userId: req.body.userId,
          businessName: req.body.businessName,
          status: 'PENDING',
          bonusRate: '1.25'
        }
      });
    });

    this.app.post('/api/partner/approve', (req, res) => {
      res.json({
        success: true,
        message: '가맹점이 승인되었습니다',
        data: {
          userId: req.body.userId,
          status: 'APPROVED',
          approvedAt: new Date().toISOString()
        }
      });
    });

    // 블록체인 API
    this.app.get('/api/blockchain/status', (req, res) => {
      res.json({
        success: true,
        message: '블록체인 상태 조회 성공',
        data: {
          isConnected: true,
          blockHeight: 12345,
          networkStatus: 'CONNECTED',
          lastBlockTime: new Date().toISOString()
        }
      });
    });

    this.app.get('/api/blockchain/latest-block', (req, res) => {
      res.json({
        success: true,
        message: '최신 블록 조회 성공',
        data: {
          blockNumber: 12345,
          hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          timestamp: new Date().toISOString(),
          transactionCount: 150
        }
      });
    });

    // 지갑 API
    this.app.post('/api/wallet/create', (req, res) => {
      res.json({
        success: true,
        message: '지갑이 생성되었습니다',
        data: {
          userId: req.body.userId,
          address: this.generateWalletAddress(),
          balance: '0',
          createdAt: new Date().toISOString()
        }
      });
    });

    this.app.get('/api/wallet/balance/:address', (req, res) => {
      res.json({
        success: true,
        message: '지갑 잔액 조회 성공',
        data: {
          address: req.params.address,
          balance: '100.12345678',
          totalReceived: '500.00000000',
          totalSent: '400.00000000'
        }
      });
    });

    // 통계 API
    this.app.get('/api/statistics/mining', (req, res) => {
      res.json({
        success: true,
        message: '마이닝 통계 조회 성공',
        data: {
          totalUsers: 1000,
          activeMiners: 750,
          totalMiningTime: 3600000,
          totalReward: '2500.00000000'
        }
      });
    });

    this.app.get('/api/statistics/bonus', (req, res) => {
      res.json({
        success: true,
        message: '보너스 통계 조회 성공',
        data: {
          attendanceBonus: '125.00000000',
          referralBonus: '50.00000000',
          partnerBonus: '250.00000000',
          totalBonus: '425.00000000'
        }
      });
    });
  }

  /**
   * 출석 달력 생성
   */
  generateAttendanceCalendar() {
    const calendar = [];
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    for (let day = 1; day <= 31; day++) {
      const date = new Date(year, month, day);
      if (date.getMonth() !== month) break;

      calendar.push({
        date: date.toISOString().split('T')[0],
        day: day,
        isToday: day === today.getDate(),
        isChecked: Math.random() > 0.5,
        bonusRate: '0.05'
      });
    }

    return calendar;
  }

  /**
   * 추천 코드 생성
   */
  generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 지갑 주소 생성
   */
  generateWalletAddress() {
    const chars = '0123456789abcdef';
    let result = '0x';
    for (let i = 0; i < 40; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 서버 시작
   */
  start() {
    this.app.listen(this.port, () => {
      console.log(`🚀 BitWishNetwork 백엔드 서버가 포트 ${this.port}에서 실행 중입니다`);
      console.log(`🌐 프론트엔드 연결: http://localhost:${this.frontendPort}`);
      console.log(`📊 API 엔드포인트: http://localhost:${this.port}/api`);
      console.log(`❤️ 헬스 체크: http://localhost:${this.port}/api/health`);
    });
  }
}

// 서버 시작
const server = new BitWishNetworkServer();
server.start();
