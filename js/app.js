/**
 * SOP Academy - 主应用框架
 * 导航、路由、状态管理
 */

// ===== 全局状态 =====
const AppState = {
    currentUser: null,       // 当前登录用户
    currentPage: null,       // 当前页面
    sidebarOpen: false,      // 侧边栏状态（移动端）
    notifOpen: false,        // 通知面板状态
    unreadCount: 0,          // 未读通知数
    examTimer: null,         // 考试计时器
    screenSwitchCount: 0,    // 切屏计数
};

// ===== 页面渲染器注册表 =====
const PageRenderers = {};

// ===== 初始化 =====
async function initApp() {
    // 初始化本地数据
    initLocalData();

    // 尝试初始化Supabase
    initSupabase();

    // 检查登录状态
    const savedUser = getStore('currentUser');
    if (savedUser) {
        AppState.currentUser = savedUser;
        showApp();
    } else {
        showLogin();
    }
}

// ===== 登录/登出 =====
function showLogin() {
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('appRoot').classList.remove('visible');
}

async function doLogin() {
    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value;
    const errorEl = document.getElementById('loginError');

    if (!username || !password) {
        errorEl.textContent = '请输入用户名和密码';
        errorEl.classList.add('show');
        return;
    }

    errorEl.classList.remove('show');

    const result = await loginUser(username, password);
    if (result.success) {
        AppState.currentUser = result.user;
        setStore('currentUser', result.user);
        showApp();
    } else {
        errorEl.textContent = result.message;
        errorEl.classList.add('show');
    }
}

function doLogout() {
    showConfirm('确定要退出登录吗？', () => {
        AppState.currentUser = null;
        setStore('currentUser', null);
        AppState.currentPage = null;
        if (AppState.examTimer) { clearInterval(AppState.examTimer); AppState.examTimer = null; }
        showLogin();
        document.getElementById('loginUser').value = '';
        document.getElementById('loginPass').value = '';
    });
}

// ===== 显示主应用 =====
function showApp() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('appRoot').classList.add('visible');

    // 更新侧边栏
    updateSidebar();
    updateUserInfo();
    loadNotifications();

    // 根据角色显示默认页面
    const user = AppState.currentUser;
    if (user.role === ROLES.ADMIN) {
        navigateTo('adm-dash');
    } else if (user.role === ROLES.LEADER) {
        navigateTo('ldr-overview');
    } else {
        navigateTo('emp-dashboard');
    }
}

// ===== 侧边栏 =====
function updateSidebar() {
    const user = AppState.currentUser;
    const nav = document.getElementById('sidebarNav');
    let html = '';

    if (user.role === ROLES.ADMIN) {
        html = `
            <div class="nav-section">工作台</div>
            <div class="nav-item" data-page="adm-dash" onclick="navigateTo('adm-dash')">
                <span class="nav-emoji">📊</span> 仪表盘
            </div>
            <div class="nav-item" data-page="adm-scoring" onclick="navigateTo('adm-scoring')">
                <span class="nav-emoji">✏️</span> 评分管理
                <span class="nav-badge" id="scoringBadge" style="display:none">0</span>
            </div>

            <div class="nav-section">管理</div>
            <div class="nav-item" data-page="adm-accounts" onclick="navigateTo('adm-accounts')">
                <span class="nav-emoji">👥</span> 账号管理
            </div>
            <div class="nav-item" data-page="adm-resources" onclick="navigateTo('adm-resources')">
                <span class="nav-emoji">📁</span> 资料库
            </div>
            <div class="nav-item" data-page="adm-questions" onclick="navigateTo('adm-questions')">
                <span class="nav-emoji">📝</span> 题库管理
            </div>
            <div class="nav-item" data-page="adm-progress" onclick="navigateTo('adm-progress')">
                <span class="nav-emoji">📈</span> 进度监控
            </div>
            <div class="nav-item" data-page="adm-config" onclick="navigateTo('adm-config')">
                <span class="nav-emoji">⚙️</span> 系统配置
            </div>
        `;
    } else if (user.role === ROLES.LEADER) {
        html = `
            <div class="nav-section">工作台</div>
            <div class="nav-item" data-page="ldr-overview" onclick="navigateTo('ldr-overview')">
                <span class="nav-emoji">👥</span> 组内概览
            </div>
            <div class="nav-item" data-page="ldr-progress" onclick="navigateTo('ldr-progress')">
                <span class="nav-emoji">📊</span> 学习进度
            </div>
            <div class="nav-item" data-page="ldr-scores" onclick="navigateTo('ldr-scores')">
                <span class="nav-emoji">📋</span> 考试成绩
            </div>
        `;
    } else {
        html = `
            <div class="nav-section">学习中心</div>
            <div class="nav-item" data-page="emp-dashboard" onclick="navigateTo('emp-dashboard')">
                <span class="nav-emoji">🏠</span> 学习首页
            </div>
            <div class="nav-item" data-page="emp-chapters" onclick="navigateTo('emp-chapters')">
                <span class="nav-emoji">📖</span> 章节学习
            </div>
            <div class="nav-item" data-page="emp-exams" onclick="navigateTo('emp-exams')">
                <span class="nav-emoji">📝</span> 我的考试
            </div>
            <div class="nav-item" data-page="emp-report" onclick="navigateTo('emp-report')">
                <span class="nav-emoji">📈</span> 我的评估
            </div>
        `;
    }

    nav.innerHTML = html;
}

