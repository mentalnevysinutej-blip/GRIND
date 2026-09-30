import { useId } from 'react'

import { shade } from './catalog.js'

// Blob-tvor jako SVG. Placeholder, než dorazí finální grafika v Rive —
// ale struktura (vrstvy, kotevní body, barevné tokeny) je stejná.
//
// Souřadnice: tělo zabírá cca 10..110 × 16..112, nad ním je místo na uši a čepice.
export const VIEWBOX = { x: -12, y: -34, w: 144, h: 154 }

const INK = '#1d2340'
const BODY_PATH =
  'M60 16C94 16 110 46 110 78c0 24-20 34-50 34S10 102 10 78C10 46 26 16 60 16Z'

export default function Blob({ look, emotion = 'neutral', activity = null }) {
  const clipId = useId()
  const outline = shade(look.body, -0.38)
  const face = activity === 'eat' ? 'eat' : emotion

  return (
    <svg
      className="blob-svg"
      viewBox={`${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={BODY_PATH} />
        </clipPath>
      </defs>

      <Ears kind={look.ears} body={look.body} outline={outline} accent={look.accent} />

      <g className="blob-feet">
        <ellipse className="foot foot-l" cx="40" cy="110" rx="12" ry="6.5" fill={outline} />
        <ellipse className="foot foot-r" cx="80" cy="110" rx="12" ry="6.5" fill={outline} />
      </g>

      <path d={BODY_PATH} fill={look.body} stroke={outline} strokeWidth="3.5" />
      <g clipPath={`url(#${clipId})`}>
        <Pattern kind={look.pattern} body={look.body} />
        {emotion === 'sick' && <rect x="0" y="10" width="120" height="110" fill="#8fdc8f" opacity="0.28" />}
      </g>
      <ellipse cx="38" cy="36" rx="11" ry="6" fill="#fff" opacity="0.35" transform="rotate(-32 38 36)" />

      <g className="blob-cheeks" opacity={emotion === 'happy' || emotion === 'joy' ? 0.85 : 0.6}>
        <ellipse cx="31" cy="79" rx="8.5" ry="4.8" fill={look.cheeks} />
        <ellipse cx="89" cy="79" rx="8.5" ry="4.8" fill={look.cheeks} />
      </g>

      <Brows emotion={emotion} />
      <g className="blob-look">
        <Eyes kind={look.eyes} emotion={face} />
      </g>
      <Mouth emotion={face} />

      <Accessory kind={look.accessory} accent={look.accent} />
      <Hat kind={look.hat} accent={look.accent} />

      {emotion === 'sick' && (
        <path className="sweat" d="M104 40q6 9 0 13q-6-4 0-13Z" fill="#7fd0ff" stroke="#3a8fc4" strokeWidth="1.5" />
      )}
      {emotion === 'sleep' && (
        <g className="zzz" fill={INK} fontWeight="800" fontFamily="system-ui, sans-serif">
          <text x="100" y="8" fontSize="14">z</text>
          <text x="110" y="-6" fontSize="18">Z</text>
        </g>
      )}
    </svg>
  )
}

function Eyes({ kind, emotion }) {
  if (emotion === 'sleep') {
    return (
      <g stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round">
        <path d="M35 64q8 7 16 0" />
        <path d="M69 64q8 7 16 0" />
      </g>
    )
  }
  // Zavřené očička „^^“ jen při chvilkové radosti — jinak jsou vidět zvolené oči.
  if (emotion === 'joy' || emotion === 'eat') {
    return (
      <g stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round">
        <path d="M35 67q8-10 16 0" />
        <path d="M69 67q8-10 16 0" />
      </g>
    )
  }
  const sleepy = kind === 'ospale' || emotion === 'tired' || emotion === 'sick'
  return (
    <g className="blob-eyes">
      {[43, 77].map((cx) => (
        <g key={cx}>
          {kind === 'tecky' ? (
            <ellipse cx={cx} cy="64" rx="5" ry="6" fill={INK} />
          ) : kind === 'hvezdicky' ? (
            <>
              <ellipse cx={cx} cy="64" rx="9" ry="10" fill={INK} />
              <path
                d={star(cx, 64, 6, 2.6)}
                fill="#ffe066"
              />
            </>
          ) : kind === 'velke' ? (
            <>
              <ellipse cx={cx} cy="63" rx="11" ry="13" fill={INK} />
              <circle cx={cx + 3} cy="58" r="4.5" fill="#fff" />
              <circle cx={cx - 4} cy="68" r="2" fill="#fff" />
            </>
          ) : (
            <>
              <ellipse cx={cx} cy="64" rx="7.5" ry="9" fill={INK} />
              <circle cx={cx + 2.5} cy="60.5" r="2.8" fill="#fff" />
            </>
          )}
          {sleepy && <rect x={cx - 13} y="50" width="26" height="12" fill="var(--lid)" />}
        </g>
      ))}
    </g>
  )
}

function star(cx, cy, outer, inner) {
  const pts = []
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? inner : outer
    const a = (Math.PI / 5) * i - Math.PI / 2
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`)
  }
  return `M${pts.join('L')}Z`
}

function Brows({ emotion }) {
  if (emotion === 'sad' || emotion === 'hungry') {
    return (
      <g stroke={INK} strokeWidth="3" strokeLinecap="round">
        <path d="M34 48l14 4" />
        <path d="M86 48l-14 4" />
      </g>
    )
  }
  if (emotion === 'sick' || emotion === 'tired') {
    return (
      <g stroke={INK} strokeWidth="3" strokeLinecap="round">
        <path d="M35 51h13" />
        <path d="M72 51h13" />
      </g>
    )
  }
  return null
}

function Mouth({ emotion }) {
  const stroke = { stroke: INK, strokeWidth: 3.5, fill: 'none', strokeLinecap: 'round' }
  switch (emotion) {
    case 'happy':
    case 'joy':
      return (
        <g>
          <path d="M49 81q11 14 22 0Z" fill={INK} />
          <path d="M54 87q6 4 12 0q-6-4-12 0Z" fill="#ff7a93" />
        </g>
      )
    case 'eat':
      return (
        <g className="chomp">
          <ellipse className="chomp-open" cx="60" cy="85" rx="8" ry="7" fill={INK} />
          <path className="chomp-closed" d="M52 85h16" {...stroke} />
        </g>
      )
    case 'sad':
      return <path d="M52 89q8-8 16 0" {...stroke} />
    case 'hungry':
    case 'surprised':
      return <ellipse cx="60" cy="86" rx="6" ry="7" fill={INK} />
    case 'sleep':
      return <ellipse cx="60" cy="86" rx="3.5" ry="3" fill={INK} />
    case 'sick':
      return <path d="M49 87q3.5-4 7 0t7 0t7 0" {...stroke} />
    case 'tired':
      return <path d="M53 87h14" {...stroke} />
    default:
      return <path d="M52 83q8 7 16 0" {...stroke} />
  }
}

function Pattern({ kind, body }) {
  const light = shade(body, 0.4)
  const dark = shade(body, -0.12)
  switch (kind) {
    case 'brisko':
      return <ellipse cx="60" cy="98" rx="32" ry="20" fill={light} />
    case 'puntiky':
      return (
        <g fill={dark}>
          <circle cx="24" cy="58" r="5" />
          <circle cx="96" cy="50" r="6" />
          <circle cx="88" cy="100" r="5" />
          <circle cx="28" cy="100" r="4" />
          <circle cx="62" cy="30" r="4" />
        </g>
      )
    case 'pruhy':
      return (
        <g fill={dark}>
          <rect x="0" y="36" width="120" height="6" />
          <rect x="0" y="94" width="120" height="6" />
          <rect x="0" y="104" width="120" height="6" />
        </g>
      )
    default:
      return null
  }
}

function Ears({ kind, body, outline, accent }) {
  const common = { fill: body, stroke: outline, strokeWidth: 3.5, strokeLinejoin: 'round' }
  switch (kind) {
    case 'kocici':
      return (
        <g>
          <path d="M22 44L20 4l30 20Z" {...common} />
          <path d="M98 44l2-40-30 20Z" {...common} />
          <path d="M26 32l-1-18 13 9Z" fill="#ffb3c8" />
          <path d="M94 32l1-18-13 9Z" fill="#ffb3c8" />
        </g>
      )
    case 'kralici':
      return (
        <g>
          <ellipse cx="42" cy="0" rx="10" ry="26" transform="rotate(-12 42 0)" {...common} />
          <ellipse cx="78" cy="0" rx="10" ry="26" transform="rotate(12 78 0)" {...common} />
          <ellipse cx="42" cy="2" rx="4.5" ry="17" transform="rotate(-12 42 2)" fill="#ffb3c8" />
          <ellipse cx="78" cy="2" rx="4.5" ry="17" transform="rotate(12 78 2)" fill="#ffb3c8" />
        </g>
      )
    case 'antenky':
      return (
        <g stroke={outline} strokeWidth="3" strokeLinecap="round">
          <path d="M48 20Q42 6 36-4" fill="none" />
          <path d="M72 20Q78 6 84-4" fill="none" />
          <circle cx="36" cy="-6" r="5.5" fill={accent} />
          <circle cx="84" cy="-6" r="5.5" fill={accent} />
        </g>
      )
    case 'rohy':
      return (
        <g fill="#f3ead6" stroke="#b9a988" strokeWidth="2.5" strokeLinejoin="round">
          <path d="M36 26q-8-16 2-26q0 14 10 22Z" />
          <path d="M84 26q8-16-2-26q0 14-10 22Z" />
        </g>
      )
    default:
      return null
  }
}

function Hat({ kind, accent }) {
  const dark = shade(accent, -0.25)
  const line = { stroke: dark, strokeWidth: 2.5, strokeLinejoin: 'round' }
  switch (kind) {
    case 'kulich':
      return (
        <g>
          <path d="M24 34Q60-10 96 34Z" fill={accent} {...line} />
          <rect x="21" y="27" width="78" height="11" rx="5.5" fill={dark} />
          <circle cx="60" cy="-2" r="8" fill="#fff" stroke={dark} strokeWidth="2.5" />
        </g>
      )
    case 'koruna':
      return (
        <g>
          <path d="M36 22V0l12 11 12-15 12 15 12-11v22Z" fill="#ffd23f" stroke="#c99a00" strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="60" cy="12" r="3.5" fill="#ff5d73" />
          <circle cx="44" cy="15" r="2.5" fill="#5fd3e6" />
          <circle cx="76" cy="15" r="2.5" fill="#5fd3e6" />
        </g>
      )
    case 'ksiltovka':
      return (
        <g>
          <path d="M26 32Q60-8 94 32Z" fill={accent} {...line} />
          <path d="M66 30q34-8 48 2q-20 6-48 3Z" fill={dark} />
          <circle cx="60" cy="8" r="3" fill={dark} />
        </g>
      )
    case 'masle':
      return (
        <g transform="translate(84 20) rotate(18)">
          <path d="M0 0L-16-10v20Z" fill={accent} {...line} />
          <path d="M0 0L16-10v20Z" fill={accent} {...line} />
          <circle r="4.5" fill={dark} />
        </g>
      )
    case 'vyhonek':
      return (
        <g>
          <path d="M60 18Q58 6 62-4" stroke="#3f9a5a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <ellipse cx="52" cy="0" rx="10" ry="5.5" transform="rotate(25 52 0)" fill="#6fd08c" stroke="#3f9a5a" strokeWidth="2" />
          <ellipse cx="71" cy="-6" rx="10" ry="5.5" transform="rotate(-25 71 -6)" fill="#6fd08c" stroke="#3f9a5a" strokeWidth="2" />
        </g>
      )
    case 'cylindr':
      return (
        <g>
          <rect x="41" y="-20" width="38" height="38" rx="3" fill="#2b2d3a" />
          <rect x="41" y="8" width="38" height="7" fill={accent} />
          <ellipse cx="60" cy="19" rx="30" ry="5.5" fill="#2b2d3a" />
        </g>
      )
    default:
      return null
  }
}

function Accessory({ kind, accent }) {
  const dark = shade(accent, -0.25)
  switch (kind) {
    case 'bryle':
      return (
        <g stroke="#2b2d3a" strokeWidth="3" fill="#fff" fillOpacity="0.18">
          <circle cx="43" cy="64" r="13" />
          <circle cx="77" cy="64" r="13" />
          <path d="M56 62q4-3 8 0" fill="none" />
        </g>
      )
    case 'sala':
      return (
        <g stroke={dark} strokeWidth="2.5" strokeLinejoin="round">
          <path d="M13 90Q60 106 107 90v10Q60 116 13 100Z" fill={accent} />
          <path d="M78 102l4 16 11-2-3-17Z" fill={accent} />
        </g>
      )
    case 'sluchatka':
      return (
        <g>
          <path d="M14 62Q60-6 106 62" stroke="#2b2d3a" strokeWidth="5" fill="none" />
          <rect x="5" y="52" width="14" height="24" rx="6" fill={accent} stroke={dark} strokeWidth="2.5" />
          <rect x="101" y="52" width="14" height="24" rx="6" fill={accent} stroke={dark} strokeWidth="2.5" />
        </g>
      )
    case 'motylek':
      return (
        <g transform="translate(60 101)" stroke={dark} strokeWidth="2" strokeLinejoin="round">
          <path d="M0 0L-13-7v14Z" fill={accent} />
          <path d="M0 0L13-7v14Z" fill={accent} />
          <circle r="3.5" fill={dark} />
        </g>
      )
    default:
      return null
  }
}
