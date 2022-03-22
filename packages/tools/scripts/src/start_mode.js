import path from 'path'
import { getLog } from './get-log'

import { processRegister } from './process_manager'
import { resolveResource } from './resolve-resource'
import { checkRuntimeEnv } from './declare_runtime_env'

const log = getLog('start')

const startMode = (resolveConfig) =>
  new Promise(async (resolve, reject) => {
    log.debug('Starting "start" mode')
    const activeRuntimeModule = (
      resolveResource(
        path.join(resolveConfig.runtime.module, 'lib', 'index.js'),
        { returnResolved: true }
      ) ?? { result: null }
    ).result

    const activeRuntimeOptions = JSON.stringify(
      resolveConfig.runtime.options,
      (key, value) => {
        if (checkRuntimeEnv(value)) {
          return process.env[String(value)] ?? value.defaultValue
        }
        return value
      },
      2
    )

    const runtimeEntry = path.resolve(
      process.cwd(),
      path.join(resolveConfig.distDir, './common/local-entry/local-entry.js')
    )

    const resolveLaunchId = Math.floor(Math.random() * 1000000000)

    const server = processRegister(
      ['node', activeRuntimeModule, runtimeEntry, activeRuntimeOptions],
      {
        cwd: process.cwd(),
        maxRestarts: 0,
        kill: 5000,
        stdio: 'inherit',
        env: {
          ...process.env,
          RESOLVE_LAUNCH_ID: resolveLaunchId,
        },
      }
    )

    server.on('crash', reject)

    server.start()
    log.debug(`Server process pid: ${server.pid}`)
  })

export default startMode
