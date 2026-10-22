# LifePulse — Daily Dashboard

A calm, ultra-clean full-stack-style dashboard for tracking your life: routines,
habits, goals, finances and notes. Built with **React 19**, **Tailwind CSS v4**,
**Lucide icons** and **Recharts**. All data persists in **LocalStorage** — no
backend or account needed.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173 (service worker also registers for install testing)
npm run build    # production bundle in dist/ (+ PWA service worker & manifest)
npm run preview  # serve the production build
```

> Requires Node.js 18+. The app ships pre-populated with ~30 days of realistic
> sample data (generated on first launch) so charts, goals, expenses and notes
> are immediately visible. Use **Reset demo data** in the sidebar footer to
> regenerate — this clears your changes.

## Install as an app (PWA)

LifePulse ships as an installable Progressive Web App — an app icon, its own
window, and full offline behaviour (all assets are precached by a service
worker, and your data lives in LocalStorage regardless of connectivity).

**Live site (GitHub Pages):** https://hassy1122.github.io/LifePulseSchedule/

Open that URL on your phone → *Add to Home screen* — done.

- **Desktop (Chrome/Edge/Brave):** while viewing the app, click the Install
  icon in the address bar (or Menu ▸ *Install LifePulse…*).
- **Android:** open the site, tap the ⋮ menu ▸ *Add to Home screen /
  Install app*.
- **iOS:** Safari ▸ Share ▸ *Add to Home Screen*.
- Updates apply automatically (`autoUpdate` service worker, caches cleaned).

Commands:

```bash
npm run build    # generates dist/ incl. sw.js + manifest.webmanifest
npm run preview  # serve the production build (e.g. http://localhost:4173)
```

### Redeploying the live site

The site is served by **GitHub Pages** from the `gh-pages` branch (repo is
public, so Pages is free). The build uses a **relative base (`'./'`)** so it
works both at a site root and under the `/LifePulseSchedule/` subpath.

```bash
npm run build
npx gh-pages -d dist --message "Deploy LifePulse build to GitHub Pages [skip ci]"
```

GitHub then rebuilds the site automatically (~1 minute).

> The 192/512 px icons are generated from `LifePulse.ico` once
> (PowerShell/System.Drawing) and kept in `public/pwa-*.png`.

## Modules

| Module | File | Highlights |
| --- | --- | --- |
| Today | `src/pages/Today.jsx` | The landing dashboard: time-aware greeting, hero completion ring with 14-day sparkline, streak / month average / spent today / open sprints stat cards, "Next up" scheduler forecast, quick jump grid |
| Master Scheduler | `src/pages/Scheduler.jsx` | Interactive 24-hour planner with **Now** hour indicator, quick-add presets (Fajar, Zohar, Asr, Maghrib, Isha, Morning Walk, Exercise/Gym, Deep Work/Coding, Reading) tucked into the **Add item** popover, fully custom items (title / category / start time / duration / **P1–P4 priority**), per-item **add · edit · remove**, 4-state status toggles (Pending · In Progress · Completed · Skipped) and the **automation switches**: *Auto-fill routine daily* + *Slot-start reminders* (browser notifications) |
| Daily Sheet | `src/pages/Daily.jsx` | 5 tracked habits (Prayers, Exercise, Walk, Coding hours, Water), live completion ring, real-time `Completion % = Completed / Total × 100` |
| Analytics | `src/pages/Analytics.jsx` | **Range selector — Week / Month / Year / Years** with matching graphs (daily curve, monthly bar per year, yearly bar across all time), previous-period delta (week-over-week, month-over-month, year-over-year), category-consistency donut scoped to the range, monthly average score card, and a **GitHub-style 15-week consistency heatmap** |
| Goals | `src/pages/Goals.jsx` | Tabbed workspace: Daily / Small (weekly-sprint) / Large (monthly-quarterly), milestone checklists with animated progress bars, **P1–P4 priority chips** on daily goals and **"N days overdue"** badges on missed small goals |
| Finance | `src/pages/Finance.jsx` | Amounts in **PKR** (`Rs`): quick-entry logger (date, title, 5 categories, amount), Today & This-Month summary cards, category donut, grouped monthly log, plus **editable monthly budget limits** (overall + per category) with progress bars that turn amber at 80% and rose when over |
| Notes | `src/pages/Notes.jsx` | Markdown editor with toolbar (bold, italic, code, headings, bullets, code blocks), instant search, tag filtering |

## Smart features

- **Dark mode** — sun/moon toggle in the sidebar footer; the choice persists
  (LocalStorage `lifepulse-theme-v1`, defaulting to your OS preference) and
  charts restyle for the dark theme automatically.
- **Routine auto-fill** — when a new day is detected (midnight roll-over or the
  first open of a day) and the day's schedule is still empty, it is seeded with
  the prayer/workout/reading presets. Toggle it off in the scheduler.
- **Slot-start reminders** — opt-in browser notifications fired as each pending
  block's time window starts (once per block, cleared daily). Permission is
  requested from the toggle in the scheduler.
- **Priorities & overdue** — Todoist-style P1–P4 flags on schedule items and
  daily goals, and explicit "N days overdue" cards on past-due sprints.
- **Budget limits** — set an overall and per-category monthly cap on the
  Finance page; bars warn at 80% and go red past the limit.
  All money amounts are formatted in **Pakistani Rupees (Rs)**.

## Threshold color logic

Applied consistently across daily cards, badges, planner counters and charts:

| Completion | Color | Meaning |
| --- | --- | --- |
| 100% | `#E9D5FF` bg · `#6B21A8` text | Perfection |
| 75 – 99.9% | `#DCFCE7` bg · `#166534` text | Strong day |
| below 75% | `#FEE2E2` bg · `#991B1B` text | Needs focus |

