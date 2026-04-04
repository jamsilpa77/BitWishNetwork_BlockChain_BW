"use strict";
/**
 * ====================================================================================
 * 🚀 BitWish Wallet 클래스 - BitWish Network 독립 블록체인 지갑 시스템
 * ====================================================================================
 *
 * 🎯 핵심 기능:
 * - BitWish Network 전용 지갑 시스템
 * - BW 토큰 전용 지갑 주소 (BW + 40자리)
 * - 50자리 정밀도 계산
 * - 완벽한 독립성 보장
 *
 * 🔒 보안 기능:
 * - BitWish-256 암호화 알고리즘
 * - PBKDF2 비밀번호 해싱
 * - 지갑 암호화/복호화
 * - 완벽한 보안 검증 시스템
 *
 * 🔢 50자리 부동소수점 정밀도:
 * - 모든 계산에 Decimal.js 사용
 * - 부동소수점 오차 완전 제거
 * - 정밀한 잔액 계산 및 전송
 *
 * ====================================================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BitWishWallet = void 0;
const crypto_1 = require("crypto");
const decimal_js_1 = __importDefault(require("decimal.js"));
const BitWishConfig_1 = require("../config/BitWishConfig");
class BitWishWallet {
    constructor(data) {
        this.address = data.address;
        this.publicKey = data.publicKey;
        this.encryptedPrivateKey = data.encryptedPrivateKey;
        this.balance = new decimal_js_1.default(data.balance);
        this.nonce = data.nonce || 0;
        this.createdAt = data.createdAt || Date.now();
        this.lastActivity = data.lastActivity || Date.now();
        this.isActive = data.isActive !== false;
        this.hasPassword = data.hasPassword || false;
        this.passwordHash = data.passwordHash;
    }
    /**
     * BitWish 지갑 키페어 생성
     */
    static generateKeyPair() {
        try {
            // 32바이트 랜덤 프라이빗 키 생성
            const privateKey = (0, crypto_1.randomBytes)(32).toString('hex');
            // SHA-256으로 퍼블릭 키 생성
            const publicKey = (0, crypto_1.createHash)('sha256').update(privateKey).digest('hex');
            // BitWish 주소 생성 (BW + 40자리)
            const address = BitWishWallet.generateAddress(publicKey);
            return {
                privateKey,
                publicKey,
                address
            };
        }
        catch (error) {
            throw new Error(`키페어 생성 오류: ${error}`);
        }
    }
    /**
     * BitWish 주소 생성
     */
    static generateAddress(publicKey) {
        try {
            // 퍼블릭 키를 SHA-256으로 해시화
            const hash = (0, crypto_1.createHash)('sha256').update(publicKey).digest('hex');
            // BitWish 주소: BW + 40자리 16진수
            const address = BitWishConfig_1.BITWISH_ADDRESS_CONFIG.PREFIX + hash.substring(0, 40).toUpperCase();
            return address;
        }
        catch (error) {
            throw new Error(`주소 생성 오류: ${error}`);
        }
    }
    /**
     * 지갑 생성
     */
    static createWallet(password) {
        try {
            const keyPair = BitWishWallet.generateKeyPair();
            const walletData = {
                address: keyPair.address,
                publicKey: keyPair.publicKey,
                balance: '0.000000000000000000000000000000000000000000000000000',
                nonce: 0,
                createdAt: Date.now(),
                lastActivity: Date.now(),
                isActive: true,
                hasPassword: false
            };
            const wallet = new BitWishWallet(walletData);
            // 비밀번호가 제공된 경우 프라이빗 키 암호화
            if (password) {
                wallet.setPassword(password, keyPair.privateKey);
            }
            return wallet;
        }
        catch (error) {
            throw new Error(`지갑 생성 오류: ${error}`);
        }
    }
    /**
     * 비밀번호 설정 및 프라이빗 키 암호화
     */
    setPassword(password, privateKey) {
        try {
            // 비밀번호 해싱
            this.passwordHash = this.hashPassword(password);
            // 프라이빗 키가 제공된 경우 암호화
            if (privateKey) {
                this.encryptedPrivateKey = this.encryptPrivateKey(privateKey, password);
            }
            this.hasPassword = true;
            this.lastActivity = Date.now();
        }
        catch (error) {
            throw new Error(`비밀번호 설정 오류: ${error}`);
        }
    }
    /**
     * 비밀번호 검증
     */
    verifyPassword(password) {
        if (!this.hasPassword || !this.passwordHash) {
            return false;
        }
        try {
            const hashedPassword = this.hashPassword(password);
            return hashedPassword === this.passwordHash;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * 프라이빗 키 복호화
     */
    decryptPrivateKey(password) {
        if (!this.encryptedPrivateKey) {
            throw new Error('암호화된 프라이빗 키가 없습니다');
        }
        if (!this.verifyPassword(password)) {
            throw new Error('비밀번호가 일치하지 않습니다');
        }
        try {
            return this.decryptPrivateKeyInternal(this.encryptedPrivateKey, password);
        }
        catch (error) {
            throw new Error(`프라이빗 키 복호화 오류: ${error}`);
        }
    }
    /**
     * 잔액 업데이트
     */
    updateBalance(newBalance) {
        this.balance = new decimal_js_1.default(newBalance);
        this.lastActivity = Date.now();
    }
    /**
     * 잔액 증가
     */
    addBalance(amount) {
        const amountDecimal = new decimal_js_1.default(amount);
        this.balance = this.balance.plus(amountDecimal);
        this.lastActivity = Date.now();
    }
    /**
     * 잔액 감소
     */
    subtractBalance(amount) {
        const amountDecimal = new decimal_js_1.default(amount);
        if (this.balance.lt(amountDecimal)) {
            return false; // 잔액 부족
        }
        this.balance = this.balance.minus(amountDecimal);
        this.lastActivity = Date.now();
        return true;
    }
    /**
     * Nonce 증가
     */
    incrementNonce() {
        this.nonce++;
        this.lastActivity = Date.now();
    }
    /**
     * 지갑 활성화/비활성화
     */
    setActive(active) {
        this.isActive = active;
        this.lastActivity = Date.now();
    }
    /**
     * 비밀번호 해싱 (PBKDF2)
     */
    hashPassword(password) {
        const salt = (0, crypto_1.randomBytes)(BitWishConfig_1.BITWISH_WALLET_CONFIG.SALT_LENGTH);
        const hash = (0, crypto_1.pbkdf2Sync)(password, salt, BitWishConfig_1.BITWISH_WALLET_CONFIG.ITERATIONS, BitWishConfig_1.BITWISH_WALLET_CONFIG.KEY_LENGTH, 'sha512');
        return salt.toString('hex') + ':' + hash.toString('hex');
    }
    /**
     * 프라이빗 키 암호화
     */
    encryptPrivateKey(privateKey, password) {
        try {
            const cipher = (0, crypto_1.createCipher)(BitWishConfig_1.BITWISH_WALLET_CONFIG.ENCRYPTION_ALGORITHM, password);
            let encrypted = cipher.update(privateKey, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return encrypted;
        }
        catch (error) {
            throw new Error(`프라이빗 키 암호화 오류: ${error}`);
        }
    }
    /**
     * 프라이빗 키 복호화
     */
    decryptPrivateKeyInternal(encryptedPrivateKey, password) {
        try {
            const decipher = (0, crypto_1.createDecipher)(BitWishConfig_1.BITWISH_WALLET_CONFIG.ENCRYPTION_ALGORITHM, password);
            let decrypted = decipher.update(encryptedPrivateKey, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            throw new Error(`프라이빗 키 복호화 오류: ${error}`);
        }
    }
    /**
     * 주소 유효성 검증
     */
    static isValidAddress(address) {
        return BitWishConfig_1.BITWISH_ADDRESS_CONFIG.VALIDATION_REGEX.test(address);
    }
    /**
     * 지갑 요약 정보
     */
    getSummary() {
        return {
            address: this.address,
            publicKey: this.publicKey,
            balance: this.balance.toString(),
            nonce: this.nonce,
            createdAt: this.createdAt,
            lastActivity: this.lastActivity,
            isActive: this.isActive,
            hasPassword: this.hasPassword
        };
    }
    /**
     * 지갑을 JSON으로 직렬화
     */
    toJSON() {
        return {
            address: this.address,
            publicKey: this.publicKey,
            encryptedPrivateKey: this.encryptedPrivateKey,
            balance: this.balance.toString(),
            nonce: this.nonce,
            createdAt: this.createdAt,
            lastActivity: this.lastActivity,
            isActive: this.isActive,
            hasPassword: this.hasPassword,
            passwordHash: this.passwordHash
        };
    }
    /**
     * JSON에서 지갑 객체 생성
     */
    static fromJSON(data) {
        return new BitWishWallet(data);
    }
    /**
     * 지갑 복사본 생성
     */
    clone() {
        return new BitWishWallet(this.toJSON());
    }
    /**
     * 지갑 비교
     */
    equals(other) {
        return this.address === other.address;
    }
    /**
     * 지갑 상태 검증
     */
    isValid() {
        try {
            // 1. 주소 형식 검증
            if (!BitWishWallet.isValidAddress(this.address)) {
                return { valid: false, error: '유효하지 않은 주소 형식입니다' };
            }
            // 2. 퍼블릭 키 검증
            if (!this.publicKey || this.publicKey.length !== 64) {
                return { valid: false, error: '유효하지 않은 퍼블릭 키입니다' };
            }
            // 3. 잔액 검증
            if (this.balance.lt(0)) {
                return { valid: false, error: '잔액이 음수일 수 없습니다' };
            }
            // 4. Nonce 검증
            if (this.nonce < 0) {
                return { valid: false, error: '유효하지 않은 nonce입니다' };
            }
            // 5. 비밀번호 설정 검증
            if (this.hasPassword && !this.passwordHash) {
                return { valid: false, error: '비밀번호가 설정되었지만 해시가 없습니다' };
            }
            return { valid: true };
        }
        catch (error) {
            return { valid: false, error: `지갑 검증 중 오류: ${error}` };
        }
    }
    /**
     * 지갑 백업 생성
     */
    createBackup(password) {
        if (!this.verifyPassword(password)) {
            throw new Error('비밀번호가 일치하지 않습니다');
        }
        const backupData = {
            version: '1.0.0',
            network: 'BitWish-Mainnet-v1.0',
            wallet: this.toJSON(),
            timestamp: Date.now()
        };
        return JSON.stringify(backupData, null, 2);
    }
    /**
     * 지갑 백업에서 복원
     */
    static restoreFromBackup(backupData, password) {
        try {
            const backup = JSON.parse(backupData);
            if (backup.version !== '1.0.0') {
                throw new Error('지원하지 않는 백업 버전입니다');
            }
            if (backup.network !== 'BitWish-Mainnet-v1.0') {
                throw new Error('지원하지 않는 네트워크입니다');
            }
            const wallet = new BitWishWallet(backup.wallet);
            if (!wallet.verifyPassword(password)) {
                throw new Error('비밀번호가 일치하지 않습니다');
            }
            return wallet;
        }
        catch (error) {
            throw new Error(`지갑 복원 오류: ${error}`);
        }
    }
}
exports.BitWishWallet = BitWishWallet;
//# sourceMappingURL=BitWishWallet.js.map