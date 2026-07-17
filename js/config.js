/**
 * SOP Academy - 配置文件
 * Supabase连接配置和全局常量
 */

// ===== Supabase 配置 =====
// 部署时需要替换为实际的Supabase项目URL和 anon key
const SUPABASE_CONFIG = {
    url: 'https://ovrvfhyvfeubamxnkqcq.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92cnZmaHl2ZmV1YmFteG5rcWNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyNjY0ODIsImV4cCI6MjA5OTg0MjQ4Mn0.22M7jil7GqUkMXnOH94hqEJyfh4e68Fu611FwDUI-IY'
};

// ===== 全局常量 =====
const APP_CONFIG = {
    name: 'SOP Academy',
    version: 'v2.0',
    subtitle: '智能培训系统',
    defaultPassingScore: 80,
    defaultExamTimeLimit: 30, // 分钟
    antiCheatMaxSwitches: 3,  // 最大切屏次数
};

// ===== 角色定义 =====
const ROLES = {
    ADMIN: 'admin',
    LEADER: 'leader',
    EMPLOYEE: 'employee'
};

// ===== 组别定义 =====
const GROUPS = {
    SALES: '销售组',
    REPLACE: '置换组'
};

// ===== 章节配置 =====
// group_type: 'common'=通用, 'sales'=销售组专用, 'replace'=置换组专用
const CHAPTERS_CONFIG_DEFAULT = [
    { id: 1, order: 1, title: '留学业务通识', groupType: 'common', passingScore: 80, timeLimit: 30 },
    { id: 2, order: 2, title: '定校咨询', groupType: 'common', passingScore: 80, timeLimit: 30 },
    { id: 3, order: 3, title: '材料审核', groupType: 'common', passingScore: 80, timeLimit: 30 },
    { id: 4, order: 4, title: '数据接单', groupType: 'sales', passingScore: 80, timeLimit: 30 },
    { id: 5, order: 5, title: '签约咨询', groupType: 'sales', passingScore: 80, timeLimit: 30 },
    { id: 6, order: 6, title: '出产维护', groupType: 'sales', passingScore: 80, timeLimit: 30 },
    { id: 7, order: 7, title: '机构下单', groupType: 'sales', passingScore: 80, timeLimit: 30 },
    { id: 8, order: 8, title: '口碑挖掘', groupType: 'sales', passingScore: 80, timeLimit: 30 },
    { id: 9, order: 9, title: '申请填写', groupType: 'replace', passingScore: 80, timeLimit: 30 },
    { id: 10, order: 10, title: '系统录入', groupType: 'replace', passingScore: 80, timeLimit: 30 },
    { id: 11, order: 11, title: '申请接单', groupType: 'replace', passingScore: 80, timeLimit: 30 },
    { id: 12, order: 12, title: '申请跟进', groupType: 'replace', passingScore: 80, timeLimit: 30 },
    { id: 13, order: 13, title: '思维模型', groupType: 'common', passingScore: 80, timeLimit: 30 },
];

// 加载保存的章节配置，若无则用默认值
function loadChapterConfig() {
    let saved = null;
    try {
        const v = localStorage.getItem('sop_chapterConfig');
        saved = v ? JSON.parse(v) : null;
    } catch { saved = null; }
    if (saved && Array.isArray(saved) && saved.length === CHAPTERS_CONFIG_DEFAULT.length) {
        saved.forEach((s, i) => {
            CHAPTERS_CONFIG_DEFAULT[i].passingScore = Number(s.passingScore) || 80;
            CHAPTERS_CONFIG_DEFAULT[i].timeLimit = Number(s.timeLimit) || 30;
        });
    }
}
loadChapterConfig();

const CHAPTERS_CONFIG = CHAPTERS_CONFIG_DEFAULT;

// 置换组章节顺序：定校咨询放到申请跟进之后
const REPLACE_GROUP_ORDER = [1, 9, 10, 11, 12, 2, 3, 13];

