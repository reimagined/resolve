import getSubscribeAdapterOptions from './get-subscribe-adapter-options'
import invokeEventBus from './invoke-event-bus'

const initBroker = resolve => {
  Object.assign(resolve.publisher, {
    pause: async ({ eventSubscriber }) => {
      return await invokeEventBus(resolve.eventstoreCredentials, 'pause', {
        eventSubscriber
      })
    },
    acknowledge: async ({ batchId, result }) => {
      return await invokeEventBus(
        resolve.eventstoreCredentials,
        'acknowledge',
        {
          batchId,
          result
        }
      )
    },
    publish: async ({ event }) => {
      return await invokeEventBus(resolve.eventstoreCredentials, 'publish', {
        event
      })
    },
    resume: async ({ eventSubscriber }) => {
      return await invokeEventBus(resolve.eventstoreCredentials, 'resume', {
        eventSubscriber
      })
    },
    status: async ({ eventSubscriber }) => {
      return await invokeEventBus(resolve.eventstoreCredentials, 'status', {
        eventSubscriber
      })
    },
    reset: async ({ eventSubscriber }) => {
      return await invokeEventBus(resolve.eventstoreCredentials, 'reset', {
        eventSubscriber
      })
    },
    read: async ({ eventFilter }) => {
      return await invokeEventBus(resolve.eventstoreCredentials, 'read', {
        eventFilter
      })
    },
    subscribe: async ({ eventSubscriber, subscriptionOptions }) => {
      return await invokeEventBus(resolve.eventstoreCredentials, 'subscribe', {
        eventSubscriber,
        subscriptionOptions
      })
    },
    resubscribe: async ({ eventSubscriber, subscriptionOptions }) => {
      return await invokeEventBus(
        resolve.eventstoreCredentials,
        'resubscribe',
        {
          eventSubscriber,
          subscriptionOptions
        }
      )
    },
    unsubscribe: async ({ eventSubscriber }) => {
      return await invokeEventBus(
        resolve.eventstoreCredentials,
        'unsubscribe',
        {
          eventSubscriber
        }
      )
    },
    listProperties: async ({ eventSubscriber }) => {
      try {
        return await invokeEventBus(
          resolve.eventstoreCredentials,
          'listProperties',
          { eventSubscriber }
        )
      } catch (err) {
        return []
      }
    },
    getProperty: async ({ eventSubscriber, key }) => {
      try {
        return await invokeEventBus(
          resolve.eventstoreCredentials,
          'getProperty',
          { eventSubscriber, key }
        )
      } catch (err) {
        return null
      }
    },
    setProperty: async ({ eventSubscriber, key, value }) => {
      try {
        return await invokeEventBus(
          resolve.eventstoreCredentials,
          'setProperty',
          { eventSubscriber, key, value }
        )
      } catch (err) {
        return null
      }
    },
    deleteProperty: async ({ eventSubscriber, key }) => {
      try {
        return await invokeEventBus(
          resolve.eventstoreCredentials,
          'deleteProperty',
          { eventSubscriber, key }
        )
      } catch (err) {
        return null
      }
    }
  })

  Object.defineProperties(resolve, {
    getSubscribeAdapterOptions: {
      value: getSubscribeAdapterOptions
    }
  })
}

export default initBroker
