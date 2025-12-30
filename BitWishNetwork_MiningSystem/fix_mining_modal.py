import re

file_path = r'c:\BitWishNetwork_BlockChainMainnet\BitWishNetwork_MiningSystem\src\components\MiningModal\MiningModal.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Import 추가
imports_to_add = """import { MiningService } from '@/services/MiningService/MiningService';
import { AttendanceBonusService } from '@/services/BonusService/AttendanceBonusService';
import { PartnerBonusService } from '@/services/BonusService/PartnerBonusService';
"""

content = content.replace(
    "import { PrecisionCalculator } from '@/utils/PrecisionCalculator/PrecisionCalculator';",
    f"import {{ PrecisionCalculator }} from '@/utils/PrecisionCalculator/PrecisionCalculator';\n{imports_to_add}"
)

# 2. Service 인스턴스 추가
services = """  const [miningService] = useState(() => new MiningService());
  const [attendanceBonusService] = useState(() => new AttendanceBonusService());
  const [partnerBonusService] = useState(() => new PartnerBonusService());
"""

content = content.replace(
    "  const [precisionCalculator] = useState(() => new PrecisionCalculator());",
    f"  const [precisionCalculator] = useState(() => new PrecisionCalculator());\n{services}"
)

# 3. loadMiningStatus 함수 교체
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

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ MiningModal.tsx 수정 완료')
