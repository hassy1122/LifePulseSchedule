import { addDays, dateKey } from "./utils"
import { PRESETS } from "./theme"

/**
 * Shared definition of the items tracked on the Daily Sheet.
 * The 5 tracked items drive the completion-percentage formula everywhere.
 */
export const TRACKERS = [
  { id: "prayers", label: "Five Prayers", kind: "toggle", target: 1, unit: "" },
  { id: "exercise", label: "Exercise", kind: "toggle", target: 1, unit: "" },
  { id: "walk", label: "Morning Walk", kind: "toggle", target: 1, unit: "" },
  { id: "coding", label: "Coding Hours", kind: "number", target: 2, unit: "h" },
  { id: "water", label: "Water Intake", kind: "number", target: 8, unit: " glasses" },
]

/** Completed tracked items for a daily entry. */
export function dailyDoneCount(entry) {
  if (!entry) return 0
  let done = 0
  for (const t of TRACKERS) {
    const v = t.kind === "toggle" ? entry[t.id] : entry[t.id]
    if (typeof v === "number" ? v >= t.target : !!v) done += 1
  }
  return done
}

/** Completion % = (Completed Items / Total Tracked Items) * 100 */
export function dailyPct(entry) {
  return entry ? Math.round((dailyDoneCount(entry) / TRACKERS.length) * 1000) / 10 : 0
}

/* ------------------------------------------------------------------ */
/* Streaks & milestone badges (per tracker, from the daily history).    */
/* ------------------------------------------------------------------ */

/** Badge milestones: 🔥 streaks shown once these day-counts are reached. */
export const STREAK_MILESTONES = [7, 30, 100]

/** Highest milestone reached for a streak count (null below 7 days). */
export function streakBadge(streak) {
  const hit = STREAK_MILESTONES.filter((m) => streak >= m)
  return hit.length ? hit[hit.length - 1] : null
}

/**
 * Consecutive days a tracker's target was met, ending today (or yesterday
 * when today is still incomplete — matching the Today page streak rule).
 */
export function trackerStreak(daily, tracker, todayKey) {
  const ok = (key) => {
    const v = daily[key]?.[tracker.id]
    return typeof v === "number" ? v >= tracker.target : !!v
  }
  let cursor = ok(todayKey) ? todayKey : addDays(todayKey, -1)
  let count = 0
  while (cursor && ok(cursor)) {
    count += 1
    cursor = addDays(cursor, -1)
  }
  return count
}

/* ------------------------------------------------------------------ */
/* Deterministic pseudo-random so the demo data set is stable & tuned. */
/* ------------------------------------------------------------------ */
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const FOOD = ["Groceries", "Coffee", "Lunch — café", "Dinner out", "Bakery", "Grocery run"]
const TECH = ["Cloud storage", "USB-C cable", "Dev course", "Key switches", "Domain renewal"]
const UTILITIES = ["Electricity bill", "Internet", "Water bill", "Phone plan"]
const TRAVEL = ["Uber ride", "Train ticket", "Fuel top-up", "Bus pass"]
const MISC = ["Gift", "Stationery", "Laundry", "Donation", "Haircut"]
const POOLS = {
  Food: [FOOD, 250, 3500],
  Tech: [TECH, 500, 15000],
  Utilities: [UTILITIES, 600, 12000],
  Travel: [TRAVEL, 300, 6000],
  Misc: [MISC, 150, 5000],
}

const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)]
/** Whole-rupee amounts. */
const round = (v) => Math.round(v)

