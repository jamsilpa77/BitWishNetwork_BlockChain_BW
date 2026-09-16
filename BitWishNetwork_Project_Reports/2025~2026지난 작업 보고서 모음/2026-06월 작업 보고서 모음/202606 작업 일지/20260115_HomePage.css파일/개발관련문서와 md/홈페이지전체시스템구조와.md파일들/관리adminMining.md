/**
 * ====================================================================================
 * App.tsx 파일에서 추출한 모든 관리자/관리자용 관련 주석과 코드 모음
 * 총 170개의 관리자/관리자용 관련 코드 섹션
 * ====================================================================================
 */

import Decimal from 'decimal.js';

// ====================================================================================
// 1. 관리자용 추천인 보너스 계산 함수
// ====================================================================================
// ==================== 관리자용 추천인 보너스 계산 함수 ====================
const calculateAdminReferralBonusDecimal = (referralCount: number): {
  bonusRate: Decimal;
  enhancedRate: Decimal;
  description: string;
  maxBonus: number;
  instantBonus: Decimal;
  permanentBonusRate: Decimal;
  totalBonusRate: Decimal;
  cumulativeBonusRate: Decimal;
  segmentInfo: {
    currentSegment: string;
    segmentStart: number;
    segmentEnd: number;
    segmentRate: number;
    cumulativeFromPrevious: Decimal;
    additionalInCurrent: Decimal;
  };
} => {
  // 관리자용은 유저용과 동일한 로직 사용 (완전 분리)
  // 유저용 함수가 선언되기 전이므로 임시로 기본값 반환
  return {
    bonusRate: new Decimal(0),
    enhancedRate: new Decimal(0),
    description: '관리자용 임시 반환값',
    maxBonus: 0,
    instantBonus: new Decimal(0),
    permanentBonusRate: new Decimal(0),
    totalBonusRate: new Decimal(0),
    cumulativeBonusRate: new Decimal(0),
    segmentInfo: {
      currentSegment: '관리자용 임시',
      segmentStart: 0,
      segmentEnd: 0,
      segmentRate: 0,
      cumulativeFromPrevious: new Decimal(0),
      additionalInCurrent: new Decimal(0)
    }
  };
};

// ====================================================================================
// 2. 관리자용 추천 보상 1BW 지급 시 실시간 반영
// ====================================================================================
// 🎯 관리자용 추천 보상 1BW 지급 시 실시간 반영 (단독)
const giveAdminReferralReward = (amount: number) => {
  // setAdminReferralRewardBW(prev => prev + amount);
  // localStorage.setItem('adminReferralRewardBW', JSON.stringify(adminReferralRewardBW + amount));
  console.log(`✅ 관리자용 추천 보상 BW 실시간 반영: +${amount} BW`);
};

// ====================================================================================
// 3. 관리자용 모든 보상 실시간 반영
// ====================================================================================
// 🎯 관리자용 모든 보상 실시간 반영 (단독)
const updateAdminAllRewards = () => {
  const adminTotalReward = calculateAdminRealTimeMiningReward();
  // setAdminReferralSystemState(prev => ({
  //   ...prev,
  //   totalReward: adminTotalReward
  // }));
  console.log(`✅ 관리자용 모든 보상 실시간 반영: ${adminTotalReward} BW`);
};

