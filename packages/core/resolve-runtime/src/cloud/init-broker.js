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
    }
  })
}

export default initBroker
