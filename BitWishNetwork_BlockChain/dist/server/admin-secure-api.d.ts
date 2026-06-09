import { BitWishBlockchain } from '../engine/BitWishBlockchain';
import { Request, Response } from 'express';
/**
 * ★ 관리자(Administrator) 초특권 보안 API ★
 * 하드웨어 보안키(FIDO2/YubiKey) 연동 및 직할 결재 기능을 제공합니다.
 */
export declare class AdminSecureAPI {
    private blockchain;
    constructor(blockchain: BitWishBlockchain);
    /**
     * 관리자 하드웨어 키 등록 (최초 1회 또는 갱신)
     */
    registerHardwareKey(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * 최고 관리자 원스톱 직할 기금 집행 (Supreme Executive Payout)
     */
    executepayout(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * 관리자 권한 상태 조회 (보안 키 등록 여부 확인)
     */
    getAdminStatus(req: Request, res: Response): Response<any, Record<string, any>>;
}
//# sourceMappingURL=admin-secure-api.d.ts.map