import debugLevels from 'resolve-debug-levels'

const log = debugLevels('resolve:resolve-runtime:bootstrap')

const bootstrap = async resolve => {
  log.debug('bootstrap started')

  try {
    // TODO: invoke "init" only during first run
    await resolve.storageAdapter.init()
  } catch (e) {}

  const applicationPromises = []
  for (const { name: readModelName } of resolve.readModels) {
    applicationPromises.push(resolve.doUpdateRequest(readModelName))
  }

  await Promise.all(applicationPromises)

  log.debug('bootstrap successful')

  return 'ok'
}

export default bootstrap
