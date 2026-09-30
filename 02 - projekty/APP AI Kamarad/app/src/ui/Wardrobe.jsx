import { useState } from 'react'

import {
  ACCESSORIES,
  DEFAULT_LOOK,
  EARS,
  EYES,
  HATS,
  PALETTE,
  PATTERNS,
  SIZES,
  decodeLook,
  encodeLook,
} from '../avatar/catalog.js'

const COLOR_FIELDS = [
  ['body', 'Tělo'],
  ['accent', 'Doplňky'],
  ['cheeks', 'Tvářičky'],
]

const PART_FIELDS = [
  ['eyes', 'Oči', EYES],
  ['hat', 'Na hlavu', HATS],
  ['ears', 'Uši a růžky', EARS],
  ['accessory', 'Doplněk', ACCESSORIES],
  ['pattern', 'Vzor', PATTERNS],
  ['size', 'Velikost', SIZES],
]

const randomOf = (obj) => {
  const keys = Object.keys(obj)
  return keys[Math.floor(Math.random() * keys.length)]
}
const randomColor = () => PALETTE[Math.floor(Math.random() * PALETTE.length)]

export default function Wardrobe({ look, onChange, onClose, style }) {
  const [code, setCode] = useState('')
  const [codeMsg, setCodeMsg] = useState('')
  const set = (key, value) => onChange({ ...look, [key]: value })

  const randomize = () =>
    onChange({
      body: randomColor(),
      accent: randomColor(),
      cheeks: randomColor(),
      eyes: randomOf(EYES),
      hat: randomOf(HATS),
      ears: randomOf(EARS),
      accessory: randomOf(ACCESSORIES),
      pattern: randomOf(PATTERNS),
      size: look.size,
    })

  const copyCode = async () => {
    const c = encodeLook(look)
    try {
      await navigator.clipboard.writeText(c)
      setCodeMsg('Kód zkopírován — pošli ho kamarádům!')
    } catch {
      setCode(c)
      setCodeMsg('Zkopíruj si kód z pole níže.')
    }
  }

  const importCode = () => {
    const imported = decodeLook(code)
    if (imported) {
      onChange(imported)
      setCodeMsg('Vzhled načten ✨')
    } else {
      setCodeMsg('Tenhle kód nefunguje.')
    }
  }

  return (
    <div className="panel" data-hit style={style} onPointerDown={(e) => e.stopPropagation()}>
      <div className="panel-head">
        <h2>👕 Šatník</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Zavřít">✕</button>
      </div>
      <div className="panel-body">
        {COLOR_FIELDS.map(([key, label]) => (
          <section key={key}>
            <h3>{label}</h3>
            <div className="swatches">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  className={'swatch' + (look[key] === c ? ' on' : '')}
                  style={{ background: c }}
                  onClick={() => set(key, c)}
                  aria-label={c}
                />
              ))}
              <label className="swatch custom" title="Vlastní barva">
                <input type="color" value={look[key]} onChange={(e) => set(key, e.target.value)} />
                🎨
              </label>
            </div>
          </section>
        ))}

        {PART_FIELDS.map(([key, label, options]) => (
          <section key={key}>
            <h3>{label}</h3>
            <div className="chips">
              {Object.entries(options).map(([value, text]) => (
                <button
                  key={value}
                  className={'chip' + (look[key] === value ? ' on' : '')}
                  onClick={() => set(key, value)}
                >
                  {text}
                </button>
              ))}
            </div>
          </section>
        ))}

        <section>
          <h3>Kód avatara</h3>
          <div className="row">
            <button onClick={copyCode}>📋 Zkopírovat můj kód</button>
            <button className="ghost" onClick={randomize}>🎲 Náhodně</button>
            <button className="ghost" onClick={() => onChange(DEFAULT_LOOK)}>↺ Výchozí</button>
          </div>
          <div className="row">
            <input
              placeholder="PARTAK-… vlož kód kamaráda"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button onClick={importCode} disabled={!code.trim()}>Načíst</button>
          </div>
          {codeMsg && <p className="hint">{codeMsg}</p>}
        </section>
      </div>
    </div>
  )
}
