import debugLevels from 'resolve-debug-levels'

const log = debugLevels('resolve:resolve-runtime:dispose-resolve')

const disposeResolve = async (resolve) => {
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
    log.error('resolve entries disposing error')
    log.error(error)
  }
}

export default disposeResolve
