/**
 * SOP Academy - 管理员页面
 */

// 管理员 - 仪表盘
PageRenderers['adm-dash'] = async function(c) {
    // 并行加载数据，减少等待时间
    const [users, allProgress, pendingReviews] = await Promise.all([
        getAllUsers(),
        getAllUsersProgress(),
        getPendingReviews()
    ]);

    const employees = users.filter(u => u.role === ROLES.EMPLOYEE && u.isActive);
    const totalEmp = employees.length;

    // 按用户ID分组进度数据（避免重复查询）
    const progressByUser = {};
    for (const p of allProgress) {
        if (!progressByUser[p.userId]) progressByUser[p.userId] = [];
        progressByUser[p.userId].push(p);
    }

    // 单次循环计算统计 + 生成表格
    let totalProgress = 0;
    let rows = '';
    for (const emp of employees) {
        const progress = progressByUser[emp.id] || [];
        const chapters = getChaptersForGroup(emp.group);
        const completed = progress.filter(p => p.status === 'completed').length;
        const pct = chapters.length > 0 ? Math.round((completed / chapters.length) * 100) : 0;
        totalProgress += pct;

        rows += `<tr>
            <td><div style="display:flex;align-items:center;gap:8px">
                <div class="user-avatar" style="width:28px;height:28px;font-size:11px;border-radius:8px;background:linear-gradient(135deg,var(--primary),var(--secondary))">${emp.avatarChar}</div>
                <a href="javascript:void(0)" onclick="showEmployeeAssessmentModal('${emp.id}')" style="color:var(--primary);font-weight:600;text-decoration:none;cursor:pointer">${emp.displayName}</a>
            </div></td>
            <td>${emp.group || '-'}</td>
            <td>${completed}/${chapters.length}</td>
            <td><div class="progress" style="width:100px"><div class="progress-fill pf-primary" style="width:${pct}%"></div></div></td>
            <td>${pct}%</td>
            <td>${statusBadge(pct === 100 ? 'completed' : pct > 0 ? 'in_progress' : 'not_started')}</td>
        </tr>`;
    }
    const avgProgress = totalEmp > 0 ? Math.round(totalProgress / totalEmp) : 0;

    // 待处理事项
    let pendingHtml = '';
    if (pendingReviews.length === 0) {
        pendingHtml = '<div style="text-align:center;padding:24px;color:#5a6b82">暂无待处理事项 ✓</div>';
    } else {
        pendingHtml = pendingReviews.map(r => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--bg-tertiary);border-radius:10px">
                <div>
                    <div style="font-size:14px;font-weight:500">${r.userName} - 第${r.chapterId}章考试</div>
                    <div style="font-size:12px;color:#5a6b82">客观题${r.autoScore || 0}分 · 待人工评分</div>
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
                <div class="sub" style="color:${pendingReviews.length > 0 ? '#b45309' : '#059669'}">${pendingReviews.length > 0 ? '需处理' : '已清零'}</div>
            </div>
            <div class="stat-card">
                <div class="label">题库总量</div>
                <div class="value">${getAllExamQuestions().length}</div>
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
            contentStatus = `<span class="badge badge-success">已配置</span> <span style="font-size:12px;color:#5a6b82">(${Math.round(bodyLen/1000)}k字)</span>`;
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
                    <button class="btn btn-ghost btn-sm" onclick="editChapterContent(${ch.id}, '${ch.title}')">✏️ 编辑要点</button>
                    <button class="btn btn-ghost btn-sm" onclick="showToast('文件上传需连接Supabase Storage，暂未开放','warning')">📎 上传</button>
                </div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;align-items:center">
                <span style="padding:6px 12px;background:#dce3f0;border-radius:8px;font-size:13px;color:#1e2d52;font-weight:500">✅ 学习要点：${contentStatus}</span>
                <span style="padding:6px 12px;background:#e8ecf4;border-radius:8px;font-size:13px;color:#5a6b82">📄 SOP文档</span>
                <span style="padding:6px 12px;background:#e8ecf4;border-radius:8px;font-size:13px;color:#5a6b82">🎬 教学视频</span>
            </div>
            <div style="font-size:13px;color:#5a6b82">及格分数：<strong style="color:#2c3e6b">${ch.passingScore}分</strong> · 考试限时：<strong style="color:#2c3e6b">${ch.timeLimit}分钟</strong></div>
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
            <p style="color:#5a6b82;font-size:13px;margin-top:8px">💡 提示：文件上传功能需连接Supabase Storage后开放</p>
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
    // 优先读取编辑后保存的内容
    const editedContents = JSON.parse(localStorage.getItem('sop_editedContents') || '{}');
    if (editedContents[chapterId]) {
        body = editedContents[chapterId];
    } else if (typeof CHAPTER_CONTENTS !== 'undefined' && CHAPTER_CONTENTS[chapterId]) {
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
                    <span style="font-size:12px;color:#5a6b82">共 ${Math.round(body.length/1000)}k 字</span>
                    <button class="btn btn-ghost btn-sm" onclick="this.closest('.modal-overlay').remove()">关闭</button>
                </div>
            </div>
        </div>
    `;
}

// 编辑章节学习要点内容
function editChapterContent(chapterId, chapterTitle) {
    const modal = document.getElementById('contentPreviewModal');
    if (!modal) return;

    let rawContent = '';
    if (typeof CHAPTER_CONTENTS !== 'undefined' && CHAPTER_CONTENTS[chapterId]) {
        rawContent = CHAPTER_CONTENTS[chapterId].body;
    } else {
        rawContent = '# 第' + chapterId + '章：' + chapterTitle + '\n\n';
    }

    // 获取 localStorage 中可能已有的编辑版本
    const storageKey = 'sop_chapterContent_' + chapterId;
    const savedContent = localStorage.getItem(storageKey);
    const editingContent = savedContent !== null ? savedContent : rawContent;

    modal.innerHTML = `
        <div class="modal-overlay" onclick="if(event.target===this)this.remove()" style="z-index:1000">
            <div class="modal" style="width:92vw;max-width:1000px;max-height:90vh;overflow:hidden;display:flex;flex-direction:column">
                <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:16px;border-bottom:1px solid var(--border)">
                    <div class="modal-title" style="margin:0">✏️ 编辑学习要点 - 第${chapterId}章：${chapterTitle}</div>
                    <button class="btn btn-ghost btn-sm" onclick="this.closest('.modal-overlay').remove()">✕ 关闭</button>
                </div>
                <div style="display:flex;gap:0;flex:1;overflow:hidden;min-height:0">
                    <div style="flex:1;display:flex;flex-direction:column;border-right:1px solid var(--border)">
                        <div style="padding:8px 16px;font-size:12px;color:#5a6b82;border-bottom:1px solid var(--border);background:var(--bg-secondary)">
                            📝 Markdown 编辑区（支持 Markdown 语法）
                        </div>
                        <textarea id="chapterContentEditor" style="flex:1;width:100%;border:none;outline:none;resize:none;padding:16px;font-family:'JetBrains Mono',monospace;font-size:13px;line-height:1.7;background:var(--bg-primary);color:var(--text-primary);tab-size:2" spellcheck="false">${editingContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
                    </div>
                    <div style="flex:1;display:flex;flex-direction:column">
                        <div style="padding:8px 16px;font-size:12px;color:#5a6b82;border-bottom:1px solid var(--border);background:var(--bg-secondary)">
                            👁️ 实时预览
                        </div>
                        <div id="chapterContentPreview" style="flex:1;overflow-y:auto;padding:16px;font-size:14px;line-height:1.8">
                            <div class="md-content">${markdownToHtml(editingContent)}</div>
                        </div>
                    </div>
                </div>
                <div style="padding-top:12px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
                    <span style="font-size:12px;color:#5a6b82" id="editorCharCount">共 ${Math.round(editingContent.length/1000)}k 字</span>
                    <div style="display:flex;gap:8px">
                        <button class="btn btn-ghost btn-sm" onclick="resetEditorContent(${chapterId})">↩️ 重置</button>
                        <button class="btn btn-ghost btn-sm" onclick="toggleEditorPreview()">🔄 切换全屏</button>
                        <button class="btn btn-primary btn-sm" onclick="saveChapterContent(${chapterId}, '${chapterTitle}')">💾 保存修改</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 绑定实时预览
    const editor = document.getElementById('chapterContentEditor');
    if (editor) {
        editor.addEventListener('input', function() {
            const preview = document.getElementById('chapterContentPreview');
            const charCount = document.getElementById('editorCharCount');
            if (preview) {
                preview.innerHTML = '<div class="md-content">' + markdownToHtml(this.value) + '</div>';
            }
            if (charCount) {
                charCount.textContent = '共 ' + Math.round(this.value.length / 1000) + 'k 字';
            }
        });
        // 支持 Tab 缩进
        editor.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.selectionStart;
                const end = this.selectionEnd;
                this.value = this.value.substring(0, start) + '  ' + this.value.substring(end);
                this.selectionStart = this.selectionEnd = start + 2;
                this.dispatchEvent(new Event('input'));
            }
        });
    }

    // 存储当前章节ID用于重置
    window._editingChapterId = chapterId;
    window._originalChapterContent = rawContent;
}

