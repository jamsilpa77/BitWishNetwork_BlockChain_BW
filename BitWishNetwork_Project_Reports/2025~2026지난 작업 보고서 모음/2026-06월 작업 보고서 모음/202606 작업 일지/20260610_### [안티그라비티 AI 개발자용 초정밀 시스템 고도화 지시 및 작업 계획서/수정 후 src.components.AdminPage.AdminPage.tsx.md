/**
 * BitWishNetwork 관리자 페이지
 * URL: /bitwish/testadmin
 * 
 * 기능:
 * 1. 마이닝 테스트 관리 (초기화)
 * 2. 추천 보너스 관리
 * 3. 가맹점 등록 관리
 * 4. KYC 신청 관리
 * 5. 반감기 정책 관리
 */

import React, { useState } from 'react';
import './AdminPage.css';
import KYCManager from './KYCManager';

const AdminPage: React.FC = () => {
    // --- [플랫폼 및 전광판 제어용 신규 상태 변수] ---
    const [tickerInputs, setTickerInputs] = useState({
        ko: '📢 [공지] BitWish Network에 오신 것을 환영합니다. 실시간 채굴 시스템이 가동 중입니다. 추후 코인 마이그레이션을 위해 KYC 승인을 받아주세요.',
        en: '📢 [Notice] Welcome to BitWish Network. Real-time mining is currently active. Please complete KYC verification for coin migration.',
        ja: '📢 [お知らせ] BitWish Networkへようこそ。リアルタイムマイニング가有効입니다. KYC認証를 완료해주세요.',
        zh: '📢 [公告] 欢迎来到 BitWish 网络。实时挖矿正在运行。请完成 KYC 验证以进行代币迁移。'
    });

    // --- [신규 삽입] 마우스 클릭형 이모지 입력 시스템 (상자 바깥에 배치) ---
    const [activeInput, setActiveInput] = useState<'ko' | 'en' | 'ja' | 'zh'>('ko');
    const handleInsertEmoji = (emoji: string) => {
        // 현재 브라우저 상에서 커서가 깜빡이며 초점이 맞춰진 입력창을 감지합니다.
        const activeElement = document.activeElement as HTMLInputElement;

        if (activeElement && activeElement.tagName === 'INPUT') {
            const start = activeElement.selectionStart || 0; // 커서 시작 위치
            const end = activeElement.selectionEnd || 0;     // 커서 끝 위치
            const currentValue = activeElement.value;

            // 커서 기준 앞부분텍스트 + 이모지 + 뒷부분텍스트를 정교하게 슬라이싱하여 조립합니다.
            const newValue = currentValue.substring(0, start) + emoji + currentValue.substring(end);

            setTickerInputs(prev => ({
                ...prev,
                [activeInput]: newValue
            }));

            // 데이터가 입력된 후 커서가 맨 뒤로 튕기는 현상을 방지하고, 이모지 바로 뒤에 깜빡이도록 강제 조정합니다.
            setTimeout(() => {
                activeElement.focus();
                const nextPosition = start + emoji.length;
                activeElement.setSelectionRange(nextPosition, nextPosition);
            }, 0);
        } else {
            // 혹시 커서 위치를 찾지 못할 경우의 대비책으로 맨 뒤에 이모지를 붙여넣습니다.
            setTickerInputs(prev => ({
                ...prev,
                [activeInput]: (prev as any)[activeInput] + emoji
            }));
        }
    };
    // --------------------------------------------------

    const [subAdmins] = useState([
        { email: 'admin@bitwish.network', nickname: '최고 관리자', grade: 'Super-Admin' },
        { email: 'sub_01@bitwish.network', nickname: '보안 담당자', grade: 'Sub-Admin' }
    ]);

    const [systemLogs, setSystemLogs] = useState([
        { action: '메인 전광판 메시지 수정 및 동기화', operator: '최고 관리자', time: '2026-06-06 21:05:40' },
        { action: '대시보드 시스템 초기 연결 성립', operator: 'System', time: '2026-06-06 12:00:00' }
    ]);

    const handleUpdateTicker = async () => {
        const currentLangKey = (localStorage.getItem('bw_lang') || 'ko') as 'ko' | 'en' | 'ja' | 'zh';
        const updatedText = tickerInputs[currentLangKey];

        localStorage.setItem('BW_TICKER_TEXT_LOCAL', JSON.stringify(tickerInputs));
        localStorage.setItem('BW_TICKER_UPDATE', Date.now().toString());

        setSystemLogs(prev => [
            { action: `[전광판 공지수정] ${updatedText}`, operator: '최고 관리자', time: new Date().toLocaleString() },
            ...prev
        ]);

        try {
            await fetch('/api/admin/system/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticker: tickerInputs })
            });
        } catch (e) {
            console.log('Backend server is offline, running on local storage fallback.');
        }

        alert('✅ 전광판 문구 수정을 완료했습니다. 홈페이지 창에서 글자가 실시간으로 바뀌었는지 확인해보세요.');
    };
    // ----------------------------------------------------

    const [activeTab, setActiveTab] = useState<string>('dashboard');
    // --- [다국어 확장] 로드맵 에디터 언어 선택 탭 ---
    const [roadmapEditorLang, setRoadmapEditorLang] = useState<'ko' | 'en' | 'ja' | 'zh'>('ko');

    // --- [다국어 확장] 로드맵 데이터 모델: {ko:{step1:{...},...}, en:{...}, ja:{...}, zh:{...}} ---
    const ROADMAP_DEFAULTS: Record<string, any> = {
        ko: {
            step1: { title: '1. 베타 테스트 공식 출시', date: '2026년 7월 1일 출시', desc: '2만명 회원 가입 유치 및 약 1년 동안의 메인넷 가동성 안정화를 목표로 한 시범 채굴장이 전격 가동됩니다.', tooltipTitle: 'BW High-Precision Perpetual Mining', tooltipSubtitle: '"50단위 부동소수점의 정밀함, BW 네트워크의 완벽한 보안을 구축합니다."', tooltipContent: 'BitWishNetwork는 기존 PoW의 한계를 넘어선 \'50단위 부동소수점 연산 기술\'을 도입했습니다. 이 고도화된 연산 체계는 단순한 해시 반복을 넘어, 매우 복잡하고 정밀한 데이터 검증을 수행함으로써 네트워크의 보안 수준을 비약적으로 높였습니다. 본 시스템은 이러한 고도의 연산 최적화를 위해 \'상시 가동(Always-On) 프로토콜\'로 운영됩니다. 정밀 연산의 흐름이 끊기지 않을 때 비로소 최고의 효율과 보안이 보장되기에, 마이닝 시작 후 중단 없는 안정적 네트워크 참여를 지원합니다. BW만의 정밀한 연산 생태계에서 진정한 가치 창출을 경험하십시오.' },
            step2: { title: '2. 폐쇄형 메인넷 시범 가동', date: '2027년 3~4분기 예정', desc: '외부 공격을 차단하고 초기 자산을 안전하게 보존하기 위한 격리형 제네시스 메인넷이 출범합니다.' },
            step3: { title: '3. 글로벌 인프라 파트너십 모집', date: '2027년 3분기 개시', desc: '오프라인 실생활 가맹점 및 디앱(DApp) 생태계 허브를 본격 구축합니다.' },
            step4: { title: '4. 1차 공식 기술 백서 공개', date: '2027년 3분기 발표 예정', desc: '50단위 고정밀 연산 암호 원리와 하이브리드 MongoDB의 독자적 데이터 저장 아키텍처에 대한 최종 개발 규격을 대중 및 학계에 정식으로 개시합니다.' },
            step5: { title: '5. 블록 반감기 적용 및 유통 정책 가이드', date: '2027년 4분기 시동', desc: '유통량의 급격한 팽창을 제한하고 인플레이션을 억제하기 위해 블록당 채굴 수량이 최초로 감소하는 반감 기법이 가동됩니다.' },
            step6: { title: '6. 2차 종합 백서 및 오픈 메인넷 공표', date: '2028년 2~3분기 예정', desc: '타 기종 블록체인 지갑과의 완벽한 크로스체인 전송 마이그레이션 기술 규격을 배포하여 글로벌 거래소 상장 및 탈중앙화 금융 시장으로의 완전 개방을 완성합니다.' }
        },
        en: {
            step1: { title: '1. Official Beta Test Launch', date: 'Release on July 1, 2026', desc: 'A pilot mining camp is fully activated with the goal of securing 20,000 registered users and stabilizing mainnet operations over a one-year testing period.', tooltipTitle: 'BW High-Precision Perpetual Mining', tooltipSubtitle: '"Precision of 50-digit floating-point arithmetic establishes perfect security for the BW Network."', tooltipContent: 'BitWishNetwork has introduced a "50-digit floating-point operation technology" that goes beyond the limits of existing PoW. This sophisticated computing structure goes beyond simple hash repetition to perform complex and precise data verification, thereby epochally enhancing network security. To optimize high-performance computation, the system is run with an "Always-On Protocol". Since maximum efficiency and security are guaranteed only when the flow of high-precision calculations is continuous, we support uninterrupted, stable network participation after mining initiates. Experience true value creation within BW\'s own precision computing ecosystem.' },
            step2: { title: '2. Enclosed Mainnet Trial Run', date: 'Scheduled for Q3-Q4 2027', desc: 'An isolated Genesis Mainnet launches to block external vectors and securely preserve early assets.' },
            step3: { title: '3. Global Infrastructure Partnerships', date: 'Starting Q3 2027', desc: 'Establishing brick-and-mortar payment merchants and DApp ecosystem hubs.' },
            step4: { title: '4. Release of Technical Whitepaper v1', date: 'Scheduled for Q3 2027', desc: 'Officially publishing technical standards on 50-digit precision arithmetic, encryption structures, and the hybrid MongoDB database storage layout.' },
            step5: { title: '5. Reward Halving & Distribution Guide', date: 'Launching Q4 2027', desc: 'Deploying the inaugural block reward deflation mechanism to curb hyperinflation.' },
            step6: { title: '6. Whitepaper v2 & Open Network Transition', date: 'Scheduled for Q2-Q3 2028', desc: 'Distributing final technical specs for cross-chain multi-signature wallets to complete public integration.' }
        },
        ja: {
            step1: { title: '1. ベータテスト公式ローンチ', date: '2026年7月1日 開始', desc: '会員2万人突破および約1年間のメインネット動作安定化を目指した試験的なマイニング場が本格始動します。', tooltipTitle: 'BW High-Precision Perpetual Mining', tooltipSubtitle: '「50桁浮動小数点演算の精度が、BWネットワークの完全なセキュリティを構築します」', tooltipContent: 'BitWishNetworkは、従来のPoWの限界を超えた「50桁浮動小数点演算技術」を導入しました。この高度な演算システムは、単純なハッシュ反復処理を超え、複雑かつ精密なデータ検証を実行することで、ネットワークのセキュリティレベルを飛躍的に向上させました。' },
            step2: { title: '2. クローズドメインネット試験運用', date: '2027年 第3〜4四半期 予定', desc: '外部攻撃を完全に遮断し、初期資産を保護するための隔離型メインネットを稼働します。' },
            step3: { title: '3. グローバル決済加盟店の誘致', date: '2027年 第3四半期 開始', desc: '実生活で決済可能な加盟店やDApp連携ハブを大幅に開拓します。' },
            step4: { title: '4. 第1次公式技術白書の公開', date: '2027年 第3四半期 発表予定', desc: '50桁高精度浮動小数点演算による暗号論理と、独自のハイブリッドMongoDB格納アルゴリズムの最終技術規約を公表します。' },
            step5: { title: '5. ブロック半減期の適用と流通政策声明', date: '2027年 第4四半期 始动', desc: '流通量の過剰な膨張を防ぎインフレを抑えるため、新規採掘量が初めて自動的に減少する最初の半減期システムを適用します。' },
            step6: { title: '6. 第2次総合白書およびオープンメインネット宣言', date: '2028年 第2〜3四半期 予定', desc: '異種チェーンとのシームレスなマルチチェーン資産移行プロトコルを提供します。' }
        },
        zh: {
            step1: { title: '1. 官方测试版隆重推出', date: '2026年7月1日 启动', desc: '试运行挖矿场将全面启动，目标是吸引2万名注册用户并实现主网系统的高可用与稳定性。', tooltipTitle: 'BW High-Precision Perpetual Mining', tooltipSubtitle: '"50位浮动小数点计算的精密性，构筑了BW网络完美的安全屏障。"', tooltipContent: 'BitWishNetwork引入了超越传统PoW局限性的"50位高精度浮动点数计算技术"。该先进计算架构超越了单一的哈希碰撞，通过进行极其复杂、精密的区块校验，大幅提高了底层网络的安全性。' },
            step2: { title: '2. 封闭式主网试运行', date: '预计 2027年 第3~4季度', desc: '为了拦截一切外部潜在风险并安全存储初始代币资产，我们将推出封闭式创世主网。' },
            step3: { title: '3. 开启全球基础设施合作招商', date: '2027年 第3季度 启动', desc: '致力于构建广泛的线下商户零售及DApp分布式应用网络。' },
            step4: { title: '4. 首次官方技术白皮书公开', date: '预计 2027年 第3季度', desc: '正式向全球开发者社区及研究机构发布50位高精度算法的安全计算框架。' },
            step5: { title: '5. 部署区块奖励半减机制及流向政策', date: '2027年 第4季度 启动', desc: '上线防范代币无序扩张与恶性通货膨胀的首期减半惩罚。' },
            step6: { title: '6. 编写第二次白皮书及全面开放主网', date: '预计 2028年 第2~3季度', desc: '公布异构区块链跨链多签钱包迁移的技术标准。' }
        }
    };

    const [roadmapForm, setRoadmapForm] = useState(() => {
        const saved = localStorage.getItem('BW_CUSTOM_ROADMAP');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // [구버전 호환] 플랫 구조(step1.title 직접 존재) → ko 하위로 자동 마이그레이션
                if (parsed.step1 && typeof parsed.step1.title === 'string') {
                    const migrated = { ko: parsed, en: ROADMAP_DEFAULTS['en'], ja: ROADMAP_DEFAULTS['ja'], zh: ROADMAP_DEFAULTS['zh'] };
                    localStorage.setItem('BW_CUSTOM_ROADMAP', JSON.stringify(migrated));
                    return migrated;
                }
                return parsed;
            } catch (e) { }
        }
        return { ...ROADMAP_DEFAULTS };
    });

    // 현재 선택된 에디터 언어의 step 데이터 접근 헬퍼
    const getEditorStep = (step: string) => {
        return (roadmapForm[roadmapEditorLang] && roadmapForm[roadmapEditorLang][step]) || ROADMAP_DEFAULTS[roadmapEditorLang][step] || {};
    };
    const updateEditorStep = (step: string, field: string, value: string) => {
        setRoadmapForm((prev: any) => ({
            ...prev,
            [roadmapEditorLang]: {
                ...prev[roadmapEditorLang],
                [step]: {
                    ...(prev[roadmapEditorLang]?.[step] || ROADMAP_DEFAULTS[roadmapEditorLang][step]),
                    [field]: value
                }
            }
        }));
    };

    const handleSaveRoadmap = () => {
        localStorage.setItem('BW_CUSTOM_ROADMAP', JSON.stringify(roadmapForm));
        alert('💾 [완료] 로드맵 변경사항이 성공적으로 저장되었습니다! 로드맵 페이지를 새로고침 해보세요.');
    };
    const [searchAddress, setSearchAddress] = useState<string>('');
    const [miningData, setMiningData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    // 출석 보너스 관련 state
    const [attendanceSearchAddress, setAttendanceSearchAddress] = useState<string>('');
    const [attendanceData, setAttendanceData] = useState<any>(null);
    const [attendanceLoading, setAttendanceLoading] = useState<boolean>(false);
    const [attendanceError, setAttendanceError] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

    // 추천 보너스 관련 state
    const [referralSearchAddress, setReferralSearchAddress] = useState<string>('');
    const [referralData, setReferralData] = useState<any>(null);
    const [referralLoading, setReferralLoading] = useState<boolean>(false);
    const [referralError, setReferralError] = useState<string>('');
    const [isSearchMode, setIsSearchMode] = useState<boolean>(false); // 검색 모드 상태 추가
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false); // [작업 1 개선] 새로고침 전용 로딩 상태 추가

    // [추천 보상 현황] 전용 state 추가
    const [rewardStatusDetail, setRewardStatusDetail] = useState<any>(null);
    const [totalRewardIssued, setTotalRewardIssued] = useState<number>(0);
    const [totalBonusRateSum, setTotalBonusRateSum] = useState<string>("0.00");
    const [rewardSearchAddress, setRewardSearchAddress] = useState<string>('');
    const [rewardLoading, setRewardLoading] = useState<boolean>(false);

    // 1. 추천 보상 전체 합계 조회
    const fetchTotalRewards = async () => {
        try {
            const response = await fetch('/api/admin/rewards/total');
            const data = await response.json();
            if (data.success) {
                setTotalRewardIssued(data.totalIssued);
                setTotalBonusRateSum(data.totalBonusRate); // [수리] 0.00% 원인 해결
            }
        } catch (err) {
            console.error('전체 보상 합계 조회 실패:', err);
        }
    };

    // 2. 추천 보상 개별 상세 조회
    const handleSearchRewardStatus = async () => {
        if (!rewardSearchAddress.trim()) {
            alert('지갑 주소를 입력하세요');
            return;
        }

        setRewardLoading(true);
        try {
            const response = await fetch(`/api/admin/rewards/detail/${rewardSearchAddress}`);
            const data = await response.json();
            if (data.success) {
                setRewardStatusDetail(data.data);
            } else {
                alert(data.message || '데이터를 찾을 수 없습니다');
                setRewardStatusDetail(null);
            }
        } catch (err) {
            console.error('상세 조회 실패:', err);
            alert('서버 연결 실패');
        } finally {
            setRewardLoading(false);
        }
    };

    // [작업 1 개정] 개별 데이터 기반 통합 실시간 엔진탑재
    const [realTimeTotal, setRealTimeTotal] = useState<number>(0);

    // 데이터가 로드될 때마다 기준점 합계 동기화
    React.useEffect(() => {
        if (referralData && referralData.monthlyTotal) {
            setRealTimeTotal(parseFloat(referralData.monthlyTotal));
        }
    }, [referralData]);

    // --- [어드민 페이지 전체 로그인 및 커뮤니티 토큰 상태] ---
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
        return sessionStorage.getItem('bw_admin_authenticated') === 'true';
    });
    const [adminEmail, setAdminEmail] = useState('salmani1@naver.com');
    const [adminPassword, setAdminPassword] = useState('');
    const [adminLoginError, setAdminLoginError] = useState('');

    const [communityToken, setCommunityToken] = useState<string | null>(() => localStorage.getItem('bw_community_access_token'));
    const [communityUser, setCommunityUser] = useState<any>(() => {
        const saved = localStorage.getItem('bw_community_user');
        return saved ? JSON.parse(saved) : null;
    });
    
    // 공지사항 CRUD 상태
    const [noticeList, setNoticeList] = useState<any[]>([]);
    const [noticePage, setNoticePage] = useState(1);
    const [noticeTotalPages, setNoticeTotalPages] = useState(1);
    const [noticeLoading, setNoticeLoading] = useState(false);
    
    const [noticeTitle, setNoticeTitle] = useState('');
    const [noticeContent, setNoticeContent] = useState('');
    const [noticeImageBase64, setNoticeImageBase64] = useState('');
    const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
    const [selectedNoticeIds, setSelectedNoticeIds] = useState<string[]>([]);
    
    // 금칙어 상태
    const [bannedWordsList, setBannedWordsList] = useState<any[]>([]);
    const [newBannedWord, setNewBannedWord] = useState('');
    const [bannedWordLoading, setBannedWordLoading] = useState(false);

    // 통합 어드민 로그인 핸들러 (커뮤니티 어드민 인증 연동)
    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdminLoginError('');

        if (adminEmail !== 'salmani1@naver.com' || adminPassword !== '@Love-1106@') {
            setAdminLoginError('접속 권한이 없거나 비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            const res = await fetch('/api/community/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: adminEmail, password: adminPassword })
            });
            const data = await res.json();
            if (data.tokens && data.user) {
                if (data.user.role !== 'ADMIN') {
                    setAdminLoginError('관리자 권한이 없는 계정입니다.');
                    return;
                }
                localStorage.setItem('bw_community_access_token', data.tokens.accessToken);
                localStorage.setItem('bw_community_user', JSON.stringify(data.user));
                setCommunityToken(data.tokens.accessToken);
                setCommunityUser(data.user);
                
                sessionStorage.setItem('bw_admin_authenticated', 'true');
                setIsAdminLoggedIn(true);
                setAdminPassword('');
            } else {
                setAdminLoginError(data.error || '로그인에 실패했습니다.');
            }
        } catch (err) {
            setAdminLoginError('서버 통신 오류가 발생했습니다.');
        }
    };

    // 통합 어드민 로그아웃 핸들러
    const handleAdminLogout = () => {
        localStorage.removeItem('bw_community_access_token');
        localStorage.removeItem('bw_community_user');
        sessionStorage.removeItem('bw_admin_authenticated');
        setCommunityToken(null);
        setCommunityUser(null);
        setIsAdminLoggedIn(false);
    };

    // 공지사항 패치
    const fetchAdminNotices = async (page = 1) => {
        if (!communityToken) return;
        setNoticeLoading(true);
        try {
            const res = await fetch(`/api/community/admin/notices?page=${page}`, {
                headers: { 'Authorization': `Bearer ${communityToken}` }
            });
            const data = await res.json();
            if (data.success && data.data) {
                setNoticeList(data.data.notices || []);
                setNoticeTotalPages(data.data.totalPages || 1);
                setNoticePage(data.data.currentPage || 1);
            }
        } catch (e) {
            console.error('공지 조회 실패:', e);
        } finally {
            setNoticeLoading(false);
        }
    };

    // 이미지 파일 Base64 변환 핸들러
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setNoticeImageBase64(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    // 공지사항 등록 / 수정 핸들러
    const handleSaveNotice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!communityToken || !communityUser) return;
        if (!noticeTitle.trim() || !noticeContent.trim()) {
            alert('제목과 내용을 모두 입력해 주세요.');
            return;
        }

        try {
            const isEdit = !!editingNoticeId;
            const url = isEdit ? `/api/community/admin/notices/${editingNoticeId}` : '/api/community/admin/notices';
            const method = isEdit ? 'PUT' : 'POST';
            
            const bodyData: any = {
                title: noticeTitle.trim(),
                content: noticeContent.trim(),
                image: noticeImageBase64,
            };
            if (!isEdit) {
                bodyData.authorId = communityUser.id;
            }

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${communityToken}`
                },
                body: JSON.stringify(bodyData)
            });
            const data = await res.json();
            if (data.success) {
                alert(isEdit ? '공지사항이 수정되었습니다.' : '공지사항이 등록되었습니다.');
                // 폼 리셋
                setNoticeTitle('');
                setNoticeContent('');
                setNoticeImageBase64('');
                setEditingNoticeId(null);
                fetchAdminNotices(noticePage);
            } else {
                alert(data.error || '공지 저장 실패');
            }
        } catch (err) {
            alert('서버 통신 실패');
        }
    };

    // 수정 대상 공지 선택 로드
    const handleEditSelectNotice = (notice: any) => {
        setEditingNoticeId(notice.id);
        setNoticeTitle(notice.title);
        setNoticeContent(notice.content);
        setNoticeImageBase64(notice.image || '');
    };

    // 공지사항 선택삭제 (일괄 삭제)
    const handleDeleteSelectedNotices = async () => {
        if (!communityToken || selectedNoticeIds.length === 0) return;
        if (!window.confirm(`선택한 ${selectedNoticeIds.length}개의 공지사항을 정말로 삭제하시겠습니까?`)) return;

        try {
            const res = await fetch('/api/community/admin/notices/delete-multiple', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${communityToken}`
                },
                body: JSON.stringify({ ids: selectedNoticeIds })
            });
            const data = await res.json();
            if (data.success) {
                alert('삭제되었습니다.');
                setSelectedNoticeIds([]);
                fetchAdminNotices(1);
            } else {
                alert(data.error || '삭제 실패');
            }
        } catch (err) {
            alert('서버 통신 실패');
        }
    };

    // 금칙어 패치
    const fetchBannedWordsList = async () => {
        if (!communityToken) return;
        setBannedWordLoading(true);
        try {
            const res = await fetch('/api/community/admin/banned-words', {
                headers: { 'Authorization': `Bearer ${communityToken}` }
            });
            const data = await res.json();
            if (data.success && data.data) {
                setBannedWordsList(data.data || []);
            }
        } catch (e) {
            console.error('금칙어 조회 실패:', e);
        } finally {
            setBannedWordLoading(false);
        }
    };

    // 금칙어 추가 핸들러
    const handleAddBannedWord = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!communityToken || !newBannedWord.trim()) return;

        try {
            const res = await fetch('/api/community/admin/banned-words', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${communityToken}`
                },
                body: JSON.stringify({ word: newBannedWord.trim() })
            });
            const data = await res.json();
            if (data.success) {
                setNewBannedWord('');
                fetchBannedWordsList();
            } else {
                alert(data.error || '금칙어 추가 실패');
            }
        } catch (err) {
            alert('서버 통신 실패');
        }
    };

    // 금칙어 개별 삭제
    const handleDeleteBannedWord = async (id: string) => {
        if (!communityToken) return;
        if (!window.confirm('정말 삭제하시겠습니까?')) return;

        try {
            const res = await fetch(`/api/community/admin/banned-words/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${communityToken}` }
            });
            const data = await res.json();
            if (data.success) {
                fetchBannedWordsList();
            } else {
                alert(data.error || '금칙어 삭제 실패');
            }
        } catch (err) {
            alert('서버 통신 실패');
        }
    };

    // 커뮤니티 탭 진입 시 데이터 자동 조회
    React.useEffect(() => {
        if (activeTab === 'communityAdmin' && communityToken) {
            fetchAdminNotices(1);
            fetchBannedWordsList();
        }
    }, [activeTab, communityToken]);

    React.useEffect(() => {
        const timer = setInterval(() => {
            setReferralData((prev: any) => {
                if (!prev || !prev.records) return prev;

                // 1. 개별 유저의 진짜 채굴량 실시간 가운팅
                const newRecords = prev.records.map((r: any) => {
                    if (r.isMining) {
                        const rate = parseFloat(r.currentTotalRate || '0.25');
                        const increment = rate / 3600;
                        return {
                            ...r,
                            dailyMiningAmount: (parseFloat(r.dailyMiningAmount) + increment).toFixed(8)
                        };
                    }
                    return r;
                });

                // 2. 가공된 개별 수치를 모두 더해 "전체 가입자 총 채굴량" 실시간 산출
                const newTotal = newRecords.reduce((sum: number, r: any) => {
                    return sum + parseFloat(r.dailyMiningAmount);
                }, 0);

                setRealTimeTotal(newTotal);

                return {
                    ...prev,
                    monthlyTotal: newTotal.toFixed(8),
                    records: newRecords
                };
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [referralData === null]);


    // 탭 변경 시 전체 통계 로딩 및 가입자 목록 조회 통합
    React.useEffect(() => {
        if (activeTab === 'rewardStatus') {
            fetchTotalRewards();
            if (!referralData) {
                fetchAllReferrals();
            }
        }
    }, [activeTab]);


    // 마이닝 데이터 검색
    const handleSearchMining = async () => {
        if (!searchAddress.trim()) {
            setError('지갑 주소를 입력하세요');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/admin/mining/${searchAddress}`);

            // 응답 상태 확인
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                setMiningData(data.data);
            } else {
                setError(data.message || '데이터를 찾을 수 없습니다');
                setMiningData(null);
            }
        } catch (err: any) {
            console.error('검색 오류:', err);
            setError(`서버 오류: ${err.message || '알 수 없는 오류'}`);
            setMiningData(null);
        } finally {
            setIsLoading(false);
        }
    };

    // 마이닝 초기화
    const handleResetMining = async () => {
        if (!searchAddress.trim()) {
            setError('지갑 주소를 입력하세요');
            return;
        }

        if (!window.confirm('정말로 이 지갑의 마이닝 데이터를 초기화하시겠습니까?\n\n초기화 후:\n- 누적 보상: 0 BW\n- 마이닝 상태: 중지\n- 추천 보너스 보관함: 0 BW\n- 월별 정산내역: 0 BW\n- 다시 마이닝 시작 시 0부터 새로 채굴')) {
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/admin/mining/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress: searchAddress })
            });

            const data = await response.json();

            if (data.success) {
                console.log(`[Admin] 초기화 신호 전송 준비: ${searchAddress}`);

                localStorage.setItem('BW_SYSTEM_RESET_TRIGGER', JSON.stringify({
                    type: 'RESET',
                    target: searchAddress,
                    timestamp: Date.now()
                }));

                alert('✅ 마이닝 데이터가 초기화되었습니다\n\n초기화된 데이터:\n- 누적 보상: 0 BW\n- 마이닝 상태: 중지\n- 추천 보너스 보관함: 0 BW\n- 월별 정산내역: 0 BW');

                await handleSearchMining();
            } else {
                setError(data.message || '초기화 실패');
            }
        } catch (err) {
            setError('서버 오류가 발생했습니다');
        } finally {
            setIsLoading(false);
        }
    };

    // 출석 보너스 데이터 검색
    const handleSearchAttendance = async () => {
        if (!attendanceSearchAddress.trim()) {
            setAttendanceError('지갑 주소를 입력하세요');
            return;
        }

        setAttendanceLoading(true);
        setAttendanceError('');

        try {
            const response = await fetch(`/api/admin/attendance/${attendanceSearchAddress}?year=${selectedYear}&month=${selectedMonth}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                setAttendanceData(data.data);
            } else {
                setAttendanceError(data.message || '데이터를 찾을 수 없습니다');
                setAttendanceData(null);
            }
        } catch (err: any) {
            console.error('출석 검색 오류:', err);
            setAttendanceError(`서버 오류: ${err.message || '알 수 없는 오류'}`);
            setAttendanceData(null);
        } finally {
            setAttendanceLoading(false);
        }
    };


    // 추천 보너스 데이터 검색 (개별 주소 검색 로직 고도화)
    const handleSearchReferral = async () => {
        if (!referralSearchAddress.trim()) {
            alert('지갑 주소를 입력하세요');
            return;
        }

        setReferralLoading(true);
        setReferralError('');

        try {
            const response = await fetch(`/api/admin/referral/${referralSearchAddress}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success && data.data && data.data.records) {
                const filtered = data.data.records.filter((r: any) =>
                    r.referrerAddress.toLowerCase() === referralSearchAddress.toLowerCase() ||
                    r.referredAddress.toLowerCase() === referralSearchAddress.toLowerCase()
                );

                setReferralData({
                    ...data.data,
                    records: filtered
                });
                setIsSearchMode(true);
            } else {
                setReferralError('데이터를 찾을 수 없습니다');
                setReferralData(null);
                setIsSearchMode(false);
            }
        } catch (err: any) {
            console.error('추천 검색 오류:', err);
            setReferralError('서버 연결 실패');
            setReferralData(null);
        } finally {
            setReferralLoading(false);
        }
    };

    // [작업 1 개선] 지능형 새로고침 함수 (검색 모드 유지 및 로딩 분리)
    const handleSmartRefresh = async () => {
        setIsRefreshing(true);
        try {
            if (isSearchMode && referralSearchAddress) {
                await handleSearchReferral(); // 검색 중이면 기존 검색 결과 최신화
            } else {
                await fetchAllReferrals(); // 전체 목록이면 전체 목록 최신화
            }
        } finally {
            setIsRefreshing(false);
        }
    };

    // 전체 추천 보너스 목록 조회 (초기 로딩용)
    const fetchAllReferrals = async () => {
        setReferralLoading(true);
        setReferralError('');

        try {
            const response = await fetch(`/api/admin/referral/all`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                setReferralData(data.data);
                setReferralSearchAddress(''); // 검색어 초기화
                setIsSearchMode(false); // 전체 목록 모드
            } else {
                setReferralError(data.message || '데이터를 찾을 수 없습니다');
            }
        } catch (err: any) {
            console.error('전체 목록 조회 오류:', err);
            setReferralError('서버 연결 실패');
        } finally {
            setReferralLoading(false);
        }
    };


    // 유틸리티 함수: 날짜 포맷팅 (년, 월, 일, 시, 분, 초)
    const formatDateTime = (isoString: string): string => {
        const date = new Date(isoString);
        return `${date.getFullYear()}년 ${(date.getMonth() + 1).toString().padStart(2, '0')}월 ${date.getDate().toString().padStart(2, '0')}일 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
    };

    // 유틸리티 함수: 짧은 형식 (소수점 4자리)
    const formatShort = (value: string | number): string => {
        return Number(value).toFixed(4);
    };

    // 유틸리티 함수: 정밀 형식 (소수점 8자리)
    const formatPrecise = (value: string | number): string => {
        return Number(value).toFixed(8);
    };

    // 유틸리티 함수: KYC 상태 텍스트
    const getKycStatusText = (status: string): string => {
        const statusMap: { [key: string]: string } = {
            'APPLIED': '신청',
            'NOT_APPLIED': '미신청',
            'REVIEWING': '심사중',
            'APPROVED': '승인',
            'REJECTED': '미승인',
            'PENDING': '보류'
        };
        return statusMap[status] || status || '알 수 없음';
    };

    // 로그인되지 않은 상태일 경우 로그인 UI 출력 (접속 아이디/비밀번호 차단막)
    if (!isAdminLoggedIn) {
        return (
            <div className="admin-login-overlay" style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                fontFamily: "'Inter', sans-serif",
                color: '#f8fafc',
                padding: '20px',
                boxSizing: 'border-box'
            }}>
                <div className="admin-login-card" style={{
                    width: '100%',
                    maxWidth: '420px',
                    background: 'rgba(30, 41, 59, 0.7)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '40px 30px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.5)',
                    boxSizing: 'border-box'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🛡️</span>
                        <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.025em' }}>BitWish 시스템 어드민</h2>
                        <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>최고 관리자 계정으로 로그인이 필요합니다.</p>
                    </div>
                    <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>이메일 아이디</label>
                            <input 
                                type="email" 
                                value={adminEmail} 
                                onChange={e => setAdminEmail(e.target.value)} 
                                required 
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    color: '#f8fafc',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    boxSizing: 'border-box'
                                }} 
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>비밀번호</label>
                            <input 
                                type="password" 
                                value={adminPassword} 
                                onChange={e => setAdminPassword(e.target.value)} 
                                required 
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    color: '#f8fafc',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    boxSizing: 'border-box'
                                }} 
                            />
                        </div>
                        {adminLoginError && (
                            <div style={{
                                color: '#f87171',
                                fontSize: '13px',
                                padding: '10px 12px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '6px'
                            }}>
                                ⚠️ {adminLoginError}
                            </div>
                        )}
                        <button 
                            type="submit" 
                            style={{
                                padding: '14px',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                                color: '#0f172a',
                                fontWeight: 'bold',
                                fontSize: '15px',
                                cursor: 'pointer',
                                transition: 'opacity 0.2s',
                                marginTop: '8px'
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                            로그인 완료
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            {/* 헤더 */}
            <header className="admin-header">
                <div className="admin-header-content">
                    <h1 className="admin-title">
                        <span className="admin-icon">⚙️</span>
                        BitWish Network 관리자 페이지
                    </h1>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="logout-button" onClick={() => window.location.href = '/'}>
                            🏠 홈으로
                        </button>
                        <button className="logout-button" style={{ backgroundColor: '#ef4444' }} onClick={handleAdminLogout}>
                            🔒 로그아웃
                        </button>
                    </div>
                </div>
            </header>

            {/* 탭 네비게이션 */}
            <nav className="admin-tabs">
                <div className="admin-tab-dropdown-wrapper">
                    <button
                        className={`admin-tab ${activeTab === 'dashboard' || activeTab === 'roadmapMgmt' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        📊 대시보드 ▾
                    </button>
                    <div className="admin-dropdown-menu">
                        <button onClick={() => setActiveTab('dashboard')}>대시보드 홈</button>
                        <button onClick={() => setActiveTab('roadmapMgmt')}>🗺️ 로드맵 관리</button>
                    </div>
                </div>
                <button
                    className={`admin-tab ${activeTab === 'mining' ? 'active' : ''}`}
                    onClick={() => setActiveTab('mining')}
                >
                    🧪 마이닝 테스트
                </button>
                <button
                    className={`admin-tab ${activeTab === 'attendance' ? 'active' : ''}`}
                    onClick={() => setActiveTab('attendance')}
                >
                    📅 출석 보너스
                </button>
                <button
                    className={`admin-tab ${activeTab === 'rewardStatus' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rewardStatus')}
                >
                    💰 추천 보상 현황
                </button>
                <button
                    className={`admin-tab ${activeTab === 'communityAdmin' ? 'active' : ''}`}
                    onClick={() => setActiveTab('communityAdmin')}
                >
                    💬 BW 커뮤니티 관리
                </button>
                <div className="admin-tab-dropdown-wrapper">
                    <button
                        className={`admin-tab ${activeTab === 'kyc' || activeTab === 'halving' || activeTab === 'partner' ? 'active' : ''}`}
                        onClick={() => setActiveTab('kyc')}
                    >
                        🆔 KYC 관리 ▾
                    </button>
                    <div className="admin-dropdown-menu">
                        <button onClick={() => setActiveTab('kyc')}>KYC 신청 목록</button>
                        <button onClick={() => setActiveTab('partner')}>🏪 가맹점 관리</button>
                        <button onClick={() => setActiveTab('halving')}>⏰ 반감기 관리</button>
                    </div>
                </div>
            </nav>

            {/* 메인 콘텐츠 */}
            <main className="admin-main">
                {activeTab === 'roadmapMgmt' && (
                    <div className="admin-panel animate-fade-in">
                        <h2>🗺️ 로드맵 텍스트 관리도구 (실시간 연동형)</h2>
                        <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '-10px 0 25px 0' }}>
                            여기에 적은 각 단계의 텍스트가 사용자용 'BW 로드맵' 멀티윈도우 창에 완전 실시간으로 교체 반영됩니다.
                        </p>

                        {/* [다국어 확장] 언어 선택 탭 */}
                        <div className="roadmap-lang-tabs">
                            {([
                                { key: 'ko', label: '🇰🇷 한국어' },
                                { key: 'en', label: '🇺🇸 English' },
                                { key: 'ja', label: '🇯🇵 日本語' },
                                { key: 'zh', label: '🇨🇳 中文' }
                            ] as { key: 'ko' | 'en' | 'ja' | 'zh'; label: string }[]).map(tab => (
                                <button
                                    key={tab.key}
                                    className={`roadmap-lang-tab-btn ${roadmapEditorLang === tab.key ? 'active' : ''}`}
                                    onClick={() => setRoadmapEditorLang(tab.key)}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="roadmap-editor-container">
                            {/* Step 1 */}
                            <div className="roadmap-editor-card">
                                <h3>Milestone 1단계 설정 (출석 연계 및 호버 툴팁)</h3>
                                <div className="editor-field-group">
                                    <div className="editor-single-field">
                                        <label>1단계 제목</label>
                                        <input type="text" value={getEditorStep('step1').title || ''} onChange={e => updateEditorStep('step1', 'title', e.target.value)} />
                                    </div>
                                    <div className="editor-single-field">
                                        <label>1단계 날짜</label>
                                        <input type="text" value={getEditorStep('step1').date || ''} onChange={e => updateEditorStep('step1', 'date', e.target.value)} />
                                    </div>
                                </div>
                                <div className="editor-single-field" style={{ marginBottom: '15px' }}>
                                    <label>1단계 세부요약 설명</label>
                                    <textarea rows={2} value={getEditorStep('step1').desc || ''} onChange={e => updateEditorStep('step1', 'desc', e.target.value)} />
                                </div>
                                <div className="editor-field-group" style={{ background: '#f1f5f9', padding: '15px', borderRadius: '8px' }}>
                                    <div className="editor-single-field">
                                        <label>💡 툴팁 내부 메인제목</label>
                                        <input type="text" value={getEditorStep('step1').tooltipTitle || ''} onChange={e => updateEditorStep('step1', 'tooltipTitle', e.target.value)} />
                                    </div>
                                    <div className="editor-single-field">
                                        <label>💡 툴팁 한줄 요약 문구</label>
                                        <input type="text" value={getEditorStep('step1').tooltipSubtitle || ''} onChange={e => updateEditorStep('step1', 'tooltipSubtitle', e.target.value)} />
                                    </div>
                                </div>
                                <div className="editor-single-field" style={{ background: '#f1f5f9', padding: '0 15px 15px 15px', borderRadius: '0 0 8px 8px' }}>
                                    <label>💡 툴팁 내부 세부 연산 본문 내용</label>
                                    <textarea rows={4} value={getEditorStep('step1').tooltipContent || ''} onChange={e => updateEditorStep('step1', 'tooltipContent', e.target.value)} />
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="roadmap-editor-card">
                                <h3>Milestone 2단계 설정 (폐쇄형 메인넷)</h3>
                                <div className="editor-field-group">
                                    <div className="editor-single-field">
                                        <label>2단계 제목</label>
                                        <input type="text" value={getEditorStep('step2').title || ''} onChange={e => updateEditorStep('step2', 'title', e.target.value)} />
                                    </div>
                                    <div className="editor-single-field">
                                        <label>2단계 날짜</label>
                                        <input type="text" value={getEditorStep('step2').date || ''} onChange={e => updateEditorStep('step2', 'date', e.target.value)} />
                                    </div>
                                </div>
                                <div className="editor-single-field">
                                    <label>2단계 세부요약 설명</label>
                                    <textarea rows={2} value={getEditorStep('step2').desc || ''} onChange={e => updateEditorStep('step2', 'desc', e.target.value)} />
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="roadmap-editor-card">
                                <h3>Milestone 3단계 설정 (글로벌 파트너십)</h3>
                                <div className="editor-field-group">
                                    <div className="editor-single-field">
                                        <label>3단계 제목</label>
                                        <input type="text" value={getEditorStep('step3').title || ''} onChange={e => updateEditorStep('step3', 'title', e.target.value)} />
                                    </div>
                                    <div className="editor-single-field">
                                        <label>3단계 날짜</label>
                                        <input type="text" value={getEditorStep('step3').date || ''} onChange={e => updateEditorStep('step3', 'date', e.target.value)} />
                                    </div>
                                </div>
                                <div className="editor-single-field">
                                    <label>3단계 세부요약 설명</label>
                                    <textarea rows={2} value={getEditorStep('step3').desc || ''} onChange={e => updateEditorStep('step3', 'desc', e.target.value)} />
                                </div>
                            </div>

                            {/* Step 4 */}
                            <div className="roadmap-editor-card">
                                <h3>Milestone 4단계 설정 (1차 백서)</h3>
                                <div className="editor-field-group">
                                    <div className="editor-single-field">
                                        <label>4단계 제목</label>
                                        <input type="text" value={getEditorStep('step4').title || ''} onChange={e => updateEditorStep('step4', 'title', e.target.value)} />
                                    </div>
                                    <div className="editor-single-field">
                                        <label>4단계 날짜</label>
                                        <input type="text" value={getEditorStep('step4').date || ''} onChange={e => updateEditorStep('step4', 'date', e.target.value)} />
                                    </div>
                                </div>
                                <div className="editor-single-field">
                                    <label>4단계 세부요약 설명</label>
                                    <textarea rows={2} value={getEditorStep('step4').desc || ''} onChange={e => updateEditorStep('step4', 'desc', e.target.value)} />
                                </div>
                            </div>

                            {/* Step 5 */}
                            <div className="roadmap-editor-card">
                                <h3>Milestone 5단계 설정 (블록 반감기)</h3>
                                <div className="editor-field-group">
                                    <div className="editor-single-field">
                                        <label>5단계 제목</label>
                                        <input type="text" value={getEditorStep('step5').title || ''} onChange={e => updateEditorStep('step5', 'title', e.target.value)} />
                                    </div>
                                    <div className="editor-single-field">
                                        <label>5단계 날짜</label>
                                        <input type="text" value={getEditorStep('step5').date || ''} onChange={e => updateEditorStep('step5', 'date', e.target.value)} />
                                    </div>
                                </div>
                                <div className="editor-single-field">
                                    <label>5단계 세부요약 설명</label>
                                    <textarea rows={2} value={getEditorStep('step5').desc || ''} onChange={e => updateEditorStep('step5', 'desc', e.target.value)} />
                                </div>
                            </div>

                            {/* Step 6 */}
                            <div className="roadmap-editor-card">
                                <h3>Milestone 6단계 설정 (2차 최종백서)</h3>
                                <div className="editor-field-group">
                                    <div className="editor-single-field">
                                        <label>6단계 제목</label>
                                        <input type="text" value={getEditorStep('step6').title || ''} onChange={e => updateEditorStep('step6', 'title', e.target.value)} />
                                    </div>
                                    <div className="editor-single-field">
                                        <label>6단계 날짜</label>
                                        <input type="text" value={getEditorStep('step6').date || ''} onChange={e => updateEditorStep('step6', 'date', e.target.value)} />
                                    </div>
                                </div>
                                <div className="editor-single-field">
                                    <label>6단계 세부요약 설명</label>
                                    <textarea rows={2} value={getEditorStep('step6').desc || ''} onChange={e => updateEditorStep('step6', 'desc', e.target.value)} />
                                </div>
                            </div>

                            <button className="admin-button primary" onClick={handleSaveRoadmap} style={{ padding: '15px', fontSize: '1.1rem', fontWeight: 'bold' }}>
                                💾 작성 완료 및 전체 로드맵 실시간 저장 적용하기
                            </button>
                        </div>
                    </div>
                )}
                {activeTab === 'dashboard' && (
                    <div className="admin-panel animate-fade-in">
                        <h2>📊 대시보드</h2>
                        <div className="dashboard-grid">
                            <div className="dashboard-card">
                                <div className="card-value">1,234</div>
                                <div className="card-label">총 사용자</div>
                            </div>
                            <div className="dashboard-card">
                                <div className="card-value">987</div>
                                <div className="card-label">활성 마이너</div>
                            </div>
                            <div className="dashboard-card">
                                <div className="card-value">12,345,678 BW</div>
                                <div className="card-label">총 발행량</div>
                            </div>
                            <div className="dashboard-card">
                                <div className="card-value">15</div>
                                <div className="card-label">대기 중인 KYC</div>
                            </div>
                        </div>

                        {/* =======================================================
                           [신규 삽입] 최고 관리자를 위한 제어 및 로그 시스템 UI판 
                           ======================================================= */}
                        <div className="admin-system-container">
                            <h3 className="admin-system-title">⚙️ 플랫폼 제어 및 관리자 시스템 (Admin Controls)</h3>

                            <div className="admin-system-grid">
                                {/* 1. 홈페이지 메시지 원격 수정 입력란 */}
                                <div className="admin-system-card">
                                    <h4>📢 실시간 흐르는 전광판 메시지 제어</h4>
                                    {/* --- [신규 이식] 원클릭 이모지 빠른 선택 바 --- */}
                                    <div style={{ display: 'flex', gap: '6px', marginBottom: '15px', flexWrap: 'wrap', background: '#f1f5f9', padding: '10px', borderRadius: '8px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                                            {activeInput === 'ko' ? '🇰🇷 한국어 칸 입력중' : activeInput === 'en' ? '🇺🇸 English 입력중' : activeInput === 'ja' ? '🇯🇵 日本語 입력중' : '🇨🇳 中文 입력중'} (원클릭 입력):
                                        </span>
                                        {['📢', '🔥', '🚀', '💎', '🏆', '💰', '⚠️', '⭐', '🎁', '🔔', '🟢', '🔴', '⚡'].map(emoji => (
                                            <button
                                                key={emoji}
                                                type="button"
                                                onClick={() => handleInsertEmoji(emoji)}
                                                style={{ padding: '4px 8px', fontSize: '1.2rem', background: '#fff', border: '1px solid #cbd5e1', cursor: 'pointer', borderRadius: '4px', transition: 'transform 0.1s' }}
                                                onMouseDown={e => e.preventDefault()} // 마우스 클릭 시 입력창 커서가 풀리는 현상 방지
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="ticker-form">
                                        <div className="form-group" style={{ marginBottom: '10px' }}>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#666' }}>🇰🇷 한국어 공지 문구</label>
                                            <input type="text" className="admin-input" style={{ width: '100%', marginTop: '5px' }} value={tickerInputs.ko} onChange={e => setTickerInputs({ ...tickerInputs, ko: e.target.value })} onFocus={() => setActiveInput('ko')} />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: '10px' }}>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#666' }}>🇺🇸 English Notice</label>
                                            <input type="text" className="admin-input" style={{ width: '100%', marginTop: '5px' }} value={tickerInputs.en} onChange={e => setTickerInputs({ ...tickerInputs, en: e.target.value })} onFocus={() => setActiveInput('en')} />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: '10px' }}>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#666' }}>🇯🇵 日本語 お知らせ</label>
                                            <input type="text" className="admin-input" style={{ width: '100%', marginTop: '5px' }} value={tickerInputs.ja} onChange={e => setTickerInputs({ ...tickerInputs, ja: e.target.value })} onFocus={() => setActiveInput('ja')} />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: '15px' }}>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#666' }}>🇨🇳 中文 公告</label>
                                            <input type="text" className="admin-input" style={{ width: '100%', marginTop: '5px' }} value={tickerInputs.zh} onChange={e => setTickerInputs({ ...tickerInputs, zh: e.target.value })} onFocus={() => setActiveInput('zh')} />
                                        </div>
                                        <button className="admin-button primary" onClick={handleUpdateTicker} style={{ width: '100%', padding: '12px', fontWeight: 'bold' }}>
                                            💾 입력한 전광판 공지 실시간 일괄 업데이트 적용
                                        </button>
                                    </div>
                                </div>

                                {/* 2. 부관리자 권한 계정 승인 관리 테이블 */}
                                <div className="admin-system-card">
                                    <h4>👥 어드민 권한 부여 계정 관리</h4>
                                    <table className="admin-system-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                                        <thead>
                                            <tr style={{ background: '#f1f5f9' }}>
                                                <th style={{ padding: '8px', textAlign: 'left' }}>어드민 계정</th>
                                                <th style={{ padding: '8px', textAlign: 'left' }}>별칭</th>
                                                <th style={{ padding: '8px', textAlign: 'left' }}>권한 등급</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {subAdmins.map((adm, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                    <td style={{ padding: '10px 8px', fontFamily: 'monospace' }}>{adm.email}</td>
                                                    <td style={{ padding: '10px 8px' }}>{adm.nickname}</td>
                                                    <td style={{ padding: '10px 8px' }}>
                                                        <span style={{
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            fontSize: '11px',
                                                            fontWeight: 'bold',
                                                            background: adm.grade === 'Super-Admin' ? '#fee2e2' : '#e0f2fe',
                                                            color: adm.grade === 'Super-Admin' ? '#ef4444' : '#0284c7'
                                                        }}>
                                                            {adm.grade}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                                        <input type="text" className="admin-input" placeholder="어드민으로 등록할 이메일 주소 입력" style={{ flex: 1 }} />
                                        <button className="admin-button primary" style={{ padding: '10px 20px' }}>임명하기</button>
                                    </div>
                                </div>
                            </div>

                            {/* 3. 보안 행위 이력 로그 콘솔 */}
                            <div className="admin-system-card" style={{ marginTop: '20px' }}>
                                <h4>📜 실시간 시스템 보안 로그 (System Timeline Logs)</h4>
                                <div className="admin-log-console" style={{
                                    background: '#0f172a',
                                    color: '#38bdf8',
                                    fontFamily: 'monospace',
                                    padding: '15px',
                                    borderRadius: '8px',
                                    maxHeight: '130px',
                                    overflowY: 'auto',
                                    fontSize: '13px'
                                }}>
                                    {systemLogs.map((log, idx) => (
                                        <div key={idx} style={{ marginBottom: '6px' }}>
                                            <span style={{ color: '#64748b' }}>[{log.time}]</span>{' '}
                                            <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{log.operator}</span> :{' '}
                                            <span>{log.action}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {activeTab === 'mining' && (
                    <div className="admin-panel">
                        <h2>🧪 마이닝 테스트 관리</h2>
                        <div className="test-section">
                            <p className="warning-text">⚠️ 테스트 목적으로만 사용하세요</p>

                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="지갑 주소 입력"
                                    className="admin-input"
                                    value={searchAddress}
                                    onChange={(e) => setSearchAddress(e.target.value)}
                                    disabled={isLoading}
                                />
                                <button
                                    className="admin-button primary"
                                    onClick={handleSearchMining}
                                    disabled={isLoading}
                                >
                                    {isLoading ? '검색 중...' : '검색'}
                                </button>
                            </div>

                            {error && (
                                <div className="error-message">{error}</div>
                            )}

                            {/* 검색 실행 후 결과 표시 영역 */}
                            {(miningData || (!isLoading && searchAddress && !miningData && !error)) && (
                                <div className="mining-data-box">
                                    {miningData ? (
                                        <>
                                            <h3>✅ 마이닝 정보</h3>
                                            <div className="data-grid">
                                                <div className="data-item">
                                                    <span className="data-label">지갑 주소:</span>
                                                    <span className="data-value">{miningData.walletAddress}</span>
                                                </div>
                                                <div className="data-item">
                                                    <span className="data-label">마이닝 상태:</span>
                                                    <span className={`data-value ${miningData.isMining ? 'active' : 'inactive'}`}>
                                                        {miningData.isMining ? '🟢 진행 중' : '🔴 중지'}
                                                    </span>
                                                </div>
                                                <div className="data-item">
                                                    <span className="data-label">누적 보상:</span>
                                                    <span className="data-value">{miningData.accumulatedReward} BW</span>
                                                </div>
                                                <div className="data-item">
                                                    <span className="data-label">마이닝 시작 시간:</span>
                                                    <span className="data-value">
                                                        {miningData.miningStartTime
                                                            ? new Date(miningData.miningStartTime).toLocaleString('ko-KR')
                                                            : '-'
                                                        }
                                                    </span>
                                                </div>
                                                <div className="data-item">
                                                    <span className="data-label">마지막 동기화:</span>
                                                    <span className="data-value">
                                                        {new Date(miningData.lastSyncTime).toLocaleString('ko-KR')}
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="no-data-message">
                                            <p className="no-data-icon">📭</p>
                                            <p className="no-data-text">마이닝 기록이 없습니다</p>
                                            <p className="no-data-hint">
                                                이 지갑은 아직 마이닝을 시작하지 않았거나,<br />
                                                이전에 초기화된 상태입니다.
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        className="admin-button danger"
                                        onClick={handleResetMining}
                                        disabled={isLoading}
                                    >
                                        {miningData
                                            ? '⚠️ 마이닝 데이터 초기화'
                                            : '🔄 초기 상태로 설정'
                                        }
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div className="admin-panel">
                        <h2>📅 출석 보너스 관리</h2>
                        <div className="test-section">
                            <p className="warning-text">⚠️ 출석 보너스 현황 조회</p>

                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="지갑 주소 입력"
                                    className="admin-input"
                                    value={attendanceSearchAddress}
                                    onChange={(e) => setAttendanceSearchAddress(e.target.value)}
                                    disabled={attendanceLoading}
                                />
                                <div className="date-selectors">
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        className="admin-select"
                                    >
                                        <option value={2024}>2024년</option>
                                        <option value={2025}>2025년</option>
                                        <option value={2026}>2026년</option>
                                    </select>
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                        className="admin-select"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                            <option key={m} value={m}>{m}월</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    className="admin-button primary"
                                    onClick={handleSearchAttendance}
                                    disabled={attendanceLoading}
                                >
                                    {attendanceLoading ? '검색 중...' : '월별 검색'}
                                </button>
                            </div>

                            {attendanceError && (
                                <div className="error-message">{attendanceError}</div>
                            )}

                            {attendanceData && (
                                <div className="attendance-result-box">
                                    <h3>✅ {selectedMonth}월 출석 현황</h3>
                                    <div className="attendance-summary">
                                        <div className="summary-item">
                                            <span className="summary-label">오늘 출석 상태:</span>
                                            <span className={`summary-value ${attendanceData.isActive ? 'active' : 'inactive'}`}>
                                                {attendanceData.isActive ? '🟢 ON' : '🔴 OFF'}
                                            </span>
                                        </div>
                                    </div>

                                    {attendanceData.records && attendanceData.records.length > 0 ? (
                                        <div className="attendance-table-container">
                                            <h4>{selectedMonth}월 출석 이력</h4>
                                            <table className="attendance-table">
                                                <thead>
                                                    <tr>
                                                        <th>일시 (시작 ~ 종료)</th>
                                                        <th>5% 채굴 BW 수량</th>
                                                        <th>상태</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {attendanceData.records.map((record: any, index: number) => (
                                                        <tr key={index}>
                                                            <td className="date-cell">{record.fullDate}</td>
                                                            <td>{record.bonusAmount} BW</td>
                                                            <td>
                                                                {record.status === 'RUNNING' ? (
                                                                    <span className="status-running">🔥 진행 중</span>
                                                                ) : (
                                                                    <span className={record.isActive ? 'status-on' : 'status-off'}>
                                                                        {record.isActive ? '✅ 완료' : '❌ 미완료'}
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="total-row">
                                                        <td><strong>{selectedMonth}월 총 합산 금액</strong></td>
                                                        <td colSpan={2} className="total-amount">
                                                            <strong>{attendanceData.totalBonus} BW</strong>
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="no-data-message">
                                            <p className="no-data-icon">📭</p>
                                            <p className="no-data-text">{selectedMonth}월 출석 기록이 없습니다</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'rewardStatus' && (
                    <div className="admin-panel animate-fade-in">
                        <h2>💎 보상 현황 상태</h2>

                        <div className="test-section">
                            <h3>추천 보상 전체 지급 상태</h3>

                            <div className="summary-split-container">
                                <div className="total-summary-card reward-card">
                                    <span className="total-label">전체 지급 보상</span>
                                    <span className="total-value">{formatPrecise(totalRewardIssued)} BW</span>
                                </div>
                                <div className="total-summary-card bonus-card">
                                    <span className="total-label">전체 지급 보너스</span>
                                    <span className="total-value" style={{ color: '#a855f7' }}>
                                        {totalBonusRateSum} %
                                    </span>
                                </div>
                            </div>

                            <div className="search-box" style={{ marginTop: '30px' }}>
                                <input
                                    type="text"
                                    placeholder="검색할 지갑 주소 입력"
                                    className="admin-input"
                                    value={rewardSearchAddress}
                                    onChange={(e) => setRewardSearchAddress(e.target.value)}
                                />
                                <button
                                    className="admin-button primary"
                                    onClick={handleSearchRewardStatus}
                                    disabled={rewardLoading}
                                >
                                    {rewardLoading ? '검색 중...' : '지갑 검색'}
                                </button>
                            </div>

                            {rewardStatusDetail && (
                                <div className="reward-detail-container" style={{ marginTop: '30px' }}>
                                    <h4>👤 개별 보상 상세 정보</h4>
                                    <div className="data-grid">
                                        <div className="data-item">
                                            <span className="data-label">지갑 주소:</span>
                                            <span className="data-value">{rewardStatusDetail.walletAddress}</span>
                                        </div>
                                        <div className="data-item">
                                            <span className="data-label">본인 추천 코드:</span>
                                            <span className="data-value">{rewardStatusDetail.myReferralCode}</span>
                                        </div>
                                        <div className="data-item">
                                            <span className="data-label">가입 날짜:</span>
                                            <span className="data-value">{formatDateTime(rewardStatusDetail.joinDate)}</span>
                                        </div>
                                        <div className="data-item">
                                            <span className="data-label">총 받은 보상:</span>
                                            <span className="data-value" style={{ color: '#ffd700', fontWeight: 'bold' }}>
                                                {formatPrecise(rewardStatusDetail.totalReward)} BW
                                            </span>
                                        </div>
                                        <div className="data-item">
                                            <span className="data-label">본인 코드로 가입한 가입자 수:</span>
                                            <span className="data-value">{rewardStatusDetail.referralCount}명</span>
                                        </div>
                                    </div>

                                    <div className="referral-list-section" style={{ marginTop: '40px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                            <h4 style={{ margin: 0 }}>👥 내 코드로 가입된 가입자 목록</h4>
                                            <div style={{ display: 'flex', gap: '15px', fontSize: '0.95rem', fontWeight: 'bold' }}>
                                                <span style={{ color: '#f59e0b' }}>전체 보상 ({parseFloat(rewardStatusDetail.totalReward || "0").toFixed(2)} BW)</span>
                                                <span style={{ color: '#a855f7' }}>전체 보너스 ({rewardStatusDetail.totalBonusRate || "0.00"} %)</span>
                                            </div>
                                        </div>

                                        {rewardStatusDetail.referralList && rewardStatusDetail.referralList.length > 0 ? (
                                            <table className="attendance-table">
                                                <thead>
                                                    <tr>
                                                        <th>가입자 지갑 주소</th>
                                                        <th>가입 날짜</th>
                                                        <th>보상 지급 상태</th>
                                                        <th>보너스 지급 상태</th>
                                                        <th>KYC 상태</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {rewardStatusDetail.referralList.map((ref: any, idx: number) => (
                                                        <tr key={idx}>
                                                            <td className="wallet-cell">{ref.childWalletAddress}</td>
                                                            <td>{formatDateTime(ref.joinedAt)}</td>
                                                            <td style={{ color: '#4caf50', fontWeight: 'bold' }}>✅ 지급완료 (1 BW)</td>
                                                            <td style={{ color: '#a855f7', fontWeight: 'bold' }}>지급완료 ({parseFloat(ref.bonusRate || "0").toFixed(0)} %)</td>
                                                            <td>
                                                                <span className={`kyc-status-${(ref.kycStatus || 'NOT_APPLIED').toLowerCase()}`}>
                                                                    {getKycStatusText(ref.kycStatus || 'NOT_APPLIED')}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="no-data-message" style={{ padding: '20px' }}>
                                                추천 가입자가 없습니다.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* [가입자 목록 통합 영역] */}
                        <div className="test-section" style={{ marginTop: '30px' }}>
                            <h3>🎁 전체 가입자 목록 및 검색</h3>
                            
                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="지갑 주소 입력"
                                    className="admin-input"
                                    value={referralSearchAddress}
                                    onChange={(e) => setReferralSearchAddress(e.target.value)}
                                    disabled={referralLoading}
                                />
                                <button
                                    className="admin-button primary search-button-fixed"
                                    onClick={handleSearchReferral}
                                    disabled={referralLoading || isRefreshing}
                                >
                                    {referralLoading && !isRefreshing ? '검색 중...' : '주소 검색'}
                                </button>
                                <button
                                    className="admin-button secondary refresh-icon-button"
                                    onClick={handleSmartRefresh}
                                    title="목록 새로고침"
                                    disabled={referralLoading || isRefreshing}
                                >
                                    {isRefreshing ? '...' : '🔄'}
                                </button>
                            </div>

                            {referralError && (
                                <div className="error-message">{referralError}</div>
                            )}

                            {referralData && (
                                <div className={`attendance-result-box ${isRefreshing ? 'refreshing' : ''}`} style={{ marginTop: '20px' }}>
                                    <h3>✅ 가입자 정보 확인</h3>
                                    <div className="attendance-summary">
                                        <div className="summary-item">
                                            <span className="summary-label">전체 가입자 총 채굴량:</span>
                                            <span className="summary-value active">
                                                {parseFloat(realTimeTotal.toString()).toFixed(8)} BW
                                            </span>
                                        </div>
                                    </div>

                                    {referralData.records && referralData.records.length > 0 ? (
                                        <div className="attendance-table-container">
                                            <h4>
                                                {isSearchMode && referralSearchAddress.trim()
                                                    ? `가입자: ${referralSearchAddress} 전체 검색 결과`
                                                    : '전체 가입자 목록'
                                                }
                                            </h4>
                                            <table className="attendance-table">
                                                <thead>
                                                    <tr>
                                                        <th>가입자 지갑 주소</th>
                                                        <th>{isSearchMode ? '채굴 일자' : '가입 일자'}</th>
                                                        <th>일 채굴량</th>
                                                        <th>KYC 상태</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {referralData.records.map((record: any, index: number) => (
                                                        <tr key={index}>
                                                            <td className="wallet-cell">
                                                                {isSearchMode && record.referrerAddress
                                                                    ? record.referrerAddress
                                                                    : record.referredAddress
                                                                }
                                                            </td>
                                                            <td>
                                                                {isSearchMode && record.dateRange
                                                                    ? record.dateRange
                                                                    : formatDateTime(record.joinedDate)
                                                                }
                                                            </td>
                                                            <td
                                                                className="hoverable-amount"
                                                                title={formatPrecise(record.dailyMiningAmount)}
                                                            >
                                                                {formatShort(record.dailyMiningAmount)} BW
                                                            </td>
                                                            <td>
                                                                <span className={`kyc-status-${record.kycStatus.toLowerCase()}`}>
                                                                    {getKycStatusText(record.kycStatus)}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="total-row">
                                                        <td colSpan={3} style={{ textAlign: 'right', paddingRight: '20px' }}>
                                                            <strong>총 합산 금액</strong>
                                                        </td>
                                                        <td className="total-amount">
                                                            <strong
                                                                className="hoverable-amount"
                                                                title={formatPrecise(referralData.monthlyTotal)}
                                                            >
                                                                {formatShort(referralData.monthlyTotal)} BW
                                                            </strong>
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="no-data-message">
                                            <p className="no-data-icon">📭</p>
                                            <p className="no-data-text">추천 가입자가 없습니다</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'communityAdmin' && (
                    <div className="admin-panel animate-fade-in">
                        <h2>💬 BW 커뮤니티 통합 관리도구</h2>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div>
                                <span>접속 계정: <strong>{communityUser?.nickname} ({communityUser?.email})</strong></span>
                            </div>
                        </div>

                                <div className="admin-system-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
                                    {/* 공지 관리 섹션 */}
                                    <div className="admin-system-card">
                                        <h3>📢 커뮤니티 공지사항 관리</h3>
                                        
                                        {/* 공지 작성 및 수정 폼 */}
                                        <form onSubmit={handleSaveNotice} style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                                            <h4 style={{ marginTop: 0 }}>{editingNoticeId ? '✏️ 공지사항 수정' : '✏️ 새 공지사항 작성'}</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>공지 제목</label>
                                                    <input type="text" value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)} required className="admin-input" style={{ width: '100%' }} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>공지 내용</label>
                                                    <textarea value={noticeContent} onChange={e => setNoticeContent(e.target.value)} required className="admin-input" style={{ width: '100%', minHeight: '120px', resize: 'vertical' }} rows={4} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>이미지 첨부 (옵션 - Base64 자동변환)</label>
                                                    <input type="file" accept="image/*" onChange={handleImageChange} className="admin-input" style={{ width: '100%' }} />
                                                    {noticeImageBase64 && (
                                                        <div style={{ marginTop: '10px' }}>
                                                            <img src={noticeImageBase64} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                                            <button type="button" onClick={() => setNoticeImageBase64('')} className="admin-button danger" style={{ marginLeft: '10px', padding: '4px 8px', fontSize: '11px' }}>삭제</button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                                    <button type="submit" className="admin-button primary" style={{ flex: 1 }}>{editingNoticeId ? '수정 완료' : '등록 완료'}</button>
                                                    {editingNoticeId && (
                                                        <button type="button" onClick={() => {
                                                            setEditingNoticeId(null);
                                                            setNoticeTitle('');
                                                            setNoticeContent('');
                                                            setNoticeImageBase64('');
                                                        }} className="admin-button secondary">취소</button>
                                                    )}
                                                </div>
                                            </div>
                                        </form>

                                        {/* 공지 목록 */}
                                        <h4>공지 목록 {noticeLoading && <span style={{ fontSize: '12px', color: '#64748b' }}>(로딩중...)</span>}</h4>
                                        
                                        {noticeList.length > 0 ? (
                                            <>
                                                <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <button onClick={handleDeleteSelectedNotices} disabled={selectedNoticeIds.length === 0} className="admin-button danger" style={{ padding: '8px 16px', fontSize: '12px' }}>
                                                        🗑️ 선택 삭제 ({selectedNoticeIds.length}개 선택됨)
                                                    </button>
                                                    <div>
                                                        <input 
                                                            type="checkbox" 
                                                            id="selectAllNotices"
                                                            checked={selectedNoticeIds.length === noticeList.length && noticeList.length > 0}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedNoticeIds(noticeList.map(n => n.id));
                                                                } else {
                                                                    setSelectedNoticeIds([]);
                                                                }
                                                            }}
                                                        />
                                                        <label htmlFor="selectAllNotices" style={{ marginLeft: '6px', fontSize: '13px', cursor: 'pointer' }}>전체 선택</label>
                                                    </div>
                                                </div>
                                                <table className="admin-system-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <thead>
                                                        <tr style={{ background: '#f1f5f9' }}>
                                                            <th style={{ width: '40px', padding: '8px', textAlign: 'center' }}>선택</th>
                                                            <th style={{ padding: '8px', textAlign: 'left' }}>제목</th>
                                                            <th style={{ width: '100px', padding: '8px', textAlign: 'left' }}>작성자</th>
                                                            <th style={{ width: '120px', padding: '8px', textAlign: 'center' }}>등록일</th>
                                                            <th style={{ width: '100px', padding: '8px', textAlign: 'center' }}>동작</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {noticeList.map((notice, idx) => (
                                                            <tr key={notice.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                                                    <input 
                                                                        type="checkbox"
                                                                        checked={selectedNoticeIds.includes(notice.id)}
                                                                        onChange={(e) => {
                                                                            if (e.target.checked) {
                                                                                setSelectedNoticeIds([...selectedNoticeIds, notice.id]);
                                                                            } else {
                                                                                setSelectedNoticeIds(selectedNoticeIds.filter(id => id !== notice.id));
                                                                            }
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td style={{ padding: '8px', fontSize: '13px' }}>
                                                                    <div style={{ fontWeight: 'bold' }}>{notice.title}</div>
                                                                    {notice.image && <span style={{ fontSize: '11px', color: '#3b82f6', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>🖼️ 이미지 포함</span>}
                                                                </td>
                                                                <td style={{ padding: '8px', fontSize: '13px' }}>{notice.author.nickname}</td>
                                                                <td style={{ padding: '8px', fontSize: '12px', textAlign: 'center', color: '#64748b' }}>
                                                                    {new Date(notice.createdAt).toLocaleDateString()}
                                                                </td>
                                                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                                                    <button onClick={() => handleEditSelectNotice(notice)} className="admin-button primary" style={{ padding: '4px 8px', fontSize: '11px', marginRight: '6px' }}>수정</button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>

                                                {/* 페이징 네비게이션 */}
                                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
                                                    <button onClick={() => fetchAdminNotices(noticePage - 1)} disabled={noticePage === 1} className="admin-button secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>이전</button>
                                                    <span style={{ fontSize: '13px' }}>{noticePage} / {noticeTotalPages} 페이지</span>
                                                    <button onClick={() => fetchAdminNotices(noticePage + 1)} disabled={noticePage === noticeTotalPages} className="admin-button secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>다음</button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="no-data-message" style={{ padding: '30px' }}>등록된 공지사항이 없습니다.</div>
                                        )}
                                    </div>

                                    {/* 금칙어 관리 섹션 */}
                                    <div className="admin-system-card">
                                        <h3>🚫 실시간 글쓰기 금칙어 관리</h3>
                                        <p style={{ fontSize: '12px', color: '#64748b', margin: '-10px 0 20px 0' }}>
                                            여기에 등록된 단어는 커뮤니티 내 모든 게시글 및 댓글 작성 시 즉각 필터링되어 차단 처리됩니다.
                                        </p>
                                        
                                        <form onSubmit={handleAddBannedWord} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                                            <input 
                                                type="text" 
                                                value={newBannedWord} 
                                                onChange={e => setNewBannedWord(e.target.value)} 
                                                placeholder="추가할 금칙어 입력" 
                                                required 
                                                className="admin-input" 
                                                style={{ flex: 1 }} 
                                            />
                                            <button type="submit" className="admin-button primary" style={{ padding: '10px 20px' }}>추가</button>
                                        </form>

                                        <h4>등록된 금칙어 ({bannedWordsList.length}개) {bannedWordLoading && <span style={{ fontSize: '12px', color: '#64748b' }}>(로딩중...)</span>}</h4>
                                        
                                        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '15px', minHeight: '200px', maxHeight: '400px', overflowY: 'auto', border: '1px solid #e2e8f0' }}>
                                            {bannedWordsList.length > 0 ? (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                    {bannedWordsList.map(bw => (
                                                        <div key={bw._id} style={{ display: 'flex', alignItems: 'center', background: '#fee2e2', color: '#991b1b', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', border: '1px solid #fca5a5' }}>
                                                            <strong>{bw.word}</strong>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => handleDeleteBannedWord(bw._id)} 
                                                                style={{ border: 'none', background: 'transparent', color: '#b91c1c', marginLeft: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="no-data-message" style={{ padding: '30px', color: '#64748b' }}>등록된 금칙어가 없습니다.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                    </div>
                )}

                {activeTab === 'partner' && (
                    <div className="admin-panel">
                        <h2>🏪 가맹점 등록 관리</h2>
                        <p>가맹점 신청 목록 및 승인/거부</p>
                    </div>
                )}

                {activeTab === 'kyc' && (
                    <div className="admin-panel">
                        <h2>🆔 KYC 거버넌스 제어</h2>
                        <KYCManager />
                    </div>
                )}

                {activeTab === 'halving' && (
                    <div className="admin-panel">
                        <h2>⏰ 반감기 정책 관리</h2>
                        <p>반감기 스케줄 및 이력</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminPage;