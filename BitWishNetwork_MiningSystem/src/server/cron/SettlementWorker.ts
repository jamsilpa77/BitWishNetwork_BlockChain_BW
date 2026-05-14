/**
 * BitWishNetwork BW 정산 엔진 및 타임락 오토메이션
 * 
 * ⚠️ 절대 금지 규칙 및 중요 준수 사항 10000% 적용:
 * 1. 기존 코드 간섭/수정 절대 금지 (독립 실행형 백그라운드 워커)
 * 2. 전역 변수, 공통 함수, 공통 클래스 사용 금지
 * 3. 유저 개인 단독 데이터베이스(MongoDB 하이브리드) 원칙 철저 준수
 * 4. 마스터플랜 [공정 4] 내용 그대로만 구현
 */

import * as cron from 'node-cron';
import { MongoClient, Db } from 'mongodb';
// Decimal.js를 사용하여 50자리 부동소수점 정밀 계산 (마스터플랜 절대 규칙)
import Decimal from 'decimal.js';

// [최적화] 데이터 뼈대(Interface) 명시 (TS 에러 방어용)
interface UserCatalogDoc { walletAddress: string; }
interface KycDataDoc { status: string; approvedAt: string | Date; }
interface MiningLedgerDoc { _id?: any; minedAmount: string; status: string; monthIndex?: string; snapshotAt?: Date; releasedAt?: Date; settledAt?: Date; }
interface SystemPoolDoc { address: string; balance: string; lastUpdatedAt?: Date; }
interface WalletDoc { address: string; availableBalance: string; lastUpdatedAt?: Date; }
interface MiningCurrentDoc { address: string; amount: string; }

export class SettlementWorker {
    private readonly dbUri: string;
    private readonly poolAddress = 'BitWish-Miner-Pool'; // 65% 채굴자 풀 지갑

    constructor() {
        // 전역 변수를 쓰지 않고 독립된 인스턴스 변수로 관리
        this.dbUri = process.env['MONGODB_URI'] || 'mongodb://localhost:27017';
        this.initializeMidnightPatrol();
        this.initializeMonthlySnapshot();
    }

    /**
     * [자정 순찰대] 매일 밤 자정(00:00:00) 기한 도래 유저 전수 검증
     */
    private initializeMidnightPatrol(): void {
        // 매일 밤 00:00:00 에 실행
        cron.schedule('0 0 * * *', async () => {
            console.log(`[SettlementWorker] 자정 순찰대 가동: 타임락 15일 만료 유저 전수 검증 시작`);
            await this.executeTimelockRelease();
        });
    }

