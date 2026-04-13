# KIB WFM Portal v2 — Setup Guide

## Structure
```
/
├── index.html           ← Login (auth via n8n Users sheet)
├── home.html            ← Dashboard
├── schedule.html        ← My Schedule + Request form (agents)
├── schedule-edit.html   ← Full Schedule Grid Editor (WFM/Admin)
├── breaks.html          ← Break booking, team view
├── attendance.html      ← Attendance tracking
├── kpi.html             ← KPI logger + dashboard
├── requests.html        ← Leave/Swap requests
├── notifications.html   ← Notifications
├── admin.html           ← Admin panel, user list, activity log
├── css/kib.css          ← Shared styles
├── js/
│   ├── config.js        ← API endpoints, shifts, teams
│   ├── auth.js          ← Session management
│   ├── api.js           ← All n8n calls
│   ├── utils.js         ← Helpers, date formatting
│   └── nav.js           ← Topbar + bottom navigation
└── n8n/
    ├── n8n_GET_v2.json        ← Updated GET workflow (with authenticate)
    └── n8n_schedule_v2.json   ← Updated Schedule workflow
```

---

## Step 1 — Google Sheets Setup

Add a **Users** sheet to your existing spreadsheet (`1j0So-QvjT10NtSfx8avDMob1bK4gem8FLJLs5yiEgi4`) with these columns:

| Column       | Example              | Notes                    |
|-------------|----------------------|--------------------------|
| password     | fou@4501             | Unique per user          |
| name         | Fouzeyah Erzouqi I   |                          |
| role         | Inbound Agent        |                          |
| dept         | Inbound              | Team name                |
| access       | agent                | agent / management / wfm / admin |
| active       | true                 | false = disabled         |
| daily_break_min | 60               | Break entitlement        |

Copy all users from the old EMPS array into this sheet.

Also add a **Notifications** sheet with columns:
`id, to, from, type, message, read, ts`

And a **SchedulePublish** sheet with columns:
`Timestamp, StartDate, EndDate, Published, PublishedBy`

---

## Step 2 — n8n Workflows

### Import Updated Workflows
1. In n8n, go to **Workflows → Import**
2. Import `n8n/n8n_GET_v2.json` — this replaces your old GET workflow
3. Import `n8n/n8n_schedule_v2.json` — replaces old schedule workflow
4. Keep all other existing workflows (breaks, attendance, requests, kpi, notify) unchanged

### Critical: Change GET Webhook to POST
The new GET workflow uses **POST** (not GET) because the login action sends a body with the password. Update the webhook node method to POST.

### Activate
- Activate both new workflows
- Confirm the webhook paths are still:
  - `kib-wfm-get` (GET/POST)
  - `kib-schedule`

---

## Step 3 — Update config.js

Open `js/config.js` and confirm your n8n URLs:
```javascript
N8N: {
  GET:        'https://n8n.kib-cc-wfm.com/webhook/kib-wfm-get',
  SCHEDULE:   'https://n8n.kib-cc-wfm.com/webhook/kib-schedule',
  // etc...
}
```

---

## Step 4 — Deploy to GitHub Pages

1. Create/use existing GitHub repo
2. Upload all files maintaining folder structure
3. Enable GitHub Pages from `main` branch root
4. Share the URL: `https://[user].github.io/[repo]/`

---

## Role Access Matrix

| Page              | Agent | Management | WFM | Admin |
|-------------------|-------|-----------|-----|-------|
| Home              | ✓     | ✓         | ✓   | ✓     |
| My Schedule       | ✓     | ✓         | ✓   | ✓     |
| Schedule Editor   | ✗     | ✗         | ✓   | ✓     |
| Breaks            | ✓     | ✓         | ✓   | ✓     |
| Attendance        | ✓*    | ✓         | ✓   | ✓     |
| Requests          | ✓     | ✓         | ✓   | ✓     |
| KPI               | ✗     | ✓         | ✓   | ✓     |
| Admin             | ✗     | ✗         | ✓   | ✓     |

*Agents can only log their own attendance

---

## Schedule Editor Features
- Full grid: all agents × week dates
- All data from n8n — zero hardcoded schedules
- Team filter chips (Inbound, Outbound, ITM, etc.)
- Agent search
- Week navigation (prev/next week)
- Click any cell → shift selector popup
- Color-coded by shift type (7-3, 8-4, 9-5, 12-8, 3-11, Night, OFF, AL, SL...)
- Pending changes tracked locally — batch save with one click
- Publish/Unpublish schedule toggle
- Approved swaps and leaves shown as overlays on grid

---

## Schedule Sheet Format

The `Schedule` sheet should have:
- **Row 1**: Column headers (`Name`, `Team`, then date columns as `YYYY-MM-DD`)
- **Row 2+**: One row per agent — agent name, team, then shift code per date

Example:
```
Name                | Team     | 2026-04-12 | 2026-04-13 | ...
Fouzeyah Erzouqi I  | Inbound  | 7-3        | OFF        | ...
Sarah Alqattan      | Inbound  | 8-4        | 9-5        | ...
```

Shift codes: `7-3`, `8-4`, `9-5`, `12-8`, `3-11`, `NIGHT`, `MAKER`, `CHECKER`, `OFF`, `AL`, `SL`, `PH`, `UL`, `PL`
