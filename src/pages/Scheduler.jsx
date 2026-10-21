import { useEffect, useMemo, useRef, useState } from "react"
import { CalendarPlus, ChevronLeft, ChevronRight, Pencil, Plus, Trash2, X } from "lucide-react"
import { CATEGORY_COLORS, PRESETS, STATUSES } from "../lib/theme"
import { addDays, dateKey, fmtDayLong, fmtDayShort, fmtHour, uid } from "../lib/utils"
import { Badge, EmptyState, PageHeader } from "../components/ui"

const HOURS = Array.from({ length: 24 }, (_, h) => h)
const EMPTY_BLOCKS = []
const CATEGORIES = ["Prayer", "Fitness", "Work", "Growth", "Other"]
const DURATIONS = [
  [0.25, "15 min"],
  [0.5, "30 min"],
  [0.75, "45 min"],
  [1, "1 hour"],
  [1.5, "1½ hours"],
  [2, "2 hours"],
  [2.5, "2½ hours"],
  [3, "3 hours"],
  [4, "4 hours"],
]

/* decimal hours (18.5) ⇄ "HH:MM" for <input type="time"> */
function decToTime(h) {
  const hh = Math.floor(h) % 24
  const mm = Math.round((h - Math.floor(h)) * 60)
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
}
function timeToDec(s) {
  const [hh = 0, mm = 0] = s.split(":").map(Number)
  return hh + mm / 60
}

