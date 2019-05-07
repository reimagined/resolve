import debugLevels from 'debug-levels'

const log = debugLevels('resolve:resolve-runtime:bootstrap')

const bootstrap = async resolve => {
  const applicationPromises = []
  for (const name of resolve.systemReadModelsNames) {
    applicationPromises.push(
      resolve
        .executeQuery({
          modelName: name,
          resolverName: 'RUN_BROKER',
          resolverArgs: {}
        })
        .catch(() => {})
    )
  }

  for (const { name: readModelName } of resolve.readModels) {
    applicationPromises.push(
      resolve.executeQuery({
        modelName: readModelName,
        resolverName: resolve.bootstrapSymbol,
        resolverArgs: {}
      })
    )
  }

  await Promise.all(applicationPromises)

  log.info('Bootstrap successful')

  return 'ok'
}

export default bootstrap
