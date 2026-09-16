/**
 * ====================================================================================
 * App.tsx 파일에서 추출한 모든 개인별/개개인별/개인용 관련 주석과 코드 모음
 * 총 52개의 개인별/개개인별/개인용 관련 코드 섹션
 * ====================================================================================
 */

import Decimal from 'decimal.js';

// ====================================================================================
// 1. 개인별 추천인 보너스 계산 함수 (단순화된 2% 고정)
// ====================================================================================
// ==================== 개인별 추천인 보너스 계산 함수 (단순화된 2% 고정) ====================
const calculateUserReferralBonusDecimal = (referralCount: number): {
  bonusRate: Decimal;
  enhancedRate: Decimal;
  description: string;
  maxBonus: number;
  instantBonus: Decimal;
  permanentBonusRate: Decimal;
  totalBonusRate: Decimal; // 총 보너스율 (영구 + 구간별)
  cumulativeBonusRate: Decimal; // 누적 보너스율
  segmentInfo: {
    currentSegment: string;
    segmentStart: number;
    segmentEnd: number;
    segmentRate: number;
    cumulativeFromPrevious: Decimal;
    additionalInCurrent: Decimal;
  };
} => {
  // 🎯 단순화된 정책: 추천인 1명당 고정 2% 보너스 (기존 1.2%에서 상향)
  const decimalInstantBonus = new Decimal(1.0); // 추천인 1명당 1BW 즉시 보상
  const decimalPermanentBonusRate = new Decimal(0.02).times(referralCount); // 2% × N명 (고정)
  
  // 🎯 단순화된 계산: 복잡한 구간별 계산 제거, 단순한 2% × 추천인 수
  const decimalCumulativeBonusRate = new Decimal(0.02).times(referralCount); // 2% × N명
  
  const segmentInfo = {
    currentSegment: '단순화된 2% 고정 시스템',
    segmentStart: 1,
    segmentEnd: Infinity,
    segmentRate: 0.02,
    cumulativeFromPrevious: new Decimal(0),
    additionalInCurrent: decimalCumulativeBonusRate
  };

  return {
    bonusRate: decimalPermanentBonusRate,
    enhancedRate: decimalCumulativeBonusRate,
    description: `추천인 ${referralCount}명 - 단순화된 2% 고정 시스템`,
    maxBonus: Infinity,
    instantBonus: decimalInstantBonus,
    permanentBonusRate: decimalPermanentBonusRate,
    totalBonusRate: decimalCumulativeBonusRate,
    cumulativeBonusRate: decimalCumulativeBonusRate,
    segmentInfo
  };
};

// ====================================================================================
// 2. 유저용 상태 변수 연결 관련
// ====================================================================================
// setUserReferralCode(userReferralCode); // TODO: 유저용 상태 변수 연결 필요

// ====================================================================================
// 3. 개개인별 마이닝 보너스 설정 모달 열기
// ====================================================================================
// 🎯 개개인별 마이닝 보너스 설정 모달 열기
// openUserMiningModal(walletAddress);

// ====================================================================================
// 4. 유저용 마이닝 보너스 설정 모달 상태
// ====================================================================================
const [showUserMiningBonusModal, setShowUserMiningBonusModal] = useState(false); // 🆕 유저용 마이닝 보너스 설정 모달

// ====================================================================================
// 5. 개개인별 마이닝 보너스 모달 상태 관리
// ====================================================================================
// 🎯 개개인별 마이닝 보너스 모달 상태 관리 (지갑 주소별 독립)
const [userMiningModals, setUserMiningModals] = useState<Record<string, boolean>>({});

// ====================================================================================
// 6. 개개인별 마이닝 상태 관리
// ====================================================================================
// 🎯 개개인별 마이닝 상태 관리 (지갑 주소별 독립)
const [userMiningStates, setUserMiningStates] = useState<Record<string, any>>({});

// ====================================================================================
// 7. 개인별 출석 데이터 변수
// ====================================================================================
// 🎯 개인별 출석 데이터 변수 (지갑 주소별 독립)
const [personalAttendanceCalendars, setPersonalAttendanceCalendars] = useState<Record<string, {[key: string]: boolean}>>({});
const [personalConsecutiveAttendanceDays, setPersonalConsecutiveAttendanceDays] = useState<Record<string, number>>({});
const [personalShowAttendanceModals, setPersonalShowAttendanceModals] = useState<Record<string, boolean>>({});
const [personalShowAttendanceCompleteModals, setPersonalShowAttendanceCompleteModals] = useState<Record<string, boolean>>({});

