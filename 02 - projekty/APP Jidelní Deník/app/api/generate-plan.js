// Vercel serverless function — same contract as server/index.js's
// /api/generate-plan route used in local dev. Reads the key from the
// project's environment variables (Vercel dashboard → Settings →
// Environment Variables), never from the client.

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-5'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const key = process.env.ANTHROPIC_API_KEY || ''
  if (!key) {
    return res.status(401).json({ error: 'Anthropic API klíč není nastavený (env var ANTHROPIC_API_KEY).' })
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
    res.status(200).json({ text })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message || 'Neznámá chyba.' })
  }
}
