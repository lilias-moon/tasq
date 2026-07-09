export function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function getDaysToDeadline(deadline) {
  if (!deadline) return null;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const d = new Date(deadline); d.setHours(0, 0, 0, 0);
  return Math.round((d - now) / (1000 * 60 * 60 * 24));
}

export function deadlineBadgeText(task) {
  const days = getDaysToDeadline(task.deadline);
  if (days === null) return null;
  if (days < 0) return { txt: `${Math.abs(days)}日超過`, color: 'rgba(167,139,250,0.35)' };
  if (days === 0) return { txt: '今日が期限', color: 'rgba(239,68,68,0.35)' };
  if (days === 1) return { txt: '明日が期限', color: 'rgba(239,68,68,0.35)' };
  if (days <= 6) return { txt: `あと${days}日`, color: 'rgba(245,158,11,0.35)' };
  return { txt: `あと${days}日`, color: 'rgba(34,197,94,0.35)' };
}

export function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function getDaysSinceAdded(added) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const d = new Date(added); d.setHours(0, 0, 0, 0);
  return Math.round((now - d) / (1000 * 60 * 60 * 24));
}
