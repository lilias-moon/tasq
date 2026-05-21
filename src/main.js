const { invoke } = window.__TAURI__.core;

let tasks = [];
let nextId = 1;
let dragSrc = null;

function getDaysToDeadline(deadline) {
  if (!deadline) return null;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const d = new Date(deadline); d.setHours(0, 0, 0, 0);
  return Math.round((d - now) / (1000 * 60 * 60 * 24));
}

function getDaysSinceAdded(added) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const d = new Date(added); d.setHours(0, 0, 0, 0);
  return Math.round((now - d) / (1000 * 60 * 60 * 24));
}

function getColor(task) {
  if (task.done) return { border: '#475569', bg: 'rgba(71,85,105,0.15)' };
  const days = getDaysToDeadline(task.deadline);
  if (days === null) return { border: '#64748b', bg: 'rgba(100,116,139,0.13)' };
  if (days < 0)  return { border: '#a78bfa', bg: 'rgba(167,139,250,0.13)' };
  if (days <= 2) return { border: '#ef4444', bg: 'rgba(239,68,68,0.13)' };
  if (days <= 6) return { border: '#f59e0b', bg: 'rgba(245,158,11,0.13)' };
  return { border: '#22c55e', bg: 'rgba(34,197,94,0.13)' };
}

function deadlineBadge(task) {
  const days = getDaysToDeadline(task.deadline);
  if (days === null) return '';
  let txt, color, bg;
  if (days < 0)      { txt = `${Math.abs(days)}日超過`; color = '#a78bfa'; bg = 'rgba(167,139,250,0.2)'; }
  else if (days === 0) { txt = '今日が期限'; color = '#ef4444'; bg = 'rgba(239,68,68,0.2)'; }
  else if (days === 1) { txt = '明日が期限'; color = '#ef4444'; bg = 'rgba(239,68,68,0.2)'; }
  else if (days <= 6)  { txt = `あと${days}日`; color = '#f59e0b'; bg = 'rgba(245,158,11,0.2)'; }
  else                 { txt = `あと${days}日`; color = '#22c55e'; bg = 'rgba(34,197,94,0.2)'; }
  return `<span class="deadline-badge" style="color:${color};background:${bg};">${txt}</span>`;
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function render() {
  const wrap = document.getElementById('stack-wrap');
  const emptyMsg = document.getElementById('empty-msg');

  wrap.querySelectorAll('.task').forEach(el => el.remove());

  if (tasks.length === 0) {
    emptyMsg.style.display = 'block';
  } else {
    emptyMsg.style.display = 'none';
  }

  tasks.forEach((t, i) => {
    const { border, bg } = getColor(t);
    const daysSince = getDaysSinceAdded(t.added);
    const sinceLabel = daysSince === 0 ? '今日追加' : `${daysSince}日前に追加`;
    const stackPos = tasks.length - i;

    const el = document.createElement('div');
    el.className = 'task' + (t.done ? ' done' : '');
    el.dataset.id = t.id;
    el.draggable = true;
    el.style.borderLeftColor = border;
    el.style.background = bg;

    el.innerHTML = `
      <div class="task-top">
        <div class="task-name">${escHtml(t.name)}</div>
        <div class="task-actions">
          <button onclick="toggleDone(${t.id})" title="${t.done ? '未完了に戻す' : '完了にする'}">
            ${t.done ? '↩' : '✓'}
          </button>
          <button onclick="toggleEdit(${t.id})" title="編集">✎</button>
          <button onclick="removeTask(${t.id})" title="削除">✕</button>
        </div>
      </div>
      <div class="task-meta">
        <span class="meta-item">🕐 ${sinceLabel}</span>
        ${t.deadline ? `<span class="meta-item">📅 ${t.deadline.replace(/-/g, '/')}</span>` : ''}
        ${deadlineBadge(t)}
      </div>
      <div class="edit-row" id="edit-${t.id}" style="display:none;">
        <input type="text" id="ename-${t.id}" value="${escHtml(t.name)}" placeholder="タスク名" />
        <input type="date" id="edl-${t.id}" value="${t.deadline || ''}" />
        <button onclick="saveEdit(${t.id})">保存</button>
      </div>
      <div class="stack-idx">#${stackPos}</div>
    `;

    el.addEventListener('dragstart', onDragStart);
    el.addEventListener('dragover', onDragOver);
    el.addEventListener('dragleave', onDragLeave);
    el.addEventListener('drop', onDrop);
    el.addEventListener('dragend', onDragEnd);

    wrap.appendChild(el);
  });

  document.getElementById('s-total').textContent = tasks.length;
  document.getElementById('s-done').textContent = tasks.filter(t => t.done).length;
  document.getElementById('s-over').textContent = tasks.filter(t => {
    const d = getDaysToDeadline(t.deadline);
    return d !== null && d < 0 && !t.done;
  }).length;
}

function addTask() {
  const name = document.getElementById('inp-name').value.trim();
  if (!name) return;
  const deadline = document.getElementById('inp-deadline').value || null;
  const today = new Date().toISOString().split('T')[0];
  tasks.unshift({ id: nextId++, name, added: today, deadline, done: false });
  document.getElementById('inp-name').value = '';
  document.getElementById('inp-deadline').value = '';
  render();
  saveTasks();
}

function removeTask(id) { tasks = tasks.filter(t => t.id !== id); render(); saveTasks(); }
function toggleDone(id) { const t = tasks.find(t => t.id === id); if (t) t.done = !t.done; render(); saveTasks(); }

function saveEdit(id) {
  const t = tasks.find(t => t.id === id);
  if (!t) return;
  const n = document.getElementById('ename-' + id).value.trim();
  const d = document.getElementById('edl-' + id).value;
  if (n) t.name = n;
  t.deadline = d || null;
  render();
  saveTasks();
}

function onDragStart(e) { dragSrc = this; this.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; }
function onDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; this.classList.add('over'); }
function onDragLeave() { this.classList.remove('over'); }
function onDrop(e) {
  e.preventDefault();
  this.classList.remove('over');
  if (dragSrc === this) return;
  const si = tasks.findIndex(t => t.id === parseInt(dragSrc.dataset.id));
  const di = tasks.findIndex(t => t.id === parseInt(this.dataset.id));
  if (si < 0 || di < 0) return;
  const [removed] = tasks.splice(si, 1);
  tasks.splice(di, 0, removed);
  render();
}
function onDragEnd() {
  document.querySelectorAll('.task').forEach(el => el.classList.remove('dragging', 'over'));
  dragSrc = null;
}


document.getElementById('btn-add').addEventListener('click', addTask);
document.getElementById('inp-name').addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

async function saveTasks() {
  await invoke('save_tasks', { tasks });
}

async function init() {
  tasks = await invoke('load_tasks');
  if (tasks.length > 0) {
    nextId = Math.max(...tasks.map(t => t.id)) + 1;
  }
  render();
}

init();