Defined once in `src/lib/theme.js` (`BANDS` / `bandFor`) — change it there and
every module follows.

## Architecture

```
src/
    App.jsx               # shell: Today landing + sidebar/nav + live "today" clock + theme + reminders + auto-fill
  pages/                # one file per module (see table above)
  index.css             # Tailwind v4 theme tokens + component classes
  lib/
    storage.js          # usePersistentState (LocalStorage) + immutable patch
    seed.js             # deterministic 30-day seed data + TRACKERS definition
    theme.js            # threshold bands, statuses, presets, priorities, category colors
    utils.js            # date keys, formatting, pct math, currency
  components/
    Sidebar.jsx         # desktop sidebar (theme toggle) + mobile bottom bar
    ui.jsx              # Badge, ProgressBar, Stepper, Switch, ProgressRing, EmptyState, PageHeader
  pages/                # one file per module (see table above)
```

**Data model (LocalStorage key `lifepulse-data-v1`)**

```js
{
  scheduler: { "YYYY-MM-DD": [ { id, title, cat, start, dur, status, priority } ] },
  daily:     { "YYYY-MM-DD": { prayers, exercise, walk, coding, water } },
  goals:     { daily: [ { priority } ], small: [ { due, priority } ], large: [ { milestones: [] } ] },
  finance:   { transactions: [ { id, date, title, category, amount } ], budget: { monthly, categories: {} } },
  notes:     [ { id, title, body, tags, updatedAt } ],
  routines:  { enabled: true },
  settings:  { reminders: false },
}
```

Every mutation goes through `patch()` — a `structuredClone` + mutator + write to
LocalStorage — so state always persists on refresh. New keys (`routines`,
`settings`, `finance.budget`, `priority`) are read with guarded fallbacks, so
older stores keep working without any migration.

### Persistence guarantees

- Changes are written to **LocalStorage on every action** (no save button) —
  a page reload, browser restart or even a server restart loses nothing.
- Data is scoped to **this browser + `http://localhost:5173`**, so always open
  the app the same way (the one-click `LifePulse` launcher pins the port).
- **Backup / Restore** in the sidebar footer exports the entire data store as a
  `lifepulse-backup-YYYY-MM-DD.json` file and restores it by picking that file —
  use it to move data between browsers or recover after clearing site data.
