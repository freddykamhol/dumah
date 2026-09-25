import './style.css'
import campaignBack from './assets/hoodie-campaign-back.png'
import campaignFront from './assets/hoodie-campaign-front.png'
import hoodieBack from './assets/hoodie-back.png'
import hoodieFront from './assets/hoodie-front.png'

const product = { name: 'Nobody Said It Was Easy', price: 280, edition: 'Object 001' }

document.querySelector('#app').innerHTML = `
<div class="announcement">PRIVATE RELEASE · 50 PIECES WORLDWIDE · COMPLIMENTARY EU SHIPPING</div>
<header class="site-header">
  <a class="brand" href="#shop" aria-label="Dumah Startseite"><span class="brand-mark">D</span><span>DUMAH<small>EDITION</small></span></a>
  <nav aria-label="Hauptnavigation"><a class="active" href="#shop">Shop</a><a href="#craft">The Object</a><a href="#edition">Edition</a></nav>
  <button class="bag-button" type="button">Bag <span>0</span></button>
</header>
<main>
  <section class="shop-screen" id="shop">
    <div class="product-visual">
      <div class="edition-stamp"><span>01</span><small>OF 50</small></div>
      <img class="product-image is-active" src="${campaignBack}" alt="Schwarzer DUMAH Hoodie mit Rückenprint">
      <img class="product-image" src="${campaignFront}" alt="Schwarzer DUMAH Hoodie von vorne">
      <div class="image-controls" aria-label="Produktansicht wählen"><button class="view-button is-active" data-view="0">Back</button><button class="view-button" data-view="1">Front</button></div>
      <span class="image-note">Campaign 01 · Holzminden</span>
    </div>
    <div class="product-buy">
      <div class="eyebrow"><span>${product.edition}</span><span>Available 04.10.2026</span></div>
      <div><p class="kicker">The inaugural private release</p><h1>Nobody Said<br>It Was <em>Easy.</em></h1><p class="description">A heavyweight garment, cut and finished by hand in Germany. Individually numbered and never reproduced.</p></div>
      <div class="purchase">
        <div class="price-row"><span>Heavyweight hoodie</span><strong>€${product.price}</strong></div>
        <div class="size-row"><span>Select size</span><div class="sizes" role="group" aria-label="Größe auswählen"><button type="button">S</button><button class="is-selected" type="button">M</button><button type="button">L</button><button type="button">XL</button></div></div>
        <button class="add-to-bag" type="button"><span>Add to bag</span><span>→</span></button>
        <p class="purchase-note">Numbered certificate · Premium packaging · Secure checkout</p>
      </div>
    </div>
  </section>
  <section class="story-screen" id="craft">
    <div class="story-copy"><span class="section-number">02 / The Object</span><h2>Made slowly.<br>Worn <em>forever.</em></h2><p>450 GSM brushed cotton, an architectural oversized cut and a finish that develops character with every wear. Every piece passes through our hands in Holzminden.</p><dl><div><dt>Material</dt><dd>100% premium cotton</dd></div><div><dt>Construction</dt><dd>Hand-finished in Germany</dd></div><div><dt>Edition</dt><dd>50 numbered pieces</dd></div></dl></div>
    <div class="detail-visual"><img src="${hoodieBack}" alt="Detailansicht des DUMAH Hoodie Rückenprints"><span class="detail-caption">Object 001 · Back study</span></div>
  </section>
  <section class="edition-screen" id="edition">
    <img src="${hoodieFront}" alt="DUMAH Hoodie Vorderansicht"><div class="edition-overlay"></div>
    <div class="edition-copy"><span class="section-number">03 / Private Edition</span><h2>Fifty pieces.<br><em>No second run.</em></h2><p>When the edition closes, the object enters the archive.</p><a href="#shop">Secure your number <span>↗</span></a></div>
    <div class="edition-meta"><span>Designed in silence</span><span>DUMAH® · 2026</span></div>
  </section>
</main>
<aside class="bag-drawer" aria-hidden="true"><button class="bag-close" aria-label="Warenkorb schließen">×</button><div class="bag-heading"><span>Your selection</span><h2>Bag <sup>0</sup></h2></div><div class="bag-content"><p>Your bag is empty.</p></div><div class="bag-summary"><div><span>Subtotal</span><strong>€0</strong></div><button type="button" disabled>Checkout <span>→</span></button><small>Taxes included. Shipping calculated at checkout.</small></div></aside><div class="backdrop"></div>`

const images = [...document.querySelectorAll('.product-image')]
const viewButtons = [...document.querySelectorAll('.view-button')]
viewButtons.forEach((button) => button.addEventListener('click', () => {
  const index = Number(button.dataset.view)
  images.forEach((image, imageIndex) => image.classList.toggle('is-active', imageIndex === index))
  viewButtons.forEach((item, itemIndex) => item.classList.toggle('is-active', itemIndex === index))
}))

document.querySelectorAll('.sizes button').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.sizes button').forEach((item) => item.classList.remove('is-selected'))
  button.classList.add('is-selected')
}))

const drawer = document.querySelector('.bag-drawer')
const backdrop = document.querySelector('.backdrop')
const setBagOpen = (open) => {
  drawer.classList.toggle('is-open', open); backdrop.classList.toggle('is-open', open)
  drawer.setAttribute('aria-hidden', String(!open)); document.body.classList.toggle('no-scroll', open)
}
document.querySelector('.bag-button').addEventListener('click', () => setBagOpen(true))
document.querySelector('.bag-close').addEventListener('click', () => setBagOpen(false))
backdrop.addEventListener('click', () => setBagOpen(false))
document.addEventListener('keydown', (event) => event.key === 'Escape' && setBagOpen(false))

document.querySelector('.add-to-bag').addEventListener('click', () => {
  const size = document.querySelector('.sizes .is-selected').textContent
  document.querySelector('.bag-button span').textContent = '1'; document.querySelector('.bag-heading sup').textContent = '1'
  document.querySelector('.bag-content').innerHTML = `<div class="bag-item"><img src="${campaignFront}" alt="${product.name}"><div><small>${product.edition}</small><strong>${product.name}</strong><span>Size ${size} · €${product.price}</span></div></div>`
  document.querySelector('.bag-summary strong').textContent = `€${product.price}`
  document.querySelector('.bag-summary button').disabled = false; setBagOpen(true)
})

const navLinks = [...document.querySelectorAll('nav a')]
const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
  if (entry.isIntersecting) navLinks.forEach((link) => link.classList.toggle('active', link.hash === `#${entry.target.id}`))
}), { threshold: 0.55 })
document.querySelectorAll('main section').forEach((section) => observer.observe(section))
