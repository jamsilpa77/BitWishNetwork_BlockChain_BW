const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'MiningModal', 'MiningModal.tsx');

let content = fs.readFileSync(filePath, 'utf8');

// 1. Import 추가
const importToAdd = `import { MiningService } from '@/services/MiningService/MiningService';
import { AttendanceBonusService } from '@/services/BonusService/AttendanceBonusService';
import { PartnerBonusService } from '@/services/BonusService/PartnerBonusService';
`;

// PrecisionCalculator import 다음에 추가
content = content.replace(
    `import { PrecisionCalculator } from '@/utils/PrecisionCalculator/PrecisionCalculator';`,
    `import { PrecisionCalculator } from '@/utils/PrecisionCalculator/PrecisionCalculator';\n${importToAdd}`
);

// 2. Service 인스턴스 추가
const serviceInstances = `  const [miningService] = useState(() => new MiningService());
  const [attendanceBonusService] = useState(() => new AttendanceBonusService());
  const [partnerBonusService] = useState(() => new PartnerBonusService());
`;

content = content.replace(
    `  const [precisionCalculator] = useState(() => new PrecisionCalculator());`,
    `  const [precisionCalculator] = useState(() => new PrecisionCalculator());\n${serviceInstances}`
);

// 3. loadMiningStatus 함수 교체
const oldLoadMiningStatus = `  const loadMiningStatus = (): void => {
    try {
      // 마이닝 상태 데이터 로드 (추후 구현)
      console.log('마이닝 상태 로드');
    } catch (error) {
      console.error('마이닝 상태 로드 오류:', error);
    }
  };`;

const newLoadMiningStatus = `  const loadMiningStatus = async (): Promise<void> => {
    try {
      console.log('마이닝 상태 로드 시작:', walletAddress);
      
      // 1. 기본 마이닝 상태 조회
      const status = await miningService.getMiningStatus(walletAddress);
      setIsMiningActive(status.status === 'MINING');
      setAccumulatedReward(precisionCalculator.formatForUI(new Decimal(status.accumulatedReward)));
      
      // 2. 추천 통계 조회
      const referralStats = await miningService.getReferralStats(walletAddress);
      console.log('[MiningModal] referralStats:', referralStats);
      
      // 3. 출석 상태 조회
      const attendanceStatus = attendanceBonusService.getAttendanceStatus();
      
      // 4. 가맹점 상태 조회
      const partnerStatus = partnerBonusService.getPartnerStatus('current-user');

      // 상태 업데이트
      setMiningStatus(prev => ({
        ...prev,
        hourlyRate: precisionCalculator.formatForUI(new Decimal(status.currentRate)), // 서버에서 받은 실제 채굴률
        dailyMax: precisionCalculator.formatForUI(new Decimal(status.currentRate).mul(24)), // 일일 최대 = 시간당 * 24
        attendanceBonus: status.isAttendanceActive ? '5.00000000' : '0.00000000',
        attendanceStatus: status.isAttendanceActive ? 'ON' : 'OFF',
        
        // 추천 관련 데이터 (DB 연동)
        referralBonus: referralStats ? new Decimal(referralStats.referralBonusRate).mul(100).toString() : '0', // 0.06 -> 6%
        referralCount: referralStats ? referralStats.referralCount : 0,
        referralBonusVault: referralStats ? precisionCalculator.formatForUI(new Decimal(referralStats.referralBonusStorage)) : '0.00000000',
        referralRewardVault: referralStats ? precisionCalculator.formatForUI(new Decimal(referralStats.referralRewardStorage)) : '0.00000000',
        
        partnerStatus: partnerStatus ? '등록됨' : '미등록'
      }));

      // 마이닝 시간 설정 (초 -> 시:분:초)
      if (status.miningTime > 0) {
        const hours = Math.floor(status.miningTime / 3600);
        const minutes = Math.floor((status.miningTime % 3600) / 60);
        const seconds = status.miningTime % 60;
        setMiningTime(\`\${hours.toString().padStart(2, '0')}:\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`);
      }

    } catch (error) {
      console.error('마이닝 상태 로드 오류:', error);
    }
  };`;

content = content.replace(oldLoadMiningStatus, newLoadMiningStatus);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ MiningModal.tsx 수정 완료');
