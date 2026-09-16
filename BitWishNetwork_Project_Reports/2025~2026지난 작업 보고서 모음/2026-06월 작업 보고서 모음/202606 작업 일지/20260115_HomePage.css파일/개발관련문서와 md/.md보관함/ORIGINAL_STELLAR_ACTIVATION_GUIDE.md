# 🚀 Original Stellar 블록체인 통합 시스템 활성화 가이드

## 📋 개요

이 문서는 BitWish Network 홈페이지에 구현된 Original Stellar 블록체인 통합 시스템을 활성화하는 방법을 설명합니다. 현재 모든 Stellar 관련 코드는 주석 처리되어 있어 기존 가상 마이닝 테스트 시스템에 영향을 주지 않습니다.

## ⚠️ 주의사항

- **현재 상태**: 모든 Stellar 통합 코드는 주석 처리되어 있음
- **테스트 시스템**: 기존 가상 마이닝 시스템은 정상 작동 중
- **활성화 전**: 환경 변수 설정 및 보안 검토 필수
- **백업**: 활성화 전 반드시 현재 시스템 백업

## 🔧 사전 준비사항

### 1. 환경 변수 설정

`.env` 파일을 프로젝트 루트에 생성하고 다음 변수들을 설정하세요:

```bash
# Stellar 네트워크 설정
STELLAR_SECRET_KEY=your_stellar_secret_key_here
STELLAR_NETWORK=mainnet
BW_ISSUER_SECRET=your_bw_issuer_secret_key_here

# 데이터베이스 설정 (선택사항)
DATABASE_URL=your_database_connection_string
REDIS_URL=your_redis_connection_string

# 로깅 및 모니터링 설정
LOG_LEVEL=info
MONITORING_ENABLED=true
BACKUP_ENABLED=true
ALERT_WEBHOOK_URL=your_webhook_url_here
```

### 2. 보안 검토

- [ ] Stellar 시크릿 키 보안 확인
- [ ] BW 토큰 발행자 키 보안 확인
- [ ] 네트워크 접근 권한 검토
- [ ] 방화벽 설정 확인

### 3. 시스템 요구사항

- Node.js 16+ 
- npm 8+
- 최소 4GB RAM
- 안정적인 인터넷 연결
- Stellar 네트워크 접근 가능

## 🚀 활성화 단계

### 1단계: 주석 해제

다음 파일들의 주석을 해제하세요:

#### `src/config/stellarConfig.ts`
```typescript
// 파일 상단의 /* 와 */ 제거
// 모든 설정이 활성화됩니다
```

#### `src/services/stellarService.ts`
```typescript
// 파일 상단의 /* 와 */ 제거
// Stellar 블록체인 서비스가 활성화됩니다
```

#### `src/services/walletService.ts`
```typescript
// 파일 상단의 /* 와 */ 제거
// 지갑 관리 서비스가 활성화됩니다
```

#### `src/services/tokenService.ts`
```typescript
// 파일 상단의 /* 와 */ 제거
// BW 토큰 관리 서비스가 활성화됩니다
```

#### `src/services/miningService.ts`
```typescript
// 파일 상단의 /* 와 */ 제거
// 실제 마이닝 서비스가 활성화됩니다
```

#### `src/services/blockchainSyncService.ts`
```typescript
// 파일 상단의 /* 와 */ 제거
// 블록체인 동기화 서비스가 활성화됩니다
```

#### `src/services/errorHandlingService.ts`
```typescript
// 파일 상단의 /* 와 */ 제거
// 오류 처리 및 로깅 서비스가 활성화됩니다
```

#### `src/services/originalStellarManager.ts`
```typescript
// 파일 상단의 /* 와 */ 제거
// 통합 매니저가 활성화됩니다
```

### 2단계: App.tsx 수정

`src/App.tsx` 파일에서 다음 코드를 추가하세요:

```typescript
// 파일 상단에 import 추가
import { 
  originalStellarManager, 
  initializeOriginalStellarManager,
  startSystemMonitoring 
} from './services/originalStellarManager';

// App 컴포넌트 내부에 useEffect 추가
useEffect(() => {
  const initializeStellarSystem = async () => {
    try {
      console.log('🚀 Stellar 블록체인 통합 시스템 초기화 시작...');
      
      const initialized = await initializeOriginalStellarManager();
      if (initialized) {
        console.log('✅ Stellar 시스템 초기화 완료');
        
        // 시스템 모니터링 시작
        await startSystemMonitoring();
        console.log('📊 시스템 모니터링 시작');
      } else {
        console.error('❌ Stellar 시스템 초기화 실패');
      }
    } catch (error) {
      console.error('❌ Stellar 시스템 초기화 중 오류 발생:', error);
    }
  };

  // 지갑 인증 시에만 Stellar 시스템 초기화
  if (authenticatedWalletAddress) {
    initializeStellarSystem();
  }
}, [authenticatedWalletAddress]);
```

