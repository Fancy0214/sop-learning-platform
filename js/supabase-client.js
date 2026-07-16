/**
 * SOP Academy - Supabase 客户端
 * 数据库交互层
 */

// Supabase 客户端实例
let supabaseClient = null;

/**
 * 初始化 Supabase 客户端
 */
function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.warn('Supabase SDK 未加载，使用本地模拟模式');
        return false;
    }
    try {
        supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        return true;
    } catch (e) {
        console.warn('Supabase 初始化失败，使用本地模拟模式:', e.message);
        return false;
    }
}

/**
 * 检查 Supabase 是否可用
 */
function isSupabaseReady() {
    return supabaseClient !== null && SUPABASE_CONFIG.url !== 'https://YOUR_PROJECT_ID.supabase.co';
}

// ===== 用户认证 =====

/**
 * 用户登录
 */
async function loginUser(username, password) {
    if (isSupabaseReady()) {
        // 真实 Supabase 模式
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('username', username)
            .eq('is_active', true)
            .single();

        if (error || !data) return { success: false, message: '用户名或密码错误' };

        // 验证密码（实际应该用 bcrypt 比对，这里简化）
        if (data.password_hash !== hashPassword(password)) {
            return { success: false, message: '用户名或密码错误' };
        }

        // 更新最后登录时间
        await supabaseClient
            .from('profiles')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', data.id);

        return { success: true, user: formatUserProfile(data) };
    } else {
        // 本地模拟模式
        return simulateLogin(username, password);
    }
}

/**
 * 简单密码哈希（实际部署应使用 bcrypt）
 */
function hashPassword(password) {
    // 简化实现 - 实际部署时使用 Web Crypto API 或 bcrypt.js
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'hash_' + Math.abs(hash).toString(36);
}

/**
 * 格式化用户资料
 */
function formatUserProfile(data) {
    return {
        id: data.id,
        username: data.username,
        displayName: data.display_name,
        avatarChar: data.avatar_char || data.display_name.charAt(0),
        role: data.role,
        group: data.group_name,
        isActive: data.is_active
    };
}

// ===== 学习进度 =====

/**
 * 获取用户的学习进度
 */
async function getUserProgress(userId) {
    if (isSupabaseReady()) {
        const { data, error } = await supabaseClient
            .from('learning_progress')
            .select('*')
            .eq('user_id', userId);
        if (error) return [];
        return data;
    }
    return getLocalProgress(userId);
}

/**
 * 更新学习进度
 */
async function updateProgress(userId, chapterId, status, progressPct) {
    if (isSupabaseReady()) {
        const { error } = await supabaseClient
            .from('learning_progress')
            .upsert({
                user_id: userId,
                chapter_id: chapterId,
                status: status,
                progress_pct: progressPct,
                updated_at: new Date().toISOString(),
                ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {}),
                ...(progressPct > 0 ? { started_at: new Date().toISOString() } : {})
            }, { onConflict: 'user_id,chapter_id' });
        return !error;
    }
    return updateLocalProgress(userId, chapterId, status, progressPct);
}

// ===== 题库 =====

/**
 * 获取章节题目
 */
async function getChapterQuestions(chapterId) {
    if (isSupabaseReady()) {
        const { data, error } = await supabaseClient
            .from('questions')
            .select('*')
            .eq('chapter_id', chapterId)
            .eq('is_active', true);
        if (error) return [];
        return data;
    }
    return getLocalQuestions(chapterId);
}

// ===== 考试 =====

/**
 * 创建考试记录
 */
async function createExam(userId, chapterId, questionsSnapshot, timeLimit) {
    if (isSupabaseReady()) {
        const { data, error } = await supabaseClient
            .from('exams')
            .insert({
                user_id: userId,
                chapter_id: chapterId,
                status: 'in_progress',
                questions_snapshot: questionsSnapshot,
                time_limit: timeLimit,
                start_time: new Date().toISOString()
            })
            .select()
            .single();
        if (error) return null;
        return data;
    }
    return createLocalExam(userId, chapterId, questionsSnapshot, timeLimit);
}

/**
 * 提交考试
 */
