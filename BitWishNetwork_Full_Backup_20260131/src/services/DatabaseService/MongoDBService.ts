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

import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
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

/**
 * MongoDB 서비스 클래스 - 완벽한 독립성 보장
 * 개인별 완전 독립된 데이터베이스, 1명이든 천만명이든 개인 단독 저장소
 */
export class MongoDBService {
  private client: MongoClient;
  private database: Db | null;
  private isConnected: boolean;
  private connectionString: string;

  constructor() {
    // 절대 준수사항: 전역 변수 사용 금지
    this.client = new MongoClient('');
    this.database = null;
    this.isConnected = false;
    this.connectionString = process.env['MONGODB_URI'] || 'mongodb://localhost:27017';
  }

  /**
   * MongoDB 연결
   */
  public async connect(): Promise<{
    success: boolean;
    message?: string;
    database?: Db;
  }> {
    try {
      if (this.isConnected && this.database) {
        return {
          success: true,
          database: this.database
        };
      }

      this.client = new MongoClient(this.connectionString);
      await this.client.connect();
      
      this.database = this.client.db('BitWishNetwork');
      this.isConnected = true;

      return {
        success: true,
        message: 'MongoDB 연결 성공',
        database: this.database
      };
    } catch (error) {
      return {
        success: false,
        message: `MongoDB 연결 실패: ${error}`
      };
    }
  }

  /**
   * MongoDB 연결 해제
   */
  public async disconnect(): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      if (this.client) {
        await this.client.close();
        this.isConnected = false;
        this.database = null;
      }

