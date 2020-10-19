import getSubscribeAdapterOptions from './get-subscribe-adapter-options'
import invokeEventBus from './invoke-event-bus'

const initBroker = (resolve) => {
  Object.assign(resolve.publisher, {
    pause: async ({ eventSubscriber }) => {
      return await invokeEventBus('pause', {
        eventSubscriber,
      })
    },
    acknowledge: async ({ batchId, result }) => {
      return await invokeEventBus('acknowledge', {
        batchId,
        result,
      })
    },
    resume: async ({ eventSubscriber }) => {
      return await invokeEventBus('resume', {
        eventSubscriber,
      })
    },
    status: async ({ eventSubscriber }) => {
      return await invokeEventBus('status', {
        eventSubscriber,
      })
    },
    reset: async ({ eventSubscriber }) => {
      return await invokeEventBus('reset', {
        eventSubscriber,
      })
    },
    subscribe: async ({ eventSubscriber, subscriptionOptions }) => {
      return await invokeEventBus('subscribe', {
        eventSubscriber,
        subscriptionOptions,
      })
    },
    resubscribe: async ({ eventSubscriber, subscriptionOptions }) => {
      return await invokeEventBus('resubscribe', {
        eventSubscriber,
        subscriptionOptions,
      })
    },
    unsubscribe: async ({ eventSubscriber }) => {
      return await invokeEventBus('unsubscribe', {
        eventSubscriber,
      })
    },
    listProperties: async ({ eventSubscriber }) => {
      try {
        return await invokeEventBus('listProperties', { eventSubscriber })
      } catch (err) {
        return []
      }
    },
    getProperty: async ({ eventSubscriber, key }) => {
      try {
        return await invokeEventBus('getProperty', { eventSubscriber, key })
      } catch (err) {
        return null
      }
    },
    setProperty: async ({ eventSubscriber, key, value }) => {
      try {
        return await invokeEventBus('setProperty', {
          eventSubscriber,
          key,
          value,
        })
      } catch (err) {
        return null
      }
    },
    deleteProperty: async ({ eventSubscriber, key }) => {
      try {
        return await invokeEventBus('deleteProperty', { eventSubscriber, key })
      } catch (err) {
        return null
      }
    },
    publish: async ({ event }) => {
      return await invokeEventBus('publish', {
        credentials: resolve.eventSubscriberCredentials,
        event,
      })
    },
    read: async ({ eventFilter }) => {
      return await invokeEventBus('read', {
        credentials: resolve.eventSubscriberCredentials,
        eventFilter,
      })
    },
  })

  Object.defineProperties(resolve, {
    getSubscribeAdapterOptions: {
      value: getSubscribeAdapterOptions,
    },
  })
}

export default initBroker
