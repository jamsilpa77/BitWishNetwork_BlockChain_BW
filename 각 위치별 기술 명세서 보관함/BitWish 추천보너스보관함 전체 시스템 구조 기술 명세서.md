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
**최종 승인:** 2026-04-08
**기술 총괄:** BitWish AI Assistant (Antigravity)
