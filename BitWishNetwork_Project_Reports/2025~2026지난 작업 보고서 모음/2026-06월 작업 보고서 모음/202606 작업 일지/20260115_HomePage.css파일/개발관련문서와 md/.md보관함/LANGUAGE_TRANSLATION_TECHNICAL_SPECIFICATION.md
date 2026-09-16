# BitWish Network 언어 번역 시스템 고급 기술 명세서

## 📋 개요

BitWish Network 애플리케이션의 완전한 다국어 지원 시스템 구현을 위한 고급 기술 명세서입니다. 4개 언어(한국어, 영어, 중국어, 일본어)를 지원하며, 실시간 언어 변경과 즉시 번역 반영을 제공합니다.

## 🎯 핵심 목표

1. **완전한 다국어 지원**: 모든 UI 텍스트의 4개 언어 번역
2. **실시간 언어 변경**: 언어 변경 시 즉시 번역 반영
3. **고급스러운 알림 시스템**: CustomAlertModal을 통한 일관된 UX
4. **Z-index 최적화**: 모든 모달의 올바른 표시 순서 보장

## 🏗️ 시스템 아키텍처

### 1. i18n (Internationalization) 시스템

#### 1.1 핵심 구성 요소
```typescript
// Node_HomePage/src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
```

#### 1.2 언어 지원 구조
```typescript
const resources = {
  ko: { translation: { /* 한국어 번역 */ } },
  en: { translation: { /* 영어 번역 */ } },
  zh: { translation: { /* 중국어 번역 */ } },
  ja: { translation: { /* 일본어 번역 */ } }
};
```

### 2. 번역 키 구조

#### 2.1 계층적 번역 키 시스템
```typescript
{
  common: {
    cancel: '취소',
    confirm: '확인',
    close: '닫기',
    copy: '복사',
    optional: '선택사항'
  },
  wallet: {
    myWallet: '나의 지갑',
    otpRegistration: 'OTP 등록',
    kycApplication: 'KYC 신청',
    kycDisabled: '(비활성화)',
    copyAddress: '주소 복사',
    copyComplete: '복사 완료',
    referralCode: '추천 코드',
    referralCodeGuide: '추천인 코드 가입 안내',
    messageOptional: '선택사항'
  }
}
```

## 🔧 구현된 기능들

### 1. CustomAlertModal 다국어 지원

#### 1.1 고급스러운 알림 시스템
```typescript
// Node_HomePage/src/components/CustomAlertModal.tsx
const CustomAlertModal: React.FC<CustomAlertModalProps> = ({ 
  isOpen, onClose, type, title, message, targetElement 
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose} />
      <div ref={modalRef} style={{ zIndex: 99999 }}>
        <h3 className="text-lg font-bold text-white mb-2">
          {t(title)} {/* ✅ 즉시 번역 */}
        </h3>
        <p className="text-white text-center text-sm leading-relaxed">
          {t(message)} {/* ✅ 즉시 번역 */}
        </p>
        <button onClick={onClose}>
          {t('common.confirm')} {/* ✅ 즉시 번역 */}
        </button>
      </div>
    </div>
  );
};
```

#### 1.2 Z-index 최적화
- **최고 우선순위**: `z-index: 99999`
- **위치 조정**: 특정 입력창 앞에 모달 표시
- **배경 오버레이**: `backdrop-blur-sm` 효과

### 2. 하드코딩 텍스트 완전 제거

#### 2.1 App.tsx 번역 적용
```typescript
// 기존 하드코딩
<button>OTP 등록</button>
<button>KYC 신청 (비활성화)</button>
<button>주소 복사</button>
<button>닫기</button>

// ✅ 번역 적용
<button>{t('wallet.otpRegistration')}</button>
<button>{t('wallet.kycApplication')} {t('wallet.kycDisabled')}</button>
<button>{t('wallet.copyAddress')}</button>
<button>{t('common.close')}</button>
```

#### 2.2 입력창 Placeholder 번역
```typescript
// 기존 하드코딩
<input placeholder="Message (Optional)" />

// ✅ 번역 적용
<input placeholder={t('wallet.messageOptional')} />
```

### 3. 오류 메시지 다국어 지원

