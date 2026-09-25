const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
const money = (cents) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100)

export async function readSettings(db) {
  const rows = await db.prepare('SELECT key, value FROM shop_settings').all()
  return Object.fromEntries(rows.results.map(({ key, value }) => [key, value]))
}

export async function saveSettings(db, values) {
  const now = new Date().toISOString()
  for (const [key, value] of Object.entries(values)) {
    await db.prepare('INSERT INTO shop_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at').bind(key, String(value ?? ''), now).run()
  }
}

const keyMaterial = async (secret) => crypto.subtle.importKey('raw', await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret)), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
const b64 = (bytes) => btoa(String.fromCharCode(...bytes))
const unb64 = (value) => Uint8Array.from(atob(value), (c) => c.charCodeAt(0))

export async function encryptSecret(value, secret) {
  if (!secret) throw new Error('CONFIG_ENCRYPTION_KEY fehlt')
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await keyMaterial(secret), new TextEncoder().encode(value))
  return `${b64(iv)}.${b64(new Uint8Array(cipher))}`
}

export async function decryptSecret(value, secret) {
  if (!value || !secret) return ''
  const [iv, cipher] = value.split('.')
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, await keyMaterial(secret), unb64(cipher))
  return new TextDecoder().decode(plain)
}

const layout = (eyebrow, title, body, footer = 'DUMAH EDITION · HOLZMINDEN') => `<!doctype html><html><body style="margin:0;background:#080807;color:#eeeae2;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#080807"><tr><td align="center" style="padding:34px 14px"><table role="presentation" width="620" cellspacing="0" cellpadding="0" style="width:100%;max-width:620px;border:1px solid #302e29;background:#0d0d0c"><tr><td style="padding:28px 34px;border-bottom:1px solid #302e29"><div style="font-family:Georgia,serif;font-size:24px;letter-spacing:5px;color:#f1eee7">DUMAH</div><div style="margin-top:6px;font-size:9px;letter-spacing:5px;color:#77736c">EDITION</div></td></tr><tr><td style="padding:42px 34px"><div style="font-size:10px;letter-spacing:3px;color:#b18c5b;text-transform:uppercase">${eyebrow}</div><h1 style="margin:24px 0 30px;font-family:Georgia,serif;font-size:44px;line-height:1;color:#f1eee7;font-weight:400">${title}</h1>${body}</td></tr><tr><td style="padding:22px 34px;border-top:1px solid #302e29;font-size:10px;letter-spacing:2px;color:#69665f">${footer}</td></tr></table></td></tr></table></body></html>`
const line = (label, value) => `<tr><td style="padding:9px 0;color:#77736c;font-size:12px">${esc(label)}</td><td align="right" style="padding:9px 0;color:#eeeae2;font-size:12px">${esc(value)}</td></tr>`
const orderTable = (order) => `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #302e29;border-bottom:1px solid #302e29">${line('Bestellung', order.id)}${line('Objekt', `Nobody Said It Was Easy · Größe ${order.size}`)}${line('Versand', order.shipping === 'express' ? 'DHL Express' : 'DHL Standard')}${line('Gesamt', money(order.total_cents))}</table>`

export function customerTemplate(event, order, extra = {}) {
  const name = esc(order.customer_name.split(' ')[0])
  if (event === 'confirmation') return { subject: `Bestellbestätigung ${order.id} · DUMAH`, html: layout('Bestellung bestätigt', `Danke, ${name}.`, `<p style="color:#aaa69d;line-height:1.7">Dein DUMAH Objekt ist für dich reserviert. Wir bereiten es mit Sorgfalt vor.</p>${orderTable(order)}<p style="margin-top:28px;color:#77736c;font-size:12px;line-height:1.7">Lieferadresse: ${esc(order.address)}, ${esc(order.country)}</p>`) }
  if (event === 'invoice') return { subject: `Rechnung ${extra.invoiceNumber} · DUMAH`, html: layout(`Rechnung ${esc(extra.invoiceNumber)}`, 'Deine Rechnung.', `<p style="color:#aaa69d;line-height:1.7">Rechnungsdatum: ${esc(extra.invoiceDate)}</p>${orderTable(order)}<table role="presentation" width="100%" style="margin-top:18px">${line('Nettobetrag', money(extra.netCents))}${line(`Umsatzsteuer ${extra.vatRate}%`, money(extra.vatCents))}${line('Rechnungsbetrag', money(order.total_cents))}</table><p style="margin-top:28px;color:#77736c;font-size:11px;line-height:1.7">Leistungserbringer: Karam Azmy Media, Inhaber Freddy Karam Azmy, Neue Straße 3, 37603 Holzminden. Steuerangabe: ${esc(extra.taxId)}.</p>`) }
  if (event === 'shipping') return { subject: `Dein DUMAH Objekt ist unterwegs · ${order.id}`, html: layout('Versand', 'Auf dem Weg.', `<p style="color:#aaa69d;line-height:1.7">Deine Edition wurde versendet.</p>${orderTable(order)}${extra.tracking ? `<p style="margin-top:28px;color:#eeeae2">Sendungsnummer: <strong>${esc(extra.tracking)}</strong></p>` : ''}`) }
  return { subject: `Stornierung ${order.id} · DUMAH`, html: layout('Stornierung', 'Bestellung storniert.', `<p style="color:#aaa69d;line-height:1.7">Deine Bestellung ${esc(order.id)} wurde storniert. Eine bereits erfolgte Zahlung wird über das ursprüngliche Zahlungsmittel zurückerstattet.</p>`) }
}

export function internalTemplate(order) {
  return { subject: `Neue DUMAH Bestellung · ${order.id}`, html: layout('Neue Bestellung', 'Ein neues Objekt.', `<p style="color:#aaa69d;line-height:1.7">${esc(order.customer_name)} hat eine Bestellung aufgegeben.</p>${orderTable(order)}<p style="margin-top:28px;color:#77736c;font-size:12px;line-height:1.7">${esc(order.email)}<br>${esc(order.address)}, ${esc(order.country)}</p>`, 'DUMAH · ADMINISTRATION') }
}

export async function sendEmail(env, { to, subject, html }) {
  if (!env.RESEND_API_KEY) throw new Error('Resend ist nicht konfiguriert')
  const recipients = Array.isArray(to) ? to : [to]
  const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify({ from: env.MAIL_FROM || 'DUMAH EDITION <orders@dumahedition.de>', to: recipients, subject, html, reply_to: env.MAIL_REPLY_TO || 'info@katechnologies.de' }) })
  if (!response.ok) throw new Error(`Mailversand fehlgeschlagen (${response.status})`)
  return response.json()
}

export async function sendTelegram(token, chatId, text) {
  if (!token || !chatId) return
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }) })
  if (!response.ok) throw new Error(`Telegram fehlgeschlagen (${response.status})`)
}

export async function logNotification(db, orderId, channel, event, recipient, status, detail = '') {
  await db.prepare('INSERT INTO notification_log (order_id, channel, event, recipient, status, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(orderId, channel, event, recipient, status, detail.slice(0, 500), new Date().toISOString()).run()
}
