/**
 * SOP Academy - Supabase 客户端
 * 数据库交互层（云端优先，本地兜底）
 */

// Supabase 客户端实例
let supabaseClient = null;
let _migrationDone = false;

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
        console.log('Supabase 客户端初始化成功');
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

// ===== SHA-256 密码哈希 =====

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ===== 数据格式转换工具 =====

function snakeToCamel(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const result = {};
    for (const key of Object.keys(obj)) {
        const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        result[camelKey] = obj[key];
    }
    return result;
}

function formatUserProfile(data) {
    return {
        id: data.id,
        username: data.username,
        displayName: data.display_name,
        avatarChar: data.avatar_char || (data.display_name ? data.display_name.charAt(0) : '?'),
        role: data.role,
        group: data.group_name,
        isActive: data.is_active,
        createdAt: data.created_at
    };
}

function formatProgressRow(row) {
    return {
        id: row.id,
        userId: row.user_id,
        chapterId: row.chapter_id,
        status: row.status,
        progressPct: row.progress_pct || 0,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        updatedAt: row.updated_at
    };
}

function formatExamRow(row) {
    return {
        id: row.id,
        userId: row.user_id,
        chapterId: row.chapter_id,
        status: row.status,
        questionsSnapshot: row.questions_snapshot,
        answers: row.answers,
        autoScore: row.auto_score || 0,
        manualScore: row.manual_score || 0,
        totalScore: row.total_score || 0,
        timeLimit: row.time_limit,
        screenSwitchCount: row.screen_switch_count || 0,
        startTime: row.start_time,
        submitTime: row.submit_time,
        scoredAt: row.scored_at,
        scoredBy: row.scored_by,
        createdAt: row.created_at,
        // 兼容旧代码的字段名
        userName: row.profiles ? row.profiles.display_name : (row.userName || '未知'),
        userGroup: row.profiles ? row.profiles.group_name : (row.userGroup || '')
    };
}

function formatNotificationRow(row) {
    return {
        id: row.id,
        userId: row.user_id,
        type: row.type,
        title: row.title,
        content: row.content,
        relatedId: row.related_id,
        isRead: row.is_read,
        createdAt: row.created_at
    };
}

// ===== 数据迁移/初始化 =====

/**
 * 一次性数据迁移：将本地演示数据导入 Supabase
 * 可通过浏览器控制台调用: migrateDataToSupabase()
 */
async function migrateDataToSupabase() {
    if (!isSupabaseReady()) {
        console.error('Supabase 未就绪');
        return { success: false, message: 'Supabase 未连接' };
    }

    console.log('开始数据迁移...');
    const results = { users: 0, progress: 0, exams: 0, skipped: [] };

    // 1. 迁移用户
    const localUsers = getStore('users') || [];
    for (const user of localUsers) {
        try {
            const passwordHash = await hashPassword(user.password);
            const { error } = await supabaseClient
                .from('profiles')
                .upsert({
                    username: user.username,
                    password_hash: passwordHash,
                    display_name: user.displayName,
                    avatar_char: user.avatarChar,
                    role: user.role,
                    group_name: user.group,
                    is_active: user.isActive !== false,
                    created_at: user.createdAt || new Date().toISOString()
                }, { onConflict: 'username' });
            if (!error) results.users++;
            else results.skipped.push('user:' + user.username + ' - ' + error.message);
        } catch (e) {
            results.skipped.push('user:' + user.username + ' - ' + e.message);
        }
    }

    // 2. 迁移学习进度
    const localProgress = getStore('progress') || [];
    for (const p of localProgress) {
        try {
            // 需要先查找用户 ID
            const { data: profileData } = await supabaseClient
                .from('profiles')
                .select('id')
                .eq('username', localUsers.find(u => u.id === p.userId)?.username)
                .single();

            if (profileData) {
                const { error } = await supabaseClient
                    .from('learning_progress')
                    .upsert({
                        user_id: profileData.id,
                        chapter_id: p.chapterId,
                        status: p.status,
                        progress_pct: p.progressPct || 0,
                        started_at: p.startedAt || null,
                        completed_at: p.completedAt || null
                    }, { onConflict: 'user_id,chapter_id' });
                if (!error) results.progress++;
                else results.skipped.push('progress:ch' + p.chapterId + ' - ' + error.message);
            }
        } catch (e) {
            results.skipped.push('progress:ch' + p.chapterId + ' - ' + e.message);
        }
    }

    // 3. 迁移考试记录
    const localExams = getStore('exams') || [];
    for (const exam of localExams) {
        try {
            const { data: profileData } = await supabaseClient
                .from('profiles')
                .select('id')
                .eq('username', localUsers.find(u => u.id === exam.userId)?.username)
                .single();

            if (profileData) {
                const { error } = await supabaseClient
                    .from('exams')
                    .insert({
                        user_id: profileData.id,
                        chapter_id: exam.chapterId,
                        status: exam.status,
                        questions_snapshot: exam.questionsSnapshot || {},
                        answers: exam.answers || null,
                        auto_score: exam.autoScore || 0,
                        manual_score: exam.manualScore || 0,
                        total_score: exam.totalScore || 0,
                        time_limit: exam.timeLimit || null,
                        screen_switch_count: exam.screenSwitchCount || 0,
                        start_time: exam.startTime,
                        submit_time: exam.submitTime || null,
                        scored_at: exam.scoredAt || null
                    });
                if (!error) results.exams++;
                else results.skipped.push('exam:' + exam.id + ' - ' + error.message);
            }
        } catch (e) {
            results.skipped.push('exam:' + exam.id + ' - ' + e.message);
        }
    }

    _migrationDone = true;
    console.log('迁移完成:', results);
    return { success: true, results };
}