#### 3.1 비밀번호 관련 오류
```typescript
// 한국어
passwordRequiredTitle: '비밀번호 필요',
passwordRequiredMessage: '비밀번호를 입력해주세요.',
passwordTooShortTitle: '비밀번호 오류',
passwordTooShortMessage: '비밀번호는 8자 이상이어야 합니다.',
passwordMismatchTitle: '비밀번호 불일치',
passwordMismatchMessage: '비밀번호가 일치하지 않습니다.'

// 영어
passwordRequiredTitle: 'Password Required',
passwordRequiredMessage: 'Please enter your password.',
passwordTooShortTitle: 'Password Error',
passwordTooShortMessage: 'Password must be at least 8 characters.',
passwordMismatchTitle: 'Password Mismatch',
passwordMismatchMessage: 'Passwords do not match.'

// 중국어
passwordRequiredTitle: '需要密码',
passwordRequiredMessage: '请输入您的密码。',
passwordTooShortTitle: '密码错误',
passwordTooShortMessage: '密码必须至少8个字符。',
passwordMismatchTitle: '密码不匹配',
passwordMismatchMessage: '密码不匹配。'

// 일본어
passwordRequiredTitle: 'パスワードが必要',
passwordRequiredMessage: 'パスワードを入力してください。',
passwordTooShortTitle: 'パスワードエラー',
passwordTooShortMessage: 'パスワードは8文字以上である必要があります。',
passwordMismatchTitle: 'パスワード不一致',
passwordMismatchMessage: 'パスワードが一致しません。'
```

#### 3.2 지갑 주소 관련 오류
```typescript
// 한국어
addressRequiredTitle: '지갑주소 필요',
addressRequiredMessage: '지갑 주소를 입력해주세요.',
invalidAddressTitle: '잘못된 주소',
invalidAddressMessage: '스텔라 지갑 주소가 올바르지 않습니다. 다시 확인해주세요.'

// 영어
addressRequiredTitle: 'Address Required',
addressRequiredMessage: 'Please enter your wallet address.',
invalidAddressTitle: 'Invalid Address',
invalidAddressMessage: 'Stellar wallet address is incorrect. Please check again.'

// 중국어
addressRequiredTitle: '需要钱包地址',
addressRequiredMessage: '请输入您的钱包地址。',
invalidAddressTitle: '地址无效',
invalidAddressMessage: '恒星钱包地址不正确。请重新检查。'

// 일본어
addressRequiredTitle: 'ウォレットアドレスが必要',
addressRequiredMessage: 'ウォレットアドレスを入力してください。',
invalidAddressTitle: '無効なアドレス',
invalidAddressMessage: 'ステラウォレットアドレスが正しくありません。再度確認してください。'
```

### 4. 시드문구 검증 오류 다국어 지원

#### 4.1 시드문구 관련 오류 메시지
```typescript
// 한국어
seedPhraseVerificationFailed: '시드문구 검증에 실패했습니다',
seedPhraseInvalidBIP39: '유효하지 않은 BIP39 시드문구입니다'

// 영어
seedPhraseVerificationFailed: 'Seed Phrase Verification Failed',
seedPhraseInvalidBIP39: 'Invalid BIP39 seed phrase'

// 중국어
seedPhraseVerificationFailed: '种子短语验证失败',
seedPhraseInvalidBIP39: '无效的BIP39种子短语'

// 일본어
seedPhraseVerificationFailed: 'シードフレーズ検証に失敗しました',
seedPhraseInvalidBIP39: '無効なBIP39シードフレーズです'
```

### 5. 추천인 코드 시스템 다국어 지원

