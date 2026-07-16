/**
 * SOP Academy - 本地模拟数据层
 * 当 Supabase 未配置时，使用 localStorage 模拟后端数据
 */

// ===== 初始化本地数据 =====
function initLocalData() {
    if (!getStore('initialized')) {
        // 初始化用户
        const users = [
            { id: 'u_admin', username: 'fancy', password: 'admin123', displayName: '妮妮（Fancy）', avatarChar: '妮', role: 'admin', group: null, isActive: true, createdAt: new Date().toISOString() },
            { id: 'u_leader1', username: 'wanglei', password: '123456', displayName: '王磊', avatarChar: '磊', role: 'leader', group: '销售组', isActive: true, createdAt: new Date().toISOString() },
            { id: 'u_leader2', username: 'zhaomin', password: '123456', displayName: '赵敏', avatarChar: '敏', role: 'leader', group: '置换组', isActive: true, createdAt: new Date().toISOString() },
            { id: 'u_emp1', username: 'zhangsan', password: '123456', displayName: '张三', avatarChar: '张', role: 'employee', group: '销售组', isActive: true, createdAt: new Date().toISOString() },
            { id: 'u_emp2', username: 'lisi', password: '123456', displayName: '李四', avatarChar: '李', role: 'employee', group: '销售组', isActive: true, createdAt: new Date().toISOString() },
            { id: 'u_emp3', username: 'wangwu', password: '123456', displayName: '王五', avatarChar: '王', role: 'employee', group: '置换组', isActive: true, createdAt: new Date().toISOString() },
            { id: 'u_emp4', username: 'xiaohong', password: '123456', displayName: '小红', avatarChar: '红', role: 'employee', group: '置换组', isActive: true, createdAt: new Date().toISOString() },
            { id: 'u_emp5', username: 'xiaoming', password: '123456', displayName: '小明', avatarChar: '明', role: 'employee', group: '销售组', isActive: true, createdAt: new Date().toISOString() },
        ];
        setStore('users', users);

        // 初始化学习进度（模拟已有部分进度）
        const progress = [
            { userId: 'u_emp1', chapterId: 1, status: 'completed', progressPct: 100, completedAt: new Date().toISOString() },
            { userId: 'u_emp1', chapterId: 2, status: 'completed', progressPct: 100 },
            { userId: 'u_emp1', chapterId: 3, status: 'completed', progressPct: 100 },
            { userId: 'u_emp1', chapterId: 4, status: 'completed', progressPct: 100 },
            { userId: 'u_emp1', chapterId: 5, status: 'completed', progressPct: 100 },
            { userId: 'u_emp1', chapterId: 6, status: 'in_progress', progressPct: 60 },
            { userId: 'u_emp1', chapterId: 7, status: 'locked', progressPct: 0 },
            { userId: 'u_emp1', chapterId: 8, status: 'locked', progressPct: 0 },
            { userId: 'u_emp1', chapterId: 13, status: 'locked', progressPct: 0 },

            { userId: 'u_emp2', chapterId: 1, status: 'completed', progressPct: 100 },
            { userId: 'u_emp2', chapterId: 2, status: 'completed', progressPct: 100 },
            { userId: 'u_emp2', chapterId: 3, status: 'in_progress', progressPct: 45 },
            { userId: 'u_emp2', chapterId: 4, status: 'locked', progressPct: 0 },
            { userId: 'u_emp2', chapterId: 5, status: 'locked', progressPct: 0 },
            { userId: 'u_emp2', chapterId: 6, status: 'locked', progressPct: 0 },
            { userId: 'u_emp2', chapterId: 7, status: 'locked', progressPct: 0 },
            { userId: 'u_emp2', chapterId: 8, status: 'locked', progressPct: 0 },
            { userId: 'u_emp2', chapterId: 13, status: 'locked', progressPct: 0 },

            { userId: 'u_emp3', chapterId: 1, status: 'completed', progressPct: 100 },
            { userId: 'u_emp3', chapterId: 2, status: 'completed', progressPct: 100 },
            { userId: 'u_emp3', chapterId: 3, status: 'completed', progressPct: 100 },
            { userId: 'u_emp3', chapterId: 9, status: 'completed', progressPct: 100 },
            { userId: 'u_emp3', chapterId: 10, status: 'in_progress', progressPct: 70 },
            { userId: 'u_emp3', chapterId: 11, status: 'locked', progressPct: 0 },
            { userId: 'u_emp3', chapterId: 12, status: 'locked', progressPct: 0 },
            { userId: 'u_emp3', chapterId: 13, status: 'locked', progressPct: 0 },

            { userId: 'u_emp4', chapterId: 1, status: 'in_progress', progressPct: 30 },
            { userId: 'u_emp4', chapterId: 2, status: 'locked', progressPct: 0 },
            { userId: 'u_emp4', chapterId: 3, status: 'locked', progressPct: 0 },
            { userId: 'u_emp4', chapterId: 9, status: 'locked', progressPct: 0 },
            { userId: 'u_emp4', chapterId: 10, status: 'locked', progressPct: 0 },
            { userId: 'u_emp4', chapterId: 11, status: 'locked', progressPct: 0 },
            { userId: 'u_emp4', chapterId: 12, status: 'locked', progressPct: 0 },
            { userId: 'u_emp4', chapterId: 13, status: 'locked', progressPct: 0 },

            { userId: 'u_emp5', chapterId: 1, status: 'completed', progressPct: 100 },
            { userId: 'u_emp5', chapterId: 2, status: 'in_progress', progressPct: 55 },
            { userId: 'u_emp5', chapterId: 3, status: 'locked', progressPct: 0 },
            { userId: 'u_emp5', chapterId: 4, status: 'locked', progressPct: 0 },
            { userId: 'u_emp5', chapterId: 5, status: 'locked', progressPct: 0 },
            { userId: 'u_emp5', chapterId: 6, status: 'locked', progressPct: 0 },
            { userId: 'u_emp5', chapterId: 7, status: 'locked', progressPct: 0 },
            { userId: 'u_emp5', chapterId: 8, status: 'locked', progressPct: 0 },
            { userId: 'u_emp5', chapterId: 13, status: 'locked', progressPct: 0 },
        ];
        setStore('progress', progress);

        // 模拟考试记录
        const exams = [
            { id: 'exam_1', userId: 'u_emp1', chapterId: 1, status: 'passed', autoScore: 60, manualScore: 32, totalScore: 92, startTime: new Date().toISOString(), submitTime: new Date().toISOString(), screenSwitchCount: 0 },
            { id: 'exam_2', userId: 'u_emp1', chapterId: 2, status: 'passed', autoScore: 55, manualScore: 33, totalScore: 88, startTime: new Date().toISOString(), submitTime: new Date().toISOString(), screenSwitchCount: 1 },
            { id: 'exam_3', userId: 'u_emp1', chapterId: 3, status: 'passed', autoScore: 58, manualScore: 30, totalScore: 88, startTime: new Date().toISOString(), submitTime: new Date().toISOString(), screenSwitchCount: 0 },
            { id: 'exam_4', userId: 'u_emp1', chapterId: 4, status: 'passed', autoScore: 52, manualScore: 28, totalScore: 80, startTime: new Date().toISOString(), submitTime: new Date().toISOString(), screenSwitchCount: 0 },
            { id: 'exam_5', userId: 'u_emp1', chapterId: 5, status: 'submitted', autoScore: 50, answers: {}, screenSwitchCount: 0 },
            { id: 'exam_6', userId: 'u_emp2', chapterId: 1, status: 'passed', autoScore: 48, manualScore: 30, totalScore: 78, startTime: new Date().toISOString(), submitTime: new Date().toISOString(), screenSwitchCount: 2 },
            { id: 'exam_7', userId: 'u_emp2', chapterId: 2, status: 'passed', autoScore: 55, manualScore: 35, totalScore: 90, startTime: new Date().toISOString(), submitTime: new Date().toISOString(), screenSwitchCount: 0 },
            { id: 'exam_8', userId: 'u_emp3', chapterId: 1, status: 'passed', autoScore: 60, manualScore: 35, totalScore: 95, startTime: new Date().toISOString(), submitTime: new Date().toISOString(), screenSwitchCount: 0 },
            { id: 'exam_9', userId: 'u_emp3', chapterId: 2, status: 'passed', autoScore: 58, manualScore: 34, totalScore: 92, startTime: new Date().toISOString(), submitTime: new Date().toISOString(), screenSwitchCount: 0 },
            { id: 'exam_10', userId: 'u_emp3', chapterId: 3, status: 'passed', autoScore: 55, manualScore: 30, totalScore: 85, startTime: new Date().toISOString(), submitTime: new Date().toISOString(), screenSwitchCount: 1 },
            { id: 'exam_11', userId: 'u_emp3', chapterId: 9, status: 'submitted', autoScore: 52, answers: {}, screenSwitchCount: 0 },
        ];
        setStore('exams', exams);

        // 初始化通知
        const notifications = [
            { id: 'n1', userId: 'u_leader1', type: 'chapter_completed', title: '组员完成章节学习', content: '张三 已完成「出产维护」的学习', isRead: false, createdAt: new Date().toISOString() },
            { id: 'n2', userId: 'u_admin', type: 'pending_review', title: '有新试卷待评分', content: '张三 的第5章考试已提交，等待评分', isRead: false, createdAt: new Date().toISOString() },
            { id: 'n3', userId: 'u_admin', type: 'pending_review', title: '有新试卷待评分', content: '王五 的第9章考试已提交，等待评分', isRead: false, createdAt: new Date().toISOString() },
            { id: 'n4', userId: 'u_emp1', type: 'exam_scored', title: '考试成绩已出', content: '第5章考试正在评分中', isRead: false, createdAt: new Date().toISOString() },
        ];
        setStore('notifications', notifications);

        // 初始化题库（每章一些示例题目）
        const questions = generateDemoQuestions();
        setStore('questions', questions);

        setStore('initialized', true);
    }
}

