export const communityFetch = async (endpoint: string, options: RequestInit = {}) => {
    // 5001포트 통합 백엔드(안전 플러그인 라우터)로 통신
    const BASE_URL = '/api/community';
    // -------------------------------------------------------------------------
    // 로컬 스토리지에 저장된 커뮤니티 전용 JWT 토큰만 사용 (지갑 연동 아님)
    const token = localStorage.getItem('bw_community_access_token');

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // 응답의 Content-Type을 확인하여 JSON이 아닌 경우(HTML 등) 안전하게 처리
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        // 서버가 HTML을 반환한 경우 (프록시 실패, 서버 미실행 등)
        return { error: '서버 연결에 실패했습니다. 백엔드 서버(5001 포트)가 실행 중인지 확인해 주세요.' };
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `서버 오류 (${response.status})` }));
        return errorData;
    }

    return response.json();
};
