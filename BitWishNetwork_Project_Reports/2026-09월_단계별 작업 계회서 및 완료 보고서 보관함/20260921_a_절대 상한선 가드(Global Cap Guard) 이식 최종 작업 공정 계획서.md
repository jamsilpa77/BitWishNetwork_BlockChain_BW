

# 📋 최종 작업 공정 계획서
## `onMiningBlock()` 절대 상한선 가드(Global Cap Guard) 이식

---

## 📌 작업 개요

| 항목 | 내용 |
|---|---|
| **수정 파일** | [`server/services/BlockMiningService.ts`](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/server/services/BlockMiningService.ts) |
| **수정 위치** | `onMiningBlock()` 함수 L23 진입부 최상단 |
| **수정 범위** | 기존 코드 삭제 없음 — 가드 코드 **삽입만** |
| **다른 파일 수정** | **없음 (0개)** |
| **터미널 사용** | **절대 없음** |

---

## 🔍 현재 코드 (수정 전 — L23~L31)

```typescript
public static async onMiningBlock(walletAddress: string, session?: any): Promise<BlockMiningResult> {
    try {
        // 1단계: 블록체인 메인넷 코어를 호출하여 새 PoW 블록을 bitwish_network.blocks 컬렉션에 생성 및 저장
        const bwChainCore = (global as any).bwChainCore || require('../index').bwChainCore;
        if (!bwChainCore) {
            throw new Error("BitWishBlockchain Core Engine is not initialized yet globally!");
        }
        const newBlock = await bwChainCore.createBlock(walletAddress);
        const currentHeight = newBlock.header.blockHeight || 1;
```

---

## ✅ 수정 후 코드 (완성본 — L23 이하 전체)

```typescript
public static async onMiningBlock(walletAddress: string, session?: any): Promise<BlockMiningResult> {
    try {
        // ══════════════════════════════════════════════════════════════════
        // [절대 상한선 가드 — Global Cap Guard]
        // 목적: 어떤 경로로 onMiningBlock()이 호출되든,
        //       현재 총 물리 블록 수 >= 실시간 참값 총 BW 발행량 정수이면
        //       블록 생성을 100% 원천 차단한다. (이중 안전장치)
        // 집계 공식: stats.ts / auditAndSyncGlobalBlocks()와 동일한 공식 적용
        // ══════════════════════════════════════════════════════════════════
        const _networkDb = mongoose.connection.useDb('bitwish_network');
        const _miningDb = mongoose.connection.useDb('bitwish_mining');

        // [가드 1] 현재 DB 물리 블록 수 조회
        const _currentBlockCount = await _networkDb.collection('blocks').countDocuments({});

        // [가드 2] 실시간 참값 총 발행량 산출
        // 2-1. MiningState 채굴 누적 합계
        const _msAgg = await _miningDb.collection('miningstates').aggregate([
            { $group: { _id: null, total: { $sum: { $toDouble: '$accumulatedReward' } } } }
        ]).toArray();
        let _totalMined = new Decimal(_msAgg[0]?.total || 0);

        // 2-2. 실시간 채굴 중인 유저 liveBoost 보정
        const _activeStates = await _miningDb.collection('miningstates').find({ isMining: true }).toArray();
        const _nowMs = Date.now();
        let _liveBoost = new Decimal(0);
        for (const _miner of _activeStates) {
            const _lastSync = _miner.lastSyncTime ? new Date(_miner.lastSyncTime).getTime() : _nowMs;
            const _elapsed = Math.max(0, (_nowMs - _lastSync) / 1000);
            if (_elapsed > 0) {
                _liveBoost = _liveBoost.plus(
                    new Decimal(_miner.currentTotalRate || '0.25').div(3600).mul(_elapsed)
                );
            }
        }
        _totalMined = _totalMined.plus(_liveBoost);

        // 2-3. 월간 정산 누적 합계
        const _settAgg = await _miningDb.collection('monthlysettlements').aggregate([
            { $group: { _id: null, total: { $sum: { $toDouble: '$totalAmount' } } } }
        ]).toArray();
        const _totalSettled = new Decimal(_settAgg[0]?.total || 0);

        // 2-4. 보너스 3대 보관함 합산
        const _bonusAgg = await _miningDb.collection('bonusrecords').aggregate([
            {
                $group: {
                    _id: null,
                    r: { $sum: { $toDouble: { $ifNull: ['$referralRewardStorage', '0'] } } },
                    b: { $sum: { $toDouble: { $ifNull: ['$referralBonusStorage', '0'] } } },
                    o: { $sum: { $toDouble: { $ifNull: ['$bonusStorage', '0'] } } }
                }
            }
        ]).toArray();
        const _totalBonus = new Decimal(_bonusAgg[0]?.r || 0)
            .plus(new Decimal(_bonusAgg[0]?.b || 0))
            .plus(new Decimal(_bonusAgg[0]?.o || 0));

        // 2-5. 최종 참값 발행량 정수 산출
        const _totalSupply = _totalMined.plus(_totalSettled).plus(_totalBonus);
        const _maxAllowedBlocks = _totalSupply.floor().toNumber();

        // [가드 판정] 현재 블록 수 >= 발행량 정수 → 차단
        if (_currentBlockCount >= _maxAllowedBlocks) {
            console.log(
                `🛡️ [Global Cap Guard] 차단 — ` +
                `현재 블록(${_currentBlockCount}개) >= 발행량 정수(${_maxAllowedBlocks}개). ` +
                `다음 1BW 돌파 때까지 블록 생성 대기.`
            );
            return {
                success: false,
                blockHeight: _currentBlockCount,
                totalBlockCount: _currentBlockCount,
                distributedFee: { ecosystemFund: '0', foundationFund: '0' }
            };
        }

        console.log(
            `✅ [Global Cap Guard] 통과 — ` +
            `블록(${_currentBlockCount}개) < 발행량 정수(${_maxAllowedBlocks}개). ` +
            `블록 생성 진행.`
        );
        // ══════════════════════════════════════════════════════════════════
        // [가드 종료 — 이하 기존 블록 생성 로직 100% 원형 유지]
        // ══════════════════════════════════════════════════════════════════

        // 1단계: 블록체인 메인넷 코어를 호출하여 새 PoW 블록을 bitwish_network.blocks 컬렉션에 생성 및 저장
        const bwChainCore = (global as any).bwChainCore || require('../index').bwChainCore;
        if (!bwChainCore) {
            throw new Error("BitWishBlockchain Core Engine is not initialized yet globally!");
        }
        const newBlock = await bwChainCore.createBlock(walletAddress);
        const currentHeight = newBlock.header.blockHeight || 1;
        
        // 이하 기존 코드 전체 그대로 유지 (L33~L113)
        ...
```

