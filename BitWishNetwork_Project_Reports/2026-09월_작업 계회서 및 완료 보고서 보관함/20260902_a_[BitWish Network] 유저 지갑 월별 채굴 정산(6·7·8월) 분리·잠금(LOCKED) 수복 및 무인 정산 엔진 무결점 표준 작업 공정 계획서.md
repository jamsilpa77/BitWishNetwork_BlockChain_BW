# [BitWish Network] 유저 지갑 월별 채굴 정산(6·7·8월) 분리·잠금(LOCKED) 수복 및 무인 정산 엔진 무결점 표준 작업 공정 계획서

본 문서는 이전 개발 과정에서 발생한 결함 및 구버전 레거시 DB 참조 오류를 완벽하게 수술하고, 안전 수칙 헌장(기존 정상 작동 코드 100% 원형 보존 및 금융권 정합성 원칙)을 철저히 준수하여 무결점으로 수복하기 위한 초정밀 단계별 표준 작업 공정 계획서입니다.

---

## 🎯 개요 및 근본 결함 원인 분석

### 1. 현상 및 근본 결함 원인
- **유저별 가입/채굴 시점 차이에 따른 정산 미분리**: 
  - 유저마다 가입 시기 및 채굴 개시 시점(`createdAt` / `miningStartTime`)이 다름에도 불구하고, 과거 월간 스냅샷 레코드(`MonthlySettlement`)가 정상 생성/등록되지 않아 모든 누적 채굴량이 `2026.09.01 0일 00:00:00 | 채굴중` 1개 행으로 통통째 묶여표출되는 중증 고장이 발생해 있었습니다.
- **정산 시스템 워커 (`SettlementWorker.ts`) 파편화 및 고장**:
  - `server/index.ts`에서 호출하는 `src/server/cron/SettlementWorker.ts`가 실제 운영 DB (`bitwish_mining`)가 아닌, **존재하지도 않는 구버전 독립 DB (`BitWish_Master_System`, `BitWish_UserDB_...`)를 Direct Mongo Client로 참조**하도록 잘못 작성되어 매월 말일 자정 자동 정산 기능이 100% 완전 고장 난 상태였습니다.
- **소급 정산 수복 스크립트 미존재**:
  - 기존 유저들의 6월, 7월, 8월 채굴 데이터를 유저 개별 가입 일시에 맞추어 동적으로 산출해 줄 소급 수복 스크립트가 존재하지 않았습니다.

---

## 🛠️ 컴포넌트별 4대 초정밀 수복 공정 명세

=================================================================================================


### [공정 1단계] 유저별 가입/채굴 시점 스캔 및 개별 월별(6·7·8월) 채굴량 동적 소급 수복 스크립트(`scripts/heal_monthly_settlements_20260902.ts`) 작성 및 실행

#### 🎯 명세 및 세부 작업 내용
- **대상 파일**: `scripts/heal_monthly_settlements_20260902.ts` [NEW]
- **작업 내용**:
  1. 실제 운영 DB(`bitwish_mining`)의 `users`, `miningstates`, `monthlysettlements`를 Mongoose 모델로 연결.
  2. 전체 회원 대상 1대1 전수 조사를 실시하여 가입 일시(`createdAt`), 채굴 시작 시점(`miningStartTime`), 본사 KYC 승인 여부(`isKycVerified`)를 추출.
  3. 회원별 채굴 존재 구간에 맞춰 월별(6월, 7월, 8월) 채굴량을 `Decimal.js` 50자리 정밀도로 계산:
     - **6월 이전 가입자**: 6월, 7월, 8월 정산 레코드 동적 생성
     - **7월 가입자**: 7월, 8월 정산 레코드 동적 생성 (6월 생성 안 함)
     - **8월 가입자**: 8월 정산 레코드만 동적 생성 (6·7월 생성 안 함)
     - **9월 신규 가입자**: 과거 레코드 생성 안 함 (9월 실시간 채굴 행만 유지)
  4. **KYC 상태별 잠금 분기 지정**:
     - `isKycVerified: true` -> `migrationStatus: 'LOCKED'` (15일 타임락 D-day 적용)
     - `isKycVerified: false` -> `migrationStatus: 'WAITING_KYC'` (KYC 미승인 대기 보존)
  5. 소급 정산 후 `MiningState`의 당월 실시간 잔액을 차감 정비.

#### 👁️ 가시성 (Visibility)
- 유저 지갑 모달의 "채굴 보상 내역" 탭 조회 시, 유저 본인의 가입 달부터의 정산 행(6월, 7월, 8월)이 1줄씩 명확하게 표출됩니다.

#### ⚡ 시스템 성능 및 효율 (Efficiency)
- 일회성 소급 스크립트 실행으로 DB 인덱스 기준 정밀 쿼리를 수행하여 시스템 과부하 없이 0.1초 내 전수 데이터 수복 완료.

#### 🎨 기능 및 시각적 효과 (Effect & UI Functionality)
- KYC 승인 회원에게는 `LOCKED` 태그와 함께 D-15, D-14 등의 카운트다운 기준일이 시각화되며, 미승인 회원에게는 `WAITING_KYC`(KYC 승인 대기) 빨간색 태그가 선명하게 분리 표출되어 금융권 정합성이 입증됩니다.


=================================================================================================


### [공정 2단계] 고장 난 무인 정산 워커(`src/server/cron/SettlementWorker.ts`) 구버전 DB 로직 완전 삭제 및 Mongoose 운영 DB 100% 재매핑 수리

