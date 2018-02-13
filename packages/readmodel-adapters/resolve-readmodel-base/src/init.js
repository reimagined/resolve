// import createNativeAdapter from './adapter'
// import storeInterface from './storeInterface'
import messages from './messages'

const initProjection = async ({ metaApi, storeApi, internalContext }) => {
  const lastTimestamp = await metaApi.getLastTimestamp()
  if (lastTimestamp !== 0) return
  await metaApi.setLastTimestamp(1)

  try {
    await internalContext.initHandler(storeApi)
  } catch (error) {
    internalContext.internalError = error
  }
}

const wrapReadInterface = storeApi => {
  const readInterface = Object.key(storeApi).reduce((acc, functionName) => {
    acc[functionName] = async () => {
      throw new Error(messages.readSideForbiddenOperation(functionName))
    }
    return acc
  }, {})

  readInterface['find'] = storeApi.find

  return Object.freeze(readInterface)
}

const init = ({ metaApi, storeApi, internalContext }) => {
  if (internalContext.isInitialized) {
    throw new Error(messages.alreadyInitialized)
  }
  internalContext.isInitialized = true

  if (typeof internalContext.initHandler !== 'function') {
    internalContext.initHandler = async () => {}
  }

  internalContext.internalError = null

  const readInterface = wrapReadInterface(storeApi)

  internalContext.initDonePromise = initProjection({
    metaApi,
    storeApi,
    internalContext
  })

  return {
    getLastAppliedTimestamp: async () => await metaApi.getLastTimestamp(),
    getReadable: async () => {
      await internalContext.initDonePromise
      return readInterface
    },
    getError: async () => {
      await internalContext.initDonePromise
      return internalContext.internalError
    }
  }
}

export default init
