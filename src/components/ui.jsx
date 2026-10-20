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