#### 🎯 명세 및 세부 작업 내용
- **대상 파일**: `src/server/cron/SettlementWorker.ts` [MODIFY], `server/index.ts` [MODIFY]
- **작업 내용**:
  1. `src/server/cron/SettlementWorker.ts` 내의 구버전 `BitWish_UserDB_...` 및 direct MongoClient 접근 코드 전면 소거.
  2. Mongoose 모델 (`User`, `MiningState`, `MonthlySettlement`, `BonusRecord`)을 import하여 운영 DB (`bitwish_mining`)에 100% 매핑.
  3. 매월 말일 23:59:59 스냅샷 작동 시:
     - 전체 회원별 당월 채굴량 및 추천 보너스를 50자리 정밀도로 계산.
     - `MonthlySettlement` 테이블에 레코드로 적립 (`LOCKED` 또는 `WAITING_KYC`).
     - 당월 `MiningState.accumulatedReward` 수량을 '0'으로 초기화하여 다음 달로 안전하게 이관.
  4. 매일 자정 00:00:00 타임락 검증 작동 시:
     - KYC 승인 유저 중 정산일 기준 15일이 경과한 `LOCKED` 레코드를 `UNLOCKED`로 자동 변경.

#### 👁️ 가시성 (Visibility)
- 서버 콘솔 로그에 `[SettlementWorker] 2026-09 월간 무인 스냅샷 공정 성공적 종료` 및 유저별 정산 상태가 실시간 출력되어 운영 상태를 명확히 모니터링 가능.

#### ⚡ 시스템 성능 및 효율 (Efficiency)
- 크론 기반 스케줄러가 서버 메모리를 최소한으로 사용하면서 매월 말일 자정 서버 재부팅이나 관리자 개입 없이 100% 무인 자동 정산 수행.

#### 🎨 기능 및 시각적 효과 (Effect & UI Functionality)
- 월이 넘어가더라도 유저의 실시간 채굴 보상이 자동으로 정산 장부에 기록되고, 실시간 채굴 창은 깔끔하게 0부터 다시 마이닝을 진행하는 유기적 동작 완성.


=================================================================================================


### [공정 3단계] 백엔드 컨트롤러 API(`MiningController.ts`) 정산 이력 반환 보완 및 프론트엔드 지갑 모달(`MyWalletModal.tsx`) 개별 정산 내역 시각적 정비

#### 🎯 명세 및 세부 작업 내용
- **대상 파일**: `server/controllers/MiningController.ts` [MODIFY], `src/components/MyWalletModal/MyWalletModal.tsx` [MODIFY]
- **작업 내용**:
  1. `MiningController.ts`의 `getUserStatus` 및 `/api/mining/history/:walletAddress` API가 정산 이력(`miningHistory`) 반환 시 `settledAt` 기준 내림차순(최신순) 정렬 및 Decimal.js 정밀 수치를 반환하도록 확증.
  2. `MyWalletModal.tsx`의 '채굴 보상 내역' 탭에서:
     - 백엔드가 반환한 개별 유저 정산 이력을 그대로 표출.
     - `isKycVerified` 상태를 체크하여, 미승인 유저는 `WAITING_KYC` / `LOCKED` 분기 처리.
     - 승인 완료 유저는 정산일 기준 15일 타임락 D-day 카운트다운 타이머(D-15, D-14 ...) 및 `UNLOCKED`(잠금 해제) 시각적 렌더링 검증.

#### 👁️ 가시성 (Visibility)
- 유저 개개인 지갑 팝업 내에서 본인 채굴 시작 월부터의 월별 정산 내역(연월, 채굴량, 보너스, 합계, 정산상태)을 한눈에 식별.

#### ⚡ 시스템 성능 및 효율 (Efficiency)
- 프론트엔드에서 불필요한 계산을 재수행하지 않고 백엔드가 정제해 준 정산 내역 배열을 그대로 바인딩하여 렌더링 속도 최상 유지.

#### 🎨 기능 및 시각적 효과 (Effect & UI Functionality)
- 초단위 실시간 D-day 타이머 감소 애니메이션 및 잠금 해제 상태 변경 시 초록색 `UNLOCKED` 태그 전환으로 극상의 UX 제공.


=================================================================================================


### [공정 4단계] 프로덕션 빌드 컴파일 및 전수 무결성 검증

#### 🎯 명세 및 세부 작업 내용
- **대상 작업**:
  1. 소급 수복 스크립트 실행 및 DB 장부 검증.
  2. 무인 정산 워커 가동 검증.
  3. `npm run build` 실행으로 TypeScript 타입 에러 0개 무결점 빌드 검증.

#### 👁️ 가시성 (Visibility)
- 빌드 결과 터미널 화면에 `Built in ...ms` 성공 문구 확인.

#### ⚡ 시스템 성능 및 효율 (Efficiency)
- 번들링 및 타입 체킹 완벽 통과로 프로덕션 배포 시 런타임 크래시 위험 0%.

#### 🎨 기능 및 시각적 효과 (Effect & UI Functionality)
- 프론트엔드/백엔드 최적화 번들 생성 완료.

---

## 🔒 검증 및 승인 계획 (Verification Plan)

### Automated Tests & Scripts
- 소급 수복 스크립트 실행 test: `npx ts-node scripts/heal_monthly_settlements_20260902.ts`
- 전체 타입 빌드 검증: `npm run build`

### Manual Verification
- 유저 지갑 모달 접속 후 6·7·8월 개별 정산 내역 및 KYC 상태별 `LOCKED` / `WAITING_KYC` 표출 대조 검증.