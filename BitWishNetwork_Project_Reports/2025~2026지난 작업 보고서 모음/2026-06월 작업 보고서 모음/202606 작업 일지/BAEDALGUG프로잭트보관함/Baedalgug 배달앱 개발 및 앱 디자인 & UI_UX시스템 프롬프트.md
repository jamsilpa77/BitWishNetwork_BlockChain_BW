제시하신 배달 플랫폼 아키텍처와 UI/UX 시스템에 더하여, 앞서 발견된 **7가지 미흡점을 철저하게 보완할 수 있는 [최종 아키텍처 폴더/파일
지도]와 [초정밀 개발 및 코드 생성용 시스템 프롬프트 패키지]**를 작성하였습니다.

비개발자라도 본 가이드를 개발 팀이나 코드 생성 AI(Cursor, v0, Bolt.new 등)에 그대로 복사·붙여넣기하여 실제 작동 가능한
수준의 설계와 코드를 무리 없이 얻으실 수 있도록 구체적인 파일 단위와 DB 구조(DDL)까지 포함하여 설계했습니다.

PART 1: 최종 시스템 폴더 및 파일 아키텍처 지도

실제 마이크로서비스 아키텍처(MSA) 및 블록체인 스마트 컨트랙트가 구동될 수 있는 프로덕션 수준의 디렉터리 및 파일 맵입니다. 7대
미흡점(동적 정산, 동적 할증, 슬래싱, 앱스토어 정책 우회용 분리)을 완벽하게 반영한 파일 구성입니다.

/delivery-blockchain-platform
├── /apps
│   ├── /customer-app             # 고객용 모바일 앱 (React Native / Expo)
│   │   ├── /src
│   │   │   ├── /components       # 기여도 게이지 바, 일반 포인트 적립 대시보드
│   │   │   ├── /screens          # [중요] 온체인 가상자산 관련 화면 배제, 인앱 포인트만 노출
│   │   │   └── /services/api.js  # API 연동 (외부 브라우저 지갑 연동용 deep-link 포함)
│   ├── /partner-app              # 사장님용 태블릿/모바일 앱 (React Native)
│   │   ├── /src
│   │   │   ├── /components       # 노드 하트비트 애니메이션 컴포넌트, ERP 그래프
│   │   │   └── /screens          # 주문관리, 실시간 PG 에스크로 정산 현황, 재고 분석
│   ├── /rider-app                # 라이더용 모바일 앱 (React Native)
│   │   ├── /src
│   │   │   ├── /components       # GPS 실시간 지도, 슬라이딩 완료 버튼
│   │   │   └── /screens          # 기상/피크타임 할증 알림, 당일 배달 수입 통계 화면
│   └── /admin-web                # 관리자 통합 관제 웹 (Next.js / TypeScript)
│       ├── /src
│       │   ├── /pages/settlement # 정산 보류, 에스크로 환불, 분쟁 강제 중재 페이지
│       │   └── /pages/kyc        # 사장님 신원 검증(KYC) 및 어뷰징 탐지 현황판
│
├── /services                     # 백엔드 마이크로서비스 (Node.js/Go/Python)
│   ├── /auth-service             # 인증 및 사장님 KYC 검증 서비스
│   ├── /order-service            # 주문 및 장바구니, 결제 승인 요청 라우터
│   ├── /store-service            # 매장 알고리즘 (기여도, 응답성, 성공률 기반 비상업적 추천 엔진)
│   ├── /delivery-service         # 라이더 GPS 매칭 및 동적 할증 계산 엔진
│   │   ├── /src
│   │   │   ├── /algorithms       # 기상/피크 타임 실시간 요금 계산기 (dynamic_pricing.js)
│   │   │   └── /dispatch         # 라이더 자동 배차 알고리즘 (dispatcher.js)
│   ├── /settlement-service       # 카드 수수료 자동 정산 및 실시간 에스크로 분배 엔진
│   │   ├── /src
│   │   │   ├── escrow_manager.js # 카드/간편결제 수수료(PG사) 분할 및 예치 기간 관리
│   │   │   └── refund_handler.js # 주문 취소 시 정산 롤백 처리기
│   ├── /erp-service              # 사장님 POS, 직원 급여, 실시간 원가 계산
│   └── /ai-service               # 가짜 리뷰 감지(NLP), 판매 피크 예측 및 식자재 추천 (Python Fast API)
│
├── /blockchain                   # 스마트 컨트랙트 및 웹3 인프라
│   ├── /contracts                # 솔리디티(Solidity) 컨트랙트 파일
│   │   ├── PlatformToken.sol     # 생태계 유틸리티 토큰 표준 (ERC-20 기반)
│   │   ├── ContributionLedger.sol# 파트너 기여도 기록 및 오프체인 상호 검증용
│   │   └── EscrowSlashing.sol    # [미흡점 보완] 주문 취소/어뷰징 발생 시 기여도 회수 및 보상 슬래싱 규칙
│   ├── /node-validation          # 모바일 하드웨어 PoW 한계 보완을 위한 '서버형 경량 검증 노드' 소스
│   └── /web3-portal              # [앱스토어 심사 통과용] 모바일 외부 브라우저 전용 웹앱 (Web3 Gateway)
│       └── /src/wallet-bridge    # 지갑 연동(Metamask, WalletConnect) 및 토큰-포인트 마이그레이션 포탈
│
├── /libs                         # 공유 데이터 라이브러리
│   ├── /database                 # 통합 DB 스키마 및 마이그레이션 파일
│   │   ├── schema.sql            # PostgreSQL DDL 소스 코드
│   │   └── seed.sql              # 초기화 데이터 세트
│   └── /common-types             # 공통 TypeScript 타입 선언
├── /infra                        # 클라우드 및 도커 배포 설정 (Docker, K8s)
└── /docs                         # 개발 가이드라인 및 API 정의서

