// Katalog vzhledu. Každá položka = jeden „díl“ se stejnými kotevními body,
// takže nový díl nepotřebuje nové animace. Časem sem přibudou placené balíčky.

export const EYES = {
  kulate: 'Kulaté',
  velke: 'Velké (anime)',
  tecky: 'Tečky',
  hvezdicky: 'Hvězdičky',
  ospale: 'Ospalé',
}

export const HATS = {
  zadna: 'Nic',
  kulich: 'Kulich',
  koruna: 'Korunka',
  ksiltovka: 'Kšiltovka',
  masle: 'Mašle',
  vyhonek: 'Výhonek',
  cylindr: 'Cylindr',
}

export const EARS = {
  zadne: 'Nic',
  kocici: 'Kočičí uši',
  kralici: 'Králičí uši',
  antenky: 'Tykadla',
  rohy: 'Růžky',
}

export const ACCESSORIES = {
  zadny: 'Nic',
  bryle: 'Brýle',
  sala: 'Šála',
  sluchatka: 'Sluchátka',
  motylek: 'Motýlek',
}

export const PATTERNS = {
  zadny: 'Bez vzoru',
  brisko: 'Bříško',
  puntiky: 'Puntíky',
  pruhy: 'Proužky',
}

export const SIZES = { S: 'Malý', M: 'Střední', L: 'Velký' }
export const SIZE_PX = { S: 72, M: 104, L: 140 }

export const PALETTE = [
  '#7c9cff', '#9b8cff', '#ff8fb1', '#ffb86b', '#ffd95e',
  '#7ee2a8', '#5fd3e6', '#c4c9d4', '#3d4252', '#ff6b6b',
]

export const DEFAULT_LOOK = {
  body: '#7c9cff',
  accent: '#ffd95e',
  cheeks: '#ff8fb1',
  eyes: 'kulate',
  hat: 'zadna',
  ears: 'zadne',
  accessory: 'zadny',
  pattern: 'brisko',
  size: 'M',
}

/** „Kód avatara“ — sdílitelný řetězec se vzhledem (virální mechanika). */
export function encodeLook(look) {
  const json = JSON.stringify(look)
  return 'PARTAK-' + btoa(unescape(encodeURIComponent(json)))
}

export function decodeLook(code) {
  try {
    const raw = code.trim().replace(/^PARTAK-/, '')
    const look = JSON.parse(decodeURIComponent(escape(atob(raw))))
    return sanitizeLook(look)
  } catch {
    return null
  }
}

const HEX = /^#[0-9a-f]{6}$/i

/** Z cizího kódu vezme jen známé hodnoty — nic jiného se do appky nedostane. */
export function sanitizeLook(look) {
  if (!look || typeof look !== 'object') return null
  const pick = (value, options, fallback) => (value in options ? value : fallback)
  const color = (value, fallback) => (HEX.test(value) ? value : fallback)
  return {
    body: color(look.body, DEFAULT_LOOK.body),
    accent: color(look.accent, DEFAULT_LOOK.accent),
    cheeks: color(look.cheeks, DEFAULT_LOOK.cheeks),
    eyes: pick(look.eyes, EYES, DEFAULT_LOOK.eyes),
    hat: pick(look.hat, HATS, DEFAULT_LOOK.hat),
    ears: pick(look.ears, EARS, DEFAULT_LOOK.ears),
    accessory: pick(look.accessory, ACCESSORIES, DEFAULT_LOOK.accessory),
    pattern: pick(look.pattern, PATTERNS, DEFAULT_LOOK.pattern),
    size: pick(look.size, SIZES, DEFAULT_LOOK.size),
  }
}

/** Ztmaví/zesvětlí hex barvu (amount -1..1) — obrysy a stíny z jedné barvy. */
export function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount),
  )
  return '#' + ch.map((c) => c.toString(16).padStart(2, '0')).join('')
}
