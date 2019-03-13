const bindReadModel = (
  pool,
  { readModelName, projection, resolvers, eventStore }
) => {
  const writeStoreApi = Object.keys(pool.storeApi).reduce((acc, key) => {
    acc[key] = pool.bindWithConnection(pool, pool.storeApi[key], readModelName)
    return acc
  }, {})

  const readStoreApi = Object.keys(writeStoreApi).reduce((acc, operation) => {
    acc[operation] = async () => {
      throw new Error(`Operation ${operation} is forbidden for read-side`)
    }
    return acc
  }, {})

  const readOperations = {
    find: [],
    findOne: null,
    count: 0
  }

  for (const operation of Object.keys(readOperations)) {
    readStoreApi[operation] = async (...args) => {
      try {
        return await writeStoreApi[operation](...args)
      } catch (err) {
        return readOperations[operation]
      }
    }
  }

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
    readStoreApi: Object.freeze(readStoreApi),
    writeStoreApi: Object.freeze(writeStoreApi)
  })

  return readModel
}

export default bindReadModel
