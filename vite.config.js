import { defineConfig } from 'vite'
import { createHash, createHmac, randomUUID } from 'node:crypto'

const ADMIN_USER = 'Freddy'
const ADMIN_PASSWORD_HASH = '8f9986d2e6e6f358c101069f5831bac6ae234b7899b0727847c70df192f766d0'
const SESSION_KEY = '3ce61449468b003059f8aaabe9db37bba04b813d9fa8b38c312603314209d92f'

const localAdminApi = () => {
  const orders = []
  const views = []
  const send = (res, status, data, headers = {}) => {
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers })
    res.end(JSON.stringify(data))
  }
  const body = (req) => new Promise((resolve) => {
    let raw = ''
    req.on('data', (chunk) => { raw += chunk })
    req.on('end', () => { try { resolve(JSON.parse(raw || '{}')) } catch { resolve({}) } })
  })
  const cookies = (req) => Object.fromEntries((req.headers.cookie || '').split(';').map((part) => part.trim().split('=')).filter(([key]) => key).map(([key, value]) => [key, decodeURIComponent(value || '')]))
  const signature = (value) => createHmac('sha256', SESSION_KEY).update(value).digest('hex')
  const isAdmin = (req) => {
    const [user, expires, token] = (cookies(req).dumah_admin || '').split('.')
    return user === ADMIN_USER && Number(expires) >= Date.now() && token === signature(`${user}.${expires}`)
  }

  return {
    name: 'dumah-local-admin-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost')
        if (!url.pathname.startsWith('/api/')) return next()

        if (url.pathname === '/api/admin/login' && req.method === 'POST') {
          const data = await body(req)
          const passwordHash = createHash('sha256').update(String(data.password || '')).digest('hex')
          if (data.username !== ADMIN_USER || passwordHash !== ADMIN_PASSWORD_HASH) return send(res, 401, { error: 'Benutzername oder Passwort ist falsch.' })
          const expires = Date.now() + 8 * 60 * 60 * 1000
          const value = `${ADMIN_USER}.${expires}`
          return send(res, 200, { ok: true }, { 'set-cookie': `dumah_admin=${encodeURIComponent(`${value}.${signature(value)}`)}; Max-Age=28800; Path=/; HttpOnly; SameSite=Strict` })
        }
        if (url.pathname === '/api/admin/logout' && req.method === 'POST') return send(res, 200, { ok: true }, { 'set-cookie': 'dumah_admin=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict' })
        if (url.pathname === '/api/admin/dashboard' && req.method === 'GET') {
          if (!isAdmin(req)) return send(res, 401, { error: 'Nicht autorisiert' })
          const pages = Object.entries(views.reduce((result, view) => ({ ...result, [view.path]: (result[view.path] || 0) + 1 }), {})).map(([path, count]) => ({ path, views: count })).sort((a, b) => b.views - a.views)
          const daily = Object.entries(views.reduce((result, view) => ({ ...result, [view.day]: (result[view.day] || 0) + 1 }), {})).map(([day, count]) => ({ day, views: count, visitors: count })).sort((a, b) => a.day.localeCompare(b.day))
          return send(res, 200, { orders, totals: { orders: orders.length, revenue_cents: orders.reduce((sum, order) => sum + order.total_cents, 0), visitors: views.length, views: views.length }, pages, daily })
        }
        if (url.pathname === '/api/analytics/view' && req.method === 'POST') {
          const data = await body(req)
          views.push({ path: typeof data.path === 'string' ? data.path : '/', day: new Date().toISOString().slice(0, 10) })
          return send(res, 200, { ok: true })
        }
        if (url.pathname === '/api/orders' && req.method === 'POST') {
          const data = await body(req)
          const order = { id: `DEV-${randomUUID().slice(0, 8).toUpperCase()}`, created_at: new Date().toISOString(), customer_name: `${data.first || ''} ${data.last || ''}`.trim(), email: data.email || '', address: `${data.street || ''}, ${data.zip || ''} ${data.city || ''}`, country: data.country || '', size: data.size || '', shipping: data.shipping || 'standard', total_cents: data.shipping === 'express' ? 8989 : 7999, status: 'payment_pending' }
          orders.unshift(order)
          return send(res, 201, { ok: true, id: order.id, status: order.status })
        }
        return send(res, 404, { error: 'Not found' })
      })
    },
  }
}

export default defineConfig({
  plugins: [localAdminApi()],
  build: {
    outDir: 'dist/client',
    rollupOptions: {
      input: {
        shop: 'index.html',
        information: 'checkout/index.html',
        shipping: 'checkout/shipping.html',
        payment: 'checkout/payment.html',
        admin: 'admin/index.html',
      },
    },
  },
})
