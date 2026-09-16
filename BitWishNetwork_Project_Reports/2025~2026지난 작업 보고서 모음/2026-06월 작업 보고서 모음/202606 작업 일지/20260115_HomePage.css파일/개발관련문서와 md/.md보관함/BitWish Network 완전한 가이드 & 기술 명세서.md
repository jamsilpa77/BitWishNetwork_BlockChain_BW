# 🚀 BitWish Network 완전한 가이드 & 기술 명세서

## 📋 목차

1. [BitWish Network 개요](#bitwish-network-개요)
2. [시스템 아키텍처](#시스템-아키텍처)
3. [보안 시스템](#보안-시스템)
4. [지갑 시스템](#지갑-시스템)
5. [블록체인 시스템](#블록체인-시스템)
6. [API 명세서](#api-명세서)
7. [설치 및 설정](#설치-및-설정)
8. [개발 가이드](#개발-가이드)
9. [운영 가이드](#운영-가이드)
10. [문제 해결](#문제-해결)

---

## 🎯 BitWish Network 개요

### 프로젝트 소개

BitWish Network는 완전한 블록체인 생태계를 제공하는 차세대 분산 네트워크입니다. 독립적인 블록체인, 지갑 시스템, DeFi, NFT, 거버넌스, P2P 네트워크를 통합한 올인원 플랫폼입니다.

### 핵심 특징

- **🔒 완벽한 보안**: 시드문구 저장 금지, 블록체인 원칙 준수
- **🌐 독립 블록체인**: PoW + PoS 하이브리드 컨센서스
- **💼 통합 생태계**: 지갑, DeFi, NFT, 거버넌스 통합
- **🚀 고성능**: 실시간 트랜잭션 처리
- **🌍 글로벌**: 4개국 언어 지원 (한국어, 영어, 일본어, 중국어)

### 기술 스택

- **Backend**: Node.js, Express.js
- **Frontend**: React, TypeScript
- **Database**: MongoDB, JSON 파일 저장소
- **Blockchain**: 독립 BitWish 블록체인
- **Security**: AES-256 암호화, BIP39 표준
- **Network**: WebSocket P2P 네트워크

---

## 🏗️ 시스템 아키텍처

### 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    BitWish Network                          │
├─────────────────────────────────────────────────────────────┤
│  Frontend Layer (React + TypeScript)                       │
│  ├── 지갑 관리 시스템                                        │
│  ├── 블록체인 익스플로러                                     │
│  ├── DeFi 인터페이스                                        │
│  ├── NFT 마켓플레이스                                        │
│  └── 거버넌스 대시보드                                       │
├─────────────────────────────────────────────────────────────┤
│  API Layer (Express.js)                                     │
│  ├── 지갑 API (/api/bitwish/wallet/*)                       │
│  ├── 블록체인 API (/api/bitwish/blockchain/*)               │
│  ├── 거래 API (/api/bitwish/transaction/*)                  │
│  ├── 마이닝 API (/api/mining/*)                             │
│  └── 거버넌스 API (/api/governance/*)                       │
├─────────────────────────────────────────────────────────────┤
│  Core Services Layer                                        │
│  ├── BitWishBlockchainCore                                  │
│  ├── BitWishWalletSystem                                    │
│  ├── BitWishP2PNetwork                                      │
│  ├── BitWishConsensusSystem                                 │
│  ├── BitWishTokenEconomy                                    │
│  ├── BitWishNFTSystem                                       │
│  ├── BitWishGovernanceSystem                                │
│  └── BitWishSecuritySystem                                  │
├─────────────────────────────────────────────────────────────┤
│  Storage Layer                                              │
│  ├── 하이브리드 저장소 (메모리 + 파일 + MongoDB)             │
│  ├── 블록체인 데이터 저장소                                  │
│  ├── 지갑 데이터 저장소                                      │
│  └── 트랜잭션 기록 저장소                                    │
├─────────────────────────────────────────────────────────────┤
│  Network Layer                                              │
│  ├── P2P 네트워크 (WebSocket)                               │
│  ├── 블록체인 노드 네트워크                                  │
│  └── 외부 API 연동                                          │
└─────────────────────────────────────────────────────────────┘
```

### 핵심 컴포넌트

#### 1. BitWishBlockchainCore
- **역할**: 블록체인 핵심 엔진
- **기능**: 블록 생성, 트랜잭션 처리, 컨센서스
- **특징**: PoW + PoS 하이브리드

#### 2. BitWishWalletSystem
- **역할**: 지갑 관리 시스템
- **기능**: 지갑 생성, 시드문구 관리, 트랜잭션 서명
- **보안**: 시드문구 저장 금지, BIP39 표준

#### 3. BitWishP2PNetwork
- **역할**: 분산 네트워크
- **기능**: 노드 발견, 메시지 라우팅, 동기화
- **프로토콜**: WebSocket 기반

#### 4. BitWishConsensusSystem
- **역할**: 컨센서스 메커니즘
- **기능**: 검증자 선택, 블록 검증, 스테이킹
- **알고리즘**: PoW + PoS 하이브리드

---

## 🔒 보안 시스템

### 보안 원칙

#### 1. 블록체인 원칙 준수
```javascript
// ❌ 절대 저장하지 않는 민감 정보
const FORBIDDEN_DATA = {
  seedPhrase: '시드문구',
  privateKey: '개인키',
  password: '비밀번호',
  seedHash: '시드문구 해시'
};

// ✅ 저장하는 공개 정보
const ALLOWED_DATA = {
  address: '지갑 주소',
  publicKey: '공개키',
  balance: '잔액',
  transactions: '거래 내역',
  metadata: '메타데이터'
};
```

#### 2. 시드문구 보안
- **생성**: BIP39 표준 24단어
- **저장**: 절대 저장하지 않음
- **검증**: 입력 시에만 검증 후 즉시 삭제
- **백업**: 사용자가 직접 관리

#### 3. 암호화 시스템
```javascript
// AES-256 암호화
const ENCRYPTION_KEY = crypto.scryptSync('bitwish-network-secure-key-2024', 'salt', 32);

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}
```

### 보안 강화 시스템

#### 1. 다중 인증
- 시드문구 검증
- 비밀번호 인증
- OTP (Google Authenticator)
- 2FA (이중 인증)

#### 2. 트랜잭션 보안
- 다중 서명 지원
- 하드웨어 지갑 연동
- 보안 정책 설정
- 위험 감지 시스템

#### 3. 감사 로그
```javascript
class BitWishSecuritySystem {
  getAuditLogs(walletAddress = null, startDate = null, endDate = null) {
    // 보안 이벤트 로그 조회
    // 로그인 시도, 트랜잭션 시도, 보안 정책 변경 등
  }

  detectThreats(walletAddress) {
    // 이상 패턴 감지
    // 다중 로그인 시도, 대량 트랜잭션, 비정상적인 접근 등
  }
}
```

---

## 💼 지갑 시스템

### 지갑 생성 과정

#### 1. 시드문구 생성
```javascript
const generateSeedPhrase = () => {
  const words = [
    'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
    // ... 2048개 BIP39 단어
  ];
  
  const seedPhrase = [];
  for (let i = 0; i < 24; i++) {
    const randomIndex = Math.floor(Math.random() * words.length);
    seedPhrase.push(words[randomIndex]);
  }
  
  return seedPhrase.join(' ');
};
```

#### 2. BitWish 주소 생성
```javascript
const generateBitWishWalletAddress = async (seedPhrase) => {
  try {
    // 시드문구를 SHA-256으로 해시화
    const encoder = new TextEncoder();
    const data = encoder.encode(seedPhrase);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // BitWish 주소: BW + 40자리 16진수
    return 'BW' + hashHex.substring(0, 40).toUpperCase();
  } catch (error) {
    console.error('BitWish wallet address generation error:', error);
    throw error;
  }
};
```

#### 3. 지갑 등록
```javascript
// 지갑 저장 (시드문구 제외)
const walletData = {
  address: generatedAddress,
  publicKey: generatedAddress,
  balance: '1.0000000',
  createdAt: new Date().toISOString(),
  networkType: 'BITWISH_MAINNET',
  status: 'active'
  // 시드문구는 절대 저장하지 않음
};

await saveWallet(walletData);
```

### 지갑 접근 과정

#### 1. 시드문구 검증
```javascript
const handleBitWishAuthentication = async () => {
  try {
    // 1. 시드문구 검증
    if (!validateBitWishSeedPhrase(seedPhrase)) {
      throw new Error('유효하지 않은 시드문구');
    }
    
    // 2. 주소 생성
    const generatedAddress = await generateBitWishWalletAddress(seedPhrase);
    
    // 3. 저장된 지갑과 매칭
    const storedWallet = await getWallet(generatedAddress);
    if (!storedWallet) {
      throw new Error('존재하지 않는 지갑');
    }
    
    // 4. 인증 성공 - 시드문구 즉시 삭제
    setSeedPhrase(''); // 메모리에서 삭제
    onWalletAuthenticated(generatedAddress);
    
  } catch (error) {
    console.error('지갑 인증 실패:', error);
  }
};
```

#### 2. 하이브리드 저장소
```javascript
// 지갑 저장 (메모리 + 파일 + MongoDB)
async function saveWallet(walletData) {
  try {
    // 1. 메모리에 저장
    walletDatabase.set(walletData.address, walletData);
    
    // 2. 파일에 저장
    saveWalletDatabaseToFile();
    
    // 3. MongoDB에 저장
    await saveWalletToMongoDB(walletData);
    
    console.log(`✅ 하이브리드 지갑 저장 완료: ${walletData.address}`);
  } catch (error) {
    console.error('❌ 하이브리드 지갑 저장 오류:', error);
  }
}
```

---

## ⛓️ 블록체인 시스템

### 블록체인 구조

#### 1. 블록 구조
```javascript
class BitWishBlockchainCore {
  createBlock(transactions, validatorAddress) {
    const block = {
      index: this.blocks.length,
      timestamp: Date.now(),
      transactions: transactions,
      previousHash: this.getCurrentBlock().hash,
      nonce: 0,
      validator: validatorAddress,
      hash: '',
      merkleRoot: this.calculateMerkleRoot(transactions),
      difficulty: this.calculateDifficulty(),
      gasUsed: this.calculateGasUsed(transactions),
      gasLimit: 10000000
    };
    
    block.hash = this.calculateBlockHash(block);
    return block;
  }
}
```

#### 2. 컨센서스 메커니즘
```javascript
class BitWishConsensusSystem {
  // PoW + PoS 하이브리드 컨센서스
  selectValidator() {
    const validators = this.getValidators();
    const stakedValidators = validators.filter(v => v.stakeAmount > 0);
    
    if (stakedValidators.length === 0) {
      return this.selectPoWValidator();
    }
    
    return this.selectPoSValidator(stakedValidators);
  }
  
  selectPoSValidator(validators) {
    // 스테이킹 양에 따른 가중치 선택
    const totalStake = validators.reduce((sum, v) => sum + v.stakeAmount, 0);
    const random = Math.random() * totalStake;
    
    let currentStake = 0;
    for (const validator of validators) {
      currentStake += validator.stakeAmount;
      if (random <= currentStake) {
        return validator.address;
      }
    }
    
    return validators[validators.length - 1].address;
  }
}
```

#### 3. 트랜잭션 처리
```javascript
class BitWishTransactionSystem {
  async createBitWishTransaction(fromAddress, toAddress, amount) {
    const transaction = {
      id: this.generateTransactionId(),
      from: fromAddress,
      to: toAddress,
      amount: amount,
      timestamp: Date.now(),
      nonce: await this.getNonce(fromAddress),
      gasPrice: '0.0000001',
      gasLimit: 21000,
      data: '',
      signature: '',
      hash: ''
    };
    
    return transaction;
  }
  
  async processTransaction(transaction) {
    // 1. 서명 검증
    if (!this.verifySignature(transaction)) {
      throw new Error('잘못된 서명');
    }
    
    // 2. 잔액 확인
    const balance = await this.getBalance(transaction.from);
    if (balance < transaction.amount + transaction.gasPrice * transaction.gasLimit) {
      throw new Error('잔액 부족');
    }
    
    // 3. 트랜잭션 실행
    await this.executeTransaction(transaction);
    
    return true;
  }
}
```

### P2P 네트워크

#### 1. 노드 연결
```javascript
class BitWishP2PNetwork {
  async startP2PServer() {
    try {
      const wss = new WebSocketServer({ port: this.port });
      
      wss.on('connection', (ws, req) => {
        this.handleNewConnection(ws, req);
      });
      
      this.server = wss;
      console.log(`✅ P2P 서버 시작: 포트 ${this.port}`);
      return true;
    } catch (error) {
      console.error('❌ P2P 서버 시작 실패:', error);
      return false;
    }
  }
  
  handleNewConnection(ws, req) {
    const peerId = this.generatePeerId();
    const peer = {
      id: peerId,
      ws: ws,
      address: req.socket.remoteAddress,
      port: req.socket.remotePort,
      connectedAt: Date.now(),
      lastPing: Date.now(),
      status: 'connected'
    };
    
    this.peers.set(peerId, peer);
    console.log(`🔗 새 피어 연결: ${peerId} (${peer.address}:${peer.port})`);
    
    // 환영 메시지 전송
    this.sendMessage(peerId, {
      type: 'welcome',
      peerId: this.nodeId,
      networkId: 'bitwish-mainnet',
      version: '1.0.0'
    });
  }
}
```

#### 2. 블록 동기화
```javascript
class BitWishP2PNetwork {
  async syncBlocks() {
    try {
      // 모든 피어에게 최신 블록 요청
      const syncRequest = {
        type: 'sync_request',
        fromBlock: this.getCurrentBlock().index,
        toBlock: -1 // 최신 블록까지
      };
      
      this.broadcastMessage(syncRequest);
      
      // 응답 대기 및 처리
      setTimeout(() => {
        this.processSyncResponses();
      }, 5000);
      
    } catch (error) {
      console.error('❌ 블록 동기화 실패:', error);
    }
  }
  
  handleSyncResponse(peerId, message) {
    const { blocks, transactions } = message.data;
    
    // 블록 검증 및 추가
    for (const block of blocks) {
      if (this.validateBlock(block)) {
        this.addBlock(block);
      }
    }
    
    // 트랜잭션 풀 업데이트
    for (const tx of transactions) {
      if (this.validateTransaction(tx)) {
        this.addTransactionToPool(tx);
      }
    }
  }
}
```

---

## 📡 API 명세서

### 지갑 API

#### 1. 지갑 생성
```http
POST /api/bitwish/wallet/create
Content-Type: application/json

{
  "seedPhrase": "abandon ability able about above absent absorb abstract absurd abuse access accident account accuse achieve acid acoustic acquire across act action actor actual adapt",
  "password": "securePassword123",
  "confirmPassword": "securePassword123"
}
```

**응답:**
```json
{
  "success": true,
  "wallet": {
    "address": "BW1234567890ABCDEF1234567890ABCDEF12345678",
    "publicKey": "BW1234567890ABCDEF1234567890ABCDEF12345678",
    "balance": "1.0000000",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "networkType": "BITWISH_MAINNET",
    "status": "active"
  },
  "message": "지갑이 성공적으로 생성되었습니다."
}
```

#### 2. 시드문구 검증
```http
POST /api/bitwish/wallet/verify-seed
Content-Type: application/json

{
  "address": "BW1234567890ABCDEF1234567890ABCDEF12345678",
  "seedPhrase": "abandon ability able about above absent absorb abstract absurd abuse access accident account accuse achieve acid acoustic acquire across act action actor actual adapt"
}
```

**응답:**
```json
{
  "success": true,
  "verified": true,
  "address": "BW1234567890ABCDEF1234567890ABCDEF12345678",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 3. 잔액 조회
```http
GET /api/bitwish/wallet/balance/BW1234567890ABCDEF1234567890ABCDEF12345678
```

**응답:**
```json
{
  "success": true,
  "balance": "1000.0000000",
  "availableBalance": "950.0000000",
  "lockedBalance": "50.0000000",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 블록체인 API

#### 1. 블록 정보 조회
```http
GET /api/bitwish/blockchain/block/123
```

**응답:**
```json
{
  "success": true,
  "block": {
    "index": 123,
    "timestamp": 1704067200000,
    "transactions": [
      {
        "id": "tx_123456789",
        "from": "BW1234567890ABCDEF1234567890ABCDEF12345678",
        "to": "BW8765432109FEDCBA9876543210FEDCBA98765432",
        "amount": "100.0000000",
        "timestamp": 1704067200000
      }
    ],
    "previousHash": "0000000000000000000000000000000000000000000000000000000000000000",
    "hash": "0000000000000000000000000000000000000000000000000000000000000001",
    "validator": "BW1111111111111111111111111111111111111111",
    "difficulty": 4,
    "nonce": 12345
  }
}
```

#### 2. 트랜잭션 조회
```http
GET /api/bitwish/blockchain/transaction/tx_123456789
```

**응답:**
```json
{
  "success": true,
  "transaction": {
    "id": "tx_123456789",
    "from": "BW1234567890ABCDEF1234567890ABCDEF12345678",
    "to": "BW8765432109FEDCBA9876543210FEDCBA98765432",
    "amount": "100.0000000",
    "timestamp": 1704067200000,
    "blockIndex": 123,
    "status": "confirmed",
    "gasUsed": 21000,
    "gasPrice": "0.0000001"
  }
}
```

### 마이닝 API

#### 1. 마이닝 시작
```http
POST /api/mining/start
Content-Type: application/json

{
  "walletAddress": "BW1234567890ABCDEF1234567890ABCDEF12345678",
  "settings": {
    "threads": 4,
    "intensity": "medium"
  }
}
```

**응답:**
```json
{
  "success": true,
  "sessionId": "mining_session_123456789",
  "message": "마이닝이 시작되었습니다.",
  "settings": {
    "threads": 4,
    "intensity": "medium",
    "estimatedHashRate": "1000 H/s"
  }
}
```

#### 2. 마이닝 상태 조회
```http
GET /api/mining/status/mining_session_123456789
```

**응답:**
```json
{
  "success": true,
  "session": {
    "id": "mining_session_123456789",
    "walletAddress": "BW1234567890ABCDEF1234567890ABCDEF12345678",
    "status": "running",
    "startTime": 1704067200000,
    "hashRate": "1050 H/s",
    "blocksMined": 2,
    "rewards": "0.5000000",
    "settings": {
      "threads": 4,
      "intensity": "medium"
    }
  }
}
```

### 거버넌스 API

#### 1. 제안 생성
```http
POST /api/governance/proposal/create
Content-Type: application/json

{
  "proposer": "BW1234567890ABCDEF1234567890ABCDEF12345678",
  "title": "네트워크 수수료 조정",
  "description": "트랜잭션 수수료를 0.0000001에서 0.0000002로 조정",
  "action": "parameter_change",
  "parameters": {
    "gasPrice": "0.0000002"
  },
  "amount": 0
}
```

**응답:**
```json
{
  "success": true,
  "proposal": {
    "id": "prop_123456789",
    "proposer": "BW1234567890ABCDEF1234567890ABCDEF12345678",
    "title": "네트워크 수수료 조정",
    "description": "트랜잭션 수수료를 0.0000001에서 0.0000002로 조정",
    "action": "parameter_change",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "votingEndsAt": "2024-01-08T00:00:00.000Z",
    "votes": {
      "yes": 0,
      "no": 0,
      "abstain": 0
    }
  }
}
```

#### 2. 투표
```http
POST /api/governance/vote
Content-Type: application/json

{
  "proposalId": "prop_123456789",
  "voter": "BW8765432109FEDCBA9876543210FEDCBA98765432",
  "vote": "yes",
  "reason": "네트워크 안정성을 위한 필요한 조정"
}
```

**응답:**
```json
{
  "success": true,
  "vote": {
    "proposalId": "prop_123456789",
    "voter": "BW8765432109FEDCBA9876543210FEDCBA98765432",
    "vote": "yes",
    "reason": "네트워크 안정성을 위한 필요한 조정",
    "votingPower": "1000.0000000",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 🛠️ 설치 및 설정

### 시스템 요구사항

- **Node.js**: 18.0.0 이상
- **MongoDB**: 4.4 이상 (선택사항)
- **RAM**: 4GB 이상
- **디스크**: 20GB 이상
- **OS**: Windows 10/11, macOS, Linux

### 설치 과정

#### 1. 저장소 클론
```bash
git clone https://github.com/salmani1-lds77/BW-Network-Node-HomePage.git
cd BW-Network-Node-HomePage/Node_HomePage
```

#### 2. 의존성 설치
```bash
npm install
```

#### 3. 환경 변수 설정
```bash
# .env 파일 생성
cp .env.example .env
```

**.env 파일 내용:**
```env
# BitWish Network 설정
BITWISH_NETWORK=mainnet
PORT=4001
FRONTEND_PORT=4000

# MongoDB 설정 (선택사항)
MONGODB_URI=mongodb://localhost:27017/bitwish-network

# 보안 설정
ENCRYPTION_KEY=your-secure-encryption-key-here

# 블록체인 네트워크 노드
BITWISH_MAINNET_NODES=mainnet.bitwish.network,node1.bitwish.network,node2.bitwish.network
BITWISH_TESTNET_NODES=testnet.bitwish.network,testnode1.bitwish.network

# P2P 네트워크 설정
P2P_PORT=8080
P2P_HOST=0.0.0.0

# 마이닝 설정
MINING_ENABLED=true
MINING_THREADS=4
MINING_INTENSITY=medium
```

#### 4. 서버 시작
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start

# 보안 저장소 서버
npm run secure
```

### Windows 자동 시작

#### 1. 배치 파일 실행
```cmd
start-bitwish-network.bat
```

#### 2. PowerShell 스크립트 실행
```powershell
.\start-bitwish-network.ps1
```

### Linux/macOS 자동 시작

#### 1. systemd 서비스 등록
```bash
# 서비스 파일 생성
sudo nano /etc/systemd/system/bitwish-network.service
```

**서비스 파일 내용:**
```ini
[Unit]
Description=BitWish Network Node
After=network.target

[Service]
Type=simple
User=bitwish
WorkingDirectory=/path/to/BW-Network-Node-HomePage/Node_HomePage
ExecStart=/usr/bin/node simple-server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### 2. 서비스 시작
```bash
sudo systemctl daemon-reload
sudo systemctl enable bitwish-network
sudo systemctl start bitwish-network
```

---

## 👨‍💻 개발 가이드

### 프로젝트 구조

```
Node_HomePage/
├── src/
│   ├── components/
│   │   ├── bitwish-wallet/
│   │   │   ├── BitWishWalletCreationModal.tsx
│   │   │   ├── BitWishSeedPhraseAuthModal.tsx
│   │   │   ├── BitWishWalletAuthModal.tsx
│   │   │   └── BitWishWalletDashboard.tsx
│   │   ├── kyc/
│   │   │   └── KYCApplicationModal.tsx
│   │   └── SocialShare.tsx
│   ├── pages/
│   │   └── MyWalletPage.tsx
│   └── i18n/
│       ├── index.ts
│       └── locales/
│           ├── ko.json
│           ├── en.json
│           ├── ja.json
│           └── zh.json
├── data/
│   └── walletDatabase.json
├── logs/
│   └── blockchain-monitor.log
├── uploads/
│   └── kyc/
├── simple-server.js
├── enhanced-wallet-storage.js
├── secure-wallet-storage.js
├── auto-start-server.js
├── package.json
├── package-lock.json
├── README.md
└── .env
```

### 핵심 클래스 구조

#### 1. BitWishBlockchainCore
```javascript
class BitWishBlockchainCore {
  constructor() {
    this.blocks = [];
    this.transactions = [];
    this.accounts = new Map();
    this.difficulty = 4;
    this.miningReward = '50.0000000';
  }

  // 블록 생성
  createBlock(transactions, validatorAddress) { }

  // 블록 검증
  validateBlock(block) { }

  // 트랜잭션 생성
  createTransaction(from, to, amount, data = '') { }

  // 트랜잭션 검증
  validateTransaction(transaction) { }

  // 트랜잭션 실행
  executeTransaction(transaction) { }

  // 계정 생성
  createAccount(address, initialBalance = 0) { }

  // 잔액 조회
  getBalance(address) { }

  // 잔액 설정
  setBalance(address, balance) { }

  // 논스 조회
  getNonce(address) { }

  // 논스 증가
  incrementNonce(address) { }

  // 블록 해시 계산
  calculateBlockHash(block) { }

  // 트랜잭션 해시 계산
  calculateTransactionHash(transaction) { }

  // 머클 루트 계산
  calculateMerkleRoot(transactions) { }

  // 난이도 계산
  calculateDifficulty() { }

  // 가스 사용량 계산
  calculateGasUsed(transactions) { }

  // 현재 블록 조회
  getCurrentBlock() { }

  // 블록 조회
  getBlock(height) { }

  // 트랜잭션 조회
  getTransaction(hash) { }

  // 계정 조회
  getAccount(address) { }

  // 블록체인 상태 조회
  getBlockchainState() { }
}
```

#### 2. BitWishWalletSystem
```javascript
class BitWishWalletSystem {
  constructor() {
    this.wallets = new Map();
    this.encryptedWallets = new Map();
  }

  // 지갑 생성
  createWallet(password, options = {}) { }

  // 지갑 복원
  restoreWallet(privateKey, password, options = {}) { }

  // 지갑 암호화
  encryptWallet(wallet, password) { }

  // 지갑 복호화
  decryptWallet(encryptedWallet, password) { }

  // 지갑 인증
  authenticateWallet(address, password) { }

  // 트랜잭션 서명
  signTransaction(address, password, transaction) { }

  // 잔액 조회
  getBalance(address) { }

  // 지갑 목록 조회
  getWallets() { }

  // 지갑 삭제
  deleteWallet(address, password) { }
}
```

#### 3. BitWishP2PNetwork
```javascript
class BitWishP2PNetwork {
  constructor() {
    this.peers = new Map();
    this.nodeId = this.generateNodeId();
    this.port = process.env.P2P_PORT || 8080;
    this.server = null;
  }

  // 노드 ID 생성
  generateNodeId() { }

  // P2P 서버 시작
  async startP2PServer() { }

  // 새 연결 처리
  handleNewConnection(ws, req) { }

  // 연결 해제 처리
  handleDisconnection(peerId) { }

  // 메시지 처리
  handleMessage(peerId, data) { }

  // 환영 메시지 처리
  handleWelcomeMessage(peerId, message) { }

  // 핑 메시지 처리
  handlePingMessage(peerId, message) { }

  // 퐁 메시지 처리
  handlePongMessage(peerId, message) { }

  // 블록 메시지 처리
  handleBlockMessage(peerId, message) { }

  // 트랜잭션 메시지 처리
  handleTransactionMessage(peerId, message) { }

  // 동기화 요청 처리
  handleSyncRequest(peerId, message) { }

  // 동기화 응답 처리
  handleSyncResponse(peerId, message) { }

  // 컨센서스 투표 처리
  handleConsensusVote(peerId, message) { }

  // 메시지 전송
  sendMessage(peerId, message) { }

  // 블록 브로드캐스트
  broadcastBlock(block, excludePeerId = null) { }

  // 트랜잭션 브로드캐스트
  broadcastTransaction(transaction, excludePeerId = null) { }

  // 피어 연결
  async connectToPeer(host, port) { }

  // 네트워크 상태 조회
  getNetworkStatus() { }

  // 핑퐁 시작
  startPingPong() { }

  // P2P 서버 중지
  async stopP2PServer() { }
}
```

### API 개발 가이드

#### 1. 새로운 API 엔드포인트 추가
```javascript
// simple-server.js에 추가
app.post('/api/bitwish/custom/endpoint', async (req, res) => {
  try {
    const { param1, param2 } = req.body;
    
    // 입력 검증
    if (!param1 || !param2) {
      return res.json({
        success: false,
        error: '필수 매개변수가 누락되었습니다.'
      });
    }
    
    // 비즈니스 로직 처리
    const result = await processCustomLogic(param1, param2);
    
    // 성공 응답
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ 커스텀 API 오류:', error);
    res.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
});
```

#### 2. 에러 처리 패턴
```javascript
// 표준 에러 응답 형식
const errorResponse = {
  success: false,
  error: '에러 메시지',
  code: 'ERROR_CODE',
  timestamp: new Date().toISOString()
};

// 성공 응답 형식
const successResponse = {
  success: true,
  data: {}, // 응답 데이터
  message: '성공 메시지',
  timestamp: new Date().toISOString()
};
```

#### 3. 로깅 패턴
```javascript
// 성공 로그
console.log(`✅ 작업 완료: ${description}`);

// 경고 로그
console.warn(`⚠️ 경고: ${warningMessage}`);

// 에러 로그
console.error(`❌ 오류: ${errorMessage}`);

// 정보 로그
console.log(`📊 정보: ${infoMessage}`);
```

### 프론트엔드 개발 가이드

#### 1. 컴포넌트 구조
```typescript
// React 컴포넌트 기본 구조
interface ComponentProps {
  // Props 타입 정의
}

const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // 상태 관리
  const [state, setState] = useState(initialState);
  
  // 이벤트 핸들러
  const handleEvent = async () => {
    try {
      // API 호출
      const response = await fetch('/api/endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 성공 처리
        setState(result.data);
      } else {
        // 에러 처리
        console.error('API 오류:', result.error);
      }
    } catch (error) {
      console.error('요청 오류:', error);
    }
  };
  
  return (
    <div>
      {/* JSX 내용 */}
    </div>
  );
};

export default Component;
```

#### 2. API 호출 패턴
```typescript
// API 호출 유틸리티 함수
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(`http://localhost:4001${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API 요청 실패');
    }
    
    return data;
  } catch (error) {
    console.error('API 호출 오류:', error);
    throw error;
  }
};

// 사용 예시
const fetchWalletBalance = async (address: string) => {
  return await apiCall(`/api/bitwish/wallet/balance/${address}`);
};
```

#### 3. 다국어 지원
```typescript
// i18n 사용 예시
import { useTranslation } from 'react-i18next';

const Component: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('wallet.title')}</h1>
      <p>{t('wallet.description')}</p>
      <button>{t('wallet.createButton')}</button>
    </div>
  );
};
```

---

## 🚀 운영 가이드

### 모니터링

#### 1. 시스템 상태 모니터링
```bash
# 서버 상태 확인
curl http://localhost:4001/health

# 블록체인 상태 확인
curl http://localhost:4001/api/bitwish/explorer/network/status

# 지갑 통계 확인
curl http://localhost:4001/api/bitwish/wallet/stats
```

#### 2. 로그 모니터링
```bash
# 실시간 로그 확인
tail -f logs/blockchain-monitor.log

# 에러 로그 필터링
grep "❌" logs/blockchain-monitor.log

# 성공 로그 필터링
grep "✅" logs/blockchain-monitor.log
```

#### 3. 성능 모니터링
```javascript
// 메모리 사용량 모니터링
setInterval(() => {
  const memUsage = process.memoryUsage();
  console.log(`📊 메모리 사용량: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
}, 60000);

// CPU 사용량 모니터링
const startUsage = process.cpuUsage();
setInterval(() => {
  const endUsage = process.cpuUsage(startUsage);
  const cpuPercent = (endUsage.user + endUsage.system) / 1000000;
  console.log(`📊 CPU 사용량: ${Math.round(cpuPercent * 100)}%`);
}, 60000);
```

### 백업 및 복구

#### 1. 데이터 백업
```bash
# 지갑 데이터베이스 백업
cp data/walletDatabase.json backup/walletDatabase_$(date +%Y%m%d_%H%M%S).json

# MongoDB 백업 (MongoDB 사용 시)
mongodump --db bitwish-network --out backup/mongodb_$(date +%Y%m%d_%H%M%S)

# 전체 시스템 백업
tar -czf backup/bitwish_network_$(date +%Y%m%d_%H%M%S).tar.gz Node_HomePage/
```

#### 2. 자동 백업 스크립트
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/path/to/backup"
DATE=$(date +%Y%m%d_%H%M%S)

# 백업 디렉토리 생성
mkdir -p $BACKUP_DIR/$DATE

# 지갑 데이터베이스 백업
cp data/walletDatabase.json $BACKUP_DIR/$DATE/

# 로그 파일 백업
cp -r logs/ $BACKUP_DIR/$DATE/

# 설정 파일 백업
cp .env $BACKUP_DIR/$DATE/

echo "✅ 백업 완료: $BACKUP_DIR/$DATE"
```

#### 3. 데이터 복구
```bash
# 지갑 데이터베이스 복구
cp backup/walletDatabase_20240101_120000.json data/walletDatabase.json

# MongoDB 복구 (MongoDB 사용 시)
mongorestore --db bitwish-network backup/mongodb_20240101_120000/

# 전체 시스템 복구
tar -xzf backup/bitwish_network_20240101_120000.tar.gz
```

### 보안 관리

#### 1. 방화벽 설정
```bash
# UFW 방화벽 설정 (Ubuntu/Debian)
sudo ufw allow 4001/tcp  # API 서버
sudo ufw allow 8080/tcp  # P2P 네트워크
sudo ufw allow 3000/tcp  # 블록체인 익스플로러
sudo ufw enable
```

#### 2. SSL/TLS 설정
```javascript
// HTTPS 서버 설정
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('ssl/private.key'),
  cert: fs.readFileSync('ssl/certificate.crt')
};

https.createServer(options, app).listen(443, () => {
  console.log('🔒 HTTPS 서버 시작: 포트 443');
});
```

#### 3. 접근 제어
```javascript
// IP 화이트리스트 설정
const whitelist = [
  '127.0.0.1',
  '192.168.1.0/24',
  '10.0.0.0/8'
];

app.use((req, res, next) => {
  const clientIP = req.ip