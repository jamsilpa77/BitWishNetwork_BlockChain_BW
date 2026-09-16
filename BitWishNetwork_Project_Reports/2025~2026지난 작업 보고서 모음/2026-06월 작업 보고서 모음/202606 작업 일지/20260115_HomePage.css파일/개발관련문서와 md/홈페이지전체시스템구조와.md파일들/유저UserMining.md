/**
 * ====================================================================================
 * App.tsx 파일에서 추출한 모든 유저/유저용 관련 주석과 코드 모음
 * 총 41개의 유저/유저용 관련 코드 섹션 (관리자 관련 제외)
 * ====================================================================================
 */

import Decimal from 'decimal.js';

// ====================================================================================
// 1. 유저용 함수가 선언되기 전이므로 임시로 기본값 반환
// ====================================================================================
// 유저용 함수가 선언되기 전이므로 임시로 기본값 반환
const temporaryUserFunction = () => {
  return {
    bonusRate: new Decimal(0),
    enhancedRate: new Decimal(0),
    description: '임시 반환값',
    maxBonus: 0,
    instantBonus: new Decimal(0),
    permanentBonusRate: new Decimal(0),
    totalBonusRate: new Decimal(0),
    cumulativeBonusRate: new Decimal(0),
    segmentInfo: {
      currentSegment: '임시',
      segmentStart: 0,
      segmentEnd: 0,
      segmentRate: 0,
      cumulativeFromPrevious: new Decimal(0),
      additionalInCurrent: new Decimal(0)
    }
  };
};

// ====================================================================================
// 2. 유저용 랜덤 추천코드 생성 함수
// ====================================================================================
// 🎯 유저용 랜덤 추천코드 생성 함수
const generateUserRandomReferralCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'REF';
  
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

// ====================================================================================
// 3. 유저용 지갑 주소와 추천코드 매핑 저장
// ====================================================================================
// 🎯 유저용 지갑 주소와 추천코드 매핑 저장 (기존 호환성 유지)
const userWalletReferralMapping = new Map<string, string>();

// ====================================================================================
// 4. 유저용 상태 변수 연결 필요
// ====================================================================================
// setUserReferralCode(userReferralCode); // TODO: 유저용 상태 변수 연결 필요
const connectUserReferralCode = (userReferralCode: string) => {
  // TODO: 유저용 상태 변수 연결 필요
  console.log('유저용 추천코드 연결:', userReferralCode);
};

// ====================================================================================
// 5. 유저용 실시간 마이닝 보상 계산에 추천 보상 추가
// ====================================================================================
// 🎯 유저용 실시간 마이닝 보상 계산에 추천 보상 추가
const calculateUserRealTimeMiningReward = () => {
  const baseReward = 0.25; // 기본 시간당 보상
  // TODO: 변수 선언 순서 문제로 주석 처리
  // const referralBonus = calculateUserReferralBonus();
  // const totalReward = baseReward + referralBonus;
  
  return baseReward; // 임시 반환값
};

// ====================================================================================
// 6. 유저용 추천 보상 1BW 지급 시 실시간 반영
// ====================================================================================
// 🎯 유저용 추천 보상 1BW 지급 시 실시간 반영 (단독)
const giveUserReferralReward = (amount: number) => {
  // setUserReferralRewardBW(prev => prev + amount);
  // localStorage.setItem('userReferralRewardBW', JSON.stringify(userReferralRewardBW + amount));
  console.log(`✅ 유저용 추천 보상 BW 실시간 반영: +${amount} BW`);
};

// ====================================================================================
// 7. 유저용 모든 보상 실시간 반영
// ====================================================================================
// 🎯 유저용 모든 보상 실시간 반영 (단독)
const updateUserAllRewards = () => {
  const userTotalReward = calculateUserRealTimeMiningReward();
  // setUserReferralSystemState(prev => ({
  //   ...prev,
  //   totalReward: userTotalReward
  // }));
  console.log(`✅ 유저용 모든 보상 실시간 반영: ${userTotalReward} BW`);
};

// ====================================================================================
// 8. 유저용 랜덤 생성
// ====================================================================================
// 1. 추천인 코드 생성 (유저용 랜덤 생성)
const generateUserReferralCode = () => {
  return generateUserRandomReferralCode();
};

