/**
 * BitWishNetwork KYC Form Modal CSS
 * Premium Glassmorphism Design System
 */

.kyc-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(12px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    animation: kycFadeIn 0.3s ease-out;
}

@keyframes kycFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.kyc-modal-container {
    width: 95%;
    max-width: 550px;
    max-height: 90vh;
    background: var(--color-surface);
    backdrop-filter: blur(20px);
    border: 1px solid var(--color-border);
    border-radius: 24px;
    padding: 32px;
    position: relative;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--color-primary) transparent;
}

.kyc-modal-container::-webkit-scrollbar {
    width: 6px;
}

.kyc-modal-container::-webkit-scrollbar-thumb {
    background: rgba(255, 165, 0, 0.3);
    border-radius: 3px;
}

.kyc-header {
    text-align: center;
    margin-bottom: 24px;
}

.kyc-header h2 {
    color: var(--color-primary);
    font-size: 1.8rem;
    font-weight: 700;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
}

.kyc-header p {
    color: var(--color-text-secondary);
    font-size: 0.9rem;
}

.kyc-notice-area {
    background: rgba(255, 165, 0, 0.08);
    border: 1px solid rgba(255, 165, 0, 0.3);
    border-radius: 16px;
    padding: 18px;
    margin-bottom: 28px;
    animation: kycSlideUp 0.5s ease-out;
}

.kyc-notice-title {
    color: #ffa500;
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.kyc-notice-content {
    color: var(--color-text-primary);
    font-size: 0.88rem;
    line-height: 1.6;
    opacity: 0.85;
}

.kyc-form-group {
    margin-bottom: 20px;
}

.kyc-label {
    display: block;
    color: var(--color-text-primary);
    font-size: 0.95rem;
    margin-bottom: 8px;
    font-weight: 500;
    opacity: 0.9;
}

.kyc-input {
    width: 100%;
    background: var(--color-background-soft);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 12px 16px;
    color: var(--color-text-primary);
    font-size: 1rem;
    transition: all 0.2s ease;
    outline: none;
}

.kyc-input:focus {
    border-color: var(--color-primary);
    background: var(--color-surface-hover);
    box-shadow: 0 0 0 4px var(--color-primary-soft);
}

.kyc-address-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 12px;
}

.kyc-upload-area {
    border: 2px dashed var(--color-border);
    border-radius: 16px;
    padding: 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background: var(--color-background-soft);
}

.kyc-upload-area:hover {
    border-color: var(--color-primary);
    background: var(--color-surface-hover);
}

.kyc-upload-icon {
    font-size: 2rem;
    margin-bottom: 12px;
}

.kyc-upload-text {
    color: var(--color-text-secondary);
    font-size: 0.9rem;
}

.kyc-preview-container {
    margin-top: 16px;
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.kyc-preview-image {
    width: 100%;
    display: block;
}

.kyc-remove-file {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(255, 0, 0, 0.8);
    color: #fff;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 12px;
}

.kyc-terms {
    margin-top: 24px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    cursor: pointer;
}

.kyc-terms input {
    margin-top: 4px;
}

.kyc-terms-text {
    color: var(--color-text-secondary);
    font-size: 0.85rem;
    line-height: 1.4;
}

.kyc-actions {
    margin-top: 32px;
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 12px;
}

.kyc-btn-cancel {
    padding: 14px;
    background: var(--color-background-soft);
    border: 1px solid var(--color-border);
    color: var(--color-text-primary);
    border-radius: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.kyc-btn-cancel:hover {
    background: rgba(255, 255, 255, 0.1);
}

.kyc-btn-submit {
    padding: 14px;
    background: var(--color-primary-gradient);
    border: none;
    color: var(--color-surface);
    border-radius: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: var(--shadow-primary);
}

.kyc-btn-submit:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 25px -5px rgba(255, 165, 0, 0.5);
}

.kyc-btn-submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}

/* [공정 2-2] 프리미엄 락다운 레이어 스타일 */
.kyc-lockdown-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(15px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    border-radius: 20px;
    animation: kycFadeIn 0.3s ease-out;
}

.kyc-lockdown-popup {
    background: var(--color-surface);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 40px;
    border-radius: 24px;
    text-align: center;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    transform: translateY(0);
    animation: kycSlideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.lockdown-icon {
    font-size: 3rem;
    margin-bottom: 20px;
}

.lockdown-title {
    font-size: 1.5rem;
    color: var(--color-text-primary);
    margin-bottom: 15px;
    font-weight: 800;
}

.lockdown-message {
    font-size: 1rem;
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin-bottom: 30px;
}

.lockdown-close-btn {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: #ffffff;
    border: none;
    padding: 12px 40px;
    border-radius: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
}

.lockdown-close-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
}

@keyframes kycFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes kycSlideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

