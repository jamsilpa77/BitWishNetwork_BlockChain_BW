// ==========================================
// 파일명: repair-and-cron.js
// 기능: 데이터베이스 자동 추적 및 강제 스냅샷 수복 스크립트 (최종형)
// ==========================================

const mongoose = require('mongoose');
const cron = require('node-cron');
require('dotenv').config();

let Decimal;
try {
    Decimal = require('decimal.js');
} catch (e) {
    Decimal = class {
        constructor(v) { this.val = parseFloat(v || 0); }
        plus(v) { return new Decimal(this.val + parseFloat(v.val || v)); }
        gt(v) { return this.val > parseFloat(v.val || v); }
        toString() { return this.val.toFixed(8); }
        toNumber() { return this.val; }
    };
}

// 1. 환경 변수 우선순위 자동 스캔
const mongoUri = process.env.DATABASE_URL || process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bitwish';

function extractAddress(doc) {
    if (!doc) return null;
    return doc.walletAddress || doc.wallet_address || doc.address || doc.userAddress || doc.user_address || doc.wallet;
}

async function runForceResetAndRestoration() {
    console.log('[복구 엔진] 자가 진단 및 자동 연결 추적을 시작합니다...');

    // 환경 변수 마스킹 출력 (디버깅용)
    console.log('[환경 변수 감지 결과]:');
    Object.keys(process.env).forEach(key => {
        if (key.toLowerCase().includes('mongo') || key.toLowerCase().includes('db') || key.toLowerCase().includes('url')) {
            let val = process.env[key];
            if (val && val.includes('@')) {
                val = val.replace(/\/\/[^:]+:[^@]+@/, '//[사용자보안마스킹]@');
            }
            console.log(`  - ${key}: ${val}`);
        }
    });

    try {
        await mongoose.connect(mongoUri);
        const client = mongoose.connection.client;
        let db = client.db(); // 기본 데이터베이스 연결

        console.log(`[현재 기본 연결 DB]: "${mongoose.connection.name}"`);

        // 2. 전체 MongoDB 서버 내 데이터베이스 스캔 및 실제 활성 DB 감지
        let activeDbName = null;
        try {
            const adminDb = client.db().admin();
            const { databases } = await adminDb.listDatabases();
            console.log('[서버 발견 DB 목록]:', databases.map(d => d.name));

            for (const dbInfo of databases) {
                const name = dbInfo.name;
                if (['admin', 'config', 'local'].includes(name)) continue;

                const tempDb = client.db(name);
                const collections = await tempDb.listCollections().toArray();
                const colNames = collections.map(c => c.name);

                // miningstates 또는 이와 유사한 컬렉션이 존재하는지 검증
                const stateColl = colNames.find(c => c.toLowerCase().includes('state') || c.toLowerCase().includes('miningstate'));
                if (stateColl) {
                    const count = await tempDb.collection(stateColl).countDocuments({});
                    if (count > 0) {
                        activeDbName = name;
                        console.log(`[감지 성공] 실제 채굴 데이터가 존재하는 활성 DB를 발견했습니다: "${activeDbName}" (활성 문서: ${count}개)`);
                        break;
                    }
                }
            }
        } catch (authError) {
            console.log('[보안 안내] listDatabases 권한 제한으로 인해 기본 지정된 데이터베이스 이름으로 분석을 진행합니다.');
        }

        // 실제 활성 DB가 검색되었을 경우 해당 데이터베이스로 커넥션 강제 스위칭
        if (activeDbName && activeDbName !== mongoose.connection.name) {
            db = client.db(activeDbName);
            console.log(`[연결 전환] 비어있는 기본 DB에서 실제 데이터베이스인 "${activeDbName}"로 스위칭 완료.`);
        }

        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        console.log('[현재 데이터베이스 컬렉션 목록]:');
        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments({});
            console.log(`  - ${col.name} (데이터 수: ${count}개)`);
        }

        const usersCollName = collectionNames.find(n => n.toLowerCase().includes('user')) || 'users';
        const historyCollName = collectionNames.find(n => n.toLowerCase().includes('history') || n.toLowerCase().includes('monthly')) || 'monthlymininghistories';
        const stateCollName = collectionNames.find(n => n.toLowerCase().includes('state')) || 'miningstates';
        const txCollName = collectionNames.find(n => n.toLowerCase().includes('transaction') || (n.toLowerCase().includes('mining') && !n.toLowerCase().includes('state'))) || 'miningtransactions';

        // 4월 정산 내역 삭제
        await db.collection(historyCollName).deleteMany({ yearMonth: '2026-04' });
        console.log('[작업 1 완료] 4월 테스트 정산 데이터 완전 무효화 성공.');

        // 유저 고유 지갑 주소 수집
        const addressSet = new Set();
        const rawUsers = await db.collection(usersCollName).find({}).toArray();
        rawUsers.forEach(u => {
            const addr = extractAddress(u);
            if (addr) addressSet.add(addr.toString());
        });

        const rawStates = await db.collection(stateCollName).find({}).toArray();
        rawStates.forEach(s => {
            const addr = extractAddress(s);
            if (addr) addressSet.add(addr.toString());
        });

        const targetAddresses = Array.from(addressSet);
        console.log(`[수복 대상 식별] 최종 정산 및 고정 대상 지갑 주소 (${targetAddresses.length}명):`, targetAddresses);

        const mayStart = new Date('2026-04-30T15:00:00.000Z');
        const mayEnd = new Date('2026-05-31T14:59:59.999Z');
        const juneStart = new Date('2026-05-31T15:00:00.000Z');

        for (const address of targetAddresses) {
            // 5월 실제 데이터 집계
            const mayLogs = await db.collection(txCollName).find({
                walletAddress: address,
                createdAt: { $gte: mayStart, $lte: mayEnd }
            }).toArray();

            let mayMined = new Decimal(0);
            let mayBonus = new Decimal(0);

            for (const log of mayLogs) {
                const amt = log.amount ? log.amount.toString() : '0';
                if (log.type === 'MINTING') {
                    mayMined = mayMined.plus(amt);
                } else if (log.type === 'REFERRAL_REWARD') {
                    mayBonus = mayBonus.plus(amt);
                }
            }
            const mayTotal = mayMined.plus(mayBonus);

            if (mayTotal.gt(0)) {
                await db.collection(historyCollName).updateOne(
                    { walletAddress: address, yearMonth: '2026-05' },
                    {
                        $set: {
                            walletAddress: address,
                            yearMonth: '2026-05',
                            minedAmount: mayMined.toString(),
                            bonusAmount: mayBonus.toString(),
                            totalAmount: mayTotal.toString(),
                            settledAt: new Date('2026-05-31T14:59:59.000Z'),
                            migrationStatus: 'LOCKED'
                        }
                    },
                    { upsert: true }
                );
                console.log(`[작업 2 성공] 유저 [${address}] 5월 실채굴량 기록 완료: ${mayTotal.toString()} BW`);
            }

            // 6월 데이터 합산 및 활성 시작점 정렬
            const juneLogs = await db.collection(txCollName).find({
                walletAddress: address,
                createdAt: { $gte: juneStart }
            }).toArray();

            let juneMined = new Decimal(0);
            let juneBonus = new Decimal(0);

            for (const log of juneLogs) {
                const amt = log.amount ? log.amount.toString() : '0';
                if (log.type === 'MINTING') {
                    juneMined = juneMined.plus(amt);
                } else if (log.type === 'REFERRAL_REWARD') {
                    juneBonus = juneBonus.plus(amt);
                }
            }

            await db.collection(stateCollName).updateOne(
                { walletAddress: address },
                {
                    $set: {
                        startedAt: juneStart,
                        accumulatedReward: juneMined.toNumber(),
                        referralBonusStorage: juneBonus.toNumber()
                    }
                },
                { upsert: true }
            );
            console.log(`[작업 3 성공] 유저 [${address}] 6월 라이브 시작일 고정 완료.`);
        }

        console.log('[수복 완료] 🎉 모든 데이터베이스 복구 및 6월 시작일 실시간 리셋 정렬이 성공적으로 완료되었습니다.');
    } catch (error) {
        console.error('[복구 엔진 에러] 작업 도중 치명적인 에러가 발생했습니다:', error);
    }
}

