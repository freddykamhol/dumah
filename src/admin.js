import './admin.css'
import './admin-workflow.css'

const root = document.querySelector('#admin')
const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
const money = (cents) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100)
const date = (value) => new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
const statusLabel = { payment_pending: 'Zahlung offen', confirmed: 'Bestätigt', shipped: 'Versendet', canceled: 'Storniert' }

const api = async (url, options) => {
  const response = await fetch(url, options)
  const payload = await response.json().catch(() => ({ error: 'Der Server hat keine gültige Antwort geliefert.' }))
  return { response, payload }
}

const workflow = (order) => {
  const canceled = order.status === 'canceled'
  const active = order.status === 'shipped' ? 3 : order.status === 'confirmed' ? 2 : 1
  const steps = canceled ? [['Bestellung', true], ['Storniert', true]] : [['Eingegangen', active >= 1], ['Bestätigt', active >= 2], ['Versendet', active >= 3]]
  return `<div class="order-workflow ${canceled ? 'is-canceled' : ''}" aria-label="Bestellstatus">${steps.map(([label, done], index) => `<span class="${done ? 'is-done' : ''}"><i>${done ? '✓' : index + 1}</i>${label}</span>`).join('')}</div>`
}

const login = () => {
  root.innerHTML = `<main class="login"><form><span>DUMAH / ADMINISTRATION</span><h1>Interner<br><em>Zugang.</em></h1><label>Benutzername<input name="username" autocomplete="username" required></label><label>Passwort<input name="password" type="password" autocomplete="current-password" required></label><button type="submit">Anmelden <b>→</b></button><p role="alert"></p></form></main>`
  root.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault(); const button = event.currentTarget.querySelector('button'); const error = event.currentTarget.querySelector('p'); button.disabled = true
    const { response, payload } = await api('/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) }).catch(() => ({ response: null, payload: { error: 'Der Server ist derzeit nicht erreichbar.' } }))
    button.disabled = false
    if (!response?.ok) { error.textContent = payload.error || 'Die Anmeldung ist fehlgeschlagen.'; return }
    dashboard()
  })
}

const orderActions = (order) => `<div class="order-actions" data-order="${esc(order.id)}">${order.status === 'payment_pending' ? '<button data-action="confirm">Bestätigen</button>' : ''}${!order.invoice_number && order.status !== 'canceled' ? '<button data-action="invoice">Rechnung senden</button>' : ''}${order.status !== 'shipped' && order.status !== 'canceled' ? '<button data-action="ship">Versenden</button>' : ''}${order.status !== 'canceled' ? '<button class="danger" data-action="cancel">Stornieren</button>' : ''}</div>`