// ===== 用户认证 =====

async function loginUser(username, password) {
    if (isSupabaseReady()) {
        const passwordHash = await hashPassword(password);
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('username', username)
            .eq('is_active', true)
            .single();

        if (error || !data) return { success: false, message: '用户名或密码错误，或账号已停用' };

        if (data.password_hash !== passwordHash) {
            return { success: false, message: '用户名或密码错误，或账号已停用' };
        }

        // 更新最后登录时间
        await supabaseClient
            .from('profiles')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', data.id);

        return { success: true, user: formatUserProfile(data) };
    } else {
        return simulateLogin(username, password);
    }
}

function simulateLogin(username, password) {
    const users = getStore('users') || [];
    const user = users.find(u => u.username === username && u.password === password && u.isActive);
    if (user) {
        return { success: true, user: { id: user.id, username: user.username, displayName: user.displayName, avatarChar: user.avatarChar, role: user.role, group: user.group, isActive: user.isActive } };
    }
    return { success: false, message: '用户名或密码错误，或账号已停用' };
}

// ===== 学习进度 =====

async function getUserProgress(userId) {
    if (isSupabaseReady()) {
        // 先尝试从 Supabase 获取
        const { data, error } = await supabaseClient
            .from('learning_progress')
            .select('*')
            .eq('user_id', userId);
        if (!error && data && data.length > 0) {
            return data.map(formatProgressRow);
        }
        // 如果 Supabase 没有数据，尝试从本地迁移
        const localProgress = getLocalProgress(userId);
        if (localProgress.length > 0) {
            // 异步迁移到云端（不阻塞当前操作）
            _migrateProgressToCloud(userId, localProgress);
        }
        return localProgress;
    }
    return getLocalProgress(userId);
}

async function _migrateProgressToCloud(userId, progressList) {
    if (!isSupabaseReady()) return;
    // 获取当前用户的 supabase ID（通过 localStorage 映射）
    const cloudUserId = await _getCloudUserId(userId);
    if (!cloudUserId) return;

    for (const p of progressList) {
        await supabaseClient
            .from('learning_progress')
            .upsert({
                user_id: cloudUserId,
                chapter_id: p.chapterId,
                status: p.status,
                progress_pct: p.progressPct || 0,
                started_at: p.startedAt || null,
                completed_at: p.completedAt || null
            }, { onConflict: 'user_id,chapter_id' });
    }
}

async function _getCloudUserId(localUserId) {
    // 通过本地用户数据找到对应的云端用户
    const localUsers = getStore('users') || [];
    const localUser = localUsers.find(u => u.id === localUserId);
    if (!localUser) return null;

    const { data } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('username', localUser.username)
        .single();
    return data ? data.id : null;
}