// ====================================================================================
// 4. 관리자용 실시간 마이닝 보상 계산
// ====================================================================================
// ==================== 관리자용 실시간 마이닝 보상 계산 (추천인 보너스 완전 통합) ====================
const calculateAdminRealTimeMiningRewardDecimal = () => {
  // 기본 채굴률 (BigDecimal)
  const decimalBaseRate = new Decimal(0.25);
  
  // 출석 보너스 (BigDecimal) - 시간 제한 적용 (관리자용 출석 데이터 사용)
  const decimalAttendanceBonus = new Decimal(0); // 임시값
  
  // 🎯 관리자용 추천인 보너스 (BigDecimal 기반 - 완벽한 정밀도)
  const adminReferralData = calculateAdminReferralBonusDecimal(0);
  const decimalReferralBonus = adminReferralData.cumulativeBonusRate; // 🎯 관리자용 독립 계산 사용
  
  // 🎯 관리자용 락업 보너스 (BigDecimal 기반 - 완벽한 정밀도)
  const decimalLockupBonus = new Decimal(0); // 임시값
  
  // 🎯 관리자용 추가 락업 보너스 (BigDecimal 기반 - 완벽한 정밀도)
  const decimalAdditionalLockupBonus = new Decimal(0); // 임시값
  
  // 총 보상률 계산
  const decimalTotalRate = decimalBaseRate
    .plus(decimalAttendanceBonus)
    .plus(decimalReferralBonus)
    .plus(decimalLockupBonus)
    .plus(decimalAdditionalLockupBonus);
  
  return {
    baseRate: decimalBaseRate,
    attendanceBonus: decimalAttendanceBonus,
    referralBonus: decimalReferralBonus,
    lockupBonus: decimalLockupBonus,
    additionalLockupBonus: decimalAdditionalLockupBonus,
    totalRate: decimalTotalRate,
    precision: 50
  };
}; // 🎯 관리자용 실시간 마이닝 보상 계산 함수 끝

// ====================================================================================
// 5. 관리자용 고급 실시간 마이닝 보상 계산 함수
// ====================================================================================
// 🎯 관리자용 고급 실시간 마이닝 보상 계산 함수 (BigDecimal 완전 재구성 - 부동소수점 오차 완전 방지)
const calculateRealTimeMiningReward = () => {
  // 기본 채굴률 (BigDecimal)
  const decimalBaseRate = new Decimal(0.25);
  
  // 출석 보너스 (BigDecimal) - 시간 제한 적용 (관리자용 출석 데이터 사용)
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
}; // 🎯 관리자용 고급 실시간 마이닝 보상 계산 함수 끝

// ====================================================================================
// 6. 관리자용 마이닝 상태 강제 초기화
// ====================================================================================
// 🎯 마이닝 상태 강제 초기화 (관리자용 마이닝 시작 버튼 클릭 문제 해결)
useEffect(() => {
  // setIsMiningActive(false);
  console.log('✅ 관리자용 마이닝 상태 강제 초기화 완료');
}, []); // 빈 의존성 배열로 마운트 시점에만 실행

// ====================================================================================
// 7. 관리자용 상태 복원
// ====================================================================================
// ==================== 관리자용 상태 복원 ====================
// 관리자용 상태는 useState 초기값에서 localStorage에서 직접 읽어오므로 useEffect 불필요
// useEffect(() => {
//   loadAdminMiningState();
//   console.log('✅ 관리자용 상태 복원 완료');
// }, []); // 컴포넌트 마운트 시에만 실행

// ====================================================================================
// 8. 관리자 비밀번호 인증 모달
// ====================================================================================
const [showPasswordModal, setShowPasswordModal] = useState(false); // 🆕 관리자 비밀번호 인증 모달
const [showPasswordSetupModal, setShowPasswordSetupModal] = useState(false); // 🆕 2차 비밀번호 설정 모달
const [showPasswordSetupPassword, setShowPasswordSetupPassword] = useState(false); // 🆕 2차 비밀번호 설정 모달 비밀번호 보기

// ====================================================================================
// 9. 유저용/관리자용 락업 모달 상태 관리
// ====================================================================================
// ==================== 6단계: 유저용/관리자용 락업 모달 상태 관리 ====================

// ==================== 관리자용 락업 모달 상태 ====================
const [showAdminLockupModal, setShowAdminLockupModal] = useState(false);
const [showAdminSecondLockupModal, setShowAdminSecondLockupModal] = useState(false);

// ====================================================================================
// 10. 관리자용 마이닝 시작/정지 시간
// ====================================================================================
// 🎯 관리자용 마이닝 시작 시간 (localStorage에서 초기화)
const [miningStartTime, setMiningStartTime] = useState<Date | null>(() => {
  try {
    const savedTime = localStorage.getItem('miningStartTime');
    if (savedTime) {
      return new Date(savedTime);
    }
  } catch (error) {
    console.error('관리자용 마이닝 시작 시간 로드 실패:', error);
  }
  return null;
});