// ====================================================================================
// 8. 개인별 달력 상태
// ====================================================================================
// 🎯 개인별 달력 상태 (지갑 주소별 독립)
const [personalCalendarDates, setPersonalCalendarDates] = useState<Record<string, {year: number, month: number}>>({});

// ====================================================================================
// 9. 개인별 모달 상태
// ====================================================================================
// 🎯 개인별 모달 상태 (지갑 주소별 독립)
const [personalShowReferralModals, setPersonalShowReferralModals] = useState<Record<string, boolean>>({});
const [personalShowLockupModals, setPersonalShowLockupModals] = useState<Record<string, boolean>>({});
const [personalShowComingSoonModals, setPersonalShowComingSoonModals] = useState<Record<string, boolean>>({});

// ====================================================================================
// 10. 개개인별 마이닝 보너스 모달 제어 함수
// ====================================================================================
// ==================== 개개인별 마이닝 보너스 모달 제어 함수 ====================
const openUserMiningModal = (walletAddress: string) => {
  setUserMiningModals(prev => ({ ...prev, [walletAddress]: true }));
  // 개인별 데이터 로드
  loadPersonalMiningData(walletAddress);
  loadPersonalAttendanceData(walletAddress);
  console.log(`✅ 개인별 마이닝 모달 열기: ${walletAddress}`);
};

const closeUserMiningModal = (walletAddress: string) => {
  setUserMiningModals(prev => ({ ...prev, [walletAddress]: false }));
  // 개개인별 데이터 저장
  savePersonalMiningData(walletAddress);
  console.log(`✅ 개개인별 마이닝 모달 닫기: ${walletAddress}`);
};

// ====================================================================================
// 11. 개개인별 마이닝 데이터 로드 함수
// ====================================================================================
// 🎯 개개인별 마이닝 데이터 로드 함수

// ====================================================================================
// 12. 개인별 출석 보너스 계산 함수
// ====================================================================================
// ==================== 개인별 출석 보너스 계산 함수 (전역 데이터 완전 제거) ====================
const calculatePersonalAttendanceBonus = (walletAddress: string): number => {
  const personalCalendar = personalAttendanceCalendars[walletAddress] || {};
  const today = new Date().toISOString().split('T')[0];
  const personalAttendanceDays = Object.keys(personalCalendar).filter(date => personalCalendar[date]).length;
  
  if (personalAttendanceDays >= 30) return 0.15; // 15%
  if (personalAttendanceDays >= 20) return 0.10; // 10%
  if (personalAttendanceDays >= 10) return 0.05; // 5%
  
  return 0; // 보너스 없음
};

// ====================================================================================
// 13. 개인별 시간 유효성 검증 함수
// ====================================================================================
// ==================== 개인별 시간 유효성 검증 함수 (전역 함수 완전 제거) ====================
const isPersonalAttendanceTimeValid = (): boolean => {
  const now = new Date();
  const hour = now.getHours();
  // 9시~18시 출석 가능
  return hour >= 9 && hour <= 18;
};

// ====================================================================================
// 14. 개인별 추천인 보너스 계산 함수
// ====================================================================================
// ==================== 개인별 추천인 보너스 계산 함수 (전역 서비스 완전 제거) ====================
const calculatePersonalReferralBonus = (referralCount: number): number => {
  if (referralCount === 0) return 0;
  if (referralCount <= 5) return 0.01; // 1%
  if (referralCount <= 10) return 0.03; // 3%
  if (referralCount <= 20) return 0.04; // 4%
  
  return 0.05; // 5%
};

// ====================================================================================
// 15. 개인별 락업 보너스 계산 함수
// ====================================================================================
// ==================== 개인별 락업 보너스 계산 함수 (전역 서비스 완전 제거) ====================
const calculatePersonalLockupBonus = (ratio: number, months: number): number => {
  if (ratio === 0 || months === 0) return 0;
  const baseAPY = 0.05; // 5% 기본
  const monthBonus = months * 0.01; // 월당 1% 추가
  
  return (baseAPY + monthBonus) / 12; // 월간 비율로 변환
};

// ====================================================================================
// 16. 개인별 가맹점 보너스 계산 함수
// ====================================================================================
// 🏪 개인별 가맹점 보너스 계산 함수 (전역 calculateMerchantBonus 완전 제거)
const calculatePersonalMerchantBonus = (isMerchant: boolean): number => {
  return isMerchant ? 0.1 : 0; // 가맹점 등록시 10%
};

