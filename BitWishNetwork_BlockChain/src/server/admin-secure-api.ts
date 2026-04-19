import { BitWishBlockchain } from '../engine/BitWishBlockchain';
import { Request, Response } from 'express';

/**
 * ★ 관리자(Administrator) 초특권 보안 API ★
 * 하드웨어 보안키(FIDO2/YubiKey) 연동 및 직할 결재 기능을 제공합니다.
 */
export class AdminSecureAPI {
  private blockchain: BitWishBlockchain;

  constructor(blockchain: BitWishBlockchain) {
    this.blockchain = blockchain;
  }

  /**
   * 관리자 하드웨어 키 등록 (최초 1회 또는 갱신)
   */
  public async registerHardwareKey(req: Request, res: Response) {
    const { address, hardwareKeyID, adminAuthCode } = req.body;

    // 시스템 보안: 임시 관리자 인증 코드가 필요함 (보호 계층)
    if (adminAuthCode !== process.env.ADMIN_INITIAL_AUTH_CODE) {
      return res.status(403).json({ success: false, message: '관리자 인증 코드가 일치하지 않습니다.' });
    }

    const result = await this.blockchain.registerAdminKey(address, hardwareKeyID);
    return res.json(result);
  }

  /**
   * 최고 관리자 원스톱 직할 기금 집행 (Supreme Executive Payout)
   */
  public async executepayout(req: Request, res: Response) {
    const { targetAddress, amount, source, hardwareSignature } = req.body;

    // 엔진의 슈프림 인출 함수 호출 (하드웨어 서명 검증 수행)
    const result = await this.blockchain.adminSupremeWithdraw(
      targetAddress,
      amount,
      source,
      hardwareSignature
    );

    if (result.success) {
      console.log(`✅ [Admin API] 기금 집행 성공: ${amount} BW (${source})`);
      return res.json(result);
    } else {
      console.error(`❌ [Admin API] 기금 집행 실패: ${result.message}`);
      return res.status(400).json(result);
    }
  }

  /**
   * 관리자 권한 상태 조회 (보안 키 등록 여부 확인)
   */
  public getAdminStatus(req: Request, res: Response) {
    const status = this.blockchain.getStatus();
    return res.json({
      isKeyRegistered: !!status.adminMasterAddress,
      adminAddress: status.adminMasterAddress ? `${status.adminMasterAddress.substring(0, 6)}...${status.adminMasterAddress.substring(38)}` : '未등록',
      hardwareKeyID: status.adminHardwareKeyID ? '********' : '未등록'
    });
  }
}
