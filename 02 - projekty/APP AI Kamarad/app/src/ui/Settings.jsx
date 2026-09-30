import { useState } from 'react'

import { PERSONALITIES } from '../personality/lines.js'

export const PROACTIVITY = {
  malo: { label: 'Málo', factor: 2 },
  normal: { label: 'Normálně', factor: 1 },
  hodne: { label: 'Hodně', factor: 0.5 },
}

export default function Settings({ settings, paused, onChange, onTogglePause, onReset, onClose, style }) {
  const [confirmReset, setConfirmReset] = useState(false)
  const set = (key, value) => onChange({ ...settings, [key]: value })

  return (
    <div className="panel" data-hit style={style} onPointerDown={(e) => e.stopPropagation()}>
      <div className="panel-head">
        <h2>⚙️ Osobnost a nastavení</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Zavřít">✕</button>
      </div>
      <div className="panel-body">
        <section>
          <h3>Jméno</h3>
          <input
            value={settings.name}
            maxLength={24}
            onChange={(e) => set('name', e.target.value)}
          />
        </section>

        <section>
          <h3>Osobnost</h3>
          <div className="personalities">
            {Object.entries(PERSONALITIES).map(([key, p]) => (
              <button
                key={key}
                className={'persona' + (settings.personality === key ? ' on' : '')}
                onClick={() => set('personality', key)}
              >
                <span className="persona-emoji">{p.emoji}</span>
                <strong>{p.label}</strong>
                <small>{p.desc}</small>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3>Jak často se sám ozve</h3>
          <div className="chips">
            {Object.entries(PROACTIVITY).map(([key, p]) => (
              <button
                key={key}
                className={'chip' + (settings.proactivity === key ? ' on' : '')}
                onClick={() => set('proactivity', key)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <label className="check">
            <input
              type="checkbox"
              checked={settings.drinkReminders}
              onChange={(e) => set('drinkReminders', e.target.checked)}
            />
            Připomínat pití a protažení (pečujeme o sebe spolu)
          </label>
        </section>

        <section>
          <h3>Dovolená</h3>
          <p className="hint">Když jsi pryč, zapni dovolenou — potřeby se zmrazí.</p>
          <button onClick={onTogglePause}>{paused ? '🏖️ Ukončit dovolenou' : '🏖️ Zapnout dovolenou'}</button>
        </section>

        <section>
          <h3>Začít znovu</h3>
          {confirmReset ? (
            <div className="row">
              <button className="danger" onClick={onReset}>Ano, nové vajíčko</button>
              <button className="ghost" onClick={() => setConfirmReset(false)}>Ne</button>
            </div>
          ) : (
            <button className="ghost" onClick={() => setConfirmReset(true)}>🥚 Smazat a vylíhnout nového</button>
          )}
        </section>

        <p className="hint ai-note">
          Jsem AI parťák, ne člověk ani terapeut. Když je ti opravdu zle, zavolej
          Linku první psychické pomoci <b>116 123</b> (dospělí), Linku bezpečí <b>116 111</b> (do 26 let),
          v ohrožení života <b>112</b>.
        </p>
      </div>
    </div>
  )
}
