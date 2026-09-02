async function request(path, options) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Chyba (${res.status})`)
  return data
}

export const getConfig = () => request('/api/config')
export const saveKey = (key) =>
  request('/api/config', { method: 'POST', body: JSON.stringify({ key }) })
export const generatePlan = (system, prompt) =>
  request('/api/generate-plan', { method: 'POST', body: JSON.stringify({ system, prompt }) })
