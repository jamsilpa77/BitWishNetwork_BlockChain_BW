# BitWish Network 시스템 고도화 최종 구현 계획서

지시서 전문 분석 + 기존 코드베이스 정밀 조사 + 사용자 확인 답변 반영 완료.

---

## 확정된 의사결정 사항

| 항목 | 결정 |
|------|------|
| IP 제한 방식 | `x-forwarded-for` 기반 기본 제한만 적용. VPN/프록시 차단은 추후 악용 사례 발생 시 강화 |
| 확장프로그램 배너 위치 | 실시간 채굴 현황 + 움직이는 공지 영역 **뒤의 노란색 배경 영역** 전체에 배치 |
| 금칙어 적용 시점 | **작성 시점에만 차단**. 기존 게시글 소급 적용 없음. 작성 시 "금칙어입니다" 메시지 반환 |

---

## Proposed Changes

### 영역 1. 보안 및 다계정 방지 (IP 제한)

**현재 상태**:
- [User.ts](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/server/models/User.ts): `ipAddress` 필드 이미 존재
- [UserController.ts](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/server/controllers/UserController.ts#L36): `x-forwarded-for` 헤더로 IP 획득 중
- **문제**: 서버측 IP당 지갑 수 제한 로직 없음

#### [MODIFY] [UserController.ts](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/server/controllers/UserController.ts)

`register` 메서드 상단에 다음 로직 추가:

```typescript
// IP 기반 지갑 수 제한 (최대 3개)
const existingWalletCount = await User.countDocuments({ ipAddress: resolvedIp });
if (existingWalletCount >= 3) {
  return res.status(403).json({
    success: false,
    message: 'IP당 최대 지갑 생성 개수(3개)를 초과하였습니다.'
  });
}
```

- VPN/프록시 차단은 현재 적용하지 않음 (추후 필요 시 강화)
- 코드 변경 범위: `register` 메서드 내부 약 10줄 추가만

---

### 영역 2. 크롬 확장프로그램 (완전 신규)

#### [NEW] `c:\BitWishNetwork_BlockChainMainnet\BitWishNetwork_ChromeExtension\` (신규 폴더)

| 파일 | 설명 |
|------|------|
| `manifest.json` | Manifest V3 설정 (permissions: storage, activeTab) |
| `popup/popup.html` | 팝업 메인 UI (카드형 다크 테마) |
| `popup/popup.css` | 프리미엄 다크 테마 스타일 |
| `popup/popup.js` | 팝업 로직 (API 호출, 출석, 니모닉 인증) |
| `background.js` | 서비스 워커 (설치/제거 감지, 보너스 회수) |
| `content.js` | 콘텐츠 스크립트 (bitwishnetwork.com에서 설치 여부 감지) |
| `icons/` | 아이콘 (16, 48, 128px) |

**핵심 기능**:

**① 실시간 연동 카드 UI**
- `/api/stats/realtime` API 폴링(30초 간격)
- 3개 카드: 총 공급량(210억), 현재 발행량, 잔여 발행량
- 데이터 변동 시 숫자 카운팅 애니메이션

**② 출석 보너스 5%**
- `/api/attendance/history/:walletAddress`로 오늘 출석 여부 조회
- 미출석: 빨간 그라데이션 버튼 → 클릭 시 `/api/attendance/check` POST
- 출석 완료: 녹색 버튼 + 24시간 카운트다운 타이머
- 팝업 상단에 `현재 보너스: 0%~5%` 실시간 표시

**③ 니모닉 기반 10% 부스트**
- 팝업 내 '지갑 인증' 섹션에서 24단어 니모닉 입력
- `bip39.validateMnemonic()` + SHA256 해시 → 지갑 주소 도출
- 도출된 주소가 서버 DB에 존재하면 인증 성공 → 10% 보너스 활성화
- **보안**: 니모닉 원문 저장 안 함. 인증 성공 여부(boolean)만 `chrome.storage.local` 저장

**④ 설치/제거 감지**
- `chrome.runtime.onInstalled`: 설치 시 서버에 보너스 활성화 API 호출
- 확장프로그램 제거 시: `background.js`에서 보너스 회수 API 호출

#### [MODIFY] 서버측 변경

##### [MODIFY] [MiningState.ts](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/server/models/MiningState.ts)
- `extensionBonusRate` 필드 추가 (String, default: '0')

##### [NEW] 신규 API 라우트 파일 또는 기존 mining 라우트에 추가
- `POST /api/mining/extension-bonus`: 확장프로그램 보너스 활성화/비활성화
  - 요청: `{ walletAddress, isActive: boolean }`
  - 처리: `extensionBonusRate`를 `'0.10'` 또는 `'0'`으로 설정

##### [MODIFY] [MiningController.ts](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/server/controllers/MiningController.ts)
- 채굴률 계산 공식에 `extensionBonusRate` 항 추가:
  - 기존: `base × (1+출석) × (1+추천) × (1+가맹점)`
  - 변경: `base × (1+출석) × (1+추천) × (1+가맹점) × (1+확장프로그램)`

#### [MODIFY] 홈페이지 배너

##### [MODIFY] [HomePage.tsx](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/src/components/HomePage/HomePage.tsx)
- **배치 위치**: 실시간 BW 채굴 상태 현황 + 움직이는 공지 영역의 **뒤쪽 배경 영역(노란색 지정 영역)** 전체
- 배경 위에 겹치는 형태로 확장프로그램 설치 유도 배너 렌더링
- 디자인: 글로우 효과 + 아이콘 펄스 애니메이션 + "Chrome 확장프로그램 설치하고 채굴 보너스 받기!" 문구
- Chrome Web Store 링크 버튼

---

### 영역 3. 커뮤니티 및 게시판 UI/UX

**현재 상태**:
- 백엔드: [bw_community_api.ts](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/server/routes/bw_community_api.ts) (297줄) - 인증/CRUD/리액션 기본 구현됨
- 모델: [bwCommunityModels.ts](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/server/models/bwCommunityModels.ts) (50줄)

#### [MODIFY] [bw_community_api.ts](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/server/routes/bw_community_api.ts)

**신규 API 3개 추가**:

1. **닉네임 중복확인**: `GET /auth/check-nickname/:nickname`
   - DB 조회 후 `{ available: boolean }` 반환

2. **게시글 수정**: `PUT /posts/:id`
   - 요청 바디의 `authorId`와 게시글 작성자 비교
   - 일치 시에만 수정 허용, 불일치 시 `403 Forbidden`

3. **금칙어 필터링 미들웨어**: 게시글/댓글 작성 라우트에 적용
   - DB에서 금칙어 목록 로드 → 정규식 패턴 생성
   - 작성 내용에 금칙어 포함 시 즉시 차단: `{ success: false, message: '금칙어가 포함되어 있습니다.' }`
   - **소급 적용 없음** — 작성 시점에만 검사

**기존 API 보강**:

4. **게시글 삭제 권한 검증**: `DELETE /posts/:id`에 작성자 본인만 삭제 가능하도록 체크 추가

#### [MODIFY] [bwCommunityModels.ts](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/server/models/bwCommunityModels.ts)
- `BWBannedWord` 스키마 추가: `{ word: String, createdAt: Date }`

#### [MODIFY] 커뮤니티 프론트엔드

1. **회원가입 폼**: 비밀번호 확인 필드 추가 + 불일치 시 가입 버튼 비활성화
2. **닉네임 입력**: [중복확인] 버튼 + API 호출 후 즉시 피드백 (✓ 사용 가능 / ✗ 이미 사용 중)
3. **네비게이션**: 모든 하위 페이지 상단에 [← 이전으로] 뒤로가기 버튼 배치
4. **게시글 상세**: 작성자 본인일 때만 [수정] [삭제] 버튼 노출

---

### 영역 4. 관리자 페이지 개편

**현재 상태**:
- [AdminPage.tsx](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/src/components/AdminPage/AdminPage.tsx) (1374줄)
- [admin.ts](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/server/routes/admin.ts) (27,438 bytes)

#### [MODIFY] [AdminPage.tsx](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/src/components/AdminPage/AdminPage.tsx)

**① 메뉴 구조 재편**:

```
변경 전:                          변경 후:
├─ 대시보드                       ├─ 대시보드
├─ 로드맵 에디터                  ├─ 로드맵 에디터
├─ KYC 관리                       ├─ KYC 관리 (호버 시 하위 메뉴 표시)
├─ 가맹점 관리    ─────→ 삭제         │   └─ 가맹점 관리 (이동됨)
├─ 가입자 목록    ─────→ 통합     ├─ BW 커뮤니티 관리 (신규)
├─ 추천 보상 현황                 ├─ 추천 보상 현황 (+ 가입자 목록 통합)
└─ ...                            └─ ...
```

**② BW 커뮤니티 관리 탭 (신규)**:

| 섹션 | 기능 |
|------|------|
| 공지 관리 | 공지 작성/수정/삭제 폼 (이미지 업로드 포함, Base64) |
| 공지 목록 | **10개 단위 페이징** (이전/다음 버튼) |
| 일괄 작업 | 전체 선택 체크박스 + 개별 체크박스 → [선택 삭제] 버튼 |
| 금칙어 관리 | 금칙어 입력 필드 + [추가] 버튼 + 등록 목록 (개별 삭제) |

**③ 가입자 목록 → 추천 보상 현황 통합**:
- [추천 보상 현황] 탭 내부에 '가입자 목록' 섹션을 테이블로 포함
- 기존 [가입자 목록] 독립 탭은 제거

#### [MODIFY] [admin.ts](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/server/routes/admin.ts)
- 공지사항 CRUD API: `GET/POST/PUT/DELETE /api/admin/notices`
- 공지 이미지: Base64 인코딩으로 수신하여 서버 저장
- 금칙어 관리 API: `GET/POST/DELETE /api/admin/banned-words`

---

## 작업 순서 (우선순위)

| 순서 | 영역 | 이유 |
|------|------|------|
| 1 | 영역 1 (IP 제한) | 가장 간단, 서버 보안 즉시 강화 |
| 2 | 영역 3 (커뮤니티 UI/UX) | 백엔드 API + 프론트엔드 수정 |
| 3 | 영역 4 (관리자 페이지) | 커뮤니티 관리 기능 포함 (영역 3과 연계) |
| 4 | 영역 2 (크롬 확장프로그램) | 완전 신규, 서버 API 추가 필요 |

---

## Verification Plan

### Automated Tests
```bash
# 한글 깨짐 및 빌드 오류 확인
cd c:\BitWishNetwork_BlockChainMainnet\BitWishNetwork_MiningSystem
npm run build
```

### Manual Verification
1. **IP 제한**: 동일 IP에서 4번째 지갑 생성 시도 → 403 차단 메시지 확인
2. **커뮤니티**: 회원가입(닉네임 중복확인) → 글 작성(금칙어 테스트) → 본인만 수정/삭제
3. **관리자**: 메뉴 구조 변경 확인 → 공지 CRUD → 금칙어 등록
4. **확장프로그램**: `chrome://extensions` 개발자 모드 로드 → 팝업 UI → 출석 → 니모닉 인증
5. **배포 전**: `git diff` + 한글 정상 여부 최종 확인


====================================================================================================



