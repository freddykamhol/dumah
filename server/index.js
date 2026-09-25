const ADMIN_USER = 'Freddy'
const ADMIN_PASSWORD_HASH = '8f9986d2e6e6f358c101069f5831bac6ae234b7899b0727847c70df192f766d0'
const SESSION_KEY = '3ce61449468b003059f8aaabe9db37bba04b813d9fa8b38c312603314209d92f'

const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
})
const bytesToHex = (bytes) => [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
const sha256 = async (value) => bytesToHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))
const hmac = async (value) => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SESSION_KEY), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return bytesToHex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)))
}
const cookies = (request) => Object.fromEntries((request.headers.get('cookie') || '').split(';').map((part) => part.trim().split('=').map(decodeURIComponent)).filter(([key]) => key))
const isAdmin = async (request) => {
  const token = cookies(request).dumah_admin
  if (!token) return false
  const [user, expires, signature] = token.split('.')
  if (user !== ADMIN_USER || Number(expires) < Date.now()) return false
  return signature === await hmac(`${user}.${expires}`)
}

async function handleApi(request, env, url) {
  if (!env.DB) return json({ error: 'Database unavailable' }, 503)

  if (url.pathname === '/api/analytics/view' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const existing = cookies(request).dumah_visitor
    const visitorId = existing || crypto.randomUUID()
    const path = typeof body.path === 'string' && body.path.startsWith('/') ? body.path.slice(0, 120) : '/'
    const now = new Date().toISOString()
    const day = now.slice(0, 10)
    await env.DB.prepare('INSERT OR IGNORE INTO page_views (day, path, visitor_id, created_at) VALUES (?, ?, ?, ?)').bind(day, path, visitorId, now).run()
    const headers = existing ? {} : { 'set-cookie': `dumah_visitor=${visitorId}; Max-Age=31536000; Path=/; SameSite=Lax; Secure` }
    return json({ ok: true }, 200, headers)
  }

  if (url.pathname === '/api/orders' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const required = ['first', 'last', 'email', 'street', 'zip', 'city', 'country', 'size', 'shipping']
    if (required.some((key) => typeof body[key] !== 'string' || !body[key].trim())) return json({ error: 'Unvollständige Bestelldaten' }, 400)
    const id = `DE-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`
    const totalCents = body.shipping === 'express' ? 8989 : 7999
    await env.DB.prepare('INSERT INTO orders (id, created_at, customer_name, email, address, country, size, shipping, total_cents, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, new Date().toISOString(), `${body.first.trim()} ${body.last.trim()}`, body.email.trim(), `${body.street.trim()}, ${body.zip.trim()} ${body.city.trim()}`, body.country.trim(), body.size.trim(), body.shipping, totalCents, 'payment_pending').run()
    return json({ ok: true, id, status: 'payment_pending' }, 201)
  }

  if (url.pathname === '/api/admin/login' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const passwordHash = await sha256(String(body.password || ''))
    if (body.username !== ADMIN_USER || passwordHash !== ADMIN_PASSWORD_HASH) return json({ error: 'Benutzername oder Passwort ist falsch.' }, 401)
    const expires = Date.now() + 8 * 60 * 60 * 1000
    const value = `${ADMIN_USER}.${expires}`
    const signature = await hmac(value)
    return json({ ok: true }, 200, { 'set-cookie': `dumah_admin=${encodeURIComponent(`${value}.${signature}`)}; Max-Age=28800; Path=/; HttpOnly; Secure; SameSite=Strict` })
  }

  if (url.pathname === '/api/admin/logout' && request.method === 'POST') {
    return json({ ok: true }, 200, { 'set-cookie': 'dumah_admin=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict' })
  }

  if (url.pathname === '/api/admin/dashboard' && request.method === 'GET') {
    if (!await isAdmin(request)) return json({ error: 'Nicht autorisiert' }, 401)
    const [orders, totals, pages, daily] = await Promise.all([
      env.DB.prepare('SELECT id, created_at, customer_name, email, address, country, size, shipping, total_cents, status FROM orders ORDER BY created_at DESC LIMIT 100').all(),
      env.DB.prepare("SELECT COUNT(*) AS orders, COALESCE(SUM(total_cents), 0) AS revenue_cents FROM orders").first(),
      env.DB.prepare('SELECT path, COUNT(*) AS views FROM page_views GROUP BY path ORDER BY views DESC LIMIT 20').all(),
      env.DB.prepare("SELECT day, COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors FROM page_views WHERE day >= date('now', '-13 days') GROUP BY day ORDER BY day ASC").all(),
    ])
    const visitors = await env.DB.prepare('SELECT COUNT(DISTINCT visitor_id) AS visitors FROM page_views').first()
    const views = await env.DB.prepare('SELECT COUNT(*) AS views FROM page_views').first()
    return json({ orders: orders.results, totals: { ...totals, ...visitors, ...views }, pages: pages.results, daily: daily.results })
  }

  return json({ error: 'Not found' }, 404)
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api/')) return handleApi(request, env, url)
    return env.ASSETS.fetch(request)
  },
}
