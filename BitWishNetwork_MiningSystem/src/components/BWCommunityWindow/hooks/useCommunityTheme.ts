import { useState, useEffect } from 'react';

export const useCommunityTheme = () => {
    // 로컬 스토리지의 'bw-theme'을 조회하여 메인 페이지와 테마를 정밀 동기화
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        return localStorage.getItem('bw-theme') === 'dark' ? 'dark' : 'light';
    });

    const toggleTheme = () => {
        const nextTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(nextTheme);
        localStorage.setItem('bw-theme', nextTheme);
    };

    // 타 프로세스(새 창/메인 탭)에서 발생한 테마 전환 이벤트를 실시간 포착하여 공유
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'bw-theme' && e.newValue) {
                setTheme(e.newValue as 'light' | 'dark');
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    return { theme, toggleTheme };
};
