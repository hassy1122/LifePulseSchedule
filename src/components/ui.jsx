import { bandFor } from "../lib/theme"

/** Page heading used at the top of every module. */
export function PageHeader({ title, subtitle, children }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
      </div>
      {children ? <div className="flex items-center gap-2">{children}</div> : null}
    </header>
  )
}

/**
 * Small pill showing a completion % with the shared threshold colors.
 * <Badge pct={100} /> → light purple, dark purple text.
 */
export function Badge({ pct, className = "", showLabel = false }) {
  const band = bandFor(pct)
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${band.bg} ${band.border} ${band.text} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" aria-hidden="true" />
      {Math.round(pct)}%{showLabel ? ` · ${band.label}` : ""}
    </span>
  )
}

/**
 * Animated progress bar (useful for goal milestones).
 * Width transitions with CSS, so every update glides smoothly.
 */
export function ProgressBar({ pct, className = "", stroke }) {
  const band = bandFor(pct)
  return (
    <div
      className={`h-2.5 w-full overflow-hidden rounded-full ${band.bg} ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${Math.round(pct)}% progress`}
    >
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${Math.max(pct, 1)}%`, backgroundColor: stroke || band.stroke }}
      />
    </div>
  )
}

/** Accessible on/off toggle used for app settings. */
export function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group inline-flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
    >
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
          checked ? "bg-violet-600" : "bg-slate-300 dark:bg-slate-700"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </span>
      {label && <span className="text-xs font-semibold text-slate-500">{label}</span>}
    </button>
  )
}

/** Circular completion indicator shared by the Today and Daily pages. */
export function ProgressRing({ pct }) {
  const band = bandFor(pct)
  const R = 66
  const C = 2 * Math.PI * R
  return (
    <div className="relative mx-auto h-44 w-44" role="img" aria-label={`Completion ${pct}%`}>
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <circle cx="80" cy="80" r={R} fill="none" stroke={band.softStroke} strokeWidth="13" />
        <circle
          cx="80"
          cy="80"
          r={R}
          fill="none"
          stroke={band.stroke}
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * C} ${C}`}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-extrabold tracking-tight ${band.text}`}>{Math.round(pct)}%</span>
        <span className="mt-0.5 text-xs font-bold tracking-wide uppercase text-slate-400">{band.label}</span>
      </div>
    </div>
  )
}

/** Empty-state placeholder card. */
export function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center">
      {Icon ? (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-soft">
          <Icon className="h-5 w-5 text-slate-400" aria-hidden="true" />
        </div>
      ) : null}
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      {hint ? <p className="mt-1 max-w-xs text-xs font-medium text-slate-400">{hint}</p> : null}
    </div>
  )
}

/** Number stepper shared by water intake & coding hours rows. */
export function Stepper({ value, onChange, min = 0, max, step = 1, unit }) {
  const clamp = (v) => Math.min(max, Math.max(min, Math.round((v + Number.EPSILON) * 100) / 100))
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      <button
        type="button"
        aria-label="Decrease"
        onClick={() => onChange(clamp(value - step))}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-violet-500"
      >
        −
      </button>
      <span className="min-w-12 text-center text-sm font-bold tabular-nums text-slate-800">
        {value}
        <span className="text-xs font-medium text-slate-400">{unit}</span>
      </span>
      <button
        type="button"
        aria-label="Increase"
        onClick={() => onChange(clamp(value + step))}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-violet-500"
      >
        +
      </button>
    </div>
  )
}
