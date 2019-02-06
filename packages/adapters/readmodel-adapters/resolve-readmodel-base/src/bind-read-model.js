import messages from './messages'

const bindReadModel = (
  pool,
  { readModelName, projection: inputProjection, resolvers, eventStore }
) => {
  const metaApi = Object.keys(pool.metaApi).reduce((acc, key) => {
    acc[key] = pool.bindWithConnection(pool, pool.metaApi[key], readModelName)
    return acc
  }, {})

  const storeApi = Object.keys(pool.storeApi).reduce((acc, key) => {
    acc[key] = pool.bindWithConnection(pool, pool.storeApi[key], readModelName)
    return acc
  }, {})

  const writeStoreApi = pool.checkStoreApi({ metaApi, storeApi })
  const allowedReadFunctions = ['find', 'findOne', 'count']

  const readStoreApi = Object.freeze(
    Object.keys(writeStoreApi).reduce((acc, functionName) => {
      acc[functionName] = allowedReadFunctions.includes(functionName)
        ? writeStoreApi[functionName]
        : async () => {
            throw new Error(messages.readSideForbiddenOperation(functionName))
          }
      return acc
    }, {})
  )

  const { Init: initHandler, ...projection } =
    inputProjection != null ? inputProjection : {}

  const readModel = {
    resolvers: resolvers != null ? resolvers : {},
    eventTypes: Object.keys(projection),
    initHandler,
    projection,
    readModelName,
    eventStore
  }

  Object.assign(readModel, {
    boundProjectionInvoker: pool.projectionInvoker.bind(null, readModel),
    loadEvents: pool.loadEvents.bind(null, readModel),
    getLastError: pool.getLastError.bind(null, readModel),
    read: pool.read.bind(null, readModel),
    readAndSerialize: pool.readAndSerialize.bind(null, readModel),
    updateByEvents: pool.updateByEvents.bind(null, readModel),
    dispose: pool.disposeReadModel.bind(null, readModel),
    readStoreApi: Object.freeze(
      Object.create(readStoreApi, {
        waitEventCausalConsistency: {
          value: pool.waitEventCausalConsistency.bind(null, readModel)
        }
      })
    ),
    writeStoreApi,
    metaApi
  })

  return readModel
}

export default bindReadModel
