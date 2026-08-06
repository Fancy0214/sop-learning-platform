-- =====================================================
-- SOP智能学习平台 - Supabase 数据库表结构
-- 数据库：PostgreSQL (Supabase)
-- 创建时间：2025
-- =====================================================

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. 用户表 (profiles)
-- =====================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,          -- 登录用户名
    password_hash TEXT NOT NULL,            -- 密码哈希（使用pgcrypto）
    display_name TEXT NOT NULL,             -- 显示名称
    avatar_char TEXT DEFAULT '',            -- 头像字符
    role TEXT NOT NULL CHECK (role IN ('admin', 'leader', 'employee')),
    group_name TEXT CHECK (group_name IN ('销售组', '置换组')),  -- 组别（管理员可为NULL）
    is_active BOOLEAN DEFAULT TRUE,         -- 是否启用
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    created_by UUID REFERENCES profiles(id)  -- 创建者（管理员创建的账号）
);

-- =====================================================
-- 2. 章节表 (chapters)
-- =====================================================
CREATE TABLE chapters (
    id SERIAL PRIMARY KEY,
    chapter_order INT NOT NULL,             -- 章节序号
    title TEXT NOT NULL,                    -- 章节标题
    description TEXT,                       -- 章节描述
    group_type TEXT NOT NULL CHECK (group_type IN ('common', 'sales', 'replace')),
    -- common=通用, sales=销售组专用, replace=置换组专用
    passing_score INT DEFAULT 80,           -- 及格分数
    exam_time_limit INT DEFAULT 30,         -- 考试限时（分钟）
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. 学习要点内容表 (learning_content)
-- =====================================================
CREATE TABLE learning_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id INT REFERENCES chapters(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('markdown', 'text')),
    title TEXT NOT NULL,                    -- 内容标题
    body TEXT NOT NULL,                     -- 内容正文（Markdown格式）
    sort_order INT DEFAULT 0,              -- 排序
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. 学习资料附件表 (attachments)
-- =====================================================
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id INT REFERENCES chapters(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,                -- 文件名
    file_path TEXT NOT NULL,                -- 存储路径（Supabase Storage）
    file_type TEXT NOT NULL,                -- 文件类型（pdf, video, image等）
    file_size BIGINT DEFAULT 0,            -- 文件大小
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. 题库表 (questions)
-- =====================================================
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id INT REFERENCES chapters(id) ON DELETE CASCADE,
    question_type TEXT NOT NULL CHECK (question_type IN (
        'choice_single',    -- 单选题
        'choice_multi',     -- 多选题
        'true_false',       -- 判断题
        'fill_blank',       -- 填空题
        'essay',            -- 问答题（人工评分）
        'practice'          -- 实操题（人工评分）
    )),
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    question_text TEXT NOT NULL,             -- 题目内容
    options JSONB,                           -- 选项（JSON数组，选择题用）
    answer JSONB NOT NULL,                   -- 正确答案（JSON格式）
    score INT NOT NULL DEFAULT 10,          -- 分值
    explanation TEXT,                        -- 解析
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. 考试试卷表 (exams)
-- 每次考试生成一条记录
-- =====================================================
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    chapter_id INT NOT NULL REFERENCES chapters(id),
    status TEXT DEFAULT 'in_progress' CHECK (status IN (
        'in_progress',      -- 答题中
        'submitted',        -- 已提交（待评分）
        'scored',           -- 已评分
        'passed',           -- 通过
        'failed'            -- 未通过
    )),
    -- 答题数据
    questions_snapshot JSONB NOT NULL,       -- 题目快照（含打乱后的顺序）
    answers JSONB DEFAULT '{}',             -- 用户答案
    -- 评分
    auto_score INT,                          -- 客观题自动评分
    manual_score INT,                        -- 主观题人工评分
    total_score INT,                         -- 总分
    -- 防作弊
    screen_switch_count INT DEFAULT 0,      -- 切屏次数
    start_time TIMESTAMPTZ,                  -- 开始时间
    submit_time TIMESTAMPTZ,                 -- 提交时间
    time_limit INT,                          -- 限时（分钟）
    -- 评分人
    scored_by UUID REFERENCES profiles(id),
    scored_at TIMESTAMPTZ,
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. 答题明细表 (exam_answers)
-- =====================================================
CREATE TABLE exam_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id),
    answer_data JSONB,                       -- 用户作答内容
    is_correct BOOLEAN,                      -- 是否正确（客观题）
    auto_score INT DEFAULT 0,               -- 客观题得分
    manual_score INT,                        -- 主观题得分（人工评分）
    final_score INT DEFAULT 0,              -- 最终得分
    reviewer_comment TEXT,                   -- 评分批注
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. 学习进度表 (learning_progress)
-- =====================================================
CREATE TABLE learning_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    chapter_id INT NOT NULL REFERENCES chapters(id),
    status TEXT DEFAULT 'locked' CHECK (status IN (
        'locked',           -- 未解锁
        'in_progress',      -- 学习中
        'completed'         -- 已完成学习
    )),
    progress_pct INT DEFAULT 0,             -- 学习进度百分比
    last_position TEXT,                      -- 上次阅读位置
    time_spent INT DEFAULT 0,               -- 累计学习时间（秒）
    completed_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, chapter_id)
);

