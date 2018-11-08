import path from 'path'
import respawn from 'respawn'

export default async resolveConfig => {
  const serverPath = path.resolve(
    process.cwd(),
    path.join(resolveConfig.distDir, './common/local-entry/local-entry.js')
  )

  const server = respawn(['node', serverPath], {
    cwd: process.cwd(),
    maxRestarts: 0,
    kill: 5000,
    stdio: 'inherit'
  })

  process.on('exit', () => {
    server.stop()
  })

  server.start()
}
