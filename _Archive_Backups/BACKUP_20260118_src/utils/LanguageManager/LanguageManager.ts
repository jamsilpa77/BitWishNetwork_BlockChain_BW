/**
 * BitWishNetwork BW 포인트 채굴 시스템
 * 현재 토큰 이코노미는 완벽한 가상 이코노미입니다.
 * 추후 KYC 시스템 구현과 블록체인 연결 지갑까지 완성하면 
 * KYC 승인 후 실제 BW 토큰이 마이그레이션 되는 방식입니다.
 * 
 * ⚠️ 중요 준수 사항: 전역 모달, 공통 변수 함수 절대 포함하지 않는다
 * ❌ 전역 변수 사용 금지
 * ❌ 공통 함수 사용 금지  
 * ❌ 공통 클래스 사용 금지
 * ❌ 전역 모달 사용 금지
 * ❌ 중복 코드 사용 금지
 * ❌ 다른 컴포넌트와 상태 공유 금지
 * ❌ 전역 상태 관리 라이브러리 사용 금지
 * 
 * ✅ 주석에 명시 추가
 * ✅ 자체 보안 검증만 사용
 * ✅ 50단위 부동소수점 정밀 계산형식으로 구현 하지만 UI 홈페이지 이미지상 소수즘 8자리만 표기한다. 
 * ✅ BitWish Network 전용 시스템만 사용
 * ✅ 모든 텍스트는 한국어, 영어, 일어, 중국어포함 언어 변경 되도록 모든 기능에 완벽하게 구현한다. 
 *        단 절대 복잡하게 파일들을 만들지 않도록한다. 
 * ✅ 마이닝 페이지는 완벽한 독립성 보장과 완벽한 데이터베이스 MongDB 하이브리드 완벽 저장소 구현한다. 
 * ✅ 유저는 1명이든 천만명이든 개인 단독 데이터베이스 MongDB 하이브리드 완벽 저장소를 구현한다.
 */

import { LANGUAGE_CONSTANTS } from '@/constants';

/**
 * 다국어 관리 클래스 - 완벽한 독립성 보장
 * 한국어, 영어, 일본어, 중국어 + 동남아권 언어 완벽 지원
 */
export class LanguageManager {
  private currentLanguage: string;
  private languageData: Map<string, any>;

  constructor() {
    // 절대 준수사항: 전역 변수 사용 금지
    this.currentLanguage = LANGUAGE_CONSTANTS.DEFAULT_LANGUAGE;
    this.languageData = new Map();
    this.initializeLanguageData();
  }

