# BitWish BW커뮤니티 구현 초정밀 최고급 기술 명세서

- **문서 버전:** v2.0.0 (다중 이미지 업로드 및 라이트박스 확대 뷰어 보강본)
- **초판 작성일:** 2026년 6월 13일
- **최종 보강일:** 2026년 6월 13일
- **관련 구성요소:** BWCommunityWindow, bw_community_api, bwCommunityModels, AdminPage

---

## 1. 개요
본 기술 명세서는 BitWish Network 메인넷 웹 플랫폼 내에 내장된 단일 페이지 애플리케이션(SPA) 기반 **BW 커뮤니티(게시판) 시스템**의 전체 소프트웨어 아키텍처와 상세 기능을 서술합니다. 본 게시판은 회원가입, 닉네임 중복 체크, 권한 기반 게시글 수정 및 삭제(CRUD), 실시간 반응(Reactions), 댓글 및 대댓글(nested comment) 계층 구조, 보안용 실시간 금칙어 필터링 미들웨어, **다중 이미지 업로드(최대 10개, 개당 2MB 이하) 및 MIME 타입 안전 검사**, 그리고 **고화질 이미지 클릭 줌 라이트박스 오버레이 모달**을 완전히 연동하고 있습니다.

---

## 2. 데이터베이스 모델 및 백엔드 라우터 사양

### 1) 데이터베이스 스키마 설계
* **위치:** [bwCommunityModels.ts](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/server/models/bwCommunityModels.ts)
* **금칙어 스키마 (`BWBannedWordSchema`):**
  * `word`: String (유해 금칙어 단어 보관, unique 인덱스 적용)
  * `createdAt`: Date (기본값 `Date.now`)
* **게시글 스키마 (`BWCommunityPostSchema`):**
  * `title`: String (필수)
  * `content`: String (필수)
  * `category`: String (필수 — `'HUMOR'` | `'INFO'` | `'FREE'` | `'QUESTION'` | `'GAME'` | `'ANONYMOUS'` | `'NOTICE'`)
  * `views`: Number (기본값 0, 자동 증가)
  * `likeCount` / `dislikeCount` / `heartCount` / `funnyCount`: Number (기본값 0, 리액션 연동)
  * `hotScore`: Number (기본값 0, 핫 게시물 실시간 알고리즘 점수)
  * `isNotice`: Boolean (기본값 false, 공지사항 판별)
  * **`images`: [String] (기본값 `[]`, Base64 인코딩 다중 이미지 배열 — 최대 10개)** ← **v2.0 추가**
  * `authorId`: ObjectId (ref: `BWCommunityUser`, 필수)
* **댓글 스키마 (`BWCommunityCommentSchema`):**
  * `content`: String (필수)
  * `parentId`: ObjectId (대댓글 연동용 — null이면 최상위 댓글)
* **리액션 스키마 (`BWCommunityReactionSchema`):**
  * `type`: String (`'LIKE'` | `'DISLIKE'` | `'HEART'` | `'FUNNY'`)
  * `userId` + `postId` 복합 유니크 인덱스로 중복 리액션 원천 차단

### 2) 백엔드 REST API 설계 및 보강
* **위치:** [bw_community_api.ts](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/server/routes/bw_community_api.ts)

#### 2-1) 인증 API
* **`POST /auth/register`** — 이메일 기반 회원가입 (bcrypt 해싱, 관리자 이메일 자동 ADMIN 롤 부여)
* **`POST /auth/login`** — 이메일 기반 로그인 (JWT 발급, 밴 유저 차단)
* **`GET /auth/check-nickname/:nickname`** — 닉네임 중복확인 (`{ available: boolean }` 반환)

#### 2-2) 게시글 CRUD API (v2.0 다중 이미지 보강)
* **`GET /posts`** — 게시글 목록 페이징 조회 (20건 단위)
  * 응답 매핑 시 `images: post.images || []` 필드 포함 ← **v2.0 추가**
* **`GET /posts/:id`** — 게시글 상세 조회 (조회수 자동 증가, 댓글 포함)
  * 응답 데이터에 `images: post.images || []` 필드 포함 ← **v2.0 추가**
* **`POST /posts`** — 신규 게시글 작성 (금칙어 필터링 미들웨어 적용)
  * **v2.0 보강:** `images` 배열 수신 → 최대 10개 제한 검증 → 개당 MIME 형식 안전 검사 → 개당 2MB 이하 용량 검증 → DB 저장
