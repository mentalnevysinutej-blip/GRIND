import { useState } from 'react'

const TAPS = 3

/** Onboarding: vajíčko. Tři ťuknutí a vylíhne se parťák. */
export default function Egg({ onHatch }) {
  const [taps, setTaps] = useState(0)
  const [wobble, setWobble] = useState(0)

  const tap = () => {
    const next = taps + 1
    setTaps(next)
    setWobble((w) => w + 1)
    if (next >= TAPS) setTimeout(onHatch, 450)
  }

  return (
    <div className="egg-wrap">
      <div className="popup bubble egg-hint" data-hit>
        <p>{taps === 0 ? 'Něco se tu hýbe… ťukni na vajíčko!' : taps < TAPS ? 'Ještě!' : 'Líhne se! 🐣'}</p>
      </div>
      <button
        key={wobble}
        className={'egg' + (taps >= TAPS ? ' hatching' : '') + (wobble ? ' wobble' : '')}
        onClick={tap}
        data-hit
        aria-label="Ťuknout na vajíčko"
      >
        <svg viewBox="0 0 100 120" aria-hidden="true">
          <path d="M50 4C76 4 94 50 94 76c0 26-20 40-44 40S6 102 6 76C6 50 24 4 50 4Z" fill="#fff6e5" stroke="#d9c49a" strokeWidth="3" />
          <circle cx="32" cy="50" r="6" fill="#ffd95e" />
          <circle cx="66" cy="36" r="5" fill="#7c9cff" />
          <circle cx="70" cy="80" r="7" fill="#ff8fb1" />
          <circle cx="36" cy="92" r="4" fill="#7ee2a8" />
          {taps >= 1 && <path d="M38 60l8 8-6 6 10 8" stroke="#a88c5a" strokeWidth="2.5" fill="none" />}
          {taps >= 2 && <path d="M60 52l-6 10 8 4-4 10" stroke="#a88c5a" strokeWidth="2.5" fill="none" />}
        </svg>
      </button>
    </div>
  )
}
