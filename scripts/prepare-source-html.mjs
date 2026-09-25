import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const pages = [
  'index.html',
  'admin/index.html',
  'checkout/index.html',
  'checkout/shipping.html',
  'checkout/payment.html',
  'impressum/index.html',
  'datenschutz/index.html',
  'agb/index.html',
  'widerruf/index.html',
  'status/index.html',
]

for (const page of pages) {
  const target = join(root, page)
  mkdirSync(dirname(target), { recursive: true })
  copyFileSync(join(root, 'source-pages', page), target)
}