PART 2: 초정밀 DB 스키마 DDL 및 상태 전이 명세 (PostgreSQL)

실제 데이터베이스에 즉시 실행 가능한 **PostgreSQL 용 테이블 생성 쿼리(DDL)**입니다. PG 수수료 보정과 정산 에스크로 상태,
그리고 취소/환불 시 토큰 회수를 위한 구조가 정밀하게 내장되어 있습니다.

-- 1. 사용자 통합 관리 (고객, 사장님, 라이더 구분)
CREATE TYPE user_role_enum AS ENUM ('CUSTOMER', 'PARTNER', 'RIDER', 'ADMIN');
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 노드 운영자로서의 사장님 프로필
CREATE TYPE kyc_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    store_name VARCHAR(100) NOT NULL,
    business_number VARCHAR(50) UNIQUE NOT NULL,
    wallet_address VARCHAR(42), -- Web3 지갑 주소
    kyc_status kyc_status_enum DEFAULT 'PENDING',
    kyc_verified_at TIMESTAMP WITH TIME ZONE,
    node_contribution_score INT DEFAULT 0
);

-- 3. 매장 정보 및 AI 노출 평가 모델 (기여도 중심 가중치 적용)
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    is_open BOOLEAN DEFAULT FALSE,
    delivery_success_rate NUMERIC(5,2) DEFAULT 100.00, -- 최근 배송 성공률
    review_quality_score NUMERIC(3,2) DEFAULT 5.00,    -- AI 가짜리뷰 필터링 후 가중 평점
    reorder_rate NUMERIC(5,2) DEFAULT 0.00,          -- 고객 재주문율
    last_score_updated_at TIMESTAMP WITH TIME ZONE
);

-- 4. 결제 수수료 및 에스크로 정산 기록 테이블
CREATE TYPE escrow_status_enum AS ENUM ('HOLDING', 'RELEASED', 'REFUNDED', 'DISPUTED');
CREATE TABLE settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID UNIQUE NOT NULL,
    gross_amount NUMERIC(12,2) NOT NULL,            -- 고객 결제 총액 (KRW)
    pg_fee NUMERIC(12,2) NOT NULL,                  -- 카드사/PG사 차감 수수료 (예: 2.5%)
    partner_settle_amount NUMERIC(12,2) NOT NULL,    -- 사장님 최종 지급액 (플랫폼 수수료 0원 적용)
    rider_settle_amount NUMERIC(12,2) NOT NULL,      -- 라이더 최종 지급액
    escrow_status escrow_status_enum DEFAULT 'HOLDING',
    settled_at TIMESTAMP WITH TIME ZONE,            -- 정산 처리 완료 일시 (배달 완료 + Lock-up 해제 후)
    dispute_resolved_at TIMESTAMP WITH TIME ZONE
);

