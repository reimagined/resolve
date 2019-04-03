import path from 'path'

import { processRegister } from './process_manager'

export default resolveConfig =>
  new Promise((resolve, reject) => {
    const serverPath = path.resolve(
      process.cwd(),
      path.join(resolveConfig.distDir, './common/local-entry/local-entry.js')
    )

    const server = processRegister(['node', serverPath], {
      cwd: process.cwd(),
      maxRestarts: 0,
      kill: 5000,
      stdio: 'inherit'
    })

    server.on('crash', reject)
    server.on('stop', resolve)

    server.start()
  })
