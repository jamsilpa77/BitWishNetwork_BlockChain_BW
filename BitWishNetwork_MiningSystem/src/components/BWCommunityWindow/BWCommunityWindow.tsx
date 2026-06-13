import React, { useState, useEffect } from 'react';
import { useCommunityTheme } from './hooks/useCommunityTheme';
import { Language, getTranslation } from './locales/community_i18n';
import { communityFetch } from './api/communityClient';

interface BWCommunityWindowProps {
    onClose?: () => void;
}

interface Post {
    id: number;
    title: string;
    content: string;
    category: string;
    views: number;
    likeCount: number;
    dislikeCount: number;
    heartCount: number;
    funnyCount: number;
    hotScore: number;
    isNotice: boolean;
    images?: string[];
    createdAt: string;
    authorId: number;
    author: {
        nickname: string;
        id: number;
    };
}

interface Comment {
    id: number;
    content: string;
    createdAt: string;
    userId: number;
    parentId: number | null;
    user: {
        nickname: string;
    };
    replies?: Comment[];
}

export const BWCommunityWindow: React.FC<BWCommunityWindowProps> = ({ onClose }) => {
    const { theme, toggleTheme } = useCommunityTheme();

    const [lang, setLang] = useState<Language>(() => {
        const saved = localStorage.getItem('bw_lang') as Language;
        return (saved && ['ko', 'en', 'ja', 'zh'].includes(saved)) ? saved : 'ko';
    });

    const [currentView, setCurrentView] = useState<'list' | 'detail' | 'write' | 'admin' | 'auth'>('list');
    const [posts, setPosts] = useState<Post[]>([]);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const [token, setToken] = useState<string | null>(() => localStorage.getItem('bw_community_access_token'));
    const [currentUser, setCurrentUser] = useState<{ id: number; email: string; nickname: string; role: string } | null>(() => {
        const saved = localStorage.getItem('bw_community_user');
        return saved ? JSON.parse(saved) : null;
    });

    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);
    const [nicknameChecking, setNicknameChecking] = useState(false);
    const [nicknameError, setNicknameError] = useState('');
    const [authError, setAuthError] = useState('');

    // 게시글 수정 관련 상태
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');

    const [writeTitle, setWriteTitle] = useState('');
    const [writeContent, setWriteContent] = useState('');
    const [writeCategory, setWriteCategory] = useState('HUMOR');
    const [writeImagesBase64, setWriteImagesBase64] = useState<string[]>([]);
    const [editImagesBase64, setEditImagesBase64] = useState<string[]>([]);

    const [commentText, setCommentText] = useState('');
    const [replyText, setReplyText] = useState('');
    const [activeReplyCommentId, setActiveReplyCommentId] = useState<number | null>(null);

    const [adminNoticeTitle, setAdminNoticeTitle] = useState('');
    const [adminNoticeContent, setAdminNoticeContent] = useState('');
    const [adminBanUserId, setAdminBanUserId] = useState<string>('');

    const CATEGORIES = [
        { id: '', key: 'cat_all' },
        { id: 'NOTICE', key: 'cat_notice' },
        { id: 'HUMOR', key: 'cat_humor' },
        { id: 'INFO', key: 'cat_info' },
        { id: 'FREE', key: 'cat_free' },
        { id: 'QUESTION', key: 'cat_question' },
        { id: 'GAME', key: 'cat_game' },
        { id: 'ANONYMOUS', key: 'cat_anon' }
    ];

    useEffect(() => {
        fetchPostList();
        const interval = setInterval(() => {
            fetchPostList(true);
        }, 3000);
        return () => clearInterval(interval);
    }, [categoryFilter, currentPage]);

    const fetchPostList = async (isBackground = false) => {
        if (!isBackground) setIsLoading(true);
        try {
            const res = await communityFetch(`/posts?page=${currentPage}&category=${categoryFilter}`);
            if (res.success && res.data) {
                setPosts(res.data.posts || []);
                setTotalPages(res.data.totalPages || 1);
            }
        } catch (err) {
            console.error('Failed to fetch posts', err);
        } finally {
            if (!isBackground) setIsLoading(false);
        }
    };

    const fetchPostDetail = async (id: number) => {
        setIsLoading(true);
        try {
            const res = await communityFetch(`/posts/${id}`);
            if (res.success && res.data) {
                setSelectedPost(res.data);
                setComments(res.data.comments || []);
                setCurrentView('detail');
            }
        } catch (err) {
            console.error('Failed to fetch post detail', err);
        } finally {
            setIsLoading(false);
        }
    };

    // 닉네임 중복확인 핸들러
    const handleCheckNickname = async () => {
        if (!nickname || nickname.trim().length === 0) return;
        setNicknameChecking(true);
        setNicknameAvailable(null);
        setNicknameError('');
        try {
            const res = await communityFetch(`/auth/check-nickname/${encodeURIComponent(nickname.trim())}`);
            if (res.error) {
                setNicknameError(res.error);
                setNicknameAvailable(null);
            } else {
                setNicknameAvailable(res.available === true);
                if (res.available !== true) {
                    setNicknameError('이미 사용 중인 닉네임입니다.');
                }
            }
        } catch (err: any) {
            console.error('Check nickname error:', err);
            setNicknameError(`서버 통신 오류가 발생했습니다. (${err.message || err})`);
            setNicknameAvailable(null);
        } finally {
            setNicknameChecking(false);
        }
    };

    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');

        // 회원가입 시 비밀번호 확인 검증
        if (authMode === 'register') {
            if (password !== confirmPassword) {
                setAuthError('비밀번호가 일치하지 않습니다.');
                return;
            }
            if (nicknameAvailable !== true) {
                setAuthError('닉네임 중복확인을 먼저 진행해주세요.');
                return;
            }
        }

        try {
            const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
            const body = authMode === 'login' ? { email, password } : { email, password, nickname };

            const res = await communityFetch(endpoint, {
                method: 'POST',
                body: JSON.stringify(body)
            });
            if (res.tokens && res.user) {
                localStorage.setItem('bw_community_access_token', res.tokens.accessToken);
                localStorage.setItem('bw_community_user', JSON.stringify(res.user));
                setToken(res.tokens.accessToken);
                setCurrentUser(res.user);
                setConfirmPassword('');
                setNicknameAvailable(null);
                setNicknameError('');
                setCurrentView('list');
            } else {
                setAuthError(res.error || 'Authentication failed');
            }
        } catch (err) {
            setAuthError('Network communication error');
        }
    };

    const handleMockGoogleLogin = () => {
        alert("Google OAuth 연동이 필요합니다. 관리자 터미널을 통한 @react-oauth/google 설치 후 모듈을 활성화해 주세요.");
    };

    const handleLogout = () => {
        localStorage.removeItem('bw_community_access_token');
        localStorage.removeItem('bw_community_user');
        setToken(null);
        setCurrentUser(null);
        setCurrentView('list');
    };

    const handleWriteImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);
        if (writeImagesBase64.length + fileArray.length > 10) {
            alert('이미지는 최대 10개까지 업로드할 수 있습니다.');
            e.target.value = '';
            return;
        }

        const validFiles: File[] = [];
        for (const file of fileArray) {
            if (file.size > 2 * 1024 * 1024) {
                alert(`[${file.name}] 파일 크기가 2MB를 초과하여 제외되었습니다.`);
            } else {
                validFiles.push(file);
            }
        }

        if (validFiles.length === 0) {
            e.target.value = '';
            return;
        }

        let loadedCount = 0;
        const tempBase64s: string[] = [];

        validFiles.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                tempBase64s.push(reader.result as string);
                loadedCount++;
                if (loadedCount === validFiles.length) {
                    setWriteImagesBase64(prev => [...prev, ...tempBase64s]);
                    e.target.value = '';
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleRemoveWriteImage = (index: number) => {
        setWriteImagesBase64(prev => prev.filter((_, i) => i !== index));
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        // --- [신규 수복] 비로그인 유저 진입 차단 다국어 경고 가드 ---
        const showLoginAlert = () => {
            const messages: { [key: string]: string } = {
                ko: '로그인 후 이용할 수 있습니다.',
                en: 'This feature is available after logging in.',
                ja: 'ログイン後に利用可能です。',
                zh: '登录后即可使用此功能。'
            };
            alert(messages[lang] || messages['en']);
            setAuthMode('login');
            setCurrentView('auth');
        };
        // --------------------------------------------------------
        e.preventDefault();
        if (!token || !currentUser) {
            showLoginAlert(); // 경고 알림 팝업 추가 가동
            return;
        }
        if (!writeTitle || !writeContent) return;

        try {
            const res = await communityFetch('/posts', {
                method: 'POST',
                body: JSON.stringify({
                    title: writeTitle,
                    content: writeContent,
                    category: writeCategory,
                    images: writeImagesBase64,
                    authorId: currentUser.id
                })
            });
            if (res.success) {
                setWriteTitle('');
                setWriteContent('');
                setWriteImagesBase64([]);
                fetchPostList();
                setCurrentView('list');
            }
        } catch (err) {
            console.error('Failed to create post', err);
        }
    };

    const handleCreateComment = async (e: React.FormEvent, parentId: number | null = null) => {
        e.preventDefault();
        if (!token || !currentUser || !selectedPost) {
            setCurrentView('auth');
            return;
        }

        const content = parentId ? replyText : commentText;
        if (!content.trim()) return;

        try {
            const res = await communityFetch('/comments', {
                method: 'POST',
                body: JSON.stringify({
                    content,
                    postId: selectedPost.id,
                    userId: currentUser.id,
                    parentId
                })
            });

            if (res.success) {
                if (parentId) {
                    setReplyText('');
                    setActiveReplyCommentId(null);
                } else {
                    setCommentText('');
                }
                fetchPostDetail(selectedPost.id);
            }
        } catch (err) {
            console.error('Failed to post comment', err);
        }
    };

    const handleReaction = async (type: 'LIKE' | 'DISLIKE' | 'HEART' | 'FUNNY') => {
        if (!token || !currentUser || !selectedPost) {
            setCurrentView('auth');
            return;
        }

        try {
            const res = await communityFetch('/reactions', {
                method: 'POST',
                body: JSON.stringify({
                    type,
                    postId: selectedPost.id,
                    userId: currentUser.id
                })
            });
            if (res.success) {
                fetchPostDetail(selectedPost.id);
            }
        } catch (err) {
            console.error('Failed to apply reaction', err);
        }
    };

    // 게시글 수정 핸들러
    const handleEditPost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPost || !currentUser) return;
        try {
            const res = await communityFetch(`/posts/${selectedPost.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    title: editTitle,
                    content: editContent,
                    images: editImagesBase64,
                    authorId: currentUser.id
                })
            });
            if (res.success) {
                setIsEditing(false);
                setEditImagesBase64([]);
                fetchPostDetail(selectedPost.id);
            } else {
                alert(res.error || '수정에 실패했습니다.');
            }
        } catch (err) {
            alert('수정 중 오류가 발생했습니다.');
        }
    };

    // 게시글 삭제 핸들러
    const handleDeletePost = async () => {
        if (!selectedPost || !currentUser) return;
        if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;
        try {
            const res = await communityFetch(`/posts/${selectedPost.id}`, {
                method: 'DELETE',
                body: JSON.stringify({ authorId: currentUser.id })
            });
            if (res.success) {
                alert('게시글이 삭제되었습니다.');
                setCurrentView('list');
                fetchPostList();
            } else {
                alert(res.error || '삭제에 실패했습니다.');
            }
        } catch (err) {
            alert('삭제 중 오류가 발생했습니다.');
        }
    };

    const handleCreateNotice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || currentUser.role !== 'ADMIN') return;
        if (!adminNoticeTitle || !adminNoticeContent) return;

        try {
            const res = await communityFetch('/admin/notice', {
                method: 'POST',
                body: JSON.stringify({
                    title: adminNoticeTitle,
                    content: adminNoticeContent,
                    authorId: currentUser.id
                })
            });
            if (res.success) {
                setAdminNoticeTitle('');
                setAdminNoticeContent('');
                alert('공지사항 등록 완료');
                fetchPostList();
                setCurrentView('list');
            }
        } catch (err) {
            console.error('Notice error', err);
        }
    };

    const handleAdminBanUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminBanUserId) return;
        try {
            const res = await communityFetch('/admin/user/ban', {
                method: 'POST',
                body: JSON.stringify({ userId: Number(adminBanUserId) })
            });
            if (res.success) {
                alert(`유저 차단 완료`);
                setAdminBanUserId('');
            }
        } catch (err) {
            console.error('Admin ban error', err);
        }
    };

    const handleClose = () => {
        if (onClose) onClose();
        else window.close();
    };

    // 프리미엄 글래스모피즘 기반 다이내믹 다크모드 CSS 변수
    const cssVariables = theme === 'dark' ? `
        --bw-bg-root: #0f172a;
        --bw-bg-primary: rgba(30, 41, 59, 0.7);
        --bw-bg-secondary: rgba(15, 23, 42, 0.8);
        --bw-bg-card: rgba(30, 41, 59, 0.5);
        --bw-border-color: rgba(255, 255, 255, 0.1);
        --bw-text-primary: #f8fafc;
        --bw-text-secondary: #94a3b8;
        --bw-input-bg: rgba(15, 23, 42, 0.6);
        --bw-card-hover: rgba(51, 65, 85, 0.6);
        --bw-glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
    ` : `
        --bw-bg-root: #f8fafc;
        --bw-bg-primary: rgba(255, 255, 255, 0.7);
        --bw-bg-secondary: rgba(241, 245, 249, 0.8);
        --bw-bg-card: rgba(255, 255, 255, 0.6);
        --bw-border-color: rgba(0, 0, 0, 0.08);
        --bw-text-primary: #0f172a;
        --bw-text-secondary: #64748b;
        --bw-input-bg: rgba(255, 255, 255, 0.9);
        --bw-card-hover: rgba(241, 245, 249, 0.9);
        --bw-glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
    `;

    return (
        <div style={{ width: '100%', minHeight: '100vh', backgroundColor: theme === 'dark' ? '#0f172a' : '#f8fafc', backgroundImage: theme === 'dark' ? 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.15), transparent 400px)' : 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.05), transparent 400px)' }}>
            <style>{`
                .bw-comm-win {
                    ${cssVariables}
                    width: 100%;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    border: none;
                    background-color: var(--bw-bg-primary);
                    color: var(--bw-text-primary);
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                    transition: background-color 0.3s ease, color 0.3s ease;
                }

                .bw-comm-header {
                    padding: 16px 40px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    user-select: none;
                    border-bottom: 1px solid var(--bw-border-color);
                    background-color: var(--bw-bg-secondary);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }

                .bw-comm-body {
                    flex: 1;
                    width: 100%;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 40px 40px;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                }

                .bw-btn {
                    padding: 10px 20px;
                    font-size: 14px;
                    font-weight: 600;
                    border-radius: 12px;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                .bw-btn:active { transform: scale(0.96); }

                .bw-btn-primary { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); }
                .bw-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3); }

                .bw-btn-neutral { background-color: var(--bw-bg-card); color: var(--bw-text-primary); border: 1px solid var(--bw-border-color); }
                .bw-btn-neutral:hover { background-color: var(--bw-card-hover); }

                .bw-pill-nav {
                    display: flex;
                    gap: 8px;
                    overflow-x: auto;
                    padding-bottom: 8px;
                    scrollbar-width: none;
                }
                .bw-pill-nav::-webkit-scrollbar { display: none; }
                
                .bw-tab {
                    padding: 8px 18px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    white-space: nowrap;
                    border: 1px solid var(--bw-border-color);
                    background-color: var(--bw-bg-card);
                    color: var(--bw-text-secondary);
                    transition: all 0.2s;
                }
                .bw-tab.active { background-color: #3b82f6; color: white; border-color: #3b82f6; }
                .bw-tab:hover:not(.active) { background-color: var(--bw-card-hover); color: var(--bw-text-primary); }

                .bw-card {
                    padding: 24px;
                    border-radius: 16px;
                    border: 1px solid var(--bw-border-color);
                    background-color: var(--bw-bg-card);
                    box-shadow: var(--bw-glass-shadow);
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    margin-bottom: 16px;
                }
                .bw-card:hover { background-color: var(--bw-card-hover); transform: translateY(-2px); box-shadow: 0 12px 24px rgba(0,0,0,0.1); }

                .bw-input {
                    padding: 12px 16px;
                    font-size: 14px;
                    border-radius: 12px;
                    border: 1px solid var(--bw-border-color);
                    background-color: var(--bw-input-bg);
                    color: var(--bw-text-primary);
                    outline: none;
                    transition: border-color 0.2s;
                }
                .bw-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }

                @keyframes popBouncing {
                    0% { transform: scale(1) translateY(0); }
                    40% { transform: scale(1.25) translateY(-4px) rotate(-8deg); }
                    70% { transform: scale(1.1) translateY(2px) rotate(4deg); }
                    100% { transform: scale(1) translateY(0) rotate(0); }
                }
                .bw-reaction-btn { transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
                .bw-reaction-btn:active { animation: popBouncing 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }

                /* Skeleton Loading */
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .bw-skeleton { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                .bw-skeleton-box { height: 24px; background-color: var(--bw-border-color); border-radius: 6px; margin-bottom: 8px; }

                .bw-google-btn {
                    width: 100%;
                    padding: 14px;
                    border-radius: 12px;
                    border: 1px solid var(--bw-border-color);
                    background-color: var(--bw-bg-card);
                    color: var(--bw-text-primary);
                    font-size: 15px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                .bw-google-btn:hover { background-color: var(--bw-card-hover); transform: translateY(-1px); }
            `}</style>

            <div className="bw-comm-win">
                <div className="bw-comm-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button onClick={() => window.location.href = '/'} className="bw-btn bw-btn-neutral">
                            🏠 {lang === 'ko' ? '마이닝 홈' : 'Mining Home'}
                        </button>
                        <span style={{ fontSize: '24px' }}>💬</span>
                        <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {getTranslation(lang, 'title')}
                        </h2>
                        {currentUser && (
                            <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', backgroundColor: currentUser.role === 'ADMIN' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(59, 130, 246, 0.1)', color: currentUser.role === 'ADMIN' ? '#ef4444' : '#3b82f6' }}>
                                {currentUser.nickname} {currentUser.role === 'ADMIN' && '👑'}
                            </span>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {currentUser && currentUser.role === 'ADMIN' && (
                            <button onClick={() => setCurrentView(currentView === 'admin' ? 'list' : 'admin')} className="bw-btn" style={{ backgroundColor: '#ef4444', color: 'white' }}>
                                ⚙️ Admin
                            </button>
                        )}
                        <select value={lang} onChange={(e) => { const newLang = e.target.value as Language; setLang(newLang); localStorage.setItem('bw_lang', newLang); }} className="bw-input" style={{ padding: '8px 12px' }}>
                            <option value="ko">🇰🇷 KOR</option>
                            <option value="en">🇺🇸 ENG</option>
                            <option value="ja">🇯🇵 JPN</option>
                            <option value="zh">🇨🇳 CHN</option>
                        </select>
                        <button onClick={toggleTheme} className="bw-btn bw-btn-neutral" style={{ padding: '8px 12px' }}>
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </button>
                        <button onClick={handleClose} className="bw-btn" style={{ padding: '8px 12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                            ❌
                        </button>
                    </div>
                </div>

                <div className="bw-comm-body">
                    {currentView === 'list' && (
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div className="bw-pill-nav">
                                    {CATEGORIES.map(cat => (
                                        <div key={cat.id} onClick={() => { setCategoryFilter(cat.id); setCurrentPage(1); }} className={`bw-tab ${categoryFilter === cat.id ? 'active' : ''}`}>
                                            {getTranslation(lang, cat.key as any)}
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '12px', minWidth: 'max-content' }}>
                                    {token ? (
                                        <>
                                            <button onClick={() => setCurrentView('write')} className="bw-btn bw-btn-primary">✏️ {getTranslation(lang, 'write')}</button>
                                            <button onClick={handleLogout} className="bw-btn bw-btn-neutral">로그아웃</button>
                                        </>
                                    ) : (
                                        <button onClick={() => setCurrentView('auth')} className="bw-btn bw-btn-primary">🔑 {getTranslation(lang, 'login')}</button>
                                    )}
                                </div>
                            </div>

                            <div style={{ flex: 1 }}>
                                {isLoading && posts.length === 0 ? (
                                    <div className="bw-skeleton">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="bw-card" style={{ padding: '30px', display: 'flex', justifyContent: 'space-between' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div className="bw-skeleton-box" style={{ width: '70%' }}></div>
                                                    <div className="bw-skeleton-box" style={{ width: '40%' }}></div>
                                                </div>
                                                <div className="bw-skeleton-box" style={{ width: '84px', height: '84px', borderRadius: '16px' }}></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : posts.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--bw-text-secondary)', fontSize: '16px' }}>등록된 게시물이 없습니다. 첫 글을 작성해 보세요! 🚀</div>
                                ) : (
                                    posts.map((post) => (
                                        <div key={post.id} onClick={() => fetchPostDetail(post.id)} className="bw-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {post.isNotice && <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', backgroundColor: '#ef4444', color: 'white' }}>NOTICE</span>}
                                                    <span style={{ fontSize: '13px', color: '#3b82f6', fontWeight: 600 }}>[{post.category}]</span>
                                                    <span style={{ fontWeight: 700, fontSize: '18px' }}>{post.title}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--bw-text-secondary)' }}>
                                                    <span>👤 {post.author?.nickname || 'Unknown'}</span>
                                                    <span>🕒 {new Date(post.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '4px' }}>
                                                    {post.hotScore > 20 && <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.2)' }}>🔥 HOT {post.hotScore.toFixed(0)}</span>}
                                                    <div style={{ display: 'flex', gap: '16px', fontSize: '15px', color: 'var(--bw-text-secondary)' }}>
                                                        <span>👍 {post.likeCount}</span>
                                                        <span>❤️ {post.heartCount}</span>
                                                        <span>👁️ {post.views}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bw-thumbnail" style={{
                                                width: '84px', height: '84px',
                                                borderRadius: '16px',
                                                backgroundColor: 'var(--bw-input-bg)',
                                                border: '1px solid var(--bw-border-color)',
                                                marginLeft: '20px',
                                                flexShrink: 0,
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                overflow: 'hidden'
                                            }}>
                                                {post.images && post.images.length > 0 ? (
                                                    <img src={post.images[0]} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <span style={{ opacity: 0.3, fontSize: '24px' }}>🖼️</span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '40px', paddingBottom: '20px' }}>
                                <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} className="bw-btn bw-btn-neutral">이전</button>
                                <span style={{ fontSize: '15px', fontWeight: 700 }}>{currentPage} / {totalPages}</span>
                                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} className="bw-btn bw-btn-neutral">다음</button>
                            </div>
                        </div>
                    )}

                    {currentView === 'detail' && selectedPost && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <button onClick={() => setCurrentView('list')} className="bw-btn bw-btn-neutral">⬅️ 목록보기</button>
                                {currentUser && selectedPost.author && String(currentUser.id) === String(selectedPost.author.id) && (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => { setIsEditing(!isEditing); setEditTitle(selectedPost.title); setEditContent(selectedPost.content); setEditImagesBase64(selectedPost.images || []); }} className="bw-btn bw-btn-neutral" style={{ fontSize: '13px' }}>✏️ 수정</button>
                                        <button onClick={handleDeletePost} className="bw-btn" style={{ fontSize: '13px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>🗑️ 삭제</button>
                                    </div>
                                )}
                            </div>
                            {isEditing ? (
                                <div style={{ padding: '32px', borderRadius: '20px', backgroundColor: 'var(--bw-bg-card)', border: '1px solid var(--bw-border-color)', boxShadow: 'var(--bw-glass-shadow)' }}>
                                    <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px' }}>✏️ 게시글 수정</h3>
                                    <form onSubmit={handleEditPost} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="bw-input" style={{ width: '100%', padding: '14px', boxSizing: 'border-box' }} required />
                                        <textarea rows={12} value={editContent} onChange={(e) => setEditContent(e.target.value)} className="bw-input" style={{ width: '100%', padding: '16px', boxSizing: 'border-box', resize: 'vertical' }} required />
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>이미지 수정 (옵션 - 최대 10개, 개당 2MB 이하)</label>
                                            <input type="file" accept="image/*" multiple onChange={(e) => {
                                                const files = e.target.files;
                                                if (!files || files.length === 0) return;
                                                const fileArray = Array.from(files);
                                                if (editImagesBase64.length + fileArray.length > 10) {
                                                    alert('이미지는 최대 10개까지 업로드할 수 있습니다.');
                                                    e.target.value = '';
                                                    return;
                                                }
                                                const validFiles: File[] = [];
                                                for (const file of fileArray) {
                                                    if (file.size > 2 * 1024 * 1024) {
                                                        alert(`[${file.name}] 파일 크기가 2MB를 초과하여 제외되었습니다.`);
                                                    } else {
                                                        validFiles.push(file);
                                                    }
                                                }
                                                let loadedCount = 0;
                                                const tempBase64s: string[] = [];
                                                validFiles.forEach((file) => {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        tempBase64s.push(reader.result as string);
                                                        loadedCount++;
                                                        if (loadedCount === validFiles.length) {
                                                            setEditImagesBase64(prev => [...prev, ...tempBase64s]);
                                                            e.target.value = '';
                                                        }
                                                    };
                                                    reader.readAsDataURL(file);
                                                });
                                            }} className="bw-input" style={{ width: '100%', boxSizing: 'border-box' }} />
                                            {editImagesBase64 && editImagesBase64.length > 0 && (
                                                <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
                                                    {editImagesBase64.map((imgSrc, idx) => (
                                                        <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', border: '1px solid var(--bw-border-color)', overflow: 'hidden' }}>
                                                            <img src={imgSrc} alt={`Preview ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            <button 
                                                                type="button" 
                                                                onClick={() => setEditImagesBase64(prev => prev.filter((_, i) => i !== idx))} 
                                                                style={{ 
                                                                    position: 'absolute', 
                                                                    top: '2px', 
                                                                    right: '2px', 
                                                                    background: 'rgba(239, 68, 68, 0.9)', 
                                                                    color: 'white', 
                                                                    border: 'none', 
                                                                    borderRadius: '50%', 
                                                                    width: '18px', 
                                                                    height: '18px', 
                                                                    fontSize: '10px', 
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    padding: 0
                                                                }}
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                            <button type="button" onClick={() => { setIsEditing(false); setEditImagesBase64([]); }} className="bw-btn bw-btn-neutral">취소</button>
                                            <button type="submit" className="bw-btn bw-btn-primary">수정 완료</button>
                                        </div>
                                    </form>
                                </div>
                            ) : (
                            <div style={{ padding: '32px', borderRadius: '20px', backgroundColor: 'var(--bw-bg-card)', border: '1px solid var(--bw-border-color)', boxShadow: 'var(--bw-glass-shadow)' }}>
                                <div style={{ borderBottom: '1px solid var(--bw-border-color)', paddingBottom: '24px', marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                        <span style={{ padding: '6px 12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '8px', fontSize: '14px', fontWeight: 700 }}>{selectedPost.category}</span>
                                        <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>{selectedPost.title}</h1>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--bw-text-secondary)' }}>
                                        <div style={{ display: 'flex', gap: '16px' }}><span>👤 {selectedPost.author?.nickname || 'Unknown'}</span><span>🕒 {new Date(selectedPost.createdAt).toLocaleString()}</span></div>
                                        <div style={{ display: 'flex', gap: '16px' }}><span>👁️ {selectedPost.views}</span><span style={{ color: '#d97706', fontWeight: 'bold' }}>🔥 {selectedPost.hotScore.toFixed(1)}</span></div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '16px', lineHeight: 1.8, minHeight: '200px', whiteSpace: 'pre-wrap' }}>{selectedPost.content}</div>
                                {selectedPost.images && selectedPost.images.length > 0 && (
                                    <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                                        {selectedPost.images.map((imgSrc, idx) => (
                                            <img 
                                                key={idx} 
                                                src={imgSrc} 
                                                alt={`Post attachment ${idx + 1}`} 
                                                style={{ 
                                                    maxWidth: '100%', 
                                                    maxHeight: '600px', 
                                                    borderRadius: '12px', 
                                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                                    border: '1px solid var(--bw-border-color)',
                                                    objectFit: 'contain'
                                                }} 
                                            />
                                        ))}
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '40px', paddingTop: '32px', borderTop: '1px solid var(--bw-border-color)' }}>
                                    <button onClick={() => handleReaction('LIKE')} className="bw-btn bw-btn-neutral bw-reaction-btn" style={{ padding: '12px 24px', fontSize: '16px' }}>👍 {selectedPost.likeCount}</button>
                                    <button onClick={() => handleReaction('HEART')} className="bw-btn bw-btn-neutral bw-reaction-btn" style={{ padding: '12px 24px', fontSize: '16px' }}>❤️ {selectedPost.heartCount}</button>
                                    <button onClick={() => handleReaction('FUNNY')} className="bw-btn bw-btn-neutral bw-reaction-btn" style={{ padding: '12px 24px', fontSize: '16px' }}>😂 {selectedPost.funnyCount}</button>
                                    <button onClick={() => handleReaction('DISLIKE')} className="bw-btn bw-btn-neutral bw-reaction-btn" style={{ padding: '12px 24px', fontSize: '16px' }}>👎 {selectedPost.dislikeCount}</button>
                                </div>
                            </div>
                            )}
                            <div style={{ padding: '32px', borderRadius: '20px', backgroundColor: 'var(--bw-bg-card)', border: '1px solid var(--bw-border-color)' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '24px' }}>💬 댓글 ({comments.length})</h3>
                                <form onSubmit={(e) => handleCreateComment(e, null)} style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
                                    <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder={token ? "깨끗한 커뮤니티 문화를 위해 배려를 담아 댓글을 작성해 주세요." : "로그인 후 이용할 수 있습니다."} disabled={!token} className="bw-input" style={{ flex: 1 }} />
                                    <button type="submit" disabled={!token} className="bw-btn bw-btn-primary">등록</button>
                                </form>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {comments.filter(c => !c.parentId).map(comment => (
                                        <div key={comment.id} style={{ padding: '20px', border: '1px solid var(--bw-border-color)', borderRadius: '12px', backgroundColor: 'var(--bw-input-bg)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                <span style={{ fontWeight: 700, fontSize: '15px' }}>{comment.user?.nickname || 'Unknown'}</span>
                                                <span style={{ fontSize: '13px', color: 'var(--bw-text-secondary)' }}>{new Date(comment.createdAt).toLocaleString()}</span>
                                            </div>
                                            <p style={{ margin: '0 0 16px 0', fontSize: '15px', lineHeight: 1.6 }}>{comment.content}</p>
                                            {token && <button onClick={() => setActiveReplyCommentId(activeReplyCommentId === comment.id ? null : comment.id)} className="bw-btn bw-btn-neutral" style={{ padding: '6px 12px', fontSize: '12px' }}>답글 달기</button>}
                                            {activeReplyCommentId === comment.id && (
                                                <form onSubmit={(e) => handleCreateComment(e, comment.id)} style={{ display: 'flex', gap: '12px', marginTop: '16px', paddingLeft: '24px' }}>
                                                    <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="답글을 작성해 주세요." className="bw-input" style={{ flex: 1 }} />
                                                    <button type="submit" className="bw-btn bw-btn-primary">등록</button>
                                                </form>
                                            )}
                                            {comments.filter(r => r.parentId === comment.id).map(reply => (
                                                <div key={reply.id} style={{ marginLeft: '24px', marginTop: '16px', padding: '16px', borderLeft: '3px solid #3b82f6', backgroundColor: 'var(--bw-bg-card)', borderRadius: '0 12px 12px 0' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                        <span style={{ fontWeight: 700, fontSize: '14px', color: '#3b82f6' }}>↳ {reply.user?.nickname || 'Unknown'}</span>
                                                        <span style={{ fontSize: '12px', color: 'var(--bw-text-secondary)' }}>{new Date(reply.createdAt).toLocaleString()}</span>
                                                    </div>
                                                    <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6 }}>{reply.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {currentView === 'write' && (
                        <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', padding: '40px', borderRadius: '24px', backgroundColor: 'var(--bw-bg-card)', border: '1px solid var(--bw-border-color)', boxShadow: 'var(--bw-glass-shadow)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button onClick={() => setCurrentView('list')} className="bw-btn bw-btn-neutral" style={{ padding: '8px 16px' }}>⬅️ 이전으로</button>
                                    <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>✏️ 새 글 작성</h2>
                                </div>
                                <button onClick={() => { setCurrentView('list'); setWriteImagesBase64([]); }} className="bw-btn bw-btn-neutral">취소</button>
                            </div>
                            <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>카테고리 선택</label>
                                    <select value={writeCategory} onChange={(e) => setWriteCategory(e.target.value)} className="bw-input" style={{ width: '100%', padding: '14px' }}>
                                        {CATEGORIES.filter(c => c.id !== '' && c.id !== 'NOTICE').map(cat => (
                                            <option key={cat.id} value={cat.id}>{getTranslation(lang, cat.key as any)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>제목</label>
                                    <input type="text" value={writeTitle} onChange={(e) => setWriteTitle(e.target.value)} placeholder="멋진 제목을 입력해 주세요." required className="bw-input" style={{ width: '100%', padding: '14px', boxSizing: 'border-box' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>내용</label>
                                    <textarea rows={16} value={writeContent} onChange={(e) => setWriteContent(e.target.value)} placeholder="다양한 의견을 나누어 보세요!" required className="bw-input" style={{ width: '100%', padding: '16px', boxSizing: 'border-box', resize: 'vertical' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>이미지 첨부 (옵션 - 최대 10개, 개당 2MB 이하)</label>
                                    <input type="file" accept="image/*" multiple onChange={handleWriteImagesChange} className="bw-input" style={{ width: '100%', boxSizing: 'border-box' }} />
                                    {writeImagesBase64 && writeImagesBase64.length > 0 && (
                                        <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
                                            {writeImagesBase64.map((imgSrc, idx) => (
                                                <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', border: '1px solid var(--bw-border-color)', overflow: 'hidden' }}>
                                                    <img src={imgSrc} alt={`Preview ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleRemoveWriteImage(idx)} 
                                                        style={{ 
                                                            position: 'absolute', 
                                                            top: '2px', 
                                                            right: '2px', 
                                                            background: 'rgba(239, 68, 68, 0.9)', 
                                                            color: 'white', 
                                                            border: 'none', 
                                                            borderRadius: '50%', 
                                                            width: '18px', 
                                                            height: '18px', 
                                                            fontSize: '10px', 
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            padding: 0
                                                        }}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button type="submit" className="bw-btn bw-btn-primary" style={{ padding: '16px', fontSize: '16px', marginTop: '16px' }}>작성 완료 및 등록</button>
                            </form>
                        </div>
                    )}

                    {currentView === 'auth' && (
                        <div style={{ maxWidth: '440px', margin: '60px auto 0 auto', width: '100%' }}>
                            <button onClick={() => setCurrentView('list')} className="bw-btn bw-btn-neutral" style={{ marginBottom: '16px' }}>⬅️ 이전으로</button>
                            <div style={{ padding: '40px', borderRadius: '24px', backgroundColor: 'var(--bw-bg-card)', border: '1px solid var(--bw-border-color)', boxShadow: 'var(--bw-glass-shadow)' }}>
                                <h2 style={{ textAlign: 'center', fontSize: '24px', fontWeight: 800, marginBottom: '32px' }}>{getTranslation(lang, 'title')} 시작하기</h2>

                                <div className="bw-google-auth-wrapper" style={{ marginBottom: '24px' }}>
                                    <button onClick={handleMockGoogleLogin} className="bw-google-btn">
                                        <span style={{ fontSize: '20px' }}>G</span> {getTranslation(lang, 'googleLogin')}
                                    </button>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--bw-border-color)' }}></div>
                                    <span style={{ fontSize: '12px', color: 'var(--bw-text-secondary)' }}>OR</span>
                                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--bw-border-color)' }}></div>
                                </div>

                                <div style={{ display: 'flex', marginBottom: '24px', backgroundColor: 'var(--bw-input-bg)', borderRadius: '12px', padding: '4px' }}>
                                    <button onClick={() => { setAuthMode('login'); setAuthError(''); setConfirmPassword(''); setNicknameAvailable(null); setNicknameError(''); }} className="bw-btn" style={{ flex: 1, backgroundColor: authMode === 'login' ? 'var(--bw-bg-primary)' : 'transparent', color: authMode === 'login' ? 'var(--bw-text-primary)' : 'var(--bw-text-secondary)', boxShadow: authMode === 'login' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}>로그인</button>
                                    <button onClick={() => { setAuthMode('register'); setAuthError(''); setConfirmPassword(''); setNickname(''); setNicknameAvailable(null); setNicknameError(''); }} className="bw-btn" style={{ flex: 1, backgroundColor: authMode === 'register' ? 'var(--bw-bg-primary)' : 'transparent', color: authMode === 'register' ? 'var(--bw-text-primary)' : 'var(--bw-text-secondary)', boxShadow: authMode === 'register' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}>이메일 가입</button>
                                </div>

                                {authError && <div style={{ padding: '16px', marginBottom: '24px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '12px', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>{authError}</div>}

                                <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>이메일 주소</label>
                                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bw-input" style={{ width: '100%', boxSizing: 'border-box' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>비밀번호</label>
                                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bw-input" style={{ width: '100%', boxSizing: 'border-box' }} />
                                    </div>
                                    {authMode === 'register' && (
                                        <>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>비밀번호 확인</label>
                                            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="bw-input" style={{ width: '100%', boxSizing: 'border-box', borderColor: confirmPassword && password !== confirmPassword ? '#ef4444' : undefined }} />
                                            {confirmPassword && password !== confirmPassword && (
                                                <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', display: 'block' }}>비밀번호가 일치하지 않습니다.</span>
                                            )}
                                            {confirmPassword && password === confirmPassword && (
                                                <span style={{ fontSize: '12px', color: '#22c55e', marginTop: '4px', display: 'block' }}>✓ 비밀번호가 일치합니다.</span>
                                            )}
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>닉네임</label>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <input type="text" value={nickname} onChange={(e) => { setNickname(e.target.value); setNicknameAvailable(null); setNicknameError(''); }} required className="bw-input" style={{ flex: 1, boxSizing: 'border-box' }} />
                                                <button type="button" onClick={handleCheckNickname} disabled={nicknameChecking || !nickname.trim()} className="bw-btn bw-btn-neutral" style={{ whiteSpace: 'nowrap', padding: '10px 16px', fontSize: '13px' }}>
                                                    {nicknameChecking ? '확인중...' : '중복확인'}
                                                </button>
                                            </div>
                                            {nicknameAvailable === true && <span style={{ fontSize: '12px', color: '#22c55e', marginTop: '4px', display: 'block' }}>✓ 사용 가능한 닉네임입니다.</span>}
                                            {nicknameError && <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', display: 'block' }}>✗ {nicknameError}</span>}
                                        </div>
                                        </>
                                    )}
                                    <button type="submit" className="bw-btn bw-btn-primary" style={{ padding: '14px', marginTop: '16px' }}>
                                        {authMode === 'login' ? '로그인 완료' : '회원가입 완료'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
