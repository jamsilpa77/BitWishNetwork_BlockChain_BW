/**
 * BitWish Chrome Extension Content Script
 * 
 * 웹페이지(bitwishnetwork.com)에서 확장프로그램이 설치되어 있는지 감지할 수 있도록 브릿지 역할을 수행합니다.
 */

// 1. DOM의 dataset을 이용하여 설치 여부 플래그 주입 (동기식 감지 가능)
document.documentElement.dataset.bitwishInstalled = "true";

console.log("[BitWish Extension] Content script loaded. Installation flag set.");

// 2. 웹페이지로부터 메시지를 받기 위한 이벤트 리스너
window.addEventListener("message", (event) => {
  // 동일 윈도우 창에서 오는 메시지만 신뢰
  if (event.source !== window) return;

  // 지갑 주소 연동 처리 (웹페이지가 로그인되면 확장프로그램 스토리지에도 연동)
  if (event.data && event.data.type === "BITWISH_WALLET_CONNECTED") {
    const { walletAddress } = event.data;
    if (walletAddress) {
      chrome.runtime.sendMessage({ type: "SET_WALLET_ADDRESS", walletAddress }, (response) => {
        console.log("[BitWish Extension] Wallet address synced to extension:", response);
      });
    }
  }

  // 웹 마이닝 페이지에서 출석체크 완료 시 팝업 스토리지로 상태 동기화 전달
  if (event.data && event.data.type === "BITWISH_WEB_ATTENDANCE_COMPLETED") {
    chrome.runtime.sendMessage({ type: "SYNC_ATTENDANCE_STATUS", isAttendanceActive: true }, (response) => {
      console.log("[BitWish Extension] Web attendance status synced to extension storage:", response);
    });
  }
});

// 3. 확장프로그램(background/popup)으로부터 메시지를 수신하여 웹페이지로 브릿지 전달
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 팝업에서 출석체크 완료 시 웹페이지로 커스텀 메시지 브릿지 전달
  if (message.type === "POPUP_ATTENDANCE_COMPLETED") {
    window.postMessage({
      type: "BITWISH_POPUP_ATTENDANCE_COMPLETED",
      walletAddress: message.walletAddress,
      miningState: message.miningState
    }, "*");
    sendResponse({ success: true });
    return true;
  }
});
