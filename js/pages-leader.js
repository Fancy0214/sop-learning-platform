/**
 * SOP Academy - 组长页面
 */

// 组长 - 组内概览
PageRenderers['ldr-overview'] = async function(c) {
    const user = AppState.currentUser;
    const users = await getAllUsers(user.group);
    const members = users.filter(u => u.role === ROLES.EMPLOYEE && u.isActive && u.group === user.group);

    let memberCards = '';
    let totalProgress = 0;
    let completedAll = 0;

    for (const emp of members) {
        const progress = await getUserProgress(emp.id);
        const chapters = getChaptersForGroup(emp.group);
        const completed = progress.filter(p => p.status === 'completed').length;
        const pct = chapters.length > 0 ? Math.round((completed / chapters.length) * 100) : 0;
        const avgScore = calcAvgScore(emp.id);
        totalProgress += pct;
        if (pct === 100) completedAll++;

        memberCards += `
            <div class="card" style="margin:0">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
                    <div class="user-avatar av-primary" style="width:40px;height:40px;font-size:16px;border-radius:12px">${emp.avatarChar}</div>
                    <div>
                        <div style="font-weight:600">${emp.displayName}</div>
                        <div style="font-size:12px;color:var(--text-muted)">${emp.group}</div>
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
                    <div style="padding:10px;background:var(--bg-tertiary);border-radius:8px;text-align:center">
                        <div style="font-size:12px;color:var(--text-muted)">章节进度</div>
                        <div style="font-size:20px;font-weight:700;font-family:Outfit">${completed}/${chapters.length}</div>
                    </div>
                    <div style="padding:10px;background:var(--bg-tertiary);border-radius:8px;text-align:center">
                        <div style="font-size:12px;color:var(--text-muted)">平均分</div>
                        <div style="font-size:20px;font-weight:700;font-family:Outfit">${avgScore || '-'}</div>
                    </div>
                </div>
                <div class="progress"><div class="progress-fill pf-primary" style="width:${pct}%"></div></div>
                <div class="progress-label"><span>学习进度</span><span>${pct}%</span></div>
            </div>
        `;
    }

    const avgProgress = members.length > 0 ? Math.round(totalProgress / members.length) : 0;

    c.innerHTML = `
        <div class="topbar">
            <h2>👥 组内概览</h2>
            <div class="topbar-actions">
                <span class="badge badge-primary">${user.group}</span>
            </div>
        </div>
        <div class="stats-row">
            <div class="stat-card">
                <div class="label">组员人数</div>
                <div class="value">${members.length}</div>
            </div>
            <div class="stat-card">
                <div class="label">平均进度</div>
                <div class="value">${avgProgress}%</div>
            </div>
            <div class="stat-card">
                <div class="label">已完成全部章节</div>
                <div class="value">${completedAll}</div>
            </div>
        </div>
        <div class="card" style="margin-bottom:16px"><div class="card-title"><span class="emoji">👥</span>组员列表</div></div>
        <div class="grid grid-3">${memberCards || '<div class="card" style="text-align:center;padding:32px;color:var(--text-muted)">暂无组员</div>'}</div>
    `;
};