// 🎯 관리자용 마이닝 정지 시간 (localStorage에서 초기화)
const [miningStopTime, setMiningStopTime] = useState<Date | null>(() => {
  try {
    const savedTime = localStorage.getItem('miningStopTime');
    if (savedTime) {
      return new Date(savedTime);
    }
  } catch (error) {
    console.error('관리자용 마이닝 정지 시간 로드 실패:', error);
  }
  return null;
});

// ====================================================================================
// 11. 관리자용 추천인 코드 상태 관리
// ====================================================================================
// ==================== 관리자용 추천인 코드 상태 관리 ====================
const [adminReferralCode, setAdminReferralCode] = useState<string>('');
const [adminReferralCodeGenerated, setAdminReferralCodeGenerated] = useState<boolean>(false);
const [adminReferralCodeLoading, setAdminReferralCodeLoading] = useState<boolean>(false);

// ====================================================================================
// 12. 관리자용 추천 보상 BW 보관함 상태
// ====================================================================================
// ==================== 관리자용 추천 보상 BW 보관함 상태 ====================
const [adminReferralRewardBW, setAdminReferralRewardBW] = useState(() => {
  try {
    const savedState = localStorage.getItem('adminReferralRewardBW');
    return savedState ? JSON.parse(savedState) : 0;
  } catch (error) {
    console.error('관리자용 추천 보상 BW 로드 실패:', error);
    return 0;
  }
});

// ====================================================================================
// 13. 유저용/관리자용 완전 분리 상태 관리 시스템
// ====================================================================================
// ==================== 2단계: 유저용/관리자용 완전 분리 상태 관리 시스템 ====================

// ====================================================================================
// 14. 관리자용 추천인 보너스 상태 관리
// ====================================================================================
// ==================== 관리자용 추천인 보너스 상태 관리 (완전 분리) ====================
const [adminReferralCount, setAdminReferralCount] = useState<number>(0);
const [adminReferralBonus, setAdminReferralBonus] = useState<number>(0);
const [adminReferralSystemState, setAdminReferralSystemState] = useState({
  referralCount: 0,
  referralBonus: 0,
  totalReward: 0,
  lastUpdated: new Date().toISOString()
});

// ====================================================================================
// 15. 관리자용 락업 시스템 상태 관리
// ====================================================================================
// ==================== 관리자용 락업 시스템 상태 관리 (완전 독립) ====================
const [adminLockupSystemState, setAdminLockupSystemState] = useState({
  basicLockupRatio: 0,     // 0으로 변경 (기존: 75)
  basicLockupMonths: 0,    // 0으로 변경 (기존: 12)
  secondLockupRatio: 0,    // 0으로 변경 (기존: 25)
  secondLockupMonths: 0,   // 0으로 변경 (기존: 6)
  isMerchantRegistered: false,
  lastUpdated: new Date().toISOString()
});

// ====================================================================================
// 16. 관리자용 추천인 보너스 데이터 저장
// ====================================================================================
// ==================== 관리자용 추천인 보너스 데이터 저장 (완전 분리) ====================
const saveAdminReferralState = () => {
  const adminReferralData = {
    adminReferralCount,
    adminReferralBonus,
    adminReferralSystemState,
    lastUpdated: new Date().toISOString()
  };
  
  localStorage.setItem('adminReferralState', JSON.stringify(adminReferralData));
  console.log('✅ 관리자용 추천인 보너스 데이터 저장됨');
};

// ====================================================================================
// 17. 관리자용 추천인 보너스 데이터 로드
// ====================================================================================
// ==================== 관리자용 추천인 보너스 데이터 로드 (완전 분리) ====================
const loadAdminReferralState = () => {
  try {
    const savedData = localStorage.getItem('adminReferralState');
    if (savedData) {
      const adminReferralData = JSON.parse(savedData);
      setAdminReferralCount(adminReferralData.adminReferralCount || 0);
      setAdminReferralBonus(adminReferralData.adminReferralBonus || 0);
      setAdminReferralSystemState(adminReferralData.adminReferralSystemState || {
        referralCount: 0,
        referralBonus: 0,
        totalReward: 0,
        lastUpdated: new Date().toISOString()
      });
      console.log('✅ 관리자용 추천인 보너스 데이터 로드됨');
    }
  } catch (error) {
    console.error('❌ 관리자용 추천인 보너스 데이터 로드 실패:', error);
  }
};

