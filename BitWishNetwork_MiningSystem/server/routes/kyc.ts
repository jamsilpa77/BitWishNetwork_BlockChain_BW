import express from 'express';
import SystemConfig from '../models/SystemConfig';
import User from '../models/User';

const router = express.Router();

/**
 * [공정 2-2] KYC 서류 접수 (Submission)
 * POST /api/kyc/submit
 */
router.post('/submit', async (req, res) => {
    try {
        const { 
            walletAddress, 
            fullName, 
            birthDate, // 생년월일 추가
            country, 
            phone, 
            address, 
            idImageBase64 
        } = req.body;

        if (!walletAddress) {
            return res.status(400).json({ success: false, message: 'Wallet address is required' });
        }

        // 지갑 주소 기반 유저 레코드 업데이트
        const updatedUser = await User.findOneAndUpdate(
            { walletAddress: walletAddress },
            {
                $set: {
                    kycApplication: {
                        fullName,
                        birthDate, // 생년월일 저장
                        country,
                        phone,
                        address,
                        idImageBase64,
                        status: 'PENDING',
                        submittedAt: new Date()
                    }
                }
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        console.log(`[KYC] Application submitted for: ${walletAddress}`);

        return res.json({
            success: true,
            message: 'KYC application submitted successfully'
        });
    } catch (error) {
        console.error('KYC Submission Error:', error);
        return res.status(500).json({ success: false, message: '서버 내부 오류 발생' });
    }
});

/**
 * [공정 2-3] KYC 거버넌스 설정 조회 (Public)
 * GET /api/kyc/config
 */
router.get('/config', async (req, res) => {
    try {
        const config = await SystemConfig.findOne({ key: 'kyc_active_status' });
        
        // 데이터가 없으면 기본값 true(활성) 반환
        return res.json({
            success: true,
            isActive: config ? config.value : true
        });
    } catch (error) {
        console.error('Failed to get KYC config:', error);
        // 에러 시 보수적으로 활성 상태 반환
        return res.json({
            success: true,
            isActive: true
        });
    }
});

export default router;
