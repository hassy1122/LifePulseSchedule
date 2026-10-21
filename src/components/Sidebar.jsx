import { useRef, useState } from "react"
import {
  CalendarCheck,
  CalendarClock,
  ChartColumn,
  HeartPulse,
  Moon,
  StickyNote,
  Sun,
  Target,
  Wallet,
} from "lucide-react"

const NAV = [
  { id: "today", label: "Today", icon: Sun, hint: "Everything at a glance" },
  { id: "scheduler", label: "Scheduler", icon: CalendarClock, hint: "24-hour routine planner" },
  { id: "daily", label: "Daily Sheet", icon: CalendarCheck, hint: "Habit checklist" },
  { id: "analytics", label: "Analytics", icon: ChartColumn, hint: "Monthly trends" },
  { id: "goals", label: "Goals", icon: Target, hint: "Daily, small & large" },
  { id: "finance", label: "Finance", icon: Wallet, hint: "Expense tracker" },
  { id: "notes", label: "Notes", icon: StickyNote, hint: "Markdown workspace" },
]

export default function Sidebar({ page, onNavigate, onReset, onExport, onImport, theme, onToggleTheme }) {
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

/** Compact top bar variant used on small screens. */
export function MobileBar({ page, onNavigate }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white/95 backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-900/95"
      role="navigation"
      aria-label="Primary navigation"
    >
      {NAV.map(({ id, label, icon: Icon }) => {
        const active = page === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(id)}
            aria-current={active ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-violet-500 ${
              active ? "text-violet-700 dark:text-violet-300" : "text-slate-400"
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
            {label.split(" ")[0]}
          </button>
        )
      })}
    </div>
  )
}
