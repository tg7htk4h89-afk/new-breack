/* ═══════════════════════════════════════════════════════
   KIB WFM Portal v2 — Utils
   Date helpers, formatting, UI utilities
   ═══════════════════════════════════════════════════════ */

var U = {

  /* ── Kuwait time ──────────────────────────────────── */
  kuwaitNow() {
    // Always use Asia/Kuwait timezone regardless of browser locale
    const now = new Date();
    const kw  = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuwait' }));
    return kw;
  },
  today()      { const d = this.kuwaitNow(); return this.fmt(d); },
  nowHHMM()    { const d = this.kuwaitNow(); return this.pad(d.getHours()) + ':' + this.pad(d.getMinutes()); },
  nowHH()      { return parseInt(this.kuwaitNow().getHours()); },

  /* ── Date formatting ──────────────────────────────── */
  fmt(d) {
    // YYYY-MM-DD
    const y = d.getUTCFullYear !== undefined ? d : new Date(d);
    return y.getFullYear() + '-' + this.pad(y.getMonth() + 1) + '-' + this.pad(y.getDate());
  },

  normDate(raw) {
    // Normalise various date formats → YYYY-MM-DD
    if (!raw) return '';
    const s = String(raw).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) { // DD/MM/YYYY
      const [d, m, y] = s.split('/');
      return `${y}-${m}-${d}`;
    }
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
      const p = s.split('/');
      return `${p[2]}-${this.pad(p[1])}-${this.pad(p[0])}`;
    }
    try { return this.fmt(new Date(s)); } catch { return s; }
  },

  fmtDisplay(dateStr) {
    // "Wed, 12 Apr"
    const d = new Date(dateStr + 'T00:00:00');
    const days  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const months= ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
  },

  fmtFull(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const days  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months= ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  },

  fmtShort(dateStr) {
    // "12 Apr"
    const d = new Date(dateStr + 'T00:00:00');
    const months= ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  },

  dayName(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
  },

  isWeekend(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.getDay() === 5 || d.getDay() === 6; // Fri-Sat in Kuwait
  },

  fmt12(h) {
    if (!h) return '';
    const [hh, mm] = h.split(':');
    const n = parseInt(hh) % 24;
    const suffix = n < 12 ? 'AM' : 'PM';
    const h12 = n % 12 || 12;
    return `${h12}:${mm} ${suffix}`;
  },

  /* ── Time / minutes ───────────────────────────────── */
  pad(v) { return ('0' + v).slice(-2); },
  toMin(h) { if (!h) return 0; const [hh, mm] = h.split(':'); return parseInt(hh) * 60 + parseInt(mm); },
  fromMin(m) { m = ((m % 1440) + 1440) % 1440; return this.pad(Math.floor(m / 60)) + ':' + this.pad(m % 60); },
  elapsedStr(tsMs) {
    const s = Math.floor((Date.now() - tsMs) / 1000);
    const m = Math.floor(s / 60);
    return this.pad(m) + ':' + this.pad(s % 60);
  },

  /* ── IDs ──────────────────────────────────────────── */
  uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); },

  /* ── Name helpers ─────────────────────────────────── */
  initials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return (parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2)).toUpperCase();
  },

  AV_COLORS: ['#0D5CA6','#00A89A','#7C3AED','#B45309','#DC2626','#16A34A','#0A7FAE','#DB2777','#0891B2','#65A30D'],
  avatarColor(name) {
    if (!name) return this.AV_COLORS[0];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % this.AV_COLORS.length;
    return this.AV_COLORS[h];
  },

  /* ── Greeting ─────────────────────────────────────── */
  greet() {
    const h = this.nowHH();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  },

  /* ── DOM helpers ──────────────────────────────────── */
  $: (sel, ctx) => (ctx || document).querySelector(sel),
  $$: (sel, ctx) => [...(ctx || document).querySelectorAll(sel)],
  el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  },
  se(id, txt) { const el = document.getElementById(id); if (el) el.textContent = txt; },
  sh(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; },
  show(id) { const el = document.getElementById(id); if (el) el.style.display = ''; },
  hide(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; },

  /* ── Toast notifications ──────────────────────────── */
  _toastTimer: null,
  toast(msg, type = 'ok', dur = 3000) {
    let t = document.getElementById('kib-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'kib-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className = `kib-toast kib-toast-${type} kib-toast-in`;
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => { t.classList.remove('kib-toast-in'); }, dur);
  },

  /* ── Modal ────────────────────────────────────────── */
  modal(title, bodyHtml, footerHtml, opts = {}) {
    let m = document.getElementById('kib-modal-overlay');
    if (!m) {
      m = document.createElement('div');
      m.id = 'kib-modal-overlay';
      document.body.appendChild(m);
    }
    const w = opts.wide ? 'kib-modal-wide' : '';
    m.innerHTML = `
      <div class="kib-modal ${w}">
        <div class="kib-modal-hdr">
          <div class="kib-modal-title">${title}</div>
          <button class="kib-modal-x" onclick="U.closeModal()">✕</button>
        </div>
        <div class="kib-modal-body">${bodyHtml}</div>
        ${footerHtml ? `<div class="kib-modal-footer">${footerHtml}</div>` : ''}
      </div>`;
    m.style.display = 'flex';
    if (opts.onOpen) opts.onOpen(m);
    return m;
  },

  closeModal() {
    const m = document.getElementById('kib-modal-overlay');
    if (m) m.style.display = 'none';
  },

  /* ── Loading overlay ──────────────────────────────── */
  loading(show, msg = 'Loading…') {
    let el = document.getElementById('kib-loading');
    if (!el) {
      el = document.createElement('div');
      el.id = 'kib-loading';
      el.innerHTML = `<div class="kib-spin"></div><div class="kib-load-msg"></div>`;
      document.body.appendChild(el);
    }
    el.querySelector('.kib-load-msg').textContent = msg;
    el.style.display = show ? 'flex' : 'none';
  },

  /* ── Debounce ─────────────────────────────────────── */
  debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  },

  /* ── Relative time ────────────────────────────────── */
  timeAgo(tsStr) {
    const d = Math.floor((Date.now() - new Date(tsStr).getTime()) / 1000);
    if (d < 60) return 'Just now';
    if (d < 3600) return `${Math.floor(d / 60)}m ago`;
    if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
    return `${Math.floor(d / 86400)}d ago`;
  },

  /* ── Week helpers ─────────────────────────────────── */
  getWeekDates(anchor) {
    // Returns 7 dates Sun-Sat around anchor YYYY-MM-DD
    const d = new Date(anchor + 'T00:00:00');
    const day = d.getDay(); // 0=Sun
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - day); // roll to Sunday
    return Array.from({ length: 7 }, (_, i) => {
      const nd = new Date(sunday);
      nd.setDate(sunday.getDate() + i);
      return this.fmt(nd);
    });
  },

  addDays(dateStr, n) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return this.fmt(d);
  },

  /* ── CSV export ───────────────────────────────────── */
  downloadCSV(rows, filename) {
    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = filename;
    a.click();
  },
};
