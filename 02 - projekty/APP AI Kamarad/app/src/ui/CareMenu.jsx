import { FOODS, NEEDS, NEED_LABELS, bondLevel } from '../tamagotchi/engine.js'
import { useState } from 'react'

const NEED_ICONS = { sytost: '🍎', energie: '⚡', nalada: '😊', zdravi: '❤️' }

export default function CareMenu({ pet, name, onAction, onOpenPanel, onClose }) {
  const [feeding, setFeeding] = useState(false)
  const bond = bondLevel(pet.xp)

  return (
    <div className="popup care-menu" data-popup data-hit onPointerDown={(e) => e.stopPropagation()}>
      <div className="care-head">
        <strong>{name}</strong>
        <span className="bond" title={`Do další úrovně: ${bond.toNext} XP`}>
          💞 úroveň {bond.level}
          <span className="bond-bar">
            <span style={{ width: `${Math.round(bond.progress * 100)}%` }} />
          </span>
        </span>
        <button className="icon-btn" onClick={onClose} aria-label="Zavřít">✕</button>
      </div>

      <div className="needs">
        {NEEDS.map((n) => (
          <div key={n} className="need" title={`${NEED_LABELS[n]}: ${Math.round(pet[n])} %`}>
            <span>{NEED_ICONS[n]}</span>
            <span className="need-bar">
              <span
                className={pet[n] < 25 ? 'low' : pet[n] < 50 ? 'mid' : ''}
                style={{ width: `${pet[n]}%` }}
              />
            </span>
          </div>
        ))}
      </div>

      {feeding ? (
        <div className="actions">
          {Object.entries(FOODS).map(([key, f]) => (
            <button key={key} onClick={() => { onAction('feed', key); setFeeding(false) }}>
              {f.emoji} {f.label}
            </button>
          ))}
          <button className="ghost" onClick={() => setFeeding(false)}>← zpět</button>
        </div>
      ) : (
        <div className="actions">
          <button onClick={() => setFeeding(true)} disabled={pet.asleep}>🍎 Nakrmit</button>
          <button onClick={() => onAction('drink')}>💧 Napijeme se</button>
          <button onClick={() => onAction('play')} disabled={pet.asleep}>🎾 Hrát</button>
          {pet.asleep ? (
            <button onClick={() => onAction('wake')}>☀️ Vzbudit</button>
          ) : (
            <button onClick={() => onAction('sleep')}>💤 Uspat</button>
          )}
          <button onClick={() => onAction('heal')}>🩹 Léčit</button>
          <button onClick={() => onAction('pet')}>🤗 Pomazlit</button>
        </div>
      )}

      <div className="menu-foot">
        <button className="ghost" onClick={() => onOpenPanel('wardrobe')}>👕 Šatník</button>
        <button className="ghost" onClick={() => onOpenPanel('settings')}>⚙️ Osobnost a nastavení</button>
      </div>
      {pet.paused && <div className="paused-note">🏖️ Režim dovolená — nic neubývá</div>}
    </div>
  )
}
