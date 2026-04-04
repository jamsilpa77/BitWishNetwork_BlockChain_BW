# BitWishNetwork Mining System - Complete Technical Specification
# BitWishNetwork 마이닝 시스템 - 완전한 기술 명세서

**Document Version:** 2.0.0  
**Last Updated:** 2025-11-30  
**Author:** BitWishNetwork Dev Team (Antigravity)

---

## 📋 목차 (Table of Contents)

1. [시스템 개요 (System Overview)](#1-시스템-개요-system-overview)
2. [시스템 아키텍처 (System Architecture)](#2-시스템-아키텍처-system-architecture)
3. [프론트엔드 구조 (Frontend Structure)](#3-프론트엔드-구조-frontend-structure)
4. [백엔드 구조 (Backend Structure)](#4-백엔드-구조-backend-structure)
5. [데이터베이스 스키마 (Database Schema)](#5-데이터베이스-스키마-database-schema)
6. [핵심 기능 명세 (Core Features)](#6-핵심-기능-명세-core-features)
7. [API 명세 (API Specification)](#7-api-명세-api-specification)
8. [보안 및 인증 (Security & Authentication)](#8-보안-및-인증-security--authentication)
9. [상수 및 설정 (Constants & Configuration)](#9-상수-및-설정-constants--configuration)
10. [배포 및 운영 (Deployment & Operations)](#10-배포-및-운영-deployment--operations)

---

## 1. 시스템 개요 (System Overview)

### 1.1 프로젝트 소개

**BitWishNetwork Mining System**은 사용자가 웹 브라우저를 통해 BW 토큰을 채굴하고, 지갑을 생성/관리하며, 다양한 보너스 활동(출석, 추천, 가맹점)에 참여할 수 있는 **웹 기반 하이브리드 마이닝 플랫폼**입니다.

**핵심 특징:**
- ✅ **완벽한 컴포넌트 독립성**: 전역 상태 관리 라이브러리 미사용
- ✅ **MongoDB 하이브리드 저장소**: 실시간 데이터 영구 저장
- ✅ **50자리 정밀도 연산**: Decimal.js 기반 고정밀 계산
- ✅ **실시간 동기화**: 30초 주기 자동 동기화
- ✅ **다국어 지원**: 한국어, 영어, 일본어, 중국어
- ✅ **관리자 페이지**: 실시간 모니터링 및 테스트 도구

### 1.2 핵심 설계 원칙

```
1. Zero Global State (전역 상태 배제)
   - Redux, Context API 등 전역 상태 관리 라이브러리 사용 금지
   - 각 컴포넌트는 독립적인 상태를 가지며 자체적으로 데이터 로드

2. Component Isolation (컴포넌트 독립성)
   - 모든 컴포넌트는 자체적으로 필요한 데이터를 로드하고 관리
   - 부모-자식 간의 의존성 최소화
   - Props Drilling 방지

3. Security First (보안 우선)
   - 클라이언트 측 지갑 생성 및 관리
   - 민감한 정보 암호화 저장
   - 2차 비밀번호 시스템

4. Real-Time Sync (실시간 동기화)
   - 30초 주기 자동 동기화
   - MongoDB 하이브리드 저장소
   - 페이지 새로고침 시에도 데이터 유지

5. Precision Calculation (정밀 계산)
   - Decimal.js 기반 50자리 정밀도
   - UI 표시는 8자리 소수점
   - 내부 계산은 50자리 정밀도 유지
```

### 1.3 기술 스택

**프론트엔드:**
- React 18.3.1 + TypeScript 5.3.3
- Webpack 5.89.0 (번들링)
- Decimal.js 10.4.3 (정밀 계산)
- Axios 1.13.2 (HTTP 클라이언트)
- BIP39 3.1.0 (지갑 생성)

**백엔드:**
- Node.js + Express 4.18.2
- TypeScript 5.3.3
- MongoDB 6.3.0 + Mongoose 8.9.5
- Decimal.js 10.4.3

**개발 도구:**
- Webpack Dev Server (프론트엔드)
- Nodemon (백엔드 자동 재시작)
- Concurrently (동시 실행)

---

## 2. 시스템 아키텍처 (System Architecture)

### 2.1 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                     User Browser                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  React Application (Port 5000)                        │  │
│  │  ├─ HomePage (메인 대시보드)                          │  │
│  │  ├─ MiningPage (개인 마이닝 페이지)                   │  │
│  │  ├─ AdminPage (관리자 페이지)                         │  │
│  │  └─ Modals (각종 모달 컴포넌트)                       │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/HTTPS
                       │ (Axios)
┌──────────────────────▼──────────────────────────────────────┐
│              Express Backend Server (Port 5001)              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  API Routes                                           │  │
│  │  ├─ /api/mining (마이닝 관련)                         │  │
│  │  ├─ /api/attendance (출석 체크)                       │  │
│  │  ├─ /api/admin (관리자 기능)                          │  │
│  │  └─ /api/user (사용자 관리)                           │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Controllers                                          │  │
│  │  ├─ MiningController (마이닝 로직)                    │  │
│  │  └─ UserController (사용자 로직)                      │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │ Mongoose
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              MongoDB Database (Port 27017)                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Collections                                          │  │
│  │  ├─ users (사용자 정보)                               │  │
│  │  ├─ miningstates (마이닝 상태)                        │  │
│  │  ├─ bonusrecords (보너스 기록)                        │  │
│  │  └─ monthlysettlements (월별 정산)                    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 데이터 흐름 (Data Flow)

```
1. 초기 로딩 (Initial Load)
   User → HomePage → RealTimeSyncService → UI Update

2. 마이닝 시작 (Start Mining)
   User → MiningPage → POST /api/mining/start → MongoDB
   → MiningState 생성/업데이트 → 30초 주기 동기화 시작

3. 출석 체크 (Attendance Check)
   User → AttendanceCalendar → POST /api/attendance/check
   → BonusRecord 업데이트 → MiningState 보너스율 적용

4. 실시간 동기화 (Real-Time Sync)
   Timer (30s) → POST /api/mining/sync → MongoDB
   → 누적 보상 계산 → MiningState 업데이트 → UI 갱신

5. 관리자 조회 (Admin Query)
   Admin → AdminPage → GET /api/admin/attendance/:wallet
   → BonusRecord + MiningState 조회 → 실시간 계산 → UI 표시
```

---

## 3. 프론트엔드 구조 (Frontend Structure)

### 3.1 디렉토리 구조

```
src/
├── components/          # UI 컴포넌트
│   ├── HomePage/       # 메인 대시보드
│   ├── MiningPage/     # 개인 마이닝 페이지
│   ├── AdminPage/      # 관리자 페이지
│   ├── Navigation/     # 네비게이션 바
│   ├── Language/       # 언어 선택기
│   ├── BonusSystem/    # 출석 캘린더
│   ├── MiningModal/    # 마이닝 모달
│   ├── MiningAuthModal/      # 마이닝 인증
│   ├── MiningStatusModal/    # 마이닝 상태
│   ├── CreateWalletModal/    # 지갑 생성
│   ├── MyWalletModal/        # 내 지갑
│   ├── WalletAuthModal/      # 지갑 인증
│   ├── SecondPasswordModal/  # 2차 비밀번호
│   ├── ReferralModal/        # 추천 시스템
│   └── AttendanceModal/      # 출석 모달
│
├── services/           # 비즈니스 로직
│   ├── ApiService.ts          # API 통신
│   ├── BlockchainService/     # 블록체인 서비스
│   │   ├── BitWishNetworkService.ts
│   │   ├── BlockMonitorService.ts
│   │   ├── NetworkStatusService.ts
│   │   ├── WalletService.ts
│   │   └── index.ts
│   ├── BonusService/          # 보너스 서비스
│   │   ├── AttendanceBonusService.ts
│   │   ├── PartnerBonusService.ts
│   │   ├── ReferralBonusService.ts
│   │   └── index.ts
│   ├── MiningService/         # 마이닝 서비스
│   │   ├── BaseRewardSystem.ts
│   │   ├── MiningService.ts
│   │   ├── RealTimeSyncService.ts
│   │   └── index.ts
│   └── DatabaseService/       # 데이터베이스 서비스
│       ├── AttendanceCRUD.ts
│       ├── AttendanceSchema.ts
│       ├── CRUDService.ts
│       ├── DataValidator.ts
│       ├── DatabaseSchema.ts
│       ├── MongoDBService.ts
│       └── index.ts
│
├── utils/              # 유틸리티
│   ├── LanguageManager/       # 다국어 관리
│   ├── PrecisionCalculator/   # 정밀 계산
│   ├── SecurityValidator/     # 보안 검증
│   ├── AttendanceValidator.ts
│   └── RealTimeAttendance.ts
│
├── types/              # TypeScript 타입
│   └── index.ts
│
├── constants/          # 상수 정의
│   └── index.ts
│
├── hooks/              # Custom Hooks
│   └── useAttendanceStatus.ts
│
├── styles/             # 전역 스타일
│   └── global.css
│
├── index.tsx           # 앱 진입점
└── index.ts            # 타입 export
```

### 3.2 주요 컴포넌트 명세

#### 3.2.1 HomePage (메인 대시보드)

**파일:** `src/components/HomePage/HomePage.tsx`

**역할:**
- 애플리케이션의 메인 허브
- 실시간 블록체인 상태 대시보드
- 모든 모달의 표시 여부 관리

**주요 기능:**
```typescript
// 1. 실시간 동기화
- startRealTimeSync(): 1초 주기 블록체인 상태 갱신
- stopRealTimeSync(): 동기화 중지
- startAutoRefresh(): 30초 주기 자동 새로고침
- stopAutoRefresh(): 자동 새로고침 중지

// 2. 모달 관리
- handleStartMining(): 마이닝 인증 모달 오픈
- handleCreateWallet(): 지갑 생성 모달 오픈
- handleMyWallet(): 내 지갑 모달 오픈

// 3. 설정 관리
- handleLanguageChange(language): 언어 변경
- toggleDarkMode(): 다크 모드 토글
```

**상태 관리:**
```typescript
// 블록체인 상태
const [totalSupply, setTotalSupply] = useState<number>(21000000000);
const [currentIssued, setCurrentIssued] = useState<number>(0);
const [totalBlocks, setTotalBlocks] = useState<number>(0);
const [walletCount, setWalletCount] = useState<number>(0);

// 모달 상태
const [isMiningModalOpen, setIsMiningModalOpen] = useState(false);
const [isCreateWalletModalOpen, setIsCreateWalletModalOpen] = useState(false);
const [isMyWalletModalOpen, setIsMyWalletModalOpen] = useState(false);

// 설정 상태
const [currentLanguage, setCurrentLanguage] = useState<Language>('ko');
const [isDarkMode, setIsDarkMode] = useState(false);
```

#### 3.2.2 MiningPage (개인 마이닝 페이지)

**파일:** `src/components/MiningPage/MiningPage.tsx`

**역할:**
- 개인 마이닝 페이지 & 보너스 설정
- 실시간 마이닝 보상 표시
- 4개 보너스 설정 버튼

**주요 기능:**
```typescript
// 1. 마이닝 제어
- handleStartMining(): 마이닝 시작
- handleStopMining(): 마이닝 정지
- handlePauseMining(): 마이닝 일시정지
- handleResumeMining(): 마이닝 재개

// 2. 보너스 관리
- handleAttendanceBonus(): 출석 보너스 설정
- handleReferralBonus(): 추천 보너스 설정
- handlePartnerBonus(): 가맹점 보너스 설정
- handleProfileSettings(): 프로필 설정
```

**실시간 동기화:**
```typescript
// 30초 주기 동기화
useEffect(() => {
  const syncInterval = setInterval(async () => {
    if (miningState.status === MINING_STATUS.MINING) {
      await MiningService.syncMiningData(walletAddress);
      // UI 갱신
    }
  }, 30000);
  
  return () => clearInterval(syncInterval);
}, [miningState.status]);
```

#### 3.2.3 AdminPage (관리자 페이지)

**파일:** `src/components/AdminPage/AdminPage.tsx`

**역할:**
- 마이닝 테스트 관리 (초기화)
- 출석 보너스 조회
- 실시간 상태 모니터링

**주요 기능:**
```typescript
// 1. 마이닝 관리
- handleSearchMining(): 마이닝 데이터 검색
- handleResetMining(): 마이닝 초기화

// 2. 출석 보너스 관리
- handleSearchAttendance(): 출석 데이터 검색
  - 연도/월별 필터링
  - 실시간 보상 계산
  - 진행중/완료 상태 표시
```

**출석 상태 표시 로직:**
```typescript
// RUNNING (빨강색): 현재 시각 < 종료 시각
// COMPLETED (초록색): 현재 시각 >= 종료 시각

if (now < endTime && isActive && miningState.isMining) {
  status = 'RUNNING';
  color = 'red';
} else {
  status = 'COMPLETED';
  color = 'green';
}
```

### 3.3 서비스 레이어

#### 3.3.1 MiningService

**파일:** `src/services/MiningService/MiningService.ts`

**역할:** 마이닝 관련 API 통신 및 데이터 관리

**주요 메서드:**
```typescript
class MiningService {
  // 마이닝 시작
  async startMining(walletAddress: string): Promise<ApiResponse>
  
  // 마이닝 정지
  async stopMining(walletAddress: string): Promise<ApiResponse>
  
  // 실시간 동기화 (30초 주기)
  async syncMiningData(walletAddress: string): Promise<ApiResponse>
  
  // 사용자 상태 조회
  async getUserStatus(walletAddress: string): Promise<ApiResponse>
}
```

#### 3.3.2 AttendanceBonusService

**파일:** `src/services/BonusService/AttendanceBonusService.ts`

**역할:** 출석 보너스 관리

**주요 메서드:**
```typescript
class AttendanceBonusService {
  // 출석 체크
  async checkAttendance(walletAddress: string): Promise<ApiResponse>
  
  // 출석 기록 조회
  async getAttendanceHistory(
    walletAddress: string,
    year?: number,
    month?: number
  ): Promise<ApiResponse>
  
  // 출석 상태 확인
  async getAttendanceStatus(walletAddress: string): Promise<boolean>
}
```

#### 3.3.3 RealTimeSyncService

**파일:** `src/services/MiningService/RealTimeSyncService.ts`

**역할:** 실시간 블록체인 상태 시뮬레이션

**주요 메서드:**
```typescript
class RealTimeSyncService {
  // 동기화 시작 (1초 주기)
  startSync(callback: (status: RealTimeMiningStatus) => void): void
  
  // 동기화 중지
  stopSync(): void
  
  // 현재 상태 조회
  getCurrentStatus(): RealTimeMiningStatus
}
```

---

## 4. 백엔드 구조 (Backend Structure)

### 4.1 디렉토리 구조

```
server/
├── controllers/        # 컨트롤러
│   ├── MiningController.ts
│   └── UserController.ts
│
├── models/             # MongoDB 모델
│   ├── User.ts
│   ├── MiningState.ts
│   ├── BonusRecord.ts
│   └── MonthlySettlement.ts
│
├── routes/             # API 라우트
│   ├── mining.ts
│   ├── attendance.ts
│   ├── admin.ts
│   └── user.ts
│
├── index.ts            # 서버 진입점
└── tsconfig.json       # TypeScript 설정
```

### 4.2 API 라우트

#### 4.2.1 Mining Routes

**파일:** `server/routes/mining.ts`

```typescript
// POST /api/mining/start
// 마이닝 시작
router.post('/start', miningController.startMining);

// POST /api/mining/stop
// 마이닝 정지
router.post('/stop', miningController.stopMining);

// POST /api/mining/sync
// 마이닝 데이터 동기화 (30초 주기)
router.post('/sync', miningController.syncMiningData);

// GET /api/mining/status/:walletAddress
// 사용자 상태 조회
router.get('/status/:walletAddress', miningController.getUserStatus);
```

#### 4.2.2 Attendance Routes

**파일:** `server/routes/attendance.ts`

```typescript
// POST /api/attendance/check
// 출석 체크 및 MongoDB 저장
router.post('/check', async (req, res) => {
  const { walletAddress } = req.body;
  
  // 1. 오전 9시 기준 날짜 계산
  // 2. 중복 출석 체크
  // 3. BonusRecord 업데이트
  // 4. MiningState 보너스율 적용
});
```

#### 4.2.3 Admin Routes

**파일:** `server/routes/admin.ts`

```typescript
// GET /api/admin/mining/:walletAddress
// 마이닝 정보 조회
router.get('/mining/:walletAddress', async (req, res) => {
  // MiningState 조회
});

// POST /api/admin/mining/reset
// 마이닝 데이터 초기화
router.post('/mining/reset', async (req, res) => {
  // MiningState 초기화
  // BonusRecord 오늘 날짜 삭제
});

// GET /api/admin/attendance/:walletAddress
// 출석 보너스 현황 조회
router.get('/attendance/:walletAddress', async (req, res) => {
  // BonusRecord 조회
  // 실시간 보상 계산
  // 진행중/완료 상태 판단
});
```

### 4.3 컨트롤러

#### 4.3.1 MiningController

**파일:** `server/controllers/MiningController.ts`

**주요 메서드:**

```typescript
class MiningController {
  // 마이닝 시작
  async startMining(req: Request, res: Response) {
    // 1. MiningState 조회 또는 생성
    // 2. isMining = true 설정
    // 3. miningStartTime = 현재 시각
    // 4. MongoDB 저장
  }
  
  // 마이닝 정지
  async stopMining(req: Request, res: Response) {
    // 1. MiningState 조회
    // 2. 최종 보상 계산
    // 3. isMining = false 설정
    // 4. MongoDB 저장
  }
  
  // 실시간 동기화 (30초 주기)
  async syncMiningData(req: Request, res: Response) {
    // 1. MiningState 조회
    // 2. 경과 시간 계산
    // 3. 누적 보상 계산 (Decimal.js)
    // 4. accumulatedReward 업데이트
    // 5. lastSyncTime 갱신
    // 6. MongoDB 저장
  }
  
  // 사용자 상태 조회
  async getUserStatus(req: Request, res: Response) {
    // 1. MiningState 조회
    // 2. BonusRecord 조회
    // 3. 통합 상태 반환
  }
}
```

**동기화 로직 (핵심):**

```typescript
// 30초 주기 동기화 시 누적 보상 계산
const now = new Date();
const startTime = new Date(miningState.miningStartTime);
const elapsedSeconds = (now.getTime() - startTime.getTime()) / 1000;

// Decimal.js로 정밀 계산
const totalRate = new Decimal(miningState.currentTotalRate); // 0.2625 (기본 + 5% 보너스)
const elapsedHours = new Decimal(elapsedSeconds).div(3600);
const newReward = totalRate.mul(elapsedHours);

// 기존 누적량에 추가
const accumulated = new Decimal(miningState.accumulatedReward);
miningState.accumulatedReward = accumulated.plus(newReward).toString();

// 마지막 동기화 시간 갱신
miningState.lastSyncTime = now;
await miningState.save();
```

---

## 5. 데이터베이스 스키마 (Database Schema)

### 5.1 MiningState (마이닝 상태)

**파일:** `server/models/MiningState.ts`

**스키마:**
```typescript
interface IMiningState {
  walletAddress: string;        // 소유자 지갑 주소 (Unique)
  
  // 마이닝 상태
  isMining: boolean;            // 현재 채굴 진행 중 여부
  miningStartTime: Date | null; // 이번 세션 채굴 시작 시간
  lastSyncTime: Date;           // 마지막 동기화 시간
  
  // 누적 채굴량 (String 타입으로 50자리 정밀도 유지)
  accumulatedReward: string;    // 총 누적 채굴량
  
  // 현재 적용된 채굴률 (시간당)
  currentBaseRate: string;      // 기본 채굴률 (0.25)
  currentTotalRate: string;     // 보너스 포함 최종 채굴률
  
  // 보너스 상태 스냅샷
  isAttendanceActive: boolean;  // 출석 보너스 적용 중 여부
  attendanceDate: Date | null;  // 출석 체크한 날짜
  
  referralCount: number;        // 현재 반영된 추천인 수
  referralBonusRate: string;    // 현재 적용된 추천 보너스율
  
  partnerStatus: string;        // 가맹점 상태
}
```

**기본값:**
```typescript
{
  isMining: false,
  miningStartTime: null,
  lastSyncTime: Date.now(),
  accumulatedReward: '0.00000000000000000000000000000000000000000000000000',
  currentBaseRate: '0.25000000000000000000000000000000000000000000000000',
  currentTotalRate: '0.25000000000000000000000000000000000000000000000000',
  isAttendanceActive: false,
  attendanceDate: null,
  referralCount: 0,
  referralBonusRate: '0.00000000000000000000000000000000000000000000000000',
  partnerStatus: 'NOT_REGISTERED'
}
```

### 5.2 BonusRecord (보너스 기록)

**파일:** `server/models/BonusRecord.ts`

**스키마:**
```typescript
interface IBonusRecord {
  walletAddress: string;          // 소유자 지갑 주소 (Unique)
  
  // 추천 보너스 보관함 (2% 채굴분)
  referralBonusStorage: string;   // 누적된 2% 보너스 총량
  
  // 추천 보상 보관함 (1BW 일회성)
  referralRewardStorage: string;  // 누적된 1BW 보상 총량
  
  // 추천인 목록
  referralList: Array<{
    childWalletAddress: string;   // 가입자 지갑 주소
    joinedAt: Date;               // 가입 일시
    accumulatedBonus: string;     // 이 사람으로 인해 얻은 총 보너스
    isKycVerified: boolean;       // KYC 통과 여부
    rewardStatus: 'PENDING' | 'PAID'; // 1BW 지급 상태
  }>;
  
  // 출석 체크 기록
  attendanceHistory: Array<{
    date: string;                 // YYYY-MM-DD
    checkInTime: Date;            // 체크인 시간
    bonusRate: string;            // 적용된 보너스율 (0.05)
    fixedBonusAmount?: string;    // 과거 데이터 고정값
  }>;
}
```

**출석 체크 로직:**
```typescript
// 오전 9시 기준 날짜 계산 (Day Shift Logic)
const now = new Date();
const currentHour = now.getHours();

let recordDate = new Date(now);
if (currentHour < 9) {
  // 00:00 ~ 08:59 사이에 체크인하면 '어제' 날짜로 기록
  recordDate.setDate(recordDate.getDate() - 1);
}

// YYYY-MM-DD 형식으로 변환 (로컬 타임존 기준)
const year = recordDate.getFullYear();
const month = String(recordDate.getMonth() + 1).padStart(2, '0');
const day = String(recordDate.getDate()).padStart(2, '0');
const todayStr = `${year}-${month}-${day}`;
```

### 5.3 User (사용자)

**파일:** `server/models/User.ts`

**스키마:**
```typescript
interface IUser {
  userId: string;               // 사용자 ID (Unique)
  email: string;                // 이메일
  password: string;             // 비밀번호 (해시)
  walletAddress: string;        // 지갑 주소
  kycStatus: KYCStatus;         // KYC 상태
  referralCode: string;         // 추천 코드
  referredBy?: string;          // 추천인 코드
  createdAt: Date;
  updatedAt: Date;
}
```

### 5.4 MonthlySettlement (월별 정산)

**파일:** `server/models/MonthlySettlement.ts`

**스키마:**
```typescript
interface IMonthlySettlement {
  walletAddress: string;        // 지갑 주소
  year: number;                 // 연도
  month: number;                // 월
  totalMiningReward: string;    // 총 마이닝 보상
  totalBonusReward: string;     // 총 보너스 보상
  attendanceCount: number;      // 출석 일수
  referralCount: number;        // 추천 인원
  createdAt: Date;
}
```

---

## 6. 핵심 기능 명세 (Core Features)

### 6.1 마이닝 시스템

#### 6.1.1 기본 보상 체계

```
기본 보상률: 0.25 BW/시간
일일 최대 보상: 6.0 BW/일 (24시간 기준)
월간 보상: 180 BW/월
연간 보상: 2,190 BW/년
```

#### 6.1.2 보너스 시스템

**1. 출석 보너스 (5%)**
```
- 매일 오전 9시부터 다음날 오전 8시 59분 59초까지 출석 가능
- 출석 시 기본 채굴률의 5% 추가
- 0.25 BW/시간 → 0.2625 BW/시간 (5% 증가)
- 출석 기록은 MongoDB에 영구 저장
```

**2. 추천 보너스 (2% + 1BW)**
```
- 추천인 가입 시 추천인의 채굴량의 2% 추가 지급
- 가입 시 1BW 일회성 보상
- 추천 보너스 보관함: 2% 누적분
- 추천 보상 보관함: 1BW 누적분
```

**3. 가맹점 보너스 (125%)**
```
- 가맹점 승인 시 기본 채굴률의 125% 추가
- 0.25 BW/시간 → 0.5625 BW/시간 (125% 증가)
```

#### 6.1.3 실시간 동기화

```typescript
// 30초 주기 동기화
setInterval(async () => {
  if (isMining) {
    // 1. 경과 시간 계산
    const elapsedSeconds = (now - startTime) / 1000;
    
    // 2. 누적 보상 계산 (Decimal.js)
    const elapsedHours = new Decimal(elapsedSeconds).div(3600);
    const newReward = totalRate.mul(elapsedHours);
    
    // 3. MongoDB 저장
    accumulatedReward = accumulated.plus(newReward).toString();
    await miningState.save();
  }
}, 30000);
```

### 6.2 출석 시스템

#### 6.2.1 출석 가능 시간

```
시작: 매일 오전 9시 00분 00초
종료: 다음날 오전 8시 59분 59초
```

#### 6.2.2 출석 체크 프로세스

```typescript
// 1. 오전 9시 기준 날짜 계산
const now = new Date();
const currentHour = now.getHours();
let recordDate = new Date(now);
if (currentHour < 9) {
  recordDate.setDate(recordDate.getDate() - 1);
}

// 2. 중복 출석 체크
const existingAttendance = bonusRecord.attendanceHistory.find(
  record => record.date === todayStr
);
if (existingAttendance) {
  return { success: false, message: '이미 출석 체크를 완료했습니다' };
}

// 3. 출석 기록 추가
bonusRecord.attendanceHistory.push({
  date: todayStr,
  checkInTime: new Date(),
  bonusRate: '0.05'
});
await bonusRecord.save();

// 4. MiningState 보너스율 적용
miningState.isAttendanceActive = true;
miningState.attendanceDate = new Date();
const baseRate = new Decimal(miningState.currentBaseRate);
const bonusRate = new Decimal('0.05');
miningState.currentTotalRate = baseRate.mul(new Decimal(1).plus(bonusRate)).toString();
await miningState.save();
```

#### 6.2.3 관리자 페이지 출석 조회

```typescript
// 실시간 보상 계산 및 상태 표시
const records = filteredRecords.map((record) => {
  // 종료 시간 계산 (다음날 08:59:59)
  const endTime = new Date(year, month - 1, day + 1, 8, 59, 59, 999);
  const now = new Date();
  
  let status = 'COMPLETED';
  
  // 현재 시각이 종료 시각 이전이고, 마이닝 중이면 RUNNING
  if (now < endTime && isActive && miningState.isMining) {
    status = 'RUNNING';
    fullDateRange = `${startTimeStr} 시작 ~ 현재 마이닝 진행 중`;
  } else {
    status = 'COMPLETED';
    fullDateRange = `${startTimeStr} 시작 ~ ${endTimeStr} 종료`;
  }
  
  // 실시간 보상 계산
  let finalAmount = '0.00000000';
  if (status === 'RUNNING') {
    // 현재 누적 보상의 5% 지분 계산
    finalAmount = currentReward.mul(0.05).div(1.05).toFixed(8);
  } else if (record.fixedBonusAmount) {
    // 확정된 보너스 금액 사용
    finalAmount = record.fixedBonusAmount;
  }
  
  return {
    fullDate: fullDateRange,
    bonusAmount: finalAmount,
    status: status
  };
});
```

### 6.3 정밀도 관리

#### 6.3.1 Decimal.js 사용

```typescript
import Decimal from 'decimal.js';

// 정밀도 설정
Decimal.set({ precision: 50 });

// 계산 예시
const baseRate = new Decimal('0.25');
const bonusRate = new Decimal('0.05');
const totalRate = baseRate.mul(new Decimal(1).plus(bonusRate));
// 결과: 0.2625 (50자리 정밀도 유지)
```

#### 6.3.2 MongoDB 저장

```typescript
// String 타입으로 저장 (50자리 정밀도 유지)
accumulatedReward: {
  type: String,
  default: '0.00000000000000000000000000000000000000000000000000'
}
```

#### 6.3.3 UI 표시

```typescript
// 8자리 소수점으로 표시
const displayValue = new Decimal(accumulatedReward).toFixed(8);
// 예: 0.17614285
```

---

## 7. API 명세 (API Specification)

### 7.1 Mining API

#### POST /api/mining/start
**설명:** 마이닝 시작

**Request:**
```json
{
  "walletAddress": "BW9F5FF090231236037F250A523B4FC320FB44BFA8"
}
```

**Response:**
```json
{
  "success": true,
  "message": "마이닝이 시작되었습니다",
  "data": {
    "walletAddress": "BW9F5FF090231236037F250A523B4FC320FB44BFA8",
    "isMining": true,
    "miningStartTime": "2025-11-30T00:00:00.000Z",
    "currentTotalRate": "0.2625"
  }
}
```

#### POST /api/mining/stop
**설명:** 마이닝 정지

**Request:**
```json
{
  "walletAddress": "BW9F5FF090231236037F250A523B4FC320FB44BFA8"
}
```

**Response:**
```json
{
  "success": true,
  "message": "마이닝이 정지되었습니다",
  "data": {
    "finalReward": "0.17614285",
    "duration": 40320
  }
}
```

#### POST /api/mining/sync
**설명:** 실시간 동기화 (30초 주기)

**Request:**
```json
{
  "walletAddress": "BW9F5FF090231236037F250A523B4FC320FB44BFA8"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accumulatedReward": "0.17614285",
    "lastSyncTime": "2025-11-30T12:00:00.000Z"
  }
}
```

### 7.2 Attendance API

#### POST /api/attendance/check
**설명:** 출석 체크

**Request:**
```json
{
  "walletAddress": "BW9F5FF090231236037F250A523B4FC320FB44BFA8"
}
```

**Response:**
```json
{
  "success": true,
  "message": "출석 체크가 완료되었습니다"
}
```

### 7.3 Admin API

#### GET /api/admin/mining/:walletAddress
**설명:** 마이닝 정보 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "walletAddress": "BW9F5FF090231236037F250A523B4FC320FB44BFA8",
    "isMining": true,
    "accumulatedReward": "0.17614285",
    "currentBaseRate": "0.25",
    "currentTotalRate": "0.2625"
  }
}
```

#### POST /api/admin/mining/reset
**설명:** 마이닝 데이터 초기화

**Request:**
```json
{
  "walletAddress": "BW9F5FF090231236037F250A523B4FC320FB44BFA8"
}
```

**Response:**
```json
{
  "success": true,
  "message": "마이닝 데이터가 초기화되었습니다"
}
```

#### GET /api/admin/attendance/:walletAddress?year=2025&month=11
**설명:** 출석 보너스 현황 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "isActive": true,
    "records": [
      {
        "fullDate": "2025. 11. 29. 18:54:30 시작 ~ 현재 마이닝 진행 중",
        "bonusAmount": "0.17614285",
        "status": "RUNNING"
      },
      {
        "fullDate": "2025. 11. 28. 00:19:36 시작 ~ 2025. 11. 29. 08:59:59 종료",
        "bonusAmount": "0.40841666",
        "status": "COMPLETED"
      }
    ],
    "totalBonus": "1.78455951"
  }
}
```

---

## 8. 보안 및 인증 (Security & Authentication)

### 8.1 클라이언트 측 지갑 관리

```typescript
// BIP39 기반 지갑 생성
import * as bip39 from 'bip39';

// 1. Mnemonic 생성 (12단어)
const mnemonic = bip39.generateMnemonic();

// 2. Seed 생성
const seed = bip39.mnemonicToSeedSync(mnemonic);

// 3. 지갑 주소 생성 (BW + 40자리 16진수)
const walletAddress = 'BW' + generateRandomHex(40);

// 4. 암호화 저장 (Base64 또는 AES)
const encryptedMnemonic = btoa(mnemonic); // 데모용
localStorage.setItem('bw_wallet_data', JSON.stringify({
  address: walletAddress,
  encryptedMnemonic: encryptedMnemonic
}));
```

### 8.2 2차 비밀번호 시스템

```typescript
// PBKDF2 해싱
import crypto from 'crypto';

// 1. Salt 생성
const salt = crypto.randomBytes(16).toString('hex');

// 2. 비밀번호 해싱
const hash = crypto.pbkdf2Sync(
  password,
  salt,
  100000,
  64,
  'sha512'
).toString('hex');

// 3. 저장 형식: salt:hash
const secondPassword = `${salt}:${hash}`;
```

### 8.3 API 보안

```typescript
// CORS 설정
app.use(cors({
  origin: ['http://localhost:5000'],
  credentials: true
}));

// Rate Limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100 // 최대 100 요청
});

app.use('/api/', limiter);
```

---

## 9. 상수 및 설정 (Constants & Configuration)

### 9.1 마이닝 상수

**파일:** `src/constants/index.ts`

```typescript
export const MINING_CONSTANTS = {
  HOURLY_BASE_RATE: 0.25,      // BW/시간
  DAILY_MAX_REWARD: 6.0,       // BW/일
  MONTHLY_REWARD: 180,         // BW/월
  YEARLY_REWARD: 2190,         // BW/년
  TOTAL_SUPPLY: 21000000000,   // 210억 BW
  PRECISION_DIGITS: 50,        // 내부 계산 정밀도
  DISPLAY_DIGITS: 8,           // UI 표시 정밀도
  AUTO_REFRESH_INTERVAL: 30000, // 30초
  PAGE_REFRESH_INTERVAL: 60000  // 1분
};
```

### 9.2 보너스 상수

```typescript
export const BONUS_CONSTANTS = {
  ATTENDANCE_BONUS_RATE: 0.05,   // 5%
  ATTENDANCE_CHECK_START: 9,     // 오전 9시
  ATTENDANCE_CHECK_END: 8,       // 다음날 오전 8시 59분 59초
  REFERRAL_BONUS_RATE: 0.02,     // 2%
  REFERRAL_REWARD_AMOUNT: 1,     // 1BW
  PARTNER_BONUS_RATE: 1.25       // 125%
};
```

### 9.3 토큰 분배

```typescript
export const TOKEN_DISTRIBUTION = {
  ECOSYSTEM_TOTAL: 0.8,          // 생태계 80%
  ECOSYSTEM_AMOUNT: 16800000000, // 168억 BW
  MEMBER_MINING: 0.7,            // 회원 마이닝 70%
  MEMBER_MINING_AMOUNT: 14700000000, // 147억 BW
  PARTNER_STORE: 0.1,            // 파트너/상점 10%
  PARTNER_STORE_AMOUNT: 2100000000,  // 21억 BW
  FOUNDATION_TEAM: 0.2,          // 재단/개발팀 20%
  FOUNDATION_TEAM_AMOUNT: 4200000000 // 42억 BW
};
```

---

## 10. 배포 및 운영 (Deployment & Operations)

### 10.1 개발 환경 실행

```bash
# 1. 의존성 설치
npm install

# 2. MongoDB 실행 (로컬)
mongod --dbpath C:\data\db

# 3. 백엔드 서버 실행 (Port 5001)
npm run backend

# 4. 프론트엔드 서버 실행 (Port 5000)
npm run frontend

# 5. 동시 실행
npm run dev
```

### 10.2 환경 변수

```bash
# .env 파일
PORT=5001
MONGODB_URI=mongodb://localhost:27017/bitwish_mining
NODE_ENV=development
```

### 10.3 빌드

```bash
# 프론트엔드 빌드
npm run build

# 빌드 결과물: dist/ 디렉토리
```

### 10.4 모니터링

**관리자 페이지:** `http://localhost:5000/bitwish/testadmin`

**주요 기능:**
- 마이닝 데이터 조회 및 초기화
- 출석 보너스 현황 조회
- 실시간 상태 모니터링

### 10.5 데이터베이스 백업

```bash
# MongoDB 백업
mongodump --db bitwish_mining --out ./backup

# MongoDB 복원
mongorestore --db bitwish_mining ./backup/bitwish_mining
```

---

## 11. 추가 개발 계획

### 11.1 KYC 시스템
- 신분증 인증
- 본인 확인
- KYC 승인 후 실제 BW 토큰 마이그레이션

### 11.2 블록체인 연동
- 실제 블록체인 노드 연결
- Web3.js 또는 Ethers.js 통합
- 스마트 컨트랙트 배포

### 11.3 추가 보너스 시스템
- 레벨 시스템
- 특별 이벤트 보너스
- 친구 초대 보너스

### 11.4 모바일 앱
- React Native 기반 모바일 앱
- 푸시 알림
- 생체 인증

---

## 12. 문의 및 지원

**개발팀:** BitWishNetwork Dev Team  
**이메일:** dev@bitwishnetwork.com  
**문서 버전:** 2.0.0  
**최종 업데이트:** 2025-11-30

---

**© 2025 BitWishNetwork. All rights reserved.**
