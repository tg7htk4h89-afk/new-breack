'use strict';
/* ═══════════════════════════════════════════════════════
   KIB WFM Portal v2 — Config
   Updated to match actual Google Sheets database structure
   ═══════════════════════════════════════════════════════ */

const CFG = {

  /* ── n8n Webhook Endpoints (self-hosted) ───────────── */
  N8N_BASE: 'https://n8n.kib-cc-wfm.com/webhook',

  N8N: {
    GET:        'https://n8n.kib-cc-wfm.com/webhook/kib-wfm-get',
    BREAKS:     'https://n8n.kib-cc-wfm.com/webhook/kib-breaks',
    ATTENDANCE: 'https://n8n.kib-cc-wfm.com/webhook/kib-attendance',
    SCHEDULE:   'https://n8n.kib-cc-wfm.com/webhook/kib-schedule',
    REQUESTS:   'https://n8n.kib-cc-wfm.com/webhook/kib-requests',
    KPI:        'https://n8n.kib-cc-wfm.com/webhook/kib-kpi',
    NOTIFY:     'https://n8n.kib-cc-wfm.com/webhook/kib-notify',
  },

  /* ── Google Sheet ID ───────────────────────────────── */
  SHEET_ID: '1j0So-QvjT10NtSfx8avDMob1bK4gem8FLJLs5yiEgi4',

  /* ── Session ───────────────────────────────────────── */
  SESSION_KEY: 'kib_wfm_v2_session',
  SESSION_TTL: 10 * 60 * 60 * 1000, // 10 hours

  /* ── Shift colour theme by start-hour bucket ───────────
     Shifts in the DB are stored as "HH:MM-HH:MM" strings
     e.g. "08:00-16:00", "15:00-23:00", "19:00-03:00"
     Colour is derived from start hour at runtime.
  ────────────────────────────────────────────────────── */
  SHIFT_THEME: [
    { from: 0,  to: 6,  color:'#1E293B', bg:'rgba(30,41,59,.12)',   label:'Night',     short:'NGT' },
    { from: 6,  to: 9,  color:'#0D5CA6', bg:'rgba(13,92,166,.12)',  label:'Morning',   short:'MRN' },
    { from: 9,  to: 12, color:'#0A7FAE', bg:'rgba(10,127,174,.12)', label:'Mid-Morn',  short:'MID' },
    { from: 12, to: 15, color:'#00A89A', bg:'rgba(0,168,154,.12)',  label:'Afternoon', short:'AFT' },
    { from: 15, to: 18, color:'#B45309', bg:'rgba(180,83,9,.12)',   label:'Evening',   short:'EVN' },
    { from: 18, to: 22, color:'#7C3AED', bg:'rgba(124,58,237,.12)', label:'Late Eve',  short:'LAT' },
    { from: 22, to: 24, color:'#1E293B', bg:'rgba(30,41,59,.12)',   label:'Night',     short:'NGT' },
  ],

  /* ── Day-Off / Leave Types (match sheet values) ─────── */
  DAY_TYPES: [
    { code:'OFF', label:'Day Off',        color:'#6B7280', bg:'#F3F4F6', short:'OFF' },
    { code:'AL',  label:'Annual Leave',   color:'#92400E', bg:'#FEF3CD', short:'AL'  },
    { code:'SL',  label:'Sick Leave',     color:'#DC2626', bg:'#FEE2E2', short:'SL'  },
    { code:'PH',  label:'Public Holiday', color:'#16A34A', bg:'#DCFCE7', short:'PH'  },
    { code:'UL',  label:'Unpaid Leave',   color:'#9333EA', bg:'#F3E8FF', short:'UL'  },
    { code:'PL',  label:'Partial Leave',  color:'#D97706', bg:'#FEF9C3', short:'PL'  },
  ],

  /* ── Attendance statuses (exact values from Attendance sheet) ── */
  ATT_STATUSES: [
    { code:'on_time',    label:'On Time',    pill:'pill-green',  icon:'✅' },
    { code:'late',       label:'Late',       pill:'pill-amber',  icon:'⏰' },
    { code:'sick',       label:'Sick',       pill:'pill-red',    icon:'🤒' },
    { code:'noshow',     label:'No Show',    pill:'pill-red',    icon:'❌' },
    { code:'permission', label:'Permission', pill:'pill-navy',   icon:'🚪' },
    { code:'change',     label:'Day Change', pill:'pill-purple', icon:'🔄' },
  ],

  /* ── Common shift time options for the request form ─── */
  SHIFT_OPTIONS: [
    '07:00-15:00', '08:00-16:00', '09:00-17:00',
    '10:00-18:00', '11:00-19:00', '12:00-20:00',
    '13:00-21:00', '15:00-23:00', '16:00-00:00',
    '17:00-01:00', '18:00-02:00', '19:00-03:00',
    '21:00-05:00', '23:00-07:00', 'OFF',
  ],

  /* ── Teams ─────────────────────────────────────────── */
  TEAMS: ['Inbound','Outbound','ITM','Wage','Back Office','Quality','Supervisors','Management','OP'],

  TEAM_COLORS: {
    'Inbound':     '#0D5CA6',
    'Outbound':    '#7C3AED',
    'ITM':         '#00A89A',
    'Wage':        '#B45309',
    'Back Office': '#6B7280',
    'Quality':     '#DC2626',
    'Supervisors': '#0A4A8A',
    'Management':  '#1E293B',
    'OP':          '#0A7FAE',
  },

  /* ── Access Levels ─────────────────────────────────── */
  ACCESS: {
    agent:      { level: 1, label: 'Agent'        },
    management: { level: 2, label: 'Management'   },
    wfm:        { level: 3, label: 'WFM Manager'  },
    admin:      { level: 4, label: 'System Admin' },
  },

  /* ── Bottom Nav per Role (matches old portal role logic) ─ */
  NAV: {
    // agent: Book Break + My Schedule + Swap + KPI submit + Me
    agent: [
      { id:'home',     icon:'🏠', label:'Home',     page:'home.html'     },
      { id:'schedule', icon:'📅', label:'Schedule', page:'schedule.html' },
      { id:'breaks',   icon:'☕', label:'Breaks',   page:'breaks.html'   },
      { id:'kpi',      icon:'📌', label:'KPI',      page:'kpi.html'      },
      { id:'settings', icon:'👤', label:'Me',       page:'settings.html' },
    ],
    // management (TL/ATL/QA/BackOffice): team monitor + attendance + approvals + schedule
    management: [
      { id:'home',         icon:'🏠', label:'Home',       page:'home.html'       },
      { id:'breaks',       icon:'☕', label:'Breaks',     page:'breaks.html'     },
      { id:'attendance',   icon:'✅', label:'Attendance', page:'attendance.html' },
      { id:'requests',     icon:'📋', label:'Requests',   page:'requests.html'   },
      { id:'kpi',          icon:'📊', label:'KPI',        page:'kpi.html'        },
    ],
    // wfm: schedule editor + kpi + attendance + admin
    wfm: [
      { id:'home',          icon:'🏠', label:'Home',       page:'home.html'          },
      { id:'schedule-edit', icon:'📅', label:'Schedule',   page:'schedule-edit.html' },
      { id:'kpi',           icon:'📌', label:'KPI',        page:'kpi.html'           },
      { id:'attendance',    icon:'✅', label:'Attendance', page:'attendance.html'    },
      { id:'admin',         icon:'⚙️', label:'Admin',      page:'admin.html'         },
    ],
    // admin: same as wfm
    admin: [
      { id:'home',          icon:'🏠', label:'Home',       page:'home.html'          },
      { id:'schedule-edit', icon:'📅', label:'Schedule',   page:'schedule-edit.html' },
      { id:'kpi',           icon:'📌', label:'KPI',        page:'kpi.html'           },
      { id:'attendance',    icon:'✅', label:'Attendance', page:'attendance.html'    },
      { id:'admin',         icon:'⚙️', label:'Admin',      page:'admin.html'         },
    ],
  },

};