-- =====================================================
-- 9. 通知表 (notifications)
-- =====================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id),  -- 接收者
    type TEXT NOT NULL CHECK (type IN (
        'chapter_completed',     -- 员工完成章节学习
        'exam_scored',          -- 员工考试出分
        'pending_review',       -- 有新试卷待评分
        'progress_behind',      -- 学习进度落后
        'account_created',      -- 账号已创建
        'general'               -- 通用通知
    )),
    title TEXT NOT NULL,                     -- 通知标题
    content TEXT,                            -- 通知内容
    related_id UUID,                         -- 关联ID（考试ID等）
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 10. 评估报告表 (evaluations)
-- =====================================================
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    type TEXT NOT NULL CHECK (type IN ('chapter', 'overall')),
    -- chapter=章节评估, overall=整体评估
    chapter_id INT REFERENCES chapters(id),  -- 章节评估时关联章节
    overall_score INT,                       -- 综合评分
    competency_data JSONB,                   -- 胜任力维度分析数据
    recommendation TEXT,                     -- 建议（是否匹配岗位/是否建议转正）
    report_data JSONB,                       -- 完整报告数据（用于PDF导出）
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 索引优化
-- =====================================================
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_group ON profiles(group_name);
CREATE INDEX idx_profiles_active ON profiles(is_active);

CREATE INDEX idx_chapters_group ON chapters(group_type);
CREATE INDEX idx_chapters_order ON chapters(chapter_order);

CREATE INDEX idx_questions_chapter ON questions(chapter_id);
CREATE INDEX idx_questions_type ON questions(question_type);
CREATE INDEX idx_questions_active ON questions(is_active);

CREATE INDEX idx_exams_user ON exams(user_id);
CREATE INDEX idx_exams_chapter ON exams(chapter_id);
CREATE INDEX idx_exams_status ON exams(status);

CREATE INDEX idx_exam_answers_exam ON exam_answers(exam_id);
CREATE INDEX idx_exam_answers_question ON exam_answers(question_id);

CREATE INDEX idx_progress_user ON learning_progress(user_id);
CREATE INDEX idx_progress_chapter ON learning_progress(chapter_id);
CREATE INDEX idx_progress_status ON learning_progress(status);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

CREATE INDEX idx_evaluations_user ON evaluations(user_id);
CREATE INDEX idx_evaluations_type ON evaluations(type);

-- =====================================================
-- RLS (Row Level Security) 策略
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- 所有用户都可以读取自己的profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- 管理员可以管理所有profiles
CREATE POLICY "Admin full access profiles" ON profiles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 章节：所有人可读（已激活的）
CREATE POLICY "Anyone can read active chapters" ON chapters
    FOR SELECT USING (is_active = TRUE);

-- 学习进度：用户可读写自己的进度
CREATE POLICY "Users can manage own progress" ON learning_progress
    FOR ALL USING (user_id = auth.uid());

-- 管理员/组长可查看组内进度
CREATE POLICY "Leaders can view group progress" ON learning_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'leader')
            AND (p.role = 'admin' OR p.group_name = (
                SELECT group_name FROM profiles WHERE id = learning_progress.user_id
            ))
        )
    );

-- 考试：用户可读写自己的考试
CREATE POLICY "Users can manage own exams" ON exams
    FOR ALL USING (user_id = auth.uid());

-- 管理员可以查看所有考试
CREATE POLICY "Admin can view all exams" ON exams
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 通知：用户只能看自己的通知
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

-- 评估报告：用户可看自己的
CREATE POLICY "Users can view own evaluations" ON evaluations
    FOR SELECT USING (user_id = auth.uid());

-- =====================================================
-- 函数：自动评分（客观题）
-- =====================================================
CREATE OR REPLACE FUNCTION auto_score_exam(p_exam_id UUID)
RETURNS INT AS $$
DECLARE
    v_total INT := 0;
