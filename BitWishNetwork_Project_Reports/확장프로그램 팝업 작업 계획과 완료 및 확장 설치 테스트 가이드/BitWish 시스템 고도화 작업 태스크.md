# BitWish 시스템 고도화 작업 태스크

## 영역 1. 보안 및 다계정 방지 (IP 제한)
- [x] UserController.ts — register 메서드에 IP당 지갑 3개 제한 로직 추가

## 영역 3. 커뮤니티 및 게시판 UI/UX
- [x] bwCommunityModels.ts — BWBannedWord 스키마 추가
- [x] bw_community_api.ts — 닉네임 중복확인 API 추가
- [x] bw_community_api.ts — 게시글 수정 API 추가
- [x] bw_community_api.ts — 게시글 삭제 권한 검증 추가
- [x] bw_community_api.ts — 금칙어 필터링 미들웨어 추가
- [x] 커뮤니티 프론트엔드 — 비밀번호 확인 필드 추가
- [x] 커뮤니티 프론트엔드 — 닉네임 중복확인 버튼 추가
- [x] 커뮤니티 프론트엔드 — 뒤로가기 버튼 추가
- [x] 커뮤니티 프론트엔드 — 게시글 수정/삭제 버튼 (본인만 노출)

## 영역 4. 관리자 페이지 개편
- [x] AdminPage.tsx — 메뉴 구조 재편 (가맹점→KYC하위, 커뮤니티관리 신설)
- [x] AdminPage.tsx — 가입자 목록을 추천 보상 현황에 통합
- [x] AdminPage.tsx — BW 커뮤니티 관리 탭 (공지 CRUD + 금칙어)
- [x] admin.ts — 공지사항 CRUD API 추가
- [x] admin.ts — 금칙어 관리 API 추가

## 영역 2. 크롬 확장프로그램
- [x] manifest.json 생성
- [x] popup UI (popup.html, popup.css, popup.js)
- [x] background.js (설치/제거 감지 및 초기화)
- [x] content.js (설치 여부 dataset 플래그 주입 및 지갑 주소 동기화)
- [x] MiningState.ts — extensionBonusRate 필드 추가 (백엔드 반영 완료)
- [x] MiningController.ts — 채굴률 계산에 확장프로그램 보너스 반영 (백엔드 반영 완료)
- [x] 신규 API — extension-bonus 엔드포인트 구현 (백엔드 반영 완료)
- [x] 신규 API — verify-mnemonic 엔드포인트 구현 (백엔드 반영 완료)
- [x] HomePage.tsx — 확장프로그램 설치 유도 배너 & 다이내믹 UI 및 30초 동기화 회수 가드 로직
- [x] icons 폴더 및 더미 아이콘(16px, 48px, 128px) 생성 완료

## 검증
- [x] npm run build 성공 확인
- [x] git diff로 한글 깨짐 여부 확인
