# [최종확정] BitWish 시스템 정상화 및 기능 복구 통합 지침서

**작성일:** 2026년 2월 7일 (최종 수정)
**작성자:** BitWish AI Assistant
**목표:** 지갑 연동, 실시간 현황판, 2차 비밀번호 설정 문제를 코드 레벨에서 완벽하게 해결하는 **실행 지침서**.

---

## 1. [진단] 시스템 핵심 4대 결함과 원인 분석

### 1-1. 지갑 데이터 연동 실패 (MyWalletModal)
*   **현상:** 마이닝 페이지에는 BW가 있는데, '나의 지갑' 잔액은 0 BW입니다.
*   **원인:** `MyWalletModal.tsx`가 서버 API 대신 `localStorage`의 옛날 데이터를 읽고 있습니다.
*   **해결:** `apiService.getUserStatus`를 호출하여 **서버 DB의 실시간 잔액**을 가져오도록 코드를 전면 교체합니다.

### 1-2. 실시간 채굴 현황판 먹통 (RealTimeSyncService)
*   **현상:** 전체 채굴량이 30초마다 뚝뚝 끊기며 갱신되어 생동감이 없습니다.
*   **원인:** `RealTimeSyncService.ts`의 갱신 주기가 `30000ms`(30초)로 설정되어 있습니다.
*   **해결:** 주기를 `1000ms`(1초)로 단축하고, **5대 핵심 지표(총발행량, 잔여량, 발행률 등)**가 1초마다 계산되어 화면에 반영되도록 로직을 수정합니다.

### 1-3. 2차 비밀번호 설정 불가 및 접속 제한 (WalletService)
*   **현상:** 비밀번호 설정 시 규칙을 지켜도 계속 실패하며, PC방 등 다른 기기에서 접속이 불가능합니다.
*   **원인 (치명적):** `WalletService.ts`의 `setSecondPassword` 함수가 **"로컬 스토리지에 지갑 정보가 없으면 무조건 에러(`false`)를 반환"**하도록 잘못 짜여 있습니다.
*   **해결:** 로컬 스토리지 확인 로직을 **삭제**하고, 입력받은 지갑 주소와 비밀번호를 **즉시 서버 API(`apiService.registerUser`)로 전송하여 저장**하도록 수정합니다. (어디서든 접속 가능해짐)

### 1-4. 추천인 정보 휘발 (ReferralBonusService)
*   **현상:** 브라우저 청소 시 추천인 정보가 사라집니다.
*   **원인:** 서버 저장 실패 시 로컬에 저장하고 끝내는 임시방편 코드가 있습니다.
*   **해결:** 서버 저장을 **강제(Retry)**하여 DB에 영구 보존되도록 합니다.

---

## 2. [실행] 파일별 수정/추가할 확정 코드 (Copy & Paste Ready)

### Step 1. [관리자] `server/routes/admin.ts` (완료됨)
*   **상태:** 가짜 데이터 삭제 및 MongoDB Aggregation 쿼리 적용 완료.

---

### Step 2. [지갑] `src/components/MyWalletModal/MyWalletModal.tsx` (3단계 분할)

**안전을 위해 3단계로 나누어 수정합니다.**

#### 2-1 단계: 임포트 추가 및 로컬스토리지 제거
```typescript
import { apiService } from '../../services/ApiService'; // 추가

// fetchWalletData 내부
// const savedWallet = localStorage.getItem('bw_wallet_data'); // 삭제
```

#### 2-2 단계: 서버 API 연동 구현
```typescript
const fetchWalletData = async () => {
    // ... 지갑 주소 확보 로직 ...
    
    try {
        const response = await apiService.getUserStatus(currentAddress); // 서버 호출
        if (response?.success) {
            const data = response.data;
            setWalletData({
                balance: parseFloat(data.accumulatedReward || '0'),
                availableBalance: parseFloat(data.accumulatedReward || '0'),
                referralReward: parseFloat(data.referralRewardStorage || '0'),
                referralBonus: parseFloat(data.referralBonusStorage || '0'),
                myReferralCode: data.referralCode || ''
            });
        }
    } catch (e) {
        console.error(e);
    }
};
```

#### 2-3 단계: UI 텍스트 표준화
```tsx
<StorageItem>
    <StorageName>추천 보너스 보관함 (2%)</StorageName>
    <StorageValue>{walletData?.referralBonus.toFixed(8)} BW</StorageValue>
</StorageItem>
<StorageItem>
    <StorageName>추천 보상 보관함 (1BW)</StorageName>
    <StorageValue>{walletData?.referralReward.toFixed(8)} BW</StorageValue>
</StorageItem>
```

---

### Step 3. [현황판] `src/services/MiningService/RealTimeSyncService.ts`

**1초마다 5대 지표를 실시간 갱신합니다.** (`isSyncing` 플래그로 중복 요청 방지)

```typescript
private readonly SYNC_INTERVAL = 1000; // 1초
private isSyncing = false;

public startSync() {
    setInterval(async () => {
        if (this.isSyncing) return; // 이전 요청 처리 중이면 대기
        
        this.isSyncing = true;
        try {
            await this.performDataSync(); // 서버 동기화
        } finally {
            this.isSyncing = false;
        }
    }, this.SYNC_INTERVAL);
}

// [핵심] 5대 지표 업데이트 로직 (updateLocalStatusFromServer)
// 1. Current Issued (현재 발행량): 서버 값 적용
// 2. Remaining Supply (잔여량): 210억 - 현재 발행량
// 3. Issuance Rate (발행률): (현재 발행량 / 210억) * 100
// 4. Generated Blocks: 서버 값 적용
// 5. Wallet Count: 서버 값 적용
```

---

### Step 4. [비밀번호] `src/services/BlockchainService/WalletService.ts`

**"비밀번호 설정 불가" 문제를 해결하는 핵심 수정입니다.**

```typescript
public async setSecondPassword(address: string, password: string): Promise<boolean> {
    // [삭제] 로컬 지갑 검증 로직 (이것 때문에 설정 실패함)
    // const wallet = this.getWalletFromStorage();
    // if (!wallet || wallet.address !== address) return false; <--- 삭제!!

    // [수정] 지갑 주소 형식이 맞으면 무조건 서버로 전송
    if (!this.validateWalletAddress(address)) return false;

    // 비밀번호 해시 생성
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = this.generateHash(password, salt);
    const fullHash = `${salt}:${hash}`;

    try {
        // 서버 DB에 즉시 저장 (어디서든 접속 가능하게 됨)
        await apiService.registerUser({
            walletAddress: address,
            secondPasswordHash: fullHash,
            // ... 기타 필수 필드 ...
        });
        
        // 성공 시 로컬에도 백업 (선택사항)
        // this.saveWalletToStorage(...); 
        
        return true;
    } catch (e) {
        console.error('Server save failed:', e);
        return false;
    }
}
```

---

## 3. 결론
이 보고서는 사용자님의 지시사항을 반영하여 **기술적 원인을 정확히 규명하고 해결책을 제시**했습니다.
특히 **Step 4 (비밀번호 설정)** 문제는 `WalletService`의 잘못된 검증 로직을 제거함으로써 **"설정 불가"와 "접속 제한" 문제를 동시에 해결**합니다.

보고서 내용대로 진행을 승인해 주시면, **Step 2부터 순차적으로 작업을 시작**하겠습니다.
