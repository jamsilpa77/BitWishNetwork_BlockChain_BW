# 📘 BitWish Network 비개발자 전용 Vultr 업데이트 최종 지침서

> **💡 본 지침서는 개발 지식이 없어도 순서대로 명령어를 복사해서 붙여넣기만 하면 100% 성공하는 Vultr 서버 업데이트 전용 가이드입니다.**

---

## 🧭 전체 업데이트 과정 한눈에 보기

업데이트는 딱 **2단계**만 진행하시면 됩니다:

1. **[내 컴퓨터]** 에서 수정한 내용을 GitHub 인터넷 상자에 올리기 (`Git Push`)
2. **[Vultr 서버]** 로 들어가서 최신 내용을 당겨받고 홈페이지에 적용하기 (`Server Deploy`)

---

## 📑 PART 1. 내 컴퓨터(VS Code)에서 실행하는 3단계 명령어

AI Assistant와 코드를 수정하거나 추가 기능을 개발한 후, **내 컴퓨터(VS Code 터미널)**에서 다음 3줄을 순서대로 실행합니다:

```powershell
# 1. 수정한 모든 파일 챙기기
git add .

# 2. 업데이트 설명 메모 적기 (쌍따옴표 안에 원하는 설명 쓰기)
git commit -m "feat: 수정 및 신규 기능 업데이트 완료"

# 3. GitHub 인터넷 상자에 올려 보내기
git push origin main
```

> **✅ 체크 포인트**: 터미널에 `main -> main` 문구가 뜨면 성공적으로 GitHub에 올라간 것입니다!

---

## 📑 PART 2. Vultr 서버(noVNC 콘솔)에서 실행하는 5단계 명령어

Vultr 웹사이트 대시보드의 서버 콘솔(noVNC 터미널 창)에 접속한 상태에서 다음 명령어들을 **한 줄씩 복사해서 붙여넣고 엔터**를 누르세요:

### 1️⃣ 저장소 폴더로 이동하기
```bash
cd /root/app/BitWishNetwork_MiningSystem
```

### 2️⃣ GitHub 상자에서 최신 수정본 당겨받기
```bash
git pull origin main
```
> **✅ 체크 포인트**: `16 files changed` 또는 `Fast-forward` 문구가 나오면 성공입니다!

### 3️⃣ 최신 반응형 화면으로 컴파일(빌드) 변환하기
```bash
npm run build
```
> ⚠️ **중요 (비개발자 안심 안내)**:
> * 실행 후 약 1~2분 동안 커서가 멈춘 채 깜빡입니다. **절대 오류가 아니며 컴퓨터가 열심히 일하고 있는 정상 상태**입니다!
> * 화면 제일 아래에 **`webpack 5.102.1 compiled`** 문구가 뜨고 입력 줄(`root@bitwish-main...#`)이 다시 나오면 완벽하게 성공한 것입니다!

### 4️⃣ 변환된 화면을 진짜 홈페이지 폴더로 복사하기
```bash
cp -r dist/* /var/www/html/
```

### 5️⃣ 웹서버 새로고침 적용하기 (마지막!)
```bash
systemctl reload nginx
```

---

## 🎯 자주 묻는 질문 & 안심 가이드 (Q&A)

**Q1. `npm run build`를 했는데 화면이 멈춰서 안 넘어가요!**
> **답변**: 약 1~2분 동안 파일들을 묶어주고 있는 중입니다. 가만히 기다리시면 아래쪽에 `webpack compiled` 문구가 나오면서 다시 명령어를 칠 수 있게 됩니다.

**Q2. 노란색으로 `WARNING in asset size limit` 가 엄청 크게 떠요. 에러인가요?**
> **답변**: 에러가 아니며 단순 용량 안내 경고입니다! 제일 마지막 줄에 **`webpack compiled`** 라는 글자만 보이면 100% 정상적으로 빌드된 것입니다.

**Q3. 명령어 실행 후 스마트폰으로 보는데 이전 화면이 나와요!**
> **답변**: 스마트폰 인터넷 브라우저에 이전 기록(캐시)이 남아있어서 그렇습니다. 스마트폰 브라우저 창을 완전히 닫았다가 다시 열거나, **'새로고침'** 또는 **'시크릿 탭'**으로 접속하시면 최신 화면이 즉시 표시됩니다!

---

**지침서 전용 보관 장소**: `c:\BitWishNetwork_BlockChainMainnet\BitWishNetwork_Project_Reports\BitWishNetwork_Vultr_Easy_Deploy_Guide.md`
