const { invoke } = window.__TAURI__.core;
const { sendNotification, isPermissionGranted, requestPermission } = window.__TAURI_PLUGIN_NOTIFICATION__;
const { Engine, Render, Runner, Bodies, Body, World, Events, Mouse, MouseConstraint } = Matter;

let tasks = [];
let nextId = 1;
let taskBodies = {};
let selectedTaskId = null;
let physicsEnabled = true;

const canvasWrap = document.querySelector('.canvas-wrap');
const canvas = document.getElementById('physics-canvas');

function getSize() {
  return { w: canvasWrap.clientWidth, h: canvasWrap.clientHeight };
}

const engine = Engine.create({ gravity: { y: 1.5 } });
const { world } = engine;

let { w, h } = getSize();
canvas.width = w;
canvas.height = h;

const render = Render.create({
  canvas,
  engine,
  options: {
    width: w,
    height: h,
    background: 'transparent',
    wireframes: false,
  },
});

Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

let floor, wallL, wallR, ceiling;
function createBounds() {
  if (floor) World.remove(world, [floor, wallL, wallR, ceiling]);
  const { w, h } = getSize();
  floor = Bodies.rectangle(w / 2, h + 25, w + 100, 50, { isStatic: true, render: { fillStyle: 'transparent' } });
  wallL = Bodies.rectangle(-25, h / 2, 50, h + 100, { isStatic: true, render: { fillStyle: 'transparent' } });
  wallR = Bodies.rectangle(w + 25, h / 2, 50, h + 100, { isStatic: true, render: { fillStyle: 'transparent' } });
  ceiling = Bodies.rectangle(w / 2, -200, w + 100, 50, { isStatic: true, render: { fillStyle: 'transparent' } });
  World.add(world, [floor, wallL, wallR, ceiling]);
}
createBounds();

const mouse = Mouse.create(canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse,
  constraint: { stiffness: 0.2, render: { visible: false } },
});
World.add(world, mouseConstraint);

const BLOCK_W = 260;
const BLOCK_H = 80;

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function getDaysToDeadline(deadline) {
  if (!deadline) return null;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const d = new Date(deadline); d.setHours(0, 0, 0, 0);
  return Math.round((d - now) / (1000 * 60 * 60 * 24));
}

function deadlineBadgeText(task) {
  const days = getDaysToDeadline(task.deadline);
  if (days === null) return null;
  if (days < 0) return { txt: `${Math.abs(days)}日超過`, color: 'rgba(167,139,250,0.35)' };
  if (days === 0) return { txt: '今日が期限', color: 'rgba(239,68,68,0.35)' };
  if (days === 1) return { txt: '明日が期限', color: 'rgba(239,68,68,0.35)' };
  if (days <= 6) return { txt: `あと${days}日`, color: 'rgba(245,158,11,0.35)' };
  return { txt: `あと${days}日`, color: 'rgba(34,197,94,0.35)' };
}

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// =========================================
// 物理演算モード
// =========================================
function addBlock(task) {
  const { w } = getSize();
  const x = task.x ?? (Math.random() * (w - BLOCK_W) + BLOCK_W / 2);
  const y = task.y ?? -BLOCK_H;
  const color = task.color || '#a78bfa';

  const body = Bodies.rectangle(x, y, BLOCK_W, BLOCK_H, {
    restitution: 0.3,
    friction: 0.8,
    render: {
      fillStyle: hexToRgba(color, 0.45),
      strokeStyle: color,
      lineWidth: 2,
    },
  });

  if (task.angle != null) Body.setAngle(body, task.angle);
  if (task.x != null && task.y != null) {
    Body.setPosition(body, { x: task.x, y: task.y });
    Body.setVelocity(body, { x: 0, y: 0 });
  }

  body.taskId = task.id;
  World.add(world, body);
  taskBodies[task.id] = body;
}

function removeBlock(taskId) {
  const body = taskBodies[taskId];
  if (body) { World.remove(world, body); delete taskBodies[taskId]; }
  document.getElementById('label-' + taskId)?.remove();
}

