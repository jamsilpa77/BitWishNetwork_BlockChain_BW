/**
 * BitWishNetwork 시스템 전역 지갑 주소 정의 (Protocol Level)
 * 
 * ⚠️ 절대 주의: 본 파일의 주소는 네트워크의 세금 및 보상 분배를 위한 
 * 하드코딩된 시스템 지갑입니다. 절대 임의로 수정하여서는 안 됩니다.
 */

export const SYSTEM_WALLETS = {
  // 1. 제네시스 마스터 지갑: 210억 BW 초기 발행 및 원천 분배용
  GENESIS_MASTER: 'BW_GENESIS_MASTER_ALLOCATION_NODE_001',

  // 2. 생태계 자금 지갑 (60% 수수료 적립): 생태계 조성 및 마케팅용
  ECOSYSTEM_TREASURY: 'BW_ECOSYSTEM_FEE_TREASURY_60_PERCENT',

  // 3. 재단 운영 지갑 (40% 수수료 적립): 재단 운영 및 개발팀 유지보수용
  FOUNDATION_TREASURY: 'BW_FOUNDATION_FEE_TREASURY_40_PERCENT',

  // 4. 테스트넷 수도꼭지(Faucet) 지갑: 테스트 BW(TBW) 지급 원천
  TESTNET_FAUCET: 'BW_TESTNET_FAUCET_HOT_WALLET_SERVICE',
} as const;

/**
 * 전송 유형별 아이콘 및 라벨 정의 (익스플로러 연동용)
 */
export const TRANSACTION_TYPES = {
  TRANSFER: { label: 'Transfer', icon: '💸' },
  MIGRATION: { label: 'Migration', icon: '🔄' },
  FEE_DISTRIBUTION: { label: 'Fee Split', icon: '⚖️' },
  FAUCET: { label: 'Faucet Request', icon: '💧' },
} as const;

/**
 * 수수료 분배 비율 정의 (60:40)
 */
export const FEE_SPLIT_RATIO = {
  ECOSYSTEM: 0.6,
  FOUNDATION: 0.4,
} as const;