async function runMonthlyClosing() {
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);

    let targetYear = kstNow.getUTCFullYear();
    let targetMonth = kstNow.getUTCMonth();

    if (targetMonth === 0) {
        targetMonth = 12;
        targetYear -= 1;
    }

    const yearMonthStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
    console.log(`[마감 엔진] ${yearMonthStr} 월 정산 마감 작업을 시작합니다...`);

    try {
        const db = await connectDB();
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        const usersCollName = collectionNames.find(n => n.toLowerCase().includes('user')) || 'users';
        const historyCollName = collectionNames.find(n => n.toLowerCase().includes('history') || n.toLowerCase().includes('monthly')) || 'monthlymininghistories';
        const stateCollName = collectionNames.find(n => n.toLowerCase().includes('state')) || 'miningstates';
        const txCollName = collectionNames.find(n => n.toLowerCase().includes('transaction') || (n.toLowerCase().includes('mining') && !n.toLowerCase().includes('state'))) || 'miningtransactions';

        const rawUsers = await db.collection(usersCollName).find({}).toArray();
        const rawStates = await db.collection(stateCollName).find({}).toArray();

        const addressSet = new Set();
        rawUsers.forEach(u => { const addr = extractAddress(u); if (addr) addressSet.add(addr.toString()); });
        rawStates.forEach(s => { const addr = extractAddress(s); if (addr) addressSet.add(addr.toString()); });
        const targetAddresses = Array.from(addressSet);

        const kstStart = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0));
        const kstEnd = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59));

        const utcStart = new Date(kstStart.getTime() - kstOffset);
        const utcEnd = new Date(kstEnd.getTime() - kstOffset);

        for (const address of targetAddresses) {
            const logs = await db.collection(txCollName).find({
                walletAddress: address,
                createdAt: { $gte: utcStart, $lte: utcEnd }
            }).toArray();

            let mined = new Decimal(0);
            let bonus = new Decimal(0);

            for (const log of logs) {
                const amt = log.amount ? log.amount.toString() : '0';
                if (log.type === 'MINTING') {
                    mined = mined.plus(amt);
                } else if (log.type === 'REFERRAL_REWARD') {
                    bonus = bonus.plus(amt);
                }
            }
            const total = mined.plus(bonus);

            await db.collection(historyCollName).updateOne(
                { walletAddress: address, yearMonth: yearMonthStr },
                {
                    $set: {
                        walletAddress: address,
                        yearMonth: yearMonthStr,
                        minedAmount: mined.toString(),
                        bonusAmount: bonus.toString(),
                        totalAmount: total.toString(),
                        settledAt: utcEnd,
                        migrationStatus: 'LOCKED'
                    }
                },
                { upsert: true }
            );

            await db.collection(stateCollName).updateOne(
                { walletAddress: address },
                {
                    $set: {
                        startedAt: new Date(utcEnd.getTime() + 1000),
                        accumulatedReward: 0,
                        referralBonusStorage: 0
                    }
                }
            );
        }
        console.log(`[마감 엔진] 🎉 ${yearMonthStr} 정산 처리가 완료되었습니다.`);
    } catch (error) {
        console.error(`[마감 엔진 오류] ${yearMonthStr} 마감 에러:`, error);
    }
}

async function main() {
    await runForceResetAndRestoration();

    console.log('[스케줄러] 매월 1일 00:00:05 (KST) 자동 정산 스케줄을 활성화합니다.');
    cron.schedule('5 0 0 1 * *', async () => {
        await runMonthlyClosing();
    }, {
        scheduled: true,
        timezone: "Asia/Seoul"
    });
}

main().catch(console.error);