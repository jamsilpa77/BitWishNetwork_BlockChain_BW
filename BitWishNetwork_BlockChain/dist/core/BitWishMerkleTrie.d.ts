import { BitWishAccount } from '../engine/BitWishBlockchain';
export declare class BitWishMerkleTrie {
    private db;
    private currentStateRoot;
    constructor(dbPath?: string);
    /**
     * RAM 상의 계정(Account) 상태를 직렬화하여 LevelDB 트리에 꽂아 넣습니다.
     * 이더리움 방식: RLP 인코딩 후 SHA3. (우리 엔진은 BitWish-256 사용)
     */
    updateAccountState(address: string, account: BitWishAccount): Promise<void>;
    getRootHash(): string;
}
//# sourceMappingURL=BitWishMerkleTrie.d.ts.map