/** Build the full pre-populated store: 30 days of history + goals + notes. */
export function buildSeedData() {
  const rand = mulberry32(20261021)
  const todayKey = dateKey(new Date())
  const nowHour = new Date().getHours() + new Date().getMinutes() / 60

  const data = {
    scheduler: {},
    daily: {},
    routines: { enabled: true },
    settings: { reminders: false, prayerAlerts: false },
    /* Lend/Borrow ledger: dir "lent" → they owe me, "borrowed" → I owe them. */
    ledger: [
      { id: "ld-1", name: "Hamza", amount: 2500, dir: "lent", note: "Lunch + ride", date: addDays(todayKey, -6), settled: null },
      { id: "ld-2", name: "Fatima", amount: 1200, dir: "borrowed", note: "Stationery run", date: addDays(todayKey, -3), settled: null },
      { id: "ld-3", name: "Umer", amount: 8000, dir: "lent", note: "Book fair purchase", date: addDays(todayKey, -12), settled: null },
    ],
    goals: {
      daily: [
        { id: "dg-1", title: "Plan tomorrow before Isha", done: true, priority: 4 },
        { id: "dg-2", title: "Journal 5 minutes", done: false, priority: 3 },
        { id: "dg-3", title: "Inbox to zero", done: false, priority: 2 },
      ],
      small: [
        { id: "sg-1", title: "Finish analytics module UI", dueOffset: 2, done: false, priority: 1 },
        { id: "sg-2", title: "Run 5K without stopping", dueOffset: 4, done: false, priority: 3 },
        { id: "sg-3", title: "Read 40 pages of Deep Work", dueOffset: 1, done: true, priority: 4 },
        { id: "sg-4", title: "Sort the photo backup drive", dueOffset: -2, done: false, priority: 2 },
      ],
      large: [
        {
          id: "lg-1",
          title: "Ship LifePulse dashboard v1",
          timeframe: "Monthly",
          description:
            "Complete the personal dashboard: scheduler, habit tracking, analytics, finance and notes — polished and accessible.",
          milestones: [
            { id: "m-1", title: "Design system & layout", done: true },
            { id: "m-2", title: "Master scheduler module", done: true },
            { id: "m-3", title: "Daily sheet & analytics", done: true },
            { id: "m-4", title: "Finance & notes workspace", done: false },
            { id: "m-5", title: "Polish, a11y & release", done: false },
          ],
        },
        {
          id: "lg-2",
          title: "Run a half marathon",
          timeframe: "Quarterly",
          description:
            "Build from a 5K base to 21.1K without injury. Long runs every Sunday, strength work twice a week.",
          milestones: [
            { id: "m-6", title: "5K base fitness", done: true },
            { id: "m-7", title: "10K long run", done: true },
            { id: "m-8", title: "15K long run", done: false },
            { id: "m-9", title: "Race-week taper", done: false },
          ],
        },
      ],
    },
    finance: {
      transactions: [],
      budget: {
        monthly: 100000,
        categories: { Food: 35000, Tech: 15000, Utilities: 25000, Travel: 10000, Misc: 8000 },
      },
    },
    notes: [
      {
        id: "n-1",
        title: "Weekly planning ritual",
        tags: ["routine", "growth"],
        updatedAt: Date.now() - 36e5 * 5,
        body: `## Sunday reset
- Review last week's **completion %** per category
- Schedule the *big rocks* into the scheduler first
- Keep one evening fully unscheduled

> A calm plan beats a busy day.`,
      },
      {
        id: "n-2",
        title: "React performance notes",
        tags: ["work", "snippets"],
        updatedAt: Date.now() - 36e5 * 30,
        body: `Memoize the derived stats on the analytics screen:

\`\`\`jsx
const monthStats = useMemo(
  () => computeMonthStats(daily, monthKey),
  [daily, monthKey],
)
\`\`\`

- Avoid splitting state for the planner rows
- One \`structuredClone\` patch per action keeps persistence simple`,
      },
      {
        id: "n-3",
        title: "Highlights — Deep Work",
        tags: ["reading"],
        updatedAt: Date.now() - 36e5 * 52,
        body: `- "Clarity about *what* provides the **most value** determines results"
- Fixed-schedule productivity: finish by 5:30 PM
- Ritualize shutdown with a quick review of the scheduler`,
      },
      {
        id: "n-4",
        title: "Budget tweak ideas",
        tags: ["finance"],
        updatedAt: Date.now() - 36e5 * 78,
        body: `- Cap **Food** delivery at Rs 8,000 / week
- Cancel the third streaming service
- Auto-transfer 10% of income on payday

Check the finance pie chart every Friday.`,
      },
      {
        id: "n-5",
        title: "Q3 big goal breakdown",
        tags: ["goals", "work"],
        updatedAt: Date.now() - 36e5 * 110,
        body: `### Dashboard v1 → v1.1
- Ship finance tracker in the first sprint
- Add month-over-month analytics comparison
- Keyboard-first navigation & screen-reader pass

### Health
- 3 gym sessions weekly, long walk on rest days`,
      },
    ],
  }

  const transactionId = (() => {
    let id = 0
    return () => `tx-${++id}`
  })()

  /* ---- 30 days of history ---- */
  for (let i = 29; i >= 0; i--) {
    const key = addDays(todayKey, -i)
    const isToday = i === 0

    /* Daily sheet entry — ~79% average, sprinkled perfect days */
    let entry
    if (isToday) {
      entry = { prayers: true, walk: true, exercise: false, coding: 1.5, water: 5 }
    } else {
      const perfect = rand() > 0.82
      if (perfect) {
        entry = {
          prayers: true,
          exercise: true,
          walk: true,
          coding: 2 + Math.floor(rand() * 3),
          water: 8 + Math.floor(rand() * 2),
        }
      } else {
        const codingRoll = rand()
        entry = {
          prayers: rand() < 0.93,
          exercise: rand() < 0.76,
          walk: rand() < 0.82,
          coding: codingRoll < 0.6 ? 1.5 + Math.floor(rand() * 4) : codingRoll < 0.85 ? 1 : 0,
          water: 4 + Math.floor(rand() * 6),
        }
      }
    }
    data.daily[key] = entry

    /* Scheduler blocks for the day, statuses derived from the sheet */
    const blocks = []
    const nowDone = (preset) => {
      if (isToday) {
        if (preset.start + preset.dur <= nowHour) {
          return entryTrackerState(preset, entry, "completed")
        }
        if (preset.start <= nowHour) return "progress"
        return "pending"
      }
      return entryTrackerState(preset, entry, rand() < 0.9 ? "completed" : "skipped")
    }
    for (const p of PRESETS) {
      blocks.push({
        id: `sb-${key}-${p.id}`,
        presetId: p.id,
        title: p.title,
        cat: p.cat,
        start: p.start,
        dur: p.dur,
        status: nowDone(p),
      })
    }
    data.scheduler[key] = blocks

    /* Finance transactions — 0..3 per day, plus fixed utilities */
    const count = isToday ? 2 : Math.floor(rand() * 4)
    for (let t = 0; t < count; t++) {
      const roll = rand()
      const cat =
        roll < 0.4 ? "Food" : roll < 0.55 ? "Travel" : roll < 0.7 ? "Misc" : roll < 0.85 ? "Tech" : "Utilities"
      const [titles, min, max] = POOLS[cat]
      data.finance.transactions.push({
        id: transactionId(),
        date: key,
        title: pick(rand, titles),
        category: cat,
        amount: round(min + rand() * (max - min)),
      })
    }
    if (key.endsWith("-05")) {
      data.finance.transactions.push({
        id: transactionId(),
        date: key,
        title: "Internet bill",
        category: "Utilities",
        amount: 6499,
      })
    }
  }
  // Guarantee today has at least one transaction
  const today = dateKey(new Date())
  if (!data.finance.transactions.some((t) => t.date === today)) {
    data.finance.transactions.push({
      id: transactionId(),
      date: today,
      title: "Coffee",
      category: "Food",
      amount: 750,
    })
  }

  // Re-key transactions newest-first for a natural list order
  data.finance.transactions.sort(
    (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0),
  )

  // Resolve goal due dates relative to today
  for (const g of data.goals.small) {
    g.due = addDays(todayKey, g.dueOffset ?? 3)
    delete g.dueOffset
  }

  return data
}

/** Map a scheduler preset to the right status, given the daily entry. */
function entryTrackerState(preset, entry, fallback) {
  const t = preset.title
  if (t === "Deep Work / Coding") return entry.coding >= 2 ? "completed" : entry.coding > 0 ? fallback : fallback
  if (t === "Morning Walk") return entry.walk ? "completed" : fallback
  if (t === "Exercise / Gym") return entry.exercise ? "completed" : fallback
  if (preset.cat === "Prayer") return entry.prayers ? "completed" : fallback
  return entry.prayers || entry.reading ? "completed" : fallback
}
