"use strict";
/**
 * ====================================================================================
 * 🚀 BitWish Network 독립 블록체인 설정 v1.0
 * ====================================================================================
 *
 * 🎯 핵심 설정:
 * - BitWish Network 독립 블록체인 전용 설정
 * - BW 토큰 전용 시스템
 * - BitWish-256 암호화 기반 보안
 * - 완벽한 독립성 보장
 *
 * 🔒 보안 설정:
 * - BitWish 전용 암호화 알고리즘
 * - 독립적인 보안 프로토콜
 * - 완벽한 보안 검증 시스템
 *
 * 🔢 50자리 부동소수점 정밀도:
 * - 모든 계산에 Decimal.js 사용 (50자리 정밀도)
 * - 부동소수점 오차 완전 제거
 * - 정밀한 잔액 계산 및 전송
 *
 * ====================================================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BITWISH_WALLET_CONFIG = exports.BITWISH_MINING_CONFIG = exports.BITWISH_CONSENSUS_CONFIG = exports.BITWISH_BLOCK_CONFIG = exports.BITWISH_TRANSACTION_CONFIG = exports.BITWISH_ADDRESS_CONFIG = exports.BITWISH_NETWORK_CONFIG = void 0;
const decimal_js_1 = __importDefault(require("decimal.js"));
// BitWish Network 핵심 설정
exports.BITWISH_NETWORK_CONFIG = {
    // 네트워크 기본 설정
    NETWORK_ID: 'BitWish-Mainnet-v1.0',
    NETWORK_NAME: 'BitWish Network',
    NETWORK_VERSION: '1.0.0',
    // 블록 설정
    BLOCK_TIME: 10000, // 10초
    MAX_TRANSACTIONS_PER_BLOCK: 1000,
    BLOCK_SIZE_LIMIT: 1024 * 1024, // 1MB
    // 가스 설정
    GAS_PRICE: new decimal_js_1.default('0.001'), // 0.001 BW
    GAS_LIMIT: 21000,
    // 토큰 설정
    TOKEN_SYMBOL: 'BW',
    TOKEN_NAME: 'BitWish Token',
    TOTAL_SUPPLY: new decimal_js_1.default('21000000000.000000000000000000000000000000000000000000000000000'), // 210억 BW (50자리 정밀도)
    DECIMALS: 50, // 50자리 정밀도
    // 마이닝 설정
    GENESIS_VALIDATOR: 'BitWish-Foundation',
    DIFFICULTY_TARGET: 4, // 4개의 0으로 시작하는 해시
    MINING_REWARD: new decimal_js_1.default('12.500000000000000000000000000000000000000000000000000'), // 12.5 BW (50자리 정밀도)
    HALVING_INTERVAL: 210000, // 21만 블록마다 반감
    // 스테이킹 설정
    STAKING_APY: 15.0, // 15% APY
    LOCKUP_PERIODS: [30, 90, 180, 365], // 일 단위
    MIN_STAKING_AMOUNT: new decimal_js_1.default('1000.000000000000000000000000000000000000000000000000000'), // 1000 BW
    // 세션 설정
    MAX_SESSIONS: 10000,
    SESSION_EXPIRY: 24 * 60 * 60 * 1000, // 24시간
    // 보안 설정
    SECURITY_CONFIG: {
        maxFailedAttempts: 5,
        lockoutDuration: 24 * 60 * 60 * 1000, // 24시간
        passwordMinLength: 8,
        passwordRequirements: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        encryptionAlgorithm: 'aes-256-gcm',
        hashAlgorithm: 'sha512',
        saltLength: 32,
        iterations: 100000,
        keyLength: 64
    },
    // P2P 네트워크 설정
    P2P_CONFIG: {
        maxPeers: 50,
        discoveryInterval: 30000, // 30초
        pingInterval: 10000, // 10초
        connectionTimeout: 30000, // 30초
        maxMessageSize: 1024 * 1024, // 1MB
        port: 4002
    },
    // 데이터베이스 설정
    DATABASE_CONFIG: {
        connectionString: 'mongodb://localhost:27017',
        databaseName: 'bitwish_network',
        collections: {
            wallets: 'wallets',
            sessions: 'sessions',
            miningSessions: 'mining_sessions',
            transactions: 'transactions',
            blocks: 'blocks',
            accounts: 'accounts',
            peers: 'peers',
            consensus: 'consensus'
        }
    },
    // API 설정
    API_CONFIG: {
        port: 4001,
        cors: {
            origin: ['http://localhost:4000', 'http://localhost:4001', 'http://localhost:3000'],
            credentials: true
        },
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15분
            max: 100 // 최대 100 요청
        }
    },
    // WebSocket 설정
    WEBSOCKET_CONFIG: {
        port: 4001,
        pingInterval: 25000,
        pingTimeout: 60000,
        maxConnections: 1000
    },
    // 로깅 설정
    LOGGING_CONFIG: {
        level: 'info',
        format: 'combined',
        maxFiles: 5,
        maxSize: '10m'
    }
};
// BitWish 주소 형식 설정
exports.BITWISH_ADDRESS_CONFIG = {
    PREFIX: 'BW',
    LENGTH: 42, // BW + 40자리 16진수
    CHECKSUM_LENGTH: 4,
    VALIDATION_REGEX: /^BW[0-9A-Fa-f]{40}$/
};
// BitWish 트랜잭션 설정
exports.BITWISH_TRANSACTION_CONFIG = {
    TYPES: {
        TRANSFER: 'TRANSFER',
        MINING_REWARD: 'MINING_REWARD',
        STAKING_REWARD: 'STAKING_REWARD',
        CONTRACT_CALL: 'CONTRACT_CALL',
        SYSTEM: 'SYSTEM'
    },
    STATUS: {
        PENDING: 'PENDING',
        CONFIRMED: 'CONFIRMED',
        FAILED: 'FAILED'
    }
};
// BitWish 블록 설정
exports.BITWISH_BLOCK_CONFIG = {
    GENESIS_HASH: '0000000000000000000000000000000000000000000000000000000000000000',
    MERKLE_ROOT_EMPTY: '0000000000000000000000000000000000000000000000000000000000000000',
    VERSION: 1
};
// BitWish 합의 설정
exports.BITWISH_CONSENSUS_CONFIG = {
    ALGORITHM: 'ProofOfWork',
    DIFFICULTY_ADJUSTMENT_INTERVAL: 2016, // 2016 블록마다 난이도 조정
    TARGET_BLOCK_TIME: 10000, // 10초
    MAX_DIFFICULTY_CHANGE: 4, // 최대 4배 변경
    MIN_DIFFICULTY: 1
};
// BitWish 마이닝 설정
exports.BITWISH_MINING_CONFIG = {
    REWARD_SCHEDULE: [
        { blockHeight: 0, reward: new decimal_js_1.default('50.000000000000000000000000000000000000000000000000000') },
        { blockHeight: 210000, reward: new decimal_js_1.default('25.000000000000000000000000000000000000000000000000000') },
        { blockHeight: 420000, reward: new decimal_js_1.default('12.500000000000000000000000000000000000000000000000000') },
        { blockHeight: 630000, reward: new decimal_js_1.default('6.250000000000000000000000000000000000000000000000000') },
        { blockHeight: 840000, reward: new decimal_js_1.default('3.125000000000000000000000000000000000000000000000000') }
    ],
    POOL_FEE_PERCENTAGE: 1.0, // 1% 풀 수수료
    MIN_PAYOUT: new decimal_js_1.default('0.010000000000000000000000000000000000000000000000000') // 0.01 BW
};
// BitWish 지갑 설정
exports.BITWISH_WALLET_CONFIG = {
    ENCRYPTION_ALGORITHM: 'aes-256-gcm',
    KEY_DERIVATION: 'pbkdf2',
    ITERATIONS: 100000,
    SALT_LENGTH: 32,
    KEY_LENGTH: 32,
    IV_LENGTH: 16
};
exports.default = exports.BITWISH_NETWORK_CONFIG;
//# sourceMappingURL=BitWishConfig.js.map