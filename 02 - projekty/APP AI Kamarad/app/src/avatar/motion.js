// Pohyb avatara po ploše — čistá logika (bez DOMu), krok po kroku.
// Souřadnice: x = levý okraj avatara, y = horní okraj, v CSS pixelech okna.

const GRAVITY = 2200 // px/s²
const WALK_SPEED = 70 // px/s
const CHASE_SPEED = 190
const BALL_RADIUS = 11

const rand = (a, b) => a + Math.random() * (b - a)

export function createMotion(width, floorY) {
  return {
    x: Math.max(0, width * 0.7),
    y: floorY,
    vx: 0,
    vy: 0,
    mode: 'fall', // idle | walk | sit | drag | fall | chase
    facing: 1,
    targetX: null,
    timer: 1.5,
    ball: null, // { x, y, vx, vy, resting }
  }
}

/**
 * Posune stav o dt sekund. env = { width, floorY, size, height, canWander, speed }.
 * Vrací { m, events } — události jako 'landed' nebo 'caught' řeší UI (hlášky, XP).
 */
export function stepMotion(m0, dt, env) {
  const m = { ...m0 }
  const events = []
  const maxX = Math.max(0, env.width - env.size)

  if (m.ball) m.ball = stepBall(m.ball, dt, env)

  switch (m.mode) {
    case 'drag':
      break

    case 'fall': {
      m.vy += GRAVITY * dt
      m.x += m.vx * dt
      m.y += m.vy * dt
      if (m.x < 0 || m.x > maxX) {
        m.x = Math.min(maxX, Math.max(0, m.x))
        m.vx *= -0.55
      }
      if (m.y < 0) {
        m.y = 0
        m.vy = Math.abs(m.vy) * 0.3
      }
      if (m.y >= env.floorY) {
        m.y = env.floorY
        if (m.vy > 500) {
          m.vy = -m.vy * 0.32
          m.vx *= 0.7
          events.push('bounce')
        } else {
          const hard = m.vy > 250
          m.vy = 0
          m.vx = 0
          m.mode = 'idle'
          m.timer = rand(1, 2.5)
          events.push(hard ? 'landed' : 'settled')
        }
      }
      break
    }

    case 'chase': {
      if (!m.ball) {
        m.mode = 'idle'
        break
      }
      const target = m.ball.x - env.size / 2
      const dx = target - m.x
      m.facing = dx >= 0 ? 1 : -1
      const stepX = Math.sign(dx) * Math.min(Math.abs(dx), CHASE_SPEED * env.speed * dt)
      m.x = Math.min(maxX, Math.max(0, m.x + stepX))
      if (Math.abs(dx) < 12 && m.ball.resting) {
        m.ball = null
        m.mode = 'idle'
        m.timer = rand(2, 4)
        events.push('caught')
      }
      break
    }

    case 'walk': {
      if (!env.canWander) {
        m.mode = 'idle'
        break
      }
      const dx = m.targetX - m.x
      m.facing = dx >= 0 ? 1 : -1
      const stepX = Math.sign(dx) * Math.min(Math.abs(dx), WALK_SPEED * env.speed * dt)
      m.x += stepX
      if (Math.abs(dx) < 2) {
        m.mode = 'idle'
        m.timer = rand(3, 8)
      }
      break
    }

    case 'sit':
    case 'idle': {
      m.timer -= dt
      if (m.timer > 0 || !env.canWander) break
      const roll = Math.random()
      if (roll < 0.55) {
        m.mode = 'walk'
        m.targetX = rand(0, maxX)
      } else if (roll < 0.75) {
        m.mode = 'sit'
        m.timer = rand(6, 14)
      } else {
        m.mode = 'idle'
        m.timer = rand(3, 7)
      }
      break
    }
  }

  // Když se změní velikost obrazovky / avatara, drž ho na podlaze a uvnitř.
  if (m.mode !== 'drag' && m.mode !== 'fall') {
    m.x = Math.min(maxX, Math.max(0, m.x))
    m.y = env.floorY
  }
  return { m, events }
}

function stepBall(b0, dt, env) {
  if (b0.resting) return b0
  const b = { ...b0 }
  b.vy += GRAVITY * dt
  b.x += b.vx * dt
  b.y += b.vy * dt
  const floor = env.floorY + env.height - BALL_RADIUS
  if (b.x < BALL_RADIUS || b.x > env.width - BALL_RADIUS) {
    b.x = Math.min(env.width - BALL_RADIUS, Math.max(BALL_RADIUS, b.x))
    b.vx *= -0.7
  }
  if (b.y >= floor) {
    b.y = floor
    b.vy = -b.vy * 0.55
    b.vx *= 0.8
    if (Math.abs(b.vy) < 90) {
      b.vy = 0
      b.vx *= 0.9
      if (Math.abs(b.vx) < 15) b.resting = true
    }
  }
  return b
}

/** Hodí míček z avatara náhodným směrem. */
export function throwBall(m, env) {
  const dir = m.x + env.size / 2 > env.width / 2 ? -1 : 1
  return {
    ...m,
    mode: 'chase',
    ball: {
      x: m.x + env.size / 2,
      y: m.y,
      vx: dir * rand(350, 700),
      vy: -rand(700, 1000),
      resting: false,
    },
  }
}

export { BALL_RADIUS }
