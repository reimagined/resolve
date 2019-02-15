const read = async (
  readModel,
  { resolverName, resolverArgs, jwtToken, isBulkRead }
) => {
  if (readModel.disposePromise) {
    throw new Error('Read model is disposed')
  }

  await readModel.metaApi.reportDemandAccess()
  // TODO: intoroduce `touch` function instead `isBulkRead` flag
  if (isBulkRead) {
    return null
  }

  const resolver = readModel.resolvers[resolverName]
  if (typeof resolver !== 'function') {
    throw new Error(
      `The '${resolverName}' resolver is not specified or not function`
    )
  }

  await readModel.metaApi.beginTransaction(true)

  try {
    const result = await resolver(
      readModel.readStoreApi,
      resolverArgs,
      jwtToken
    )

    await readModel.metaApi.rollbackTransaction(true)

    return result
  } catch (error) {
    await readModel.metaApi.rollbackTransaction(true)

    throw error
  }
}

export default read
