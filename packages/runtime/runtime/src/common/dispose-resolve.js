import debugLevels from '@resolve-js/debug-levels'

const log = debugLevels('resolve:runtime:dispose-resolve')

const disposeResolve = async (resolve) => {
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

      if (resolve.monitoring != null) {
        log.debug(`publishing monitoring data`)
        await resolve.monitoring.publish()
        log.debug(`monitoring data is published`)
      }
    } catch (error) {
      log.error('error disposing resolve entries')
      log.error(error)
    }
  }
}

export default disposeResolve
