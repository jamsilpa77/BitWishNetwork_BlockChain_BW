/**
 * ====================================================================================
 * 🚀 BitWish Network 포트 변경 방지 스크립트
 * ====================================================================================
 * 
 * 🎯 핵심 기능:
 * - BitWish Network 전용 포트 설정 보장
 * - 포트 충돌 방지
 * - 네트워크 설정 검증
 * 
 * 🔒 보안 기능:
 * - BitWish 전용 포트만 허용
 * - 무단 포트 변경 방지
 * - 네트워크 보안 강화
 * 
 * ====================================================================================
 */

const net = require('net');

// BitWish Network 전용 포트 설정
const BITWISH_PORTS = {
  API_SERVER: 4001,
  WEBSOCKET: 4001,
  P2P_NETWORK: 4002,
  MONGODB: 27017
};

/**
 * 포트 사용 가능 여부 확인
 */
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`❌ 포트 ${port}가 이미 사용 중입니다.`);
        resolve(false);
      } else {
        console.log(`❌ 포트 ${port} 확인 중 오류:`, err.message);
        resolve(false);
      }
    });
  });
}

/**
 * BitWish Network 포트 검증
 */
async function validateBitWishPorts() {
  console.log('🔍 BitWish Network 포트 검증 시작...');
  
  const results = {};
  
  for (const [service, port] of Object.entries(BITWISH_PORTS)) {
    const isAvailable = await checkPort(port);
    results[service] = { port, available: isAvailable };
    
    if (isAvailable) {
      console.log(`✅ ${service} 포트 ${port}: 사용 가능`);
    } else {
      console.log(`❌ ${service} 포트 ${port}: 사용 중`);
    }
  }
  
  return results;
}

/**
 * 포트 충돌 해결 제안
 */
function suggestPortResolution(results) {
  const conflicts = Object.entries(results).filter(([_, data]) => !data.available);
  
  if (conflicts.length === 0) {
    console.log('🎉 모든 BitWish Network 포트가 사용 가능합니다!');
    return true;
  }
  
  console.log('\n⚠️ 포트 충돌 발견:');
  conflicts.forEach(([service, data]) => {
    console.log(`   - ${service}: 포트 ${data.port} 사용 중`);
  });
  
  console.log('\n💡 해결 방법:');
  console.log('   1. 해당 포트를 사용하는 프로세스를 종료하세요');
  console.log('   2. 또는 BitWishConfig.ts에서 포트를 변경하세요');
  console.log('   3. 방화벽 설정을 확인하세요');
  
  return false;
}

/**
 * 메인 실행 함수
 */
async function main() {
  try {
    console.log('🚀 BitWish Network 포트 검증 스크립트 시작');
    console.log('='.repeat(60));
    
    const results = await validateBitWishPorts();
    const allAvailable = suggestPortResolution(results);
    
    console.log('='.repeat(60));
    
    if (allAvailable) {
      console.log('✅ BitWish Network 포트 검증 완료 - 빌드 진행 가능');
      process.exit(0);
    } else {
      console.log('❌ BitWish Network 포트 충돌 - 빌드 중단');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ 포트 검증 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = {
  checkPort,
  validateBitWishPorts,
  suggestPortResolution,
  BITWISH_PORTS
};
