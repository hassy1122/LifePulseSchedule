/**
 * Namaz module: on-device prayer-time calculation (adhan), location handling
 * and the daily 5-slot checklist store helpers.
 *
 * No network calls — times are computed locally, so this works offline like
 * the rest of the PWA. Location comes from either a preset city or the
 * browser's Geolocation API (requested only on the user's button press).
 */
import { Coordinates, CalculationMethod, PrayerTimes, HighLatitudeRule } from "adhan"

/** The five daily prayers, in display order. */
export const PRAYERS = [
  { id: "fajr", label: "Fajr", arabic: "الفجر" },
  { id: "dhuhr", label: "Zuhr", arabic: "الظهر" },
  { id: "asr", label: "Asr", arabic: "العصر" },
  { id: "maghrib", label: "Maghrib", arabic: "المغرب" },
  { id: "isha", label: "Isha", arabic: "العشاء" },
]

/** Calculation methods offered (subset of adhan's, friendlier names). */
export const METHODS = {
  karachi: { label: "Karachi (Pakistan & South Asia)", make: () => CalculationMethod.Karachi() },
  mwl: { label: "Muslim World League (Europe default)", make: () => CalculationMethod.MuslimWorldLeague() },
  isna: { label: "ISNA (North America)", make: () => CalculationMethod.NorthAmerica() },
  hasta: { label: "Umm al-Qura (Makkah)", make: () => CalculationMethod.UmmAlQura() },
  egyptian: { label: "Egyptian General Authority", make: () => CalculationMethod.Egyptian() },
  turkey: { label: "Diyanet (Turkey)", make: () => CalculationMethod.Turkey() },
}

/** Sensible default method for a device timezone. */
export function methodForTimezone(tz) {
  if (tz === "Asia/Karachi") return "karachi"
  if (tz === "Asia/Dubai") return "hasta"
  if (tz === "Asia/Riyadh") return "hasta"
  if (tz === "Asia/Qatar") return "hasta"
  if (tz === "Asia/Kuwait") return "hasta"
  if (tz === "Asia/Tehran") return "karachi"
  if (tz === "America/New_York" || tz?.startsWith("America/")) return "isna"
  if (tz?.startsWith("Europe/")) return "mwl"
  if (tz?.startsWith("Africa/")) return "egyptian"
  if (tz?.startsWith("Asia/")) return "karachi"
  return "mwl"
}

/** City presets with coordinates, timezone and a display label. */
export const CITY_PRESETS = [
  { id: "lahore", city: "Lahore", country: "Pakistan", lat: 31.5497, lon: 74.3436, tz: "Asia/Karachi", method: "karachi" },
  { id: "karachi", city: "Karachi", country: "Pakistan", lat: 24.8607, lon: 67.0011, tz: "Asia/Karachi", method: "karachi" },
  { id: "islamabad", city: "Islamabad", country: "Pakistan", lat: 33.6844, lon: 73.0479, tz: "Asia/Karachi", method: "karachi" },
  { id: "peshawar", city: "Peshawar", country: "Pakistan", lat: 34.0151, lon: 71.5249, tz: "Asia/Karachi", method: "karachi" },
  { id: "makkah", city: "Makkah", country: "Saudi Arabia", lat: 21.4225, lon: 39.8262, tz: "Asia/Riyadh", method: "hasta" },
  { id: "dubai", city: "Dubai", country: "UAE", lat: 25.2048, lon: 55.2708, tz: "Asia/Dubai", method: "hasta" },
  { id: "istanbul", city: "Istanbul", country: "Türkiye", lat: 41.0082, lon: 28.9784, tz: "Europe/Istanbul", method: "turkey" },
  { id: "london", city: "London", country: "UK", lat: 51.5072, lon: -0.1276, tz: "Europe/London", method: "mwl" },
  { id: "paris", city: "Paris", country: "France", lat: 48.8566, lon: 2.3522, tz: "Europe/Paris", method: "mwl" },
  { id: "milan", city: "Milan", country: "Italy", lat: 45.4642, lon: 9.19, tz: "Europe/Rome", method: "mwl" },
  { id: "rome", city: "Rome", country: "Italy", lat: 41.9028, lon: 12.4964, tz: "Europe/Rome", method: "mwl" },
  { id: "newyork", city: "New York", country: "USA", lat: 40.7128, lon: -74.006, tz: "America/New_York", method: "isna" },
]

/** The device's current IANA timezone (changes automatically when traveling). */
export function deviceTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null
  } catch {
    return null
  }
}

/**
 * Compute today's five prayer times.
 * `settings` → { lat, lon, tz, method, madhab } ; returns array shaped like
 * PRAYERS + { time: Date, hour: decimal } with times expressed in `settings.tz`.
 */
export function computeTimes(dateJS, settings) {
  if (!settings || typeof settings.lat !== "number" || typeof settings.lon !== "number") return []
  const method = METHODS[settings.method] ? settings.method : "mwl"
  const params = METHODS[method].make()
  params.madhab = settings.madhab === "shafi" ? "shafi" : "hanafi"
  params.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight

  const pt = new PrayerTimes(new Coordinates(settings.lat, settings.lon), dateJS, params)
  const fmt = new Intl.DateTimeFormat("en", {
    timeZone: settings.tz || deviceTimezone() || undefined,
    hour: "numeric", minute: "2-digit", hour12: true,
  })
  return PRAYERS.map((p) => {
    const time = pt[p.id]
    return { ...p, time, label12: time ? fmt.format(time) : "—" }
  })
}

/** The next prayer among the five, looking at today's times (each has a Date). */
export function nextPrayerOf(times, nowJS = new Date()) {
  const upcoming = times.filter((p) => p.time && p.time > nowJS).sort((a, b) => a.time - b.time)
  return upcoming[0] || null
}

/** "in 2h 05m" human countdown from milliseconds. */
export function fmtCountdown(ms) {
  if (ms <= 0) return "now"
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h <= 0) return `in ${m}m`
  return `in ${h}h ${String(m).padStart(2, "0")}m`
}

/** Count logged prayers for a day's `namaz` object (e.g. 3 of 5). */
export function namazDoneOf(namaz) {
  if (!namaz) return 0
  return PRAYERS.filter((p) => namaz[p.id]).length
}

/** Location line for the card header. */
export function locationLabel(settings) {
  if (!settings) return null
  if (settings.city) {
    const preset = CITY_PRESETS.find((c) => c.id === settings.city)
    if (preset) return `${preset.city}, ${preset.country}`
  }
  if (typeof settings.lat === "number") {
    return `My location · ${Math.abs(settings.lat).toFixed(2)}°${settings.lat >= 0 ? "N" : "S"}, ${Math.abs(settings.lon).toFixed(2)}°${settings.lon >= 0 ? "E" : "W"}`
  }
  return null
}