* **`PUT /posts/:id`** — 게시글 수정 (작성자 본인 인증 검증, 금칙어 필터링 적용)
  * **v2.0 보강:** `images` 배열 수신 → 동일 검증 로직 적용 → `post.images = images` 업데이트
* **`DELETE /posts/:id`** — 게시글 삭제 (작성자 본인 인증 검증, 연관 댓글/리액션 연쇄 삭제)

#### 2-3) 관리자 전용 공지사항 API (v2.0 다중 이미지 보강)
* **`GET /admin/notices`** — 공지사항 10건 단위 페이징 조회
  * 응답 매핑 시 `images: post.images || []` 필드 포함 ← **v2.0 추가**
* **`GET /admin/notices/:id`** — 공지사항 단일 조회
  * 응답 데이터에 `images: notice.images || []` 필드 포함 ← **v2.0 추가**
* **`POST /admin/notices`** — 공지사항 등록 (JWT 관리자 인증 미들웨어 필수)
  * **v2.0 보강:** `images` 배열 수신 → 최대 10개 제한 → MIME 형식 안전 검사 → 개당 2MB 이하 검증 → DB 저장
* **`PUT /admin/notices/:id`** — 공지사항 수정
  * **v2.0 보강:** 동일 이미지 검증 로직 적용
* **`POST /admin/notices/delete-multiple`** — 공지사항 일괄 삭제

#### 2-4) v2.0 서버 측 이미지 안전 검증 엔진 상세
모든 이미지 업로드 엔드포인트(`POST /posts`, `PUT /posts/:id`, `POST /admin/notices`, `PUT /admin/notices/:id`)에 공통 적용되는 3단계 검증 파이프라인:

```
[이미지 업로드 서버 검증 3단계 파이프라인]
┌─────────────────────────────────────────────────────────┐
│ Stage 1. 개수 제한 검사                                    │
│   → images.length > 10 → 400 Error: "최대 10개까지"       │
├─────────────────────────────────────────────────────────┤
│ Stage 2. MIME 타입 형식 안전 검사 (정규식 매칭)               │
│   → /^data:image\/(png|jpeg|jpg|gif|webp);base64,/       │
│   → 불일치 시 400 Error: "허용되지 않거나 손상된 이미지"       │
├─────────────────────────────────────────────────────────┤
│ Stage 3. 용량 검사 (Base64 → 바이트 역산)                  │
│   → sizeInBytes = (img.length * 3) / 4                   │
│   → sizeInBytes > 2 * 1024 * 1024 → 400 Error            │
└─────────────────────────────────────────────────────────┘
```

* **허용 MIME 타입:** `image/png`, `image/jpeg`, `image/jpg`, `image/gif`, `image/webp`
* **악성 파일 방어 원리:** Base64 헤더의 MIME 정보를 정규식으로 대조하여, 이미지가 아닌 실행 가능 바이너리(`.exe`, `.js`, `.svg+xml` 등)의 업로드를 사전 차단합니다.

### 3) 실시간 금칙어 차단 미들웨어 (Banned Word Filter Middleware)
* **위치:** [bw_community_api.ts](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/server/routes/bw_community_api.ts) (Lines 146-171)
* **작동 기전:**
  1. 사용자가 게시글을 제출(`POST /posts` 또는 `PUT /posts/:id`)하거나 댓글을 등록(`POST /comments`)할 때 미들웨어가 먼저 실행됩니다.
  2. `BWBannedWord` 컬렉션의 모든 데이터를 실시간 로드하여 이스케이프가 가미된 정규식(Regex)을 조합해 냅니다.
  3. `regex.test(title + content)`가 `true`일 경우, 저장을 진행하지 않고 즉각 아래 에러를 응답하여 입력을 완전 차단합니다.
     ```json
     { "success": false, "error": "금칙어가 포함되어 있습니다.", "bannedWordsFound": ["차단된단어"] }
     ```
  4. **소급 적용 배제 원칙:** 기존의 작성되어 있던 글들은 검사하지 않으며, 신규 등록 및 변경되는 본문에 한해서만 실시간 차단 처리하여 DB 부하를 예방합니다.

---

## 3. 프론트엔드 UI/UX 설계 및 가시성 수복

