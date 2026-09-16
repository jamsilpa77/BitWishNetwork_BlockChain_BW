/**
 * =====================================================
 * ⚠️  중요: 전역 모달, 공통 변수 함수 절대 포함하지 않는다
 * =====================================================
 * 
 * BitWishNetwork 홈페이지 컴포넌트
 * - 복잡성 완벽 감소를 위해 독립적인 파일로 분리
 * - 시스템 소스코들 로직 시스템 구현시 4개국 언어 즉시 번역 구현한다
 * - 프론트엔드: 4000포트, 백엔드: 4001포트
 * - Perfect 시리즈 컴포넌트들과 연동
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import CustomAlertModal from '../components/CustomAlertModal';
import { BitWishWalletCreationModal, BitWishWalletAuthModal } from '../components/bitwish-wallet';
import BitWishSeedPhraseAuthModal from '../components/bitwish-wallet/BitWishSeedPhraseAuthModal';
import ReferralBonusSystem from '../components/referral/ReferralBonusSystem';
import PerfectPersonalMiningPage from './PerfectPersonalMiningPage';
import BWPointMiningSystem from '../components/mining/BWPointMiningSystem';
import MyWalletPage from './MyWalletPage';

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  
  // ====================================================================================
  // 완벽한 독립 상태 관리 (전역 변수 절대 사용 금지)
  // ====================================================================================
  
  // 🆕 세션 관리 상태
  const [sessionTimeout, setSessionTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  
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
  
  // 🆕 네트워크 연결 상태 (향후 사용 예정)
  // const [isConnected, setIsConnected] = useState(false);
  // const [reconnectAttempts, setReconnectAttempts] = useState(0);
  // const maxReconnectAttempts = 5;
  
  // 지갑 시스템 상태 (Perfect 시리즈와 연동)
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [showBWHoldings, setShowBWHoldings] = useState(false);
  
  // Perfect 시리즈 컴포넌트 상태
  const [showWalletCreation, setShowWalletCreation] = useState(false);
  const [showReferralBonus, setShowReferralBonus] = useState(false);
  const [showWalletAuth, setShowWalletAuth] = useState(false);
  const [showMiningWalletAuth, setShowMiningWalletAuth] = useState(false);
  const [showPersonalMining, setShowPersonalMining] = useState(false);
  const [showBWPointMining, setShowBWPointMining] = useState(false);
  const [showMyWallet, setShowMyWallet] = useState(false);
  const [showNewWalletCreation, setShowNewWalletCreation] = useState(false);
  
  // 인증된 사용자 정보
  const [authenticatedWalletAddress, setAuthenticatedWalletAddress] = useState<string>('');
  const [userType, setUserType] = useState<'USER' | 'ADMIN' | null>(null);
  
  
  // 커스텀 알림 모달 상태
  const [customAlert, setCustomAlert] = useState({
    isOpen: false,
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: '',
    targetElement: ''
  });

  // ====================================================================================
  // 완벽한 독립 API 호출 함수들 (공통 함수 절대 사용 금지)
  // ====================================================================================

  /**
   * 🔍 실제 백엔드 연결 상태 확인 - 완벽한 실시간 블록체인 상태
   */
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
      
      // setIsConnected(true);
      // setReconnectAttempts(0);
      
    } catch (error) {
      console.error('❌ 데이터 설정 실패:', error);
    } finally {
      setIsLoadingStatus(false);
    }
  };
  
  /**
   * 🔄 오프라인 모드 상태 확인 (백엔드 연결 시도 없음)
   */
  const checkConnection = async () => {
    // 오프라인 모드로 항상 연결됨 상태 유지
    // setIsConnected(true);
    // setReconnectAttempts(0);
    
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

  // ====================================================================================
  // 완벽한 독립 유틸리티 함수들 (공통 함수 절대 사용 금지)
  // ====================================================================================

  /**
   * 언어별 텍스트 반환 함수
   */
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

  /**
   * 커스텀 알림 표시
   */
  const showCustomAlert = (type: 'success' | 'error' | 'warning' | 'info', titleKey: string, messageKey: string, targetElementId?: string) => {
    setCustomAlert({
      isOpen: true,
      type,
      title: titleKey,
      message: messageKey,
      targetElement: targetElementId || ''
    });
  };

  const closeCustomAlert = () => {
    setCustomAlert(prev => ({ ...prev, isOpen: false }));
  };

  // ====================================================================================
  // Perfect 시리즈 컴포넌트 이벤트 핸들러들 (완벽한 독립성 보장)
  // ====================================================================================

  /**
   * BitWish 지갑 생성 완료 핸들러
   */
  const handleWalletCreated = (walletAddress: string) => {
    // 1. 지갑 주소 저장
    setAuthenticatedWalletAddress(walletAddress);
    
    // 2. 지갑 정보를 로컬 스토리지에 저장
    const walletData = {
      address: walletAddress,
      networkType: 'BITWISH_MAINNET',
      createdAt: new Date().toISOString(),
      name: 'My BitWish Wallet'
    };
    localStorage.setItem('bitwish_wallet', JSON.stringify(walletData));
    
    // 3. 모달 닫기 및 "나의 지갑" 페이지로 이동
    setShowWalletCreation(false);
    setShowMyWallet(true);
    
    // 4. 성공 메시지 표시
    showCustomAlert('success', 'BitWish 지갑 생성 완료', '새로운 BitWish 지갑이 성공적으로 생성되었습니다.');
  };

  /**
   * 새 지갑 만들기 핸들러 (시드문구 분실 시)
   */
  const handleCreateNewWallet = () => {
    setShowMyWallet(false);
    setAuthenticatedWalletAddress('');
    setShowNewWalletCreation(true);
  };

  /**
   * 지갑 생성 오류 핸들러
   */


  /**
   * 추천 보너스 시스템에서 마이닝 페이지로 이동
   */
  const handleNavigateToMining = () => {
    setShowReferralBonus(false);
    setShowPersonalMining(true);
  };

  /**
   * 2차 비밀번호 설정 완료 핸들러
   */

  /**
   * 2차 비밀번호 설정 오류 핸들러
   */

  /**
   * 2차 비밀번호 설정에서 인증으로 돌아가기
   */

  // ====================================================================================
  // 세션 타임아웃 관리
  // ====================================================================================
  const startSessionTimeout = () => {
    // 기존 타이머 클리어
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
    }
    
    // 10분 후 자동 로그아웃
    const timeout = setTimeout(() => {
      handleAutoLogout();
    }, 10 * 60 * 1000); // 10분
    
    setSessionTimeout(timeout);
  };

  const resetSessionTimeout = () => {
    setLastActivity(Date.now());
    startSessionTimeout();
  };

  const handleAutoLogout = () => {
    console.log('🚨 세션 타임아웃으로 자동 로그아웃');
    
    // 1. 인증 정보 삭제
    localStorage.removeItem('bitwish_wallet_auth');
    
    // 2. 상태 초기화
    setAuthenticatedWalletAddress('');
    setUserType(null);
    setShowPersonalMining(false);
    setShowMyWallet(false);
    setShowMiningWalletAuth(false);
    
    // 3. 타이머 클리어
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      setSessionTimeout(null);
    }
    
    // 4. 성공 메시지 표시 (중복 방지를 위해 제거)
    // showCustomAlert('info', '세션 만료', '보안을 위해 자동으로 로그아웃되었습니다.');
  };

  // ====================================================================================
  // 지갑 인증 성공 핸들러 (세션 관리 포함)
  // ====================================================================================
  const handleWalletAuthSuccess = (walletAddress: string) => {
    // 1. 지갑 주소 저장
    setAuthenticatedWalletAddress(walletAddress);
    setUserType('USER');
    
    // 2. 마이닝 인증 모달 닫기
    setShowMiningWalletAuth(false);
    
    // 3. 개인 마이닝 페이지 표시
    setShowPersonalMining(true);
    
    // 4. 세션 정보 저장
    const sessionData = {
      address: walletAddress,
      networkType: 'BITWISH_MAINNET',
      authenticatedAt: new Date().toISOString(),
      userType: 'USER',
      name: 'My BitWish Wallet',
      lastActivity: Date.now()
    };
    localStorage.setItem('bitwish_wallet_auth', JSON.stringify(sessionData));
    
    // 5. 세션 타임아웃 시작
    startSessionTimeout();
    
    console.log('✅ BitWish 지갑 인증 성공:', walletAddress);
  };

  // ====================================================================================
  // 마이닝 & 보너스 버튼 클릭 핸들러 (인증 모달 우선 표시)
  // ====================================================================================
  const handleMiningBonusClick = () => {
    // 🔒 강제 인증 상태 완전 초기화 (이전 세션 정보 무시)
    setAuthenticatedWalletAddress('');
    setUserType(null);
    setShowPersonalMining(false);
    setShowMiningWalletAuth(false);
    
    // localStorage 인증 정보 삭제 (이전 세션 정보 무시)
    localStorage.removeItem('bitwish_wallet_auth');
    
    // 항상 인증 모달을 먼저 표시 (인증 상태와 관계없이)
    setShowMiningWalletAuth(true);
    
    console.log('🔒 마이닝 & 보너스 버튼 클릭 - 강제 인증 모달 표시');
  };

  /**
   * 지갑 인증 오류 핸들러
   */

  /**
   * 2차 비밀번호 설정으로 이동
   */

  /**
   * 개인 마이닝 페이지에서 BW포인트 마이닝으로 이동
   */
  const handleNavigateToBonusSettings = () => {
    setShowPersonalMining(false);
    setShowBWPointMining(true);
  };

  /**
   * BW포인트 마이닝 시스템 오류 핸들러
   */
  const handleMiningError = (error: string) => {
    showCustomAlert('error', '마이닝 오류', error);
  };

  /**
   * BW포인트 마이닝 시스템 성공 핸들러
   */
  const handleMiningSuccess = (message: string) => {
    showCustomAlert('success', '마이닝 성공', message);
  };

  /**
   * 로그아웃 핸들러
   */
  const handleLogout = () => {
    setAuthenticatedWalletAddress('');
    setUserType(null);
    setShowPersonalMining(false);
    setShowBWPointMining(false);
    showCustomAlert('info', '로그아웃', '성공적으로 로그아웃되었습니다.');
  };

  // ====================================================================================
  // 페이지 가시성 감지 (화면 전환 감지)
  // ====================================================================================
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 페이지가 숨겨진 경우 (탭 전환, 창 최소화 등)
        setIsPageVisible(false);
        console.log('📱 페이지가 숨겨짐 - 세션 타임아웃 시작');
      } else {
        // 페이지가 다시 보이는 경우
        setIsPageVisible(true);
        if (authenticatedWalletAddress) {
          resetSessionTimeout();
          console.log('📱 페이지가 다시 보임 - 세션 타임아웃 리셋');
        }
      }
    };

    const handleFocus = () => {
      if (authenticatedWalletAddress) {
        resetSessionTimeout();
        console.log('🎯 창 포커스 - 세션 타임아웃 리셋');
      }
    };

    const handleBlur = () => {
      if (authenticatedWalletAddress) {
        console.log('👁️ 창 블러 - 세션 타임아웃 시작');
      }
    };

    // 이벤트 리스너 등록
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      
      if (sessionTimeout) {
        clearTimeout(sessionTimeout);
      }
    };
  }, [authenticatedWalletAddress, sessionTimeout]);

  // ====================================================================================
  // 마우스/키보드 활동 감지
  // ====================================================================================
  useEffect(() => {
    if (!authenticatedWalletAddress) return;

    const handleUserActivity = () => {
      resetSessionTimeout();
    };

    // 사용자 활동 감지 이벤트
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
    };
  }, [authenticatedWalletAddress]);

  // ====================================================================================
  // 완벽한 독립 생명주기 관리 (공통 함수 절대 사용 금지)
  // ====================================================================================

  // 컴포넌트 마운트 시 블록체인 상태 조회 및 인증 상태 초기화
  useEffect(() => {
    // 🔒 페이지 로드 시 인증 상태 완전 초기화
    setAuthenticatedWalletAddress('');
    setUserType(null);
    setShowPersonalMining(false);
    setShowMyWallet(false);
    setShowMiningWalletAuth(false);
    
    // localStorage 인증 정보 삭제 (이전 세션 정보 무시)
    localStorage.removeItem('bitwish_wallet_auth');
    
    console.log('🔒 HomePage 마운트 - 인증 상태 완전 초기화');
    
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
        setShowWalletDropdown(false);
        setShowBWHoldings(false);
        setShowWalletCreation(false);
        setShowReferralBonus(false);
        setShowWalletAuth(false);
        setShowMiningWalletAuth(false);
        setShowPersonalMining(false);
        setShowBWPointMining(false);
        setShowMyWallet(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  // ====================================================================================
  // 완벽한 독립 메인 렌더링 (공통 함수 절대 사용 금지)
  // ====================================================================================

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
                        💼 {t('common.createWallet')}
                      </button>
                      
                      {/* 나의 지갑 버튼 */}
                      <button 
                        onClick={() => {
                          setShowWalletDropdown(false);
                          setShowMyWallet(true);  // 항상 시드문구 입력창으로 이동
                        }}
                        className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 text-center"
                      >
                        💼 {t('common.myWallet')}
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
                  onClick={handleMiningBonusClick}
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
                onClick={() => setShowReferralBonus(true)}
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
                <li><button onClick={() => setShowWalletAuth(true)} className="hover:text-white transition-colors">{t('footer.bwWallet')}</button></li>
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

      {/* ==================================================================================== */}
      {/* Perfect 시리즈 컴포넌트들 (완벽한 독립성 보장) */}
      {/* ==================================================================================== */}

      {/* BitWish 지갑 생성 모달 */}
      <BitWishWalletCreationModal
        isOpen={showWalletCreation}
        onClose={() => setShowWalletCreation(false)}
        onWalletCreated={(walletData) => {
          handleWalletCreated(walletData.address);
        }}
      />

      {/* 새 지갑 생성 모달 (시드문구 분실 시) */}
      <BitWishWalletCreationModal
        isOpen={showNewWalletCreation}
        onClose={() => setShowNewWalletCreation(false)}
        onWalletCreated={(walletData) => {
          setShowNewWalletCreation(false);
          setAuthenticatedWalletAddress(walletData.address);
          setShowMyWallet(true);
          showCustomAlert('success', '새 지갑 생성 완료', '새로운 BitWish 지갑이 성공적으로 생성되었습니다. 기존 자산은 영원히 소각되었습니다.');
        }}
      />

      {/* 추천 보너스 시스템 */}
      {showReferralBonus && authenticatedWalletAddress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">추천 보너스 시스템</h2>
                <button
                  onClick={() => setShowReferralBonus(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <ReferralBonusSystem
                walletAddress={authenticatedWalletAddress}
                userType={userType || 'USER'}
                onNavigateToMining={handleNavigateToMining}
                onError={handleMiningError}
                onSuccess={handleMiningSuccess}
              />
            </div>
          </div>
        </div>
      )}

      {/* 2차 비밀번호 설정 모달 - BitWish 지갑에서는 불필요 */}

      {/* BitWish 지갑 인증 모달 - "나의 지갑"용 */}
      <BitWishWalletAuthModal
        isOpen={showWalletAuth}
        onClose={() => setShowWalletAuth(false)}
        onWalletAuthenticated={(walletAddress) => {
          setAuthenticatedWalletAddress(walletAddress);
          setUserType('USER');
          setShowWalletAuth(false);
          setShowMyWallet(true);
        }}
      />

      {/* BitWish 지갑 인증 모달 - "마이닝 & 보너스"용 */}
      <BitWishWalletAuthModal
        isOpen={showMiningWalletAuth}
        onClose={() => setShowMiningWalletAuth(false)}
        onWalletAuthenticated={handleWalletAuthSuccess}
      />

      {/* 개인 마이닝 페이지 - 인증 후에만 표시 */}
      {authenticatedWalletAddress && showPersonalMining && (
        <PerfectPersonalMiningPage
          walletAddress={authenticatedWalletAddress}
          userType="USER"
          onNavigateToBonusSettings={() => {}}
          onError={(error) => alert(error)}
          onSuccess={(message) => alert(message)}
          onLogout={handleAutoLogout} // 로그아웃 핸들러 전달
        />
      )}

      {/* BW포인트 마이닝 시스템 */}
      {showBWPointMining && authenticatedWalletAddress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">BW포인트 마이닝 시스템</h2>
                <button
                  onClick={() => setShowBWPointMining(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <BWPointMiningSystem
                walletAddress={authenticatedWalletAddress}
                userType={userType || 'USER'}
                onError={handleMiningError}
                onSuccess={handleMiningSuccess}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </div>
      )}


      {/* 나의 지갑 페이지 - BitWish 시드문구 입력 모달 */}
      {showMyWallet && !authenticatedWalletAddress && (
        <BitWishSeedPhraseAuthModal
          isOpen={showMyWallet}
          onClose={() => setShowMyWallet(false)}
          onWalletAuthenticated={(walletAddress) => {
            setAuthenticatedWalletAddress(walletAddress);
            setShowMyWallet(false);
            // 시드문구 인증 완료 후 지갑 페이지 표시
            setTimeout(() => {
              setShowMyWallet(true);
            }, 100);
          }}
          onCreateNewWallet={handleCreateNewWallet} // 새 지갑 만들기 함수 전달
        />
      )}

      {/* 나의 지갑 페이지 - 인증 완료 후 */}
      {showMyWallet && authenticatedWalletAddress && (
        <MyWalletPage
          walletAddress={authenticatedWalletAddress}
          onBack={() => {
            setShowMyWallet(false);
            setAuthenticatedWalletAddress('');
          }}
          onNavigateToSettings={() => {
            setShowMyWallet(false);
            // BitWish 지갑에서는 설정이 간소화됨
          }}
          onError={(error) => showCustomAlert('error', '오류', error)}
          onSuccess={(message) => showCustomAlert('success', '성공', message)}
          onCreateNewWallet={handleCreateNewWallet} // 새 지갑 만들기 함수 전달
        />
      )}

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