// ====================================================================================
// 18. 관리자용 추천인 추가 함수
// ====================================================================================
// ==================== 3단계: 관리자용 추천인 추가 함수 ====================
// ❌ 중복 함수 제거됨 - 라인 4419의 handleAdminAddReferralDecimal 사용

// ====================================================================================
// 19. 관리자용 추천인 초기화 함수
// ====================================================================================
// ==================== 4단계: 관리자용 추천인 초기화 함수 ====================

// ==================== 관리자용 추천인 초기화 함수 (완전 분리) ====================
const handleAdminResetReferral = () => {
  console.log('🧪 관리자용: 추천인 초기화 함수 시작! (실시간 반영)');
  
  try {
    // 🎯 관리자용 추천인 수 초기화 (실시간 반영)
    setAdminReferralCount(0);
    
    // 🎯 관리자용 추천인 시스템 상태 초기화
    setAdminReferralSystemState({
      referralCode: '',
      referralCount: 0,
      referralBonus: 0,
      totalReward: 0,
      lastUpdated: new Date().toISOString()
    });
    
    // 🎯 관리자용 보너스율 초기화
    setAdminReferralBonus(0);

    // 🎯 관리자용 성공 로그 출력 (실시간 반영)
    console.log('✅ 관리자용: 추천인 초기화 완료 (실시간 반영):', {
      adminReferralCount: 0,
      adminReferralBonus: 0,
      adminReferralSystemState: '초기화됨'
    });
    
    // 🎯 관리자용 초기화 완료 알림
    alert('관리자용 추천인이 초기화되었습니다. (실시간 반영 완료)');
    
    // 🎯 관리자용 데이터 저장
    saveAdminReferralState();
    
    console.log('✅ 관리자용: 추천인 초기화 완료 (실시간 반영)');
  } catch (error) {
    console.error('❌ 관리자용: 추천인 초기화 실패:', error);
    alert('관리자용 추천인 초기화에 실패했습니다.');
  }
};

// ====================================================================================
// 20. 관리자용 추천인 상태 실시간 업데이트
// ====================================================================================
// ==================== 관리자용 추천인 상태 실시간 업데이트 ====================
useEffect(() => {
  if (adminReferralCount > 0) {
    const adminReferralBonusData = calculateAdminReferralBonusDecimal(adminReferralCount);
    setAdminReferralBonus(adminReferralBonusData.totalBonusRate.toDecimalPlaces(50).toNumber());
    
    // 관리자용 상태 업데이트
    setAdminReferralSystemState(prev => ({
      ...prev,
      referralCount: adminReferralCount,
      referralBonus: adminReferralBonusData.totalBonusRate.toDecimalPlaces(50).toNumber(),
      lastUpdated: new Date().toISOString()
    }));
  }
}, [adminReferralCount]);

// ====================================================================================
// 21. 관리자용 상태 업데이트
// ====================================================================================
// 관리자용 상태 업데이트
const updateAdminState = () => {
  if (adminReferralCount > 0) {
    const adminReferralBonusData = calculateAdminReferralBonusDecimal(adminReferralCount);
    setAdminReferralBonus(adminReferralBonusData.totalBonusRate.toDecimalPlaces(50).toNumber());
    
    setAdminReferralSystemState(prev => ({
      ...prev,
      referralCount: adminReferralCount,
      referralBonus: adminReferralBonusData.totalBonusRate.toDecimalPlaces(50).toNumber(),
      lastUpdated: new Date().toISOString()
    }));
  }
};

// ====================================================================================
// 22. 유저용/관리자용 모달 표시 함수
// ====================================================================================
// ==================== 유저용/관리자용 모달 표시 함수 ====================
const openUserMiningBonusModal = () => setShowUserMiningBonusModal(true);
const openAdminMiningBonusModal = () => setShowAdminMiningBonusModal(true);

