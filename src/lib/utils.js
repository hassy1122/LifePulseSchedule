/** Small date & math helpers shared across LifePulse. */

/** Local-timezone date key `YYYY-MM-DD` for a Date object. */
export function dateKey(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** Parse a `YYYY-MM-DD` key back to a local Date. */
export function keyToDate(key) {
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, m - 1, d)
}

/** Return `key` shifted by `n` days (n may be negative). */
export function addDays(key, n) {
  const d = keyToDate(key)
  d.setDate(d.getDate() + n)
  return dateKey(d)
}

/** `YYYY-MM` for a date key. */
export function monthKeyOf(key) {
  return key.slice(0, 7)
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

/** e.g. "Wed, Oct 21" */
export function fmtDayShort(key) {
  const d = keyToDate(key)
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

/** e.g. "21 October 2026" */
export function fmtDayLong(key) {
  const d = keyToDate(key)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** e.g. "October 2026" from a `YYYY-MM` key. */
export function fmtMonthLong(mm) {
  const [y, m] = mm.split("-").map(Number)
  return `${MONTHS[m - 1]} ${y}`
}

/** Shift a `YYYY-MM` key by `n` months. */
export function shiftMonth(mm, n) {
  const [y, m] = mm.split("-").map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

/** Decimal hour (e.g. 18.5) → "6:30 PM". */
export function fmtHour(h) {
  const hour = Math.floor(h) % 24
  const min = Math.round((h - Math.floor(h)) * 60)
  const suffix = hour >= 12 ? "PM" : "AM"
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12}:${String(min).padStart(2, "0")} ${suffix}`
}

/** Completion % = (completed / total) * 100, rounded to 1 decimal. */
export function pctOf(completed, total) {
  if (!total) return 0
  return Math.round((completed / total) * 1000) / 10
}

/** Tiny readable id for new items. */
export function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`
}

/** Currency formatting for the finance module (Indian-subcontinent market: PKR). */
export function fmtMoney(n) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: Number.isInteger(n) ? 0 : 2,
  }).format(n)
}