// 重置编辑器内容为原始内容
function resetEditorContent(chapterId) {
    const editor = document.getElementById('chapterContentEditor');
    if (!editor) return;
    const storageKey = 'sop_chapterContent_' + chapterId;
    localStorage.removeItem(storageKey);
    editor.value = window._originalChapterContent || '';
    editor.dispatchEvent(new Event('input'));
    showToast('已重置为原始内容', 'success');
}

// 切换编辑器全屏/分屏模式
function toggleEditorPreview() {
    const editor = document.getElementById('chapterContentEditor');
    const preview = document.getElementById('chapterContentPreview');
    if (!editor || !preview) return;
    
    const editorPane = editor.closest('div[style*="flex-direction:column"]');
    const previewPane = preview.closest('div[style*="flex-direction:column"]');
    
    if (editorPane && previewPane) {
        const isHidden = previewPane.style.display === 'none';
        if (isHidden) {
            // 恢复分屏
            editorPane.style.display = 'flex';
            previewPane.style.display = 'flex';
        } else {
            // 只显示编辑器（全屏编辑）
            previewPane.style.display = 'none';
        }
    }
}

// 保存编辑后的章节内容
function saveChapterContent(chapterId, chapterTitle) {
    const editor = document.getElementById('chapterContentEditor');
    if (!editor) return;
    
    const newContent = editor.value.trim();
    if (!newContent) {
        showToast('内容不能为空', 'warning');
        return;
    }

    // 保存到 localStorage
    const storageKey = 'sop_chapterContent_' + chapterId;
    localStorage.setItem(storageKey, newContent);

    // 同时更新内存中的 CHAPTER_CONTENTS
    if (typeof CHAPTER_CONTENTS !== 'undefined') {
        CHAPTER_CONTENTS[chapterId] = {
            chapterId: chapterId,
            title: chapterTitle,
            body: newContent
        };
    }

    // 更新 local-data.js 中的 getLocalLearningContent 会读取 localStorage
    // 保存到统一的存储key，方便后续读取
    const allEditedContents = JSON.parse(localStorage.getItem('sop_editedContents') || '{}');
    allEditedContents[chapterId] = newContent;
    localStorage.setItem('sop_editedContents', JSON.stringify(allEditedContents));

    // 同步保存到 Supabase 云端
    if (typeof saveLearningContent === 'function') {
        saveLearningContent(chapterId, chapterTitle, newContent, AppState.currentUser ? AppState.currentUser.id : null);
    }

    showToast('第' + chapterId + '章学习要点已保存', 'success');

    // 关闭弹窗
    const modal = document.querySelector('#contentPreviewModal .modal-overlay');
    if (modal) modal.remove();
}

