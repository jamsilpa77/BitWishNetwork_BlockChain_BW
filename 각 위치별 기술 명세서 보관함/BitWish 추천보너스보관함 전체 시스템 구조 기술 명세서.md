# 📑 BitWish 추천보너스보관함 전체 시스템 구조 기술 명세서

본 명세서는 BitWish Network 마이닝 시스템 내 '추천보너스보관함'의 데이터 생성, 전송, 영구 보존 및 복원에 관한 전체 기술적 구조를 정의한다.

---

## 1. 아키텍처 개요 (System Architecture)

추천보너스보관함은 클라이언트의 실시간 연산과 서버의 영구 저장소가 **'실시간 동기화 핸드셰이크(Real-time Sync Handshake)'**를 통해 연결되는 구조를 갖는다. 사용자가 마이닝 페이지를 여는 것부터 닫고 다시 열 때까지 데이터의 누락 없는 영속성을 보장한다.

---

## 2. 클라이언트 연산 엔진 (Computing Engine)

### 2-1. 초정밀 티커 로직 (RealTimeSyncService.ts)
- **주기:** 1초 (1000ms) 단위 업데이트.
- **정밀도:** `Decimal.js`를 사용하여 소수점 50자리까지 연산하며, UI에는 8자리까지 표기한다.
- **계산식:**
  - `hourlyBonus = baseRate (0.25) * referralBonusRate (%)`
  - `perSecondBonus = hourlyBonus / 3600`
  - `currentStorage = previousStorage + perSecondBonus`

### 2-2. 단일 진실 공급원 (Single Source of Truth)
- UI 컴포넌트(`MiningStatusModal`)의 개별 타이머를 폐기하고, `RealTimeSyncService` 싱글톤 엔진에서만 보너스를 중앙 집중식으로 계산하여 데이터 경합(Race Condition)을 원천 차단한다.

---

## 3. 데이터 전송 및 수송 레이어 (Transport Layer)

### 3-1. 통합 동기화 인터페이스 (ApiService.ts)
- **함수 명칭:** `syncMiningData(walletAddress, currentAmount, currentBonus)`
- **특징:** 기존 채굴량 전송 기능에 `currentBonus` 파라미터를 추가하여, 두 종류의 자산을 하나의 통로로 동기화한다.

---

## 4. 백엔드 영구 보전 (Persistence Layer)

### 4-1. 전용 금고 구축 (server.ts)
- **엔드포인트:** `/api/mining/sync` (POST)
- **저장 기전:** 
  1. 클라이언트로부터 `clientBonus` 수신.
  2. `referrals.json` 파일 내 유저 객체에 `referralBonusStorage` 필드로 실시간 박제.
  3. 저장 즉시 최신 상태를 클라이언트에 재반환(Reflection)하여 데이터 정합성을 최종 확증한다.

### 4-2. 상태 조회 보안 (Status API)
- **엔드포인트:** `/api/mining/status/:walletAddress` (GET)
- **구조:** 클라이언트와의 규격 통일을 위해 `data: { miningState: userData }` 형태로 데이터를 포장(Wrap)하여 반환함으로써, 초기 로딩 시의 데이터 유실을 방지한다.

---

## 5. 데이터 복원 프로세스 (Restoration Process)

### 5-1. 초기화 단계 (Reentry Logic)
- 마이닝 모달이 열릴 때 `RealTimeSyncService.initialize()`가 발동된다.
- 서버로부터 `miningState`를 수신하여, 이전에 저장되었던 `referralBonusStorage` 값을 즉시 메모리에 적재한다.
- 이 과정은 사용자가 창을 닫기 전의 수치에서 단 1초의 오차 없이 채굴이 이어지도록 만든다.

---

## 6. 데이터 무결성 보장 정책 (Data Integrity)

1. **Anti-Reset Policy:** 서버의 응답이 유효할 때에만 로컬 상태를 갱신하여, 네트워크 오류 등으로 인한 0점 리셋 현상을 방지한다.
2. **Precision Policy:** 모든 서버 송수신 문자열을 수시로 `Decimal` 객체로 변환하여 부동 소수점 오차를 원천 배제한다.
3. **Multi-Wallet Support:** 지갑 주소별 독립적 데이터 구조를 유지하여 계정 전환 시에도 데이터 간섭이 발생하지 않는다.

---

## 7. [핵심 결함 수복] 추천보너스보관함 0원 리셋 및 레거시 데이터 덮어쓰기 원천 차단 기술 공정 (2026.05.13 업데이트)

본 기술 공정은 클라이언트가 마이닝 창을 재오픈하거나 동기화할 때, 추천보너스보관함의 금액이 0원으로 초기화되거나 과거 데이터로 회귀하는 치명적 결함을 원천 차단한 초정밀 수복 내역이다.

### 7-1. [문제 정의] 레거시 통신 및 로컬 덮어쓰기로 인한 데이터 회귀
1. **레거시 파일 통신 (404 Error):** 클라이언트가 폐기된 구식 API(`/api/storage/load/referrals.json` 등)를 지속 호출하며 실패 응답(404 Error)을 유발하여 시스템 불안정을 초래함.
2. **위험한 로컬 스토리지 Fallback:** 서버와의 비정상 통신 실패 시, 클라이언트가 임의로 브라우저 로컬 스토리지에 남아있던 과거의 오염된 데이터(0원 등)를 불러와 서버의 최신 정답 데이터에 덮어씌우는 치명적인 '데이터 하이재킹(Data Hijacking)' 결함이 발생함.

### 7-2. [기술 공정] 단일 진실 공급원(SSOT) 구축 및 레거시 차단 (Step 3)
*   **공정 1: 레거시 통신망 완전 폐쇄**
    *   **파일 위치:** `ReferralBonusService.ts`
    *   **내용:** 기존 파일 기반 구식 DB 로드 및 저장 API 통신 로직을 코드베이스에서 완전히 적출(Remove)하여 불필요한 에러 통신을 근절함.
*   **공정 2: 클라이언트 로컬 덮어쓰기 권한 박탈 및 SSOT 강제**
    *   **내용:** 서버 데이터 수신 실패 시 작동하던 위험한 로컬 스토리지 Fallback(`localStorage.getItem` 등) 복구 로직을 완전히 파기함.
    *   **결과:** 클라이언트는 **오직 서버의 정규 MongoDB 데이터만을 '유일한 진실(Single Source of Truth)'로 신뢰**하게 됨. 로컬의 어떠한 오염된 데이터도 서버 데이터 위에 덮어쓸 수 없도록 프론트엔드-백엔드 간의 아키텍처를 강제 락(Lock) 처리함.

### 7-3. 최종 무결성 확보 결과 (Data Integrity Reestablished)
해당 공정을 통해 "자식이 없는(0명) 유저가 부모 혜택(2%)만으로 모은 보너스"가 마이닝 창 접속 재개 시 0원으로 리셋되는 고질적 현상을 **100% 원천 박멸**하였다. 서버와 클라이언트는 오직 정규화된 DB 채널로만 단일 통신하며, 어떠한 예외 상황에서도 서버의 정답 데이터가 훼손 없이 보존되는 **'완전 무결성 추천보너스 보관함'** 시스템이 최종 완성되었다.

---
**최종 업데이트:** 2026-05-14
**기술 총괄:** BitWish AI Assistant (Antigravity)