#### 5.1 추천인 코드 관련 메시지
```typescript
// 한국어
referralCodeNotFound: '존재하지 않는 추천인 코드입니다.',
referralCodeNotFoundMessage: '입력하신 추천인 코드가 존재하지 않습니다. 올바른 코드를 입력해주세요.',
referralCodeAuthenticationComplete: '추천인 코드 인증이 완료되었습니다!',
referralBonusMessage: '추천인 보너스: 1BW + 1.2% 영구보너스 (백서 정책)'

// 영어
referralCodeNotFound: 'Referral code does not exist.',
referralCodeNotFoundMessage: 'The referral code you entered does not exist. Please enter the correct code.',
referralCodeAuthenticationComplete: 'Referral code authentication completed!',
referralBonusMessage: 'Referral bonus: 1BW + 1.2% permanent bonus (whitepaper policy)'

// 중국어
referralCodeNotFound: '推荐代码不存在。',
referralCodeNotFoundMessage: '您输入的推荐代码不存在。请输入正确的代码。',
referralCodeAuthenticationComplete: '推荐代码认证完成！',
referralBonusMessage: '推荐奖金：1BW + 1.2%永久奖金（白皮书政策）'

// 일본어
referralCodeNotFound: '紹介コードが存在しません。',
referralCodeNotFoundMessage: '入力された紹介コードが存在しません。正しいコードを入力してください。',
referralCodeAuthenticationComplete: '紹介コード認証が完了しました！',
referralBonusMessage: '紹介ボーナス：1BW + 1.2%永久ボーナス（ホワイトペーパーポリシー）'
```

## 🎨 UI/UX 개선사항

### 1. 모달 시스템 최적화

#### 1.1 Z-index 계층 구조
```css
/* 최고 우선순위 */
.custom-alert-modal {
  z-index: 99999 !important;
  position: fixed !important;
}

/* 일반 모달 */
.modal-container {
  z-index: 50;
}

/* 배경 오버레이 */
.modal-backdrop {
  z-index: 40;
}
```

#### 1.2 위치 조정 시스템
```typescript
useEffect(() => {
  if (targetElement && isOpen && modalRef.current) {
    const element = document.getElementById(targetElement);
    if (element) {
      const rect = element.getBoundingClientRect();
      const modal = modalRef.current;
      
      // 특정 요소 앞에 모달 위치 조정
      modal.style.position = 'absolute';
      modal.style.top = `${rect.top - 120}px`;
      modal.style.left = `${rect.left + (rect.width / 2)}px`;
      modal.style.transform = 'translateX(-50%)';
      modal.style.zIndex = '99999';
    }
  }
}, [targetElement, isOpen]);
```

### 2. 실시간 언어 변경

#### 2.1 언어 변경 감지
```typescript
const { t, i18n } = useTranslation();

const changeLanguage = (language: string) => {
  i18n.changeLanguage(language);
  // 즉시 모든 UI 텍스트가 번역됨
};
```

#### 2.2 동적 텍스트 업데이트
```typescript
// 모든 하드코딩된 텍스트를 t() 함수로 교체
<h2>{t('wallet.myWallet')}</h2>
<button>{t('wallet.otpRegistration')}</button>
<input placeholder={t('wallet.messageOptional')} />
```

## 🔍 기술적 구현 세부사항

### 1. 번역 키 네이밍 컨벤션

#### 1.1 계층적 구조
```
common.{action}          // 공통 액션 (cancel, confirm, close)
wallet.{feature}         // 지갑 관련 기능
mining.{status}          // 마이닝 관련 상태
error.{type}             // 오류 타입별 메시지
```

#### 1.2 일관된 네이밍
```typescript
// 액션 기반
copyAddress: '주소 복사'
copyComplete: '복사 완료'

// 상태 기반
isMiningActive: '마이닝 중'
isMiningStopped: '마이닝 정지'

// 오류 기반
passwordRequiredTitle: '비밀번호 필요'
passwordRequiredMessage: '비밀번호를 입력해주세요.'
```

### 2. 성능 최적화

#### 2.1 번역 캐싱
```typescript
// i18next는 자동으로 번역을 캐싱하여 성능 최적화
const resources = {
  ko: { translation: { /* 번역 데이터 */ } },
  en: { translation: { /* 번역 데이터 */ } }
};
```

#### 2.2 지연 로딩
```typescript
// 필요시에만 번역 데이터 로드
const loadTranslation = async (language: string) => {
  const translation = await import(`./locales/${language}.json`);
  i18n.addResourceBundle(language, 'translation', translation);
};
```

### 3. 오류 처리

#### 3.1 번역 키 누락 처리
```typescript
// 번역 키가 없을 경우 기본값 반환
const safeTranslate = (key: string, fallback: string) => {
  const translation = t(key);
  return translation === key ? fallback : translation;
};
```

