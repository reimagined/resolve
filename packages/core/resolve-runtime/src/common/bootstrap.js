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

  for (const [
    readModelName,
    resolverNames
  ] of resolve.allResolversByReadModel.entries()) {
    for (const resolverName of resolverNames) {
      applicationPromises.push(
        resolve
          .executeQuery({
            modelName: readModelName,
            resolverName,
            resolverArgs: {}
          })
          .catch(() => {})
      )
    }
  }

  await Promise.all(applicationPromises)

  resolveLog('info', 'Bootstrap successful')

  await new Promise(resolve => setTimeout(resolve, 2000))

  return null
}

export default bootstrap
