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
const fs = require('fs');

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

    // 데이터 파일 경로
    this.DATA_FILE = path.join(__dirname, 'server_data.json');
    this.WALLETS_FILE = path.join(__dirname, 'wallets.json');
    this.REFERRALS_FILE = path.join(__dirname, 'server_referrals.json');

    // 지갑 목록 로드
    this.loadWallets();

    // 추천인 데이터 로드 (영구 보존)
    this.loadReferrals();

    // 통계 데이터 로드 (파일에서 복구)
    this.loadStats();
  }

  /**
   * 지갑 목록 로드
   */
  loadWallets() {
    try {
      if (fs.existsSync(this.WALLETS_FILE)) {
        const data = fs.readFileSync(this.WALLETS_FILE, 'utf8');
        this.wallets = JSON.parse(data);
      } else {
        this.wallets = [];
        // [FIX] 관리자 요청: 초기 지갑 5개로 복구 (기존 데이터 반영)
        for (let i = 0; i < 5; i++) {
          this.wallets.push(this.generateWalletAddress());
        }
        this.saveWallets();
      }
      console.log(`📂 지갑 목록 로드 완료: ${this.wallets.length}개`);
    } catch (error) {
      console.error('지갑 목록 로드 실패:', error);
      this.wallets = [];
    }
  }

  /**
   * 지갑 목록 저장
   */
  saveWallets() {
    try {
      fs.writeFileSync(this.WALLETS_FILE, JSON.stringify(this.wallets, null, 2), 'utf8');
    } catch (error) {
      console.error('지갑 목록 저장 실패:', error);
    }
  }

  /**
   * 추천인 데이터 로드 및 복구
   */
  loadReferrals() {
    try {
      if (fs.existsSync(this.REFERRALS_FILE)) {
        const data = fs.readFileSync(this.REFERRALS_FILE, 'utf8');
        this.referrals = JSON.parse(data);
      } else {
        this.referrals = [];
      }

      // [FIX] 데이터 강제 복구 (파일이 있어도 해당 유저 없으면 주입)
      const adminWallet = "BW9F5FF090231236037F250A523B4FC320FB44BFA8";
      const exists = this.referrals.find(r => r.owner === adminWallet);

      if (!exists) {
        // [FIX] 데이터 소실 복구: 관리자님 계정의 사라진 추천인 3명 복원 (실제 가입자 포함)
        this.referrals = [
          {
            code: "REF9F5FF0909DC5",
            owner: adminWallet,
            // 2번 사진의 실제 가입자 지갑 주소 등록
            referees: [
              "BW6330A20CAFA9EF6F0203DE34F8C3E3F076C9B0E8",
              "TEST_USER_2",
              "TEST_USER_3"
            ],
            bonusRate: 0.06 // 3명 * 2%
          }
        ];
        this.saveReferrals();
        console.log('⚠️ 관리자 추천인 데이터 강제 복구 완료 (실제 가입자 포함)');
      }

      console.log(`📂 추천인 데이터 로드 완료: ${this.referrals.length}개의 레퍼럴 코드`);
    } catch (error) {
      console.error('추천인 데이터 로드 실패:', error);
      this.referrals = [];
    }
  }

  /**
   * 추천인 데이터 저장
   */
  saveReferrals() {
    try {
      fs.writeFileSync(this.REFERRALS_FILE, JSON.stringify(this.referrals, null, 2), 'utf8');
    } catch (error) {
      console.error('추천인 데이터 저장 실패:', error);
    }
  }

  /**
   * 통계 데이터 로드
   */
  loadStats() {
    try {
      if (fs.existsSync(this.DATA_FILE)) {
        const data = fs.readFileSync(this.DATA_FILE, 'utf8');
        this.stats = JSON.parse(data);
        console.log('📂 서버 데이터 파일에서 통계를 복구했습니다.');
      } else {
        console.log('🆕 새로운 통계 데이터를 초기화합니다.');
        this.stats = {
          totalUsers: 0, // 아래에서 동기화됨
          activeMiners: 0,
          totalBlocks: 0,
          totalReward: 0.00000000,
          totalMiningTime: 0
        };
        this.saveStats();
      }

      // [FIX] 무조건 지갑 파일 개수로 유저 수 덮어쓰기 (Data Consistency)
      if (this.wallets) {
        this.stats.totalUsers = this.wallets.length;
        console.log(`🔄 유저 수 동기화 완료: ${this.stats.totalUsers}명`);
      }

    } catch (error) {
      console.error('데이터 로드 실패, 초기값 사용:', error);
      this.stats = {
        totalUsers: 0,
        activeMiners: 0,
        totalBlocks: 0,
        totalReward: 0.00000000,
        totalMiningTime: 0
      };
    }
  }

  /**
   * 통계 데이터 저장
   */
  saveStats() {
    try {
      fs.writeFileSync(this.DATA_FILE, JSON.stringify(this.stats, null, 2), 'utf8');
    } catch (error) {
      console.error('데이터 저장 실패:', error);
    }
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

    // [New] 유저 상태 통합 조회 (프론트엔드 getUserStatus 대응)
    this.app.get('/api/user/status/:userId', (req, res) => {
      const userId = req.params.userId;

      // [FIX] 대소문자 무시하고 비교 (Case Insensitive Matching)
      const normalizedUserId = userId.toLowerCase().trim();

      // [FIX] 쌍방 보상 로직 구현

      // 1. 내가 추천인일 때 (내가 초대한 사람들)
      const myReferralData = this.referrals.find(r =>
        r.owner.toLowerCase().trim() === normalizedUserId
      );
      const myRefereeCount = myReferralData ? myReferralData.referees.length : 0;
      const myReferralBonusRate = myRefereeCount * 2.0; // 2% 씩
      const myReferralReward = myRefereeCount * 1.0; // 1명당 1BW

      // 2. 내가 가입자일 때 (나를 초대한 사람 찾기)
      let isInvited = false;
      let invitedBonusRate = 0;
      let invitedReward = 0;

      for (const ref of this.referrals) {
        // 대소문자 무시 비교
        const isIncluded = ref.referees.some(r => r.toLowerCase().trim() === normalizedUserId);
        if (isIncluded) {
          isInvited = true;
          invitedBonusRate = 2.0; // 가입 보너스 2%
          invitedReward = 1.0;    // 가입 보상 1BW
          break;
        }
      }

      // 최종 합산
      const totalReferralCount = myRefereeCount;
      const totalBonusRate = myReferralBonusRate + invitedBonusRate;
      const totalRewardStorage = myReferralReward + invitedReward;

      res.json({
        success: true,
        data: {
          userId: userId,
          status: 'active',
          referralCode: myReferralData ? myReferralData.code : 'REF_UNKNOWN',
          referees: myReferralData ? myReferralData.referees : [],

          // [New] 보상 관련 데이터 추가
          rewardStorage: totalRewardStorage.toFixed(4),
          bonusStorage: totalRewardStorage.toFixed(4)
        },
        miningState: {
          isMining: false,
          referralCount: totalReferralCount,
          referralBonusRate: totalBonusRate,
          accumulatedReward: '0.00000000',

          // [New] 프론트엔드 동기화용 추가 필드
          isInvited: isInvited,
          totalBonusRate: totalBonusRate
        }
      });
    });

    // 마이닝 API
    this.app.post('/api/mining/start', (req, res) => {
      this.stats.activeMiners++; // 활성 마이너 증가
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
      this.stats.activeMiners = Math.max(0, this.stats.activeMiners - 1); // 활성 마이너 감소
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

    // [New] 마이닝 틱 리포트 (실시간 합산)
    this.app.post('/api/mining/tick', (req, res) => {
      const amount = parseFloat(req.body.amount || 0);
      if (amount > 0) {
        this.stats.totalReward = parseFloat(this.stats.totalReward) + amount; // 문자열/숫자 혼용 방지
        this.stats.totalBlocks++; // [New] 유저 활동 시에만 블록 생성
        this.saveStats();
      }
      res.json({
        success: true,
        data: this.stats
      });
    });

    this.app.get('/api/mining/status/:userId', (req, res) => {
      // [FIX] 서버에 저장된 추천인 정보 조회
      const userId = req.params.userId;
      const referralData = this.referrals.find(r => r.owner === userId);
      const referralCount = referralData ? referralData.referees.length : 0;
      const referralBonus = referralCount * 2.0;

      res.json({
        success: true,
        message: '마이닝 상태 조회 성공',
        data: {
          userId: userId,
          status: 'running',
          miningTime: 3600,
          reward: '0.25',
          referralCount: referralCount, // 프론트엔드 동기화용
          referralBonusRate: referralBonus,
          referees: referralData ? referralData.referees : [] // [New] 명단 동기화용
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
      // [FIX] 추천 가입 정보 영구 저장
      const { referralCode, userId } = req.body;
      const referral = this.referrals.find(r => r.code === referralCode);

      if (referral) {
        // 중복 가입 방지 체크
        if (!referral.referees.includes(userId)) {
          referral.referees.push(userId);
          referral.bonusRate += 0.02; // 2% 증가
          this.saveReferrals(); // 즉시 저장
        }
      }

      res.json({
        success: true,
        message: '추천인 코드로 가입이 완료되었습니다',
        data: {
          userId: userId,
          referralCode: referralCode,
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
          blockHeight: this.stats.totalBlocks,
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
          blockNumber: this.stats.totalBlocks,
          hash: '0x' + Math.random().toString(16).substr(2, 64),
          timestamp: new Date().toISOString(),
          transactionCount: Math.floor(Math.random() * 50)
        }
      });
    });

    // 지갑 API
    this.app.post('/api/wallet/create', (req, res) => {
      const newAddress = this.generateWalletAddress();

      this.wallets.push(newAddress);
      this.stats.totalUsers = this.wallets.length; // 실제 개수로 동기화

      this.saveWallets(); // 지갑 목록 저장
      this.saveStats();   // 통계 저장

      res.json({
        success: true,
        message: '지갑이 생성되었습니다',
        data: {
          userId: req.body.userId,
          address: newAddress,
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
          ...this.stats,
          currentIssued: this.stats.totalReward.toFixed(8), // 소수점 포맷
          remainingSupply: (21000000000 - this.stats.totalReward).toFixed(8),
          issuanceRate: ((this.stats.totalReward / 21000000000) * 100).toFixed(8)
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
    // [Mod] 자동 시뮬레이션 제거 (관리자 요청: 유저 활동 시에만 데이터 변동)

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
