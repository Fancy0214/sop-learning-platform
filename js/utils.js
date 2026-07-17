/**
 * SOP Academy - 工具函数
 * Markdown解析、日期格式化、简单ID生成等
 */

// ===== 简易 Markdown 转 HTML =====
function markdownToHtml(md) {
    if (!md) return '';
    let html = md;
    // 清理残留的 markdown 标记符，避免渲染为乱码
    // 1. 移除代码围栏（``` 或 ```语言名）
    html = html.replace(/^```\w*$/gm, '');
    html = html.replace(/^```\s*$/gm, '');
    // 2. 移除未配对的孤立反引号（不成对的单个或多个反引号）
    //    先移除所有 ``` 代码围栏
    html = html.replace(/```/g, '');
    //    再移除不成对的反引号：如果反引号数量是奇数，移除多余的
    html = html.replace(/`([^`]*)`/g, '<<KEEP_INLINE_CODE>>$1<</KEEP_INLINE_CODE>>');
    html = html.replace(/`/g, '');
    html = html.replace(/<<KEEP_INLINE_CODE>>/g, '`');
    html = html.replace(/<<\/KEEP_INLINE_CODE>>/g, '`');
    // 3. 移除不成对的管道符（不在表格上下文中的孤立 |）
    html = html.replace(/^\|?\s*\|?\s*$/gm, '');
    // 4. 移除 markdown 表格中的对齐行（如 |---|---|）
    html = html.replace(/^\|?[\s-]+\|[\s-|]*$/gm, '');

    // 转义HTML
    html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // 标题
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    // 粗体、斜体
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // 行内代码（清理后只剩配对的）
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    // 引用块
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
    // 无序列表
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    // 有序列表
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    // 分隔线
    html = html.replace(/^---$/gm, '<hr>');
    // 表格
    html = html.replace(/\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)*)/gm, function(match, header, body) {
        const headers = header.split('|').map(h => h.trim()).filter(Boolean);
        const rows = body.trim().split('\n').map(row => 
            row.split('|').map(c => c.trim()).filter(Boolean)
        );
        let table = '<table><thead><tr>';
        headers.forEach(h => table += `<th>${h}</th>`);
        table += '</tr></thead><tbody>';
        rows.forEach(row => {
            table += '<tr>';
            row.forEach(c => table += `<td>${c}</td>`);
            table += '</tr>';
        });
        table += '</tbody></table>';
        return table;
    });
    // 段落
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    // 清理空段落
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p>\s*(<h[1-4]>)/g, '$1');
    html = html.replace(/(<\/h[1-4]>)\s*<\/p>/g, '$1');
    html = html.replace(/<p>\s*(<table>)/g, '$1');
    html = html.replace(/(<\/table>)\s*<\/p>/g, '$1');
    html = html.replace(/<p>\s*(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)\s*<\/p>/g, '$1');
    html = html.replace(/<p>\s*(<blockquote>)/g, '$1');
    html = html.replace(/(<\/blockquote>)\s*<\/p>/g, '$1');
    html = html.replace(/<p>\s*(<hr>)\s*<\/p>/g, '$1');

    return html;
}

// ===== 日期格式化 =====
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${formatDate(dateStr)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    const d = new Date(dateStr);
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return '刚刚';
    if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
    if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
    if (diff < 604800) return Math.floor(diff / 86400) + '天前';
    return formatDate(dateStr);
}

// ===== 计时器格式化 =====
function formatTimer(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ===== 数组洗牌 =====
function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ===== 简单UUID生成 =====
function generateId() {
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
}

// ===== Toast 通知 =====
function showToast(message, type = 'success') {
    const existing = document.querySelectorAll('.toast');
    existing.forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ===== 确认对话框 =====
function showConfirm(message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal" style="width:400px;text-align:center">
            <div style="font-size:16px;margin-bottom:24px;line-height:1.6">${message}</div>
            <div style="display:flex;gap:10px;justify-content:center">
                <button class="btn btn-ghost" id="confirmCancel">取消</button>
                <button class="btn btn-danger" id="confirmOk">确认</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#confirmCancel').onclick = () => overlay.remove();
    overlay.querySelector('#confirmOk').onclick = () => { overlay.remove(); onConfirm(); };
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

// ===== 解锁动画 =====
function showUnlockAnimation(chapterTitle, nextChapterTitle) {
    const overlay = document.createElement('div');
    overlay.className = 'unlock-overlay';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `
        <div class="unlock-box">
            <div class="unlock-icon">✓</div>
            <h2 style="margin-bottom:8px;font-size:22px">考试通过！</h2>
            <p style="color:var(--text-secondary);margin-bottom:12px">恭喜通过「${chapterTitle}」考试</p>
            <p style="color:var(--success);font-size:14px;margin-bottom:20px">🎉 已解锁「${nextChapterTitle || '下一章节'}」学习权限</p>
            <button class="btn btn-primary" onclick="this.closest('.unlock-overlay').remove()">继续学习 →</button>
        </div>
    `;
    document.body.appendChild(overlay);

    // 彩带效果
    const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
    for (let i = 0; i < 24; i++) {
        const p = document.createElement('div');
        p.className = 'confetti-piece';
        p.style.cssText = `left:${Math.random() * 100}vw;top:${-10 + Math.random() * 30}vh;background:${colors[i % colors.length]};animation-delay:${Math.random() * 0.5}s;animation-duration:${1 + Math.random()}s;width:${6 + Math.random() * 6}px;height:${6 + Math.random() * 6}px;border-radius:${Math.random() > 0.5 ? '50%' : '2px'}`;
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 2500);
    }
}

// ===== 分数环 SVG =====
function renderScoreRing(score, size = 160) {
    const r = (size / 2) - 12;
    const circum = 2 * Math.PI * r;
    const offset = circum * (1 - score / 100);
    return `
        <div class="score-ring" style="width:${size}px;height:${size}px">
            <svg width="${size}" height="${size}">
                <circle class="bg" cx="${size / 2}" cy="${size / 2}" r="${r}"/>
                <circle class="fg" cx="${size / 2}" cy="${size / 2}" r="${r}" 
                    stroke-dasharray="${circum}" stroke-dashoffset="${offset}"/>
            </svg>
            <div class="score-num">
                <div class="num">${score}</div>
                <div class="lbl">综合评分</div>
            </div>
        </div>
    `;
}

// ===== 状态徽章 =====
function statusBadge(status) {
    const map = {
        'completed': { class: 'badge-success', text: '已完成' },
        'in_progress': { class: 'badge-primary', text: '进行中' },
        'locked': { class: 'badge-muted', text: '未解锁' },
        'not_started': { class: 'badge-muted', text: '未开始' },
        'passed': { class: 'badge-success', text: '通过' },
        'failed': { class: 'badge-danger', text: '未通过' },
        'submitted': { class: 'badge-warning', text: '待评分' },
        'active': { class: 'badge-success', text: '启用' },
        'inactive': { class: 'badge-danger', text: '停用' },
        'scored': { class: 'badge-success', text: '已评分' }
    };
    const m = map[status] || { class: 'badge-muted', text: status };
    return `<span class="badge ${m.class}">${m.text}</span>`;
}

// ===== 本地存储工具 =====
function getStore(key) {
    try {
        const v = localStorage.getItem('sop_' + key);
        return v ? JSON.parse(v) : null;
    } catch { return null; }
}

function setStore(key, value) {
    try { localStorage.setItem('sop_' + key, JSON.stringify(value)); } catch {}
}
