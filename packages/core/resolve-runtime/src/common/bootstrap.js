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

  resolveLog('info', 'Bootstrap successful')

  return null
}

export default bootstrap
