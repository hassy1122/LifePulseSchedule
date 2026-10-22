import { X } from "lucide-react"

/**
 * Stack of "deleted … Undo?" pills (bottom-right). Render nothing when empty.
 * `items` → [{ id, label }]; clicking Undo restores the previous snapshot.
 */
export default function UndoToast({ items, onUndo, onDismiss }) {
  if (!items.length) return null
  return (
    <div
      className="fixed right-4 bottom-24 z-[70] flex flex-col items-end gap-2 md:bottom-6"
      role="status"
      aria-live="polite"
    >
      {items.map((u) => (
        <div
          key={u.id}
          className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 py-2 pr-2 pl-4 text-xs font-semibold text-slate-100 shadow-soft dark:border-slate-600 dark:bg-slate-800"
        >
          <span className="max-w-56 truncate">{u.label}</span>
          <button
            type="button"
            onClick={() => onUndo(u.id)}
            className="rounded-full px-3 py-1 text-[11px] font-extrabold text-white transition hover:brightness-110"
            style={{ backgroundColor: "var(--color-violet-600)" }}
          >
            Undo
          </button>
          <button
            type="button"
            onClick={() => onDismiss(u.id)}
            aria-label="Dismiss"
            className="flex h-6 w-6 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-700 hover:text-slate-200"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  )
}
