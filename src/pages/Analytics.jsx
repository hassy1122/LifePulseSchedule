import { useMemo, useState } from "react"
import {
  Area,
  ComposedChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ChevronLeft, ChevronRight, Award, Flame, CircleCheck } from "lucide-react"
import { dailyPct } from "../lib/seed"
import { bandFor } from "../lib/theme"
import { fmtMonthLong, monthKeyOf, shiftMonth } from "../lib/utils"
import { PageHeader } from "../components/ui"

const CATEGORY_META = [
  { id: "prayers", label: "Prayers", color: "#8B5CF6" },
  { id: "exercise", label: "Exercise", color: "#22C55E" },
  { id: "coding", label: "Coding (2h+)", color: "#F59E0B" },
]

const pct = (n) => (n == null ? null : Math.round(n * 10) / 10)

export default function Analytics({ data, todayKey }) {
  const [initialMonth] = useState(() => monthKeyOf(todayKey))
  const [month, setMonth] = useState(initialMonth)

  const monthData = useMemo(() => {
    const [y, m] = month.split("-").map(Number)
    const daysInMonth = new Date(y, m, 0).getDate()
    const days = []
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${month}-${String(d).padStart(2, "0")}`
      const entry = data.daily[key]
      days.push({ key, day: d, pct: entry ? pct(dailyPct(entry) || 0) : null })
    }
    // rolling 7-day average line
    let acc = []
    return days.map((row) => {
      if (row.pct != null) acc.push(row.pct)
      const window = acc.slice(-7)
      return {
        ...row,
        avg: window.length ? pct(window.reduce((a, b) => a + b, 0) / window.length) : null,
      }
    })
  }, [month, data.daily])

  const scored = monthData.filter((d) => d.pct != null)
  const avg = scored.length ? pct(scored.reduce((a, b) => a + b.pct, 0) / scored.length) : 0
  const perfectDays = scored.filter((d) => d.pct >= 100).length
  const goodDays = scored.filter((d) => d.pct >= 75 && d.pct < 100).length

  const band = bandFor(avg)
  const maxStreak = useMemo(() => {
    let best = 0, cur = 0
    for (const d of monthData) {
      if (d.pct != null && d.pct >= 75) { cur++; best = Math.max(best, cur) } else cur = 0
    }
    return best
  }, [monthData])

  /* Category consistency: days completed per category (donut slices) */
  const consistency = useMemo(() => {
    const entries = Object.entries(data.daily).filter(([k]) => k.startsWith(month))
    const out = CATEGORY_META.map((c) => {
      const hits = entries.filter(([, e]) =>
        c.id === "coding" ? e.coding >= 2 : e[c.id],
      ).length
      return { ...c, value: hits, days: entries.length }
    })
    return out
  }, [month, data.daily])
  const totalHits = consistency.reduce((a, c) => a + c.value, 0)

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Month-wise trend of your daily completion, with category consistency breakdown.">
        <div className="flex items-center gap-1">
          <button type="button" className="icon-btn" aria-label="Previous month" onClick={() => setMonth(shiftMonth(month, -1))}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="btn-soft !h-9 select-none px-3 text-xs">{fmtMonthLong(month)}</span>
          <button
            type="button"
            className="icon-btn"
            aria-label="Next month"
            disabled={month >= initialMonth}
            onClick={() => setMonth(shiftMonth(month, 1))}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </PageHeader>

      {/* Average + stat cards */}
      <div className="mb-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className={`card border ${band.bg} ${band.border} md:col-span-2 xl:col-span-1`} aria-live="polite">
          <p className={`section-title ${band.text} opacity-80`}>Monthly average</p>
          <p className={`mt-3 text-5xl font-extrabold tracking-tight ${band.text}`}>{avg}%</p>
          <span
            className={`mt-4 inline-block rounded-full border px-3 py-1 text-xs font-bold ${band.bg} ${band.border} ${band.text}`}
          >
            {band.label}
          </span>
          <p className={`mt-3 text-xs font-semibold ${band.text} opacity-80`}>
            Across {scored.length} tracked days of {fmtMonthLong(month)}
          </p>
        </div>

        <StatCard icon={Award} tint="bg-violet-50 text-violet-600" label="Perfect days (100%)" value={perfectDays} />
        <StatCard icon={CircleCheck} tint="bg-emerald-50 text-emerald-600" label="Days ≥ 75%" value={goodDays + perfectDays} />
        <StatCard icon={Flame} tint="bg-amber-50 text-amber-600" label="Longest ≥75% streak" value={`${maxStreak} days`} />
      </div>

      {/* Daily trend chart */}
      <section className="card mb-6" aria-labelledby="trend-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="trend-heading" className="text-sm font-bold text-slate-800">Daily completion %</h2>
          <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-violet-500" aria-hidden="true" /> Daily score
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" /> 7-day average
            </span>
          </div>
        </div>
        <div className="h-72" role="img" aria-label="Line and area chart of daily completion percentage">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="fillPct" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A855F7" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#A855F7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={{ stroke: "#E2E8F0" }} interval={2} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} width={44} unit="%" />
              <Tooltip
                formatter={(v, name) => [`${v}%`, name === "pct" ? "Daily score" : "7-day avg"]}
                labelFormatter={(d) => `${fmtMonthLong(month).split(" ")[0]} ${d}`}
                contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12, boxShadow: "0 8px 24px -12px rgba(15,23,42,.2)" }}
              />
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
              <Line type="monotone" dataKey="avg" stroke="#22C55E" strokeWidth={2} strokeDasharray="6 4" dot={false} connectNulls name="avg" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Category consistency donut */}
      <section className="card" aria-labelledby="consistency-heading">
        <h2 id="consistency-heading" className="mb-1 text-sm font-bold text-slate-800">Category consistency</h2>
        <p className="mb-4 text-xs font-medium text-slate-400">Days each category was completed — Prayers vs. Exercise vs. Coding.</p>
        <div className="grid items-center gap-6 md:grid-cols-2">
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
                  formatter={(v, name) => [`${v} days`, name]}
                  contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-3">
            {consistency.map((c) => {
              const share = totalHits ? Math.round((c.value / totalHits) * 100) : 0
              const consistencyPct = c.days ? pct((c.value / c.days) * 100) : 0
              return (
                <li key={c.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} aria-hidden="true" />
                      {c.label}
                    </span>
                    <span className="text-xs font-semibold tabular-nums text-slate-500">
                      {c.value}/{c.days} days
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${consistencyPct}%`, backgroundColor: c.color }} />
                  </div>
                  <p className="mt-1.5 text-[11px] font-semibold text-slate-400">{consistencyPct}% consistency · {share}% of all category hits</p>
                </li>
              )
            })}
          </ul>
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
