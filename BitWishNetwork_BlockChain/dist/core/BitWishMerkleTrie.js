"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BitWishMerkleTrie = void 0;
const crypto_1 = require("crypto");
const level_1 = require("level"); // NodeJS 초고속 Key-Value DB
class BitWishMerkleTrie {
    constructor(dbPath = './chaindata/state') {
        this.currentStateRoot = '0'.repeat(64); // 초기 빈 트리 해시
        // 이더리움과 동일한 chaindata 물리적 폴더 격리 구축
        this.db = new level_1.Level(dbPath, { valueEncoding: 'json' });
    }
    /**
     * RAM 상의 계정(Account) 상태를 직렬화하여 LevelDB 트리에 꽂아 넣습니다.
     * 이더리움 방식: RLP 인코딩 후 SHA3. (우리 엔진은 BitWish-256 사용)
     */
    async updateAccountState(address, account) {
        // 1. 상태 결합 (Serialization)
        const serializedState = JSON.stringify({
            balance: account.balance.toString(),
            nonce: account.nonce,
            codeHash: account.codeHash || '',
            storageRoot: account.storageRoot || '',
            isContract: account.isContract
        });
        // 2. 머클 리프(Leaf) 노드 생성
        const leafHash = (0, crypto_1.createHash)('sha256').update(serializedState).digest('hex');
        // 3. LevelDB에 State 영구 저장 (Key = Hash, Value = Data)
        await this.db.put(`account:${address}`, leafHash);
        await this.db.put(`node:${leafHash}`, serializedState);
        // 4. 새로운 State Root 재계산 (과거 상태 해시에 현재 해시를 덧붙임)
        this.currentStateRoot = (0, crypto_1.createHash)('sha256')
            .update(this.currentStateRoot + leafHash)
            .digest('hex');
    }
    getRootHash() {
        return this.currentStateRoot;
    }
}
exports.BitWishMerkleTrie = BitWishMerkleTrie;
//# sourceMappingURL=BitWishMerkleTrie.js.map