// ====================================================================================
// 17. 개개인별 마이닝 데이터 저장 함수
// ====================================================================================
// 🎯 개개인별 마이닝 데이터 저장 함수
const savePersonalMiningData = (walletAddress: string) => {
  try {
    const personalMiningState = userMiningStates[walletAddress];
    if (personalMiningState) {
      const personalKey = getPersonalStorageKey(walletAddress, 'userMiningState');
      localStorage.setItem(personalKey, JSON.stringify(personalMiningState));
      console.log(`💾 개개인별 마이닝 데이터 저장됨: ${walletAddress}`);
    }
  } catch (error) {
    console.error(`❌ 개개인별 마이닝 데이터 저장 실패: ${walletAddress}`, error);
  }
};

// ====================================================================================
// 18. 개개인별 localStorage 키 생성 함수
// ====================================================================================
// ==================== 개개인별 localStorage 키 생성 함수 ====================
const getPersonalStorageKey = (walletAddress: string, type: string) => `${type}_${walletAddress}`;

// ====================================================================================
// 19. 개인별 연속 출석일 계산 함수
// ====================================================================================
// ==================== 개인별 연속 출석일 계산 함수 ====================
const calculatePersonalConsecutiveDays = (walletAddress: string, calendar: {[key: string]: boolean}): number => {
  const dates = Object.keys(calendar).sort();
  if (dates.length === 0) return 0;
  
  let consecutiveDays = 0;
  let currentDate = new Date();
  
  // 오늘부터 역순으로 연속 출석일 계산
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(currentDate);
    checkDate.setDate(checkDate.getDate() - i);
    const dateString = checkDate.toISOString().split('T')[0];
    
    if (calendar[dateString]) {
      consecutiveDays++;
    } else {
      break;
    }
  }
  
  return consecutiveDays;
};

// ====================================================================================
// 20. 개인별 출석 데이터 저장 함수
// ====================================================================================
// ==================== 개인별 출석 데이터 저장 함수 ====================
const savePersonalAttendanceData = (walletAddress: string) => {
  try {
    const attendanceKey = getPersonalStorageKey(walletAddress, 'personalAttendanceCalendar');
    const consecutiveKey = getPersonalStorageKey(walletAddress, 'personalConsecutiveAttendanceDays');
    
    // 개인별 출석 달력 저장
    localStorage.setItem(attendanceKey, JSON.stringify(personalAttendanceCalendars[walletAddress] || {}));
    
    // 개인별 연속 출석일 저장
    localStorage.setItem(consecutiveKey, (personalConsecutiveAttendanceDays[walletAddress] || 0).toString());
    
    console.log(`💾 개인별 출석 데이터 저장됨: ${walletAddress}`);
  } catch (error) {
    console.error(`❌ 개인별 출석 데이터 저장 실패: ${walletAddress}`, error);
  }
};

// ====================================================================================
// 21. 페이지 로드 시 모든 개인별 출석 데이터 자동 로드
// ====================================================================================
// ==================== 페이지 로드 시 모든 개인별 출석 데이터 자동 로드 ====================
useEffect(() => {
  loadAllPersonalAttendanceData();
}, []);

// ====================================================================================
// 22. authenticatedWalletAddress 변경 시 개인별 출석 데이터 즉시 로드
// ====================================================================================
// ==================== authenticatedWalletAddress 변경 시 개인별 출석 데이터 즉시 로드 ====================
useEffect(() => {
  if (authenticatedWalletAddress) {
    loadPersonalAttendanceDataImmediately(authenticatedWalletAddress);
  }
}, [authenticatedWalletAddress]);

// ====================================================================================
// 23. 개인별 달력 헬퍼 함수들
// ====================================================================================
// ==================== 개인별 달력 헬퍼 함수들 ====================
const getPersonalCalendarDate = (walletAddress: string) => {
  const currentDate = new Date();
  return personalCalendarDates[walletAddress] || {
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1
  };
};

// ====================================================================================
// 24. 모든 보너스 개인별 계산
// ====================================================================================
// 모든 보너스 개인별 계산
const referralBonus = calculatePersonalReferralBonus(currentState.referralCount || 0);
const lockupBonus = calculatePersonalLockupBonus(currentState.lockupRatio || 0, currentState.lockupMonths || 0);
const merchantBonus = calculatePersonalMerchantBonus(currentState.isMerchantRegistered || false);

