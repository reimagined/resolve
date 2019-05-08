import invokeMeta from './invoke-meta'

const initBroker = resolve => {
  Object.assign(resolve.eventBroker, {
    pause: async listenerId => {
      return await invokeMeta(resolve, listenerId, 'pause')
    },
    resume: async listenerId => {
      return await invokeMeta(resolve, listenerId, 'resume')
    },
    status: async listenerId => {
      return await invokeMeta(resolve, listenerId, 'status')
    },
    reset: async listenerId => {
      return await invokeMeta(resolve, listenerId, 'reset')
    },
    listProperties: async listenerId => {
      return await invokeMeta(resolve, listenerId, 'listProperties')
    },
    getProperty: async (listenerId, key) => {
      return await invokeMeta(resolve, listenerId, 'getProperty', { key })
    },
    setProperty: async (listenerId, key, value) => {
      return await invokeMeta(resolve, listenerId, 'setProperty', {
        key,
        value
      })
    },
    deleteProperty: async (listenerId, key) => {
      return await invokeMeta(resolve, listenerId, 'deleteProperty', {
        key
      })
    }
  })
}

export default initBroker
