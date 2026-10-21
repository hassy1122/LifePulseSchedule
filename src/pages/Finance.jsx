import { useMemo, useState } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { Bus, Plus, CircleDollarSign, Receipt, CalendarDays, Trash2, Utensils, Wrench, Wallet, Laptop } from "lucide-react"
import { fmtDayShort, fmtMoney, monthKeyOf, uid } from "../lib/utils"

const CATEGORIES = [
  { id: "Food", icon: Utensils, color: "#F59E0B", tint: "bg-amber-50 text-amber-600" },
  { id: "Tech", icon: Laptop, color: "#38BDF8", tint: "bg-sky-50 text-sky-600" },
  { id: "Utilities", icon: Wrench, color: "#8B5CF6", tint: "bg-violet-50 text-violet-600" },
  { id: "Travel", icon: Bus, color: "#22C55E", tint: "bg-emerald-50 text-emerald-600" },
  { id: "Misc", icon: CircleDollarSign, color: "#94A3B8", tint: "bg-slate-100 text-slate-500" },
]

const catMeta = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[4]

export default function Finance({ data, patch, todayKey }) {
  const month = monthKeyOf(todayKey)
  const [form, setForm] = useState({ date: todayKey, title: "", category: "Food", amount: "" })
  const txs = data.finance.transactions

  const todayTotal = useMemo(() => sum(txs.filter((t) => t.date === todayKey)), [txs, todayKey])
  const monthTotal = useMemo(() => sum(txs.filter((t) => t.date.startsWith(month))), [txs, month])

  const byCategory = useMemo(() => {
    const map = new Map(CATEGORIES.map((c) => [c.id, 0]))
    for (const t of txs) if (t.date.startsWith(month)) map.set(t.category, (map.get(t.category) || 0) + t.amount)
    return CATEGORIES.map((c) => ({ name: c.id, value: Math.round((map.get(c.id) || 0) * 100) / 100, color: c.color }))
  }, [txs, month])
  const pieTotal = byCategory.reduce((a, b) => a + b.value, 0)

  /** Update the overall monthly limit (or clear it with an empty value). */
  function setMonthlyLimit(raw) {
    const value = raw === "" ? null : Number(raw)
    patch((d) => {
      const budget = (d.finance.budget ??= {})
      budget.monthly = Number.isFinite(value) ? Math.max(0, value) : null
    })
  }

  /** Update (or clear) a category's monthly limit. */
  function setCategoryLimit(cat, raw) {
    const value = raw === "" ? null : Number(raw)
    patch((d) => {
      const budget = (d.finance.budget ??= { categories: {} })
      budget.categories ??= {}
      budget.categories[cat] = Number.isFinite(value) ? Math.max(0, value) : null
    })
  }

  /* group the month's transactions newest-first */
  const grouped = useMemo(() => {
    const list = txs
      .filter((t) => t.date.startsWith(month))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    const map = []
    for (const t of list) {
      let g = map.find((x) => x.date === t.date)
      if (!g) map.push((g = { date: t.date, items: [] }))
      g.items.push(t)
    }
    return map
  }, [txs, month])

  function submit(e) {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!form.title.trim() || !Number.isFinite(amount) || amount <= 0) return
    patch((d) => {
      d.finance.transactions.push({
        id: uid("tx"),
        date: form.date,
        title: form.title.trim(),
        category: form.category,
        amount: Math.round(amount * 100) / 100,
      })
    })
    setForm((f) => ({ ...f, title: "", amount: "" }))
  }

  return (
    <div>
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Finance</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Log spending in seconds — totals and charts update instantly.</p>
        </div>
      </header>

      {/* Summary cards */}
      <div className="mb-6 grid gap-6 md:grid-cols-3">
        <div className="card flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E9D5FF] text-[#6B21A8]" aria-hidden="true">
            <CalendarDays className="h-6 w-6" strokeWidth={2.2} />
          </span>
          <div>
            <p className="section-title">Spent today</p>
            <p className="text-2xl font-extrabold tracking-tight text-slate-900">{fmtMoney(todayTotal)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#DCFCE7] text-[#166534]" aria-hidden="true">
            <Wallet className="h-6 w-6" strokeWidth={2.2} />
          </span>
          <div>
            <p className="section-title">This month</p>
            <p className="text-2xl font-extrabold tracking-tight text-slate-900">{fmtMoney(monthTotal)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500" aria-hidden="true">
            <Receipt className="h-6 w-6" strokeWidth={2.2} />
          </span>
          <div>
            <p className="section-title">Transactions logged</p>
            <p className="text-2xl font-extrabold tracking-tight text-slate-900">{txs.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        {/* Quick entry */}
        <form className="card h-fit xl:col-span-2" onSubmit={submit} aria-label="Add transaction">
          <h2 className="mb-4 section-title">Quick entry</h2>

          <label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="tx-title">Title</label>
          <input
            id="tx-title"
            className="input mb-4"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Groceries"
            required
          />

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="tx-date">Date</label>
              <input id="tx-date" type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="tx-amount">Amount</label>
              <input
                id="tx-amount"
                type="number"
                min="0.01"
                step="0.01"
                className="input"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <fieldset className="mb-5">
            <legend className="mb-1.5 text-xs font-bold text-slate-600">Category</legend>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Category">
              {CATEGORIES.map((c) => {
                const active = form.category === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setForm({ ...form, category: c.id })}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violet-500 ${
                      active ? `${c.tint} border-current` : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <c.icon className="h-3.5 w-3.5" aria-hidden="true" /> {c.id}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <button type="submit" className="btn-primary w-full">
            <Plus className="h-4 w-4" aria-hidden="true" /> Log transaction
          </button>
        </form>

        {/* Breakdown + list */}
        <div className="grid gap-6 xl:col-span-3">
          <section className="card" aria-label="Category breakdown">
            <div className="grid items-center gap-4 md:grid-cols-2">
              <div className="h-56" role="img" aria-label={`Spending by category for this month, total ${fmtMoney(pieTotal)}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="86%" paddingAngle={3} cornerRadius={6} strokeWidth={0} isAnimationActive={false}>
                      {byCategory.map((c) => (
                        <Cell key={c.name} fill={c.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, name) => [fmtMoney(v), name]}
                      contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2.5" aria-label="Category totals">
                {byCategory.map((c) => {
                  const share = pieTotal ? Math.round((c.value / pieTotal) * 100) : 0
                  return (
                    <li key={c.name} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2 font-semibold text-slate-700">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} aria-hidden="true" />
                        {c.name}
                      </span>
                      <span className="font-bold tabular-nums text-slate-600">
                        {fmtMoney(c.value)}
                        <span className="ml-1.5 text-xs font-semibold text-slate-400">{share}%</span>
                      </span>
                    </li>
                  )
                })}
                <li className="border-t border-slate-100 pt-2.5 text-sm">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total</span>
                    <span className="font-extrabold tabular-nums text-slate-800">{fmtMoney(pieTotal)}</span>
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* Budget limits */}
          <section className="card" aria-label="Monthly budgets">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="section-title">Budget limits</h2>
              <p className="text-[11px] font-medium text-slate-400">Leave empty for no limit</p>
            </div>

            {/* Overall */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-slate-700">Everything</span>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="input !h-8 w-20 !px-2 text-right"
                    value={data.finance?.budget?.monthly ?? ""}
                    onChange={(e) => setMonthlyLimit(e.target.value)}
                    aria-label="Overall monthly budget limit"
                    placeholder="—"
                  />
                  / mo
                </label>
              </div>
              <BudgetBar spent={pieTotal} limit={data.finance?.budget?.monthly ?? null} />
            </div>

            {/* Per category */}
            <ul className="mt-3 space-y-2">
              {byCategory.map((c) => {
                const meta = CATEGORIES.find((x) => x.id === c.name)
                const limit = data.finance?.budget?.categories?.[c.name] ?? null
                return (
                  <li key={c.name} className="rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} aria-hidden="true" />
                        {c.name}
                      </span>
                      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          className="input !h-7 w-20 !px-2 text-right"
                          value={limit ?? ""}
                          onChange={(e) => setCategoryLimit(c.name, e.target.value)}
                          aria-label={`${c.name} monthly budget limit`}
                          placeholder="—"
                        />
                        / mo
                      </label>
                    </div>
                    <BudgetBar spent={c.value} limit={limit} barColor={meta?.color} />
                  </li>
                )
              })}
            </ul>
          </section>

          {/* Transaction list */}
          <section className="card" aria-label="Transaction history">
            <h2 className="mb-4 section-title">This month's log</h2>
            {grouped.length === 0 ? (
              <p className="py-8 text-center text-sm font-medium text-slate-400">No transactions yet — log the first one.</p>
            ) : (
              <div className="space-y-5">
                {grouped.map((g) => (
                  <div key={g.date}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <h3 className={`text-xs font-bold ${g.date === todayKey ? "text-violet-700" : "text-slate-500"}`}>
                        {g.date === todayKey ? "Today" : fmtDayShort(g.date)}
                      </h3>
                      <span className="text-xs font-bold tabular-nums text-slate-400">{fmtMoney(sum(g.items))}</span>
                    </div>
                    <ul className="overflow-hidden rounded-2xl border border-slate-100">
                      {g.items.map((t) => {
                        const meta = catMeta(t.category)
                        return (
                          <li key={t.id} className="flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-2.5 last:border-b-0 dark:bg-slate-800/40">
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${meta.tint}`} aria-hidden="true">
                              <meta.icon className="h-4 w-4" strokeWidth={2.2} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-slate-800">{t.title}</span>
                              <span className="text-[11px] font-medium text-slate-400">{t.category}</span>
                            </span>
                            <span className="text-sm font-bold tabular-nums text-slate-700">{fmtMoney(t.amount)}</span>
                            <button
                              type="button"
                              onClick={() =>
                                patch((d) => {
                                  d.finance.transactions = d.finance.transactions.filter((x) => x.id !== t.id)
                                })
                              }
                              aria-label={`Delete ${t.title}`}
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 focus-visible:outline-2 focus-visible:outline-violet-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function sum(list) {
  return Math.round(list.reduce((a, t) => a + t.amount, 0) * 100) / 100
}

/** Progress bar for spend vs. limit; turns amber at 80% and rose at 100%. */
function BudgetBar({ spent, limit, barColor }) {
  const pctUsed = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0
  const over = limit != null && limit > 0 && spent >= limit
  const warn = !over && limit != null && limit > 0 && spent >= limit * 0.8
  const color = over ? "#F43F5E" : warn ? "#F59E0B" : barColor || "#8B5CF6"
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pctUsed}%`, backgroundColor: color }}
        />
      </div>
      <span className={`w-24 text-right text-[11px] font-bold tabular-nums ${over ? "text-rose-600" : "text-slate-500"}`}>
        {limit != null && limit > 0
          ? `${fmtMoney(Math.round(spent * 100) / 100)} / ${fmtMoney(limit)}`
          : fmtMoney(Math.round(spent * 100) / 100)}
        {over ? " over" : ""}
      </span>
    </div>
  )
}
