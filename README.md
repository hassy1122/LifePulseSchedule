# LifePulse — Daily Dashboard

A calm, ultra-clean full-stack-style dashboard for tracking your life: routines,
habits, goals, finances and notes. Built with **React 19**, **Tailwind CSS v4**,
**Lucide icons** and **Recharts**. All data persists in **LocalStorage** — no
backend or account needed.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in dist/
npm run preview  # serve the production build
```

> Requires Node.js 18+. The app ships pre-populated with ~30 days of realistic
> sample data (generated on first launch) so charts, goals, expenses and notes
> are immediately visible. Use **Reset demo data** in the sidebar footer to
> regenerate — this clears your changes.

## Modules

| Module | File | Highlights |
| --- | --- | --- |
| Master Scheduler | `src/pages/Scheduler.jsx` | Interactive 24-hour planner, quick-add presets (Fajar, Zohar, Asr, Maghrib, Isha, Morning Walk, Exercise/Gym, Deep Work/Coding, Reading), 4-state status toggles (Pending · In Progress · Completed · Skipped) |
| Daily Sheet | `src/pages/Daily.jsx` | 5 tracked habits (Prayers, Exercise, Walk, Coding hours, Water), live completion ring, real-time `Completion % = Completed / Total × 100` |
| Analytics | `src/pages/Analytics.jsx` | Month navigation, daily completion % area chart with 7-day rolling average, category-consistency donut (Prayers vs Exercise vs Coding), monthly average score card |
| Goals | `src/pages/Goals.jsx` | Tabbed workspace: Daily / Small (weekly-sprint) / Large (monthly-quarterly), milestone checklists with animated progress bars |
| Finance | `src/pages/Finance.jsx` | Quick-entry logger (date, title, 5 categories, amount), Today & This-Month summary cards, category donut, grouped monthly log |
| Notes | `src/pages/Notes.jsx` | Markdown editor with toolbar (bold, italic, code, headings, bullets, code blocks), instant search, tag filtering |

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
  App.jsx               # shell: sidebar nav + page routing + shared store
  index.css             # Tailwind v4 theme tokens + component classes
  lib/
    storage.js          # usePersistentState (LocalStorage) + immutable patch
    seed.js             # deterministic 30-day seed data + TRACKERS definition
    theme.js            # threshold bands, statuses, presets, category colors
    utils.js            # date keys, formatting, pct math, currency
  components/
    Sidebar.jsx         # desktop sidebar + mobile bottom bar
    ui.jsx              # Badge, ProgressBar, Stepper, EmptyState, PageHeader
  pages/                # one file per module (see table above)
```

**Data model (LocalStorage key `lifepulse-data-v1`)**

```js
{
  scheduler: { "YYYY-MM-DD": [ { id, title, cat, start, dur, status } ] },
  daily:     { "YYYY-MM-DD": { prayers, exercise, walk, coding, water } },
  goals:     { daily: [], small: [], large: [ { milestones: [] } ] },
  finance:   { transactions: [ { id, date, title, category, amount } ] },
  notes:     [ { id, title, body, tags, updatedAt } ],
}
```

Every mutation goes through `patch()` — a `structuredClone` + mutator + write to
LocalStorage — so state always persists on refresh.
