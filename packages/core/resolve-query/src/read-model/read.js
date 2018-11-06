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

  const getModelReadInterface = repository.getModelReadInterface.bind(
    null,
    repository
  )

  const store = await getModelReadInterface(true)

  getModelReadInterface(false).catch(() => null)

  return await resolver(store, resolverArgs, jwtToken)
}

export default read