function updateLabels() {
  if (!physicsEnabled) return;
  const labelsDiv = document.getElementById('task-labels');

  tasks.forEach(task => {
    const body = taskBodies[task.id];
    if (!body) return;

    let label = document.getElementById('label-' + task.id);
    if (!label) {
      label = document.createElement('div');
      label.className = 'task-label';
      label.id = 'label-' + task.id;
      labelsDiv.appendChild(label);
    }

    const { x, y } = body.position;
    const angle = body.angle;
    label.style.left = x + 'px';
    label.style.top = y + 'px';
    label.style.transform = `translate(-50%,-50%) rotate(${angle}rad)`;
    label.style.opacity = task.done ? '0.4' : '1';
    label.style.width = BLOCK_W + 'px';

    const isSelected = task.id === selectedTaskId;

    // ブロック本体のハイライト
    if (body) {
      if (isSelected) {
        body.render.strokeStyle = '#ffffff';
        body.render.lineWidth = 3;
      } else {
        body.render.strokeStyle = task.color || '#a78bfa';
        body.render.lineWidth = 2;
      }
    }

    // ラベルの後光
    

    const badge = deadlineBadgeText(task);
    const timeStr = task.time ? ` ${task.time}` : '';

    label.innerHTML = `
      <div class="task-label-name" style="text-decoration:${task.done ? 'line-through' : 'none'}">
        ${escHtml(task.name)}
      </div>
      ${task.deadline ? `<div class="task-label-meta">📅 ${task.deadline.replace(/-/g, '/')}${timeStr}</div>` : ''}
      ${badge ? `<span class="task-label-badge" style="background:${badge.color}">${badge.txt}</span>` : ''}
    `;

    let mouseDownPos = null;

    label.addEventListener('mousedown', (e) => {
      mouseDownPos = { x: e.clientX, y: e.clientY };
    });

    label.addEventListener('mouseup', (e) => {
      if (!mouseDownPos) return;
      const dx = e.clientX - mouseDownPos.x;
      const dy = e.clientY - mouseDownPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 5) {
        e.stopPropagation();
        selectedTaskId = (selectedTaskId === task.id) ? null : task.id;
      }
      mouseDownPos = null;
    });

    label.oncontextmenu = (e) => {
      e.preventDefault();
      selectedTaskId = task.id;
      showContextMenu(e.clientX, e.clientY, task.id);
    };

    label.oncontextmenu = (e) => {
      e.preventDefault();
      selectedTaskId = task.id;
      showContextMenu(e.clientX, e.clientY, task.id);
    };
  });
}

Events.on(engine, 'afterUpdate', updateLabels);

setInterval(() => {
  if (!physicsEnabled) return;
  tasks.forEach(task => {
    const body = taskBodies[task.id];
    if (!body) return;
    task.x = body.position.x;
    task.y = body.position.y;
    task.angle = body.angle;
  });
  saveTasks();
}, 3000);

// =========================================
// リスト表示モード
// =========================================
function renderList() {
  const wrap = document.getElementById('list-wrap');
  wrap.innerHTML = '';

  const filtered = getFilteredTasks();

  if (filtered.length === 0) {
    wrap.innerHTML = '<div style="text-align:center;color:#475569;padding:3rem 0;">タスクがありません</div>';
    return;
  }

  filtered.forEach(task => {
    const color = task.color || '#a78bfa';
    const badge = deadlineBadgeText(task);
    const timeStr = task.time ? ` ${task.time}` : '';

    const el = document.createElement('div');
    el.className = 'list-task' + (task.done ? ' done' : '');
    el.style.borderLeftColor = color;

    el.innerHTML = `
      <div class="list-task-top">
        <div class="list-task-name">${escHtml(task.name)}</div>
        <div class="list-task-actions">
          <button onclick="toggleDone(${task.id})" title="${task.done ? '未完了に戻す' : '完了にする'}">${task.done ? '↩' : '✓'}</button>
          <button onclick="openPanel(${task.id})" title="編集">✎</button>
          <button onclick="deleteTask(${task.id})" title="削除" style="color:#ef4444;">✕</button>
        </div>
      </div>
      <div class="list-task-meta">
        <span class="list-meta-item">🕐 ${getDaysSinceAdded(task.added)}日前に追加</span>
        ${task.deadline ? `<span class="list-meta-item">📅 ${task.deadline.replace(/-/g, '/')}${timeStr}</span>` : ''}
        ${badge ? `<span class="task-label-badge" style="background:${badge.color};color:#fff;">${badge.txt}</span>` : ''}
      </div>
    `;

    wrap.appendChild(el);
  });
}

function getDaysSinceAdded(added) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const d = new Date(added); d.setHours(0, 0, 0, 0);
  return Math.round((now - d) / (1000 * 60 * 60 * 24));
}

function getFilteredTasks() {
  const activeItem = document.querySelector('.menu-item.active');
  const filter = activeItem?.dataset.filter || 'all';

  return tasks.filter(task => {
    if (filter === 'overdue') {
      const d = getDaysToDeadline(task.deadline);
      return d !== null && d < 0 && !task.done;
    } else if (filter === 'done') {
      return task.done;
    } else if (filter === 'month') {
      const sel = document.getElementById('month-select');
      const m = sel ? sel.value : '';
      return task.deadline ? task.deadline.startsWith(m) : false;
    }
    return true;
  });
}

