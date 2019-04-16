const statusHandler = async (req, res) => {
  const allResolversByReadModel = req.resolve.allResolversByReadModel
  const applicationPromises = []

  for (const [
    readModelName,
    resolversList
  ] of allResolversByReadModel.entries()) {
    for (const resolverName of resolversList) {
      applicationPromises.push(
        req.resolve.executeQuery({
          modelName: readModelName,
          resolverName,
          resolverArgs: {},
          jwtToken: null
        })
      )
    }
  }

  try {
    await Promise.all(applicationPromises)
  } catch (e) {}

  await new Promise(resolve => setTimeout(resolve, 2000))

  await res.end('ok')
}

export default statusHandler
