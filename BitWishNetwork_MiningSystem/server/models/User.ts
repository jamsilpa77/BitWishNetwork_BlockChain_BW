/**
 * BitWishNetwork Mining System
 * User Model Schema
 * 
 * ⚠️ 중요 준수 사항:
 * 1. 개인 단독 데이터베이스 구조 지원을 위한 설계
 * 2. 지갑 주소의 유일성 보장 (BW + 40자리 16진수)
 * 3. 2차 비밀번호 필수 저장 (해시화)
 * 4. 추천인 코드 및 관계의 영구적 저장
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    walletAddress: string;       // 지갑 주소 (Unique Key)
    publicKey: string;           // 공개키
    encryptedMnemonic: string;   // 암호화된 니모닉
    secondPasswordHash: string;  // 2차 비밀번호 해시 (필수)

    myReferralCode: string;      // 내 추천 코드 (Unique)
    referrerCode?: string;       // 나를 초대한 사람의 코드 (Optional)

    isKycVerified: boolean;      // KYC 인증 여부
    kycVerifiedDate?: Date;      // KYC 인증 날짜
    isOTPEnabled: boolean;       // OTP 설정 여부 (송금 보안용)

    kycApplication?: {
        fullName: string;
        birthDate: string;       // 생년월일 추가
        country: string;
        phone: string;
        address: {
            city: string;
            roadAddress: string;
            detailAddress: string;
        };
        idImageBase64: string;   // 신분증 이미지 (Base64)
        status: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
        rejectionReason?: string;
        submittedAt?: Date;
    };

    ipAddress: string;           // 생성 시 IP 주소 (중복 방지용)
    createdAt: Date;             // 계정 생성일
    lastLoginAt: Date;           // 마지막 접속일
}

const UserSchema: Schema = new Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        validate: {
            validator: function (v: string) {
                // BW + 40자리 16진수 = 총 42자리 검증 (대소문자 모두 허용)
                return /^BW[0-9A-Fa-f]{40}$/.test(v);
            },
            message: 'Invalid wallet address format'
        }
    },
    publicKey: { type: String, required: true },
    encryptedMnemonic: { type: String, required: true },
    secondPasswordHash: { type: String, required: true }, // 2차 비번 필수

    myReferralCode: {
        type: String,
        required: true,
        unique: true,
        minlength: 8
    },
    referrerCode: { type: String, default: null },

    isKycVerified: { type: Boolean, default: false },
    kycVerifiedDate: { type: Date },
    isOTPEnabled: { type: Boolean, default: false }, // OTP 보안 기본값 false

    kycApplication: {
        fullName: { type: String, default: '' },
        birthDate: { type: String, default: '' }, // 생년월일 추가
        country: { type: String, default: '' },
        phone: { type: String, default: '' },
        address: {
            city: { type: String, default: '' },
            roadAddress: { type: String, default: '' },
            detailAddress: { type: String, default: '' }
        },
        idImageBase64: { type: String, default: '' },
        status: {
            type: String,
            enum: ['NONE', 'PENDING', 'APPROVED', 'REJECTED'],
            default: 'NONE'
        },
        rejectionReason: { type: String, default: '' },
        submittedAt: { type: Date }
    },

    ipAddress: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    lastLoginAt: { type: Date, default: Date.now }
}, {
    timestamps: true // 생성/수정 시간 자동 기록
});

// 인덱스 설정으로 조회 성능 최적화
UserSchema.index({ walletAddress: 1 });
UserSchema.index({ myReferralCode: 1 });

export default mongoose.model<IUser>('User', UserSchema);