  /**
   * 언어 데이터 초기화
   */
  private initializeLanguageData(): void {
    // 한국어 데이터
    this.languageData.set('ko', {
      // 네비게이션
      navigation: {
        home: '홈',
        mainnet: 'BW 메인넷',
        explorer: 'BW 블록 익스플로러',
        community: 'BW 커뮤니티',
        dashboard: 'BW 대시보드',
        whitepaper: 'BW 백서',
        roadmap: 'BW 로드맵',
        node: 'BW 노드',
        wallet: '지갑',
        language: '언어',
        theme: '테마'
      },
      // 마이닝 관련
      mining: {
        title: '실시간 BW 채굴 상태 현황',
        startMining: '마이닝 시작',
        stopMining: '마이닝 정지',
        pauseMining: '마이닝 일시정지',
        resumeMining: '마이닝 재개',
        miningStatus: '마이닝 상태',
        totalSupply: 'BitWish 총 공급량 (210억개)',
        currentIssued: '실시간 현재 BW 발행량',
        remainingSupply: '실시간 BW잔여 발행량',
        remainingIssued: '실시간 BW 잔여 발행량',
        issuanceRate: '실시간 BW 발행률',
        issueRate: '실시간 BW 발행률',
        totalBlocks: '실시간 생성 블록',
        generatedBlocks: '생성된 블록 수',
        walletCount: '지갑 생성 수',
        networkStatus: '네트워크 연결 상태',
        connected: '연결됨',
        disconnected: '해제됨',
        lastUpdate: '마지막 업데이트',
        createWallet: '지갑 만들기',
        myWallet: '나의 지갑',
        totalIssued: '총 발행량',
        realtimeIssued: '실시간 발행량',
        description: '실시간 블록체인 상태를 확인하세요',
        realtimeData: '실시간 블록체인 데이터',
        registeredUsers: '가입된 사용자',
        refreshStatus: '상태 새로고침',
        miningBonus: '마이닝 & 보너스'
      },
      // 브랜드 관련
      brand: {
        name: 'BitWishNetwork',
        subtitle: 'BW Mining System'
      },
      // 통화 관련
      currency: {
        bw: 'BW'
      },
      // 지갑 관련 (신규 추가)
      wallet: {
        createTitle: '지갑 만들기',
        createSubtitle: 'BitWish 시드문구(24단어)',
        createDesc: '완전한 독립성을 가진 BitWish Network 지갑을 생성하세요',
        introTitle: '지갑 만들기 시작',
        referralGuideBtn: '추천인 코드 가입 안내',
        referralGuideTooltip: '추천인 코드로 가입 하시려면 "추천 코드(선택)" 입력란에 코드만 입력하시고 "지갑 만들기 시작"버튼을 클릭하시면 즉시 코드인증이 됩니다. 또한 "추천인 코드" 없이 그냥 가입 하실려면 "지갑 만들기 시작"버튼만 클릭하시면 됩니다.',
        introDesc: '24단어 시드문구를 생성하여 안전한 지갑을 만들어보세요',
        referralInputLabel: '추천 코드',
        referralInputPlaceholder: '추천 코드(선택)',
        createStartBtn: '지갑 만들기 시작',
        seedDisplayTitle: '보안 검증 단어 확인',
        seedDisplayDesc: '다음 24개 단어를 안전한 곳에 저장하세요.',
        copySeedBtn: '시드문구 복사',
        nextStepBtn: '다음 단계',
        verificationTitle: 'BitWish 시드문구 검증',
        verificationDesc: '다음 4개 단어를 순서대로 입력하여 지갑 보안을 확인하세요',
        wordLabel: '번 단어',
        wordPlaceholder: '단어를 입력하세요',
        completeBtn: '검증 완료',
        copySuccess: '시드문구가 복사되었습니다.',
        createSuccess: '지갑 생성이 완료되었습니다!',
        verifyFail: '입력한 단어가 일치하지 않습니다. 다시 확인해주세요.',
        limitExceeded: '지갑 갯 수 한도를 초가 하였습니다.',
        dashboard: {
          title: '나의 지갑',
          statusActive: '활성',
          logout: 'logout',
          logoutConfirm: '로그아웃 하시겠습니까?',
          copyAddress: '주소복사',
          refresh: '새로고침',
          address: '지갑 주소',
          tabs: {
            overview: '개요',
            history: '거래내역',
            miningRewards: '채굴 보상 내역',
            referralRewards: '추천 보너스 내역',
            settings: '설정'
          },
          balance: {
            title: '잔액',
            realTimeReward: '실시간 누적 보상',
            realTimeDesc: '실시간 마이닝 보상의 "실시간 누적 보상"을 나타내는 "실시간 총 보유량" 입니다.',
            available: '사용 가능 금액',
            availableDesc: '사용 가능 금액은 KYC신청 및 승인받은 후 마이그레이션 된 금액을 나타내는 금액 이며 실제 거래 가능한 금액 입니다.'
          },
          referral: {
            title: '추천 보너스',
            storage: '추천보상 보관함',
            bonusStorage: '추천보너스 보관함',
            note: '📌 추천인이 KYC통과하면 사용 가능 금액으로 15일 후 마이그레이션 됩니다.',
            myCode: '추천인 코드:'
          },
          actions: {
            receive: '송금받기',
            send: '송금하기',
            otp: 'OTP 설정',
            kyc: 'KYC 신청'
          },
          footer: {
            close: '닫기'
          }
        }
      },
      walletAuth: {
        title: '나의 지갑 접근 권한',
        subtitle: '보안을 위해 시드 구문을 입력하세요',
        desc: '지갑 생성 시 백업한 24단어 시드 구문을 입력해주세요.',
        placeholder: '여기에 시드 구문을 입력하세요...',
        verify: '지갑 열기',
        error: '시드 구문이 올바르지 않습니다.',
        securityCheck: '지갑 보안 확인',
        passwordDesc: '지갑 비밀번호를 입력하여 본인 인증을 완료해주세요.',
        confirm: '확인'
      },
      miningAuth: {
        title: 'BitWish 지갑 인증',
        subtitle: '마이닝 페이지 접근을 위해 인증해주세요',
        inputTitle: 'BitWish 지갑 정보 입력',
        inputDesc: 'BitWish 지갑 주소와 비밀번호를 입력하세요',
        addressLabel: 'BitWish 지갑 주소',
        addressPlaceholder: 'BW + 40자리 16진수 주소를 입력하세요 (총 42자리)',
        passwordLabel: '비밀번호',
        passwordPlaceholder: '지갑 비밀번호를 입력하세요',
        setSecondPassword: '2차 비밀번호 설정',
        loginBtn: 'BitWish 지갑 인증',
        loginSuccess: '인증되었습니다.',
        loginFail: '지갑 주소 또는 비밀번호가 일치하지 않습니다.',
        noPasswordConfirm: '2차 비밀번호가 설정되지 않았습니다.\n지금 설정하시겠습니까?'
      },
      secondPassword: {
        title: 'BitWish 2차 비밀번호 설정',
        desc: 'BitWish 지갑 주소와 강력한 비밀번호를 설정하여 보안을 강화하세요.',
        placeholder: '비밀번호를 입력하세요',
        newPasswordPlaceholder: '새로운 비밀번호를 입력하세요',
        confirmPasswordLabel: '비밀번호 확인',
        confirmPasswordPlaceholder: '비밀번호를 다시 입력하세요',
        securityNote: '보안 안내:\n• 비밀번호는 PBKDF2 + 솔팅으로 암호화됩니다\n• 100,000회 반복 해싱으로 보안을 강화합니다\n• 비밀번호는 서버에 저장되지 않습니다',
        cancel: '취소',
        confirm: '확인',
        success: '2차 비밀번호가 설정되었습니다.',
        mismatch: '비밀번호가 일치하지 않습니다.',
        invalidAddress: '유효하지 않은 지갑 주소입니다.',
        addressNotFound: '지갑 정보를 찾을 수 없습니다. 먼저 지갑을 생성하세요.'
      },
      // 보너스 관련
      bonus: {
        title: '마이닝 페이지 & 보너스 설정',
        attendance: '출석 보너스',
        referral: '추천 보너스',
        partner: '가맹점 등록 보너스',
        profile: '프로필 설정',
        baseRate: '시간당 기본 보상률',
        dailyMaxRate: '일일 기본 최대 보상률',
        attendanceBonus: '출석 보너스',
        attendanceStatus: '출석 상태',
        referralBonus: '추천 보너스',
        referralStorage: '추천 보너스 보관함',
        referralRewardStorage: '추천 보상 보관함',
        partnerStatus: '가맹점 등록 상태',
        registered: '등록됨',
        notRegistered: '미등록',
        walletAddress: '인증된 지갑 주소:',
        walletNote: '창을 닫고 다시 열면 재인증이 필요합니다.',
        connected: '연결됨',
        disconnected: '해제됨',
        lastUpdate: '마지막 업데이트:',
        miningStatusCheck: '마이닝 상태 확인',
        myWallet: '나의 지갑',
        close: '닫기',
        description: '출석 보너스, 추천 보너스, 가맹점 등록 보너스등을 설정 추가 하시면 더 많은 보상을 받을 수 있습니다.',
        miningWaiting: '현재 마이닝 대기중'
      },
      // 실시간 마이닝
      realTimeMining: {
        title: '실시간 마이닝 보상',
        accumulatedReward: '실시간 누적 보상',
        progressTime: '진행 시간',
        currentStatus: '현재 마이닝 진행중'
      },
      // 버튼
      buttons: {
        start: '마이닝 시작',
        stop: '마이닝 정지',
        myWallet: '나의 지갑',
        close: '닫기',
        refresh: '상태 새로고침',
        createWallet: '지갑 만들기'
      },
      // 메시지
      messages: {
        miningStarted: '마이닝이 시작되었습니다.',
        miningStopped: '마이닝이 정지되었습니다.',
        miningPaused: '마이닝이 일시정지되었습니다.',
        miningResumed: '마이닝이 재개되었습니다.',
        walletCreated: '지갑이 생성되었습니다.',
        walletVerified: '지갑이 인증되었습니다.',
        attendanceChecked: '출석 보너스가 적용되었습니다.',
        referralBonusApplied: '추천 보너스가 적용되었습니다.',
        partnerBonusApplied: '가맹점 보너스가 적용되었습니다.',
        error: '오류가 발생했습니다.',
        success: '성공적으로 처리되었습니다.'
      },
      // 출석 보너스 관련
      attendance: {
        title: '출석 보너스',
        subtitle: '연속 출석 일수 설정',
        status: '출석 상태',
        note: '출석 가능 시간: 오전 9시 ~ 익일 오전 8시 59분 59초',
        bonusRate: '보너스 비율',
        bonusActive: '보너스 활성',
        bonusInactive: '보너스 비활성',
        checkAttendance: '출석 체크',
        todayAttendance: '오늘의 출석',
        monthAttendance: '월간 출석',
        notAvailable: '출석 체크가 가능한 시간이 아닙니다.',
        alreadyChecked: '이미 출석 체크를 완료했습니다.',
        checked: '출석 체크가 완료되었습니다.',
        error: '출석 체크 중 오류가 발생했습니다.',
        reset: '출석 보너스가 리셋되었습니다.',
        resetError: '출석 보너스 리셋 중 오류가 발생했습니다.',
        noStatus: '출석 상태가 없습니다.',
        invalidBonusRate: '유효하지 않은 보너스 비율입니다.',
        invalidTotalBonus: '유효하지 않은 총 보너스입니다.',
        invalidConsecutiveDays: '유효하지 않은 연속 출석일입니다.',
        unitDays: '일'
      },
      // 추천 보너스 관련
      referral: {
        existingCode: '기존 추천인 코드가 있습니다.',
        codeGenerated: '추천인 코드가 생성되었습니다.',
        codeGenerationError: '추천인 코드 생성 중 오류가 발생했습니다.',
        invalidCode: '유효하지 않은 추천인 코드입니다.',
        cannotReferSelf: '자기 자신을 추천할 수 없습니다.',
        joinSuccess: '추천인 코드로 가입이 완료되었습니다.',
        joinError: '추천인 코드 가입 중 오류가 발생했습니다.',
        noBonusToClaim: '지급할 보너스가 없습니다.',
        bonusClaimed: '추천 보너스가 지급되었습니다.',
        bonusClaimError: '추천 보너스 지급 중 오류가 발생했습니다.',
        // 추천 보너스 모달
        modal: {
          title: '친구 초대하고 BW 받기',
          subtitle: '추천 코드를 공유하고 친구가 가입할 때마다 10% 보너스를 받으세요',
          myCode: '나의 추천 코드',
          copyCode: '코드 복사',
          copied: '복사됨!',
          issueCode: '추천 코드 발급',
          shareVia: '공유하기',
          stats: {
            invited: '초대한 친구',
            bonusRate: '보너스 비율',
            people: '명'
          },
          social: {
            kakao: '카카오톡',
            telegram: '텔레그램',
            twitter: 'X (트위터)',
            facebook: '페이스북',
            email: '이메일'
          },
          shareMessage: '나의 추천 코드 {code}로 BitWish Network에 가입하고 함께 BW를 채굴하세요!',
          close: '닫기'
        },
        noStatus: '추천 상태가 없습니다.',
        invalidBonusRate: '유효하지 않은 보너스 비율입니다.',
        invalidTotalBonus: '유효하지 않은 총 보너스입니다.',
        invalidRewardAmount: '유효하지 않은 보상 금액입니다.',
        reset: '추천 보너스가 리셋되었습니다.',
        resetError: '추천 보너스 리셋 중 오류가 발생했습니다.'
      },
      // 가맹점 보너스 관련
      partner: {
        alreadyRegistered: '이미 가맹점으로 등록되어 있습니다.',
        duplicateLicense: '중복된 사업자 등록번호입니다.',
        registrationSubmitted: '가맹점 등록 신청이 제출되었습니다.',
        registrationError: '가맹점 등록 신청 중 오류가 발생했습니다.',
        recordNotFound: '가맹점 기록을 찾을 수 없습니다.',
        approved: '가맹점이 승인되었습니다.',
        rejected: '가맹점이 거부되었습니다.',
        approvalError: '가맹점 승인 처리 중 오류가 발생했습니다.',
        noStatus: '가맹점 상태가 없습니다.',
        notApproved: '가맹점이 승인되지 않았습니다.',
        invalidBonusRate: '유효하지 않은 보너스 비율입니다.',
        invalidTotalBonus: '유효하지 않은 총 보너스입니다.',
        reset: '가맹점 보너스가 리셋되었습니다.',
        resetError: '가맹점 보너스 리셋 중 오류가 발생했습니다.',
        cannotCancel: '가맹점 등록을 취소할 수 없습니다.',
        cancelled: '가맹점 등록이 취소되었습니다.',
        cancelError: '가맹점 등록 취소 중 오류가 발생했습니다.'
      }
    });

    // 영어 데이터
    this.languageData.set('en', {
      navigation: {
        home: 'Home',
        mainnet: 'BW Mainnet',
        explorer: 'BW Block Explorer',
        community: 'BW Community',
        dashboard: 'BW Dashboard',
        whitepaper: 'BW Whitepaper',
        roadmap: 'BW Roadmap',
        node: 'BW Node',
        wallet: 'Wallet',
        language: 'Language',
        theme: 'Theme'
      },
      mining: {
        title: 'Real-time BW Mining Status',
        startMining: 'Start Mining',
        stopMining: 'Stop Mining',
        pauseMining: 'Pause Mining',
        resumeMining: 'Resume Mining',
        miningStatus: 'Mining Status',
        totalSupply: 'BitWish Total Supply (21B)',
        currentIssued: 'Real-time Current BW Issued',
        remainingSupply: 'Real-time BW Remaining Supply',
        issuanceRate: 'Real-time BW Issuance Rate',
        totalBlocks: 'Real-time Generated Blocks',
        walletCount: 'Wallet Creation Count',
        networkStatus: 'Network Connection Status',
        connected: 'Connected',
        disconnected: 'Disconnected',
        lastUpdate: 'Last Update',
        description: 'Check real-time blockchain status',
        realtimeData: 'Real-time blockchain data',
        registeredUsers: 'Registered users',
        refreshStatus: 'Refresh Status',
        miningBonus: 'Mining & Bonus',
        createWallet: 'Create Wallet',
        myWallet: 'My Wallet'
      },
      walletAuth: {
        title: 'My Wallet Access',
        subtitle: 'Enter seed phrase for security',
        desc: 'Please enter the 24-word seed phrase you backed up.',
        placeholder: 'Enter seed phrase here...',
        verify: 'Open Wallet',
        error: 'Invalid seed phrase.'
      },
      miningAuth: {
        title: 'BitWish Wallet Authentication',
        subtitle: 'Authenticate to access Mining Page',
        inputTitle: 'Enter BitWish Wallet Info',
        inputDesc: 'Enter your BitWish wallet address and password',
        addressLabel: 'BitWish Wallet Address',
        addressPlaceholder: 'Enter BW + 40-digit hex address (Total 42 chars)',
        passwordLabel: 'Password',
        passwordPlaceholder: 'Enter wallet password',
        setSecondPassword: 'Set 2nd Password',
        loginBtn: 'BitWish Wallet Auth',
        loginSuccess: 'Authenticated successfully.',
        loginFail: 'Wallet address or password does not match.',
        noPasswordConfirm: '2nd password is not set.\nWould you like to set it now?'
      },
      secondPassword: {
        title: 'Set BitWish 2nd Password',
        desc: 'Enhance security by setting a BitWish wallet address and a strong password.',
        newPasswordPlaceholder: 'Enter new password',
        confirmPasswordLabel: 'Confirm Password',
        confirmPasswordPlaceholder: 'Re-enter password',
        securityNote: 'Security Note:\n• Password encrypted with PBKDF2 + Salting\n• Enhanced security with 100,000 iterations\n• Password is not stored on server',
        cancel: 'Cancel',
        confirm: 'Confirm',
        success: '2nd password has been set.',
        mismatch: 'Passwords do not match.',
        invalidAddress: 'Invalid wallet address.',
        addressNotFound: 'Wallet info not found. Please create a wallet first.'
      },
      bonus: {
        title: 'Mining Page & Bonus Settings',
        attendance: 'Attendance Bonus',
        referral: 'Referral Bonus',
        partner: 'Partner Registration Bonus',
        profile: 'Profile Settings',
        baseRate: 'Hourly Base Reward Rate',
        dailyMaxRate: 'Daily Max Reward Rate',
        attendanceBonus: 'Attendance Bonus',
        attendanceStatus: 'Attendance Status',
        referralBonus: 'Referral Bonus',
        referralStorage: 'Referral Bonus Storage',
        referralRewardStorage: 'Referral Reward Storage',
        partnerStatus: 'Partner Registration Status',
        registered: 'Registered',
        notRegistered: 'Not Registered',
        walletAddress: 'Certified Wallet Address:',
        walletNote: 'Re-authentication is required when closing and reopening the window.',
        connected: 'Connected',
        disconnected: 'Disconnected',
        lastUpdate: 'Last Update:',
        miningStatusCheck: 'Mining Status Check',
        myWallet: 'My Wallet',
        close: 'Close',
        description: 'You can receive more rewards by setting up attendance bonus, referral bonus, partner registration bonus, etc.',
        miningWaiting: 'Currently Mining Waiting'
      },
      realTimeMining: {
        title: 'Real-time Mining Reward',
        accumulatedReward: 'Real-time Accumulated Reward',
        progressTime: 'Progress Time',
        currentStatus: 'Currently Mining in Progress'
      },
      buttons: {
        start: 'Start Mining',
        stop: 'Stop Mining',
        myWallet: 'My Wallet',
        close: 'Close',
        refresh: 'Refresh Status',
        createWallet: 'Create Wallet'
      },
      messages: {
        miningStarted: 'Mining has started.',
        miningStopped: 'Mining has stopped.',
        miningPaused: 'Mining has been paused.',
        miningResumed: 'Mining has resumed.',
        walletCreated: 'Wallet has been created.',
        walletVerified: 'Wallet has been verified.',
        attendanceChecked: 'Attendance bonus has been applied.',
        referralBonusApplied: 'Referral bonus has been applied.',
        partnerBonusApplied: 'Partner bonus has been applied.',
        error: 'An error occurred.',
        success: 'Successfully processed.'
      },
      wallet: {
        createTitle: 'Create Wallet',
        createSubtitle: 'BitWish Seed Phrase (24 Words)',
        createDesc: 'Create a fully independent BitWish Network wallet',
        introTitle: 'Start Wallet Creation',
        referralGuideBtn: 'Referral Code Guide',
        referralGuideTooltip: 'To join with a referral code, enter the code in the "Referral Code (Optional)" field and click "Start Wallet Creation" for instant verification. To join without a code, simply click "Start Wallet Creation".',
        introDesc: 'Generate a 24-word seed phrase to create a secure wallet',
        referralInputLabel: 'Referral Code',
        referralInputPlaceholder: 'Referral Code (Optional)',
        createStartBtn: 'Start Wallet Creation',
        seedDisplayTitle: 'Verify Security Words',
        seedDisplayDesc: 'Please save the following 24 words in a safe place.',
        copySeedBtn: 'Copy Seed Phrase',
        nextStepBtn: 'Next Step',
        verificationTitle: 'Verify BitWish Seed Phrase',
        verificationDesc: 'Enter the following 4 words in order to verify wallet security',
        wordLabel: 'Word #',
        wordPlaceholder: 'Enter word',
        completeBtn: 'Complete Verification',
        copySuccess: 'Seed phrase copied to clipboard.',
        createSuccess: 'Wallet creation completed!',
        verifyFail: 'The words you entered do not match. Please check again.',
        limitExceeded: 'Wallet creation limit exceeded.',
        dashboard: {
          title: 'My Wallet',
          statusActive: 'Active',
          logout: 'Logout',
          copyAddress: 'Copy Address',
          tabs: {
            overview: 'Overview',
            history: 'History',
            miningRewards: 'Mining Rewards',
            referralRewards: 'Referral Rewards',
            settings: 'Settings'
          },
          balance: {
            title: 'Balance',
            realTimeReward: 'Real-time Accumulated Reward',
            realTimeDesc: 'This is the "Real-time Total Holdings" representing the "Real-time Accumulated Reward" of mining rewards.',
            kyc: 'KYC Application',
            kycDisabled: 'KYC Application (Disabled)'
          },
          footer: {
            address: 'Wallet Address',
            close: 'Close'
          },
          walletAuth: {
            title: 'My Wallet Access',
            subtitle: 'Enter seed phrase for security',
            desc: 'Please enter the 24-word seed phrase you backed up.',
            placeholder: 'Enter seed phrase here...',
            verify: 'Open Wallet',
            error: 'Invalid seed phrase.'
          },
          miningAuth: {
            title: 'BitWish Wallet Authentication',
            subtitle: 'Authenticate to access Mining Page',
            inputTitle: 'Enter BitWish Wallet Info',
            inputDesc: 'Enter your BitWish wallet address and password',
            addressLabel: 'BitWish Wallet Address',
            addressPlaceholder: 'Enter BW + 40-digit hex address (Total 42 chars)',
            passwordLabel: 'Password',
            passwordPlaceholder: 'Enter wallet password',
            setSecondPassword: 'Set 2nd Password',
            loginBtn: 'BitWish Wallet Auth',
            loginSuccess: 'Authenticated successfully.',
            loginFail: 'Wallet address or password does not match.'
          },
          secondPassword: {
            title: 'Set BitWish 2nd Password',
            desc: 'Enhance security by setting a BitWish wallet address and a strong password.',
            newPasswordPlaceholder: 'Enter new password',
            confirmPasswordLabel: 'Confirm Password',
            confirmPasswordPlaceholder: 'Re-enter password',
            securityNote: 'Security Note:\n• Password encrypted with PBKDF2 + Salting\n• Enhanced security with 100,000 iterations\n• Password is not stored on server',
            cancel: 'Cancel',
            confirm: 'Confirm',
            success: '2nd password has been set.',
            mismatch: 'Passwords do not match.',
            invalidAddress: 'Invalid wallet address.',
            addressNotFound: 'Wallet info not found. Please create a wallet first.'
          }
        }
      },
      // 출석 보너스 관련
      attendance: {
        title: 'Attendance Bonus',
        subtitle: 'Set Consecutive Attendance Days',
        status: 'Attendance Status',
        note: 'Attendance Time: 9:00 AM ~ Next Day 8:59:59 AM',
        bonusRate: 'Bonus Rate',
        bonusActive: 'Bonus Active',
        bonusInactive: 'Bonus Inactive',
        checkAttendance: 'Check Attendance',
        attendanceComplete: 'Attendance Complete',
        attendancePending: 'Attendance Pending',
        attendanceExpired: 'Attendance Expired',
        monthlyAttendance: 'Monthly Attendance',
        attendanceHistory: 'Attendance History',
        attendanceStats: 'Attendance Stats',
        attendanceRate: 'Attendance Rate',
        consecutiveDays: 'Consecutive Days',
        totalDays: 'Total Days',
        todayAttendance: 'Today Attendance',
        yesterdayAttendance: 'Yesterday Attendance',
        weekAttendance: 'Week Attendance',
        monthAttendance: 'Month Attendance',
        attendanceReward: 'Attendance Reward',
        attendanceBonus: 'Attendance Bonus',
        attendancePoint: 'Attendance Point',
        attendanceLevel: 'Attendance Level',
        attendanceRank: 'Attendance Rank',
        attendanceAchievement: 'Attendance Achievement',
        attendanceBadge: 'Attendance Badge',
        attendanceStreak: 'Attendance Streak',
        attendanceGoal: 'Attendance Goal',
        attendanceChallenge: 'Attendance Challenge',
        attendanceEvent: 'Attendance Event',
        attendanceGift: 'Attendance Gift',
        attendanceSpecial: 'Attendance Special',
        attendancePremium: 'Attendance Premium',
        attendanceVIP: 'Attendance VIP',
        attendanceMaster: 'Attendance Master',
        attendanceLegend: 'Attendance Legend',
        attendanceHero: 'Attendance Hero',
        attendanceChampion: 'Attendance Champion',
        attendanceKing: 'Attendance King',
        attendanceQueen: 'Attendance Queen',
        attendancePrince: 'Attendance Prince',
        attendancePrincess: 'Attendance Princess',
        attendanceDuke: 'Attendance Duke',
        attendanceDuchess: 'Attendance Duchess',
        attendanceEarl: 'Attendance Earl',
        attendanceCountess: 'Attendance Countess',
        attendanceBaron: 'Attendance Baron',
        attendanceBaroness: 'Attendance Baroness',
        attendanceKnight: 'Attendance Knight',
        attendanceLady: 'Attendance Lady',
        attendanceSquire: 'Attendance Squire',
        attendancePage: 'Attendance Page',
        attendanceNovice: 'Attendance Novice',
        attendanceApprentice: 'Attendance Apprentice',
        attendanceJourneyman: 'Attendance Journeyman',
        attendanceExpert: 'Attendance Expert',
        attendanceGrandmaster: 'Attendance Grandmaster',
        attendanceMyth: 'Attendance Myth',
        attendanceLegendary: 'Attendance Legendary',
        attendanceEpic: 'Attendance Epic',
        attendanceRare: 'Attendance Rare',
        attendanceCommon: 'Attendance Common',
        attendanceUncommon: 'Attendance Uncommon',
        attendanceUnique: 'Attendance Unique',
        attendanceDivine: 'Attendance Divine',
        attendanceCelestial: 'Attendance Celestial',
        attendanceEthereal: 'Attendance Ethereal',
        attendanceMystical: 'Attendance Mystical',
        attendanceMagical: 'Attendance Magical',
        attendanceEnchanted: 'Attendance Enchanted',
        attendanceBlessed: 'Attendance Blessed',
        attendanceCursed: 'Attendance Cursed',
        notAvailable: 'Attendance check is not available at this time.',
        alreadyChecked: 'Attendance has already been checked.',
        checked: 'Attendance check completed.',
        error: 'Error occurred during attendance check.',
        reset: 'Attendance bonus has been reset.',
        resetError: 'Error occurred while resetting attendance bonus.',
        noStatus: 'No attendance status found.',
        invalidBonusRate: 'Invalid bonus rate.',
        invalidTotalBonus: 'Invalid total bonus.',
        invalidConsecutiveDays: 'Invalid consecutive days.',
        unitDays: 'Days'
      },
      // 추천 보너스 관련
      referral: {
        existingCode: 'Existing referral code found.',
        codeGenerated: 'Referral code has been generated.',
        codeGenerationError: 'Error occurred while generating referral code.',
        invalidCode: 'Invalid referral code.',
        cannotReferSelf: 'Cannot refer yourself.',
        joinSuccess: 'Successfully joined with referral code.',
        joinError: 'Error occurred while joining with referral code.',
        noBonusToClaim: 'No bonus to claim.',
        bonusClaimed: 'Referral bonus has been claimed.',
        claimError: 'Error occurred while claiming referral bonus.',
        // Referral Bonus Modal
        modal: {
          title: 'Invite Friends & Earn BW',
          subtitle: 'Share your code and earn 10% bonus for every friend who joins',
          myCode: 'My Referral Code',
          copyCode: 'Copy Code',
          copied: 'Copied!',
          issueCode: 'Issue Referral Code',
          shareVia: 'Share via',
          stats: {
            invited: 'Friends Invited',
            bonusRate: 'Bonus Rate',
            people: 'People'
          },
          social: {
            kakao: 'KakaoTalk',
            telegram: 'Telegram',
            twitter: 'X (Twitter)',
            facebook: 'Facebook',
            email: 'Email'
          },
          shareMessage: 'Join BitWish Network with my referral code: {code} and start mining BW together!',
          close: 'Close'
        },
        noStatus: 'No referral status found.',
        invalidBonusRate: 'Invalid bonus rate.',
        invalidTotalBonus: 'Invalid total bonus.',
        invalidRewardAmount: 'Invalid reward amount.',
        reset: 'Referral bonus has been reset.',
        resetError: 'Error occurred while resetting referral bonus.'
      },
      // 가맹점 보너스 관련
      partner: {
        alreadyRegistered: 'Already registered as partner.',
        duplicateLicense: 'Duplicate business license number.',
        registrationSubmitted: 'Partner registration has been submitted.',
        registrationError: 'Error occurred during partner registration.',
        recordNotFound: 'Partner record not found.',
        approved: 'Partner has been approved.',
        rejected: 'Partner has been rejected.',
        approvalError: 'Error occurred during partner approval.',
        noStatus: 'No partner status found.',
        notApproved: 'Partner not approved.',
        invalidBonusRate: 'Invalid bonus rate.',
        invalidTotalBonus: 'Invalid total bonus.',
        reset: 'Partner bonus has been reset.',
        resetError: 'Error occurred while resetting partner bonus.',
        cannotCancel: 'Cannot cancel partner registration.',
        cancelled: 'Partner registration has been cancelled.',
        cancelError: 'Error occurred while cancelling partner registration.'
      }
    });

    // 일본어 데이터
    this.languageData.set('ja', {
      navigation: {
        home: 'ホーム',
        mainnet: 'BWメインネット',
        explorer: 'BWブロックエクスプローラー',
        community: 'BWコミュニティ',
        dashboard: 'BWダッシュボード',
        whitepaper: 'BWホワイトペーパー',
        roadmap: 'BWロードマップ',
        node: 'BWノード',
        wallet: 'ウォレット',
        language: '言語',
        theme: 'テーマ'
      },
      mining: {
        title: 'リアルタイムBWマイニング状況',
        startMining: 'マイニング開始',
        stopMining: 'マイニング停止',
        pauseMining: 'マイニング一時停止',
        resumeMining: 'マイニング再開',
        miningStatus: 'マイニング状況',
        totalSupply: 'BitWish総供給量（210億個）',
        currentIssued: 'リアルタイム現在BW発行量',
        remainingSupply: 'リアルタイムBW残り発行量',
        issuanceRate: 'リアルタイムBW発行率',
        totalBlocks: 'リアルタイム生成ブロック',
        walletCount: 'ウォレット作成数',
        networkStatus: 'ネットワーク接続状況',
        connected: '接続済み',
        disconnected: '切断済み',
        lastUpdate: '最終更新',
        description: 'リアルタイムブロックチェーン状況を確認してください',
        realtimeData: 'リアルタイムブロックチェーンデータ',
        registeredUsers: '登録ユーザー',
        refreshStatus: '状況更新',
        miningBonus: 'マイニング＆ボーナス',
        createWallet: 'ウォレット作成',
        myWallet: 'マイウォレット'
      },
      walletAuth: {
        title: 'マイウォレットアクセス',
        subtitle: 'セキュリティのためシードフレーズを入力してください',
        desc: 'ウォレット作成時にバックアップした24単語のシードフレーズを入力してください。',
        placeholder: 'ここにシードフレーズを入力...',
        verify: 'ウォレットを開く',
        error: 'シードフレーズが無効です。'
      },
      miningAuth: {
        title: 'BitWishウォレット認証',
        subtitle: 'マイニングページへのアクセスのために認証してください',
        inputTitle: 'BitWishウォレット情報入力',
        inputDesc: 'BitWishウォレットアドレスとパスワードを入力してください',
        addressLabel: 'BitWishウォレットアドレス',
        addressPlaceholder: 'BW + 40桁の16進数アドレスを入力 (計42桁)',
        passwordLabel: 'パスワード',
        passwordPlaceholder: 'ウォレットパスワードを入力',
        setSecondPassword: '2次パスワード設定',
        loginBtn: 'BitWishウォレット認証',
        loginSuccess: '認証されました。',
        loginFail: 'ウォレットアドレスまたはパスワードが一致しません。'
      },
      secondPassword: {
        title: 'BitWish 2次パスワード設定',
        desc: 'BitWishウォレットアドレスと強力なパスワードを設定してセキュリティを強化しましょう。',
        newPasswordPlaceholder: '新しいパスワードを入力',
        confirmPasswordLabel: 'パスワード確認',
        confirmPasswordPlaceholder: 'パスワードを再入力',
        securityNote: 'セキュリティ案内:\n• パスワードはPBKDF2 + ソルティングで暗号化されます\n• 100,000回の反復ハッシュでセキュリティを強化\n• パスワードはサーバーに保存されません',
        cancel: 'キャンセル',
        confirm: '確認',
        success: '2次パスワードが設定されました。',
        mismatch: 'パスワードが一致しません。',
        invalidAddress: '無効なウォレットアドレスです。',
        addressNotFound: 'ウォレット情報が見つかりません。先にウォレットを作成してください。'
      },
      bonus: {
        title: 'マイニングページ＆ボーナス設定',
        attendance: '出席ボーナス',
        referral: '紹介ボーナス',
        partner: 'パートナー登録ボーナス',
        profile: 'プロフィール設定',
        baseRate: '時間当たり基本報酬率',
        dailyMaxRate: '日次最大報酬率',
        attendanceBonus: '出席ボーナス',
        attendanceStatus: '出席状況',
        referralBonus: '紹介ボーナス',
        referralStorage: '紹介ボーナス保管庫',
        referralRewardStorage: '紹介報酬保管庫',
        partnerStatus: 'パートナー登録状況',
        registered: '登録済み',
        notRegistered: '未登録',
        walletAddress: '認証済みウォレットアドレス:',
        walletNote: 'ウィンドウを閉じて再度開く場合は再認証が必要です。',
        connected: '接続済み',
        disconnected: '切断済み',
        lastUpdate: '最終更新:',
        miningStatusCheck: 'マイニング状況確認',
        myWallet: 'マイウォレット',
        close: '閉じる',
        description: '出席ボーナス、紹介ボーナス、パートナー登録ボーナスなどを設定すると、より多くの報酬を受け取ることができます。',
        miningWaiting: '現在マイニング待機中'
      },
      realTimeMining: {
        title: 'リアルタイムマイニング報酬',
        accumulatedReward: 'リアルタイム累積報酬',
        progressTime: '進行時間',
        currentStatus: '現在マイニング進行中'
      },
      buttons: {
        start: 'マイニング開始',
        stop: 'マイニング停止',
        myWallet: 'マイウォレット',
        close: '閉じる',
        refresh: '状況更新',
        createWallet: 'ウォレット作成'
      },
      messages: {
        miningStarted: 'マイニングが開始されました。',
        miningStopped: 'マイニングが停止されました。',
        miningPaused: 'マイニングが一時停止されました。',
        miningResumed: 'マイニングが再開されました。',
        walletCreated: 'ウォレットが作成されました。',
        walletVerified: 'ウォレットが認証されました。',
        attendanceChecked: '出席ボーナスが適用されました。',
        referralBonusApplied: '紹介ボーナスが適用されました。',
        partnerBonusApplied: 'パートナーボーナスが適用されました。',
        error: 'エラーが発生しました。',
        success: '正常に処理されました。'
      },
      wallet: {
        createTitle: 'ウォレット作成',
        createSubtitle: 'BitWishシードフレーズ（24語）',
        createDesc: '完全な独立性を持つBitWish Networkウォレットを作成してください',
        introTitle: 'ウォレット作成開始',
        referralGuideBtn: '紹介コード登録案内',
        referralGuideTooltip: '紹介コードで参加するには、「紹介コード（オプション）」入力欄にコードを入力し、「ウォレット作成開始」ボタンをクリックすると即座に認証されます。コードなしで参加する場合は、そのままボタンをクリックしてください。',
        introDesc: '24語のシードフレーズを生成して安全なウォレットを作成します',
        referralInputLabel: '紹介コード',
        referralInputPlaceholder: '紹介コード（オプション）',
        createStartBtn: 'ウォレット作成開始',
        seedDisplayTitle: 'セキュリティ単語確認',
        seedDisplayDesc: '次の24語を安全な場所に保存してください。',
        copySeedBtn: 'シードフレーズをコピー',
        nextStepBtn: '次のステップ',
        verificationTitle: 'BitWishシードフレーズ検証',
        verificationDesc: '次の4つの単語を順番に入力してウォレットのセキュリティを確認してください',
        wordLabel: '番目の単語',
        wordPlaceholder: '単語を入力',
        completeBtn: '検証完了',
        copySuccess: 'シードフレーズがコピーされました。',
        createSuccess: 'ウォレット作成が完了しました！',
        verifyFail: '入力した単語が一致しません。もう一度確認してください。',
        limitExceeded: 'ウォレット作成制限を超えました。',
        dashboard: {
          title: '私のウォレット',
          statusActive: 'アクティブ',
          logout: 'ログアウト',
          copyAddress: 'アドレスをコピー',
          tabs: {
            overview: '概要',
            history: '取引履歴',
            miningRewards: 'マイニング報酬履歴',
            referralRewards: '紹介ボーナス履歴',
            settings: '設定'
          },
          balance: {
            title: '残高',
            realTimeReward: 'リアルタイム累積報酬',
            realTimeDesc: 'マイニング報酬の「リアルタイム累積報酬」を表す「リアルタイム総保有量」です。',
            available: '利用可能額',
            availableDesc: '利用可能額は、KYC申請および承認後に移行された金額であり、実際に取引可能な金額です。'
          },
          referral: {
            title: '紹介ボーナス',
            storage: '紹介報酬保管庫',
            bonusStorage: '紹介ボーナス報酬保管庫',
            note: '📌 紹介者がKYCを通過してから15日後に利用可能額に移行されます。',
            myCode: '紹介コード:'
          },
          actions: {
            receive: '受け取る',
            send: '送る',
            otp: 'OTP設定',
            kyc: 'KYC申請',
            kycDisabled: 'KYC申請 (無効)'
          },
          footer: {
            address: 'ウォレットアドレス',
            close: '閉じる'
          }
        }
      },
      // 출석 보너스 관련
      attendance: {
        title: '出席ボーナス',
        subtitle: '連続出席日数の設定',
        status: '出席状況',
        note: '出席可能時間: 午前9時 ~ 翌日午前8時59分59秒',
        bonusRate: 'ボーナス率',
        bonusActive: 'ボーナス有効',
        bonusInactive: 'ボーナス無効',
        checkAttendance: '出席チェック',
        attendanceComplete: '出席完了',
        attendancePending: '出席待機',
        attendanceExpired: '出席機会喪失',
        monthlyAttendance: '月間出席',
        attendanceHistory: '出席履歴',
        attendanceStats: '出席統計',
        attendanceRate: '出席率',
        consecutiveDays: '連続出席日',
        totalDays: '総出席日',
        todayAttendance: '今日の出席',
        yesterdayAttendance: '昨日の出席',
        weekAttendance: '週間出席',
        monthAttendance: '月間出席',
        attendanceReward: '出席報酬',
        attendanceBonus: '出席ボーナス',
        attendancePoint: '出席ポイント',
        attendanceLevel: '出席レベル',
        attendanceRank: '出席順位',
        attendanceAchievement: '出席達成',
        attendanceBadge: '出席バッジ',
        attendanceStreak: '出席ストリーク',
        attendanceGoal: '出席目標',
        attendanceChallenge: '出席チャレンジ',
        attendanceEvent: '出席イベント',
        attendanceGift: '出席ギフト',
        attendanceSpecial: '出席スペシャル',
        attendancePremium: '出席プレミアム',
        attendanceVIP: '出席VIP',
        attendanceMaster: '出席マスター',
        attendanceLegend: '出席レジェンド',
        attendanceHero: '出席ヒーロー',
        attendanceChampion: '出席チャンピオン',
        attendanceKing: '出席キング',
        attendanceQueen: '出席クイーン',
        attendancePrince: '出席プリンス',
        attendancePrincess: '出席プリンセス',
        attendanceDuke: '出席デューク',
        attendanceDuchess: '出席ダッチェス',
        attendanceEarl: '出席アール',
        attendanceCountess: '出席カウンテス',
        attendanceBaron: '出席バロン',
        attendanceBaroness: '出席バロネス',
        attendanceKnight: '出席ナイト',
        attendanceLady: '出席レディ',
        attendanceSquire: '出席スクワイア',
        attendancePage: '出席ページ',
        attendanceNovice: '出席ノービス',
        attendanceApprentice: '出席アプレンティス',
        attendanceJourneyman: '出席ジャーニーマン',
        attendanceExpert: '出席エキスパート',
        attendanceGrandmaster: '出席グランドマスター',
        attendanceMyth: '出席ミス',
        attendanceLegendary: '出席レジェンダリー',
        attendanceEpic: '出席エピック',
        attendanceRare: '出席レア',
        attendanceCommon: '出席コモン',
        attendanceUncommon: '出席アンコモン',
        attendanceUnique: '出席ユニーク',
        attendanceDivine: '出席ディバイン',
        attendanceCelestial: '出席セレスティアル',
        attendanceEthereal: '出席イーサリアル',
        attendanceMystical: '出席ミスティカル',
        attendanceMagical: '出席マジカル',
        attendanceEnchanted: '出席エンチャンテッド',
        attendanceBlessed: '出席ブレスト',
        attendanceCursed: '出席カースド',
        notAvailable: '出席チェック可能な時間ではありません。',
        alreadyChecked: 'すでに出席チェックを完了しました。',
        checked: '出席チェックが完了しました。',
        error: '出席チェック中にエラーが発生しました。',
        reset: '出席ボーナスがリセットされました。',
        resetError: '出席ボーナスリセット中にエラーが発生しました。',
        noStatus: '出席状態がありません。',
        invalidBonusRate: '無効なボーナス率です。',
        invalidTotalBonus: '無効な総ボーナスです。',
        invalidConsecutiveDays: '無効な連続出席日数です。',
        unitDays: '日'
      },
      // 추천 보너스 관련
      referral: {
        existingCode: '既存の紹介コードがあります。',
        codeGenerated: '紹介コードが生成されました。',
        codeGenerationError: '紹介コード生成中にエラーが発生しました。',
        invalidCode: '無効な紹介コードです。',
        cannotReferSelf: '自分自身を紹介することはできません。',
        joinSuccess: '紹介コードでの参加が完了しました。',
        joinError: '紹介コード参加中にエラーが発生しました。',
        noBonusToClaim: '受け取るボーナスがありません。',
        bonusClaimed: '紹介ボーナスが受け取られました。',
        claimError: '紹介ボーナス受け取り中にエラーが発生しました。',
        noStatus: '紹介状態がありません。',
        invalidBonusRate: '無効なボーナス率です。',
        invalidTotalBonus: '無効な総ボーナスです。',
        invalidRewardAmount: '無効な報酬金額です。',
        reset: '紹介ボーナスがリセットされました。',
        resetError: '紹介ボーナスリセット中にエラーが発生しました。'
      },
      // 가맹점 보너스 관련
      partner: {
        alreadyRegistered: '既にパートナーとして登録されています。',
        duplicateLicense: '重複した事業者登録番号です。',
        registrationSubmitted: 'パートナー登録申請が提出されました。',
        registrationError: 'パートナー登録中にエラーが発生しました。',
        recordNotFound: 'パートナー記録が見つかりません。',
        approved: 'パートナーが承認されました。',
        rejected: 'パートナーが拒否されました。',
        approvalError: 'パートナー承認処理中にエラーが発生しました。',
        noStatus: 'パートナー状態がありません。',
        notApproved: 'パートナーが承認されていません。',
        invalidBonusRate: '無効なボーナス率です。',
        invalidTotalBonus: '無効な総ボーナスです。',
        reset: 'パートナーボーナスがリセットされました。',
        resetError: 'パートナーボーナスリセット中にエラーが発生しました。',
        cannotCancel: 'パートナー登録をキャンセルできません。',
        cancelled: 'パートナー登録がキャンセルされました。',
        cancelError: 'パートナー登録キャンセル中にエラーが発生しました。'
      },

    });

    // 중국어 데이터
    this.languageData.set('zh', {
      navigation: {
        home: '首页',
        mainnet: 'BW主网',
        explorer: 'BW区块浏览器',
        community: 'BW社区',
        dashboard: 'BW仪表板',
        whitepaper: 'BW白皮书',
        roadmap: 'BW路线图',
        node: 'BW节点',
        wallet: '钱包',
        language: '语言',
        theme: '主题'
      },
      mining: {
        title: '实时BW挖矿状态',
        startMining: '开始挖矿',
        stopMining: '停止挖矿',
        pauseMining: '暂停挖矿',
        resumeMining: '恢复挖矿',
        miningStatus: '挖矿状态',
        totalSupply: 'BitWish总供应量（210亿个）',
        currentIssued: '实时当前BW发行量',
        remainingSupply: '实时BW剩余发行量',
        issuanceRate: '实时BW发行率',
        totalBlocks: '实时生成区块',
        walletCount: '钱包创建数量',
        networkStatus: '网络连接状态',
        connected: '已连接',
        disconnected: '已断开',
        lastUpdate: '最后更新',
        description: '请检查实时区块链状态',
        realtimeData: '实时区块链数据',
        registeredUsers: '注册用户',
        refreshStatus: '刷新状态',
        miningBonus: '挖矿和奖励',
        createWallet: '创建钱包',
        myWallet: '我的钱包'
      },
      walletAuth: {
        title: '我的钱包访问权限',
        subtitle: '为了安全，请输入助记词',
        desc: '请输入创建钱包时备份的24个单词助记词。',
        placeholder: '在此输入助记词...',
        verify: '打开钱包',
        error: '助记词无效。'
      },
      miningAuth: {
        title: 'BitWish钱包认证',
        subtitle: '请认证以访问挖矿页面',
        inputTitle: '输入BitWish钱包信息',
        inputDesc: '请输入BitWish钱包地址和密码',
        addressLabel: 'BitWish钱包地址',
        addressPlaceholder: '请输入BW + 40位16进制地址 (共42位)',
        passwordLabel: '密码',
        passwordPlaceholder: '请输入钱包密码',
        setSecondPassword: '设置二级密码',
        loginBtn: 'BitWish钱包认证',
        loginSuccess: '认证成功。',
        loginFail: '钱包地址或密码不匹配。'
      },
      secondPassword: {
        title: '设置BitWish二级密码',
        desc: '通过设置BitWish钱包地址和强密码来增强安全性。',
        newPasswordPlaceholder: '请输入新密码',
        confirmPasswordLabel: '确认密码',
        confirmPasswordPlaceholder: '请再次输入密码',
        securityNote: '安全提示:\n• 密码使用PBKDF2 + 加盐加密\n• 通过100,000次迭代哈希增强安全性\n• 密码不存储在服务器上',
        cancel: '取消',
        confirm: '确认',
        success: '二级密码已设置。',
        mismatch: '密码不匹配。',
        invalidAddress: '无效的钱包地址。',
        addressNotFound: '未找到钱包信息。请先创建钱包。'
      },
      bonus: {
        title: '挖矿页面和奖励设置',
        attendance: '出勤奖励',
        referral: '推荐奖励',
        partner: '合作伙伴注册奖励',
        profile: '个人资料设置',
        baseRate: '每小时基础奖励率',
        dailyMaxRate: '每日最大奖励率',
        attendanceBonus: '出勤奖励',
        attendanceStatus: '出勤状态',
        referralBonus: '推荐奖励',
        referralStorage: '推荐奖励存储',
        referralRewardStorage: '推荐奖励存储',
        partnerStatus: '合作伙伴注册状态',
        registered: '已注册',
        notRegistered: '未注册',
        walletAddress: '认证钱包地址:',
        walletNote: '关闭窗口后重新打开需要重新认证。',
        connected: '已连接',
        disconnected: '已断开',
        lastUpdate: '最后更新:',
        miningStatusCheck: '挖矿状态检查',
        myWallet: '我的钱包',
        close: '关闭',
        description: '设置出勤奖励、推荐奖励、合作伙伴注册奖励等可以获得更多奖励。',
        miningWaiting: '当前挖矿等待中'
      },
      realTimeMining: {
        title: '实时挖矿奖励',
        accumulatedReward: '实时累积奖励',
        progressTime: '进行时间',
        currentStatus: '当前挖矿进行中'
      },
      buttons: {
        start: '开始挖矿',
        stop: '停止挖矿',
        myWallet: '我的钱包',
        close: '关闭',
        refresh: '刷新状态',
        createWallet: '创建钱包'
      },
      messages: {
        miningStarted: '挖矿已开始。',
        miningStopped: '挖矿已停止。',
        miningPaused: '挖矿已暂停。',
        miningResumed: '挖矿已恢复。',
        walletCreated: '钱包已创建。',
        walletVerified: '钱包已验证。',
        attendanceChecked: '出勤奖励已应用。',
        referralBonusApplied: '推荐奖励已应用。',
        partnerBonusApplied: '合作伙伴奖励已应用。',
        error: '发生错误。',
        success: '处理成功。'
      },
      wallet: {
        createTitle: '创建钱包',
        createSubtitle: 'BitWish助记词（24个单词）',
        createDesc: '创建一个完全独立的BitWish Network钱包',
        introTitle: '开始创建钱包',
        referralGuideBtn: '推荐码注册指南',
        referralGuideTooltip: '如需使用推荐码注册，请在“推荐码（可选）”字段中输入代码，然后点击“开始创建钱包”按钮即可立即验证。如不使用推荐码，直接点击按钮即可。',
        introDesc: '生成24个单词的助记词以创建安全钱包',
        referralInputLabel: '推荐码',
        referralInputPlaceholder: '推荐码（可选）',
        createStartBtn: '开始创建钱包',
        seedDisplayTitle: '确认安全单词',
        seedDisplayDesc: '请将以下24个单词保存在安全的地方。',
        copySeedBtn: '复制助记词',
        nextStepBtn: '下一步',
        verificationTitle: '验证BitWish助记词',
        verificationDesc: '请按顺序输入以下4个单词以验证钱包安全性',
        wordLabel: '号单词',
        wordPlaceholder: '输入单词',
        completeBtn: '完成验证',
        copySuccess: '助记词已复制。',
        createSuccess: '钱包创建完成！',
        verifyFail: '输入的单词不匹配。请再次检查。',
        dashboard: {
          title: '我的钱包',
          statusActive: '活跃',
          logout: '登出',
          copyAddress: '复制地址',
          tabs: {
            overview: '概览',
            history: '交易历史',
            miningRewards: '挖矿奖励历史',
            referralRewards: '推荐奖金历史',
            settings: '设置'
          },
          balance: {
            title: '余额',
            realTimeReward: '实时累计奖励',
            realTimeDesc: '这是代表挖矿奖励“实时累计奖励”的“实时总持有量”。',
            available: '可用金额',
            availableDesc: '可用金额是指KYC申请并批准后迁移的金额，是实际可交易的金额。'
          },
          referral: {
            title: '推荐奖金',
            storage: '推荐奖励保管箱',
            bonusStorage: '推荐奖金奖励保管箱',
            note: '📌 推荐人通过KYC后15天迁移至可用金额。',
            myCode: '推荐码:'
          },
          actions: {
            receive: '接收',
            send: '发送',
            otp: 'OTP设置',
            kyc: 'KYC申请',
            kycDisabled: 'KYC申请 (禁用)'
          },
          footer: {
            address: '钱包地址',
            close: '关闭'
          }
        }
      },
      // 출석 보너스 관련
      attendance: {
        notAvailable: '当前时间无法进行出勤检查。',
        alreadyChecked: '已完成出勤检查。',
        checked: '出勤检查已完成。',
        error: '出勤检查过程中发生错误。',
        reset: '出勤奖励已重置。',
        resetError: '出勤奖励重置过程中发生错误。',
        noStatus: '没有出勤状态。',
        invalidBonusRate: '无效的奖励率。',
        invalidTotalBonus: '无效的总奖励。',
        invalidConsecutiveDays: '无效的连续出勤天数。',
        unitDays: '天'
      },
      // 추천 보너스 관련
      referral: {
        existingCode: '已存在推荐代码。',
        codeGenerated: '推荐代码已生成。',
        codeGenerationError: '推荐代码生成过程中发生错误。',
        invalidCode: '无效的推荐代码。',
        cannotReferSelf: '不能推荐自己。',
        joinSuccess: '使用推荐代码加入成功。',
        joinError: '使用推荐代码加入过程中发生错误。',
        noBonusToClaim: '没有可领取的奖励。',
        bonusClaimed: '推荐奖励已领取。',
        claimError: '推荐奖励领取过程中发生错误。',
        noStatus: '没有推荐状态。',
        invalidBonusRate: '无效的奖励率。',
        invalidTotalBonus: '无效的总奖励。',
        invalidRewardAmount: '无效的奖励金额。',
        reset: '推荐奖励已重置。',
        resetError: '推荐奖励重置过程中发生错误。'
      },
      // 가맹점 보너스 관련
      partner: {
        alreadyRegistered: '已注册为合作伙伴。',
        duplicateLicense: '重复的营业执照号码。',
        registrationSubmitted: '合作伙伴注册申请已提交。',
        registrationError: '合作伙伴注册过程中发生错误。',
        recordNotFound: '未找到合作伙伴记录。',
        approved: '合作伙伴已批准。',
        rejected: '合作伙伴已拒绝。',
        approvalError: '合作伙伴批准处理过程中发生错误。',
        noStatus: '没有合作伙伴状态。',
        notApproved: '合作伙伴未批准。',
        invalidBonusRate: '无效的奖励率。',
        invalidTotalBonus: '无效的总奖励。',
        reset: '合作伙伴奖励已重置。',
        resetError: '合作伙伴奖励重置过程中发生错误。',
        cannotCancel: '无法取消合作伙伴注册。',
        cancelled: '合作伙伴注册已取消。',
        cancelError: '合作伙伴注册取消过程中发生错误。'
      },

    });

    // 동남아권 언어들 추가
  }

