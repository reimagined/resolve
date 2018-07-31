import fetch from 'isomorphic-fetch'
import path from 'path'
import respawn from 'respawn'

export default async resolveConfig => {
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

  while (true) {
    const statusUrl = `http://localhost:${resolveConfig.port}${
      resolveConfig.rootPath ? `/${resolveConfig.rootPath}` : ''
    }/api/status`
    try {
      const response = await fetch(statusUrl)
      if ((await response.text()) === 'ok') break
    } catch (e) {}
  }

  const stopServer = () => new Promise(resolve => server.stop(resolve))
  return stopServer
}
