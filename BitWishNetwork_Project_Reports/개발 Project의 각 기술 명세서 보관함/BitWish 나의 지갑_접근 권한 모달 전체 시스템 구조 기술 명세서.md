# BitWish 나의지갑접권권한 모달 전체 시스템 구조 기술 명세서

## 1. 개요 (Overview)
*   **컴포넌트 명칭:** `WalletAuthModal`
*   **파일 위치:** `src/components/WalletAuthModal/WalletAuthModal.tsx`
*   **주요 목적:** 본 모달은 사용자가 캐시 삭제, 브라우저 변경, 또는 세션 만료 등의 이유로 자신의 지갑에 대한 접근 권한을 상실했을 때, 최초 생성 시 백업해 둔 **24단어 시드 구문(Mnemonic)**을 통해 본인임을 인증하고 지갑을 안전하게 복원하여 '나의 지갑' 대시보드로 진입할 수 있도록 돕는 **최전선 보안 관문(Gateway)** 역할을 수행합니다.

---

## 2. 시스템 아키텍처 및 의존성 (System Architecture)
본 모달은 완벽하게 독립적인 렌더링 구조를 가지며, 외부 글로벌 상태 라이브러리(Redux 등)를 일체 사용하지 않고 의존성 주입 방식을 채택하고 있습니다.

*   **블록체인 커넥션 (`walletService`):**
    *   `src/services/BlockchainService/WalletService.ts`와 통신하여 입력된 시드 구문의 유효성을 검사하고 실제 지갑 복원 알고리즘을 수행합니다.
*   **다국어 동적 매핑 (`LanguageManager`):**
    *   `src/utils/LanguageManager/LanguageManager.ts` 인스턴스를 내부 상태로 가져와, Props로 전달받은 언어 키(`currentLanguage`)에 따라 4개 국어(한국어, 영어, 일본어, 중국어)를 실시간으로 전환하여 UI에 출력합니다.

---

## 3. 핵심 상태 및 인터페이스 구조 (State & Interface)

### 3.1. Props (부모로부터 전달받는 제어 속성)
```typescript
interface WalletAuthModalProps {
    isOpen: boolean;           // 모달 렌더링 여부를 제어하는 스위치
    onClose: () => void;       // 모달 X버튼 또는 취소 버튼 클릭 시 실행할 닫기 콜백
    onSuccess: () => void;     // 복구 및 인증 통과 시 부모(HomePage)로 전달할 성공 콜백
    currentLanguage?: string;  // 실시간 다국어 지원을 위한 언어 세팅 값 (기본값: 'ko')
}
```

### 3.2. Local State (내부 상태 관리)
*   `mnemonic (string)`: 사용자가 Textarea를 통해 복사/붙여넣기 하거나 타이핑한 24단어 시드 구문.
*   `error (string)`: 검증 실패 또는 서버 통신 에러 시 UI에 표출할 동적 에러 메시지.
*   `isProcessing (boolean)`: 비동기 복원 로직 실행 시 중복 버튼 클릭을 막고, 버튼 텍스트를 '처리 중...' 상태로 제어하기 위한 플래그.

---

## 4. 데이터 플로우 및 핵심 비즈니스 로직 (Core Logic Flow)

`WalletAuthModal` 내에서 실행되는 복구 로직(`handleLogin`)의 흐름은 다음과 같습니다.

1.  **입력값 전처리 (Normalization):**
    *   사용자가 입력한 시드 구문 배열 앞뒤 공백을 제거하고, 다중 공백이나 줄바꿈을 정규식(`/\s+/`)을 통해 단일 공백으로 치환합니다.
2.  **1차 로컬 유효성 검증 (Validation):**
    *   `walletService.verifyWalletAccess` 메서드를 호출해 시드 구문의 포맷과 체크섬 유효성을 로컬에서 선제적으로 검사합니다.
    *   **Failure:** `t('walletAuth.error')` (예: "시드 구문이 올바르지 않습니다.") 에러 출력 및 로직 중단.
3.  **지갑 자산 복원 실행 (Asynchronous Recovery):**
    *   `isProcessing`을 `true`로 전환하고 `walletService.restoreWallet` 비동기 통신을 시도합니다.
    *   이때 유저 편의성을 극대화하기 위해 2단계 비밀번호 입력을 우회하여 시스템 초기값(`'123456'`)으로 복구를 강제 시도하고 즉시 접근 권한을 회복하는 하이패스 로직이 적용되어 있습니다.
4.  **결과 응답 처리 (Response Handling):**
    *   **Success (`restored === true`):** `onSuccess()` 콜백 발동 (이후 `HomePage`에서 나의 지갑 대시보드를 엶), 내부 시드 문자열 초기화.
    *   **Failure (`restored === false`):** `t('walletAuth.recoveryFailed')` 다국어 에러 메시지 강제 출력.

---

## 5. UI 및 다국어 렌더링 명세 (UI & Localization Spec)
*   **모달 레이아웃:** 어두운 `Overlay` 딤(dim) 처리를 통해 백그라운드 클릭을 방지하고 집중도를 높였으며, `Header(제목)`, `Body(안내문, Textarea 입력칸, 에러 메시지)`, `Footer(버튼 그룹)` 구조체로 구성됩니다.
*   **하드코딩 원천 봉쇄:** 화면에 렌더링되는 단 1개의 텍스트도 고정된 리터럴 문자열을 사용하지 않습니다.
    *   `{t('walletAuth.title')}`
    *   `{t('walletAuth.desc')}`
    *   `{t('walletAuth.placeholder')}`
    *   `{isProcessing ? t('walletAuth.processing') : t('walletAuth.verify')}`
    *   에러 문구조차 `LanguageManager`와 결합해 선택된 언어로 완벽히 동기화되어 출력됩니다.
*   **다국어 확장성 보장:** 향후 스페인어나 동남아시아 언어가 추가되더라도 `LanguageManager.ts`의 `walletAuth` 객체에 데이터만 매핑되면 컴포넌트 로직의 변경 없이 자동으로 적용되는 프론트엔드 모범 패턴이 구축되어 있습니다.
