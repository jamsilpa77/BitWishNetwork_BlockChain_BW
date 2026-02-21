/**
 * BitWishNetwork BW 포인트 채굴 시스템
 * 현재 토큰 이코노미는 완벽한 가상 이코노미입니다.
 * 추후 KYC 시스템 구현과 블록체인 연결 지갑까지 완성하면 
 * KYC 승인 후 실제 BW 토큰이 마이그레이션 되는 방식입니다.
 * 
 * 절대 준수사항:
 * - 전역 변수 사용 금지
 * - 공통 함수 사용 금지
 * - 공통 클래스 사용 금지
 * - 전역 모달 사용 금지
 * - 중복 코드 사용 금지
 * - 다른 컴포넌트와 상태 공유 금지
 * - 전역 상태 관리 라이브러리 사용 금지
 */

// 기본 사용자 인터페이스
export interface User {
  id: string;
  userId: string;
  email: string;
  password: string;
  walletAddress: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  kycStatus: KYCStatus;
  miningStatus: MiningStatus;
  bonusStatus: BonusStatus;
  referralCode: string;
  referredBy?: string;
  partnerStatus: PartnerStatus;
}

// KYC 상태
export type KYCStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_SUBMITTED';

// 마이닝 상태
export type MiningStatus = 'IDLE' | 'MINING' | 'PAUSED' | 'STOPPED' | 'ERROR';

// 보너스 상태
export interface BonusStatus {
  attendance: AttendanceBonus;
  referral: ReferralBonus;
  partner: PartnerBonus;
}

// 출석 보너스
export interface AttendanceBonus {
  isActive: boolean;
  lastCheckDate: Date | null;
  consecutiveDays: number;
  totalAttendanceDays: number;
  totalBonus: number;
  bonusRate: number;
  attendanceHistory: AttendanceRecord[];
}

// 추천 보너스
export interface ReferralBonus {
  referralCode: string;
  referredUsers: ReferredUser[];
  totalBonus: number;
  bonusRate: number;
  rewardAmount: number;
  bonusStorage: number;
  rewardStorage: number;
  // [신규] 15일 락업 정책 반영 필드 (하위 호환성을 위해 선택적 필드로 전환)
  lockedBonusStorage?: number;     // 잠긴 보너스 (15일 대기 중)
  availableBonusStorage?: number;  // 사용 가능 보너스 (15일 경과)
  lockedRewardStorage?: number;    // 잠긴 보상
  availableRewardStorage?: number; // 사용 가능 보상
}

// 추천된 사용자
export interface ReferredUser {
  userId: string;
  walletAddress: string;
  joinedDate: Date;
  totalMiningAmount: number;
  bonusAmount: number;
  rewardAmount: number;
  kycStatus: KYCStatus;
  kycApprovedAt?: Date | null; // KYC 승인 일시 (15일 계산용)
}

// 가맹점 보너스
export interface PartnerBonus {
  status: PartnerStatus;
  registrationDate: Date | null;
  approvalDate: Date | null;
  businessLicense: string | null;
  bonusRate: number;
  totalBonus: number;
}

// 가맹점 상태
export type PartnerStatus = 'NOT_REGISTERED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

// 마이닝 기록
export interface MiningRecord {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // 초 단위
  baseRate: number;
  totalRate: number;
  baseAmount: number;
  bonusAmount: number;
  totalAmount: number;
  baseReward: number;
  totalReward: number;
  status: MiningStatus;
  createdAt: Date;
  updatedAt: Date;
}

// 보너스 기록
export interface BonusRecord {
  id: string;
  userId: string;
  type: BonusType;
  amount: number;
  rate: number;
  description: string;
  claimedAt: Date;
  expiresAt?: Date;
  status: BonusRecordStatus;
  createdAt: Date;
}

// 보너스 타입
export type BonusType = 'ATTENDANCE' | 'REFERRAL' | 'PARTNER' | 'SPECIAL';

