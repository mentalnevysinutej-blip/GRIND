import { useState } from 'react'

/** Komiksová bublina nad avatarem: text, volitelně tlačítka nebo textové pole. */
export default function Bubble({ bubble, onDismiss }) {
  const [value, setValue] = useState('')
  if (!bubble) return null

  return (
    <div
      className="popup bubble"
      data-popup
      data-hit
      role="status"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => !bubble.actions && !bubble.input && onDismiss()}
    >
      <p>{bubble.text}</p>
      {bubble.input && (
        <form
          className="bubble-form"
          onSubmit={(e) => {
            e.preventDefault()
            if (value.trim()) bubble.input.onSubmit(value.trim())
          }}
        >
          <input
            autoFocus
            maxLength={24}
            placeholder={bubble.input.placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button type="submit">OK</button>
        </form>
      )}
      {bubble.actions && (
        <div className="bubble-actions">
          {bubble.actions.map((a) => (
            <button key={a.label} className={a.ghost ? 'ghost' : ''} onClick={a.onClick}>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
