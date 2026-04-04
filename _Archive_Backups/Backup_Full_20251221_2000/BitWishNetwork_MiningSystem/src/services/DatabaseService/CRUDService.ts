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

import { Db, Collection, ObjectId } from 'mongodb';
import { 
  User, 
  MiningRecord, 
  AttendanceRecord, 
  ReferralRecord, 
  PartnerRecord,
  Wallet,
  Transaction,
  Block
} from '@/types';
import { DatabaseSchema } from './DatabaseSchema';

/**
 * CRUD 서비스 클래스 - 완벽한 독립성 보장
 * Create, Read, Update, Delete 작업 구현
 */
export class CRUDService {
  private database: Db;
  private userId: string;

  constructor(database: Db, userId: string) {
    // 절대 준수사항: 전역 변수 사용 금지
    this.database = database;
    this.userId = userId;
  }

  /**
   * 사용자 생성
   */
  public async createUser(userData: User): Promise<{
    success: boolean;
    message?: string;
    insertedId?: string;
  }> {
    try {
      const usersCollection = this.database.collection<User>('users');
      
      // 중복 검사
      const existingUser = await usersCollection.findOne({ 
        $or: [
          { userId: userData.userId },
          { email: userData.email },
          { walletAddress: userData.walletAddress }
        ]
      });

      if (existingUser) {
        return {
          success: false,
          message: '이미 존재하는 사용자입니다'
        };
      }

      const result = await usersCollection.insertOne(userData);

      return {
        success: true,
        message: '사용자 생성 성공',
        insertedId: result.insertedId.toString()
      };
    } catch (error) {
      return {
        success: false,
        message: `사용자 생성 실패: ${error}`
      };
    }
  }

  /**
   * 사용자 조회
   */
  public async getUser(userId: string): Promise<{
    success: boolean;
    message?: string;
    userData?: User;
  }> {
    try {
      const usersCollection = this.database.collection<User>('users');
      const userData = await usersCollection.findOne({ userId: userId });

      if (!userData) {
        return {
          success: false,
          message: '사용자를 찾을 수 없습니다'
        };
      }

      return {
        success: true,
        message: '사용자 조회 성공',
        userData: userData
      };
    } catch (error) {
      return {
        success: false,
        message: `사용자 조회 실패: ${error}`
      };
    }
  }

  /**
   * 사용자 업데이트
   */
  public async updateUser(userId: string, updateData: Partial<User>): Promise<{
    success: boolean;
    message?: string;
    modifiedCount?: number;
  }> {
    try {
      const usersCollection = this.database.collection<User>('users');
      
      updateData.updatedAt = new Date();
      const result = await usersCollection.updateOne(
        { userId: userId },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return {
          success: false,
          message: '업데이트할 사용자를 찾을 수 없습니다'
        };
      }

      return {
        success: true,
        message: '사용자 업데이트 성공',
        modifiedCount: result.modifiedCount
      };
    } catch (error) {
      return {
        success: false,
        message: `사용자 업데이트 실패: ${error}`
      };
    }
  }

  /**
   * 사용자 삭제
   */
  public async deleteUser(userId: string): Promise<{
    success: boolean;
    message?: string;
    deletedCount?: number;
  }> {
    try {
      const usersCollection = this.database.collection<User>('users');
      const result = await usersCollection.deleteOne({ userId: userId });

      if (result.deletedCount === 0) {
        return {
          success: false,
          message: '삭제할 사용자를 찾을 수 없습니다'
        };
      }

      return {
        success: true,
        message: '사용자 삭제 성공',
        deletedCount: result.deletedCount
      };
    } catch (error) {
      return {
        success: false,
        message: `사용자 삭제 실패: ${error}`
      };
    }
  }

  /**
   * 마이닝 기록 생성
   */
  public async createMiningRecord(miningData: MiningRecord): Promise<{
    success: boolean;
    message?: string;
    insertedId?: string;
  }> {
    try {
      const miningCollection = this.database.collection<MiningRecord>('mining_records');
      const result = await miningCollection.insertOne(miningData);

      return {
        success: true,
        message: '마이닝 기록 생성 성공',
        insertedId: result.insertedId.toString()
      };
    } catch (error) {
      return {
        success: false,
        message: `마이닝 기록 생성 실패: ${error}`
      };
    }
  }

