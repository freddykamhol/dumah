import './admin.css'

const root = document.querySelector('#admin')
const money = (cents) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100)
const date = (value) => new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

const login = () => {
  root.innerHTML = `<main class="login"><form><span>DUMAH / ADMINISTRATION</span><h1>Interner<br><em>Zugang.</em></h1><label>Benutzername<input name="username" autocomplete="username" required></label><label>Passwort<input name="password" type="password" autocomplete="current-password" required></label><button type="submit">Anmelden <b>→</b></button><p role="alert"></p></form></main>`
  root.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault()
    const button = event.currentTarget.querySelector('button')
    const error = event.currentTarget.querySelector('p')
    button.disabled = true
    const body = Object.fromEntries(new FormData(event.currentTarget))
    const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    button.disabled = false
    if (!response.ok) { error.textContent = 'Benutzername oder Passwort ist falsch.'; return }
    dashboard()
  })
}

const dashboard = async () => {
  const response = await fetch('/api/admin/dashboard')
  if (response.status === 401) { login(); return }
  if (!response.ok) { root.innerHTML = '<p class="fatal">Dashboard konnte nicht geladen werden.</p>'; return }
  const data = await response.json()
  const max = Math.max(1, ...data.daily.map((item) => item.views))
  root.innerHTML = `<header><a href="/">DUMAH<small>ADMINISTRATION</small></a><button class="logout">Abmelden</button></header><main class="dashboard"><div class="intro"><span>INTERN / LIVE-DATEN</span><h1>Kontrollraum.</h1><p>Bestellungen und Seitenaktivität im Überblick.</p></div><section class="metrics"><article><span>Bestellungen</span><strong>${data.totals.orders}</strong></article><article><span>Bestellwert</span><strong>${money(data.totals.revenue_cents)}</strong></article><article><span>Besucher</span><strong>${data.totals.visitors}</strong></article><article><span>Seitenaufrufe</span><strong>${data.totals.views}</strong></article></section><section class="panel chart"><div><span>Letzte 14 Tage</span><h2>Aktivität</h2></div><div class="bars">${data.daily.length ? data.daily.map((item) => `<i style="--height:${Math.max(8, item.views / max * 100)}%"><b>${item.views}</b><small>${item.day.slice(5).replace('-', '.')}</small></i>`).join('') : '<p>Noch keine Seitenaufrufe erfasst.</p>'}</div></section><section class="panel"><div><span>Bis zu 100 Einträge</span><h2>Bestellungen</h2></div><div class="table-wrap"><table><thead><tr><th>Bestellung</th><th>Kunde</th><th>Produkt</th><th>Status</th><th>Summe</th></tr></thead><tbody>${data.orders.length ? data.orders.map((order) => `<tr><td><b>${order.id}</b><small>${date(order.created_at)}</small></td><td><b>${order.customer_name}</b><small>${order.email}<br>${order.address}, ${order.country}</small></td><td><b>Größe ${order.size}</b><small>${order.shipping === 'express' ? 'DHL Express' : 'DHL Standard'}</small></td><td><mark>Zahlung ausstehend</mark></td><td>${money(order.total_cents)}</td></tr>`).join('') : '<tr><td colspan="5" class="empty">Noch keine Bestellungen.</td></tr>'}</tbody></table></div></section><section class="panel pages"><div><span>Seit Start der Erfassung</span><h2>Seiten</h2></div><ol>${data.pages.length ? data.pages.map((page) => `<li><span>${page.path}</span><b>${page.views}</b></li>`).join('') : '<li>Noch keine Daten.</li>'}</ol></section></main>`
  root.querySelector('.logout').addEventListener('click', async () => { await fetch('/api/admin/logout', { method: 'POST' }); login() })
}

dashboard()
