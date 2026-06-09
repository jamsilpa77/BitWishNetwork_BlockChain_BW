# 🚀 BitWish Network Vultr 서버 통합 관리 및 운영 지침서 (v1.0)

본 지침서는 BitWish Network의 안정적인 마이닝 서비스 운영을 위해 관리자가 숙지해야 할 서버 관리 방법을 기술합니다. 

---

## 1. 서버 접속 및 기본 정보
*   **서버 주소:** `http://bitwishnetwork.com` (또는 `141.164.40.101`)
*   **OS:** Ubuntu 24.04 LTS (Vultr Cloud Compute)
*   **관리자 계정:** `root`
*   **비밀번호:** `F9)iU,FZ.PG5k(MY` (이미 유출되었으므로 가이드 숙지 후 변경 권장)
*   **주요 경로:**
    *   **프론트엔드 (웹 파일):** `/var/www/html`
    *   **백엔드 (API 서버):** `/root/app/backend`
    *   **데이터베이스 (JSON):** `/root/app/database/referrals.json`

---

## 2. 실시간 서비스 상태 점검

### ✅ 백엔드 프로세스 확인 (PM2)
사용자가 로그인이 안 되거나 마이닝이 멈췄을 때 가장 먼저 확인합니다.
```bash
# 전체 프로세스 상태 보기
pm2 status

# 실시간 로그 확인 (유저 활동 및 오류 체크)
pm2 logs bitwish-backend

# 서버 재시작 (코드 수정 시)
pm2 restart bitwish-backend
```

### ✅ 웹 서버 상태 확인 (Nginx)
사이트 주소로 접속이 아예 되지 않을 때 확인합니다.
```bash
# 엔진엑스 상태 확인
systemctl status nginx

# 엔진엑스 재시작
systemctl reload nginx
```

---

## 3. 코드 업데이트 및 배포 방법

### 🔹 프론트엔드 업데이트 (UI 수정 시)
1. 로컬 컴퓨터의 `BitWishNetwork_MiningSystem` 폴더에서 빌드 실행: `npm run build`
2. 생성된 `dist` 폴더 내의 파일들을 압축 (`deploy.zip`)
3. 서버의 `/var/www/html` 경로에 덮어쓰기.

### 🔹 백엔드 업데이트 (로직 수정 시)
1. 서버 접속 후 백엔드 폴더 이동: `cd /root/app/backend`
2. 수정된 파일 업로드 후 빌드 실행: `npm run build`
3. **포트 충돌 주의:** 빌드 시 에러가 나면 `pm2 stop bitwish-backend` 후 다시 빌드하십시오.

---

## 4. 데이터 보존 및 백업 마스터 지침

### 🛡️ 이용자 데이터 실시간 백업 (`referrals.json`)
가장 핵심적인 데이터입니다. 정기적으로 로컬 컴퓨터에 다운로드 받아두십시오.
*   **서버 내 경로:** `/root/app/database/referrals.json`
*   **방법:** WinSCP 또는 로컬의 `scp` 명령어를 사용하여 컴퓨터로 복사해 둡니다.

### 🛡️ Vultr 스냅샷 백업
서버가 완전히 망가졌을 때를 대비합니다.
*   Vultr 대시보드 -> Snapshots 메뉴에서 주 1회 수동 생성을 권장합니다.

---

## 5. 보안 및 인증서 관리 (HTTPS)

본 사이트는 현재 **HTTPS(보안연결)**가 적용되어 있습니다.
*   **인증서 갱신:** Let's Encrypt를 통해 자동 갱신되도록 설정되어 있습니다.
*   **수동 갱신 확인:**
    ```bash
    certbot renew --dry-run
    ```
*   만약 "안전하지 않음"이 다시 뜬다면 위 명령어로 인증서 상태를 체크하십시오.

---

## 6. 긴급 장애 조치 (Q&A)

**Q1. 사이트에 "502 Bad Gateway"가 뜹니다.**
> **A:** 백엔드 서버(PM2)가 꺼진 상태입니다. `pm2 start bitwish-backend` 또는 `pm2 restart 0`을 입력하십시오.

**Q2. 신규 가입자가 지갑 생성이 안 된다고 합니다.**
> **A:** 서버의 저장 공간이 찼거나 `referrals.json` 파일의 권한 문제일 수 있습니다. `ls -l /root/app/database/referrals.json`으로 권한이 `rw-rw-rw-`인지 확인하십시오.

**Q3. 포트 충돌로 빌드가 안 됩니다.**
> **A:** `fuser -k 5001/tcp` 명령어로 기존 5001 포트를 강제 종료한 뒤 다시 시도하십시오.

---

## 7. 관리자용 유용한 명령어 모음
*   **서버 용량 체크:** `df -h`
*   **메모리 점검:** `free -m`
*   **실시간 접속자 IP 확인:** `netstat -ntu | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -n`

---

**지침서 최종 보관 장소:** `c:\BitWishNetwork_BlockChainMainnet\BitWishNetwork_Vultr_Management_Guide.md`