// =========================================
// コンテキストメニュー
// =========================================
function showContextMenu(cx, cy, taskId) {
  closeContextMenu();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const menu = document.createElement('div');
  menu.id = 'context-menu';
  menu.style.cssText = `
    position:fixed; left:${cx}px; top:${cy}px;
    background:#1e2a3a; border:0.5px solid rgba(255,255,255,0.15);
    border-radius:10px; padding:6px; z-index:200;
    box-shadow:0 8px 32px rgba(0,0,0,0.5); min-width:150px;
  `;

  const items = [
    { label: task.done ? '↩ 未完了に戻す' : '✓ 完了にする', action: () => toggleDone(taskId) },
    { label: '✎ 編集', action: () => openPanel(taskId) },
    { label: '✕ 削除', action: () => deleteTask(taskId), color: '#ef4444' },
  ];

  items.forEach(item => {
    const el = document.createElement('div');
    el.textContent = item.label;
    el.style.cssText = `
      padding:10px 14px; font-size:13px; cursor:pointer;
      border-radius:6px; color:${item.color || '#e2e8f0'};
      transition:background 0.1s;
    `;
    el.onmouseenter = () => el.style.background = 'rgba(255,255,255,0.08)';
    el.onmouseleave = () => el.style.background = 'transparent';
    el.onclick = () => { item.action(); closeContextMenu(); };
    menu.appendChild(el);
  });

  document.body.appendChild(menu);
  setTimeout(() => document.addEventListener('click', closeContextMenu, { once: true }), 0);
}

function closeContextMenu() {
  document.getElementById('context-menu')?.remove();
}

canvas.addEventListener('click', () => { selectedTaskId = null; });

document.addEventListener('keydown', (e) => {
  if (!selectedTaskId) return;
  if (e.key === 'Delete') {
    deleteTask(selectedTaskId);
  } else if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    toggleDone(selectedTaskId);
  } else if (e.key === 'Escape') {
    selectedTaskId = null;
  }
});

