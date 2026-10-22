import { useCallback, useEffect, useRef, useState } from "react"
import Sidebar, { MobileBar } from "./components/Sidebar"
import { usePersistentState, patchState } from "./lib/storage"
import { buildSeedData } from "./lib/seed"
import { PRESETS } from "./lib/theme"
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

export default function App() {
  const [page, setPage] = useState("today")
  const [data, setData] = usePersistentState(STORAGE_KEY, buildSeedData)
  const [todayKey, setTodayKey] = useState(() => dateKey(new Date()))
  const [theme, setTheme] = usePersistentState(THEME_KEY, () =>
    window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  )

  const isDark = theme === "dark"

  // Reflect the theme on <html> so Tailwind's class-based dark variant engages.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

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
      <Sidebar
        page={page}
        onNavigate={setPage}
        onReset={reset}
        onExport={onExport}
        onImport={onImport}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <MobileBar page={page} onNavigate={setPage} />

      <main className="min-h-screen md:pl-64" id="main">
        <div className="mx-auto max-w-6xl px-5 pt-10 pb-28 sm:px-8 md:pb-16" key={page}>
          {page === "today" && <Today data={data} patch={patch} todayKey={todayKey} onNavigate={setPage} />}
          {page === "scheduler" && <Scheduler data={data} patch={patch} todayKey={todayKey} />}
          {page === "daily" && <Daily data={data} patch={patch} todayKey={todayKey} />}
          {page === "analytics" && <Analytics data={data} todayKey={todayKey} isDark={isDark} />}
          {page === "goals" && <Goals data={data} patch={patch} todayKey={todayKey} />}
          {page === "finance" && <Finance data={data} patch={patch} todayKey={todayKey} />}
          {page === "notes" && <Notes data={data} patch={patch} />}
        </div>
      </main>
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

/** "05:00 – 06:30" style helper mirroring the scheduler's time format. */
function fmtWindow(block) {
  const h = Math.floor(block.start)
  const m = Math.round((block.start - h) * 60)
  return `${String(h % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}
