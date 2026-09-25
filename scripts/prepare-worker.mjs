import { cp, mkdir } from 'node:fs/promises'

await mkdir('dist/server', { recursive: true })
await mkdir('dist/.openai/drizzle', { recursive: true })
await cp('server/index.js', 'dist/server/index.js')
await cp('server/notifications.js', 'dist/server/notifications.js')
await cp('.openai/hosting.json', 'dist/.openai/hosting.json')
await cp('drizzle', 'dist/.openai/drizzle', { recursive: true })
