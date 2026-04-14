'use strict';
/* ═══════════════════════════════════════════════════════
   KIB WFM Portal v2 — API
   All n8n fetch calls — requires config.js
   ═══════════════════════════════════════════════════════ */

const API = (() => {

  /* ── Generic POST helper ──────────────────────────── */
  async function post(url, body, signal) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  /* ── Cache helper ─────────────────────────────────── */
  const _cache = {};
  function fromCache(key, ttl = 30000) {
    const e = _cache[key];
    if (e && Date.now() - e.ts < ttl) return e.data;
    return null;
  }
  function toCache(key, data) { _cache[key] = { ts: Date.now(), data }; }
  function clearCache(key) { if (key) delete _cache[key]; else Object.keys(_cache).forEach(k => delete _cache[k]); }

  /* ── Public API ───────────────────────────────────── */
  return {

    /* ──────────────────────────────────────────────────
       READ — GET workflow  (action-based routing)
    ────────────────────────────────────────────────── */

    /** Full initial load — parallel calls, resilient with timeout */
    async getAll(force = false) {
      if (!force) {
        const cached = fromCache('getAll', 120000); // 2min cache
        if (cached) return cached;
      }
      // Debounce: max 1 forced call per 8s
      const now = Date.now();
      if (force && window._lastGetAll && (now - window._lastGetAll) < 8000) {
        const cached = fromCache('getAll', 999999);
        if (cached) return cached;
      }
      window._lastGetAll = now;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      try {
        const r = await fetch(CFG.N8N.GET_SCHEDULE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getAll' }),
          signal: controller.signal
        });
        clearTimeout(timer);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const d = await r.json();
        if (!d || !d.ok) throw new Error('Invalid response');
        toCache('getAll', d);
        return d;
      } catch(e) {
        clearTimeout(timer);
        throw e;
      }
    },
 },

    /** Single agent's schedule */
    async getAgentSchedule(agentName, force = false) {
      const key = `agt_${agentName}`;
      if (!force) {
        const cached = fromCache(key, 30000);
        if (cached) return cached;
      }
      const data = await post(CFG.N8N.GET, { action: 'getAgentSchedule', agent: agentName });
      toCache(key, data);
      return data;
    },

    /** Notifications for current user */
    async getNotifications(user) {
      return post(CFG.N8N.GET, { action: 'getNotifications', user });
    },

    /* ──────────────────────────────────────────────────
       SCHEDULE WRITES
    ────────────────────────────────────────────────── */

    /** Update a single cell */
    async updateShift({ agent, date, shift, shiftStart, shiftEnd, reason, updatedBy }) {
      clearCache('getAll');
      clearCache(`sched_`);
      return post(CFG.N8N.SCHEDULE, {
        action: 'updateShift',
        agent, date, shift, shiftStart, shiftEnd,
        reason: reason || '',
        updatedBy,
        ts: new Date().toISOString(),
      });
    },

    /** Bulk update — array of { agent, date, shift, shiftStart, shiftEnd } */
    async bulkUpdateShifts(changes, updatedBy) {
      clearCache('getAll');
      clearCache(`sched_`);
      return post(CFG.N8N.SCHEDULE, {
        action: 'bulkUpdateShifts',
        changes,
        updatedBy,
        ts: new Date().toISOString(),
      });
    },

    /** Publish / unpublish schedule for a date range */
    async publishSchedule({ startDate, endDate, published, publishedBy }) {
      return post(CFG.N8N.SCHEDULE, {
        action: 'publishSchedule',
        startDate, endDate, published, publishedBy,
        ts: new Date().toISOString(),
      });
    },

    /* ──────────────────────────────────────────────────
       BREAKS
    ────────────────────────────────────────────────── */

    async saveBreaks(data) {
      clearCache('getAll');
      return post(CFG.N8N.BREAKS, data);
    },

    async logLogin(emp, shift) {
      return post(CFG.N8N.BREAKS, { action: 'saveLogin', emp, shift, ts: new Date().toISOString() });
    },

    /* ──────────────────────────────────────────────────
       ATTENDANCE
    ────────────────────────────────────────────────── */

    async saveAttendance(records) {
      clearCache('getAll');
      return post(CFG.N8N.ATTENDANCE, { action: 'saveAttendance', records, ts: new Date().toISOString() });
    },

    /* ──────────────────────────────────────────────────
       REQUESTS (swaps, leave)
    ────────────────────────────────────────────────── */

    // LeaveRequests sheet columns: ID,Agent,Type,From,To,Days,Notes,Status,ActionedBy,Timestamp
    async submitLeave({ agent, team, startDate, endDate, type, reason, submittedBy }) {
      clearCache('getAll');
      const days = startDate && endDate
        ? Math.max(1, Math.round((new Date(endDate) - new Date(startDate)) / 86400000) + 1) : 1;
      return post(CFG.N8N.SUBMIT_LEAVE || CFG.N8N.REQUESTS, {
        action:    'submitLeave',
        ID:        'L' + Date.now(),
        Agent:     agent,
        Type:      type,
        From:      startDate,
        To:        endDate,
        Days:      days,
        Notes:     reason || '',
        Status:    'pending',
        ActionedBy:'',
        Timestamp:  new Date().toISOString(),
        team, submittedBy,
      });
    },

    // SwapRequests sheet columns: ID,From,To,Date,FromShift,ToShift,Reason,Status,ActionedBy,Timestamp
    async submitSwap({ from, to, date, shiftFrom, shiftTo, reason }) {
      clearCache('getAll');
      return post(CFG.N8N.SUBMIT_LEAVE || CFG.N8N.REQUESTS, {
        action:    'submitSwap',
        ID:        Date.now().toString(36) + Math.random().toString(36).slice(2,5),
        From:      from,
        To:        to,
        Date:      date,
        FromShift: shiftFrom,
        ToShift:   shiftTo,
        Reason:    reason || '',
        Status:    'pending_peer',
        ActionedBy:'',
        Timestamp:  new Date().toISOString(),
      });
    },

    async respondSwap({ swapId, action, respondedBy }) {
      clearCache('getAll');
      return post(CFG.N8N.SUBMIT_LEAVE || CFG.N8N.REQUESTS, {
        action: 'respondSwap', swapId, response: action, respondedBy,
        Status: action === 'approve' ? 'approved' : 'rejected',
        ActionedBy: respondedBy,
        ActionedAt: new Date().toISOString(),
        ts: new Date().toISOString(),
      });
    },

    async approveLeave({ leaveId, action, approvedBy, note }) {
      clearCache('getAll');
      return post(CFG.N8N.SUBMIT_LEAVE || CFG.N8N.REQUESTS, {
        action: 'approveLeave', leaveId, response: action, approvedBy, note,
        Status: action === 'approve' ? 'approved' : 'rejected',
        ActionedBy: approvedBy,
        ActionedAt: new Date().toISOString(),
        ts: new Date().toISOString(),
      });
    },

    // ScheduleRequests sheet columns: Ref,Agent,Team,Role,SubmitDate,PeriodFrom,PeriodTo,...,Status,Timestamp
    async submitScheduleRequest({ agent, team, date, currentShift, requestedShift, reason }) {
      clearCache('getAll');
      return post(CFG.N8N.SUBMIT_LEAVE || CFG.N8N.REQUESTS, {
        action:         'scheduleRequest',
        Ref:            'SR-' + Math.random().toString(36).slice(2,8).toUpperCase(),
        Agent:          agent,
        Team:           team,
        SubmitDate:     new Date().toISOString().slice(0,10),
        PeriodFrom:     date,
        PeriodTo:       date,
        PreferredShifts:requestedShift,
        SpecialRequest: reason || '',
        Status:         'pending',
        Timestamp:      new Date().toISOString(),
        currentShift,
      });
    },

    /* ──────────────────────────────────────────────────
       KPI
    ────────────────────────────────────────────────── */

    async saveKPI(type, entry) {
      return post(CFG.N8N.SUBMIT_KPI || CFG.N8N.KPI, { action: 'saveKPI', type, entry, ts: new Date().toISOString() });
    },

    /* ──────────────────────────────────────────────────
       NOTIFICATIONS
    ────────────────────────────────────────────────── */

    async sendNotification({ to, from, type, message }) {
      return post(CFG.N8N.NOTIFY, { action: 'send', to, from, type, message, ts: new Date().toISOString() });
    },

    async markNotificationsRead(user) {
      return post(CFG.N8N.NOTIFY, { action: 'markRead', user, ts: new Date().toISOString() });
    },

    /* ── Cache utilities ──────────────────────────────── */
    clearCache,
    fromCache,
  };
})();