  /**
   * 마이닝 기록 조회
   */
  public async getMiningRecords(userId: string, limit: number = 100): Promise<{
    success: boolean;
    message?: string;
    miningRecords?: MiningRecord[];
  }> {
    try {
      const miningCollection = this.database.collection<MiningRecord>('mining_records');
      const miningRecords = await miningCollection
        .find({ userId: userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

      return {
        success: true,
        message: '마이닝 기록 조회 성공',
        miningRecords: miningRecords
      };
    } catch (error) {
      return {
        success: false,
        message: `마이닝 기록 조회 실패: ${error}`
      };
    }
  }

  /**
   * 출석 기록 생성
   */
  public async createAttendanceRecord(attendanceData: AttendanceRecord): Promise<{
    success: boolean;
    message?: string;
    insertedId?: string;
  }> {
    try {
      const attendanceCollection = this.database.collection<AttendanceRecord>('attendance_records');
      const result = await attendanceCollection.insertOne(attendanceData);

      return {
        success: true,
        message: '출석 기록 생성 성공',
        insertedId: result.insertedId.toString()
      };
    } catch (error) {
      return {
        success: false,
        message: `출석 기록 생성 실패: ${error}`
      };
    }
  }

  /**
   * 출석 기록 조회
   */
  public async getAttendanceRecords(userId: string, startDate?: Date, endDate?: Date): Promise<{
    success: boolean;
    message?: string;
    attendanceRecords?: AttendanceRecord[];
  }> {
    try {
      const attendanceCollection = this.database.collection<AttendanceRecord>('attendance_records');
      
      let query: any = { userId: userId };
      
      if (startDate && endDate) {
        query.date = {
          $gte: startDate,
          $lte: endDate
        };
      }

      const attendanceRecords = await attendanceCollection
        .find(query)
        .sort({ date: -1 })
        .toArray();

      return {
        success: true,
        message: '출석 기록 조회 성공',
        attendanceRecords: attendanceRecords
      };
    } catch (error) {
      return {
        success: false,
        message: `출석 기록 조회 실패: ${error}`
      };
    }
  }

  /**
   * 추천 기록 생성
   */
  public async createReferralRecord(referralData: ReferralRecord): Promise<{
    success: boolean;
    message?: string;
    insertedId?: string;
  }> {
    try {
      const referralCollection = this.database.collection<ReferralRecord>('referral_records');
      const result = await referralCollection.insertOne(referralData);

      return {
        success: true,
        message: '추천 기록 생성 성공',
        insertedId: result.insertedId.toString()
      };
    } catch (error) {
      return {
        success: false,
        message: `추천 기록 생성 실패: ${error}`
      };
    }
  }

  /**
   * 추천 기록 조회
   */
  public async getReferralRecords(userId: string): Promise<{
    success: boolean;
    message?: string;
    referralRecords?: ReferralRecord[];
  }> {
    try {
      const referralCollection = this.database.collection<ReferralRecord>('referral_records');
      const referralRecords = await referralCollection
        .find({ 
          $or: [
            { referrerId: userId },
            { referredId: userId }
          ]
        })
        .sort({ createdAt: -1 })
        .toArray();

      return {
        success: true,
        message: '추천 기록 조회 성공',
        referralRecords: referralRecords
      };
    } catch (error) {
      return {
        success: false,
        message: `추천 기록 조회 실패: ${error}`
      };
    }
  }

  /**
   * 가맹점 기록 생성
   */
  public async createPartnerRecord(partnerData: PartnerRecord): Promise<{
    success: boolean;
    message?: string;
    insertedId?: string;
  }> {
    try {
      const partnerCollection = this.database.collection<PartnerRecord>('partner_records');
      const result = await partnerCollection.insertOne(partnerData);

      return {
        success: true,
        message: '가맹점 기록 생성 성공',
        insertedId: result.insertedId.toString()
      };
    } catch (error) {
      return {
        success: false,
        message: `가맹점 기록 생성 실패: ${error}`
      };
    }
  }

  /**
   * 가맹점 기록 조회
   */
  public async getPartnerRecord(userId: string): Promise<{
    success: boolean;
    message?: string;
    partnerRecord?: PartnerRecord;
  }> {
    try {
      const partnerCollection = this.database.collection<PartnerRecord>('partner_records');
      const partnerRecord = await partnerCollection.findOne({ userId: userId });

      if (!partnerRecord) {
        return {
          success: false,
          message: '가맹점 기록을 찾을 수 없습니다'
        };
      }

      return {
        success: true,
        message: '가맹점 기록 조회 성공',
        partnerRecord: partnerRecord
      };
    } catch (error) {
      return {
        success: false,
        message: `가맹점 기록 조회 실패: ${error}`
      };
    }
  }

  /**
   * 지갑 생성
   */
  public async createWallet(walletData: Wallet): Promise<{
    success: boolean;
    message?: string;
    insertedId?: string;
  }> {
    try {
      const walletsCollection = this.database.collection<Wallet>('wallets');
      const result = await walletsCollection.insertOne(walletData);

      return {
        success: true,
        message: '지갑 생성 성공',
        insertedId: result.insertedId.toString()
      };
    } catch (error) {
      return {
        success: false,
        message: `지갑 생성 실패: ${error}`
      };
    }
  }

  /**
   * 지갑 조회
   */
  public async getWallet(userId: string): Promise<{
    success: boolean;
    message?: string;
    wallet?: Wallet;
  }> {
    try {
      const walletsCollection = this.database.collection<Wallet>('wallets');
      const wallet = await walletsCollection.findOne({ userId: userId });

      if (!wallet) {
        return {
          success: false,
          message: '지갑을 찾을 수 없습니다'
        };
      }

      return {
        success: true,
        message: '지갑 조회 성공',
        wallet: wallet
      };
    } catch (error) {
      return {
        success: false,
        message: `지갑 조회 실패: ${error}`
      };
    }
  }

  /**
   * 거래 기록 생성
   */
  public async createTransaction(transactionData: Transaction): Promise<{
    success: boolean;
    message?: string;
    insertedId?: string;
  }> {
    try {
      const transactionsCollection = this.database.collection<Transaction>('transactions');
      const result = await transactionsCollection.insertOne(transactionData);

      return {
        success: true,
        message: '거래 기록 생성 성공',
        insertedId: result.insertedId.toString()
      };
    } catch (error) {
      return {
        success: false,
        message: `거래 기록 생성 실패: ${error}`
      };
    }
  }

  /**
   * 거래 기록 조회
   */
  public async getTransactions(userId: string, limit: number = 100): Promise<{
    success: boolean;
    message?: string;
    transactions?: Transaction[];
  }> {
    try {
      const transactionsCollection = this.database.collection<Transaction>('transactions');
      const transactions = await transactionsCollection
        .find({ userId: userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

      return {
        success: true,
        message: '거래 기록 조회 성공',
        transactions: transactions
      };
    } catch (error) {
      return {
        success: false,
        message: `거래 기록 조회 실패: ${error}`
      };
    }
  }

  /**
   * 블록 생성
   */
  public async createBlock(blockData: Block): Promise<{
    success: boolean;
    message?: string;
    insertedId?: string;
  }> {
    try {
      const blocksCollection = this.database.collection<Block>('blocks');
      const result = await blocksCollection.insertOne(blockData);

      return {
        success: true,
        message: '블록 생성 성공',
        insertedId: result.insertedId.toString()
      };
    } catch (error) {
      return {
        success: false,
        message: `블록 생성 실패: ${error}`
      };
    }
  }

  /**
   * 블록 조회
   */
  public async getBlocks(limit: number = 100): Promise<{
    success: boolean;
    message?: string;
    blocks?: Block[];
  }> {
    try {
      const blocksCollection = this.database.collection<Block>('blocks');
      const blocks = await blocksCollection
        .find({})
        .sort({ blockNumber: -1 })
        .limit(limit)
        .toArray();

      return {
        success: true,
        message: '블록 조회 성공',
        blocks: blocks
      };
    } catch (error) {
      return {
        success: false,
        message: `블록 조회 실패: ${error}`
      };
    }
  }

  /**
   * 통계 조회
   */
  public async getStatistics(userId: string): Promise<{
    success: boolean;
    message?: string;
    statistics?: any;
  }> {
    try {
      const statistics = {
        totalMiningTime: 0,
        totalMiningAmount: 0,
        totalBonusAmount: 0,
        attendanceDays: 0,
        referralCount: 0,
        transactionCount: 0,
        walletBalance: 0
      };

      // 마이닝 통계
      const miningCollection = this.database.collection<MiningRecord>('mining_records');
      const miningStats = await miningCollection.aggregate([
        { $match: { userId: userId } },
        {
          $group: {
            _id: null,
            totalMiningTime: { $sum: '$miningTime' },
            totalMiningAmount: { $sum: '$totalReward' }
          }
        }
      ]).toArray();

      if (miningStats.length > 0) {
        const agg = miningStats[0] as any;
        statistics.totalMiningTime = (agg && agg['totalMiningTime']) ?? 0;
        statistics.totalMiningAmount = (agg && agg['totalMiningAmount']) ?? 0;
      }

      // 출석 통계
      const attendanceCollection = this.database.collection<AttendanceRecord>('attendance_records');
      const attendanceCount = await attendanceCollection.countDocuments({ 
        userId: userId,
        status: 'COMPLETED'
      });
      statistics.attendanceDays = attendanceCount;

      // 추천 통계
      const referralCollection = this.database.collection<ReferralRecord>('referral_records');
      const referralCount = await referralCollection.countDocuments({ 
        referrerId: userId
      });
      statistics.referralCount = referralCount;

      // 거래 통계
      const transactionsCollection = this.database.collection<Transaction>('transactions');
      const transactionCount = await transactionsCollection.countDocuments({ 
        userId: userId
      });
      statistics.transactionCount = transactionCount;

      // 지갑 잔액
      const walletsCollection = this.database.collection<Wallet>('wallets');
      const wallet = await walletsCollection.findOne({ userId: userId });
      if (wallet) {
        statistics.walletBalance = wallet.balance;
      }

      return {
        success: true,
        message: '통계 조회 성공',
        statistics: statistics
      };
    } catch (error) {
      return {
        success: false,
        message: `통계 조회 실패: ${error}`
      };
    }
  }
}
