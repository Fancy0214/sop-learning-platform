/**
 * SOP Academy - 本地模拟数据层
 * 当 Supabase 未配置时，使用 localStorage 模拟后端数据
 */

// ===== 初始化本地数据 =====
function initLocalData() {
    // Supabase 模式下：只确保管理员账号存在，不同步其他演示账号
    // localStorage 模式下：保留所有演示数据
    const useSupabase = isSupabaseReady();

    if (!getStore('initialized')) {
        // 首次初始化
        if (useSupabase) {
            // Supabase 模式：只在 localStorage 存管理员账号作为 fallback
            const users = [
                { id: 'u_admin', username: 'fancy', password: 'admin123', displayName: '妮妮（Fancy）', avatarChar: '妮', role: 'admin', group: null, isActive: true, createdAt: new Date().toISOString() },
            ];
            setStore('users', users);
        } else {
            // localStorage 模式：初始化全部演示数据
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
        }

        // 初始化学习进度（模拟已有部分进度）
        const progress = [
            { userId: 'u_emp1', chapterId: 1, status: 'completed', progressPct: 100, completedAt: new Date().toISOString() },
            { userId: 'u_emp1', chapterId: 2, status: 'completed', progressPct: 100 },
            { userId: 'u_emp1', chapterId: 3, status: 'completed', progressPct: 100 },
            { userId: 'u_emp1', chapterId: 4, status: 'completed', progressPct: 100 },
            { userId: 'u_emp1', chapterId: 5, status: 'completed', progressPct: 100 },
            { userId: 'u_emp1', chapterId: 6, status: 'in_progress', progressPct: 60 },
            { userId: 'u_emp1', chapterId: 7, status: 'in_progress', progressPct: 0 },
            { userId: 'u_emp1', chapterId: 8, status: 'in_progress', progressPct: 0 },
            { userId: 'u_emp1', chapterId: 13, status: 'in_progress', progressPct: 0 },

            { userId: 'u_emp2', chapterId: 1, status: 'completed', progressPct: 100 },
            { userId: 'u_emp2', chapterId: 2, status: 'completed', progressPct: 100 },
            { userId: 'u_emp2', chapterId: 3, status: 'in_progress', progressPct: 45 },
            { userId: 'u_emp2', chapterId: 4, status: 'in_progress', progressPct: 0 },
            { userId: 'u_emp2', chapterId: 5, status: 'in_progress', progressPct: 0 },
            { userId: 'u_emp2', chapterId: 6, status: 'in_progress', progressPct: 0 },
            { userId: 'u_emp2', chapterId: 7, status: 'in_progress', progressPct: 0 },
            { userId: 'u_emp2', chapterId: 8, status: 'in_progress', progressPct: 0 },
            { userId: 'u_emp2', chapterId: 13, status: 'in_progress', progressPct: 0 },

            { userId: 'u_emp3', chapterId: 1, status: 'completed', progressPct: 100 },
            { userId: 'u_emp3', chapterId: 2, status: 'completed', progressPct: 100 },
            { userId: 'u_emp3', chapterId: 3, status: 'completed', progressPct: 100 },
            { userId: 'u_emp3', chapterId: 9, status: 'completed', progressPct: 100 },
            { userId: 'u_emp3', chapterId: 10, status: 'in_progress', progressPct: 70 },
            { userId: 'u_emp3', chapterId: 11, status: 'in_progress', progressPct: 0 },
            { userId: 'u_emp3', chapterId: 12, status: 'in_progress', progressPct: 0 },
            { userId: 'u_emp3', chapterId: 13, status: 'in_progress', progressPct: 0 },

            { userId: 'u_emp4', chapterId: 1, status: 'in_progress', progressPct: 30 },
            { userId: 'u_emp4', chapterId: 2, status: 'in_progress', progressPct: 0 },
            { userId: 'u_emp4', chapterId: 3, status: 'in_progress', progressPct: 0 },
            { userId: 'u_emp4', chapterId: 9, status: 'in_progress', progressPct: 0 },
            { userId: 'u_emp4', chapterId: 10, status: 'in_progress', progressPct: 0 },
            { userId: 'u_emp4', chapterId: 11, status: 'in_progress', progressPct: 0 },
            { userId: 'u_emp4', chapterId: 12, status: 'in_progress', progressPct: 0 },
            { userId: 'u_emp4', chapterId: 13, status: 'in_progress', progressPct: 0 },

            { userId: 'u_emp5', chapterId: 1, status: 'completed', progressPct: 100 },
            { userId: 'u_emp5', chapterId: 2, status: 'in_progress', progressPct: 55 },
            { userId: 'u_emp5', chapterId: 3, status: 'in_progress', progressPct: 0 },
            { userId: 'u_emp5', chapterId: 4, status: 'in_progress', progressPct: 0 },
            { userId: 'u_emp5', chapterId: 5, status: 'in_progress', progressPct: 0 },
            { userId: 'u_emp5', chapterId: 6, status: 'in_progress', progressPct: 0 },
            { userId: 'u_emp5', chapterId: 7, status: 'in_progress', progressPct: 0 },
            { userId: 'u_emp5', chapterId: 8, status: 'in_progress', progressPct: 0 },
            { userId: 'u_emp5', chapterId: 13, status: 'in_progress', progressPct: 0 },
        ];
        setStore('progress', progress);

        // 模拟考试记录
        const exams = [
            { id: 'exam_1', userId: 'u_emp1', chapterId: 1, status: 'passed', autoScore: 60, manualScore: 32, totalScore: 92, startTime: new Date().toISOString(), submitTime: new Date().toISOString(), screenSwitchCount: 0 },
            { id: 'exam_2', userId: 'u_emp1', chapterId: 2, status: 'passed', autoScore: 55, manualScore: 33, totalScore: 88, startTime: new Date().toISOString(), submitTime: new Date().toISOString(), screenSwitchCount: 1 },
            { id: 'exam_3', userId: 'u_emp1', chapterId: 3, status: 'passed', autoScore: 58, manualScore: 30, totalScore: 88, startTime: new Date().toISOString(), submitTime: new Date().toISOString(), screenSwitchCount: 0 },
            { id: 'exam_4', userId: 'u_emp1', chapterId: 4, status: 'passed', autoScore: 52, manualScore: 28, totalScore: 80, startTime: new Date().toISOString(), submitTime: new Date().toISOString(), screenSwitchCount: 0 },
            { id: 'exam_5', userId: 'u_emp1', chapterId: 5, status: 'submitted', autoScore: 50, answers: {"0": {"selected": "D"}, "1": {"selected": "B"}, "2": {"selected": ["A", "B", "C"]}, "3": {"selected": "B"}, "4": {"text": "\u4e0d\u786e\u5b9a\u7684\u4fe1\u606f"}, "5": {"text": "\u7b7e\u7ea6\u54a8\u8be2\u6807\u51c6\u6d41\u7a0b\uff1a\n1. \u63a5\u901a\u7535\u8bdd\u540e\u9996\u5148\u793c\u8c8c\u95ee\u5019\uff0c\u81ea\u62a5\u516c\u53f8\u548c\u4e2a\u4eba\u59d3\u540d\n2. \u4e3b\u52a8\u8be2\u95ee\u5b66\u751f\u7684\u57fa\u672c\u60c5\u51b5\u548c\u7533\u8bf7\u9700\u6c42\n3. \u6839\u636e\u5b66\u751f\u80cc\u666f\u8fdb\u884c\u65b9\u6848\u63a8\u8350\uff0c\u8bf4\u660e\u4f18\u52bf\u548c\u6210\u529f\u7387\n4. \u5904\u7406\u5b66\u751f\u63d0\u51fa\u7684\u7591\u95ee\u548c\u5f02\u8bae\n5. \u786e\u8ba4\u4e0b\u4e00\u6b65\u5b89\u6392\uff08\u5982\u53d1\u9001\u65b9\u6848\u3001\u5b89\u6392\u9762\u8c08\u7b49\uff09\n6. \u793c\u8c8c\u7ed3\u675f\u901a\u8bdd\u5e76\u8bb0\u5f55\u5173\u952e\u4fe1\u606f"}, "6": {"text": "\u6a21\u62df\u5bf9\u8bdd\u8bb0\u5f55\uff1a\n\n\u987e\u95ee\uff1a\u60a8\u597d\uff0c\u8fd9\u91cc\u662fXX\u7559\u5b66\u54a8\u8be2\uff0c\u6211\u662f\u987e\u95ee\u5c0f\u674e\uff0c\u8bf7\u95ee\u6709\u4ec0\u4e48\u53ef\u4ee5\u5e2e\u60a8\u7684\uff1f\n\u5b66\u751f\uff1a\u60a8\u597d\uff0c\u6211\u60f3\u54a8\u8be2\u4e00\u4e0b\u82f1\u56fd\u7855\u58eb\u7533\u8bf7\u3002\n\u987e\u95ee\uff1a\u597d\u7684\uff0c\u8bf7\u95ee\u60a8\u76ee\u524d\u7684\u5b66\u672f\u80cc\u666f\u662f\u600e\u6837\u7684\uff1f\u672c\u79d1\u5c31\u8bfb\u9662\u6821\u548c\u4e13\u4e1a\u662f\u4ec0\u4e48\uff1f\n\u5b66\u751f\uff1a\u6211\u5728XX\u5927\u5b66\u8bfb\u8ba1\u7b97\u673a\u79d1\u5b66\uff0cGPA\u5927\u69823.5\u3002\n\u987e\u95ee\uff1a\u5f88\u597d\u7684\u80cc\u666f\uff01\u6839\u636e\u60a8\u7684\u60c5\u51b5\uff0c\u6211\u5efa\u8bae\u7533\u8bf7G5\u9662\u6821\u7684CS\u76f8\u5173\u4e13\u4e1a...\n\uff08\u7ee7\u7eed\u5bf9\u8bdd\u8bb0\u5f55\uff09\n\n\u5ba2\u6237\u5173\u952e\u4fe1\u606f\uff1a\n- \u59d3\u540d\uff1a\u5f20\u4e09\n- \u80cc\u666f\u9662\u6821\uff1aXX\u5927\u5b66\n- \u4e13\u4e1a\uff1a\u8ba1\u7b97\u673a\u79d1\u5b66\n- GPA\uff1a3.5\n- \u610f\u5411\uff1a\u82f1\u56fd\u7855\u58eb\n- \u76ee\u6807\u9662\u6821\uff1aG5"}}, questionsSnapshot: [{"questionType": "choice_single", "questionText": "咨询四大提倡不包括以下哪项？", "score": 10, "options": [{"index": 0, "text": "A. 提倡使用内线电话"}, {"index": 1, "text": "B. 提倡使用企业微信"}, {"index": 2, "text": "C. 提倡录音"}, {"index": 3, "text": "D. 提倡手机接电话"}], "answer": {"index": 3}}, {"questionType": "choice_single", "questionText": "电话铃响后应在几声内接听？", "score": 10, "options": [{"index": 0, "text": "A. 一声"}, {"index": 1, "text": "B. 三声"}, {"index": 2, "text": "C. 五声"}, {"index": 3, "text": "D. 十声"}], "answer": {"index": 1}}, {"questionType": "choice_multi", "questionText": "以下哪些属于咨询中的低级错误？", "score": 10, "options": [{"index": 0, "text": "A. 接电话未及时记录"}, {"index": 1, "text": "B. 信息记录错误"}, {"index": 2, "text": "C. 未及时跟进"}, {"index": 3, "text": "D. 回复超时"}], "answer": {"indices": [0, 1, 2]}}, {"questionType": "true_false", "questionText": "代接电话时可以让客户在线等待超过30秒。", "score": 10, "options": [{"index": 0, "text": "正确"}, {"index": 1, "text": "错误"}], "answer": {"index": 1}}, {"questionType": "fill_blank", "questionText": "1个No+2个Yes框架中，No代表____。", "score": 10, "answer": {"text": "不确定的信息"}}, {"questionType": "essay", "questionText": "请简述签约咨询的标准流程（从接通电话到结束通话）。", "score": 20, "answer": {"keywords": ["问候→了解需求→方案介绍→确认意向→安排下一步"]}}, {"questionType": "practice", "questionText": "模拟一通签约咨询电话，请写出完整的对话记录和客户关键信息。", "score": 30, "answer": {"requirements": "需包含问候、需求了解、方案推荐、异议处理、结束语。"}}], screenSwitchCount: 0 },
            { id: 'exam_6', userId: 'u_emp2', chapterId: 1, status: 'passed', autoScore: 48, manualScore: 30, totalScore: 78, startTime: new Date().toISOString(), submitTime: new Date().toISOString(), screenSwitchCount: 2 },
            { id: 'exam_7', userId: 'u_emp2', chapterId: 2, status: 'passed', autoScore: 55, manualScore: 35, totalScore: 90, startTime: new Date().toISOString(), submitTime: new Date().toISOString(), screenSwitchCount: 0 },
            { id: 'exam_8', userId: 'u_emp3', chapterId: 1, status: 'passed', autoScore: 60, manualScore: 35, totalScore: 95, startTime: new Date().toISOString(), submitTime: new Date().toISOString(), screenSwitchCount: 0 },
            { id: 'exam_9', userId: 'u_emp3', chapterId: 2, status: 'passed', autoScore: 58, manualScore: 34, totalScore: 92, startTime: new Date().toISOString(), submitTime: new Date().toISOString(), screenSwitchCount: 0 },
            { id: 'exam_10', userId: 'u_emp3', chapterId: 3, status: 'passed', autoScore: 55, manualScore: 30, totalScore: 85, startTime: new Date().toISOString(), submitTime: new Date().toISOString(), screenSwitchCount: 1 },
            { id: 'exam_11', userId: 'u_emp3', chapterId: 9, status: 'submitted', autoScore: 52, answers: {"0": {"selected": "D"}, "1": {"selected": "B"}, "2": {"selected": "A"}, "3": {"text": "\u4e09"}, "4": {"text": "\u5e38\u89c1\u6613\u9519\u5b57\u6bb5\uff1a\n1. \u59d3\u540d\u62fc\u5199 - \u5fc5\u987b\u4e0e\u62a4\u7167\u5b8c\u5168\u4e00\u81f4\uff0c\u6ce8\u610f\u5927\u5c0f\u5199\u548c\u7a7a\u683c\n2. \u51fa\u751f\u65e5\u671f - \u6ce8\u610f\u65e5\u6708\u5e74\u987a\u5e8f\uff0c\u82f1\u5f0fDD/MM/YYYY\n3. \u72af\u7f6a\u8bb0\u5f55 - \u5982\u5b9e\u586b\u5199\uff0c\u4e0d\u80fd\u968f\u610f\u586bNo\uff0c\u6709\u8bb0\u5f55\u9700\u8be6\u7ec6\u8bf4\u660e"}, "5": {"text": "\u7f51\u7533\u586b\u5199\u8bb0\u5f55\uff1a\n\n\u3010\u4e2a\u4eba\u4fe1\u606f\u3011\n\u59d3\u540d\uff1a\u674e\u56db\uff08\u62a4\u7167\u62fc\u97f3\uff09\n\u6027\u522b\uff1a\u7537\n\u51fa\u751f\u65e5\u671f\uff1a15/03/2000\n\u56fd\u7c4d\uff1a\u4e2d\u56fd\n\n\u3010\u6559\u80b2\u80cc\u666f\u3011\n\u672c\u79d1\u9662\u6821\uff1aXX\u5927\u5b66\n\u4e13\u4e1a\uff1a\u8f6f\u4ef6\u5de5\u7a0b\nGPA\uff1a3.7/4.0\n\u9884\u8ba1\u6bd5\u4e1a\uff1a2024\u5e747\u6708\n\n\u3010\u8bed\u8a00\u6210\u7ee9\u3011\nIELTS\uff1a7.0\uff08\u5404\u9879\u4e0d\u4f4e\u4e8e6.5\uff09\n\n\u3010\u7533\u8bf7\u4e13\u4e1a\u3011\n\u7b2c\u4e00\u5fd7\u613f\uff1aComputer Science MSc\n\u7b2c\u4e8c\u5fd7\u613f\uff1aSoftware Engineering MSc"}}, questionsSnapshot: [{"questionType": "choice_single", "questionText": "网申系统中Miss代表什么？", "score": 10, "options": [{"index": 0, "text": "A. 先生"}, {"index": 1, "text": "B. 女士"}, {"index": 2, "text": "C. 未知性别"}, {"index": 3, "text": "D. 未婚女性"}], "answer": {"index": 3}}, {"questionType": "choice_single", "questionText": "First Name代表什么？", "score": 10, "options": [{"index": 0, "text": "A. 姓"}, {"index": 1, "text": "B. 名"}, {"index": 2, "text": "C. 中间名"}, {"index": 3, "text": "D. 全名"}], "answer": {"index": 1}}, {"questionType": "true_false", "questionText": "犯罪记录字段必须如实填写，不能随意填No。", "score": 10, "options": [{"index": 0, "text": "正确"}, {"index": 1, "text": "错误"}], "answer": {"index": 0}}, {"questionType": "fill_blank", "questionText": "网申递交后需进行____次复核。", "score": 10, "answer": {"text": "三"}}, {"questionType": "essay", "questionText": "请说明网申填写中常见的3个容易出错的字段及正确填写方式。", "score": 20, "answer": {"keywords": ["姓名拼写、出生日期、犯罪记录、联系方式"]}}, {"questionType": "practice", "questionText": "请根据提供的学生信息，完成一份完整的网申填写记录。", "score": 30, "answer": {"requirements": "需包含个人信息、教育背景、语言成绩、申请专业等。"}}], screenSwitchCount: 0 },
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

// 获取全部真实题库（跨章节）
function getAllExamQuestions() {
    if (typeof EXAM_QUESTIONS === 'undefined') return [];
    const all = [];
    for (let ch = 1; ch <= 13; ch++) {
        if (EXAM_QUESTIONS[ch]) {
            EXAM_QUESTIONS[ch].forEach(q => all.push({ ...q, chapterId: ch }));
        }
    }
    return all;
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
        exam.answers = answers;
        exam.screenSwitchCount = screenSwitchCount;
        exam.submitTime = new Date().toISOString();
        // 自动评分（客观题）
        let autoScore = 0;
        let hasSubjective = false;
        if (exam.questionsSnapshot) {
            exam.questionsSnapshot.forEach((q, i) => {
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
        exam.autoScore = autoScore;

        if (hasSubjective) {
            // 有主观题 → 待人工评分
            exam.status = 'submitted';
        } else {
            // 全是客观题 → 直接出总分和结果
            const chapters = (typeof CHAPTERS_CONFIG !== 'undefined' ? CHAPTERS_CONFIG : []);
            const chapter = chapters.find(ch => ch.id === exam.chapterId);
            const passingScore = chapter ? chapter.passingScore : 80;
            const totalScore = autoScore;
            exam.manualScore = 0;
            exam.totalScore = totalScore;
            exam.status = totalScore >= passingScore ? 'passed' : 'failed';
            exam.scoredAt = new Date().toISOString();
        }
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
            status: 'in_progress',
            progressPct: 0
        });
    });
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
    // 优先使用用户编辑后保存到 localStorage 的内容
    const editedContents = JSON.parse(localStorage.getItem('sop_editedContents') || '{}');
    if (editedContents[chapterId]) {
        const title = (typeof CHAPTER_CONTENTS !== 'undefined' && CHAPTER_CONTENTS[chapterId])
            ? CHAPTER_CONTENTS[chapterId].title + ' - 学习要点'
            : '第' + chapterId + '章 - 学习要点';
        return [{ title: title, body: editedContents[chapterId] }];
    }
    // 其次使用 chapter-content.js 中的详细内容
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

// ===== 获取全量真实题库（用于管理面板统计） =====
function getAllExamQuestions() {
    if (typeof EXAM_QUESTIONS === 'undefined') return [];
    const all = [];
    for (const [chId, questions] of Object.entries(EXAM_QUESTIONS)) {
        const chapterId = parseInt(chId);
        questions.forEach(q => {
            all.push({ ...q, chapterId });
        });
    }
    return all;
}