// 根据组别获取章节列表
function getChaptersForGroup(groupName) {
    const filtered = CHAPTERS_CONFIG.filter(ch => {
        if (ch.groupType === 'common') return true;
        if (groupName === GROUPS.SALES && ch.groupType === 'sales') return true;
        if (groupName === GROUPS.REPLACE && ch.groupType === 'replace') return true;
        return false;
    });
    // 置换组按自定义顺序排列
    if (groupName === GROUPS.REPLACE) {
        filtered.sort((a, b) => REPLACE_GROUP_ORDER.indexOf(a.id) - REPLACE_GROUP_ORDER.indexOf(b.id));
    }
    return filtered;
}

// ===== 题型定义 =====
const QUESTION_TYPES = {
    CHOICE_SINGLE: 'choice_single',
    CHOICE_MULTI: 'choice_multi',
    TRUE_FALSE: 'true_false',
    FILL_BLANK: 'fill_blank',
    ESSAY: 'essay',
    PRACTICE: 'practice'
};

const QUESTION_TYPE_LABELS = {
    choice_single: '单选题',
    choice_multi: '多选题',
    true_false: '判断题',
    fill_blank: '填空题',
    essay: '问答题',
    practice: '实操题'
};

// ===== 考试状态 =====
const EXAM_STATUS = {
    IN_PROGRESS: 'in_progress',
    SUBMITTED: 'submitted',
    SCORED: 'scored',
    PASSED: 'passed',
    FAILED: 'failed'
};

// ===== 胜任力维度（含章节映射与权重） =====
const COMPETENCY_DIMENSIONS = [
    {
        key: 'knowledge', name: '产品知识',
        description: '对行业、院校产品、服务流程的理解深度',
        chapters: [
            { chapterId: 1, weight: 0.5 },  // 留学业务通识
            { chapterId: 2, weight: 0.5 },  // 定校咨询
        ]
    },
    {
        key: 'discovery', name: '需求挖掘',
        description: '分析客户数据、发现潜在需求的能力',
        chapters: [
            { chapterId: 4, weight: 0.5 },  // 数据接单
            { chapterId: 8, weight: 0.3 },  // 口碑挖掘
            { chapterId: 2, weight: 0.2 },  // 定校咨询
        ]
    },
    {
        key: 'communication', name: '沟通表达',
        description: '专业场景下的表达说服力',
        chapters: [
            { chapterId: 5, weight: 0.6 },  // 签约咨询
            { chapterId: 13, weight: 0.4 }, // 思维模型
        ]
    },
    {
        key: 'objection', name: '异议处理',
        description: '应对客户质疑和拒绝的能力',
        chapters: [
            { chapterId: 5, weight: 0.5 },  // 签约咨询
            { chapterId: 13, weight: 0.3 }, // 思维模型
            { chapterId: 8, weight: 0.2 },  // 口碑挖掘
        ]
    },
    {
        key: 'execution', name: '流程执行',
        description: '各环节操作的准确性和规范性',
        chapters: [
            { chapterId: 3, weight: 0.2 },  // 材料审核
            { chapterId: 9, weight: 0.2 },  // 申请填写
            { chapterId: 10, weight: 0.2 }, // 系统录入
            { chapterId: 11, weight: 0.15 },// 申请接单
            { chapterId: 7, weight: 0.15 }, // 机构下单
            { chapterId: 6, weight: 0.1 },  // 出产维护
        ]
    },
    {
        key: 'conversion', name: '跟进转化',
        description: '从签约到持续产出的转化能力',
        chapters: [
            { chapterId: 5, weight: 0.4 },  // 签约咨询
            { chapterId: 12, weight: 0.4 }, // 申请跟进
            { chapterId: 8, weight: 0.2 },  // 口碑挖掘
        ]
    },
];

// ===== 通知类型 =====
const NOTIFICATION_TYPES = {
    CHAPTER_COMPLETED: 'chapter_completed',
    EXAM_SCORED: 'exam_scored',
    PENDING_REVIEW: 'pending_review',
    PROGRESS_BEHIND: 'progress_behind',
    ACCOUNT_CREATED: 'account_created',
    GENERAL: 'general'
};
