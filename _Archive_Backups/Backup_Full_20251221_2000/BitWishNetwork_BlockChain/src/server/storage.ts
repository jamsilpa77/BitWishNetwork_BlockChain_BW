import fs from 'fs';
import path from 'path';

// [중요] 관리자 절대 준수 명령: 어떠한 경우에도 데이터 삭제(unlink, rm) 금지
// 오직 파일 생성(write)과 읽기(read)만 허용됨.

const DB_PATH = path.resolve(process.cwd(), '../database');

/**
 * 파일 기반 영구 저장소 모듈
 * 브라우저 캐시가 삭제되어도 이 파일들은 유지됨.
 */
export class PersistentStorage {
    private static ensureDirectory() {
        if (!fs.existsSync(DB_PATH)) {
            fs.mkdirSync(DB_PATH, { recursive: true });
        }
    }

    /**
     * 데이터를 JSON 파일로 안전하게 저장 (덮어쓰기 모드)
     * @param filename 예: 'wallets.json' or 'referrals.json'
     * @param data 저장할 객체
     */
    public static saveToFile(filename: string, data: any): boolean {
        try {
            this.ensureDirectory();
            const filePath = path.join(DB_PATH, filename);
            const jsonStr = JSON.stringify(data, null, 2); // 가독성을 위해 들여쓰기 적용
            fs.writeFileSync(filePath, jsonStr, 'utf-8');
            console.log(`[PersistentStorage] Saved to ${filename}`);
            return true;
        } catch (error) {
            console.error(`[PersistentStorage] Failed to save ${filename}:`, error);
            return false;
        }
    }

    /**
     * JSON 파일에서 데이터 로드
     * @param filename 예: 'wallets.json'
     */
    public static loadFromFile(filename: string): any | null {
        try {
            const filePath = path.join(DB_PATH, filename);
            if (!fs.existsSync(filePath)) {
                return null;
            }
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(fileContent);
        } catch (error) {
            console.error(`[PersistentStorage] Failed to load ${filename}:`, error);
            return null;
        }
    }

    /**
     * (특수 기능) 백업본 생성
     * 데이터를 수정하기 전 안전하게 _backup 파일을 만듦
     */
    public static createBackup(filename: string): boolean {
        try {
            const filePath = path.join(DB_PATH, filename);
            if (fs.existsSync(filePath)) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const backupPath = path.join(DB_PATH, `${filename}.${timestamp}.bak`);
                fs.copyFileSync(filePath, backupPath);
                console.log(`[PersistentStorage] Backup created: ${backupPath}`);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`[PersistentStorage] Backup failed for ${filename}:`, error);
            return false;
        }
    }
}
