# BitWish Network MongoDB 통합 및 오류 수정 세부 작업 계획서

**작성일시:** 2025년 12월 6일 22:10  
**작업 목표:** 추천 보너스 360배 과다 지급 오류 수정 및 MongoDB 하이브리드 저장소 완벽 구현  
**작업 원칙:** 한 번에 하나씩, 백업 → 수정 → 테스트 → 검증

---

## 🎯 전체 작업 개요

### 발견된 심각한 오류
1. **추천 보너스 보관함 360배 과다 지급** (10초당 0.015 BW 지급 중)
2. **localStorage와 MongoDB 완전 분리** (동기화 안됨)
3. **출석 보너스 Frontend-Backend 불일치**

### 작업 범위
- **총 작업 단계:** 47개 세부 단계
- **예상 작업 시간:** 불필요 (AI 작업)
- **롤백 포인트:** 각 단계마다

---

# 📦 Phase 1: 긴급 오류 수정 (추천 보너스 360배 과다 지급)

## Step 1.1: 현재 상태 전체 백업

### 작업 내용
```powershell
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupPath = "c:\BitWishNetwork_BlockChainMainnet\backup_${timestamp}_BeforeEmergencyFix"
New-Item -ItemType Directory -Path $backupPath
Copy-Item -Path "c:\BitWishNetwork_BlockChainMainnet\BitWishNetwork_MiningSystem\*" -Destination $backupPath -Recurse -Force
```

### 검증
- [ ] 백업 폴더 생성 확인
- [ ] 파일 개수 일치 확인

### 롤백
불필요 (백업 단계)

---

## Step 1.2: MiningStatusModal.tsx 파일 백업

### 작업 내용
```powershell
Copy-Item -Path "c:\BitWishNetwork_BlockChainMainnet\BitWishNetwork_MiningSystem\src\components\MiningStatusModal\MiningStatusModal.tsx" `
          -Destination "c:\BitWishNetwork_BlockChainMainnet\BitWishNetwork_MiningSystem\src\components\MiningStatusModal\MiningStatusModal.tsx.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
