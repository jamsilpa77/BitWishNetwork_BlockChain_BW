import React, { useState, useEffect } from 'react';

interface IExtensionPolicy {
    isBetaActive: boolean;
    currentRate: number;
    betaEndDate?: string;
    description?: string;
    updatedAt?: string;
    updatedBy?: string;
}

const ExtensionPolicyManager: React.FC = () => {
    const [policy, setPolicy] = useState<IExtensionPolicy | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // 정책 조회
    const fetchPolicy = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/extension/policy');
            const data = await res.json();
            if (data.success && data.data) {
                setPolicy(data.data);
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: '정책을 불러오는데 실패했습니다: ' + err.message });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPolicy();
    }, []);

    // 모드 전환 핸들러 (30% ↔ 10%)
    const handleToggleMode = async (targetBetaState: boolean) => {
        const confirmMsg = targetBetaState
            ? '🚀 크롬 확장프로그램을 [클로즈 베타 +30% 특전] 모드로 전환하시겠습니까?\n모든 활성 사용자에게 30% 부스트가 적용됩니다.'
            : '🛡️ 크롬 확장프로그램 클로즈 베타를 공식 종료하고 [정규 운영 +10% 표준] 모드로 전환하시겠습니까?\n전체 활성 사용자의 확장 보너스가 즉시 10%로 일괄 조정됩니다.';

        if (!window.confirm(confirmMsg)) return;

        setIsSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/admin/extension/policy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    isBetaActive: targetBetaState,
                    adminEmail: 'salmani1@naver.com'
                })
            });

            const data = await res.json();
            if (data.success) {
                setPolicy(data.data);
                setMessage({
                    type: 'success',
                    text: `✅ ${data.message} (동기화된 유저: ${data.syncedUsers}명)`
                });
            } else {
                setMessage({ type: 'error', text: data.message || '정책 변경에 실패했습니다.' });
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: '서버 통신 오류: ' + err.message });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div style={{ padding: '20px', color: '#64748b' }}>확장프로그램 정책 데이터를 불러오는 중...</div>;
    }

    const isBeta = policy?.isBetaActive ?? true;
    const currentRatePercent = policy ? (policy.currentRate * 100).toFixed(0) : '30';

    return (
        <div className="extension-policy-manager" style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                <div>
                    <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🚀 크롬 확장프로그램 부스트 거버넌스 제어 콘솔
                    </h2>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        클로즈 베타 종료 시 소스 코드 수정 없이 원클릭으로 30% 부스트를 정규 10% 요율로 즉시 전환하고 전 시스템을 안전하게 동기화합니다.
                    </p>
                </div>
                <button
                    onClick={fetchPolicy}
                    disabled={isSaving}
                    style={{
                        padding: '8px 14px',
                        fontSize: '12px',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        color: '#475569'
                    }}
                >
                    🔄 상태 새로고침
                </button>
            </div>

            {message && (
                <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    fontSize: '14px',
                    fontWeight: 600,
                    backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
                    color: message.type === 'success' ? '#065f46' : '#991b1b',
                    border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`
                }}>
                    {message.text}
                </div>
            )}

            {/* 현재 부스트 상태 카드 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>
                <div style={{
                    padding: '20px',
                    borderRadius: '12px',
                    background: isBeta ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : '#f8fafc',
                    border: `1.5px solid ${isBeta ? '#3b82f6' : '#e2e8f0'}`
                }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>현재 가동 상태</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 700,
                            backgroundColor: isBeta ? '#2563eb' : '#64748b',
                            color: '#ffffff'
                        }}>
                            {isBeta ? '🔥 클로즈 베타 가동 중' : '🛡️ 정규 운영 표준'}
                        </span>
                        <span style={{ fontSize: '26px', fontWeight: 800, color: isBeta ? '#1d4ed8' : '#334155' }}>
                            +{currentRatePercent}% 부스트
                        </span>
                    </div>
                </div>

                <div style={{
                    padding: '20px',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>거버넌스 메타데이터</div>
                    <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>
                        <div><strong>최종 수정:</strong> {policy?.updatedAt ? new Date(policy.updatedAt).toLocaleString('ko-KR') : '-'}</div>
                        <div><strong>정책 설명:</strong> {policy?.description || '-'}</div>
                    </div>
                </div>
            </div>

            {/* 원클릭 전환 제어 패널 */}
            <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px'
            }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#1e293b' }}>
                    ⚙️ 부스트 모드 원클릭 전환 스위치
                </h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
                    아래 버튼을 클릭하여 전체 크롬 확장프로그램 팝업 및 백엔드 채굴 엔진의 보너스 상한을 즉각 변경할 수 있습니다.
                </p>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => handleToggleMode(true)}
                        disabled={isSaving || isBeta}
                        style={{
                            padding: '12px 20px',
                            borderRadius: '10px',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: isBeta ? 'not-allowed' : 'pointer',
                            backgroundColor: isBeta ? '#94a3b8' : '#2563eb',
                            color: '#ffffff',
                            boxShadow: isBeta ? 'none' : '0 2px 4px rgba(37, 99, 235, 0.3)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {isBeta ? '✓ 현재 30% 베타 모드 가동 중' : '🚀 30% 클로즈 베타 모드로 전환'}
                    </button>

                    <button
                        onClick={() => handleToggleMode(false)}
                        disabled={isSaving || !isBeta}
                        style={{
                            padding: '12px 20px',
                            borderRadius: '10px',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: !isBeta ? 'not-allowed' : 'pointer',
                            backgroundColor: !isBeta ? '#94a3b8' : '#dc2626',
                            color: '#ffffff',
                            boxShadow: !isBeta ? 'none' : '0 2px 4px rgba(220, 38, 38, 0.3)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {!isBeta ? '✓ 현재 10% 정규 모드 가동 중' : '🛡️ 베타 종료 ➡️ 10% 정규 운영으로 전환'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExtensionPolicyManager;