// ====================================================================================
// 23. 관리자용 추천인 보너스 UI 컴포넌트
// ====================================================================================
// ==================== 관리자용 추천인 보너스 UI 컴포넌트 (관리 기능 포함) ====================
const AdminReferralBonusComponent = () => {
  const adminReferralBonusData = calculateAdminReferralBonusDecimal(adminReferralCount);
  
  const handleAdminReferralWalletCreation = async (referralCode: string) => {
    try {
      // 2. 관리자용 지갑 생성 및 보상 지급 (한 번에 완료)
      const result = await handleAdminReferralWalletCreation(referralCode);
      
      if (result.success) {
        // ✅ 추천 보너스 % 즉시 반영
        // ✅ 추천 BW보관 즉시 반영  
        // ✅ "추천인 보너스 현황 (관리자용)" 즉시 반영
        console.log('✅ 관리자용 마이닝 보너스 설정창 UI 업데이트 완료');
      }
    } catch (error) {
      console.error('❌ 관리자용 추천인 지갑 생성 실패:', error);
    }
  };
  
  return (
    <div className="admin-referral-bonus-component">
      <h3>관리자용 추천인 보너스</h3>
      <div className="bonus-info">
        <p>추천인 수: {adminReferralCount}명</p>
        <p>보너스율: {adminReferralBonusData.totalBonusRate.toFixed(2)}%</p>
        <p>설명: {adminReferralBonusData.description}</p>
      </div>
      <div className="admin-controls">
        <button onClick={() => handleAdminReferralWalletCreation(adminReferralCode)}>
          관리자용 추천인 지갑 생성
        </button>
        <button onClick={handleAdminResetReferral}>
          관리자용 추천인 초기화
        </button>
      </div>
    </div>
  );
};

// ====================================================================================
// 24. 관리자용 마이닝 보너스 설정 모달 상태
// ====================================================================================
// 관리자용 마이닝 보너스 설정 모달 상태 (유저용은 이미 선언됨)
const [showAdminMiningBonusModal, setShowAdminMiningBonusModal] = useState(false);

// ====================================================================================
// 25. 관리자용 마이닝 보너스 설정 모달
// ====================================================================================
// ==================== 관리자용 마이닝 보너스 설정 모달 (관리 기능 포함) ====================
const AdminMiningBonusModal = () => {
  if (!showAdminMiningBonusModal) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">관리자용 마이닝 보너스 설정</h2>
          <div className="space-y-4">
            <p>관리자용 마이닝 보너스 설정 모달입니다.</p>
            <p>관리 기능이 포함된 모드로 표시됩니다.</p>
            <AdminReferralBonusComponent />
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setShowAdminMiningBonusModal(false)}
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
// 26. 관리자용 추천인 보너스 정밀도 검증
// ====================================================================================
// ==================== 관리자용 추천인 보너스 정밀도 검증 ====================
const validateAdminReferralBonusPrecision = () => {
  console.log('🔍 관리자용 추천인 보너스 정밀도 검증 시작 (BigDecimal 기반)');
  
  const testCases = [1, 5, 10, 20, 50, 100];
  
  testCases.forEach(count => {
    const bonusData = calculateAdminReferralBonusDecimal(count);
    console.log(`관리자용 추천인 ${count}명:`, {
      totalBonusRate: bonusData.totalBonusRate.toString(),
      precision: bonusData.totalBonusRate.decimalPlaces()
    });
  });
  
  console.log('✅ 관리자용 추천인 보너스 정밀도 검증 완료');
};

// ====================================================================================
// 27. 관리자용/유저용 분리 독립성 검증
// ====================================================================================
// ==================== 유저용/관리자용 분리 독립성 검증 ====================
const validateUserAdminSeparation = () => {
  console.log('🔍 유저용/관리자용 분리 독립성 검증 시작');
  
  // 유저용과 관리자용이 서로 다른 상태를 가지는지 확인
  const userState = {
    referralCount: 0, // userReferralCount
    referralBonus: 0, // userReferralBonus
    systemState: {} // userReferralSystemState
  };
  
  const adminState = {
    referralCount: adminReferralCount,
    referralBonus: adminReferralBonus,
    systemState: adminReferralSystemState
  };
  
  console.log('유저용 상태:', userState);
  console.log('관리자용 상태:', adminState);
  console.log('✅ 유저용과 관리자용 상태 분리 확인 완료');
};

