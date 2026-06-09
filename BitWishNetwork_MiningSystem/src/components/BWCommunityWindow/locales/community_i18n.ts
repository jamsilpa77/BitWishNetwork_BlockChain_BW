export type Language = 'ko' | 'en' | 'ja' | 'zh';

// 커뮤니티 윈도우 내부에서만 독립적으로 작동하는 4개국어 번역 팩
export const translations = {
    ko: {
        title: 'BW 커뮤니티',
        write: '글쓰기',
        popular: '실시간 인기글',
        category: '카테고리',
        login: '로그인 / 가입',
        googleLogin: 'Google 계정으로 계속하기',
        cat_all: '전체',
        cat_notice: '📌 공지',
        cat_humor: '😂 유머',
        cat_info: '💡 정보',
        cat_free: '💬 자유',
        cat_question: '❓ 질문',
        cat_game: '🎮 게임',
        cat_anon: '🔒 익명',
    },
    en: {
        title: 'BW Community',
        write: 'Write',
        popular: 'Hot Posts',
        category: 'Category',
        login: 'Login / Sign Up',
        googleLogin: 'Continue with Google',
        cat_all: 'All',
        cat_notice: '📌 Notice',
        cat_humor: '😂 Humor',
        cat_info: '💡 Info',
        cat_free: '💬 Free',
        cat_question: '❓ Q&A',
        cat_game: '🎮 Game',
        cat_anon: '🔒 Anon',
    },
    ja: {
        title: 'BW コミュニティ',
        write: '書き込み',
        popular: '人気記事',
        category: 'カテゴリー',
        login: 'ログイン / 登録',
        googleLogin: 'Googleで続ける',
        cat_all: '全て',
        cat_notice: '📌 お知らせ',
        cat_humor: '😂 ユーモア',
        cat_info: '💡 情報',
        cat_free: '💬 フリートーク',
        cat_question: '❓ 質問',
        cat_game: '🎮 ゲーム',
        cat_anon: '🔒 匿名',
    },
    zh: {
        title: 'BW 社区',
        write: '发帖',
        popular: '热门帖子',
        category: '分类',
        login: '登录 / 注册',
        googleLogin: '使用Google账号继续',
        cat_all: '全部',
        cat_notice: '📌 公告',
        cat_humor: '😂 幽默',
        cat_info: '💡 资讯',
        cat_free: '💬 闲聊',
        cat_question: '❓ 问答',
        cat_game: '🎮 游戏',
        cat_anon: '🔒 匿名',
    }
};

export const getTranslation = (lang: Language, key: keyof typeof translations['ko']) => {
    return translations[lang][key] || translations['en'][key];
};
