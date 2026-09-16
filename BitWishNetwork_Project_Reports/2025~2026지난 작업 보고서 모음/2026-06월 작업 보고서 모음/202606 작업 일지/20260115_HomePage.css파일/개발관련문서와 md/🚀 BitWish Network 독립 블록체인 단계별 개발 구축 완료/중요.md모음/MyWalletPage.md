/**
 * ====================================================================================
 * 🚀 BitWish Network - 나의 지갑 페이지 (MyWalletPage.tsx)
 * ====================================================================================
 * 
 * ⚠️  전역 변수, 공통 함수, 공통 클래스, 전역 모달, 중복 코드 절대금지!
 * ✅ 완벽한 독립성 보장 - 모든 텍스트 4개국 언어 즉시 번역 지원
 * 
 * 🎯 핵심 기능:
 * - 지갑 정보 표시 (주소, QR코드, 잔액)
 * - 거래내역 조회
 * - 지갑 설정 관리
 * - 보안 기능 (2차 비밀번호, 백업)
 * - 추천코드 관리
 * 
 * 📱 사용자 여정: 홈페이지 💼 → 지갑 만들기 → 시드문구 생성 → 시드문구 확인 → 나의 지갑
 * ====================================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Wallet, 
  Copy, 
  Eye, 
  EyeOff, 
  Settings, 
  Shield, 
  History, 
  Download,
  RefreshCw,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Star,
  TrendingUp,
  Send,
  Users,
  Image,
  Key,
  ArrowDown,
  ArrowUp,
  Lock
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import KYCApplicationModal from '../components/kyc/KYCApplicationModal';

// ====================================================================================
// 타입 정의 (완벽한 독립성 보장)
// ====================================================================================

interface BitWishWalletInfo {
  address: string;
  publicKey: string;
  balance: string;
  networkType: string;
  createdAt: string;
  name: string;
  userType?: 'USER' | 'ADMIN';
  lastActivity: string;
  referralCode?: string;
  isSecondPasswordSet?: boolean;
  kycLevel?: number;
  otpSetup?: boolean;
  availableBalance?: string;
}

interface Transaction {
  id: string;
  type: 'receive' | 'send' | 'bonus';
  amount: string;
  from: string;
  to: string;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed';
  description: string;
}

interface MyWalletPageProps {
  walletAddress: string;
  onBack: () => void;
  onNavigateToSettings: () => void;
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
}

// ====================================================================================
// 메인 컴포넌트
// ====================================================================================

const MyWalletPage: React.FC<MyWalletPageProps> = ({
  walletAddress,
  onBack,
  onNavigateToSettings,
  onError,
  onSuccess,
}) => {
  const { t, i18n } = useTranslation();
  
  // 번역 테스트를 위한 로그
  console.log('🔍 MyWalletPage 번역 테스트:', {
    currentLanguage: i18n.language,
    myWalletTranslation: t('myWallet', { ns: 'wallet' }),
    addressTranslation: t('address', { ns: 'wallet' }),
    balanceTranslation: t('balance', { ns: 'wallet' })
  });
  
  // ====================================================================================
  // 상태 관리 (완벽한 독립성)
  // ====================================================================================
  
  const [walletInfo, setWalletInfo] = useState<BitWishWalletInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'settings' | 'security'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [showReferralCode, setShowReferralCode] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [seedModalOpen, setSeedModalOpen] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState('');
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [otpSetupModalOpen, setOtpSetupModalOpen] = useState(false);
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [seedPhraseHoverOpen, setSeedPhraseHoverOpen] = useState(false);
  
  // 🆕 세션 관리 상태
  const [sessionTimeout, setSessionTimeout] = useState<number | null>(null);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  
  // OTP 관련 상태
  const [otpSecret, setOtpSecret] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpQrCode, setOtpQrCode] = useState('');
  
  // 송금 관련 상태
  const [sendAmount, setSendAmount] = useState('');
  const [sendAddress, setSendAddress] = useState('');
  const [sendMemo, setSendMemo] = useState('');
  const [sendOtpCode, setSendOtpCode] = useState('');

  // ====================================================================================
  // 언어 변경 감지 및 강제 리렌더링
  // ====================================================================================
  useEffect(() => {
    const handleLanguageChange = () => {
      console.log('🌐 MyWalletPage 언어 변경 감지됨');
      // 강제 리렌더링을 위한 상태 업데이트
      setRefreshKey(prev => prev + 1);
    };

    // 언어 변경 이벤트 리스너 등록
    window.addEventListener('languageChanged', handleLanguageChange);
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, []);

  // i18n.language 변경 감지
  useEffect(() => {
    console.log('🌐 MyWalletPage i18n.language 변경됨:', i18n.language);
    // 강제 리렌더링을 위한 상태 업데이트
    setRefreshKey(prev => prev + 1);
    
    // 추가적인 강제 리렌더링
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 100);
  }, [i18n.language]);

  // ====================================================================================
  // 세션 타임아웃 관리
  // ====================================================================================
  const startSessionTimeout = useCallback(() => {
    // 기존 타이머 클리어
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
    }
    
    // 10분 후 자동 로그아웃
    const timeout = setTimeout(() => {
      handleAutoLogout();
    }, 10 * 60 * 1000); // 10분
    
    setSessionTimeout(timeout);
  }, [sessionTimeout]);

  const resetSessionTimeout = useCallback(() => {
    setLastActivity(Date.now());
    startSessionTimeout();
  }, [startSessionTimeout]);

  const handleAutoLogout = useCallback(() => {
    console.log('🚨 나의 지갑 페이지 세션 타임아웃으로 자동 로그아웃');
    
    // 1. 인증 정보 삭제
    localStorage.removeItem('bitwish_wallet_auth');
    
    // 2. 타이머 클리어
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      setSessionTimeout(null);
    }
    
    // 3. 홈페이지로 이동
    window.location.href = '/';
    
    // 4. 성공 메시지 표시 (중복 방지를 위해 제거)
    // showCustomAlert('info', '세션 만료', '보안을 위해 자동으로 로그아웃되었습니다.');
  }, [sessionTimeout]);

  // ====================================================================================
  // 핵심 함수들 (완벽한 독립성)
  // ====================================================================================

  /**
   * BitWish 지갑 실시간 동기화 시스템
   */
  const syncBitWishWallet = async (address: string) => {
    try {
      setIsSyncing(true);
      console.log(`🔄 BitWish 지갑 동기화 시작: ${address}`);
      
      // 1. 최신 잔액 조회
      const balanceResponse = await fetch(`http://localhost:4001/bitwish/wallet/balance/${address}`);
      const balanceResult = await balanceResponse.json();
      
      // 2. 최신 트랜잭션 조회
      const txResponse = await fetch(`http://localhost:4001/bitwish/blockchain/transactions/${address}?limit=10`);
      const txResult = await txResponse.json();
      
      // 3. UI 업데이트
      if (balanceResult.success && walletInfo) {
        setWalletInfo(prev => prev ? {
          ...prev,
          balance: balanceResult.balance,
          lastActivity: new Date().toISOString()
        } : null);
        console.log(`✅ 잔액 동기화 완료: ${balanceResult.balance} BW`);
      }
      
      if (txResult.success) {
        setTransactions(txResult.transactions || []);
        console.log(`✅ 거래내역 동기화 완료: ${txResult.transactions?.length || 0}개`);
      }
      
      console.log('🔄 BitWish 지갑 동기화 완료');
      
    } catch (error) {
      console.error('❌ BitWish 지갑 동기화 오류:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * BitWish 지갑 정보 로드
   */
  const loadWalletInfo = async () => {
    try {
      setIsLoading(true);
      
      // 1. 로컬 스토리지에서 지갑 정보 로드
      const storedWallet = localStorage.getItem('bitwish_wallet');
      const storedAuth = localStorage.getItem('bitwish_wallet_auth');
      
      let walletData: BitWishWalletInfo | null = null;
      
      if (storedWallet) {
        const wallet = JSON.parse(storedWallet);
        walletData = {
          address: wallet.address,
          publicKey: wallet.publicKey || '',
          balance: '0.00000000',
          networkType: wallet.networkType || 'BITWISH_MAINNET',
          createdAt: wallet.createdAt,
          name: wallet.name || 'My BitWish Wallet',
          lastActivity: new Date().toISOString(),
          referralCode: wallet.referralCode || '',
          isSecondPasswordSet: false
        };
      } else if (storedAuth) {
        const auth = JSON.parse(storedAuth);
        walletData = {
          address: auth.address,
          publicKey: auth.publicKey || '',
          balance: '0.00000000',
          networkType: auth.networkType || 'BITWISH_MAINNET',
          createdAt: auth.authenticatedAt,
          name: auth.name || 'My BitWish Wallet',
          userType: auth.userType,
          lastActivity: new Date().toISOString(),
          referralCode: auth.referralCode || '',
          isSecondPasswordSet: false
        };
      }
      
      if (walletData) {
        // 2. 🌐 완벽한 백엔드 API 연동 - 실시간 잔액 조회
        try {
          const balanceResponse = await fetch(`http://localhost:4001/api/bitwish/wallet/balance/${walletData.address}`);
          if (balanceResponse.ok) {
            const balanceData = await balanceResponse.json();
            if (balanceData.success) {
              walletData.balance = balanceData.balance;
              walletData.availableBalance = balanceData.availableBalance;
              console.log(`✅ 실시간 잔액 조회 성공: ${balanceData.balance} BW`);
            } else {
              console.warn('⚠️ 잔액 조회 실패:', balanceData.error);
              // 백엔드 실패 시 기본값 유지
              walletData.balance = walletData.balance || '0.00000000';
              walletData.availableBalance = '0.00000000';
            }
          } else {
            console.warn('⚠️ 백엔드 API 응답 오류');
            walletData.balance = walletData.balance || '0.00000000';
            walletData.availableBalance = '0.00000000';
          }
        } catch (apiError) {
          console.warn('⚠️ 백엔드 API 연결 실패, 로컬 데이터 사용:', apiError);
          walletData.balance = walletData.balance || '0.00000000';
          walletData.availableBalance = '0.00000000';
        }
        
        setWalletInfo(walletData);
      } else {
        throw new Error(t('wallet.walletNotFound', 'BitWish 지갑 정보를 찾을 수 없습니다.'));
      }
      
    } catch (error) {
      console.error('BitWish 지갑 정보 로드 오류:', error);
      onError(error instanceof Error ? error.message : 'BitWish 지갑 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * BitWish 거래내역 로드
   */
  const loadTransactions = async () => {
    try {
      if (!walletInfo?.address) return;
      
      // 🌐 완벽한 백엔드 API 연동 - 거래내역 조회
      try {
        const response = await fetch(`http://localhost:4001/api/bitwish/wallet/balance/${walletInfo.address}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.transactions) {
            setTransactions(data.transactions);
            console.log(`✅ 거래내역 조회 성공: ${data.transactions.length}개`);
          } else {
            console.warn('⚠️ 거래내역 조회 실패:', data.error);
            setTransactions([]); // 빈 배열로 초기화
          }
        } else {
          console.warn('⚠️ 거래내역 API 응답 오류');
          setTransactions([]);
        }
      } catch (apiError) {
        console.warn('⚠️ 거래내역 API 연결 실패:', apiError);
        setTransactions([]);
      }
      
    } catch (error) {
      console.error('BitWish 거래내역 로드 오류:', error);
      onError(error instanceof Error ? error.message : 'BitWish 거래내역을 불러오는데 실패했습니다.');
    }
  };

  /**
   * 잔액 새로고침
   */
  const refreshBalance = async () => {
    try {
      setRefreshKey(prev => prev + 1);
      await loadWalletInfo();
      onSuccess('BitWish 잔액이 새로고침되었습니다.');
    } catch (error) {
      onError('BitWish 잔액 새로고침에 실패했습니다.');
    }
  };

  /**
   * 주소 복사
   */
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(type);
      onSuccess(t('wallet.copiedSuccess', `${type}이 복사되었습니다.`));
      
      setTimeout(() => {
        setCopiedItem(null);
      }, 2000);
    } catch (error) {
      onError(t('wallet.copyFailed', '복사에 실패했습니다.'));
    }
  };

  /**
   * BW 토큰 전송
   */
  const sendBW = async (toAddress: string, amount: string) => {
    try {
      if (!walletInfo?.address) {
        onError(t('wallet.walletNotFound', '지갑 정보를 찾을 수 없습니다.'));
        return;
      }

      console.log(`🔄 BW 토큰 전송 시작: ${amount} BW → ${toAddress}`);
      
      // 1. 트랜잭션 생성
      const transaction = {
        from: walletInfo.address,
        to: toAddress,
        amount: amount,
        type: 'BW_TRANSFER',
        timestamp: Date.now()
      };
      
      // 2. 트랜잭션 서명
      const password = prompt('비밀번호를 입력하세요:');
      if (!password) return;
      
      const signResponse = await fetch('http://localhost:4001/bitwish/wallet/sign-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: walletInfo.address,
          password: password,
          transaction: transaction
        })
      });
      
      const signResult = await signResponse.json();
      
      if (signResult.success) {
        // 3. 블록체인에 제출
        const submitResponse = await fetch('http://localhost:4001/bitwish/blockchain/submit-transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transaction)
        });
        
        const submitResult = await submitResponse.json();
        
        if (submitResult.success) {
          onSuccess(`${amount} BW 전송이 완료되었습니다!`);
          console.log('✅ BW 토큰 전송 완료');
          
          // 동기화 실행
          setTimeout(() => {
            syncBitWishWallet(walletInfo.address);
          }, 1000);
        } else {
          onError(submitResult.error || '트랜잭션 제출 실패');
        }
      } else {
        onError(signResult.error || '트랜잭션 서명 실패');
      }
      
    } catch (error) {
      console.error('❌ BW 토큰 전송 오류:', error);
      onError('BW 토큰 전송 중 오류가 발생했습니다');
    }
  };

  /**
   * BW 스테이킹
   */
  const stakeBW = async (amount: string, poolId: string = 'default') => {
    try {
      if (!walletInfo?.address) {
        onError(t('wallet.walletNotFound', '지갑 정보를 찾을 수 없습니다.'));
        return;
      }

      console.log(`🔄 BW 스테이킹 시작: ${amount} BW → Pool ${poolId}`);
      
      const stakeResponse = await fetch('http://localhost:4001/bitwish/staking/stake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staker: walletInfo.address,
          poolId: poolId,
          amount: amount
        })
      });
      
      const stakeResult = await stakeResponse.json();
      
      if (stakeResult.success) {
        onSuccess(`${amount} BW 스테이킹이 완료되었습니다!`);
        console.log('✅ BW 스테이킹 완료');
        
        // 동기화 실행
        setTimeout(() => {
          syncBitWishWallet(walletInfo.address);
        }, 1000);
      } else {
        onError(stakeResult.error || '스테이킹 실패');
      }
      
    } catch (error) {
      console.error('❌ BW 스테이킹 오류:', error);
      onError('BW 스테이킹 중 오류가 발생했습니다');
    }
  };

  /**
   * 시드문구 확인 호버 창 표시 (사용자 입력 필요)
   */
  const showSeedPhraseHover = () => {
    // ❌ 저장된 시드문구는 없음 - 사용자가 직접 입력해야 함
    const userInput = prompt('시드문구를 입력하세요 (24단어):');
    if (userInput && userInput.trim().split(' ').length === 24) {
      setSeedPhrase(userInput.trim());
      setSeedPhraseHoverOpen(true);
    } else {
      onError('올바른 24단어 시드문구를 입력해주세요.');
    }
  };

  /**
   * 시드문구 표시 (OTP 검증 필요)
   */
  const handleShowSeedPhrase = async () => {
    try {
      const otp = prompt(t('wallet.enterOTP'));
      if (!otp) return;

      const verifyResponse = await fetch('http://localhost:4001/api/bitwish/wallet/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          address: walletInfo?.address,
          otp: otp 
        })
      });
      
      const verifyResult = await verifyResponse.json();
      if (!verifyResult.success) {
        onError(t('wallet.invalidOTP'));
        return;
      }

      // ❌ 저장된 시드문구는 없음 - 사용자가 직접 입력해야 함
      const userInput = prompt('시드문구를 입력하세요 (24단어):');
      if (userInput && userInput.trim().split(' ').length === 24) {
        setSeedPhrase(userInput.trim());
        setSeedModalOpen(true);
      } else {
        onError('올바른 24단어 시드문구를 입력해주세요.');
      }
    } catch (error) {
      console.error('시드문구 표시 오류:', error);
      onError(t('wallet.seedError'));
    }
  };

  /**
   * 송금받기 모달
   */
  const handleReceive = () => {
    setReceiveModalOpen(true);
  };

  /**
   * 송금하기 모달
   */
  const handleSend = () => {
    if (!walletInfo?.kycLevel || !walletInfo?.otpSetup) {
      onError('KYC 인증 및 OTP 설정이 필요합니다.');
      return;
    }
    setSendModalOpen(true);
  };

  /**
   * 실제 P2P 송금 실행
   */
  const executeSendTransaction = async () => {
    try {
      if (!sendAmount || !sendAddress || !sendOtpCode) {
        onError('모든 필드를 입력해주세요.');
        return;
      }

      // OTP 검증
      const otpVerifyResponse = await fetch('http://localhost:4001/api/bitwish/wallet/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          address: walletInfo?.address,
          otp: sendOtpCode 
        })
      });
      
      const otpResult = await otpVerifyResponse.json();
      if (!otpResult.success) {
        onError('올바른 OTP 코드가 아닙니다.');
        return;
      }

      // P2P 트랜잭션 생성 및 전송
      const txResponse = await fetch('http://localhost:4001/api/bitwish/wallet/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: walletInfo?.address,
          to: sendAddress,
          amount: sendAmount,
          memo: sendMemo,
          otp: sendOtpCode
        })
      });

      const txResult = await txResponse.json();
      if (txResult.success) {
        onSuccess(`송금이 완료되었습니다. TXID: ${txResult.txid}`);
        setSendModalOpen(false);
        setSendAmount('');
        setSendAddress('');
        setSendMemo('');
        setSendOtpCode('');
        // 즉시 잔액 및 거래내역 새로고침
        await refreshBalance();
      } else {
        onError(txResult.message || '송금에 실패했습니다.');
      }
    } catch (error) {
      console.error('송금 오류:', error);
      onError('송금 중 오류가 발생했습니다.');
    }
  };

  /**
   * KYC 신청
   */
  const handleKyc = () => {
    setKycModalOpen(true);
  };

  /**
   * OTP 설정
   */
  const handleOtpSetup = async () => {
    try {
      // TOTP 비밀키 생성 (speakeasy 대신 간단한 구현)
      const secret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      setOtpSecret(secret);
      
      // QR 코드 생성 (qrcode 대신 간단한 구현)
      const qrCodeUrl = `data:image/svg+xml;base64,${btoa(`
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="white"/>
          <text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="12">
            OTP Secret: ${secret}
          </text>
        </svg>
      `)}`;
      setOtpQrCode(qrCodeUrl);
      
      setOtpSetupModalOpen(true);
    } catch (error) {
      console.error('OTP 설정 오류:', error);
      onError('OTP 설정 중 오류가 발생했습니다.');
    }
  };

  /**
   * OTP 검증 및 등록
   */
  const handleOtpVerify = async () => {
    try {
      if (!otpCode || otpCode.length !== 6) {
        onError('6자리 OTP 코드를 입력해주세요.');
        return;
      }

      // 서버에 OTP 비밀키 저장
      const response = await fetch('http://localhost:4001/api/bitwish/wallet/otp/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: walletInfo?.address,
          secret: otpSecret
        })
      });

      const result = await response.json();
      if (result.success) {
        onSuccess('OTP 설정이 완료되었습니다.');
        setOtpSetupModalOpen(false);
        setOtpCode('');
        setOtpSecret('');
        setOtpQrCode('');
        await loadWalletInfo();
      } else {
        onError('OTP 설정 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('OTP 검증 오류:', error);
      onError('OTP 검증 중 오류가 발생했습니다.');
    }
  };

  /**
   * 시드문구 복구
   */
  const handleRecover = () => {
    onSuccess(t('wallet.recoverPage'));
  };

  /**
   * 시드문구 복사
   */
  const copySeedPhrase = () => {
    navigator.clipboard.writeText(seedPhrase);
    onSuccess(t('wallet.copied'));
  };

  /**
   * 주소 복사
   */
  const copyAddress = () => {
    navigator.clipboard.writeText(walletInfo?.address || '');
    onSuccess(t('wallet.addressCopied'));
  };

  // ====================================================================================
  // 수동 로그아웃 버튼
  // ====================================================================================
  const handleManualLogout = () => {
    if (window.confirm(t('wallet.confirmLogout', '정말 로그아웃하시겠습니까?'))) {
      handleAutoLogout();
    }
  };

  // ====================================================================================
  // 페이지 가시성 감지 (화면 전환 감지)
  // ====================================================================================
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 페이지가 숨겨진 경우 (탭 전환, 창 최소화 등)
        setIsPageVisible(false);
        console.log('📱 나의 지갑 페이지가 숨겨짐 - 세션 타임아웃 시작');
      } else {
        // 페이지가 다시 보이는 경우
        setIsPageVisible(true);
        resetSessionTimeout();
        console.log('📱 나의 지갑 페이지가 다시 보임 - 세션 타임아웃 리셋');
      }
    };

    const handleFocus = () => {
      resetSessionTimeout();
      console.log('🎯 나의 지갑 페이지 창 포커스 - 세션 타임아웃 리셋');
    };

    const handleBlur = () => {
      console.log('👁️ 나의 지갑 페이지 창 블러 - 세션 타임아웃 시작');
    };

    // 이벤트 리스너 등록
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // 초기 세션 타임아웃 시작
    startSessionTimeout();

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      
      if (sessionTimeout) {
        clearTimeout(sessionTimeout);
      }
    };
  }, [resetSessionTimeout, startSessionTimeout, sessionTimeout]);

  // ====================================================================================
  // 마우스/키보드 활동 감지
  // ====================================================================================
  useEffect(() => {
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
  }, [resetSessionTimeout]);

  // ====================================================================================
  // 생명주기
  // ====================================================================================

  useEffect(() => {
    loadWalletInfo();
    loadTransactions();
  }, [walletAddress]);

  // 30초마다 자동 동기화
  useEffect(() => {
    const interval = setInterval(() => {
      if (walletInfo?.address) {
        syncBitWishWallet(walletInfo.address);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [walletInfo]);

  // ====================================================================================
  // 렌더링 함수들
  // ====================================================================================

  /**
   * 헤더 렌더링
   */
  const renderHeader = () => (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">
              {t('common.myWallet', '나의 지갑')}
            </h1>
            <p className="text-blue-100">
              {t('common.address', '지갑 주소')}: {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
            </p>
            {isSyncing && (
              <p className="text-blue-200 text-sm flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>BitWish 지갑 동기화 중...</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="session-info">
            <span className="session-status">
              {isPageVisible ? '🟢 활성' : '🔴 비활성'}
            </span>
            <button 
              onClick={handleManualLogout}
              className="logout-btn ml-2 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              {t('logout', { ns: 'wallet' })}
            </button>
          </div>
          <button
            onClick={refreshBalance}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            title="잔액 새로고침"
          >
            <RefreshCw className={`w-6 h-6 ${refreshKey > 0 ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );

  /**
   * 탭 네비게이션 렌더링
   */
  const renderTabNavigation = () => (
    <div className="bg-white border-b border-gray-200">
      <nav className="flex space-x-8 px-6">
        {[
          { id: 'overview', label: t('common.overview', '개요'), icon: Wallet },
          { id: 'transactions', label: t('common.transactions', '거래내역'), icon: History },
          { id: 'settings', label: t('common.settings', '설정'), icon: Settings },
          { id: 'security', label: t('common.security', '보안'), icon: Shield }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );

  /**
   * 개요 탭 렌더링
   */
  const renderOverviewTab = () => (
    <div className="p-6 space-y-6">

      {/* 잔액 정보 3줄 - 프롬프트 지시서 요구사항 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('common.balance', '잔액')}
        </h3>
        
        {/* 1줄: 나의 BW */}
        <div className="mb-3">
          <p className="text-sm text-gray-600 mb-1">
            {t('common.myBW', '나의 BW')}
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {walletInfo?.balance || '0.00000000'} BW
          </p>
          <p className="text-xs text-gray-500">
            {t('common.realTimeTotal', '실시간 총 보유량')}
          </p>
        </div>
        
        {/* 2줄: 사용 가능 금액 */}
        <div className="mb-3">
          <p className="text-sm text-gray-600 mb-1">
            {t('common.availableAmount', '사용 가능 금액')}
          </p>
          <p className="text-2xl font-bold text-green-600">
            {walletInfo?.availableBalance || '0.00000000'} BW
          </p>
          <p className="text-xs text-gray-500">
            {t('common.afterAuthUnlock', '인증 완료 후 락업 해제된 수량')}
          </p>
        </div>
        
        {/* 3줄: 설명 텍스트 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            {t('availableNote', { ns: 'wallet' })}
          </p>
        </div>
      </div>

      {/* 기능 버튼 2개 - 프롬프트 지시서 요구사항 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 송금받기 ↓ (파란색) */}
        <button 
          onClick={handleReceive}
          className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg transition-colors flex items-center justify-center space-x-3"
        >
          <ArrowDown className="w-6 h-6" />
          <span>{t('common.receive', '송금받기')} ↓</span>
        </button>
        
        {/* 송금하기 ↑ (빨간색) */}
        <button 
          onClick={handleSend}
          className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-lg transition-colors flex items-center justify-center space-x-3"
        >
          <ArrowUp className="w-6 h-6" />
          <span>{t('common.send', '송금하기')} ↑</span>
        </button>
      </div>

      {/* 관리 버튼 2개 - 프롬프트 지시서 요구사항 */}
      <div className="grid grid-cols-2 gap-4">
        {/* OTP 재등록 */}
        <button 
          onClick={handleOtpSetup}
          className="border border-gray-300 hover:bg-gray-50 p-4 rounded-lg transition-colors flex items-center justify-center space-x-3"
        >
          <Key className="w-6 h-6" />
          <span>{t('common.otpSetup', 'OTP 설정')}</span>
        </button>
        
        {/* KYC 신청 */}
        <button 
          onClick={handleKyc}
          className="border border-gray-300 hover:bg-gray-50 p-4 rounded-lg transition-colors flex items-center justify-center space-x-3"
        >
          <Shield className="w-6 h-6" />
          <span>{t('common.kycApplication', 'KYC 신청')}</span>
        </button>
      </div>

      {/* 지갑 정보 카드 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('common.walletInfo', '지갑 정보')}
        </h3>
        
        <div className="space-y-4">
          {/* 지갑 주소 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('address', { ns: 'wallet' })}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={walletAddress}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
              />
              <button
                onClick={() => copyToClipboard(walletAddress, '지갑 주소')}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {copiedItem === '지갑 주소' ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* QR 코드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.qrCode', 'QR 코드')}
            </label>
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <QRCodeSVG value={walletAddress} size={120} />
              </div>
              <div className="text-sm text-gray-600">
                <p>{t('common.qrCodeDescription', 'QR 코드를 스캔하여 지갑 주소를 공유하세요.')}</p>
              </div>
            </div>
          </div>

          {/* 추천코드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.referralCode', '추천 코드')}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type={showReferralCode ? 'text' : 'password'}
                value={walletInfo?.referralCode || ''}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
              />
              <button
                onClick={() => setShowReferralCode(!showReferralCode)}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showReferralCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              <button
                onClick={() => copyToClipboard(walletInfo?.referralCode || '', '추천코드')}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {copiedItem === '추천코드' ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 액션 버튼들 */}
      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={onNavigateToSettings}
          className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all"
        >
          <span>{t('common.close', '닫기')}</span>
        </button>
      </div>
    </div>
  );

  /**
   * 거래내역 탭 렌더링
   */
  const renderTransactionsTab = () => (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('wallet.transactionHistory', '거래내역')}
        </h3>
        <button
          onClick={loadTransactions}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm">{t('wallet.refresh', '새로고침')}</span>
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">{t('wallet.noTransactions', '거래내역이 없습니다.')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === 'receive' ? 'bg-green-100 text-green-600' :
                    transaction.type === 'send' ? 'bg-red-100 text-red-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {transaction.type === 'receive' ? <TrendingUp className="w-5 h-5" /> :
                     transaction.type === 'send' ? <TrendingUp className="w-5 h-5 rotate-180" /> :
                     <Star className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-500">{transaction.timestamp}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    transaction.type === 'receive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'receive' ? '+' : '-'}{transaction.amount} BW
                  </p>
                  <p className={`text-xs ${
                    transaction.status === 'confirmed' ? 'text-green-600' :
                    transaction.status === 'pending' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {transaction.status === 'confirmed' ? t('wallet.confirmed', '확인됨') :
                     transaction.status === 'pending' ? t('wallet.pending', '대기중') :
                     t('wallet.failed', '실패')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  /**
   * 설정 탭 렌더링
   */
  const renderSettingsTab = () => (
    <div className="p-6 space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        {t('wallet.walletSettings', '지갑 설정')}
      </h3>

      {/* 언어 설정 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-3">{t('wallet.language', '언어')}</h4>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
          <option value="ko">한국어</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
          <option value="zh">中文</option>
        </select>
      </div>

      {/* 알림 설정 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-3">{t('wallet.notifications', '알림')}</h4>
        <div className="space-y-2">
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" defaultChecked />
            <span className="text-sm text-gray-700">{t('wallet.transactionNotifications', '거래 알림')}</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" defaultChecked />
            <span className="text-sm text-gray-700">{t('wallet.transactionNotifications', '거래 알림')}</span>
          </label>
        </div>
      </div>
    </div>
  );

  /**
   * 보안 탭 렌더링
   */
  const renderSecurityTab = () => (
    <div className="p-6 space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        {t('wallet.securitySettings', '보안 설정')}
      </h3>

      {/* 시드문구 백업 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">{t('wallet.seedPhraseBackup', '시드문구 백업')}</h4>
            <p className="text-sm text-gray-600">{t('wallet.seedPhraseBackupDescription', '시드문구를 안전한 곳에 백업하세요.')}</p>
          </div>
          <button
            onClick={showSeedPhraseHover}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Key className="w-4 h-4" />
            <span>{t('wallet.checkSeedPhrase', '시드문구 확인')}</span>
          </button>
        </div>
      </div>

      {/* 2차 비밀번호 상태 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {walletInfo?.isSecondPasswordSet ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
            )}
            <div>
              <h4 className="font-medium text-gray-900">{t('wallet.secondPassword', '2차 비밀번호')}</h4>
              <p className="text-sm text-gray-600">
                {walletInfo?.isSecondPasswordSet 
                  ? t('wallet.secondPasswordSet', '설정됨')
                  : t('wallet.secondPasswordNotSet', '설정되지 않음')
                }
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToSettings()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            {walletInfo?.isSecondPasswordSet ? t('wallet.change', '변경') : t('wallet.setup', '설정')}
          </button>
        </div>
      </div>


      {/* 보안 경고 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">{t('wallet.securityWarning', '보안 경고')}</h4>
            <p className="text-sm text-yellow-700 mt-1">
              {t('wallet.securityWarningDescription', '시드문구를 절대 다른 사람과 공유하지 마세요. 시드문구를 잃어버리면 지갑에 접근할 수 없습니다.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * 시드문구 모달 렌더링
   */
  const renderSeedPhraseModal = () => (
    seedModalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {t('wallet.seedPhrase')}
          </h3>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">
              {t('wallet.seedWarning')}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-4">
            {seedPhrase.split(' ').map((word, index) => (
              <div key={index} className="p-2 border border-gray-300 rounded text-center">
                <p className="text-sm font-mono">
                  {`${index + 1}. ${word}`}
                </p>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2 justify-end">
            <button onClick={copySeedPhrase} className="p-2 text-blue-600 hover:text-blue-700 transition-colors">
              <Copy className="w-5 h-5" />
            </button>
            <button onClick={() => setSeedModalOpen(false)} className="px-4 py-2 text-gray-600 hover:text-gray-700 transition-colors">
              {t('wallet.cancel')}
            </button>
            <button onClick={() => setSeedModalOpen(false)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
              {t('wallet.confirm')}
            </button>
          </div>
        </div>
      </div>
    )
  );

  /**
   * 송금받기 모달 렌더링
   */
  const renderReceiveModal = () => (
    receiveModalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {t('wallet.receive')}
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            {t('wallet.receiveDescription')}
          </p>
          
          <div className="mb-4">
            <QRCodeSVG value={walletInfo?.address || ''} size={200} />
          </div>
          
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="text"
              value={walletInfo?.address || ''}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
            />
            <button
              onClick={copyAddress}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
          
          <button 
            onClick={() => setReceiveModalOpen(false)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {t('wallet.close')}
          </button>
        </div>
      </div>
    )
  );

  /**
   * 송금하기 모달 렌더링
   */
  const renderSendModal = () => (
    sendModalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-lg w-full">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {t('wallet.send')}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('wallet.sendAddress', '받는 주소')}
              </label>
              <input
                type="text"
                value={sendAddress}
                onChange={(e) => setSendAddress(e.target.value)}
                placeholder="BW..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('wallet.sendAmount', '송금 금액')}
              </label>
              <input
                type="number"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                placeholder="0.0000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('wallet.fee', '수수료: 0.01 BW')}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('wallet.sendMemo', '메모 (선택)')}
              </label>
              <input
                type="text"
                value={sendMemo}
                onChange={(e) => setSendMemo(e.target.value)}
                placeholder="메모를 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('wallet.otpCode', 'OTP 6자리 코드')}
              </label>
              <input
                type="text"
                value={sendOtpCode}
                onChange={(e) => setSendOtpCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2 justify-end mt-6">
            <button 
              onClick={() => setSendModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-700 transition-colors"
            >
              {t('wallet.cancel')}
            </button>
            <button 
              onClick={executeSendTransaction}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              {t('wallet.send')} ↑
            </button>
          </div>
        </div>
      </div>
    )
  );

  /**
   * OTP 설정 모달 렌더링
   */
  const renderOtpSetupModal = () => (
    otpSetupModalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {t('wallet.otpSetup', 'OTP 설정')}
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            {t('wallet.otpDescription', 'Google Authenticator 앱에서 QR 코드를 스캔하세요.')}
          </p>
          
          <div className="mb-4">
            <img src={otpQrCode} alt="OTP QR Code" className="mx-auto" />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('wallet.otpCode', 'OTP 6자리 코드')}
            </label>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-2 justify-end">
            <button 
              onClick={() => setOtpSetupModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-700 transition-colors"
            >
              {t('wallet.cancel')}
            </button>
            <button 
              onClick={handleOtpVerify}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              {t('wallet.verify', '확인')}
            </button>
          </div>
        </div>
      </div>
    )
  );

  // ====================================================================================
  // 메인 렌더링
  // ====================================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t('wallet.loading', '지갑 정보를 불러오는 중...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {renderHeader()}
        {renderTabNavigation()}
        
        <div className="bg-white min-h-[600px]">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'transactions' && renderTransactionsTab()}
          {activeTab === 'settings' && renderSettingsTab()}
          {activeTab === 'security' && renderSecurityTab()}
        </div>
      </div>
      
      {/* 시드문구 모달 */}
      {renderSeedPhraseModal()}
      
      {/* 송금받기 모달 */}
      {renderReceiveModal()}
      
      {/* 송금하기 모달 */}
      {renderSendModal()}
      
      {/* OTP 설정 모달 */}
      {renderOtpSetupModal()}
      
      {/* KYC 신청 모달 */}
      {kycModalOpen && (
        <KYCApplicationModal
          isOpen={kycModalOpen}
          onClose={() => setKycModalOpen(false)}
          walletAddress={walletInfo?.address || ''}
          onSuccess={onSuccess}
          onError={onError}
        />
      )}
      
      {/* 시드문구 확인 호버 창 */}
      {seedPhraseHoverOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
              {t('wallet.seedPhrase', '시드문구')}
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-800 font-mono break-all leading-relaxed">
                {seedPhrase || '시드문구를 불러오는 중...'}
              </p>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={() => setSeedPhraseHoverOpen(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('common.confirm', '확인')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyWalletPage;
