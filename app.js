// Browser entry for Vite; Plesk/Node loads the server only at runtime.
if (typeof process !== 'undefined' && process.versions?.node) {
  import(/* @vite-ignore */ './server/node-server.js').catch((error) => {
    console.error('DUMAH server failed to start', error)
    process.exitCode = 1
  })
} else {
  import('./src/main.js')
}
