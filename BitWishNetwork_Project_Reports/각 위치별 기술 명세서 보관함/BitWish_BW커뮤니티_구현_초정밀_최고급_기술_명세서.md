# BitWish BW커뮤니티 구현 초정밀 최고급 기술 명세서

- **문서 버전:** v1.0.0 (최종 보강본)
- **작성일자:** 2026년 6월 13일
- **관련 구성요소:** BWCommunityWindow, bw_community_api, bwCommunityModels, AdminPage

---

## 1. 개요
본 기술 명세서는 BitWish Network 메인넷 웹 플랫폼 내에 내장된 단일 페이지 애플리케이션(SPA) 기반 **BW 커뮤니티(게시판) 게시판 시스템**의 전체 소프트웨어 아키텍처와 상세 기능을 서술합니다. 본 게시판은 회원가입, 닉네임 중복 체크, 권한 기반 게시글 수정 및 삭제(CRUD), 실시간 반응(Reactions), 댓글 및 대댓글(nested comment) 계층 구조와 보안용 실시간 금칙어 필터링 미들웨어를 완전히 연동하고 있습니다.

---

## 2. 데이터베이스 모델 및 백엔드 라우터 사양

### 1) 데이터베이스 스키마 설계
* **위치:** [bwCommunityModels.ts](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/server/models/bwCommunityModels.ts)
* **금칙어 스키마 (`BWBannedWordSchema`):**
  * `word`: String (유해 금칙어 단어 보관, unique 인덱스 적용)
  * `createdAt`: Date (기본값 `Date.now`)
* **기존 연동 데이터 구조:**
  * `PostSchema`: 카테고리(NOTICE, HUMOR, FREE 등), 제목, 본문, 조회수, 반응수(like, dislike, heart, funny), 작성일, 작성자 정보
  * `CommentSchema`: 댓글 본문, 계층형 답글 연동을 위한 `parentId` (대댓글 처리용)

### 2) 백엔드 REST API 설계 및 보강
* **위치:** [bw_community_api.ts](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/server/routes/bw_community_api.ts)
* **신규 닉네임 중복확인 (`GET /auth/check-nickname/:nickname`):**
  * 유저가 회원가입 시 기입한 닉네임이 DB 상의 기존 회원들과 중복되는지 단방향 탐색하여 `{ available: boolean }` 형태로 신속히 반환합니다.
* **보안 강화형 게시글 수정 (`PUT /posts/:id`):**
  * 요청 페이로드의 `authorId` 정보와 게시글의 실제 DB 작성자 ID(`post.authorId`)를 세션 레벨에서 상호 대조합니다.
  * 불일치 시 `403 Forbidden`을 반환하여 타인의 게시글 변조 시도를 API 통신 단계에서 원천 차단합니다.
* **보안 강화형 게시글 삭제 (`DELETE /posts/:id`):**
  * 수정 API와 마찬가지로 작성자 본인 인증 검증 로직이 추가되었습니다.

### 3) 실시간 금칙어 차단 미들웨어 (Banned Word Filter Middleware)
* **위치:** [bw_community_api.ts](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/server/routes/bw_community_api.ts)
* **작동 기전:**
  1. 사용자가 게시글을 제출(`POST /posts` 또는 `PUT /posts/:id`)하거나 댓글을 등록(`POST /comments`)할 때 미들웨어가 먼저 실행됩니다.
  2. `BWBannedWord` 컬렉션의 모든 데이터를 실시간 로드하여 이스케이프가 가미된 정규식(Regex)을 조합해 냅니다.
  3. `regex.test(title + content)`가 `true`일 경우, 저장을 진행하지 않고 즉각 아래 에러를 응답하여 입력을 완전 차단합니다.
     ```json
     { "success": false, "message": "금칙어가 포함되어 있습니다." }
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

---

## 4. 관리자 페이지 내 커뮤니티 제어 기능 통합

웹 플랫폼 통합 어드민 센터 내에 커뮤니티를 중앙 제어할 수 있는 제어판을 구현하였습니다.
* **위치:** [AdminPage.tsx](file:///c:/BitWishNetwork_BlockChainMainnet/BitWishNetwork_MiningSystem/src/components/AdminPage/AdminPage.tsx)

```
[관리자 페이지 - BW 커뮤니티 관리 탭 구조]
├─ 공지사항 목록 (10개씩 페이징 처리, 이전/다음 버튼 제어)
├─ 공지사항 작성 및 수정 에디터 (Base64 인코딩 이미지 첨부 기능 지원)
├─ 공지 일괄 삭제 기능 (전체 선택 체크박스 + 선택 삭제 원격 트리거)
└─ 실시간 금칙어 관리기 (새로운 단어 기입 후 즉각 추가 및 등록된 목록 개별 즉시 삭제)
```

### 1) 공지사항 페이징 처리
* 관리자가 작성한 수십 개 이상의 공지사항이 일시에 표시되어 브라우저 렉(Lag)을 유발하는 상황을 막기 위해 **10개 단위의 청크 페이징 기법**을 강제 구현하였으며, 이전/다음 버튼과 페이지 지표(`currentPage / totalPages`)를 노출하여 사용 편의성을 극대화했습니다.

### 2) 금칙어 실시간 관리 콘솔
* 인풋 폼에 차단할 단어를 입력하고 추가 버튼을 누르면 백엔드로 바로 POST 되어 `BWBannedWord`에 반영됩니다. 하단의 차단된 단어 목록 옆의 휴지통 아이콘을 누르면 실시간 해제(DELETE) 처리되어, 관리 효율이 획기적으로 향상되었습니다.

---

## 5. 기대 효과 및 시스템 효율성

1. **커뮤니티 품질 관리 자동화:** 금칙어 필터링 시스템이 24시간 실시간 차단 미들웨어로 동작하므로, 광고나 악성 스팸 글로 인한 커뮤니티 오염을 즉각 원천 방어합니다.
2. **최고급 프리미엄 UI 유지:** 일관성 있는 글래스모피즘 테마 디자인과 다국어(한국어, 영어, 일본어, 중국어) 지원이 적용되어, 일반 커뮤니티 사용자와 관리자 모두에게 고급스러운 사용자 경험을 제공합니다.
3. **보안과 데이터 무결성 보장:** 사용자 확인 프로세스와 API 상호 권한 대조가 동시에 작동하여 해킹용 부정한 수정 및 삭제 요청이 완벽히 방어됩니다.
