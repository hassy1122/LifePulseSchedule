import { useMemo, useState } from "react"
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ArrowDownRight, ArrowUpRight, Award, ChevronLeft, ChevronRight, CircleCheck, Flame } from "lucide-react"
import { dailyPct } from "../lib/seed"
import { bandFor } from "../lib/theme"
import { addDays, fmtDayShort, fmtMonthLong, keyToDate, monthKeyOf, shiftMonth } from "../lib/utils"
import { PageHeader } from "../components/ui"

const CATEGORY_META = [
  { id: "prayers", label: "Prayers", color: "#8B5CF6" },
  { id: "exercise", label: "Exercise", color: "#22C55E" },
  { id: "coding", label: "Coding (2h+)", color: "#F59E0B" },
]

const RANGES = [
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
  { id: "all", label: "Years" },
]

const AVG_TITLES = { week: "Weekly average", month: "Monthly average", year: "Yearly average", all: "All-time average" }

const pct = (n) => (n == null ? null : Math.round(n * 10) / 10)

const mean = (list) => (list.length ? pct(list.reduce((a, b) => a + b, 0) / list.length) : null)

/** Adds a cumulative "running average" line to bar-style rows. */
function withRunningAvg(rows) {
  let acc = []
  return rows.map((r) => {
    if (r.pct != null) acc.push(r.pct)
    return { ...r, avg: mean(acc) }
  })
}

const HEAT_DAYS = 105
const HEAT_LEGEND = [
  { label: "No data", cls: "bg-slate-100 dark:bg-slate-800" },
  { label: "< 75%", cls: "bg-rose-400" },
  { label: "≥ 75%", cls: "bg-emerald-500" },
  { label: "100%", cls: "bg-violet-500" },
]

function heatCellClass(p) {
  if (p == null) return "bg-slate-100 dark:bg-slate-800"
  if (p >= 100) return "bg-violet-500"
  if (p >= 75) return "bg-emerald-500"
  return "bg-rose-400"
}