/* ═══════════════════════════════════════════════════════
   SHIFT HELPERS
   Shifts are stored as "HH:MM-HH:MM" (e.g. "08:00-16:00")
   These helpers derive display info from the time range.
═══════════════════════════════════════════════════════ */

/**
 * Get display info for any shift value from the sheet.
 * Returns { color, bg, label, short, start, end, isOff }
 */
CFG.getShiftDisplay = function(raw) {
  if (!raw) return CFG.getShiftDisplay('OFF');
  const s = String(raw).trim().toUpperCase();

  // Day-off types
  const dt = CFG.DAY_TYPES.find(d => s === d.code || s.startsWith(d.code));
  if (dt) return { ...dt, isOff: true };

  // Time range format HH:MM-HH:MM
  const m = raw.match(/^(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
  if (m) {
    const startH = parseInt(m[1]);
    const endH   = parseInt(m[3]);
    const theme  = CFG.SHIFT_THEME.find(t => startH >= t.from && startH < t.to)
                || CFG.SHIFT_THEME[0];
    const startStr = `${String(parseInt(m[1])).padStart(2,'0')}:${m[2]}`;
    const endStr   = `${String(parseInt(m[3])).padStart(2,'0')}:${m[4]}`;
    // Short label: just the start time e.g. "08:00"
    const shortLabel = startStr;
    return {
      code:  raw,
      label: `${_fmt12(startStr)} – ${_fmt12(endStr)}`,
      short: shortLabel,
      start: startStr,
      end:   endStr,
      color: theme.color,
      bg:    theme.bg,
      isOff: false,
    };
  }

  // Unknown — treat as off
  return { code: s, label: s, short: s.substring(0,3), color:'#6B7280', bg:'#F3F4F6', isOff: true };
};

function _fmt12(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':');
  const n = parseInt(h) % 24;
  return `${n % 12 || 12}:${m} ${n < 12 ? 'AM' : 'PM'}`;
}

CFG.isOff    = (raw) => !raw || CFG.getShiftDisplay(raw).isOff;
CFG.isShift  = (raw) => raw && !CFG.isOff(raw);

/* Legacy compat — used in a few places */
CFG.getShift           = CFG.getShiftDisplay;
CFG.normalizeShiftCode = (raw) => raw ? String(raw).trim() : 'OFF';

/** Attendance status lookup */
CFG.getAttStatus = (code) => CFG.ATT_STATUSES.find(s => s.code === code)
  || { code, label: code, pill: 'pill-gray', icon: '—' };
