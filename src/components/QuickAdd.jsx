import { useEffect, useRef, useState } from "react"
import { CalendarPlus, Flashlight, Wallet, X, StickyNote } from "lucide-react"

const TYPES = [
  { id: "task", label: "Task", icon: CalendarPlus, hint: "→ today's schedule" },
  { id: "note", label: "Note", icon: StickyNote, hint: "→ Notes workspace" },
  { id: "transaction", label: "Expense", icon: Wallet, hint: "→ Finance log" },
  { id: "ledger", label: "Ledger", icon: Flashlight, hint: "→ lend / borrow" },
]

const LEDGER_DIRECTIONS = [
  { id: "lent", label: "They owe me" },
  { id: "borrowed", label: "I owe them" },
]

/**
 * Quick-add palette (Ctrl/⌘ + K) — add a task, note, expense or ledger
 * entry from any page without leaving what you're doing.
 */
export default function QuickAdd({ onClose, todayKey, onSubmit }) {
  const [type, setType] = useState("task")
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("Food")
  const [dir, setDir] = useState("lent")
  const inputRef = useRef(null)

  // Focus on mount + Escape closes (mounted only while the palette is open).
  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 40)
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  function submit(e) {
    e.preventDefault()
    const text = title.trim()
    const amt = Number(amount)
    if (!text) return
    if (type === "transaction" || type === "ledger") {
      if (!Number.isFinite(amt) || amt <= 0) return
    }
    onSubmit({ type, title: text, amount: Math.round(amt * 100) / 100, category, dir, todayKey })
    onClose()
  }

  const isTask = type === "task"

  return (
    <>
      <div className="fixed inset-0 z-[80] bg-slate-950/45 backdrop-blur-[2px]" aria-hidden="true" onClick={onClose} />
      <div
        role="dialog"
        aria-label="Quick add"
        className="fixed inset-x-4 top-[12vh] z-[90] mx-auto max-w-md rounded-2xl border border-slate-200/90 bg-white p-5 shadow-soft sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Quick add</h2>
          <div className="flex items-center gap-2">
            <kbd className="rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 dark:border-slate-700">
              Esc
            </kbd>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close quick add"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Type segmented control */}
        <div className="mb-3 flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/60" role="group" aria-label="What to add">
          {TYPES.map((t) => {
            const active = type === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                aria-pressed={active}
                title={t.hint}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold transition focus-visible:outline-2 focus-visible:outline-violet-500 ${
                  active
                    ? "bg-white text-violet-700 shadow-sm dark:bg-slate-700 dark:text-violet-300"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <t.icon className="h-3.5 w-3.5" aria-hidden="true" />
                {t.label}
              </button>
            )
          })}
        </div>

        <form onSubmit={submit}>
          <input
            ref={inputRef}
            className="input mb-3"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              isTask ? "e.g. Call the electrician" : type === "note" ? "Note title…" : type === "ledger" ? "Person / expense note…" : "e.g. Groceries"
            }
            aria-label={isTask ? "Task title" : undefined}
          />

          {(type === "transaction" || type === "ledger") && (
            <div className="mb-3 flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-400" htmlFor="qa-amount">
                  Amount (Rs)
                </label>
                <input
                  id="qa-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="input"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              {type === "transaction" ? (
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-400" htmlFor="qa-cat">
                    Category
                  </label>
                  <select
                    id="qa-cat"
                    className="input !w-32"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {["Food", "Tech", "Utilities", "Travel", "Misc"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-400" htmlFor="qa-dir">
                    Direction
                  </label>
                  <select
                    id="qa-dir"
                    className="input !w-36"
                    value={dir}
                    onChange={(e) => setDir(e.target.value)}
                  >
                    {LEDGER_DIRECTIONS.map((d) => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <button type="submit" className="btn-primary w-full">
            {isTask ? "Add to today's schedule" : type === "note" ? "Create note" : type === "ledger" ? "Save ledger entry" : "Log expense"}
          </button>
        </form>

        <p className="mt-3 text-center text-[10px] font-medium text-slate-400">
          Open from anywhere with{" "}
          <kbd className="rounded-md border border-slate-200 px-1.5 py-0.5 font-bold dark:border-slate-700">Ctrl + K</kbd> /{" "}
          <kbd className="rounded-md border border-slate-200 px-1.5 py-0.5 font-bold dark:border-slate-700">⌘ + K</kbd>
        </p>
      </div>
    </>
  )
}