// ====================================================================================
// 25. 개인별 출석 데이터 로드 함수
// ====================================================================================
// ==================== 개인별 출석 데이터 로드 함수 ====================
const loadPersonalAttendanceData = (walletAddress: string) => {
  try {
    const attendanceKey = getPersonalStorageKey(walletAddress, 'personalAttendanceCalendar');
    const consecutiveKey = getPersonalStorageKey(walletAddress, 'personalConsecutiveAttendanceDays');
    
    // 개인별 출석 달력 로드
    const savedCalendar = localStorage.getItem(attendanceKey);
    if (savedCalendar) {
      setPersonalAttendanceCalendars(prev => ({
        ...prev,
        [walletAddress]: JSON.parse(savedCalendar)
      }));
    }
    
    // 개인별 연속 출석일 로드
    const savedConsecutiveDays = localStorage.getItem(consecutiveKey);
    if (savedConsecutiveDays) {
      setPersonalConsecutiveAttendanceDays(prev => ({
        ...prev,
        [walletAddress]: parseInt(savedConsecutiveDays)
      }));
    }
    
    console.log(`✅ 개인별 출석 데이터 로드됨: ${walletAddress}`);
  } catch (error) {
    console.error(`❌ 개인별 출석 데이터 로드 실패: ${walletAddress}`, error);
  }
};

// ====================================================================================
// 26. 모든 개인별 출석 데이터 로드 함수
// ====================================================================================
// ==================== 모든 개인별 출석 데이터 로드 함수 ====================
const loadAllPersonalAttendanceData = () => {
  try {
    // localStorage에서 모든 개인별 출석 데이터 찾기
    const keys = Object.keys(localStorage);
    const personalKeys = keys.filter(key => key.startsWith('personalAttendanceCalendar_'));
    
    personalKeys.forEach(key => {
      const walletAddress = key.replace('personalAttendanceCalendar_', '');
      loadPersonalAttendanceData(walletAddress);
    });
    
    console.log(`✅ 모든 개인별 출석 데이터 로드 완료: ${personalKeys.length}개 지갑`);
  } catch (error) {
    console.error('❌ 모든 개인별 출석 데이터 로드 실패:', error);
  }
};

// ====================================================================================
// 27. 개인별 출석 데이터 즉시 로드 함수
// ====================================================================================
// ==================== 개인별 출석 데이터 즉시 로드 함수 ====================
const loadPersonalAttendanceDataImmediately = (walletAddress: string) => {
  try {
    const attendanceKey = getPersonalStorageKey(walletAddress, 'personalAttendanceCalendar');
    const consecutiveKey = getPersonalStorageKey(walletAddress, 'personalConsecutiveAttendanceDays');
    
    // 개인별 출석 달력 즉시 로드
    const savedCalendar = localStorage.getItem(attendanceKey);
    if (savedCalendar) {
      setPersonalAttendanceCalendars(prev => ({
        ...prev,
        [walletAddress]: JSON.parse(savedCalendar)
      }));
    }
    
    // 개인별 연속 출석일 즉시 로드
    const savedConsecutiveDays = localStorage.getItem(consecutiveKey);
    if (savedConsecutiveDays) {
      setPersonalConsecutiveAttendanceDays(prev => ({
        ...prev,
        [walletAddress]: parseInt(savedConsecutiveDays)
      }));
    }
    
    console.log(`✅ 개인별 출석 데이터 즉시 로드됨: ${walletAddress}`);
  } catch (error) {
    console.error(`❌ 개인별 출석 데이터 즉시 로드 실패: ${walletAddress}`, error);
  }
};

// ====================================================================================
// 28. 개개인별 마이닝 상태 저장 함수
// ====================================================================================
// ==================== 개개인별 마이닝 상태 저장 함수 ====================
const savePersonalMiningState = (walletAddress: string, miningState: any) => {
  try {
    const personalKey = getPersonalStorageKey(walletAddress, 'userMiningState');
    localStorage.setItem(personalKey, JSON.stringify(miningState));
    console.log(`💾 개개인별 마이닝 상태 저장됨: ${walletAddress}`);
  } catch (error) {
    console.error(`❌ 개개인별 마이닝 상태 저장 실패: ${walletAddress}`, error);
  }
};

// ====================================================================================
// 29. 개개인별 마이닝 상태 로드 함수
// ====================================================================================
// ==================== 개개인별 마이닝 상태 로드 함수 ====================
const loadPersonalMiningState = (walletAddress: string) => {
  try {
    const personalKey = getPersonalStorageKey(walletAddress, 'userMiningState');
    const savedState = localStorage.getItem(personalKey);
    
    if (savedState) {
      const miningState = JSON.parse(savedState);
      setUserMiningStates(prev => ({ ...prev, [walletAddress]: miningState }));
      console.log(`✅ 개개인별 마이닝 상태 로드됨: ${walletAddress}`);
      return miningState;
    }
    
    return null;
  } catch (error) {
    console.error(`❌ 개개인별 마이닝 상태 로드 실패: ${walletAddress}`, error);
    return null;
  }
};

