## 📋 **BitWishNetwork 출석 보너스 정책 + 소스코드 로직**

### 🎯 **출석 보너스 정책 핵심 내용**

#### **1. 기본 정책 구조**
- **보너스율**: **5% (0.05)** 고정 (현재 구현 기준)
- **적용 조건**: 출석 체크 완료 시에만 적용
- **시간 제한**: 24시간 유예 기간 시스템
- **블록체인 연동**: 블록체인 참여 후에만 출석 체크 가능

#### **2. 상세 정책 내용**

##### **🎯 출석 보너스 체계 (현재 구현 기준 - 2025년 1월 업데이트)**
| 출석 상태 | 보너스율 | 설명 | 일일 보상 증가 | 블록체인 참여 요구사항 |
|-----------|----------|------|----------------|---------------------|
| **출석 체크 완료** | **5% (0.05)** | 🎯 **일일 출석 보너스** | **0.2625 BW/시간** | ✅ **블록체인 참여 필수** |
| **출석 체크 미완료** | **0% (0.00)** | ❌ **출석 보너스 없음** | **0.25 BW/시간** | ✅ **블록체인 참여 필수** |

##### **🧮 계산 공식**
```
출석_보너스율 = 출석_체크_완료시_5% (0.05)
최종_보상률 = 기본_보상률 × (1 + 출석_보너스율)
```

##### **📊 구체적 계산 예시**
- **기본 보상률**: 0.25 BW/시간
- **출석 보너스**: 5% (0.05) - 출석 체크 완료시
- **최종 채굴률**: 0.25 × (1 + 0.05) = **0.2625 BW/시간**
- **일일 추가 수익**: 0.0125 × 24 = **0.3 BW/일**
- **월간 추가 수익**: 0.3 × 30 = **9 BW/월**

#### **3. 시간 기반 출석 시스템**

##### **🎯 24시간 출석 사이클 시스템**

**1. 출석 가능 정책**
- **출석 활성화 시간**: 매일 오전 9시 이후부터 해당 날짜 출석 체크 활성화 (파란색)
- **출석 가능 기간**: 해당 날짜 오전 9시 ~ 다음 날 오전 8시 59분 59초까지
- **예시**: 1일 오전 9시 이후부터 2일 오전 8시 59분 59초까지 1일 날짜 출석 체크 가능

**2. 출석 완료 정책**
- **출석 완료 조건**: 출석 가능 기간 내에 출석 체크 완료
- **출석 완료 상태**: 출석 체크 완료 시 해당 날짜는 출석 완료 (빨간색) 비활성화
- **예시**: 1일 오전 9시 ~ 2일 오전 8시 59분 59초 전까지 출석 체크하면 1일 날짜는 출석 완료

**3. 미출석 정책**
- **미출석 조건**: 출석 가능 기간 내에 출석 체크를 하지 않은 경우
- **미출석 처리**: 다음 날 오전 9시 정각이 되면 해당 날짜는 클릭 불가능한 비활성화 상태로 변경
- **새로운 출석 활성화**: 동시에 새로운 날짜가 출석 체크 가능한 날짜로 활성화 (파란색)
- **예시**: 1일 출석 체크를 못하고 2일 오전 9시가 되면 1일은 비활성화, 2일이 출석 가능으로 활성화

**4. 출석 보너스 적용 정책**
- **보너스 적용 시점**: 출석 체크 완료 즉시 5% 보너스 적용
- **보너스 적용 기간**: 출석 완료 시점부터 다음 날 오전 8시 59분 59초까지
- **보너스 리셋**: 다음 날 오전 9시 정각에 출석 보너스 자동 리셋 (0%로 복원)
- **재적용 조건**: 새로운 날짜 출석 체크 완료 시 다시 5% 보너스 즉시 적용
- **예시**: 1일 오전 9시 이후 출석 체크 완료 → 즉시 5% 보너스 적용 → 2일 오전 8시 59분 59초까지 유지 → 2일 오전 9시 정각에 리셋 → 2일 출석 체크 완료 시 다시 5% 보너스 적용

