import getSubscribeAdapterOptions from './get-subscribe-adapter-options'
import invokeMeta from './invoke-meta'
import invokeUpdateLambda from './invoke-update-lambda'
import publishEvent from './publish-event'

const initBroker = resolve => {
  Object.assign(resolve.eventBroker, {
    pause: async listenerId => {
      return await invokeMeta(resolve, listenerId, 'pause')
    },
    resume: async listenerId => {
      const result = await invokeMeta(resolve, listenerId, 'resume')

      const listenerDescriptor = resolve.readModels.find(
        ({ name }) => name === listenerId
      )
      await invokeUpdateLambda(resolve, listenerDescriptor)

      return result
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

  Object.defineProperties(resolve, {
    getSubscribeAdapterOptions: {
      value: getSubscribeAdapterOptions.bind(null, resolve)
    },
    publishEvent: {
      value: publishEvent.bind(null, resolve)
    },
    doUpdateRequest: {
      value: async readModelName => {
        const readModel = resolve.readModels.find(
          ({ name }) => name === readModelName
        )
        await invokeUpdateLambda(resolve, readModel)
      }
    }
  })
}

export default initBroker
