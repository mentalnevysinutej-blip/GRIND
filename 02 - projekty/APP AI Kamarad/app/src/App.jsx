import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import Blob, { VIEWBOX } from './avatar/Blob.jsx'
import { DEFAULT_LOOK, SIZE_PX, sanitizeLook } from './avatar/catalog.js'
import { useMotion } from './avatar/useMotion.js'
import { isDesktop, load, save } from './lib/platform.js'
import { line } from './personality/lines.js'
import { emotionOf, urgentNeed } from './tamagotchi/engine.js'
import { useTamagotchi } from './tamagotchi/useTamagotchi.js'
import Bubble from './ui/Bubble.jsx'
import CareMenu from './ui/CareMenu.jsx'
import Egg from './ui/Egg.jsx'
import Settings, { PROACTIVITY } from './ui/Settings.jsx'
import Wardrobe from './ui/Wardrobe.jsx'

const SETTINGS_KEY = 'partak.v1.settings'
const DEFAULT_SETTINGS = {
  hatched: false,
  name: '',
  personality: 'kamarad',
  proactivity: 'normal',
  drinkReminders: true,
  look: DEFAULT_LOOK,
}

const MIN = 60 * 1000
const PANEL_W = 340

export default function App() {
  const [settings, setSettings] = useState(() => {
    const s = load(SETTINGS_KEY, DEFAULT_SETTINGS)
    return { ...s, look: sanitizeLook(s.look) ?? DEFAULT_LOOK }
  })
  useEffect(() => save(SETTINGS_KEY, settings), [settings])

  const { pet, act, reset } = useTamagotchi()
  const [bubble, setBubble] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [panel, setPanel] = useState(null) // 'wardrobe' | 'settings' | null
  const [activity, setActivity] = useState(null) // krátká animace: 'eat' | 'happy' | 'grabbed'
  const [hearts, setHearts] = useState([])

  const size = SIZE_PX[settings.look.size]
  const height = Math.round((size * VIEWBOX.h) / VIEWBOX.w)

  // ---------- řeč ----------
  const bubbleTimer = useRef(null)
  const say = useCallback(
    (event, extra = {}) => {
      const text = extra.text ?? line(settings.personality, event, { name: settings.name, ...extra.vars })
      if (!text) return
      clearTimeout(bubbleTimer.current)
      setBubble({ text, ...extra })
      if (!extra.actions && !extra.input) {
        bubbleTimer.current = setTimeout(() => setBubble(null), extra.ms ?? 5500)
      }
    },
    [settings.personality, settings.name],
  )

  const flash = useCallback((kind, ms = 1600) => {
    setActivity(kind)
    setTimeout(() => setActivity((a) => (a === kind ? null : a)), ms)
  }, [])

  const burstHearts = useCallback((n = 4) => {
    const batch = Array.from({ length: n }, (_, i) => ({
      id: Math.random().toString(36).slice(2),
      dx: (i - (n - 1) / 2) * 18 + (Math.random() * 10 - 5),
      delay: i * 90,
    }))
    setHearts((h) => [...h, ...batch])
    setTimeout(() => setHearts((h) => h.filter((x) => !batch.includes(x))), 1600)
  }, [])

  // ---------- pohyb ----------
  const busy = menuOpen || !!panel || pet.asleep || !settings.hatched
  const motion = useMotion({
    size,
    height,
    canWander: !busy && activity !== 'eat',
    speed: pet.energie < 25 ? 0.5 : 1,
    onEvent: (e) => {
      if (e === 'grabbed') {
        setMenuOpen(false)
        flash('grabbed', 99999)
        if (Math.random() < 0.6) say('grabbed', { ms: 1500 })
      } else if (e === 'landed' || e === 'settled') {
        setActivity((a) => (a === 'grabbed' ? null : a))
        if (e === 'landed' && settings.hatched) say('landed', { ms: 2500 })
      } else if (e === 'caught') {
        flash('happy')
        say('caught')
      }
    },
    onClick: () => {
      if (!settings.hatched) return
      setPanel(null)
      setMenuOpen((o) => !o)
    },
  })

  // ---------- péče ----------
  const doAction = useCallback(
    (action, payload) => {
      const r = act(action, payload)
      if (action === 'feed' && r.result === 'feed') flash('eat', 1800)
      if (['pet', 'drink', 'heal', 'wakeRested'].includes(r.result)) flash('happy')
      if (r.xpGained) burstHearts(action === 'pet' ? 2 : 4)
      if (action === 'play' && r.result === 'play') {
        setMenuOpen(false)
        motion.startBall()
      }
      if (action === 'sleep' && r.result === 'sleep') setMenuOpen(false)
      say(r.result)
      if (r.levelUp) {
        setTimeout(() => {
          burstHearts(8)
          say('levelUp', { vars: { level: r.levelUp }, ms: 6000 })
        }, 1800)
      }
      return r
    },
    [act, flash, burstHearts, say, motion],
  )

  // Pohlazení: kroužení myší nad avatarem.
  const petting = useRef({ dist: 0, last: null, cooldownUntil: 0 })
  const onHover = (e) => {
    const p = petting.current
    if (p.last) p.dist += Math.hypot(e.clientX - p.last.x, e.clientY - p.last.y)
    p.last = { x: e.clientX, y: e.clientY }
    if (p.dist > 450 && Date.now() > p.cooldownUntil && !pet.asleep) {
      p.dist = 0
      p.cooldownUntil = Date.now() + 8000
      doAction('pet')
    }
  }
  const onLeave = () => {
    petting.current.dist = 0
    petting.current.last = null
  }

  // ---------- proaktivita (s limity, bez výčitek) ----------
  const stateRef = useRef({})
  useLayoutEffect(() => {
    stateRef.current = { pet, bubble, menuOpen, panel, settings, say, doAction }
  })

  useEffect(() => {
    const start = Date.now()
    const c = { urgent: 0, idle: start, drink: start, stretch: start, night: '' }
    const id = setInterval(() => {
      const { pet, bubble, menuOpen, panel, settings, say, doAction } = stateRef.current
      if (!settings.hatched || bubble || menuOpen || panel || pet.paused) return
      const now = Date.now()
      const f = PROACTIVITY[settings.proactivity]?.factor ?? 1

      const hour = new Date().getHours()
      const nightKey = new Date().toDateString()
      if ((hour >= 23 || hour < 4) && !pet.asleep && c.night !== nightKey) {
        c.night = nightKey
        say('night', {
          actions: [
            { label: '🌙 Jdeme spát', onClick: () => doAction('sleep') },
            { label: 'Ještě chvilku', ghost: true, onClick: () => setBubble(null) },
          ],
        })
        return
      }
      if (pet.asleep) return

      const need = urgentNeed(pet)
      if (need && now - c.urgent > 12 * MIN * f) {
        c.urgent = now
        say(need)
        return
      }
      if (settings.drinkReminders && now - c.drink > 45 * MIN * f) {
        c.drink = now
        say('drinkAsk', {
          actions: [
            { label: '💧 Napito!', onClick: () => doAction('drink') },
            { label: 'Teď ne', ghost: true, onClick: () => setBubble(null) },
          ],
        })
        return
      }
      if (settings.drinkReminders && now - c.stretch > 60 * MIN * f) {
        c.stretch = now
        say('stretch', { ms: 8000 })
        return
      }
      if (now - c.idle > 8 * MIN * f) {
        c.idle = now
        say('idle')
      }
    }, 15_000)
    return () => clearInterval(id)
  }, [])

  // Pozdrav při startu (jen jednou, ne po vylíhnutí).
  useEffect(() => {
    const id = setTimeout(() => {
      if (stateRef.current.settings.hatched && !stateRef.current.bubble) stateRef.current.say('hello')
    }, 1400)
    return () => clearTimeout(id)
  }, [])

  // ---------- onboarding ----------
  const hatch = () => {
    reset()
    setSettings((s) => ({ ...s, hatched: true }))
    flash('happy', 2000)
    say('hatch', {
      input: {
        placeholder: 'Jméno parťáka',
        onSubmit: (name) => {
          setSettings((s) => ({ ...s, name }))
          setBubble(null)
          setTimeout(
            () => say('named', { text: line('kamarad', 'named', { name }), ms: 7000 }),
            50,
          )
        },
      },
    })
  }

  const restart = () => {
    setPanel(null)
    setBubble(null)
    setSettings((s) => ({ ...DEFAULT_SETTINGS, look: s.look }))
    reset()
  }

  // Panel se otevře vedle avatara na tu stranu, kde je víc místa.
  const [panelStyle, setPanelStyle] = useState({ right: 16 })
  const openPanel = (which) => {
    const r = motion.rect()
    if (r) {
      setPanelStyle(
        r.x + size / 2 > window.innerWidth / 2
          ? { left: Math.max(8, r.x - PANEL_W - 12) }
          : { left: Math.min(window.innerWidth - PANEL_W - 8, r.x + size + 12) },
      )
    }
    setMenuOpen(false)
    setPanel(which)
  }

  const emotion =
    activity === 'happy' || activity === 'eat'
      ? 'joy'
      : activity === 'grabbed'
        ? 'surprised'
        : emotionOf(pet)

  return (
    <div className={'stage' + (isDesktop ? '' : ' preview')}>
      {!isDesktop && <PreviewDesktop />}

      {!settings.hatched ? (
        <Egg onHatch={hatch} />
      ) : (
        <>
          <div
            ref={motion.rigRef}
            className={`rig mode-${motion.mode} emo-${emotion}${activity ? ` act-${activity}` : ''}`}
            style={{ width: size, height, '--lid': settings.look.body }}
          >
            {bubble && !menuOpen && (
              <div className="popup-anchor">
                <Bubble key={bubble.text} bubble={bubble} onDismiss={() => setBubble(null)} />
              </div>
            )}
            {menuOpen && (
              <div className="popup-anchor">
                <CareMenu
                  pet={pet}
                  name={settings.name || 'Parťák'}
                  onAction={doAction}
                  onOpenPanel={openPanel}
                  onClose={() => setMenuOpen(false)}
                />
              </div>
            )}
            {hearts.map((h) => (
              <span key={h.id} className="heart" style={{ '--dx': `${h.dx}px`, animationDelay: `${h.delay}ms` }}>
                💗
              </span>
            ))}
            <div
              className="avatar"
              data-hit
              style={{ transform: `scaleX(${motion.facing})`, '--facing': motion.facing }}
              {...motion.handlers}
              onPointerMove={(e) => {
                motion.handlers.onPointerMove(e)
                onHover(e)
              }}
              onPointerLeave={onLeave}
              title={settings.name || 'Parťák'}
            >
              <Blob look={settings.look} emotion={emotion} activity={activity} />
            </div>
          </div>

          {motion.hasBall && (
            <div ref={motion.ballRef} className="ball" aria-hidden="true">🎾</div>
          )}

          {panel === 'wardrobe' && (
            <Wardrobe
              look={settings.look}
              style={panelStyle}
              onChange={(look) => setSettings((s) => ({ ...s, look }))}
              onClose={() => setPanel(null)}
            />
          )}
          {panel === 'settings' && (
            <Settings
              settings={settings}
              paused={pet.paused}
              style={panelStyle}
              onChange={setSettings}
              onTogglePause={() => doAction('pause')}
              onReset={restart}
              onClose={() => setPanel(null)}
            />
          )}
        </>
      )}
    </div>
  )
}

/** V prohlížeči ukážeme falešnou plochu, ať je vidět, jak Parťák žije nad okny. */
function PreviewDesktop() {
  return (
    <div className="fake-desktop" aria-hidden="true">
      <div className="fake-window" style={{ left: '8%', top: '10%', width: '46%', height: '52%' }}>
        <div className="fake-bar"><i /><i /><i /> Dokument.docx</div>
        <div className="fake-lines"><b /><b /><b /><b style={{ width: '60%' }} /></div>
      </div>
      <div className="fake-window" style={{ left: '50%', top: '22%', width: '38%', height: '44%' }}>
        <div className="fake-bar"><i /><i /><i /> Prohlížeč</div>
        <div className="fake-lines"><b /><b style={{ width: '80%' }} /><b /></div>
      </div>
      <div className="preview-note">
        Náhled v prohlížeči · na ploše spusť <code>npm run desktop</code>
      </div>
    </div>
  )
}
