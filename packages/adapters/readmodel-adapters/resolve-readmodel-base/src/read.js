const read = async (readModel, { resolverName, resolverArgs, jwtToken }) => {
  if (readModel.disposePromise) {
    throw new Error('Read model is disposed')
  }

  const resolver = readModel.resolvers[resolverName]
  if (typeof resolver !== 'function') {
    throw new Error(
      `The '${resolverName}' resolver is not specified or not function`
    )
  }

  const result = await resolver(readModel.readStoreApi, resolverArgs, jwtToken)

  return result
}

export default read
