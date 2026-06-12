/**
 * BitWish Chrome Extension Popup Script
 * 전면 개편: 니모닉 1회 인증만으로 지갑 연동 + 실시간 데이터 자동 출력
 */

document.addEventListener("DOMContentLoaded", async () => {
  // [개발자 설정] 로컬 테스트 시에는 기본적으로 5001 포트를 바라봅니다. 실제 스토어 배포 시에는 주석을 교체하여 사용하세요.
  let backendUrl = "http://localhost:5001"; // 로컬 개발/테스트용 기본값
  // let backendUrl = "https://bitwishnetwork.com"; // 실제 스토어 배포용 기본값
  let walletAddress = "";
  let attendanceBonusActive = false;
  let mnemonicBonusActive = false;
  let timerInterval = null;
  let miningPollingInterval = null;
  let statsPollingInterval = null;

  // DOM Elements
  const totalBoost = document.getElementById("totalBoost");
  const currentIssuedEl = document.getElementById("currentIssued");
  const remainingPoolEl = document.getElementById("remainingPool");
  const btnAttendance = document.getElementById("btnAttendance");
  const timerContainer = document.getElementById("timerContainer");
  const attendanceTimer = document.getElementById("attendanceTimer");
  const txtMnemonic = document.getElementById("txtMnemonic");
  const btnVerifyMnemonic = document.getElementById("btnVerifyMnemonic");
  const mnemonicInputArea = document.getElementById("mnemonicInputArea");
  const mnemonicSuccessArea = document.getElementById("mnemonicSuccessArea");
  const txtWalletAddress = document.getElementById("txtWalletAddress");

  // 마이닝 실시간 데이터 4종 DOM
  const accumulatedRewardEl = document.getElementById("accumulatedReward");
  const progressTimeEl = document.getElementById("progressTime");
  const referralBonusRateEl = document.getElementById("referralBonusRate");
  const referralBonusStorageEl = document.getElementById("referralBonusStorage");

  // 1. 도메인 동적 판별 및 초기화 (활성 탭이 실제 운영 사이트인 경우 실주소로 자동 전환)
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url) {
      try {
        const url = new URL(tabs[0].url);
        if (url.hostname === "bitwishnetwork.com" || url.hostname === "www.bitwishnetwork.com") {
          backendUrl = "https://bitwishnetwork.com";
        }
      } catch (e) {
        console.error("URL parsing error:", e);
      }
    }
    console.log("[BitWish Extension] Target Backend URL:", backendUrl);
    
    // 초기 상태 로드
    initWalletState();
  });

  /**
   * 지갑 상태 로드 및 동기화
   * - 니모닉 입력은 항상 활성화 (지갑 연결 여부 무관)
   * - 출석체크는 지갑 연결 후에만 활성화
   */
  function initWalletState() {
    chrome.storage.local.get(
      ["walletAddress", "attendanceBonusActive", "mnemonicBonusActive"],
      async (result) => {
        walletAddress = result.walletAddress || "";
        attendanceBonusActive = result.attendanceBonusActive || false;
        mnemonicBonusActive = result.mnemonicBonusActive || false;

        // 니모닉 입력은 항상 활성화 상태로 유지
        txtMnemonic.disabled = false;
        btnVerifyMnemonic.disabled = false;

        if (!walletAddress) {
          // 지갑 미연결: 출석체크만 비활성화, 니모닉은 열려있음
          showPreAuthUI();
          return;
        }

        // 지갑 연결 완료 상태
        showAuthenticatedUI();

        // 1. 실시간 네트워크 통계 로드 및 주기적 폴링 (3초)
        fetchRealtimeStats();
        statsPollingInterval = setInterval(fetchRealtimeStats, 3000);

        // 2. 마이닝 실시간 4종 데이터 폴링 (2초)
        fetchMiningStatus();
        miningPollingInterval = setInterval(fetchMiningStatus, 2000);

        // 3. 출석 체크 기록 서버 교차 검증 및 동기화
        await syncAttendanceStatus();

        // 4. 니모닉 상태 UI 동기화
        syncMnemonicUI();

        // 5. 총 부스트 갱신
        updateTotalBoostDisplay();
      }
    );
  }

  /**
   * 지갑 미연결 시 UI (니모닉 입력은 활성화 유지)
   */
  function showPreAuthUI() {
    btnAttendance.disabled = true;
    btnAttendance.innerText = "니모닉 인증 후 이용 가능";
    btnAttendance.className = "btn btn-gray";
    
    // 니모닉 입력은 항상 활성화
    txtMnemonic.disabled = false;
    btnVerifyMnemonic.disabled = false;
    
    txtWalletAddress.innerText = "연결된 지갑: 니모닉을 인증하면 자동 연결됩니다";
    totalBoost.innerText = "0%";
    
    // 마이닝 데이터 초기화
    if (accumulatedRewardEl) accumulatedRewardEl.innerText = "인증 대기 중";
    if (progressTimeEl) progressTimeEl.innerText = "--:--:--";
    if (referralBonusRateEl) referralBonusRateEl.innerText = "0.00%";
    if (referralBonusStorageEl) referralBonusStorageEl.innerText = "0.00000000 BW";
    
    if (timerInterval) clearInterval(timerInterval);
  }

  /**
   * 지갑 연결 시 UI 활성화
   */
  function showAuthenticatedUI() {
    btnAttendance.disabled = false;
    txtMnemonic.disabled = false;
    btnVerifyMnemonic.disabled = false;
    
    const shortAddr = walletAddress.length > 20 
      ? `${walletAddress.substring(0, 10)}...${walletAddress.substring(walletAddress.length - 8)}`
      : walletAddress;
    txtWalletAddress.innerText = `연결된 지갑: ${shortAddr}`;
  }

  /**
   * 실시간 네트워크 데이터 조회 (3종: 총공급량/현재발행량/잔여발행량)
   */
  async function fetchRealtimeStats() {
    try {
      const response = await fetch(`${backendUrl}/api/stats/realtime`);
      if (!response.ok) throw new Error("Network response not ok");
      const data = await response.json();
      
      if (data && (data.stats || data.data)) {
        const statsData = data.stats || data.data;
        const currentIssued = parseFloat(statsData.totalMinted || statsData.currentIssued || 0);
        const remainingPool = 21000000000 - currentIssued;

        // 카운트 애니메이션 효과와 함께 숫자 업데이트
        animateValue(currentIssuedEl, parseFloat(currentIssuedEl.dataset.value || 0), currentIssued, 1000);
        animateValue(remainingPoolEl, parseFloat(remainingPoolEl.dataset.value || 21000000000), remainingPool, 1000);

        currentIssuedEl.dataset.value = currentIssued;
        remainingPoolEl.dataset.value = remainingPool;
      }
    } catch (error) {
      console.error("[Extension] Real-time stats fetch error:", error);
    }
  }

  /**
   * 마이닝 실시간 핵심 데이터 4종 조회
   * 1) 실시간 누적 보상
   * 2) 진행 시간
   * 3) 추천 보너스 비율
   * 4) 추천 보너스 보관함
   */
  async function fetchMiningStatus() {
    if (!walletAddress) return;
    
    try {
      const response = await fetch(`${backendUrl}/api/mining/status/${walletAddress}`);
      if (!response.ok) throw new Error("Mining status fetch failed");
      const data = await response.json();

      if (data && data.success) {
        // 백엔드(Port 5001)의 응답 구조: { success: true, user: {...}, miningState: {...} }
        // 블록체인 서버(Port 4001)의 응답 구조: { success: true, data: { miningState: userData } }
        // 두 구조 모두 대응할 수 있도록 유연하게 추출
        const miningState = data.miningState || (data.data && data.data.miningState) || {};
        const user = data.user || {};

        // 1) 실시간 누적 보상
        const rewardVal = miningState.trueLifeTimeMined || miningState.accumulatedReward || miningState.totalReward || miningState.reward || (data.data && data.data.reward) || 0;
        const reward = parseFloat(rewardVal);
        if (accumulatedRewardEl) {
          accumulatedRewardEl.innerText = `${reward.toFixed(8)} BW`;
        }

        // 2) 진행 시간 (초 단위를 HH:MM:SS로 변환)
        if (progressTimeEl) {
          let totalSecs = 0;
          if (miningState.miningTime !== undefined) {
            totalSecs = parseInt(miningState.miningTime || 0);
          } else if (miningState.miningDuration || miningState.elapsedSeconds) {
            totalSecs = parseInt(miningState.miningDuration || miningState.elapsedSeconds || 0);
          } else if (miningState.isMining && miningState.miningStartTime) {
            totalSecs = Math.floor((Date.now() - new Date(miningState.miningStartTime).getTime()) / 1000);
          } else if (miningState.startTime) {
            totalSecs = Math.floor((Date.now() - new Date(miningState.startTime).getTime()) / 1000);
          }

          if (totalSecs > 0) {
            const hours = String(Math.floor(totalSecs / 3600)).padStart(2, "0");
            const minutes = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, "0");
            const seconds = String(totalSecs % 60).padStart(2, "0");
            progressTimeEl.innerText = `${hours}:${minutes}:${seconds}`;
          } else {
            progressTimeEl.innerText = "00:00:00";
          }
        }

        // 3) 추천 보너스 비율
        const referralRate = parseFloat(miningState.referralBonusRate || miningState.referralBonus || 0);
        if (referralBonusRateEl) {
          referralBonusRateEl.innerText = `${(referralRate * 100).toFixed(2)}%`;
        }

        // 4) 추천 보너스 보관함
        const referralStorageVal = user.referralBonusStorage || miningState.referralBonusStorage || (data.data && data.data.referralBonusStorage) || user.referralReward || miningState.referralReward || 0;
        const referralStorage = parseFloat(referralStorageVal);
        if (referralBonusStorageEl) {
          referralBonusStorageEl.innerText = `${referralStorage.toFixed(8)} BW`;
        }
      }
    } catch (error) {
      console.error("[Extension] Mining status fetch error:", error);
    }
  }

  /**
   * 부드러운 숫자 카운팅 애니메이션 함수
   */
  function animateValue(obj, start, end, duration) {
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const currentVal = progress * (end - start) + start;
      obj.innerHTML = currentVal.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  /**
   * 로컬 타임존 기준 오전 9시 기준일 계산 (Day Shift Logic)
   */
  function getRecordDateStr() {
    const now = new Date();
    const currentHour = now.getHours();
    let recordDate = new Date(now);
    if (currentHour < 9) {
      recordDate.setDate(recordDate.getDate() - 1);
    }
    const year = recordDate.getFullYear();
    const month = String(recordDate.getMonth() + 1).padStart(2, '0');
    const day = String(recordDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 다음 출석 가능 시간 (다음 날 오전 9시) 구하기
   */
  function getNextAttendanceTime() {
    const now = new Date();
    const next = new Date(now);
    next.setHours(9, 0, 0, 0);
    if (now.getHours() >= 9) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  /**
   * 출석체크 서버 상태와 동기화
   */
  async function syncAttendanceStatus() {
    if (!walletAddress) return;
    
    try {
      const response = await fetch(`${backendUrl}/api/attendance/history/${walletAddress}`);
      if (!response.ok) throw new Error("History fetch failed");
      const data = await response.json();

      if (data && data.success) {
        const history = data.history || [];
        const todayStr = getRecordDateStr();
        const checkedToday = history.some(record => record.date === todayStr);

        if (checkedToday) {
          attendanceBonusActive = true;
          chrome.storage.local.set({ attendanceBonusActive: true });
          updateAttendanceUIToChecked();
        } else {
          attendanceBonusActive = false;
          chrome.storage.local.set({ attendanceBonusActive: false });
          updateAttendanceUIToUnchecked();
        }
      }
    } catch (e) {
      console.error("[Extension] Sync attendance history failed:", e);
    }
  }

  /**
   * 출석 완료 UI 상태 업데이트 및 타이머 시작
   */
  function updateAttendanceUIToChecked() {
    btnAttendance.innerText = "✅ 출석 완료";
    btnAttendance.disabled = true;
    btnAttendance.className = "btn btn-green";
    timerContainer.classList.remove("hide");
    
    if (timerInterval) clearInterval(timerInterval);
    
    // ⏰ 카운트다운 타이머 시작
    updateCountdown();
    timerInterval = setInterval(updateCountdown, 1000);
  }

  /**
   * 출석 미완료 UI 상태 업데이트
   */
  function updateAttendanceUIToUnchecked() {
    btnAttendance.innerText = "🔴 출석 체크하기";
    btnAttendance.disabled = false;
    btnAttendance.className = "btn btn-red";
    timerContainer.classList.add("hide");
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  /**
   * 다음 오전 9시까지 카운트다운 계산
   */
  function updateCountdown() {
    const now = new Date();
    const target = getNextAttendanceTime();
    const diffMs = target - now;

    if (diffMs <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      updateAttendanceUIToUnchecked();
      return;
    }

    const hours = String(Math.floor(diffMs / (1000 * 60 * 60))).padStart(2, "0");
    const minutes = String(Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, "0");
    const seconds = String(Math.floor((diffMs % (1000 * 60)) / 1000)).padStart(2, "0");
    
    attendanceTimer.innerText = `${hours}:${minutes}:${seconds}`;
  }

  /**
   * 니모닉 UI 동기화
   */
  function syncMnemonicUI() {
    if (mnemonicBonusActive) {
      mnemonicInputArea.classList.add("hide");
      mnemonicSuccessArea.classList.remove("hide");
    } else {
      mnemonicInputArea.classList.remove("hide");
      mnemonicSuccessArea.classList.add("hide");
    }
  }

  /**
   * 총 부스트 요율 계산 및 UI 업데이트
   */
  function updateTotalBoostDisplay() {
    let rate = 0;
    if (attendanceBonusActive) rate += 5;
    if (mnemonicBonusActive) rate += 30;
    totalBoost.innerText = `${rate}%`;
    
    // 보너스 뱃지 색상 동적 변경
    if (rate > 0) {
      totalBoost.style.color = "#22c55e";
      totalBoost.style.textShadow = "0 0 8px rgba(34, 197, 94, 0.5)";
    }
  }

  /**
   * 서버에 보너스 업데이트 요청 전송
   */
  async function syncBonusToServer() {
    if (!walletAddress) return;
    
    let rate = 0;
    if (attendanceBonusActive) rate += 0.05;
    if (mnemonicBonusActive) rate += 0.30;
    
    const decimalRate = rate.toFixed(50);

    try {
      const response = await fetch(`${backendUrl}/api/mining/extension-bonus`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          walletAddress: walletAddress,
          bonusRate: decimalRate
        })
      });

      if (!response.ok) throw new Error("Failed to update server bonus");
      const result = await response.json();
      console.log("[Extension] Server bonus sync result:", result);
    } catch (e) {
      console.error("[Extension] Server bonus sync error:", e);
    }
  }

  /**
   * 출석체크 버튼 이벤트 핸들러
   */
  btnAttendance.addEventListener("click", async () => {
    if (!walletAddress) {
      alert("먼저 니모닉 인증을 완료하여 지갑을 연결해 주세요.");
      return;
    }
    
    btnAttendance.disabled = true;
    btnAttendance.innerText = "처리 중...";

    try {
      const response = await fetch(`${backendUrl}/api/attendance/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ walletAddress: walletAddress })
      });

      const data = await response.json();
      if (data && data.success) {
        attendanceBonusActive = true;
        chrome.storage.local.set({ attendanceBonusActive: true });
        updateAttendanceUIToChecked();
        updateTotalBoostDisplay();
        await syncBonusToServer();
        alert("✅ 출석체크가 완료되었습니다!\n+5% 채굴 보너스가 반영되었습니다!");
      } else {
        alert(data.message || "출석체크에 실패했습니다.");
        btnAttendance.disabled = false;
        btnAttendance.innerText = "🔴 출석 체크하기";
      }
    } catch (error) {
      console.error("[Extension] Attendance check click error:", error);
      alert("서버 연결에 실패하였습니다. 네트워크 상태를 확인해주세요.");
      btnAttendance.disabled = false;
      btnAttendance.innerText = "🔴 출석 체크하기";
    }
  });

  /**
   * 니모닉 인증 버튼 이벤트 핸들러
   * - 지갑 주소 없이도 니모닉만으로 인증 가능
   * - 서버가 니모닉으로부터 지갑 주소를 파생하여 돌려줌
   */
  btnVerifyMnemonic.addEventListener("click", async () => {
    const mnemonicStr = txtMnemonic.value.trim();
    if (!mnemonicStr) {
      alert("24단어 니모닉 코드를 입력해 주세요.");
      return;
    }

    const words = mnemonicStr.split(/\s+/);
    if (words.length !== 24) {
      alert(`24단어여야 합니다. 현재 입력된 단어 개수: ${words.length}개\n띄어쓰기로 구분하여 24개 단어를 정확히 입력하세요.`);
      return;
    }

    btnVerifyMnemonic.disabled = true;
    btnVerifyMnemonic.innerText = "🔄 니모닉 검증 중...";

    try {
      const response = await fetch(`${backendUrl}/api/mining/verify-mnemonic`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mnemonic: mnemonicStr
        })
      });

      const data = await response.json();
      if (data && data.success) {
        // 서버가 돌려준 walletAddress를 저장
        const derivedAddress = data.walletAddress || data.address || walletAddress;
        if (derivedAddress) {
          walletAddress = derivedAddress;
          chrome.storage.local.set({ walletAddress: derivedAddress });
        }

        mnemonicBonusActive = true;
        chrome.storage.local.set({ mnemonicBonusActive: true });
        
        // UI 갱신
        syncMnemonicUI();
        showAuthenticatedUI();
        updateTotalBoostDisplay();
        await syncBonusToServer();

        // 실시간 폴링 개시
        fetchRealtimeStats();
        if (statsPollingInterval) clearInterval(statsPollingInterval);
        statsPollingInterval = setInterval(fetchRealtimeStats, 3000);

        fetchMiningStatus();
        if (miningPollingInterval) clearInterval(miningPollingInterval);
        miningPollingInterval = setInterval(fetchMiningStatus, 2000);

        // 출석 상태 동기화
        btnAttendance.disabled = false;
        await syncAttendanceStatus();

        alert("✅ 24단어 니모닉 인증이 완료되었습니다!\n+30% 채굴 보너스가 즉시 적용되었습니다!\n(클로즈 베타 종료 후 10%로 조정됩니다)");
      } else {
        alert(data.message || "니모닉 인증에 실패했습니다. 단어의 철자나 순서를 확인해보세요.");
        btnVerifyMnemonic.disabled = false;
        btnVerifyMnemonic.innerText = "니모닉 인증 완료하기";
      }
    } catch (error) {
      console.error("[Extension] Mnemonic verify error:", error);
      alert("서버 연결에 실패하였습니다. 네트워크 상태를 확인해주세요.");
      btnVerifyMnemonic.disabled = false;
      btnVerifyMnemonic.innerText = "니모닉 인증 완료하기";
    }
  });
});