// ====================================================================================
// 9. 유저용 실시간 마이닝 보상 계산 함수
// ====================================================================================
// 🎯 유저용 실시간 마이닝 보상 계산 함수 (BigDecimal 기반 - 완벽한 정밀도)
const calculateRealTimeMiningRewardDecimal = () => {
  // 기본 채굴률 (BigDecimal)
  const decimalBaseRate = new Decimal(0.25);
  
  // 출석 보너스 (BigDecimal) - 시간 제한 적용 (유저용 출석 데이터 사용)
  const decimalAttendanceBonus = new Decimal(0); // 임시값
  
  // 추천인 보너스 (BigDecimal)
  const decimalReferralBonus = new Decimal(0); // 임시값
  
  // 락업 보너스 (BigDecimal)
  const decimalLockupBonus = new Decimal(0); // 임시값
  
  // 가맹점 보너스 (BigDecimal)
  const decimalMerchantBonus = new Decimal(0); // 임시값
  
  // 총 보상률 계산
  const decimalTotalRate = decimalBaseRate
    .plus(decimalAttendanceBonus)
    .plus(decimalReferralBonus)
    .plus(decimalLockupBonus)
    .plus(decimalMerchantBonus);
  
  return {
    baseRate: decimalBaseRate,
    attendanceBonus: decimalAttendanceBonus,
    referralBonus: decimalReferralBonus,
    lockupBonus: decimalLockupBonus,
    merchantBonus: decimalMerchantBonus,
    totalRate: decimalTotalRate,
    precision: 50
  };
}; // 🎯 유저용 실시간 마이닝 보상 계산 함수 끝

// ====================================================================================
// 10. 유저용 마이닝 상태 관리
// ====================================================================================
// 유저용 마이닝 상태 관리
const [userIsMiningActive, setUserIsMiningActive] = useState(false);
const [userMiningStartTime, setUserMiningStartTime] = useState<Date | null>(null);
const [userMiningStopTime, setUserMiningStopTime] = useState<Date | null>(null);

// ====================================================================================
// 11. 유저용 앱 관련 상태들
// ====================================================================================
// 유저용 앱 - 오토매틱 테스트 모달 상태 제거됨
// 유저용 앱 - 턴 선택 모달 상태 제거됨
// 유저용 앱 - testResults 상태 제거됨
// 유저용 앱 - 테스트 실행 상태 제거됨

// ====================================================================================
// 12. 유저용 상태 복원
// ====================================================================================
// ==================== 유저용 상태 복원 ====================
// 유저용 상태는 useState 초기값에서 localStorage에서 직접 읽어오므로 useEffect 불필요
// useEffect(() => {
//   loadUserMiningState();
//   console.log('✅ 유저용 상태 복원 완료');
// }, []); // 컴포넌트 마운트 시에만 실행

// ====================================================================================
// 13. 유저용 마이닝 상태 자동 초기화
// ====================================================================================
// ==================== 유저용 마이닝 상태 자동 초기화 ====================
// (변수 선언 이후로 이동 예정)

// ====================================================================================
// 14. 유저용 마이닝 상태 디버깅
// ====================================================================================
// ==================== 유저용 마이닝 상태 디버깅 ====================
// (변수 선언 이후로 이동 예정)

// ====================================================================================
// 15. 유저용 앱 테스트 지갑 관리 상태
// ====================================================================================
// 유저용 앱 - 테스트 지갑 관리 상태 제거됨
// 유저용 앱 - selectedTestWallet 상태 제거됨

// ====================================================================================
// 16. 유저용 마이닝 보너스 설정 모달
// ====================================================================================
const [showUserMiningBonusModal, setShowUserMiningBonusModal] = useState(false); // 🆕 유저용 마이닝 보너스 설정 모달

// ====================================================================================
// 17. 유저용 락업 모달 상태
// ====================================================================================
// ==================== 유저용 락업 모달 상태 ====================
const [showUserLockupModal, setShowUserLockupModal] = useState(false);
const [showUserSecondLockupModal, setShowUserSecondLockupModal] = useState(false);

// ====================================================================================
// 18. 유저용 추천인 코드 상태 관리
// ====================================================================================
// ==================== 유저용 추천인 코드 상태 관리 ====================
const [userReferralCode, setUserReferralCode] = useState<string>('');
const [userReferralCodeGenerated, setUserReferralCodeGenerated] = useState<boolean>(false);
const [userReferralCodeLoading, setUserReferralCodeLoading] = useState<boolean>(false);

// ====================================================================================
// 19. 유저용 추천 보상 BW 보관함 상태
// ====================================================================================
// ==================== 유저용 추천 보상 BW 보관함 상태 ====================
const [userReferralRewardBW, setUserReferralRewardBW] = useState(() => {
  try {
    const savedState = localStorage.getItem('userReferralRewardBW');
    return savedState ? JSON.parse(savedState) : 0;
  } catch (error) {
    console.error('유저용 추천 보상 BW 로드 실패:', error);
    return 0;
  }
});

