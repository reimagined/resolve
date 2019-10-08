import debugLevels from 'resolve-debug-levels'

const log = debugLevels('resolve:resolve-runtime:dispose-resolve')

const disposeResolve = async resolve => {
  try {
    const disposePromises = [
      resolve.eventStore.dispose(),
      resolve.executeCommand.dispose(),
      resolve.executeQuery.dispose(),
      resolve.executeSaga.dispose(),
      resolve.storageAdapter.dispose(),
      resolve.snapshotAdapter.dispose()
    ]

    for (const name of Object.keys(resolve.readModelConnectors)) {
      disposePromises.push(resolve.readModelConnectors[name].dispose())
    }

    await Promise.all(disposePromises)

    log.info('Dispose resolve entries successfully')
  } catch (error) {
    log.error('Dispose resolve entries failed with error:')
    log.error(error)
  }
}

export default disposeResolve
