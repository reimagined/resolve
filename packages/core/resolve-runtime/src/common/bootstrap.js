import debugLevels from 'resolve-debug-levels'

const log = debugLevels('resolve:resolve-runtime:bootstrap')

const bootstrap = async resolve => {
  log.debug('bootstrap started')

  try {
    // TODO: invoke "init" only during first run
    await resolve.storageAdapter.init()
  } catch (e) {}

  try {
    // TODO: invoke "init" only during first run
    await resolve.snapshotAdapter.init()
  } catch (e) {}

  const applicationPromises = []
  for (const listenerName of resolve.eventListeners.keys()) {
    applicationPromises.push(resolve.doUpdateRequest(listenerName))
  }

  await Promise.all(applicationPromises)

  log.debug('bootstrap successful')

  return 'ok'
}

export default bootstrap
