# BitWish 블록 생성 수수료 및 분배 체계 작업 초정밀 공정 기술 명세서

## 1. 시스템 아키텍처 개요
본 기술 명세서는 BitWish 메인넷 환경에서 블록이 생성될 때 자동으로 누적되는 블록 생성 수수료(Block Creation Fee) 및 누적 기금의 추적, 백엔드 API 연동, 그리고 프론트엔드 실시간 시각화 구조를 정의합니다.

- **블록 생성당 수수료**: `0.001 BW`
- **수수료 분배 공식**: 
  - **생태계 기금 (Ecosystem Fund)**: 총 누적 수수료의 `60%`
  - **재단 운영비 (Foundation Fund)**: 총 누적 수수료의 `40%`

---

## 2. 데이터베이스 스키마 및 데이터 구조

수수료 누적 통계는 MongoDB 데이터베이스 내의 글로벌 메인넷 통계 컬렉션에서 단일 도큐먼트로 통합 관리됩니다.

- **데이터베이스 명**: `bitwish_network`
- **컬렉션 명**: `network_stats`
- **도큐먼트 ID**: `{ "id": "global_fund_stats" }`

### 데이터 스키마 명세
```json
{
  "_id": "ObjectId(...)",
  "id": "global_fund_stats",
  "totalAccumulatedFees": "0.11300000",
  "ecosystemFund": "0.06780000",
  "foundationFund": "0.04520000",
  "updatedAt": "ISODate(...)"
}
```
- 모든 금액 데이터는 정밀도 유지 및 부동 소수점 오차 방지를 위해 **String(문자열)** 타입으로 직렬화하여 관리합니다.

---

## 3. 백엔드 API 통신 규격

### 1) 실시간 통계 엔드포인트
- **Method / Path**: `GET /api/stats/realtime`
- **기능**: 블록 정보, 전송 금액 통계, 공급량 정보와 더불어 실시간 기금 상태 데이터를 반환.
- **반환 데이터 명세 (JSON)**:
```json
{
  "success": true,
  "data": {
    "totalSupply": "15000000000",
    "currentSupply": "1350000000",
    "totalBlocks": 144,
    "blockCreationFee": "0.11300000",
    "ecosystemFund": "0.06780000",
    "foundationFund": "0.04520000"
  }
}
```

### 2) 백엔드 블록 카운팅 정합성 보정
- **제네시스 및 스냅샷 보정 로직**:
  - 데이터베이스의 마이닝된 `blocks` 컬렉션의 도큐먼트 개수에 기본 제네시스 및 추천 보상 스냅샷(30개 블록 분량 상당)을 더해 `totalBlocks = dbCount + 30`으로 환산하여 정합성을 유지합니다.

---

## 4. 프론트엔드 연동 및 UI 명세

### 1) 상태 및 API 폴링 메커니즘
- **컴포넌트**: [ExplorerPage.tsx](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/src/components/Explorer/ExplorerPage.tsx)
- **메커니즘**:
  - `fundStats` React State를 활용하여 `blockCreationFee`, `ecosystemFund`, `foundationFund` 데이터를 동적 관리.
  - `useEffect` 훅 내의 `fetchBlocks` 실행 시 10초 주기(`setInterval`)로 백엔드 엔드포인트를 호출하여 UI 데이터를 동기화.

### 2) 다국어 i18n 연동 및 바인딩
- 하드코딩된 언어 텍스트 분쇄 처리를 적용하여 `t()` 함수를 통해 4개국어(KO, EN, JA, ZH) 지원.
  - `t('explorer.blockFees')` -> 블록 생성 수수료
  - `t('explorer.totalFees')` -> 총 누적 기금 합계
  - `t('explorer.minerPayoutStatus')` -> 개인채굴자 BW 지급현황

### 3) 스타일 레이아웃 (CSS 명세)
- **컴포넌트**: [ExplorerPage.css](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/src/components/Explorer/ExplorerPage.css)
- **핵심 클래스**:
  - `.fee-split-row`: 생태계 기금 및 재단 운영비 행을 나란히 배치하기 위해 `display: flex`, `gap: 12px` 구성.
  - `.fee-split-item`: 미세 테두리와 함께 어두운 배경색(`rgba(255, 255, 255, 0.02)`) 지정 및 마우스 호버 시 부드러운 하이라이트 트랜지션 처리.
  - 수치 표현 시 고정 폭 글꼴(`JetBrains Mono`, `monospace`)을 사용하여 자릿수 변화 시 레이아웃 흔들림 현상 차단.
