import './tracking.css'
import './tracking-embedded.css'

const root = document.querySelector('#tracking')
const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
const labels = { payment_pending: 'Bestellung eingegangen', confirmed: 'Bestellung bestätigt', shipped: 'Bestellung versendet', canceled: 'Bestellung storniert' }
const formatDate = (value) => value ? new Intl.DateTimeFormat('de-DE', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value)) : ''

const render = (order) => {
  const canceled = order.status === 'canceled'; const active = order.status === 'shipped' ? 3 : order.status === 'confirmed' ? 2 : 1
  const steps = canceled ? [['Eingegangen', true], ['Storniert', true]] : [['Eingegangen', active >= 1], ['Bestätigt', active >= 2], ['Versendet', active >= 3]]
  root.querySelector('.tracking-result').innerHTML = `<div class="result-head"><span>${esc(order.order)}</span><h2>${esc(labels[order.status] || order.status)}</h2><p>${order.status === 'shipped' ? `Versendet am ${esc(formatDate(order.shipped_at))}.` : order.status === 'canceled' ? `Storniert am ${esc(formatDate(order.canceled_at))}.` : 'Wir aktualisieren den Status, sobald deine Bestellung den nächsten Schritt erreicht.'}</p></div><div class="status-line ${canceled ? 'is-canceled' : ''}">${steps.map(([label, done], index) => `<div class="${done ? 'is-done' : ''}"><i>${done ? '✓' : index + 1}</i><span>${label}</span></div>`).join('')}</div>${order.tracking_number ? `<div class="shipment"><span>DHL Sendungsnummer</span><strong>${esc(order.tracking_number)}</strong><div class="shipment-state"><i>✓</i><p><b>Sendung an DHL übergeben</b><small>Deine Sendungsverfolgung wird direkt hier auf DUMAH aktualisiert.</small></p></div></div>` : order.status === 'shipped' ? '<p class="pending">Die Sendungsnummer wird in Kürze ergänzt.</p>' : ''}`
}

async function lookup(event) {
  event.preventDefault(); const form = event.currentTarget; const button = form.querySelector('button'); const error = form.querySelector('.tracking-error'); const order = form.order.value.trim().toUpperCase()
  button.disabled = true; error.textContent = ''; root.querySelector('.tracking-result').innerHTML = '<p class="loading">Status wird geladen …</p>'
  const response = await fetch(`/api/order-status?order=${encodeURIComponent(order)}`); const data = await response.json().catch(() => ({})); button.disabled = false
  if (!response.ok) { root.querySelector('.tracking-result').innerHTML = ''; error.textContent = data.error || 'Der Status konnte nicht geladen werden.'; return }
  history.replaceState(null, '', `${location.pathname}?order=${encodeURIComponent(order)}`); render(data)
}

root.innerHTML = `<section class="tracking-intro"><span>ORDER / TRACKING</span><h1>Deine<br><em>Bestellung.</em></h1><p>Gib deine Bestellnummer ein. Du findest sie in deiner Bestellbestätigung.</p><form><label for="order-number">Bestellnummer</label><div><input id="order-number" name="order" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="DE-…-…" required><button type="submit">Status ansehen <b>→</b></button></div><p class="tracking-error" role="alert"></p></form></section><section class="tracking-result" aria-live="polite"></section>`
root.querySelector('form').addEventListener('submit', lookup)
const requested = new URLSearchParams(location.search).get('order'); if (requested) { root.querySelector('input').value = requested; root.querySelector('form').requestSubmit() }
