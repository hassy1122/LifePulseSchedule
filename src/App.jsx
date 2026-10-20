import { useCallback, useState } from "react"
import Sidebar, { MobileBar } from "./components/Sidebar"
import { usePersistentState, patchState } from "./lib/storage"
import { buildSeedData } from "./lib/seed"
import Scheduler from "./pages/Scheduler"
import Daily from "./pages/Daily"
import Analytics from "./pages/Analytics"
import Goals from "./pages/Goals"
import Finance from "./pages/Finance"
import Notes from "./pages/Notes"

const STORAGE_KEY = "lifepulse-data-v1"

export default function App() {
  const [page, setPage] = useState("scheduler")
  const [data, setData] = usePersistentState(STORAGE_KEY, buildSeedData)

  const patch = useCallback(
    (mutator) => patchState(setData, mutator),
    [setData],
  )

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
      <Sidebar page={page} onNavigate={setPage} onReset={reset} />
      <MobileBar page={page} onNavigate={setPage} />

      <main className="min-h-screen md:pl-64" id="main">
        <div className="mx-auto max-w-6xl px-5 pt-10 pb-28 sm:px-8 md:pb-16" key={page}>
          {page === "scheduler" && <Scheduler data={data} patch={patch} />}
          {page === "daily" && <Daily data={data} patch={patch} />}
          {page === "analytics" && <Analytics data={data} />}
          {page === "goals" && <Goals data={data} patch={patch} />}
          {page === "finance" && <Finance data={data} patch={patch} />}
          {page === "notes" && <Notes data={data} patch={patch} />}
        </div>
      </main>
    </div>
  )
}
