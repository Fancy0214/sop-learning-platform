/**
 * SOP Academy - 考试模块
 * 动态注册考试页面，防作弊机制
 */

// 为每个章节注册考试页面
function registerExamPage(chapterId) {
    PageRenderers['emp-exam-' + chapterId] = async function(c) {
        const user = AppState.currentUser;
        const chapter = CHAPTERS_CONFIG.find(ch => ch.id === chapterId);
        if (!chapter) { c.innerHTML = '<div class="card"><p>章节不存在</p></div>'; return; }

        // 检查是否可以考试
        const chapters = getChaptersForGroup(user.group);
        const statuses = await getUserChapterStatus(user.id, chapters);
        const chStatus = statuses.find(s => s.id === chapterId);

        if (!chStatus || chStatus.status !== 'completed') {
            c.innerHTML = `<div class="card"><p>🔒 需先完成「${chapter.title}」的学习才能参加考试</p>
                <button class="btn btn-ghost btn-sm" onclick="navigateTo('emp-learn-${chapterId}')">返回学习</button></div>`;
            return;
        }

        // 检查是否已有通过的考试
        const examRecord = await getExamRecord(user.id, chapterId);
        if (examRecord && examRecord.status === 'passed') {
            c.innerHTML = `<div class="card">
                <div style="text-align:center;padding:32px">
                    <div style="font-size:48px;margin-bottom:16px">✅</div>
                    <h3 style="margin-bottom:8px">已通过考试</h3>
                    <p style="color:var(--text-secondary)">得分：${examRecord.totalScore}分 / 及格线：${chapter.passingScore}分</p>
                    <button class="btn btn-ghost mt-24" onclick="navigateTo('emp-chapters')">返回章节</button>
                </div></div>`;
            return;
        }

        // 考试确认页
        c.innerHTML = `
            <div class="topbar">
                <h2>📝 ${chapter.title} - 考试</h2>
                <div class="topbar-actions">
                    <button class="btn btn-ghost btn-sm" onclick="navigateTo('emp-learn-${chapterId}')">← 返回学习</button>
                </div>
            </div>

            <div class="card" style="border-color:rgba(99,102,241,.3)">
                <div style="text-align:center;padding:24px 0">
                    <div style="font-size:48px;margin-bottom:16px">📝</div>
                    <h3 style="margin-bottom:16px;font-size:20px">${chapter.title} 章节考试</h3>
                    <div style="display:flex;justify-content:center;gap:32px;margin-bottom:24px;flex-wrap:wrap">
                        <div style="text-align:center">
                            <div style="font-size:24px;font-weight:700;font-family:Outfit;color:var(--primary-light)">${chapter.timeLimit}</div>
                            <div style="font-size:12px;color:var(--text-muted)">分钟限时</div>
                        </div>
                        <div style="text-align:center">
                            <div style="font-size:24px;font-weight:700;font-family:Outfit;color:var(--primary-light)">${chapter.passingScore}</div>
                            <div style="font-size:12px;color:var(--text-muted)">及格分数</div>
                        </div>
                        <div style="text-align:center">
                            <div style="font-size:24px;font-weight:700;font-family:Outfit;color:var(--warning)">3</div>
                            <div style="font-size:12px;color:var(--text-muted)">最大切屏次数</div>
                        </div>
                    </div>
                    <div style="background:var(--bg-tertiary);border-radius:10px;padding:16px;margin-bottom:24px;text-align:left;max-width:400px;margin-left:auto;margin-right:auto">
                        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:8px"><strong>⚠️ 考试须知：</strong></p>
                        <ul style="font-size:13px;color:var(--text-muted);padding-left:20px;line-height:2">
                            <li>客观题（选择/判断/填空）自动评分</li>
                            <li>主观题（问答/实操）需管理员人工评分</li>
                            <li>切屏超过${APP_CONFIG.antiCheatMaxSwitches}次将自动交卷</li>
                            <li>题目和选项顺序每次随机打乱</li>
                            <li>超时自动提交</li>
                        </ul>
                    </div>
                    <button class="btn btn-primary" style="padding:14px 48px;font-size:16px" onclick="startExam(${chapterId})">
                        开始考试
                    </button>
                </div>
            </div>
        `;
    };
}

// 注册所有13章考试页
for (let i = 1; i <= 13; i++) { registerExamPage(i); }