// 보너스 기록 상태
export type BonusRecordStatus = 'PENDING' | 'CLAIMED' | 'EXPIRED' | 'CANCELLED';

// 출석 기록
export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkTime?: Date;
  bonusRate: number;
  bonusAmount?: number;
  status?: AttendanceStatus;
  createdAt?: Date;
  isCompleted: boolean;
  timestamp: string;
}

// 출석 상태
export type AttendanceStatus = 'AVAILABLE' | 'COMPLETED' | 'EXPIRED' | 'FUTURE';

// 추천 기록
export interface ReferralRecord {
  id: string;
  referrerId: string;
  referredId: string;
  referralCode: string;
  bonusRate: number;
  bonusAmount: number;
  rewardAmount: number;
  status: ReferralStatus;
  createdAt: Date;
  updatedAt: Date;
}

// 추천 상태
export type ReferralStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

// 가맹점 기록
export interface PartnerRecord {
  id: string;
  userId: string;
  businessName: string;
  businessLicense: string;
  contactInfo: ContactInfo;
  documents: DocumentInfo[];
  status: PartnerStatus;
  submittedAt: Date;
  reviewedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 연락처 정보
export interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  website?: string;
}

// 문서 정보
export interface DocumentInfo {
  type: string;
  filename: string;
  url: string;
  uploadedAt: Date;
  verified: boolean;
}

// 블록체인 기록
export interface BlockchainRecord {
  id: string;
  blockNumber: number;
  transactionHash: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  gasUsed: number;
  gasPrice: number;
  status: TransactionStatus;
  timestamp: Date;
  createdAt: Date;
}

// 트랜잭션 상태
export type TransactionStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED';

// 실시간 마이닝 상태
export interface RealTimeMiningStatus {
  totalSupply: number;
  currentIssued: number;
  remainingSupply: number;
  remainingIssued: number;
  issuanceRate: number;
  issueRate: number; // 추가
  totalBlocks: number;
  generatedBlocks: number; // 추가
  walletCount: number;
  networkStatus: NetworkStatus;
  lastUpdate: Date;
}

// 네트워크 상태
export type NetworkStatus = 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';

// 마이닝 설정
export interface MiningSettings {
  autoStart: boolean;
  autoStop: boolean;
  maxDailyMining: number;
  notificationEnabled: boolean;
  soundEnabled: boolean;
  theme: ThemeType;
  language: LanguageType;
}

// 테마 타입
export type ThemeType = 'light' | 'dark' | 'auto';

// 언어 타입
export type LanguageType = 'ko' | 'en' | 'ja' | 'zh';

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: Date;
}

// API 에러
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

// 페이지네이션
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 정렬 옵션
export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

// 필터 옵션
export interface FilterOption {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
}

// 쿼리 옵션
export interface QueryOptions {
  pagination?: Pagination;
  sort?: SortOption[];
  filters?: FilterOption[];
  search?: string;
}

// 이벤트 타입
export interface MiningEvent {
  type: 'MINING_STARTED' | 'MINING_STOPPED' | 'MINING_PAUSED' | 'MINING_RESUMED' | 'BONUS_CLAIMED' | 'LEVEL_UP';
  userId: string;
  data: any;
  timestamp: Date;
}

// 알림 타입
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

// 알림 타입
export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'BONUS' | 'MINING' | 'SYSTEM';

// 설정 타입
export interface UserSettings {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  security: SecuritySettings;
  appearance: AppearanceSettings;
}

// 알림 설정
export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  mining: boolean;
  bonus: boolean;
  system: boolean;
}

// 개인정보 설정
export interface PrivacySettings {
  profileVisibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS';
  miningStatsVisibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS';
  referralCodeVisibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS';
}

// 보안 설정
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
}

// 외관 설정
export interface AppearanceSettings {
  theme: ThemeType;
  language: LanguageType;
  fontSize: 'small' | 'medium' | 'large';
  animations: boolean;
  soundEffects: boolean;
}

