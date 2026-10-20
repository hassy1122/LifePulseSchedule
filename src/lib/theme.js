/**
 * Color-coded performance threshold logic.
 * Applied across daily cards, calendar/planner rows, badges and charts:
 *   100%                → light purple (`Perfection`)
 *   75% – 99.9%         → light green
 *   below 75%           → light red
 */

export const BANDS = {
  perfect: {
    id: "perfect",
    label: "Perfection",
    bg: "bg-[#E9D5FF]",
    border: "border-[#D8B4FE]",
    text: "text-[#6B21A8]",
    stroke: "#A855F7",
    softStroke: "#D8B4FE",
  },
  good: {
    id: "good",
    label: "Strong Day",
    bg: "bg-[#DCFCE7]",
    border: "border-[#86EFAC]",
    text: "text-[#166534]",
    stroke: "#22C55E",
    softStroke: "#86EFAC",
  },
  low: {
    id: "low",
    label: "Needs Focus",
    bg: "bg-[#FEE2E2]",
    border: "border-[#FECACA]",
    text: "text-[#991B1B]",
    stroke: "#EF4444",
    softStroke: "#FECACA",
  },
}

/** Map a completion percentage to its threshold band. */
export function bandFor(pct) {
  if (pct >= 100) return BANDS.perfect
  if (pct >= 75) return BANDS.good
  return BANDS.low
}

/** Statuses for scheduled items in the Master Scheduler. */
export const STATUSES = [
  {
    id: "pending",
    label: "Pending",
    chip: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "#94A3B8",
  },
  {
    id: "progress",
    label: "In Progress",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "#F59E0B",
  },
  {
    id: "completed",
    label: "Completed",
    chip: "bg-[#DCFCE7] text-[#166534] border-[#86EFAC]",
    dot: "#22C55E",
  },
  {
    id: "skipped",
    label: "Skipped",
    chip: "bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]",
    dot: "#EF4444",
  },
]

export function statusOf(id) {
  return STATUSES.find((s) => s.id === id) || STATUSES[0]
}

/** Scheduler quick-add presets (Islamic prayers + wellness + work). */
export const PRESETS = [
  { id: "fajar", title: "Fajar Prayer", cat: "Prayer", start: 5, dur: 0.5 },
  { id: "walk", title: "Morning Walk", cat: "Fitness", start: 6.5, dur: 1 },
  { id: "gym", title: "Exercise / Gym", cat: "Fitness", start: 7.5, dur: 1 },
  { id: "deepwork", title: "Deep Work / Coding", cat: "Work", start: 9, dur: 3 },
  { id: "zohar", title: "Zohar Prayer", cat: "Prayer", start: 13, dur: 0.5 },
  { id: "asr", title: "Asr Prayer", cat: "Prayer", start: 16.5, dur: 0.5 },
  { id: "maghrib", title: "Maghrib Prayer", cat: "Prayer", start: 18.5, dur: 0.5 },
  { id: "isha", title: "Isha Prayer", cat: "Prayer", start: 20, dur: 0.5 },
  { id: "reading", title: "Reading", cat: "Growth", start: 21.5, dur: 1 },
]

/** Categories for scheduler activity chips. */
export const CATEGORY_COLORS = {
  Prayer: { chip: "bg-violet-50 text-violet-700 border-violet-200", dot: "#8B5CF6" },
  Fitness: { chip: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "#22C55E" },
  Work: { chip: "bg-sky-50 text-sky-700 border-sky-200", dot: "#38BDF8" },
  Growth: { chip: "bg-amber-50 text-amber-700 border-amber-200", dot: "#F59E0B" },
  Other: { chip: "bg-slate-100 text-slate-600 border-slate-200", dot: "#94A3B8" },
}
