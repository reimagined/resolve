import { getLog } from './get-log'
import { processRegister } from './process_manager'
import getEntryOptions from './get_entry_options'

const log = getLog('start')

const startMode = (resolveConfig) =>
  new Promise(async (resolve, reject) => {
    log.debug('Starting "start" mode')
    const {
      activeRuntimeModule,
      runtimeEntry,
      activeRuntimeOptions,
    } = getEntryOptions(resolveConfig)
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
