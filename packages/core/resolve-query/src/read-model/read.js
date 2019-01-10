const read = async (repository, { resolverName, resolverArgs, jwtToken }) => {
  if (repository.disposePromise) {
    throw new Error('Read model is disposed')
  }

  const resolver = repository.resolvers[resolverName]
  if (typeof resolver !== 'function') {
    throw new Error(
      `The '${resolverName}' resolver is not specified or not function`
    )
  }

  await repository.connect(repository)
  await repository.metaApi.reportDemandAccess()
  await repository.metaApi.beginTransaction(true)

  try {
    const result = await resolver(
      repository.readStoreApi,
      resolverArgs,
      jwtToken
    )

    await repository.metaApi.rollbackTransaction(true)

    return result
  } catch (error) {
    await repository.metaApi.rollbackTransaction(true)

    throw error
  }
}

export default read