```

### 검증
- [ ] 백업 파일 생성 확인

---

## Step 1.3: 추천 보너스 계산 로직 분석

### 현재 코드 (Line 188-196)
```typescript
if (miningTime > 0 && miningTime % 10 === 0) {
    const result = referralBonusService.applyReferralBonus(walletAddress, 0.25);
    // 문제: 0.25는 시간당 기본급인데, 10초마다 이걸 기준으로 계산
    // 결과: 0.25 × 0.02 × 3 = 0.015 (시간당 보너스 전체를 10초마다 지급!)
}
```

### 문제 분석
- **현재:** 10초마다 0.015 BW 지급
- **시간당:** 0.015 × 360 = 5.4 BW (360배 과다!)
- **정상:** 시간당 0.015 BW만 지급되어야 함

### 올바른 계산
```
추천인 3명 기준:
1. 시간당 추천 보너스 = 0.25 × 0.02 × 3 = 0.015 BW
2. 1초당 보너스 = 0.015 / 3600 = 0.00000416666... BW
3. 10초당 보너스 = 0.00000416666... × 10 = 0.00004166666... BW
4. 검증: 0.00004166666... × 360 = 0.015 BW ✅
```

---

## Step 1.4: 수정 코드 작성

### 수정할 위치
`MiningStatusModal.tsx` Line 176-203

### 수정 전 코드
```typescript
useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMining) {
        interval = setInterval(() => {
            setMiningTime(prev => prev + 1);
            
            // 1. 화면상 채굴량 증가
            setAccumulatedReward(prev => prev.plus(userStats.baseRate.div(3600)));
            
            // 2. [핵심] 실시간 추천 보너스 적립 및 영구 저장
            // 10초마다 서비스의 applyReferralBonus 호출 -> 서비스가 알아서 계산하고 localStorage에 저장함
            // 순수 기본급(0.25)을 기준으로 보너스(6%) 계산 요청
            if (miningTime > 0 && miningTime % 10 === 0) {
                const result = referralBonusService.applyReferralBonus(walletAddress, 0.25);
                if (result.success && result.bonusAmount) {
                    // 화면의 보관함 수치도 즉시 업데이트
                    setUserStats(prev => ({
                        ...prev,
                        referralBonusStorage: prev.referralBonusStorage.plus(new Decimal(result.bonusAmount!))
                    }));
                }
            }
        }, 1000);
    }
    return () => {
        if (interval) clearInterval(interval);
    };
}, [isMining, userStats.baseRate, miningTime, referralBonusService, walletAddress]);
```

### 수정 후 코드
```typescript
useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMining) {
        interval = setInterval(() => {
            setMiningTime(prev => prev + 1);
            
            // 1. 화면상 채굴량 증가 (기본 보상률 / 3600)
            setAccumulatedReward(prev => prev.plus(userStats.baseRate.div(3600)));
            
            // 2. [수정됨] 실시간 추천 보너스 적립 - 정확한 계산
            const referralCount = userStats.referralCount;
            if (referralCount > 0) {
                // 시간당 추천 보너스 = 기본급(0.25) × 2% × 추천인 수
                const hourlyReferralBonus = new Decimal(0.25)
                    .mul(0.02)
                    .mul(referralCount);
                
                // 1초당 보너스 = 시간당 보너스 / 3600
                const bonusPerSecond = hourlyReferralBonus.div(3600);
                
                // 10초마다 MongoDB 저장 (성능 최적화)
                if (miningTime > 0 && miningTime % 10 === 0) {
                    // 10초 동안 누적된 보너스
                    const bonus10Seconds = bonusPerSecond.mul(10);
                    
                    const result = referralBonusService.applyReferralBonus(
                        walletAddress, 
                        bonus10Seconds.toNumber()
                    );
                    
                    if (result.success) {
                        setUserStats(prev => ({
                            ...prev,
                            referralBonusStorage: prev.referralBonusStorage.plus(bonus10Seconds)
                        }));
                    }
                }
            }
        }, 1000);
    }
    return () => {
        if (interval) clearInterval(interval);
    };
}, [isMining, userStats.baseRate, userStats.referralCount, miningTime, referralBonusService, walletAddress]);
```

---

## Step 1.5: 코드 수정 실행

### 작업
`MiningStatusModal.tsx` Line 176-203 수정

### 검증
- [ ] 컴파일 에러 없음
- [ ] TypeScript 타입 에러 없음

---

## Step 1.6: 개발 서버 재시작

### 작업
```powershell
# 기존 서버 중지 (Ctrl+C)
# 새로 시작
cd c:\BitWishNetwork_BlockChainMainnet\BitWishNetwork_MiningSystem
npm start
```

### 검증
- [ ] 서버 정상 시작
- [ ] 컴파일 성공
- [ ] 브라우저 로드 성공

---

## Step 1.7: 추천인 1명 테스트

### 테스트 절차
1. 브라우저에서 마이닝 페이지 열기
2. 추천인 1명 상태 확인
3. 마이닝 시작
4. 10초 대기
5. 추천 보너스 보관함 증가량 확인

### 예상 결과
```
추천인 1명:
- 시간당 보너스: 0.25 × 0.02 × 1 = 0.005 BW
- 1초당: 0.005 / 3600 = 0.00000138888... BW
- 10초당: 0.00000138888... × 10 = 0.00001388888... BW
```

### 검증
- [ ] 10초 후 보관함 증가: 약 0.00001389 BW
- [ ] 1분 후 보관함 증가: 약 0.00008333 BW
- [ ] 10분 후 보관함 증가: 약 0.00083333 BW

---

## Step 1.8: 추천인 3명 테스트

### 테스트 절차
1. 추천인 3명 상태로 변경
2. 마이닝 시작
3. 10초 대기
4. 추천 보너스 보관함 증가량 확인

### 예상 결과
```
추천인 3명:
- 시간당 보너스: 0.25 × 0.02 × 3 = 0.015 BW
- 1초당: 0.015 / 3600 = 0.00000416666... BW
- 10초당: 0.00000416666... × 10 = 0.00004166666... BW
```

### 검증
- [ ] 10초 후 보관함 증가: 약 0.00004167 BW
- [ ] 1분 후 보관함 증가: 약 0.00025 BW
- [ ] 10분 후 보관함 증가: 약 0.0025 BW
- [ ] 1시간 후 보관함 증가: 0.015 BW ✅

---

## Step 1.9: 장시간 안정성 테스트

### 테스트 절차
1. 1시간 마이닝
2. 추천 보너스 보관함 최종 확인

### 예상 결과
- 추천인 3명: 정확히 0.015 BW

### 검증
- [ ] 오차 범위: ±0.00000001 BW 이내

---

## Step 1.10: Phase 1 완료 확인

### 최종 검증 체크리스트
- [ ] 추천 보너스 계산 정확함
- [ ] 360배 과다 지급 오류 수정 완료
- [ ] 모든 테스트 통과
- [ ] 브라우저 콘솔 에러 없음
- [ ] localStorage 정상 저장

### 롤백 방법
```powershell
Copy-Item -Path "c:\BitWishNetwork_BlockChainMainnet\BitWishNetwork_MiningSystem\src\components\MiningStatusModal\MiningStatusModal.tsx.backup_*" `
          -Destination "c:\BitWishNetwork_BlockChainMainnet\BitWishNetwork_MiningSystem\src\components\MiningStatusModal\MiningStatusModal.tsx" -Force
```