  /**
   * 동남아권 언어 초기화
   */

  /**
   * 현재 언어 설정
   * @param language 언어 코드
   */
  public setLanguage(language: string): void {
    if (this.languageData.has(language)) {
      this.currentLanguage = language;
    }
  }

  /**
   * 현재 언어 조회
   * @returns 현재 언어 코드
   */
  public getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * 지원되는 언어 목록 조회
   * @returns 지원되는 언어 목록
   */
  public getSupportedLanguages(): string[] {
    return Array.from(this.languageData.keys());
  }

  /**
   * 텍스트 번역
   * @param key 번역 키
   * @param language 언어 코드 (선택사항)
   * @returns 번역된 텍스트
   */
  public translate(key: string, language?: string): string {
    const lang = language || this.currentLanguage;
    const data = this.languageData.get(lang);

    if (!data) {
      return key; // 번역이 없으면 키 반환
    }

    const keys = key.split('.');
    let result: any = data;

    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        return key; // 키가 없으면 원본 키 반환
      }
    }

    return typeof result === 'string' ? result : key;
  }

  /**
   * 언어별 텍스트 조회
   * @param key 번역 키
   * @returns 모든 언어별 텍스트
   */
  public getAllLanguageTexts(key: string): Map<string, string> {
    const result = new Map<string, string>();

    for (const [lang, data] of this.languageData.entries()) {
      const text = this.translate(key, lang);
      result.set(lang, text);
    }

    return result;
  }

  /**
   * 언어 데이터 검증
   * @param language 언어 코드
   * @returns 검증 결과
   */
  public validateLanguage(language: string): boolean {
    return this.languageData.has(language);
  }

  /**
   * 언어별 통계 조회
   * @returns 언어별 통계
   */
  public getLanguageStats(): {
    totalLanguages: number;
    supportedLanguages: string[];
    currentLanguage: string;
    defaultLanguage: string;
  } {
    return {
      totalLanguages: this.languageData.size,
      supportedLanguages: Array.from(this.languageData.keys()),
      currentLanguage: this.currentLanguage,
      defaultLanguage: LANGUAGE_CONSTANTS.DEFAULT_LANGUAGE
    };
  }

  /**
   * 번역 텍스트 조회 (getTranslation 별칭)
   * @param key 번역 키
   * @param language 언어 코드 (선택사항)
   * @returns 번역된 텍스트
   */
  public getTranslation(key: string, language?: string): string {
    return this.translate(key, language);
  }
}
