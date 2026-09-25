const COOKIE_DAYS = 180

const readCookie = (name) => document.cookie.split('; ').find((row) => row.startsWith(`${name}=`))?.split('=')[1]
const writeCookie = (name, value) => {
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${COOKIE_DAYS * 86400}; Path=/; SameSite=Lax${secure}`
}

const translations = new Map([
  ['RELEASE 04.10.2026 · 12:00 UHR CEST · WELTWEIT 50 EXEMPLARE', 'RELEASE 04 OCTOBER 2026 · 12:00 CEST · 50 PIECES WORLDWIDE'],
  ['VON 50', 'OF 50'], ['Release 04.10.2026', 'Release 04 October 2026'], ['Heavyweight Hoodie', 'Heavyweight hoodie'],
  ['Shop', 'Shop'], ['Das Objekt', 'The Object'], ['Unsere Geschichte', 'Our Story'], ['Edition', 'Edition'],
  ['Warenkorb', 'Bag'], ['Rückseite', 'Back'], ['Vorderseite', 'Front'], ['Größe wählen', 'Select size'],
  ['In den Warenkorb', 'Add to bag'], ['Deine Auswahl', 'Your selection'], ['Dein Warenkorb ist leer.', 'Your bag is empty.'],
  ['Zwischensumme', 'Subtotal'], ['Zur Kasse', 'Checkout'], ['Sicherer Checkout', 'Secure checkout'],
  ['Objekt ansehen', 'View the object'], ['Material', 'Material'], ['Verarbeitung', 'Construction'],
  ['Langsam gefertigt.', 'Made slowly.'], ['Für immer', 'Worn'], ['getragen.', 'forever.'],
  ['Stille kann', 'Silence can be'], ['stärker sein', 'more powerful'], ['als Lärm.', 'than noise.'],
  ['Fünfzig Exemplare.', 'Fifty pieces.'], ['Keine zweite Auflage.', 'No second run.'],
  ['In Stille entworfen.', 'Designed in silence.'], ['Gemacht, um Spuren zu hinterlassen.', 'Made to leave a mark.'],
  ['In Stille entworfen', 'Designed in silence'], ['HOLZMINDEN / DEUTSCHLAND', 'HOLZMINDEN / GERMANY'],
  ['UNABHÄNGIG / HANDGEFERTIGT', 'INDEPENDENT / HANDMADE'], ['AUS DER STILLE', 'EST. IN SILENCE'],
  ['02 / Das Objekt', '02 / The Object'], ['03 / Unsere Geschichte', '03 / The Story'], ['04 / Limitierte Edition', '04 / Limited Edition'],
  ['100 % Premium-Baumwolle', '100% premium cotton'], ['Von Hand in Deutschland veredelt', 'Hand-finished in Germany'],
  ['50 nummerierte Exemplare', '50 numbered pieces'], ['Kampagne 01 · Holzminden', 'Campaign 01 · Holzminden'],
  ['Objekt 001 · Rückenstudie', 'Object 001 · Back study'], ['Der erste öffentliche DUMAH Release', 'The inaugural public release'],
  ['Ein kompromissloser Heavyweight Hoodie, von Hand in Deutschland veredelt. Jedes Exemplar ist nummeriert. Keine Neuauflage.', 'A uncompromising heavyweight hoodie, hand-finished in Germany. Every piece is individually numbered. No restock.'],
  ['Nummeriertes Zertifikat · Premium-Verpackung · Sicherer Checkout', 'Numbered certificate · Premium packaging · Secure checkout'],
  ['450 GSM gebürstete Baumwolle, ein architektonischer Oversized-Fit und ein Finish, das mit jedem Tragen mehr Charakter entwickelt. Jedes Exemplar geht in Holzminden durch unsere Hände.', '450 GSM brushed cotton, an architectural oversized fit and a finish that develops character with every wear. Every piece passes through our hands in Holzminden.'],
  ['DUMAH entstand aus einer einfachen Überzeugung:', 'DUMAH was born from a simple conviction:'],
  ['DUMAH EDITION bewegt sich zwischen Zurückhaltung und Widerstand. Wir erschaffen Objekte für Menschen, die weder Erlaubnis noch Erklärung oder die Zustimmung der Masse brauchen.', 'DUMAH EDITION exists between restraint and defiance. We create objects for people who need neither permission, explanation nor mass approval.'],
  ['Fernab der Mechanik von Fast Fashion geht jedes Exemplar in Holzminden durch unsere Hände. Es wird in kleiner Stückzahl gefertigt, veredelt und geprüft. Die Spuren dieses Prozesses werden nicht verborgen — sie sind Teil des Objekts.', 'Far from the machinery of fast fashion, every piece passes through our hands in Holzminden. It is made, finished and inspected in small numbers. The marks of the process are not hidden — they are part of the object.'],
  ['Wir denken nicht in saisonalen Kollektionen. Wir veröffentlichen einen Gedanken nach dem anderen. Jedes Objekt ist nummeriert, jede Edition schließt für immer. Was vergriffen ist, wird Teil des Archivs.', 'We do not think in seasonal collections. We release one thought at a time. Every object is numbered, every edition closes forever. What is gone becomes part of the archive.'],
  ['Öffentlicher Release am 04.10.2026 um 12:00 Uhr CEST. Sobald die Edition geschlossen ist, geht das Objekt in das Archiv über.', 'Public release on 04 October 2026 at 12:00 CEST. Once the edition closes, the object enters the archive.'],
  ['Bestellübersicht', 'Order summary'], ['Kontaktdaten', 'Contact'], ['Versand', 'Shipping'], ['Zahlung', 'Payment'],
  ['Checkout / Lieferadresse', 'Checkout / Delivery address'], ['Checkout / Versand', 'Checkout / Shipping'], ['Checkout / Zahlung', 'Checkout / Payment'],
  ['Wohin dürfen', 'Where should we'], ['wir liefern?', 'deliver?'], ['E-Mail-Adresse', 'Email address'], ['Vorname', 'First name'],
  ['Nachname', 'Last name'], ['Straße und Hausnummer', 'Street and house number'], ['Postleitzahl', 'Postal code'], ['Ort', 'City'],
  ['Land', 'Country'], ['Deutschland', 'Germany'], ['Österreich', 'Austria'], ['Schweiz', 'Switzerland'], ['Weiteres EU-Land', 'Other EU country'],
  ['Weiter zum Versand', 'Continue to shipping'], ['Wie schnell', 'How soon should'], ['soll es ankommen?', 'it arrive?'],
  ['Adressdaten © OpenStreetMap', 'Address data © OpenStreetMap'],
  ['Kontakt', 'Contact'], ['Lieferadresse', 'Delivery address'], ['Ändern', 'Change'], ['Kostenlos', 'Free'],
  ['Weiter zur Zahlung', 'Continue to payment'], ['Sicher', 'Complete'], ['abschließen.', 'securely.'],
  ['Zahlungsmethode', 'Payment method'], ['Kredit- oder Debitkarte', 'Credit or debit card'], ['Weiterleitung zu PayPal', 'Redirect to PayPal'],
  ['Zurück', 'Back'], ['Zurück zum Shop', 'Back to shop'], ['Authentifiziert', 'Authenticated'],
  ['Handgefertigt in Deutschland', 'Handmade in Germany'], ['50 Exemplare', '50 pieces'],
  ['Limitiert auf 50 Exemplare', 'Limited to 50 pieces'], ['Gesamt', 'Total'], ['inkl. MwSt.', 'incl. VAT'],
  ['Die Zahlungsoberfläche ist vorbereitet. Für Live-Zahlungen muss ein Zahlungsanbieter verbunden werden.', 'The payment interface is prepared. A payment provider must be connected for live payments.']
])

const translatePage = (language) => {
  document.documentElement.lang = language
  if (language !== 'en') return
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const nodes = []
  while (walker.nextNode()) nodes.push(walker.currentNode)
  nodes.forEach((node) => {
    const source = node.nodeValue.trim()
    if (!translations.has(source)) return
    node.nodeValue = node.nodeValue.replace(source, translations.get(source))
  })
}

const showCookieNotice = (language) => {
  if (readCookie('dumah_cookie_notice')) return
  const notice = document.createElement('aside')
  notice.className = 'cookie-notice'
  notice.setAttribute('role', 'dialog')
  notice.setAttribute('aria-label', language === 'en' ? 'Cookie notice' : 'Cookie-Hinweis')
  notice.innerHTML = language === 'en'
    ? `<span>PRIVACY / COOKIES</span><p>We only use technically necessary cookies to remember your language and cookie preference. Address searches are sent to OpenStreetMap's Photon service only while you type.</p><button type="button">Understood</button>`
    : `<span>DATENSCHUTZ / COOKIES</span><p>Wir verwenden ausschließlich technisch notwendige Cookies, um deine Sprach- und Cookie-Auswahl zu speichern. Adresssuchen werden nur während der Eingabe an den OpenStreetMap-Dienst Photon übermittelt.</p><button type="button">Verstanden</button>`
  document.body.append(notice)
  notice.querySelector('button').addEventListener('click', () => {
    writeCookie('dumah_cookie_notice', 'accepted')
    notice.classList.add('is-leaving')
    setTimeout(() => notice.remove(), 240)
  })
}

export const initPreferences = () => {
  const savedLanguage = decodeURIComponent(readCookie('dumah_language') || '')
  if (savedLanguage === 'de' || savedLanguage === 'en') {
    translatePage(savedLanguage)
    showCookieNotice(savedLanguage)
    return
  }

  const modal = document.createElement('div')
  modal.className = 'language-gate'
  modal.innerHTML = `<div class="language-card" role="dialog" aria-modal="true" aria-labelledby="language-title"><span>DUMAH EDITION · HOLZMINDEN</span><h2 id="language-title">Choose your language.<br><em>Sprache wählen.</em></h2><div><button type="button" data-language="de">Deutsch <b>DE</b></button><button type="button" data-language="en">English <b>EN</b></button></div><small>Deine Auswahl wird auf diesem Gerät gespeichert.<br>Your choice will be saved on this device.</small></div>`
  document.body.append(modal)
  document.body.classList.add('preference-open')
  modal.querySelector('button').focus()
  modal.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => {
    const language = button.dataset.language
    writeCookie('dumah_language', language)
    translatePage(language)
    modal.remove()
    document.body.classList.remove('preference-open')
    showCookieNotice(language)
  }))
}
