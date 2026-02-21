import Decimal from 'decimal.js';
export declare const BITWISH_NETWORK_CONFIG: {
    NETWORK_ID: string;
    NETWORK_NAME: string;
    NETWORK_VERSION: string;
    BLOCK_TIME: number;
    MAX_TRANSACTIONS_PER_BLOCK: number;
    BLOCK_SIZE_LIMIT: number;
    GAS_PRICE: Decimal;
    GAS_LIMIT: number;
    TOKEN_SYMBOL: string;
    TOKEN_NAME: string;
    TOTAL_SUPPLY: Decimal;
    DECIMALS: number;
    GENESIS_VALIDATOR: string;
    DIFFICULTY_TARGET: number;
    MINING_REWARD: Decimal;
    HALVING_INTERVAL: number;
    STAKING_APY: number;
    LOCKUP_PERIODS: number[];
    MIN_STAKING_AMOUNT: Decimal;
    MAX_SESSIONS: number;
    SESSION_EXPIRY: number;
    SECURITY_CONFIG: {
        maxFailedAttempts: number;
        lockoutDuration: number;
        passwordMinLength: number;
        passwordRequirements: RegExp;
        encryptionAlgorithm: string;
        hashAlgorithm: string;
        saltLength: number;
        iterations: number;
        keyLength: number;
    };
    P2P_CONFIG: {
        maxPeers: number;
        discoveryInterval: number;
        pingInterval: number;
        connectionTimeout: number;
        maxMessageSize: number;
        port: number;
    };
    DATABASE_CONFIG: {
        connectionString: string;
        databaseName: string;
        collections: {
            wallets: string;
            sessions: string;
            miningSessions: string;
            transactions: string;
            blocks: string;
            accounts: string;
            peers: string;
            consensus: string;
        };
    };
    API_CONFIG: {
        port: number;
        cors: {
            origin: string[];
            credentials: boolean;
        };
        rateLimit: {
            windowMs: number;
            max: number;
        };
    };
    WEBSOCKET_CONFIG: {
        port: number;
        pingInterval: number;
        pingTimeout: number;
        maxConnections: number;
    };
    LOGGING_CONFIG: {
        level: string;
        format: string;
        maxFiles: number;
        maxSize: string;
    };
};
export declare const BITWISH_ADDRESS_CONFIG: {
    PREFIX: string;
    LENGTH: number;
    CHECKSUM_LENGTH: number;
    VALIDATION_REGEX: RegExp;
};
export declare const BITWISH_TRANSACTION_CONFIG: {
    TYPES: {
        TRANSFER: string;
        MINING_REWARD: string;
        STAKING_REWARD: string;
        CONTRACT_CALL: string;
        SYSTEM: string;
    };
    STATUS: {
        PENDING: string;
        CONFIRMED: string;
        FAILED: string;
    };
};
export declare const BITWISH_BLOCK_CONFIG: {
    GENESIS_HASH: string;
    MERKLE_ROOT_EMPTY: string;
    VERSION: number;
};
export declare const BITWISH_CONSENSUS_CONFIG: {
    ALGORITHM: string;
    DIFFICULTY_ADJUSTMENT_INTERVAL: number;
    TARGET_BLOCK_TIME: number;
    MAX_DIFFICULTY_CHANGE: number;
    MIN_DIFFICULTY: number;
};
export declare const BITWISH_MINING_CONFIG: {
    REWARD_SCHEDULE: {
        blockHeight: number;
        reward: Decimal;
    }[];
    POOL_FEE_PERCENTAGE: number;
    MIN_PAYOUT: Decimal;
};
export declare const BITWISH_WALLET_CONFIG: {
    ENCRYPTION_ALGORITHM: string;
    KEY_DERIVATION: string;
    ITERATIONS: number;
    SALT_LENGTH: number;
    KEY_LENGTH: number;
    IV_LENGTH: number;
};
export default BITWISH_NETWORK_CONFIG;
//# sourceMappingURL=BitWishConfig.d.ts.map