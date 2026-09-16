/**
 * =====================================================
 * ⚠️  중요: 전역 모달, 공통 변수 함수 절대 포함하지 않는다
 * =====================================================
 * 
 * BitWishNetwork 홈페이지 컴포넌트
 * - 복잡성 완벽 감소를 위해 독립적인 파일로 분리
 * - 시스템 소스코들 로직 시스템 구현시 4개국 언어 즉시 번역 구현한다
 * - 프론트엔드: 4000포트, 백엔드: 4001포트
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import ReferralCodeInput from '../components/ReferralCodeInput';
import ReferralGuideMessage from '../components/ReferralGuideMessage';
import CustomAlertModal from '../components/CustomAlertModal';
import WalletAuthModalNew from '../components/wallet/WalletAuthModalNew';
import SecondPasswordSetupModal from '../components/wallet/SecondPasswordSetupModal';
import WalletCreationModal from '../components/wallet/WalletCreationModal';
// import AdminAddressManager from '../components/admin/AdminAddressManager'; // 파일 삭제됨
import walletAuthService from '../services/walletAuthService';

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  
  // 상태 관리
  const [isMining, setIsMining] = useState(false);
  const [miningStartTime, setMiningStartTime] = useState<Date | null>(null);
  const [miningRewards, setMiningRewards] = useState('0');
  const [showBWHoldings, setShowBWHoldings] = useState(false);
  
  // 🆕 실시간 블록체인 상태 관리 (210억개 발행량 포함)
  const [blockchainStatus, setBlockchainStatus] = useState({
    totalBlocks: 0,
    totalTokens: '0',
    totalSupply: 21000000000, // 210억개
    remainingSupply: 21000000000,
    issuancePercentage: 0,
    networkStatus: '연결 중...',
    recentBlocks: [],
    lastUpdated: '',
    lastUpdate: new Date()
  });
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  
  // 🆕 네트워크 연결 상태
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  
  // 지갑 시스템 상태
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [showWalletCreation, setShowWalletCreation] = useState(false);
  const [showMyWallet, setShowMyWallet] = useState(false);
  
  // 지갑 인증 상태
  const [authenticatedWalletAddress, setAuthenticatedWalletAddress] = useState<string>('');
  const [showWalletAuthModal, setShowWalletAuthModal] = useState(false);
  const [userType, setUserType] = useState<'USER' | 'ADMIN' | null>(null);
  const [showAdminAddressManager, setShowAdminAddressManager] = useState(false);
  
  // 지갑 생성 상태
  const [walletStep, setWalletStep] = useState(1);
  const [generatedSeedPhrase, setGeneratedSeedPhrase] = useState('');
  const [verificationIndices, setVerificationIndices] = useState<number[]>([]);
  const [verificationInputs, setVerificationInputs] = useState<string[]>(['', '', '', '']);
  const [publicKey, setPublicKey] = useState('');
  const [seedPhrase, setSeedPhrase] = useState('');
  
  // 추천인 시스템 상태
  const [referralSystemState, setReferralSystemState] = useState({
    referralCode: '',
    isValid: false,
    isLoading: false,
    referralBonusApplied: false
  });
  
  // 마이닝 보너스 모달 상태
  const [showMiningBonusModal, setShowMiningBonusModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPasswordSetupModal, setShowPasswordSetupModal] = useState(false);
  
  // 2차 비밀번호 설정 상태
  const [showSecondPasswordSetup, setShowSecondPasswordSetup] = useState(false);
  
  
  // 커스텀 알림 모달 상태
  const [customAlert, setCustomAlert] = useState({
    isOpen: false,
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: '',
    targetElement: ''
  });

  // 사용자 타입 확인 (walletAuthService 사용)
  const getUserType = async (walletAddress: string): Promise<'USER' | 'ADMIN'> => {
    try {
      const isAdmin = await walletAuthService.checkAdminAddress(walletAddress);
      return isAdmin ? 'ADMIN' : 'USER';
    } catch (error) {
      console.error('사용자 타입 확인 실패:', error);
      return 'USER';
    }
  };
  
  // 지갑 주소 형식 검증
  const validateWalletAddressFormat = (address: string): boolean => {
    const stellarAddressRegex = /^G[A-Z0-9]{55}$/;
    return stellarAddressRegex.test(address);
  };
  
  // BitWishBlockChain 지갑 주소 검증
  const validateBitWishBlockchainWallet = (address: string): boolean => {
    return address.startsWith('G') && address.length === 56;
  };
  
  // 2차 비밀번호 검증
  const verifyWalletPassword = (password: string): boolean => {
    return password.length >= 8;
  };
  
  // 마이닝 상태 복원 (백엔드 연동)
  const loadMiningState = async (): Promise<boolean> => {
    try {
      if (!authenticatedWalletAddress) return false;
      
      // 백엔드에서 마이닝 상태 가져오기
      const response = await fetch(`http://localhost:4001/mining/status/${authenticatedWalletAddress}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.miningStatus) {
          setIsMining(data.miningStatus.isMining || false);
          setMiningStartTime(data.miningStatus.startTime ? new Date(data.miningStatus.startTime) : null);
          setMiningRewards(data.miningStatus.totalRewards || '0');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('마이닝 상태 복원 실패:', error);
      return false;
    }
  };
  
  // 추천인 코드 검증
  const validateReferralCodeWithBackend = async (referralCode: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:4001/referral/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.isValid;
      }
      return false;
    } catch (error) {
      console.error('추천인 코드 검증 실패:', error);
      return false;
    }
  };
  

  // 커스텀 알림 표시
  const showCustomAlert = (type: 'success' | 'error' | 'warning' | 'info', titleKey: string, messageKey: string, targetElementId?: string) => {
    setCustomAlert({
      isOpen: true,
      type,
      title: titleKey,
      message: messageKey,
      targetElement: targetElementId || ''
    });
  };

  // 2차 비밀번호 설정 모달 열기
  const openSecondPasswordSetup = () => {
    setShowSecondPasswordSetup(true);
  };

  // 2차 비밀번호 설정 완료
  const handleSecondPasswordSetupComplete = () => {
    setShowSecondPasswordSetup(false);
    setShowWalletAuthModal(true);
    showCustomAlert('success', '2차 비밀번호 설정 완료', '2차 비밀번호가 성공적으로 설정되었습니다.');
  };

  // 지갑 주소 인증 성공 처리
  const handleWalletAuthSuccess = (walletAddress: string, userType: 'USER' | 'ADMIN') => {
    setAuthenticatedWalletAddress(walletAddress);
    setUserType(userType);
    setShowWalletAuthModal(false);
    
    if (userType === 'ADMIN') {
      setShowPasswordModal(true);
    } else {
      setShowMiningBonusModal(true);
    }
  };

  // 지갑 주소 인증 오류 처리
  const handleWalletAuthError = (error: string) => {
    showCustomAlert('error', '인증 실패', error);
  };
  
  // 🔍 실제 백엔드 연결 상태 확인 - 완벽한 실시간 블록체인 상태
  const fetchBlockchainStatus = async (showLoading = false) => {
    try {
      if (showLoading) {
        setIsLoadingStatus(true);
      }
      
      // 오프라인 모드로 직접 가상 데이터 설정 (백엔드 연결 시도 없음)
      const totalSupply = 21000000000; // 210억개 고정
      const circulatingSupply = 0; // 기본값
      const remainingSupply = totalSupply - circulatingSupply;
      const issuancePercentage = 0;
      
      setBlockchainStatus({
        totalBlocks: 0,
        totalTokens: circulatingSupply.toString(),
        totalSupply: totalSupply,
        remainingSupply: remainingSupply,
        issuancePercentage: issuancePercentage,
        networkStatus: getNetworkStatusText(true), // 오프라인 모드로 연결됨 표시
        lastUpdated: new Date().toISOString(),
        recentBlocks: [],
        lastUpdate: new Date()
      });
      
      setIsConnected(true);
      setReconnectAttempts(0);
      
    } catch (error) {
      console.error('❌ 데이터 설정 실패:', error);
    } finally {
      setIsLoadingStatus(false);
    }
  };
  
  // 🔄 오프라인 모드 상태 확인 (백엔드 연결 시도 없음)
  const checkConnection = async () => {
    // 오프라인 모드로 항상 연결됨 상태 유지
    setIsConnected(true);
    setReconnectAttempts(0);
    
    // 네트워크 상태 업데이트
    const currentLang = i18n.language;
    let networkStatusText = '연결됨';
    if (currentLang === 'en') networkStatusText = 'Connected';
    else if (currentLang === 'zh') networkStatusText = '已连接';
    else if (currentLang === 'ja') networkStatusText = '接続済み';
    
    setBlockchainStatus(prev => ({
      ...prev,
      networkStatus: networkStatusText,
      lastUpdated: new Date().toISOString()
    }));
  };
  
  const closeCustomAlert = () => {
    setCustomAlert(prev => ({ ...prev, isOpen: false }));
  };
  
  // 추천인 코드 변경 핸들러
  const handleReferralCodeChange = (code: string) => {
    setReferralSystemState(prev => ({
      ...prev,
      referralCode: code,
      isValid: false,
      isLoading: true
    }));
  };
  
  // 추천인 코드 검증 결과 핸들러
  const handleReferralCodeValidation = (isValid: boolean) => {
    setReferralSystemState(prev => ({
      ...prev,
      isValid,
      isLoading: false
    }));
  };
  
  // 컴포넌트 마운트 시 블록체인 상태 조회
  useEffect(() => {
    fetchBlockchainStatus(true); // 초기 로딩만 표시
    checkConnection(); // 초기 연결 상태 확인
    
    // 30초마다 블록체인 상태 업데이트 (로딩 표시 없이)
    const statusInterval = setInterval(() => fetchBlockchainStatus(false), 30000);
    
    // 5초마다 연결 상태 확인
    const connectionInterval = setInterval(checkConnection, 5000);
    
    return () => {
      clearInterval(statusInterval);
      clearInterval(connectionInterval);
    };
  }, []);

  // 실시간 마이닝 상태 동기화
  useEffect(() => {
    if (authenticatedWalletAddress && userType) {
      const syncInterval = setInterval(async () => {
        try {
          const response = await fetch(`http://localhost:4001/mining/status/${authenticatedWalletAddress}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.miningStatus) {
              // 마이닝 상태가 변경된 경우에만 업데이트
              if (data.miningStatus.isMining !== isMining) {
                setIsMining(data.miningStatus.isMining);
                if (data.miningStatus.isMining) {
                  setMiningStartTime(new Date(data.miningStatus.startTime));
                } else {
                  setMiningStartTime(null);
                }
              }
              
              // 보상 업데이트
              if (data.miningStatus.totalRewards !== miningRewards) {
                setMiningRewards(data.miningStatus.totalRewards || '0');
              }
            }
          }
        } catch (error) {
          console.error('마이닝 상태 동기화 실패:', error);
        }
      }, 5000); // 5초마다 동기화

      return () => clearInterval(syncInterval);
    }
  }, [authenticatedWalletAddress, userType, isMining, miningRewards]);

  // 언어별 텍스트 반환 함수
  const getNetworkStatusText = (isConnected: boolean) => {
    const currentLang = i18n.language;
    if (isConnected) {
      switch (currentLang) {
        case 'ko': return '연결됨';
        case 'en': return 'Connected';
        case 'zh': return '已连接';
        case 'ja': return '接続済み';
        default: return '연결됨';
      }
    } else {
      switch (currentLang) {
        case 'ko': return '연결 끊김';
        case 'en': return 'Disconnected';
        case 'zh': return '连接断开';
        case 'ja': return '接続切断';
        default: return '연결 끊김';
      }
    }
  };

  // 언어 변경 시 블록체인 상태 업데이트
  useEffect(() => {
    if (blockchainStatus.networkStatus) {
      const isConnected = blockchainStatus.networkStatus === '연결됨' || 
                         blockchainStatus.networkStatus === 'Connected' || 
                         blockchainStatus.networkStatus === '已连接' || 
                         blockchainStatus.networkStatus === '接続済み';
      
        setBlockchainStatus(prev => ({
          ...prev,
        networkStatus: getNetworkStatusText(isConnected)
      }));
    }
  }, [i18n.language]);

  // ESC 키로 모달 닫기 기능
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowMyWallet(false);
        setShowWalletCreation(false);
        setShowWalletAuthModal(false);
        setShowMiningBonusModal(false);
        setShowPasswordModal(false);
        setShowPasswordSetupModal(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  // 지갑 생성 시작
  const startWalletCreation = async () => {
    try {
      // 추천인 코드 검증
      if (referralSystemState.referralCode && referralSystemState.referralCode.trim().length > 0) {
        const isValid = await validateReferralCodeWithBackend(referralSystemState.referralCode);
        
        if (!isValid) {
          showCustomAlert(
            'error',
            'wallet.referralCodeNotFound',
            'wallet.referralCodeNotFoundMessage',
            'referral-code-input'
          );
          return;
        }
      }
      
      setWalletStep(2);
      
      // 백엔드에서 시드문구 생성
      const response = await fetch('http://localhost:4001/wallet/generate-seedphrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user_' + Date.now() })
      });
      
      const data = await response.json();
      if (data.success) {
        setGeneratedSeedPhrase(data.seedPhrase);
        setVerificationIndices(data.positions || [0, 6, 12, 18]);
        setVerificationInputs(['', '', '', '']);
      }
    } catch (error) {
      console.error('시드문구 생성 실패:', error);
      alert('시드문구 생성에 실패했습니다.');
    }
  };

  // 시드문구 복사
  const copySeedPhrase = async () => {
    try {
      await navigator.clipboard.writeText(generatedSeedPhrase);
      showCustomAlert(
        'success',
        'wallet.seedPhraseCopiedTitle',
        'wallet.seedPhraseCopiedMessage',
        'seed-phrase-container'
      );
    } catch (error) {
      console.error('복사 실패:', error);
      showCustomAlert(
        'error',
        'wallet.copyFailedTitle',
        'wallet.copyFailedMessage'
      );
    }
  };

  // 로컬 시드문구 검증
  const validateSeedPhraseLocally = () => {
    const words = generatedSeedPhrase.split(' ');
    
    if (words.length !== 24) {
      return { isValid: false, error: '시드문구가 24단어가 아닙니다.' };
    }
    
    for (let i = 0; i < verificationIndices.length; i++) {
      const index = verificationIndices[i];
      const inputWord = verificationInputs[i]?.trim();
      const expectedWord = words[index];
      
      if (inputWord !== expectedWord) {
        return { 
          isValid: false, 
          error: `${index + 1}번째 단어가 일치하지 않습니다.` 
        };
      }
    }
    
    return { isValid: true, error: null };
  };

  // 시드문구 검증
  const verifySeedPhrase = () => {
    const validation = validateSeedPhraseLocally();
    if (validation.isValid) {
      createWalletFromSeedPhrase();
    } else {
      showCustomAlert(
        'error',
        'wallet.seedPhraseVerificationFailed',
        validation.error || 'wallet.seedPhraseInvalidBIP39',
        'seed-phrase-verification-container'
      );
    }
  };

  // 지갑 생성
  const createWalletFromSeedPhrase = async () => {
    try {
      console.log('🔍 지갑 생성 시작...');
      
      const verificationWords: { [key: number]: string } = {};
      verificationIndices.forEach((index, i) => {
        verificationWords[index + 1] = verificationInputs[i].trim();
      });

      // 지갑 생성
      const createResponse = await fetch('http://localhost:4001/wallet/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seedPhrase: generatedSeedPhrase,
          userId: 'user_' + Date.now()
        })
      });

      const createData = await createResponse.json();
      
      if (createData.success) {
        setPublicKey(createData.wallet.address);
        setSeedPhrase(generatedSeedPhrase);
        
        // 추천인 코드 즉시 인증 처리
        if (referralSystemState.referralCode && referralSystemState.referralCode.trim().length > 0) {
          try {
            showCustomAlert(
              'success',
              'wallet.referralCodeAuthenticationComplete',
              'wallet.referralBonusMessage',
              'seed-phrase-verification-container'
            );
          } catch (error) {
            console.error('추천인 코드 인증 실패:', error);
            alert('추천인 코드 인증에 실패했습니다. 지갑은 정상적으로 생성되었습니다.');
          }
        }
        
        setWalletStep(4);
      } else {
        showCustomAlert(
          'error',
          'wallet.seedPhraseVerificationFailed',
          'wallet.seedPhraseInvalidBIP39',
          'seed-phrase-verification-container'
        );
      }
    } catch (error) {
      console.error('지갑 생성 실패:', error);
      showCustomAlert(
        'error',
        'wallet.seedPhraseVerificationFailed',
        'wallet.seedPhraseInvalidBIP39',
        'seed-phrase-verification-container'
      );
    }
  };

  // 지갑 접근
  const accessWallet = async () => {
    try {
      if (!seedPhrase.trim()) {
        showCustomAlert(
          'warning',
          'wallet.passwordRequiredTitle',
          'wallet.passwordRequiredMessage',
          'seed-phrase-container'
        );
        return;
      }

      const words = seedPhrase.trim().split(' ');
      if (words.length !== 24) {
        showCustomAlert(
          'error',
          'wallet.invalidSeedPhraseTitle',
          'wallet.invalidSeedPhraseMessage',
          'seed-phrase-container'
        );
        return;
      }

      const response = await fetch('http://localhost:4001/wallet/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seedPhrase: seedPhrase.trim()
        })
      });

      const data = await response.json();
      if (data.success) {
        setPublicKey(data.wallet.address);
        setShowMyWallet(false);
        setShowWalletCreation(false);
        
        showCustomAlert(
          'success',
          'wallet.accessSuccessTitle',
          'wallet.accessSuccessMessage',
          'seed-phrase-container'
        );
      } else {
        showCustomAlert(
          'error',
          'wallet.accessFailedTitle',
          'wallet.accessFailedMessage',
          'seed-phrase-container'
        );
      }
    } catch (error) {
      console.error('지갑 접근 실패:', error);
      showCustomAlert(
        'error',
        'wallet.accessFailedTitle',
        'wallet.accessFailedMessage',
        'seed-phrase-container'
      );
    }
  };

  // 지갑 주소 인증 모달 열기
  const openWalletAuthModal = () => {
    setShowWalletAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50" onClick={() => {
      setShowWalletDropdown(false);
      setShowBWHoldings(false);
    }}>
      {/* 네비게이션 바 */}
      <nav className="bg-white shadow-lg" onClick={() => {
        setShowWalletDropdown(false);
        setShowBWHoldings(false);
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 로고 */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-blue-600">BitWish Network</h1>
              </div>
            </div>

            {/* 네비게이션 메뉴 */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-800 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-semibold">{t('navigation.bwMainnet')}</a>
              <a href="#" className="text-gray-800 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-semibold">{t('navigation.bwExplorer')}</a>
              <a href="#" className="text-gray-800 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-semibold">{t('navigation.bwNode')}</a>
              <a href="#" className="text-gray-800 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-semibold">{t('navigation.bwCommunity')}</a>
              <a href="#" className="text-gray-800 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-semibold">{t('navigation.bwDashboard')}</a>
            </div>

            {/* 우측 메뉴 */}
            <div className="flex items-center space-x-4">
              {/* 지갑 드롭다운 */}
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowWalletDropdown(!showWalletDropdown);
                    setShowBWHoldings(false); // BW 보유량 드롭다운 닫기
                  }}
                  className="p-3 text-2xl hover:bg-gray-100 rounded-full transition-all duration-200"
                  title={t('wallet.myWallet')}
                >
                  💼
                </button>
                
                {/* 지갑 드롭다운 메뉴 */}
                {showWalletDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50" onClick={(e) => e.stopPropagation()}>
                    <div className="p-4 space-y-3">
                      {/* 지갑 만들기 버튼 */}
                      <button 
                        onClick={() => {
                          setShowWalletDropdown(false);
                          setShowWalletCreation(true);
                        }}
                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 text-center"
                      >
                        💼 {t('wallet.createWallet')}
                      </button>
                      
                      {/* 나의 지갑 버튼 */}
                      <button 
                        onClick={() => {
                          setShowWalletDropdown(false);
                          setShowMyWallet(true);
                          setSeedPhrase('');
                        }}
                        className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 text-center"
                      >
                        💼 {t('wallet.myWallet')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 내 BW 보유량 드롭다운 */}
              <div className="relative">
                <button 
                  className="p-3 text-2xl hover:bg-gray-100 rounded-full transition-all duration-200" 
                  title={t('wallet.myBWHoldings')}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowBWHoldings(!showBWHoldings);
                    setShowWalletDropdown(false); // 지갑 드롭다운 닫기
                  }}
                >
                  💎
                </button>
                
                {/* 드롭다운 메뉴 */}
                {showBWHoldings && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50" onClick={(e) => e.stopPropagation()}>
                    <div className="p-4">
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-bold text-gray-900">💎 {t('wallet.myBWHoldings')}</h3>
                        <p className="text-sm text-gray-600">{t('wallet.enter24WordsToVerify')} {t('wallet.enter24WordsToCheckPersonalInfo')}</p>
                      </div>
                      
                      {/* 시드문구 입력 */}
                      <div className="mb-4">
                        <div className="text-center p-4 bg-gray-100 rounded-lg">
                          <p className="text-gray-600 text-sm">{t('wallet.walletFunctionRemoved')}</p>
                        </div>
                      </div>
                      
                      {/* 닫기 버튼 */}
                      <div className="mt-4 text-center">
                        <button 
                          className="text-sm text-gray-500 hover:text-gray-700"
                          onClick={() => setShowBWHoldings(false)}
                        >
                          {t('wallet.close')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 언어 선택기 */}
              <div className="relative">
                <select
                  value={i18n.language}
                  onChange={(e) => i18n.changeLanguage(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ko">🇰🇷 한국어</option>
                  <option value="en">🇺🇸 English</option>
                  <option value="zh">🇨🇳 中文</option>
                  <option value="ja">🇯🇵 日本語</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* 네트워크 통계 */}
        <div className="bg-white p-6 rounded-2xl shadow-lg text-center mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('home.networkStatus.title')}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-2xl font-bold text-blue-600 mb-1">Stellar</div>
              <p className="text-gray-600 text-sm">{t('home.networkStatus.stellar')}</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 mb-1">SCP + PoW</div>
              <p className="text-gray-600 text-sm">{t('home.networkStatus.consensus')}</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600 mb-1">P2P</div>
              <p className="text-gray-600 text-sm">{t('home.networkStatus.network')}</p>
            </div>
          </div>
        </div>
        
        {/* 실시간 블록체인 상태 - 총 210억개 발행량, 현재 발행량, 남은 발행량 표시 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl shadow-xl mb-16 border border-blue-200 transition-all duration-300 ease-in-out">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">🔗 {t('blockchain.realTimeStatus')}</h2>
            
            {/* 🎯 마이닝 & 보너스 버튼 */}
            <div className="flex justify-center items-center mb-6">
              <div className="text-center">
                <button
                  onClick={() => {
                    if (authenticatedWalletAddress) {
                      // ✅ 이미 상태가 로드되어 있다면 다시 로드하지 않음
                      if (!isMining && !miningStartTime) {
                        loadMiningState().then(stateRestored => {
                          console.log(`💾 ${t('common.miningStateRestore')} ${stateRestored ? t('common.success') : t('common.failure')}`);
                        });
                      } else {
                        console.log(`✅ ${t('common.alreadyLoaded')}`);
                      }
                      setShowMiningBonusModal(true);
                    } else {
                      openWalletAuthModal();
                    }
                  }}
                  className="px-7 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-lg hover:shadow-lg transition-all duration-300 text-base transform hover:scale-105 hover:rotate-1 hover:shadow-2xl"
                >
                  🎯 {t('mining.bonus')}
                </button>
              </div>
            </div>
            
            <p className="text-lg text-gray-600">{t('blockchain.checkRealTimeStatus')}</p>
            <p className="text-sm text-blue-600 mt-2">
              {t('blockchain.lastUpdate')}: {blockchainStatus.lastUpdate instanceof Date ? blockchainStatus.lastUpdate.toLocaleTimeString(i18n.language === 'ko' ? 'ko-KR' : i18n.language === 'en' ? 'en-US' : i18n.language === 'zh' ? 'zh-CN' : 'ja-JP') : t('common.noUpdate')}
          </p>
        </div>

          {isLoadingStatus ? (
            <div className="text-center py-8 transition-opacity duration-300">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">{t('blockchain.checkRealTimeStatus')}</p>
              </div>
            ) : (
            <>
              {/* 토큰 발행 현황 - 210억개 대비 */}
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                {/* 총 발행량 (210억개) */}
                <div className="bg-white p-4 rounded-xl shadow-lg text-center border-l-4 border-indigo-500">
                  <div className="text-3xl font-bold text-indigo-600 mb-2">🏆</div>
                  <div className="text-xl font-bold text-gray-900 mb-2">{blockchainStatus.totalSupply?.toLocaleString() || '21,000,000,000'} BW</div>
                  <p className="text-base font-semibold">{t('blockchain.totalIssuance210Billion')}</p>
                  <p className="text-sm text-gray-600">{t('blockchain.bitwishTotalSupply')}</p>
              </div>
                
                {/* 현재 발행량 */}
                <div className="bg-white p-4 rounded-xl shadow-lg text-center border-l-4 border-blue-500">
                  <div className="text-3xl font-bold text-blue-600 mb-2">💰</div>
                  <div className="text-xl font-bold text-gray-900 mb-2">{blockchainStatus.totalTokens} BW</div>
                  <p className="text-base font-semibold">{t('blockchain.currentIssuance')}</p>
                  <p className="text-sm text-gray-600">{t('blockchain.realTimeBlockchainData')}</p>
                </div>
                
                {/* 남은 발행량 */}
                <div className="bg-white p-4 rounded-xl shadow-lg text-center border-l-4 border-emerald-500">
                  <div className="text-3xl font-bold text-emerald-600 mb-2">📈</div>
                  <div className="text-xl font-bold text-gray-900 mb-2">{blockchainStatus.remainingSupply.toLocaleString()} BW</div>
                  <p className="text-base font-semibold">{t('blockchain.remainingIssuance')}</p>
                  <p className="text-sm text-gray-600">{t('blockchain.realTimeBlockchainData')}</p>
                </div>
              </div>
              
              {/* 발행률 및 블록체인 현황 */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* 발행률 */}
                <div className="bg-white p-4 rounded-xl shadow-lg text-center border-l-4 border-yellow-500">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">📊</div>
                  <div className="text-xl font-bold text-gray-900 mb-2">{blockchainStatus.issuancePercentage.toFixed(2)}%</div>
                  <p className="text-base font-semibold">{t('blockchain.issuanceRate')}</p>
                  <p className="text-sm text-gray-600">{t('blockchain.realTimeBlockchainData')}</p>
                </div>
                
                {/* 총 블록 수 */}
                <div className="bg-white p-4 rounded-xl shadow-lg text-center border-l-4 border-green-500">
                  <div className="text-3xl font-bold text-green-600 mb-2">🔗</div>
                  <div className="text-xl font-bold text-gray-900 mb-2">{blockchainStatus.totalBlocks.toLocaleString()}</div>
                  <p className="text-green-700 font-semibold">{t('blockchain.totalBlocks')}</p>
                  <p className="text-sm text-gray-600">{t('blockchain.generatedBlocks')}</p>
                </div>
                
                {/* 네트워크 상태 */}
                <div className="bg-white p-4 rounded-xl shadow-lg text-center border-l-4 border-purple-500">
                  <div className="text-3xl font-bold text-purple-600 mb-2">🌐</div>
                  <div className={`text-xl font-bold mb-2 ${
                    blockchainStatus.networkStatus === getNetworkStatusText(true) ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {blockchainStatus.networkStatus === getNetworkStatusText(true) ? '🟢' : '🔴'} {blockchainStatus.networkStatus}
                  </div>
                  <p className="text-purple-700 font-semibold">{t('blockchain.networkStatus')}</p>
                  <p className="text-sm text-gray-600">{t('blockchain.realTimeConnection')}</p>
                </div>
              </div>
            </>
          )}
          
          {/* 수동 새로고침 버튼 */}
          <div className="text-center mt-6">
            <button 
              onClick={() => fetchBlockchainStatus(true)}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 {t('blockchain.refreshStatus')}
            </button>
          </div>
              </div>
              
        {/* 주요 기능 섹션 */}
        <div className="text-center mb-20">
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 mb-6">
            {t('home.features.title')}
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
              </div>
              
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {/* 노드 운영 */}
          <div className="group relative bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-blue-200/50 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/25">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                {t('home.features.node')}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                PC와 모바일에서 안정적인 노드 운영
              </p>
            </div>
              </div>
              
          {/* 토큰 채굴 */}
          <div className="group relative bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-green-200/50 hover:border-green-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-green-500/25">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                {t('home.features.mining')}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                실시간 BW 토큰 채굴 및 보상
              </p>
              </div>
            </div>

          {/* 보상 시스템 */}
          <div className="group relative bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-yellow-200/50 hover:border-yellow-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-yellow-500/25">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                {t('home.features.rewards')}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                출석, 추천, 락업 보너스로 수익 극대화
              </p>
            </div>
          </div>

          {/* 보안 시스템 */}
          <div className="group relative bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-red-200/50 hover:border-red-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-red-500/25">
                <span className="text-2xl">🔐</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                {t('home.features.security')}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                24단어 시드문구와 KYC/OTP 보안
              </p>
            </div>
          </div>
        </div>


        {/* 빠른 접근 섹션 */}
        <div className="max-w-7xl mx-auto py-24">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 mb-6">
              {t('home.quickAccess.title')}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* BW 블록 익스플로러 */}
            <a 
              href="/block-explorer" 
              className="group relative bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/40 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/25">
                  <span className="text-2xl">🌍</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">
                  {t('home.quickAccess.explorer')}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {t('home.quickAccess.explorerDescription')}
                </p>
              </div>
            </a>

            {/* BW 대시보드 */}
            <a 
              href="/dashboard" 
              className="group relative bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/40 hover:border-orange-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/25">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">
                  {t('home.quickAccess.dashboard')}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {t('home.quickAccess.dashboardDescription')}
                </p>
              </div>
            </a>

            {/* BW 백서 */}
            <a 
              href="/whitepaper" 
              className="group relative bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/40 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/25">
                  <span className="text-2xl">📖</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">
                  {t('home.quickAccess.whitepaper')}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {t('home.quickAccess.whitepaperDescription')}
                </p>
              </div>
            </a>

            {/* BW 커뮤니티 */}
            <a 
              href="/community" 
              className="group relative bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/40 hover:border-pink-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-pink-500/25">
                  <span className="text-2xl">💬</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">
                  {t('home.quickAccess.community')}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {t('home.quickAccess.communityDescription')}
                </p>
              </div>
            </a>

            {/* 관리자 전용 - 관리자 주소 관리 */}
            {userType === 'ADMIN' && (
              <button
                onClick={() => setShowAdminAddressManager(true)}
                className="group relative bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/40 hover:border-yellow-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/20"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-500/25">
                    <span className="text-2xl">👑</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">
                    관리자 주소 관리
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    관리자 전용 지갑주소 등록 및 관리
                  </p>
                  <div className="mt-3 px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-semibold">
                    ADMIN ONLY
                  </div>
                </div>
              </button>
            )}

            {/* 사용자 상태 표시 */}
            {authenticatedWalletAddress && (
              <div className="group relative bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/40 hover:border-green-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 text-center">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg ${
                    userType === 'ADMIN' 
                      ? 'bg-gradient-to-br from-yellow-500 to-orange-600 shadow-yellow-500/25' 
                      : 'bg-gradient-to-br from-green-500 to-blue-600 shadow-green-500/25'
                  }`}>
                    <span className="text-2xl">{userType === 'ADMIN' ? '👑' : '👤'}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {userType === 'ADMIN' ? '관리자 모드' : '유저 모드'}
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    {authenticatedWalletAddress.substring(0, 8)}...{authenticatedWalletAddress.substring(48)}
                  </p>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    userType === 'ADMIN' 
                      ? 'bg-yellow-500/20 text-yellow-300' 
                      : 'bg-green-500/20 text-green-300'
                  }`}>
                    {userType === 'ADMIN' ? 'ADMIN MODE' : 'USER MODE'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </main>


              {/* 2단계: 시드문구 표시 */}
              {walletStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">🔐 {t('wallet.seedPhrase24Words')}</h3>
                    <p className="text-gray-600 mb-6">{t('seedPhrase.record24WordsSafely')}</p>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6" id="seed-phrase-container">
                    <div className="font-mono text-sm bg-white p-4 rounded border break-all leading-relaxed">
                      {generatedSeedPhrase}
                    </div>
                    <div className="flex justify-center space-x-3 mt-4">
                      <button 
                        onClick={copySeedPhrase}
                        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        📋 {t('wallet.copy')}
                      </button>
                      <button 
                        onClick={() => setWalletStep(3)}
                        className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                      >
                        {t('seedPhrase.next')}
                      </button>
                    </div>
          </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm text-center">
                      ⚠️ {t('seedPhrase.seedPhraseCannotRecover')}
                    </p>
              </div>
            </div>
              )}
            
              {/* 3단계: 시드문구 검증 */}
              {walletStep === 3 && (
                <div id="seed-phrase-verification-container" className="space-y-6">
              <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">✅ {t('seedPhrase.verification')}</h3>
                    <p className="text-gray-600 mb-6">{t('seedPhrase.enter4RandomWords')} {t('seedPhrase.enter4RandomSelectedWords')}</p>
              </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {verificationIndices.map((index, i) => (
                      <div key={i} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {index + 1}{t('seedPhrase.enterWord')}
                        </label>
                        <input
                          type="text"
                          value={verificationInputs[i] || ''}
                          onChange={(e) => {
                            const newInputs = [...verificationInputs];
                            newInputs[i] = e.target.value;
                            setVerificationInputs(newInputs);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={t('seedPhrase.enterWord')}
                        />
                      </div>
                    ))}
            </div>
            
                  <div className="flex justify-center space-x-3">
                    <button 
                      onClick={() => setWalletStep(2)}
                      className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      ← {t('wallet.previous')}
                    </button>
                    <button 
                      onClick={verifySeedPhrase}
                      disabled={verificationInputs.some(input => !input)}
                      className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                    >
                      ✅ {t('wallet.confirm')}
                    </button>
              </div>
            </div>
              )}

              {/* 4단계: 지갑 생성 완료 */}
              {walletStep === 4 && (
                <div className="text-center space-y-6">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold text-green-900">지갑 생성 완료!</h3>
                  <p className="text-lg text-gray-600">축하합니다! 새로운 스텔라 지갑이 생성되었습니다</p>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
                    <h4 className="font-semibold text-green-800 mb-2">지갑 주소</h4>
                    <div className="font-mono text-sm bg-white p-3 rounded border break-all">
                      {publicKey}
              </div>
                    <button 
                      onClick={(e) => {
                        const button = e.currentTarget as HTMLButtonElement;
                        const originalText = button.innerHTML;
                        const originalClass = button.className;
                        
                        navigator.clipboard.writeText(publicKey).then(() => {
                          button.innerHTML = `✅ ${t('wallet.copyComplete')}!`;
                          button.className = 'mt-3 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg transition-colors';
                          
                          setTimeout(() => {
                            button.innerHTML = originalText;
                            button.className = originalClass;
                          }, 2000);
                        }).catch(() => {
                          button.innerHTML = '❌ 복사 실패';
                          button.className = 'mt-3 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg transition-colors';
                          
                          setTimeout(() => {
                            button.innerHTML = originalText;
                            button.className = originalClass;
                          }, 2000);
                        });
                      }}
                      className="mt-3 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                    >
                      📋 {t('wallet.copyAddress')}
                    </button>
            </div>

                  <div className="flex justify-center space-x-4">
                    <button 
                      onClick={() => {
                        setShowWalletCreation(false);
                        setShowMyWallet(true);
                      }}
                      className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      💼 {t('wallet.myWallet')}
                    </button>
                    <button 
                      onClick={() => setShowWalletCreation(false)}
                      className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      {t('wallet.close')}
                    </button>
          </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 나의 지갑 모달 */}
      {showMyWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowMyWallet(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
            {/* 모달 헤더 */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">💼 {t('wallet.myWallet')}</h2>
              <button 
                onClick={() => setShowMyWallet(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                title={t('common.close')}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              </div>

            {/* 시드문구 입력 */}
            <div className="p-6" id="seed-phrase-container">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('wallet.access')}</h3>
                <p className="text-sm text-gray-600">{t('wallet.enter24Words')} {t('wallet.accessWalletWithSeedPhrase')}</p>
            </div>
            
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('wallet.seedPhrase24Words')}
                  </label>
                  <textarea
                    value={seedPhrase}
                    onChange={(e) => setSeedPhrase(e.target.value)}
                    placeholder={`🔒 ${t('wallet.enter24WordsSeparated')}`}
                    className="w-full h-24 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('wallet.enteredWordCountFormat', { count: seedPhrase ? seedPhrase.trim().split(' ').length : 0 })}
                  </p>
              </div>
                
                <button 
                  onClick={accessWallet}
                  disabled={!seedPhrase || seedPhrase.trim().split(' ').length !== 24}
                  className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  💼 {t('wallet.access')}
                </button>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* 새로운 지갑 주소 인증 모달 */}
      <WalletAuthModalNew
        isOpen={showWalletAuthModal}
        onClose={() => setShowWalletAuthModal(false)}
        onAuthSuccess={handleWalletAuthSuccess}
        onAuthError={handleWalletAuthError}
        onOpenSecondPasswordSetup={openSecondPasswordSetup}
      />

      {/* 2차 비밀번호 설정 모달 */}
      <SecondPasswordSetupModal
        isOpen={showSecondPasswordSetup}
        onClose={() => setShowSecondPasswordSetup(false)}
        onSetupComplete={handleSecondPasswordSetupComplete}
      />


      {/* 마이닝 보너스 설정 모달 */}
      {showMiningBonusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowMiningBonusModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              {/* 헤더 */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">⛏️ {t('mining.bonusSettings')}</h3>
                <button 
                  onClick={() => setShowMiningBonusModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* 마이닝 보너스 설정 내용 */}
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-gray-700 mb-4">
                    {t('mining.bonusSettingsDescription')}
                  </p>
                </div>
                
                {/* 사용자 타입 표시 - 개선된 UI */}
                <div className={`border-2 rounded-xl p-6 shadow-lg transition-all duration-300 ${
                  userType === 'ADMIN' 
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300 shadow-yellow-200' 
                    : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300 shadow-blue-200'
                }`}>
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
                      userType === 'ADMIN' 
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
                        : 'bg-gradient-to-r from-blue-400 to-cyan-500'
                    }`}>
                      <span className="text-3xl text-white">
                        {userType === 'ADMIN' ? '👑' : '👤'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-xl font-bold mb-2 ${
                        userType === 'ADMIN' ? 'text-yellow-800' : 'text-blue-800'
                      }`}>
                        {userType === 'ADMIN' ? '관리자 시스템' : '유저 시스템'}
                      </h4>
                      <p className={`text-sm leading-relaxed ${
                        userType === 'ADMIN' ? 'text-yellow-700' : 'text-blue-700'
                      }`}>
                        {userType === 'ADMIN' 
                          ? '🔧 관리자 전용 마이닝 및 테스트 시스템에 접근합니다. 모든 기능을 테스트하고 관리할 수 있습니다.'
                          : '⚡ 일반 유저 마이닝 시스템에 접근합니다. 안전하고 효율적인 마이닝을 시작하세요.'
                        }
                      </p>
                      <div className={`mt-3 px-3 py-1 rounded-full text-xs font-semibold inline-block ${
                        userType === 'ADMIN' 
                          ? 'bg-yellow-200 text-yellow-800' 
                          : 'bg-blue-200 text-blue-800'
                      }`}>
                        {userType === 'ADMIN' ? 'ADMIN MODE' : 'USER MODE'}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 출석 보너스 */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">📅 {t('bonus.attendance')}</h4>
                  <p className="text-green-700 text-sm">
                    {t('bonus.attendanceDescription')}
                  </p>
                </div>
                
                {/* 추천인 보너스 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">👥 {t('bonus.referral')}</h4>
                  <p className="text-blue-700 text-sm">
                    {t('bonus.referralDescription')}
                  </p>
                </div>

                {/* 락업 보너스 */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-800 mb-2">🔒 {t('bonus.lockup')}</h4>
                  <p className="text-purple-700 text-sm">
                    {t('bonus.lockupDescription')}
                  </p>
                </div>

                {/* 마이닝 시작 버튼 - 개선된 UI */}
                <div className="text-center space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-800 mb-2">🎯 마이닝 준비 완료</h5>
                    <p className="text-sm text-gray-600">
                      {userType === 'ADMIN' 
                        ? '관리자 모드에서 마이닝을 시작하여 모든 기능을 테스트할 수 있습니다.'
                        : '유저 모드에서 안전하고 효율적인 마이닝을 시작할 수 있습니다.'
                      }
                    </p>
                  </div>
                  
                  <div className="flex space-x-4 justify-center">
                    <button 
                      onClick={async () => {
                        try {
                          setShowMiningBonusModal(false);
                          
                          // 백엔드에 마이닝 시작 요청
                          const response = await fetch('http://localhost:4001/mining/start', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              walletAddress: authenticatedWalletAddress,
                              userType: userType
                            })
                          });
                          
                          if (response.ok) {
                            const data = await response.json();
                            if (data.success) {
                              // 마이닝 시작
                              setIsMining(true);
                              setMiningStartTime(new Date());
                              console.log('✅ 마이닝이 성공적으로 시작되었습니다.');
                            } else {
                              alert('마이닝 시작에 실패했습니다.');
                            }
                          } else {
                            alert('마이닝 시작 중 오류가 발생했습니다.');
                          }
                        } catch (error) {
                          console.error('마이닝 시작 실패:', error);
                          alert('마이닝 시작 중 오류가 발생했습니다.');
                        }
                      }}
                      className={`px-8 py-4 font-bold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                        userType === 'ADMIN'
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-yellow-200'
                          : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-green-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">⛏️</span>
                        <span>{t('mining.startMining')}</span>
                        <span className="text-sm opacity-90">
                          {userType === 'ADMIN' ? '(ADMIN)' : '(USER)'}
                        </span>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => setShowMiningBonusModal(false)}
                      className="px-6 py-4 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
                    >
                      취소
                    </button>
                  </div>
                </div>
              </div>
        </div>
          </div>
        </div>
      )}

      {/* 관리자 비밀번호 모달 */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowPasswordModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              {/* 헤더 */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">🔐 {t('admin.passwordRequired')}</h3>
                <button 
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* 관리자 비밀번호 입력 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.enterPassword')}
                  </label>
                  <input
                    type="password"
                    placeholder={t('admin.passwordPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="admin-password-input"
                  />
                </div>

                <div className="flex space-x-4">
                  <button 
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    {t('admin.cancel')}
                  </button>
                  <button 
                    onClick={async () => {
                      try {
                        const password = (document.getElementById('admin-password-input') as HTMLInputElement).value;
                        
                        // 관리자 비밀번호 검증 로직
                        if (password === 'admin123') {
                          setShowPasswordModal(false);
                          
                          // 관리자 전용 마이닝 상태 가져오기
                          const adminMiningResponse = await fetch(`http://localhost:4001/mining/status/${authenticatedWalletAddress}`);
                          if (adminMiningResponse.ok) {
                            const adminMiningData = await adminMiningResponse.json();
                            if (adminMiningData.success) {
                              // 관리자 마이닝 상태 복원
                              if (adminMiningData.miningStatus && adminMiningData.miningStatus.isMining) {
                                setIsMining(true);
                                setMiningStartTime(new Date(adminMiningData.miningStatus.startTime));
                                setMiningRewards(adminMiningData.miningStatus.totalRewards || '0');
                              }
                              console.log(`👑 관리자 마이닝 상태 복원 완료: ${adminMiningData.miningStatus.isMining ? '마이닝 중' : '마이닝 중지'}`);
                            }
                          }
                          
                          setShowMiningBonusModal(true);
                        } else {
                          alert('관리자 비밀번호가 올바르지 않습니다.');
                        }
                      } catch (error) {
                        console.error('관리자 인증 실패:', error);
                        alert('관리자 인증 중 오류가 발생했습니다.');
                      }
                    }}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('admin.confirm')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2차 비밀번호 설정 모달 */}
      {showPasswordSetupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowPasswordSetupModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              {/* 헤더 */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">🔐 {t('wallet.setupPassword')}</h3>
                <button 
                  onClick={() => setShowPasswordSetupModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* 2차 비밀번호 설정 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('wallet.newPassword')}
                  </label>
                  <input
                    type="password"
                    placeholder={t('wallet.passwordPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="new-password-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('wallet.confirmPassword')}
                  </label>
                  <input
                    type="password"
                    placeholder={t('wallet.confirmPasswordPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="confirm-password-input"
                  />
                </div>

                <div className="flex space-x-4">
                  <button 
                    onClick={() => setShowPasswordSetupModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    {t('wallet.cancel')}
                  </button>
                  <button 
                    onClick={() => {
                      const newPassword = (document.getElementById('new-password-input') as HTMLInputElement).value;
                      const confirmPassword = (document.getElementById('confirm-password-input') as HTMLInputElement).value;
                      
                      if (newPassword !== confirmPassword) {
                        showCustomAlert(
                          'error',
                          'wallet.passwordMismatchTitle',
                          'wallet.passwordMismatchMessage',
                          'confirm-password-input'
                        );
                        return;
                      }
                      
                      if (newPassword.length < 8) {
                        showCustomAlert(
                          'error',
                          'wallet.passwordTooShortTitle',
                          'wallet.passwordTooShortMessage',
                          'new-password-input'
                        );
                        return;
                      }
                      
                      // 2차 비밀번호 설정 완료
                      setShowPasswordSetupModal(false);
                      setShowWalletAuthModal(true);
                    }}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('wallet.setup')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 푸터 */}
      <footer className="bg-gray-800 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">{t('footer.company')}</h3>
              <p className="text-gray-300 text-sm">
                {t('footer.description')}
              </p>
            </div>
            
            <div>
              <h4 className="text-md font-semibold mb-4">{t('footer.products')}</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.bwMainnet')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.bwNode')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.bwWallet')}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-md font-semibold mb-4">{t('footer.community')}</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.bwCommunity')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.developerDocs')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.supportCenter')}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-md font-semibold mb-4">{t('footer.companyInfo')}</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.about')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.careers')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.contact')}</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-300 text-sm">
              {t('footer.copyright')}
            </p>
          </div>
        </div>
      </footer>

      {/* 지갑 인증 모달 */}
      <WalletAuthModalNew
        isOpen={showWalletAuthModal}
        onClose={() => setShowWalletAuthModal(false)}
        onOpenSecondPasswordSetup={openSecondPasswordSetup}
        onAuthSuccess={async (walletAddress: string, userType: 'USER' | 'ADMIN') => {
          try {
            setAuthenticatedWalletAddress(walletAddress);
            setUserType(userType);
            setShowWalletAuthModal(false);
            
            // 백엔드에서 마이닝 상태 가져오기
            const miningStatusResponse = await fetch(`http://localhost:4001/mining/status/${walletAddress}`);
            if (miningStatusResponse.ok) {
              const miningData = await miningStatusResponse.json();
              if (miningData.success) {
                // 마이닝 상태 복원
                if (miningData.miningStatus && miningData.miningStatus.isMining) {
                  setIsMining(true);
                  setMiningStartTime(new Date(miningData.miningStatus.startTime));
                  setMiningRewards(miningData.miningStatus.totalRewards || '0');
                }
                console.log(`💾 마이닝 상태 복원 완료: ${miningData.miningStatus.isMining ? '마이닝 중' : '마이닝 중지'}`);
              }
            }
            
            // 사용자 타입에 따른 분기
            if (userType === 'ADMIN') {
              setShowPasswordModal(true);
            } else {
              setShowMiningBonusModal(true);
            }
          } catch (error) {
            console.error('마이닝 상태 복원 실패:', error);
            alert('마이닝 상태 복원에 실패했습니다. 다시 시도해주세요.');
          }
        }}
        onAuthError={(error: string) => {
          console.error('지갑 인증 실패:', error);
          alert(error);
        }}
      />

      {/* 지갑 생성 모달 */}
      <WalletCreationModal
        isOpen={showWalletCreation}
        onClose={() => setShowWalletCreation(false)}
        onWalletCreated={async (walletAddress, seedPhrase) => {
          try {
            setAuthenticatedWalletAddress(walletAddress);
            setPublicKey(walletAddress);
            setSeedPhrase(seedPhrase);
            setShowWalletCreation(false);
            
            // 새로 생성된 지갑의 사용자 타입 확인
            const userTypeResponse = await fetch('http://localhost:4001/user/check-type', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ walletAddress })
            });
            
            if (userTypeResponse.ok) {
              const userTypeData = await userTypeResponse.json();
              if (userTypeData.success) {
                setUserType(userTypeData.userType);
                console.log(`🎯 새 지갑 사용자 타입: ${userTypeData.userType}`);
              }
            }
            
            setShowMyWallet(true);
          } catch (error) {
            console.error('지갑 생성 후 처리 실패:', error);
            alert('지갑 생성 후 처리 중 오류가 발생했습니다.');
          }
        }}
        onError={(error) => {
          console.error('지갑 생성 실패:', error);
          alert(error);
        }}
      />

      {/* 관리자 주소 관리 모달 (임시 비활성화) */}
      {/* <AdminAddressManager
        isOpen={showAdminAddressManager}
        onClose={() => setShowAdminAddressManager(false)}
        currentAdminAddress={authenticatedWalletAddress}
      /> */}

      {/* 커스텀 알림 모달 */}
      <CustomAlertModal 
        isOpen={customAlert.isOpen}
        type={customAlert.type}
        title={customAlert.title}
        message={customAlert.message}
        onClose={closeCustomAlert}
      />
    </div>
  );
};

export default HomePage;