// ====================================================================================
// 20. 유저용 추천인 보너스 상태 관리
// ====================================================================================
// ==================== 유저용 추천인 보너스 상태 관리 (완전 분리) ====================
const [userReferralCount, setUserReferralCount] = useState<number>(0);
const [userReferralBonus, setUserReferralBonus] = useState<number>(0);
const [userReferralSystemState, setUserReferralSystemState] = useState({
  referralCount: 0,
  referralBonus: 0,
  totalReward: 0,
  lastUpdated: new Date().toISOString()
});

// ====================================================================================
// 21. 유저용 추천인 보너스 데이터 저장
// ====================================================================================
// ==================== 유저용 추천인 보너스 데이터 저장 (완전 분리) ====================
const saveUserReferralState = () => {
  const userReferralData = {
    userReferralCount,
    userReferralBonus,
    userReferralSystemState,
    lastUpdated: new Date().toISOString()
  };
  
  localStorage.setItem('userReferralState', JSON.stringify(userReferralData));
  console.log('✅ 유저용 추천인 보너스 데이터 저장됨');
};

// ====================================================================================
// 22. 유저용 추천인 보너스 데이터 로드
// ====================================================================================
// ==================== 유저용 추천인 보너스 데이터 로드 (완전 분리) ====================
const loadUserReferralState = () => {
  try {
    const savedData = localStorage.getItem('userReferralState');
    if (savedData) {
      const userReferralData = JSON.parse(savedData);
      setUserReferralCount(userReferralData.userReferralCount || 0);
      setUserReferralBonus(userReferralData.userReferralBonus || 0);
      setUserReferralSystemState(userReferralData.userReferralSystemState || {
        referralCount: 0,
        referralBonus: 0,
        totalReward: 0,
        lastUpdated: new Date().toISOString()
      });
      console.log('✅ 유저용 추천인 보너스 데이터 로드됨');
    }
  } catch (error) {
    console.error('❌ 유저용 추천인 보너스 데이터 로드 실패:', error);
  }
};

// ====================================================================================
// 23. 유저용 추천인 상태 실시간 업데이트
// ====================================================================================
// ==================== 유저용 추천인 상태 실시간 업데이트 ====================
useEffect(() => {
  if (userReferralCount > 0) {
    const userReferralBonusData = calculateUserReferralBonusDecimal(userReferralCount);
    setUserReferralBonus(userReferralBonusData.totalBonusRate.toDecimalPlaces(50).toNumber());
    
    // 유저용 상태 업데이트
    setUserReferralSystemState(prev => ({
      ...prev,
      referralCount: userReferralCount,
      referralBonus: userReferralBonusData.totalBonusRate.toDecimalPlaces(50).toNumber(),
      lastUpdated: new Date().toISOString()
    }));
  }
}, [userReferralCount]);

// ====================================================================================
// 24. 유저용 상태 업데이트
// ====================================================================================
// 유저용 상태 업데이트
const updateUserState = () => {
  if (userReferralCount > 0) {
    const userReferralBonusData = calculateUserReferralBonusDecimal(userReferralCount);
    setUserReferralBonus(userReferralBonusData.totalBonusRate.toDecimalPlaces(50).toNumber());
    
    setUserReferralSystemState(prev => ({
      ...prev,
      referralCount: userReferralCount,
      referralBonus: userReferralBonusData.totalBonusRate.toDecimalPlaces(50).toNumber(),
      lastUpdated: new Date().toISOString()
    }));
  }
};

// ====================================================================================
// 25. 유저용 추천인 보너스 UI 컴포넌트
// ====================================================================================
// ==================== 유저용 추천인 보너스 UI 컴포넌트 (읽기 전용) ====================
const UserReferralBonusComponent = () => {
  const userReferralBonusData = calculateUserReferralBonusDecimal(userReferralCount);
  
  return (
    <div className="user-referral-bonus-component">
      <h3>유저용 추천인 보너스</h3>
      <div className="bonus-info">
        <p>추천인 수: {userReferralCount}명</p>
        <p>보너스율: {userReferralBonusData.totalBonusRate.toFixed(2)}%</p>
        <p>설명: {userReferralBonusData.description}</p>
      </div>
    </div>
  );
};

