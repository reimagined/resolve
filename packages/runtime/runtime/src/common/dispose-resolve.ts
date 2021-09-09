import debugLevels from '@resolve-js/debug-levels'

import type { Resolve } from './types'

const log = debugLevels('resolve:runtime:dispose-resolve')

const disposeResolve = async (resolve: Resolve) => {
  if (resolve.isInitialized) {
    try {
      const disposePromises = [
        resolve.executeCommand.dispose(),
        resolve.executeQuery.dispose(),
        resolve.executeSaga.dispose(),
        resolve.eventstoreAdapter.dispose(),
      ]

      for (const name of Object.keys(resolve.readModelConnectors)) {
        disposePromises.push(resolve.readModelConnectors[name].dispose())
      }

      log.debug(`awaiting ${disposePromises.length} entries to dispose`)

      await Promise.all(disposePromises)

      log.info('resolve entries are disposed')
    } catch (error) {
      log.error('error disposing resolve entries')
      log.error(error)
    }
  }
}

export default disposeResolve
