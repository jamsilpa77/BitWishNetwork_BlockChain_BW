/**
 * BitWishNetwork BW 포인트 채굴 시스템
 * 현재 토큰 이코노미는 완벽한 가상 이코노미입니다.
 * 추후 KYC 시스템 구현과 블록체인 연결 지갑까지 완성하면 
 * KYC 승인 후 실제 BW 토큰이 마이그레이션 되는 방식입니다.
 * 
 * 절대 준수사항:
 * - 전역 변수 사용 금지
 * - 공통 함수 사용 금지
 * - 공통 클래스 사용 금지
 * - 전역 모달 사용 금지
 * - 중복 코드 사용 금지
 * - 다른 컴포넌트와 상태 공유 금지
 * - 전역 상태 관리 라이브러리 사용 금지
 */

// 마이닝 시스템 상수
export const MINING_CONSTANTS = {
  // 기본 보상률 (고정값)
  HOURLY_BASE_RATE: 0.25, // BW/시간
  DAILY_MAX_REWARD: 6.0,  // BW/일
  MONTHLY_REWARD: 180,    // BW/월
  YEARLY_REWARD: 2190,    // BW/년
  
  // 총 공급량
  TOTAL_SUPPLY: 21000000000, // 210억 BW
  
  // 정밀도 설정
  PRECISION_DIGITS: 50,   // 내부 계산 정밀도
  DISPLAY_DIGITS: 8,       // UI 표시 정밀도
  
  // 자동 새로고침 간격
  AUTO_REFRESH_INTERVAL: 30000,  // 30초
  PAGE_REFRESH_INTERVAL: 60000,  // 1분
} as const;

// 보너스 시스템 상수
export const BONUS_CONSTANTS = {
  // 출석 보너스
  ATTENDANCE_BONUS_RATE: 0.05,  // 5%
  ATTENDANCE_CHECK_START: 9,     // 오전 9시
  ATTENDANCE_CHECK_END: 8,       // 다음날 오전 8시 59분 59초
  
  // 추천 보너스
  REFERRAL_BONUS_RATE: 0.02,     // 2%
  REFERRAL_REWARD_AMOUNT: 1,     // 1BW
  
  // 가맹점 보너스
  PARTNER_BONUS_RATE: 1.25,      // 125%
  
  // 보너스 상태
  BONUS_STATUS: {
    ACTIVE: 'ON',
    INACTIVE: 'OFF'
  }
} as const;

// 토큰 분배 상수
export const TOKEN_DISTRIBUTION = {
  // 생태계 80%
  ECOSYSTEM_TOTAL: 0.8,
  ECOSYSTEM_AMOUNT: 16800000000, // 168억 BW
  
  // 회원 마이닝용 70%
  MEMBER_MINING: 0.7,
  MEMBER_MINING_AMOUNT: 14700000000, // 147억 BW
  
  // 파트너/상점용 10%
  PARTNER_STORE: 0.1,
  PARTNER_STORE_AMOUNT: 2100000000, // 21억 BW
  
  // 재단/개발팀/운영 20%
  FOUNDATION_TEAM: 0.2,
  FOUNDATION_TEAM_AMOUNT: 4200000000, // 42억 BW
} as const;

// 수수료 분배 상수
export const FEE_DISTRIBUTION = {
  // 생태계 조성 자금 70%
  ECOSYSTEM_FUND: 0.7,
  
  // 개발팀 운영 자금 30%
  DEVELOPMENT_TEAM: 0.3,
  
  // 수수료 금액
  TRANSACTION_FEE: 0.01,  // BW/거래
  BLOCK_CREATION_FEE: 0.001, // BW/블록
} as const;

// 언어 설정 상수
export const LANGUAGE_CONSTANTS = {
  DEFAULT_LANGUAGE: 'ko',
  SUPPORTED_LANGUAGES: ['ko', 'en', 'ja', 'zh'],
  SOUTHEAST_ASIA_LANGUAGES: ['th', 'vi', 'id', 'ms', 'tl', 'km', 'lo', 'my'],
} as const;

// 네트워크 상태 상수
export const NETWORK_STATUS = {
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  ERROR: 'ERROR'
} as const;

// 마이닝 상태 상수
export const MINING_STATUS = {
  IDLE: 'IDLE',
  MINING: 'MINING',
  PAUSED: 'PAUSED',
  STOPPED: 'STOPPED',
  ERROR: 'ERROR'
} as const;

