import path from 'path'
import respawn from 'respawn'

export default async resolveConfig => {
  const serverPath = path.resolve(__dirname, '../../dist/runtime/index.js')

  const server = respawn(
    [serverPath, `--distDir=${JSON.stringify(resolveConfig.distDir)}`],
    {
      maxRestarts: 0,
      kill: 5000,
      stdio: 'inherit',
      fork: true
    }
  )

  process.on('exit', () => {
    server.stop()
  })

  server.start()

  const stopServer = () => new Promise(resolve => server.stop(resolve))
  return stopServer
}
