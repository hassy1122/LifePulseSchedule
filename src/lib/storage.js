import { useEffect, useState } from "react"

/**
 * React state persisted to LocalStorage under `key`.
 * On first run (missing key) it materialises `buildInitial()`,
 * so the app ships pre-populated with realistic sample data.
 */
export function usePersistentState(key, buildInitial) {
  const [state, setState] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw != null) return JSON.parse(raw)
    } catch {
      /* corrupted storage → fall through to fresh seed */
    }
    return buildInitial()
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state))
    } catch {
      /* storage full / private mode — app keeps working in memory */
    }
  }, [key, state])

  return [state, setState]
}

/** Patch helper: clone the whole store, let the mutator edit it in place. */
export function patchState(setState, mutator) {
  setState((prev) => {
    const next = structuredClone(prev)
    mutator(next)
    return next
  })
}