// 출석 상태 상수
export const ATTENDANCE_STATUS = {
  AVAILABLE: 'AVAILABLE',     // 출석 가능 (파란색)
  COMPLETED: 'COMPLETED',     // 출석 완료 (빨간색)
  EXPIRED: 'EXPIRED',         // 출석 기회 상실 (회색)
  FUTURE: 'FUTURE'            // 미래 날짜
} as const;

// 가맹점 상태 상수
export const PARTNER_STATUS = {
  NOT_REGISTERED: 'NOT_REGISTERED',     // 미등록
  PENDING: 'PENDING',                   // 심사 대기
  APPROVED: 'APPROVED',                 // 승인됨
  REJECTED: 'REJECTED',                 // 거부됨
  SUSPENDED: 'SUSPENDED'               // 정지됨
} as const;

// API 엔드포인트 상수
export const API_ENDPOINTS = {
  BASE_URL: '/api/v1',
  MINING: '/mining',
  BONUS: '/bonus',
  USER: '/user',
  BLOCKCHAIN: '/blockchain',
  AUTH: '/auth'
} as const;

// 데이터베이스 컬렉션 상수
export const DATABASE_COLLECTIONS = {
  USERS: 'users',
  MINING_RECORDS: 'mining_records',
  BONUS_RECORDS: 'bonus_records',
  ATTENDANCE_RECORDS: 'attendance_records',
  REFERRAL_RECORDS: 'referral_records',
  PARTNER_RECORDS: 'partner_records',
  BLOCKCHAIN_RECORDS: 'blockchain_records'
} as const;

// 보안 설정 상수
export const SECURITY_CONSTANTS = {
  JWT_EXPIRES_IN: '24h',
  BCRYPT_ROUNDS: 12,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_TIME: 15 * 60 * 1000, // 15분
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24시간
} as const;

// UI 테마 상수
export const THEME_CONSTANTS = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
} as const;

// 에러 코드 상수
export const ERROR_CODES = {
  // 일반 에러
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  
  // 마이닝 에러
  MINING_NOT_STARTED: 'MINING_NOT_STARTED',
  MINING_ALREADY_STARTED: 'MINING_ALREADY_STARTED',
  MINING_RATE_INVALID: 'MINING_RATE_INVALID',
  
  // 보너스 에러
  BONUS_ALREADY_CLAIMED: 'BONUS_ALREADY_CLAIMED',
  BONUS_EXPIRED: 'BONUS_EXPIRED',
  BONUS_INVALID: 'BONUS_INVALID',
  
  // 데이터베이스 에러
  DATABASE_CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR: 'DATABASE_QUERY_ERROR',
  DATABASE_INSERT_ERROR: 'DATABASE_INSERT_ERROR',
  
  // 블록체인 에러
  BLOCKCHAIN_CONNECTION_ERROR: 'BLOCKCHAIN_CONNECTION_ERROR',
  BLOCKCHAIN_TRANSACTION_ERROR: 'BLOCKCHAIN_TRANSACTION_ERROR',
  WALLET_ERROR: 'WALLET_ERROR'
} as const;

// 추가 상수들
export const TOTAL_SUPPLY = 21000000000; // 210억 BW
export const BASE_REWARD_PER_HOUR = 0.25; // BW/시간
export const ATTENDANCE_BONUS_RATE = 0.05; // 5%
export const REFERRAL_BONUS_RATE = 0.02; // 2%
export const MERCHANT_BONUS_RATE = 1.25; // 125%
export const DECIMAL_PLACES_UI = 8; // UI 표시 정밀도
export const PRECISION_DECIMAL_JS = 50; // 내부 계산 정밀도
export const DEFAULT_LANGUAGE = 'ko'; // 기본 언어
export const AUTO_REFRESH_INTERVAL = 30000; // 30초
export const PAGE_REFRESH_INTERVAL = 60000; // 1분
export const ATTENDANCE_CHECK_START = 9; // 오전 9시
export const ATTENDANCE_CHECK_END = 8; // 다음날 오전 8시 59분 59초
export const REFERRAL_REWARD_AMOUNT = 1; // 1BW

// 상태 상수들
export const REFERRAL_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED'
} as const;

// 추가 상수들
export const PARTNER_BONUS_RATE = 1.25; // 125%