#### **4. 마이닝 기반 보너스 시스템**

##### **🎯 핵심 개념: "블록체인 참여 후 보너스 활성화"**
- **출석 보너스**: 블록체인 참여 후에만 출석 체크 가능
- **마이닝 시작 전**: "마이닝을 먼저 시작해야 출석 체크를 할 수 있습니다" 메시지
- **마이닝 시작 후**: 언제든지 출석 체크 가능, 실시간 보너스 계산
- **동적 버튼**: 마이닝 상태에 따른 버튼 활성화/비활성화

##### **🔗 블록체인 연동 필요성**
- **실제 블록 생성**: 마이닝 시작 시 실제 BW 블록체인 블록이 생성되어야 함
- **네트워크 참여**: 출석 보너스는 블록체인 네트워크에 실제로 참여한 사용자에게만 제공
- **투명성 보장**: 실제 블록 생성 활동이 있는 사용자만 보너스 혜택을 받을 수 있도록 보장
- **시스템 무결성**: 가짜 출석 체크 방지 및 실제 네트워크 기여도 기반 보상 시스템

#### **5. IP 기반 접근 제어**

##### **🔐 IP 접근 제어 시스템**
- **지갑 생성 IP 또는 등록된 IP**: 시드문구 없이 즉시 출석 체크 가능
- **다른 IP**: 24단어 시드문구 입력창 생성 후 인증 필요
- **IP 변경 시 자동 인증**: 다른 IP에서 접근 시 시드문구 인증 창 자동 생성

##### **🔑 시드문구 인증 대체 방안**
- **"나의 지갑" 연동**: 다른 IP에서 접속 시 "나의 지갑"에서 시드문구로 지갑 인증 후 출석 체크 가능
- **지갑 소유권 확인**: 시드문구를 통한 지갑 소유권 확인으로 IP 제한 우회
- **보안 강화**: IP 기반 제한과 지갑 인증을 통한 이중 보안 시스템
- **사용자 편의성**: 등록된 IP가 아닌 경우에도 지갑 인증을 통해 출석 체크 가능

### 🎯 **핵심 이해 사항**

1. **시간 기반 출석 시스템**: 매일 오전 9시 기준으로 24시간 출석 사이클 운영
2. **즉시 보너스 적용**: 출석 체크 완료 시 즉시 5% 보너스 적용 및 실시간 총 채굴량 반영
3. **자동 보너스 리셋**: 다음 날 오전 9시 정각에 출석 보너스 자동 리셋 (0%로 복원)
4. **블록체인 연동 필수**: 마이닝 시작으로 실제 블록 생성이 이루어져야 출석 체크 가능
5. **IP 기반 보안 + 지갑 인증**: 등록된 IP 또는 "나의 지갑" 시드문구 인증으로 접근 가능

---

## 🔧 **최종 소스코드 로직**

### **1. 마이닝 시작 시 기본값 설정**

```typescript
// 마이닝 시작 버튼 클릭 시 실행되는 함수
const handleMiningStart = async () => {
  try {
    // Decimal.js 50단위 부동소수점 정밀도 설정
    const Decimal = require('decimal.js');
    Decimal.set({ precision: 50 });
    
    // 기본 고정값 설정
    const baseMiningRate = new Decimal('0.25'); // 기본 채굴률 0.25 BW/시간
    const dailyReward = new Decimal('6'); // 일일 보상 6 BW
    
    // 마이닝 데이터 초기화
    const miningData = {
      isActive: true,
      startTime: new Date().toISOString(),
      baseMiningRate: baseMiningRate.toString(),
      dailyReward: dailyReward.toString(),
      attendanceBonus: new Decimal('0').toString(), // 출석 보너스 초기값 0%
      totalMinedAmount: new Decimal('0').toString(), // 총 채굴량 초기값
      currentMiningRate: baseMiningRate.toString() // 현재 채굴률 (기본값)
    };
    
    // 백엔드에 마이닝 시작 요청
    const response = await fetch('http://localhost:4001/api/mining/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress,
        miningData
      })
    });
    
    if (response.ok) {
      console.log('✅ 마이닝 시작 완료 - 기본값 설정됨');
      console.log('📊 기본 채굴률:', baseMiningRate.toString(), 'BW/시간');
      console.log('📊 일일 보상:', dailyReward.toString(), 'BW');
    }
  } catch (error) {
    console.error('❌ 마이닝 시작 오류:', error);
  }
};
```

