import { useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts"
import {
  CalendarCheck,
  CalendarClock,
  ChartColumn,
  ChevronRight,
  CircleCheck,
  Flame,
  StickyNote,
  Target,
  Wallet,
} from "lucide-react"
import { dailyPct, TRACKERS } from "../lib/seed"
import { bandFor } from "../lib/theme"
import { addDays, fmtDayLong, fmtHour, fmtMoney, monthKeyOf } from "../lib/utils"
import { ProgressRing, PageHeader } from "../components/ui"
import NamazCard from "../components/NamazCard"

const QUICK_ACTIONS = [
  { id: "daily", label: "Daily Sheet", icon: CalendarCheck, tint: "bg-violet-50 text-violet-600" },
  { id: "scheduler", label: "Scheduler", icon: CalendarClock, tint: "bg-sky-50 text-sky-600" },
  { id: "goals", label: "Goals", icon: Target, tint: "bg-emerald-50 text-emerald-600" },
  { id: "finance", label: "Finance", icon: Wallet, tint: "bg-amber-50 text-amber-600" },
  { id: "notes", label: "Notes", icon: StickyNote, tint: "bg-slate-100 text-slate-600" },
]

function greetingFor(hour) {
  if (hour >= 5 && hour < 12) return "Good morning"
  if (hour >= 12 && hour < 17) return "Good afternoon"
  if (hour >= 17 && hour < 21) return "Good evening"
  return "Peaceful night"
}

export default function Today({ data, patch, todayKey, onNavigate }) {
  const [now] = useState(() => new Date())
  const nowHour = now.getHours() + now.getMinutes() / 60

  const entry = data.daily[todayKey]
  const pct = dailyPct(entry)
  const band = bandFor(pct)
  const done = TRACKERS.filter((t) =>
    t.kind === "toggle" ? entry?.[t.id] : (entry?.[t.id] ?? 0) >= t.target,
  ).length

  const blocks = data.scheduler?.[todayKey] ?? []
  const nextUp = blocks
    .filter((b) => (b.status === "pending" || b.status === "progress") && b.start + b.dur > nowHour)
    .sort((a, b) => a.start - b.start)[0]
  const remaining = blocks.filter(
    (b) => (b.status === "pending" || b.status === "progress") && b.start + b.dur > nowHour,
  ).length

  /* streak: consecutive days at ≥75%, ending today (or yesterday if today is unfinished) */
  const streak = useMemo(() => {
    let count = 0
    let cursor = dailyPct(data.daily[todayKey]) >= 75 ? todayKey : addDays(todayKey, -1)
    while (true) {
      const dayPct = dailyPct(data.daily[cursor])
      if (dayPct >= 75) {
        count += 1
        cursor = addDays(cursor, -1)
      } else break
    }
    return count
  }, [data.daily, todayKey])

  /* month average + spent today */
  const month = monthKeyOf(todayKey)
  const monthScored = useMemo(() => {
    return Object.entries(data.daily)
      .filter(([k]) => k.startsWith(month))
      .map(([, e]) => dailyPct(e))
  }, [data.daily, month])
  const monthAvg = monthScored.length
    ? Math.round((monthScored.reduce((a, b) => a + b, 0) / monthScored.length) * 10) / 10
    : 0

  const spentToday = data.finance.transactions
    .filter((t) => t.date === todayKey)
    .reduce((a, t) => a + t.amount, 0)

  /* last-14-days sparkline */
  const spark = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const key = addDays(todayKey, -(13 - i))
        return { day: key, pct: dailyPct(data.daily[key] || { prayers: false, exercise: false, walk: false, coding: 0, water: 0 }) }
      }),
    [data.daily, todayKey],
  )

  const openSprints = data.goals.small.filter((g) => !g.done).length

  return (
    <div>
      <PageHeader
        title={`${greetingFor(now.getHours())} 👋`}
        subtitle={fmtDayLong(todayKey)}
      >
        <span
          className={`rounded-full border px-3.5 py-1.5 text-xs font-bold ${band.bg} ${band.border} ${band.text}`}
        >
          Today · {pct}%
        </span>
      </PageHeader>

      {/* Hero: today's completion */}
      <section className={`card mb-6 border ${band.bg} ${band.border}`}>
        <div className="flex flex-wrap items-center gap-8">
          <div className="shrink-0">
            <ProgressRing pct={pct} />
          </div>
          <div className="min-w-[220px] flex-1">
            <h2 className={`text-lg font-extrabold tracking-tight ${band.text}`}>
              {pct >= 100
                ? "Flawless day — every tracked habit done."
                : pct >= 75
                  ? "Strong day so far — finish the remaining habits."
                  : done === 0
                    ? "A fresh page. Start with one habit."
                    : "In progress — momentum beats perfection."}
            </h2>
            <p className={`mt-2 text-sm font-semibold ${band.text} opacity-80`}>
              {done}/{TRACKERS.length} tracked habits complete
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => onNavigate("daily")} className="btn-primary !h-9 text-xs">
                <CalendarCheck className="h-4 w-4" aria-hidden="true" /> Update checklist
              </button>
              <button type="button" onClick={() => onNavigate("scheduler")} className="btn-soft !h-9 text-xs">
                <CalendarClock className="h-4 w-4" aria-hidden="true" /> Open scheduler
              </button>
            </div>
          </div>
          <div className="w-full sm:w-64">
            <p className="section-title mb-2 opacity-80">Last 14 days</p>
            <div className="h-24" role="img" aria-label="Completion trend of the last 14 days">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spark} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={band.stroke} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={band.stroke} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip
                    formatter={(v) => [`${v}%`, "Completion"]}
                    labelFormatter={() => ""}
                    contentStyle={{ borderRadius: 10, border: "1px solid rgba(148,163,184,.3)", fontSize: 11, padding: "4px 10px" }}
                  />
                  <Area type="monotone" dataKey="pct" stroke={band.stroke} strokeWidth={2} fill="url(#sparkFill)" name="pct" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Stat row */}
      <div className="mb-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Flame} tint="bg-orange-50 text-orange-600" label="≥75% streak" value={`${streak} day${streak === 1 ? "" : "s"}`} />
        <StatCard icon={ChartColumn} tint="bg-violet-50 text-violet-600" label={`${month.slice(5)} month average`} value={`${monthAvg}%`} />
        <StatCard icon={Wallet} tint="bg-emerald-50 text-emerald-600" label="Spent today" value={fmtMoney(Math.round(spentToday * 100) / 100)} />
        <StatCard icon={Target} tint="bg-sky-50 text-sky-600" label="Small goals open" value={openSprints} />
      </div>

      {/* Namaz — compact five-slot tracker (hidden until location is set) */}
      <div className="mb-6">
        <NamazCard data={data} patch={patch} todayKey={todayKey} compact />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Next up */}
        <section className="card" aria-labelledby="next-up">
          <h2 id="next-up" className="section-title">Next up</h2>
          {nextUp ? (
            <button
              type="button"
              onClick={() => onNavigate("scheduler")}
              className="mt-4 flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-100 p-4 text-left transition hover:border-violet-200 hover:bg-violet-50/50 focus-visible:outline-2 focus-visible:outline-violet-500"
            >
              <span className="flex items-center gap-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600" aria-hidden="true">
                  <CalendarClock className="h-5 w-5" strokeWidth={2.2} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-slate-800">{nextUp.title}</span>
                  <span className="block text-xs font-medium text-slate-400">
                    {fmtHour(nextUp.start)} – {fmtHour(nextUp.start + nextUp.dur)}
                    {remaining > 1 ? ` · ${remaining - 1} more after this` : ""}
                  </span>
                </span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" aria-hidden="true" />
            </button>
          ) : (
            <p className="mt-4 flex items-center gap-3 rounded-2xl bg-[#F0FDF4] p-4 text-sm font-semibold text-[#166534]">
              <CircleCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
              {blocks.length ? "All scheduled items are handled — enjoy the freedom." : "Nothing scheduled yet — plan the day in the scheduler."}
            </p>
          )}
        </section>

        {/* Quick actions */}
        <section className="card" aria-labelledby="quick-actions">
          <h2 id="quick-actions" className="section-title">Jump to</h2>
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {QUICK_ACTIONS.map(({ id, label, icon: Icon, tint }) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onNavigate(id)}
                  className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-100 p-3.5 text-left transition hover:-translate-y-px hover:shadow-soft focus-visible:outline-2 focus-visible:outline-violet-500"
                >
                  <span className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tint}`} aria-hidden="true">
                      <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
                    </span>
                    <span className="text-sm font-bold text-slate-700">{label}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, tint, label, value }) {
  return (
    <div className="card flex items-center gap-4">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tint}`} aria-hidden="true">
        <Icon className="h-5 w-5" strokeWidth={2.2} />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
        <p className="text-xs font-medium text-slate-400">{label}</p>
      </div>
    </div>
  )
}
