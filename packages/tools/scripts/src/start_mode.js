import path from 'path'
import { getLog } from './get-log'

import { processRegister } from './process_manager'

const log = getLog('start')

const startMode = (resolveConfig) =>
  new Promise(async (resolve, reject) => {
    log.debug('Starting "start" mode')
    const serverPath = path.resolve(
      process.cwd(),
      path.join(resolveConfig.distDir, './common/local-entry/local-entry.js')
    )

    const resolveLaunchId = Math.floor(Math.random() * 1000000000)

    const server = processRegister(['node', serverPath], {
      cwd: process.cwd(),
      maxRestarts: 0,
      kill: 5000,
      stdio: 'inherit',
      env: {
        ...process.env,
        RESOLVE_LAUNCH_ID: resolveLaunchId,
      },
    })

    server.on('crash', reject)

    server.start()
    log.debug(`Server process pid: ${server.pid}`)
  })

export default startMode