---

## 📊 작업 전/후 동작 비교

### 상황별 작동 방식

| 상황 | 수정 전 | 수정 후 |
|---|---|---|
| **정상 경로**: `syncGlobalBlocks()` 통해 호출 시 | 이미 외부에서 상한선 검사 후 호출 | ✅ 가드 통과 후 정상 생성 |
| **BW 7,483 돌파** 시 호출 | 블록 생성 | ✅ 가드 통과 → 블록 7,483 생성 |
| **블록이 BW보다 앞설 때** 호출 | 🚨 무조건 블록 생성 | ✅ 가드 차단 → 생성 안 됨 |
| **스크립트** 등에서 직접 호출 시 | 🚨 상한선 없이 무조건 생성 | ✅ 가드 차단 → 완전 안전 |
| **버그/실수**로 이중 호출 시 | 🚨 블록 2개 생성 | ✅ 가드 차단 → 1개만 생성 |

---

## 🛡️ 수술 원칙

1. **기존 코드 삭제 없음** — 가드 코드를 최상단에 삽입만 함
2. **기존 `auditAndSyncGlobalBlocks()` 로직 변경 없음** — 동일하게 유지
3. **집계 공식 100% 동일** — `stats.ts` 및 `auditAndSyncGlobalBlocks()`와 동일한 공식 사용
4. **수정 파일: 1개** — `BlockMiningService.ts` 단 하나
5. **터미널: 0회 사용**

---

## ✅ 기대 효과

이 작업이 완료되면:

- BW 7,444가 차츰 올라와 **7,483을 돌파하는 순간** → 가드 통과 → 즉시 블록 7,483 생성
- 그 이전까지 블록은 7,482에서 **완벽하게 고정** 유지
- 어떤 스크립트나 어떤 경로로 호출이 와도 **BW 정수를 절대 초과하지 못함**
- 베타테스트 중 어떤 예외 상황에서도 **블록 폭주 재발 불가능**


=================================================================================================





=================================================================================================