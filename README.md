# SOP Academy - 智能培训系统

> 企业级SOP学习与考核一体化平台

## 📋 项目简介

SOP Academy 是面向留学业务团队的智能培训平台，支持销售组和置换组员工的标准化操作流程培训。平台包含章节学习、在线考试、能力评估三大核心模块，配合三级角色权限体系，实现培训全流程数字化管理。

## ✨ 核心特性

- 🎓 **渐进式学习**：13个章节按序解锁，学完即考
- 📝 **智能考试**：5种题型，客观题自动评分，主观题人工评分
- 🛡️ **防作弊**：限时答题、切屏检测、题目随机打乱
- 📊 **能力评估**：综合评分 + 胜任力维度分析 + 转正建议
- 👥 **三级权限**：管理员 / 组长 / 员工，权限分明
- 🔔 **实时通知**：学习完成、考试出分、待评分通知
- 📱 **响应式**：PC + 手机完美适配
- 🎨 **深色科技风**：精致UI + 流畅动画

## 🚀 快速体验

```bash
# 克隆仓库（私有仓库）
git clone git@github.com:fancy0214/sop-platform.git
cd sop-platform

# 启动本地服务器
python3 -m http.server 8080
```

访问 http://localhost:8080 ，使用演示账号登录：

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | fancy | admin123 |
| 组长 | wanglei | 123456 |
| 员工 | zhangsan | 123456 |

## 🏗️ 技术栈

- **前端**：HTML5 + CSS3 + Vanilla JavaScript
- **后端**：Supabase（PostgreSQL + Auth + Storage + Realtime）
- **部署**：GitHub Pages（静态前端）
- **字体**：Outfit + Noto Sans SC

## 📁 项目结构

```
sop-platform/
├── index.html              # 主入口
├── css/style.css           # 全局样式
├── js/
│   ├── config.js           # 配置与常量
│   ├── utils.js            # 工具函数
│   ├── local-data.js       # 本地演示数据
│   ├── supabase-client.js  # 数据库交互
│   ├── app.js              # 应用框架
│   ├── pages-employee.js   # 员工页面
│   ├── pages-admin.js      # 管理员页面
│   ├── pages-leader.js     # 组长页面
│   └── exam.js             # 考试模块
├── supabase-schema.sql     # 数据库DDL
├── DEPLOY.md               # 部署文档
└── README.md               # 本文件
```

## 📖 章节体系

### 通用章节（两组共享）
- 留学业务通识 / 定校咨询 / 材料审核 / 思维模型

### 销售组专用（5章）
- 数据接单 / 签约咨询 / 出产维护 / 机构下单 / 口碑挖掘

### 置换组专用（4章）
- 申请填写 / 系统录入 / 申请接单 / 申请跟进

## 🔐 权限说明

| 功能 | 管理员 | 组长 | 员工 |
|------|:------:|:----:|:----:|
| 学习/考试/评估 | ✓ | - | ✓ |
| 账号管理 | ✓ | - | - |
| 资料库管理 | ✓ | - | - |
| 题库管理 | ✓ | - | - |
| 人工评分 | ✓ | - | - |
| 查看组内进度 | ✓ | ✓ | - |
| 系统配置 | ✓ | - | - |

## 📄 部署

详细的部署指南请查看 [DEPLOY.md](DEPLOY.md)

## 🔒 安全说明

- 所有SOP资料仅限内部使用
- GitHub仓库必须设置为 **Private**
- 数据库连接信息通过 Supabase 环境变量管理
- 密码使用 bcrypt 加密存储

---

© 2025 SOP Academy · 智能培训系统
