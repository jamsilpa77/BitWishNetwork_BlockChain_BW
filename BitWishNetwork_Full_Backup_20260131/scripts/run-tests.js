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
 * ✅ 모든 파일 첫 줄부터 주석에 절대 준수사항 명시 추가
 * ✅ 자체 보안 검증만 사용
 * ✅ 50단위 부동소수점 정밀 계산형식으로 구현 하지만 UI 홈페이지 이미지상 소수즘 8자리만 표기한다. 
 * ✅ BitWish Network 전용 시스템만 사용
 * ✅ 모든 텍스트는 한국어, 영어, 일어, 중국어포함 동남아권 언어 변경 되도록 모든 기능에 완벽하게 구현한다. 
 *        단 절대 복잡하게 파일들을 만들지 않도록한다. 
 * ✅ 마이닝 페이지는 완벽한 독립성 보장과 완벽한 데이터베이스 MongDB 하이브리드 완벽 저장소 구현한다. 
 * ✅ 유저는 1명이든 천만명이든 개인 단독 데이터베이스 MongDB 하이브리드 완벽 저장소를 구현한다.
 */

const { execSync } = require('child_process');
const path = require('path');

/**
 * 테스트 실행 스크립트 - 완벽한 독립성 보장
 * 단위 테스트, 통합 테스트, 성능 테스트, 보안 테스트 실행
 */
class TestRunner {
  constructor() {
    // 절대 준수사항: 전역 변수 사용 금지
    this.testResults = {
      unit: { passed: 0, failed: 0, total: 0 },
      integration: { passed: 0, failed: 0, total: 0 },
      performance: { passed: 0, failed: 0, total: 0 },
      security: { passed: 0, failed: 0, total: 0 }
    };
  }

  /**
   * 단위 테스트 실행
   */
  async runUnitTests() {
    console.log('🧪 단위 테스트 실행 중...');
    
    try {
      const unitTestFiles = [
        'tests/unit/PrecisionCalculator.test.ts',
        'tests/unit/MiningService.test.ts',
        'tests/unit/BonusSystem.test.ts'
      ];

      for (const testFile of unitTestFiles) {
        const result = execSync(`npx jest ${testFile} --verbose`, { 
          encoding: 'utf8',
          cwd: path.join(__dirname, '..')
        });
        
        console.log(`✅ ${testFile} 테스트 완료`);
        this.testResults.unit.passed++;
      }
      
      this.testResults.unit.total = unitTestFiles.length;
      console.log(`✅ 단위 테스트 완료: ${this.testResults.unit.passed}/${this.testResults.unit.total} 통과`);
      
    } catch (error) {
      console.error('❌ 단위 테스트 실패:', error.message);
      this.testResults.unit.failed++;
    }
  }

  /**
   * 통합 테스트 실행
   */
  async runIntegrationTests() {
    console.log('🔗 통합 테스트 실행 중...');
    
    try {
      const integrationTestFiles = [
        'tests/integration/SystemIntegration.test.ts'
      ];

      for (const testFile of integrationTestFiles) {
        const result = execSync(`npx jest ${testFile} --verbose --timeout=30000`, { 
          encoding: 'utf8',
          cwd: path.join(__dirname, '..')
        });
        
        console.log(`✅ ${testFile} 테스트 완료`);
        this.testResults.integration.passed++;
      }
      
      this.testResults.integration.total = integrationTestFiles.length;
      console.log(`✅ 통합 테스트 완료: ${this.testResults.integration.passed}/${this.testResults.integration.total} 통과`);
      
    } catch (error) {
      console.error('❌ 통합 테스트 실패:', error.message);
      this.testResults.integration.failed++;
    }
  }

  /**
   * 성능 테스트 실행
   */
  async runPerformanceTests() {
    console.log('⚡ 성능 테스트 실행 중...');
    
    try {
      const performanceTestFiles = [
        'tests/performance/PerformanceTest.ts'
      ];

      for (const testFile of performanceTestFiles) {
        const result = execSync(`npx jest ${testFile} --verbose --timeout=60000`, { 
          encoding: 'utf8',
          cwd: path.join(__dirname, '..')
        });
        
        console.log(`✅ ${testFile} 테스트 완료`);
        this.testResults.performance.passed++;
      }
      
      this.testResults.performance.total = performanceTestFiles.length;
      console.log(`✅ 성능 테스트 완료: ${this.testResults.performance.passed}/${this.testResults.performance.total} 통과`);
      
    } catch (error) {
      console.error('❌ 성능 테스트 실패:', error.message);
      this.testResults.performance.failed++;
    }
  }

