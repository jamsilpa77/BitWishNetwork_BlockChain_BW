@echo off
title BitWish Network Live Server Deployer
echo ==================================================
echo   🚀 [1/3] 로컬 코드 Git Commit 및 Push 진행 중...
echo ==================================================
git add .
git commit -m "Auto-deploy update: %date% %time%"
git push origin main

echo.
echo ==================================================
echo   🚀 [2/3] 실서버 SSH 접속 및 배포 파이프라인 트리거...
echo ==================================================
:: BitWishNetwork_MiningSystem/scripts/deploy_backend.js 스크립트 실행
node "%~dp0BitWishNetwork_MiningSystem\scripts\deploy_backend.js"

echo.
echo ==================================================
echo   ✅ [3/3] 배포 공정이 완벽히 완료되었습니다!
echo ==================================================
pause
