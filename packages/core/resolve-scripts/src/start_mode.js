import path from 'path'
import respawn from 'respawn'
import openBrowser from './open_browser'

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

  const isOpenBrowser = process.env.RESOLVE_SERVER_OPEN_BROWSER === 'true'
  const serverFirstStart = process.env.RESOLVE_SERVER_FIRST_START === 'true'
  if (isOpenBrowser && serverFirstStart) {
    openBrowser(resolveConfig.port, resolveConfig.rootPath).catch(() => {})
  }
}
