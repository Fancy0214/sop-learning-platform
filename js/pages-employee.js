/**
 * SOP Academy - 页面渲染器
 * 员工、组长、管理员的所有页面
 */

// =====================================================
// 员工页面
// =====================================================

// 员工 - 学习首页（仪表盘）
PageRenderers['emp-dashboard'] = async function(c) {
    const user = AppState.currentUser;
    const chapters = getChaptersForGroup(user.group);
    const statuses = await getUserChapterStatus(user.id, chapters);
    const overallProgress = calcOverallProgress(statuses);
    const avgScore = calcAvgScore(user.id);
    const completedCount = statuses.filter(s => s.isCompleted).length;
    const currentChapter = statuses.find(s => s.status === 'in_progress');

    c.innerHTML = `
        <div class="topbar">
            <h2>🏠 学习首页</h2>
            <div class="topbar-actions">
                <span class="badge badge-primary">${user.group}</span>
            </div>
        </div>

        <div class="stats-row">
            <div class="stat-card">
                <div class="label">学习进度</div>
                <div class="value">${overallProgress}%</div>
                <div class="sub up">${completedCount}/${chapters.length} 章节完成</div>
            </div>
            <div class="stat-card">
                <div class="label">平均成绩</div>
                <div class="value">${avgScore || '-'}</div>
                <div class="sub">${avgScore >= 80 ? '↑ 表现优秀' : avgScore > 0 ? '继续加油' : '暂无成绩'}</div>
            </div>
            <div class="stat-card">
                <div class="label">当前章节</div>
                <div class="value" style="font-size:20px">${currentChapter ? currentChapter.title : '全部完成!'}</div>
                <div class="sub">${currentChapter ? `进度 ${currentChapter.progressPct}%` : '🎉 恭喜'}</div>
            </div>
        </div>

        <div class="card">
            <div class="card-title"><span class="emoji">📖</span>章节概览</div>
            <div class="chapter-list">
                ${statuses.map((ch, i) => `
                    <div class="ch-item ch-${ch.status === 'completed' ? 'done' : ch.status === 'in_progress' ? 'active' : 'locked'}"
                         onclick="${ch.isUnlocked ? `navigateTo('emp-learn-${ch.id}')` : 'void(0)'}">
                        <div class="ch-num">${i + 1}</div>
                        <div class="ch-info">
                            <div class="ch-title">${ch.title}</div>
                            <div class="ch-desc">${ch.groupType === 'common' ? '通用章节' : user.group + '专用'}</div>
                        </div>
                        <div class="ch-meta">
                            ${ch.isCompleted ? '<span class="badge badge-success">✓ 已完成</span>' :
                              ch.status === 'in_progress' ? `<span class="badge badge-primary">学习中 ${ch.progressPct}%</span>` :
                              '<span class="badge badge-muted">🔒 未解锁</span>'}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
};

// 员工 - 章节列表
PageRenderers['emp-chapters'] = async function(c) {
    const user = AppState.currentUser;
    const chapters = getChaptersForGroup(user.group);
    const statuses = await getUserChapterStatus(user.id, chapters);

    c.innerHTML = `
        <div class="topbar">
            <h2>📖 章节学习</h2>
            <div class="topbar-actions">
                <span class="badge badge-primary">${user.group}</span>
            </div>
        </div>
        <div class="card" style="background:linear-gradient(135deg,rgba(99,102,241,.08),rgba(6,182,212,.05));border-color:rgba(99,102,241,.15);margin-bottom:20px">
            <p style="color:var(--text-secondary);font-size:14px">按顺序完成每个章节的学习和考试，通过后自动解锁下一章节。当前共 ${chapters.length} 个章节。</p>
        </div>
        <div class="chapter-list">
            ${statuses.map((ch, i) => `
                <div class="ch-item ch-${ch.status === 'completed' ? 'done' : ch.status === 'in_progress' ? 'active' : 'locked'}"
                     onclick="${ch.isUnlocked ? `navigateTo('emp-learn-${ch.id}')` : 'void(0)'}">
                    <div class="ch-num">${i + 1}</div>
                    <div class="ch-info">
                        <div class="ch-title">${ch.title}</div>
                        <div class="ch-desc">${ch.description || ''}</div>
                    </div>
                    <div class="ch-meta">
                        ${ch.isCompleted ? '<span class="badge badge-success">✓ 已通过</span>' :
                          ch.status === 'in_progress' ? `<span class="badge badge-primary">学习中</span>` :
                          '<span class="badge badge-muted">🔒</span>'}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
};

