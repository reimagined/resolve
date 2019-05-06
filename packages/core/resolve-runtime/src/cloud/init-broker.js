import invokeMetaLock from './invoke-meta-lock'

const initBroker = resolve => {
  Object.assign(resolve.eventBroker, {
    pause: async listenerId => {
      return await invokeMetaLock(resolve, listenerId, 'pause')
    },
    resume: async listenerId => {
      return await invokeMetaLock(resolve, listenerId, 'resume')
    },
    status: async listenerId => {
      return await invokeMetaLock(resolve, listenerId, 'status')
    },
    reset: async listenerId => {
      return await invokeMetaLock(resolve, listenerId, 'reset')
    },
    listProperties: async listenerId => {
      return await invokeMetaLock(resolve, listenerId, 'listProperties')
    },
    getProperty: async (listenerId, key) => {
      return await invokeMetaLock(resolve, listenerId, 'getProperty', { key })
    },
    setProperty: async (listenerId, key, value) => {
      return await invokeMetaLock(resolve, listenerId, 'setProperty', {
        key,
        value
      })
    },
    deleteProperty: async (listenerId, key) => {
      return await invokeMetaLock(resolve, listenerId, 'deleteProperty', {
        key
      })
    }
  })
}

export default initBroker