### 3단계: 가상 마이닝 함수 교체

기존 가상 마이닝 함수들을 실제 Stellar 함수로 교체하세요:

```typescript
// 기존 가상 마이닝 함수들을 주석 처리하고
// 실제 Stellar 함수로 교체

// 예시: 마이닝 시작
const startMining = async () => {
  try {
    if (!authenticatedWalletAddress) {
      alert('지갑을 먼저 인증해주세요.');
      return;
    }

    // 가상 마이닝 대신 실제 Stellar 마이닝 사용
    const miningSession = await originalStellarManager.startMining(authenticatedWalletAddress);
    
    setIsMiningActive(true);
    setMiningStartTime(new Date());
    
    console.log('✅ 실제 Stellar 마이닝 시작:', miningSession);
    
  } catch (error) {
    console.error('❌ 마이닝 시작 실패:', error);
    alert('마이닝 시작에 실패했습니다: ' + error.message);
  }
};

// 예시: 마이닝 정지
const stopMining = async () => {
  try {
    // 활성 마이닝 세션 찾기
    const activeSessions = originalStellarManager.getActiveSessions();
    const userSession = activeSessions.find(session => 
      session.walletAddress === authenticatedWalletAddress
    );

    if (userSession) {
      await originalStellarManager.stopMining(userSession.id);
    }

    setIsMiningActive(false);
    setMiningStopTime(new Date());
    
    console.log('✅ 실제 Stellar 마이닝 정지');
    
  } catch (error) {
    console.error('❌ 마이닝 정지 실패:', error);
    alert('마이닝 정지에 실패했습니다: ' + error.message);
  }
};
```

### 4단계: 보상 계산 함수 교체

보상 계산을 실제 Stellar 시스템으로 교체하세요:

```typescript
// 기존 가상 보상 계산 함수들을 주석 처리하고
// 실제 Stellar 보상 계산 사용

const calculateRealTimeReward = async () => {
  try {
    if (!authenticatedWalletAddress || !isMiningActive) {
      return;
    }

    // 실제 Stellar 마이닝 통계 조회
    const miningStats = await originalStellarManager.getMiningStatistics();
    const userSession = miningStats.activeSessions.find(session => 
      session.walletAddress === authenticatedWalletAddress
    );

    if (userSession) {
      // 실제 보상 계산
      const bonusCalculation = await originalStellarManager.calculateBonusRates(
        userSession.consecutiveDays,
        userSession.referralCount,
        userSession.lockupRatio,
        userSession.lockupMonths
      );

      // UI 업데이트
      setRealTimeBlockchainData(prev => ({
        ...prev,
        attendanceBonus: bonusCalculation.attendanceBonus,
        referralBonus: bonusCalculation.referralBonus,
        lockupBonus: bonusCalculation.lockupBonus,
        miningRewards: bonusCalculation.totalReward,
        lastUpdate: new Date()
      }));
    }
  } catch (error) {
    console.error('❌ 실시간 보상 계산 실패:', error);
  }
};
```

### 6단계: 가상 지갑 상태(테스트용) 제거

**오리지널 Stellar 블록체인 접목 시 가상 지갑 상태 시스템을 완전히 제거하세요:**

```typescript
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
const [stellarWalletBalance, setStellarWalletBalance] = useState<number>(0);
const [stellarWalletAddress, setStellarWalletAddress] = useState<string>('');

// 실제 Stellar 지갑 잔액 조회
const refreshStellarWalletBalance = async () => {
  try {
    if (authenticatedWalletAddress) {
      const balance = await originalStellarManager.getWalletBalance(authenticatedWalletAddress);
      setStellarWalletBalance(balance);
    }
  } catch (error) {
    console.error('❌ Stellar 지갑 잔액 조회 실패:', error);
  }
};

// 실제 Stellar 지갑 상태 표시 (가상 지갑 대체)
const displayStellarWalletStatus = () => {
  return (
    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
      <h4 className="text-sm font-bold text-green-800 mb-2 text-center">🌐 실제 Stellar 지갑 상태</h4>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="text-center">
          <div className="font-semibold text-green-600">
            {stellarWalletBalance.toFixed(7)} BW
          </div>
          <p className="text-green-500">실제 잔액</p>
        </div>
        <div className="text-center">
          <div className="font-semibold text-green-600">
            {stellarWalletAddress ? `${stellarWalletAddress.slice(0, 8)}...${stellarWalletAddress.slice(-8)}` : '연결 안됨'}
          </div>
          <p className="text-green-500">지갑 주소</p>
        </div>
      </div>
    </div>
  );
};
```

## 🔍 활성화 확인

### 1. 콘솔 로그 확인