// =========================================
// 編集パネル
// =========================================
function openPanel(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  closePanel();
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.id = 'overlay';
  overlay.addEventListener('click', closePanel);

  const panel = document.createElement('div');
  panel.className = 'task-panel';
  panel.id = 'task-panel';
  panel.innerHTML = `
    <h3>タスクを編集</h3>
    <input type="text" id="p-name" value="${escHtml(task.name)}" placeholder="タスク名" />
    <div class="task-panel-row">
      <input type="date" id="p-deadline" value="${task.deadline || ''}" />
      <input type="time" id="p-time" value="${task.time || ''}" />
    </div>
    <div class="task-panel-row" style="align-items:center;gap:10px;">
      <input type="color" id="p-color" value="${task.color || '#a78bfa'}" style="width:48px;height:36px;padding:2px;border-radius:8px;cursor:pointer;border:0.5px solid rgba(255,255,255,0.15);" />
      <span style="font-size:12px;color:#64748b;">ブロックの色</span>
    </div>
    <div class="task-panel-actions">
      <button class="btn-save" id="btn-panel-save">保存</button>
      <button class="btn-close" id="btn-panel-close">キャンセル</button>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(panel);

  document.getElementById('btn-panel-save').onclick = () => savePanel(taskId);
  document.getElementById('btn-panel-close').onclick = closePanel;
}

function closePanel() {
  document.getElementById('overlay')?.remove();
  document.getElementById('task-panel')?.remove();
}

function savePanel(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  const name = document.getElementById('p-name').value.trim();
  if (name) task.name = name;
  task.deadline = document.getElementById('p-deadline').value || null;
  task.time = document.getElementById('p-time').value || null;
  task.color = document.getElementById('p-color').value;

  const body = taskBodies[task.id];
  if (body) {
    body.render.fillStyle = hexToRgba(task.color, 0.45);
    body.render.strokeStyle = task.color;
  }

  closePanel();
  buildMonthOptions();
  updateStats();
  if (!physicsEnabled) renderList();
  saveTasks();
  updateTaskOnServer(task);
}

// =========================================
// タスク操作
// =========================================
async function toggleDone(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.done = !task.done;
    if (task.done) {
      let permitted = await isPermissionGranted();
      if (!permitted) {
        const permission = await requestPermission();
        permitted = permission === 'granted';
      }
      if (permitted) {
        sendNotification({ title: '✓ タスク完了', body: task.name });
      }
    }
    buildMonthOptions();
    updateStats();
    if (!physicsEnabled) renderList();
    saveTasks();
  }
}
function deleteTask(taskId) {
  removeBlock(taskId);
  tasks = tasks.filter(t => t.id !== taskId);
  if (selectedTaskId === taskId) selectedTaskId = null;
  buildMonthOptions();
  updateStats();
  if (!physicsEnabled) renderList();
  deleteTaskOnServer(taskId);
  saveTasks();
}

// =========================================
// 物理演算トグル
// =========================================
function togglePhysics() {
  physicsEnabled = !physicsEnabled;
  const btn = document.getElementById('btn-physics');
  const canvasWrapEl = document.querySelector('.canvas-wrap');
  const listView = document.getElementById('list-view');

  if (physicsEnabled) {
    engine.gravity.y = 1.5;
    canvasWrapEl.style.display = 'block';
    listView.style.display = 'none';
    document.getElementById('task-labels').innerHTML = '';
    // ブロックがないタスクを追加
    tasks.forEach(task => {
      if (!taskBodies[task.id]) {
        addBlock(task);
      }
    });
    Object.values(taskBodies).forEach(body => {
      Body.setStatic(body, false);
      Body.setVelocity(body, { x: 0, y: 0 });
    });
    btn.textContent = '🌍 物理: ON';
  } else {
    engine.gravity.y = 0;
    canvasWrapEl.style.display = 'none';
    listView.style.display = 'block';
    btn.textContent = '🚫 物理: OFF';
    renderList();
  }
}

// =========================================
// フィルター
// =========================================
function buildMonthOptions() {
  const sel = document.getElementById('month-select');
  if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = '';
  const months = new Set();
  tasks.forEach(task => {
    if (task.deadline && !task.done) {
      months.add(task.deadline.slice(0, 7));
    }
  });
  const sorted = Array.from(months).sort();
  sorted.forEach(m => {
    const [y, mo] = m.split('-');
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = `${y}年${parseInt(mo)}月`;
    sel.appendChild(opt);
  });
  if (sorted.includes(prev)) sel.value = prev;
  else if (sorted.length > 0) sel.value = sorted[0];
}

document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    const wrap = document.getElementById('month-select-wrap');
    wrap.style.display = item.dataset.filter === 'month' ? 'block' : 'none';
    applyFilter(item.dataset.filter);
    if (!physicsEnabled) renderList();
  });
});

document.getElementById('month-select')?.addEventListener('change', () => {
  const activeItem = document.querySelector('.menu-item.active');
  if (activeItem?.dataset.filter === 'month') {
    applyFilter('month');
    if (!physicsEnabled) renderList();
  }
});

function applyFilter(filter) {
  if (!physicsEnabled) return;
  tasks.forEach(task => {
    const body = taskBodies[task.id];
    const label = document.getElementById('label-' + task.id);
    let visible = true;

    if (filter === 'overdue') {
      const d = getDaysToDeadline(task.deadline);
      visible = d !== null && d < 0 && !task.done;
    } else if (filter === 'done') {
      visible = task.done;
    } else if (filter === 'month') {
      const sel = document.getElementById('month-select');
      const m = sel ? sel.value : '';
      visible = task.deadline ? task.deadline.startsWith(m) : false;
    }

    const alpha = visible ? 0.45 : 0.08;
    if (body) body.render.fillStyle = hexToRgba(task.color || '#a78bfa', alpha);
    if (label) label.style.opacity = visible ? (task.done ? '0.4' : '1') : '0.1';
  });
}

// =========================================
// 統計
// =========================================
function updateStats() {
  document.getElementById('s-total').textContent = tasks.length;
  document.getElementById('s-done').textContent = tasks.filter(t => t.done).length;
  document.getElementById('s-over').textContent = tasks.filter(t => {
    const d = getDaysToDeadline(t.deadline);
    return d !== null && d < 0 && !t.done;
  }).length;
}

// =========================================
// リサイズ
// =========================================
window.addEventListener('resize', () => {
  const { w, h } = getSize();
  canvas.width = w;
  canvas.height = h;
  render.options.width = w;
  render.options.height = h;
  render.canvas.width = w;
  render.canvas.height = h;
  createBounds();

  // 画面外に出たブロックを画面内に戻す
  tasks.forEach(task => {
    const body = taskBodies[task.id];
    if (!body) return;
    const { x, y } = body.position;
    const clampedX = Math.max(BLOCK_W / 2, Math.min(w - BLOCK_W / 2, x));
    const clampedY = Math.min(h - BLOCK_H / 2, y);
    if (clampedX !== x || clampedY !== y) {
      Body.setPosition(body, { x: clampedX, y: clampedY });
      Body.setVelocity(body, { x: 0, y: 0 });
    }
  });
});
// =========================================
// タスク追加
// =========================================
async function addTask() {
  const name = document.getElementById('inp-name').value.trim();
  if (!name) return;
  const deadline = document.getElementById('inp-deadline').value || null;
  const time     = document.getElementById('inp-time').value || null;
  const color    = document.getElementById('inp-color').value;
  const today    = new Date().toISOString().split('T')[0];

  const task = { id: nextId++, name, added: today, deadline, time, color, done: false, x: null, y: null, angle: null };
  tasks.unshift(task);

  if (physicsEnabled) {
    addBlock(task);
  } else {
    renderList();
  }

  buildMonthOptions();
  updateStats();

  document.getElementById('inp-name').value = '';
  document.getElementById('inp-deadline').value = '';
  document.getElementById('inp-time').value = '';

  saveTasks();
  pushTaskToServer(task);
}

const SERVER_URL = 'http://192.168.1.3:3000';

async function syncWithServer() {
  try {
    const res = await fetch(`${SERVER_URL}/tasks`);
    if (!res.ok) return false;
    const serverTasks = await res.json();
    return serverTasks;
  } catch {
    return false;
  }
}

async function pushTaskToServer(task) {
  try {
    await fetch(`${SERVER_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
  } catch { /* サーバーがなくても無視 */ }
}

