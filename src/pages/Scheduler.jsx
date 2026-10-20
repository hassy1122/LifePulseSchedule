import { useEffect, useMemo, useRef, useState } from "react"
import { CalendarPlus, ChevronLeft, ChevronRight, Trash2 } from "lucide-react"
import { CATEGORY_COLORS, PRESETS, STATUSES } from "../lib/theme"
import { addDays, dateKey, fmtDayLong, fmtDayShort, fmtHour, uid } from "../lib/utils"
import { Badge, EmptyState, PageHeader } from "../components/ui"

const HOURS = Array.from({ length: 24 }, (_, h) => h)
const EMPTY_BLOCKS = []

function StatusControl({ value, onChange }) {
  return (
    <div
      className="inline-flex flex-wrap gap-0.5 rounded-xl border border-slate-200 bg-slate-50 p-1"
      role="group"
      aria-label={`Status for scheduled item`}
    >
      {STATUSES.map((s) => {
        const active = value === s.id
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            aria-pressed={active}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition focus-visible:outline-2 focus-visible:outline-violet-500 ${
              active ? `${s.chip} border` : `text-slate-500 hover:text-slate-800`
            }`}
          >
            {s.label}
          </button>
        )
      })}
    </div>
  )
}

export default function Scheduler({ data, patch }) {
  const [todayKey] = useState(() => dateKey(new Date()))
  const [viewKey, setViewKey] = useState(todayKey)
  const scroller = useRef(null)

  const blocks = data.scheduler?.[viewKey] ?? EMPTY_BLOCKS
  const blocksByHour = useMemo(() => {
    const map = new Map(Array.from({ length: 24 }, (_, h) => [h, []]))
    for (const b of blocks) map.get(Math.floor(b.start))?.push(b)
    return map
  }, [blocks])

  // Jump the scroll position to early morning on first render.
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = 5 * 46 - 16
  }, [viewKey])

  const completed = blocks.filter((b) => b.status === "completed").length
  const pct = blocks.length ? (completed / blocks.length) * 100 : 0

  function updateDay(mutate) {
    patch((d) => {
      if (!d.scheduler[viewKey]) d.scheduler[viewKey] = []
      mutate(d.scheduler[viewKey])
    })
  }

  function addPreset(p) {
    updateDay((arr) => {
      arr.push({
        id: uid("sb"),
        title: p.title,
        cat: p.cat,
        start: p.start,
        dur: p.dur,
        status: "pending",
      })
      arr.sort((a, b) => a.start - b.start)
    })
  }

  function setStatus(id, status) {
    updateDay((arr) => {
      const b = arr.find((x) => x.id === id)
      if (b) b.status = status
    })
  }

  function remove(id) {
    updateDay((arr) => arr.splice(arr.findIndex((x) => x.id === id), 1))
  }

  return (
    <div>
      <PageHeader
        title="Master Scheduler"
        subtitle="Plan the full 24-hour day — prayers, fitness, deep work and reading in one calm grid."
      >
        <div className="flex items-center gap-1">
          <button type="button" className="icon-btn" aria-label="Previous day" onClick={() => setViewKey(addDays(viewKey, -1))}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="btn-soft !h-9 px-3 text-xs"
            onClick={() => setViewKey(todayKey)}
            aria-current="true"
          >
            Today
          </button>
          <button type="button" className="icon-btn" aria-label="Next day" onClick={() => setViewKey(addDays(viewKey, 1))}>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </PageHeader>

      {/* Quick-add presets */}
      <section className="card mb-6" aria-labelledby="presets-heading">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 id="presets-heading" className="section-title">Quick add</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              One tap schedules an item for <strong className="font-semibold text-slate-800">{fmtDayLong(viewKey)}</strong>.
            </p>
          </div>
          {blocks.length > 0 && <Badge pct={pct} showLabel />}
        </div>
        <ul className="flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const cat = CATEGORY_COLORS[p.cat]
            const already = blocks.some((b) => b.presetId === p.id)
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => addPreset(p)}
                  disabled={already}
                  aria-label={`Add ${p.title} at ${fmtHour(p.start)}`}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 ${
                    already
                      ? "cursor-default border-slate-100 bg-slate-50 text-slate-400"
                      : `bg-white text-slate-700 hover:-translate-y-px hover:shadow-soft ${cat.chip}`
                  }`}
                >
                  <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
                  {p.title}
                  <span className="font-normal opacity-70">{fmtHour(p.start)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      {/* 24-hour planner */}
      <section className="card overflow-hidden p-0" aria-labelledby="planner-heading">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 id="planner-heading" className="text-sm font-bold text-slate-800">
            {fmtDayShort(viewKey)} — 24-hour plan
          </h2>
          <span className="text-xs font-medium text-slate-400">
            {completed}/{blocks.length} completed
          </span>
        </div>

        <div ref={scroller} className="scroll-slim max-h-[560px] overflow-y-auto px-6 py-4">
          {blocks.length === 0 ? (
            <EmptyState
              icon={CalendarPlus}
              title="Nothing scheduled yet"
              hint="Use the quick-add presets above to build your routine."
            />
          ) : (
            <ol className="relative" aria-label="24 hour time blocks">
              <div className="absolute top-0 bottom-0 left-[52px] w-px bg-slate-100" aria-hidden="true" />
              {HOURS.map((h) => {
                const row = blocksByHour.get(h) || []
                return (
                  <li key={h} className="relative flex gap-4">
                    <time
                      className="w-[44px] shrink-0 pt-3.5 text-right text-[11px] font-semibold tabular-nums text-slate-300"
                      dateTime={String(h).padStart(2, "0") + ":00"}
                    >
                      {fmtHour(h).replace(":00", "")}
                    </time>
                    <span
                      className="mt-4 h-2 w-2 shrink-0 rounded-full border border-slate-300 bg-white"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1 pb-2">
                      {row.length === 0 ? (
                        <div className="pt-1.5 text-[11px] font-medium text-slate-300">—</div>
                      ) : (
                        row.map((b) => {
                          const st = STATUSES.find((s) => s.id === b.status)
                          const cat = CATEGORY_COLORS[b.cat] || CATEGORY_COLORS.Other
                          return (
                            <article
                              key={b.id + b.start}
                              className="mb-2 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-soft"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-3">
                                  <h3 className="truncate text-sm font-bold text-slate-800">{b.title}</h3>
                                  <span
                                    className={`hidden shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold sm:inline ${cat.chip}`}
                                  >
                                    {b.cat}
                                  </span>
                                </div>
                                <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${st.chip}`}>
                                  {st.label}
                                </span>
                              </div>
                              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                                <p className="text-xs font-medium tabular-nums text-slate-400">
                                  {fmtHour(b.start)} – {fmtHour(b.start + b.dur)}
                                </p>
                                <div className="flex items-center gap-2">
                                  <StatusControl value={b.status} onChange={(v) => setStatus(b.id, v)} />
                                  <button
                                    type="button"
                                    onClick={() => remove(b.id)}
                                    aria-label={`Remove ${b.title}`}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 focus-visible:outline-2 focus-visible:outline-violet-500"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                  </button>
                                </div>
                              </div>
                            </article>
                          )
                        })
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </section>
    </div>
  )
}