#### 3.2 언어별 특수 처리
```typescript
// 일본어의 경우 한문 대신 영어 사용
const getOptionalText = () => {
  const currentLanguage = i18n.language;
  if (currentLanguage === 'ja') {
    return 'Optional'; // 한문 '任意' 대신 영어 사용
  }
  return t('common.optional');
};
```

## 📊 구현 결과

### 1. 완성된 번역 키 목록

#### 1.1 공통 번역 키 (common)
- `cancel`: 취소 / Cancel / 取消 / キャンセル
- `confirm`: 확인 / Confirm / 确认 / 確認
- `close`: 닫기 / Close / 关闭 / 閉じる
- `copy`: 복사 / Copy / 复制 / コピー
- `optional`: 선택사항 / Optional / 可选 / 任意

#### 1.2 지갑 관련 번역 키 (wallet)
- `myWallet`: 나의 지갑 / My Wallet / 我的钱包 / マイウォレット
- `otpRegistration`: OTP 등록 / OTP Registration / OTP注册 / OTP登録
- `kycApplication`: KYC 신청 / KYC Application / KYC申请 / KYC申請
- `kycDisabled`: (비활성화) / (Disabled) / (已禁用) / (無効)
- `copyAddress`: 주소 복사 / Copy Address / 复制地址 / アドレスコピー
- `copyComplete`: 복사 완료 / Copy Complete / 复制完成 / コピー完了
- `referralCode`: 추천 코드 / Referral Code / 推荐代码 / 紹介コード
- `referralCodeGuide`: 추천인 코드 가입 안내 / Referral Code Registration Guide / 推荐代码注册指南 / 紹介コード登録ガイド
- `messageOptional`: 선택사항 / Optional / 可选 / 任意

#### 1.3 오류 메시지 번역 키
- `passwordRequiredTitle`: 비밀번호 필요 / Password Required / 需要密码 / パスワードが必要
- `passwordRequiredMessage`: 비밀번호를 입력해주세요 / Please enter your password / 请输入您的密码 / パスワードを入力してください
- `addressRequiredTitle`: 지갑주소 필요 / Address Required / 需要钱包地址 / ウォレットアドレスが必要
- `addressRequiredMessage`: 지갑 주소를 입력해주세요 / Please enter your wallet address / 请输入您的钱包地址 / ウォレットアドレスを入力してください
- `seedPhraseVerificationFailed`: 시드문구 검증에 실패했습니다 / Seed Phrase Verification Failed / 种子短语验证失败 / シードフレーズ検証に失敗しました
- `seedPhraseInvalidBIP39`: 유효하지 않은 BIP39 시드문구입니다 / Invalid BIP39 seed phrase / 无效的BIP39种子短语 / 無効なBIP39シードフレーズです

### 2. 사용자 경험 개선

#### 2.1 일관된 UI/UX
- 모든 알림 메시지가 동일한 스타일의 모달로 표시
- 언어 변경 시 즉시 모든 텍스트가 번역됨
- Z-index 최적화로 모달이 올바른 순서로 표시

#### 2.2 접근성 향상
- 4개 언어 완전 지원으로 글로벌 사용자 접근성 확보
- 직관적인 번역으로 사용자 이해도 향상
- 일관된 메시지 형식으로 사용자 혼란 최소화

## 🚀 향후 개선 계획

### 1. 추가 언어 지원
- 스페인어 (es)
- 프랑스어 (fr)
- 독일어 (de)
- 러시아어 (ru)

### 2. 고급 번역 기능
- 동적 번역 (변수 치환)
- 복수형 처리
- 날짜/시간 형식 지역화
- 숫자 형식 지역화

### 3. 성능 최적화
- 번역 데이터 압축
- 지연 로딩 최적화
- 번역 캐싱 전략 개선

## 📝 결론

BitWish Network의 언어 번역 시스템은 완전한 다국어 지원을 제공하며, 사용자 경험을 크게 향상시켰습니다. 고급스러운 알림 시스템과 실시간 언어 변경 기능을 통해 글로벌 사용자들에게 일관되고 직관적인 인터페이스를 제공합니다.

이 시스템은 확장 가능한 아키텍처를 기반으로 하여 향후 추가 언어 지원과 고급 기능 구현이 용이하도록 설계되었습니다.

---

**작성일**: 2024년 12월 19일  
**작성자**: AI Assistant  
**버전**: 1.0  
**상태**: 완료

