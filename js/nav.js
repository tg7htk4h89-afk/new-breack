'use strict';
/* ═══════════════════════════════════════════════════════
   KIB WFM Portal v2 — Nav v2
   Top bar: logo · page subtitle · Kuwait clock · sync dot · avatar menu · logout
   Bottom nav: role-aware, badges, active pill, iOS safe area
   ═══════════════════════════════════════════════════════ */

const Nav = (() => {

  /* ── Internal state ─────────────────────────────────── */
  let _badges   = {};
  let _clockInt = null;

  /* ── Page titles per ID ─────────────────────────────── */
  const PAGE_TITLE = {
    'home':          'Home',
    'schedule':      'My Schedule',
    'schedule-edit': 'Schedule Editor',
    'breaks':        'Breaks',
    'attendance':    'Attendance',
    'requests':      'Requests',
    'kpi':           'KPI Tracker',
    'notifications': 'Notifications',
    'admin':         'Admin Panel',
    'settings':      'Settings',
  };

  /* ── Topbar ─────────────────────────────────────────── */
  function buildTopbar(user, pageId) {
    const bar = document.getElementById('kib-topbar');
    if (!bar) return;

    const initials = U.initials(user.name);
    const color    = U.avatarColor(user.name);
    const title    = PAGE_TITLE[pageId] || 'WFM Portal';
    const roleLbl  = (CFG.ACCESS[user.access] || {}).label || user.access || '';

    bar.innerHTML = `
      <div class="tb-left">
        <div class="tb-logo">KIB</div>
        <div style="min-width:0;">
          <div class="tb-title">WFM Portal</div>
          <div class="tb-sub">${title}</div>
        </div>
      </div>
      <div class="tb-right">
        <div class="tb-clock" id="tb-clock">--:--</div>
        <div class="tb-sync-dot" id="tb-sync" title="Tap to sync" onclick="Nav.manualSync()" style="cursor:pointer;"></div>
        <div class="tb-avatar"
             style="background:${color}"
             title="${user.name}"
             onclick="Nav.showUserMenu()">${initials}</div>
        <button class="tb-logout"
                onclick="Nav.confirmLogout()"
                title="Sign out"
                aria-label="Sign out">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>`;
  }

  /* ── Clock ──────────────────────────────────────────── */
  function startClock() {
    if (_clockInt) clearInterval(_clockInt);
    const tick = () => {
      const el = document.getElementById('tb-clock');
      if (!el) return;
      try {
        const d = U.kuwaitNow();
        el.textContent = U.pad(d.getHours()) + ':' + U.pad(d.getMinutes());
      } catch(e) {}
    };
    tick();
    _clockInt = setInterval(tick, 1000);
  }

  /* ── Bottom nav ─────────────────────────────────────── */
  function buildBottomNav(user, pageId) {
    const bar = document.getElementById('kib-bottomnav');
    if (!bar) return;

    const acc  = (user.access || '').toLowerCase();
    const key  = ['wfm','admin'].includes(acc) ? acc
               : acc === 'management' ? 'management' : 'agent';
    const items = (CFG.NAV && CFG.NAV[key]) || CFG.NAV.agent || [];

    bar.innerHTML = items.map(item => {
      const isActive = item.id === pageId;
      const cnt      = _badges[item.id];
      const badge    = cnt ? `<span class="nb-badge">${cnt > 99 ? '99+' : cnt}</span>` : '';
      return `<a href="${item.page}"
                 id="nav-${item.id}"
                 aria-label="${item.label}"
                 style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
                        padding:8px 2px 10px;text-decoration:none;cursor:pointer;position:relative;
                        -webkit-tap-highlight-color:transparent;gap:3px;border-top:3px solid ${isActive ? '#0A4A8A' : 'transparent'};">
        <div style="width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;
                    font-size:20px;line-height:1;background:${isActive ? 'rgba(10,74,138,.1)' : 'transparent'};">
          <span>${item.icon}</span>
        </div>
        <span style="font-size:10px;font-weight:${isActive ? '800' : '600'};
                     color:${isActive ? '#0A4A8A' : '#64748B'};
                     white-space:nowrap;line-height:1;display:block;">
          ${item.label}
        </span>
        ${badge}
      </a>`;
    }).join('');
  }

  /* ── Public API ─────────────────────────────────────── */
  return {

    /* Call once per page */
    init(pageId) {
      try {
        const user = Auth.user();
        if (!user) { window.location.href = 'index.html'; return; }
        buildTopbar(user, pageId);
        buildBottomNav(user, pageId);
        startClock();
        Auth.startKeepAlive();
      } catch(e) {
        console.error('Nav.init error:', e);
      }
    },

    /* Sync dot — call after every API response */
    manualSync() {
      // Force full data refresh — clears cache and reloads
      if (typeof API !== 'undefined') {
        API.clearCache('getAll');
        window._lastGetAll = 0;
        const syncing = document.getElementById('tb-sync');
        if (syncing) { syncing.style.background = '#F59E0B'; syncing.title = 'Syncing...'; }
        API.getAll(true).then(() => {
          Nav.setSyncStatus(true);
          if (syncing) syncing.title = 'Tap to sync';
          // Reload current page data
          if (typeof init === 'function') init();
        }).catch(() => Nav.setSyncStatus(false));
      }
    },

    setSyncStatus(ok) {
      const dot = document.getElementById('tb-sync');
      if (!dot) return;
      dot.className = 'tb-sync-dot ' + (ok ? 'ok' : 'err');
      dot.title     = ok ? 'Connected ✓' : 'Connection issue';
    },

    /* Update badge on a nav item */
    setBadge(pageId, count) {
      _badges[pageId] = Math.max(0, count || 0);
      const link = document.getElementById('nav-' + pageId);
      if (!link) return;
      let b = link.querySelector('.nb-badge');
      if (count > 0) {
        if (!b) { b = document.createElement('span'); b.className = 'nb-badge'; link.appendChild(b); }
        b.textContent = count > 99 ? '99+' : count;
        b.style.display = '';
      } else if (b) {
        b.style.display = 'none';
      }
    },

    /* User menu modal */
    showUserMenu() {
      const user = Auth.user();
      if (!user) return;
      const color    = U.avatarColor(user.name);
      const initials = U.initials(user.name);
      const roleLbl  = (CFG.ACCESS[user.access] || {}).label || user.access || '';
      U.modal('My Account',
        `<div style="text-align:center;padding:6px 0 16px;">
          <div style="width:60px;height:60px;border-radius:18px;
                      background:${color};margin:0 auto 12px;
                      display:flex;align-items:center;justify-content:center;
                      font-size:20px;font-weight:900;color:#fff;
                      box-shadow:0 4px 16px rgba(0,0,0,.2);">${initials}</div>
          <div style="font-size:17px;font-weight:800;color:var(--t1);">${user.name}</div>
          <div style="font-size:12px;color:var(--t2);margin-top:3px;">${user.dept || ''}</div>
          <span style="display:inline-block;margin-top:8px;
                       background:rgba(10,74,138,.08);border-radius:20px;
                       padding:4px 14px;font-size:11px;font-weight:700;
                       color:var(--navy);">${roleLbl}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;
                    border-top:1px solid var(--border);padding-top:14px;">
          <a href="settings.html"
             class="btn btn-outline"
             style="justify-content:center;text-decoration:none;min-height:44px;"
             onclick="U.closeModal()">⚙️ Settings</a>
          <button class="btn"
                  style="background:var(--red);color:#fff;border-color:var(--red);min-height:44px;"
                  onclick="Auth.logout()">Sign Out</button>
        </div>`,
        ''
      );
    },

    /* Logout with confirm */
    confirmLogout() {
      if (confirm('Sign out of KIB WFM Portal?')) Auth.logout();
    },

    /* User strip (shown below topbar on inner pages) */
    renderUserStrip(extraHtml) {
      try {
        const user = Auth.user();
        if (!user) return '';
        const color    = U.avatarColor(user.name);
        const initials = U.initials(user.name);
        const roleLbl  = (CFG.ACCESS[user.access] || {}).label || user.access || '';
        return `<div class="user-strip">
          <div class="us-av" style="background:${color}">${initials}</div>
          <div class="us-info">
            <div class="us-name">${user.name}</div>
            <div class="us-meta">${user.dept || ''} · ${roleLbl}</div>
          </div>
          ${extraHtml || ''}
        </div>`;
      } catch(e) { return ''; }
    },
  };

})();
