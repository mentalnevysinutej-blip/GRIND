import 'dotenv/config'
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ENV_PATH = path.join(__dirname, '.env')

const app = express()
app.use(express.json({ limit: '2mb' }))

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-5'

function getKey() {
  return process.env.ANTHROPIC_API_KEY || ''
}

// --- Config: allows saving the API key from the app UI without editing
// files by hand. Local, single-user dev server only — key never reaches the browser.
app.get('/api/config', (req, res) => {
  const key = getKey()
  res.json({
    configured: Boolean(key),
    keyPreview: key ? `${key.slice(0, 7)}...${key.slice(-4)}` : null,
  })
})

app.post('/api/config', (req, res) => {
  const { key } = req.body || {}
  if (!key || typeof key !== 'string' || key.trim().length < 10) {
    return res.status(400).json({ error: 'Neplatný API klíč.' })
  }
  const clean = key.trim()
  process.env.ANTHROPIC_API_KEY = clean

  let existing = ''
  try {
    existing = fs.readFileSync(ENV_PATH, 'utf8')
  } catch {
    // no .env yet
  }
  const lines = existing.split('\n').filter((l) => l && !l.startsWith('ANTHROPIC_API_KEY='))
  lines.push(`ANTHROPIC_API_KEY=${clean}`)
  fs.writeFileSync(ENV_PATH, lines.join('\n') + '\n', 'utf8')

  res.json({ ok: true })
})

app.post('/api/generate-plan', async (req, res) => {
  const key = getKey()
  if (!key) {
    return res.status(401).json({ error: 'Anthropic API klíč není nastavený.' })
  }
  const { system, prompt } = req.body || {}
  if (!prompt) return res.status(400).json({ error: 'Chybí prompt.' })

  try {
    const r = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        system,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await r.json()
    if (!r.ok) {
      return res.status(r.status).json({ error: data?.error?.message || 'Chyba Anthropic API.' })
    }
    const text = (data.content || []).map((b) => b.text || '').join('')
    res.json({ text })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message || 'Neznámá chyba.' })
  }
})

const PORT = process.env.SERVER_PORT || 5177
app.listen(PORT, () => {
  console.log(`Jídelní deník API běží na http://localhost:${PORT}`)
})
