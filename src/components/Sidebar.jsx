import { useRef, useState } from "react"
import {
  CalendarCheck,
  CalendarClock,
  ChartColumn,
  HeartPulse,
  LayoutGrid,
  Moon,
  StickyNote,
  Sun,
  Target,
  Zap,
  Wallet,
} from "lucide-react"
import { ACCENTS } from "../lib/accents"

const NAV = [
  { id: "today", label: "Today", icon: Sun, hint: "Everything at a glance" },
  { id: "scheduler", label: "Scheduler", icon: CalendarClock, hint: "24-hour routine planner" },
  { id: "daily", label: "Daily Sheet", icon: CalendarCheck, hint: "Habit checklist" },
  { id: "analytics", label: "Analytics", icon: ChartColumn, hint: "Monthly trends" },
  { id: "goals", label: "Goals", icon: Target, hint: "Daily, small & large" },
  { id: "finance", label: "Finance", icon: Wallet, hint: "Expense tracker" },
  { id: "notes", label: "Notes", icon: StickyNote, hint: "Markdown workspace" },
]

export default function Sidebar({ page, onNavigate, onReset, onExport, onImport, theme, onToggleTheme, accent = "violet", onAccent, onQuickAdd }) {
  const [status, setStatus] = useState(null)
  const statusTimer = useRef(null)

  async function handleImport(e) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    const res = await onImport(file)
    setStatus(
      res.ok
        ? { ok: true, msg: "Backup restored — all your changes are back." }
        : { ok: false, msg: `Import failed: ${res.error}` },
    )
    window.clearTimeout(statusTimer.current)
    statusTimer.current = window.setTimeout(() => setStatus(null), 4500)
  }

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200/80 bg-white md:flex dark:border-slate-800 dark:bg-slate-900"
      aria-label="Primary navigation"
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 pt-7 pb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-soft" aria-hidden="true">
          <HeartPulse className="h-5 w-5 text-white" strokeWidth={2.4} />
        </div>
        <div>
          <p className="text-[17px] font-extrabold tracking-tight text-slate-900">LifePulse</p>
          <p className="text-xs font-medium text-slate-400">Daily dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-2 flex-1 space-y-1 px-3" aria-label="Modules">
        {NAV.map(({ id, label, icon: Icon, hint }) => {
          const active = page === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              aria-current={active ? "page" : undefined}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 ${
                active
                  ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                  active
                    ? "bg-violet-600 text-white dark:bg-violet-500"
                    : "bg-slate-100 text-slate-500 group-hover:bg-white dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight">{label}</span>
                <span className="block truncate text-[11px] font-medium text-slate-400">{hint}</span>
              </span>
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 p-4">
        <button
          type="button"
          onClick={onQuickAdd}
          className="mb-3 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-violet-300 hover:text-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
          title="Quick add from any page"
        >
          <span className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5" aria-hidden="true" /> Quick add
          </span>
          <kbd className="rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 dark:border-slate-600">
            Ctrl K
          </kbd>
        </button>
        <div className="flex items-center justify-between px-1">
          <p className="pr-2 text-[11px] font-medium text-slate-400">Saved in this browser</p>
          <button
            type="button"
            onClick={onToggleTheme}
            className="icon-btn !h-8 !w-8"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={theme === "dark"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
        {/* Accent color picker — sibling of the dark/light toggle */}
        <div className="mt-2.5 flex items-center justify-between px-1" role="group" aria-label="Accent color">
          <p className="text-[11px] font-medium text-slate-400">Accent</p>
          <div className="flex gap-1.5">
            {ACCENTS.map((a) => {
              const active = accent === a.id
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onAccent(a.id)}
                  aria-pressed={active}
                  aria-label={`${a.label} accent`}
                  title={a.label}
                  className={`h-5 w-5 rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 ${
                    active ? "ring-2 ring-slate-400 ring-offset-1 dark:ring-slate-300 dark:ring-offset-slate-900" : "opacity-70 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: a.dot }}
                />
              )
            })}
          </div>
        </div>
        <div className="mt-2 flex gap-1.5">
          <button
            type="button"
            onClick={onExport}
            aria-label="Download a backup file of all your data"
            className="btn-soft !h-8 flex-1 !px-2 text-[11px]"
          >
            Backup
          </button>
          <label
            className="btn-soft flex-1 cursor-pointer !h-8 !px-2 text-[11px]"
            title="Restore everything from a backup file"
          >
            <span aria-hidden="false">Restore</span>
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={handleImport}
              aria-label="Restore from a backup file"
            />
          </label>
        </div>
        {status ? (
          <p
            role="status"
            className={`mt-2 px-1 text-[11px] font-semibold ${status.ok ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
          >
            {status.msg}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onReset}
          className="mt-2 w-full rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
        >
          Reset demo data
        </button>
      </div>
    </aside>
  )
}

/** Compact top bar variant used on small screens.
 *  Three primary tabs + a "More" sheet holding everything else (and future
 *  modules), so nothing — including day/night, accents, quick add and backup —
 *  is unreachable on a phone. */
export function MobileBar({
  page,
  onNavigate,
  theme,
  onToggleTheme,
  accent = "violet",
  onAccent,
  onQuickAdd,
  onExport,
  onImport,
  onReset,
}) {
  const [moreOpen, setMoreOpen] = useState(false)
  const [status, setStatus] = useState(null)
  const statusTimer = useRef(null)

  const primary = ["today", "scheduler", "daily"]
  const primaryTabs = NAV.filter((n) => primary.includes(n.id))
  const moreTabs = NAV.filter((n) => !primary.includes(n.id))

  async function handleImport(e) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    const res = await onImport(file)
    setStatus(
      res.ok
        ? { ok: true, msg: "Backup restored ✓" }
        : { ok: false, msg: `Import failed: ${res.error}` },
    )
    window.clearTimeout(statusTimer.current)
    statusTimer.current = window.setTimeout(() => setStatus(null), 4000)
  }

  const go = (id) => {
    onNavigate(id)
    setMoreOpen(false)
  }

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white/95 backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-900/95"
        role="navigation"
        aria-label="Primary navigation"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {primaryTabs.map(({ id, label, icon: Icon }) => {
          const active = page === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-violet-500 ${
                active ? "text-violet-700 dark:text-violet-300" : "text-slate-400"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
              {label.split(" ")[0]}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-expanded={moreOpen}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-violet-500 ${
            moreOpen || moreTabs.some((n) => n.id === page) ? "text-violet-700 dark:text-violet-300" : "text-slate-400"
          }`}
        >
          <LayoutGrid className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
          More
        </button>
      </div>

      {/* More sheet */}
      {moreOpen ? (
        <>
          <div
            className="fixed inset-0 z-[60] bg-slate-950/45 backdrop-blur-[2px] md:hidden"
            aria-hidden="true"
            onClick={() => setMoreOpen(false)}
          />
          <div
            role="dialog"
            aria-label="More menu"
            className="fixed inset-x-0 bottom-0 z-[70] max-h-[82vh] overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white px-5 pb-8 pt-4 shadow-soft md:hidden dark:border-slate-800 dark:bg-slate-900"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
            <p className="section-title mb-2">Go to</p>
            <ul className="grid grid-cols-2 gap-2">
              {moreTabs.map(({ id, label, icon: Icon, hint }) => {
                const active = page === id
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => go(id)}
                      aria-current={active ? "page" : undefined}
                      className={`flex w-full flex-col items-start gap-1 rounded-2xl border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 ${
                        active
                          ? "border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-500/10"
                          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/50"
                      }`}
                    >
                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? "bg-violet-600 text-white dark:bg-violet-500" : "bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400"}`}>
                        <Icon className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                      </span>
                      <span className="text-sm font-bold text-slate-800">{label}</span>
                      <span className="text-[10px] font-medium text-slate-400">{hint}</span>
                    </button>
                  </li>
                )
              })}
            </ul>

            <p className="section-title mb-2 mt-5">Look</p>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
              <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                {theme === "dark" ? <Moon className="h-4 w-4 text-slate-400" aria-hidden="true" /> : <Sun className="h-4 w-4 text-amber-500" aria-hidden="true" />}
                {theme === "dark" ? "Night mode" : "Day mode"}
              </span>
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5" role="group" aria-label="Accent color">
                  {ACCENTS.map((a) => {
                    const active = accent === a.id
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => onAccent(a.id)}
                        aria-pressed={active}
                        aria-label={`${a.label} accent`}
                        className={`h-5 w-5 rounded-full transition ${active ? "ring-2 ring-slate-400 ring-offset-1 dark:ring-slate-300 dark:ring-offset-slate-900" : "opacity-70"}`}
                        style={{ backgroundColor: a.dot }}
                      />
                    )
                  })}
                </div>
                <button
                  type="button"
                  onClick={onToggleTheme}
                  aria-label={theme === "dark" ? "Switch to day mode" : "Switch to night mode"}
                  aria-pressed={theme === "dark"}
                  className="icon-btn !h-8 !w-8"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            <p className="section-title mb-2 mt-5">Actions</p>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => { onQuickAdd(); setMoreOpen(false) }} className="btn-soft !h-10 text-xs">
                <Zap className="h-4 w-4" aria-hidden="true" /> Quick add
              </button>
              <button type="button" onClick={onExport} className="btn-soft !h-10 text-xs">
                Backup
              </button>
              <label className="btn-soft flex h-10 cursor-pointer items-center justify-center text-xs">
                Restore
                <input type="file" accept="application/json,.json" className="sr-only" onChange={handleImport} aria-label="Restore from a backup file" />
              </label>
            </div>
            {status ? (
              <p role="status" className={`mt-2 text-center text-[11px] font-semibold ${status.ok ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {status.msg}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => { setMoreOpen(false); onReset() }}
              className="mt-3 w-full rounded-xl py-2 text-xs font-semibold text-slate-400 transition active:bg-rose-50 active:text-rose-600"
            >
              Reset demo data
            </button>
          </div>
        </>
      ) : null}
    </>
  )
}
