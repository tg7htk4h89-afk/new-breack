'use strict';
/* ═══════════════════════════════════════════════════════
   KIB WFM Portal v2 — Auth
   ═══════════════════════════════════════════════════════ */

const Auth = (() => {

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

  /* ── fetch with detailed error detection ─────────────── */
  async function _post(url, body) {
    let res;
    try {
      res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
    } catch (e) {
      // Classify the network error
      const msg = (e.message || '').toLowerCase();
      if (msg.includes('cors') || msg.includes('blocked')) {
        throw new Error('CORS_ERROR');
      }
      if (msg.includes('failed to fetch') || msg.includes('networkerror')) {
        throw new Error('NETWORK_ERROR');
      }
      throw new Error('FETCH_ERROR:' + e.message);
    }

    if (!res.ok) {
      throw new Error('HTTP_' + res.status);
    }

    try {
      return await res.json();
    } catch {
      throw new Error('INVALID_JSON');
    }
  }

  /* ── Human-readable error messages ───────────────────── */
  function _errorMsg(e) {
    const code = e.message || '';
    if (code === 'CORS_ERROR')
      return 'CORS error — check n8n CORS settings. See README.';
    if (code === 'NETWORK_ERROR')
      return 'Cannot reach n8n server.\n\nCheck:\n1. Is the workflow Published (not just saved)?\n2. Is n8n.kib-cc-wfm.com running?\n3. Is the webhook path correct: /webhook/kib-wfm-get';
    if (code.startsWith('HTTP_404'))
      return 'Webhook not found (404).\n\nMake sure the workflow is Published and path is: kib-wfm-get';
    if (code.startsWith('HTTP_5'))
      return 'n8n server error (' + code + '). Check n8n execution logs.';
    if (code === 'INVALID_JSON')
      return 'n8n returned invalid response. Check the workflow execution in n8n.';
    return 'Connection failed: ' + code;
  }

  return {

    user()         { return _user || (_user = _load()); },
    level()        { const u = this.user(); if (!u) return 0; return (CFG.ACCESS[u.access] || { level: 1 }).level; },
    can(access)    { return this.level() >= (CFG.ACCESS[access]?.level ?? 99); },
    isAgent()      { return this.user()?.access === 'agent'; },
    isManagement() { return this.level() >= 2; },
    isWFM()        { return this.level() >= 3; },
    isAdmin()      { return this.level() >= 4; },

    /* ── Login ─────────────────────────────────────────── */
    async login(password) {
      try {
        const data = await _post(CFG.N8N.AUTH || CFG.N8N.GET, {
          action:   'authenticate',
          password: password.trim(),
        });

        if (data.ok && data.user) {
          _user = data.user;
          _save(_user);
          return { ok: true, user: _user };
        }
        return { ok: false, error: data.error || 'Incorrect password' };

      } catch (e) {
        console.error('Auth.login error:', e.message);
        return { ok: false, error: _errorMsg(e) };
      }
    },

    /* ── API call helper (used by api.js) ──────────────── */
    async callAPI(url, body) {
      try {
        return await _post(url, body);
      } catch (e) {
        console.error('API error:', url, e.message);
        throw e;
      }
    },

    /* ── Session ───────────────────────────────────────── */
    logout() {
      sessionStorage.removeItem(CFG.SESSION_KEY);
      _user = null;
      if (_timer) clearInterval(_timer);
      window.location.href = 'index.html';
    },

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

    touch() { const u = this.user(); if (u) _save(u); },

    startKeepAlive() {
      if (_timer) clearInterval(_timer);
      _timer = setInterval(() => this.touch(), 5 * 60 * 1000);
    },

    /* ── Ping n8n (call from browser console to diagnose) ─
       Usage: Auth.ping().then(console.log)
    ────────────────────────────────────────────────────── */
    async ping() {
      const url = CFG.N8N.AUTH || CFG.N8N.GET;
      console.log('Pinging:', url);
      try {
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'ping' }),
        });
        console.log('Status:', r.status);
        const text = await r.text();
        console.log('Response:', text.slice(0, 200));
        return { status: r.status, ok: r.ok, body: text.slice(0, 200) };
      } catch (e) {
        console.error('Ping failed:', e);
        return { error: e.message };
      }
    },
  };
})();
