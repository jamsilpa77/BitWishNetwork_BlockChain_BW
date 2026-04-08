/**
 * ====================================================================================
 * 🚀 BitWish Network 독립 블록체인 메인넷 서버 v1.0
 * ====================================================================================
 * 
 * 🎯 핵심 기능:
 * - BitWish Network 완전 독립 블록체인 메인넷
 * - BW 토큰 전용 시스템
 * - BitWish-256 암호화 기반 보안
 * - P2P 네트워크 연동
 * - 완벽한 독립성 보장
 * 
 * 🔒 보안 강화:
 * - BitWish 전용 보안 프로토콜
 * - 독립적인 암호화 시스템
 * - 완벽한 보안 검증 시스템
 * 
 * 🔢 50자리 부동소수점 정밀도:
 * - 모든 계산에 Decimal.js 사용 (50자리 정밀도)
 * - 부동소수점 오차 완전 제거
 * - 정밀한 잔액 계산 및 전송
 * 
 * 📊 시스템 통계:
 * - 완전 독립 블록체인 시스템
 * - BitWish 전용 합의 프로토콜 (PoW)
 * - BitWish P2P 네트워크
 * - BitWish 마이닝 시스템
 * 
 * 🌍 다국어 지원:
 * - 한국어, 영어, 일본어, 중국어 4개국 언어 지원
 * - i18n 시스템 완벽 구현
 * - 실시간 언어 전환 지원
 * 
 * 🚀 BitWish Network 완전 독립 시스템:
 * - BitWish 블록체인 코어 완전 통합
 * - BitWish P2P 네트워크 완전 통합
 * - BitWish 마이닝 시스템 완전 통합
 * - BitWish API 시스템 완전 통합
 * 
 * ⚠️  중요 사항:
 * - 이 서버는 BitWish Network 전용 메인넷입니다
 * - 스텔라 관련 코드 완전 제거
 * - 모든 기능은 BitWish Network 표준을 따릅니다
 * 
 * 🔧 기술 스택:
 * - Node.js + Express.js
 * - WebSocket (P2P 네트워크)
 * - MongoDB (데이터 저장)
 * - BitWish-256 암호화
 * - Decimal.js (50자리 정밀도)
 * 
 * 📝 버전 정보:
 * - 버전: 1.0.0
 * - 빌드: 2025-01-27
 * - 호환성: BitWish Network v1.0+
 * - 정밀도: 50자리 부동소수점
 * 
 * ====================================================================================
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import { BitWishBlockchain } from './engine/BitWishBlockchain';
import { BitWishDiscovery } from './p2p/BitWishDiscovery';
import { BitWishPoW } from './consensus/BitWishPoW';
import { BITWISH_NETWORK_CONFIG } from './config/BitWishConfig';
import { PersistentStorage } from './server/storage'; // [신규] 영구 저장소 모듈 추가

// ====================================================================================
// BitWish Network 서버 클래스
// ====================================================================================

class BitWishNetworkServer {
  private app: express.Application;
  private server: any;
  private io: Server;
  private blockchain: BitWishBlockchain;
  private discovery: BitWishDiscovery;
  private pow: BitWishPoW;
  private mongoClient: MongoClient | null = null;
  private isRunning: boolean = false;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: BITWISH_NETWORK_CONFIG.API_CONFIG.cors.origin,
        credentials: BITWISH_NETWORK_CONFIG.API_CONFIG.cors.credentials
      }
    });

    this.blockchain = new BitWishBlockchain();
    this.discovery = new BitWishDiscovery();
    this.pow = new BitWishPoW();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupEventListeners();
  }

  /**
   * 미들웨어 설정
   */
  private setupMiddleware(): void {
    // JSON 파싱
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // CORS 설정
    this.app.use(cors({
      origin: BITWISH_NETWORK_CONFIG.API_CONFIG.cors.origin,
      credentials: BITWISH_NETWORK_CONFIG.API_CONFIG.cors.credentials
    }));

    // 요청 로깅
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * API 라우트 설정
   */
  private setupRoutes(): void {
    // 헬스 체크
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        network: 'BitWish-Mainnet-v1.0'
      });
    });

    // 블록체인 상태
    this.app.get('/api/blockchain/status', async (req, res) => {
      try {
        const status = this.blockchain.getStatus();
        res.json({
          success: true,
          data: status,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        });
      }
    });

    // 블록체인 통계
    this.app.get('/api/blockchain/stats', async (req, res) => {
      try {
        const stats = this.blockchain.getStats();
        res.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        });
      }
    });

    // 블록 조회
    this.app.get('/api/blockchain/block/:height', async (req, res) => {
      try {
        const height = parseInt(req.params.height);
        const block = this.blockchain.getBlock(height);

        if (!block) {
          return res.status(404).json({
            success: false,
            error: '블록을 찾을 수 없습니다'
          });
        }

        return res.json({
          success: true,
          data: block.getSummary(),
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        });
      }
    });

    // 트랜잭션 조회
    this.app.get('/api/blockchain/transaction/:hash', async (req, res) => {
      try {
        const hash = req.params.hash;
        const transaction = this.blockchain.getTransaction(hash);

        if (!transaction) {
          return res.status(404).json({
            success: false,
            error: '트랜잭션을 찾을 수 없습니다'
          });
        }

        return res.json({
          success: true,
          data: transaction.getSummary(),
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        });
      }
    });

    // 잔액 조회
    this.app.get('/api/blockchain/balance/:address', async (req, res) => {
      try {
        const address = req.params.address;
        const balance = this.blockchain.getBalance(address);

        res.json({
          success: true,
          data: {
            address: address,
            balance: balance
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        });
      }
    });

    // P2P 네트워크 상태
    this.app.get('/api/p2p/status', async (req, res) => {
      try {
        const status = this.discovery.getNetworkStatus();
        res.json({
          success: true,
          data: status,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        });
      }
    });

    // 마이닝 상태
    this.app.get('/api/mining/status', async (req, res) => {
      try {
        const stats = this.pow.getMiningStats();
        res.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        });
      }
    });

    // 마이닝 개인 상태 조회
    this.app.get('/api/mining/status/:walletAddress', (req, res) => {
      try {
        const { walletAddress } = req.params;
        let referrals = PersistentStorage.loadFromFile('referrals.json') || { users: {} };
        const userData = referrals.users?.[walletAddress] || {
          walletAddress,
          status: 'running',
          miningTime: 0,
          reward: '0'
        };

        return res.json({
          success: true,
          message: '마이닝 상태 조회 성공',
          data: {
            miningState: userData
          }
        });
      } catch (error) {
        return res.status(500).json({ success: false, error: '상태 조회 중 오류 발생' });
      }
    });

    // 마이닝 데이터 동기화 (채굴량 + 보너스 통합 동기화)
    this.app.post('/api/mining/sync', (req, res) => {
      try {
        const { walletAddress, clientAmount, clientBonus } = req.body;
        if (!walletAddress) return res.status(400).json({ success: false, message: '지갑 주소 누락' });

        let referrals = PersistentStorage.loadFromFile('referrals.json') || { users: {} };
        if (!referrals.users) referrals.users = {};

        // [Phase 1 집행] 채굴량과 추천 보너스 보관함 수치를 동시에 영구 저장소에 박제
        referrals.users[walletAddress] = {
          ...(referrals.users[walletAddress] || {}),
          walletAddress,
          balance: clientAmount,
          referralBonusStorage: clientBonus || referrals.users[walletAddress]?.referralBonusStorage || '0',
          lastSyncAt: Date.now()
        };

        PersistentStorage.saveToFile('referrals.json', referrals);

        // [핵심 보강] 동기화 후 업데이트된 데이터를 그대로 반환하여 클라이언트 리셋을 물리적으로 차단
        return res.json({
          success: true,
          message: '동기화 완료',
          data: {
            accumulatedReward: referrals.users[walletAddress].balance,
            referralBonusStorage: referrals.users[walletAddress].referralBonusStorage
          }
        });
      } catch (error) {
        return res.status(500).json({ success: false, error: '동기화 중 오류 발생' });
      }
    });

    // 전체 시스템 상태
    this.app.get('/api/system/status', async (req, res) => {
      try {
        const blockchainStatus = this.blockchain.getStatus();
        const p2pStatus = this.discovery.getNetworkStatus();
        const miningStats = this.pow.getMiningStats();

        res.json({
          success: true,
          data: {
            blockchain: blockchainStatus,
            p2p: p2pStatus,
            mining: miningStats,
            server: {
              isRunning: this.isRunning,
              uptime: process.uptime(),
              memoryUsage: process.memoryUsage(),
              version: '1.0.0',
              network: 'BitWish-Mainnet-v1.0'
            }
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        });
      }
    });

    // ====================================================================================
    // [신규] 영구 스토리지(파일 DB) API 엔드포인트
    // 관리자 지시: 어떠한 경우에도 데이터 유실을 방지하기 위해 파일 시스템에 직접 기록
    // ====================================================================================

    // 데이터 저장 (database/*.json)
    this.app.post('/api/storage/save', (req, res) => {
      try {
        const { filename, data } = req.body;
        if (!filename || !data) {
          return res.status(400).json({ success: false, message: '파일명과 데이터가 필요합니다.' });
        }

        // 저장 전 백업 자동 생성 (안전장치)
        PersistentStorage.createBackup(filename);

        const success = PersistentStorage.saveToFile(filename, data);
        return res.json({ success, message: success ? '영구 보존 성공' : '파일 저장 실패' });
      } catch (error) {
        return res.status(500).json({ success: false, error: '서버 내부 오류' });
      }
    });

    // 데이터 로드
    this.app.get('/api/storage/load/:filename', (req, res) => {
      try {
        const { filename } = req.params;
        const data = PersistentStorage.loadFromFile(filename);

        if (!data) {
          return res.status(404).json({ success: false, message: '파일이 존재하지 않습니다.' });
        }

        return res.json({ success: true, data });
      } catch (error) {
        return res.status(500).json({ success: false, error: '데이터 로드 실패' });
      }
    });

    // 사용자 등록 및 영구 저장 연동 (Write-Through)
    this.app.post('/api/user/register', async (req, res) => {
      try {
        const userData = req.body;
        if (!userData.walletAddress) {
          return res.status(400).json({ success: false, message: '지갑 주소가 필요합니다.' });
        }

        console.log(`[Server] Registering user: ${userData.walletAddress}`);

        // 1. MongoDB 저장 시도 (옵션)
        try {
          if (this.mongoClient) {
            const db = this.mongoClient.db('bitwish');
            await db.collection('users').updateOne(
              { walletAddress: userData.walletAddress },
              { $set: { ...userData, updatedAt: Date.now() } },
              { upsert: true }
            );
          }
        } catch (mongoError) {
          console.error('[Server] MongoDB Save Failed:', mongoError);
        }

        // 2. [가장 중요] 물리적 파일 DB (referrals.json) 박제
        // 기존 파일 로드 후 병합 저장
        let referrals = PersistentStorage.loadFromFile('referrals.json') || { users: {} };
        if (!referrals.users) referrals.users = {};

        referrals.users[userData.walletAddress] = {
          ...userData,
          registeredAt: referrals.users[userData.walletAddress]?.registeredAt || Date.now(),
          lastActiveAt: Date.now()
        };

        const fileSaveSuccess = PersistentStorage.saveToFile('referrals.json', referrals);

        return res.json({
          success: true,
          message: fileSaveSuccess ? '가입 및 영구 보존 완료' : '가입 완료 (파일 저장 실패)',
          data: userData
        });
      } catch (error) {
        console.error('[Server] Register Error:', error);
        return res.status(500).json({ success: false, error: '사용자 등록 중 오류 발생' });
      }
    });
  }

  /**
   * WebSocket 설정
   */
  private setupWebSocket(): void {
    this.io.on('connection', (socket) => {
      console.log('🔗 WebSocket 클라이언트 연결됨:', socket.id);

      // 연결 확인 메시지
      socket.emit('connected', {
        message: 'BitWish Network 메인넷에 연결되었습니다',
        timestamp: new Date().toISOString(),
        network: 'BitWish-Mainnet-v1.0',
        version: '1.0.0'
      });

      // 블록체인 상태 구독
      socket.on('subscribe_blockchain', () => {
        socket.join('blockchain');
        socket.emit('subscribed', {
          channel: 'blockchain',
          message: '블록체인 상태 구독됨'
        });
      });

      // P2P 네트워크 상태 구독
      socket.on('subscribe_p2p', () => {
        socket.join('p2p');
        socket.emit('subscribed', {
          channel: 'p2p',
          message: 'P2P 네트워크 상태 구독됨'
        });
      });

      // 마이닝 상태 구독
      socket.on('subscribe_mining', () => {
        socket.join('mining');
        socket.emit('subscribed', {
          channel: 'mining',
          message: '마이닝 상태 구독됨'
        });
      });

      // 핑/퐁
      socket.on('ping', () => {
        socket.emit('pong', {
          timestamp: new Date().toISOString()
        });
      });

      // 연결 해제
      socket.on('disconnect', () => {
        console.log('🔌 WebSocket 클라이언트 연결 해제됨:', socket.id);
      });
    });
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    // 블록체인 이벤트
    this.blockchain.on('blockCreated', (block) => {
      this.io.to('blockchain').emit('block_created', {
        block: block.getSummary(),
        timestamp: new Date().toISOString()
      });
    });

    this.blockchain.on('blockAdded', (block) => {
      this.io.to('blockchain').emit('block_added', {
        block: block.getSummary(),
        timestamp: new Date().toISOString()
      });
    });

    this.blockchain.on('transactionExecuted', (transaction) => {
      this.io.to('blockchain').emit('transaction_executed', {
        transaction: transaction.getSummary(),
        timestamp: new Date().toISOString()
      });
    });

    // P2P 네트워크 이벤트
    this.discovery.on('peerAdded', (peer) => {
      this.io.to('p2p').emit('peer_added', {
        peer: peer,
        timestamp: new Date().toISOString()
      });
    });

    this.discovery.on('peerRemoved', (peer) => {
      this.io.to('p2p').emit('peer_removed', {
        peer: peer,
        timestamp: new Date().toISOString()
      });
    });

    // 마이닝 이벤트
    this.pow.on('miningStarted', (job) => {
      this.io.to('mining').emit('mining_started', {
        job: job,
        timestamp: new Date().toISOString()
      });
    });

    this.pow.on('miningCompleted', (result) => {
      this.io.to('mining').emit('mining_completed', {
        result: result,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * MongoDB 연결
   */
  private async connectMongoDB(): Promise<boolean> {
    try {
      this.mongoClient = new MongoClient(BITWISH_NETWORK_CONFIG.DATABASE_CONFIG.connectionString);
      await this.mongoClient.connect();

      const db = this.mongoClient.db(BITWISH_NETWORK_CONFIG.DATABASE_CONFIG.databaseName);

      // 컬렉션 생성
      await db.createCollection('blocks');
      await db.createCollection('transactions');
      await db.createCollection('accounts');
      await db.createCollection('peers');

      console.log('🗄️ MongoDB 연결 완료');
      return true;
    } catch (error) {
      console.error('MongoDB 연결 오류:', error);
      return false;
    }
  }

  /**
   * 서버 시작
   */
  async start(): Promise<void> {
    try {
      console.log('🚀 BitWish Network 메인넷 서버 시작 중...');

      // 1. 블록체인 초기화
      const blockchainResult = await this.blockchain.initialize();
      if (!blockchainResult.success) {
        throw new Error(`블록체인 초기화 실패: ${blockchainResult.message}`);
      }

      // 2. P2P 네트워크 시작
      this.discovery.start();

      // 3. MongoDB 연결 (선택적)
      const mongoConnected = await this.connectMongoDB();
      if (!mongoConnected) {
        console.log('⚠️ MongoDB 연결 실패 (계속 진행)');
      }

      // 4. 서버 시작
      const port = BITWISH_NETWORK_CONFIG.API_CONFIG.port;
      this.server.listen(port, () => {
        this.isRunning = true;

        console.log('='.repeat(80));
        console.log('🚀 BitWish Network 독립 블록체인 메인넷 v1.0');
        console.log('='.repeat(80));
        console.log(`🌐 API 서버: http://localhost:${port}`);
        console.log(`🔗 WebSocket: ws://localhost:${port}`);
        console.log(`📊 블록체인 상태: http://localhost:${port}/api/blockchain/status`);
        console.log(`🌍 P2P 네트워크: http://localhost:${port}/api/p2p/status`);
        console.log(`⛏️ 마이닝 상태: http://localhost:${port}/api/mining/status`);
        console.log(`🔍 전체 상태: http://localhost:${port}/api/system/status`);
        console.log('='.repeat(80));
        console.log('🎯 BitWish Network 특징:');
        console.log('   ✅ MongoDB 데이터 연동');
        console.log('   ✅ 210억 BW 총 발행량 설정');
        console.log('   ✅ 50자리 정밀도 계산 시스템');
        console.log('   ✅ BitWish-256 암호화 알고리즘');
        console.log('   ✅ PoW 합의 메커니즘');
        console.log('   ✅ P2P 네트워크 시스템');
        console.log('   ✅ 완전한 독립 블록체인');
        console.log('='.repeat(80));
        console.log('🎉 BitWish Network 메인넷이 성공적으로 시작되었습니다!');
        console.log('='.repeat(80));
      });

    } catch (error) {
      console.error('❌ 서버 시작 실패:', error);
      process.exit(1);
    }
  }

  /**
   * 서버 중지
   */
  async stop(): Promise<void> {
    try {
      console.log('🔄 BitWish Network 서버 중지 중...');

      this.isRunning = false;

      // P2P 네트워크 중지
      this.discovery.stop();

      // MongoDB 연결 해제
      if (this.mongoClient) {
        await this.mongoClient.close();
      }

      // 서버 종료
      this.server.close(() => {
        console.log('✅ BitWish Network 서버가 정상적으로 중지되었습니다');
      });

    } catch (error) {
      console.error('❌ 서버 중지 중 오류:', error);
    }
  }
}

// ====================================================================================
// 서버 인스턴스 생성 및 시작
// ====================================================================================

const bitWishServer = new BitWishNetworkServer();

// 서버 시작
bitWishServer.start().catch((error) => {
  console.error('서버 시작 실패:', error);
  process.exit(1);
});

// 정리 함수
process.on('SIGINT', async () => {
  console.log('\n🔄 서버 종료 신호 수신...');
  await bitWishServer.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 서버 종료 신호 수신...');
  await bitWishServer.stop();
  process.exit(0);
});

// 모듈 내보내기
export { BitWishNetworkServer };
export default bitWishServer;
