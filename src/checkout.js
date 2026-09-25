import './checkout.css'
import './preferences.css'
import { initPreferences } from './preferences.js'
import campaignBack from './assets/hoodie-campaign-back.png'

const product = { name: 'Nobody Said It Was Easy', price: 79.99 }
const money = value => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value)
const step = document.body.dataset.step
const order = JSON.parse(sessionStorage.getItem('dumah_order') || '{"size":"M","shipping":"standard"}')
const customer = JSON.parse(sessionStorage.getItem('dumah_customer') || '{}')
const shippingPrice = order.shipping === 'express' ? 9.9 : 0

const steps = `<nav class="steps" aria-label="Checkout-Fortschritt"><span class="${step==='information'?'current':''} ${step!=='information'?'done':''}">01 Kontaktdaten</span><i></i><span class="${step==='shipping'?'current':''} ${step==='payment'?'done':''}">02 Versand</span><i></i><span class="${step==='payment'?'current':''}">03 Zahlung</span></nav>`
const summary = `<aside class="summary"><button class="summary-toggle" type="button">Bestellübersicht <span>${money(product.price+shippingPrice)}　⌄</span></button><div class="summary-inner"><div class="item"><div class="thumb"><img src="${campaignBack}" alt="${product.name}"><b>1</b></div><div><strong>${product.name}</strong><span>Objekt 001 · Größe ${order.size}</span><small>Limitiert auf 50 Exemplare</small></div><em>${money(product.price)}</em></div><dl><div><dt>Zwischensumme</dt><dd>${money(product.price)}</dd></div><div><dt>Versand</dt><dd>${shippingPrice ? money(shippingPrice) : 'Kostenlos'}</dd></div><div class="total"><dt>Gesamt <small>inkl. MwSt.</small></dt><dd><small>EUR</small> ${money(product.price+shippingPrice)}</dd></div></dl><div class="trust"><span>Authentifiziert</span><span>Handgefertigt in Deutschland</span><span>50 Exemplare</span></div></div></aside>`

const info = `<section class="checkout-content"><span class="label">Checkout / Lieferadresse</span><h1>Wohin dürfen<br>wir liefern?</h1><form id="info-form" novalidate><label class="wide">E-Mail-Adresse<input name="email" type="email" autocomplete="email" required value="${customer.email||''}"></label><label>Vorname<input name="first" autocomplete="given-name" required value="${customer.first||''}"></label><label>Nachname<input name="last" autocomplete="family-name" required value="${customer.last||''}"></label><label class="wide">Straße und Hausnummer<input name="street" autocomplete="street-address" required value="${customer.street||''}"></label><label>Postleitzahl<input name="zip" inputmode="numeric" autocomplete="postal-code" required value="${customer.zip||''}"></label><label>Ort<input name="city" autocomplete="address-level2" required value="${customer.city||''}"></label><label class="wide">Land<select name="country"><option>Deutschland</option><option>Österreich</option><option>Schweiz</option><option>Weiteres EU-Land</option></select></label><button class="primary" type="submit">Weiter zum Versand <span>→</span></button><p class="error" role="alert"></p></form></section>`
const ship = `<section class="checkout-content"><span class="label">Checkout / Versand</span><h1>Wie schnell<br>soll es ankommen?</h1><div class="contact-card"><div><span>Kontakt</span><b>${customer.email||'—'}</b><a href="/checkout/">Ändern</a></div><div><span>Lieferadresse</span><b>${customer.street||'—'}, ${customer.zip||''} ${customer.city||''}</b><a href="/checkout/">Ändern</a></div></div><form id="shipping-form"><label class="delivery ${order.shipping==='standard'?'selected':''}"><input type="radio" name="shipping" value="standard" ${order.shipping==='standard'?'checked':''}><span><b>DHL Standard</b><small>2–4 Werktage · versichert</small></span><strong>Kostenlos</strong></label><label class="delivery ${order.shipping==='express'?'selected':''}"><input type="radio" name="shipping" value="express" ${order.shipping==='express'?'checked':''}><span><b>DHL Express</b><small>1–2 Werktage · versichert</small></span><strong>9,90 €</strong></label><div class="actions"><a href="/checkout/">← Zurück</a><button class="primary" type="submit">Weiter zur Zahlung <span>→</span></button></div></form></section>`
const pay = `<section class="checkout-content"><span class="label">Checkout / Zahlung</span><h1>Sicher<br>abschließen.</h1><div class="contact-card"><div><span>Kontakt</span><b>${customer.email||'—'}</b><a href="/checkout/">Ändern</a></div><div><span>Versand</span><b>${order.shipping==='express'?'DHL Express · 9,90 €':'DHL Standard · Kostenlos'}</b><a href="/checkout/shipping.html">Ändern</a></div></div><form id="payment-form"><fieldset><legend>Zahlungsmethode</legend><label class="payment selected"><input type="radio" name="payment" value="card" checked><span><b>Kredit- oder Debitkarte</b><small>Visa · Mastercard · Amex</small></span><i>••••</i></label><label class="payment"><input type="radio" name="payment" value="paypal"><span><b>PayPal</b><small>Weiterleitung zu PayPal</small></span><i>PP</i></label></fieldset><div class="gateway-note">Die Zahlungsoberfläche ist vorbereitet. Für Live-Zahlungen muss ein Zahlungsanbieter verbunden werden.</div><div class="actions"><a href="/checkout/shipping.html">← Zurück</a><button class="primary" type="submit">${money(product.price+shippingPrice)} sicher bezahlen <span>→</span></button></div></form><p class="error" role="alert"></p></section>`