function StatusControl({ value, onChange }) {
  return (
    <div
      className="inline-flex flex-wrap gap-0.5 rounded-xl border border-slate-200 bg-slate-50 p-1"
      role="group"
      aria-label="Status for scheduled item"
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

/* ---------------- Add / edit popover ---------------- */

function ItemPopover({ editing, blocks, onSubmit, onClose }) {
  const [title, setTitle] = useState(editing?.title ?? "")
  const [cat, setCat] = useState(editing?.cat ?? "Other")
  const [start, setStart] = useState(decToTime(editing?.start ?? 9))
  const [dur, setDur] = useState(String(editing?.dur ?? 1))
  const titleRef = useRef(null)
  const isEdit = Boolean(editing)

  useEffect(() => {
    titleRef.current?.focus()
    const onKey = (e) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  function submit(e) {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({ title: title.trim(), cat, start: timeToDec(start), dur: Number(dur) })
  }

  return (
    <>
      <div className="fixed inset-0 z-20" aria-hidden="true" onClick={onClose} />
      <div
        role="dialog"
        aria-label={isEdit ? "Edit scheduled item" : "Add a scheduled item"}
        className="absolute left-3 right-3 top-full z-30 mt-2 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-soft sm:left-auto sm:right-4 sm:w-[360px] sm:max-w-[calc(100vw-48px)]"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            {isEdit ? "Edit item" : "Add item"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-violet-500"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {!isEdit && (
          <div className="mb-4">
            <p className="section-title mb-2">Quick presets</p>
            <ul className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => {
                const added = blocks.some((b) => b.presetId === p.id)
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => onSubmit({ ...p, fromPreset: true })}
                      disabled={added}
                      aria-label={`Add ${p.title} at ${fmtHour(p.start)}`}
                      className={`rounded-lg border px-2 py-1 text-[11px] font-semibold transition focus-visible:outline-2 focus-visible:outline-violet-500 ${
                        added
                          ? "cursor-default border-slate-100 bg-slate-50 text-slate-300"
                          : "cursor-pointer border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                      }`}
                    >
                      {p.title}
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="my-3.5 flex items-center gap-2" aria-hidden="true">
              <span className="h-px flex-1 bg-slate-100" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">or custom</span>
              <span className="h-px flex-1 bg-slate-100" />
            </div>
          </div>
        )}

        <form onSubmit={submit}>
          <label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="item-title">
            Title
          </label>
          <input
            id="item-title"
            ref={titleRef}
            className="input mb-4"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Study session"
            required
          />

          <fieldset className="mb-4">
            <legend className="mb-1.5 text-xs font-bold text-slate-600">Category</legend>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Category">
              {CATEGORIES.map((c) => {
                const active = cat === c
                const tint = CATEGORY_COLORS[c]
                return (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setCat(c)}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violet-500 ${
                      active ? `${tint.chip}` : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {c}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div className="mb-5 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="item-start">
                Start
              </label>
              <input
                id="item-start"
                type="time"
                className="input"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="item-dur">
                Duration
              </label>
              <select id="item-dur" className="input" value={dur} onChange={(e) => setDur(e.target.value)}>
                {DURATIONS.map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {isEdit ? "Save changes" : "Add to schedule"}
          </button>
        </form>
      </div>
    </>
  )
}

/* ---------------- Page ---------------- */

export default function Scheduler({ data, patch }) {
  const [todayKey] = useState(() => dateKey(new Date()))
  const [viewKey, setViewKey] = useState(todayKey)
  const [editor, setEditor] = useState(null) // null | { block?: scheduler item }
  const scroller = useRef(null)

  const blocks = data.scheduler?.[viewKey] ?? EMPTY_BLOCKS
  const blocksByHour = useMemo(() => {
    const map = new Map(Array.from({ length: 24 }, (_, h) => [h, []]))
    for (const b of blocks) map.get(Math.floor(b.start))?.push(b)
    return map
  }, [blocks])

  // Jump the scroll position to early morning when the day changes.
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

  function submitEditor(item) {
    updateDay((arr) => {
      if (editor?.block) {
        const b = arr.find((x) => x.id === editor.block.id)
        if (b) Object.assign(b, item)
      } else if (item.fromPreset) {
        if (arr.some((x) => x.presetId === item.id)) return
        const { fromPreset: _ignored, ...preset } = item
        arr.push({ ...preset, id: uid("sb"), status: "pending" })
      } else {
        arr.push({ id: uid("sb"), title: item.title, cat: item.cat, start: item.start, dur: item.dur, status: "pending" })
      }
      arr.sort((a, b) => a.start - b.start)
    })
    if (item.fromPreset) return // keep popover open so several presets can be added
    setEditor(null)
  }

  function setStatus(id, status) {
    updateDay((arr) => {
      const b = arr.find((x) => x.id === id)
      if (b) b.status = status
    })
  }

  function remove(id) {
    updateDay((arr) => {
      const i = arr.findIndex((x) => x.id === id)
      if (i >= 0) arr.splice(i, 1)
    })
  }

  return (
    <div>
      <PageHeader
        title="Master Scheduler"
        subtitle="Plan the full 24-hour day — prayers, fitness, deep work, reading and anything custom."
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

      {/* 24-hour planner */}
      <section className="card relative p-0" aria-labelledby="planner-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 id="planner-heading" className="text-sm font-bold text-slate-800">
              {fmtDayShort(viewKey)} — 24-hour plan
            </h2>
            <p className="mt-0.5 text-[11px] font-medium text-slate-400">{fmtDayLong(viewKey)}</p>
          </div>
          <div className="flex items-center gap-2.5">
            {blocks.length > 0 && <Badge pct={pct} showLabel />}
            <button
              type="button"
              onClick={() => setEditor({})}
              aria-expanded={editor != null && editor.block == null}
              className="btn-primary !h-9 !px-3 text-xs"
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Add item
            </button>
          </div>
        </div>

        {editor != null ? (
          <ItemPopover
            editing={editor.block ?? null}
            blocks={blocks}
            onSubmit={submitEditor}
            onClose={() => setEditor(null)}
          />
        ) : null}

        <div ref={scroller} className="scroll-slim max-h-[560px] overflow-y-auto px-6 py-4">
          {blocks.length === 0 ? (
            <EmptyState
              icon={CalendarPlus}
              title="Nothing scheduled yet"
              hint="Use “Add item” — quick presets or a fully custom block with its own time and duration."
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
                                    onClick={() => setEditor({ block: b })}
                                    aria-label={`Edit ${b.title}`}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition hover:bg-violet-50 hover:text-violet-600 focus-visible:outline-2 focus-visible:outline-violet-500"
                                  >
                                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                                  </button>
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
