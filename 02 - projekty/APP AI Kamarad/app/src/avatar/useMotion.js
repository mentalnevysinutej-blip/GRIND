import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { onCursor, syncHitRects } from '../lib/platform.js'
import { BALL_RADIUS, createMotion, stepMotion, throwBall } from './motion.js'

const CLICK_SLOP = 6 // px — menší pohyb myši je kliknutí, ne tahání

/**
 * Smyčka animace (requestAnimationFrame). Pozici píše rovnou do DOMu přes ref,
 * aby se React nepřekresloval 60× za vteřinu — stav se mění jen při změně režimu.
 */
export function useMotion({ size, height, canWander, speed, onEvent, onClick }) {
  const rigRef = useRef(null)
  const ballRef = useRef(null)
  const mRef = useRef(null)
  const envRef = useRef(null)
  const [mode, setMode] = useState('fall')
  const [facing, setFacing] = useState(1)
  const [hasBall, setHasBall] = useState(false)
  const cb = useRef({ onEvent, onClick })

  // Nejčerstvější hodnoty pro smyčku animace (běží mimo React render).
  useLayoutEffect(() => {
    cb.current = { onEvent, onClick }
    envRef.current = {
      width: window.innerWidth,
      floorY: window.innerHeight - height - 6,
      size,
      height,
      canWander,
      speed,
    }
  })

  useEffect(() => {
    if (!mRef.current) mRef.current = createMotion(window.innerWidth - size, 40)
    let raf
    let last = performance.now()
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const { m, events } = stepMotion(mRef.current, dt, envRef.current)
      mRef.current = m
      if (rigRef.current) {
        rigRef.current.style.transform = `translate3d(${m.x}px, ${m.y}px, 0)`
        clampPopups(rigRef.current, m.x, size)
      }
      if (ballRef.current && m.ball) {
        ballRef.current.style.transform = `translate3d(${m.ball.x - BALL_RADIUS}px, ${m.ball.y - BALL_RADIUS}px, 0)`
      }
      setMode((prev) => (prev === m.mode ? prev : m.mode))
      setFacing((prev) => (prev === m.facing ? prev : m.facing))
      setHasBall((prev) => (prev === !!m.ball ? prev : !!m.ball))
      for (const e of events) cb.current.onEvent?.(e)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [size])

  // Rozhraní pro desktop: kde má okno chytat myš.
  useEffect(() => {
    const id = setInterval(() => syncHitRects(mRef.current?.mode === 'drag'), 100)
    return () => clearInterval(id)
  }, [])

  // Oči sledují kurzor.
  useEffect(
    () =>
      onCursor((cx, cy) => {
        const m = mRef.current
        const el = rigRef.current
        if (!m || !el) return
        const dx = cx - (m.x + size / 2)
        const dy = cy - (m.y + height * 0.45)
        const d = Math.hypot(dx, dy) || 1
        const k = Math.min(1, d / 250)
        // Avatar otočený doleva je zrcadlený, tak zrcadlíme i pohled.
        el.style.setProperty('--lx', ((dx / d) * k * m.facing).toFixed(2))
        el.style.setProperty('--ly', ((dy / d) * k).toFixed(2))
      }),
    [size, height],
  )

  // Tahání a házení avatarem.
  const drag = useRef(null)
  const onPointerDown = useCallback(
    (e) => {
      if (e.button !== 0) return
      e.currentTarget.setPointerCapture(e.pointerId)
      const m = mRef.current
      drag.current = {
        startX: e.clientX,
        startY: e.clientY,
        offX: e.clientX - m.x,
        offY: e.clientY - m.y,
        moved: false,
        samples: [{ x: e.clientX, y: e.clientY, t: performance.now() }],
      }
    },
    [],
  )

  const onPointerMove = useCallback((e) => {
    const d = drag.current
    if (!d) return
    if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < CLICK_SLOP) return
    if (!d.moved) {
      d.moved = true
      cb.current.onEvent?.('grabbed')
    }
    const now = performance.now()
    d.samples.push({ x: e.clientX, y: e.clientY, t: now })
    d.samples = d.samples.filter((s) => now - s.t < 90)
    mRef.current = {
      ...mRef.current,
      mode: 'drag',
      x: e.clientX - d.offX,
      y: e.clientY - d.offY,
      vx: 0,
      vy: 0,
    }
  }, [])

  const onPointerUp = useCallback((e) => {
    const d = drag.current
    drag.current = null
    if (!d) return
    if (!d.moved) {
      cb.current.onClick?.(e)
      return
    }
    const first = d.samples[0]
    const lastS = d.samples[d.samples.length - 1]
    const dt = Math.max(0.016, (lastS.t - first.t) / 1000)
    const clampV = (v) => Math.max(-2200, Math.min(2200, v))
    mRef.current = {
      ...mRef.current,
      mode: 'fall',
      vx: clampV((lastS.x - first.x) / dt),
      vy: clampV((lastS.y - first.y) / dt),
    }
  }, [])

  const startBall = useCallback(() => {
    mRef.current = throwBall(mRef.current, envRef.current)
  }, [])

  const rect = useCallback(() => {
    const m = mRef.current
    return m ? { x: m.x, y: m.y, w: size, h: height } : null
  }, [size, height])

  return {
    rigRef,
    ballRef,
    mode,
    facing,
    hasBall,
    startBall,
    rect,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  }
}

/** Bublina a menu jsou nad avatarem — posuň je, ať nevylezou z obrazovky. */
function clampPopups(rig, x, size) {
  for (const el of rig.querySelectorAll('[data-popup]')) {
    const w = el.offsetWidth
    const center = x + size / 2
    const margin = 8
    let shift = 0
    if (center - w / 2 < margin) shift = margin - (center - w / 2)
    else if (center + w / 2 > window.innerWidth - margin) shift = window.innerWidth - margin - (center + w / 2)
    el.style.setProperty('--shift', `${shift}px`)
  }
}
