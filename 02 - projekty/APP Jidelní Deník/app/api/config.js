// Vercel serverless function — read-only counterpart to server/index.js's
// /api/config route. Serverless functions can't persist writes to disk
// (no server/.env here), so saving a key must be done via the Vercel
// dashboard (Settings → Environment Variables → ANTHROPIC_API_KEY) instead.

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const key = process.env.ANTHROPIC_API_KEY || ''
    return res.status(200).json({
      configured: Boolean(key),
      keyPreview: key ? `${key.slice(0, 7)}...${key.slice(-4)}` : null,
    })
  }

  if (req.method === 'POST') {
    return res.status(400).json({
      error:
        'V produkci (Vercel) nejde klíč uložit z appky. Nastav ho ve Vercel → Settings → Environment Variables jako ANTHROPIC_API_KEY a appku znovu nasaď.',
    })
  }

  res.setHeader('Allow', 'GET, POST')
  res.status(405).json({ error: 'Method not allowed' })
}
