/**
 * Accent color themes — the sibling of the light/dark toggle.
 *
 * Tailwind v4 compiles every violet utility to a CSS variable
 * (`bg-violet-600` → `var(--color-violet-600)`), so the matching
 * `[data-accent="…"]` blocks in `index.css` simply remap those variables
 * to the new palette — one attribute on <html> re-tints the whole app.
 */
export const ACCENTS = [
  { id: "violet", label: "Violet", dot: "#7c3aed" },
  { id: "teal", label: "Teal", dot: "#0d9488" },
  { id: "rose", label: "Rose", dot: "#e11d48" },
  { id: "amber", label: "Amber", dot: "#d97706" },
]

export const ACCENT_STORAGE_KEY = "lifepulse-accent-v1"

/** Normalise any stored/JSON accent into a valid id. */
export function accentOrDefault(v) {
  return ACCENTS.some((a) => a.id === v) ? v : "violet"
}
