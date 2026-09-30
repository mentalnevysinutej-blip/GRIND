// Tamagoči jádro — čistá logika bez Reactu, ať jde testovat a později přesunout do Rustu.
//
// Etická pravidla (viz CLAUDE.md): potřeby nikdy neklesnou pod FLOOR, avatar
// nemůže umřít, pouto (xp) nikdy neklesá a placené věci nejsou nutné k péči.

export const NEEDS = ['sytost', 'energie', 'nalada', 'zdravi']

export const NEED_LABELS = {
  sytost: 'Sytost',
  energie: 'Energie',
  nalada: 'Nálada',
  zdravi: 'Zdraví',
}

export const FLOOR = 5
const MAX = 100
const HOUR = 3600 * 1000
// Po delší pauze se potřeby odečtou nejvýš za tolik hodin — návrat nebolí.
const MAX_OFFLINE_HOURS = 12

// Změna za hodinu.
const DECAY_AWAKE = { sytost: -6, energie: -5, nalada: -4 }
const DECAY_ASLEEP = { sytost: -2, energie: +20, nalada: 0 }

export const FOODS = {
  jablko: { label: 'Jablíčko', emoji: '🍎', sytost: 15, nalada: 2, zdravi: 2 },
  polevka: { label: 'Polévka', emoji: '🍲', sytost: 30, nalada: 4, zdravi: 3 },
  susenka: { label: 'Sušenka', emoji: '🍪', sytost: 10, nalada: 8, zdravi: 0 },
  voda: { label: 'Voda', emoji: '💧', sytost: 5, nalada: 3, zdravi: 3 },
}

// Minimální odstup mezi odměnami XP za stejnou akci (proti klikací farmě).
const XP_COOLDOWN_MS = {
  feed: 10 * 60 * 1000,
  play: 5 * 60 * 1000,
  pet: 2 * 60 * 1000,
  heal: 30 * 60 * 1000,
  sleep: 60 * 60 * 1000,
  drink: 20 * 60 * 1000,
}
const XP_REWARD = { feed: 10, play: 12, pet: 3, heal: 8, sleep: 15, drink: 10 }

const clamp = (v) => Math.max(FLOOR, Math.min(MAX, v))

export function createPet(now = Date.now()) {
  return {
    sytost: 80,
    energie: 80,
    nalada: 80,
    zdravi: 100,
    xp: 0,
    asleep: false,
    paused: false,
    bornAt: now,
    updatedAt: now,
    lastXp: {},
  }
}

/** Posune stav v čase. Volá se každou chvíli i po návratu uživatele. */
export function tick(pet, now = Date.now()) {
  const elapsed = Math.max(0, now - pet.updatedAt)
  if (pet.paused || elapsed === 0) return { ...pet, updatedAt: now }

  const hours = Math.min(elapsed / HOUR, MAX_OFFLINE_HOURS)
  const rates = pet.asleep ? DECAY_ASLEEP : DECAY_AWAKE
  const next = { ...pet, updatedAt: now }
  for (const need of ['sytost', 'energie', 'nalada']) {
    next[need] = clamp(pet[need] + rates[need] * hours)
  }

  // Zdraví klesá jen když je nějaká potřeba dlouho nízko, jinak se samo hojí.
  const neglected = next.sytost < 20 || next.energie < 15 || next.nalada < 15
  next.zdravi = clamp(pet.zdravi + (neglected ? -3 : 1) * hours)

  // Vyspalý avatar se sám probudí.
  if (next.asleep && next.energie >= MAX) next.asleep = false
  return next
}

function reward(pet, kind, now) {
  const last = pet.lastXp[kind] ?? 0
  if (now - last < XP_COOLDOWN_MS[kind]) return { pet, xpGained: 0 }
  return {
    pet: { ...pet, xp: pet.xp + XP_REWARD[kind], lastXp: { ...pet.lastXp, [kind]: now } },
    xpGained: XP_REWARD[kind],
  }
}

function add(pet, deltas) {
  const next = { ...pet }
  for (const [need, d] of Object.entries(deltas)) {
    if (NEEDS.includes(need)) next[need] = clamp(next[need] + d)
  }
  return next
}

/**
 * Provede akci péče. Vrací { pet, result, xpGained }, kde result je klíč
 * pro hlášku avatara (např. 'feed', 'feedFull', 'healNotNeeded').
 */
export function act(pet0, action, payload, now = Date.now()) {
  let pet = tick(pet0, now)
  let result = action

  switch (action) {
    case 'feed': {
      const food = FOODS[payload] ?? FOODS.jablko
      if (pet.asleep) return { pet, result: 'asleep', xpGained: 0 }
      if (pet.sytost >= 95) return { pet, result: 'feedFull', xpGained: 0 }
      pet = add(pet, food)
      break
    }
    case 'drink':
      // Uživatel se napil → avatar pije s ním. Péče o sebe = péče o parťáka.
      pet = add(pet, FOODS.voda)
      break
    case 'play':
      if (pet.asleep) return { pet, result: 'asleep', xpGained: 0 }
      if (pet.energie < 15) return { pet, result: 'tooTired', xpGained: 0 }
      pet = add(pet, { nalada: 18, energie: -8, sytost: -3 })
      break
    case 'pet':
      pet = add(pet, { nalada: 6 })
      break
    case 'heal':
      if (pet.zdravi >= 90) return { pet, result: 'healNotNeeded', xpGained: 0 }
      pet = add(pet, { zdravi: 35, nalada: 3 })
      break
    case 'sleep':
      if (pet.asleep) return { pet, result: 'alreadyAsleep', xpGained: 0 }
      pet = { ...pet, asleep: true }
      break
    case 'wake':
      if (!pet.asleep) return { pet, result: 'alreadyAwake', xpGained: 0 }
      pet = { ...pet, asleep: false }
      // XP za spánek jen když si opravdu odpočinul.
      return { ...reward(pet, 'sleep', now), result: pet.energie > 60 ? 'wakeRested' : 'wake' }
    case 'pause':
      pet = { ...pet, paused: !pet.paused }
      result = pet.paused ? 'paused' : 'unpaused'
      return { pet, result, xpGained: 0 }
    default:
      return { pet, result: 'unknown', xpGained: 0 }
  }

  if (action === 'sleep') return { pet, result, xpGained: 0 }
  const rewarded = reward(pet, action, now)
  return { pet: rewarded.pet, result, xpGained: rewarded.xpGained }
}

/** Úroveň pouta: každá další potřebuje o trochu víc XP. Pouto nikdy neklesá. */
export function bondLevel(xp) {
  let level = 1
  let need = 40
  let rest = xp
  while (rest >= need && level < 50) {
    rest -= need
    level += 1
    need = Math.round(need * 1.15)
  }
  return { level, progress: rest / need, toNext: need - rest }
}

/** Jaká emoce se má ukázat na obličeji — priorita odshora dolů. */
export function emotionOf(pet) {
  if (pet.asleep) return 'sleep'
  if (pet.zdravi < 35) return 'sick'
  if (pet.sytost < 25) return 'hungry'
  if (pet.energie < 20) return 'tired'
  if (pet.nalada < 30) return 'sad'
  if (pet.nalada > 70) return 'happy'
  return 'neutral'
}

/** Nejnaléhavější potřeba (pro proaktivní hlášky), nebo null. */
export function urgentNeed(pet) {
  if (pet.asleep || pet.paused) return null
  if (pet.zdravi < 35) return 'sick'
  if (pet.sytost < 25) return 'hungry'
  if (pet.energie < 20) return 'tired'
  if (pet.nalada < 30) return 'sad'
  return null
}
