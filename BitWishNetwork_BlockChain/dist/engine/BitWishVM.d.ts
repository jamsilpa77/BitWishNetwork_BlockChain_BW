/**
 * ====================================================================================
 * 🚀 BitWish Virtual Machine (BWVM) - The Core Engine
 * ====================================================================================
 *
 * 🎯 핵심 기능:
 * - 스마트 컨트랙트 바이트코드 실행 환경 (Runtime Environment)
 * - 스택(Stack), 메모리(Memory), 스토리지(Storage) 격리 컨테이너 설계
 * - 가스(Gas) 계량기 및 연산 통제 (무한 루프 방지)
 * - 50자리 부동소수점 오차 제로 연산 지원 (Decimal.js)
 *
 * 💡 구현 상태 (Phase 2):
 * - Opcode (PUSH, POP, ADD, MSTORE, SSTORE, SLOAD, SHA3, CALL) 지원
 * - 트랜잭션의 data 영역 분자 단위 실행기
 * ====================================================================================
 */
export interface Opcode {
    instruction: string;
    value?: string;
}
export declare class BitWishVM {
    private stack;
    private memory;
    private storage;
    private gasLimit;
    private gasUsed;
    constructor(storage: Map<string, string>, gasLimit: number);
    /**
     * BWVM 바이트코드 실행기 (The Heart of VM)
     * 트랜잭션의 data 속성에 담긴 바이트코드를 파싱하여 한 줄씩 실행합니다.
     */
    execute(bytecode: string): {
        success: boolean;
        gasUsed: number;
    };
    /**
     * 가스 미터링 로직: 각 Opcode의 무거운 정도에 따라 가스 소모량 차등 계산
     */
    private consumeGas;
    /**
     * 바이트코드 파서: 단순 String 어셈블리어를 Opcode 객체 배열로 변환
     * 예: "PUSH 10 PUSH 20 ADD SSTORE"
     */
    private parseBytecode;
    /**
     * 50자리 정밀도 보존 덧셈
     */
    private safeAdd;
}
//# sourceMappingURL=BitWishVM.d.ts.map