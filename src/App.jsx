import { useCallback, useEffect, useRef, useState } from "react"
import Sidebar, { MobileBar } from "./components/Sidebar"
import QuickAdd from "./components/QuickAdd"
import UndoToast from "./components/Toast"
import { usePersistentState, patchState } from "./lib/storage"
import { buildSeedData } from "./lib/seed"
import { PRESETS } from "./lib/theme"
import { ACCENT_STORAGE_KEY, accentOrDefault } from "./lib/accents"
import { computeTimes } from "./lib/namaz"
import { dateKey, uid } from "./lib/utils"
import Today from "./pages/Today"
import Scheduler from "./pages/Scheduler"
import Daily from "./pages/Daily"
import Analytics from "./pages/Analytics"
import Goals from "./pages/Goals"
import Finance from "./pages/Finance"
import Notes from "./pages/Notes"

const STORAGE_KEY = "lifepulse-data-v1"
const THEME_KEY = "lifepulse-theme-v1"

const QUICK_TX_CATEGORIES = ["Food", "Tech", "Utilities", "Travel", "Misc"]

export default function App() {
  const [page, setPage] = useState("today")
  const [data, setData] = usePersistentState(STORAGE_KEY, buildSeedData)
  const [todayKey, setTodayKey] = useState(() => dateKey(new Date()))
  const [theme, setTheme] = usePersistentState(THEME_KEY, () =>
    window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  )
  const [accent, setAccent] = usePersistentState(ACCENT_STORAGE_KEY, () => "violet")
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [undoes, setUndoes] = useState([])
  const undoTimers = useRef({})
  const dataRef = useRef(data)

  useEffect(() => {
    dataRef.current = data
  }, [data])

  const isDark = theme === "dark"

  // Reflect the theme on <html> so Tailwind's class-based dark variant engages.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  // Reflect the accent choice: one attribute re-tints the whole app via CSS vars.
  useEffect(() => {
    document.documentElement.dataset.accent = accentOrDefault(accent)
  }, [accent])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"))
  }, [setTheme])

  /**
   * Auto-fill: when a new day is detected (midnight roll-over or first open of
   * a day) and that day's schedule is still empty, seed it with the user's
   * routine presets. Guarded so it never overwrites existing planning.
   */
  const lastAutoFilled = useRef(null)
  useEffect(() => {
    if (lastAutoFilled.current === todayKey) return
    lastAutoFilled.current = todayKey
    if (!data.routines?.enabled) return
    if ((data.scheduler?.[todayKey] ?? []).length > 0) return
    patchState(setData, (d) => {
      if (!d.routines?.enabled) return
      if ((d.scheduler[todayKey] ?? []).length > 0) return
      d.scheduler[todayKey] = PRESETS.map((p) => ({
        id: uid("sb"),
        presetId: p.id,
        title: p.title,
        cat: p.cat,
        start: p.start,
        dur: p.dur,
        status: "pending",
      }))
    })
  }, [todayKey, data.routines, data.scheduler, setData])

  // Keep "today" accurate even when the app stays open across midnight:
  // re-check every 30s and whenever the tab becomes visible again.
  useEffect(() => {
    const tick = () => {
      const next = dateKey(new Date())
      setTodayKey((prev) => (prev === next ? prev : next))
    }
    const id = window.setInterval(tick, 30_000)
    document.addEventListener("visibilitychange", tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener("visibilitychange", tick)
    }
  }, [])

  const patch = useCallback(
    (mutator) => patchState(setData, mutator),
    [setData],
  )

  /* ---------------- Undo system ---------------- */

  const dismissUndo = useCallback((id) => {
    setUndoes((s) => s.filter((u) => u.id !== id))
    window.clearTimeout(undoTimers.current[id])
    delete undoTimers.current[id]
  }, [])

  /** Apply a mutator with an "Undo" toast: restores the previous snapshot. */
  const undoable = useCallback(
    (mutator, label) => {
      const prev = dataRef.current
      if (!prev) return
      const next = structuredClone(prev)
      mutator(next)
      setData(next)
      const id = uid("u")
      setUndoes((s) => [...s.slice(-2), { id, label, prev }])
      window.clearTimeout(undoTimers.current[id])
      undoTimers.current[id] = window.setTimeout(() => dismissUndo(id), 6000)
    },
    [setData, dismissUndo],
  )

  const performUndo = useCallback(
    (id) => {
      const u = undoes.find((x) => x.id === id)
      if (u?.prev) setData(u.prev)
      dismissUndo(id)
    },
    [undoes, setData, dismissUndo],
  )

  /* ---------------- Quick add (Ctrl/⌘ + K) ---------------- */

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault()
        setQuickAddOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const handleQuickAdd = useCallback(
    ({ type, title, amount, category, dir, todayKey: key }) => {
      if (type === "task") {
        const now = new Date()
        const start = now.getHours() + Math.ceil(now.getMinutes() / 30) / 2
        patch((d) => {
          const arr = (d.scheduler[key] ??= [])
          arr.push({
            id: uid("sb"),
            title,
            cat: "Other",
            start: Math.min(23.5, Math.round(start * 2) / 2),
            dur: 0.5,
            priority: null,
            status: "pending",
          })
          arr.sort((a, b) => a.start - b.start)
        })
      } else if (type === "note") {
        patch((d) => {
          d.notes.push({ id: uid("n"), title, body: "", tags: [], updatedAt: Date.now() })
        })
        setPage("notes")
      } else if (type === "transaction") {
        patch((d) => {
          d.finance.transactions.push({
            id: uid("tx"),
            date: key,
            title,
            category: QUICK_TX_CATEGORIES.includes(category) ? category : "Misc",
            amount,
          })
        })
      } else if (type === "ledger") {
        patch((d) => {
          ;(d.ledger ??= []).push({
            id: uid("ld"),
            name: title,
            amount,
            dir: dir === "borrowed" ? "borrowed" : "lent",
            note: "",
            date: key,
            settled: null,
          })
        })
        setPage("finance")
      }
    },
    [patch],
  )

  /* ---------------- Backup / restore ---------------- */

  /** Download the whole store as a JSON backup file. */
  const onExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `lifepulse-backup-${dateKey(new Date())}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }, [data])

  /** Restore the store from a backup JSON file. */
  const onImport = useCallback(async (file) => {
    try {
      const next = JSON.parse(await file.text())
      const required = ["scheduler", "daily", "goals", "finance", "notes"]
      if (!next || typeof next !== "object" || required.some((k) => !(k in next))) {
        throw new Error("this file is not a LifePulse backup")
      }
      patchState(setData, (d) => Object.assign(d, next))
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err?.message || "could not read the file" }
    }
  }, [setData])

  function reset() {
    if (window.confirm("Reset all LifePulse data to the 30-day demo dataset? This cannot be undone.")) {
      try {
        window.localStorage.removeItem(STORAGE_KEY)
      } catch {
        /* ignore */
      }
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <ReminderEngine data={data} todayKey={todayKey} />
      <PrayerAlertEngine data={data} todayKey={todayKey} />
      <Sidebar
        page={page}
        onNavigate={setPage}
        onReset={reset}
        onExport={onExport}
        onImport={onImport}
        theme={theme}
        onToggleTheme={toggleTheme}
        accent={accentOrDefault(accent)}
        onAccent={setAccent}
        onQuickAdd={() => setQuickAddOpen(true)}
      />
      <MobileBar
        page={page}
        onNavigate={setPage}
        theme={theme}
        onToggleTheme={toggleTheme}
        accent={accentOrDefault(accent)}
        onAccent={setAccent}
        onQuickAdd={() => setQuickAddOpen(true)}
        onExport={onExport}
        onImport={onImport}
        onReset={reset}
      />

      {/* Mobile floating quick-add button */}
      <button
        type="button"
        onClick={() => setQuickAddOpen(true)}
        aria-label="Quick add"
        className="fixed right-4 bottom-20 z-50 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-soft transition active:scale-95 md:hidden"
        style={{ backgroundColor: "var(--color-violet-600)" }}
      >
        <span className="text-2xl leading-none" aria-hidden="true">+</span>
      </button>

      <main className="min-h-screen md:pl-64" id="main">
        <div className="mx-auto max-w-6xl px-5 pt-10 pb-28 sm:px-8 md:pb-16" key={page}>
          {page === "today" && <Today data={data} patch={patch} todayKey={todayKey} onNavigate={setPage} />}
          {page === "scheduler" && <Scheduler data={data} patch={patch} todayKey={todayKey} undoable={undoable} />}
          {page === "daily" && <Daily data={data} patch={patch} todayKey={todayKey} />}
          {page === "analytics" && <Analytics data={data} todayKey={todayKey} isDark={isDark} />}
          {page === "goals" && <Goals data={data} patch={patch} todayKey={todayKey} undoable={undoable} />}
          {page === "finance" && <Finance data={data} patch={patch} todayKey={todayKey} undoable={undoable} />}
          {page === "notes" && <Notes data={data} patch={patch} undoable={undoable} />}
        </div>
      </main>

      {quickAddOpen ? (
        <QuickAdd
          onClose={() => setQuickAddOpen(false)}
          todayKey={todayKey}
          onSubmit={handleQuickAdd}
        />
      ) : null}
      <UndoToast items={undoes} onUndo={performUndo} onDismiss={dismissUndo} />
    </div>
  )
}

/**
 * Fires one browser notification per pending schedule block as its time
 * window starts, only while the user has reminders (and permission) on.
 * Renders nothing — it is engine wiring mounted from App.
 */
function ReminderEngine({ data, todayKey }) {
  const notified = useRef(new Set())

  // New day → allow everyone to be reminded again.
  useEffect(() => {
    notified.current = new Set()
  }, [todayKey])

  useEffect(() => {
    if (data.settings?.reminders !== true) return
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return
    const id = window.setInterval(() => {
      const now = new Date()
      const nowHour = now.getHours() + now.getMinutes() / 60
      for (const b of data.scheduler?.[todayKey] ?? []) {
        if (b.status !== "pending") continue
        if (notified.current.has(b.id)) continue
        if (nowHour >= b.start && nowHour < b.start + 3 / 60) {
          notified.current.add(b.id)
          try {
            new Notification("LifePulse", {
              body: `Time for ${b.title} (${fmtWindow(b)})`,
              tag: b.id,
            })
          } catch {
            /* notification failures are non-fatal */
          }
        }
      }
    }, 20_000)
    return () => window.clearInterval(id)
  }, [data, todayKey])

  return null
}

/**
 * Notifies 10 minutes before each prayer, using the calculated times from
 * the Namaz settings. Works while any LifePulse window/tab is open.
 */
function PrayerAlertEngine({ data, todayKey }) {
  const fired = useRef(new Set())

  // New day → prayer alerts can fire again.
  useEffect(() => {
    fired.current = new Set()
  }, [todayKey])

  useEffect(() => {
    if (data.settings?.prayerAlerts !== true) return
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return
    const settings = data.namaz
    if (typeof settings?.lat !== "number" || typeof settings?.lon !== "number") return

    const id = window.setInterval(() => {
      const times = computeTimes(new Date(), settings)
      const now = Date.now()
      for (const p of times) {
        if (!p.time) continue
        const t = p.time.getTime()
        const dayTag = `${p.id}-${new Date(t).toDateString()}`
        if (fired.current.has(dayTag)) continue
        if (now >= t - 10 * 60_000 && now < t + 60_000) {
          fired.current.add(dayTag)
          try {
            new Notification("LifePulse · Namaz", {
              body: `${p.label} at ${p.label12} — in ~${Math.max(1, Math.round((t - now) / 60_000))} min`,
              tag: dayTag,
            })
          } catch {
            /* notification failures are non-fatal */
          }
        }
      }
    }, 15_000)
    return () => window.clearInterval(id)
  }, [data.settings?.prayerAlerts, data.namaz])

  return null
}

/** "05:00 – 06:30" style helper mirroring the scheduler's time format. */
function fmtWindow(block) {
  const h = Math.floor(block.start)
  const m = Math.round((block.start - h) * 60)
  return `${String(h % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}