// 통계 타입
export interface MiningStats {
  totalMiningTime: number;
  totalMiningAmount: number;
  averageMiningRate: number;
  bestMiningDay: number;
  consecutiveMiningDays: number;
  totalBonuses: number;
  referralCount: number;
  partnerStatus: PartnerStatus;
}

// 대시보드 데이터
export interface DashboardData {
  user: User;
  miningStats: MiningStats;
  realTimeStatus: RealTimeMiningStatus;
  recentMining: MiningRecord[];
  recentBonuses: BonusRecord[];
  notifications: Notification[];
  settings: UserSettings;
}

// 언어 타입
export type Language = 'ko' | 'en' | 'ja' | 'zh';

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

// 지갑 타입
export interface Wallet {
  id: string;
  userId: string;
  address: string;
  privateKey: string;
  publicKey: string;
  balance: number;
  totalReceived: number;
  totalSent: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 트랜잭션 타입
export interface Transaction {
  id: string;
  userId: string;
  hash: string;
  from: string;
  fromAddress: string;
  to: string;
  toAddress: string;
  amount: number;
  type: string;
  gasUsed: number;
  gasPrice: number;
  status: TransactionStatus;
  blockNumber: number;
  timestamp: Date;
  createdAt: Date;
}

// 블록 타입
export interface Block {
  id: string;
  number: number;
  blockNumber: number;
  hash: string;
  parentHash: string;
  previousHash: string; // 추가
  merkleRoot: string; // 추가
  timestamp: Date;
  gasLimit: number;
  gasUsed: number;
  difficulty: number;
  nonce: string;
  miner: string;
  transactions: Transaction[];
  transactionCount: number;
  createdAt: Date;
}

// 보너스 타입
export interface Bonus {
  id: string;
  userId: string;
  type: BonusType;
  amount: number;
  rate: number;
  description: string;
  claimedAt: Date;
  expiresAt?: Date;
  status: BonusRecordStatus;
  createdAt: Date;
}

// 추천 타입
export interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  referralCode: string;
  bonusRate: number;
  bonusAmount: number;
  rewardAmount: number;
  status: ReferralStatus;
  createdAt: Date;
  updatedAt: Date;
}

// 가맹점 타입
export interface Merchant {
  id: string;
  userId: string;
  businessName: string;
  businessLicense: string;
  contactInfo: ContactInfo;
  documents: DocumentInfo[];
  status: PartnerStatus;
  submittedAt: Date;
  reviewedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 번역 타입
export interface Translations {
  [key: string]: string;
}

// 마이닝 상태 타입
export interface MiningState {
  isActive: boolean;
  startTime: Date | null;
  endTime: Date | null;
  duration: number;
  baseRate: number;
  totalRate: number;
  baseAmount: number;
  bonusAmount: number;
  totalAmount: number;
  status: MiningStatus;
  lastUpdate: Date;
}

// 출석 상태 타입
export interface AttendanceState {
  isActive: boolean;
  lastCheckDate: Date | null;
  consecutiveDays: number;
  totalAttendanceDays: number;
  totalBonus: number;
  bonusRate: number;
  attendanceHistory: AttendanceRecord[];
}

// 네트워크 상태 타입
export interface NetworkState {
  status: NetworkStatus;
  lastConnected: Date | null;
  connectionQuality: number;
  latency: number;
  uptime: number;
  errorCount: number;
  lastError: string | null;
}

// 실시간 동기화 상태 타입
export interface SyncState {
  isActive: boolean;
  lastSync: Date | null;
  syncInterval: number;
  autoRefresh: boolean;
  pageRefresh: boolean;
  networkStatus: NetworkStatus;
  miningStatus: MiningStatus;
  attendanceStatus: AttendanceStatus;
  referralStatus: ReferralStatus;
  partnerStatus: PartnerStatus;
}