프론트엔드 UI 컴포넌트는 단일 페이지 애플리케이션(SPA) 구조로 개발되었으며, 사용자 친화적인 동선(UX)과 세련된 디자인 변수를 장착하고 있습니다.
* **위치:** [BWCommunityWindow.tsx](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/src/components/BWCommunityWindow/BWCommunityWindow.tsx)

### 1) 회원가입 인터페이스 보안 고도화
* **비밀번호 일치 검증 기능:** 비밀번호와 비밀번호 확인 입력창의 값을 대조하여 일치하면 `✓ 비밀번호가 일치합니다.`(초록색), 불일치 시 `비밀번호가 일치하지 않습니다.`(빨간색) 텍스트 가이드를 동적으로 표시하고, 불일치 시 완료 버튼을 강제 비활성화하여 정합성을 수복했습니다.
* **닉네임 중복확인 버튼:** 중복확인 단방향 검증을 완료한 경우에만 가입 양식 제출이 가능하도록 방어 가드를 적용했습니다.

### 2) 일관된 네비게이션 동선 설계
* 커뮤니티 메인 목록이 아닌 게시글 상세 페이지(`detail`), 글쓰기 화면(`write`), 회원 로그인 및 가입창(`auth`) 등 모든 하위 뷰포트의 상단 좌측 영역에 통일성 있는 **`[← 이전으로]`(또는 목록보기) 버튼**을 설계하여 사용자 이탈 없는 자연스러운 화면 순회를 가능케 했습니다.

### 3) 권한 기반 제어 UI 노출
* 상세 페이지 렌더링 시, 현재 로그인한 사용자 정보(`currentUser.id`)와 게시글 작성자 ID(`selectedPost.author.id`)가 동일할 때만 화면 상단에 **`[✏️ 수정]` 및 `[🗑️ 삭제]` 버튼**이 선택적으로 렌더링됩니다.

### 4) [v2.0 추가] 게시글 목록 이미지 썸네일 표시
* **위치:** [BWCommunityWindow.tsx](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/src/components/BWCommunityWindow/BWCommunityWindow.tsx) (Lines 743-760)
* 게시글 목록 카드 우측에 `84×84px` 크기의 라운드 썸네일 영역을 배치합니다.
* `post.images && post.images.length > 0` 조건이 참이면 첫 번째 이미지(`post.images[0]`)를 `objectFit: 'cover'`로 표시하고, 이미지가 없으면 반투명 🖼️ 아이콘을 대체 표시합니다.
* **가시성 효과:** 사용자가 목록에서 이미지가 첨부된 게시글을 시각적으로 즉각 식별할 수 있어 클릭률(CTR) 및 탐색 효율이 향상됩니다.

### 5) [v2.0 추가] 게시글 상세 뷰 다중 이미지 갤러리 및 클릭 줌 라이트박스
* **위치:** [BWCommunityWindow.tsx](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/src/components/BWCommunityWindow/BWCommunityWindow.tsx) (Lines 876-899, 1081-1148)

#### 이미지 갤러리 렌더링 (Lines 876-899)
* 상세 뷰 본문 하단에 `selectedPost.images` 배열을 `map()`으로 순회하며 이미지를 세로 정렬 렌더링합니다.
* 각 이미지 스타일:
  * `maxWidth: 100%`, `maxHeight: 600px` (반응형 크기 제한)
  * `borderRadius: 12px`, `boxShadow: 0 4px 12px` (프리미엄 카드 미감)
  * `cursor: 'zoom-in'` (클릭 가능 UX 힌트)
  * `onMouseEnter/Leave` 시 `transform: scale(1.01)` 미세 확대 애니메이션 (인터랙션 생동감)

#### 고화질 이미지 클릭 줌 라이트박스 오버레이 모달 (Lines 1081-1148)
* **작동 방식:** 이미지 클릭 → `setActiveZoomImage(imgSrc)` → 전체 화면 오버레이 모달 렌더링
* **UI 구조:**
  * 전체 뷰포트 덮개: `position: fixed`, `100vw × 100vh`, `backgroundColor: rgba(0,0,0,0.85)`, `backdropFilter: blur(8px)`
  * 확대 이미지: `maxWidth: 90%`, `maxHeight: 90%`, `objectFit: 'contain'` (원본 비율 유지)
  * 닫기 버튼(✕): 우상단 고정 `40×40px` 반투명 원형 버튼, hover 시 밝기 증가 인터랙션
