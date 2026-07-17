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

    // 考试进度：按通过考核的章节数计算
    const totalChapters = chapters.length;
    const passedChapters = statuses.filter(s => {
        const exam = allExams.find(e => e.chapterId === s.id);
        return exam && exam.status === 'passed';
    }).length;
    const examProgressPct = totalChapters > 0 ? Math.round((passedChapters / totalChapters) * 100) : 0;
    const allPassed = examProgressPct === 100;

    // 章节详情
    let chapterDetails = '';
    for (const ch of chapters) {
        const exam = allExams.find(e => e.chapterId === ch.id);
        const status = statuses.find(s => s.id === ch.id);
        let badge = '';
        let clickable = false;
        if (exam && exam.totalScore && exam.status === 'passed') {
            badge = `<span class="badge badge-success">通过 ${exam.totalScore}分</span>`;
            clickable = true;
        }
        else if (exam && exam.status === 'failed') {
            badge = `<span class="badge badge-danger">未通过 ${exam.totalScore}分</span>`;
            clickable = true;
        }
        else if (exam && exam.status === 'submitted') badge = `<span class="badge badge-warning">待评分</span>`;
        else if (status && status.isCompleted) badge = `<span class="badge badge-primary">已学习</span>`;
        else badge = `<span class="badge badge-muted">未开始</span>`;

        if (clickable) {
            chapterDetails += `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:var(--bg-tertiary);border-radius:10px;cursor:pointer;transition:background .2s" onmouseover="this.style.background='#dce4f0'" onmouseout="this.style.background='var(--bg-tertiary)'" onclick="showWrongAnswerAnalysis(${ch.id},'${ch.title.replace(/'/g,"\\'")}')">
                <span style="font-size:14px">${ch.title} <span style="font-size:11px;color:#7a9ec9;margin-left:4px"> 查看解析</span></span>${badge}
            </div>`;
        } else {
            chapterDetails += `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:var(--bg-tertiary);border-radius:10px">
                <span style="font-size:14px">${ch.title}</span>${badge}
            </div>`;
        }
    }

    c.innerHTML = `
        <div class="topbar">
            <h2> 我的评估</h2>
        </div>

        <div class="card" style="padding:28px 32px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                <div>
                    <div style="font-size:18px;font-weight:700;color:var(--primary)">考试进度</div>
                    <div style="font-size:13px;color:var(--text-muted);margin-top:2px">${user.group} · ${user.displayName}</div>
                </div>
                <div style="text-align:right">
                    <div style="font-size:28px;font-weight:700;color:${allPassed ? '#10b981' : 'var(--primary)'}">${examProgressPct}%</div>
                    <div style="font-size:12px;color:var(--text-muted)">已通过 ${passedChapters}/${totalChapters} 章</div>
                </div>
            </div>
            <div style="height:16px;background:var(--bg-tertiary);border-radius:10px;overflow:hidden">
                <div style="height:100%;width:${examProgressPct}%;border-radius:10px;background:${allPassed ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#2c3e6b,#7a9ec9)'};transition:width .6s ease"></div>
            </div>
            ${allPassed ? '<div style="text-align:center;margin-top:14px;font-size:14px;font-weight:600;color:#10b981">🎉 恭喜！所有章节考核已通过！</div>' : '<div style="text-align:center;margin-top:10px;font-size:13px;color:var(--text-muted)">继续加油，完成所有章节考核！</div>'}
        </div>

        <div class="card">
            <div class="card-title"><span class="emoji"></span>章节评估详情</div>
            <div style="display:flex;flex-direction:column;gap:8px">${chapterDetails}</div>
        </div>

        <div class="card" style="text-align:center;padding:28px;background:linear-gradient(135deg,#eef2f8 0%,#e3ecf7 100%);border:none">
            <div style="font-size:16px;color:var(--primary);font-weight:600;letter-spacing:1px">🌟 学无止境，行以致远——你的成长，我们看得见</div>
        </div>
    `;
};

