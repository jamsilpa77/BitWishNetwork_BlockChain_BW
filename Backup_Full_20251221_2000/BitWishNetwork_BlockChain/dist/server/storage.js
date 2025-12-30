"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistentStorage = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// [중요] 관리자 절대 준수 명령: 어떠한 경우에도 데이터 삭제(unlink, rm) 금지
// 오직 파일 생성(write)과 읽기(read)만 허용됨.
const DB_PATH = path_1.default.resolve(process.cwd(), '../database');
/**
 * 파일 기반 영구 저장소 모듈
 * 브라우저 캐시가 삭제되어도 이 파일들은 유지됨.
 */
class PersistentStorage {
    static ensureDirectory() {
        if (!fs_1.default.existsSync(DB_PATH)) {
            fs_1.default.mkdirSync(DB_PATH, { recursive: true });
        }
    }
    /**
     * 데이터를 JSON 파일로 안전하게 저장 (덮어쓰기 모드)
     * @param filename 예: 'wallets.json' or 'referrals.json'
     * @param data 저장할 객체
     */
    static saveToFile(filename, data) {
        try {
            this.ensureDirectory();
            const filePath = path_1.default.join(DB_PATH, filename);
            const jsonStr = JSON.stringify(data, null, 2); // 가독성을 위해 들여쓰기 적용
            fs_1.default.writeFileSync(filePath, jsonStr, 'utf-8');
            console.log(`[PersistentStorage] Saved to ${filename}`);
            return true;
        }
        catch (error) {
            console.error(`[PersistentStorage] Failed to save ${filename}:`, error);
            return false;
        }
    }
    /**
     * JSON 파일에서 데이터 로드
     * @param filename 예: 'wallets.json'
     */
    static loadFromFile(filename) {
        try {
            const filePath = path_1.default.join(DB_PATH, filename);
            if (!fs_1.default.existsSync(filePath)) {
                return null;
            }
            const fileContent = fs_1.default.readFileSync(filePath, 'utf-8');
            return JSON.parse(fileContent);
        }
        catch (error) {
            console.error(`[PersistentStorage] Failed to load ${filename}:`, error);
            return null;
        }
    }
    /**
     * (특수 기능) 백업본 생성
     * 데이터를 수정하기 전 안전하게 _backup 파일을 만듦
     */
    static createBackup(filename) {
        try {
            const filePath = path_1.default.join(DB_PATH, filename);
            if (fs_1.default.existsSync(filePath)) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const backupPath = path_1.default.join(DB_PATH, `${filename}.${timestamp}.bak`);
                fs_1.default.copyFileSync(filePath, backupPath);
                console.log(`[PersistentStorage] Backup created: ${backupPath}`);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error(`[PersistentStorage] Backup failed for ${filename}:`, error);
            return false;
        }
    }
}
exports.PersistentStorage = PersistentStorage;
//# sourceMappingURL=storage.js.map