async function updateTaskOnServer(task) {
  try {
    await fetch(`${SERVER_URL}/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
  } catch { /* サーバーがなくても無視 */ }
}

async function deleteTaskOnServer(id) {
  try {
    await fetch(`${SERVER_URL}/tasks/${id}`, { method: 'DELETE' });
  } catch { /* サーバーがなくても無視 */ }
}

// =========================================
// 保存・読み込み
// =========================================
async function saveTasks() {
  await invoke('save_tasks', { tasks });
}


  // サーバーから取得を試みる
  async function init() {
  const serverTasks = await syncWithServer();
  if (serverTasks !== false) {
    // サーバーに繋がった場合はサーバーのデータを使う
    tasks = serverTasks;
    // ローカルのタスクをサーバーに同期
    if (tasks.length === 0) {
      const localTasks = await invoke('load_tasks');
      for (const task of localTasks) {
        await pushTaskToServer(task);
      }
      tasks = await syncWithServer() || localTasks;
    }
  } else {
    // サーバーに繋がらない場合はローカルを使う
    tasks = await invoke('load_tasks');
  }

  if (tasks.length > 0) {
    nextId = Math.max(...tasks.map(t => t.id)) + 1;
    tasks.forEach(task => addBlock(task));
  }
  buildMonthOptions();
  updateStats();
  // 以下は変更なし...

  const physicsBtn = document.createElement('button');
  physicsBtn.id = 'btn-physics';
  physicsBtn.textContent = '🌍 物理: ON';
  physicsBtn.style.cssText = `
    margin: 8px 1.25rem 0; padding: 8px 12px;
    background: rgba(167,139,250,0.15);
    border: 0.5px solid rgba(167,139,250,0.3);
    border-radius: 8px; color: #a78bfa;
    font-size: 13px; cursor: pointer;
    transition: background 0.15s;
    width: calc(100% - 2.5rem);
  `;
  physicsBtn.onclick = togglePhysics;
  document.querySelector('.sidebar-stats').before(physicsBtn);

  
}

// 期限チェック（1時間ごと）
tasks.forEach(task => {
  if (task.done) return;
  const days = getDaysToDeadline(task.deadline);
  
  // 日付ベースの通知
  if (days === 0) {
    sendNotification({ title: '🔴 今日が期限', body: task.name });
  } else if (days === 1) {
    sendNotification({ title: '🟠 明日が期限', body: task.name });
  }

  // 時間ベースの通知（期限の1時間前）
  if (task.deadline && task.time) {
    const now = new Date();
    const deadlineDate = new Date(`${task.deadline}T${task.time}`);
    const diffMs = deadlineDate - now;
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin > 0 && diffMin <= 60) {
      sendNotification({ title: '⏰ もうすぐ期限', body: `${task.name}（あと${diffMin}分）` });
    }
  }
});

document.getElementById('btn-add').addEventListener('click', addTask);
document.getElementById('inp-name').addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

  // ...

init();