-- 5. 기여도 기반 토큰 적립 및 슬래싱(환불 회수) 이력 테이블
CREATE TYPE contribution_activity_enum AS ENUM ('ORDER_COMPLETED', 'REVIEW_APPROVED', 'NODE_UPTIME_VERIFIED', 'ORDER_CANCELLED_SLASHING', 'ABUSE_DETECTED_SLASHING');
CREATE TABLE contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type contribution_activity_enum NOT NULL,
    score_delta INT NOT NULL,                        -- 기여도 증가/차감치 (음수값 가능)
    token_reward_delta NUMERIC(20,8) NOT NULL,       -- 토큰 증가/차감치 (취소 시 마이너스 적립)
    is_on_chain BOOLEAN DEFAULT FALSE,
    tx_hash VARCHAR(66),                             -- 취소/회수 완료 시 블록체인 트랜잭션 해시 기록
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 설정 (실시간 데이터 조회 및 스래싱 방어용)
CREATE INDEX idx_stores_ranking_scores ON stores (delivery_success_rate, review_quality_score, reorder_rate);
CREATE INDEX idx_settlements_order_status ON settlements (order_id, escrow_status);
CREATE INDEX idx_contributions_user ON contributions (user_id, created_at);

PART 3: 핵심 핵심 로직 초정밀 시스템 프롬프트

이 시스템 프롬프트는 비개발자 사장님이 Claude 3.5 Sonnet 이나 GPT-4o 등 코딩 성능이 우수한 AI 툴에 그대로 복사하여
실행할 수 있는 최고 수준의 정밀한 개발 지시서입니다. 7대 보완점을 충족하는 실제 백엔드 소스 코드를 생성해 줍니다.

3.1 PG 에스크로 및 카드 수수료 정산 엔진 코드 생성용

[System Directive: PG Escrow and Fee Settlement Logic Engine]

역할: 당신은 '수수료 0원' 플랫폼에서 발생하는 실제 카드 결제 및 라이더 정산 분배를 다루는 수석 백엔드 개발자입니다. 아래 명시된 규칙을 바탕으로 정밀한 JavaScript Node.js 코드를 작성하십시오.

핵심 규칙:
1. 플랫폼 자체 중개 수수료는 0원입니다.
2. 하지만 결제망 외부 비용인 'PG 수수료(pg_fee_rate = 0.025, 즉 2.5%)'는 총 결제 금액에서 자동으로 공제되어 차감 정산되어야 합니다.
3. 라이더 배송 요금은 플랫폼에서 별도로 책정하며, 고객 결제 총액에 포함됩니다.
4. 모든 정산 대금은 고객의 결제 완료 즉시 사장님께 배정되는 것이 아니라 에스크로(HOLDING) 상태로 묶입니다. 배달 성공(DELIVERY_COMPLETED) 확인 24시간 후에 최종 잠금해제(RELEASED)되어 출금할 수 있는 사장님의 지갑(Wallet) 가용 자산으로 귀속됩니다.
5. 배달 지연, 상품 누락 등 분쟁(DISPUTE) 상태가 발생하면 관리자에 의해 상태가 수동 강제 조정될 때까지 정산 분배 작업은 전면 보류됩니다.

구현 내용:
- 입력 데이터: gross_amount(주문 총액), rider_delivery_fee(라이더 배송비)
- 함수 1: `calculateSettleDistribution(gross_amount, rider_delivery_fee)`
  - 수수료율 및 라이더 몫 차감 계산 로직
  - 사장님 최종 정산 금액 = (총 결제액 - 라이더 배송비) * (1 - PG 수수료율)