async function updateProgress(userId, chapterId, status, progressPct) {
    if (isSupabaseReady()) {
        const cloudUserId = await _getCloudUserId(userId);
        if (cloudUserId) {
            const updateData = {
                user_id: cloudUserId,
                chapter_id: chapterId,
                status: status,
                progress_pct: progressPct,
                updated_at: new Date().toISOString()
            };
            if (status === 'completed') updateData.completed_at = new Date().toISOString();
            if (progressPct > 0 && !updateData.started_at) updateData.started_at = new Date().toISOString();

            const { error } = await supabaseClient
                .from('learning_progress')
                .upsert(updateData, { onConflict: 'user_id,chapter_id' });
            if (!error) return true;
        }
        // fallback to local
    }
    return updateLocalProgress(userId, chapterId, status, progressPct);
}

// ===== 题库 =====

async function getChapterQuestions(chapterId) {
    if (isSupabaseReady()) {
        const { data, error } = await supabaseClient
            .from('questions')
            .select('*')
            .eq('chapter_id', chapterId)
            .eq('is_active', true)
            .order('sort_order');
        if (!error && data && data.length > 0) {
            return data.map(q => snakeToCamel(q));
        }
        // fallback to local questions from exam-questions.js
    }
    return getLocalQuestions(chapterId);
}

// ===== 考试 =====

async function createExam(userId, chapterId, questionsSnapshot, timeLimit) {
    if (isSupabaseReady()) {
        const cloudUserId = await _getCloudUserId(userId);
        if (cloudUserId) {
            const { data, error } = await supabaseClient
                .from('exams')
                .insert({
                    user_id: cloudUserId,
                    chapter_id: chapterId,
                    status: 'in_progress',
                    questions_snapshot: questionsSnapshot,
                    time_limit: timeLimit,
                    start_time: new Date().toISOString()
                })
                .select()
                .single();
            if (!error && data) {
                return formatExamRow(data);
            }
        }
    }
    return createLocalExam(userId, chapterId, questionsSnapshot, timeLimit);
}