### **2. 출석 체크 완료 시 보너스 적용 로직**

```typescript
// 출석 체크 완료 시 실행되는 함수
const handleAttendanceCheck = async () => {
  try {
    const Decimal = require('decimal.js');
    Decimal.set({ precision: 50 });
    
    // 현재 마이닝 데이터 로드
    const currentMiningData = await loadMiningData();
    
    // 기본값들
    const baseMiningRate = new Decimal(currentMiningData.baseMiningRate || '0.25');
    const dailyReward = new Decimal(currentMiningData.dailyReward || '6');
    const attendanceBonusRate = new Decimal('0.05'); // 5% 출석 보너스
    
    // 출석 보너스 적용된 채굴률 계산
    const bonusMiningRate = baseMiningRate.mul(attendanceBonusRate);
    const finalMiningRate = baseMiningRate.add(bonusMiningRate);
    
    // 출석 보너스 적용된 일일 보상 계산
    const bonusDailyReward = dailyReward.mul(attendanceBonusRate);
    const finalDailyReward = dailyReward.add(bonusDailyReward);
    
    // 업데이트된 마이닝 데이터
    const updatedMiningData = {
      ...currentMiningData,
      attendanceBonus: attendanceBonusRate.toString(), // 5% 보너스 적용
      currentMiningRate: finalMiningRate.toString(), // 보너스 적용된 채굴률
      dailyReward: finalDailyReward.toString(), // 보너스 적용된 일일 보상
      attendanceCheckedAt: new Date().toISOString(),
      attendanceBonusExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24시간 후 만료
    };
    
    // 백엔드에 출석 보너스 적용 요청
    const response = await fetch('http://localhost:4001/api/mining/apply-attendance-bonus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress,
        updatedMiningData
      })
    });
    
    if (response.ok) {
      console.log('✅ 출석 보너스 적용 완료');
      console.log('📊 기본 채굴률:', baseMiningRate.toString(), 'BW/시간');
      console.log('📊 보너스 채굴률:', bonusMiningRate.toString(), 'BW/시간');
      console.log('📊 최종 채굴률:', finalMiningRate.toString(), 'BW/시간');
      console.log('📊 기본 일일 보상:', dailyReward.toString(), 'BW');
      console.log('📊 보너스 일일 보상:', bonusDailyReward.toString(), 'BW');
      console.log('📊 최종 일일 보상:', finalDailyReward.toString(), 'BW');
    }
  } catch (error) {
    console.error('❌ 출석 보너스 적용 오류:', error);
  }
};
```

### **3. 출석 보너스 리셋 로직 (매일 오전 9시)**

```typescript
// 출석 보너스 리셋 함수 (매일 오전 9시 실행)
const resetAttendanceBonus = async () => {
  try {
    const Decimal = require('decimal.js');
    Decimal.set({ precision: 50 });
    
    // 현재 마이닝 데이터 로드
    const currentMiningData = await loadMiningData();
    
    // 기본값으로 복원
    const baseMiningRate = new Decimal('0.25'); // 기본 채굴률
    const dailyReward = new Decimal('6'); // 기본 일일 보상
    
    // 보너스 리셋된 마이닝 데이터
    const resetMiningData = {
      ...currentMiningData,
      attendanceBonus: new Decimal('0').toString(), // 보너스 0%로 리셋
      currentMiningRate: baseMiningRate.toString(), // 기본 채굴률로 복원
      dailyReward: dailyReward.toString(), // 기본 일일 보상으로 복원
      attendanceBonusExpiresAt: null // 만료 시간 초기화
    };
    
    // 백엔드에 보너스 리셋 요청
    const response = await fetch('http://localhost:4001/api/mining/reset-attendance-bonus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress,
        resetMiningData
      })
    });
    
    if (response.ok) {
      console.log('✅ 출석 보너스 리셋 완료');
      console.log('📊 채굴률 복원:', baseMiningRate.toString(), 'BW/시간');
      console.log('📊 일일 보상 복원:', dailyReward.toString(), 'BW');
    }
  } catch (error) {
    console.error('❌ 출석 보너스 리셋 오류:', error);
  }
};
```

