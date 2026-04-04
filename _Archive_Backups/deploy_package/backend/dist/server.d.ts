/**
 * ====================================================================================
 * 🚀 BitWish Network 독립 블록체인 메인넷 서버 v1.0
 * ====================================================================================
 *
 * 🎯 핵심 기능:
 * - BitWish Network 완전 독립 블록체인 메인넷
 * - BW 토큰 전용 시스템
 * - BitWish-256 암호화 기반 보안
 * - P2P 네트워크 연동
 * - 완벽한 독립성 보장
 *
 * 🔒 보안 강화:
 * - BitWish 전용 보안 프로토콜
 * - 독립적인 암호화 시스템
 * - 완벽한 보안 검증 시스템
 *
 * 🔢 50자리 부동소수점 정밀도:
 * - 모든 계산에 Decimal.js 사용 (50자리 정밀도)
 * - 부동소수점 오차 완전 제거
 * - 정밀한 잔액 계산 및 전송
 *
 * 📊 시스템 통계:
 * - 완전 독립 블록체인 시스템
 * - BitWish 전용 합의 프로토콜 (PoW)
 * - BitWish P2P 네트워크
 * - BitWish 마이닝 시스템
 *
 * 🌍 다국어 지원:
 * - 한국어, 영어, 일본어, 중국어 4개국 언어 지원
 * - i18n 시스템 완벽 구현
 * - 실시간 언어 전환 지원
 *
 * 🚀 BitWish Network 완전 독립 시스템:
 * - BitWish 블록체인 코어 완전 통합
 * - BitWish P2P 네트워크 완전 통합
 * - BitWish 마이닝 시스템 완전 통합
 * - BitWish API 시스템 완전 통합
 *
 * ⚠️  중요 사항:
 * - 이 서버는 BitWish Network 전용 메인넷입니다
 * - 스텔라 관련 코드 완전 제거
 * - 모든 기능은 BitWish Network 표준을 따릅니다
 *
 * 🔧 기술 스택:
 * - Node.js + Express.js
 * - WebSocket (P2P 네트워크)
 * - MongoDB (데이터 저장)
 * - BitWish-256 암호화
 * - Decimal.js (50자리 정밀도)
 *
 * 📝 버전 정보:
 * - 버전: 1.0.0
 * - 빌드: 2025-01-27
 * - 호환성: BitWish Network v1.0+
 * - 정밀도: 50자리 부동소수점
 *
 * ====================================================================================
 */
declare class BitWishNetworkServer {
    private app;
    private server;
    private io;
    private blockchain;
    private discovery;
    private pow;
    private mongoClient;
    private isRunning;
    constructor();
    /**
     * 미들웨어 설정
     */
    private setupMiddleware;
    /**
     * API 라우트 설정
     */
    private setupRoutes;
    /**
     * WebSocket 설정
     */
    private setupWebSocket;
    /**
     * 이벤트 리스너 설정
     */
    private setupEventListeners;
    /**
     * MongoDB 연결
     */
    private connectMongoDB;
    /**
     * 서버 시작
     */
    start(): Promise<void>;
    /**
     * 서버 중지
     */
    stop(): Promise<void>;
}
declare const bitWishServer: BitWishNetworkServer;
export { BitWishNetworkServer };
export default bitWishServer;
//# sourceMappingURL=server.d.ts.map