import path from 'path'

import { processRegister } from './process_manager'

export default resolveConfig =>
  new Promise(async (resolve, reject) => {
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
    }
  })
