import path from 'path'
import respawn from 'respawn'

export default async () => {
  const serverPath = path.resolve(__dirname, '../../dist/runtime/index.js')

  const server = respawn([serverPath], {
    maxRestarts: 0,
    kill: 5000,
    stdio: 'inherit',
    fork: true
  })

  process.on('exit', () => {
    server.stop()
  })

  server.start()
}