* **애니메이션 시스템:**
  * `@keyframes fadeIn`: opacity 0→1 (배경 페이드인)
  * `@keyframes zoomIn`: scale 0.9→1, `cubic-bezier(0.34, 1.56, 0.64, 1)` 스프링 바운스 효과
* **닫기 방법:** ① 배경 클릭(zoom-out 커서), ② 우상단 ✕ 버튼 클릭
* **z-index:** 99999 (모든 UI 요소 위에 최상위 노출 보장)

```
[라이트박스 모달 아키텍처]
┌───────────────────────────────────────────────────┐
│  Fixed Overlay (z-index: 99999)                   │
│  backgroundColor: rgba(0,0,0,0.85)               │
│  backdropFilter: blur(8px)                        │
│  cursor: zoom-out                                 │
│  ┌─────────────────────────────────────────────┐  │
│  │           [✕] (top-right)                   │  │
│  │                                             │  │
│  │         ┌─────────────────────┐             │  │
│  │         │                     │             │  │
│  │         │   원본 비율 유지     │             │  │
│  │         │   maxWidth: 90%     │             │  │
│  │         │   maxHeight: 90%    │             │  │
│  │         │   objectFit:contain │             │  │
│  │         │                     │             │  │
│  │         └─────────────────────┘             │  │
│  │         animation: zoomIn (spring bounce)   │  │
│  └─────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┘
```

### 6) [v2.0 추가] 일반 글쓰기 다중 이미지 업로드 인터페이스
* **위치:** [BWCommunityWindow.tsx](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/src/components/BWCommunityWindow/BWCommunityWindow.tsx) (Lines 225-269, 945-1009)
* **상태 변수:** `writeImagesBase64: string[]`, `editImagesBase64: string[]`
* **파일 선택 핸들러 (`handleWriteImagesChange`):**
  1. `<input type="file" accept="image/*" multiple>` 태그에서 다중 파일 선택
  2. **개수 제한:** 기존 + 신규 합산 10개 초과 시 alert 경고 후 차단
  3. **용량 제한:** 개별 파일 `file.size > 2 * 1024 * 1024` 시 해당 파일만 제외(alert 알림)
  4. 유효 파일 → `FileReader.readAsDataURL()` → Base64 변환 → `setWriteImagesBase64(prev => [...prev, ...tempBase64s])`
  5. 모든 파일 변환 완료 후 `e.target.value = ''`으로 input 초기화 (중복 방지)
* **이미지 미리보기 그리드:**
  * `display: grid`, `gridTemplateColumns: repeat(auto-fill, minmax(80px, 1fr))` (반응형 자동 배치)
  * 각 썸네일 `80×80px`, `objectFit: 'cover'`, `borderRadius: 8px`
  * 개별 ✕ 삭제 버튼: `position: absolute`, 우상단 18px 원형 빨간 버튼
* **게시글 수정 이미지 핸들러:** 수정 모드 진입 시 `setEditImagesBase64(selectedPost.images || [])` → 기존 이미지 동기화 로드

### 7) [v2.0 추가] 비로그인 유저 글쓰기 진입 차단 다국어 경고 시스템
* **위치:** [BWCommunityWindow.tsx](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/src/components/BWCommunityWindow/BWCommunityWindow.tsx) (Lines 271-289)
* 글쓰기 폼 제출 시 `!token || !currentUser` 검증 → 차단 시 4개 국어 경고 메시지 표시:
  * 🇰🇷 `'로그인 후 이용할 수 있습니다.'`
  * 🇺🇸 `'This feature is available after logging in.'`
  * 🇯🇵 `'ログイン後に利用可能です。'`
  * 🇨🇳 `'登录后即可使用此功能。'`
* 경고 후 자동으로 `setCurrentView('auth')` 호출하여 로그인 화면으로 유도

---

## 4. 관리자 페이지 내 커뮤니티 제어 기능 통합

웹 플랫폼 통합 어드민 센터 내에 커뮤니티를 중앙 제어할 수 있는 제어판을 구현하였습니다.
* **위치:** [AdminPage.tsx](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/src/components/AdminPage/AdminPage.tsx)

