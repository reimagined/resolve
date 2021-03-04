import initResolve from '../common/init-resolve'
import disposeResolve from '../common/dispose-resolve'
import multiplexAsync from '../common/utils/multiplex-async'

const initBroker = async (resolve) => {
  const {
    assemblies: { connectPublisher, createAndInitConsumer, eventBrokerConfig },
    eventListeners,
  } = resolve

  const publisher = await connectPublisher({
    address: eventBrokerConfig.publisherAddress,
    eventListeners,
  })

  // TODO: improve lifecycle
  const consumer = await createAndInitConsumer({
    address: eventBrokerConfig.consumerAddress,
    baseResolve: resolve,
    initResolve,
    disposeResolve,
    publisher,
  })

  const invokeEventBusAsync = multiplexAsync.bind(
    null,
    async (eventSubscriber, method, parameters) => {
      const currentResolve = Object.create(resolve)
      try {
        await initResolve(currentResolve)
        const rawMethod = currentResolve.eventBus[method]
        if (typeof rawMethod !== 'function') {
          throw new TypeError(method)
        }

        const result = await rawMethod.call(currentResolve.eventBus, {
          eventSubscriber,
          ...parameters,
        })

        return result
      } finally {
        await disposeResolve(currentResolve)
      }
    }
  )

  Object.assign(resolve, {
    invokeEventBusAsync,
    publisher,
    consumer,
  })
}

export default initBroker