// ===== 生成演示题库 =====
function generateDemoQuestions() {
    const questions = [];
    const chapterTopics = {
        1: { name: '留学业务通识', topics: ['公共邮箱管理', '邮件处理规范', '邮箱命名规则', '标签分类'] },
        2: { name: '定校咨询', topics: ['选校策略', '排名参考', '学生需求分析', '方案制定'] },
        3: { name: '材料审核', topics: ['材料清单', '审核标准', '常见问题', '材料补交'] },
        4: { name: '数据接单', topics: ['数据流转', '30分钟触达', '跟进节点', '回访记录'] },
        5: { name: '签约咨询', topics: ['签约流程', '合同条款', '价格谈判', '异议处理'] },
        6: { name: '出产维护', topics: ['出产流程', '进度跟踪', '院校沟通', '异常处理'] },
        7: { name: '机构下单', topics: ['下单流程', '系统操作', '材料准备', '确认环节'] },
        8: { name: '口碑挖掘', topics: ['客户维护', '转介绍', '满意度调查', '口碑营销'] },
        9: { name: '申请填写', topics: ['申请表规范', '个人信息', '教育背景', '文书要求'] },
        10: { name: '系统录入', topics: ['系统操作', '数据录入', '状态更新', '批量处理'] },
        11: { name: '申请接单', topics: ['接单标准', '优先级判定', '时间管理', '资源协调'] },
        12: { name: '申请跟进', topics: ['跟进频率', '状态追踪', '补件处理', '结果通知'] },
        13: { name: '思维模型', topics: ['SWOT分析', 'PDCA循环', '二八法则', 'MECE原则'] },
    };

    for (const [chIdStr, info] of Object.entries(chapterTopics)) {
        const chId = parseInt(chIdStr);
        const topic = info.topics;

        // 单选题 x3
        for (let i = 0; i < 3; i++) {
            questions.push({
                id: `q_${chId}_choice_${i}`,
                chapterId: chId,
                questionType: 'choice_single',
                difficulty: ['easy', 'medium', 'hard'][i],
                questionText: `关于「${info.name}」中的${topic[i % topic.length]}，以下说法正确的是？`,
                options: [
                    { index: 0, text: `选项A：${topic[i % topic.length]}是核心环节，必须严格遵循标准流程` },
                    { index: 1, text: `选项B：${topic[i % topic.length]}可以根据个人习惯灵活处理` },
                    { index: 2, text: `选项C：${topic[i % topic.length]}只需在特殊情况下关注` },
                    { index: 3, text: `选项D：${topic[i % topic.length]}与日常工作关系不大` }
                ],
                answer: { index: 0 },
                score: 10,
                explanation: `${topic[i % topic.length]}是SOP中的关键环节，需要严格按照标准流程执行。`
            });
        }

        // 判断题 x2
        for (let i = 0; i < 2; i++) {
            questions.push({
                id: `q_${chId}_tf_${i}`,
                chapterId: chId,
                questionType: 'true_false',
                difficulty: i === 0 ? 'easy' : 'medium',
                questionText: `在「${info.name}」中，${topic[(i + 1) % topic.length]}的操作必须在规定时间内完成。`,
                options: [
                    { index: 0, text: '正确' },
                    { index: 1, text: '错误' }
                ],
                answer: { index: 0 },
                score: 10,
                explanation: '根据SOP标准流程，各项操作都有明确的时间节点要求。'
            });
        }

        // 填空题 x2
        for (let i = 0; i < 2; i++) {
            questions.push({
                id: `q_${chId}_fill_${i}`,
                chapterId: chId,
                questionType: 'fill_blank',
                difficulty: 'medium',
                questionText: `「${info.name}」中，${topic[i % topic.length]}的关键步骤包括______。`,
                answer: { text: '标准化操作' },
                score: 10,
                explanation: '标准化操作是确保工作质量一致性的核心要求。'
            });
        }

        // 问答题 x1
        questions.push({
            id: `q_${chId}_essay_0`,
            chapterId: chId,
            questionType: 'essay',
            difficulty: 'hard',
            questionText: `请结合「${info.name}」的学习内容，简述${topic[0]}在实际工作中的应用场景和注意事项。`,
            answer: { keywords: [topic[0], '标准化', '流程'] },
            score: 20,
            explanation: ''
        });

        // 实操题 x1
        questions.push({
            id: `q_${chId}_practice_0`,
            chapterId: chId,
            questionType: 'practice',
            difficulty: 'hard',
            questionText: `请根据「${info.name}」中的标准流程，完成一次${topic[0]}的实操演练，并提交操作记录（支持Word文档或文字描述）。`,
            answer: { requirements: '需包含完整操作步骤和结果' },
            score: 20,
            explanation: ''
        });
    }

    return questions;
}