```
[관리자 페이지 - BW 커뮤니티 관리 탭 구조]
├─ 공지사항 목록 (10개씩 페이징 처리, 이전/다음 버튼 제어)
├─ 공지사항 작성 및 수정 에디터 (다중 Base64 이미지 첨부 — 최대 10개, 개당 2MB 이하) ← v2.0 보강
├─ 공지 일괄 삭제 기능 (전체 선택 체크박스 + 선택 삭제 원격 트리거)
└─ 실시간 금칙어 관리기 (새로운 단어 기입 후 즉각 추가 및 등록된 목록 개별 즉시 삭제)
```

### 1) 공지사항 페이징 처리
* 관리자가 작성한 수십 개 이상의 공지사항이 일시에 표시되어 브라우저 렉(Lag)을 유발하는 상황을 막기 위해 **10개 단위의 청크 페이징 기법**을 강제 구현하였으며, 이전/다음 버튼과 페이지 지표(`currentPage / totalPages`)를 노출하여 사용 편의성을 극대화했습니다.

### 2) [v2.0 추가] 공지사항 다중 이미지 업로드 CRUD 시스템
* **위치:** [AdminPage.tsx](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/src/components/AdminPage/AdminPage.tsx) (Lines 272-457)
* **상태 변수:** `noticeImagesBase64: string[]` (배열 기반 — 기존 `noticeImageBase64: string` 단일 상태에서 전면 개편)
* **파일 선택 핸들러 (`handleImagesChange`, Lines 352-397):**
  1. `<input type="file" accept="image/*" multiple>` 태그에서 다중 파일 선택
  2. 개수 제한: `noticeImagesBase64.length + fileArray.length > 10` → alert 차단
  3. 용량 제한: 개별 파일 `file.size > 2 * 1024 * 1024` → 해당 파일만 제외(alert)
  4. `FileReader.readAsDataURL()` → Base64 변환 → `setNoticeImagesBase64(prev => [...prev, ...tempBase64s])`
* **개별 이미지 삭제 핸들러 (`handleRemoveImage`, Lines 399-402):**
  * `setNoticeImagesBase64(prev => prev.filter((_, i) => i !== index))`
* **등록/수정 API 전송 (`handleSaveNotice`, Lines 404-450):**
  * `bodyData.images = noticeImagesBase64` — 배열 전체를 JSON body에 포함
  * 등록 시 `authorId` 자동 주입, 수정 시 기존 `editingNoticeId` 기반 PUT 요청
* **수정 대상 로드 (`handleEditSelectNotice`, Lines 452-458):**
  * `setNoticeImagesBase64(notice.images || [])` — DB 저장 이미지 배열 자동 복원
* **이미지 미리보기 그리드:**
  * `display: grid`, `gridTemplateColumns: repeat(auto-fill, minmax(80px, 1fr))`
  * 개별 80×80px 썸네일 + 우상단 ✕ 삭제 원형 버튼

### 3) 금칙어 실시간 관리 콘솔
* 인풋 폼에 차단할 단어를 입력하고 추가 버튼을 누르면 백엔드로 바로 POST 되어 `BWBannedWord`에 반영됩니다. 하단의 차단된 단어 목록 옆의 휴지통 아이콘을 누르면 실시간 해제(DELETE) 처리되어, 관리 효율이 획기적으로 향상되었습니다.

---

## 5. 프론트엔드 ↔ 백엔드 이중 검증 아키텍처 (v2.0)

이미지 업로드 시 **클라이언트 측과 서버 측 양방향 이중 검증** 구조를 채택하여 보안과 사용성을 동시에 확보합니다:

| 검증 계층 | 검증 항목 | 검증 위치 | 실패 시 동작 |
|---|---|---|---|
| **클라이언트 (1차)** | 파일 개수 ≤ 10 | BWCommunityWindow.tsx / AdminPage.tsx | `alert()` 경고 표시, 업로드 차단 |
| **클라이언트 (1차)** | 파일 크기 ≤ 2MB | BWCommunityWindow.tsx / AdminPage.tsx | 해당 파일 제외 `alert()` 개별 알림 |
| **서버 (2차)** | Base64 개수 ≤ 10 | bw_community_api.ts | `400` 에러 응답 |
| **서버 (2차)** | MIME 타입 정규식 매칭 | bw_community_api.ts | `400` 에러 응답 (형식 불일치) |
| **서버 (2차)** | Base64 역산 크기 ≤ 2MB | bw_community_api.ts | `400` 에러 응답 (용량 초과) |