BEGIN
    -- 更新每道客观题的得分
    UPDATE exam_answers ea
    SET is_correct = CASE
            WHEN q.question_type IN ('choice_single', 'true_false')
                THEN (ea.answer_data->>'selected')::INT = (q.answer->>'index')::INT
            WHEN q.question_type = 'choice_multi'
                THEN ea.answer_data->'selected' = q.answer->'indices'
            WHEN q.question_type = 'fill_blank'
                THEN LOWER(TRIM(ea.answer_data->>'text')) = LOWER(TRIM(q.answer->>'text'))
            ELSE NULL
        END,
        auto_score = CASE
            WHEN q.question_type IN ('choice_single', 'true_false')
                THEN CASE WHEN (ea.answer_data->>'selected')::INT = (q.answer->>'index')::INT THEN q.score ELSE 0 END
            WHEN q.question_type = 'fill_blank'
                THEN CASE WHEN LOWER(TRIM(ea.answer_data->>'text')) = LOWER(TRIM(q.answer->>'text')) THEN q.score ELSE 0 END
            ELSE 0
        END,
        final_score = CASE
            WHEN q.question_type IN ('choice_single', 'true_false', 'fill_blank')
                THEN CASE
                    WHEN q.question_type IN ('choice_single', 'true_false') AND (ea.answer_data->>'selected')::INT = (q.answer->>'index')::INT THEN q.score
                    WHEN q.question_type = 'fill_blank' AND LOWER(TRIM(ea.answer_data->>'text')) = LOWER(TRIM(q.answer->>'text')) THEN q.score
                    ELSE 0
                END
            ELSE 0
        END
    FROM questions q
    WHERE ea.exam_id = p_exam_id AND ea.question_id = q.id;

    -- 计算客观题总分
    SELECT COALESCE(SUM(auto_score), 0) INTO v_total
    FROM exam_answers WHERE exam_id = p_exam_id AND auto_score IS NOT NULL;

    -- 更新考试表的auto_score
    UPDATE exams SET auto_score = v_total, updated_at = NOW() WHERE id = p_exam_id;

    RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 函数：检查并发送通知
-- =====================================================
CREATE OR REPLACE FUNCTION notify_group_leader(p_user_id UUID, p_chapter_id INT)
RETURNS VOID AS $$
DECLARE
    v_user_name TEXT;
    v_chapter_title TEXT;
    v_leader_ids UUID[];
BEGIN
    -- 获取用户信息和章节信息
    SELECT display_name INTO v_user_name FROM profiles WHERE id = p_user_id;
    SELECT title INTO v_chapter_title FROM chapters WHERE id = p_chapter_id;

    -- 获取同组组长ID列表
    SELECT ARRAY_AGG(id) INTO v_leader_ids
    FROM profiles
    WHERE role = 'leader'
    AND group_name = (SELECT group_name FROM profiles WHERE id = p_user_id);

    -- 发送通知给组长
    IF v_leader_ids IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, content)
        SELECT unnest(v_leader_ids), 'chapter_completed',
            '组员完成章节学习',
            v_user_name || ' 已完成 「' || v_chapter_title || '」 的学习';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 初始数据：默认章节
-- =====================================================
INSERT INTO chapters (chapter_order, title, description, group_type, passing_score, exam_time_limit) VALUES
-- 通用章节
(1, '留学业务通识', 'B2B工作邮箱SOP和日常工作Check SOP的核心内容', 'common', 80, 30),
(2, '定校咨询', '定校咨询的标准操作流程与沟通技巧', 'common', 80, 30),
(3, '材料审核', '申请材料审核的标准与流程', 'common', 80, 30),

-- 销售组专用章节
(4, '数据接单', '从接收有效数据到完成首次触达的标准流程', 'sales', 80, 30),
(5, '签约咨询', '签约转化的标准流程与技巧', 'sales', 80, 30),
(6, '出产维护', '已签约机构的出产跟进与维护', 'sales', 80, 30),
(7, '机构下单', '机构下单操作的标准流程', 'sales', 80, 30),
(8, '口碑挖掘', '客户口碑维护与转介绍挖掘', 'sales', 80, 30),

-- 置换组专用章节
(9, '申请填写', '留学申请表格填写的标准规范', 'replace', 80, 30),
(10, '系统录入', '申请系统的操作规范与流程', 'replace', 80, 30),
(11, '申请接单', '申请接单的标准操作流程', 'replace', 80, 30),
(12, '申请跟进', '申请跟进与状态管理', 'replace', 80, 30),

-- 思维模型（通用，放在最后）
(13, '思维模型', '工作中常用的思维模型与方法论', 'common', 80, 30);

-- =====================================================
-- 初始数据：管理员账号
-- 默认密码: admin123（实际部署时需修改）
-- 注意：密码哈希需要在应用层生成，这里用占位符
-- =====================================================
INSERT INTO profiles (username, password_hash, display_name, avatar_char, role)
VALUES ('fancy', '$2b$10$placeholder_hash_for_initial_setup', '妮妮（Fancy）', '妮', 'admin');

-- =====================================================
-- Supabase Storage Buckets
-- 需要在Supabase控制台手动创建或通过API创建：
-- 1. "learning-materials" - 学习资料存储
-- 2. "exam-submissions" - 考试提交附件（Word等）
-- 3. "evaluation-exports" - 评估报告导出
-- =====================================================

-- Storage bucket创建（需要在Supabase Dashboard或通过SQL执行）
-- INSERT INTO storage.buckets (id, name, public) VALUES ('learning-materials', 'learning-materials', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('exam-submissions', 'exam-submissions', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('evaluation-exports', 'evaluation-exports', false);
