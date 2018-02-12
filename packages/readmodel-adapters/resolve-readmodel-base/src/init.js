// import createNativeAdapter from './adapter'
// import storeInterface from './storeInterface'
import messages from './messages'

const initProjection = async ({ metaApi, storeApi, internalContext }) => {
  await internalContext.connectionPromise
  const lastTimestamp = await metaApi.getLastTimestamp()
  if (lastTimestamp !== 0) return
  await metaApi.setLastTimestamp(1)

  try {
    await internalContext.initHandler(storeApi)
  } catch (error) {
    internalContext.internalError = error
  }
}

const init = ({ databaseApi, metaApi, storeApi, internalContext }) => {
  if (internalContext.isInitialized) {
    throw new Error(messages.alreadyInitialized)
  }
  internalContext.isInitialized = true

  if (typeof internalContext.initHandler !== 'function') {
    internalContext.initHandler = async () => {}
  }

  internalContext.connectionPromise = databaseApi.connect()

  internalContext.internalError = null

  // repository.readInterface = storeInterface(repository, false)
  // repository.writeInterface = storeInterface(repository, true)

  internalContext.initDonePromise = initProjection({
    metaApi,
    storeApi,
    internalContext
  })

  return {
    getLastAppliedTimestamp: async () => {
      await internalContext.connectionPromise
      return await metaApi.getLastTimestamp()
    },
    getReadable: async () => {
      await internalContext.initDonePromise
      return //repository.readInterface
    },
    getError: async () => {
      await internalContext.initDonePromise
      return internalContext.internalError
    }
  }
}

export default init
