/**
 * Tiny dependency-free confetti burst — used when a day hits 100% or a
 * goal gets completed. Honors prefers-reduced-motion; cleans itself up.
 */
export function burstConfetti() {
  if (typeof document === "undefined") return
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return

  const canvas = document.createElement("canvas")
  canvas.setAttribute("aria-hidden", "true")
  canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999"
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = window.innerWidth * dpr
  canvas.height = window.innerHeight * dpr
  document.body.appendChild(canvas)

  const ctx = canvas.getContext("2d")
  ctx.scale(dpr, dpr)
  const W = window.innerWidth
  const H = window.innerHeight

  const COLORS = ["#8B5CF6", "#22C55E", "#F59E0B", "#38BDF8", "#F43F5E", "#FDE68A", "#A78BFA"]
  const rand = (a, b) => a + Math.random() * (b - a)

  const parts = Array.from({ length: 110 }, () => ({
    x: rand(W * 0.25, W * 0.75),
    y: rand(H * 0.2, H * 0.42),
    vx: rand(-3.2, 3.2),
    vy: rand(-9, -3.5),
    w: rand(5, 10),
    h: rand(8, 14),
    rot: rand(0, Math.PI * 2),
    vr: rand(-0.25, 0.25),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }))

  const started = performance.now()
  const DURATION = 1600

  function frame(t) {
    const elapsed = t - started
    ctx.clearRect(0, 0, W, H)
    for (const p of parts) {
      p.vy += 0.22 // gravity
      p.x += p.vx
      p.y += p.vy
      p.rot += p.vr
      const alpha = 1 - Math.max(0, (elapsed - DURATION * 0.6) / (DURATION * 0.4))
      if (alpha <= 0) continue
      ctx.save()
      ctx.globalAlpha = Math.min(1, alpha)
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
    }
    if (elapsed < DURATION) {
      requestAnimationFrame(frame)
    } else {
      canvas.remove()
    }
  }
  requestAnimationFrame(frame)
}
