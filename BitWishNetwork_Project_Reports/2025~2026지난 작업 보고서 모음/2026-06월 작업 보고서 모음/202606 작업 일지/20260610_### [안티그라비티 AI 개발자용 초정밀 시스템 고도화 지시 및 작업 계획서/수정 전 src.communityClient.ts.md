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

    return response.json();
};
