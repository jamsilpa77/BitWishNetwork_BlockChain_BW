# [최종확정] BitWish 시스템 정상화 및 기능 복구 통합 실행 지침서

**작성일:** 2026년 2월 7일 (최종 수정)
**작성자:** BitWish AI Assistant
**목표:** 지갑 연동, 실시간 현황판, 2차 비밀번호 설정 문제를 코드 수정(Replace, Update)을 통해 완벽하게 해결한다.

---

## 1. 실행 계획 개요 (Execution Plan)

### Step 1. [관리자] `server/routes/admin.ts` (완료됨)
*   **상태:** **성공(Success)**
*   **내용:** `dummyReferrals` 제거 및 MongoDB Aggregation 쿼리 적용 완료.

### Step 2. [지갑] `src/components/MyWalletModal/MyWalletModal.tsx`
*   **목표:** 로컬스토리지 `bw_wallet_data` 의존성 제거 및 서버 `apiService.getUserStatus` 연동.
*   **전략:** **3단계 분할 수정**으로 에러 방지.
    1.  **Step 2-1 (Import):** `apiService` 임포트 추가 및 로컬 읽기 코드 주석 처리.
    2.  **Step 2-2 (Logic):** `fetchWalletData`에서 비어있는 `TargetContent` 실수 없이 정확한 서버 호출 로직 주입.
    3.  **Step 2-3 (UI):** "추천 보너스 보관함(2%)", "추천 보상 보관함(1BW)" 등 UI 텍스트 표준화.

### Step 3. [현황판] `src/services/MiningService/RealTimeSyncService.ts`
*   **목표:** `Total Supply` (210억 BW) 기반 실시간 5대 지표 1초 갱신.
*   **전략:** `setInterval(..., 1000)`으로 변경하되, `isSyncing` 플래그로 중복 요청 방지.
*   **핵심 데이터:**
    1.  **Total Supply:** 210억 (고정)
    2.  **Current Issued:** 현재 발행량 (1초마다 상승 ▲)
    3.  **Remaining Supply:** 잔여 발행량 (1초마다 감소 ▼)
    4.  **Issuance Rate:** 발행률 (%)
    5.  **Generated Blocks:** 생성된 블록 수

### Step 4-1. [보안] `src/services/BlockchainService/WalletService.ts`
*   **목표:** **"비밀번호 설정 불가" 해결.** (`secondPassword.fail` 에러 해결)
*   **전략:** `setSecondPassword` 함수 내 **로컬 지갑 검증 로직(`if (!wallet ...)` )을 삭제**하고, 무조건 서버 API(`registerUser`)로 전송하여 저장한다.
*   **효과:** PC방, 모바일 등 로컬 정보가 없는 기기에서도 **지갑 주소만 입력하면 비밀번호 설정 및 접속 가능.** (Anywhere Access)

### Step 4-2. [데이터] `src/services/BonusService/ReferralBonusService.ts`
*   **목표:** **"추천인 데이터 휘발 방지"** (서버 저장 실패 시 재시도)
*   **전략:** `saveData` 함수 내에서 서버 통신 실패 시 **최대 3회 재시도(Retry)** 로직을 추가하여 데이터 유실 가능성을 최소화한다.

---

## 2. 파일별 수정 코드 (Confirmed Code)

### Step 2-1. 지갑 임포트 추가 (MyWalletModal.tsx)
```typescript
import { apiService } from '../../services/ApiService'; // 추가
```

### Step 2-2. 지갑 데이터 로직 교체 (MyWalletModal.tsx)
```typescript
const fetchWalletData = async () => {
    // ... 주소 확보 ...
    try {
        const response = await apiService.getUserStatus(currentAddress);
        if (response?.success) {
            setWalletData(response.data); // 실제 데이터 반영
        }
    } catch (e) { console.error(e); }
};
```

### Step 3. 1초 갱신 로직 (RealTimeSyncService.ts)
```typescript
private readonly SYNC_INTERVAL = 1000;
private isSyncing = false;

public startSync() {
    setInterval(async () => {
        if (this.isSyncing) return;
        this.isSyncing = true;
        try { await performedDataSync(); }
        finally { this.isSyncing = false; }
    }, 1000);
}
```

### Step 4-1. 비밀번호 설정 로직 수정 (WalletService.ts)
```typescript
public async setSecondPassword(address: string, password: string): Promise<boolean> {
    // [삭제] if (!wallet || wallet.address !== address) return false; <-- 원흉 제거

    // [수정] 바로 서버로 쏜다
    try {
        await apiService.registerUser({ 
            walletAddress: address, 
            secondPasswordHash: generateHash(password) 
        });
        return true;
    } catch (e) {
        return false;
    }
}
```

### Step 4-2. 추천인 데이터 재시도 로직 (ReferralBonusService.ts)
```typescript
private async saveData(): Promise<void> {
    // ... 로컬 저장 완료 후 ...
    let retries = 3;
    while (retries > 0) {
        try {
            const response = await fetch('/api/storage/save', ...);
            if (response.ok) break; // 성공 시 탈출
            throw new Error('Save failed');
        } catch (e) {
            retries--;
            if (retries === 0) console.error('최종 저장 실패');
            else await new Promise(r => setTimeout(r, 1000)); // 1초 대기
        }
    }
}
```

---

## 3. 작업 승인 요청
위 분석 결과와 해결 코드를 바탕으로 **Step 2-1 (지갑 작업 시작)**부터 하나씩 안전하게 수정하겠습니다.
승인해 주시면 즉시 시작합니다.