// 开始考试
async function startExam(chapterId) {
    const user = AppState.currentUser;
    const chapter = CHAPTERS_CONFIG.find(ch => ch.id === chapterId);
    if (!chapter) return;

    // 获取题库
    const questions = await getChapterQuestions(chapterId);
    if (questions.length === 0) {
        showToast('该章节暂无题目', 'warning');
        return;
    }

    // 随机打乱题目和选项
    const shuffled = shuffleArray(questions).map(q => {
        const sq = { ...q };
        if (q.options && (q.questionType === 'choice_single' || q.questionType === 'true_false')) {
            const shuffledOpts = shuffleArray(q.options);
            const newAnswerIndex = shuffledOpts.findIndex(o => o.index === q.answer.index);
            sq.options = shuffledOpts;
            sq.answer = { ...q.answer, index: newAnswerIndex };
            // 更新选项的index
            sq.options = sq.options.map((o, i) => ({ ...o, index: i }));
        }
        return sq;
    }).slice(0, 10); // 每场考试取10题

    // 创建考试记录
    const exam = await createExam(user.id, chapterId, shuffled, chapter.timeLimit);
    if (!exam) {
        showToast('创建考试失败', 'danger');
        return;
    }

    // 渲染考试界面
    renderExamInterface(exam, shuffled, chapter);
}

// 渲染考试界面
function renderExamInterface(exam, questions, chapter) {
    AppState.screenSwitchCount = 0;
    const content = document.getElementById('mainContent');

    // 计算总分
    const totalPossible = questions.reduce((a, q) => a + q.score, 0);

    // 构建题目HTML
    let questionsHtml = questions.map((q, i) => {
        let inputHtml = '';

        if (q.questionType === 'choice_single' || q.questionType === 'true_false') {
            inputHtml = `<div class="q-opts">
                ${q.options.map((opt, oi) => `
                    <div class="q-opt" data-qi="${i}" data-oi="${oi}" onclick="selectOption(this, ${i}, ${oi}, 'single')">
                        <div class="radio"></div>
                        <span>${opt.text}</span>
                    </div>
                `).join('')}
            </div>`;
        } else if (q.questionType === 'choice_multi') {
            inputHtml = `<div class="q-opts">
                ${q.options.map((opt, oi) => `
                    <div class="q-opt" data-qi="${i}" data-oi="${oi}" onclick="selectOption(this, ${i}, ${oi}, 'multi')">
                        <div class="checkbox"></div>
                        <span>${opt.text}</span>
                    </div>
                `).join('')}
            </div>`;
        } else if (q.questionType === 'fill_blank') {
            inputHtml = `<input type="text" class="q-input" id="fill_${i}" placeholder="请输入答案" oninput="saveFillAnswer(${i}, this.value)">`;
        } else if (q.questionType === 'essay') {
            inputHtml = `<textarea class="q-input" id="essay_${i}" placeholder="请输入你的回答..." oninput="saveTextAnswer(${i}, this.value)" style="min-height:150px"></textarea>`;
        } else if (q.questionType === 'practice') {
            inputHtml = `
                <textarea class="q-input" id="practice_${i}" placeholder="请输入操作描述或步骤说明..." oninput="savePracticeAnswer(${i}, this.value, 'text')" style="min-height:120px"></textarea>
                <div class="file-upload mt-8" onclick="uploadPracticeFile(${i})">
                    📎 点击上传Word文档（可选）
                </div>
                <div id="fileInfo_${i}" style="margin-top:8px;font-size:13px;color:var(--text-muted)"></div>
            `;
        }

        const typeLabel = QUESTION_TYPE_LABELS[q.questionType] || q.questionType;
        const isManual = q.questionType === 'essay' || q.questionType === 'practice';

        return `<div class="q-card" style="animation-delay:${i * 0.05}s">
            <div class="q-head">
                <div style="display:flex;align-items:center;gap:8px">
                    <span style="font-size:14px;font-weight:700;color:var(--text-muted)">${i + 1}</span>
                    <span class="q-type">${typeLabel}</span>
                    ${isManual ? '<span class="badge badge-warning" style="font-size:11px">人工评分</span>' : ''}
                </div>
                <span style="font-size:13px;color:var(--text-muted)">${q.score}分</span>
            </div>
            <div class="q-text">${q.questionText}</div>
            ${inputHtml}
        </div>`;
    }).join('');

    content.innerHTML = `
        <div class="exam-header">
            <div class="exam-info">
                <div class="exam-info-item">
                    <span class="label">章节</span>
                    <span class="val">${chapter.title}</span>
                </div>
                <div class="exam-info-item">
                    <span class="label">题目</span>
                    <span class="val">${questions.length} 题 / ${totalPossible} 分</span>
                </div>
                <div class="exam-info-item">
                    <span class="label">切屏</span>
                    <span class="val" id="switchCount">0 / ${APP_CONFIG.antiCheatMaxSwitches}</span>
                </div>
            </div>
            <div class="timer" id="examTimer">${formatTimer(chapter.timeLimit * 60)}</div>
        </div>

        <div id="examQuestions">${questionsHtml}</div>

        <div style="text-align:center;padding:32px 0">
            <button class="btn btn-primary" style="padding:14px 48px;font-size:16px" onclick="confirmSubmitExam('${exam.id}', ${chapter.id})">
                提交试卷
            </button>
        </div>

        <div id="examResult"></div>
    `;

    // 启动计时器
    let timeLeft = chapter.timeLimit * 60;
    const timerEl = document.getElementById('examTimer');

    if (AppState.examTimer) clearInterval(AppState.examTimer);
    AppState.examTimer = setInterval(() => {
        timeLeft--;
        if (timerEl) {
            timerEl.textContent = formatTimer(timeLeft);
            if (timeLeft <= 60) timerEl.classList.add('danger');
        }
        if (timeLeft <= 0) {
            clearInterval(AppState.examTimer);
            showToast('考试时间到，自动提交！', 'warning');
            doSubmitExam(exam.id, questions, chapter);
        }
    }, 1000);

    // 切屏检测
    const visibilityHandler = () => {
        if (document.hidden) {
            AppState.screenSwitchCount++;
            const countEl = document.getElementById('switchCount');
            if (countEl) countEl.textContent = `${AppState.screenSwitchCount} / ${APP_CONFIG.antiCheatMaxSwitches}`;

            if (AppState.screenSwitchCount >= APP_CONFIG.antiCheatMaxSwitches) {
                showCheatWarning();
                clearInterval(AppState.examTimer);
                setTimeout(() => doSubmitExam(exam.id, questions, chapter), 3000);
            } else {
                showCheatAlert(AppState.screenSwitchCount);
            }
        }
    };
    document.addEventListener('visibilitychange', visibilityHandler);

    // 保存考试上下文供提交使用
    window._currentExam = { examId: exam.id, questions, chapter, visibilityHandler };
}