- 함수 2: `releaseEscrow(orderId)`
  - 배달완료 및 보류 시간이 지난 후 에스크로 상태 변경 및 원장 업데이트
- 함수 3: `handleDispute(orderId)`
  - 분쟁 상태 진입 처리 및 정산 일시 중지 기능

위 세 가지 기능을 가진 Node.js Express용 미들웨어 서비스 코드(Error Handling 및 트랜잭션 안전 장치 포함)를 작성해 주십시오.

3.2 라이더 동적 배차 및 기상/피크 할증 알고리즘 코드 생성용

[System Directive: Dynamic Delivery Pricing and Rider Dispatching Algorithm]

역할: 당신은 라이더 수급 부족 및 기상 악화 시에도 배달 시스템이 마비되지 않도록 실시간 요금을 조정하는 물류 알고리즘 개발자입니다. 아래 요구사항을 반영하여 배달 요금을 계산하고 최적 라이더를 매칭하는 Python 소스 코드를 작성해 주십시오.

핵심 수식 및 요건:
1. 기본 배달 요금(base_fee) = 3,000 KRW (기본 거리 1.5km 이내)
2. 초과 거리 가산(distance_premium) = 100m 당 150 KRW 추가
3. 기상 할증(weather_premium):
   - 비(Rainy) 또는 눈(Snowy) 올 시: 전체 요금에 + 2,000 KRW 추가 가산 및 라이더 제한속도 가중치 보정
4. 피크타임 할증(peak_premium):
   - 점심 피크(오전 11:30 ~ 오후 13:30) 및 저녁 피크(오후 18:00 ~ 20:00)에는 기본요금의 1.3배(multiplier = 1.3) 적용
5. 최적 라이더 자동 매칭(match_rider):
   - 가게 반경 2km 이내에 있는 활성화 상태의 라이더들 중 배달 평점(rider_rating)이 가장 높고, 실시간 동선 거리가 가장 짧은 라이더 1순위 강제 배정.

구현 내용:
- 외부 API 입력 모조 데이터 정의: Weather API (rainy=True), GPS coordinates
- 클래스: `DeliveryPricingEngine`
- 메소드 1: `calculate_dynamic_fee(distance_meters, current_time, weather_status)`
- 메소드 2: `find_optimal_rider(store_location, available_riders_list)`

데이터 전송의 안전성과 수치 오차를 방지하기 위해 정수 연산 처리를 기본으로 하여 가독성 높은 Python 코드를 생성해 주십시오.

3.3 기여도 증명(PoC) 및 환불/어뷰징 발생 시 토큰 삭감(Slashing) 컨트랙트 코드 생성용

[System Directive: Smart Contract for Proof of Contribution and Slashing Reward]

역할: 당신은 배달 완료 및 커뮤니티 정직 활동에 대해 보상을 토큰으로 지급하고, 환불이나 가짜 리뷰 어뷰징이 적발되었을 때 강제로 지급된 가치를 회수(Slashing)하는 Web3 스마트 컨트랙트 솔리디티(Solidity v0.8.20 이상) 전문 개발자입니다.

기능 명세:
1. 'PlatformToken' (ERC-20 기반)에 연동되어 동작하는 'ContributionLedger' 컨트랙트입니다.
2. `rewardPartner(address partner, uint256 orderId, uint256 contributionScore)` 함수:
   - 오프체인 서버로부터 검증된 파트너 노드의 정상 활동이 전달되었을 때, 해당 파트너의 기여도 점수를 가산하고 비례하는 플랫폼 토큰을 가상 지갑에 축적시킵니다.
   - 단, 이 토큰은 24시간 동안 전송 불가능(Locked) 상태가 됩니다.
3. `slashPartner(address partner, uint256 orderId)` 함수:
   - 고객의 취소, 환불 및 AI 어뷰징 판정 시 호출됩니다.
   - 락업(Locked) 상태인 보상 토큰 풀에서 해당 주문으로 지급되었던 토큰을 전량 즉시 소각(Burn)하고, 해당 파트너의 노드 평판(Reputation) 점수를 누적 마이너스 시킵니다.
   - 만약 이미 잠금 해제되어 토큰을 출금해 버린 경우에는 파트너의 계정을 일시 정지(Staking Slash 또는 수령 한도를 마이너스로 설정)하는 상태 메커니즘을 가집니다.