      return {
        success: true,
        message: 'MongoDB 연결 해제 성공'
      };
    } catch (error) {
      return {
        success: false,
        message: `MongoDB 연결 해제 실패: ${error}`
      };
    }
  }

  /**
   * 사용자별 독립 데이터베이스 생성
   */
  public async createUserDatabase(userId: string): Promise<{
    success: boolean;
    message?: string;
    userDatabase?: Db;
  }> {
    try {
      if (!this.isConnected || !this.database) {
        const connectResult = await this.connect();
        if (!connectResult.success) {
          return {
            success: false,
            message: '데이터베이스 연결 실패'
          };
        }
      }

      // 사용자별 독립 데이터베이스 생성
      const userDatabaseName = `BitWishNetwork_User_${userId}`;
      const userDatabase = this.client.db(userDatabaseName);

      // 사용자 데이터베이스 컬렉션 생성
      await this.createUserCollections(userDatabase);

      return {
        success: true,
        message: '사용자 데이터베이스 생성 성공',
        userDatabase: userDatabase
      };
    } catch (error) {
      return {
        success: false,
        message: `사용자 데이터베이스 생성 실패: ${error}`
      };
    }
  }

  /**
   * 사용자 컬렉션 생성
   */
  private async createUserCollections(database: Db): Promise<void> {
    try {
      // 사용자 정보 컬렉션
      await database.createCollection('users');
      
      // 마이닝 기록 컬렉션
      await database.createCollection('mining_records');
      
      // 출석 기록 컬렉션
      await database.createCollection('attendance_records');
      
      // 추천 기록 컬렉션
      await database.createCollection('referral_records');
      
      // 가맹점 기록 컬렉션
      await database.createCollection('partner_records');
      
      // 지갑 정보 컬렉션
      await database.createCollection('wallets');
      
      // 거래 기록 컬렉션
      await database.createCollection('transactions');
      
      // 블록 정보 컬렉션
      await database.createCollection('blocks');
    } catch (error) {
      console.error('사용자 컬렉션 생성 오류:', error);
    }
  }

  /**
   * 사용자 데이터베이스 가져오기
   */
  public async getUserDatabase(userId: string): Promise<{
    success: boolean;
    message?: string;
    userDatabase?: Db;
  }> {
    try {
      if (!this.isConnected || !this.database) {
        const connectResult = await this.connect();
        if (!connectResult.success) {
          return {
            success: false,
            message: '데이터베이스 연결 실패'
          };
        }
      }

      const userDatabaseName = `BitWishNetwork_User_${userId}`;
      const userDatabase = this.client.db(userDatabaseName);

      return {
        success: true,
        message: '사용자 데이터베이스 조회 성공',
        userDatabase: userDatabase
      };
    } catch (error) {
      return {
        success: false,
        message: `사용자 데이터베이스 조회 실패: ${error}`
      };
    }
  }

  /**
   * 사용자 데이터 저장
   */
  public async saveUserData(userId: string, userData: User): Promise<{
    success: boolean;
    message?: string;
    insertedId?: string;
  }> {
    try {
      const userDbResult = await this.getUserDatabase(userId);
      if (!userDbResult.success || !userDbResult.userDatabase) {
        return {
          success: false,
          message: '사용자 데이터베이스 조회 실패'
        };
      }

      const usersCollection = userDbResult.userDatabase.collection<User>('users');
      const result = await usersCollection.insertOne(userData);

      return {
        success: true,
        message: '사용자 데이터 저장 성공',
        insertedId: result.insertedId.toString()
      };
    } catch (error) {
      return {
        success: false,
        message: `사용자 데이터 저장 실패: ${error}`
      };
    }
  }

  /**
   * 사용자 데이터 조회
   */
  public async getUserData(userId: string): Promise<{
    success: boolean;
    message?: string;
    userData?: User;
  }> {
    try {
      const userDbResult = await this.getUserDatabase(userId);
      if (!userDbResult.success || !userDbResult.userDatabase) {
        return {
          success: false,
          message: '사용자 데이터베이스 조회 실패'
        };
      }

      const usersCollection = userDbResult.userDatabase.collection<User>('users');
      const userData = await usersCollection.findOne({ userId: userId });

      if (!userData) {
        return {
          success: false,
          message: '사용자 데이터를 찾을 수 없습니다'
        };
      }

      return {
        success: true,
        message: '사용자 데이터 조회 성공',
        userData: userData
      };
    } catch (error) {
      return {
        success: false,
        message: `사용자 데이터 조회 실패: ${error}`
      };
    }
  }

  /**
   * 마이닝 데이터 저장
   */
  public async saveMiningData(userId: string, miningData: MiningRecord): Promise<{
    success: boolean;
    message?: string;
    insertedId?: string;
  }> {
    try {
      const userDbResult = await this.getUserDatabase(userId);
      if (!userDbResult.success || !userDbResult.userDatabase) {
        return {
          success: false,
          message: '사용자 데이터베이스 조회 실패'
        };
      }

      const miningCollection = userDbResult.userDatabase.collection<MiningRecord>('mining_records');
      const result = await miningCollection.insertOne(miningData);

      return {
        success: true,
        message: '마이닝 데이터 저장 성공',
        insertedId: result.insertedId.toString()
      };
    } catch (error) {
      return {
        success: false,
        message: `마이닝 데이터 저장 실패: ${error}`
      };
    }
  }

  /**
   * 출석 데이터 저장
   */
  public async saveAttendanceData(userId: string, attendanceData: AttendanceRecord): Promise<{
    success: boolean;
    message?: string;
    insertedId?: string;
  }> {
    try {
      const userDbResult = await this.getUserDatabase(userId);
      if (!userDbResult.success || !userDbResult.userDatabase) {
        return {
          success: false,
          message: '사용자 데이터베이스 조회 실패'
        };
      }

      const attendanceCollection = userDbResult.userDatabase.collection<AttendanceRecord>('attendance_records');
      const result = await attendanceCollection.insertOne(attendanceData);

      return {
        success: true,
        message: '출석 데이터 저장 성공',
        insertedId: result.insertedId.toString()
      };
    } catch (error) {
      return {
        success: false,
        message: `출석 데이터 저장 실패: ${error}`
      };
    }
  }

  /**
   * 추천 데이터 저장
   */
  public async saveReferralData(userId: string, referralData: ReferralRecord): Promise<{
    success: boolean;
    message?: string;
    insertedId?: string;
  }> {
    try {
      const userDbResult = await this.getUserDatabase(userId);
      if (!userDbResult.success || !userDbResult.userDatabase) {
        return {
          success: false,
          message: '사용자 데이터베이스 조회 실패'
        };
      }

      const referralCollection = userDbResult.userDatabase.collection<ReferralRecord>('referral_records');
      const result = await referralCollection.insertOne(referralData);

      return {
        success: true,
        message: '추천 데이터 저장 성공',
        insertedId: result.insertedId.toString()
      };
    } catch (error) {
      return {
        success: false,
        message: `추천 데이터 저장 실패: ${error}`
      };
    }
  }

  /**
   * 가맹점 데이터 저장
   */
  public async savePartnerData(userId: string, partnerData: PartnerRecord): Promise<{
    success: boolean;
    message?: string;
    insertedId?: string;
  }> {
    try {
      const userDbResult = await this.getUserDatabase(userId);
      if (!userDbResult.success || !userDbResult.userDatabase) {
        return {
          success: false,
          message: '사용자 데이터베이스 조회 실패'
        };
      }

      const partnerCollection = userDbResult.userDatabase.collection<PartnerRecord>('partner_records');
      const result = await partnerCollection.insertOne(partnerData);

      return {
        success: true,
        message: '가맹점 데이터 저장 성공',
        insertedId: result.insertedId.toString()
      };
    } catch (error) {
      return {
        success: false,
        message: `가맹점 데이터 저장 실패: ${error}`
      };
    }
  }

  /**
   * 데이터베이스 상태 확인
   */
  public async checkDatabaseStatus(): Promise<{
    success: boolean;
    message?: string;
    isConnected?: boolean;
    databaseName?: string;
  }> {
    try {
      if (!this.isConnected || !this.database) {
        return {
          success: false,
          message: '데이터베이스가 연결되지 않았습니다',
          isConnected: false
        };
      }

      return {
        success: true,
        message: '데이터베이스 연결 상태 정상',
        isConnected: true,
        databaseName: this.database.databaseName
      };
    } catch (error) {
      return {
        success: false,
        message: `데이터베이스 상태 확인 실패: ${error}`,
        isConnected: false
      };
    }
  }

  /**
   * 사용자 데이터베이스 삭제
   */
  public async deleteUserDatabase(userId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      if (!this.isConnected || !this.database) {
        return {
          success: false,
          message: '데이터베이스가 연결되지 않았습니다'
        };
      }

      const userDatabaseName = `BitWishNetwork_User_${userId}`;
      await this.client.db(userDatabaseName).dropDatabase();

      return {
        success: true,
        message: '사용자 데이터베이스 삭제 성공'
      };
    } catch (error) {
      return {
        success: false,
        message: `사용자 데이터베이스 삭제 실패: ${error}`
      };
    }
  }

  /**
   * 데이터베이스 백업
   */
  public async backupUserDatabase(userId: string): Promise<{
    success: boolean;
    message?: string;
    backupData?: any;
  }> {
    try {
      const userDbResult = await this.getUserDatabase(userId);
      if (!userDbResult.success || !userDbResult.userDatabase) {
        return {
          success: false,
          message: '사용자 데이터베이스 조회 실패'
        };
      }

      const userDatabase = userDbResult.userDatabase;
      const collections = await userDatabase.listCollections().toArray();
      const backupData: any = {};

      for (const collection of collections) {
        const collectionName = collection.name;
        const collectionData = await userDatabase.collection(collectionName).find({}).toArray();
        backupData[collectionName] = collectionData;
      }

      return {
        success: true,
        message: '사용자 데이터베이스 백업 성공',
        backupData: backupData
      };
    } catch (error) {
      return {
        success: false,
        message: `사용자 데이터베이스 백업 실패: ${error}`
      };
    }
  }

  /**
   * 데이터베이스 복원
   */
  public async restoreUserDatabase(userId: string, backupData: any): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const userDbResult = await this.getUserDatabase(userId);
      if (!userDbResult.success || !userDbResult.userDatabase) {
        return {
          success: false,
          message: '사용자 데이터베이스 조회 실패'
        };
      }

      const userDatabase = userDbResult.userDatabase;

      for (const collectionName in backupData) {
        const collectionData = backupData[collectionName];
        if (Array.isArray(collectionData) && collectionData.length > 0) {
          await userDatabase.collection(collectionName).insertMany(collectionData);
        }
      }

      return {
        success: true,
        message: '사용자 데이터베이스 복원 성공'
      };
    } catch (error) {
      return {
        success: false,
        message: `사용자 데이터베이스 복원 실패: ${error}`
      };
    }
  }
}