// ===== 模拟登录 =====
function simulateLogin(username, password) {
    const users = getStore('users') || [];
    const user = users.find(u => u.username === username && u.password === password && u.isActive);
    if (!user) return { success: false, message: '用户名或密码错误，或账号已停用' };
    return {
        success: true,
        user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatarChar: user.avatarChar,
            role: user.role,
            group: user.group,
            isActive: user.isActive
        }
    };
}

// ===== 本地进度操作 =====
function getLocalProgress(userId) {
    return (getStore('progress') || []).filter(p => p.userId === userId);
}

function updateLocalProgress(userId, chapterId, status, progressPct) {
    let progress = getStore('progress') || [];
    const idx = progress.findIndex(p => p.userId === userId && p.chapterId === chapterId);
    if (idx >= 0) {
        progress[idx].status = status;
        progress[idx].progressPct = progressPct;
        if (status === 'completed') progress[idx].completedAt = new Date().toISOString();
    } else {
        progress.push({ userId, chapterId, status, progressPct, startedAt: new Date().toISOString() });
    }
    setStore('progress', progress);
    return true;
}

// ===== 本地题库操作 =====
function getLocalQuestions(chapterId) {
    // 使用真实题库（来自exam-questions.js）
    if (typeof EXAM_QUESTIONS !== 'undefined' && EXAM_QUESTIONS[chapterId]) {
        return EXAM_QUESTIONS[chapterId].map(q => ({ ...q, chapterId: chapterId }));
    }
    return (getStore('questions') || []).filter(q => q.chapterId === chapterId);
}