4. 오직 백엔드 서버 권한(onlyOwner)을 통해서만 이 함수들을 호출할 수 있도록 보안 장치를 설정하십시오.

가독성과 안전성을 극대화한 스마트 컨트랙트 솔리디티 전체 프로덕션 코드를 작성해 주십시오.

3.4 앱스토어 심사 거부(Guideline 3.1.1, 3.1.5) 우회용 하이브리드 지갑 아키텍처 연동 코드 생성용

[System Directive: Hybrid App Store Guideline Avoidance and Web3 Bridging Flow]

역할: 당신은 Apple App Store 가이드라인 3.1.1 및 3.1.5 규제(인앱 내 가상자산 지갑을 통한 기능 해금 금지 및 기기 내 강제 채굴 금지)를 완벽하게 우회하여 앱 출시 심사를 통과시키는 모바일 앱 프런트엔드 개발자입니다.

우회 전략 (App Store Compliance Architecture):
1. 모바일 앱(iOS/Android) 내부 화면에는 '비트코인', '이더리움', '메인넷', '가상자산', '토큰'과 같은 웹3 네이티브 단어를 일절 노출하지 않습니다.
2. 앱 내부에서는 친근한 용어인 '기여 포인트(Contribution Point)'와 '친환경 기여 등급'으로 평범한 이커머스 포인트처럼 시각화하여 표기합니다.
3. 이 포인트를 가상자산 플랫폼 토큰으로 1:1로 스왑(스왑 비율 연동)하고 개인 메타마스크나 거래소 지갑으로 전송하고 싶다면, 외부 안전 모바일 브라우저 결제 링크(External Payment Links)나 외부 주소로 연동하는 웹뷰 게이트웨이(WebView with Custom Uri Scheme) 방식을 취합니다. 이는 최근의 애플 정책 완화 사항을 철저히 충족합니다.
4. 기기 자원을 사용하는 불법 백그라운드 연산(PoW) 코드는 탑재하지 않고, 오직 배달 성공/영업 시간 유지와 같은 '오프체인 데이터'로만 기여 포인트가 충전되는 백엔드 API 연동 구조를 채택합니다.

구현 코드 내용:
- React Native로 작성된 고객/사장님 지갑 대시보드 스크린 코드.
- 앱 내부 UI: `InAppPointView.js` (일반 포인트를 깔끔하게 표시하고, 하단에 [자세히 보기/포인트 연동하기] 버튼 탑재)
- 버튼 클릭 시 외부 웹 게이트웨이 브라우저로 딥링크 전환되는 로직:
  - React Native의 `Linking.openURL('https://ecosystem-gateway.platform/wallet-migration?userId=XYZ')` 활용
- 이 하이브리드 우회 및 안전 전이 아키텍처를 구현하는 세련된 React Native UI 코드를 생성해 주십시오.

💡 활용 팁 (비개발자용 사용법)

1.  위 **PART 1 (폴더 지도)**를 텍스트 파일로 저장하여 개발을 의뢰할 외주사 혹은 파트너 개발자에게 배포하면, 개발자는 프로젝트의
    전체 구조를 정확하게 이해하게 됩니다.
2.  **PART 2 (DB 스키마 DDL)**은 그대로 DBMS(PostgreSQL)에 붙여넣어 즉각 실서버 테이블을 만드는데 활용할 수
    있습니다.
3.  **PART 3 (초정밀 시스템 프롬프트)**는 3.1부터 3.4까지 하나씩 복사하여 AI 코딩 어시스턴트(Cursor, ChatGPT
    등)에게 전송하십시오. 그렇게 하면 비개발자 사장님이라도 실제 상용화 배달 앱에 들어갈 '가장 핵심적인 로직 소스 코드'를 완전히
    안전한 구조로 획득하실 수 있습니다.
