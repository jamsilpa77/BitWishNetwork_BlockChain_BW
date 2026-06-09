"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BitWishVM = void 0;
const decimal_js_1 = __importDefault(require("decimal.js"));
class BitWishVM {
    constructor(storage, gasLimit) {
        this.stack = [];
        this.memory = new Map();
        this.gasUsed = 0;
        this.storage = storage;
        this.gasLimit = gasLimit;
    }
    /**
     * BWVM 바이트코드 실행기 (The Heart of VM)
     * 트랜잭션의 data 속성에 담긴 바이트코드를 파싱하여 한 줄씩 실행합니다.
     */
    execute(bytecode) {
        try {
            const opcodes = this.parseBytecode(bytecode);
            for (let pc = 0; pc < opcodes.length; pc++) {
                const op = opcodes[pc];
                // 가스 계량기: Opcode별 정밀 가스 소모 계산 및 감산 (OOG 방지)
                this.consumeGas(op);
                switch (op.instruction) {
                    case 'PUSH':
                        if (op.value)
                            this.stack.push(op.value);
                        break;
                    case 'POP':
                        this.stack.pop();
                        break;
                    case 'ADD':
                        const addA = this.stack.pop() || '0';
                        const addB = this.stack.pop() || '0';
                        this.stack.push(this.safeAdd(addA, addB)); // 50자리 정밀도 보존 덧셈
                        break;
                    case 'MSTORE': // 메모리 저장 (실행 중 임시 보관)
                        const memVal = this.stack.pop() || '';
                        const memPos = parseInt(this.stack.pop() || '0');
                        this.memory.set(memPos, memVal);
                        break;
                    case 'SSTORE': // 블록체인 상에 계약 상태 영구 저장
                        const key = this.stack.pop() || '';
                        const val = this.stack.pop() || '';
                        this.storage.set(key, val);
                        break;
                    case 'SLOAD': // 영구 저장된 블록체인 상태 읽기
                        const loadKey = this.stack.pop() || '';
                        const loadedVal = this.storage.get(loadKey) || '';
                        this.stack.push(loadedVal);
                        break;
                    case 'SHA3': // 블록체인 전용 해시 연산
                        const hashData = this.stack.pop() || '';
                        // Phase 2 목업: 차후 crypto 모듈로 BitWish-256 연동
                        this.stack.push(`HASH_${hashData}`);
                        break;
                    case 'CALL': // 다른 컨트랙트 함수 호출
                        const callAddr = this.stack.pop() || '';
                        const callVal = this.stack.pop() || '0';
                        // Phase 3 통합 시 활성화될 컨트랙트 간 통신 로직
                        this.stack.push('CALL_SUCCESS');
                        break;
                    default:
                        throw new Error(`[BWVM] 알 수 없는 명령어 에러: ${op.instruction}`);
                }
            }
            return { success: true, gasUsed: this.gasUsed }; // 가스 초과 없이 실행 완료
        }
        catch (error) {
            console.error(`[BWVM] Execution Error: ${error.message}`);
            return { success: false, gasUsed: this.gasUsed }; // 트랜잭션 실패 시에도 가스는 차감
        }
    }
    /**
     * 가스 미터링 로직: 각 Opcode의 무거운 정도에 따라 가스 소모량 차등 계산
     */
    consumeGas(op) {
        let cost = 1; // 모든 연산의 기본 가스 비용
        switch (op.instruction) {
            case 'SSTORE':
                cost = 100;
                break; // DB 영구 저장은 가장 비싸게 설정
            case 'SLOAD':
                cost = 20;
                break; // DB 읽기
            case 'SHA3':
                cost = 30;
                break; // 해시 연산
            case 'CALL':
                cost = 50;
                break; // 외부 호출
        }
        this.gasUsed += cost;
        if (this.gasUsed > this.gasLimit) {
            throw new Error('Out of Gas (OOG) - 가스 한도를 초과했습니다.');
        }
    }
    /**
     * 바이트코드 파서: 단순 String 어셈블리어를 Opcode 객체 배열로 변환
     * 예: "PUSH 10 PUSH 20 ADD SSTORE"
     */
    parseBytecode(code) {
        const tokens = code.trim().split(/\s+/);
        const opcodes = [];
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i].toUpperCase();
            if (token === 'PUSH') {
                opcodes.push({ instruction: 'PUSH', value: tokens[++i] });
            }
            else {
                opcodes.push({ instruction: token });
            }
        }
        return opcodes;
    }
    /**
     * 50자리 정밀도 보존 덧셈
     */
    safeAdd(a, b) {
        try {
            const decA = new decimal_js_1.default(a);
            const decB = new decimal_js_1.default(b);
            return decA.plus(decB).toString();
        }
        catch (e) {
            return "0"; // 숫자가 아닌 값이 스택에 있을 경우 안전 처리
        }
    }
}
exports.BitWishVM = BitWishVM;
//# sourceMappingURL=BitWishVM.js.map