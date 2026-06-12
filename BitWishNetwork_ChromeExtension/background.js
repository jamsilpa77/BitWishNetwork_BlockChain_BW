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
});