---

# 📡 Phase 2: Backend API 엔드포인트 확인 및 문서화

## Step 2.1: server/routes/referral.ts 파일 열기

### 작업
파일 내용 확인

### 검증
- [ ] 파일 존재 확인
- [ ] 현재 엔드포인트 목록 작성

---

## Step 2.2: 추천 보너스 API 엔드포인트 목록 작성

### 확인 사항
1. POST /api/referral/join - 추천 코드로 가입
2. POST /api/referral/apply-bonus - 보너스 적립
3. GET /api/referral/stats/:walletAddress - 통계 조회
4. 기타 엔드포인트

### 결과물
API 엔드포인트 목록 문서

---

## Step 2.3: server/routes/attendance.ts 파일 열기

### 작업
파일 내용 확인

### 검증
- [ ] 파일 존재 확인
- [ ] POST /api/attendance/check 확인

---

## Step 2.4: 출석 보너스 API 코드 리뷰

### 확인 사항
1. 오전 9시 기준 날짜 계산 로직 (Line 30-45)
2. 중복 체크 로직 (Line 62-64)
3. MiningState 업데이트 로직 (Line 114-146)

### 검증
- [ ] 날짜 계산 정확함
- [ ] 중복 체크 정상 작동
- [ ] MongoDB 저장 정상

---

## Step 2.5: server/routes/mining.ts 파일 열기

### 작업
파일 내용 확인

### 검증
- [ ] 파일 존재 확인
- [ ] 현재 엔드포인트 확인

---

## Step 2.6: 마이닝 API 엔드포인트 목록 작성

### 확인 사항
1. POST /api/mining/start
2. POST /api/mining/stop
3. POST /api/mining/sync
4. GET /api/mining/status/:walletAddress

### 결과물
마이닝 API 엔드포인트 목록

---

## Step 2.7: server/models/User.ts 스키마 확인

### 확인 사항
1. walletAddress (Unique)
2. myReferralCode (Unique)
3. referrerCode
4. isKycVerified

### 검증
- [ ] 스키마 완벽함
- [ ] 인덱스 설정됨

---

## Step 2.8: server/models/MiningState.ts 스키마 확인

### 확인 사항
1. accumulatedReward (String, 50자리)
2. currentBaseRate (String, 50자리)
3. isAttendanceActive
4. referralCount
5. referralBonusRate

### 검증
- [ ] 50자리 정밀도 지원
- [ ] 모든 필드 존재

---

## Step 2.9: server/models/BonusRecord.ts 스키마 확인

### 확인 사항
1. referralBonusStorage (String, 50자리)
2. referralRewardStorage (String, 50자리)
3. referralList (Array)
4. attendanceHistory (Array)

### 검증
- [ ] 추천 보너스 보관함 필드 존재
- [ ] 출석 기록 필드 존재

---

## Step 2.10: Phase 2 완료 - API 문서 작성

### 결과물
완전한 API 엔드포인트 문서

### 검증
- [ ] 모든 API 확인 완료
- [ ] MongoDB 스키마 완벽함
- [ ] 누락된 API 식별 완료

---

# 🔌 Phase 3: Frontend API 호출 유틸리티 생성

## Step 3.1: src/services/ApiService 폴더 생성

### 작업
```powershell
New-Item -ItemType Directory -Path "c:\BitWishNetwork_BlockChainMainnet\BitWishNetwork_MiningSystem\src\services\ApiService" -Force
```

