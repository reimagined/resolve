import debugLevels from 'debug-levels'

const debug = debugLevels('resolve-runtime:dispose-resolve')

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

    debug.info('Dispose resolve entries successfully')
  } catch (error) {
    debug.error('Dispose resolve entries failed with error:')
    debug.error(error)
  }
}

export default disposeResolve
