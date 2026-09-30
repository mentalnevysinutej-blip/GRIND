// Most mezi UI a desktopovým jádrem (Tauri). V prohlížeči (npm run dev) běží
// appka jako náhled plochy a tyhle funkce jsou no-op / používají DOM události.

export const isDesktop = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

let lastRects = ''

/**
 * Pošle jádru obdélníky všech prvků s atributem data-hit — tam má okno
 * přijímat myš. Jinde klikání propadá do aplikací pod Parťákem.
 * fullscreen=true (během tahání avatara) zachytí myš všude.
 */
export async function syncHitRects(fullscreen = false) {
  if (!isDesktop) return
  const rects = fullscreen
    ? [{ x: 0, y: 0, w: window.innerWidth, h: window.innerHeight }]
    : [...document.querySelectorAll('[data-hit]')].map((el) => {
        const r = el.getBoundingClientRect()
        return { x: r.x - 4, y: r.y - 4, w: r.width + 8, h: r.height + 8 }
      })
  const key = JSON.stringify(rects.map((r) => [r.x, r.y, r.w, r.h].map(Math.round)))
  if (key === lastRects) return
  lastRects = key
  const { invoke } = await import('@tauri-apps/api/core')
  await invoke('set_hit_rects', { rects })
}

/** Poloha kurzoru i mimo okno (v desktopu ji posílá jádro), jinak z DOMu. */
export function onCursor(callback) {
  if (isDesktop) {
    let unlisten = null
    let cancelled = false
    import('@tauri-apps/api/event').then(({ listen }) =>
      listen('cursor', (e) => callback(e.payload[0], e.payload[1])).then((fn) => {
        if (cancelled) fn()
        else unlisten = fn
      }),
    )
    return () => {
      cancelled = true
      unlisten?.()
    }
  }
  const handler = (e) => callback(e.clientX, e.clientY)
  window.addEventListener('pointermove', handler)
  return () => window.removeEventListener('pointermove', handler)
}

/** Jednoduché úložiště (zatím localStorage; později SQLite v jádře). */
export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // plné nebo zakázané úložiště — appka poběží dál bez ukládání
  }
}
