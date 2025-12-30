/**
 * 파일 기반 영구 저장소 모듈
 * 브라우저 캐시가 삭제되어도 이 파일들은 유지됨.
 */
export declare class PersistentStorage {
    private static ensureDirectory;
    /**
     * 데이터를 JSON 파일로 안전하게 저장 (덮어쓰기 모드)
     * @param filename 예: 'wallets.json' or 'referrals.json'
     * @param data 저장할 객체
     */
    static saveToFile(filename: string, data: any): boolean;
    /**
     * JSON 파일에서 데이터 로드
     * @param filename 예: 'wallets.json'
     */
    static loadFromFile(filename: string): any | null;
    /**
     * (특수 기능) 백업본 생성
     * 데이터를 수정하기 전 안전하게 _backup 파일을 만듦
     */
    static createBackup(filename: string): boolean;
}
//# sourceMappingURL=storage.d.ts.map