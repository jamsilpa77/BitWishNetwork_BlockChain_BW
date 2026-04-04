import re

file_path = r'c:\BitWishNetwork_BlockChainMainnet\BitWishNetwork_MiningSystem\src\components\MiningModal\MiningModal.tsx'

# 1. 백업에서 복원 (이전 단계에서 망가졌으므로)
# 하지만 백업은 초기 상태이므로, 제가 이전에 수정한 내용(import 등)이 날아갈 수 있음.
# 따라서 현재 망가진 파일을 읽어서 고치는 것보다, 
# 가장 최근에 성공했던 상태(Step 1138)를 기준으로 다시 작성하는 것이 안전함.
# 하지만 Step 1138의 전체 내용을 가지고 있지 않음.
# 따라서 백업 파일을 읽고, 필요한 모든 수정을 한 번에 적용하는 것이 가장 확실함.

backup_path = r'c:\BitWishNetwork_BlockChainMainnet\backup_20251201_130500\BitWishNetwork_MiningSystem\src\components\MiningModal\MiningModal.tsx'

with open(backup_path, 'r', encoding='utf-8') as f:
    content = f.read()

# -------------------------------------------------------------------------
# 1. Import 추가
# -------------------------------------------------------------------------
imports_to_add = """import { MiningService } from '@/services/MiningService/MiningService';
import { AttendanceBonusService } from '@/services/BonusService/AttendanceBonusService';
import { PartnerBonusService } from '@/services/BonusService/PartnerBonusService';
"""

content = content.replace(
    "import { PrecisionCalculator } from '@/utils/PrecisionCalculator/PrecisionCalculator';",
    f"import {{ PrecisionCalculator }} from '@/utils/PrecisionCalculator/PrecisionCalculator';\n{imports_to_add}"
)

# -------------------------------------------------------------------------
# 2. Service 인스턴스 추가
# -------------------------------------------------------------------------
services = """  const [miningService] = useState(() => new MiningService());
  const [attendanceBonusService] = useState(() => new AttendanceBonusService());
  const [partnerBonusService] = useState(() => new PartnerBonusService());
"""

content = content.replace(
    "  const [precisionCalculator] = useState(() => new PrecisionCalculator());",
    f"  const [precisionCalculator] = useState(() => new PrecisionCalculator());\n{services}"
)

# -------------------------------------------------------------------------
# 3. useEffect 수정 (walletAddress 의존성 추가)
# -------------------------------------------------------------------------
old_useEffect = """  useEffect(() => {
    if (isOpen) {
      initializeMiningModal();
      startRealTimeUpdate();
    }

    return () => {
      stopRealTimeUpdate();
    };
  }, [isOpen]);"""

new_useEffect = """  useEffect(() => {
    if (isOpen) {
      initializeMiningModal();
      startRealTimeUpdate();
    }
    return () => {
      stopRealTimeUpdate();
    };
  }, [isOpen]);

  // 지갑 주소가 변경되면 마이닝 상태 다시 로드
  useEffect(() => {
    if (isOpen && walletAddress) {
      loadMiningStatus();
    }
  }, [walletAddress, isOpen]);"""

content = content.replace(old_useEffect, new_useEffect)

# -------------------------------------------------------------------------
# 4. initializeMiningModal 수정 (로컬 스토리지 로드)
# -------------------------------------------------------------------------
old_init = """  const initializeMiningModal = (): void => {
    try {
      // 언어 설정
      languageManager.setLanguage(currentLanguage);

      // 다크 모드 설정
      const savedTheme = localStorage.getItem('bw-theme');
      if (savedTheme === 'dark') {
        setIsDarkMode(true);
      }

      // 마이닝 상태 로드
      loadMiningStatus();
    } catch (error) {
      console.error('마이닝 모달 초기화 오류:', error);
    }
  };"""

new_init = """  const initializeMiningModal = (): void => {
    try {
      languageManager.setLanguage(currentLanguage);

      const savedTheme = localStorage.getItem('bw-theme');
      if (savedTheme === 'dark') {
        setIsDarkMode(true);
      }

      // [FIX] 실제 지갑 주소 로드
      const savedWallet = localStorage.getItem('bw_wallet_data');
      if (savedWallet) {
        try {
          const parsed = JSON.parse(savedWallet);
          if (parsed.address) {
            console.log('[MiningModal] Loaded wallet address:', parsed.address);
            setWalletAddress(parsed.address);
          }
        } catch (e) {
          console.error('Failed to parse wallet data', e);
        }
      }
      
      // loadMiningStatus는 useEffect[walletAddress]에 의해 호출됨
    } catch (error) {
      console.error('마이닝 모달 초기화 오류:', error);
    }
  };"""

content = content.replace(old_init, new_init)

# -------------------------------------------------------------------------
# 5. loadMiningStatus 함수 교체 (API 호출 구현)
# -------------------------------------------------------------------------
old_function = """  const loadMiningStatus = (): void => {
    try {
      // 마이닝 상태 데이터 로드 (추후 구현)
      console.log('마이닝 상태 로드');
    } catch (error) {
      console.error('마이닝 상태 로드 오류:', error);
    }
  };"""

new_function = """  const loadMiningStatus = async (): Promise<void> => {
    try {
      console.log('마이닝 상태 로드 시작:', walletAddress);
      
      const status = await miningService.getMiningStatus(walletAddress);
      setIsMiningActive(status.status === 'MINING');
      setAccumulatedReward(precisionCalculator.formatForUI(new Decimal(status.accumulatedReward)));
      
      const referralStats = await miningService.getReferralStats(walletAddress);
      console.log('[MiningModal] referralStats:', referralStats);
      
      const attendanceStatus = attendanceBonusService.getAttendanceStatus();
      const partnerStatus = partnerBonusService.getPartnerStatus('current-user');

      setMiningStatus(prev => ({
        ...prev,
        hourlyRate: precisionCalculator.formatForUI(new Decimal(status.currentRate)),
        dailyMax: precisionCalculator.formatForUI(new Decimal(status.currentRate).mul(24)),
        attendanceBonus: status.isAttendanceActive ? '5.00000000' : '0.00000000',
        attendanceStatus: status.isAttendanceActive ? 'ON' : 'OFF',
        referralBonus: referralStats ? new Decimal(referralStats.referralBonusRate).mul(100).toString() : '0',
        referralCount: referralStats ? referralStats.referralCount : 0,
        referralBonusVault: referralStats ? precisionCalculator.formatForUI(new Decimal(referralStats.referralBonusStorage)) : '0.00000000',
        referralRewardVault: referralStats ? precisionCalculator.formatForUI(new Decimal(referralStats.referralRewardStorage)) : '0.00000000',
        partnerStatus: partnerStatus ? '등록됨' : '미등록'
      }));

      if (status.miningTime > 0) {
        const hours = Math.floor(status.miningTime / 3600);
        const minutes = Math.floor((status.miningTime % 3600) / 60);
        const seconds = status.miningTime % 60;
        setMiningTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }

    } catch (error) {
      console.error('마이닝 상태 로드 오류:', error);
    }
  };"""

content = content.replace(old_function, new_function)

# 파일 저장
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ MiningModal.tsx 완전 복구 및 수정 완료')
