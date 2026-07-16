/**
 * SOP Academy - 配置文件
 * Supabase连接配置和全局常量
 */

// ===== Supabase 配置 =====
// 部署时需要替换为实际的Supabase项目URL和 anon key
const SUPABASE_CONFIG = {
    url: 'https://YOUR_PROJECT_ID.supabase.co',
    anonKey: 'YOUR_ANON_KEY'
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
const CHAPTERS_CONFIG = [
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

// 根据组别获取章节列表
function getChaptersForGroup(groupName) {
    return CHAPTERS_CONFIG.filter(ch => {
        if (ch.groupType === 'common') return true;
        if (groupName === GROUPS.SALES && ch.groupType === 'sales') return true;
        if (groupName === GROUPS.REPLACE && ch.groupType === 'replace') return true;
        return false;
    });
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

// ===== 胜任力维度 =====
const COMPETENCY_DIMENSIONS = [
    { key: 'knowledge', name: '专业知识', description: 'SOP知识的掌握程度' },
    { key: 'communication', name: '沟通技巧', description: '客户沟通与表达能力' },
    { key: 'analysis', name: '需求分析', description: '分析和理解客户需求的能力' },
    { key: 'conversion', name: '转化能力', description: '将咨询转化为签约的能力' },
    { key: 'system', name: '系统操作', description: '系统工具的操作熟练度' },
    { key: 'teamwork', name: '团队协作', description: '团队配合与协作能力' },
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
