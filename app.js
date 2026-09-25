// Browser entry for Vite; Plesk/Node loads the server only at runtime.
if (typeof process !== 'undefined' && process.versions?.node) {
  await import(/* @vite-ignore */ './server/node-server.js')
} else {
  await import('./src/main.js')
}