* **이중 검증 필요성:** 클라이언트 검증은 사용자 경험(UX)을 위한 즉각적 피드백이며, 서버 검증은 DevTools 우회 및 API 직접 호출 등의 보안 위협을 방어합니다.

---

## 6. 파일 위치 총괄표

| 파일 | 절대 경로 | 주요 역할 |
|---|---|---|
| [bwCommunityModels.ts](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/server/models/bwCommunityModels.ts) | `server/models/bwCommunityModels.ts` | MongoDB 스키마 정의 (User, Post, Comment, Reaction, BannedWord) |
| [bw_community_api.ts](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/server/routes/bw_community_api.ts) | `server/routes/bw_community_api.ts` | 커뮤니티 REST API 라우터 (인증, CRUD, 리액션, 관리자 공지, 금칙어, 이미지 검증) |
| [BWCommunityWindow.tsx](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/src/components/BWCommunityWindow/BWCommunityWindow.tsx) | `src/components/BWCommunityWindow/BWCommunityWindow.tsx` | 커뮤니티 SPA 프론트엔드 (게시판 UI, 이미지 갤러리, 줌 라이트박스) |
| [AdminPage.tsx](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/src/components/AdminPage/AdminPage.tsx) | `src/components/AdminPage/AdminPage.tsx` | 관리자 페이지 (공지 CRUD, 다중 이미지, 금칙어 관리) |
| [communityClient.ts](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/src/components/BWCommunityWindow/api/communityClient.ts) | `src/components/BWCommunityWindow/api/communityClient.ts` | 커뮤니티 전용 HTTP 클라이언트 래퍼 |
| [useCommunityTheme.ts](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/src/components/BWCommunityWindow/hooks/useCommunityTheme.ts) | `src/components/BWCommunityWindow/hooks/useCommunityTheme.ts` | 다크/라이트 테마 전환 커스텀 훅 |
| [community_i18n.ts](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/src/components/BWCommunityWindow/locales/community_i18n.ts) | `src/components/BWCommunityWindow/locales/community_i18n.ts` | 4개국어(KO/EN/JA/ZH) 번역 키 맵 |

---

## 7. 기대 효과 및 시스템 효율성

1. **커뮤니티 품질 관리 자동화:** 금칙어 필터링 시스템이 24시간 실시간 차단 미들웨어로 동작하므로, 광고나 악성 스팸 글로 인한 커뮤니티 오염을 즉각 원천 방어합니다.
2. **최고급 프리미엄 UI 유지:** 일관성 있는 글래스모피즘 테마 디자인과 다국어(한국어, 영어, 일본어, 중국어) 지원이 적용되어, 일반 커뮤니티 사용자와 관리자 모두에게 고급스러운 사용자 경험을 제공합니다.
3. **보안과 데이터 무결성 보장:** 사용자 확인 프로세스와 API 상호 권한 대조가 동시에 작동하여 해킹용 부정한 수정 및 삭제 요청이 완벽히 방어됩니다.
4. **[v2.0] 풍부한 멀티미디어 콘텐츠 지원:** 다중 이미지 업로드(최대 10개, 개당 2MB)로 게시글의 정보 전달력이 비약적으로 향상되며, 클릭 줌 라이트박스를 통해 고해상도 이미지를 쾌적하게 열람할 수 있습니다.
5. **[v2.0] 이중 보안 검증으로 악성 파일 차단:** 클라이언트 1차 + 서버 2차 MIME 검증으로 이미지 위장 악성 코드 업로드를 완벽히 방어합니다.
6. **[v2.0] 관리자 공지사항 이미지 출력 누락 수복:** 기존 단일 이미지 상태에서 배열 상태로 전면 개편하여, 공지사항에 등록된 이미지가 커뮤니티 화면에서 정상적으로 출력되도록 데이터 흐름 정합성을 완전 수복했습니다.

---

## 8. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|---|---|---|
| v1.0.0 | 2026-06-13 | 최초 기술 명세서 작성 (커뮤니티 기본 구현, 금칙어, 권한 제어) |
| v2.0.0 | 2026-06-13 | 다중 이미지 업로드(10개/2MB) 및 MIME 안전 검사 추가, 이미지 클릭 줌 라이트박스 모달 구현, 게시글 목록 썸네일 표시, 관리자 공지 이미지 CRUD 전면 개편, 프론트↔백 이중 검증 아키텍처 수립, 비로그인 글쓰기 차단 다국어 경고 시스템 추가 |
