import messages from './messages'

const bindReadModel = (pool, readModelName) => {
  const metaApi = Object.keys(pool.metaApi).reduce((acc, key) => {
    acc[key] = pool.bindWithConnection(pool, pool.metaApi[key], readModelName)
    return acc
  }, {})

  const storeApi = Object.keys(pool.storeApi).reduce((acc, key) => {
    acc[key] = pool.bindWithConnection(pool, pool.storeApi[key], readModelName)
    return acc
  }, {})

  const writeStoreApi = pool.checkStoreApi({ metaApi, storeApi })

  const readStoreApi = Object.keys(writeStoreApi).reduce(
    (acc, functionName) => {
      acc[functionName] = async () => {
        throw new Error(messages.readSideForbiddenOperation(functionName))
      }
      return acc
    },
    {}
  )

  readStoreApi['find'] = writeStoreApi.find
  readStoreApi['findOne'] = writeStoreApi.findOne
  readStoreApi['count'] = writeStoreApi.count

  Object.freeze(readStoreApi)

  return { metaApi, readStoreApi, writeStoreApi }
}

export default bindReadModel