// ===== 本地考试操作 =====
function createLocalExam(userId, chapterId, questionsSnapshot, timeLimit) {
    const exams = getStore('exams') || [];
    const exam = {
        id: generateId(),
        userId, chapterId,
        status: 'in_progress',
        questionsSnapshot,
        timeLimit,
        startTime: new Date().toISOString(),
        screenSwitchCount: 0
    };
    exams.push(exam);
    setStore('exams', exams);
    return exam;
}

function submitLocalExam(examId, answers, screenSwitchCount) {
    const exams = getStore('exams') || [];
    const exam = exams.find(e => e.id === examId);
    if (exam) {
        exam.status = 'submitted';
        exam.answers = answers;
        exam.screenSwitchCount = screenSwitchCount;
        exam.submitTime = new Date().toISOString();
        // 自动评分
        let autoScore = 0;
        if (exam.questionsSnapshot) {
            exam.questionsSnapshot.forEach((q, i) => {
                const ans = answers[i];
                if (q.questionType === 'choice_single' || q.questionType === 'true_false') {
                    if (ans && ans.selected === q.answer.index) autoScore += q.score;
                } else if (q.questionType === 'fill_blank') {
                    if (ans && ans.text && ans.text.trim().toLowerCase() === q.answer.text.toLowerCase()) autoScore += q.score;
                }
            });
        }
        exam.autoScore = autoScore;
        setStore('exams', exams);
    }
    return true;
}