function updateUserInfo() {
    const user = AppState.currentUser;
    const avatarEl = document.getElementById('userAvatar');
    const nameEl = document.getElementById('userName');
    const roleEl = document.getElementById('userRoleLabel');

    avatarEl.textContent = user.avatarChar;
    avatarEl.className = 'user-avatar ' + (user.role === ROLES.ADMIN ? 'av-primary' : user.role === ROLES.LEADER ? 'av-warning' : 'av-primary');
    nameEl.textContent = user.displayName;

    const roleLabels = { admin: '管理员', leader: `组长 · ${user.group}`, employee: `员工 · ${user.group}` };
    roleEl.textContent = roleLabels[user.role] + ' · 点击退出';
}

// ===== 导航 =====
function navigateTo(page) {
    AppState.currentPage = page;

    // 更新导航高亮
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });

    // 渲染页面
    const content = document.getElementById('mainContent');
    const renderer = PageRenderers[page];
    if (renderer) {
        content.innerHTML = '';
        renderer(content);
    } else {
        content.innerHTML = `<div class="topbar"><h2>页面未找到</h2></div><div class="card"><p>页面 "${page}" 尚未实现</p></div>`;
    }

    // 移动端关闭侧边栏
    closeSidebar();
    // 滚动到顶部
    window.scrollTo(0, 0);
}

// ===== 移动端侧边栏 =====
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    AppState.sidebarOpen = !AppState.sidebarOpen;
    sidebar.classList.toggle('open', AppState.sidebarOpen);
    overlay.classList.toggle('show', AppState.sidebarOpen);
}

function closeSidebar() {
    AppState.sidebarOpen = false;
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');
}

// ===== 通知系统 =====
async function loadNotifications() {
    const user = AppState.currentUser;
    if (!user) return;
    const notifs = await getNotifications(user.id);
    const unread = notifs.filter(n => !n.isRead);
    AppState.unreadCount = unread.length;

    // 更新评分徽章（管理员）
    if (user.role === ROLES.ADMIN) {
        const pendingReviews = await getPendingReviews();
        const badge = document.getElementById('scoringBadge');
        if (badge) {
            badge.textContent = pendingReviews.length;
            badge.style.display = pendingReviews.length > 0 ? 'inline' : 'none';
        }
    }
}

function toggleNotifPanel() {
    const panel = document.getElementById('notifPanel');
    const overlay = document.getElementById('notifOverlay');
    AppState.notifOpen = !AppState.notifOpen;
    panel.classList.toggle('open', AppState.notifOpen);
    overlay.classList.toggle('show', AppState.notifOpen);

    if (AppState.notifOpen) {
        renderNotifList();
        // 标记已读
        markNotificationsRead(AppState.currentUser.id);
        AppState.unreadCount = 0;
    }
}

async function renderNotifList() {
    const notifs = await getNotifications(AppState.currentUser.id);
    const list = document.getElementById('notifList');
    if (!list) return;

    if (notifs.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:40px 0;color:#5a6b82">暂无通知</div>';
        return;
    }

    const typeIcons = {
        chapter_completed: '📖',
        exam_scored: '📊',
        pending_review: '✏️',
        progress_behind: '⚠️',
        account_created: '👤',
        general: '🔔'
    };

    list.innerHTML = notifs.map(n => `
        <div class="notif-item ${n.isRead ? '' : 'unread'}">
            <div class="notif-title">${typeIcons[n.type] || '🔔'} ${n.title}</div>
            <div class="notif-content">${n.content || ''}</div>
            <div class="notif-time">${timeAgo(n.createdAt)}</div>
        </div>
    `).join('');
}

function closeNotifPanel() {
    AppState.notifOpen = false;
    document.getElementById('notifPanel').classList.remove('open');
    document.getElementById('notifOverlay').classList.remove('show');
}

// ===== 用户进度计算 =====
async function getUserChapterStatus(userId, chapters) {
    const progress = await getUserProgress(userId);
    const exams = [];

    return chapters.map((ch, i) => {
        const p = progress.find(pr => pr.chapterId === ch.id);
        let status = 'locked';
        let progressPct = 0;

        if (p) {
            status = p.status;
            progressPct = p.progressPct || 0;
        } else if (i === 0) {
            // 第一章默认解锁
            status = 'in_progress';
        }

        return {
            ...ch,
            status,
            progressPct,
            isUnlocked: status !== 'locked',
            isCompleted: status === 'completed'
        };
    });
}

// ===== 计算整体进度百分比 =====
function calcOverallProgress(chapterStatuses) {
    const total = chapterStatuses.length;
    const completed = chapterStatuses.filter(c => c.isCompleted).length;
    return Math.round((completed / total) * 100);
}

// ===== 计算平均分 =====
function calcAvgScore(userId) {
    const exams = (getStore('exams') || []).filter(e => e.userId === userId && e.totalScore);
    if (exams.length === 0) return 0;
    return Math.round(exams.reduce((a, e) => a + e.totalScore, 0) / exams.length);
}