document.querySelector('#checkout').innerHTML = `<header class="checkout-header"><a class="back-shop" href="/">← Zurück zum Shop</a><a class="logo" href="/">DUMAH<small>EDITION</small></a><span>Sicherer Checkout</span></header>${steps}<main>${step==='information'?info:step==='shipping'?ship:pay}${summary}</main><footer><span>© 2026 DUMAH EDITION</span><div><a href="#">Datenschutz</a><a href="#">AGB</a><a href="#">Impressum</a></div></footer>`

document.querySelector('.summary-toggle').addEventListener('click', e => e.currentTarget.closest('.summary').classList.toggle('open'))
document.querySelectorAll('input[type="radio"]').forEach(input => input.addEventListener('change', () => { document.querySelectorAll(`input[name="${input.name}"]`).forEach(i=>i.closest('label').classList.toggle('selected',i.checked)) }))
if(step==='information') document.querySelector('#info-form').addEventListener('submit', e => { e.preventDefault(); if(!e.currentTarget.checkValidity()){e.currentTarget.reportValidity();document.querySelector('.error').textContent='Bitte fülle alle Pflichtfelder aus.';return} sessionStorage.setItem('dumah_customer',JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))));location.href='/checkout/shipping.html' })
if(step==='shipping') document.querySelector('#shipping-form').addEventListener('submit', e => { e.preventDefault();order.shipping=new FormData(e.currentTarget).get('shipping');sessionStorage.setItem('dumah_order',JSON.stringify(order));location.href='/checkout/payment.html' })
if(step==='payment') document.querySelector('#payment-form').addEventListener('submit', e => { e.preventDefault();document.querySelector('.error').textContent='Für echte Zahlungen muss Stripe, Shopify Payments oder PayPal angebunden werden.' })

if (step === 'information') {
  const streetInput = document.querySelector('input[name="street"]')
  const zipInput = document.querySelector('input[name="zip"]')
  const cityInput = document.querySelector('input[name="city"]')
  const countrySelect = document.querySelector('select[name="country"]')
  const list = document.createElement('div')
  list.className = 'address-suggestions'
  list.setAttribute('role', 'listbox')
  list.id = 'address-suggestions'
  streetInput.setAttribute('aria-controls', list.id)
  streetInput.setAttribute('aria-autocomplete', 'list')
  streetInput.parentElement.append(list)
  const attribution = document.createElement('a')
  attribution.className = 'address-attribution'
  attribution.href = 'https://www.openstreetmap.org/copyright'
  attribution.target = '_blank'
  attribution.rel = 'noreferrer'
  attribution.textContent = 'Adressdaten © OpenStreetMap'
  streetInput.parentElement.append(attribution)
  let timer
  let controller

  const closeSuggestions = () => { list.replaceChildren(); list.classList.remove('visible'); streetInput.setAttribute('aria-expanded', 'false') }
  const selectAddress = (properties) => {
    streetInput.value = [properties.street || properties.name, properties.housenumber].filter(Boolean).join(' ')
    zipInput.value = properties.postcode || ''
    cityInput.value = properties.city || properties.town || properties.village || properties.county || ''
    const countryIndex = { de: 0, at: 1, ch: 2 }[(properties.countrycode || '').toLowerCase()]
    if (countryIndex !== undefined) countrySelect.selectedIndex = countryIndex
    closeSuggestions()
  }

  streetInput.addEventListener('input', () => {
    clearTimeout(timer)
    controller?.abort()
    const query = streetInput.value.trim()
    if (query.length < 3) { closeSuggestions(); return }
    timer = setTimeout(async () => {
      controller = new AbortController()
      try {
        const language = document.documentElement.lang === 'en' ? 'en' : 'de'
        const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=7&lang=${language}`, { signal: controller.signal })
        if (!response.ok) throw new Error('Address service unavailable')
        const data = await response.json()
        const matches = data.features.filter(({ properties }) => ['de', 'at', 'ch'].includes((properties.countrycode || '').toLowerCase())).slice(0, 5)
        list.replaceChildren()
        matches.forEach(({ properties }) => {
          const button = document.createElement('button')
          button.type = 'button'
          button.setAttribute('role', 'option')
          const strong = document.createElement('strong')
          const small = document.createElement('small')
          strong.textContent = [properties.street || properties.name, properties.housenumber].filter(Boolean).join(' ')
          small.textContent = [properties.postcode, properties.city || properties.town || properties.village, properties.country].filter(Boolean).join(' · ')
          button.append(strong, small)
          button.addEventListener('click', () => selectAddress(properties))
          list.append(button)
        })
        list.classList.toggle('visible', matches.length > 0)
        streetInput.setAttribute('aria-expanded', String(matches.length > 0))
      } catch (error) {
        if (error.name !== 'AbortError') closeSuggestions()
      }
    }, 280)
  })
  document.addEventListener('click', (event) => { if (!streetInput.parentElement.contains(event.target)) closeSuggestions() })
  streetInput.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeSuggestions() })
}

initPreferences()
