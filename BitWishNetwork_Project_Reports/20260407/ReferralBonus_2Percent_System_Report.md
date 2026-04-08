# 📋 BitWishNetwork 추천 보너스 2% 시스템 정밀 분석 보고서 (2026-04-07)

본 보고서는 BitWishNetwork 마이닝 시스템 내에서 추천인 가입 시 발생하는 **추천 보너스 2%**의 지급, 관리, 저장 및 UI 표시와 관련된 모든 시스템 구조와 코드 로직을 정밀 분석한 결과입니다.

---

## 1. 시스템 핵심 로직 (System Core Logic)

### 1-1. 보너스 수치 및 상수 정의
*   **기본 채굴률:** 0.25 BW/h (시간당 0.25 BW 지급)

*   **신규 가입자 혜택:** 추천 코드를 입력하고 가입 시 즉시 **2% (0.02)**의 채굴 보너스 비율을 부여받습니다.

*   **추천인 혜택:** 본인의 코드로 가입한 하위 유저 1명당 **2% (0.02)**의 채굴 보너스 비율을 추가로 획득합니다. 예: 추천인이 3명이면 `0.02 (기본) + (3 * 0.02) = 0.08 (8%)`의 보너스 비율을 가집니다.

### 1-2. 보너스 산출 공식 (Calculation Formula)
*   **초당 채굴률 계산:** `(기본 채굴률 * (1 + 출석 보너스 + 추천 보너스 + 가맹점 보너스)) / 3600`
*   **2% 추천 보너스 적립분:** `(기본 채굴률 * 추천 보너스 비율) / 3600 * 경과 시간(초)`

---

## 2. 코드 조직 및 파일 위치 (Code Organization & File Paths)

### 2-1. 서버 측 로직 (Backend)
- **최초 보너스 계정 생성 및 비율 설정:**
  - `server/controllers/UserController.ts` (168-223행, 229-260행)
  - 로직: 신규 가입(`register`) 순간, 추천인(`referrerCode`)을 찾아 추천 목록에 추가하고, 추천인과 가입자 모두에게 2% 비율(`referralBonusRate`)을 각인합니다.

- **실시간 보너스 적립 및 동기화:**
  - `server/controllers/MiningController.ts` (110-155행)
  - 로직: 채굴 데이터 동기화(`syncMiningData`) 시, 서버 시간 기준으로 2% 보너스 금액을 계산하여 `referralBonusStorage`에 누적 저장합니다.

- **API 라우트:**
  - `server/routes/referral.ts`
  - 로직: 가입자 목록 조회(`list`), 통계 조회(`stats`), 보상 지급(`register-reward`) 통로를 제공합니다.

### 2-2. 클라이언트 측 로직 (Frontend)
- **보너스 계산 및 UI 연동:**
  - `src/services/BonusService/ReferralBonusService.ts`
  - 로직: `applyReferralBonus` 함수를 통해 화면상에서 실시간으로 2%씩 올라가는 숫자를 시각화하고, 15일 락업(`lock-up`) 상태를 관리합니다.
- **UI 컴포넌트:**
  - `src/components/MiningPage/MiningPage.tsx`
  - 로직: `loadMiningStatus`에서 서버의 2% 누적액을 실시간으로 가져와 화면에 표시합니다.

---

## 3. 데이터베이스 구조 (Database Schema - MongoDB)

### 3-1. `MiningState` 컬렉션
- `referralCount`: 총 추천인 수 (명)
- `referralBonusRate`: 추천 보너스 비율 (예: 0.02, 0.04... 50자리 정밀도 문자열 저장)
- `currentTotalRate`: 모든 보너스가 합산된 최종 채굴 속도

### 3-2. `BonusRecord` 컬렉션
- `referralBonusStorage`: 2%씩 실시간으로 적립되어 쌓인 채굴 보너스의 총액.
- `referralRewardStorage`: 가입 보상(1BW) 등이 쌓이는 고정 보상 저장소.
- `referralList`: 하위 가입자별 지갑 주소, 가입일, 그리고 해당 가입자가 나에게 가져다준 각자의 보너스 기여도(`accumulatedBonus`)를 개별 관리합니다.

---

## 4. 특이 사항 및 정밀도 보장
- **50자리 부동소수점:** 모든 2% 보너스 계산은 `Decimal.js` 라이브러리를 사용하여 소수점 50자리까지 정산되며, UI상에서는 8자리까지만 반올림하여 표기됩니다.
- **15일 락업 정책:** 적립된 2% 보너스는 하위 가입자가 KYC 승인을 받고 15일이 지난 시점부터 청구(`Claim`)가 가능한 구조로 설계되어 있습니다.

---
**작성자:** BitWish AI Assistant (Antigravity)
**관리자용 전용 보고서**
