"use strict";
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
    static generateKeyPair() {
        try {
            const privateKey = (0, crypto_1.randomBytes)(32).toString('hex');
            const publicKey = (0, crypto_1.createHash)('sha256').update(privateKey).digest('hex');
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
    static generateAddress(publicKey) {
        try {
            const hash = (0, crypto_1.createHash)('sha256').update(publicKey).digest('hex');
            const address = BitWishConfig_1.BITWISH_ADDRESS_CONFIG.PREFIX + hash.substring(0, 40).toUpperCase();
            return address;
        }
        catch (error) {
            throw new Error(`주소 생성 오류: ${error}`);
        }
    }
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
            if (password) {
                wallet.setPassword(password, keyPair.privateKey);
            }
            return wallet;
        }
        catch (error) {
            throw new Error(`지갑 생성 오류: ${error}`);
        }
    }
    setPassword(password, privateKey) {
        try {
            this.passwordHash = this.hashPassword(password);
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
    updateBalance(newBalance) {
        this.balance = new decimal_js_1.default(newBalance);
        this.lastActivity = Date.now();
    }
    addBalance(amount) {
        const amountDecimal = new decimal_js_1.default(amount);
        this.balance = this.balance.plus(amountDecimal);
        this.lastActivity = Date.now();
    }
    subtractBalance(amount) {
        const amountDecimal = new decimal_js_1.default(amount);
        if (this.balance.lt(amountDecimal)) {
            return false;
        }
        this.balance = this.balance.minus(amountDecimal);
        this.lastActivity = Date.now();
        return true;
    }
    incrementNonce() {
        this.nonce++;
        this.lastActivity = Date.now();
    }
    setActive(active) {
        this.isActive = active;
        this.lastActivity = Date.now();
    }
    hashPassword(password) {
        const salt = (0, crypto_1.randomBytes)(BitWishConfig_1.BITWISH_WALLET_CONFIG.SALT_LENGTH);
        const hash = (0, crypto_1.pbkdf2Sync)(password, salt, BitWishConfig_1.BITWISH_WALLET_CONFIG.ITERATIONS, BitWishConfig_1.BITWISH_WALLET_CONFIG.KEY_LENGTH, 'sha512');
        return salt.toString('hex') + ':' + hash.toString('hex');
    }
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
    static isValidAddress(address) {
        return BitWishConfig_1.BITWISH_ADDRESS_CONFIG.VALIDATION_REGEX.test(address);
    }
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
    static fromJSON(data) {
        return new BitWishWallet(data);
    }
    clone() {
        return new BitWishWallet(this.toJSON());
    }
    equals(other) {
        return this.address === other.address;
    }
    isValid() {
        try {
            if (!BitWishWallet.isValidAddress(this.address)) {
                return { valid: false, error: '유효하지 않은 주소 형식입니다' };
            }
            if (!this.publicKey || this.publicKey.length !== 64) {
                return { valid: false, error: '유효하지 않은 퍼블릭 키입니다' };
            }
            if (this.balance.lt(0)) {
                return { valid: false, error: '잔액이 음수일 수 없습니다' };
            }
            if (this.nonce < 0) {
                return { valid: false, error: '유효하지 않은 nonce입니다' };
            }
            if (this.hasPassword && !this.passwordHash) {
                return { valid: false, error: '비밀번호가 설정되었지만 해시가 없습니다' };
            }
            return { valid: true };
        }
        catch (error) {
            return { valid: false, error: `지갑 검증 중 오류: ${error}` };
        }
    }
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