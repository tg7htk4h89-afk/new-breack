/* KIB auth.js v20260415-204905 */
var Auth = (function() {
  var SESSION_KEY = 'kib_wfm_session';
  var _user = null;

  function _load() {
    try {
      var s = sessionStorage.getItem(SESSION_KEY);
      return s ? JSON.parse(s) : null;
    } catch(e) { return null; }
  }

  function _save(u) {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(u)); } catch(e) {}
  }

  function _clear() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch(e) {}
  }

  function _errorMsg(e) {
    var code = (e && e.message) ? e.message : 'UNKNOWN';
    if (code === 'INVALID_JSON')
      return 'n8n returned invalid response. Check the workflow execution in n8n.';
    if (code.startsWith('HTTP_404'))
      return 'Webhook not found (404).\n\nMake sure the workflow is Published and path is: kib-auth';
    if (code.startsWith('HTTP_5'))
      return 'n8n server error (' + code + '). Check n8n execution logs.';
    if (code === 'Failed to fetch' || code.includes('NetworkError') || code.includes('fetch'))
      return 'Cannot reach n8n. Check your server is running.';
    return 'Connection failed: ' + code;
  }

  async function _post(url, body) {
    var res;
    try {
      res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
    } catch(e) {
      throw new Error(e.message || 'Failed to fetch');
    }

    if (!res.ok) {
      throw new Error('HTTP_' + res.status);
    }

    var raw;
    try { raw = await res.text(); } catch(e) { throw new Error('INVALID_JSON'); }

    var parsed;
    try { parsed = JSON.parse(raw); } catch(e) { throw new Error('INVALID_JSON'); }

    // n8n sometimes returns array — unwrap
    if (Array.isArray(parsed)) parsed = parsed[0] || {};
    return parsed;
  }

  return {

    user() { return _user || (_user = _load()); },

    level() {
      var u = this.user();
      return u ? (u.access || u.role || 'agent').toLowerCase() : 'guest';
    },

    isManagement() {
      var lvl = this.level();
      return lvl === 'management' || lvl === 'manager' || lvl === 'wfm' ||
             lvl === 'admin' || lvl === 'area_manager' || lvl === 'head_branches';
    },

    isWFM() {
      var lvl = this.level();
      return lvl === 'wfm' || lvl === 'admin';
    },

    guard() {
      if (!this.user()) {
        window.location.href = 'index.html';
        return false;
      }
      return true;
    },

    logout() {
      _user = null;
      _clear();
      window.location.href = 'index.html';
    },

    async login(password) {
      try {
        var url = (typeof CFG !== 'undefined') ? CFG.N8N.AUTH : 'https://n8n.kib-cc-wfm.com/webhook/kib-auth';
        var data = await _post(url, { password: password.trim() });

        if (data.ok && data.user) {
          _user = data.user;
          _save(_user);
          return { ok: true, user: _user };
        }
        return { ok: false, error: data.error || 'Incorrect password' };

      } catch(e) {
        console.error('Auth.login error:', e.message);
        return { ok: false, error: _errorMsg(e) };
      }
    },

    async callAPI(url, body) {
      try {
        var data = await _post(url, body);
        return data;
      } catch(e) {
        console.error('Auth.callAPI error:', e.message);
        throw e;
      }
    },

  };
})();
