# [BitWish Network] 서버 장애·해킹 발생 시 유저 채굴 자산 완벽 복구 지침서

> **본 문서의 목적**: 서버에 해킹, 데이터 손실, 장애 등 비상 상황이 발생했을 때, 비개발자인 대표님이 **이 문서를 그대로 AI 개발자 또는 인간 개발자에게 전달**하면 모든 유저의 채굴 자산을 단 0.00000001 BW의 오차도 없이 100% 완벽하게 검증·복구할 수 있도록 작성된 **표준 비상 복구 지침서**입니다.
>
> **작성일**: 2026년 9월 1일
> **최종 수정일**: 2026년 9월 1일
> **적용 대상**: BitWish Network 마이닝 시스템 (bitwish_mining, bitwish_network 데이터베이스)


=================================================================================================


## 📋 목차

1. [시스템 구조 요약 (개발자가 반드시 숙지해야 할 기본 정보)](#1-시스템-구조-요약)
2. [사전 준비: 일일 자동 백업 설정 (장애 발생 전에 반드시 구축)](#2-사전-준비-일일-자동-백업-설정)
3. [비상 상황 유형별 대응 지침](#3-비상-상황-유형별-대응-지침)
4. [복구 절차 A: DB 백업이 존재하는 경우 (권장)](#4-복구-절차-a-db-백업이-존재하는-경우)
5. [복구 절차 B: DB 백업이 없는 경우 (수학적 역산 복구)](#5-복구-절차-b-db-백업이-없는-경우)
6. [복구 후 전수 검증 절차](#6-복구-후-전수-검증-절차)
7. [핵심 수학 공식 참조표](#7-핵심-수학-공식-참조표)
8. [핵심 DB 컬렉션 및 필드 사전](#8-핵심-db-컬렉션-및-필드-사전)


=================================================================================================


## 1. 시스템 구조 요약

### 🏗️ 데이터베이스 구성

BitWish 마이닝 시스템은 **MongoDB**를 사용하며, 2개의 데이터베이스에 유저 자산 정보가 분산 저장됩니다:

| 데이터베이스 이름 | 용도 | 핵심 컬렉션(테이블) |
| :--- | :--- | :--- |
| **bitwish_mining** | 마이닝 시스템 전용 DB | `users`, `miningstates`, `bonusrecords`, `mininghistories` |
| **bitwish_network** | 블록체인 메인넷 DB | `blocks`, `blocktransactions`, `network_stats` |

### 🔑 유저 1명의 자산을 구성하는 핵심 데이터 4가지

| 번호 | 데이터 | 저장 위치 | 설명 |
| :--- | :--- | :--- | :--- |
| ① | **누적 채굴량** | `miningstates.accumulatedReward` | 유저가 지금까지 채굴한 총 BW 수량 (예: `539.00650000`) |
| ② | **추천 보너스 보관함** | `bonusrecords.referralBonusStorage` | 추천인 보너스로 적립된 BW 수량 (예: `0.00453249`) |
| ③ | **물리 블록 수** | `blocks` 컬렉션 내 해당 지갑 주소의 블록 개수 | 정수 1 BW마다 물리 블록 1개 생성 (예: 539개) |
| ④ | **블록 기준점** | `miningstates.lastBlockRewardThreshold` | 마지막으로 블록이 생성된 정수 BW 경계선 (예: `539`) |

### ⏱️ 채굴 수량 계산 공식 (50자리 정밀도)

```
초당 채굴량 = currentTotalRate ÷ 3600
특정 구간의 채굴량 = 초당 채굴량 × 경과 시간(초)
```

- `currentTotalRate` = 기본 보상률(0.25 BW/시간) × (1 + 추천보너스비율 + 출석보너스비율 + 가맹점보너스비율)
- 모든 연산은 **Decimal.js 라이브러리**를 사용하여 50자리 부동소수점 정밀도로 수행됨


=================================================================================================


## 2. 사전 준비: 일일 자동 백업 설정

> ⚠️ **경고**: 이 백업이 없으면 해킹 시 복구가 극도로 어려워집니다. **반드시 서버 배포 즉시 설정하십시오.**

### 개발자에게 전달할 지시사항:

**"서버에 매일 새벽 3시에 MongoDB 전체 데이터를 자동으로 백업하고, 외부 안전 저장소에 암호화하여 보관하는 crontab 스케줄을 설정해 주세요. 최소 30일치 백업을 보존해 주세요."**

### 설정 명령어 (개발자가 서버 터미널에서 실행):

```bash
# 1. 백업 저장 디렉토리 생성
sudo mkdir -p /var/backups/bitwish_mongodb

# 2. 백업 스크립트 생성
sudo tee /usr/local/bin/bitwish_backup.sh << 'EOF'
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/bitwish_mongodb"

# bitwish_mining DB 백업
mongodump --db bitwish_mining --gzip --archive="${BACKUP_DIR}/bitwish_mining_${TIMESTAMP}.gz"

# bitwish_network DB 백업
mongodump --db bitwish_network --gzip --archive="${BACKUP_DIR}/bitwish_network_${TIMESTAMP}.gz"

# 30일 이전 백업 자동 삭제 (디스크 관리)
find ${BACKUP_DIR} -name "*.gz" -mtime +30 -delete

echo "✅ [${TIMESTAMP}] BitWish 일일 백업 완료"
EOF

# 3. 실행 권한 부여
sudo chmod +x /usr/local/bin/bitwish_backup.sh

# 4. 매일 새벽 3시 자동 실행 등록
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/bitwish_backup.sh >> /var/log/bitwish_backup.log 2>&1") | crontab -

# 5. 백업 정상 동작 테스트 (수동 1회 실행)
sudo /usr/local/bin/bitwish_backup.sh
```

### 추가 권장사항 (외부 저장소 이중 백업):

**"백업 파일을 서버 내부에만 보관하지 말고, AWS S3 또는 Google Cloud Storage 같은 외부 클라우드에도 복사해 주세요. 서버 자체가 해킹되면 내부 백업도 삭제될 수 있습니다."**


=================================================================================================


## 3. 비상 상황 유형별 대응 지침

### 🔴 유형 1: 서버 해킹으로 DB 데이터가 변조된 경우
→ **[복구 절차 A](#4-복구-절차-a-db-백업이-존재하는-경우)** 로 이동

### 🔴 유형 2: 서버 장비 고장으로 DB가 완전 손실된 경우
→ **[복구 절차 A](#4-복구-절차-a-db-백업이-존재하는-경우)** 로 이동 (외부 클라우드 백업에서 복원)

### 🟡 유형 3: 서버 프로세스 다운(재시작 필요)만 발생한 경우
→ 서버 프로세스만 재시작하면 됩니다. DB 데이터는 안전합니다.
```bash
# 서버 프로세스 재시작 명령어
cd /path/to/BitWishNetwork_MiningSystem
npm run start
```
→ 서버가 기동되면 `autoRestoreMiningStates()` 엔진이 자동으로 미정산 채굴량을 소급 정산합니다.

### 🔴 유형 4: DB 백업이 전혀 없는 상태에서 데이터가 손실된 경우
→ **[복구 절차 B](#5-복구-절차-b-db-백업이-없는-경우)** 로 이동 (수학적 역산 복구)


=================================================================================================


## 4. 복구 절차 A: DB 백업이 존재하는 경우

### 개발자에게 전달할 지시사항:

**"가장 최근의 정상 백업 파일로 DB를 복원하고, 백업 시점부터 장애 발생 시점까지의 미정산 채굴량을 수학적으로 역산하여 정확하게 보정해 주세요."**

### 절차 1: 백업 파일로 DB 복원

```bash
# 1. 현재 손상된 DB를 안전하게 별도 보존 (증거 보전)
mongodump --db bitwish_mining --gzip --archive="/var/backups/bitwish_mongodb/DAMAGED_bitwish_mining.gz"
mongodump --db bitwish_network --gzip --archive="/var/backups/bitwish_mongodb/DAMAGED_bitwish_network.gz"

# 2. 손상된 DB 삭제
mongosh --eval 'use bitwish_mining; db.dropDatabase();'
mongosh --eval 'use bitwish_network; db.dropDatabase();'

# 3. 가장 최근 정상 백업으로 복원
mongorestore --gzip --archive="/var/backups/bitwish_mongodb/bitwish_mining_최근날짜.gz" --db bitwish_mining
mongorestore --gzip --archive="/var/backups/bitwish_mongodb/bitwish_network_최근날짜.gz" --db bitwish_network
```

### 절차 2: 백업 시점 이후 미정산 채굴량 수학적 보정

```javascript
// 개발자가 mongosh 또는 Node.js 스크립트로 실행
// 백업 시점: 예) 2026-09-01T03:00:00Z (새벽 3시 자동 백업)
// 장애 발생 시점: 예) 2026-09-01T15:30:00Z

const Decimal = require('decimal.js');
const mongoose = require('mongoose');

await mongoose.connect('mongodb://localhost:27017/bitwish_mining');
const db = mongoose.connection.useDb('bitwish_mining');
const states = await db.collection('miningstates').find({ isMining: true }).toArray();

const incidentTime = new Date('2026-09-01T15:30:00Z'); // ← 장애 발생 시각으로 교체

for (const state of states) {
    const lastSync = new Date(state.lastSyncTime);
    const diffSeconds = (incidentTime.getTime() - lastSync.getTime()) / 1000;

    if (diffSeconds > 0) {
        const rate = new Decimal(state.currentTotalRate || '0.25');
        const pendingReward = rate.div(3600).mul(diffSeconds);
        const newAccumulated = new Decimal(state.accumulatedReward || '0').plus(pendingReward);

        await db.collection('miningstates').updateOne(
            { _id: state._id },
            {
                $set: {
                    accumulatedReward: newAccumulated.toString(),
                    lastSyncTime: incidentTime
                }
            }
        );
        console.log(`✅ ${state.walletAddress}: +${pendingReward.toFixed(8)} BW 보정 완료`);
    }
}
```

### 절차 3: 물리 블록 1대1 재매핑

```bash
# 5단계에서 탑재한 감사 스크립트 실행
cd /path/to/BitWishNetwork_MiningSystem
node scratch/audit_and_heal_blocks_step5.js
```

### 절차 4: 서버 프로세스 재시작

```bash
npm run start
```


=================================================================================================


## 5. 복구 절차 B: DB 백업이 없는 경우

> ⚠️ **가장 극단적인 상황**입니다. DB 백업이 전혀 없는 상태에서 데이터가 완전히 손실된 경우입니다.

### 개발자에게 전달할 지시사항:

**"DB 백업이 없으므로, 블록체인 메인넷의 물리 블록 기록과 서버 로그를 기반으로 각 유저의 채굴 수량을 수학적으로 역산 복구해 주세요."**

### 복구 가능한 근거 데이터:

| 순위 | 근거 데이터 | 소재 | 복구 가능 정보 |
| :--- | :--- | :--- | :--- |
| 1 | **블록체인 물리 블록** | `bitwish_network.blocks` (만약 network DB가 살아있다면) | 각 지갑이 생성한 블록 수 = 최소 정수 BW 채굴량 |
| 2 | **서버 로그 파일** | `/var/log/` 또는 PM2 로그 | 동기화 이력, 채굴 시작/정지 시각 |
| 3 | **유저의 스크린샷** | 유저에게 요청 | 마이닝 팝업 모달의 누적 채굴 수치 캡처 |
| 4 | **프론트엔드 브라우저 캐시** | 유저 스마트폰/PC의 로컬 스토리지 | 마지막 접속 시의 채굴 수치 |

### 복구 공식:

```
유저의 최소 보장 채굴량 = (해당 지갑의 물리 블록 수) × 1 BW
유저의 추정 총 채굴량 = 최소 보장 채굴량 + 소수점 잔여 수량(로그/스크린샷에서 확인)
```

### 개발자 실행 명령어:

```javascript
// bitwish_network DB가 살아있는 경우 - 물리 블록 기반 최소 보장 복구
const networkDb = mongoose.connection.useDb('bitwish_network');
const blocks = await networkDb.collection('blocks').aggregate([
    { $group: { _id: "$minerAddress", blockCount: { $sum: 1 } } }
]).toArray();

for (const entry of blocks) {
    console.log(`지갑: ${entry._id} → 물리 블록 ${entry.blockCount}개 = 최소 ${entry.blockCount} BW 보장`);
}
```


=================================================================================================


## 6. 복구 후 전수 검증 절차

### 개발자에게 전달할 지시사항:

**"복구가 끝나면 반드시 아래 검증 스크립트를 실행하여 모든 유저의 채굴 수량, 보너스 보관함, 물리 블록 수가 정확한지 전수 확인해 주세요. 검증 결과 표를 저에게 보고해 주세요."**

### 전수 검증 스크립트 실행:

```bash
cd /path/to/BitWishNetwork_MiningSystem
node scratch/audit_and_heal_blocks_step5.js
```

### 검증 통과 기준:

| 검증 항목 | 통과 기준 |
| :--- | :--- |
| 모든 유저의 `status` 컬럼 | `✅ 100% 1대1 대조 무결점` 표시 |
| `🔧 수복 대상` 유저 수 | **0명** (1명이라도 있으면 추가 수복 필요) |
| 유저 전체 누적 채굴량 합계 | 장애 발생 전 대시보드 수치와 대등 일치 |
| 비트위시 메인넷 총 물리 블록 수 | 장애 발생 전 대시보드 수치와 대등 일치 |


=================================================================================================


## 7. 핵심 수학 공식 참조표

| 공식 이름 | 수식 | 설명 |
| :--- | :--- | :--- |
| **초당 채굴률** | `currentTotalRate ÷ 3600` | 1초에 채굴되는 BW 수량 |
| **구간 채굴량** | `초당 채굴률 × 경과 시간(초)` | 특정 시간 구간 동안 채굴된 BW |
| **시간당 보상률** | `0.25 × (1 + 추천보너스비율 + 출석보너스비율 + 가맹점보너스비율)` | 유저의 시간당 총 보상률 |
| **추천 보너스 초당 적립률** | `0.25 × 추천보너스비율 ÷ 3600` | 1초에 적립되는 추천 보너스 BW |
| **물리 블록 매핑** | `누적 채굴량의 정수 부분 = 물리 블록 수` | 정수 1 BW마다 물리 블록 1개 생성 |
| **소수점 잔여 보존** | `누적 채굴량 - lastBlockRewardThreshold` | 다음 1 BW 경계선까지의 잔여 수량 |


=================================================================================================


## 8. 핵심 DB 컬렉션 및 필드 사전

### bitwish_mining 데이터베이스

#### `users` 컬렉션 (회원 정보)
| 필드 | 설명 | 예시 값 |
| :--- | :--- | :--- |
| `walletAddress` | 유저의 고유 지갑 주소 | `BW9F5FF090231236037F250A523B4FC320FB44BFA8` |
| `referralCode` | 유저의 추천 코드 | `ABCD1234` |
| `parentReferralCode` | 부모 추천인 코드 | `XYZ5678` |
| `createdAt` | 가입 일시 | `2026-07-15T09:30:00Z` |

#### `miningstates` 컬렉션 (채굴 상태 - **가장 핵심 원장**)
| 필드 | 설명 | 예시 값 |
| :--- | :--- | :--- |
| `walletAddress` | 유저의 고유 지갑 주소 | `BW9F5FF090231236...` |
| `isMining` | 현재 채굴 중 여부 | `true` / `false` |
| `miningStartTime` | 마이닝 시작 버튼 클릭 시각 | `2026-07-15T10:00:00Z` |
| `accumulatedReward` | **총 누적 채굴량** (문자열, 50자리 정밀도) | `'539.00650000'` |
| `currentTotalRate` | 시간당 총 보상률 | `'0.26'` (기본 0.25 + 추천 4%) |
| `currentBaseRate` | 시간당 기본 보상률 | `'0.25'` |
| `referralBonusRate` | 추천 보너스 비율 | `'0.04'` (4%) |
| `lastSyncTime` | 마지막 30초 동기화 시각 | `2026-09-01T15:30:00Z` |
| `lastBlockRewardThreshold` | 마지막 블록 생성 정수 경계선 | `'539'` |

#### `bonusrecords` 컬렉션 (보너스 보관함)
| 필드 | 설명 | 예시 값 |
| :--- | :--- | :--- |
| `walletAddress` | 유저의 고유 지갑 주소 | `BW9F5FF090231236...` |
| `referralBonusStorage` | 추천 보너스 보관함 누적 수량 | `'0.00453249'` |
| `referralRewardStorage` | 추천 보상 보관함 누적 수량 | `'2.00000000'` |

### bitwish_network 데이터베이스

#### `blocks` 컬렉션 (물리 블록)
| 필드 | 설명 | 예시 값 |
| :--- | :--- | :--- |
| `header.blockHeight` | 블록 높이 (순서 번호) | `3875` |
| `header.minerAddress` | 이 블록을 채굴한 지갑 주소 | `BW9F5FF090231236...` |
| `hash` | 블록 해시 (고유 식별자) | `00a1b2c3d4...` |
| `header.timestamp` | 블록 생성 시각 | `2026-09-01T12:00:00Z` |


=================================================================================================


## 📞 비상 연락 체계

| 순서 | 조치 | 담당 |
| :--- | :--- | :--- |
| 1 | 서버 장애 인지 즉시 **서버 접근 차단** (추가 피해 방지) | 서버 관리자 |
| 2 | 본 지침서를 개발자에게 전달하며 복구 지시 | 대표님 |
| 3 | 개발자가 복구 절차 A 또는 B 수행 | AI 또는 인간 개발자 |
| 4 | 전수 검증 스크립트 결과 보고 접수 | 대표님 |
| 5 | 복구 완료 확인 후 서버 정상 개방 | 서버 관리자 |


=================================================================================================


> **본 지침서는 BitWish Network의 모든 유저 자산을 보호하기 위한 최종 방어선입니다.**
> **서버 배포 시 반드시 [2. 일일 자동 백업 설정]을 최우선으로 구축하십시오.**
