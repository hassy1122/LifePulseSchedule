import { useMemo } from "react"
import { Droplets, Dumbbell, Check, CodeXml, Moon, Footprints, Flame } from "lucide-react"
import { dailyDoneCount, dailyPct, trackerStreak, streakBadge, TRACKERS } from "../lib/seed"
import { bandFor } from "../lib/theme"
import { burstConfetti } from "../lib/confetti"
import { fmtDayLong } from "../lib/utils"
import { EmptyState, PageHeader, ProgressRing, Stepper } from "../components/ui"
import NamazCard from "../components/NamazCard"

const TRACKER_ICONS = {
  prayers: Moon,
  exercise: Dumbbell,
  walk: Footprints,
  coding: CodeXml,
  water: Droplets,
}

const TRACKER_TINTS = {
  prayers: "bg-violet-50 text-violet-600",
  exercise: "bg-emerald-50 text-emerald-600",
  walk: "bg-lime-50 text-lime-600",
  coding: "bg-sky-50 text-sky-600",
  water: "bg-cyan-50 text-cyan-600",
}

export default function Daily({ data, patch, todayKey }) {
  const entry = data.daily[todayKey]
  const done = dailyDoneCount(entry)
  const pct = dailyPct(entry)
  const band = bandFor(pct)

  /* 🔥 streaks + milestone badges per tracker, from the full history */
  const streaks = useMemo(
    () => Object.fromEntries(TRACKERS.map((t) => [t.id, trackerStreak(data.daily || {}, t, todayKey)])),
    [data.daily, todayKey],
  )

  function update(mutate) {
    // Project the change first — celebrate a fresh 100% 🎉
    const before = dailyPct(data.daily[todayKey])
    const probe = structuredClone(
      data.daily[todayKey] || { prayers: false, exercise: false, walk: false, coding: 0, water: 0 },
    )
    mutate(probe)
    const after = dailyPct(probe)
    if (after >= 100 && before < 100) burstConfetti()

    patch((d) => {
      if (!d.daily[todayKey]) d.daily[todayKey] = { prayers: false, exercise: false, walk: false, coding: 0, water: 0 }
      mutate(d.daily[todayKey])
    })
  }

  const rowStyle = (ok) =>
    `flex items-center justify-between gap-3 rounded-2xl border p-4 transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-violet-500 ${
      ok ? "border-transparent bg-[#F0FDF4]" : "border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-800/50"
    }`

  return (
    <div>
      <PageHeader
        title="Daily Sheet"
        subtitle="Five tracked habits, one honest number. Completion % updates in real time as you check items off."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Score card */}
        <section className="card flex flex-col items-center justify-center text-center" aria-labelledby="today-score">
          <h2 id="today-score" className="section-title self-start">Today's score</h2>
          <p className="self-start text-[11px] font-semibold text-slate-400" aria-label="Current date">
            {fmtDayLong(todayKey)}
          </p>
          <div className="my-5">
            <ProgressRing pct={pct} />
          </div>
          <p className={`rounded-full border px-4 py-1.5 text-xs font-bold ${band.bg} ${band.border} ${band.text}`}>
            {done}/{TRACKERS.length} completed · {" "}
            <span aria-label="completion formula">
              ({done} / {TRACKERS.length}) × 100 = {pct}
            </span>
          </p>
          <p className="mt-4 text-xs font-medium text-slate-400">
            {band.id === "perfect"
              ? "A flawless day. Keep the streak alive!"
              : band.id === "good"
                ? "Strong afternoon — close the remaining items."
                : "Pick the easiest item and get a win on the board."}
          </p>
        </section>

        {/* Checklist */}
        <section className="card lg:col-span-2" aria-labelledby="checklist-heading">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="checklist-heading" className="section-title">Checklist</h2>
            <span className="text-[11px] font-semibold text-slate-300">Tap items to toggle</span>
          </div>
          <ul className="space-y-3">
            {TRACKERS.map((t) => {
              const Icon = TRACKER_ICONS[t.id]
              const value = entry?.[t.id] ?? (t.kind === "toggle" ? false : 0)
              const ok = t.kind === "toggle" ? value : value >= t.target
              return (
                <li key={t.id} className={rowStyle(ok)}>
                  <div className="flex items-center gap-3.5">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${TRACKER_TINTS[t.id]}`} aria-hidden="true">
                      <Icon className="h-5 w-5" strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0">
                      <p className={`flex flex-wrap items-center gap-2 text-sm font-bold ${ok ? "text-emerald-800" : "text-slate-800"}`}>
                        {t.label}
                        {streaks[t.id] >= 2 ? (
                          <span
                            className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-orange-100/70 px-1.5 py-0.5 text-[10px] font-extrabold text-orange-700 dark:bg-orange-500/20 dark:text-orange-300"
                            title={`${streaks[t.id]}-day streak`}
                          >
                            🔥 {streaks[t.id]}
                          </span>
                        ) : null}
                        {streakBadge(streaks[t.id]) ? (
                          <span
                            className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-[#FEF3C7] px-1.5 py-0.5 text-[10px] font-extrabold text-amber-800 dark:bg-amber-400/20 dark:text-amber-300"
                            title={`Milestone reached: ${streakBadge(streaks[t.id])} days`}
                          >
                            🏅 {streakBadge(streaks[t.id])}d
                          </span>
                        ) : null}
                      </p>
                      <p className="text-[11px] font-medium text-slate-400">
                        {t.kind === "toggle" ? "Done / not done" : `Goal: ${t.target}${t.unit}`}
                      </p>
                    </div>
                  </div>

                  {t.kind === "toggle" ? (
                    <button
                      type="button"
                      onClick={() => update((e) => { e[t.id] = !e[t.id] })}
                      aria-pressed={ok}
                      aria-label={`${ok ? "Uncheck" : "Complete"} ${t.label}`}
                      className={`flex h-9 items-center gap-2 rounded-xl px-4 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 ${
                        ok
                          ? "bg-[#DCFCE7] text-[#166534] shadow-sm"
                          : "border border-slate-200 bg-white text-slate-500 hover:border-violet-300 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400 dark:hover:text-violet-300"
                      }`}
                    >
                      {ok ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /> : null}
                      {ok ? "Done" : "Mark done"}
                    </button>
                  ) : (
                    <Stepper
                      value={value}
                      step={t.id === "coding" ? 0.5 : 1}
                      max={t.id === "water" ? 20 : 12}
                      unit={t.unit}
                      onChange={(v) => update((e) => { e[t.id] = v })}
                    />
                  )}
                </li>
              )
            })}
          </ul>
          {entry == null ? (
            <p className="mt-4">
              <EmptyState icon={Flame} title="Fresh day" hint="Your first check creates today's entry — it saves automatically." />
            </p>
          ) : null}
        </section>
      </div>

      {/* Namaz — dedicated five-slot tracker with live prayer times */}
      <div className="mt-6">
        <NamazCard data={data} patch={patch} todayKey={todayKey} />
      </div>
    </div>
  )
}
