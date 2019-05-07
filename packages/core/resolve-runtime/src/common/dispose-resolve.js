import debugLevels from 'debug-levels'

const log = debugLevels('resolve:resolve-runtime:dispose-resolve')

const disposeResolve = async resolve => {
  try {
    await resolve.eventStore.dispose()
    await resolve.executeCommand.dispose()
    await resolve.executeQuery.dispose()

    await resolve.storageAdapter.dispose()
    await resolve.snapshotAdapter.dispose()

    for (const name of Object.keys(resolve.readModelConnectors)) {
      await resolve.readModelConnectors[name].dispose()
    }

    log.info('Dispose resolve entries successfully')
  } catch (error) {
    log.error('Dispose resolve entries failed with error:')
    log.error(error)
  }
}

export default disposeResolve
