import initResolve from '../common/init-resolve'
import disposeResolve from '../common/dispose-resolve'

const initBroker = async resolve => {
  const {
    assemblies: { connectPublisher, createAndInitConsumer, eventBrokerConfig },
    eventListeners
  } = resolve

  const publisher = await connectPublisher({
    address: eventBrokerConfig.publisherAddress,
    eventListeners
  })

  // TODO: improve lifecycle
  const consumer = await createAndInitConsumer({
    address: eventBrokerConfig.consumerAddress,
    baseResolve: resolve,
    initResolve,
    disposeResolve,
    publisher
  })

  Object.assign(resolve, {
    publisher,
    consumer
  })
}

export default initBroker
