import messages from './messages'

const wrapReadInterface = storeApi => {
  const readInterface = Object.keys(storeApi).reduce((acc, functionName) => {
    acc[functionName] = async () => {
      throw new Error(messages.readSideForbiddenOperation(functionName))
    }
    return acc
  }, {})

  readInterface['find'] = storeApi.find
  readInterface['findOne'] = storeApi.findOne
  readInterface['count'] = storeApi.count

  return Object.freeze(readInterface)
}

const init = ({ metaApi, storeApi, internalContext }) => {
  if (internalContext.readInterface) {
    throw new Error(messages.alreadyInitialized)
  }
  internalContext.readInterface = wrapReadInterface(storeApi)

  if (typeof internalContext.initHandler !== 'function') {
    internalContext.initHandler = async () => {}
  }

  return {
    prepareProjection: async () => {
      const lastTimestamp = await metaApi.getLastTimestamp()
      if (lastTimestamp === 0) {
        await metaApi.setLastTimestamp(1)
        await internalContext.initHandler(storeApi)
      }

      const aggregatesVersionsMap = await metaApi.getLastAggregatesVersions()

      return { lastTimestamp, aggregatesVersionsMap }
    },

    getReadInterface: async () => {
      return internalContext.readInterface
    }
  }
}

export default init
