import { useCallback, useEffect, useState } from "react"
import { Check, MapPin } from "lucide-react"
import {
  CITY_PRESETS,
  METHODS,
  PRAYERS,
  computeTimes,
  deviceTimezone,
  fmtCountdown,
  locationLabel,
  methodForTimezone,
  nextPrayerOf,
} from "../lib/namaz"

/**
 * Namaz tracker — five-slot daily checklist with calculated prayer times.
 *
 * Full variant (`compact=false`) lives on the Daily Sheet; the compact
 * variant is shown on Today. Both share the same store:
 *   data.namaz     → { lat, lon, city?, tz, method, madhab }
 *   data.namazLog  → { [dateKey]: { fajr, dhuhr, asr, maghrib, isha } }
 */
export default function NamazCard({ data, patch, todayKey, compact = false }) {
  const settings = data.namaz ?? emptySettings()
  const hasCoords = typeof settings.lat === "number" && typeof settings.lon === "number"

  const [now, setNow] = useState(() => new Date())
  const [geoBusy, setGeoBusy] = useState(false)
  const [geoErr, setGeoErr] = useState(null)

  // Keep the countdown living — refresh the local time every 30s.
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const tzNow = deviceTimezone()
  const traveled = hasCoords && settings.tz && tzNow && settings.tz !== tzNow

  /* Times for the location's timezone and method... */
  const times = hasCoords ? computeTimes(now, settings) : []
  const next = hasCoords ? nextPrayerOf(times, now) : null

  /** If the device lands in a new timezone and location permission is already
   *  granted (e.g. a trip to Italy), refresh coordinates automatically. */
  const refreshLocation = useCallback(
    (auto = false) => {
      if (!navigator.geolocation) {
        setGeoErr("Location isn’t available in this browser — pick a city below instead.")
        return
      }
      if (!auto) setGeoBusy(true)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoBusy(false)
          setGeoErr(null)
          const tz = deviceTimezone()
          patch((d) => {
            d.namaz = {
              ...(d.namaz ?? {}),
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              city: null, // custom coords, not a preset city
              tz,
              method: methodForTimezone(tz),
              madhab: d.namaz?.madhab ?? "hanafi",
            }
          })
        },
        (err) => {
          setGeoBusy(false)
          if (!auto) setGeoErr(geoMessage(err))
        },
        { timeout: 10_000, maximumAge: 600_000 },
      )
    },
    [patch],
  )

  useEffect(() => {
    if (!traveled) return
    let cancelled = false
    try {
      navigator.permissions
        ?.query({ name: "geolocation" })
        .then((st) => {
          if (!cancelled && st.state === "granted") refreshLocation(true)
        })
        .catch(() => {})
    } catch {
      /* permissions API not supported → user taps the banner button */
    }
    return () => {
      cancelled = true
    }
  }, [traveled, refreshLocation])

  /** Adopt a preset city (works without geolocation permission). */
  const setCity = (id) => {
    const preset = CITY_PRESETS.find((c) => c.id === id)
    if (!preset) return
    setGeoErr(null)
    patch((d) => {
      d.namaz = {
        ...(d.namaz ?? {}),
        lat: preset.lat,
        lon: preset.lon,
        city: preset.id,
        tz: preset.tz,
        method: preset.method,
        madhab: d.namaz?.madhab ?? "hanafi",
      }
    })
  }

  /** Toggle a prayer slot for this day. */
  const toggle = (prayerId) => {
    patch((d) => {
      d.namazLog ??= {}
      d.namazLog[todayKey] ??= { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false }
      d.namazLog[todayKey][prayerId] = !d.namazLog[todayKey][prayerId]
    })
  }

  const log = data.namazLog?.[todayKey] ?? {}
  const doneCount = PRAYERS.filter((p) => log[p.id]).length
  const locLabel = locationLabel(settings)

  /* ------- Compact card (Today page) ------- */
  if (compact) {
    if (!hasCoords) return null
    return (
      <section className="card" aria-labelledby="namaz-mini">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="namaz-mini" className="section-title">
            Namaz
            {locLabel ? (
              <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {locLabel}
              </span>
            ) : null}
          </h2>
          {next ? (
            <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-bold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
              {next.label} {fmtCountdown(next.time - now)}
            </span>
          ) : null}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {times.map((p) => {
            const ok = !!log[p.id]
            const isNext = next?.id === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                aria-pressed={ok}
                aria-label={`${ok ? "Uncheck" : "Check"} ${p.label}`}
                title={`${p.label} · ${p.label12}`}
                className={`flex flex-1 min-w-14 flex-col items-center gap-1 rounded-xl border px-2 py-2.5 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 ${
                  ok
                    ? "border-transparent bg-[#DCFCE7] dark:bg-emerald-900/40"
                    : isNext
                      ? "border-violet-300 bg-violet-50/60 dark:border-violet-700 dark:bg-violet-900/25"
                      : "border-slate-200 bg-white hover:border-violet-300 dark:border-slate-700 dark:bg-slate-800/60"
                }`}
              >
                <span
                  className={`text-[11px] font-bold ${ok ? "text-[#166534] dark:text-emerald-300" : "text-slate-600 dark:text-slate-300"}`}
                >
                  {p.label}
                </span>
                <span
                  className={`text-[10px] font-semibold tabular-nums ${ok ? "text-emerald-700/80 dark:text-emerald-400/80" : "text-slate-400"}`}
                >
                  {p.label12.replace(/\s?(AM|PM)/i, "")}
                </span>
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                    ok ? "border-emerald-600 bg-emerald-600" : "border-slate-300 dark:border-slate-600"
                  }`}
                  aria-hidden="true"
                >
                  {ok ? <Check className="h-2.5 w-2.5 text-white" strokeWidth={4} /> : null}
                </span>
              </button>
            )
          })}
        </div>
      </section>
    )
  }

  /* ------- Full card (Daily Sheet) ------- */
  return (
    <section className="card" aria-labelledby="namaz-heading">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="namaz-heading" className="section-title">Namaz — today’s five</h2>
        {hasCoords ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-[11px] font-bold text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {locLabel}
          </span>
        ) : null}
      </div>

      {!hasCoords ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-5 dark:border-slate-700 dark:bg-slate-800/40">
          <p className="text-sm font-semibold text-slate-600">
            Set your location once — prayer times update automatically.
          </p>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Pick a city below (no permission needed), or let the browser use your
            exact location. Times are calculated on-device, so they work offline.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => refreshLocation(false)}
              disabled={geoBusy}
              className="flex h-9 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
            >
              {geoBusy ? "Locating…" : "Use my location"}
            </button>
            <select
              aria-label="Choose a city"
              value=""
              onChange={(e) => setCity(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <option value="" disabled>…or choose a city</option>
              {CITY_PRESETS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.city}, {c.country}
                </option>
              ))}
            </select>
          </div>
          {geoErr ? <p className="mt-3 text-xs font-semibold text-red-600 dark:text-red-400">{geoErr}</p> : null}
        </div>
      ) : (
        <>
          {/* Count-down strip for the upcoming prayer */}
          {next ? (
            <div className="mb-4 flex items-center justify-between rounded-2xl bg-violet-50 px-4 py-3 dark:bg-violet-950/40">
              <p className="text-sm font-bold text-violet-800 dark:text-violet-200">
                Next: {next.label} at {next.label12}
              </p>
              <span className="rounded-full bg-violet-600 px-3 py-1 text-[11px] font-bold text-white tabular-nums">
                {fmtCountdown(next.time - now)}
              </span>
            </div>
          ) : null}

          {traveled ? (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-amber-50 px-4 py-3 dark:bg-amber-900/25">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                ✈️ Travel detected — your device is now in a different timezone.
                {!geoBusy ? " Tap below to refresh prayer times." : ""}
              </p>
              <button
                type="button"
                onClick={() => refreshLocation(false)}
                disabled={geoBusy}
                className="h-8 rounded-lg bg-amber-600 px-3 text-[11px] font-bold text-white transition hover:bg-amber-700 disabled:opacity-60"
              >
                {geoBusy ? "Locating…" : "Update location"}
              </button>
            </div>
          ) : null}

          {/* Five prayer rows */}
          <ul className="space-y-3">
            {times.map((p) => {
              const ok = !!log[p.id]
              const isNext = next?.id === p.id
              return (
                <li
                  key={p.id}
                  className={`flex items-center justify-between gap-3 rounded-2xl border p-4 transition ${
                    ok
                      ? "border-transparent bg-[#F0FDF4]"
                      : isNext
                        ? "border-violet-200 bg-violet-50/60 dark:border-violet-800 dark:bg-violet-900/20"
                        : "border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`flex h-10 w-11 items-center justify-center rounded-xl text-[10px] font-bold ${
                        ok
                          ? "bg-[#DCFCE7] text-[#166534] dark:bg-emerald-900/50 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400"
                      }`}
                      aria-hidden="true"
                    >
                      {p.arabic}
                    </span>
                    <div>
                      <p className={`text-sm font-bold ${ok ? "text-emerald-800 dark:text-emerald-300" : "text-slate-800 dark:text-slate-200"}`}>
                        {p.label}
                        {isNext ? (
                          <span className="ml-2 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white">
                            Next
                          </span>
                        ) : null}
                      </p>
                      <p className="text-[11px] font-medium text-slate-400">
                        Adhan {p.label12}
                        {log[p.id] ? " · logged ✅" : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(p.id)}
                    aria-pressed={ok}
                    aria-label={`${ok ? "Uncheck" : "Check"} ${p.label}`}
                    className={`flex h-9 items-center gap-2 rounded-xl px-4 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 ${
                      ok
                        ? "bg-[#DCFCE7] text-[#166534] shadow-sm"
                        : "border border-slate-200 bg-white text-slate-500 hover:border-violet-300 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400 dark:hover:text-violet-300"
                    }`}
                  >
                    {ok ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /> : null}
                    {ok ? "Done" : "Prayed"}
                  </button>
                </li>
              )
            })}
          </ul>

          {/* Fine-tuning row */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
              Method
              <select
                value={settings.method}
                onChange={(e) => patch((d) => { d.namaz.method = e.target.value })}
                className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {Object.entries(METHODS).map(([id, m]) => (
                  <option key={id} value={id}>{m.label}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
              Asr madhab
              <select
                value={settings.madhab ?? "hanafi"}
                onChange={(e) => patch((d) => { d.namaz.madhab = e.target.value })}
                className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <option value="hanafi">Hanafi (later Asr)</option>
                <option value="shafi">Shafi / Jafari (earlier Asr)</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => refreshLocation(false)}
              disabled={geoBusy}
              className="text-[11px] font-bold text-violet-600 hover:text-violet-700 disabled:opacity-60 dark:text-violet-400"
            >
              {geoBusy ? "Locating…" : "↻ Update my location"}
            </button>
            <span className="ml-auto text-[10px] font-medium text-slate-300 dark:text-slate-600">
              {doneCount}/5 logged · adhan times, jamaat may differ
            </span>
          </div>
          {geoErr ? <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">{geoErr}</p> : null}
        </>
      )}
    </section>
  )
}

function emptySettings() {
  return { lat: null, lon: null, city: null, tz: deviceTimezone(), method: methodForTimezone(deviceTimezone()), madhab: "hanafi" }
}

/** Friendly geolocation error text. */
function geoMessage(err) {
  switch (err?.code) {
    case 1: return "Location permission was denied — pick a city instead (works just as well)."
    case 2: return "Couldn’t detect your position — try again or pick a city."
    case 3: return "Location timed out — try again."
    default: return "Location isn’t available here — pick a city instead."
  }
}
