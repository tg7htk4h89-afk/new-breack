'use strict';
/* ═══════════════════════════════════════════════════════
   KIB WFM Portal v2 — Nav
   Renders topbar + bottom nav — call Nav.init(pageId)
   ═══════════════════════════════════════════════════════ */

const Nav = {

  _badges: {},

  init(currentPageId) {
    const user = Auth.user();
    if (!user) return;
    this._renderTopbar(user);
    this._renderBottomNav(user, currentPageId);
    Auth.startKeepAlive();
  },

  _renderTopbar(user) {
    const bar = document.getElementById('kib-topbar');
    if (!bar) return;
    const color = U.avatarColor(user.name);
    const initials = U.initials(user.name);
    const role = (CFG.ACCESS[user.access] || {}).label || user.access;
    bar.innerHTML = `
      <div class="tb-left">
        <div class="tb-logo">KIB</div>
        <div>
          <div class="tb-title">WFM Portal</div>
          <div class="tb-sub">Workforce Management</div>
        </div>
      </div>
      <div class="tb-right">
        <div class="tb-clock" id="tb-clock">--:--</div>
        <div class="tb-avatar" style="background:${color}" title="${user.name} · ${role}">${initials}</div>
        <button class="tb-logout" onclick="Auth.logout()" title="Sign Out">⏏</button>
      </div>`;
    this._startClock();
  },

  _startClock() {
    const tick = () => {
      const el = document.getElementById('tb-clock');
      if (el) el.textContent = U.nowHHMM();
    };
    tick();
    setInterval(tick, 1000);
  },

  _renderBottomNav(user, currentPageId) {
    const bar = document.getElementById('kib-bottomnav');
    if (!bar) return;
    const access = user.access;
    // WFM and admin share same nav; management has its own
    const navKey = ['wfm','admin'].includes(access) ? access : (access === 'management' ? 'management' : 'agent');
    const items  = CFG.NAV[navKey] || CFG.NAV.agent;

    bar.innerHTML = items.map(item => {
      const isActive = item.id === currentPageId;
      const badge    = this._badges[item.id] ? `<span class="nb-badge">${this._badges[item.id]}</span>` : '';
      return `
        <a href="${item.page}" class="nb ${isActive ? 'active' : ''}" id="nav-${item.id}">
          <span class="nb-icon">${item.icon}</span>
          <span class="nb-label">${item.label}</span>
          ${badge}
        </a>`;
    }).join('');
  },

  /** Set a badge count on a nav item */
  setBadge(pageId, count) {
    this._badges[pageId] = count > 0 ? count : 0;
    const el = document.querySelector(`#nav-${pageId} .nb-badge`);
    if (el) { el.textContent = count; el.style.display = count > 0 ? '' : 'none'; }
    else if (count > 0) {
      const link = document.getElementById(`nav-${pageId}`);
      if (link) {
        const b = document.createElement('span');
        b.className = 'nb-badge';
        b.textContent = count;
        link.appendChild(b);
      }
    }
  },

  /** User strip shown below topbar on most pages */
  renderUserStrip(extraHtml = '') {
    const user = Auth.user();
    if (!user) return '';
    const color = U.avatarColor(user.name);
    const initials = U.initials(user.name);
    const role = (CFG.ACCESS[user.access] || {}).label || user.access;
    return `
      <div class="user-strip">
        <div class="us-av" style="background:${color}">${initials}</div>
        <div class="us-info">
          <div class="us-name">${user.name}</div>
          <div class="us-meta">${user.dept} · ${role}</div>
        </div>
        ${extraHtml}
      </div>`;
  },
};
