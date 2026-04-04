/**
 * BitWishNetwork BW 포인트 채굴 시스템
 * 현재 토큰 이코노미는 완벽한 가상 이코노미입니다.
 * 추후 KYC 시스템 구현과 블록체인 연결 지갑까지 완성하면 
 * KYC 승인 후 실제 BW 토큰이 마이그레이션 되는 방식입니다.
 * 
 * ⚠️ 중요 준수 사항: 전역 모달, 공통 변수 함수 절대 포함하지 않는다
 * ❌ 전역 변수 사용 금지
 * ❌ 공통 함수 사용 금지  
 * ❌ 공통 클래스 사용 금지
 * ❌ 전역 모달 사용 금지
 * ❌ 중복 코드 사용 금지
 * ❌ 다른 컴포넌트와 상태 공유 금지
 * ❌ 전역 상태 관리 라이브러리 사용 금지
 * 
 * ✅ 모든 파일 첫 줄부터 주석에 절대 준수사항 명시 추가
 * ✅ 자체 보안 검증만 사용
 * ✅ 50단위 부동소수점 정밀 계산형식으로 구현 하지만 UI 홈페이지 이미지상 소수즘 8자리만 표기한다. 
 * ✅ BitWish Network 전용 시스템만 사용
 * ✅ 모든 텍스트는 한국어, 영어, 일어, 중국어포함 동남아권 언어 변경 되도록 모든 기능에 완벽하게 구현한다. 
 *        단 절대 복잡하게 파일들을 만들지 않도록한다. 
 * ✅ 마이닝 페이지는 완벽한 독립성 보장과 완벽한 데이터베이스 MongDB 하이브리드 완벽 저장소 구현한다. 
 * ✅ 유저는 1명이든 천만명이든 개인 단독 데이터베이스 MongDB 하이브리드 완벽 저장소를 구현한다.
 */

module.exports = {
  // 테스트 환경 설정
  testEnvironment: 'node',
  
  // TypeScript 지원
  preset: 'ts-jest',
  
  // 테스트 파일 패턴
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.test.js'
  ],
  
  // 모듈 경로 매핑
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // 변환 설정
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // 파일 확장자
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // 테스트 타임아웃 (기본 5초)
  testTimeout: 30000,
  
  // 성능 테스트 타임아웃 (60초)
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // 커버리지 설정
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,js}',
    '!src/**/*.spec.{ts,js}'
  ],
  
  // 커버리지 임계값
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // 테스트 결과 출력
  verbose: true,
  
  // 병렬 실행 설정
  maxWorkers: '50%',
  
  // 테스트 결과 캐시
  cache: true,
  
  // 테스트 결과 정리
  clearMocks: true,
  restoreMocks: true,
  
  // 글로벌 설정
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
  
  // 테스트 설정 파일
  setupFiles: ['<rootDir>/tests/setup.ts'],
  
  // 테스트 후 정리
  teardownFiles: ['<rootDir>/tests/teardown.ts'],
  
  // 모듈 해석
  moduleDirectories: ['node_modules', 'src'],
  
  // 테스트 결과 포맷
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './coverage/html-report',
      filename: 'report.html',
      expand: true
    }]
  ],
  
  // 테스트 필터
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],
  
  // 변환 무시
  transformIgnorePatterns: [
    '/node_modules/(?!(decimal\\.js)/)'
  ],
  
  // 테스트 환경 변수
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  
  // 테스트 실행 전 설정
  beforeAll: async () => {
    // 테스트 환경 초기화
    console.log('🧪 BitWishNetwork 테스트 환경 초기화 중...');
  },
  
  // 테스트 실행 후 정리
  afterAll: async () => {
    // 테스트 환경 정리
    console.log('🧹 BitWishNetwork 테스트 환경 정리 중...');
  }
};