function getLocalExamRecord(userId, chapterId) {
    const exams = getStore('exams') || [];
    return exams.filter(e => e.userId === userId && e.chapterId === chapterId)
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))[0] || null;
}

function getLocalPendingReviews() {
    const exams = getStore('exams') || [];
    const users = getStore('users') || [];
    return exams.filter(e => e.status === 'submitted').map(e => {
        const u = users.find(u => u.id === e.userId);
        return { ...e, userName: u ? u.displayName : '未知', userGroup: u ? u.group : '' };
    });
}

function scoreLocalExam(examId, scores) {
    const exams = getStore('exams') || [];
    const exam = exams.find(e => e.id === examId);
    if (exam) {
        const manualScore = Object.values(scores).reduce((a, b) => a + b, 0);
        const totalScore = (exam.autoScore || 0) + manualScore;
        exam.manualScore = manualScore;
        exam.totalScore = totalScore;
        exam.status = totalScore >= 80 ? 'passed' : 'failed';
        exam.scoredAt = new Date().toISOString();
        setStore('exams', exams);
    }
    return true;
}

function getLocalAllExamRecords(filterUserId, filterChapterId) {
    let exams = getStore('exams') || [];
    const users = getStore('users') || [];
    if (filterUserId) exams = exams.filter(e => e.userId === filterUserId);
    if (filterChapterId) exams = exams.filter(e => e.chapterId === filterChapterId);
    return exams.map(e => {
        const u = users.find(u => u.id === e.userId);
        return { ...e, userName: u ? u.displayName : '未知', userGroup: u ? u.group : '' };
    });
}