// ====================================================================================
// 30. 24시간 유예 기간 계산 (개인별과 동일)
// ====================================================================================
// 24시간 유예 기간 계산 (개인별과 동일)
const twentyFourHours = 24 * 60 * 60 * 1000;
const timeDiff = adminKoreanTime.getTime() - lastAttendanceDate.getTime();

// ====================================================================================
// 31. 개인별 추천 보관 BW 계산 함수
// ====================================================================================
// ==================== 개인별 추천 보관 BW 계산 함수 (단순화된 2% 고정, 50자리 정밀도) ====================
const calculatePersonalReferralStorageBW = (referralCount: number): number => {
  if (referralCount <= 0) return 0;
  
  // 🎯 단순화된 정책: 추천인 1명당 고정 2% 보너스
  const baseRate = 0.02; // 2% 고정
  const totalBonus = baseRate * referralCount;
  
  // 50자리 정밀도로 반올림
  return Math.round(totalBonus * 1e50) / 1e50;
};

// ====================================================================================
// 32. 개인별 추천코드 관리 시스템
// ====================================================================================
// ==================== 개인별 추천코드 관리 시스템 ====================

// 🎯 개인별 추천코드 저장소 키 생성
const getPersonalReferralStorageKey = (walletAddress: string, type: string) => `${type}_${walletAddress}`;

// 🎯 개인별 추천코드 데이터 인터페이스
interface PersonalReferralCodeData {
  code: string;
  referralCount: number;
  totalBonus: number;
  createdAt: string;
  lastUpdated: string;
}

// 🎯 개인별 추천코드 관리 클래스
class PersonalReferralCodeManager {
  // 개인별 추천코드 저장
  static savePersonalReferralCode(walletAddress: string, code: string): void {
    try {
      const key = getPersonalReferralStorageKey(walletAddress, 'personalReferralCode');
      const data: PersonalReferralCodeData = {
        code,
        referralCount: 0,
        totalBonus: 0,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`✅ 개인별 추천코드 저장됨: ${walletAddress} - ${code}`);
    } catch (error) {
      console.error(`❌ 개인별 추천코드 저장 실패: ${walletAddress}`, error);
    }
  }

  // 개인별 추천코드 조회
  static getPersonalReferralCode(walletAddress: string): PersonalReferralCodeData | null {
    try {
      const key = getPersonalReferralStorageKey(walletAddress, 'personalReferralCode');
      const savedData = localStorage.getItem(key);
      
      if (savedData) {
        return JSON.parse(savedData);
      }
      
      return null;
    } catch (error) {
      console.error(`❌ 개인별 추천코드 조회 실패: ${walletAddress}`, error);
      return null;
    }
  }

  // 개인별 추천인 수 증가
  static incrementPersonalReferralCount(walletAddress: string): number {
    try {
      const key = getPersonalReferralStorageKey(walletAddress, 'personalReferralCode');
      const savedData = localStorage.getItem(key);
      
      if (savedData) {
        const data: PersonalReferralCodeData = JSON.parse(savedData);
        data.referralCount += 1;
        data.totalBonus = calculatePersonalReferralStorageBW(data.referralCount);
        data.lastUpdated = new Date().toISOString();
        
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`✅ 개인별 추천인 수 증가: ${walletAddress} - ${data.referralCount}명`);
        
        return data.referralCount;
      }
      
      return 0;
    } catch (error) {
      console.error(`❌ 개인별 추천인 수 증가 실패: ${walletAddress}`, error);
      return 0;
    }
  }

  // 개인별 추천 보관 BW 업데이트
  static updatePersonalReferralStorageBW(walletAddress: string, referralCount: number): number {
    try {
      const key = getPersonalReferralStorageKey(walletAddress, 'personalReferralCode');
      const savedData = localStorage.getItem(key);
      
      if (savedData) {
        const data: PersonalReferralCodeData = JSON.parse(savedData);
        data.totalBonus = calculatePersonalReferralStorageBW(referralCount);
        data.lastUpdated = new Date().toISOString();
        
        localStorage.setItem(key, JSON.stringify(data));
        return data.totalBonus;
      }
      
      return 0;
    } catch (error) {
      console.error(`❌ 개인별 추천 보관 BW 업데이트 실패: ${walletAddress}`, error);
      return 0;
    }
  }
}

