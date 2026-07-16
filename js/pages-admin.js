/**
 * SOP Academy - 管理员页面
 */

// 管理员 - 仪表盘
PageRenderers['adm-dash'] = async function(c) {
    const users = await getAllUsers();
    const employees = users.filter(u => u.role === ROLES.EMPLOYEE && u.isActive);
    const totalEmp = employees.length;
    const pendingReviews = await getPendingReviews();

    // 计算平均进度
    let totalProgress = 0;
    for (const emp of employees) {
        const progress = await getUserProgress(emp.id);
        const completed = progress.filter(p => p.status === 'completed').length;
        const chapters = getChaptersForGroup(emp.group);
        totalProgress += chapters.length > 0 ? Math.round((completed / chapters.length) * 100) : 0;
    }
    const avgProgress = totalEmp > 0 ? Math.round(totalProgress / totalEmp) : 0;

    // 学员进度表
    let rows = '';
    for (const emp of employees) {
        const progress = await getUserProgress(emp.id);
        const chapters = getChaptersForGroup(emp.group);
        const completed = progress.filter(p => p.status === 'completed').length;
        const pct = chapters.length > 0 ? Math.round((completed / chapters.length) * 100) : 0;

        rows += `<tr>
            <td><div style="display:flex;align-items:center;gap:8px">
                <div class="user-avatar" style="width:28px;height:28px;font-size:11px;border-radius:8px;background:linear-gradient(135deg,var(--primary),var(--secondary))">${emp.avatarChar}</div>
                ${emp.displayName}
            </div></td>
            <td>${emp.group || '-'}</td>
            <td>${completed}/${chapters.length}</td>
            <td><div class="progress" style="width:100px"><div class="progress-fill pf-primary" style="width:${pct}%"></div></div></td>
            <td>${pct}%</td>
            <td>${statusBadge(pct === 100 ? 'completed' : pct > 0 ? 'in_progress' : 'locked')}</td>
        </tr>`;
    }

    // 待处理事项
    let pendingHtml = '';
    if (pendingReviews.length === 0) {
        pendingHtml = '<div style="text-align:center;padding:24px;color:var(--text-muted)">暂无待处理事项 ✓</div>';
    } else {
        pendingHtml = pendingReviews.map(r => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--bg-tertiary);border-radius:10px">
                <div>
                    <div style="font-size:14px;font-weight:500">${r.userName} - 第${r.chapterId}章考试</div>
                    <div style="font-size:12px;color:var(--text-muted)">客观题${r.autoScore || 0}分 · 待人工评分</div>
                </div>
                <button class="btn btn-primary btn-sm" onclick="navigateTo('adm-scoring')">去评分</button>
            </div>
        `).join('');
    }

    c.innerHTML = `
        <div class="topbar"><h2>📊 管理员仪表盘</h2></div>
        <div class="stats-row">
            <div class="stat-card">
                <div class="label">学员总数</div>
                <div class="value">${totalEmp}</div>
                <div class="sub up">活跃学员</div>
            </div>
            <div class="stat-card">
                <div class="label">平均进度</div>
                <div class="value">${avgProgress}%</div>
            </div>
            <div class="stat-card">
                <div class="label">待评分</div>
                <div class="value">${pendingReviews.length}</div>
                <div class="sub" style="color:${pendingReviews.length > 0 ? 'var(--warning)' : 'var(--success)'}">${pendingReviews.length > 0 ? '需处理' : '已清零'}</div>
            </div>
            <div class="stat-card">
                <div class="label">题库总量</div>
                <div class="value">${(getStore('questions') || []).length}</div>
            </div>
        </div>
        <div class="grid grid-2">
            <div class="card">
                <div class="card-title"><span class="emoji">👥</span>学员进度概览</div>
                <div class="table-wrap">
                    <table>
                        <thead><tr><th>姓名</th><th>组别</th><th>章节</th><th>进度</th><th>完成度</th><th>状态</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>
            <div class="card">
                <div class="card-title"><span class="emoji">⏳</span>待处理事项</div>
                <div style="display:flex;flex-direction:column;gap:10px">${pendingHtml}</div>
            </div>
        </div>
    `;
};

// 管理员 - 账号管理
PageRenderers['adm-accounts'] = async function(c) {
    const users = await getAllUsers();

    let rows = users.map(u => {
        const stBadge = u.isActive ? '<span class="badge badge-success">启用</span>' : '<span class="badge badge-danger">停用</span>';
        const roleBadge = u.role === ROLES.ADMIN ? '<span class="badge badge-primary">管理员</span>' :
                          u.role === ROLES.LEADER ? '<span class="badge badge-warning">组长</span>' :
                          '<span class="badge badge-muted">员工</span>';
        return `<tr>
            <td>${u.displayName}</td>
            <td>${u.username}</td>
            <td>${u.group || '-'}</td>
            <td>${roleBadge}</td>
            <td>${stBadge}</td>
            <td>
                ${u.role !== ROLES.ADMIN ? `
                    <button class="btn btn-ghost btn-sm" onclick="toggleAccount('${u.id}', ${!u.isActive})">${u.isActive ? '停用' : '启用'}</button>
                    <button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="deleteAccountConfirm('${u.id}', '${u.displayName}')">删除</button>
                ` : '<span class="text-muted" style="font-size:12px">-</span>'}
            </td>
        </tr>`;
    }).join('');

    c.innerHTML = `
        <div class="topbar">
            <h2>👥 账号管理</h2>
            <div class="topbar-actions">
                <button class="btn btn-primary btn-sm" onclick="showAddAccountModal()">+ 新增账号</button>
            </div>
        </div>
        <div class="card">
            <div class="filter-bar">
                <input class="form-input" placeholder="搜索姓名/用户名..." style="width:200px" oninput="filterAccountsTable(this.value)">
                <select class="form-input form-select" style="width:140px" onchange="filterAccountsByGroup(this.value)">
                    <option value="">全部组别</option>
                    <option>销售组</option>
                    <option>置换组</option>
                </select>
            </div>
            <div class="table-wrap">
                <table id="accountsTable">
                    <thead><tr><th>姓名</th><th>用户名</th><th>组别</th><th>角色</th><th>状态</th><th>操作</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>
        <div id="modalArea"></div>
    `;
};

// 搜索/过滤账号
function filterAccountsTable(keyword) {
    const table = document.getElementById('accountsTable');
    if (!table) return;
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(keyword.toLowerCase()) ? '' : 'none';
    });
}

function filterAccountsByGroup(group) {
    const table = document.getElementById('accountsTable');
    if (!table) return;
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        if (!group) { row.style.display = ''; return; }
        const cells = row.querySelectorAll('td');
        row.style.display = cells[2] && cells[2].textContent === group ? '' : 'none';
    });
}

// 新增账号弹窗
function showAddAccountModal() {
    const area = document.getElementById('modalArea');
    if (!area) return;
    area.innerHTML = `
        <div class="modal-overlay" onclick="if(event.target===this)this.remove()">
            <div class="modal">
                <div class="modal-title">➕ 新增账号</div>
                <div class="form-group">
                    <label>显示名称</label>
                    <input class="form-input" id="newDisplayName" placeholder="请输入姓名">
                </div>
                <div class="form-group">
                    <label>用户名</label>
                    <input class="form-input" id="newUsername" placeholder="登录用户名">
                </div>
                <div class="form-group">
                    <label>初始密码</label>
                    <input class="form-input" id="newPassword" type="text" placeholder="初始密码" value="123456">
                </div>
                <div class="form-group">
                    <label>角色</label>
                    <select class="form-input form-select" id="newRole">
                        <option value="employee">员工</option>
                        <option value="leader">组长</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>组别</label>
                    <select class="form-input form-select" id="newGroup">
                        <option value="销售组">销售组</option>
                        <option value="置换组">置换组</option>
                    </select>
                </div>
                <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:24px">
                    <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">取消</button>
                    <button class="btn btn-primary" onclick="doCreateAccount()">创建账号</button>
                </div>
            </div>
        </div>
    `;
}

async function doCreateAccount() {
    const displayName = document.getElementById('newDisplayName').value.trim();
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value.trim();
    const role = document.getElementById('newRole').value;
    const group = document.getElementById('newGroup').value;

    if (!displayName || !username || !password) {
        showToast('请填写完整信息', 'danger');
        return;
    }

    const result = await createUser(username, password, displayName, role, group, AppState.currentUser.id);
    if (result.success) {
        showToast('账号创建成功！', 'success');
        document.querySelector('.modal-overlay').remove();
        navigateTo('adm-accounts'); // 刷新
    } else {
        showToast(result.message, 'danger');
    }
}

async function toggleAccount(userId, isActive) {
    await toggleUserActive(userId, isActive);
    showToast(isActive ? '已启用' : '已停用', 'warning');
    navigateTo('adm-accounts');
}

function deleteAccountConfirm(userId, name) {
    showConfirm(`确定要删除账号「${name}」吗？相关学习数据也会被清除。`, async () => {
        await deleteUser(userId);
        showToast('已删除', 'success');
        navigateTo('adm-accounts');
    });
}

// 管理员 - 资料库
PageRenderers['adm-resources'] = async function(c) {
    let chCards = CHAPTERS_CONFIG.map(ch => {
        const groupLabel = ch.groupType === 'common' ? '通用' : ch.groupType === 'sales' ? '销售组' : '置换组';
        // 获取学习要点内容长度（用于展示状态）
        let contentStatus = '<span class="badge badge-success">已配置</span>';
        if (typeof CHAPTER_CONTENTS !== 'undefined' && CHAPTER_CONTENTS[ch.id]) {
            const bodyLen = CHAPTER_CONTENTS[ch.id].body.length;
            contentStatus = `<span class="badge badge-success">已配置</span> <span style="font-size:12px;color:var(--text-muted)">(${Math.round(bodyLen/1000)}k字)</span>`;
        } else {
            contentStatus = '<span class="badge badge-muted">未配置</span>';
        }
        return `
        <div class="card" style="margin-top:16px">
            <div class="card-header">
                <div class="card-title" style="margin:0">
                    <span class="emoji">📖</span>第${ch.order}章：${ch.title}
                    <span class="badge badge-primary" style="margin-left:8px;font-size:11px">${groupLabel}</span>
                </div>
                <div style="display:flex;gap:8px">
                    <button class="btn btn-primary btn-sm" onclick="previewChapterContent(${ch.id}, '${ch.title}')">👁️ 查看要点</button>
                    <button class="btn btn-ghost btn-sm" onclick="previewChapterContent(${ch.id}, '${ch.title}')">编辑要点</button>
                    <button class="btn btn-ghost btn-sm" onclick="showToast('文件上传需连接Supabase Storage，暂未开放','warning')">📎 上传</button>
                </div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;align-items:center">
                <span style="padding:6px 12px;background:var(--bg-tertiary);border-radius:8px;font-size:13px;color:var(--text-secondary)">学习要点：${contentStatus}</span>
                <span style="padding:6px 12px;background:var(--bg-tertiary);border-radius:8px;font-size:13px;color:var(--text-muted)">📄 SOP文档</span>
                <span style="padding:6px 12px;background:var(--bg-tertiary);border-radius:8px;font-size:13px;color:var(--text-muted)">🎬 教学视频</span>
            </div>
            <div style="font-size:13px;color:var(--text-muted)">及格分数：${ch.passingScore}分 · 考试限时：${ch.timeLimit}分钟</div>
        </div>`;
    }).join('');

    c.innerHTML = `
        <div class="topbar">
            <h2>📁 资料库管理</h2>
            <div class="topbar-actions">
                <button class="btn btn-primary btn-sm" onclick="showToast('文件上传需连接Supabase Storage','warning')">📎 批量上传</button>
            </div>
        </div>
        <div class="card" style="background:linear-gradient(135deg,rgba(99,102,241,.08),rgba(6,182,212,.05));border-color:rgba(99,102,241,.15)">
            <p style="color:var(--text-secondary);font-size:14px">管理各章节的SOP学习资料。点击「查看要点」可预览每章的完整学习内容。</p>
            <p style="color:var(--text-muted);font-size:13px;margin-top:8px">💡 提示：文件上传功能需连接Supabase Storage后开放</p>
        </div>
        ${chCards}
        <div id="contentPreviewModal"></div>
    `;
};

// 预览章节学习要点内容
function previewChapterContent(chapterId, chapterTitle) {
    const modal = document.getElementById('contentPreviewModal');
    if (!modal) return;

    let body = '';
    if (typeof CHAPTER_CONTENTS !== 'undefined' && CHAPTER_CONTENTS[chapterId]) {
        body = CHAPTER_CONTENTS[chapterId].body;
    } else {
        body = '# 内容未配置\n\n该章节的学习要点尚未配置，请联系管理员。';
    }

    const htmlContent = markdownToHtml(body);

    modal.innerHTML = `
        <div class="modal-overlay" onclick="if(event.target===this)this.remove()" style="z-index:1000">
            <div class="modal" style="width:90vw;max-width:900px;max-height:85vh;overflow:hidden;display:flex;flex-direction:column">
                <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:16px;border-bottom:1px solid var(--border)">
                    <div class="modal-title" style="margin:0">📖 第${chapterId}章：${chapterTitle} - 学习要点</div>
                    <button class="btn btn-ghost btn-sm" onclick="this.closest('.modal-overlay').remove()">✕ 关闭</button>
                </div>
                <div style="flex:1;overflow-y:auto;padding:20px 8px;font-size:14px;line-height:1.8">
                    <div class="md-content">${htmlContent}</div>
                </div>
                <div style="padding-top:12px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
                    <span style="font-size:12px;color:var(--text-muted)">共 ${Math.round(body.length/1000)}k 字</span>
                    <button class="btn btn-ghost btn-sm" onclick="this.closest('.modal-overlay').remove()">关闭</button>
                </div>
            </div>
        </div>
    `;
}

// 管理员 - 题库管理
PageRenderers['adm-questions'] = async function(c) {
    const allQuestions = getStore('questions') || [];
    const typeCounts = {};
    allQuestions.forEach(q => {
        const label = QUESTION_TYPE_LABELS[q.questionType] || q.questionType;
        typeCounts[label] = (typeCounts[label] || 0) + 1;
    });

    let typeSummary = Object.entries(typeCounts).map(([k, v]) => `<span class="badge badge-primary">${k}: ${v}</span>`).join(' ');

    let qRows = allQuestions.slice(0, 30).map((q, i) => {
        const typeLabel = QUESTION_TYPE_LABELS[q.questionType] || q.questionType;
        const chTitle = CHAPTERS_CONFIG.find(ch => ch.id === q.chapterId)?.title || '';
        const isManual = q.questionType === 'essay' || q.questionType === 'practice';
        return `<tr>
            <td>${chTitle}</td>
            <td><span class="badge badge-primary">${typeLabel}</span></td>
            <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${q.questionText}">${q.questionText}</td>
            <td><span class="badge ${q.difficulty === 'easy' ? 'badge-success' : q.difficulty === 'medium' ? 'badge-warning' : 'badge-danger'}">${q.difficulty === 'easy' ? '简单' : q.difficulty === 'medium' ? '中等' : '困难'}</span></td>
            <td>${q.score}分</td>
            <td>${isManual ? '<span class="badge badge-warning">人工</span>' : '<span class="badge badge-success">自动</span>'}</td>
            <td>
                <button class="btn btn-ghost btn-sm" onclick="showToast('编辑功能开发中','warning')">编辑</button>
                <button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="showToast('删除功能开发中','warning')">删除</button>
            </td>
        </tr>`;
    }).join('');

    c.innerHTML = `
        <div class="topbar">
            <h2>📝 题库管理</h2>
            <div class="topbar-actions">
                <button class="btn btn-ghost btn-sm" onclick="showToast('已生成正式考题','success')">📋 生成考题</button>
                <button class="btn btn-primary btn-sm" onclick="showToast('AI智能出题功能开发中','warning')">🤖 AI出题</button>
            </div>
        </div>
        <div class="stats-row">
            <div class="stat-card">
                <div class="label">题目总数</div>
                <div class="value">${allQuestions.length}</div>
            </div>
            <div class="stat-card">
                <div class="label">题型分布</div>
                <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px">${typeSummary}</div>
            </div>
            <div class="stat-card">
                <div class="label">覆盖章节</div>
                <div class="value">13</div>
            </div>
        </div>
        <div class="card">
            <div class="filter-bar">
                <select class="form-input form-select" style="width:160px">
                    <option>全部章节</option>
                    ${CHAPTERS_CONFIG.map(ch => `<option>第${ch.order}章：${ch.title}</option>`).join('')}
                </select>
                <select class="form-input form-select" style="width:130px">
                    <option>全部题型</option>
                    <option>单选题</option>
                    <option>判断题</option>
                    <option>填空题</option>
                    <option>问答题</option>
                    <option>实操题</option>
                </select>
                <select class="form-input form-select" style="width:130px">
                    <option>全部难度</option>
                    <option>简单</option>
                    <option>中等</option>
                    <option>困难</option>
                </select>
            </div>
            <div class="table-wrap">
                <table>
                    <thead><tr><th>章节</th><th>题型</th><th>题目内容</th><th>难度</th><th>分值</th><th>评分方式</th><th>操作</th></tr></thead>
                    <tbody>${qRows}</tbody>
                </table>
            </div>
            ${allQuestions.length > 30 ? `<div style="text-align:center;padding:12px;color:var(--text-muted);font-size:13px">显示前30题，共${allQuestions.length}题</div>` : ''}
        </div>
    `;
};

// 管理员 - 评分管理
PageRenderers['adm-scoring'] = async function(c) {
    const pendingReviews = await getPendingReviews();

    let reviewHtml = '';
    if (pendingReviews.length === 0) {
        reviewHtml = `<div class="card" style="text-align:center;padding:48px">
            <div style="font-size:48px;margin-bottom:16px">✅</div>
            <p style="color:var(--text-secondary)">暂无待评分试卷</p>
        </div>`;
    } else {
        reviewHtml = pendingReviews.map(r => `
            <div class="card" id="review_${r.id}">
                <div class="card-header">
                    <div>
                        <div style="font-weight:600;font-size:15px">${r.userName} · ${r.userGroup || ''}</div>
                        <div style="font-size:13px;color:var(--text-muted);margin-top:2px">第${r.chapterId}章考试 · 客观题${r.autoScore || 0}分 · 待人工评分</div>
                    </div>
                    <span class="badge badge-warning">待评分</span>
                </div>
                <div style="padding:14px;background:var(--bg-tertiary);border-radius:10px;margin-bottom:14px">
                    <div style="font-size:13px;color:var(--text-muted);margin-bottom:6px">学员答题数据：</div>
                    <div style="font-size:14px;line-height:1.7">
                        ${r.answers ? Object.entries(r.answers).map(([k, v]) => {
                            return `<div style="margin-bottom:8px;padding:8px;background:var(--bg-card);border-radius:6px">
                                <span style="font-size:12px;color:var(--text-muted)">题目${parseInt(k) + 1}：</span>
                                ${v.text || '(选择题)'}
                                ${v.file ? `<br><span style="color:var(--primary-light);font-size:12px">📎 ${v.file}</span>` : ''}
                            </div>`;
                        }).join('') : '<span class="text-muted">无答题数据</span>'}
                    </div>
                </div>
                <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
                    <span style="font-size:14px;flex-shrink:0">主观题评分：</span>
                    <input type="number" min="0" max="100" class="q-input" style="width:80px;padding:8px 12px" placeholder="0-100" id="score_${r.id}">
                    <span style="font-size:13px;color:var(--text-muted)">分</span>
                    <span style="font-size:13px;color:var(--text-muted);margin-left:8px">客观题：${r.autoScore || 0}分 + 主观题 = 总分</span>
                    <button class="btn btn-success btn-sm" style="margin-left:auto" onclick="doSubmitScore('${r.id}')">提交评分</button>
                </div>
            </div>
        `).join('');
    }

    c.innerHTML = `
        <div class="topbar"><h2>✏️ 评分管理</h2></div>
        <div class="stats-row">
            <div class="stat-card">
                <div class="label">待评分试卷</div>
                <div class="value">${pendingReviews.length}</div>
            </div>
            <div class="stat-card">
                <div class="label">已评分</div>
                <div class="value">${(getStore('exams') || []).filter(e => e.status === 'passed' || e.status === 'failed').length}</div>
            </div>
        </div>
        ${reviewHtml}
    `;
};

async function doSubmitScore(examId) {
    const inp = document.getElementById('score_' + examId);
    if (!inp || !inp.value) {
        showToast('请输入评分', 'danger');
        return;
    }
    const score = parseInt(inp.value);
    if (isNaN(score) || score < 0 || score > 100) {
        showToast('请输入0-100的有效分数', 'danger');
        return;
    }

    await scoreExam(examId, { manual: score }, AppState.currentUser.id);
    showToast('评分已提交：' + score + '分', 'success');

    const card = document.getElementById('review_' + examId);
    if (card) {
        card.style.borderColor = 'var(--success)';
        card.querySelector('.badge').className = 'badge badge-success';
        card.querySelector('.badge').textContent = '已评分';
        inp.disabled = true;
    }
}

// 管理员 - 进度监控
PageRenderers['adm-progress'] = async function(c) {
    const users = await getAllUsers();
    const employees = users.filter(u => u.role === ROLES.EMPLOYEE && u.isActive);

    let rows = '';
    for (const emp of employees) {
        const progress = await getUserProgress(emp.id);
        const chapters = getChaptersForGroup(emp.group);
        const completed = progress.filter(p => p.status === 'completed').length;
        const pct = chapters.length > 0 ? Math.round((completed / chapters.length) * 100) : 0;
        const avgScore = calcAvgScore(emp.id);

        // 章节状态徽章
        let chBadges = '';
        chapters.forEach((ch, i) => {
            const p = progress.find(pr => pr.chapterId === ch.id);
            const status = p ? p.status : 'locked';
            if (status === 'completed') chBadges += `<span class="badge badge-success" style="font-size:10px">Ch${i + 1}✓</span> `;
            else if (status === 'in_progress') chBadges += `<span class="badge badge-primary" style="font-size:10px">Ch${i + 1}</span> `;
            else chBadges += `<span class="badge badge-muted" style="font-size:10px">Ch${i + 1}</span> `;
        });

        rows += `<tr>
            <td><div style="display:flex;align-items:center;gap:8px">
                <div class="user-avatar" style="width:28px;height:28px;font-size:11px;border-radius:8px;background:linear-gradient(135deg,var(--primary),var(--secondary))">${emp.avatarChar}</div>
                ${emp.displayName}
            </div></td>
            <td>${emp.group}</td>
            <td>${completed}/${chapters.length}</td>
            <td>${avgScore || '-'}</td>
            <td><div style="display:flex;gap:2px;flex-wrap:wrap">${chBadges}</div></td>
            <td><div class="progress" style="width:100px"><div class="progress-fill pf-primary" style="width:${pct}%"></div></div></td>
            <td>${pct}%</td>
        </tr>`;
    }

    c.innerHTML = `
        <div class="topbar">
            <h2>📈 进度监控</h2>
            <div class="topbar-actions">
                <button class="btn btn-primary btn-sm" onclick="showToast('报告导出功能开发中','warning')">📄 导出报告</button>
            </div>
        </div>
        <div class="card">
            <div class="filter-bar">
                <select class="form-input form-select" style="width:140px" onchange="filterProgressTable(this.value)">
                    <option value="">全部组别</option>
                    <option>销售组</option>
                    <option>置换组</option>
                </select>
                <input class="form-input" placeholder="搜索学员..." style="width:180px">
            </div>
            <div class="table-wrap">
                <table id="progressTable">
                    <thead><tr><th>姓名</th><th>组别</th><th>章节完成</th><th>平均分</th><th>章节状态</th><th>进度</th><th>完成度</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>
    `;
};

function filterProgressTable(group) {
    const table = document.getElementById('progressTable');
    if (!table) return;
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        if (!group) { row.style.display = ''; return; }
        const cells = row.querySelectorAll('td');
        row.style.display = cells[1] && cells[1].textContent === group ? '' : 'none';
    });
}

// 管理员 - 系统配置
PageRenderers['adm-config'] = async function(c) {
    c.innerHTML = `
        <div class="topbar"><h2>⚙️ 系统配置</h2></div>
        <div class="card">
            <div class="card-title"><span class="emoji">📊</span>章节及格分数配置</div>
            <div class="table-wrap">
                <table>
                    <thead><tr><th>章节</th><th>组别</th><th>及格分数</th><th>考试限时(分钟)</th><th>操作</th></tr></thead>
                    <tbody>
                        ${CHAPTERS_CONFIG.map(ch => `
                            <tr>
                                <td>第${ch.order}章：${ch.title}</td>
                                <td>${ch.groupType === 'common' ? '通用' : ch.groupType === 'sales' ? '销售组' : '置换组'}</td>
                                <td><input type="number" class="q-input" value="${ch.passingScore}" style="width:80px;padding:6px 10px" id="score_${ch.id}"></td>
                                <td><input type="number" class="q-input" value="${ch.timeLimit}" style="width:80px;padding:6px 10px" id="time_${ch.id}"></td>
                                <td><button class="btn btn-ghost btn-sm" onclick="saveChapterConfig()">保存</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        <div class="card">
            <div class="card-title"><span class="emoji">🛡️</span>防作弊设置</div>
            <div style="display:flex;flex-direction:column;gap:16px">
                <div style="display:flex;align-items:center;gap:12px">
                    <span style="font-size:14px;width:160px">最大切屏次数</span>
                    <input type="number" class="q-input" value="${APP_CONFIG.antiCheatMaxSwitches}" style="width:80px;padding:6px 10px">
                    <span style="font-size:13px;color:var(--text-muted)">次（超过自动交卷）</span>
                </div>
                <div style="display:flex;align-items:center;gap:12px">
                    <span style="font-size:14px;width:160px">题目随机打乱</span>
                    <span class="badge badge-success">已启用</span>
                </div>
                <div style="display:flex;align-items:center;gap:12px">
                    <span style="font-size:14px;width:160px">选项随机打乱</span>
                    <span class="badge badge-success">已启用</span>
                </div>
            </div>
        </div>
        <div class="card">
            <div class="card-title"><span class="emoji">🔗</span>系统信息</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:14px">
                <div><span style="color:var(--text-muted)">系统版本</span><br>${APP_CONFIG.version}</div>
                <div><span style="color:var(--text-muted)">数据模式</span><br>${isSupabaseReady() ? '<span class="badge badge-success">Supabase</span>' : '<span class="badge badge-warning">本地模拟</span>'}</div>
                <div><span style="color:var(--text-muted)">章节总数</span><br>13个</div>
                <div><span style="color:var(--text-muted)">题库总量</span><br>${(getStore('questions') || []).length}题</div>
            </div>
        </div>
    `;
};

// 保存章节及格分数配置
function saveChapterConfig() {
    CHAPTERS_CONFIG.forEach(ch => {
        const scoreEl = document.getElementById('score_' + ch.id);
        const timeEl = document.getElementById('time_' + ch.id);
        if (scoreEl) {
            const val = parseInt(scoreEl.value);
            ch.passingScore = isNaN(val) || val < 0 ? 80 : Math.min(val, 100);
            scoreEl.value = ch.passingScore;
        }
        if (timeEl) {
            const val = parseInt(timeEl.value);
            ch.timeLimit = isNaN(val) || val <= 0 ? 30 : Math.min(val, 120);
            timeEl.value = ch.timeLimit;
        }
    });
    // 持久化到 localStorage
    const configData = CHAPTERS_CONFIG.map(ch => ({ id: ch.id, passingScore: ch.passingScore, timeLimit: ch.timeLimit }));
    try {
        localStorage.setItem('sop_chapterConfig', JSON.stringify(configData));
    } catch (e) {
        console.error('保存配置失败', e);
    }
    showToast('配置已保存', 'success');
}
