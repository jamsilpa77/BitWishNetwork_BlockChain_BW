# 추천 보너스 및 가맹점 보너스 구현 계획서 및 MongoDB 스키마 분석
# Referral & Partner Bonus Implementation Plan & MongoDB Schema Analysis

**문서 버전:** 2.1.0 (Schema Added)
**작성일:** 2025-12-03
**작성자:** BitWishNetwork Dev Team (Antigravity)

---

## 📋 목차

1. [현재 상황 및 문제점 분석](#1-현재-상황-및-문제점-분석)
2. [MongoDB 스키마 현황 분석](#2-mongodb-스키마-현황-분석)
3. [핵심 해결 전략: LocalStorage 기반 영구 저장](#3-핵심-해결-전략-localstorage-기반-영구-저장)
4. [단계별 구현 계획](#4-단계별-구현-계획)
5. [추후 MongoDB 연동 및 데이터 마이그레이션 계획](#5-추후-mongodb-연동-및-데이터-마이그레이션-계획)
6. [가맹점 보너스 구현 계획](#6-가맹점-보너스-구현-계획)

---

## 1. 현재 상황 및 문제점 분석

### 1.1 현재 상황
*   **백엔드 연결 불가:** 현재 백엔드 서버(MongoDB)와의 연결이 `ERR_CONNECTION_REFUSED`로 인해 불가능한 상태입니다.
*   **출석 보너스 정상 작동:** `AttendanceBonusService`가 `localStorage`를 사용하여 데이터를 영구적으로 보존하고 있어 정상 작동 중입니다.
*   **추천 보너스 작동 실패:** `ReferralBonusService`가 데이터를 메모리(`Map`)에만 저장하고 있어, 페이지 새로고침 시 모든 데이터가 초기화됩니다.

### 1.2 문제점 (Root Cause)
1.  **데이터 증발:** 추천인이 가입해도 저장하지 않아, 새로고침하면 "0명"으로 리셋됨.
2.  **데이터 불일치:** 마이닝 페이지와 나의 지갑이 서로 다른 데이터 소스를 바라보고 있음.

---

## 2. MongoDB 스키마 현황 분석

현재 백엔드 코드(`server/models`) 분석 결과, 추천 보너스 및 사용자 관계를 저장하기 위한 데이터베이스 설계는 **이미 완벽하게 구현**되어 있습니다.

### 2.1 BonusRecord 모델 (`server/models/BonusRecord.ts`)
추천 보너스와 보상 내역을 저장하는 핵심 모델입니다.

*   **`referralBonusStorage` (String)**: 2% 추천 보너스가 누적되는 저장소입니다. 50자리 정밀도 문자열로 저장됩니다.
*   **`referralRewardStorage` (String)**: 1BW 일회성 보상이 누적되는 저장소입니다.
*   **`referralList` (Array)**: 나를 추천인으로 등록한 가입자들의 상세 목록입니다.
    *   `childWalletAddress`: 가입자 지갑 주소
    *   `joinedAt`: 가입 일시
    *   `accumulatedBonus`: 이 가입자로 인해 발생한 총 보너스
    *   `rewardStatus`: 보상 지급 상태 ('PENDING' | 'PAID')

### 2.2 User 모델 (`server/models/User.ts`)
사용자 간의 추천 관계를 정의하는 모델입니다.

*   **`myReferralCode` (String)**: 사용자 본인의 고유 추천 코드입니다. (Unique Index 적용됨)
*   **`referrerCode` (String)**: 나를 초대한 사람의 추천 코드입니다.

**분석 결론:**
데이터베이스 설계는 수정할 필요 없이 완벽합니다. 현재 문제는 이 DB에 접근할 수 없다는 점이므로, **프론트엔드에서 임시 저장소를 구축하여 데이터를 모아두었다가, 추후 서버 복구 시 이 스키마에 맞춰 데이터를 밀어넣으면 됩니다.**

---

## 3. 핵심 해결 전략: LocalStorage 기반 영구 저장

백엔드 복구 전까지 시스템을 완벽하게 구동하기 위해, **출석 보너스와 동일한 방식(LocalStorage)**으로 모든 보너스 시스템을 표준화합니다.

### 3.1 저장소 키(Key) 정의
*   **출석 보너스:** `bw-attendance-records` (기존 유지)
*   **추천 보너스:** `bw-referral-data` (신규 정의)
    *   저장 구조는 MongoDB `BonusRecord` 스키마와 최대한 유사하게 구성하여 추후 이관을 용이하게 합니다.
*   **지갑 데이터:** `bw_wallet_data` (기존 유지, 동기화 대상)

---

## 4. 단계별 구현 계획

### Phase 1: 추천 보너스 저장소 구현 (Service 레벨)

**목표:** `ReferralBonusService.ts`에 기억력(Persistence) 부여

1.  **데이터 로드 기능 추가 (`loadData`)**
    *   생성자(`constructor`) 실행 시 `localStorage.getItem('bw-referral-data')` 호출.
2.  **데이터 저장 기능 추가 (`saveData`)**
    *   데이터 변경 시 즉시 `localStorage.setItem` 호출.
3.  **지갑 데이터 동기화 (`syncWithWallet`)**
    *   보너스 발생 시 `bw_wallet_data`의 `referralReward`, `referralBonus` 필드도 함께 업데이트.

### Phase 2: 마이닝 페이지 데이터 연동 (UI 레벨)

**목표:** `MiningPage.tsx`가 저장된 데이터를 올바르게 표시

1.  **서비스 인스턴스 유지**
    *   `MiningPage` 진입 시 저장된 데이터를 로드하여 표시.
2.  **보너스 적용 로직 연결**
    *   `applyReferralBonus` 호출 시 저장된 값을 기반으로 계산.

### Phase 3: 나의 지갑 데이터 동기화

**목표:** `MyWalletModal.tsx`와 `MiningPage.tsx`의 수치 100% 일치

1.  **단일 진실 공급원(SSOT) 확립**
    *   두 컴포넌트 모두 `localStorage`의 `bw_wallet_data`를 참조하도록 확인.

---

## 5. 추후 MongoDB 연동 및 데이터 마이그레이션 계획

백엔드 서버가 정상화되면, 로컬스토리지에 쌓인 데이터를 MongoDB로 안전하게 이관해야 합니다.

### 5.1 데이터 동기화 프로세스 (Sync Process)
1.  **서버 연결 감지:** 프론트엔드에서 백엔드 헬스 체크(`/api/health`) 성공 시 동기화 모드 진입.
2.  **데이터 전송:** `localStorage`의 `bw-referral-data`를 JSON 형태로 서버에 전송.
3.  **서버 처리 (Upsert):**
    *   서버는 전송받은 데이터를 `BonusRecord` 모델에 매핑.
    *   기존 DB 데이터와 비교하여 누락된 내역을 추가(Merge).
    *   `referralBonusStorage` 값을 합산하여 업데이트.
4.  **검증 및 클리어:** 서버 저장 성공 응답(`200 OK`)을 받으면, 로컬스토리지의 '미전송 플래그'를 해제 (데이터는 캐시용으로 남겨둠).

### 5.2 하이브리드 아키텍처 (최종 목표)
*   **Read (조회):** 속도를 위해 `localStorage`에서 우선 조회 (Cache First).
*   **Write (쓰기):** `localStorage`에 즉시 저장(Optimistic UI) 후, 백그라운드에서 서버로 비동기 전송.
*   이 구조는 인터넷 연결이 불안정해도 앱이 멈추지 않고 작동하게 합니다.

---

## 6. 가맹점 보너스 구현 계획

추천 보너스와 동일한 아키텍처를 적용합니다.

### 6.1 저장소 키 정의
*   **가맹점 데이터:** `bw-partner-data`

### 6.2 구현 단계
1.  **`PartnerBonusService.ts` 수정**
    *   `localStorage` 저장/로드 로직 추가.
2.  **마이닝 페이지 연동**
    *   승인 상태(`APPROVED`)를 영구 저장하고 UI에 반영.

---

## 7. 작업 우선순위

1.  **[최우선]** `ReferralBonusService.ts` 저장소 구현 (데이터 증발 방지)
2.  **[우선]** `MiningPage.tsx` 데이터 연동 (화면 표시 정상화)
3.  **[필수]** `MyWalletModal.tsx` 동기화 (지갑-채굴 페이지 일치)

이 계획서는 현재의 로컬 저장소 구현이 단순 임시방편이 아니라, **미래의 MongoDB 연동을 위한 탄탄한 기초 작업**임을 명시합니다.