// ====================================================================================
// 33. 개인별 추천 보너스 상태 관리
// ====================================================================================
// ==================== 개인별 추천 보너스 상태 관리 ====================

// 🎯 개인별 추천 보너스 상태 인터페이스
interface PersonalReferralBonusState {
  referralCount: number;
  totalBonus: number;
  bonusRate: number;
  lastUpdated: string;
}

// 🎯 개인별 추천 보너스 상태 초기화
const initializePersonalReferralBonusState = (walletAddress: string): PersonalReferralBonusState => {
  const codeData = PersonalReferralCodeManager.getPersonalReferralCode(walletAddress);
  
  return {
    referralCount: codeData?.referralCount || 0,
    totalBonus: codeData?.totalBonus || 0,
    bonusRate: calculatePersonalReferralStorageBW(codeData?.referralCount || 0),
    lastUpdated: new Date().toISOString()
  };
};

// 🎯 개인별 추천 보너스 상태 업데이트
const updatePersonalReferralBonusState = (walletAddress: string, newReferralCount: number): PersonalReferralBonusState => {
  const updatedState = {
    referralCount: newReferralCount,
    totalBonus: calculatePersonalReferralStorageBW(newReferralCount),
    bonusRate: calculatePersonalReferralStorageBW(newReferralCount),
    lastUpdated: new Date().toISOString()
  };
  
  // 개인별 데이터 저장
  PersonalReferralCodeManager.updatePersonalReferralStorageBW(walletAddress, newReferralCount);
  
  return updatedState;
};

// ====================================================================================
// 34. 개개인별 마이닝 보너스 설정 모달 열기 (UI 관련)
// ====================================================================================
// ✅ 개개인별 마이닝 보너스 설정 모달 열기
// openUserMiningModal(authenticatedWalletAddress);

// ====================================================================================
// 35. 일반 유저: 상태 복원 없이 바로 "개개인별 마이닝 보너스 설정" 창으로 진입
// ====================================================================================
// 🎯 일반 유저: 상태 복원 없이 바로 "개개인별 마이닝 보너스 설정" 창으로 진입
// setShowWalletAuthModal(false);

// ====================================================================================
// 36-52. 추가 개인별/개개인별 관련 코드들 (App.tsx에서 발견된 모든 코드)
// ====================================================================================

// 개인별 마이닝 데이터 로드 함수 (상세 구현)
const loadPersonalMiningData = (walletAddress: string) => {
  try {
    const personalKey = getPersonalStorageKey(walletAddress, 'userMiningState');
    const savedData = localStorage.getItem(personalKey);
    
    if (savedData) {
      const personalMiningState = JSON.parse(savedData);
      setUserMiningStates(prev => ({ ...prev, [walletAddress]: personalMiningState }));
      console.log(`✅ 개개인별 마이닝 데이터 로드됨: ${walletAddress}`);
    } else {
      // 새로운 개개인 데이터 초기화
      setUserMiningStates(prev => ({ ...prev, [walletAddress]: initialMiningState }));
      console.log(`✅ 새로운 개개인 마이닝 데이터 생성: ${walletAddress}`);
    }
  } catch (error) {
    console.error(`❌ 개개인별 마이닝 데이터 로드 실패: ${walletAddress}`, error);
  }
};

// 개인별 마이닝 보너스 업데이트 함수
const updatePersonalMiningBonus = (walletAddress: string) => {
  setUserMiningStates(prev => {
    const currentState = prev[walletAddress] || initialMiningState;
    const baseRate = currentState.baseMiningRate || 0.25;
    
    // 모든 보너스 개인별 계산
    const referralBonus = calculatePersonalReferralBonus(currentState.referralCount || 0);
    const lockupBonus = calculatePersonalLockupBonus(currentState.lockupRatio || 0, currentState.lockupMonths || 0);
    const merchantBonus = calculatePersonalMerchantBonus(currentState.isMerchantRegistered || false);
    const personalAttendanceBonus = calculatePersonalAttendanceBonus(walletAddress);
    
    const personalAttendanceDays = Object.keys(personalAttendanceCalendars[walletAddress] || {}).filter(date => 
      personalAttendanceCalendars[walletAddress][date]
    ).length;
    
    const totalBonus = referralBonus + lockupBonus + merchantBonus + personalAttendanceBonus;
    const finalRate = baseRate + totalBonus;
    
    return {
      ...prev,
      [walletAddress]: {
        ...currentState,
        totalMiningRate: finalRate,
        referralBonus,
        lockupBonus,
        merchantBonus,
        attendanceBonus: personalAttendanceBonus,
        attendanceDays: personalAttendanceDays
      }
    };
  });
  
  console.log(`✅ 개인별 마이닝 보너스 업데이트: ${walletAddress}, 출석일: ${personalAttendanceDays}, 보너스: ${(personalAttendanceBonus * 100).toFixed(1)}%`);
};

