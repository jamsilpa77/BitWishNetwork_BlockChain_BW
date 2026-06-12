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
});
