import { useState } from "react"
import { Check, Flag, Plus, Target, Trash2 } from "lucide-react"
import { pctOf, uid, fmtDayShort, addDays, keyToDate } from "../lib/utils"
import { bandFor, priorityOf } from "../lib/theme"
import { Badge, EmptyState, PageHeader, ProgressBar } from "../components/ui"

const DAY_MS = 86400000

const TABS = [
  { id: "daily", label: "Daily Goals", hint: "Checked off every night" },
  { id: "small", label: "Small Goals", hint: "Weekly / sprint scope" },
  { id: "large", label: "Large Goals", hint: "Monthly / quarterly missions" },
]

export default function Goals({ data, patch, todayKey }) {
  const [tab, setTab] = useState("daily")
  const { daily, small, large } = data.goals

  function addGoal(list, title) {
    if (!title.trim()) return
    patch((d) => {
      const g = { id: uid("g"), title: title.trim(), done: false }
      if (list === "small") g.due = addDays(todayKey, 3)
      d.goals[list].push(g)
    })
  }

  /** Cycle a goal's priority: unset → P1 → P2 → P3 → P4 → unset. */
  function cyclePriority(list, id) {
    patch((d) => {
      const g = d.goals[list].find((x) => x.id === id)
      if (!g) return
      g.priority = g.priority == null ? 1 : g.priority >= 4 ? null : g.priority + 1
    })
  }

  function toggle(list, id) {
    patch((d) => {
      const g = d.goals[list].find((x) => x.id === id)
      if (g) g.done = !g.done
    })
  }

  function remove(list, id) {
    patch((d) => {
      d.goals[list] = d.goals[list].filter((x) => x.id !== id)
    })
  }

  function toggleMilestone(goalId, milestoneId) {
    patch((d) => {
      const g = d.goals.large.find((x) => x.id === goalId)
      const m = g?.milestones.find((x) => x.id === milestoneId)
      if (m) m.done = !m.done
    })
  }

  function addMilestone(goalId, title) {
    if (!title.trim()) return
    patch((d) => {
      const g = d.goals.large.find((x) => x.id === goalId)
      g?.milestones.push({ id: uid("m"), title: title.trim(), done: false })
    })
  }

  function removeMilestone(goalId, milestoneId) {
    patch((d) => {
      const g = d.goals.large.find((x) => x.id === goalId)
      if (g) g.milestones = g.milestones.filter((m) => m.id !== milestoneId)
    })
  }

  return (
    <div>
      <PageHeader title="Goals" subtitle="Daily intentions, weekly sprints and the big missions they ladder up to." />

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Goal horizons">
        {TABS.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`rounded-2xl border px-4 py-2.5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 ${
                active
                  ? "border-violet-200 bg-violet-50 text-violet-700 shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              <span className="block text-sm font-bold">{t.label}</span>
              <span className="block text-[11px] font-medium text-slate-400">{t.hint}</span>
            </button>
          )
        })}
      </div>

      {tab === "daily" && (
        <section className="card" aria-label="Daily goals">
          <GoalInput placeholder="Add a daily goal…" onAdd={(t) => addGoal("daily", t)} />
          <div className="mt-2">
            {daily.length === 0 ? (
              <EmptyState icon={Target} title="No daily goals yet" hint="Small daily wins compound into big outcomes." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {[...daily].sort((a, b) => (a.priority ?? 9) - (b.priority ?? 9)).map((g) => (
                  <li key={g.id} className="flex items-center gap-3 py-2.5">
                    <CheckRow done={g.done} onToggle={() => toggle("daily", g.id)} label={g.title} />
                    <PriorityChip level={g.priority} onCycle={() => cyclePriority("daily", g.id)} />
                    <DelButton onClick={() => remove("daily", g.id)} label={`Delete ${g.title}`} />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="mt-3 text-xs font-medium text-slate-400">
            {daily.filter((g) => g.done).length}/{daily.length} done — these reset by mindset, not by the app. Be honest with yourself.
          </p>
        </section>
      )}

      {tab === "small" && (
        <section className="card" aria-label="Small goals">
          <SmallGoalInput onAdd={(t) => addGoal("small", t)} />
          <div className="mt-4">
            {small.length === 0 ? (
              <EmptyState icon={Target} title="Sprint board is empty" hint="Add a goal scoped to this week or a short sprint." />
            ) : (
              <ul className="grid gap-3 md:grid-cols-2">
                {small.map((g) => {
                  const overdue = !g.done && g.due && g.due < todayKey
                  const overdueDays = overdue
                    ? Math.round((keyToDate(todayKey) - keyToDate(g.due)) / DAY_MS)
                    : 0
                  return (
                    <li
                      key={g.id}
                      className={`flex items-center justify-between gap-3 rounded-2xl border p-4 transition ${
                        overdue
                          ? "border-rose-200 bg-rose-50/70 dark:border-rose-900/60 dark:bg-rose-500/10"
                          : g.done
                            ? "border-transparent bg-[#F0FDF4]"
                            : "border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-800/50"
                      }`}
                    >
                      <CheckRow
                        done={g.done}
                        onToggle={() => toggle("small", g.id)}
                        label={g.title}
                        sub={g.due ? (overdue ? `Was due ${fmtDayShort(g.due)}` : `Due ${fmtDayShort(g.due)}`) : null}
                      />
                      {overdue ? (
                        <span className="shrink-0 rounded-full bg-[#FEE2E2] px-2.5 py-1 text-[10px] font-bold text-[#991B1B] dark:bg-rose-500/15 dark:text-rose-300">
                          {overdueDays} day{overdueDays === 1 ? "" : "s"} overdue
                        </span>
                      ) : null}
                      <DelButton onClick={() => remove("small", g.id)} label={`Delete ${g.title}`} />
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      )}

      {tab === "large" && (
        <div className="grid gap-6">
          {large.map((g) => {
            const doneCount = g.milestones.filter((m) => m.done).length
            const pct = pctOf(doneCount, g.milestones.length)
            const band = bandFor(pct)
            return (
              <section key={g.id} className="card" aria-label={`Large goal: ${g.title}`}>
                <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="mb-2 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {g.timeframe}
                    </span>
                    <h2 className="text-lg font-extrabold tracking-tight text-slate-900">{g.title}</h2>
                    <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500">{g.description}</p>
                  </div>
                  <Badge pct={pct} showLabel />
                </div>

                {/* Animated progress bar */}
                <div className="my-5">
                  <ProgressBar pct={pct} />
                  <p className={`mt-2 text-xs font-bold ${band.text}`}>
                    {doneCount} of {g.milestones.length} milestones · {pct}%
                  </p>
                </div>

                <ul className="space-y-2" aria-label={`${g.title} milestones`}>
                  {g.milestones.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 rounded-xl border border-slate-100 px-3.5 py-2.5">
                      <CheckRow done={m.done} onToggle={() => toggleMilestone(g.id, m.id)} label={m.title} />
                      <DelButton onClick={() => removeMilestone(g.id, m.id)} label={`Remove milestone ${m.title}`} small />
                    </li>
                  ))}
                </ul>
                <div className="mt-3">
                  <MilestoneInput onAdd={(t) => addMilestone(g.id, t)} />
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ---------------------- building blocks ---------------------- */

function CheckRow({ done, onToggle, label, sub }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={done}
      className="group flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
          done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white text-transparent group-hover:border-violet-400"
        }`}
        aria-hidden="true"
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
      </span>
      <span className="min-w-0">
        <span className={`block truncate text-sm font-semibold ${done ? "text-slate-400 line-through" : "text-slate-800"}`}>{label}</span>
        {sub ? <span className="block text-[11px] font-medium text-slate-400">{sub}</span> : null}
      </span>
    </button>
  )
}

