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
 * ✅ 주석에 명시 추가
 * ✅ 자체 보안 검증만 사용
 * ✅ 50단위 부동소수점 정밀 계산형식으로 구현 하지만 UI 홈페이지 이미지상 소수즘 8자리만 표기한다. 
 * ✅ BitWish Network 전용 시스템만 사용
 * ✅ 모든 텍스트는 한국어, 영어, 일어, 중국어포함 동남아권 언어 변경 되도록 모든 기능에 완벽하게 구현한다. 
 *        단 절대 복잡하게 파일들을 만들지 않도록한다. 
 * ✅ 마이닝 페이지는 완벽한 독립성 보장과 완벽한 데이터베이스 MongDB 하이브리드 완벽 저장소 구현한다. 
 * ✅ 유저는 1명이든 천만명이든 개인 단독 데이터베이스 MongDB 하이브리드 완벽 저장소를 구현한다.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { SECURITY_CONSTANTS } from '@/constants';

/**
 * 보안 검증 클래스 - 자체 보안 검증만 사용
 * BitWish Network 전용 시스템만 사용
 */
export class SecurityValidator {
  private readonly jwtSecret: string;
  private readonly bcryptRounds: number;

  constructor() {
    // 절대 준수사항: 전역 변수 사용 금지
    this.jwtSecret = process.env['JWT_SECRET'] || SECURITY_CONSTANTS.JWT_EXPIRES_IN;
    this.bcryptRounds = parseInt(process.env['BCRYPT_ROUNDS'] || '12', 10);
  }

  /**
   * 비밀번호 해시화
   * @param password 원본 비밀번호
   * @returns 해시화된 비밀번호
   */
  public async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.bcryptRounds);
  }

  /**
   * 비밀번호 검증
   * @param password 원본 비밀번호
   * @param hashedPassword 해시화된 비밀번호
   * @returns 검증 결과
   */
  public async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * JWT 토큰 생성
   * @param payload 페이로드
   * @returns JWT 토큰
   */
  public generateToken(payload: any): string {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: SECURITY_CONSTANTS.JWT_EXPIRES_IN });
  }

  /**
   * JWT 토큰 검증
   * @param token JWT 토큰
   * @returns 검증 결과
   */
  public verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      return null;
    }
  }

  /**
   * UUID 생성
   * @returns UUID 문자열
   */
  public generateUUID(): string {
    return uuidv4();
  }

  /**
   * 지갑 주소 검증
   * @param address 지갑 주소
   * @returns 검증 결과
   */
  public validateWalletAddress(address: string): boolean {
    // BitWish Network 지갑 주소 형식 검증 (0x로 시작 40자리 16진수 허용 포함)
    const addressPattern = /^(BWD[a-fA-F0-9]{39}|0x[a-fA-F0-9]{40})$/;
    return addressPattern.test(address);
  }

  /**
   * 이메일 검증
   * @param email 이메일 주소
   * @returns 검증 결과
   */
  public validateEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  /**
   * 입력값 검증
   * @param value 검증할 값
   * @param type 검증 타입
   * @returns 검증 결과
   */
  public validateInput(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string' && value.length > 0;
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'email':
        return this.validateEmail(value);
      case 'wallet':
        return this.validateWalletAddress(value);
      default:
        return false;
    }
  }

  /**
   * 비밀번호 검증
   * @param password 비밀번호
   * @returns 검증 결과
   */
  public validatePassword(password: string): boolean {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  /**
   * 타임스탬프 검증
   * @param timestamp 타임스탬프
   * @returns 검증 결과
   */
  public validateTimestamp(timestamp: number): boolean {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    return Math.abs(now - timestamp) < oneHour;
  }

  /**
   * 블록/머클 해시 검증
   * @param hash 해시값
   * @returns 검증 결과
   */
  public validateBlockHash(hash: string): boolean {
    return /^[a-fA-F0-9]{64}$/.test(hash);
  }
}
