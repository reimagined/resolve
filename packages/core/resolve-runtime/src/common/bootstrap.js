import debugLevels from 'debug-levels'

const debug = debugLevels('resolve-runtime:bootstrap')

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

  debug.info('Bootstrap successful')

  return null
}

export default bootstrap