export default function Analytics({ data, todayKey, isDark = false }) {
  const [initialMonth] = useState(() => monthKeyOf(todayKey))
  const [range, setRange] = useState("month")
  const [month, setMonth] = useState(initialMonth)
  const [yearSel, setYearSel] = useState(Number(initialMonth.slice(0, 4)))
  const [weekStart, setWeekStart] = useState(() => {
    const dow = keyToDate(todayKey).getDay()
    return addDays(todayKey, -dow)
  })

  /* ---- Month rows (daily + 7-day rolling average) ---- */
  const monthData = useMemo(() => {
    const [y, m] = month.split("-").map(Number)
    const daysInMonth = new Date(y, m, 0).getDate()
    let acc = []
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1
      const key = `${month}-${String(d).padStart(2, "0")}`
      const entry = data.daily[key]
      const p = entry ? pct(dailyPct(entry) || 0) : null
      if (p != null) acc.push(p)
      const window = acc.slice(-7)
      return {
        key,
        label: String(d),
        pct: p,
        avg: window.length ? pct(window.reduce((a, b) => a + b, 0) / window.length) : null,
      }
    })
  }, [month, data.daily])

  /* ---- Week rows ---- */
  const weekData = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const key = addDays(weekStart, i)
        const entry = data.daily[key]
        return { key, label: fmtDayShort(key), pct: entry ? dailyPct(entry) : null }
      }),
    [weekStart, data.daily],
  )

  /* ---- Year rows (12 monthly averages + running average) ---- */
  const yearData = useMemo(() => {
    const rows = Array.from({ length: 12 }, (_, i) => {
      const mk = `${yearSel}-${String(i + 1).padStart(2, "0")}`
      const scores = Object.entries(data.daily)
        .filter(([k]) => k.startsWith(mk))
        .map(([, e]) => dailyPct(e))
      return { key: mk, label: fmtMonthLong(mk).split(" ")[0].slice(0, 3), pct: mean(scores) }
    })
    return withRunningAvg(rows)
  }, [yearSel, data.daily])

  /* ---- Years rows (one bar per tracked year) ---- */
  const allData = useMemo(() => {
    const map = new Map()
    for (const k of Object.keys(data.daily)) {
      const y = k.slice(0, 4)
      if (!map.has(y)) map.set(y, [])
      map.get(y).push(dailyPct(data.daily[k]))
    }
    const rows = [...map.keys()]
      .sort()
      .map((y) => ({ key: y, label: y, pct: mean(map.get(y)) }))
    return withRunningAvg(rows)
  }, [data.daily])

  const rows = range === "week" ? weekData : range === "month" ? monthData : range === "year" ? yearData : allData

  /* ---- Range statistics (always counted over underlying days, not bars) ---- */
  const dayPcts = useMemo(() => {
    if (range === "week")
      return Array.from({ length: 7 }, (_, i) => data.daily[addDays(weekStart, i)])
        .filter(Boolean)
        .map(dailyPct)
    if (range === "month")
      return Object.entries(data.daily).filter(([k]) => k.startsWith(month)).map(([, e]) => dailyPct(e))
    if (range === "year")
      return Object.entries(data.daily).filter(([k]) => k.startsWith(String(yearSel))).map(([, e]) => dailyPct(e))
    return Object.values(data.daily).map(dailyPct)
  }, [range, data.daily, weekStart, month, yearSel])

  const trackedCount = dayPcts.length
  const avg = mean(dayPcts) ?? 0
  const perfectDays = dayPcts.filter((d) => d >= 100).length
  const goodDays = dayPcts.filter((d) => d >= 75 && d < 100).length
  const band = bandFor(avg)

  /* ---- Previous-range comparison ---- */
  const prevAvg = useMemo(() => {
    if (range === "week") return mean(Array.from({ length: 7 }, (_, i) => {
      const e = data.daily[addDays(weekStart, i - 7)]
      return e ? dailyPct(e) : null
    }).filter((v) => v != null))
    if (range === "month") {
      const pm = shiftMonth(month, -1)
      return mean(Object.entries(data.daily).filter(([k]) => k.startsWith(pm)).map(([, e]) => dailyPct(e)))
    }
    if (range === "year") {
      return mean(Object.entries(data.daily).filter(([k]) => k.startsWith(String(yearSel - 1))).map(([, e]) => dailyPct(e)))
    }
    return null
  }, [range, data.daily, weekStart, month, yearSel])

  const prevLabel = useMemo(() => {
    if (range === "week") return "vs previous week"
    if (range === "month") return `vs ${fmtMonthLong(shiftMonth(month, -1)).split(" ")[0]} average`
    if (range === "year") return `vs ${yearSel - 1} average`
    return null
  }, [range, month, yearSel])

  const lifetimeDays = Object.keys(data.daily).length

  /* ---- Category consistency, filtered to the active range ---- */
  const consistency = useMemo(() => {
    const match = (k) =>
      range === "week" ? k >= weekStart && k <= addDays(weekStart, 6)
      : range === "month" ? k.startsWith(month)
      : range === "year" ? k.startsWith(String(yearSel))
      : true
    const entries = Object.entries(data.daily).filter(([k]) => match(k))
    return CATEGORY_META.map((c) => {
      const hits = entries.filter(([, e]) =>
        c.id === "coding" ? e.coding >= 2 : e[c.id],
      ).length
      return { ...c, value: hits, days: entries.length }
    })
  }, [data.daily, range, weekStart, month, yearSel])
  const totalHits = consistency.reduce((a, c) => a + c.value, 0)

  /* ---- Habit heatmap — last 15 weeks, aligned to Sunday ---- */
  const heat = useMemo(() => {
    const oldest = addDays(todayKey, -(HEAT_DAYS - 1))
    const cells = []
    for (let i = 0; i < keyToDate(oldest).getDay(); i++) cells.push({ blank: true })
    for (let i = 0; i < HEAT_DAYS; i++) {
      const key = addDays(oldest, i)
      const entry = data.daily[key]
      cells.push({ key, pct: entry ? dailyPct(entry) : null })
    }
    return cells
  }, [data.daily, todayKey])

  /* ---- Navigation per range ---- */
  const goPrev = () => {
    if (range === "week") setWeekStart(addDays(weekStart, -7))
    else if (range === "month") setMonth(shiftMonth(month, -1))
    else if (range === "year") setYearSel((y) => y - 1)
  }
  const goNext = () => {
    if (range === "week") setWeekStart(addDays(weekStart, 7))
    else if (range === "month") setMonth(shiftMonth(month, 1))
    else if (range === "year") setYearSel((y) => y + 1)
  }
  const nextDisabled =
    range === "week" ? addDays(weekStart, 6) >= todayKey
    : range === "month" ? month >= initialMonth
    : range === "year" ? yearSel >= Number(initialMonth.slice(0, 4))
    : true

  /* ---- Recharts theming ---- */
  const chartGrid = isDark ? "#334155" : "#E2E8F0"
  const chartTick = isDark ? "#64748B" : "#94A3B8"
  const tooltipProps = {
    contentStyle: {
      borderRadius: 12,
      border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`,
      background: isDark ? "#0f172a" : "#FFFFFF",
      fontSize: 12,
      boxShadow: "0 8px 24px -12px rgba(15,23,42,.2)",
    },
    itemStyle: { color: isDark ? "#a8b3c7" : "#334155" },
    labelStyle: { color: isDark ? "#e2e8f0" : "#0f172a", fontWeight: 700 },
  }
  const seriesNames = {
    week: { pct: "Daily score" },
    month: { pct: "Daily score", avg: "7-day avg" },
    year: { pct: "Monthly average", avg: "Running average" },
    all: { pct: "Yearly average", avg: "Running average" },
  }
  const cellFill = (p) => (p == null ? (isDark ? "#475569" : "#CBD5E1") : bandFor(p).stroke)

  const heading = range === "week" || range === "month" ? "Daily completion %" : range === "year" ? "Monthly averages" : "Yearly averages"
  const rangeBlurb =
    range === "week" ? `${fmtDayShort(weekStart)} – ${fmtDayShort(addDays(weekStart, 6))}`
    : range === "month" ? fmtMonthLong(month)
    : range === "year" ? String(yearSel)
    : "since tracking began"

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Your schedule results across any horizon — week, month, year and all time."
      >
        <div className="flex flex-wrap items-center justify-end gap-3">
          {/* Range selector */}
          <div
            className="inline-flex flex-wrap gap-0.5 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700"
            role="group"
            aria-label="Time range"
          >
            {RANGES.map((r) => {
              const active = range === r.id
              return (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setRange(r.id)}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-violet-500 ${
                    active
                      ? "border border-slate-200 bg-white text-slate-800 shadow-sm dark:border-slate-600"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {r.label}
                </button>
              )
            })}
          </div>
          {/* Range navigation (hidden on the all-time view) */}
          {range !== "all" ? (
            <div className="flex items-center gap-1">
              <button type="button" className="icon-btn" aria-label="Previous" onClick={goPrev}>
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="btn-soft !h-9 select-none px-3 text-xs">
                {range === "week" ? "Week" : range === "month" ? fmtMonthLong(month) : yearSel}
              </span>
              <button type="button" className="icon-btn" aria-label="Next" disabled={nextDisabled} onClick={goNext}>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </div>
      </PageHeader>

      {/* Average + stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className={`card border ${band.bg} ${band.border} md:col-span-2 xl:col-span-1`} aria-live="polite">
          <p className={`section-title ${band.text} opacity-80`}>{AVG_TITLES[range]}</p>
          <p className={`mt-3 text-5xl font-extrabold tracking-tight ${band.text}`}>{avg}%</p>
          <span
            className={`mt-4 inline-block rounded-full border px-3 py-1 text-xs font-bold ${band.bg} ${band.border} ${band.text}`}
          >
            {band.label}
          </span>
          <p className={`mt-3 text-xs font-semibold ${band.text} opacity-80`}>
            Across {trackedCount} tracked day{trackedCount === 1 ? "" : "s"} · {rangeBlurb}
          </p>
        </div>

        <StatCard icon={Award} tint="bg-violet-50 text-violet-600" label="Perfect days (100%)" value={perfectDays} />
        <StatCard icon={CircleCheck} tint="bg-emerald-50 text-emerald-600" label="Days ≥ 75%" value={goodDays + perfectDays} />
        {prevLabel != null ? (
          <DeltaCard delta={prevAvg == null ? null : avg - prevAvg} prevLabel={prevLabel} />
        ) : (
          <StatCard icon={Flame} tint="bg-sky-50 text-sky-600" label="Lifetime tracked days" value={lifetimeDays} />
        )}
      </div>

      {/* Trend chart */}
      <section className="card mb-6" aria-labelledby="trend-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 id="trend-heading" className="text-sm font-bold text-slate-800">{heading}</h2>
          <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-violet-500" aria-hidden="true" />
              {range === "week" || range === "month" ? "Daily score" : range === "year" ? "Monthly average" : "Yearly average"}
            </span>
            {range !== "week" ? (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
                {range === "month" ? "7-day average" : "Running average"}
              </span>
            ) : null}
          </div>
        </div>
        <div className="h-72" role="img" aria-label={`Chart of ${heading.toLowerCase()} · ${rangeBlurb}`}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="fillPct" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A855F7" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#A855F7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: chartTick }}
                tickLine={false}
                axisLine={{ stroke: chartGrid }}
                interval={range === "month" ? 2 : 0}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: chartTick }} tickLine={false} axisLine={false} width={44} unit="%" />
              <Tooltip
                {...tooltipProps}
                formatter={(v, name) => [`${v}%`, seriesNames[range][name] || name]}
                labelFormatter={(l) => (range === "month" ? `${fmtMonthLong(month).split(" ")[0]} ${l}` : l)}
              />
              {range === "week" || range === "month" ? (
                <Area
                  type="monotone"
                  dataKey="pct"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  fill="url(#fillPct)"
                  dot={{ r: 2.5, fill: "#fff", stroke: "#8B5CF6", strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: "#8B5CF6", stroke: "#fff", strokeWidth: 2 }}
                  connectNulls
                  name="pct"
                />
              ) : (
                <Bar dataKey="pct" name="pct" maxBarSize={56} radius={[6, 6, 0, 0]}>
                  {rows.map((d) => (
                    <Cell key={d.key} fill={cellFill(d.pct)} />
                  ))}
                </Bar>
              )}
              {range !== "week" ? (
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="#22C55E"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                  connectNulls
                  name="avg"
                />
              ) : null}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Category consistency donut */}
      <section className="card" aria-labelledby="consistency-heading">
        <h2 id="consistency-heading" className="mb-1 text-sm font-bold text-slate-800">Category consistency</h2>
        <p className="mb-4 text-xs font-medium text-slate-400">
          Days each category was completed, {range === "week" ? "this week" : range === "month" ? "this month" : range === "year" ? "this year" : "all time"} — Prayers vs. Exercise vs. Coding.
        </p>
        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
          <div className="h-64" role="img" aria-label={`Donut chart: ${consistency.map(c => `${c.label} ${c.value} days`).join(", ")}`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={consistency}
                  dataKey="value"
                  nameKey="label"
                  innerRadius="62%"
                  outerRadius="88%"
                  paddingAngle={3}
                  cornerRadius={6}
                  strokeWidth={0}
                  isAnimationActive={false}
                >
                  {consistency.map((c) => (
                    <Cell key={c.id} fill={c.color} />
                  ))}
                </Pie>
                <Tooltip
                  {...tooltipProps}
                  formatter={(v, name) => [`${v} days`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-3">
            {consistency.map((c) => {
              const share = totalHits ? Math.round((c.value / totalHits) * 100) : 0
              const consistencyPct = c.days ? pct((c.value / c.days) * 100) : 0
              return (
                <li key={c.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} aria-hidden="true" />
                      {c.label}
                    </span>
                    <span className="text-xs font-semibold tabular-nums text-slate-500">
                      {c.value}/{c.days} days
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white dark:bg-slate-900">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${consistencyPct}%`, backgroundColor: c.color }} />
                  </div>
                  <p className="mt-1.5 text-[11px] font-semibold text-slate-400">{consistencyPct}% consistency · {share}% of all category hits</p>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* Habit heatmap — last 15 weeks, colored by completion band */}
      <section className="card mt-6" aria-labelledby="heatmap-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="heatmap-heading" className="text-sm font-bold text-slate-800">Consistency heatmap</h2>
            <p className="mt-0.5 text-xs font-medium text-slate-400">
              Last 15 weeks of daily completion · starts Sunday
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400">
            <span>Less</span>
            {HEAT_LEGEND.map((l) => (
              <span key={l.label} className="flex items-center gap-1">
                <span className={`h-3 w-3 rounded-[4px] ${l.cls}`} aria-hidden="true" />
                <span className="sr-only">{l.label}</span>
              </span>
            ))}
            <span>
              More
              <span className="sr-only"> · No data, under 75%, 75% or more, 100%</span>
            </span>
          </div>
        </div>
        <div className="scroll-slim overflow-x-auto pb-1">
          <div
            className="grid grid-flow-col grid-rows-7 gap-[3px]"
            role="img"
            aria-label="Habit heatmap of the last 15 weeks, colored by daily completion band"
          >
            {heat.map((cell, i) =>
              cell.blank ? (
                <span key={`blank-${i}`} className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <span
                  key={cell.key}
                  title={`${fmtDayShort(cell.key)} — ${cell.pct == null ? "no data" : `${cell.pct}%`}`}
                  className={`h-3.5 w-3.5 rounded-[4px] ${heatCellClass(cell.pct)} ${
                    cell.key === todayKey ? "outline outline-2 outline-offset-1 outline-violet-500" : ""
                  }`}
                />
              ),
            )}
          </div>
        </div>
      </section>
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

function DeltaCard({ delta, prevLabel }) {
  if (prevLabel == null) return null
  if (delta == null) {
    return (
      <div className="card flex items-center gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-400" aria-hidden="true">
          <ArrowUpRight className="h-5 w-5" strokeWidth={2.2} />
        </span>
        <div>
          <p className="text-2xl font-extrabold tracking-tight text-slate-400">—</p>
          <p className="text-xs font-medium text-slate-400">No data {prevLabel}</p>
        </div>
      </div>
    )
  }
  const better = delta >= 0
  const Icon = better ? ArrowUpRight : ArrowDownRight
  return (
    <div className="card flex items-center gap-4">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${better ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
        aria-hidden="true"
      >
        <Icon className="h-5 w-5" strokeWidth={2.2} />
      </span>
      <div>
        <p className={`text-2xl font-extrabold tracking-tight ${better ? "text-emerald-700" : "text-rose-600"}`}>
          {better ? "+" : ""}{Math.round(delta * 10) / 10}%
        </p>
        <p className="text-xs font-medium text-slate-400">{prevLabel}</p>
      </div>
    </div>
  )
}