브라우저 개발자 도구 콘솔에서 다음 메시지들을 확인하세요:

```
🚀 Original Stellar 블록체인 통합 시스템 초기화 시작...
🔧 오류 처리 서비스 초기화 중...
✅ 오류 처리 서비스 초기화 완료
🔧 Stellar 서비스 초기화 중...
✅ Stellar 서비스 초기화 완료
🔧 지갑 서비스 초기화 중...
✅ 지갑 서비스 초기화 완료
🔧 토큰 서비스 초기화 중...
✅ 토큰 서비스 초기화 완료
🔧 마이닝 서비스 초기화 중...
✅ 마이닝 서비스 초기화 완료
🔧 블록체인 동기화 서비스 초기화 중...
✅ 블록체인 동기화 서비스 초기화 완료
🔄 블록체인 동기화 시작...
✅ Original Stellar 블록체인 통합 시스템 초기화 완료
```

### 2. 시스템 상태 확인

```typescript
// 브라우저 콘솔에서 실행
const systemInfo = await originalStellarManager.getSystemInfo();
console.log('시스템 정보:', systemInfo);

const healthCheck = await originalStellarManager.performHealthCheck();
console.log('상태 점검:', healthCheck);
```

### 3. 네트워크 연결 확인

```typescript
// Stellar 서버 연결 상태 확인
const stellarStatus = await originalStellarManager.checkSystemHealth();
console.log('Stellar 연결 상태:', stellarStatus);
```

## 🚨 문제 해결

### 일반적인 오류

#### 1. 환경 변수 누락
```
❌ 필수 환경 변수 누락: STELLAR_SECRET_KEY
```
**해결방법**: `.env` 파일에 모든 필수 환경 변수를 설정하세요.

#### 2. Stellar 서버 연결 실패
```
❌ Stellar 서버 연결 실패
```
**해결방법**: 
- 인터넷 연결 확인
- 방화벽 설정 확인
- Stellar 네트워크 상태 확인

#### 3. 토큰 서비스 초기화 실패
```
❌ 토큰 서비스 초기화 실패
```
**해결방법**:
- `BW_ISSUER_SECRET` 환경 변수 확인
- 발행자 계정 존재 여부 확인
- Stellar 네트워크 설정 확인

### 디버깅 도구

```typescript
// 상세한 오류 로그 조회
const errorLogs = await originalStellarManager.getErrorLogs();
console.log('오류 로그:', errorLogs);

// 애플리케이션 로그 조회
const appLogs = await originalStellarManager.getApplicationLogs();
console.log('애플리케이션 로그:', appLogs);

// 성능 메트릭 조회
const metrics = await originalStellarManager.getPerformanceMetrics();
console.log('성능 메트릭:', metrics);
```

## 🔄 롤백 방법

만약 문제가 발생하여 기존 시스템으로 되돌려야 할 경우:

### 1. 즉시 롤백
```typescript
// 모든 Stellar 서비스 정리
await originalStellarManager.cleanup();

// 가상 마이닝 시스템으로 복원
// (기존 코드의 주석을 다시 추가)
```

### 2. 완전 롤백
1. 모든 Stellar 관련 파일의 주석을 다시 추가
2. `App.tsx`에서 Stellar 관련 코드 제거
3. 환경 변수 제거
4. 시스템 재시작

## 📊 모니터링 및 유지보수

### 1. 자동 모니터링
- 시스템 상태 자동 점검 (5분 간격)
- 오류 로그 자동 수집
- 성능 메트릭 자동 수집

### 2. 수동 점검
```typescript
// 주기적으로 실행 권장
const healthCheck = await originalStellarManager.performHealthCheck();
const systemInfo = await originalStellarManager.getSystemInfo();
const performanceMetrics = await originalStellarManager.getPerformanceMetrics();
```

### 3. 백업 및 복구
```typescript
// 정기적인 백업 권장
const backup = await originalStellarManager.backupSystemData();
// backup 데이터를 안전한 곳에 저장

// 필요시 복구
await originalStellarManager.restoreSystemData(backup);
```

## 🎯 다음 단계

Stellar 시스템이 성공적으로 활성화된 후:

1. **테스트**: 소규모 마이닝 세션으로 시스템 테스트
2. **모니터링**: 시스템 안정성 및 성능 모니터링
3. **최적화**: 필요에 따라 설정 조정
4. **확장**: 추가 기능 및 서비스 구현

## 📞 지원

문제가 발생하거나 추가 지원이 필요한 경우:

1. 오류 로그 수집
2. 시스템 상태 정보 수집
3. 환경 설정 정보 확인
4. 개발팀에 상세 정보 전달

---

**⚠️ 중요**: 이 가이드를 따라 시스템을 활성화하기 전에 반드시 백업을 수행하고, 테스트 환경에서 먼저 검증하세요.
