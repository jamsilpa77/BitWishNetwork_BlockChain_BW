"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BITWISH_WALLET_CONFIG = exports.BITWISH_MINING_CONFIG = exports.BITWISH_CONSENSUS_CONFIG = exports.BITWISH_BLOCK_CONFIG = exports.BITWISH_TRANSACTION_CONFIG = exports.BITWISH_ADDRESS_CONFIG = exports.BITWISH_NETWORK_CONFIG = void 0;
const decimal_js_1 = __importDefault(require("decimal.js"));
exports.BITWISH_NETWORK_CONFIG = {
    NETWORK_ID: 'BitWish-Mainnet-v1.0',
    NETWORK_NAME: 'BitWish Network',
    NETWORK_VERSION: '1.0.0',
    BLOCK_TIME: 10000,
    MAX_TRANSACTIONS_PER_BLOCK: 1000,
    BLOCK_SIZE_LIMIT: 1024 * 1024,
    GAS_PRICE: new decimal_js_1.default('0.001'),
    GAS_LIMIT: 21000,
    TOKEN_SYMBOL: 'BW',
    TOKEN_NAME: 'BitWish Token',
    TOTAL_SUPPLY: new decimal_js_1.default('21000000000.000000000000000000000000000000000000000000000000000'),
    DECIMALS: 50,
    GENESIS_VALIDATOR: 'BitWish-Foundation',
    DIFFICULTY_TARGET: 4,
    MINING_REWARD: new decimal_js_1.default('12.500000000000000000000000000000000000000000000000000'),
    HALVING_INTERVAL: 210000,
    STAKING_APY: 15.0,
    LOCKUP_PERIODS: [30, 90, 180, 365],
    MIN_STAKING_AMOUNT: new decimal_js_1.default('1000.000000000000000000000000000000000000000000000000000'),
    MAX_SESSIONS: 10000,
    SESSION_EXPIRY: 24 * 60 * 60 * 1000,
    SECURITY_CONFIG: {
        maxFailedAttempts: 5,
        lockoutDuration: 24 * 60 * 60 * 1000,
        passwordMinLength: 8,
        passwordRequirements: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        encryptionAlgorithm: 'aes-256-gcm',
        hashAlgorithm: 'sha512',
        saltLength: 32,
        iterations: 100000,
        keyLength: 64
    },
    P2P_CONFIG: {
        maxPeers: 50,
        discoveryInterval: 30000,
        pingInterval: 10000,
        connectionTimeout: 30000,
        maxMessageSize: 1024 * 1024,
        port: 4002
    },
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
    API_CONFIG: {
        port: 4001,
        cors: {
            origin: ['http://localhost:4000', 'http://localhost:4001', 'http://localhost:3000'],
            credentials: true
        },
        rateLimit: {
            windowMs: 15 * 60 * 1000,
            max: 100
        }
    },
    WEBSOCKET_CONFIG: {
        port: 4001,
        pingInterval: 25000,
        pingTimeout: 60000,
        maxConnections: 1000
    },
    LOGGING_CONFIG: {
        level: 'info',
        format: 'combined',
        maxFiles: 5,
        maxSize: '10m'
    }
};
exports.BITWISH_ADDRESS_CONFIG = {
    PREFIX: 'BW',
    LENGTH: 42,
    CHECKSUM_LENGTH: 4,
    VALIDATION_REGEX: /^BW[0-9A-Fa-f]{40}$/
};
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
exports.BITWISH_BLOCK_CONFIG = {
    GENESIS_HASH: '0000000000000000000000000000000000000000000000000000000000000000',
    MERKLE_ROOT_EMPTY: '0000000000000000000000000000000000000000000000000000000000000000',
    VERSION: 1
};
exports.BITWISH_CONSENSUS_CONFIG = {
    ALGORITHM: 'ProofOfWork',
    DIFFICULTY_ADJUSTMENT_INTERVAL: 2016,
    TARGET_BLOCK_TIME: 10000,
    MAX_DIFFICULTY_CHANGE: 4,
    MIN_DIFFICULTY: 1
};
exports.BITWISH_MINING_CONFIG = {
    REWARD_SCHEDULE: [
        { blockHeight: 0, reward: new decimal_js_1.default('50.000000000000000000000000000000000000000000000000000') },
        { blockHeight: 210000, reward: new decimal_js_1.default('25.000000000000000000000000000000000000000000000000000') },
        { blockHeight: 420000, reward: new decimal_js_1.default('12.500000000000000000000000000000000000000000000000000') },
        { blockHeight: 630000, reward: new decimal_js_1.default('6.250000000000000000000000000000000000000000000000000') },
        { blockHeight: 840000, reward: new decimal_js_1.default('3.125000000000000000000000000000000000000000000000000') }
    ],
    POOL_FEE_PERCENTAGE: 1.0,
    MIN_PAYOUT: new decimal_js_1.default('0.010000000000000000000000000000000000000000000000000')
};
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