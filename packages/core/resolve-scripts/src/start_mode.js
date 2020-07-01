import path from 'path'
import getLog from './getLog'

import { processRegister } from './process_manager'

const log = getLog('start')

export default resolveConfig =>
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
        RESOLVE_LAUNCH_ID: resolveLaunchId
      }
    })

    server.on('crash', reject)

    server.start()
    log.debug(`Server process pid: ${server.pid}`)

    if (resolveConfig.eventBroker.launchBroker) {
      const brokerPath = path.resolve(
        process.cwd(),
        path.join(
          resolveConfig.distDir,
          './common/local-entry/local-bus-broker.js'
        )
      )

      const broker = processRegister(['node', brokerPath], {
        cwd: process.cwd(),
        maxRestarts: 0,
        kill: 5000,
        stdio: 'inherit',
        env: {
          ...process.env,
          RESOLVE_LAUNCH_ID: resolveLaunchId
        }
      })

      broker.on('crash', reject)

      broker.start()
      log.debug(`Bus broker process pid: ${broker.pid}`)
    }
  })