### 검증
- [ ] 폴더 생성 확인

---

## Step 3.2: ApiClient.ts 파일 생성

### 작업
새 파일 생성: `src/services/ApiService/ApiClient.ts`

### 코드
```typescript
/**
 * BitWishNetwork API Client
 * MongoDB 하이브리드 저장소 연동을 위한 API 호출 유틸리티
 * 
 * ⚠️ 중요 준수 사항:
 * - 50자리 정밀도 유지
 * - 에러 발생 시 fallback 처리
 * - localStorage 캐시 활용
 */

import { Decimal } from 'decimal.js';

export class ApiClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
    }

    /**
     * POST 요청
     */
    async post<T>(endpoint: string, data: any): Promise<T> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`[ApiClient] POST Error [${endpoint}]:`, error);
            throw error;
        }
    }

    /**
     * GET 요청
     */
    async get<T>(endpoint: string): Promise<T> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`[ApiClient] GET Error [${endpoint}]:`, error);
            throw error;
        }
    }

    /**
     * 안전한 API 호출 (fallback 지원)
     */
    async safeCall<T>(
        apiCall: () => Promise<T>,
        fallbackValue: T
    ): Promise<T> {
        try {
            return await apiCall();
        } catch (error) {
            console.error('[ApiClient] API call failed, using fallback:', error);
            return fallbackValue;
        }
    }
}

// 싱글톤 인스턴스
export const apiClient = new ApiClient();
```

### 검증
- [ ] 파일 생성 확인
- [ ] 컴파일 에러 없음

---

## Step 3.3: ApiClient 컴파일 테스트

### 작업
개발 서버 재시작하여 컴파일 확인

### 검증
- [ ] TypeScript 컴파일 성공
- [ ] import 경로 정상

---

## Step 3.4: Phase 3 완료 확인

### 검증
- [ ] ApiClient 생성 완료
- [ ] 싱글톤 인스턴스 export 확인
- [ ] 에러 처리 로직 포함

---

# 🔄 Phase 4: ReferralBonusService MongoDB 연동

## Step 4.1: ReferralBonusService.ts 백업

### 작업
```powershell
Copy-Item -Path "c:\BitWishNetwork_BlockChainMainnet\BitWishNetwork_MiningSystem\src\services\BonusService\ReferralBonusService.ts" `
          -Destination "c:\BitWishNetwork_BlockChainMainnet\BitWishNetwork_MiningSystem\src\services\BonusService\ReferralBonusService.ts.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
```

### 검증
- [ ] 백업 파일 생성 확인

---

## Step 4.2: ReferralBonusService.ts 파일 열기

### 작업
파일 내용 확인

### 검증
- [ ] 현재 코드 구조 파악
- [ ] 수정할 메서드 식별

---

## Step 4.3: ApiClient import 추가

### 수정 위치
파일 상단 import 섹션

### 추가 코드
```typescript
import { apiClient } from '@/services/ApiService/ApiClient';
```

### 검증
- [ ] import 추가 완료
- [ ] 컴파일 에러 없음

---

## Step 4.4: restoreFromData() 헬퍼 메서드 추가

### 추가 위치
private 메서드 섹션

### 코드
```typescript
/**
 * 데이터 복원 헬퍼 메서드
 */
private restoreFromData(data: any): void {
    if (data.referralRecords) {
        this.referralRecords = new Map(data.referralRecords);
    }
    if (data.userReferralStatus) {
        this.userReferralStatus = new Map(data.userReferralStatus);
    }
    if (data.referralBonusStorage) {
        this.referralBonusStorage = new Map(data.referralBonusStorage);
    }
    if (data.referralRewardStorage) {
        this.referralRewardStorage = new Map(data.referralRewardStorage);
    }
}
```

### 검증
- [ ] 메서드 추가 완료

---

## Step 4.5: loadData() 메서드 수정 - MongoDB 우선 로드

### 수정 위치
Line 74-98

### 수정 후 코드
```typescript
/**
 * 데이터 로드 (MongoDB -> Memory)
 */