// 选择题选项点击
function selectOption(el, qi, oi, type) {
    if (type === 'single') {
        const siblings = el.parentElement.querySelectorAll('.q-opt');
        siblings.forEach(s => s.classList.remove('sel'));
        el.classList.add('sel');
        // 保存答案
        if (!window._examAnswers) window._examAnswers = {};
        window._examAnswers[qi] = { selected: oi };
    } else {
        el.classList.toggle('sel');
        if (!window._examAnswers) window._examAnswers = {};
        const selected = [];
        el.parentElement.querySelectorAll('.q-opt.sel').forEach(s => selected.push(parseInt(s.dataset.oi)));
        window._examAnswers[qi] = { selected: selected };
    }
}

// 填空题答案保存
function saveFillAnswer(qi, value) {
    if (!window._examAnswers) window._examAnswers = {};
    window._examAnswers[qi] = { text: value };
}

// 问答题答案保存
function saveTextAnswer(qi, value) {
    if (!window._examAnswers) window._examAnswers = {};
    window._examAnswers[qi] = { text: value };
}

// 实操题答案保存
function savePracticeAnswer(qi, value, type) {
    if (!window._examAnswers) window._examAnswers = {};
    window._examAnswers[qi] = { ...window._examAnswers[qi], text: value };
}

// 实操题文件上传（演示）
function uploadPracticeFile(qi) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.doc,.docx,.txt';
    input.onchange = function() {
        if (this.files.length > 0) {
            const fileName = this.files[0].name;
            const fileInfo = document.getElementById('fileInfo_' + qi);
            if (fileInfo) fileInfo.innerHTML = `📎 已选择: <strong>${fileName}</strong>`;
            if (!window._examAnswers) window._examAnswers = {};
            window._examAnswers[qi] = { ...window._examAnswers[qi], file: fileName };
        }
    };
    input.click();
}

// 确认提交
function confirmSubmitExam(examId, chapterId) {
    showConfirm('确定提交试卷吗？提交后不可修改。', () => {
        const ctx = window._currentExam;
        if (ctx) doSubmitExam(examId, ctx.questions, ctx.chapter);
    });
}