const dashboard = async () => {
  const { response, payload } = await api('/api/admin/dashboard').catch(() => ({ response: null, payload: { error: 'Der Server ist derzeit nicht erreichbar.' } }))
  if (!response) { root.innerHTML = `<p class="fatal">${esc(payload.error)}</p>`; return }
  if (response.status === 401) { login(); return }
  if (!response.ok) { root.innerHTML = `<p class="fatal">${esc(payload.error || 'Dashboard konnte nicht geladen werden.')}</p>`; return }
  const data = payload; const max = Math.max(1, ...data.daily.map((item) => item.views)); const s = data.settings
  root.innerHTML = `<header><a href="/">DUMAH<small>ADMINISTRATION</small></a><button class="logout">Abmelden</button></header><main class="dashboard"><div class="intro"><span>INTERN / LIVE-DATEN</span><h1>Kontrollraum.</h1><p>Bestellungen, Benachrichtigungen und Seitenaktivität.</p></div><section class="metrics"><article><span>Bestellungen</span><strong>${data.totals.orders}</strong></article><article><span>Bestellwert</span><strong>${money(data.totals.revenue_cents)}</strong></article><article><span>Besucher</span><strong>${data.totals.visitors}</strong></article><article><span>Seitenaufrufe</span><strong>${data.totals.views}</strong></article></section><section class="panel settings"><div><span>KANÄLE / KONFIGURATION</span><h2>Benachrichtigungen</h2></div><form id="settings-form"><label>Interne Empfänger A<small>Mehrere Adressen mit Komma trennen</small><input name="notification_emails" type="text" value="${esc(s.notification_emails)}" placeholder="orders@dumahedition.de"></label><label>Telegram Chat-ID<input name="telegram_chat_id" value="${esc(s.telegram_chat_id)}" placeholder="-1001234567890"></label><label>Telegram Bot-Token<small>${s.telegram_configured ? 'Token sicher hinterlegt — leer lassen zum Beibehalten' : 'Noch nicht hinterlegt'}</small><input name="telegram_token" type="password" autocomplete="new-password" placeholder="123456:ABC…"></label><label>Steuernummer oder USt-ID<small>Erforderlich für Rechnungen</small><input name="tax_id" value="${esc(s.tax_id)}"></label><label>Umsatzsteuersatz<input name="vat_rate" type="number" min="0" max="99" step="0.1" value="${esc(s.vat_rate)}"></label><label class="toggle"><input name="telegram_enabled" type="checkbox" ${s.telegram_enabled ? 'checked' : ''}> Telegram-Benachrichtigungen aktiv</label><div class="settings-actions"><button type="submit">Einstellungen speichern</button><button type="button" class="test-telegram">Telegram testen</button></div><p class="settings-message">Mailversand: ${s.mail_configured ? 'aktiv' : 'Resend-Konfiguration fehlt'}</p></form></section><section class="panel chart"><div><span>Letzte 14 Tage</span><h2>Aktivität</h2></div><div class="bars">${data.daily.length ? data.daily.map((item) => `<i style="--height:${Math.max(8, item.views / max * 100)}%"><b>${item.views}</b><small>${item.day.slice(5).replace('-', '.')}</small></i>`).join('') : '<p>Noch keine Seitenaufrufe erfasst.</p>'}</div></section><section class="panel"><div><span>Bis zu 100 Einträge</span><h2>Bestellungen</h2></div><div class="table-wrap"><table><thead><tr><th>Bestellung</th><th>Kunde</th><th>Produkt</th><th>Status</th><th>Summe</th><th>Aktionen</th></tr></thead><tbody>${data.orders.length ? data.orders.map((order) => `<tr><td><b>${esc(order.id)}</b><small>${date(order.created_at)}${order.invoice_number ? `<br>${esc(order.invoice_number)}` : ''}</small></td><td><b>${esc(order.customer_name)}</b><small>${esc(order.email)}<br>${esc(order.address)}, ${esc(order.country)}</small></td><td><b>Größe ${esc(order.size)}</b><small>${order.shipping === 'express' ? 'DHL Express' : 'DHL Standard'}${order.tracking_number ? `<br>${esc(order.tracking_number)}` : ''}</small></td><td><mark class="status-${esc(order.status)}">${statusLabel[order.status] || esc(order.status)}</mark></td><td>${money(order.total_cents)}</td><td>${orderActions(order)}</td></tr>`).join('') : '<tr><td colspan="6" class="empty">Noch keine Bestellungen.</td></tr>'}</tbody></table></div></section><section class="panel pages"><div><span>Seit Start der Erfassung</span><h2>Seiten</h2></div><ol>${data.pages.length ? data.pages.map((page) => `<li><span>${esc(page.path)}</span><b>${page.views}</b></li>`).join('') : '<li>Noch keine Daten.</li>'}</ol></section></main>`
  root.querySelectorAll('tbody tr').forEach((row, index) => {
    const statusCell = row.querySelector('mark')?.parentElement
    if (statusCell && data.orders[index]) statusCell.insertAdjacentHTML('beforeend', workflow(data.orders[index]))
  })
  root.querySelector('.logout').addEventListener('click', async () => { await fetch('/api/admin/logout', { method: 'POST' }); login() })
  root.querySelector('#settings-form').addEventListener('submit', async (event) => { event.preventDefault(); const message = root.querySelector('.settings-message'); const body = Object.fromEntries(new FormData(event.currentTarget)); body.telegram_enabled = event.currentTarget.telegram_enabled.checked; const result = await fetch('/api/admin/settings', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); const payload = await result.json(); message.textContent = result.ok ? 'Einstellungen gespeichert.' : payload.error })
  root.querySelector('.test-telegram').addEventListener('click', async () => { const message = root.querySelector('.settings-message'); const response = await fetch('/api/admin/telegram/test', { method: 'POST' }); const payload = await response.json(); message.textContent = response.ok ? 'Telegram-Test erfolgreich gesendet.' : payload.error })
  root.querySelectorAll('.order-actions button').forEach((button) => button.addEventListener('click', async () => { const container = button.closest('.order-actions'); const action = button.dataset.action; const id = container.dataset.order; let body = {}; if (action === 'ship') { const tracking = prompt('DHL-Sendungsnummer (optional):', ''); if (tracking === null) return; body.tracking = tracking } if (action === 'cancel' && !confirm(`Bestellung ${id} wirklich stornieren und den Kunden informieren?`)) return; button.disabled = true; const response = await fetch(`/api/admin/orders/${encodeURIComponent(id)}/${action}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); const payload = await response.json(); if (!response.ok) { alert(payload.error || 'Aktion fehlgeschlagen'); button.disabled = false; return } await dashboard() }))
}

dashboard()