// 错题解析弹窗
// 清理文本中的 markdown 标记符
function sanitizeMarkdownText(text) {
    if (!text) return text;
    return text
        .replace(/\*\*(.*?)\*\*/g, '$1')   // **bold** → bold
        .replace(/\*(.*?)\*/g, '$1')        // *italic* → italic
        .replace(/`([^`]+)`/g, '$1')        // `code` → code
        .replace(/~~(.*?)~~/g, '$1')        // ~~strikethrough~~ → strikethrough
        .replace(/\|/g, '')                  // pipe → remove
        .replace(/^#{1,6}\s+/gm, '')        // heading # → remove
        .replace(/^\s*[-*+]\s+/gm, '')      // list - → remove
        .replace(/^\s*\d+\.\s+/gm, '')      // list 1. → remove
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // [text](url) → text
        .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1') // ![alt](url) → alt
        .replace(/\n{2,}/g, '<br>')          // double newline → line break
        .trim();
}

async function showWrongAnswerAnalysis(chapterId, chapterTitle) {
    const userId = AppState.currentUser.id;
    const allExams = (getStore('exams') || []).filter(e => e.userId === userId && e.chapterId === chapterId);
    if (allExams.length === 0) return;

    // 取最近一次有完整答题数据的考试
    let exam = allExams.sort((a, b) => new Date(b.submitTime || 0) - new Date(a.submitTime || 0))[0];

    // 如果没有 questionsSnapshot，无法分析
    if (!exam.questionsSnapshot || exam.questionsSnapshot.length === 0) {
        showToast('该考试暂无答题记录，无法查看解析', 'warning');
        return;
    }

    const questions = exam.questionsSnapshot;
    const answers = exam.answers || {};
    const typeLabels = {choice_single:'单选题',choice_multi:'多选题',true_false:'判断题',fill_blank:'填空题',essay:'问答题',practice:'实操题'};

    // 找出答错的客观题
    let wrongItems = [];
    let allItems = [];

    questions.forEach((q, i) => {
        const ans = answers[i] || answers[String(i)] || {};
        const isObjective = ['choice_single','choice_multi','true_false','fill_blank'].includes(q.questionType);

        if (isObjective) {
            let isCorrect = false;

            if (q.questionType === 'choice_single' || q.questionType === 'true_false') {
                // 用户答案可能是数字(实际考试)或字母(演示数据)
                let userIdx = ans.selected;
                let correctIdx = q.answer.index;
                // 统一转为数字比较
                if (typeof userIdx === 'string' && userIdx.length === 1 && userIdx >= 'A' && userIdx <= 'Z') {
                    userIdx = userIdx.charCodeAt(0) - 65;
                }
                isCorrect = (parseInt(userIdx) === correctIdx);
            } else if (q.questionType === 'choice_multi') {
                let userIndices = Array.isArray(ans.selected) ? ans.selected : [];
                let correctIndices = q.answer.indices || [];
                // 统一转为数字数组
                userIndices = userIndices.map(v => typeof v === 'string' && v.length === 1 && v >= 'A' && v <= 'Z' ? v.charCodeAt(0) - 65 : parseInt(v)).filter(v => !isNaN(v)).sort((a,b) => a-b);
                correctIndices = correctIndices.map(v => parseInt(v)).sort((a,b) => a-b);
                isCorrect = userIndices.length === correctIndices.length && userIndices.every((v, idx) => v === correctIndices[idx]);
            } else if (q.questionType === 'fill_blank') {
                let userText = (ans.text || '').trim().toLowerCase();
                let correctText = (q.answer.text || '').trim().toLowerCase();
                isCorrect = (userText === correctText);
            }

            const userAnswerText = (function() {
                if (q.questionType === 'choice_single' || q.questionType === 'true_false') {
                    let idx = ans.selected;
                    if (typeof idx === 'string' && idx.length === 1 && idx >= 'A' && idx <= 'Z') {
                        return String.fromCharCode(65 + idx.charCodeAt(0) - 65);
                    }
                    return q.options && q.options[parseInt(idx)] ? String.fromCharCode(65 + parseInt(idx)) + '. ' + q.options[parseInt(idx)].text : '(未作答)';
                } else if (q.questionType === 'choice_multi') {
                    let indices = Array.isArray(ans.selected) ? ans.selected : [];
                    if (indices.length === 0) return '(未作答)';
                    return indices.map(v => {
                        let numIdx = typeof v === 'string' && v.length === 1 && v >= 'A' && v <= 'Z' ? v.charCodeAt(0) - 65 : parseInt(v);
                        return String.fromCharCode(65 + numIdx);
                    }).join('、');
                } else if (q.questionType === 'fill_blank') {
                    return ans.text || '(未作答)';
                }
            })();

            const correctAnswerText = (function() {
                if (q.questionType === 'choice_single' || q.questionType === 'true_false') {
                    return String.fromCharCode(65 + q.answer.index) + '. ' + (q.options[q.answer.index]?.text || '');
                } else if (q.questionType === 'choice_multi') {
                    return (q.answer.indices || []).map(idx => String.fromCharCode(65 + idx) + '. ' + (q.options[idx]?.text || '')).join('；');
                } else if (q.questionType === 'fill_blank') {
                    return q.answer.text || '';
                }
            })();

            allItems.push({ q, ans, isCorrect, isObjective: true, userAnswerText, correctAnswerText, index: i });
            if (!isCorrect) wrongItems.push({ q, ans, userAnswerText, correctAnswerText, index: i });
        } else {
            // 主观题也展示，但不标记对错
            const userText = ans.text || '(未作答)';
            const refText = (function() {
                if (q.answer.keywords) return '关键词：' + q.answer.keywords.join('、');
                if (q.answer.requirements) return '要求：' + q.answer.requirements;
                return '';
            })();
            allItems.push({ q, ans, isObjective: false, userAnswerText: userText, correctAnswerText: refText, index: i });
        }
    });

    // 弹窗内容
    let wrongHtml = '';
    if (wrongItems.length === 0 && allItems.filter(it => it.isObjective).length > 0) {
        wrongHtml = `<div style="text-align:center;padding:32px">
            <div style="font-size:40px;margin-bottom:8px"></div>
            <div style="font-size:16px;font-weight:600;color:var(--success)">客观题全对！</div>
            <div style="font-size:13px;color:#5a6b82;margin-top:4px">继续保持，你太棒了！</div>
        </div>`;
    } else if (wrongItems.length === 0) {
        wrongHtml = `<div style="text-align:center;padding:32px;color:#5a6b82">暂无客观题答题数据</div>`;
    } else {
        wrongHtml = wrongItems.map((item, wi) => {
            const q = item.q;
            const isRight = item.isCorrect;
            return `<div style="margin-bottom:16px;padding:14px;background:#f8f9fc;border-radius:10px;border-left:4px solid ${isRight ? '#10b981' : '#ef4444'}">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                    <span style="font-size:12px;font-weight:700;color:#1e2d52">错题 ${wi + 1} · ${typeLabels[q.questionType] || q.questionType} · ${q.score}分</span>
                    <span style="font-size:11px;padding:2px 8px;border-radius:10px;background:${isRight ? '#d1fae5' : '#fee2e2'};color:${isRight ? '#065f46' : '#991b1b'};font-weight:600">${isRight ? '✓ 正确' : '✗ 错误'}</span>
                </div>
                <div style="font-size:14px;color:#1e2d52;margin-bottom:10px;font-weight:500;line-height:1.6">${sanitizeMarkdownText(q.questionText)}</div>
                ${q.options && q.options.length ? '<div style="margin-bottom:8px">' + q.options.map((opt, oi) => {
                    const isSelected = (function() {
                        if (q.questionType === 'choice_multi') {
                            let indices = Array.isArray(item.ans.selected) ? item.ans.selected : [];
                            return indices.map(v => typeof v === 'string' && v.length === 1 && v >= 'A' && v <= 'Z' ? v.charCodeAt(0) - 65 : parseInt(v)).includes(oi);
                        }
                        let idx = item.ans.selected;
                        if (typeof idx === 'string' && idx.length === 1 && idx >= 'A' && idx <= 'Z') idx = idx.charCodeAt(0) - 65;
                        return parseInt(idx) === oi;
                    })();
                    const isCorrect = (function() {
                        if (q.questionType === 'choice_multi') return (q.answer.indices || []).includes(oi);
                        return q.answer.index === oi;
                    })();
                    let style = 'padding:4px 10px;margin:2px 0;border-radius:6px;font-size:13px;';
                    if (isSelected && isCorrect) style += 'background:#d1fae5;border:1px solid #10b981;color:#065f46;font-weight:600';
                    else if (isSelected && !isCorrect) style += 'background:#fee2e2;border:1px solid #ef4444;color:#991b1b;font-weight:600;text-decoration:line-through';
                    else if (!isSelected && isCorrect) style += 'background:#d1fae5;border:1px solid #10b981;color:#065f46;font-weight:600';
                    else style += 'background:#f0f0f0;border:1px solid #e0e0e0;color:#666';
                    return '<div style="' + style + '">' + String.fromCharCode(65 + oi) + '. ' + sanitizeMarkdownText(opt.text) + (isSelected && !isCorrect ? ' ✗' : '') + (isSelected && isCorrect ? ' ✓' : '') + (!isSelected && isCorrect ? ' ← 正确答案' : '') + '</div>';
                }).join('') + '</div>' : ''}
                ${q.questionType === 'fill_blank' ? '<div style="margin-bottom:6px"><span style="font-size:12px;color:#ef4444;font-weight:600">你的答案：</span><span style="font-size:14px;color:#1e2d52">' + (item.userAnswerText || '(未作答)') + '</span></div><div><span style="font-size:12px;color:#10b981;font-weight:600">正确答案：</span><span style="font-size:14px;color:#1e2d52">' + item.correctAnswerText + '</span></div>' : ''}
            </div>`;
        }).join('');
    }

    // 主观题部分
    const subjItems = allItems.filter(it => !it.isObjective);
    let subjHtml = '';
    if (subjItems.length > 0) {
        subjHtml = `<div style="margin-top:20px;padding-top:16px;border-top:1px dashed #d0d7e2">
            <div style="font-size:14px;font-weight:700;color:#1e2d52;margin-bottom:12px">📝 主观题（需人工评分，以下为参考答案）</div>
            ${subjItems.map((item, si) => {
                const q = item.q;
                return `<div style="margin-bottom:14px;padding:12px;background:#f8f9fc;border-radius:10px">
                    <div style="font-size:12px;font-weight:700;color:#1e2d52;margin-bottom:6px">主观题 ${si + 1} · ${typeLabels[q.questionType] || q.questionType} · ${q.score}分</div>
                    <div style="font-size:14px;color:#1e2d52;margin-bottom:8px;font-weight:500;line-height:1.6">${sanitizeMarkdownText(q.questionText)}</div>
                    <div style="font-size:13px;color:#5a6b82;margin-bottom:4px">你的回答：</div>
                    <div style="padding:8px 12px;background:#fff;border-radius:6px;font-size:14px;color:#1e2d52;line-height:1.7;white-space:pre-wrap;min-height:30px;border:1px solid #d0d7e2">${sanitizeMarkdownText(item.userAnswerText) || '(未作答)'}</div>
                    ${item.correctAnswerText ? '<div style="font-size:13px;color:#5a6b82;margin-top:8px;margin-bottom:4px">参考要点：</div><div style="padding:6px 12px;background:#eef6ff;border-radius:6px;font-size:13px;color:#2c3e6b;line-height:1.6">' + sanitizeMarkdownText(item.correctAnswerText) + '</div>' : ''}
                </div>`;
            }).join('')}
        </div>`;
    }

    const totalObj = allItems.filter(it => it.isObjective).length;
    const wrongObjCount = wrongItems.length;
    const correctObjCount = totalObj - wrongObjCount;

    let existing = document.getElementById('wrongAnswerModal');
    if (existing) existing.remove();

    const modalHtml = `<div id="wrongAnswerModal" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(30,45,82,0.5);z-index:2000;display:flex;align-items:center;justify-content:center;overflow-y:auto;padding:20px" onclick="if(event.target===this)this.remove()">
        <div style="background:white;border-radius:16px;max-width:680px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:20px 24px;border-bottom:1px solid var(--border)">
                <h3 style="margin:0;font-size:18px">📋 第${chapterId}章 ${chapterTitle} - 答题解析</h3>
                <button onclick="document.getElementById('wrongAnswerModal').remove()" style="background:none;border:none;font-size:24px;cursor:pointer;color:var(--text-muted)">✕</button>
            </div>
            <div style="padding:24px">
                <div style="display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap">
                    <div style="flex:1;min-width:120px;background:var(--bg-tertiary);border-radius:12px;padding:14px;text-align:center">
                        <div style="font-size:24px;font-weight:700;color:var(--primary)">${totalObj}</div>
                        <div style="font-size:12px;color:var(--text-muted);margin-top:2px">客观题总数</div>
                    </div>
                    <div style="flex:1;min-width:120px;background:#d1fae5;border-radius:12px;padding:14px;text-align:center">
                        <div style="font-size:24px;font-weight:700;color:#065f46">${correctObjCount}</div>
                        <div style="font-size:12px;color:#065f46;margin-top:2px">答对</div>
                    </div>
                    <div style="flex:1;min-width:120px;background:#fee2e2;border-radius:12px;padding:14px;text-align:center">
                        <div style="font-size:24px;font-weight:700;color:#991b1b">${wrongObjCount}</div>
                        <div style="font-size:12px;color:#991b1b;margin-top:2px">答错</div>
                    </div>
                </div>
                ${wrongHtml}
                ${subjHtml}
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}