// 개인별 달력 날짜 설정 함수
const setPersonalCalendarDate = (walletAddress: string, year: number, month: number) => {
  setPersonalCalendarDates(prev => ({
    ...prev,
    [walletAddress]: { year, month }
  }));
};

// 개인별 모달 상태 관리 함수들
const openPersonalReferralModal = (walletAddress: string) => {
  setPersonalShowReferralModals(prev => ({ ...prev, [walletAddress]: true }));
};

const closePersonalReferralModal = (walletAddress: string) => {
  setPersonalShowReferralModals(prev => ({ ...prev, [walletAddress]: false }));
};

const openPersonalLockupModal = (walletAddress: string) => {
  setPersonalShowLockupModals(prev => ({ ...prev, [walletAddress]: true }));
};

const closePersonalLockupModal = (walletAddress: string) => {
  setPersonalShowLockupModals(prev => ({ ...prev, [walletAddress]: false }));
};

const openPersonalComingSoonModal = (walletAddress: string) => {
  setPersonalShowComingSoonModals(prev => ({ ...prev, [walletAddress]: true }));
};

const closePersonalComingSoonModal = (walletAddress: string) => {
  setPersonalShowComingSoonModals(prev => ({ ...prev, [walletAddress]: false }));
};

// 개인별 출석 체크 함수
const checkPersonalAttendance = (walletAddress: string) => {
  if (!isPersonalAttendanceTimeValid()) {
    alert('출석 가능 시간이 아닙니다. (9시~18시)');
    return;
  }
  
  const today = new Date().toISOString().split('T')[0];
  const personalCalendar = personalAttendanceCalendars[walletAddress] || {};
  
  if (personalCalendar[today]) {
    alert('이미 출석체크를 완료했습니다.');
    return;
  }
  
  // 개인별 출석 데이터 업데이트
  setPersonalAttendanceCalendars(prev => ({
    ...prev,
    [walletAddress]: {
      ...personalCalendar,
      [today]: true
    }
  }));
  
  // 개인별 연속 출석일 계산 및 업데이트
  const newCalendar = {
    ...personalCalendar,
    [today]: true
  };
  const consecutiveDays = calculatePersonalConsecutiveDays(walletAddress, newCalendar);
  
  setPersonalConsecutiveAttendanceDays(prev => ({
    ...prev,
    [walletAddress]: consecutiveDays
  }));
  
  // 개인별 마이닝 보너스 업데이트
  updatePersonalMiningBonus(walletAddress);
  
  // 개인별 출석 데이터 저장
  savePersonalAttendanceData(walletAddress);
  
  console.log(`✅ 개인별 출석체크 완료: ${walletAddress}, 연속일: ${consecutiveDays}일`);
};

// 개인별 출석 모달 열기/닫기 함수들
const openPersonalAttendanceModal = (walletAddress: string) => {
  setPersonalShowAttendanceModals(prev => ({ ...prev, [walletAddress]: true }));
};

const closePersonalAttendanceModal = (walletAddress: string) => {
  setPersonalShowAttendanceModals(prev => ({ ...prev, [walletAddress]: false }));
};

const openPersonalAttendanceCompleteModal = (walletAddress: string) => {
  setPersonalShowAttendanceCompleteModals(prev => ({ ...prev, [walletAddress]: true }));
};

const closePersonalAttendanceCompleteModal = (walletAddress: string) => {
  setPersonalShowAttendanceCompleteModals(prev => ({ ...prev, [walletAddress]: false }));
};

// 개인별 데이터 초기화 함수
const initializePersonalData = (walletAddress: string) => {
  const initialMiningState = {
    baseMiningRate: 0.25,
    referralCount: 0,
    lockupRatio: 0,
    lockupMonths: 0,
    isMerchantRegistered: false,
    totalMiningRate: 0.25,
    referralBonus: 0,
    lockupBonus: 0,
    merchantBonus: 0,
    attendanceBonus: 0,
    attendanceDays: 0
  };
  
  setUserMiningStates(prev => ({ ...prev, [walletAddress]: initialMiningState }));
  setPersonalAttendanceCalendars(prev => ({ ...prev, [walletAddress]: {} }));
  setPersonalConsecutiveAttendanceDays(prev => ({ ...prev, [walletAddress]: 0 }));
  setPersonalCalendarDates(prev => ({ 
    ...prev, 
    [walletAddress]: { 
      year: new Date().getFullYear(), 
      month: new Date().getMonth() + 1 
    } 
  }));
  
  console.log(`✅ 개인별 데이터 초기화 완료: ${walletAddress}`);
};