// 提交考试
async function doSubmitExam(examId, questions, chapter) {
    // 清除计时器和监听器
    if (AppState.examTimer) { clearInterval(AppState.examTimer); AppState.examTimer = null; }
    const ctx = window._currentExam;
    if (ctx && ctx.visibilityHandler) {
        document.removeEventListener('visibilitychange', ctx.visibilityHandler);
    }

    const answers = window._examAnswers || {};

    // 提交
    await submitExam(examId, answers, AppState.screenSwitchCount);

    // 计算客观题得分
    let autoScore = 0;
    let objTotal = 0;
    let subjCount = 0;

    questions.forEach((q, i) => {
        const ans = answers[i];
        if (q.questionType === 'choice_single' || q.questionType === 'true_false') {
            objTotal += q.score;
            if (ans && ans.selected === q.answer.index) autoScore += q.score;
        } else if (q.questionType === 'fill_blank') {
            objTotal += q.score;
            if (ans && ans.text && ans.text.trim().toLowerCase() === q.answer.text.trim().toLowerCase()) autoScore += q.score;
        } else {
            subjCount++;
        }
    });

    // 显示结果
    const resultArea = document.getElementById('examResult');
    if (resultArea) {
        resultArea.innerHTML = `
            <div class="card" style="border-color:var(--success);animation:scaleIn .4s ease">
                <div class="card-title"><span class="emoji">📊</span>考试结果</div>
                <div class="grid grid-3" style="margin-bottom:20px">
                    <div style="text-align:center;padding:16px;background:var(--bg-tertiary);border-radius:10px">
                        <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">客观题得分</div>
                        <div style="font-size:28px;font-weight:700;font-family:Outfit;color:var(--success)">${autoScore}</div>
                        <div style="font-size:12px;color:var(--text-muted)">/ ${objTotal}分</div>
                    </div>
                    <div style="text-align:center;padding:16px;background:var(--bg-tertiary);border-radius:10px">
                        <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">主观题</div>
                        <div style="font-size:28px;font-weight:700;font-family:Outfit;color:var(--warning)">${subjCount}题</div>
                        <div style="font-size:12px;color:var(--text-muted)">待人工评分</div>
                    </div>
                    <div style="text-align:center;padding:16px;background:var(--bg-tertiary);border-radius:10px">
                        <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">状态</div>
                        <div style="font-size:20px;font-weight:700;color:var(--warning);margin-top:4px">评分中</div>
                    </div>
                </div>
                <p style="font-size:13px;color:var(--text-muted)">客观题已自动评分（${autoScore}/${objTotal}分），主观题和实操题需管理员人工评分后才能得出最终结果。</p>
                <div style="margin-top:16px;display:flex;gap:10px">
                    <button class="btn btn-ghost btn-sm" onclick="navigateTo('emp-exams')">查看考试列表</button>
                    <button class="btn btn-primary btn-sm" onclick="navigateTo('emp-dashboard')">返回学习首页</button>
                </div>
            </div>
        `;
        resultArea.scrollIntoView({ behavior: 'smooth' });
    }

    // 模拟管理员评分（演示模式）
    setTimeout(async () => {
        const manualScore = Math.floor(Math.random() * 20) + 15; // 模拟主观题得分15-35分
        const totalScore = autoScore + manualScore;
        const exams = getStore('exams') || [];
        const exam = exams.find(e => e.id === examId);
        if (exam) {
            exam.manualScore = manualScore;
            exam.totalScore = totalScore;
            exam.status = totalScore >= chapter.passingScore ? 'passed' : 'failed';
            exam.scoredAt = new Date().toISOString();
            setStore('exams', exams);

            // 如果通过了，解锁下一章节
            if (exam.status === 'passed') {
                const user = AppState.currentUser;
                const chapters = getChaptersForGroup(user.group);
                const currentIdx = chapters.findIndex(ch => ch.id === chapter.id);
                if (currentIdx < chapters.length - 1) {
                    const nextChapter = chapters[currentIdx + 1];
                    await updateProgress(user.id, nextChapter.id, 'in_progress', 0);
                    showUnlockAnimation(chapter.title, nextChapter.title);
                }
            }
        }
    }, 3000);

    // 清除考试上下文
    window._examAnswers = {};
    window._currentExam = null;
}

// 切屏警告
function showCheatAlert(count) {
    const warning = document.createElement('div');
    warning.className = 'cheat-warning';
    warning.innerHTML = `
        <div class="cheat-warning-box">
            <div style="font-size:36px;margin-bottom:12px">⚠️</div>
            <h3 style="margin-bottom:8px;color:var(--danger)">检测到切屏！</h3>
            <p style="color:var(--text-secondary);margin-bottom:8px">这是第 ${count} 次切屏</p>
            <p style="color:var(--danger);font-size:13px">超过 ${APP_CONFIG.antiCheatMaxSwitches} 次将自动交卷</p>
            <button class="btn btn-danger btn-sm mt-16" onclick="this.closest('.cheat-warning').remove()">我知道了</button>
        </div>
    `;
    document.body.appendChild(warning);
    setTimeout(() => warning.remove(), 5000);
}

function showCheatWarning() {
    const warning = document.createElement('div');
    warning.className = 'cheat-warning';
    warning.innerHTML = `
        <div class="cheat-warning-box">
            <div style="font-size:36px;margin-bottom:12px">🚫</div>
            <h3 style="margin-bottom:8px;color:var(--danger)">切屏次数超限！</h3>
            <p style="color:var(--text-secondary)">试卷将自动提交</p>
        </div>
    `;
    document.body.appendChild(warning);
}
