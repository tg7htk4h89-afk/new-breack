'use strict';
/* ═══════════════════════════════════════════════════════
   KIB WFM Portal v2 — Auth
   Session management — requires config.js loaded first
   ═══════════════════════════════════════════════════════ */

const Auth = (() => {

  /* ── Private ──────────────────────────────────────── */
  let _user  = null;
  let _timer = null;

  function _load() {
    try {
      const raw = sessionStorage.getItem(CFG.SESSION_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || !obj.ts || !obj.user) return null;
      if (Date.now() - obj.ts > CFG.SESSION_TTL) {
        sessionStorage.removeItem(CFG.SESSION_KEY);
        return null;
      }
      return obj.user;
    } catch { return null; }
  }

  function _save(user) {
    sessionStorage.setItem(CFG.SESSION_KEY, JSON.stringify({ ts: Date.now(), user }));
  }

  /* ── Public API ───────────────────────────────────── */
  return {
    /** Returns current user or null */
    user() { return _user || (_user = _load()); },

    /** Access level integer (1-4) */
    level() {
      const u = this.user();
      if (!u) return 0;
      return (CFG.ACCESS[u.access] || { level: 1 }).level;
    },

    /** Check minimum access */
    can(access) { return this.level() >= (CFG.ACCESS[access]?.level ?? 99); },

    /** Is agent-level only */
    isAgent()      { return this.user()?.access === 'agent'; },
    isManagement() { return this.level() >= 2; },
    isWFM()        { return this.level() >= 3; },
    isAdmin()      { return this.level() >= 4; },

    /**
     * Authenticate via n8n → Users sheet
     * Returns { ok, user, error }
     */
    async login(password) {
      try {
        const res = await fetch(CFG.N8N.GET, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'authenticate', password: password.trim() }),
        });
        const data = await res.json();
        if (data.ok && data.user) {
          _user = data.user;
          _save(_user);
          return { ok: true, user: _user };
        }
        return { ok: false, error: data.error || 'Invalid password' };
      } catch (e) {
        console.error('Auth.login error:', e);
        return { ok: false, error: 'Network error — please check your connection' };
      }
    },

    /** Clear session and redirect to login */
    logout() {
      sessionStorage.removeItem(CFG.SESSION_KEY);
      _user = null;
      if (_timer) clearInterval(_timer);
      window.location.href = 'index.html';
    },

    /**
     * Guard — call on every page load.
     * Redirects to index.html if not logged in.
     * Optionally pass minimum access level.
     */
    guard(minAccess = 'agent') {
      const u = this.user();
      if (!u) { window.location.href = 'index.html'; return false; }
      if (!this.can(minAccess)) {
        alert('You do not have permission to view this page.');
        window.history.back();
        return false;
      }
      return true;
    },

    /** Refresh session timestamp (call on any user action) */
    touch() {
      const u = this.user();
      if (u) _save(u);
    },

    /** Start auto-refresh timer */
    startKeepAlive() {
      if (_timer) clearInterval(_timer);
      _timer = setInterval(() => this.touch(), 5 * 60 * 1000);
    },
  };
})();