async function submitExam(examId, answers, screenSwitchCount) {
    if (isSupabaseReady()) {
        // 先从本地获取考试记录以进行自动评分
        const localExam = (getStore('exams') || []).find(e => e.id === examId);
        const questionsSnapshot = localExam ? localExam.questionsSnapshot : null;

        // 自动评分
        let autoScore = 0;
        let hasSubjective = false;
        if (questionsSnapshot) {
            questionsSnapshot.forEach((q, i) => {
                const ans = answers[i];
                if (q.questionType === 'choice_single' || q.questionType === 'true_false') {
                    if (ans && ans.selected === q.answer.index) autoScore += q.score;
                } else if (q.questionType === 'fill_blank') {
                    if (ans && ans.text && ans.text.trim().toLowerCase() === q.answer.text.toLowerCase()) autoScore += q.score;
                } else if (q.questionType === 'essay' || q.questionType === 'practice') {
                    hasSubjective = true;
                }
            });
        }

        let status = 'submitted';
        let totalScore = autoScore;
        let manualScore = 0;

        if (!hasSubjective) {
            const chapters = (typeof CHAPTERS_CONFIG !== 'undefined' ? CHAPTERS_CONFIG : []);
            const chapter = chapters.find(ch => ch.id === localExam?.chapterId);
            const passingScore = chapter ? chapter.passingScore : 80;
            status = totalScore >= passingScore ? 'passed' : 'failed';
        }

        // Try Supabase first - find by matching start_time or use local mapping
        const { data: dbExams, error: findError } = await supabaseClient
            .from('exams')
            .select('*')
            .eq('status', 'in_progress')
            .order('created_at', { ascending: false })
            .limit(10);

        if (!findError && dbExams && dbExams.length > 0) {
            // Find the matching exam by questions_snapshot or start_time
            const dbExam = localExam
                ? dbExams.find(e => e.start_time === localExam.startTime || JSON.stringify(e.questions_snapshot) === JSON.stringify(localExam.questionsSnapshot))
                : dbExams[0];

            if (dbExam) {
                await supabaseClient
                    .from('exams')
                    .update({
                        status: status,
                        answers: answers,
                        auto_score: autoScore,
                        manual_score: manualScore,
                        total_score: totalScore,
                        screen_switch_count: screenSwitchCount,
                        submit_time: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', dbExam.id);

                // Also update local for consistency
                if (localExam) {
                    submitLocalExam(examId, answers, screenSwitchCount);
                }
                return true;
            }
        }
    }
    return submitLocalExam(examId, answers, screenSwitchCount);
}

async function getExamRecord(userId, chapterId) {
    if (isSupabaseReady()) {
        const cloudUserId = await _getCloudUserId(userId);
        if (cloudUserId) {
            const { data, error } = await supabaseClient
                .from('exams')
                .select('*')
                .eq('user_id', cloudUserId)
                .eq('chapter_id', chapterId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (!error && data) {
                return formatExamRow(data);
            }
        }
        // fallback
        return getLocalExamRecord(userId, chapterId);
    }
    return getLocalExamRecord(userId, chapterId);
}

async function getPendingReviews() {
    if (isSupabaseReady()) {
        const { data, error } = await supabaseClient
            .from('exams')
            .select(`*, profiles:user_id (display_name, group_name)`)
            .eq('status', 'submitted')
            .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
            return data.map(e => ({
                ...formatExamRow(e),
                userName: e.profiles ? e.profiles.display_name : '未知',
                userGroup: e.profiles ? e.profiles.group_name : ''
            }));
        }
        // fallback
        return getLocalPendingReviews();
    }
    return getLocalPendingReviews();
}

async function scoreExam(examId, scores, scoredByUserId) {
    if (isSupabaseReady()) {
        const manualScore = Object.values(scores).reduce((a, b) => a + b, 0);

        // Find in Supabase
        const { data: dbExams } = await supabaseClient
            .from('exams')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (dbExams) {
            // Try to find by matching local exam ID pattern
            const localExam = (getStore('exams') || []).find(e => e.id === examId);
            let dbExam = null;
            if (localExam) {
                dbExam = dbExams.find(e =>
                    e.start_time === localExam.startTime ||
                    e.chapter_id === localExam.chapterId
                );
            }

            if (dbExam) {
                const totalScore = (dbExam.auto_score || 0) + manualScore;
                const newStatus = totalScore >= 80 ? 'passed' : 'failed';

                const cloudScoredBy = scoredByUserId ? await _getCloudUserId(scoredByUserId) : null;

                await supabaseClient
                    .from('exams')
                    .update({
                        manual_score: manualScore,
                        total_score: totalScore,
                        status: newStatus,
                        scored_by: cloudScoredBy,
                        scored_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', dbExam.id);

                // Also update local
                scoreLocalExam(examId, scores);
                return true;
            }
        }
    }
    return scoreLocalExam(examId, scores);
}

async function getAllExamRecords(filterUserId, filterChapterId) {
    if (isSupabaseReady()) {
        let query = supabaseClient
            .from('exams')
            .select(`*, profiles:user_id (display_name, group_name)`)
            .order('created_at', { ascending: false });

        if (filterUserId) {
            const cloudUserId = await _getCloudUserId(filterUserId);
            if (cloudUserId) query = query.eq('user_id', cloudUserId);
        }
        if (filterChapterId) {
            query = query.eq('chapter_id', filterChapterId);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
            return data.map(e => ({
                ...formatExamRow(e),
                userName: e.profiles ? e.profiles.display_name : '未知',
                userGroup: e.profiles ? e.profiles.group_name : ''
            }));
        }
        return getLocalAllExamRecords(filterUserId, filterChapterId);
    }
    return getLocalAllExamRecords(filterUserId, filterChapterId);
}

// ===== 通知 =====

async function getNotifications(userId) {
    if (isSupabaseReady()) {
        const cloudUserId = await _getCloudUserId(userId);
        if (cloudUserId) {
            const { data, error } = await supabaseClient
                .from('notifications')
                .select('*')
                .eq('user_id', cloudUserId)
                .order('created_at', { ascending: false })
                .limit(50);
            if (!error && data && data.length > 0) {
                return data.map(formatNotificationRow);
            }
        }
        return getLocalNotifications(userId);
    }
    return getLocalNotifications(userId);
}

async function createNotification(userId, type, title, content, relatedId) {
    if (isSupabaseReady()) {
        const cloudUserId = await _getCloudUserId(userId);
        if (cloudUserId) {
            await supabaseClient
                .from('notifications')
                .insert({
                    user_id: cloudUserId,
                    type: type,
                    title: title,
                    content: content,
                    related_id: relatedId || null
                });
        }
    }
    addLocalNotification(userId, type, title, content, relatedId);
}

async function markNotificationsRead(userId) {
    if (isSupabaseReady()) {
        const cloudUserId = await _getCloudUserId(userId);
        if (cloudUserId) {
            await supabaseClient
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', cloudUserId)
                .eq('is_read', false);
        }
    }
    markLocalNotifsRead(userId);
}

// ===== 账号管理 =====

async function getAllUsers(filterGroup) {
    if (isSupabaseReady()) {
        let query = supabaseClient.from('profiles').select('*').order('created_at', { ascending: false });
        if (filterGroup) query = query.eq('group_name', filterGroup);
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
            return data.map(formatUserProfile);
        }
        // fallback
        return getLocalUsers(filterGroup);
    }
    return getLocalUsers(filterGroup);
}

async function createUser(username, password, displayName, role, groupName, createdBy) {
    if (isSupabaseReady()) {
        const passwordHash = await hashPassword(password);
        let cloudCreatedBy = null;
        if (createdBy) {
            cloudCreatedBy = await _getCloudUserId(createdBy);
        }

        const { data, error } = await supabaseClient
            .from('profiles')
            .insert({
                username: username,
                password_hash: passwordHash,
                display_name: displayName,
                avatar_char: displayName.charAt(0),
                role: role,
                group_name: groupName,
                created_by: cloudCreatedBy
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return { success: false, message: '用户名已存在' };
            }
            return { success: false, message: error.message };
        }

        // Also create in local for consistency
        const localResult = createLocalUser(username, password, displayName, role, groupName);

        return { success: true, user: formatUserProfile(data) };
    }
    return createLocalUser(username, password, displayName, role, groupName);
}

async function toggleUserActive(userId, isActive) {
    if (isSupabaseReady()) {
        const cloudUserId = await _getCloudUserId(userId);
        if (cloudUserId) {
            await supabaseClient
                .from('profiles')
                .update({ is_active: isActive, updated_at: new Date().toISOString() })
                .eq('id', cloudUserId);
        }
    }
    return toggleLocalUserActive(userId, isActive);
}

async function deleteUser(userId) {
    if (isSupabaseReady()) {
        const cloudUserId = await _getCloudUserId(userId);
        if (cloudUserId) {
            await supabaseClient
                .from('profiles')
                .delete()
                .eq('id', cloudUserId);
        }
    }
    return deleteLocalUser(userId);
}

// ===== 评估报告 =====

async function getEvaluations(userId, type) {
    if (isSupabaseReady()) {
        // Evaluations are dynamically computed from exam records
        const cloudUserId = await _getCloudUserId(userId);
        if (cloudUserId) {
            const { data: exams, error } = await supabaseClient
                .from('exams')
                .select('*')
                .eq('user_id', cloudUserId)
                .in('status', ['passed', 'failed']);
            if (!error && exams) {
                if (type === 'overall') {
                    if (exams.length === 0) return [];
                    const avgScore = Math.round(exams.reduce((a, e) => a + (e.total_score || 0), 0) / exams.length);
                    return [{
                        id: 'eval_overall_' + userId,
                        userId, type: 'overall',
                        overallScore: avgScore,
                        generatedAt: new Date().toISOString()
                    }];
                }
                return exams.map(e => ({
                    id: 'eval_ch_' + e.chapter_id,
                    userId, type: 'chapter',
                    chapterId: e.chapter_id,
                    overallScore: e.total_score || 0,
                    generatedAt: e.scored_at || e.submit_time
                }));
            }
        }
        return getLocalEvaluations(userId, type);
    }
    return getLocalEvaluations(userId, type);
}

// ===== 学习内容 =====

async function getLearningContent(chapterId) {
    if (isSupabaseReady()) {
        // Check for edited content in Supabase first
        const { data, error } = await supabaseClient
            .from('learning_content')
            .select('*')
            .eq('chapter_id', chapterId)
            .order('sort_order');
        if (!error && data && data.length > 0) {
            return data.map(row => ({
                title: row.title,
                body: row.body
            }));
        }
        // fallback to local
        return getLocalLearningContent(chapterId);
    }
    return getLocalLearningContent(chapterId);
}

// ===== 保存编辑的学习内容到云端 =====
async function saveLearningContent(chapterId, title, body, editedByUserId) {
    if (isSupabaseReady()) {
        const cloudUserId = editedByUserId ? await _getCloudUserId(editedByUserId) : null;

        // Check if content already exists
        const { data: existing } = await supabaseClient
            .from('learning_content')
            .select('id')
            .eq('chapter_id', chapterId)
            .limit(1);

        if (existing && existing.length > 0) {
            await supabaseClient
                .from('learning_content')
                .update({
                    title: title,
                    body: body,
                    updated_by: cloudUserId,
                    updated_at: new Date().toISOString()
                })
                .eq('chapter_id', chapterId);
        } else {
            await supabaseClient
                .from('learning_content')
                .insert({
                    chapter_id: chapterId,
                    title: title,
                    body: body,
                    updated_by: cloudUserId
                });
        }
    }
    // Also save to localStorage
    const editedContents = JSON.parse(localStorage.getItem('sop_editedContents') || '{}');
    editedContents[chapterId] = body;
    localStorage.setItem('sop_editedContents', JSON.stringify(editedContents));
}


// ===== 胜任力人工评分 =====

/**
 * 保存某用户某维度的人工评分
 * @param {string} localUserId - localStorage 中的用户ID
 * @param {string} dimensionKey - 维度key，如 'knowledge'
 * @param {number} score - 0-100
 * @param {string} scoredBy - 评分人ID
 */
async function saveCompetencyManualScore(localUserId, dimensionKey, score, scoredBy) {
    const cloudUserId = await _getCloudUserId(localUserId);
    const cloudScoredBy = await _getCloudUserId(scoredBy);
    
    if (!cloudUserId) {
        console.warn('saveCompetencyManualScore: 找不到云端用户');
        return false;
    }

    try {
        // 检查是否已有该维度的评分
        const { data: existing } = await supabaseClient
            .from('competency_scores')
            .select('id')
            .eq('user_id', cloudUserId)
            .eq('dimension_key', dimensionKey)
            .limit(1);

        if (existing && existing.length > 0) {
            // 更新
            await supabaseClient
                .from('competency_scores')
                .update({
                    score: score,
                    scored_by: cloudScoredBy,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', cloudUserId)
                .eq('dimension_key', dimensionKey);
        } else {
            // 新增
            await supabaseClient
                .from('competency_scores')
                .insert({
                    user_id: cloudUserId,
                    dimension_key: dimensionKey,
                    score: score,
                    scored_by: cloudScoredBy
                });
        }
        return true;
    } catch (e) {
        console.error('saveCompetencyManualScore error:', e);
        return false;
    }
}

/**
 * 获取某用户所有维度的人工评分
 * @param {string} localUserId - localStorage 中的用户ID
 * @returns {Object} { dimensionKey: score, ... }
 */
async function getCompetencyManualScores(localUserId) {
    const cloudUserId = await _getCloudUserId(localUserId);
    if (!cloudUserId) return {};

    try {
        const { data, error } = await supabaseClient
            .from('competency_scores')
            .select('dimension_key, score')
            .eq('user_id', cloudUserId);

        if (error) {
            console.error('getCompetencyManualScores error:', error);
            return {};
        }

        const result = {};
        if (data) {
            data.forEach(row => {
                result[row.dimension_key] = row.score;
            });
        }
        return result;
    } catch (e) {
        console.error('getCompetencyManualScores error:', e);
        return {};
    }
}