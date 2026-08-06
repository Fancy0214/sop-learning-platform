# SOP Academy - 部署指南

## 一、快速开始（本地预览）

### 1. 直接打开
双击 `index.html` 即可在浏览器中预览（使用本地模拟数据模式）。

### 2. 本地服务器（推荐）
```bash
# 使用 Python
cd sop-platform
python3 -m http.server 8080

# 或使用 Node.js
npx serve .
```
然后访问 `http://localhost:8080`

### 演示账号
| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | fancy | admin123 |
| 组长(销售) | wanglei | 123456 |
| 组长(置换) | zhaomin | 123456 |
| 员工(销售) | zhangsan | 123456 |
| 员工(销售) | lisi | 123456 |
| 员工(置换) | wangwu | 123456 |
| 员工(置换) | xiaohong | 123456 |

---

## 二、正式部署（GitHub Pages + Supabase）

### 第一步：创建 Supabase 项目

1. 访问 https://supabase.com 注册/登录
2. 点击 "New Project" 创建项目
3. 设置项目名称、数据库密码、区域
4. 等待项目初始化完成

### 第二步：初始化数据库

1. 在 Supabase Dashboard 中，进入 **SQL Editor**
2. 将 `supabase-schema.sql` 的内容粘贴到编辑器中
3. 点击 **Run** 执行
4. 创建存储桶（Storage）：
   - 进入 **Storage** 页面
   - 创建名为 `learning-materials` 的私有桶
   - 创建名为 `exam-submissions` 的私有桶

### 第三步：获取 API 密钥

1. 在 Supabase Dashboard 中，进入 **Settings > API**
2. 复制以下信息：
   - **Project URL**（形如 `https://xxxxx.supabase.co`）
   - **anon public key**（公开的API密钥）

### 第四步：配置前端

1. 打开 `js/config.js`
2. 修改以下配置：
```javascript
const SUPABASE_CONFIG = {
    url: 'https://你的项目ID.supabase.co',  // 替换为实际URL
    anonKey: '你的anon_key'                   // 替换为实际Key
};
```

### 第五步：创建管理员账号

由于密码需要哈希存储，需要通过 Supabase 的 SQL Editor 手动插入管理员：

```sql
-- 使用 pgcrypto 生成 bcrypt 密码哈希
-- 先启用 pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 插入管理员（密码: admin123）
INSERT INTO profiles (username, password_hash, display_name, avatar_char, role)
VALUES ('fancy', crypt('admin123', gen_salt('bf')), '妮妮（Fancy）', '妮', 'admin');
```

> ⚠️ 注意：需要在应用代码中将密码验证方式从简单哈希改为 bcrypt 对比。
> 或在前端实现密码哈希后发送到 Supabase Edge Function 进行验证。

### 第六步：部署到 GitHub Pages

1. **创建 GitHub 私有仓库**
   ```bash
   cd sop-platform
   git init
   git add .
   git commit -m "Initial commit - SOP Academy"
   git branch -M main
   git remote add origin git@github.com:fancy0214/sop-platform.git
   git push -u origin main
   ```

2. **设置 GitHub Pages**
   - 进入仓库 Settings > Pages
   - Source 选择 "Deploy from a branch"
   - Branch 选择 `main`，目录选择 `/ (root)`
   - 点击 Save

3. **访问应用**
   - 等待部署完成（约1-2分钟）
   - 访问 `https://fancy0214.github.io/sop-platform/`

> 🔒 **安全提醒**：由于是内部培训系统，请务必将仓库设置为 **Private（私有）**。

---

## 三、项目结构

```
sop-platform/
├── index.html              # 主入口页面
├── css/
│   └── style.css           # 全局样式（深色科技风）
├── js/
│   ├── config.js           # 配置文件（Supabase连接、常量定义）
│   ├── utils.js            # 工具函数（Markdown解析、日期格式化等）
│   ├── local-data.js       # 本地模拟数据层（演示模式）
│   ├── supabase-client.js  # Supabase数据库交互层
│   ├── app.js              # 主应用框架（导航、状态管理）
│   ├── pages-employee.js   # 员工页面渲染器
│   ├── pages-admin.js      # 管理员页面渲染器
│   ├── pages-leader.js     # 组长页面渲染器
│   └── exam.js             # 考试模块（出题、答题、防作弊）
├── supabase-schema.sql     # 数据库表结构（含RLS策略）
├── DEPLOY.md               # 本部署文档
└── README.md               # 项目说明
```

---

## 四、功能清单

### ✅ 已实现
- [x] 登录系统（用户名+密码）
- [x] 三级角色权限（管理员/组长/员工）
- [x] 13个章节的学习模块（含通用/专用章节自动匹配）
- [x] 渐进式章节解锁
- [x] 考试模块（选择/判断/填空/问答/实操）
- [x] 防作弊机制（限时、切屏检测、题目随机打乱）
- [x] 客观题自动评分 + 主观题人工评分
- [x] 评估报告（综合评分、胜任力分析）
- [x] 管理员仪表盘
- [x] 账号管理（创建/停用/删除）
- [x] 资料库管理界面
- [x] 题库管理界面
- [x] 进度监控
- [x] 系统配置（及格分数、防作弊参数）
- [x] 组长查看组内进度/成绩
- [x] 通知系统（站内通知）
- [x] 深色科技风UI + 动画效果
- [x] 响应式设计（PC + 手机）
- [x] 本地演示模式（无需后端即可体验）

### 🔧 部署后需配置
- [ ] Supabase Auth 集成（替代本地登录）
- [ ] Supabase Storage 文件上传
- [ ] Realtime 实时通知
- [ ] AI智能出题（接入OpenAI API）
- [ ] PDF评估报告导出
- [ ] 密码 bcrypt 加密

---

## 五、章节结构

### 销售组（9章）
1. 留学业务通识（通用）
2. 定校咨询（通用）
3. 材料审核（通用）
4. 数据接单
5. 签约咨询
6. 出产维护
7. 机构下单
8. 口碑挖掘
9. 思维模型（通用）

### 置换组（8章）
1. 留学业务通识（通用）
2. 定校咨询（通用）
3. 材料审核（通用）
4. 申请填写
5. 系统录入
6. 申请接单
7. 申请跟进
8. 思维模型（通用）

---

## 六、常见问题

### Q: 本地预览数据如何重置？
A: 打开浏览器控制台，执行 `localStorage.clear()` 然后刷新页面。

### Q: 部署后数据在哪里？
A: 连接Supabase后，所有数据存储在Supabase的PostgreSQL数据库中，localStorage模式仅用于演示。

### Q: 如何导入实际的SOP学习内容？
A: 通过管理员后台的"资料库"功能上传，或在Supabase的 `learning_content` 表中直接插入Markdown内容。

### Q: 如何修改章节及格分数？
A: 管理员登录后进入"系统配置"页面，可修改每章的及格分数和考试限时。
