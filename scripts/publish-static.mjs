import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const client = join(root, 'dist', 'client')

if (!existsSync(join(client, 'index.html'))) {
  console.error('Build fehlt: dist/client/index.html wurde nicht erzeugt.')
  process.exit(1)
}

const publishedAssets = join(root, 'assets')
if (existsSync(publishedAssets)) rmSync(publishedAssets, { recursive: true, force: true })

for (const entry of readdirSync(client)) {
  const source = join(client, entry)
  const target = join(root, entry)
  if (statSync(source).isDirectory()) {
    mkdirSync(target, { recursive: true })
    cpSync(source, target, { recursive: true, force: true })
  } else cpSync(source, target, { force: true })
}
