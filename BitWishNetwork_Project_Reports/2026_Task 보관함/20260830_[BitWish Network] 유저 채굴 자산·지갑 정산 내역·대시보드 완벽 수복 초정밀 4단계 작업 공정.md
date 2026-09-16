# 📑 1단계 및 2단계 수복 공정 태스크

- [x] `server/index.ts` 초기화 위험 코드(`runOneTimeCleanup`) 및 구동부 완벽 제거
- [x] `server/index.ts` `autoHealBlockTransactions()`의 threshold 0 덮어쓰기 비활성화 (actualBlockCount > 0 안전 가드)
- [x] `server/routes/stats.ts` 대시보드 통계 API 쿼리 교정 (`blocks` -> `blocktransactions` 원장 기반)
- [x] 로컬 빌드 및 서버 구동 검증 (`npm run build` 성공적인 100% 클린 빌드 완결)
- [x] 1단계 초정밀 작업 완료 보고서 작성
- [x] `server/routes/mining.ts`에 GET /api/mining/history/:walletAddress 라우터 신설 및 검증
- [x] `src/components/MyWalletModal/MyWalletModal.tsx` 빈 배열 덮어쓰기 가드 장착 및 삼중 가드 바인딩 수복
- [x] 로컬 프로덕션 빌드 검증 (`npm run build` 8.6초 완료, 0 에러 Clean Build)
- [x] 2단계 초정밀 작업 완료 보고서 작성
- [x] 3단계: `scratch/recover_missing_settlement_v2.js` 소급 복원 및 실시간 수량 연속 소급 수복 엔진 작성
- [x] 로컬 DB 시뮬레이션 테스트 (`node scratch/recover_missing_settlement_v2.js` 100% 무결점 통과)
- [x] 3단계 초정밀 작업 완료 보고서 단독 작성
=============================================================================================