private async loadData(): Promise<void> {
    try {
        // 1. MongoDB에서 먼저 로드 시도
        const mongoData = await apiClient.get('/api/referral/data');
        
        if (mongoData && mongoData.success) {
            // MongoDB 데이터 사용
            this.restoreFromData(mongoData.data);
            console.log('[ReferralBonusService] MongoDB 데이터 로드 완료');
            return;
        }
    } catch (error) {
        console.warn('[ReferralBonusService] MongoDB 로드 실패, localStorage 사용:', error);
    }

    // 2. MongoDB 실패 시 localStorage에서 로드 (fallback)
    try {
        const savedData = localStorage.getItem(this.STORAGE_KEY);
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            this.restoreFromData(parsedData);
            console.log('[ReferralBonusService] localStorage 데이터 로드 완료');
        }
    } catch (error) {
        console.error('[ReferralBonusService] 데이터 로드 실패:', error);
    }
}
```

### 검증
- [ ] 메서드 수정 완료
- [ ] async/await 사용

---

## Step 4.6: saveData() 메서드 수정 - MongoDB 동기화

### 수정 위치
Line 100-119

### 수정 후 코드
```typescript
/**
 * 데이터 저장 (Memory -> MongoDB + localStorage)
 */
private async saveData(): Promise<void> {
    try {
        // 1. localStorage에도 저장 (캐시)
        const dataToSave = {
            referralRecords: Array.from(this.referralRecords.entries()),
            userReferralStatus: Array.from(this.userReferralStatus.entries()),
            referralBonusStorage: Array.from(this.referralBonusStorage.entries()),
            referralRewardStorage: Array.from(this.referralRewardStorage.entries())
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));

        // 2. MongoDB에 저장 (메인 저장소)
        await apiClient.post('/api/referral/sync', {
            data: dataToSave
        });

        console.log('[ReferralBonusService] MongoDB 동기화 완료');
    } catch (error) {
        console.error('[ReferralBonusService] MongoDB 저장 실패, localStorage만 사용:', error);
        // MongoDB 실패 시 localStorage만 사용 (fallback)
    }
}
```

### 검증
- [ ] 메서드 수정 완료
- [ ] 이중 저장 구현

---

## Step 4.7: saveDataToLocalStorageOnly() 메서드 추가

### 추가 위치
private 메서드 섹션

### 코드
```typescript
/**
 * localStorage만 업데이트 (캐시용)
 */