// 组长 - 学习进度
PageRenderers['ldr-progress'] = async function(c) {
    const user = AppState.currentUser;
    const users = await getAllUsers(user.group);
    const members = users.filter(u => u.role === ROLES.EMPLOYEE && u.isActive && u.group === user.group);

    let rows = '';
    for (const emp of members) {
        const progress = await getUserProgress(emp.id);
        const chapters = getChaptersForGroup(emp.group);
        const completed = progress.filter(p => p.status === 'completed').length;
        const pct = chapters.length > 0 ? Math.round((completed / chapters.length) * 100) : 0;
        const avgScore = calcAvgScore(emp.id);

        let chBadges = '';
        chapters.forEach((ch, i) => {
            const p = progress.find(pr => pr.chapterId === ch.id);
            const status = p ? p.status : 'not_started';
            if (status === 'completed') chBadges += `<span class="badge badge-success" style="font-size:10px" title="${ch.title}">Ch${i + 1}✓</span> `;
            else if (status === 'in_progress') chBadges += `<span class="badge badge-primary" style="font-size:10px" title="${ch.title}">Ch${i + 1}</span> `;
            else chBadges += `<span class="badge badge-muted" style="font-size:10px" title="${ch.title}">Ch${i + 1}</span> `;
        });

        rows += `<tr>
            <td><div style="display:flex;align-items:center;gap:8px">
                <div class="user-avatar" style="width:28px;height:28px;font-size:11px;border-radius:8px;background:linear-gradient(135deg,var(--primary),var(--secondary))">${emp.avatarChar}</div>
                ${emp.displayName}
            </div></td>
            <td>${completed}/${chapters.length}</td>
            <td>${avgScore || '-'}</td>
            <td><div style="display:flex;gap:4px;flex-wrap:wrap">${chBadges}</div></td>
            <td><div class="progress" style="width:100px"><div class="progress-fill pf-primary" style="width:${pct}%"></div></div></td>
            <td>${pct}%</td>
        </tr>`;
    }

    c.innerHTML = `
        <div class="topbar">
            <h2>📊 学习进度</h2>
            <div class="topbar-actions">
                <span class="badge badge-primary">${user.group}</span>
            </div>
        </div>
        <div class="card">
            <div class="table-wrap">
                <table>
                    <thead><tr><th>姓名</th><th>章节完成</th><th>平均分</th><th>章节状态</th><th>进度</th><th>完成度</th></tr></thead>
                    <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">暂无数据</td></tr>'}</tbody>
                </table>
            </div>
        </div>
    `;
};

// 组长 - 考试成绩
PageRenderers['ldr-scores'] = async function(c) {
    const user = AppState.currentUser;
    const users = await getAllUsers(user.group);
    const members = users.filter(u => u.role === ROLES.EMPLOYEE && u.isActive && u.group === user.group);
    const chapters = getChaptersForGroup(user.group);

    let rows = '';
    for (const emp of members) {
        const allExams = (getStore('exams') || []).filter(e => e.userId === emp.id);
        const passedCount = allExams.filter(e => e.status === 'passed').length;
        const failedCount = allExams.filter(e => e.status === 'failed').length;
        const pendingCount = allExams.filter(e => e.status === 'submitted').length;
        const avgScore = calcAvgScore(emp.id);

        // 各章成绩
        let scoreDetails = '';
        chapters.forEach(ch => {
            const exam = allExams.find(e => e.chapterId === ch.id);
            if (exam && exam.totalScore) {
                scoreDetails += `<span class="badge ${exam.status === 'passed' ? 'badge-success' : 'badge-danger'}" style="font-size:10px" title="${ch.title}">${exam.totalScore}</span> `;
            } else if (exam && exam.status === 'submitted') {
                scoreDetails += `<span class="badge badge-warning" style="font-size:10px" title="${ch.title}">待评分</span> `;
            } else {
                scoreDetails += `<span class="badge badge-muted" style="font-size:10px" title="${ch.title}">-</span> `;
            }
        });

        rows += `<tr>
            <td><div style="display:flex;align-items:center;gap:8px">
                <div class="user-avatar" style="width:28px;height:28px;font-size:11px;border-radius:8px;background:linear-gradient(135deg,var(--primary),var(--secondary))">${emp.avatarChar}</div>
                ${emp.displayName}
            </div></td>
            <td>${passedCount}</td>
            <td>${failedCount}</td>
            <td>${pendingCount > 0 ? `<span class="badge badge-warning">${pendingCount}待评</span>` : '-'}</td>
            <td>${avgScore || '-'}</td>
            <td><div style="display:flex;gap:2px;flex-wrap:wrap">${scoreDetails}</div></td>
        </tr>`;
    }

    c.innerHTML = `
        <div class="topbar">
            <h2>📋 考试成绩</h2>
            <div class="topbar-actions">
                <span class="badge badge-primary">${user.group}</span>
            </div>
        </div>
        <div class="card">
            <div class="table-wrap">
                <table>
                    <thead><tr><th>姓名</th><th>通过</th><th>未通过</th><th>待评分</th><th>平均分</th><th>各章得分</th></tr></thead>
                    <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">暂无数据</td></tr>'}</tbody>
                </table>
            </div>
        </div>
    `;
};
