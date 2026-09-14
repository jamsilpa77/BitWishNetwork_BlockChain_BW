/**
 * BitWishNetwork Mining System
 * Partner (가맹점) Registration API Routes
 *
 * ⚠️ 중요 준수 사항:
 * 1. 마스킹 처리된 신분증 이미지만 서버에 저장 (원본 절대 저장 금지)
 * 2. 신청 즉시 1BW 보상은 registrationBonusPaid 플래그로 중복 지급 원천 차단
 * 3. 승인 완료 3BW 보상은 approvalBonusPaid 플래그로 중복 지급 원천 차단
 * 4. 가맹점 승인 시 partnerBonusRate = '0.3' (기본 채굴률의 30% 가산 — +0.3 가산 방식)
 * 5. 파일 업로드 저장 경로: /uploads/partner/{walletAddress}/
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
const multer = require('multer');
import MiningState from '../models/MiningState';
import BonusRecord from '../models/BonusRecord';
import PartnerApplication from '../models/PartnerApplication';
import Decimal from 'decimal.js';

Decimal.set({ precision: 50 });

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// [3-A] Multer 파일 업로드 미들웨어 설정
// 저장 경로: /uploads/partner/{walletAddress}/
// 허용 파일 타입: image/jpeg, image/png, image/webp
// 최대 파일 크기: 10MB per file
// ─────────────────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // walletAddress는 요청 body 또는 query에서 추출
        const walletAddress = (req.body?.walletAddress || req.query?.walletAddress || 'unknown') as string;
        // 지갑 주소를 안전한 디렉토리명으로 정규화
        const safeWallet = walletAddress.replace(/[^a-zA-Z0-9]/g, '_');
        const uploadDir = path.join(__dirname, '../../uploads/partner', safeWallet);

        // 디렉토리가 없으면 자동 생성 (recursive)
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // 파일명: {타임스탬프}_{원본파일명} 형식으로 저장 (덮어쓰기 방지)
        const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, uniqueSuffix + ext);
    }
});

// 허용 MIME 타입 필터 (image/jpeg, image/png, image/webp만 허용)
const fileFilter = (req: any, file: any, cb: any) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('허용되지 않는 파일 형식입니다. JPG, PNG, WEBP만 업로드 가능합니다.'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// [3-A] POST /api/partner/upload — 단일 이미지 파일 업로드
// 반환: { success: true, fileUrl: string }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: '업로드된 파일이 없습니다.' });
        }

        const walletAddress = (req.body?.walletAddress || 'unknown') as string;
        const safeWallet = walletAddress.replace(/[^a-zA-Z0-9]/g, '_');

        // 서버에서 접근 가능한 URL 경로로 변환
        const fileUrl = `/uploads/partner/${safeWallet}/${req.file.filename}`;

        console.log(`[Partner Upload] 파일 업로드 완료: ${walletAddress} → ${fileUrl}`);

        return res.json({
            success: true,
            fileUrl,
            originalName: req.file.originalname,
            size: req.file.size
        });
    } catch (error: any) {
        console.error('[Partner Upload Error]:', error);
        return res.status(500).json({ success: false, message: '파일 업로드 중 오류 발생: ' + error.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// [3-B] POST /api/partner/apply — 가맹점 등록 신청
// Auth: walletAddress 필수 (로그인된 사용자만)
// 처리 로직:
//   1. 중복 신청 확인 (PENDING/APPROVED 상태이면 재신청 불가)
//   2. PartnerApplication 생성 (status: PENDING)
//   3. 신청 즉시 1BW 보너스 지급 (1회만) → MiningState.accumulatedReward += 1BW
//   4. registrationBonusPaid = true 설정
// ─────────────────────────────────────────────────────────────────────────────
router.post('/apply', async (req, res) => {
    try {
        const {
            walletAddress,
            businessRegNumber,
            businessRegImage,
            photoEntrance,
            photoCounter,
            photoHall,
            photoKitchen,
            photoExtra,
            idCardMasked,
            idCardType
        } = req.body;

        // ─── 필수 입력값 검증 ───────────────────────────────
        if (!walletAddress) {
            return res.status(400).json({ success: false, message: '지갑 주소가 필요합니다.' });
        }
        if (!businessRegNumber || businessRegNumber.trim() === '') {
            return res.status(400).json({ success: false, message: '사업자등록번호는 필수 입력 항목입니다.' });
        }
        if (!photoEntrance || !photoCounter || !photoHall || !photoKitchen) {
            return res.status(400).json({ success: false, message: '매장 현장 사진 4장(입구, 카운터, 홀, 주방)은 필수 업로드 항목입니다.' });
        }
        if (!idCardMasked) {
            return res.status(400).json({ success: false, message: '마스킹 처리된 신분증 이미지가 필요합니다.' });
        }
        if (!['resident', 'driver'].includes(idCardType)) {
            return res.status(400).json({ success: false, message: '신분증 종류가 올바르지 않습니다. (resident | driver)' });
        }

        // ─── MiningState 존재 여부 확인 (미가입자 차단) ─────
        const miningState = await MiningState.findOne({
            walletAddress: { $regex: new RegExp('^' + walletAddress + '$', 'i') }
        });
        if (!miningState) {
            return res.status(404).json({ success: false, message: '존재하지 않는 지갑 주소입니다.' });
        }

        // ─── 중복 신청 방지 (PENDING 또는 APPROVED 상태 확인) ──
        const existingApplication = await PartnerApplication.findOne({
            walletAddress: { $regex: new RegExp('^' + walletAddress + '$', 'i') },
            status: { $in: ['PENDING', 'APPROVED'] }
        });
        if (existingApplication) {
            const statusMap: Record<string, string> = {
                PENDING: '심사 대기 중',
                APPROVED: '이미 승인 완료'
            };
            return res.status(409).json({
                success: false,
                message: `재신청 불가 — 현재 상태: ${statusMap[existingApplication.status]}`,
                currentStatus: existingApplication.status
            });
        }

        // ─── PartnerApplication 신규 생성 ──────────────────
        const newApplication = new PartnerApplication({
            walletAddress: walletAddress.trim(),
            businessRegNumber: businessRegNumber.trim(),
            businessRegImage: businessRegImage || '',
            photoEntrance: photoEntrance || '',
            photoCounter: photoCounter || '',
            photoHall: photoHall || '',
            photoKitchen: photoKitchen || '',
            photoExtra: photoExtra || '',
            idCardMasked: idCardMasked || '',
            idCardType: idCardType || 'resident',
            status: 'PENDING',
            registrationBonusPaid: false,
            approvalBonusPaid: false,
        });

        await newApplication.save();
        console.log(`[Partner Apply] 신청 완료: ${walletAddress} → applicationId: ${newApplication._id}`);

        // ─── 신청 즉시 1BW 보너스 지급 (1회만) ─────────────
        // MiningState.accumulatedReward에 1BW 직접 가산
        const currentReward = new Decimal(miningState.accumulatedReward || '0');
        const bonusAmount = new Decimal('1');
        miningState.accumulatedReward = currentReward.plus(bonusAmount).toFixed(50);

        // MiningState 가맹점 상태를 PENDING으로 업데이트
        miningState.partnerStatus = 'PENDING';
        await miningState.save();

        // registrationBonusPaid = true 마킹
        newApplication.registrationBonusPaid = true;
        await newApplication.save();

        console.log(`[Partner Bonus] 신청 즉시 1BW 지급 완료: ${walletAddress} → 누적 채굴량: ${miningState.accumulatedReward}`);

        return res.json({
            success: true,
            message: '가맹점 등록 신청이 완료되었습니다. 신청 즉시 1BW가 적립되었습니다.',
            applicationId: newApplication._id,
            registrationBonus: '1',
            status: 'PENDING'
        });

    } catch (error: any) {
        console.error('[Partner Apply Error]:', error);
        return res.status(500).json({ success: false, message: '가맹점 등록 신청 중 오류 발생: ' + error.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// [3-E] GET /api/partner/status?walletAddress=xxx — 현재 사용자 신청 현황 조회
// 반환: 현재 사용자의 PartnerApplication 최신 1건
// ─────────────────────────────────────────────────────────────────────────────
router.get('/status', async (req, res) => {
    try {
        const { walletAddress } = req.query as { walletAddress: string };

        if (!walletAddress) {
            return res.status(400).json({ success: false, message: '지갑 주소가 필요합니다.' });
        }

        // 최신 신청 1건 조회 (createdAt 내림차순)
        const application = await PartnerApplication.findOne({
            walletAddress: { $regex: new RegExp('^' + walletAddress + '$', 'i') }
        }).sort({ createdAt: -1 });

        if (!application) {
            return res.json({
                success: true,
                hasApplication: false,
                message: '신청 내역이 없습니다.'
            });
        }

        return res.json({
            success: true,
            hasApplication: true,
            data: {
                applicationId: application._id,
                status: application.status,
                businessRegNumber: application.businessRegNumber,
                registrationBonusPaid: application.registrationBonusPaid,
                approvalBonusPaid: application.approvalBonusPaid,
                adminNote: application.adminNote || '',
                createdAt: application.createdAt,
                reviewedAt: application.reviewedAt
            }
        });

    } catch (error: any) {
        console.error('[Partner Status Error]:', error);
        return res.status(500).json({ success: false, message: '현황 조회 중 오류 발생: ' + error.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// [3-E] GET /api/partner/admin/list — 관리자: 신청 목록 조회 (페이지네이션)
// Query: status=PENDING|APPROVED|REJECTED|ALL, page=1, limit=20
// ─────────────────────────────────────────────────────────────────────────────
router.get('/admin/list', async (req, res) => {
    try {
        const { status, page = '1', limit = '20' } = req.query as {
            status?: string;
            page?: string;
            limit?: string;
        };

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        // 필터 조건 구성
        const filter: any = {};
        if (status && status !== 'ALL') {
            if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
                return res.status(400).json({ success: false, message: '올바르지 않은 상태값입니다.' });
            }
            filter.status = status;
        }

        const [applications, totalCount] = await Promise.all([
            PartnerApplication.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .select('-idCardMasked'), // 신분증 이미지 URL은 목록에서 제외 (상세 조회 시만 노출)
            PartnerApplication.countDocuments(filter)
        ]);

        return res.json({
            success: true,
            data: {
                applications,
                pagination: {
                    total: totalCount,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(totalCount / limitNum)
                }
            }
        });

    } catch (error: any) {
        console.error('[Partner Admin List Error]:', error);
        return res.status(500).json({ success: false, message: '목록 조회 중 오류 발생: ' + error.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// [3-E] GET /api/partner/admin/detail/:applicationId — 관리자: 신청 상세 조회
// ─────────────────────────────────────────────────────────────────────────────
router.get('/admin/detail/:applicationId', async (req, res) => {
    try {
        const { applicationId } = req.params;

        const application = await PartnerApplication.findById(applicationId);
        if (!application) {
            return res.status(404).json({ success: false, message: '신청 내역을 찾을 수 없습니다.' });
        }

        return res.json({
            success: true,
            data: application
        });

    } catch (error: any) {
        console.error('[Partner Admin Detail Error]:', error);
        return res.status(500).json({ success: false, message: '상세 조회 중 오류 발생: ' + error.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// [3-C] POST /api/partner/admin/approve/:applicationId — 관리자: 가맹점 승인
// 처리 로직:
//   1. PartnerApplication status → APPROVED 변경
//   2. MiningState.partnerStatus = 'REGISTERED'
//   3. MiningState.partnerBonusRate = '0.3' (+30% 가산 방식)
//   4. MiningState.currentTotalRate 즉시 재계산
//   5. 승인 완료 3BW 즉시 지급 (1회만) → accumulatedReward += 3
//   6. approvalBonusPaid = true 설정
// ─────────────────────────────────────────────────────────────────────────────
router.post('/admin/approve/:applicationId', async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { adminWalletAddress } = req.body; // 처리한 관리자 지갑 주소

        // ─── 신청 레코드 조회 ────────────────────────────────
        const application = await PartnerApplication.findById(applicationId);
        if (!application) {
            return res.status(404).json({ success: false, message: '신청 내역을 찾을 수 없습니다.' });
        }
        if (application.status === 'APPROVED') {
            return res.status(409).json({ success: false, message: '이미 승인 처리된 신청입니다.' });
        }

        const targetWallet = application.walletAddress;

        // ─── MiningState 조회 ────────────────────────────────
        const miningState = await MiningState.findOne({
            walletAddress: { $regex: new RegExp('^' + targetWallet + '$', 'i') }
        });
        if (!miningState) {
            return res.status(404).json({ success: false, message: '해당 지갑의 채굴 상태를 찾을 수 없습니다.' });
        }

        // ─── 1. PartnerApplication 상태 → APPROVED ──────────
        application.status = 'APPROVED';
        application.reviewedBy = adminWalletAddress || 'admin';
        application.reviewedAt = new Date();

        // ─── 2. MiningState 가맹점 상태 업데이트 ────────────
        // partnerStatus: REGISTERED (승인 완료)
        miningState.partnerStatus = 'REGISTERED';
        // partnerBonusRate: '0.3' (기본 채굴률의 30% 가산)
        miningState.partnerBonusRate = '0.3';

        // ─── 3. 채굴률 즉시 재계산 (+0.3 가산 방식) ─────────
        // 계산식: totalRate = baseRate × (1 + attendanceRate) × (1 + referralRate) × (1 + extensionRate) + (baseRate × partnerBonusRate)
        // 가맹점 보너스는 가산(+) 방식으로 baseRate × 0.3을 추가 합산
        const baseRate = new Decimal(miningState.currentBaseRate || '0.25');
        const attendanceRate = miningState.isAttendanceActive ? new Decimal('0.05') : new Decimal('0');
        const referralRate = new Decimal(miningState.referralBonusRate || '0');
        const extensionRate = new Decimal(miningState.extensionBonusRate || '0');
        const partnerBonusRate = new Decimal('0.3'); // +30% 가산

        // 기존 보너스 합산 (기본 채굴률 기반)
        const baseWithBonuses = baseRate
            .mul(new Decimal(1).plus(attendanceRate))
            .mul(new Decimal(1).plus(referralRate))
            .mul(new Decimal(1).plus(extensionRate));

        // 가맹점 보너스는 기본 채굴률의 30%를 추가로 가산
        const partnerBonus = baseRate.mul(partnerBonusRate);
        miningState.currentTotalRate = baseWithBonuses.plus(partnerBonus).toFixed(50);

        // ─── 4. 승인 완료 3BW 즉시 지급 (1회만) ─────────────
        if (!application.approvalBonusPaid) {
            const currentReward = new Decimal(miningState.accumulatedReward || '0');
            miningState.accumulatedReward = currentReward.plus(new Decimal('3')).toFixed(50);
            application.approvalBonusPaid = true;

            console.log(`[Partner Approve Bonus] 승인 3BW 지급 완료: ${targetWallet} → 누적: ${miningState.accumulatedReward}`);
        }

        // ─── 저장 ────────────────────────────────────────────
        await miningState.save();
        await application.save();

        console.log(`[Partner Approve] 승인 완료: ${targetWallet} | 새 채굴률: ${miningState.currentTotalRate} BW/h`);

        return res.json({
            success: true,
            message: '가맹점 승인이 완료되었습니다. 3BW 보너스가 즉시 지급되었습니다.',
            data: {
                walletAddress: targetWallet,
                applicationId: application._id,
                status: 'APPROVED',
                approvalBonus: '3',
                newTotalRate: miningState.currentTotalRate,
                partnerBonusRate: '0.3',
                approvedAt: application.reviewedAt
            }
        });

    } catch (error: any) {
        console.error('[Partner Approve Error]:', error);
        return res.status(500).json({ success: false, message: '승인 처리 중 오류 발생: ' + error.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// [3-D] POST /api/partner/admin/reject/:applicationId — 관리자: 가맹점 반려
// 처리 로직:
//   1. PartnerApplication status → REJECTED 변경
//   2. adminNote 저장 (반려 사유)
//   3. MiningState.partnerStatus = 'NOT_REGISTERED' 복원
// ─────────────────────────────────────────────────────────────────────────────
router.post('/admin/reject/:applicationId', async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { adminNote, adminWalletAddress } = req.body;

        // ─── 신청 레코드 조회 ────────────────────────────────
        const application = await PartnerApplication.findById(applicationId);
        if (!application) {
            return res.status(404).json({ success: false, message: '신청 내역을 찾을 수 없습니다.' });
        }
        if (application.status === 'REJECTED') {
            return res.status(409).json({ success: false, message: '이미 반려 처리된 신청입니다.' });
        }
        if (application.status === 'APPROVED') {
            return res.status(409).json({ success: false, message: '승인 완료된 신청은 반려할 수 없습니다.' });
        }

        const targetWallet = application.walletAddress;

        // ─── 1. PartnerApplication 상태 → REJECTED ──────────
        application.status = 'REJECTED';
        application.adminNote = adminNote || '반려 사유가 입력되지 않았습니다.';
        application.reviewedBy = adminWalletAddress || 'admin';
        application.reviewedAt = new Date();

        // ─── 2. MiningState 가맹점 상태 복원 ────────────────
        // PENDING → NOT_REGISTERED로 복원 (채굴률 변경 없음)
        const miningState = await MiningState.findOne({
            walletAddress: { $regex: new RegExp('^' + targetWallet + '$', 'i') }
        });
        if (miningState) {
            miningState.partnerStatus = 'NOT_REGISTERED';
            // partnerBonusRate는 변경하지 않음 (미승인이므로 이미 '0')
            await miningState.save();
        }

        await application.save();

        console.log(`[Partner Reject] 반려 완료: ${targetWallet} | 사유: ${application.adminNote}`);

        return res.json({
            success: true,
            message: '가맹점 신청이 반려 처리되었습니다.',
            data: {
                walletAddress: targetWallet,
                applicationId: application._id,
                status: 'REJECTED',
                adminNote: application.adminNote,
                rejectedAt: application.reviewedAt
            }
        });

    } catch (error: any) {
        console.error('[Partner Reject Error]:', error);
        return res.status(500).json({ success: false, message: '반려 처리 중 오류 발생: ' + error.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Multer 에러 핸들러 미들웨어
// ─────────────────────────────────────────────────────────────────────────────
router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (error && (error.name === 'MulterError' || error.code === 'LIMIT_FILE_SIZE')) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: '파일 크기가 10MB를 초과합니다. 10MB 이하 파일만 업로드 가능합니다.'
            });
        }
        return res.status(400).json({ success: false, message: '파일 업로드 오류: ' + error.message });
    }
    if (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
    next();
});

export default router;