// 员工 - 章节学习页（动态注册）
function registerLearnPage(chapterId) {
    PageRenderers['emp-learn-' + chapterId] = async function(c) {
        const user = AppState.currentUser;
        const chapter = CHAPTERS_CONFIG.find(ch => ch.id === chapterId);
        if (!chapter) { c.innerHTML = '<div class="card"><p>章节不存在</p></div>'; return; }

        // 检查权限
        const chapters = getChaptersForGroup(user.group);
        const statuses = await getUserChapterStatus(user.id, chapters);
        const currentStatus = statuses.find(s => s.id === chapterId);
        if (!currentStatus || !currentStatus.isUnlocked) {
            c.innerHTML = '<div class="card"><p>🔒 该章节尚未解锁</p><button class="btn btn-ghost" onclick="navigateTo(\'emp-chapters\')">返回章节列表</button></div>';
            return;
        }

        // 获取学习内容
        const contents = await getLearningContent(chapterId);
        const contentHtml = contents.length > 0 ? markdownToHtml(contents[0].body) : '<p>内容加载中...</p>';

        // 获取考试记录
        const examRecord = await getExamRecord(user.id, chapterId);
        const hasPassedExam = examRecord && (examRecord.status === 'passed' || examRecord.status === 'scored');
        const hasSubmittedExam = examRecord && examRecord.status === 'submitted';

        c.innerHTML = `
            <div class="topbar">
                <h2>📖 ${chapter.title}</h2>
                <div class="topbar-actions">
                    <button class="btn btn-ghost btn-sm" onclick="navigateTo('emp-chapters')">← 返回列表</button>
                    ${!hasPassedExam && !hasSubmittedExam ? `<button class="btn btn-primary btn-sm" onclick="navigateTo('emp-exam-${chapterId}')">开始考试 →</button>` : ''}
                    ${hasPassedExam ? '<span class="badge badge-success">✓ 考试已通过</span>' : ''}
                    ${hasSubmittedExam ? '<span class="badge badge-warning">考试已提交，待评分</span>' : ''}
                </div>
            </div>

            <div class="card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
                    <div class="card-title" style="margin:0"><span class="emoji">📄</span>学习要点</div>
                    <div style="display:flex;gap:8px">
                        <button class="btn btn-ghost btn-sm" onclick="markChapterRead(${chapterId})">✓ 标记已读</button>
                    </div>
                </div>
                <div class="learning-content md-content" id="learningBody">
                    ${contentHtml}
                </div>
            </div>

            ${!hasPassedExam && !hasSubmittedExam ? `
            <div class="card" style="border-color:rgba(99,102,241,.3);background:linear-gradient(135deg,rgba(99,102,241,.05),transparent)">
                <div style="text-align:center;padding:20px 0">
                    <p style="font-size:16px;font-weight:600;margin-bottom:8px">学习完成后，即可参加章节考试</p>
                    <p style="color:#5a6b82;font-size:14px;margin-bottom:20px">及格分数：${chapter.passingScore}分 · 限时：${chapter.timeLimit}分钟</p>
                    <button class="btn btn-primary" onclick="navigateTo('emp-exam-${chapterId}')" style="padding:14px 40px;font-size:16px">
                        📝 开始考试
                    </button>
                </div>
            </div>` : ''}
        `;

        // 更新学习进度
        if (currentStatus.status === 'locked' || currentStatus.progressPct === 0) {
            await updateProgress(user.id, chapterId, 'in_progress', 10);
        }
    };
}

// 注册所有13个章节的学习页
for (let i = 1; i <= 13; i++) { registerLearnPage(i); }