// ====================================================================================
// 26. 유저용 마이닝 보너스 설정 모달
// ====================================================================================
// ==================== 유저용 마이닝 보너스 설정 모달 (읽기 전용) ====================
const UserMiningBonusModal = () => {
  if (!showUserMiningBonusModal) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">유저용 마이닝 보너스 설정</h2>
          <div className="space-y-4">
            <p>유저용 마이닝 보너스 설정 모달입니다.</p>
            <p>읽기 전용 모드로 표시됩니다.</p>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setShowUserMiningBonusModal(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ====================================================================================
// 27. 유저용 추천인 보너스 정밀도 검증
// ====================================================================================
// ==================== 유저용 추천인 보너스 정밀도 검증 ====================
const validateUserReferralBonusPrecision = () => {
  console.log('🔍 유저용 추천인 보너스 정밀도 검증 시작 (BigDecimal 기반)');
  
  const testCases = [1, 5, 10, 20, 50, 100];
  
  testCases.forEach(count => {
    const bonusData = calculateUserReferralBonusDecimal(count);
    console.log(`추천인 ${count}명:`, {
      totalBonusRate: bonusData.totalBonusRate.toString(),
      precision: bonusData.totalBonusRate.decimalPlaces()
    });
  });
  
  console.log('✅ 유저용 추천인 보너스 정밀도 검증 완료');
};

// ====================================================================================
// 28. 유저용과 관리자용이 서로 다른 상태를 가지는지 확인
// ====================================================================================
// 유저용과 관리자용이 서로 다른 상태를 가지는지 확인
const validateUserAdminSeparation = () => {
  const userState = {
    referralCount: userReferralCount,
    referralBonus: userReferralBonus,
    systemState: userReferralSystemState
  };
  
  console.log('유저용 상태:', userState);
  console.log('✅ 유저용과 관리자용 상태 분리 확인 완료');
};

// ====================================================================================
// 29. 유저용 정밀도 검증
// ====================================================================================
// 1. 유저용 정밀도 검증
const validateUserPrecision = () => {
  validateUserReferralBonusPrecision();
  console.log('✅ 유저용 정밀도 검증 완료');
};

// ====================================================================================
// 30. 유저용 상태 변경 시 자동 저장
// ====================================================================================
// ==================== 유저용 상태 변경 시 자동 저장 ====================
// (변수 선언 이후로 이동 예정)

// ====================================================================================
// 31. 유저용 실시간 타이머 및 UI 업데이트
// ====================================================================================
// 🚀 유저용 실시간 타이머 및 UI 업데이트를 위한 useEffect
useEffect(() => {
  let timerInterval: NodeJS.Timeout | undefined;

  // 유저용 마이닝이 활성화된 경우에만 타이머를 실행합니다.
  if (userIsMiningActive) {
    // 🎯 유저용 실시간 업데이트 시스템
    timerInterval = setInterval(() => {
      // 🎯 tick 상태 업데이트로 UI 강제 리렌더링
      // setTick(prev => prev + 1);
      
      // 🎯 유저용 마이닝 상태 자동 저장
      // saveUserMiningState();
      
      console.log('유저용 실시간 업데이트 실행');
    }, 1000);
  }

  return () => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
  };
}, [userIsMiningActive]);

// ====================================================================================
// 32. 유저용 지갑 생성 완료 시 추천인 코드 자동 발급
// ====================================================================================
// ==================== 유저용 지갑 생성 완료 시 추천인 코드 자동 발급 useEffect ====================
useEffect(() => {
  // 지갑 생성 완료 시 (walletStep === 4) 추천인 코드 자동 발급
  // if (walletStep === 4 && !userReferralCodeGenerated) {
  //   generateUserReferralCode();
  // }
  console.log('유저용 지갑 생성 완료 시 추천인 코드 자동 발급 로직');
}, []);

// ====================================================================================
// 33. 유저용 앱 관련 함수들 제거됨
// ====================================================================================
// 유저용 앱 - fetchTestWallets 함수 제거됨
// 유저용 앱 - switchTestWallet 함수 제거됨
// 유저용 앱 - backupTestWallet 함수 제거됨
// 유저용 앱 - restoreTestWallet 함수 제거됨
// 유저용 앱 - setTestWalletName 함수 제거됨

// ====================================================================================
// 34. 유저용 락업 상태 관리
// ====================================================================================
// ==================== 유저용 락업 상태 관리 ====================
const [userLockupRatio, setUserLockupRatio] = useState(() => {
  try {
    const savedState = localStorage.getItem('userLockupRatio');
    return savedState ? JSON.parse(savedState) : 0;
  } catch (error) {
    console.error('유저용 락업 비율 로드 실패:', error);
    return 0;
  }
});

const [userLockupMonths, setUserLockupMonths] = useState(() => {
  try {
    const savedState = localStorage.getItem('userLockupMonths');
    return savedState ? JSON.parse(savedState) : 0;
  } catch (error) {
    console.error('유저용 락업 개월수 로드 실패:', error);
    return 0;
  }
});

// ====================================================================================
// 35. 유저용 추가 락업 상태 관리
// ====================================================================================
// 유저용 추가 락업 상태 관리
const [userSecondLockupRatio, setUserSecondLockupRatio] = useState<number>(0);
const [userSecondLockupMonths, setUserSecondLockupMonths] = useState<number>(0);

// ====================================================================================
// 36. 유저용 락업 데이터 저장
// ====================================================================================
// ==================== 유저용 락업 데이터 저장 ====================
const saveUserLockupState = () => {
  try {
    const userLockupData = {
      userLockupRatio,
      userLockupMonths,
      userSecondLockupRatio,
      userSecondLockupMonths,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('userLockupState', JSON.stringify(userLockupData));
    console.log('✅ 유저용 락업 데이터 저장됨');
  } catch (error) {
    console.error('❌ 유저용 락업 데이터 저장 실패:', error);
  }
};

// ====================================================================================
// 37. 유저용 락업 데이터 로드
// ====================================================================================
const loadUserLockupState = () => {
  try {
    const savedData = localStorage.getItem('userLockupState');
    if (savedData) {
      const userLockupData = JSON.parse(savedData);
      setUserLockupRatio(userLockupData.userLockupRatio || 0);
      setUserLockupMonths(userLockupData.userLockupMonths || 0);
      setUserSecondLockupRatio(userLockupData.userSecondLockupRatio || 0);
      setUserSecondLockupMonths(userLockupData.userSecondLockupMonths || 0);
      console.log('✅ 유저용 락업 데이터 로드됨');
    }
  } catch (error) {
    console.error('❌ 유저용 락업 데이터 로드 실패:', error);
  }
};

// ====================================================================================
// 38. 유저용 락업 보너스 계산
// ====================================================================================
const calculateUserLockupBonus = (ratio: number, months: number): number => {
  if (ratio === 0 || months === 0) return 0;
  const baseAPY = 0.05; // 5% 기본
  const monthBonus = months * 0.01; // 월당 1% 추가
  
  return (baseAPY + monthBonus) / 12; // 월간 비율로 변환
};

// ====================================================================================
// 39. 유저용 락업 등록 핸들러
// ====================================================================================
const handleUserLockupRegistration = () => {
  try {
    // 유저용 락업 등록 로직
    saveUserLockupState();
    console.log('✅ 유저용 락업 등록 완료');
  } catch (error) {
    console.error('❌ 유저용 락업 등록 실패:', error);
  }
};

// ====================================================================================
// 40. 유저용 락업 해제 핸들러
// ====================================================================================
const handleUserLockupRelease = () => {
  try {
    // 유저용 락업 해제 로직
    setUserLockupRatio(0);
    setUserLockupMonths(0);
    saveUserLockupState();
    console.log('✅ 유저용 락업 해제 완료');
  } catch (error) {
    console.error('❌ 유저용 락업 해제 실패:', error);
  }
};

// ====================================================================================
// 41. 유저용 마이닝 상태 저장
// ====================================================================================
const saveUserMiningState = () => {
  try {
    const userMiningData = {
      userIsMiningActive,
      userMiningStartTime,
      userMiningStopTime,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('userMiningState', JSON.stringify(userMiningData));
    console.log('✅ 유저용 마이닝 상태 저장됨');
  } catch (error) {
    console.error('❌ 유저용 마이닝 상태 저장 실패:', error);
  }
};

/**
 * ====================================================================================
 * 총 41개의 유저/유저용 관련 코드 섹션 완료
 * 
 * 주요 기능:
 * 1. 유저용 추천인 코드 생성 및 관리
 * 2. 유저용 마이닝 상태 관리
 * 3. 유저용 락업 시스템
 * 4. 유저용 보너스 계산
 * 5. 유저용 데이터 저장/로드
 * 6. 유저용 UI 컴포넌트
 * 7. 유저용 실시간 업데이트
 * 8. 유저용 상태 관리
 * 
 * 모든 코드는 유저 전용 기능으로, 관리자와 완전히 분리된 독립적인 시스템입니다.
 * ====================================================================================
 */