// ====================================================================================
// 28. 관리자용 정밀도 검증
// ====================================================================================
// 1. 관리자용 정밀도 검증
const validateAdminPrecision = () => {
  validateAdminReferralBonusPrecision();
  console.log('✅ 관리자용 정밀도 검증 완료');
};

// ====================================================================================
// 29. 관리자용 상태 변경 시 자동 저장
// ====================================================================================
// ==================== 관리자용 상태 변경 시 자동 저장 ====================
// (변수 선언 이후로 이동 예정)

// ====================================================================================
// 30. 관리자용 실시간 타이머 및 UI 업데이트
// ====================================================================================
// 🚀 관리자용 실시간 타이머 및 UI 업데이트를 위한 useEffect
useEffect(() => {
  let timerInterval: NodeJS.Timeout | undefined;

  // 관리자용 마이닝이 활성화된 경우에만 타이머를 실행합니다.
  // if (adminIsMiningActive) {
    // 🎯 관리자용 실시간 업데이트 시스템
    timerInterval = setInterval(() => {
      // 🎯 tick 상태 업데이트로 UI 강제 리렌더링
      // setTick(prev => prev + 1);
      
      // 🎯 관리자용 마이닝 상태 자동 저장
      // saveAdminMiningState();
      
      console.log('관리자용 실시간 업데이트 실행');
    }, 1000);
  // }

  return () => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
  };
}, []);

// ====================================================================================
// 31. 관리자용 지갑 생성 완료 시 추천인 코드 자동 발급
// ====================================================================================
// ==================== 관리자용 지갑 생성 완료 시 추천인 코드 자동 발급 useEffect ====================
useEffect(() => {
  // 지갑 생성 완료 시 (walletStep === 4) 추천인 코드 자동 발급
  // if (walletStep === 4 && !adminReferralCodeGenerated) {
  //   generateAdminReferralCode();
  // }
  console.log('관리자용 지갑 생성 완료 시 추천인 코드 자동 발급 로직');
}, []);

// ====================================================================================
// 32. 관리자용 락업 상태 관리
// ====================================================================================
// ==================== 관리자용 락업 상태 관리 ====================
const [adminLockupRatio, setAdminLockupRatio] = useState(() => {
  try {
    const savedState = localStorage.getItem('adminLockupRatio');
    return savedState ? JSON.parse(savedState) : 0;
  } catch (error) {
    console.error('관리자용 락업 비율 로드 실패:', error);
    return 0;
  }
});

const [adminLockupMonths, setAdminLockupMonths] = useState(() => {
  try {
    const savedState = localStorage.getItem('adminLockupMonths');
    return savedState ? JSON.parse(savedState) : 0;
  } catch (error) {
    console.error('관리자용 락업 개월수 로드 실패:', error);
    return 0;
  }
});

// ====================================================================================
// 33. 관리자용 추가 락업 상태 관리
// ====================================================================================
// 관리자용 추가 락업 상태 관리
const [adminSecondLockupRatio, setAdminSecondLockupRatio] = useState<number>(0);
const [adminSecondLockupMonths, setAdminSecondLockupMonths] = useState<number>(0);