/** Cycle chip displaying a goal's current priority; cycles P1..P4 → unset. */
function PriorityChip({ level, onCycle }) {
  const pr = priorityOf(level)
  return (
    <button
      type="button"
      onClick={onCycle}
      aria-label={pr ? `Priority ${pr.label} — click to cycle` : "No priority set — click to set P1"}
      className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold transition focus-visible:outline-2 focus-visible:outline-violet-500 ${
        pr ? pr.chip : "border-slate-100 text-slate-300 hover:border-violet-200 hover:text-violet-600 dark:border-slate-700 dark:text-slate-500"
      }`}
    >
      <Flag className="h-3 w-3" strokeWidth={2.4} aria-hidden="true" />
      {pr ? pr.label : "P"}
    </button>
  )
}

function DelButton({ onClick, label, small }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 focus-visible:outline-2 focus-visible:outline-violet-500 ${small ? "h-7 w-7" : "h-8 w-8"}`}
    >
      <Trash2 className={small ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden="true" />
    </button>
  )
}

function GoalInput({ onAdd, placeholder }) {
  const [v, setV] = useState("")
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        onAdd(v)
        setV("")
      }}
    >
      <input
        className="input flex-1"
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      <button type="submit" className="btn-primary shrink-0">
        <Plus className="h-4 w-4" aria-hidden="true" /> Add
      </button>
    </form>
  )
}

function SmallGoalInput({ onAdd }) {
  return <GoalInput onAdd={onAdd} placeholder="Add a weekly / sprint goal…" />
}

function MilestoneInput({ onAdd }) {
  return <GoalInput onAdd={onAdd} placeholder="Add a milestone…" />
}

