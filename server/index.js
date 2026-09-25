import { customerTemplate, decryptSecret, encryptSecret, internalTemplate, logNotification, readSettings, saveSettings, sendEmail, sendTelegram } from './notifications.js'

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
const cookies = (request) => Object.fromEntries((request.headers.get('cookie') || '').split(';').flatMap((part) => {
  const separator = part.indexOf('=')
  if (separator < 1) return []
  try {
    return [[decodeURIComponent(part.slice(0, separator).trim()), decodeURIComponent(part.slice(separator + 1))]]
  } catch {
    return []
  }
}))
const isAdmin = async (request) => {
  const token = cookies(request).dumah_admin
  if (!token) return false
  const [user, expires, signature] = token.split('.')
  if (user !== ADMIN_USER || Number(expires) < Date.now()) return false
  return signature === await hmac(`${user}.${expires}`)
}

async function handleApi(request, env, url) {
  if (!env.DB) return json({ error: 'Database unavailable' }, 503)

  if (url.pathname === '/api/order-status' && request.method === 'GET') {
    const id = String(url.searchParams.get('order') || '').trim().toUpperCase()
    if (!/^DE-[A-Z0-9]+-[A-Z0-9]{4}$/.test(id)) return json({ error: 'Bitte gib eine gültige Bestellnummer ein.' }, 400)
    const order = await env.DB.prepare('SELECT id, created_at, status, shipping, tracking_number, shipped_at, canceled_at FROM orders WHERE id = ?').bind(id).first()
    if (!order) return json({ error: 'Zu dieser Bestellnummer wurde keine Bestellung gefunden.' }, 404)
    return json({
      order: order.id, created_at: order.created_at, status: order.status, shipping: order.shipping,
      tracking_number: order.tracking_number || '', shipped_at: order.shipped_at || '', canceled_at: order.canceled_at || '',
    })
  }

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
    const order = { id, created_at: new Date().toISOString(), customer_name: `${body.first.trim()} ${body.last.trim()}`, email: body.email.trim(), address: `${body.street.trim()}, ${body.zip.trim()} ${body.city.trim()}`, country: body.country.trim(), size: body.size.trim(), shipping: body.shipping, total_cents: totalCents, status: 'payment_pending' }
    await env.DB.prepare('INSERT INTO orders (id, created_at, customer_name, email, address, country, size, shipping, total_cents, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, order.created_at, order.customer_name, order.email, order.address, order.country, order.size, order.shipping, order.total_cents, order.status).run()
    const settings = await readSettings(env.DB)
    const recipients = (settings.notification_emails || '').split(',').map((item) => item.trim()).filter(Boolean)
    if (recipients.length) {
      try { await sendEmail(env, { ...internalTemplate(order), to: recipients }); await logNotification(env.DB, id, 'email', 'new_order', recipients.join(', '), 'sent') }
      catch (error) { await logNotification(env.DB, id, 'email', 'new_order', recipients.join(', '), 'failed', error.message) }
    }
    if (settings.telegram_enabled === 'true' && settings.telegram_token && settings.telegram_chat_id) {
      try { const token = await decryptSecret(settings.telegram_token, env.CONFIG_ENCRYPTION_KEY); await sendTelegram(token, settings.telegram_chat_id, `<b>Neue DUMAH Bestellung</b>\n${id}\n${order.customer_name}\n${order.size} · ${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totalCents / 100)}`); await logNotification(env.DB, id, 'telegram', 'new_order', settings.telegram_chat_id, 'sent') }
      catch (error) { await logNotification(env.DB, id, 'telegram', 'new_order', settings.telegram_chat_id, 'failed', error.message) }
    }
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
      env.DB.prepare('SELECT id, created_at, customer_name, email, address, country, size, shipping, total_cents, status, invoice_number, tracking_number, shipped_at, canceled_at FROM orders ORDER BY created_at DESC LIMIT 100').all(),
      env.DB.prepare("SELECT COUNT(*) AS orders, COALESCE(SUM(total_cents), 0) AS revenue_cents FROM orders").first(),
      env.DB.prepare('SELECT path, COUNT(*) AS views FROM page_views GROUP BY path ORDER BY views DESC LIMIT 20').all(),
      env.DB.prepare("SELECT day, COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors FROM page_views WHERE day >= date('now', '-13 days') GROUP BY day ORDER BY day ASC").all(),
    ])
    const visitors = await env.DB.prepare('SELECT COUNT(DISTINCT visitor_id) AS visitors FROM page_views').first()
    const views = await env.DB.prepare('SELECT COUNT(*) AS views FROM page_views').first()
    const settings = await readSettings(env.DB)
    return json({ orders: orders.results, totals: { ...totals, ...visitors, ...views }, pages: pages.results, daily: daily.results, settings: { notification_emails: settings.notification_emails || '', telegram_chat_id: settings.telegram_chat_id || '', telegram_enabled: settings.telegram_enabled === 'true', telegram_configured: Boolean(settings.telegram_token), tax_id: settings.tax_id || '', vat_rate: settings.vat_rate || '19', mail_configured: Boolean(env.RESEND_API_KEY && env.MAIL_FROM) } })
  }

  if (url.pathname === '/api/admin/settings' && request.method === 'PUT') {
    if (!await isAdmin(request)) return json({ error: 'Nicht autorisiert' }, 401)
    const body = await request.json().catch(() => ({}))
    const emails = String(body.notification_emails || '').split(',').map((item) => item.trim()).filter(Boolean)
    if (emails.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return json({ error: 'Ungültige Benachrichtigungsadresse' }, 400)
    const values = { notification_emails: emails.join(', '), telegram_chat_id: String(body.telegram_chat_id || '').trim(), telegram_enabled: body.telegram_enabled ? 'true' : 'false', tax_id: String(body.tax_id || '').trim(), vat_rate: String(Number(body.vat_rate) || 19) }
    if (body.telegram_token) values.telegram_token = await encryptSecret(String(body.telegram_token).trim(), env.CONFIG_ENCRYPTION_KEY)
    await saveSettings(env.DB, values)
    return json({ ok: true, telegram_configured: Boolean(values.telegram_token || (await readSettings(env.DB)).telegram_token) })
  }

  if (url.pathname === '/api/admin/telegram/test' && request.method === 'POST') {
    if (!await isAdmin(request)) return json({ error: 'Nicht autorisiert' }, 401)
    const settings = await readSettings(env.DB)
    if (!settings.telegram_token || !settings.telegram_chat_id) return json({ error: 'Telegram ist nicht vollständig konfiguriert' }, 400)
    const token = await decryptSecret(settings.telegram_token, env.CONFIG_ENCRYPTION_KEY)
    await sendTelegram(token, settings.telegram_chat_id, '<b>DUMAH Administration</b>\nTelegram-Verbindung erfolgreich.')
    return json({ ok: true })
  }

  const actionMatch = url.pathname.match(/^\/api\/admin\/orders\/([^/]+)\/([^/]+)$/)
  if (actionMatch && request.method === 'POST') {
    if (!await isAdmin(request)) return json({ error: 'Nicht autorisiert' }, 401)
    const [, id, action] = actionMatch.map(decodeURIComponent)
    const order = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first()
    if (!order) return json({ error: 'Bestellung nicht gefunden' }, 404)
    const settings = await readSettings(env.DB)
    const body = await request.json().catch(() => ({}))
    let event; let status; let extra = {}
    if (action === 'confirm') { event = 'confirmation'; status = 'confirmed' }
    else if (action === 'invoice') {
      if (!settings.tax_id) return json({ error: 'Steuernummer oder USt-ID fehlt in den Einstellungen' }, 400)
      event = 'invoice'; status = order.status === 'payment_pending' ? 'confirmed' : order.status
      const year = new Date().getFullYear(); const invoiceNumber = order.invoice_number || `RE-${year}-${String(Date.now()).slice(-6)}`
      const vatRate = Number(settings.vat_rate || 19); const netCents = Math.round(order.total_cents / (1 + vatRate / 100))
      extra = { invoiceNumber, invoiceDate: new Intl.DateTimeFormat('de-DE').format(new Date()), vatRate, netCents, vatCents: order.total_cents - netCents, taxId: settings.tax_id }
      await env.DB.prepare('UPDATE orders SET invoice_number = ?, status = ? WHERE id = ?').bind(invoiceNumber, status, id).run()
    } else if (action === 'ship') { event = 'shipping'; status = 'shipped'; extra = { tracking: String(body.tracking || '').trim() }; await env.DB.prepare('UPDATE orders SET tracking_number = ?, shipped_at = ?, status = ? WHERE id = ?').bind(extra.tracking, new Date().toISOString(), status, id).run() }
    else if (action === 'cancel') { event = 'cancellation'; status = 'canceled'; await env.DB.prepare('UPDATE orders SET canceled_at = ?, status = ? WHERE id = ?').bind(new Date().toISOString(), status, id).run() }
    else return json({ error: 'Unbekannte Aktion' }, 400)
    if (!['invoice', 'ship', 'cancel'].includes(action)) await env.DB.prepare('UPDATE orders SET status = ? WHERE id = ?').bind(status, id).run()
    try { await sendEmail(env, { ...customerTemplate(event, order, extra), to: order.email }); await logNotification(env.DB, id, 'email', event, order.email, 'sent') }
    catch (error) { await logNotification(env.DB, id, 'email', event, order.email, 'failed', error.message); return json({ error: error.message }, 502) }
    if (settings.telegram_enabled === 'true' && settings.telegram_token && settings.telegram_chat_id && ['shipping', 'cancellation'].includes(event)) {
      try { const token = await decryptSecret(settings.telegram_token, env.CONFIG_ENCRYPTION_KEY); await sendTelegram(token, settings.telegram_chat_id, `<b>DUMAH ${event === 'shipping' ? 'Versand' : 'Storno'}</b>\n${id}\n${order.customer_name}`); await logNotification(env.DB, id, 'telegram', event, settings.telegram_chat_id, 'sent') } catch (error) { await logNotification(env.DB, id, 'telegram', event, settings.telegram_chat_id, 'failed', error.message) }
    }
    return json({ ok: true, status, ...extra })
  }

  return json({ error: 'Not found' }, 404)
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    try {
      if (url.pathname.startsWith('/api/')) return await handleApi(request, env, url)
      return await env.ASSETS.fetch(request)
    } catch (error) {
      console.error('Request failed', { method: request.method, path: url.pathname, error: error instanceof Error ? error.message : String(error) })
      if (url.pathname.startsWith('/api/')) return json({ error: 'Der Server konnte die Anfrage nicht verarbeiten. Bitte lade die Seite neu.' }, 500)
      return new Response('Server Error', { status: 500, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } })
    }
  },
}