async function submitExam(examId, answers, screenSwitchCount) {
    if (isSupabaseReady()) {
        const { error } = await supabaseClient
            .from('exams')
            .update({
                status: 'submitted',
                answers: answers,
                screen_switch_count: screenSwitchCount,
                submit_time: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', examId);
        return !error;
    }
    return submitLocalExam(examId, answers, screenSwitchCount);
}

/**
 * 获取考试记录
 */
async function getExamRecord(userId, chapterId) {
    if (isSupabaseReady()) {
        const { data, error } = await supabaseClient
            .from('exams')
            .select('*')
            .eq('user_id', userId)
            .eq('chapter_id', chapterId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error || !data) return null;
        return data;
    }
    return getLocalExamRecord(userId, chapterId);
}

/**
 * 获取所有待评分的考试
 */
async function getPendingReviews() {
    if (isSupabaseReady()) {
        const { data, error } = await supabaseClient
            .from('exams')
            .select(`
                *,
                profiles:user_id (display_name, group_name)
            `)
            .eq('status', 'submitted');
        if (error) return [];
        return data;
    }
    return getLocalPendingReviews();
}

/**
 * 评分
 */
async function scoreExam(examId, scores, scoredBy) {
    if (isSupabaseReady()) {
        const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
        const { error } = await supabaseClient
            .from('exams')
            .update({
                manual_score: totalScore,
                total_score: totalScore,
                status: totalScore >= 80 ? 'passed' : 'failed',
                scored_by: scoredBy,
                scored_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', examId);
        return !error;
    }
    return scoreLocalExam(examId, scores);
}

// ===== 通知 =====

/**
 * 获取通知列表
 */
async function getNotifications(userId) {
    if (isSupabaseReady()) {
        const { data, error } = await supabaseClient
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);
        if (error) return [];
        return data;
    }
    return getLocalNotifications(userId);
}

/**
 * 创建通知
 */
async function createNotification(userId, type, title, content, relatedId) {
    if (isSupabaseReady()) {
        await supabaseClient
            .from('notifications')
            .insert({
                user_id: userId,
                type: type,
                title: title,
                content: content,
                related_id: relatedId
            });
    }
    addLocalNotification(userId, type, title, content, relatedId);
}

/**
 * 标记通知已读
 */
async function markNotificationsRead(userId) {
    if (isSupabaseReady()) {
        await supabaseClient
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);
    }
    markLocalNotifsRead(userId);
}

// ===== 账号管理 =====

/**
 * 获取所有用户（管理员/组长用）
 */
async function getAllUsers(filterGroup) {
    if (isSupabaseReady()) {
        let query = supabaseClient.from('profiles').select('*');
        if (filterGroup) query = query.eq('group_name', filterGroup);
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) return [];
        return data;
    }
    return getLocalUsers(filterGroup);
}

/**
 * 创建用户
 */
async function createUser(username, password, displayName, role, groupName, createdBy) {
    if (isSupabaseReady()) {
        const { data, error } = await supabaseClient
            .from('profiles')
            .insert({
                username: username,
                password_hash: hashPassword(password),
                display_name: displayName,
                avatar_char: displayName.charAt(0),
                role: role,
                group_name: groupName,
                created_by: createdBy
            })
            .select()
            .single();
        if (error) return { success: false, message: error.message };
        return { success: true, user: formatUserProfile(data) };
    }
    return createLocalUser(username, password, displayName, role, groupName);
}

/**
 * 更新用户状态
 */
async function toggleUserActive(userId, isActive) {
    if (isSupabaseReady()) {
        const { error } = await supabaseClient
            .from('profiles')
            .update({ is_active: isActive, updated_at: new Date().toISOString() })
            .eq('id', userId);
        return !error;
    }
    return toggleLocalUserActive(userId, isActive);
}

/**
 * 删除用户
 */
async function deleteUser(userId) {
    if (isSupabaseReady()) {
        const { error } = await supabaseClient
            .from('profiles')
            .delete()
            .eq('id', userId);
        return !error;
    }
    return deleteLocalUser(userId);
}

// ===== 评估报告 =====

/**
 * 获取评估报告
 */
async function getEvaluations(userId, type) {
    if (isSupabaseReady()) {
        let query = supabaseClient.from('evaluations').select('*').eq('user_id', userId);
        if (type) query = query.eq('type', type);
        const { data, error } = await query.order('generated_at', { ascending: false });
        if (error) return [];
        return data;
    }
    return getLocalEvaluations(userId, type);
}

/**
 * 学习内容（Markdown）
 */
async function getLearningContent(chapterId) {
    if (isSupabaseReady()) {
        const { data, error } = await supabaseClient
            .from('learning_content')
            .select('*')
            .eq('chapter_id', chapterId)
            .order('sort_order');
        if (error) return [];
        return data;
    }
    return getLocalLearningContent(chapterId);
}

/**
 * 获取所有考试记录（管理员/组长用）
 */
async function getAllExamRecords(filterUserId, filterChapterId) {
    if (isSupabaseReady()) {
        let query = supabaseClient.from('exams').select(`
            *,
            profiles:user_id (display_name, group_name)
        `);
        if (filterUserId) query = query.eq('user_id', filterUserId);
        if (filterChapterId) query = query.eq('chapter_id', filterChapterId);
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) return [];
        return data;
    }
    return getLocalAllExamRecords(filterUserId, filterChapterId);
}