// ===== 本地通知操作 =====
function getLocalNotifications(userId) {
    return (getStore('notifications') || []).filter(n => n.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function addLocalNotification(userId, type, title, content) {
    const notifs = getStore('notifications') || [];
    notifs.push({
        id: generateId(),
        userId, type, title, content,
        isRead: false,
        createdAt: new Date().toISOString()
    });
    setStore('notifications', notifs);
}

function markLocalNotifsRead(userId) {
    const notifs = getStore('notifications') || [];
    notifs.forEach(n => { if (n.userId === userId) n.isRead = true; });
    setStore('notifications', notifs);
}

// ===== 本地用户管理 =====
function getLocalUsers(filterGroup) {
    let users = getStore('users') || [];
    if (filterGroup) users = users.filter(u => u.group === filterGroup);
    return users;
}

function createLocalUser(username, password, displayName, role, groupName) {
    const users = getStore('users') || [];
    if (users.find(u => u.username === username)) {
        return { success: false, message: '用户名已存在' };
    }
    const user = {
        id: generateId(),
        username, password, displayName,
        avatarChar: displayName.charAt(0),
        role, group: groupName,
        isActive: true,
        createdAt: new Date().toISOString()
    };
    users.push(user);
    setStore('users', users);

    // 初始化学习进度
    const chapters = getChaptersForGroup(groupName);
    const progress = getStore('progress') || [];
    chapters.forEach((ch, i) => {
        progress.push({
            userId: user.id,
            chapterId: ch.id,
            status: i === 0 ? 'locked' : 'locked',
            progressPct: 0
        });
    });
    // 解锁第一章
    const firstChIdx = progress.findIndex(p => p.userId === user.id && p.chapterId === chapters[0].id);
    if (firstChIdx >= 0) progress[firstChIdx].status = 'in_progress';
    setStore('progress', progress);

    return { success: true, user: { id: user.id, username, displayName, role, group: groupName } };
}

function toggleLocalUserActive(userId, isActive) {
    const users = getStore('users') || [];
    const u = users.find(u => u.id === userId);
    if (u) { u.isActive = isActive; setStore('users', users); }
    return true;
}

function deleteLocalUser(userId) {
    let users = getStore('users') || [];
    users = users.filter(u => u.id !== userId);
    setStore('users', users);
    // 清理相关进度和考试
    let progress = getStore('progress') || [];
    progress = progress.filter(p => p.userId !== userId);
    setStore('progress', progress);
    let exams = getStore('exams') || [];
    exams = exams.filter(e => e.userId !== userId);
    setStore('exams', exams);
    return true;
}

// ===== 本地评估报告 =====
function getLocalEvaluations(userId, type) {
    // 根据考试记录动态生成评估
    const exams = (getStore('exams') || []).filter(e => e.userId === userId && (e.status === 'passed' || e.status === 'scored'));
    if (type === 'overall') {
        if (exams.length === 0) return [];
        const avgScore = Math.round(exams.reduce((a, e) => a + (e.totalScore || 0), 0) / exams.length);
        return [{
            id: 'eval_overall_' + userId,
            userId, type: 'overall',
            overallScore: avgScore,
            generatedAt: new Date().toISOString()
        }];
    }
    return exams.map(e => ({
        id: 'eval_ch_' + e.chapterId,
        userId, type: 'chapter',
        chapterId: e.chapterId,
        overallScore: e.totalScore || 0,
        generatedAt: e.scoredAt || e.submitTime
    }));
}

// ===== 本地学习内容 =====
function getLocalLearningContent(chapterId) {
    // 优先使用 chapter-content.js 中的详细内容
    if (typeof CHAPTER_CONTENTS !== 'undefined' && CHAPTER_CONTENTS[chapterId]) {
        const ch = CHAPTER_CONTENTS[chapterId];
        return [{ title: ch.title + ' - 学习要点', body: ch.body }];
    }
    // 回退到演示内容
    const contents = {
        1: { title: '留学业务通识 - 学习要点', body: getDemoContent(1) },
        2: { title: '定校咨询 - 学习要点', body: getDemoContent(2) },
        3: { title: '材料审核 - 学习要点', body: getDemoContent(3) },
        4: { title: '数据接单 - 学习要点', body: getDemoContent(4) },
        5: { title: '签约咨询 - 学习要点', body: getDemoContent(5) },
        6: { title: '出产维护 - 学习要点', body: getDemoContent(6) },
        7: { title: '机构下单 - 学习要点', body: getDemoContent(7) },
        8: { title: '口碑挖掘 - 学习要点', body: getDemoContent(8) },
        9: { title: '申请填写 - 学习要点', body: getDemoContent(9) },
        10: { title: '系统录入 - 学习要点', body: getDemoContent(10) },
        11: { title: '申请接单 - 学习要点', body: getDemoContent(11) },
        12: { title: '申请跟进 - 学习要点', body: getDemoContent(12) },
        13: { title: '思维模型 - 学习要点', body: getDemoContent(13) },
    };
    const c = contents[chapterId];
    return c ? [c] : [];
}

// 生成每章的演示内容
function getDemoContent(chapterId) {
    const info = {
        1: { title: '留学业务通识', desc: 'B2B工作邮箱SOP和日常工作Check SOP的核心内容', points: ['个人工作邮箱管理', '公共邮箱使用规范', '邮箱命名标准', '标签与文件夹体系', 'Daily Check七大维度'] },
        2: { title: '定校咨询', desc: '定校咨询的标准操作流程与沟通技巧', points: ['选校策略制定', '排名参考体系', '学生需求分析', '方案制定与呈现', '常见异议处理'] },
        3: { title: '材料审核', desc: '申请材料审核的标准与流程', points: ['材料清单核对', '审核标准与红线', '常见材料问题', '补件流程', '归档规范'] },
        4: { title: '数据接单', desc: '从接收有效数据到完成首次触达的标准流程', points: ['数据流转机制', '30分钟内首次触达', '标准跟进节点', '回访记录规范', '数据有效性判定'] },
        5: { title: '签约咨询', desc: '签约转化的标准流程与技巧', points: ['签约前准备', '方案呈现技巧', '价格谈判策略', '合同条款说明', '异议处理话术'] },
        6: { title: '出产维护', desc: '已签约机构的出产跟进与维护', points: ['出产流程概览', '进度跟踪要点', '院校沟通规范', '异常处理预案', '客户满意度维护'] },
        7: { title: '机构下单', desc: '机构下单操作的标准流程', points: ['下单前检查', '系统操作步骤', '材料准备清单', '确认与核对', '异常订单处理'] },
        8: { title: '口碑挖掘', desc: '客户口碑维护与转介绍挖掘', points: ['客户关系维护', '满意度调查方法', '转介绍时机', '口碑营销策略', '案例积累与分享'] },
        9: { title: '申请填写', desc: '留学申请表格填写的标准规范', points: ['申请表基本信息', '教育背景填写', '个人陈述要求', '推荐信准备', '常见填写错误'] },
        10: { title: '系统录入', desc: '申请系统的操作规范与流程', points: ['系统登录与权限', '数据录入规范', '状态更新流程', '批量操作技巧', '数据安全要求'] },
        11: { title: '申请接单', desc: '申请接单的标准操作流程', points: ['接单标准流程', '优先级判定规则', '时间管理方法', '资源协调策略', '跨部门协作'] },
        12: { title: '申请跟进', desc: '申请跟进与状态管理', points: ['跟进频率标准', '状态追踪方法', '补件处理流程', '结果通知规范', '数据更新要求'] },
        13: { title: '思维模型', desc: '工作中常用的思维模型与方法论', points: ['SWOT分析法', 'PDCA循环', '二八法则', 'MECE原则', '金字塔原理'] },
    };

    const d = info[chapterId];
    if (!d) return '# 内容加载中\n\n该章节内容正在准备中...';

    let md = `# ${d.title} - 学习要点\n\n`;
    md += `## 章节概述\n\n${d.desc}\n\n`;
    md += `## 核心要点\n\n`;
    d.points.forEach((p, i) => {
        md += `### ${i + 1}. ${p}\n\n`;
        md += `${p}是该章节的重要组成部分。在实际工作中，需要严格按照SOP标准执行，确保每个环节都做到位。\n\n`;
        md += `**关键要求：**\n\n`;
        md += `- 理解${p}的基本概念和原理\n`;
        md += `- 掌握${p}的操作流程和标准\n`;
        md += `- 能够独立处理${p}相关的常见问题\n`;
        md += `- 注意${p}中的关键红线和注意事项\n\n`;
        if (i < d.points.length - 1) md += `---\n\n`;
    });
    md += `## 本章小结\n\n`;
    md += `掌握以上要点是做好${d.title}相关工作的基础。建议结合实际案例进行练习，确保理论知识能够转化为实际操作能力。\n\n`;
    md += `> 💡 **学习建议**：阅读完学习要点后，建议完成配套练习题以巩固知识点。\n`;

    return md;
}
