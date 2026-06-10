const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

// SSH Key Path (User local SSH key)
const privateKeyPath = path.join(process.env.USERPROFILE, '.ssh', 'id_ed25519');
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
const targetIP = '141.164.40.101';

const conn = new Client();

function runCommand(conn, cmd) {
  return new Promise((resolve, reject) => {
    console.log(`\n[EXEC] ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = '';
      let stderr = '';
      stream.on('close', (code, signal) => {
        resolve({ code, stdout, stderr });
      }).on('data', (data) => {
        stdout += data;
        process.stdout.write(data);
      }).stderr.on('data', (data) => {
        stderr += data;
        process.stderr.write(data);
      });
    });
  });
}

conn.on('ready', async () => {
  try {
    console.log('=== [1] Git Pull 최신 코드 적용 ===');
    const pullRes = await runCommand(conn, 'cd /root/app && git pull origin main');
    
    console.log('\n=== [2] 프론트엔드 빌드 실행 (빌드가 필요한 경우 수행) ===');
    // 최신 변경 사항에 프론트엔드 코드(src/)가 포함되어 있는지 확인
    const checkFront = await runCommand(conn, 'cd /root/app && git diff --name-only HEAD@{1} HEAD | grep -E "^BitWishNetwork_MiningSystem/src/" || true');
    if (checkFront.stdout.trim()) {
      console.log('🔍 프론트엔드 변경 사항 감지됨! 빌드를 수행합니다 (약 2~3분 소요)...');
      await runCommand(conn, 'cd /root/app/BitWishNetwork_MiningSystem && npx webpack --mode production --config webpack.config.js');
      console.log('✅ 프론트엔드 webpack 빌드 완료!');
      await runCommand(conn, 'cp -r /root/app/BitWishNetwork_MiningSystem/dist/* /var/www/html/');
      console.log('✅ 정적 파일 배포 완료!');
    } else {
      console.log('🟢 프론트엔드 변경 사항이 없어 빌드를 건너뜁니다.');
    }

    console.log('\n=== [3] PM2 백엔드 프로세스 재기동 ===');
    await runCommand(conn, 'cd /root/app/BitWishNetwork_MiningSystem && TS_NODE_PROJECT=server/tsconfig.json pm2 restart bitwish-backend');

    console.log('\n=== [4] PM2 최종 가동 상태 확인 ===');
    await runCommand(conn, 'pm2 status');

    console.log('\n==================================================');
    console.log('🎉 실서버 업데이트 배포가 성공적으로 끝났습니다!');
    console.log('==================================================');
    conn.end();
    process.exit(0);
  } catch (e) {
    console.error('❌ 배포 중 오류 발생:', e);
    conn.end();
    process.exit(1);
  }
}).connect({
  host: targetIP,
  port: 22,
  username: 'root',
  privateKey: privateKey
});
