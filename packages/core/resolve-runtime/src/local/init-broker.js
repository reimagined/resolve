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

  const publishEvent = async event => {
    await publisher.publish({ event })

    await resolve.pubsubManager.dispatch({
      topicName: event.type,
      topicId: event.aggregateId,
      event
    })
  }

  // TODO: improve lifecycle
  const consumer = await createAndInitConsumer({
    address: eventBrokerConfig.consumerAddress,
    baseResolve: resolve,
    initResolve,
    disposeResolve,
    publisher
  })

  Object.assign(resolve, {
    publishEvent,
    publisher,
    consumer
  })
}

export default initBroker