// 管理员 - 题库管理
PageRenderers['adm-questions'] = async function(c) {
    const allQuestions = getAllExamQuestions();
    const typeLabels = { choice_single: '单选题', choice_multi: '多选题', true_false: '判断题', fill_blank: '填空题', essay: '问答题', practice: '实操题' };
    const typeCounts = {};
    allQuestions.forEach(q => {
        const label = typeLabels[q.questionType] || q.questionType;
        typeCounts[label] = (typeCounts[label] || 0) + 1;
    });
    let typeSummary = Object.entries(typeCounts).map(([k, v]) => `<span class="badge badge-primary">${k}: ${v}</span>`).join(' ');

    // 每章题数统计
    const perChapter = {};
    for (let ch = 1; ch <= 13; ch++) perChapter[ch] = 0;
    allQuestions.forEach(q => { perChapter[q.chapterId] = (perChapter[q.chapterId] || 0) + 1; });

    function renderRows(list) {
        return list.map(q => {
            const typeLabel = typeLabels[q.questionType] || q.questionType;
            const chTitle = CHAPTERS_CONFIG.find(ch => ch.id === q.chapterId)?.title || '';
            const isManual = q.questionType === 'essay' || q.questionType === 'practice';
            const safeText = q.questionText.replace(/"/g, '&quot;').replace(/</g, '&lt;');
            return `<tr>
                <td style="white-space:nowrap">${chTitle}</td>
                <td><span class="badge badge-primary">${typeLabel}</span></td>
                <td style="max-width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${safeText}">${q.questionText}</td>
                <td><span class="badge ${q.difficulty === 'easy' ? 'badge-success' : q.difficulty === 'medium' ? 'badge-warning' : 'badge-danger'}">${q.difficulty === 'easy' ? '简单' : q.difficulty === 'medium' ? '中等' : '困难'}</span></td>
                <td>${q.score}分</td>
                <td>${isManual ? '<span class="badge badge-warning">人工</span>' : '<span class="badge badge-success">自动</span>'}</td>
            </tr>`;
        }).join('');
    }

    c.innerHTML = `
        <div class="topbar">
            <h2>📝 题库管理</h2>
            <div class="topbar-actions">
                <span style="font-size:13px;color:#5a6b82">共 <b style="color:#2c3e6b;font-size:16px">${allQuestions.length}</b> 题 · 13 章节</span>
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
                <div class="label">每章题数</div>
                <div style="margin-top:6px;font-size:12px;color:#5a6b82;line-height:1.8">${CHAPTERS_CONFIG.map(ch => `第${ch.order}章 ${perChapter[ch.id]||0}题`).join('<br>')}</div>
            </div>
        </div>
        <div class="card">
            <div class="filter-bar">
                <select id="qFilterChapter" class="form-input form-select" style="width:200px" onchange="window._filterQuestions()">
                    <option value="">全部章节</option>
                    ${CHAPTERS_CONFIG.map(ch => `<option value="${ch.id}">第${ch.order}章：${ch.title} (${perChapter[ch.id]||0}题)</option>`).join('')}
                </select>
                <select id="qFilterType" class="form-input form-select" style="width:120px" onchange="window._filterQuestions()">
                    <option value="">全部题型</option>
                    <option value="choice_single">单选题</option>
                    <option value="choice_multi">多选题</option>
                    <option value="true_false">判断题</option>
                    <option value="fill_blank">填空题</option>
                    <option value="essay">问答题</option>
                    <option value="practice">实操题</option>
                </select>
                <select id="qFilterDiff" class="form-input form-select" style="width:120px" onchange="window._filterQuestions()">
                    <option value="">全部难度</option>
                    <option value="easy">简单</option>
                    <option value="medium">中等</option>
                    <option value="hard">困难</option>
                </select>
                <span id="qFilterCount" style="font-size:13px;color:#5a6b82;margin-left:8px"></span>
            </div>
            <div class="table-wrap">
                <table>
                    <thead><tr><th>章节</th><th>题型</th><th>题目内容</th><th>难度</th><th>分值</th><th>评分方式</th></tr></thead>
                    <tbody id="qTableBody">${renderRows(allQuestions)}</tbody>
                </table>
            </div>
        </div>
    `;

    window._allExamQ = allQuestions;
    window._renderQRows = renderRows;
    window._filterQuestions = function() {
        const ch = document.getElementById('qFilterChapter')?.value;
        const tp = document.getElementById('qFilterType')?.value;
        const df = document.getElementById('qFilterDiff')?.value;
        let filtered = window._allExamQ;
        if (ch) filtered = filtered.filter(q => q.chapterId === parseInt(ch));
        if (tp) filtered = filtered.filter(q => q.questionType === tp);
        if (df) filtered = filtered.filter(q => q.difficulty === df);
        const tbody = document.getElementById('qTableBody');
        if (tbody) tbody.innerHTML = window._renderQRows(filtered);
        const countEl = document.getElementById('qFilterCount');
        if (countEl) countEl.textContent = `筛选结果：${filtered.length} 题`;
    };
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
                        <div style="font-size:13px;color:#5a6b82;margin-top:2px">第${r.chapterId}章考试 · 客观题${r.autoScore || 0}分 · 待人工评分</div>
                    </div>
                    <span class="badge badge-warning">待评分</span>
                </div>
                <div style="padding:14px;background:#e8ecf4;border-radius:10px;margin-bottom:14px">
                    <div style="font-size:13px;color:#5a6b82;margin-bottom:10px;font-weight:600">📝 需人工评分的题目：</div>
                    <div style="font-size:14px;line-height:1.7">
                        ${(function() {
                            const qs = r.questionsSnapshot || [];
                            const ans = r.answers || {};
                            if (qs.length === 0 && Object.keys(ans).length === 0) {
                                return '<div style="color:#5a6b82;font-size:13px">暂无答题数据</div>';
                            }
                            let html = '';
                            let subjIdx = 0;
                            let totalSubjScore = 0;
                            const totalQs = Math.max(qs.length, Object.keys(ans).length);
                            for (let i = 0; i < totalQs; i++) {
                                const q = qs[i] || {};
                                if (q.questionType !== 'essay' && q.questionType !== 'practice') continue;
                                subjIdx++;
                                totalSubjScore += (q.score || 0);
                                const a = ans[i] || ans[String(i)] || {};
                                const typeLabel = {'essay':'问答题','practice':'实操题'}[q.questionType] || '主观题';
                                html += '<div style="margin-bottom:10px;padding:10px 12px;background:#ffffff;border-radius:8px;border-left:3px solid #7a9ec9">';
                                html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">';
                                html += '<span style="font-size:12px;font-weight:700;color:#1e2d52">主观题 ' + subjIdx + '（原题第' + (i + 1) + '题）</span>';
                                html += '<span style="font-size:11px;padding:2px 8px;background:#e3ecf7;color:#2c3e6b;border-radius:10px">' + typeLabel + ' · 满分' + q.score + '分</span>';
                                html += '</div>';
                                if (q.questionText) {
                                    html += '<div style="font-size:14px;color:#1e2d52;margin-bottom:6px;font-weight:500;line-height:1.6">' + q.questionText + '</div>';
                                }
                                html += '<div style="font-size:13px;color:#5a6b82;margin-bottom:2px">学员回答：</div>';
                                html += '<div style="padding:8px 12px;background:#f0f4fa;border-radius:6px;font-size:14px;color:#1e2d52;line-height:1.7;white-space:pre-wrap;min-height:36px;border:1px solid #c5d4ea">' + (a.text || '<span style=\'color:#b45309\'>未作答</span>') + '</div>';
                                if (a.file) {
                                    html += '<div style="margin-top:4px;font-size:12px;color:#2c3e6b;font-weight:500">📎 附件：' + a.file + '</div>';
                                }
                                html += '<div style="display:flex;align-items:center;gap:8px;margin-top:8px">';
                                html += '<span style="font-size:13px;color:#5a6b82;flex-shrink:0">本题评分：</span>';
                                html += '<input type="number" min="0" max="' + q.score + '" class="q-input" style="width:70px;padding:6px 10px" placeholder="0-' + q.score + '" id="qscore_${r.id}_' + i + '">';
                                html += '<span style="font-size:12px;color:#5a6b82">/ ' + q.score + '分</span>';
                                html += '</div>';
                                html += '</div>';
                            }
                            if (subjIdx === 0) {
                                return '<div style="color:#5a6b82;font-size:13px">本次考试无主观题，客观题已自动评分完成。</div>';
                            }
                            html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#eef6ff;border-radius:8px;margin-top:4px">';
                            html += '<span style="font-size:13px;font-weight:600;color:#2c3e6b">主观题满分合计：' + totalSubjScore + '分</span>';
                            html += '<span style="font-size:13px;color:#5a6b82">客观题：' + (r.autoScore || 0) + '分 + 主观题评分 = 总分</span>';
                            html += '</div>';
                            return html;
                        })()}
                    </div>
                </div>
                <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
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
            <div class="stat-card" style="cursor:pointer" onclick="showGradedHistory()">
                <div class="label">已评分 <span style="font-size:11px;color:#7a9ec9">点击查看</span></div>
                <div class="value" style="color:var(--primary)">${(getStore('exams') || []).filter(e => e.status === 'passed' || e.status === 'failed').length}</div>
            </div>
        </div>
        ${reviewHtml}
    `;
};

async function doSubmitScore(examId) {
    // 收集每道主观题的评分
    const inputs = document.querySelectorAll('[id^="qscore_' + examId + '_"]');
    if (inputs.length === 0) {
        showToast('未找到评分输入框', 'danger');
        return;
    }
    const scores = {};
    let allFilled = true;
    let totalManual = 0;
    inputs.forEach(inp => {
        const qIdx = inp.id.replace('qscore_' + examId + '_', '');
        if (!inp.value || inp.value === '') {
            allFilled = false;
            return;
        }
        const s = parseInt(inp.value);
        if (isNaN(s) || s < 0) {
            allFilled = false;
            return;
        }
        scores[qIdx] = s;
        totalManual += s;
    });
    if (!allFilled) {
        showToast('请为每道主观题填写评分', 'danger');
        return;
    }

    await scoreExam(examId, scores, AppState.currentUser.id);
    showToast('评分已提交，主观题合计' + totalManual + '分', 'success');

    // 移除卡片并刷新侧边栏徽标
    const card = document.getElementById('review_' + examId);
    if (card) card.remove();
    if (typeof refreshScoringBadge === 'function') refreshScoringBadge();

    // 如果没有待评分了，刷新页面显示空状态
    const remaining = document.querySelectorAll('[id^="review_"]');
    if (remaining.length === 0) {
        const container = card ? card.parentElement : document.querySelector('.stats-row');
        if (container) {
            const emptyHtml = '<div class="card" style="text-align:center;padding:48px"><div style="font-size:48px;margin-bottom:16px">✅</div><p style="color:var(--text-secondary)">暂无待评分试卷</p></div>';
            // 找到评分管理内容区域
            const contentArea = document.getElementById('mainContent') || container;
            if (!contentArea.querySelector('.card[style*="text-align:center"]')) {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = emptyHtml;
                contentArea.appendChild(wrapper.firstChild);
            }
        }
        // 更新统计数字
        const statValues = document.querySelectorAll('.stat-card .value');
        if (statValues[0]) statValues[0].textContent = '0';
        const gradedCount = (getStore('exams') || []).filter(e => e.status === 'passed' || e.status === 'failed').length;
        if (statValues[1]) statValues[1].textContent = gradedCount;
    }
}

// 管理员 - 进度监控
PageRenderers['adm-progress'] = async function(c) {
    // 并行加载数据：用户列表 + 所有用户进度 + 所有考试记录
    const [users, allProgress, allExams] = await Promise.all([
        getAllUsers(),
        getAllUsersProgress(),
        getAllExamRecords()
    ]);
    const employees = users.filter(u => u.role === ROLES.EMPLOYEE && u.isActive);

    // 按用户ID分组进度数据（避免重复查询）
    const progressByUser = {};
    for (const p of allProgress) {
        if (!progressByUser[p.userId]) progressByUser[p.userId] = [];
        progressByUser[p.userId].push(p);
    }

    // 按用户ID分组考试数据（用于计算平均分）
    const examsByUser = {};
    for (const e of (allExams || [])) {
        if (!examsByUser[e.userId]) examsByUser[e.userId] = [];
        examsByUser[e.userId].push(e);
    }

    let rows = '';
    for (const emp of employees) {
        const progress = progressByUser[emp.id] || [];
        const chapters = getChaptersForGroup(emp.group);
        const completed = progress.filter(p => p.status === 'completed').length;
        const pct = chapters.length > 0 ? Math.round((completed / chapters.length) * 100) : 0;
        
        // 计算平均分（使用内存中的考试数据）
        const userExams = examsByUser[emp.id] || [];
        const passedExams = userExams.filter(e => e.totalScore);
        const avgScore = passedExams.length > 0 ? Math.round(passedExams.reduce((a, e) => a + e.totalScore, 0) / passedExams.length) : 0;

        // 章节状态徽章
        let chBadges = '';
        chapters.forEach((ch, i) => {
            const p = progress.find(pr => pr.chapterId === ch.id);
            const status = p ? p.status : 'not_started';
            if (status === 'completed') chBadges += `<span class="badge badge-success" style="font-size:10px">Ch${i + 1}✓</span> `;
            else if (status === 'in_progress') chBadges += `<span class="badge badge-primary" style="font-size:10px">Ch${i + 1}</span> `;
            else chBadges += `<span class="badge badge-muted" style="font-size:10px">Ch${i + 1}</span> `;
        });

        rows += `<tr>
            <td><div style="display:flex;align-items:center;gap:8px">
                <div class="user-avatar" style="width:28px;height:28px;font-size:11px;border-radius:8px;background:linear-gradient(135deg,var(--primary),var(--secondary))">${emp.avatarChar}</div>
                <a href="javascript:void(0)" onclick="showEmployeeAssessmentModal('${emp.id}')" style="color:var(--primary);font-weight:600;text-decoration:none;cursor:pointer">${emp.displayName}</a>
            </div></td>
            <td>${emp.group}</td>
            <td>${completed}/${chapters.length}</td>
            <td>${avgScore || '-'}</td>
            <td><div style="display:flex;gap:2px;flex-wrap:wrap">${chBadges}</div></td>
            <td><div class="progress" style="width:100px"><div class="progress-fill pf-primary" style="width:${pct}%"></div></div></td>
            <td>${pct}%</td>
        </tr>`;
    }

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

// 管理员 - 查看员工详细评估（考核情况+胜任力+结论建议）
async function showEmployeeAssessmentModal(userId) {
    const users = await getAllUsers();
    const emp = users.find(u => u.id === userId);
    if (!emp) return;

    const chapters = getChaptersForGroup(emp.group);
    const allExams = (getStore('exams') || []).filter(e => e.userId === userId);
    const passedExams = allExams.filter(e => e.totalScore);
    const avgScore = passedExams.length > 0 ? Math.round(passedExams.reduce((a, e) => a + e.totalScore, 0) / passedExams.length) : 0;
    const pendingExams = allExams.filter(e => e.status === 'submitted' && !e.totalScore);

    // 获取人工评分
    let manualScores = {};
    if (typeof getCompetencyManualScores === 'function') {
        manualScores = await getCompetencyManualScores(userId) || {};
    }
    // localStorage 兜底
    const localManualScores = JSON.parse(localStorage.getItem('sop_competency_manual_' + userId) || '{}');
    manualScores = { ...localManualScores, ...manualScores };

    // 智能评分：基于章节考试加权计算
    const competencies = COMPETENCY_DIMENSIONS.map(dim => {
        let weightedSum = 0;
        let totalWeight = 0;
        let mappedChapters = 0;
        let coveredChapters = 0;

        dim.chapters.forEach(mapping => {
            // 检查该章节是否属于该员工组别
            const chapter = CHAPTERS_CONFIG.find(c => c.id === mapping.chapterId);
            if (!chapter) return;
            // 通用章节所有人都要考；专属章节需匹配组别
            if (chapter.groupType !== 'common' && chapter.groupType !== emp.group) return;
            
            mappedChapters++;
            const exam = allExams.find(e => e.chapterId === mapping.chapterId);
            if (exam && exam.totalScore) {
                weightedSum += exam.totalScore * mapping.weight;
                totalWeight += mapping.weight;
                coveredChapters++;
            }
        });

        const aiScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null;

        // 人工评分
        const manualScore = manualScores[dim.key] !== undefined ? manualScores[dim.key] : null;

        // 最终分 = 智能评分×50% + 人工打分×50%
        let finalScore = null;
        if (aiScore !== null && manualScore !== null) {
            finalScore = Math.round(aiScore * 0.5 + manualScore * 0.5);
        }

        return {
            key: dim.key,
            name: dim.name,
            description: dim.description,
            aiScore: aiScore,
            manualScore: manualScore,
            finalScore: finalScore,
            mappedChapters: mappedChapters,
            coveredChapters: coveredChapters
        };
    });

    // 章节考核详情
    let examRows = '';
    for (const ch of chapters) {
        const exam = allExams.find(e => e.chapterId === ch.id);
        let statusBadge = '<span class="badge badge-muted">未开始</span>';
        let score = '-';
        if (exam && exam.totalScore) {
            const config = CHAPTERS_CONFIG.find(c => c.id === ch.id);
            const passScore = config ? config.passingScore : 75;
            const passed = exam.totalScore >= passScore;
            statusBadge = `<span class="badge ${passed ? 'badge-success' : 'badge-danger'}">${passed ? '通过' : '未通过'}</span>`;
            score = exam.totalScore + '分';
        } else if (exam && exam.status === 'submitted') {
            statusBadge = '<span class="badge badge-warning">待评分</span>';
            score = '-';
        } else if (exam && exam.status === 'in_progress') {
            statusBadge = '<span class="badge badge-primary">进行中</span>';
            score = '-';
        }
        examRows += `<tr><td>第${ch.order}章 ${ch.title}</td><td>${score}</td><td>${statusBadge}</td></tr>`;
    }

    // 胜任力柱状图（含人工打分输入）
    const compBarsHtml = competencies.map(cp => {
        // 显示分数：优先用最终分，否则用AI分或人工分
        const displayScore = cp.finalScore !== null ? cp.finalScore : (cp.aiScore !== null ? cp.aiScore : (cp.manualScore !== null ? cp.manualScore : null));
        const scoreColor = displayScore !== null ? (displayScore >= 80 ? '#10b981' : displayScore >= 60 ? '#2c3e6b' : '#ef4444') : '#9ca3af';
        const scoreDisplay = displayScore !== null ? displayScore : '--';
        const barWidth = displayScore !== null ? displayScore : 0;
        const dataCompleteness = cp.coveredChapters > 0 ? `${cp.coveredChapters}/${cp.mappedChapters}章节` : '无数据';

        // 人工打分输入框的当前值
        const manualInputVal = cp.manualScore !== null ? cp.manualScore : '';

        return `<div class="comp-bar" style="margin-bottom:16px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <div class="name" style="font-weight:600;font-size:14px;color:var(--text-primary)">${cp.name}</div>
                <div style="font-size:11px;color:var(--text-muted)">数据覆盖: ${dataCompleteness}</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                <div class="bar-wrap" style="flex:1"><div class="bar-fill" style="width:${barWidth}%;background:${scoreColor};min-width:${displayScore !== null ? '30px' : '0'}">${scoreDisplay}</div></div>
                <div class="score" style="min-width:30px;text-align:right;font-weight:600;color:${scoreColor}">${scoreDisplay}</div>
            </div>
            <div style="display:flex;gap:12px;font-size:12px;color:var(--text-muted);margin-bottom:6px">
                <span>智能: ${cp.aiScore !== null ? cp.aiScore + '分' : '--'}</span>
                <span>|</span>
                <span>人工: ${cp.manualScore !== null ? cp.manualScore + '分' : '未评'}</span>
                ${cp.finalScore !== null ? `<span>|</span><span style="font-weight:600;color:${scoreColor}">综合: ${cp.finalScore}分</span>` : ''}
            </div>
            <div style="display:flex;align-items:center;gap:8px">
                <label style="font-size:12px;color:var(--text-secondary);white-space:nowrap">人工打分:</label>
                <input type="number" min="0" max="100" value="${manualInputVal}" placeholder="0-100"
                    id="manual_score_${cp.key}"
                    style="width:70px;padding:4px 8px;border:1px solid var(--border);border-radius:6px;font-size:13px;text-align:center">
                <button onclick="saveManualScore('${userId}','${cp.key}')" class="btn btn-ghost btn-sm" style="font-size:12px;padding:3px 10px">保存</button>
            </div>
        </div>`;
    }).join('');

    // 评估结论
    const validCompetencies = competencies.filter(cp => cp.finalScore !== null || cp.aiScore !== null);
    const top2 = [...validCompetencies].sort((a, b) => {
        const sa = a.finalScore !== null ? a.finalScore : a.aiScore;
        const sb = b.finalScore !== null ? b.finalScore : b.aiScore;
        return sb - sa;
    }).slice(0, 2);
    const bottom1 = [...validCompetencies].sort((a, b) => {
        const sa = a.finalScore !== null ? a.finalScore : a.aiScore;
        const sb = b.finalScore !== null ? b.finalScore : b.aiScore;
        return sa - sb;
    }).slice(0, 1);
    const totalChapters = chapters.length;
    const completedChapters = chapters.filter(ch => {
        const e = allExams.find(ex => ex.chapterId === ch.id);
        return e && e.totalScore;
    }).length;
    const allPassed = completedChapters === totalChapters && totalChapters > 0;

    // 新的综合平均分：基于胜任力最终分（或AI分）计算
    const competencyScores = competencies.map(cp => cp.finalScore !== null ? cp.finalScore : cp.aiScore).filter(s => s !== null);
    const competencyAvg = competencyScores.length > 0 ? Math.round(competencyScores.reduce((a, b) => a + b, 0) / competencyScores.length) : 0;

    let suggestion = '';
    if (avgScore === 0) {
        suggestion = '<span style="color:#5a6b82">○ 暂无数据，学员尚未完成任何考试</span>';
    } else if (allPassed && competencyAvg >= 80) {
        suggestion = '<strong style="color:#059669">✓ 转正建议：所有章节考试已通过且综合评分优秀，建议予以转正</strong>';
    } else if (allPassed) {
        suggestion = '<strong style="color:#b45309">○ 所有章节已通过，但综合评分仍有提升空间，建议加强薄弱项后予以转正</strong>';
    } else if (pendingExams.length > 0) {
        suggestion = '<strong style="color:#5a6b82">○ 有待评分考试，待评分完成后可生成转正建议</strong>';
    } else {
        suggestion = '<strong style="color:#5a6b82">○ 完成所有章节考试后将生成转正建议</strong>';
    }

    // 渲染modal
    let existing = document.getElementById('empAssessmentModal');
    if (existing) existing.remove();

    const modalHtml = `
    <div id="empAssessmentModal" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(30,45,82,0.5);z-index:2000;display:flex;align-items:center;justify-content:center;overflow-y:auto;padding:20px" onclick="if(event.target===this)this.remove()">
        <div style="background:white;border-radius:16px;max-width:720px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:20px 24px;border-bottom:1px solid var(--border)">
                <h3 style="margin:0;font-size:18px">📋 ${emp.displayName} - 详细评估</h3>
                <button onclick="document.getElementById('empAssessmentModal').remove()" style="background:none;border:none;font-size:24px;cursor:pointer;color:var(--text-muted)">✕</button>
            </div>
            <div style="padding:24px">
                <!-- 基本信息 -->
                <div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap">
                    <div style="flex:1;min-width:140px;background:var(--bg-tertiary);border-radius:12px;padding:16px;text-align:center">
                        <div style="font-size:28px;font-weight:700;color:var(--primary)">${competencyAvg || '-'}</div>
                        <div style="font-size:12px;color:var(--text-muted);margin-top:4px">综合平均分</div>
                    </div>
                    <div style="flex:1;min-width:140px;background:var(--bg-tertiary);border-radius:12px;padding:16px;text-align:center">
                        <div style="font-size:28px;font-weight:700;color:var(--primary)">${completedChapters}/${totalChapters}</div>
                        <div style="font-size:12px;color:var(--text-muted);margin-top:4px">已完成章节</div>
                    </div>
                    <div style="flex:1;min-width:140px;background:var(--bg-tertiary);border-radius:12px;padding:16px;text-align:center">
                        <div style="font-size:28px;font-weight:700;color:${pendingExams.length > 0 ? '#f59e0b' : '#059669'}">${pendingExams.length}</div>
                        <div style="font-size:12px;color:var(--text-muted);margin-top:4px">待评分考试</div>
                    </div>
                    <div style="flex:1;min-width:140px;background:var(--bg-tertiary);border-radius:12px;padding:16px;text-align:center">
                        <div style="font-size:14px;font-weight:600;color:var(--text-primary);margin-top:8px">${emp.group}</div>
                        <div style="font-size:12px;color:var(--text-muted);margin-top:4px">所属组别</div>
                    </div>
                </div>

                <!-- 考核情况 -->
                <div style="margin-bottom:24px">
                    <h4 style="font-size:15px;margin:0 0 12px;color:var(--text-primary)">📑 考核情况</h4>
                    <div class="table-wrap">
                        <table>
                            <thead><tr><th>章节</th><th>得分</th><th>状态</th></tr></thead>
                            <tbody>${examRows}</tbody>
                        </table>
                    </div>
                </div>

                <!-- 胜任力评估 -->
                <div style="margin-bottom:24px">
                    <h4 style="font-size:15px;margin:0 0 12px;color:var(--text-primary)">🎯 胜任力维度分析</h4>
                    <div class="competency-bars">${compBarsHtml}</div>
                </div>

                <!-- 评估结论与建议 -->
                <div>
                    <h4 style="font-size:15px;margin:0 0 12px;color:var(--text-primary)">💡 评估结论与建议</h4>
                    <div style="line-height:2;color:var(--text-secondary);font-size:14px">
                        <p style="margin-bottom:12px"><strong style="color:#059669">✓ 总体评价：</strong>综合评分${competencyAvg || '暂无'}分，${competencyAvg >= 80 ? '已达到岗位要求标准，表现优秀' : competencyAvg >= 60 ? '接近岗位要求标准，继续努力' : competencyAvg > 0 ? '距离岗位要求尚有差距，需加强基础学习' : '暂无评估数据'}。</p>
                        ${competencyAvg > 0 ? `<p style="margin-bottom:12px"><strong style="color:#2c3e6b">💡 优势领域：</strong>${top2.map(c => c.name + '（' + (c.finalScore !== null ? c.finalScore : c.aiScore) + '分）').join('、')}表现突出。</p>
                        <p style="margin-bottom:12px"><strong style="color:#b45309">⚠ 待提升：</strong>${bottom1.map(c => c.name + '（' + (c.finalScore !== null ? c.finalScore : c.aiScore) + '分）').join('')}仍有提升空间。</p>` : ''}
                        <p>${suggestion}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// 保存人工评分
async function saveManualScore(userId, dimensionKey) {
    const input = document.getElementById('manual_score_' + dimensionKey);
    if (!input) return;
    const score = parseInt(input.value);
    if (isNaN(score) || score < 0 || score > 100) {
        alert('请输入 0-100 之间的整数');
        return;
    }
    
    // 保存云端
    if (isSupabaseReady()) {
        const saved = await saveCompetencyManualScore(userId, dimensionKey, score, currentUserId);
        if (!saved) {
            alert('云端保存失败，已保存到本地');
        }
    }
    
    // 同步保存到 localStorage
    const localScores = JSON.parse(localStorage.getItem('sop_competency_manual_' + userId) || '{}');
    localScores[dimensionKey] = score;
    localStorage.setItem('sop_competency_manual_' + userId, JSON.stringify(localScores));
    
    // 提示成功并刷新评估面板
    alert('评分已保存');
    showEmployeeAssessmentModal(userId);
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
                    <span style="font-size:13px;color:#5a6b82">次（超过自动交卷）</span>
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
                <div><span style="color:#5a6b82">系统版本</span><br>${APP_CONFIG.version}</div>
                <div><span style="color:#5a6b82">数据模式</span><br>${isSupabaseReady() ? '<span class="badge badge-success">Supabase</span>' : '<span class="badge badge-warning">本地模拟</span>'}</div>
                <div><span style="color:#5a6b82">章节总数</span><br>13个</div>
                <div><span style="color:#5a6b82">题库总量</span><br>${getAllExamQuestions().length}题</div>
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

// 刷新侧边栏评分徽标
async function refreshScoringBadge() {
    const badge = document.getElementById('scoringBadge');
    if (badge) {
        const pending = await getPendingReviews();
        badge.textContent = pending.length;
        badge.style.display = pending.length > 0 ? 'inline' : 'none';
    }
}

// 显示已评分历史
function showGradedHistory() {
    const exams = (getStore('exams') || []).filter(e => e.status === 'passed' || e.status === 'failed');
    const users = getStore('users') || [];
    const chapters = getStore('chapterConfig') || [];

    let rows = exams.map(e => {
        const u = users.find(u => u.id === e.userId);
        const ch = chapters.find(c => c.id === e.chapterId);
        const statusBadge = e.status === 'passed'
            ? '<span style="padding:2px 8px;border-radius:10px;background:#d1fae5;color:#065f46;font-size:11px;font-weight:600">通过</span>'
            : '<span style="padding:2px 8px;border-radius:10px;background:#fee2e2;color:#991b1b;font-size:11px;font-weight:600">未通过</span>';
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:#f8f9fc;border-radius:10px;margin-bottom:6px">' +
            '<div><span style="font-size:14px;font-weight:600;color:#1e2d52">' + (u ? u.displayName : '未知') + '</span>' +
            ' <span style="font-size:13px;color:#5a6b82;margin-left:8px">' + (ch ? ch.title : '第' + e.chapterId + '章') + '</span></div>' +
            '<div style="display:flex;gap:12px;align-items:center">' +
            '<span style="font-size:13px;color:#5a6b82">客观' + (e.autoScore || 0) + ' + 主观' + (e.manualScore || 0) + ' = <strong style="color:#1e2d52">' + e.totalScore + '</strong>分</span>' +
            statusBadge +
            '</div></div>';
    }).join('');

    if (rows === '') rows = '<div style="text-align:center;padding:32px;color:#5a6b82">暂无评分记录</div>';

    const existing = document.getElementById('gradedHistoryModal');
    if (existing) existing.remove();

    const modal = '<div id="gradedHistoryModal" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(30,45,82,0.5);z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px" onclick="if(event.target===this)this.remove()">' +
        '<div style="background:white;border-radius:16px;max-width:680px;width:100%;max-height:80vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3)">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;padding:20px 24px;border-bottom:1px solid var(--border)">' +
        '<h3 style="margin:0;font-size:18px"> 已评分记录（共' + exams.length + '份）</h3>' +
        '<button onclick="document.getElementById(\'gradedHistoryModal\').remove()" style="background:none;border:none;font-size:24px;cursor:pointer;color:var(--text-muted)">✕</button>' +
        '</div>' +
        '<div style="padding:24px">' + rows + '</div></div></div>';

    document.body.insertAdjacentHTML('beforeend', modal);
}
