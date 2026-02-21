# BitWishNetwork BW 포인트 채굴 시스템

## 📋 프로젝트 개요

**BitWishNetwork BW 포인트 채굴 시스템**은 가상 이코노미 기반의 마이닝 플랫폼입니다.

> **현재 토큰 이코노미는 완벽한 가상 이코노미입니다.**  
> 추후 KYC 시스템 구현과 블록체인 연결 지갑까지 완성하면 KYC 승인 후 실제 BW 토큰이 마이그레이션 되는 방식입니다.

## 🎯 핵심 기능

### 마이닝 시스템
- **기본 보상률**: 시간당 0.25 BW
- **50자리 부동소수점 정밀 계산**
- **실시간 데이터 동기화** (30초마다)
- **자동 새로고침** (1분마다)

### 보너스 시스템
- **출석 보너스**: 5% (일일 출석 체크)
- **추천 보너스**: 2% + 1BW (추천인/가입자)
- **가맹점 보너스**: 125% (사업자 인증)

### 다국어 지원
- **기본 4개국**: 한국어, 영어, 일본어, 중국어
- **동남아권 확장**: 태국어, 베트남어, 인도네시아어 등

## 🏗️ 기술 스택

- **Frontend**: TypeScript, HTML5, CSS3
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Blockchain**: BitWishNetwork PoW
- **Build**: Webpack 5
- **Testing**: Jest

## 📁 프로젝트 구조

```
BitWishNetwork_MiningSystem/
├── src/
│   ├── components/          # 독립 컴포넌트들
│   │   ├── HomePage/        # 홈페이지 컴포넌트
│   │   ├── MiningPage/      # 마이닝 페이지 컴포넌트
│   │   ├── BonusSystem/     # 보너스 시스템 컴포넌트들
│   │   ├── Navigation/       # 네비게이션 컴포넌트
│   │   └── Language/        # 다국어 지원 컴포넌트
│   ├── services/            # 서비스 레이어
│   │   ├── MiningService/   # 마이닝 서비스
│   │   ├── BonusService/    # 보너스 서비스
│   │   ├── DatabaseService/  # 데이터베이스 서비스
│   │   └── BlockchainService/ # 블록체인 서비스
│   ├── utils/               # 유틸리티 함수들
│   │   ├── PrecisionCalculator/ # 50자리 정밀 계산
│   │   ├── SecurityValidator/   # 보안 검증
│   │   └── LanguageManager/     # 다국어 관리
│   ├── types/               # TypeScript 타입 정의
│   ├── constants/           # 상수 정의
│   └── styles/             # 스타일 파일들
├── public/                  # 정적 파일들
├── docs/                    # 문서화
└── tests/                   # 테스트 파일들
```

## 🚀 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
```bash
cp env.example .env
# .env 파일을 편집하여 필요한 설정을 입력
```

### 3. 개발 서버 실행
```bash
npm run dev
```

### 4. 프로덕션 빌드
```bash
npm run build
npm start
```

## 🔧 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 테스트 실행
npm test

# 린트 검사
npm run lint

# 타입 체크
npm run type-check
```

## 📊 토큰 이코노미

### 토큰 분배 (총 210억 BW)
- **생태계 80%** (168억 BW)
  - 회원 마이닝용: 70% (147억 BW)
  - 파트너/상점용: 10% (21억 BW)
- **재단/개발팀/운영 20%** (42억 BW)

### 수수료 분배
- **생태계 조성 자금**: 70%
- **개발팀 운영 자금**: 30%

## 🛡️ 보안 및 준수사항

### 절대 준수사항
- ❌ 전역 변수 사용 금지
- ❌ 공통 함수 사용 금지
- ❌ 공통 클래스 사용 금지
- ❌ 전역 모달 사용 금지
- ❌ 중복 코드 사용 금지
- ❌ 다른 컴포넌트와 상태 공유 금지
- ❌ 전역 상태 관리 라이브러리 사용 금지

### 보안 기능
- 자체 보안 검증 시스템
- BitWish Network 전용 시스템
- MongoDB 하이브리드 저장소
- 개인별 완전 독립된 데이터베이스

## 🌐 다국어 지원

### 기본 언어
- 한국어 (ko)
- 영어 (en)
- 일본어 (ja)
- 중국어 (zh)

### 동남아권 언어
- 태국어 (th)
- 베트남어 (vi)
- 인도네시아어 (id)
- 말레이어 (ms)
- 필리핀어 (tl)
- 크메르어 (km)
- 라오어 (lo)
- 미얀마어 (my)

## 📱 UI/UX 특징

- **다크/나이트 모드** 지원
- **고급스러운 디자인** (화려하지 않고 고급스러움)
- **반응형 디자인**
- **실시간 업데이트**
- **직관적인 사용자 인터페이스**

## 🔄 자동 새로고침

- **데이터 새로고침**: 30초마다
- **페이지 새로고침**: 1분마다
- **실시간 상태 업데이트**

## 📈 성능 최적화

- **코드 스플리팅**
- **지연 로딩**
- **캐싱 전략**
- **압축 최적화**

## 🧪 테스트

```bash
# 단위 테스트
npm test

# 커버리지 리포트
npm run test:coverage

# E2E 테스트
npm run test:e2e
```

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

**BitWishNetwork Development Team**  
*가상 이코노미 기반 마이닝 플랫폼*
