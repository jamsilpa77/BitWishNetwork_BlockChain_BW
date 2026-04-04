/**
 * ====================================================================================
 * 🚀 BitWish Discovery 클래스 - BitWish Network P2P 노드 발견 시스템
 * ====================================================================================
 *
 * 🎯 핵심 기능:
 * - BitWish Network 전용 P2P 노드 발견
 * - 자동 피어 발견 및 연결
 * - 네트워크 토폴로지 관리
 * - 완벽한 독립성 보장
 *
 * 🔒 보안 기능:
 * - BitWish 전용 암호화 프로토콜
 * - 피어 인증 및 검증
 * - 악성 노드 차단
 * - 완벽한 보안 검증 시스템
 *
 * 🌐 P2P 네트워크:
 * - 자동 노드 발견
 * - 연결 풀 관리
 * - 네트워크 상태 모니터링
 * - 피어 평가 시스템
 *
 * ====================================================================================
 */
import { EventEmitter } from 'events';
export interface BitWishPeer {
    id: string;
    address: string;
    port: number;
    publicKey: string;
    version: string;
    lastSeen: number;
    score: number;
    isConnected: boolean;
    capabilities: string[];
    lastPing: number;
    pingLatency: number;
    connectionCount: number;
    isBanned: boolean;
    banReason?: string;
    banExpiry?: number;
}
export interface BitWishDiscoveryConfig {
    maxPeers: number;
    discoveryInterval: number;
    pingInterval: number;
    scoreThreshold: number;
    banThreshold: number;
    connectionTimeout: number;
    maxConnections: number;
}
export declare class BitWishDiscovery extends EventEmitter {
    private peers;
    private bannedPeers;
    private discoveryInterval?;
    private pingInterval?;
    private config;
    private isRunning;
    constructor(config?: Partial<BitWishDiscoveryConfig>);
    /**
     * 디스커버리 서비스 시작
     */
    start(): void;
    /**
     * 디스커버리 서비스 중지
     */
    stop(): void;
    /**
     * 피어 추가
     */
    addPeer(peerData: Partial<BitWishPeer>): boolean;
    /**
     * 피어 제거
     */
    removePeer(peerId: string): boolean;
    /**
     * 피어 점수 업데이트
     */
    updatePeerScore(peerId: string, scoreChange: number): boolean;
    /**
     * 피어 연결 상태 업데이트
     */
    updatePeerConnection(peerId: string, isConnected: boolean): boolean;
    /**
     * 피어 핑 업데이트
     */
    updatePeerPing(peerId: string, latency: number): boolean;
    /**
     * 피어 차단
     */
    banPeer(peerId: string, reason: string, duration?: number): void;
    /**
     * 피어 차단 해제
     */
    unbanPeer(peerId: string): boolean;
    /**
     * 피어가 차단되었는지 확인
     */
    isPeerBanned(peerId: string): boolean;
    /**
     * 피어 조회
     */
    getPeer(peerId: string): BitWishPeer | undefined;
    /**
     * 모든 피어 조회
     */
    getAllPeers(): BitWishPeer[];
    /**
     * 연결된 피어 조회
     */
    getConnectedPeers(): BitWishPeer[];
    /**
     * 최고 점수 피어 조회
     */
    getBestPeers(count?: number): BitWishPeer[];
    /**
     * 피어 발견 (자동)
     */
    private discoverPeers;
    /**
     * 피어 핑 (자동)
     */
    private pingPeers;
    /**
     * 피어 ID 생성
     */
    private generatePeerId;
    /**
     * 네트워크 상태 조회
     */
    getNetworkStatus(): {
        totalPeers: number;
        connectedPeers: number;
        bannedPeers: number;
        averageScore: number;
        averageLatency: number;
        isRunning: boolean;
        config: BitWishDiscoveryConfig;
    };
    /**
     * 피어 통계 조회
     */
    getPeerStats(): {
        total: number;
        connected: number;
        banned: number;
        byScore: {
            excellent: number;
            good: number;
            average: number;
            poor: number;
        };
        byLatency: {
            fast: number;
            medium: number;
            slow: number;
        };
    };
    /**
     * 피어 정리 (오래된 피어 제거)
     */
    cleanupPeers(maxAge?: number): number;
}
//# sourceMappingURL=BitWishDiscovery.d.ts.map