// 标记章节已读
async function markChapterRead(chapterId) {
    const user = AppState.currentUser;
    await updateProgress(user.id, chapterId, 'completed', 100);
    showToast('已标记为已读！可以继续考试了');
    navigateTo('emp-learn-' + chapterId);
}

// 员工 - 考试列表
PageRenderers['emp-exams'] = async function(c) {
    const user = AppState.currentUser;
    const chapters = getChaptersForGroup(user.group);
    const statuses = await getUserChapterStatus(user.id, chapters);
    const allExams = (getStore('exams') || []).filter(e => e.userId === user.id);

    let examRows = '';
    for (const ch of chapters) {
        const exam = allExams.find(e => e.chapterId === ch.id);
        const chStatus = statuses.find(s => s.id === ch.id);
        const canExam = chStatus && chStatus.status === 'completed';

        if (exam) {
            examRows += `
                <tr>
                    <td>${ch.title}</td>
                    <td>${statusBadge(exam.status)}</td>
                    <td>${exam.totalScore || exam.autoScore || '-'}</td>
                    <td>${ch.passingScore}</td>
                    <td>
                        ${exam.status === 'in_progress' ? `<button class="btn btn-primary btn-sm" onclick="navigateTo('emp-exam-${ch.id}')">继续答题</button>` :
                          exam.status === 'submitted' ? '<span class="text-muted" style="font-size:13px">等待评分</span>' :
                          exam.status === 'passed' ? '<span class="text-success" style="font-size:13px">✓ 已通过</span>' :
                          exam.status === 'failed' ? `<button class="btn btn-warning btn-sm" onclick="navigateTo('emp-exam-${ch.id}')">重新考试</button>` :
                          '-'
                        }
                    </td>
                </tr>`;
        } else if (canExam) {
            examRows += `
                <tr>
                    <td>${ch.title}</td>
                    <td><span class="badge badge-primary">可考试</span></td>
                    <td>-</td>
                    <td>${ch.passingScore}</td>
                    <td><button class="btn btn-primary btn-sm" onclick="navigateTo('emp-exam-${ch.id}')">开始考试</button></td>
                </tr>`;
        } else {
            examRows += `
                <tr>
                    <td>${ch.title}</td>
                    <td><span class="badge badge-muted">🔒 未解锁</span></td>
                    <td>-</td>
                    <td>${ch.passingScore}</td>
                    <td><span class="text-muted" style="font-size:13px">需先完成学习</span></td>
                </tr>`;
        }
    }

    c.innerHTML = `
        <div class="topbar"><h2>📝 我的考试</h2></div>
        <div class="card">
            <div class="table-wrap">
                <table>
                    <thead><tr><th>章节</th><th>状态</th><th>得分</th><th>及格线</th><th>操作</th></tr></thead>
                    <tbody>${examRows}</tbody>
                </table>
            </div>
        </div>
    `;
};