    /**
     * [스냅샷] 매월 말일 23:59:59 스냅샷 가동
     */
    private initializeMonthlySnapshot(): void {
        // 매월 말일 23:59:59 실행 로직 (크론식: 59 59 23 28-31 * *)
        // 로직의 안전성을 위해 매일 23:59:59에 내일이 1일인지 검증하여 실행
        cron.schedule('59 59 23 * * *', async () => {
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 1000); // 1초 뒤 (다음 달 1일 00:00:00 정각)
            
            // 현재 달과 1초 뒤의 달이 달라지는 순간이 바로 '말일 23:59:59'임
            if (now.getMonth() !== tomorrow.getMonth()) {
                console.log(`[SettlementWorker] 말일 스냅샷 가동: 월간 마이닝 데이터 보존 및 초기화`);
                await this.executeMonthlySnapshot();
            }
        });
    }

    /**
     * 15일 타임락 해제 및 1:1 순차 지급 로직
     */
    private async executeTimelockRelease(): Promise<void> {
        let client: MongoClient | null = null;
        try {
            client = new MongoClient(this.dbUri);
            await client.connect();

            // 시스템 마스터 DB 연결
            const masterDb: Db = client.db('BitWish_Master_System');
            const poolCollection = masterDb.collection<SystemPoolDoc>('System_Pools');

            // 1. 개별 유저 DB 조회 (하이브리드 독립 DB 원칙 준수)
            // 유저 카탈로그에서 전체 유저 DB 이름 목록을 가져옴
            const userCatalog = masterDb.collection<UserCatalogDoc>('User_Catalog');
            const userCursor = userCatalog.find({});

            for await (const user of userCursor) {
                // 유저 개인 단독 데이터베이스 접근
                const userDb: Db = client.db(`BitWish_UserDB_${user.walletAddress}`);
                const kycInfo = await userDb.collection<KycDataDoc>('KYC_Data').findOne({ status: 'APPROVED' });

                if (!kycInfo || !kycInfo.approvedAt) continue;

                // 타임락 검증 (승인일로부터 15일 경과 여부)
                const approvedDate = new Date(kycInfo.approvedAt);
                const currentDate = new Date();
                const diffTime = Math.abs(currentDate.getTime() - approvedDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays >= 15) {
                    // 타임락 완료: 지급 로직 시작
                    const miningData = await userDb.collection<MiningLedgerDoc>('Mining_Ledger').find({ status: 'LOCKED' }).sort({ monthIndex: 1 }).toArray();

                    if (miningData.length > 0) {
                        // 역사상 첫 채굴 월부터 순차 지급 (1:1 대응)
                        const targetMonthData = miningData[0]; // 가장 오래된 락 데이터
                        if (!targetMonthData) continue; // 배열 접근 방어
                        const transferAmount = new Decimal(targetMonthData.minedAmount);

                        // 금융 무결성 방어: 65% 풀 잔액에서 실시간 차감
                        const minerPool = await poolCollection.findOne({ address: this.poolAddress });
                        if (minerPool && new Decimal(minerPool.balance).gte(transferAmount)) {

                            // 1. 풀에서 차감 (-)
                            const newPoolBalance = new Decimal(minerPool.balance).minus(transferAmount).toFixed(50);
                            await poolCollection.updateOne(
                                { address: this.poolAddress },
                                { $set: { balance: newPoolBalance, lastUpdatedAt: new Date() } }
                            );

                            // 2. 유저 가용 잔액 증가 (+)
                            const userWallet = await userDb.collection<WalletDoc>('Wallet').findOne({ address: user.walletAddress });
                            const currentBalance = userWallet ? new Decimal(userWallet.availableBalance) : new Decimal(0);
                            const newBalance = currentBalance.plus(transferAmount).toFixed(50);

                            await userDb.collection<WalletDoc>('Wallet').updateOne(
                                { address: user.walletAddress },
                                { $set: { availableBalance: newBalance, lastUpdatedAt: new Date() } },
                                { upsert: true }
                            );

                            // 3. 해당 채굴 월 상태 완료 처리
                            await userDb.collection<MiningLedgerDoc>('Mining_Ledger').updateOne(
                                { _id: targetMonthData._id },
                                { $set: { status: 'RELEASED', releasedAt: new Date() } }
                            );

                            console.log(`[SettlementWorker] 지급 완료: ${user.walletAddress}에게 ${transferAmount.toString()} BW 지급 (타임락 해제)`);
                        } else {
                            console.error(`[SettlementWorker] 심각한 오류: ${this.poolAddress} 풀 잔액이 부족하거나 존재하지 않습니다.`);
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`[SettlementWorker] 타임락 해제 처리 중 오류 발생:`, error);
        } finally {
            if (client) {
                await client.close();
            }
        }
    }

    /**
     * 매월 말일 스냅샷 로직
     */
    private async executeMonthlySnapshot(): Promise<void> {
        let client: MongoClient | null = null;
        try {
            client = new MongoClient(this.dbUri);
            await client.connect();
            const masterDb: Db = client.db('BitWish_Master_System');
            const userCatalog = masterDb.collection<UserCatalogDoc>('User_Catalog');
            const userCursor = userCatalog.find({});

            for await (const user of userCursor) {
                const userDb: Db = client.db(`BitWish_UserDB_${user.walletAddress}`);
                
                // [거버넌스 수복] 유저의 KYC 승인 상태 실시간 대조
                const kycInfo = await userDb.collection<KycDataDoc>('KYC_Data').findOne({});
                const isKycApproved = kycInfo?.status === 'APPROVED';
                
                const currentMining = await userDb.collection<MiningCurrentDoc>('Mining_Current').findOne({ address: user.walletAddress });

                if (currentMining && new Decimal(currentMining.amount).gt(0)) {
                    const finalAmount = new Decimal(currentMining.amount).toFixed(50);
                    const settlementStatus = isKycApproved ? 'LOCKED' : 'WAITING_KYC';

                    // 이번 달 채굴량을 거버넌스 원칙(KYC 상태)에 따라 자동 분류하여 스냅샷 저장
                    await userDb.collection<MiningLedgerDoc>('Mining_Ledger').insertOne({
                        monthIndex: new Date().toISOString().slice(0, 7), // YYYY-MM
                        minedAmount: finalAmount,
                        status: settlementStatus,
                        snapshotAt: new Date(),
                        settledAt: new Date() // UI 날짜 바인딩용 정산 기점 기록
                    });

                    // 현재 채굴량 초기화
                    await userDb.collection<MiningCurrentDoc>('Mining_Current').updateOne(
                        { address: user.walletAddress },
                        { $set: { amount: "0.00000000000000000000000000000000000000000000000000" } }
                    );
                    
                    console.log(`[SettlementWorker] 정산 완료: ${user.walletAddress} (${settlementStatus}) - Amount: ${finalAmount}`);
                }
            }
            console.log(`[SettlementWorker] ${new Date().toISOString().slice(0, 7)} 월간 무인 스냅샷 공정 성공적 종료`);
        } catch (error) {
            console.error(`[SettlementWorker] 월간 스냅샷 처리 중 심각한 오류 발생:`, error);
        } finally {
            if (client) {
                await client.close();
            }
        }
    }
}

