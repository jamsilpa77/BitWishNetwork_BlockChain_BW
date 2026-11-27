/**
 * BitWish Chrome Extension Background Script (Service Worker)
 */

chrome.runtime.onInstalled.addListener((details) => {
  console.log("[BitWish Extension] Installed successfully. Details:", details);
  // 초기 스토리지 설정
  chrome.storage.local.set({
    attendanceBonusActive: false,
    mnemonicBonusActive: false,
    walletAddress: "",
    lastAttendanceDate: ""
  });
});

// 콘텐츠 스크립트 또는 팝업으로부터 메시지를 수신하여 상태 관리
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SET_WALLET_ADDRESS") {
    const { walletAddress } = message;
    chrome.storage.local.set({ walletAddress }, () => {
      console.log("[Background] Wallet address saved:", walletAddress);
      sendResponse({ success: true });
    });
    return true; // 비동기 응답 처리 유지
  }

  if (message.type === "GET_WALLET_ADDRESS") {
    chrome.storage.local.get(["walletAddress"], (result) => {
      sendResponse({ walletAddress: result.walletAddress || "" });
    });
    return true;
  }

  // 웹 마이닝 출석 완료 상태를 팝업 스토리지에 동기화
  if (message.type === "SYNC_ATTENDANCE_STATUS") {
    chrome.storage.local.set({ attendanceBonusActive: Boolean(message.isAttendanceActive) }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  // 팝업 출석 완료 시 활성 탭(웹 마이닝 페이지)의 content.js로 브릿지 메시지 전달
  if (message.type === "NOTIFY_WEB_ATTENDANCE_COMPLETED") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "POPUP_ATTENDANCE_COMPLETED",
          walletAddress: message.walletAddress,
          miningState: message.miningState
        }, () => {});
      }
    });
    sendResponse({ success: true });
    return true;
  }
});