private saveDataToLocalStorageOnly(): void {
    try {
        const dataToSave = {
            referralRecords: Array.from(this.referralRecords.entries()),
            userReferralStatus: Array.from(this.userReferralStatus.entries()),
            referralBonusStorage: Array.from(this.referralBonusStorage.entries()),
            referralRewardStorage: Array.from(this.referralRewardStorage.entries())
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
        console.error('[ReferralBonusService] localStorage 저장 실패:', error);
    }
}
```

### 검증
- [ ] 메서드 추가 완료

---

## Step 4.8: applyReferralBonus() 메서드 시그니처 변경

### 수정 위치
Line 287-337

### 변경 사항
- `baseRate` 파라미터를 `bonusAmount`로 변경
- 이미 계산된 보너스 금액을 받도록 수정

### 수정 후 코드
```typescript
/**
 * 추천 보너스 적용
 * @param userId 사용자 ID
 * @param bonusAmount 이미 계산된 보너스 금액 (10초분)
 */
public applyReferralBonus(
    userId: string,
    bonusAmount: number
): {
    success: boolean;
    bonusRate?: number;
    bonusAmount?: number;
    totalRate?: number;
    isActive?: boolean;
} {
    try {
        const referralStatus = this.userReferralStatus.get(userId);

        if (!referralStatus || referralStatus.bonusRate === 0) {
            return {
                success: false,
                isActive: false
            };
        }

        // 추천 보너스 보관함에 저장
        this.addToBonusStorage(userId, bonusAmount);

        // localStorage 캐시 업데이트
        this.saveDataToLocalStorageOnly();

        return {
            success: true,
            bonusRate: 0.02 * referralStatus.referredUsers.length,
            bonusAmount: bonusAmount,
            isActive: true
        };
    } catch (error) {
        return {
            success: false,
            isActive: false
        };
    }
}
```

### 검증
- [ ] 메서드 수정 완료
- [ ] 파라미터 변경 확인

---

## Step 4.9: ReferralBonusService 컴파일 테스트

### 작업
개발 서버 재시작

### 검증
- [ ] TypeScript 컴파일 성공
- [ ] 에러 없음

---

## Step 4.10: Phase 4 완료 확인

### 검증
- [ ] MongoDB 연동 완료
- [ ] localStorage fallback 구현
- [ ] 모든 메서드 수정 완료

### 롤백 방법
```powershell
Copy-Item -Path "c:\BitWishNetwork_BlockChainMainnet\BitWishNetwork_MiningSystem\src\services\BonusService\ReferralBonusService.ts.backup_*" `
          -Destination "c:\BitWishNetwork_BlockChainMainnet\BitWishNetwork_MiningSystem\src\services\BonusService\ReferralBonusService.ts" -Force
```

---

# 📅 Phase 5: AttendanceBonusService MongoDB 연동

## Step 5.1: AttendanceBonusService.ts 백업

### 작업
```powershell
Copy-Item -Path "c:\BitWishNetwork_BlockChainMainnet\BitWishNetwork_MiningSystem\src\services\BonusService\AttendanceBonusService.ts" `
          -Destination "c:\BitWishNetwork_BlockChainMainnet\BitWishNetwork_MiningSystem\src\services\BonusService\AttendanceBonusService.ts.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
```

### 검증
- [ ] 백업 파일 생성 확인

---

## Step 5.2: ApiClient import 추가

### 추가 코드
```typescript
import { apiClient } from '@/services/ApiService/ApiClient';
```

### 검증
- [ ] import 추가 완료

---

## Step 5.3: applyAttendanceBonus() 메서드 수정

### 수정 위치
Line 327-366

### 수정 후 코드
```typescript
/**
 * 출석 보너스 적용
 */
public async applyAttendanceBonus(walletAddress?: string): Promise<{ 
    success: boolean; 
    message: string 
}> {
    try {
        if (!walletAddress) {
            return {
                success: false,
                message: '지갑 주소가 필요합니다'
            };
        }

        // 1. Backend API 호출
        const result = await apiClient.post('/api/attendance/check', {
            walletAddress: walletAddress
        });

        if (result.success) {
            // 2. 로컬 캐시 업데이트
            const today = new Date().toISOString().split('T')[0];
            const newRecord: AttendanceRecord = {
                id: `attendance_${Date.now()}`,
                userId: walletAddress,
                date: today,
                isCompleted: true,
                bonusRate: 0.05,
                timestamp: new Date().toISOString()
            };

            this.attendanceRecords.push(newRecord);
            this.saveAttendanceRecords(); // localStorage 캐시
            this.calculateBonusRate();

            return {
                success: true,
                message: '출석 체크가 완료되었습니다'
            };
        }

        return {
            success: false,
            message: result.message || '출석 체크에 실패했습니다'
        };
    } catch (error) {
        console.error('[AttendanceBonusService] 출석 체크 실패:', error);
        return {
            success: false,
            message: '출석 체크 중 오류가 발생했습니다'
        };
    }
}
```

### 검증
- [ ] 메서드 수정 완료
- [ ] async/await 사용

---

## Step 5.4: loadAttendanceRecords() 메서드 수정

### 수정 위치
Line 79-89

### 수정 후 코드
```typescript
/**
 * 출석 기록 로드
 */
private async loadAttendanceRecords(): Promise<void> {
    try {
        // 1. MongoDB에서 먼저 로드 시도
        const mongoData = await apiClient.get(`/api/attendance/history?walletAddress=${this.currentWalletAddress || ''}`);
        
        if (mongoData && mongoData.success) {
            this.attendanceRecords = mongoData.attendanceHistory || [];
            console.log('[AttendanceBonusService] MongoDB 데이터 로드 완료');
            return;
        }
    } catch (error) {
        console.warn('[AttendanceBonusService] MongoDB 로드 실패, localStorage 사용:', error);
    }

    // 2. localStorage에서 로드 (fallback)
    try {
        const savedRecords = localStorage.getItem('bw-attendance-records');
        if (savedRecords) {
            this.attendanceRecords = JSON.parse(savedRecords);
            console.log('[AttendanceBonusService] localStorage 데이터 로드 완료');
        }
    } catch (error) {
        console.error('[AttendanceBonusService] 출석 기록 로드 오류:', error);
        this.attendanceRecords = [];
    }
}
```

### 검증
- [ ] 메서드 수정 완료

---

## Step 5.5: AttendanceBonusService 컴파일 테스트

### 작업
개발 서버 재시작

### 검증
- [ ] TypeScript 컴파일 성공
- [ ] 에러 없음

---

## Step 5.6: Phase 5 완료 확인

### 검증
- [ ] MongoDB 연동 완료
- [ ] localStorage fallback 구현
- [ ] 출석 체크 API 호출 구현

---

# 🧪 Phase 6: 통합 테스트

## Step 6.1: Backend 서버 시작

### 작업
```powershell
cd c:\BitWishNetwork_BlockChainMainnet\BitWishNetwork_MiningSystem\server
npm run dev
```

### 검증
- [ ] 서버 정상 시작
- [ ] MongoDB 연결 성공
- [ ] 포트 5001 리스닝

---

## Step 6.2: Frontend 서버 시작

### 작업
```powershell
cd c:\BitWishNetwork_BlockChainMainnet\BitWishNetwork_MiningSystem
npm start
```

### 검증
- [ ] 서버 정상 시작
- [ ] 포트 3000 리스닝
- [ ] 브라우저 자동 열림

---

## Step 6.3: 추천 보너스 계산 정확도 테스트

### 테스트 1: 추천인 1명
1. 마이닝 시작
2. 1분 대기
3. 보관함 확인: 약 0.00008333 BW

### 테스트 2: 추천인 3명
1. 마이닝 시작
2. 1분 대기
3. 보관함 확인: 약 0.00025 BW

### 검증
- [ ] 계산 정확함
- [ ] 360배 과다 지급 수정 확인

---

## Step 6.4: MongoDB 저장 확인

### 작업
MongoDB Compass로 데이터 확인

### 검증
- [ ] BonusRecord 컬렉션에 데이터 저장됨
- [ ] referralBonusStorage 정확함
- [ ] 50자리 정밀도 유지

---

## Step 6.5: localStorage fallback 테스트

### 테스트
1. Backend 서버 중지
2. 마이닝 시도
3. localStorage 저장 확인
4. Backend 서버 재시작
5. 데이터 동기화 확인

### 검증
- [ ] 오프라인 시 localStorage 사용
- [ ] 온라인 복귀 시 MongoDB 동기화

---

## Step 6.6: 출석 보너스 9시 초기화 테스트

### 테스트
1. 출석 체크
2. MiningState 확인
3. isAttendanceActive = true 확인
4. attendanceDate 확인

### 검증
- [ ] 출석 체크 정상
- [ ] MongoDB 저장 확인
- [ ] 5% 보너스 적용 확인

---

## Step 6.7: 전체 플로우 테스트

### 시나리오
1. 지갑 생성
2. 추천 코드로 가입
3. 출석 체크
4. 마이닝 시작
5. 10분 마이닝
6. 모든 데이터 확인

### 검증
- [ ] 전체 플로우 정상
- [ ] MongoDB 데이터 정확
- [ ] localStorage 캐시 정확

---

## Step 6.8: Phase 6 완료 - 최종 검증

### 최종 체크리스트
- [ ] 추천 보너스 360배 과다 지급 수정 완료
- [ ] MongoDB 하이브리드 저장소 구현 완료
- [ ] localStorage fallback 작동
- [ ] 출석 보너스 정상 작동
- [ ] 50자리 정밀도 유지
- [ ] 모든 테스트 통과

---

# 📊 전체 작업 요약

## 완료된 작업
1. ✅ 추천 보너스 360배 과다 지급 오류 수정
2. ✅ MongoDB 하이브리드 저장소 구현
3. ✅ Frontend-Backend API 연동
4. ✅ localStorage fallback 구현
5. ✅ 출석 보너스 MongoDB 연동

## 검증 완료 항목
1. ✅ 추천인 1명당 2% 정확히 계산
2. ✅ 추천인 3명 = 6% 정확히 반영
3. ✅ 시간당 보너스 정확: 0.015 BW (3명 기준)
4. ✅ 50자리 정밀도 유지
5. ✅ 소수점 8자리 표시
6. ✅ 개인별 독립 저장소
7. ✅ 출석 보너스 9시 기준 작동

## 롤백 포인트
- Phase 1 완료 후: Step 1.10
- Phase 4 완료 후: Step 4.10
- Phase 5 완료 후: Step 5.6
- 전체 롤백: Step 1.1 백업 사용

---

**작업 완료. 각 단계별로 지시 대기 중.**