### **4. 실시간 총 채굴량 계산 로직**

```typescript
// 실시간 총 채굴량 계산 함수
const calculateTotalMinedAmount = async () => {
  try {
    const Decimal = require('decimal.js');
    Decimal.set({ precision: 50 });
    
    // 현재 마이닝 데이터 로드
    const currentMiningData = await loadMiningData();
    
    if (!currentMiningData.isActive) {
      return new Decimal('0').toString();
    }
    
    // 마이닝 시작 시간부터 현재까지의 경과 시간 계산
    const startTime = new Date(currentMiningData.startTime);
    const currentTime = new Date();
    const elapsedHours = new Decimal(currentTime.getTime() - startTime.getTime())
      .div(1000 * 60 * 60); // 밀리초를 시간으로 변환
    
    // 현재 채굴률 (출석 보너스 포함)
    const currentMiningRate = new Decimal(currentMiningData.currentMiningRate || '0.25');
    
    // 총 채굴량 계산
    const totalMinedAmount = currentMiningRate.mul(elapsedHours);
    
    // 업데이트된 마이닝 데이터
    const updatedMiningData = {
      ...currentMiningData,
      totalMinedAmount: totalMinedAmount.toString(),
      lastCalculatedAt: currentTime.toISOString()
    };
    
    // 백엔드에 총 채굴량 업데이트 요청
    await fetch('http://localhost:4001/api/mining/update-total-mined', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress,
        updatedMiningData
      })
    });
    
    return totalMinedAmount.toString();
  } catch (error) {
    console.error('❌ 총 채굴량 계산 오류:', error);
    return '0';
  }
};
```

### **5. 백엔드 API 엔드포인트 (simple-server.js)**

```javascript
// 출석 보너스 적용 API
app.post('/api/mining/apply-attendance-bonus', async (req, res) => {
  try {
    const { walletAddress, updatedMiningData } = req.body;
    
    // MongoDB에 업데이트된 마이닝 데이터 저장
    await saveMiningDataToMongoDB(walletAddress, updatedMiningData);
    
    // 파일 시스템에도 저장
    await saveMiningDataToFile(walletAddress, updatedMiningData);
    
    res.json({
      success: true,
      message: '출석 보너스가 성공적으로 적용되었습니다.',
      data: updatedMiningData
    });
  } catch (error) {
    console.error('출석 보너스 적용 오류:', error);
    res.status(500).json({
      success: false,
      error: '출석 보너스 적용 중 오류가 발생했습니다.'
    });
  }
});

// 출석 보너스 리셋 API
app.post('/api/mining/reset-attendance-bonus', async (req, res) => {
  try {
    const { walletAddress, resetMiningData } = req.body;
    
    // MongoDB에 리셋된 마이닝 데이터 저장
    await saveMiningDataToMongoDB(walletAddress, resetMiningData);
    
    // 파일 시스템에도 저장
    await saveMiningDataToFile(walletAddress, resetMiningData);
    
    res.json({
      success: true,
      message: '출석 보너스가 성공적으로 리셋되었습니다.',
      data: resetMiningData
    });
  } catch (error) {
    console.error('출석 보너스 리셋 오류:', error);
    res.status(500).json({
      success: false,
      error: '출석 보너스 리셋 중 오류가 발생했습니다.'
    });
  }
});
```

이 소스코드 로직은 50단위 부동소수점 계산을 기반으로 하여 정확한 마이닝 보상 계산과 출석 보너스 적용을 보장합니다.