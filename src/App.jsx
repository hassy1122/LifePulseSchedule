import { useCallback, useEffect, useState } from "react"
import Sidebar, { MobileBar } from "./components/Sidebar"
import { usePersistentState, patchState } from "./lib/storage"
import { buildSeedData } from "./lib/seed"
import { dateKey } from "./lib/utils"
import Today from "./pages/Today"
import Scheduler from "./pages/Scheduler"
import Daily from "./pages/Daily"
import Analytics from "./pages/Analytics"
import Goals from "./pages/Goals"
import Finance from "./pages/Finance"
import Notes from "./pages/Notes"

const STORAGE_KEY = "lifepulse-data-v1"

export default function App() {
  const [page, setPage] = useState("today")
  const [data, setData] = usePersistentState(STORAGE_KEY, buildSeedData)
  const [todayKey, setTodayKey] = useState(() => dateKey(new Date()))

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
    <div className="min-h-screen bg-slate-100">
      <Sidebar page={page} onNavigate={setPage} onReset={reset} onExport={onExport} onImport={onImport} />
      <MobileBar page={page} onNavigate={setPage} />

      <main className="min-h-screen md:pl-64" id="main">
        <div className="mx-auto max-w-6xl px-5 pt-10 pb-28 sm:px-8 md:pb-16" key={page}>
          {page === "today" && <Today data={data} todayKey={todayKey} onNavigate={setPage} />}          {page === "scheduler" && <Scheduler data={data} patch={patch} todayKey={todayKey} />}
          {page === "daily" && <Daily data={data} patch={patch} todayKey={todayKey} />}
          {page === "analytics" && <Analytics data={data} todayKey={todayKey} />}
          {page === "goals" && <Goals data={data} patch={patch} />}
          {page === "finance" && <Finance data={data} patch={patch} todayKey={todayKey} />}
          {page === "notes" && <Notes data={data} patch={patch} />}
        </div>
      </main>
    </div>
  )
}
