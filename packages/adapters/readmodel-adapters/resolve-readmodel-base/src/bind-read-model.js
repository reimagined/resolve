const bindReadModel = (
  pool,
  { readModelName, projection, resolvers, eventStore }
) => {
  const writeStoreApi = Object.keys(pool.storeApi).reduce((acc, key) => {
    acc[key] = pool.bindWithConnection(pool, pool.storeApi[key], readModelName)
    return acc
  }, {})

  const allowedReadFunctions = ['find', 'findOne', 'count']

  const readStoreApi = Object.freeze(
    Object.keys(writeStoreApi).reduce((acc, functionName) => {
      acc[functionName] = allowedReadFunctions.includes(functionName)
        ? writeStoreApi[functionName]
        : async () => {
            throw new Error(
              `Operation ${functionName} is forbidden for read-side`
            )
          }
      return acc
    }, {})
  )

  const readModel = {
    resolvers: resolvers != null ? resolvers : {},
    eventTypes: Object.keys(projection),
    projection,
    readModelName,
    eventStore
  }

  Object.assign(readModel, {
    read: pool.read.bind(null, readModel),
    readAndSerialize: pool.readAndSerialize.bind(null, readModel),
    updateByEvents: pool.updateByEvents.bind(null, readModel),
    dispose: pool.disposeReadModel.bind(null, readModel),
    readStoreApi,
    writeStoreApi
  })

  return readModel
}

export default bindReadModel