// 员工 - 评估报告
PageRenderers['emp-report'] = async function(c) {
    const user = AppState.currentUser;
    const chapters = getChaptersForGroup(user.group);
    const statuses = await getUserChapterStatus(user.id, chapters);
    const allExams = (getStore('exams') || []).filter(e => e.userId === user.id);

    const passedExams = allExams.filter(e => e.totalScore);
    const avgScore = passedExams.length > 0 ? Math.round(passedExams.reduce((a, e) => a + e.totalScore, 0) / passedExams.length) : 0;
    const overallProgress = calcOverallProgress(statuses);

    // 胜任力维度（模拟）
    const competencies = [
        { name: '专业知识', score: Math.min(95, avgScore + Math.floor(Math.random() * 10 - 3)), grad: 'url(#barGrad1)' },
        { name: '沟通技巧', score: Math.min(92, avgScore + Math.floor(Math.random() * 10 - 5)), grad: 'url(#barGrad2)' },
        { name: '需求分析', score: Math.min(90, avgScore + Math.floor(Math.random() * 10 - 4)), grad: 'url(#barGrad1)' },
        { name: '转化能力', score: Math.max(60, avgScore - Math.floor(Math.random() * 10)), grad: 'url(#barGrad3)' },
        { name: '系统操作', score: Math.min(93, avgScore + Math.floor(Math.random() * 8 - 2)), grad: 'url(#barGrad2)' },
        { name: '团队协作', score: Math.min(88, avgScore + Math.floor(Math.random() * 10 - 6)), grad: 'url(#barGrad1)' },
    ];

    // 章节详情
    let chapterDetails = '';
    for (const ch of chapters) {
        const exam = allExams.find(e => e.chapterId === ch.id);
        const status = statuses.find(s => s.id === ch.id);
        let badge = '';
        if (exam && exam.totalScore) badge = `<span class="badge badge-success">通过 ${exam.totalScore}分</span>`;
        else if (exam && exam.status === 'submitted') badge = `<span class="badge badge-warning">待评分</span>`;
        else if (status && status.isCompleted) badge = `<span class="badge badge-primary">已学习</span>`;
        else badge = `<span class="badge badge-muted">未开始</span>`;

        chapterDetails += `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:var(--bg-tertiary);border-radius:10px">
            <span style="font-size:14px">${ch.title}</span>${badge}
        </div>`;
    }

    const allPassed = statuses.every(s => s.isCompleted);
    const compBarsHtml = competencies.map(cp => `
        <div class="comp-bar">
            <div class="name">${cp.name}</div>
            <div class="bar-wrap"><div class="bar-fill" style="width:${cp.score}%;background:${cp.grad}">${cp.score}</div></div>
            <div class="score">${cp.score}</div>
        </div>
    `).join('');

    c.innerHTML = `
        <div class="topbar">
            <h2>📈 我的评估</h2>
            <div class="topbar-actions">
                ${avgScore > 0 ? `<button class="btn btn-primary btn-sm" onclick="showToast('PDF导出功能','warning')">📄 导出PDF</button>` : ''}
            </div>
        </div>

        ${avgScore > 0 ? `
        <div class="report-hero">
            <div style="font-size:24px;font-weight:700;margin-bottom:4px">综合学习评估报告</div>
            <div style="color:#5a6b82;font-size:14px;margin-bottom:20px">${user.group} · ${user.displayName}</div>
            ${renderScoreRing(avgScore)}
        </div>` : `
        <div class="card" style="text-align:center;padding:48px">
            <div style="font-size:48px;margin-bottom:16px">📊</div>
            <p style="font-size:16px;color:var(--text-secondary)">完成考试后将生成评估报告</p>
            <p style="color:#5a6b82;margin-top:8px">当前进度：${overallProgress}%</p>
        </div>`}

        <div class="card">
            <div class="card-title"><span class="emoji">📑</span>章节评估详情</div>
            <div style="display:flex;flex-direction:column;gap:8px">${chapterDetails}</div>
        </div>

        ${avgScore > 0 ? `
        <div class="card">
            <div class="card-title"><span class="emoji">🎯</span>胜任力维度分析</div>
            <div class="competency-bars">${compBarsHtml}</div>
        </div>

        <div class="card">
            <div class="card-title"><span class="emoji">💡</span>评估结论与建议</div>
            <div style="line-height:2;color:var(--text-secondary);font-size:14px">
                <p style="margin-bottom:12px"><strong style="color:#059669">✓ 总体评价：</strong>综合评分${avgScore}分，${avgScore >= 80 ? '已达到岗位要求标准，表现优秀' : '接近岗位要求标准，继续努力'}。</p>
                <p style="margin-bottom:12px"><strong style="color:#2c3e6b">💡 优势领域：</strong>${competencies.sort((a, b) => b.score - a.score).slice(0, 2).map(c => c.name + '（' + c.score + '分）').join('、')}表现突出。</p>
                <p style="margin-bottom:12px"><strong style="color:#b45309">⚠ 待提升：</strong>${competencies.sort((a, b) => a.score - b.score).slice(0, 1).map(c => c.name + '（' + c.score + '分）').join('')}仍有提升空间。</p>
                <p><strong style="color:${allPassed ? '#059669' : '#5a6b82'}">${allPassed ? '✓ 转正建议：所有章节已通过，综合评估优秀，建议予以转正' : '○ 完成所有章节考试后将生成转正建议'}</strong></p>
            </div>
        </div>` : ''}
    `;
};