// 개인별 데이터 삭제 함수
const deletePersonalData = (walletAddress: string) => {
  try {
    // localStorage에서 개인별 데이터 삭제
    const keys = [
      getPersonalStorageKey(walletAddress, 'userMiningState'),
      getPersonalStorageKey(walletAddress, 'personalAttendanceCalendar'),
      getPersonalStorageKey(walletAddress, 'personalConsecutiveAttendanceDays'),
      getPersonalStorageKey(walletAddress, 'personalReferralCode')
    ];
    
    keys.forEach(key => localStorage.removeItem(key));
    
    // 상태에서 개인별 데이터 삭제
    setUserMiningStates(prev => {
      const newStates = { ...prev };
      delete newStates[walletAddress];
      return newStates;
    });
    
    setPersonalAttendanceCalendars(prev => {
      const newCalendars = { ...prev };
      delete newCalendars[walletAddress];
      return newCalendars;
    });
    
    setPersonalConsecutiveAttendanceDays(prev => {
      const newDays = { ...prev };
      delete newDays[walletAddress];
      return newDays;
    });
    
    setPersonalCalendarDates(prev => {
      const newDates = { ...prev };
      delete newDates[walletAddress];
      return newDates;
    });
    
    console.log(`✅ 개인별 데이터 삭제 완료: ${walletAddress}`);
  } catch (error) {
    console.error(`❌ 개인별 데이터 삭제 실패: ${walletAddress}`, error);
  }
};

// 개인별 데이터 백업 함수
const backupPersonalData = (walletAddress: string) => {
  try {
    const personalData = {
      miningState: userMiningStates[walletAddress],
      attendanceCalendar: personalAttendanceCalendars[walletAddress],
      consecutiveDays: personalConsecutiveAttendanceDays[walletAddress],
      calendarDate: personalCalendarDates[walletAddress],
      timestamp: new Date().toISOString()
    };
    
    const backupKey = `backup_${walletAddress}_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(personalData));
    
    console.log(`✅ 개인별 데이터 백업 완료: ${walletAddress} - ${backupKey}`);
    return backupKey;
  } catch (error) {
    console.error(`❌ 개인별 데이터 백업 실패: ${walletAddress}`, error);
    return null;
  }
};

// 개인별 데이터 복원 함수
const restorePersonalData = (walletAddress: string, backupKey: string) => {
  try {
    const backupData = localStorage.getItem(backupKey);
    if (!backupData) {
      console.error(`❌ 백업 데이터를 찾을 수 없습니다: ${backupKey}`);
      return false;
    }
    
    const personalData = JSON.parse(backupData);
    
    setUserMiningStates(prev => ({ ...prev, [walletAddress]: personalData.miningState }));
    setPersonalAttendanceCalendars(prev => ({ ...prev, [walletAddress]: personalData.attendanceCalendar }));
    setPersonalConsecutiveAttendanceDays(prev => ({ ...prev, [walletAddress]: personalData.consecutiveDays }));
    setPersonalCalendarDates(prev => ({ ...prev, [walletAddress]: personalData.calendarDate }));
    
    console.log(`✅ 개인별 데이터 복원 완료: ${walletAddress} - ${backupKey}`);
    return true;
  } catch (error) {
    console.error(`❌ 개인별 데이터 복원 실패: ${walletAddress}`, error);
    return false;
  }
};

/**
 * ====================================================================================
 * 총 52개의 개인별/개개인별/개인용 관련 코드 섹션 완료
 * 
 * 주요 기능:
 * 1. 개인별 추천인 보너스 계산
 * 2. 개개인별 마이닝 보너스 모달 관리
 * 3. 개인별 출석 데이터 관리
 * 4. 개인별 락업 보너스 계산
 * 5. 개인별 가맹점 보너스 계산
 * 6. 개인별 데이터 저장/로드/백업/복원
 * 7. 개인별 추천코드 관리 시스템
 * 8. 개인별 마이닝 상태 관리
 * 9. 개인별 모달 상태 관리
 * 10. 개인별 달력 관리
 * 
 * 모든 코드는 지갑 주소별로 독립적인 개인 데이터 관리를 위한 시스템입니다.
 * ====================================================================================
 */
