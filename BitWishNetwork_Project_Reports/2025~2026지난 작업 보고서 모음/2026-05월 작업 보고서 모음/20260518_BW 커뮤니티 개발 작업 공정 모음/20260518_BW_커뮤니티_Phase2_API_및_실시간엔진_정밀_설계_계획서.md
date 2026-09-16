# BW 커뮤니티 Phase 2 정밀 수술 계획서 (API 코어 & 실시간 엔진)

**작성일**: 2026년 05월 18일
**목표**: Phase 1에서 구축한 DB와 인증을 기반으로, 모바일 통합(Headless) 구조를 가진 게시글/댓글 CRUD API와 Socket.io 기반 실시간 핫스코어(Hot Score) 엔진을 신설한다. (Phase 2 전용)

---

## 🛠️ 1. 3공정: Node.js 백엔드 CRUD 실제 코드 구축

**[작업 위치 (신규 생성)]**
*   `c:\BitWishNetwork_BlockChainMainnet\BW_Community_Server\src\controllers\postController.ts`
*   `BW_Community_Server\src\controllers\commentController.ts`
*   `BW_Community_Server\src\routes\postRoutes.ts`
*   `BW_Community_Server\src\routes\commentRoutes.ts`

**[수술/신설 로직 요약]**
*   **postController.ts**: 게시글 작성, 조회, 수정, 삭제 로직 캡슐화. 특정 카테고리별(유머, 정보 등) 조회 및 페이지네이션 기능 포함.
*   **commentController.ts**: 게시글에 종속된 댓글/대댓글 CRUD 기능 구현.
*   **독립 원칙:** 모든 로직은 기존 마이닝의 `MiningController`와 단 0.1%도 엮이지 않는 완전히 분리된 독자적 모듈로 구성됩니다.

---

## ⚡ 2. 4공정: Socket.io 실시간 인기글(Hot Score) 엔진

**[작업 위치 (신규 생성)]**
*   `BW_Community_Server\src\controllers\reactionController.ts`
*   `BW_Community_Server\src\routes\reactionRoutes.ts`
*   `BW_Community_Server\src\sockets\socketManager.ts`

**[수술/신설 로직 요약]**
*   **reactionController.ts**: 이모지 반응(LIKE, HEART, FUNNY, DISLIKE) 입력 시 DB에 기록하고, 설계서 알고리즘인 `hotScore = (좋아요*3) + (하트*5) + (웃겨요*2) - (싫어요*2)`를 실시간으로 다시 계산하여 `Post` 테이블을 갱신합니다.
*   **socketManager.ts**: 전역 변수를 쓰지 않고 인스턴스화된 Socket.io 서버 객체를 활용하여, `hotScore`가 변동되거나 인기글로 승격되는 순간 접속 중인 모든 커뮤니티 클라이언트에게 실시간 `hot-post-update` 이벤트를 방출(Broadcast)합니다.

---

## 📱 3. 5공정: 모바일 앱 연동 API (Headless Architecture)

**[설계 및 수술/신설 로직 요약]**
*   Phase 2에서 생성되는 모든 API(게시글, 댓글, 리액션)는 **절대로 서버 측 렌더링(HTML)이나 화면 종속적인 데이터를 반환하지 않습니다.**
*   오로지 순수한 JSON 포맷(`{ success: true, data: { ... }, message: "..." }`)으로만 응답을 강제하여, 추후 React 웹 프론트엔드뿐만 아니라 **Flutter, React Native 등 모바일 앱에서 그대로 호출(API Fetch)하여 100% 호환되도록 완벽한 대통합 규격**을 적용합니다.

---

## ⚠️ 4. 절대 준수 규칙 크로스체크
1.  **기존 마이닝 로직/DB 간섭 제로(0%):** 신규 생성되는 모든 라우터와 컨트롤러는 오직 `BW_Community_Server` 폴더 안에만 존재하며, 기존 마이닝 몽고DB나 파일에 접근조차 하지 않습니다.
2.  **전역 상태/변수 배제:** 소켓 서버 및 컨트롤러는 공통(전역) 변수를 선언하여 돌려쓰지 않고, 철저히 의존성 주입(Dependency Injection)과 캡슐화된 로직으로 메모리 누수 및 오염을 방지합니다.

---

**[승인 요청]**
사용자님, 지시하신 대로 **Phase 2 (3, 4, 5공정)**에 대한 정밀 수술(신설) 계획을 확정했습니다.
본 계획서 내용 그대로 기존 시스템을 완벽히 보호하며, 커뮤니티의 핵심 심장인 API 코어와 실시간 엔진(Socket) 코딩을 집행해도 되겠습니까? 진행 승인(명령)을 대기하겠습니다!