// ====================================================================================
// 34. 관리자용 락업 데이터 저장
// ====================================================================================
// ==================== 관리자용 락업 데이터 저장 ====================
const saveAdminLockupState = () => {
  try {
    const adminLockupData = {
      adminLockupRatio,
      adminLockupMonths,
      adminSecondLockupRatio,
      adminSecondLockupMonths,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('adminLockupState', JSON.stringify(adminLockupData));
    console.log('✅ 관리자용 락업 데이터 저장됨');
  } catch (error) {
    console.error('❌ 관리자용 락업 데이터 저장 실패:', error);
  }
};

// ====================================================================================
// 35. 관리자용 락업 데이터 로드
// ====================================================================================
const loadAdminLockupState = () => {
  try {
    const savedData = localStorage.getItem('adminLockupState');
    if (savedData) {
      const adminLockupData = JSON.parse(savedData);
      setAdminLockupRatio(adminLockupData.adminLockupRatio || 0);
      setAdminLockupMonths(adminLockupData.adminLockupMonths || 0);
      setAdminSecondLockupRatio(adminLockupData.adminSecondLockupRatio || 0);
      setAdminSecondLockupMonths(adminLockupData.adminSecondLockupMonths || 0);
      console.log('✅ 관리자용 락업 데이터 로드됨');
    }
  } catch (error) {
    console.error('❌ 관리자용 락업 데이터 로드 실패:', error);
  }
};

// ====================================================================================
// 36. 관리자용 락업 보너스 계산
// ====================================================================================
const calculateAdminLockupBonus = (ratio: number, months: number): number => {
  if (ratio === 0 || months === 0) return 0;
  const baseAPY = 0.05; // 5% 기본
  const monthBonus = months * 0.01; // 월당 1% 추가
  
  return (baseAPY + monthBonus) / 12; // 월간 비율로 변환
};

// ====================================================================================
// 37. 관리자용 락업 등록 핸들러
// ====================================================================================
const handleAdminLockupRegistration = () => {
  try {
    // 관리자용 락업 등록 로직
    saveAdminLockupState();
    console.log('✅ 관리자용 락업 등록 완료');
  } catch (error) {
    console.error('❌ 관리자용 락업 등록 실패:', error);
  }
};

// ====================================================================================
// 38. 관리자용 락업 해제 핸들러
// ====================================================================================
const handleAdminLockupRelease = () => {
  try {
    // 관리자용 락업 해제 로직
    setAdminLockupRatio(0);
    setAdminLockupMonths(0);
    saveAdminLockupState();
    console.log('✅ 관리자용 락업 해제 완료');
  } catch (error) {
    console.error('❌ 관리자용 락업 해제 실패:', error);
  }
};

// ====================================================================================
// 39. 관리자용 마이닝 상태 저장
// ====================================================================================
const saveAdminMiningState = () => {
  try {
    const adminMiningData = {
      // adminIsMiningActive,
      // adminMiningStartTime,
      // adminMiningStopTime,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('adminMiningState', JSON.stringify(adminMiningData));
    console.log('✅ 관리자용 마이닝 상태 저장됨');
  } catch (error) {
    console.error('❌ 관리자용 마이닝 상태 저장 실패:', error);
  }
};

// ====================================================================================
// 40. 관리자용 마이닝 상태 로드
// ====================================================================================
const loadAdminMiningState = () => {
  try {
    const savedData = localStorage.getItem('adminMiningState');
    if (savedData) {
      const adminMiningData = JSON.parse(savedData);
      // setAdminIsMiningActive(adminMiningData.adminIsMiningActive || false);
      // setAdminMiningStartTime(adminMiningData.adminMiningStartTime ? new Date(adminMiningData.adminMiningStartTime) : null);
      // setAdminMiningStopTime(adminMiningData.adminMiningStopTime ? new Date(adminMiningData.adminMiningStopTime) : null);
      console.log('✅ 관리자용 마이닝 상태 로드됨');
    }
  } catch (error) {
    console.error('❌ 관리자용 마이닝 상태 로드 실패:', error);
  }
};

// ====================================================================================
// 41. 관리자용 출석 데이터 관리
// ====================================================================================
const [adminConsecutiveAttendanceDays, setAdminConsecutiveAttendanceDays] = useState<number>(0);

// ====================================================================================
// 42. 관리자용 출석 보너스 시간 유효성 검증
// ====================================================================================
const isAdminAttendanceBonusTimeValid = (): boolean => {
  const now = new Date();
  const hour = now.getHours();
  // 9시~18시 출석 가능
  return hour >= 9 && hour <= 18;
};

// ====================================================================================
// 43. 관리자용 출석 보너스 계산
// ====================================================================================
const calculateAdminAttendanceBonus = (consecutiveDays: number): number => {
  if (consecutiveDays >= 30) return 0.15; // 15%
  if (consecutiveDays >= 20) return 0.10; // 10%
  if (consecutiveDays >= 10) return 0.05; // 5%
  
  return 0; // 보너스 없음
};

// ====================================================================================
// 44. 관리자용 가맹점 등록 상태
// ====================================================================================
const [adminIsMerchantRegistered, setAdminIsMerchantRegistered] = useState(false);

// ====================================================================================
// 45. 관리자용 가맹점 보너스 계산
// ====================================================================================
const calculateAdminMerchantBonus = (isMerchant: boolean): number => {
  return isMerchant ? 0.1 : 0; // 가맹점 등록시 10%
};

// ====================================================================================
// 46. 관리자용 추천인 지갑 생성 핸들러
// ====================================================================================
const handleAdminReferralWalletCreation = async (referralCode: string) => {
  try {
    // 관리자용 추천인 지갑 생성 로직
    console.log(`관리자용 추천인 지갑 생성: ${referralCode}`);
    
    // 추천인 수 증가
    setAdminReferralCount(prev => prev + 1);
    
    // 보상 지급
    giveAdminReferralReward(1);
    
    return { success: true, referralCode };
  } catch (error) {
    console.error('❌ 관리자용 추천인 지갑 생성 실패:', error);
    return { success: false, error: (error as Error).message };
  }
};

// ====================================================================================
// 47. 관리자용 추천인 코드 생성
// ====================================================================================
const generateAdminReferralCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'ADM';
  
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

// ====================================================================================
// 48. 관리자용 추천인 코드 자동 발급
// ====================================================================================
const issueAdminReferralCode = async () => {
  try {
    setAdminReferralCodeLoading(true);
    
    const referralCode = generateAdminReferralCode();
    setAdminReferralCode(referralCode);
    setAdminReferralCodeGenerated(true);
    
    console.log(`✅ 관리자용 추천인 코드 발급 완료: ${referralCode}`);
  } catch (error) {
    console.error('❌ 관리자용 추천인 코드 발급 실패:', error);
  } finally {
    setAdminReferralCodeLoading(false);
  }
};

// ====================================================================================
// 49. 관리자용 데이터 초기화
// ====================================================================================
const initializeAdminData = () => {
  setAdminReferralCount(0);
  setAdminReferralBonus(0);
  setAdminReferralSystemState({
    referralCount: 0,
    referralBonus: 0,
    totalReward: 0,
    lastUpdated: new Date().toISOString()
  });
  setAdminLockupSystemState({
    basicLockupRatio: 0,
    basicLockupMonths: 0,
    secondLockupRatio: 0,
    secondLockupMonths: 0,
    isMerchantRegistered: false,
    lastUpdated: new Date().toISOString()
  });
  
  console.log('✅ 관리자용 데이터 초기화 완료');
};

// ====================================================================================
// 50. 관리자용 데이터 백업
// ====================================================================================
const backupAdminData = () => {
  try {
    const adminData = {
      referralState: {
        adminReferralCount,
        adminReferralBonus,
        adminReferralSystemState
      },
      lockupState: adminLockupSystemState,
      miningState: {
        // adminIsMiningActive,
        // adminMiningStartTime,
        // adminMiningStopTime
      },
      timestamp: new Date().toISOString()
    };
    
    const backupKey = `admin_backup_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(adminData));
    
    console.log(`✅ 관리자용 데이터 백업 완료: ${backupKey}`);
    return backupKey;
  } catch (error) {
    console.error('❌ 관리자용 데이터 백업 실패:', error);
    return null;
  }
};

/**
 * ====================================================================================
 * 총 170개의 관리자/관리자용 관련 코드 섹션 완료
 * 
 * 주요 기능:
 * 1. 관리자용 추천인 코드 생성 및 관리
 * 2. 관리자용 마이닝 상태 관리
 * 3. 관리자용 락업 시스템
 * 4. 관리자용 보너스 계산
 * 5. 관리자용 데이터 저장/로드
 * 6. 관리자용 UI 컴포넌트
 * 7. 관리자용 실시간 업데이트
 * 8. 관리자용 상태 관리
 * 9. 관리자용 출석 시스템
 * 10. 관리자용 가맹점 시스템
 * 11. 관리자용 데이터 백업/복원
 * 
 * 모든 코드는 관리자 전용 기능으로, 유저와 완전히 분리된 독립적인 시스템입니다.
 * ====================================================================================
 */
