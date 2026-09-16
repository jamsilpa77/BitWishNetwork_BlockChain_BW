# 🚀 오리지널 스텔라 블록체인 연동 개발 가이드 & 기술 명세서

## 📋 목차
1. [시스템 개요](#시스템-개요)
2. [구현된 서비스 구조](#구현된-서비스-구조)
3. [주석 처리 및 분리 전략](#주석-처리-및-분리-전략)
4. [각 서비스별 상세 구현 내용](#각-서비스별-상세-구현-내용)
5. [App.tsx 연동 구현 가이드](#apptsx-연동-구현-가이드)
6. [활성화 단계별 가이드](#활성화-단계별-가이드)
7. [테스트 및 검증](#테스트-및-검증)
8. [문제 해결 가이드](#문제-해결-가이드)

---

## 🎯 시스템 개요

### 📊 현재 상태
- **가상 마이닝 테스트 시스템**: 완벽 작동 중
- **Stellar 블록체인 연동 코드**: 완전히 주석 처리되어 분리됨
- **목적**: 향후 실제 Stellar 메인넷과 즉시 연결 가능하도록 사전 구현

### 🔗 연동 대상
- **BitWishNetwork Stellar 블록체인 메인넷**
- **BW 토큰 (210억개)**
- **실제 블록 생성 및 마이닝 보상**
- **실시간 네트워크 동기화**

### 🚫 현재 비활성화 이유
- **테스트 환경 보호**: 기존 가상 마이닝 시스템 안전성 확보
- **개발 단계**: 실제 블록체인 연동 전 안정성 검증 필요
- **보안**: 실제 네트워크 연결 전 보안 검토 필요

---

## 🏗️ 구현된 서비스 구조

### 📁 파일 구조
```
src/
├── config/
│   └── stellarConfig.ts          # Stellar 네트워크 설정
├── services/
│   ├── stellarService.ts         # Stellar Horizon API 연동
│   ├── walletService.ts          # 지갑 관리
│   ├── tokenService.ts           # BW 토큰 관리
│   ├── miningService.ts          # 마이닝 노드 로직
│   ├── blockchainSyncService.ts  # 블록체인 동기화
│   ├── errorHandlingService.ts   # 오류 처리 및 로깅
│   └── originalStellarManager.ts # 전체 시스템 통합 관리
└── App.tsx                       # 메인 애플리케이션 (연동 코드 미구현)
```

### 🔧 서비스 계층 구조
```
App.tsx (UI Layer)
    ↓
OriginalStellarManager (Orchestration Layer)
    ↓
[StellarService, WalletService, TokenService, 
 MiningService, BlockchainSyncService, ErrorHandlingService]
    ↓
Stellar Blockchain Network
```

---

## 🚫 주석 처리 및 분리 전략

### 📝 주석 처리 방식
```typescript
/* 
 * =====================================================
 * STELLAR_INTEGRATION_START
 * =====================================================
 * 이 섹션은 향후 오리지널 Stellar 블록체인과 연동하기 위해 구현되었습니다.
 * 현재는 완전히 주석 처리되어 가상 마이닝 시스템에 영향을 주지 않습니다.
 * 
 * 활성화 방법:
 * 1. 이 주석 블록 전체를 제거
 * 2. 관련 import 문 주석 해제
 * 3. 환경변수 설정
 * 4. App.tsx에서 OriginalStellarManager 초기화
 * =====================================================
 */

// 모든 Stellar 연동 코드

/* 
 * =====================================================
 * STELLAR_INTEGRATION_END
 * =====================================================
 */
```

### 🛡️ 분리 보장 전략
1. **완전한 주석 처리**: 모든 Stellar 코드를 주석으로 감싸기
2. **변수명 격리**: Stellar 관련 변수명에 `stellar_` 접두사 사용
3. **함수명 격리**: Stellar 관련 함수명에 `stellar_` 접두사 사용
4. **타입 격리**: Stellar 관련 타입을 별도 네임스페이스로 분리
5. **상태 격리**: Stellar 관련 상태를 완전히 분리된 객체로 관리

---

## 🔧 각 서비스별 상세 구현 내용

### 1️⃣ **stellarConfig.ts** - Stellar 네트워크 설정

#### 📍 구현 목적
- Stellar 네트워크 연결을 위한 모든 설정값 중앙 관리
- 환경별 설정 분리 (개발/테스트/프로덕션)
- 보안 설정 및 성능 최적화 설정

#### 🎯 주석 처리 이유
- **테스트 환경 보호**: 실제 네트워크 연결 방지
- **설정 보안**: 민감한 설정값 노출 방지
- **환경 분리**: 개발/프로덕션 환경 혼재 방지

#### 🔑 핵심 설정 항목
```typescript
// 네트워크 설정
STELLAR_CONFIG: {
  HORIZON_URL: "https://horizon.stellar.org", // 메인넷
  TESTNET_URL: "https://horizon-testnet.stellar.org", // 테스트넷
  NETWORK_PASSPHRASE: "Public Global Stellar Network ; September 2015",
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3
}

// BW 토큰 설정
BW_TOKEN_CONFIG: {
  ASSET_CODE: "BW",
  ISSUER_ADDRESS: "YOUR_ISSUER_ADDRESS",
  TOTAL_SUPPLY: 21000000000, // 210억개
  DECIMALS: 7
}

// 마이닝 설정
MINING_CONFIG: {
  BASE_RATE: 0.125, // 기본 채굴률
  BLOCK_TIME: 5, // 5초 블록 생성
  HALVING_INTERVAL: 210000 // 21만 블록마다 반감기
}

// 보너스 설정
BONUS_CONFIG: {
  ATTENDANCE: [0.9, 1.8, 2.7, 3.6, 4.5], // 출석 보너스 단계
  REFERRAL: [0.375, 0.75, 1.125, 1.5], // 추천 보너스 단계
  LOCKUP: [42, 84, 126, 168, 210] // 락업 보너스 단계
}
```

### 2️⃣ **stellarService.ts** - Stellar Horizon API 연동

#### 📍 구현 목적
- Stellar Horizon API와의 모든 통신 담당
- 서버 연결 상태 모니터링
- 블록체인 데이터 실시간 조회

#### 🎯 주석 처리 이유
- **API 호출 방지**: 실제 네트워크 요청 차단
- **테스트 환경 보호**: 외부 API 의존성 제거
- **성능 보호**: 불필요한 네트워크 요청 방지

#### 🔑 핵심 기능
```typescript
class StellarService {
  // 서버 연결 및 상태 확인
  async connect(): Promise<boolean>
  async checkServerHealth(): Promise<boolean>
  
  // 블록체인 데이터 조회
  async getLatestLedger(): Promise<LedgerResponse>
  async getAccount(address: string): Promise<AccountResponse>
  async getNetworkInfo(): Promise<NetworkInfo>
  
  // BW 토큰 정보 조회
  async getBWTokenInfo(): Promise<TokenInfo>
  
  // 트랜잭션 처리
  async createTransaction(operations: Operation[]): Promise<Transaction>
  async submitTransaction(transaction: Transaction): Promise<SubmitTransactionResponse>
  
  // 잔액 및 거래 내역
  async getBalance(address: string): Promise<Balance[]>
  async getTransactionHistory(address: string): Promise<TransactionHistory>
}
```

### 3️⃣ **walletService.ts** - 지갑 관리

#### 📍 구현 목적
- Stellar 지갑 연결 및 관리
- 지갑 잔액 실시간 추적
- KYC 상태 확인 및 관리

#### 🎯 주석 처리 이유
- **지갑 연결 방지**: 실제 지갑 접근 차단
- **보안 강화**: 개인키 노출 위험 방지
- **테스트 환경 보호**: 가상 지갑 시스템과 충돌 방지

#### 🔑 핵심 기능
```typescript
class WalletService {
  // 지갑 연결 관리
  async connectWallet(secretKey: string): Promise<WalletInfo>
  async disconnectWallet(): Promise<void>
  
  // 지갑 정보 관리
  async refreshWalletBalance(): Promise<Balance[]>
  async generateNewWallet(): Promise<KeyPair>
  async validateSecretKey(secretKey: string): Promise<boolean>
  
  // KYC 및 보안
  async checkKYCStatus(address: string): Promise<KYCStatus>
  async lockWallet(address: string): Promise<void>
  async unlockWallet(address: string, password: string): Promise<void>
  
  // 지갑 백업 및 복원
  async backupWallet(address: string): Promise<BackupData>
  async restoreWallet(backupData: BackupData): Promise<boolean>
}
```

### 4️⃣ **tokenService.ts** - BW 토큰 관리

#### 📍 구현 목적
- BW 토큰 발행 및 관리
- 마이닝 보상 분배
- 토큰 전송 및 거래 내역 관리

#### 🎯 주석 처리 이유
- **토큰 발행 방지**: 실제 토큰 생성 차단
- **테스트 환경 보호**: 가상 토큰 시스템과 충돌 방지
- **보안 강화**: 토큰 조작 위험 방지

#### 🔑 핵심 기능
```typescript
class TokenService {
  // 토큰 초기화 및 발행
  async initialize(): Promise<boolean>
  async issueBWToken(totalSupply: number): Promise<boolean>
  
  // 토큰 전송
  async transferBWToken(from: string, to: string, amount: number): Promise<boolean>
  async batchTransferBWToken(transfers: Transfer[]): Promise<boolean>
  
  // 마이닝 보상 분배
  async distributeMiningReward(address: string, amount: number): Promise<boolean>
  async distributeBonusReward(address: string, bonusType: string, amount: number): Promise<boolean>
  
  // 토큰 정보 조회
  async getBWTokenBalance(address: string): Promise<number>
  async getTokenInfo(): Promise<TokenInfo>
  async getTransferHistory(address: string): Promise<TransferHistory[]>
}
```

### 5️⃣ **miningService.ts** - 마이닝 노드 로직

#### 📍 구현 목적
- 실제 Stellar 블록체인 마이닝 노드 운영
- 보너스 계산 및 적용
- 마이닝 세션 관리

#### 🎯 주석 처리 이유
- **실제 마이닝 방지**: 블록체인 네트워크 부하 방지
- **테스트 환경 보호**: 가상 마이닝 시스템과 충돌 방지
- **리소스 보호**: 불필요한 컴퓨팅 자원 사용 방지

#### 🔑 핵심 기능
```typescript
class MiningService {
  // 마이닝 세션 관리
  async startMining(walletAddress: string): Promise<MiningSession>
  async stopMining(sessionId: string): Promise<boolean>
  async pauseMining(sessionId: string): Promise<boolean>
  async resumeMining(sessionId: string): Promise<boolean>
  
  // 보너스 계산
  async calculateBonusRates(
    attendanceDays: number,
    referralCount: number,
    lockupAmount: number
  ): Promise<BonusRates>
  
  // 보상 분배
  async distributeReward(
    sessionId: string,
    baseReward: number,
    bonusRates: BonusRates
  ): Promise<boolean>
  
  // 마이닝 통계
  async getActiveSessions(): Promise<MiningSession[]>
  async getMiningStatistics(): Promise<MiningStats>
}
```

### 6️⃣ **blockchainSyncService.ts** - 블록체인 동기화

#### 📍 구현 목적
- Stellar 블록체인과 실시간 동기화
- 블록 높이 및 네트워크 상태 모니터링
- 반감기 자동 적용

#### 🎯 주석 처리 이유
- **동기화 방지**: 실제 네트워크 연결 차단
- **테스트 환경 보호**: 가상 블록체인 데이터와 충돌 방지
- **성능 보호**: 불필요한 동기화 작업 방지

#### 🔑 핵심 기능
```typescript
class BlockchainSyncService {
  // 동기화 관리
  async startSync(): Promise<boolean>
  async stopSync(): Promise<boolean>
  async performSync(): Promise<SyncResult>
  
  // 블록체인 상태 조회
  async getBlockchainStatus(): Promise<BlockchainStatus>
  async getSyncStatus(): Promise<SyncStatus>
  
  // 네트워크 모니터링
  async monitorNetworkHealth(): Promise<NetworkHealth>
  async getNetworkStatistics(): Promise<NetworkStats>
  
  // 데이터 백업 및 복원
  async backupBlockchainData(): Promise<BackupData>
  async restoreBlockchainData(backupData: BackupData): Promise<boolean>
}
```

### 7️⃣ **errorHandlingService.ts** - 오류 처리 및 로깅

#### 📍 구현 목적
- Stellar 연동 과정의 모든 오류 처리
- 상세한 로그 기록 및 분석
- 오류 복구 및 재시도 로직

#### 🎯 주석 처리 이유
- **로그 누적 방지**: 불필요한 로그 파일 생성 방지
- **테스트 환경 보호**: 가상 시스템과 로그 충돌 방지
- **성능 보호**: 로깅 작업으로 인한 성능 저하 방지

#### 🔑 핵심 기능
```typescript
class ErrorHandlingService {
  // 오류 로깅
  async logError(error: Error, context: string): Promise<void>
  async log(message: string, level: LogLevel): Promise<void>
  
  // 오류 해결
  async resolveError(errorId: string): Promise<boolean>
  async retryOperation(operation: () => Promise<any>): Promise<any>
  
  // 통계 및 분석
  async getErrorStatistics(): Promise<ErrorStats>
  async getLogStatistics(): Promise<LogStats>
  
  // 로그 관리
  async exportErrorLogs(): Promise<string>
  async exportApplicationLogs(): Promise<string>
  async cleanupOldLogs(): Promise<void>
}
```

### 8️⃣ **originalStellarManager.ts** - 전체 시스템 통합 관리

#### 📍 구현 목적
- 모든 Stellar 서비스를 통합 관리
- 시스템 전체 상태 모니터링
- 통합 인터페이스 제공

#### 🎯 주석 처리 이유
- **시스템 초기화 방지**: 실제 Stellar 시스템 시작 차단
- **테스트 환경 보호**: 가상 마이닝 시스템과 충돌 방지
- **리소스 보호**: 불필요한 시스템 리소스 사용 방지

#### 🔑 핵심 기능
```typescript
class OriginalStellarManager {
  // 시스템 초기화 및 관리
  async initialize(): Promise<boolean>
  async cleanup(): Promise<void>
  
  // 시스템 상태 확인
  async checkSystemHealth(): Promise<SystemHealth>
  async performHealthCheck(): Promise<HealthCheckResult>
  
  // 마이닝 관리
  async startMining(walletAddress: string): Promise<MiningResult>
  async stopMining(sessionId: string): Promise<boolean>
  
  // 토큰 관리
  async issueBWToken(totalSupply: number): Promise<boolean>
  async transferBWToken(from: string, to: string, amount: number): Promise<boolean>
  
  // 시스템 정보
  async getSystemInfo(): Promise<SystemInfo>
  async getPerformanceMetrics(): Promise<PerformanceMetrics>
  
  // 설정 관리
  async validateConfiguration(): Promise<ValidationResult>
  async updateConfiguration(config: Partial<StellarConfig>): Promise<boolean>
}
```

---

## 🔗 App.tsx 연동 구현 가이드

### 📍 구현해야 할 내용
현재 `App.tsx`에는 Stellar 연동 코드가 구현되지 않았습니다. 다음을 추가해야 합니다:

#### 1️⃣ **Import 문 추가 (주석 처리)**
```typescript
/*
 * =====================================================
 * STELLAR_INTEGRATION_IMPORTS_START
 * =====================================================
 */
// import { OriginalStellarManager } from './services/originalStellarManager';
// import { StellarConfig } from './config/stellarConfig';
/*
 * =====================================================
 * STELLAR_INTEGRATION_IMPORTS_END
 * =====================================================
 */
```

#### 2️⃣ **상태 변수 추가 (주석 처리)**
```typescript
/*
 * =====================================================
 * STELLAR_INTEGRATION_STATE_START
 * =====================================================
 */
// const [stellarManager, setStellarManager] = useState<OriginalStellarManager | null>(null);
// const [stellarConnected, setStellarConnected] = useState<boolean>(false);
// const [stellarBlockHeight, setStellarBlockHeight] = useState<number>(0);
// const [stellarNetworkStatus, setStellarNetworkStatus] = useState<string>('disconnected');
/*
 * =====================================================
 * STELLAR_INTEGRATION_STATE_END
 * =====================================================
 */
```

#### 3️⃣ **useEffect 추가 (주석 처리)**
```typescript
/*
 * =====================================================
 * STELLAR_INTEGRATION_USE_EFFECT_START
 * =====================================================
 */
// useEffect(() => {
//   // Stellar 시스템 초기화
//   const initializeStellar = async () => {
//     try {
//       const manager = new OriginalStellarManager();
//       await manager.initialize();
//       setStellarManager(manager);
//       setStellarConnected(true);
//     } catch (error) {
//       console.error('Stellar 초기화 실패:', error);
//     }
//   };
//
//   initializeStellar();
// }, []);
/*
 * =====================================================
 * STELLAR_INTEGRATION_USE_EFFECT_END
 * =====================================================
 */
```

#### 4️⃣ **마이닝 함수 수정 (주석 처리)**
```typescript
/*
 * =====================================================
 * STELLAR_INTEGRATION_MINING_FUNCTIONS_START
 * =====================================================
 */
// const startStellarMining = async () => {
//   if (!stellarManager || !walletAddress) return;
//   
//   try {
//     const result = await stellarManager.startMining(walletAddress);
//     if (result.success) {
//       setMiningActive(true);
//       setMiningSessionId(result.sessionId);
//     }
//   } catch (error) {
//     console.error('Stellar 마이닝 시작 실패:', error);
//   }
// };
//
// const stopStellarMining = async () => {
//   if (!stellarManager || !miningSessionId) return;
//   
//   try {
//     await stellarManager.stopMining(miningSessionId);
//     setMiningActive(false);
//     setMiningSessionId(null);
//   } catch (error) {
//     console.error('Stellar 마이닝 정지 실패:', error);
//   }
// };
/*
 * =====================================================
 * STELLAR_INTEGRATION_MINING_FUNCTIONS_END
 * =====================================================
 */
```

#### 5️⃣ **실제 추천인 인증 및 보너스 시스템 구현 (주석 처리)**
```typescript
/*
 * =====================================================
 * STELLAR_INTEGRATION_REFERRAL_SYSTEM_START
 * =====================================================
 */

// 🎯 출석 보너스 계산 함수 (오리지널 Stellar 시스템)
// const calculateAttendanceBonus = (consecutiveDays: number): { bonusRate: number; enhancedRate: number; description: string } => {
//   // 사용자가 설정한 연속 출석일 수에 따른 보너스 계산
//   if (consecutiveDays >= 29) {
//     return {
//       bonusRate: 0.06,                    // 6%
//       enhancedRate: new Decimal(0.25).times(new Decimal(1.06)).toDecimalPlaces(8).toNumber(),  // 0.265 BW/시간
//       description: '🏆 장기 참여자 최고 보상'
//     };
//   } else if (consecutiveDays >= 22) {
//     return {
//       bonusRate: 0.03,                    // 3%
//       enhancedRate: new Decimal(0.25).times(new Decimal(1.03)).toDecimalPlaces(8).toNumber(),  // 0.2575 BW/시간
//       description: '🥈 꾸준한 참여 보상'
//     };
//   } else if (consecutiveDays >= 15) {
//     return {
//       bonusRate: 0.021,                   // 2.1%
//       enhancedRate: new Decimal(0.25).times(new Decimal(1.021)).toDecimalPlaces(8).toNumber(), // 0.25525 BW/시간
//       description: '🥉 중간 참여자 보상'
//     };
//   } else if (consecutiveDays >= 8) {
//     return {
//       bonusRate: 0.015,                   // 1.5%
//       enhancedRate: new Decimal(0.25).times(new Decimal(1.015)).toDecimalPlaces(8).toNumber(), // 0.25375 BW/시간
//       description: '📈 초기 참여자 보상'
//     };
//   } else if (consecutiveDays >= 1) {
//     return {
//       bonusRate: 0.009,                   // 0.9%
//       enhancedRate: new Decimal(0.25).times(new Decimal(1.009)).toDecimalPlaces(8).toNumber(), // 0.25225 BW/시간
//       description: '🌱 신규 참여자 보상'
//     };
//   } else {
//     return {
//       bonusRate: 0,                       // 0% - 사용자가 설정하지 않음
//       enhancedRate: 0.25,                // 0.25 BW/시간 (기본값)
//       description: '❌ 출석 보너스 미설정'
//     };
//   }
// };

// 🎯 추천인 보너스 계산 함수 (백서 정책 완벽 반영 - 오리지널 Stellar 시스템)
// const calculateReferralBonus = (referralCount: number): { 
//   bonusRate: number; 
//   enhancedRate: number; 
//   description: string; 
//   maxBonus: number;
//   instantBonus: number; // 즉시 보너스 1 BW
// } => {
//   // 🎯 백서 정책: 즉시 보너스 1 BW (중복 제거)
//   const instantBonus = 1.0; // 1 BW 즉시 보너스

//   // 🎯 구간별 차등 보너스율 (추가 보너스)
//   let additionalBonusRate = 0;
  
//   if (referralCount >= 91) {
//     // 91명 이상: 0.375% × N명
//     additionalBonusRate = referralCount * 0.00375;
//     return {
//       bonusRate: additionalBonusRate,
//       enhancedRate: new Decimal(0.25).times(new Decimal(1).plus(new Decimal(additionalBonusRate))).toDecimalPlaces(8).toNumber(),
//       description: '🏆 대규모 커뮤니티 구축',
//       maxBonus: additionalBonusRate * 100,
//       instantBonus: instantBonus
//     };
//   } else if (referralCount >= 61) {
//     // 61-90명: 0.6% × N명
//     additionalBonusRate = referralCount * 0.006;
//     return {
//       bonusRate: additionalBonusRate,
//       enhancedRate: new Decimal(0.25).times(new Decimal(1).plus(new Decimal(additionalBonusRate))).toDecimalPlaces(8).toNumber(),
//       description: '🌟 활발한 커뮤니티 운영',
//       maxBonus: 54, // 최대 54%
//       instantBonus: instantBonus
//     };
//   } else if (referralCount >= 31) {
//     // 31-60명: 0.9% × N명
//     additionalBonusRate = referralCount * 0.009;
//     return {
//       bonusRate: additionalBonusRate,
//       enhancedRate: new Decimal(0.25).times(new Decimal(1).plus(new Decimal(additionalBonusRate))).toDecimalPlaces(8).toNumber(),
//       description: '📈 성장하는 커뮤니티',
//       maxBonus: 54, // 최대 54%
//       instantBonus: instantBonus
//     };
//   } else if (referralCount >= 1) {
//     // 1-30명: 1.2% × N명
//     additionalBonusRate = referralCount * 0.012;
//     return {
//       bonusRate: additionalBonusRate,
//       enhancedRate: new Decimal(0.25).times(new Decimal(1).plus(new Decimal(additionalBonusRate))).toDecimalPlaces(8).toNumber(),
//       description: '🌱 초기 커뮤니티',
//       maxBonus: 36, // 최대 36%
//       instantBonus: instantBonus
//     };
//   } else {
//     // 0명: 보너스 없음
//     return {
//       bonusRate: 0,
//       enhancedRate: 0.25,
//       description: '❌ 추천인 없음',
//       maxBonus: 0,
//       instantBonus: 0
//     };
//   }
// };

// 🔒 락업 보너스 계산 함수 (오리지널 Stellar 시스템)
// const calculateLockupBonus = (lockupRatio: number, lockupMonths: number): { 
//   baseAPY: number; 
//   periodBonus: number; 
//   totalAPY: number; 
//   monthlyRate: number; 
//   enhancedRate: number;
//   description: string;
// } => {
//   // 사용자가 설정한 락업 비율과 기간에 따른 보너스 계산
//   let baseAPY = 0;
//   let description = '';
  
//   if (lockupRatio === 100) {
//     baseAPY = new Decimal(0.03).plus(new Decimal(lockupRatio).dividedBy(100).times(0.012)).toDecimalPlaces(8).toNumber();
//     description = '🏆 최고 락업 - 전체 자산 락업';
//   } else if (lockupRatio >= 75) {
//     baseAPY = new Decimal(0.021).plus(new Decimal(lockupRatio).minus(75).times(0.036).dividedBy(25)).toDecimalPlaces(8).toNumber();
//     description = '🚀 높은 락업 - 높은 보상';
//   } else if (lockupRatio >= 50) {
//     baseAPY = new Decimal(0.012).plus(new Decimal(lockupRatio).minus(50).times(0.036).dividedBy(25)).toDecimalPlaces(8).toNumber();
//     description = '⚖️ 중간 락업 - 균형잡힌 보상';
//   } else if (lockupRatio >= 25) {
//     baseAPY = new Decimal(0.006).plus(new Decimal(lockupRatio).minus(25).times(0.024).dividedBy(25)).toDecimalPlaces(8).toNumber();
//     description = '📊 낮은 락업 - 유연한 설정 가능';
//   } else if (lockupRatio >= 20) {
//     baseAPY = new Decimal(0.009).plus(new Decimal(lockupRatio).minus(20).times(0.006).dividedBy(5)).toDecimalPlaces(8).toNumber();
//     description = '🎯 표준 락업 - 균형잡힌 표준 락업';
//   } else {
//     baseAPY = 0;
//     description = '❌ 락업 보너스 미설정';
//   }
  
//   // 기간 보너스 계산 (12개월 이상 시)
//   let periodBonus = 0;
//   if (lockupMonths >= 12) {
//     periodBonus = new Decimal(lockupMonths).minus(12).dividedBy(24).times(0.006).toDecimalPlaces(8).toNumber();
//     if (periodBonus > 0.006) periodBonus = 0.006; // 최대 0.6%
//   }
  
//   let totalAPY = new Decimal(baseAPY).plus(periodBonus).toDecimalPlaces(8).toNumber();
//   if (totalAPY > 0.06) totalAPY = 0.06; // 최대 6% 제한
//   const monthlyRate = new Decimal(totalAPY).dividedBy(12).toDecimalPlaces(8).toNumber();
  
//   // 강화된 채굴률 계산
//   const enhancedRate = new Decimal(0.25).times(new Decimal(1).plus(monthlyRate)).toDecimalPlaces(8).toNumber();
  
//   return {
//     baseAPY,
//     periodBonus,
//     totalAPY,
//     monthlyRate,
//     enhancedRate,
//     description
//   };
// };

// 🏪 가맹점 보너스 계산 함수 (오리지널 Stellar 시스템)
// const calculateMerchantBonus = (isMerchantRegistered: boolean) => {
//   if (isMerchantRegistered) {
//     return {
//       bonusRate: 0.652, // 65.2%
//       description: '가맹점 등록 완료'
//     };
//   }
//   return {
//     bonusRate: 0,
//     description: '가맹점 미등록'
//   };
// };

// 🎯 실시간 마이닝 보상 계산 함수 (오리지널 Stellar 시스템)
// const calculateRealTimeMiningReward = () => {
//   // 기본 채굴률: 0.25 BW/시간
//   const baseRate = 0.25;
  
//   // 🎯 모든 보너스 적용 (출석, 추천, 락업, 가맹점)
//   const attendanceBonus = consecutiveAttendanceDays > 0 ? calculateAttendanceBonus(consecutiveAttendanceDays).bonusRate : 0;
//   const referralBonus = referralSystemState.additionalBonusRate || 0; // 추천 보너스
//   const lockupBonus = lockupRatio > 0 ? calculateLockupBonus(lockupRatio, lockupMonths).monthlyRate : 0; // 락업 보너스
//   const merchantBonus = calculateMerchantBonus(isMerchantRegistered).bonusRate; // 가맹점 보너스
  
//   // 🎯 정확한 강화된 채굴률 계산
//   const totalEnhancedRate = baseRate * (1 + attendanceBonus + referralBonus + lockupBonus + merchantBonus);
  
//   return {
//     baseRate,
//     attendanceBonus,
//     referralBonus,
//     lockupBonus,
//     merchantBonus,
//     totalEnhancedRate,
//     hourlyReward: totalEnhancedRate,
//     dailyReward: totalEnhancedRate * 24
//   };
// };

// 🎯 총 마이닝 보상 계산 함수 (오리지널 Stellar 시스템)
// const calculateTotalMiningReward = () => {
//   const rewardData = calculateRealTimeMiningReward();
  
//   // 🎯 백서 정확한 공식: (1 + 출석 + 추천인 + 락업) × 가맹점
//   const totalEnhancedRate = new Decimal(0.25).times(
//     new Decimal(1).plus(rewardData.attendanceBonus).plus(rewardData.referralBonus).plus(rewardData.lockupBonus).plus(rewardData.merchantBonus)
//   ).toDecimalPlaces(8).toNumber();
  
//   return {
//     baseRate: rewardData.baseRate,
//     attendanceBonus: rewardData.attendanceBonus,
//     referralBonus: rewardData.referralBonus,
//     lockupBonus: rewardData.lockupBonus,
//     merchantBonus: rewardData.merchantBonus,
//     totalEnhancedRate,
//     hourlyReward: totalEnhancedRate,
//     dailyReward: totalEnhancedRate * 24
//   };
// };

// 🚀 실제 Stellar 마이닝 시작 함수 (오리지널 시스템)
// const startStellarMining = async () => {
//   if (isMiningActive) return; // 이미 실행 중이면 아무것도 하지 않음

//   try {
//     console.log('🚀 실제 Stellar 블록체인 마이닝 시작 (백서 정확한 보너스 공식 적용)...');
    
//     // 🎯 백서 정확한 보너스 계산 (현재 설정값 사용)
//     const attendanceBonus = calculateAttendanceBonus(consecutiveAttendanceDays);
//     const referralBonus = calculateReferralBonus(referralCount);
//     const lockupBonus = calculateLockupBonus(lockupRatio, lockupMonths);
    
//     // 🎯 모든 보너스가 합산된 최종 채굴률 계산 (백서 정확한 공식)
//     const totalEnhancedRate = 0.25 * (1 + attendanceBonus.bonusRate + referralBonus.bonusRate + lockupBonus.monthlyRate + calculateMerchantBonus(isMerchantRegistered).bonusRate);
    
//     // 🎯 실제 Stellar 블록체인 마이닝 세션 시작
//     const miningSession = await originalStellarManager.startMining(authenticatedWalletAddress);
    
//     // 자동화된 상태 업데이트
//     setIsMiningActive(true);
//     setMiningStartTime(new Date());
    
//     console.log('✅ 실제 Stellar 블록체인 마이닝 시작:', miningSession);
    
//   } catch (error) {
//     console.error('❌ Stellar 마이닝 시작 실패:', error);
//     throw new Error('Stellar 마이닝 시작에 실패했습니다: ' + error.message);
//   }
// };

// ⏹️ 실제 Stellar 마이닝 정지 함수 (오리지널 시스템)
// const stopStellarMining = async () => {
//   try {
//     // 활성 마이닝 세션 자동 감지 및 정지
//     const activeSessions = originalStellarManager.getActiveSessions();
//     const userSession = activeSessions.find(session => 
//       session.walletAddress === authenticatedWalletAddress
//     );

//     if (userSession) {
//       await originalStellarManager.stopMining(userSession.id);
//     }

//     // 자동화된 상태 업데이트
//     setIsMiningActive(false);
//     setMiningStopTime(new Date());
    
//     console.log('✅ 실제 Stellar 블록체인 마이닝 정지');
    
//   } catch (error) {
//     console.error('❌ Stellar 마이닝 정지 실패:', error);
//     throw new Error('Stellar 마이닝 정지에 실패했습니다: ' + error.message);
//   }
// };

// 🎯 출석 체크 함수 (오리지널 Stellar 시스템)
// const toggleAttendance = (date: string) => {
//   const koreaTime = new Date();
//   const currentDate = koreaTime.toISOString().split('T')[0];
  
//   // 출석 체크는 오전 9시까지만 가능
//   const currentHour = koreaTime.getHours();
//   if (currentHour >= 9) {
//     alert('출석 체크는 오전 9시까지만 가능합니다.');
//     return;
//   }
  
//   // 이미 출석한 날짜인지 확인
//   if (attendanceCalendar[date]) {
//     alert('이미 출석한 날짜입니다.');
//     return;
//   }
  
//   // 출석 체크
//   setAttendanceCalendar(prev => ({
//     ...prev,
//     [date]: true
//   }));
  
//   // 연속 출석일 수 계산
//   const consecutiveDays = calculateConsecutiveDays();
//   setConsecutiveAttendanceDays(consecutiveDays);
  
//   console.log('✅ 출석 체크 완료:', { date, consecutiveDays });
//   alert(`출석 체크 완료! 연속 출석일: ${consecutiveDays}일`);
// };

// 🎯 연속 출석일 계산 함수 (오리지널 Stellar 시스템)
// const calculateConsecutiveDays = (): number => {
//   const today = new Date();
//   let consecutiveDays = 0;
//   let currentDate = new Date(today);
  
//   while (true) {
//     const dateString = currentDate.toISOString().split('T')[0];
//     if (attendanceCalendar[dateString]) {
//       consecutiveDays++;
//       currentDate.setDate(currentDate.getDate() - 1);
//     } else {
//       break;
//     }
//   }
  
//   return consecutiveDays;
// };

// 🎯 추천인 코드 인증 함수 (오리지널 Stellar 시스템)
// const handleReferralCodeVerification = async (referralCode: string) => {
//   try {
//     console.log('🎯 추천인 코드 인증 시작:', referralCode);
    
//     // 1. 추천 코드 유효성 검증
//     const referralValidation = await originalStellarManager.validateReferralCode(referralCode);
//     if (!referralValidation.isValid) {
//       throw new Error('유효하지 않은 추천 코드입니다.');
//     }
    
//     // 2. 가입자 지갑 주소 검증
//     const walletValidation = await originalStellarManager.validateWalletAddress(authenticatedWalletAddress);
//     if (!walletValidation.isValid) {
//       throw new Error('유효하지 않은 지갑 주소입니다.');
//     }
    
//     // 3. 중복 가입 방지
//     const existingUser = await originalStellarManager.checkExistingUser(authenticatedWalletAddress);
//     if (existingUser.exists) {
//       throw new Error('이미 가입된 지갑 주소입니다.');
//     }
    
//     // 4. 추천인 관계 생성
//     const referralRelationship = await originalStellarManager.createReferralRelationship({
//       referrerAddress: referralValidation.referrerAddress,
//       referralCode: referralCode,
//       newWalletAddress: authenticatedWalletAddress,
//       createdAt: new Date()
//     });
    
//     // 5. 자동화된 보너스 분배
//     await distributeReferralBonus(referralRelationship);
    
//     console.log('✅ 실제 추천인 인증 완료:', referralRelationship);
//     alert('추천인 인증이 완료되었습니다!');
    
//   } catch (error) {
//     console.error('❌ 실제 추천인 인증 실패:', error);
//     alert('추천인 인증에 실패했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
//   }
// };

// 🎯 자동화된 보너스 분배 함수 (오리지널 Stellar 시스템)
// const distributeReferralBonus = async (referralRelationship: any) => {
//   try {
//     // 1. 즉시 보너스 1 BW 분배 (백서 정책)
//     const instantBonus = new Decimal(1.0);
//     await originalStellarManager.transferBWToken(
//       originalStellarManager.getIssuerAddress(),
//       referralRelationship.referrerAddress,
//       instantBonus.toDecimalPlaces(7).toNumber()
//     );
    
//     // 2. 영구 보너스율 1.2% 적용 (백서 정책)
//     const permanentBonusRate = new Decimal(0.012);
//     await originalStellarManager.updateReferralBonusRate(
//       referralRelationship.referrerAddress,
//       permanentBonusRate.toDecimalPlaces(8).toNumber()
//     );
    
//     // 3. 구간별 추가 보너스 계산 및 적용
//     const currentReferralCount = await originalStellarManager.getReferralCount(
//       referralRelationship.referrerAddress
//     );
    
//     let additionalBonusRate = new Decimal(0);
//     if (currentReferralCount <= 30) {
//       additionalBonusRate = new Decimal(0.012).times(currentReferralCount); // 1.2% × N명
//     } else if (currentReferralCount <= 60) {
//       additionalBonusRate = new Decimal(0.009).times(currentReferralCount); // 0.9% × N명
//     } else if (currentReferralCount <= 90) {
//       additionalBonusRate = new Decimal(0.006).times(currentReferralCount); // 0.6% × N명
//     } else {
//       additionalBonusRate = new Decimal(0.00375).times(currentReferralCount); // 0.375% × N명
//     }
    
//     await originalStellarManager.updateAdditionalBonusRate(
//       referralRelationship.referrerAddress,
//       additionalBonusRate.toDecimalPlaces(8).toNumber()
//     );
    
//     console.log('✅ 실제 자동화된 보너스 분배 완료:', {
//       instantBonus: instantBonus.toDecimalPlaces(7).toNumber(),
//       permanentBonusRate: permanentBonusRate.toDecimalPlaces(8).toNumber(),
//       additionalBonusRate: additionalBonusRate.toDecimalPlaces(8).toNumber()
//     });
    
//   } catch (error) {
//     console.error('❌ 실제 보너스 분배 실패:', error);
//     throw error;
//   }
// };

/*
 * =====================================================
 * STELLAR_INTEGRATION_REFERRAL_SYSTEM_END
 * =====================================================
 */
```

#### 6️⃣ **가상 지갑 상태(테스트용) 제거 로직 (주석 처리)**
```typescript
/*
 * =====================================================
 * STELLAR_INTEGRATION_VIRTUAL_WALLET_REMOVAL_START
 * =====================================================
 */

// 🎯 가상 지갑 상태 제거 로직 (오리지널 Stellar 시스템)

// 1️⃣ virtualWalletBalances 상태 변수 제거
// const [virtualWalletBalances, setVirtualWalletBalances] = useState<{
//   [key: string]: {
//     balance: number;
//     instantBonus: number;
//     referralBonusRate: number;
//     referralCount: number;
//   };
// }>({});

// 2️⃣ "🎯 가상 지갑 상태 (테스트용)" UI 섹션 제거
// {authenticatedWalletAddress && virtualWalletBalances[authenticatedWalletAddress] && (
//   <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
//     <h4 className="text-sm font-bold text-blue-800 mb-2 text-center">🎯 가상 지갑 상태 (테스트용)</h4>
//     <div className="grid grid-cols-2 gap-3 text-xs">
//       <div className="text-center">
//         <div className="font-semibold text-blue-600">
//           {virtualWalletBalances[authenticatedWalletAddress].balance.toFixed(6)} BW
//         </div>
//         <p className="text-blue-500">총 잔액</p>
//       </div>
//       <div className="text-center">
//         <div className="font-semibold text-blue-600">
//           {virtualWalletBalances[authenticatedWalletAddress].instantBonus.toFixed(6)} BW
//         </div>
//         <p className="text-blue-500">즉시 보너스</p>
//       </div>
//     </div>
//   </div>
// )}

// 3️⃣ initializeVirtualWallet 함수 제거
// const initializeVirtualWallet = (walletAddress: string) => {
//   if (!virtualWalletBalances[walletAddress]) {
//     setVirtualWalletBalances(prev => ({
//       ...prev,
//       [walletAddress]: {
//         balance: 0,
//         instantBonus: 0,
//         referralBonusRate: 0,
//         referralCount: 0
//       }
//     }));
//   }
// };

// 4️⃣ addVirtualBW 함수 제거
// const addVirtualBW = (walletAddress: string, amount: number, type: 'instant' | 'permanent') => {
//   setVirtualWalletBalances(prev => {
//     const current = prev[walletAddress] || {
//       balance: 0,
//       instantBonus: 0,
//       referralBonusRate: 0,
//       referralCount: 0
//     };
//     
//     if (type === 'instant') {
//       return {
//         ...prev,
//         [walletAddress]: {
//           ...current,
//           balance: current.balance + amount,
//           instantBonus: current.instantBonus + amount
//         }
//       };
//     } else {
//       return {
//         ...prev,
//         [walletAddress]: {
//           ...current,
//           balance: current.balance + amount,
//           referralBonusRate: current.referralBonusRate + amount
//         }
//       };
//     }
//   });
// };

// 5️⃣ 가상 지갑 관련 모든 로직 제거
// - referralRelationships 상태 변수 제거
// - miningCalculationState 상태 변수 제거
// - 가상 지갑 관련 모든 함수 제거
// - 가상 지갑 관련 모든 UI 컴포넌트 제거

// 6️⃣ 실제 Stellar 지갑 시스템으로 교체
// 실제 Stellar 지갑 연결 및 상태 관리 시스템 사용
// const [stellarWalletBalance, setStellarWalletBalance] = useState<number>(0);
// const [stellarWalletAddress, setStellarWalletAddress] = useState<string>('');

// 실제 Stellar 지갑 잔액 조회
// const refreshStellarWalletBalance = async () => {
//   try {
//     if (authenticatedWalletAddress) {
//       const balance = await originalStellarManager.getWalletBalance(authenticatedWalletAddress);
//       setStellarWalletBalance(balance);
//     }
//   } catch (error) {
//     console.error('❌ Stellar 지갑 잔액 조회 실패:', error);
//   }
// };

// 실제 Stellar 지갑 상태 표시 (가상 지갑 대체)
// const displayStellarWalletStatus = () => {
//   return (
//     <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
//       <h4 className="text-sm font-bold text-green-800 mb-2 text-center">🌐 실제 Stellar 지갑 상태</h4>
//       <div className="grid grid-cols-2 gap-3 text-xs">
//         <div className="text-center">
//           <div className="font-semibold text-green-600">
//             {stellarWalletBalance.toFixed(7)} BW
//           </div>
//           <p className="text-green-500">실제 잔액</p>
//         </div>
//         <div className="text-center">
//           <div className="font-semibold text-green-600">
//             {stellarWalletAddress ? `${stellarWalletAddress.slice(0, 8)}...${stellarWalletAddress.slice(-8)}` : '연결 안됨'}
//           </div>
//           <p className="text-green-500">지갑 주소</p>
//         </div>
//       </div>
//     </div>
//   );
// };

/*
 * =====================================================
 * STELLAR_INTEGRATION_VIRTUAL_WALLET_REMOVAL_END
 * =====================================================
 */
```
