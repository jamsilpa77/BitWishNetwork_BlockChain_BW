# 🚀 BitWish Network 독립 블록체인 메인넷 v1.0

## 📋 프로젝트 개요

**BitWish Network**는 완전히 독립적인 블록체인 메인넷으로, 스텔라나 다른 기존 블록체인에 의존하지 않는 자체적인 블록체인 시스템입니다.

### 🎯 핵심 특징

- ✅ **완전 독립성**: 스텔라 관련 코드 완전 제거
- ✅ **BitWish 전용 시스템**: BW 토큰 전용 블록체인
- ✅ **50자리 정밀도**: Decimal.js를 사용한 정밀한 계산
- ✅ **PoW 합의**: SHA-256 기반 작업 증명
- ✅ **P2P 네트워크**: 자체 P2P 네트워크 시스템
- ✅ **4개국 언어**: 한국어, 영어, 일본어, 중국어 지원

## 🏗️ 시스템 아키텍처

```
📁 BitWishNetwork_BlockChain/
├── 🏗️ src/core/ (BitWish 핵심)
│   ├── BitWishBlock.ts - BitWish 블록 구조
│   ├── BitWishTransaction.ts - BitWish 트랜잭션
│   └── BitWishWallet.ts - BitWish 지갑 (BW 주소)
├── ⚙️ src/engine/ (BitWish 엔진)
│   └── BitWishBlockchain.ts - BitWish 블록체인
├── 🔗 src/p2p/ (BitWish P2P)
│   └── BitWishDiscovery.ts - BitWish 노드 발견
├── 🛡️ src/consensus/ (BitWish 합의)
│   └── BitWishPoW.ts - BitWish 작업 증명
├── 📡 src/config/ (BitWish 설정)
│   └── BitWishConfig.ts - BitWish 네트워크 설정
└── 🌐 src/server.ts (BitWish 메인넷 서버)
```

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. TypeScript 컴파일

```bash
npm run build
```

### 3. 서버 시작

```bash
npm start
```

### 4. 개발 모드

```bash
npm run dev
```

## 📊 API 엔드포인트

### 블록체인 API

- `GET /api/blockchain/status` - 블록체인 상태 조회
- `GET /api/blockchain/stats` - 블록체인 통계 조회
- `GET /api/blockchain/block/:height` - 블록 조회
- `GET /api/blockchain/transaction/:hash` - 트랜잭션 조회
- `GET /api/blockchain/balance/:address` - 잔액 조회

### P2P 네트워크 API

- `GET /api/p2p/status` - P2P 네트워크 상태 조회

### 마이닝 API

- `GET /api/mining/status` - 마이닝 상태 조회

### 시스템 API

- `GET /api/system/status` - 전체 시스템 상태 조회
- `GET /health` - 헬스 체크

## 🔧 기술 스택

- **Node.js**: 런타임 환경
- **TypeScript**: 개발 언어
- **Express.js**: 웹 서버 프레임워크
- **Socket.IO**: WebSocket 통신
- **MongoDB**: 데이터 저장소
- **Decimal.js**: 50자리 정밀도 계산
- **Crypto**: 암호화 및 해싱

## 🔒 보안 기능

- **BitWish-256 해시**: SHA-256 기반 해시 알고리즘
- **PBKDF2 해싱**: 비밀번호 보안
- **디지털 서명**: 트랜잭션 서명 검증
- **P2P 보안**: 피어 인증 및 차단 시스템

## 🌍 다국어 지원

- 🇰🇷 한국어 (Korean)
- 🇺🇸 영어 (English)
- 🇯🇵 일본어 (Japanese)
- 🇨🇳 중국어 (Chinese)

## 📈 네트워크 설정

### 기본 설정

- **네트워크 ID**: BitWish-Mainnet-v1.0
- **블록 시간**: 10초
- **총 발행량**: 210억 BW
- **마이닝 보상**: 12.5 BW (반감기 적용)
- **난이도 조절**: 2016 블록마다

### P2P 설정

- **최대 피어**: 50개
- **발견 간격**: 30초
- **핑 간격**: 10초
- **포트**: 4002

## 🛠️ 개발 도구

### 스크립트

- `npm start` - 프로덕션 서버 시작
- `npm run dev` - 개발 서버 시작
- `npm run build` - TypeScript 컴파일
- `npm run test` - 테스트 실행
- `npm run lint` - 코드 검사

### 포트 설정

- **API 서버**: 4001
- **WebSocket**: 4001
- **P2P 네트워크**: 4002
- **MongoDB**: 27017

## 📝 라이선스

MIT License

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 지원

- **이메일**: support@bitwish.network
- **웹사이트**: https://bitwish.network
- **문서**: https://docs.bitwish.network

---

**BitWish Network** - 완전 독립 블록체인 메인넷 🚀