  /**
   * 보안 테스트 실행
   */
  async runSecurityTests() {
    console.log('🔒 보안 테스트 실행 중...');
    
    try {
      const securityTestFiles = [
        'tests/security/SecurityTest.ts'
      ];

      for (const testFile of securityTestFiles) {
        const result = execSync(`npx jest ${testFile} --verbose --timeout=30000`, { 
          encoding: 'utf8',
          cwd: path.join(__dirname, '..')
        });
        
        console.log(`✅ ${testFile} 테스트 완료`);
        this.testResults.security.passed++;
      }
      
      this.testResults.security.total = securityTestFiles.length;
      console.log(`✅ 보안 테스트 완료: ${this.testResults.security.passed}/${this.testResults.security.total} 통과`);
      
    } catch (error) {
      console.error('❌ 보안 테스트 실패:', error.message);
      this.testResults.security.failed++;
    }
  }

  /**
   * 모든 테스트 실행
   */
  async runAllTests() {
    console.log('🚀 BitWishNetwork 테스트 시작...\n');
    
    const startTime = Date.now();
    
    // 단위 테스트
    await this.runUnitTests();
    console.log('');
    
    // 통합 테스트
    await this.runIntegrationTests();
    console.log('');
    
    // 성능 테스트
    await this.runPerformanceTests();
    console.log('');
    
    // 보안 테스트
    await this.runSecurityTests();
    console.log('');
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // 테스트 결과 요약
    this.printTestSummary(totalTime);
  }

  /**
   * 테스트 결과 요약 출력
   */
  printTestSummary(totalTime) {
    console.log('📊 테스트 결과 요약');
    console.log('='.repeat(50));
    
    const testTypes = ['unit', 'integration', 'performance', 'security'];
    const testNames = ['단위 테스트', '통합 테스트', '성능 테스트', '보안 테스트'];
    
    let totalPassed = 0;
    let totalFailed = 0;
    let totalTests = 0;
    
    for (let i = 0; i < testTypes.length; i++) {
      const type = testTypes[i];
      const name = testNames[i];
      const passed = this.testResults[type].passed;
      const failed = this.testResults[type].failed;
      const total = this.testResults[type].total;
      
      console.log(`${name}: ${passed}/${total} 통과 (${failed} 실패)`);
      
      totalPassed += passed;
      totalFailed += failed;
      totalTests += total;
    }
    
    console.log('='.repeat(50));
    console.log(`총 테스트: ${totalTests}개`);
    console.log(`통과: ${totalPassed}개`);
    console.log(`실패: ${totalFailed}개`);
    console.log(`성공률: ${((totalPassed / totalTests) * 100).toFixed(2)}%`);
    console.log(`총 실행 시간: ${(totalTime / 1000).toFixed(2)}초`);
    
    if (totalFailed === 0) {
      console.log('\n🎉 모든 테스트가 성공적으로 완료되었습니다!');
    } else {
      console.log('\n⚠️ 일부 테스트가 실패했습니다. 로그를 확인해주세요.');
    }
  }

  /**
   * 특정 테스트만 실행
   */
  async runSpecificTest(testType) {
    console.log(`🎯 ${testType} 테스트 실행 중...\n`);
    
    switch (testType) {
      case 'unit':
        await this.runUnitTests();
        break;
      case 'integration':
        await this.runIntegrationTests();
        break;
      case 'performance':
        await this.runPerformanceTests();
        break;
      case 'security':
        await this.runSecurityTests();
        break;
      default:
        console.error('❌ 잘못된 테스트 타입입니다. (unit, integration, performance, security)');
        return;
    }
  }
}

// 메인 실행 함수
async function main() {
  const testRunner = new TestRunner();
  
  const args = process.argv.slice(2);
  const testType = args[0];
  
  if (testType) {
    await testRunner.runSpecificTest(testType);
  } else {
    await testRunner.runAllTests();
  }
}

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error);
}

module.exports = TestRunner;
