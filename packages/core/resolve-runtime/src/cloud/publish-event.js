import debugLevels from 'resolve-debug-levels'

const log = debugLevels('resolve:resolve-runtime:cloud-entry')

const publishEvent = async (resolve, event) => {
  const eventDescriptor = {
    topic: `${process.env.RESOLVE_DEPLOYMENT_ID}/${event.type}/${event.aggregateId}`,
    payload: JSON.stringify(event),
    qos: 1
  }

  try {
    const promises = []
    for (const listener of resolve.eventListeners.values()) {
      const { name: listenerId, eventTypes } = listener
      if (eventTypes.includes(event.type)) {
        promises.push(resolve.doUpdateRequest(listenerId))
      }
    }
    await Promise.all(promises)

    log.info('Lambda pushed event into step function updater successfully')
  } catch (error) {
    log.warn('Lambda can not publish event into step function updater', error)
  }

  try {
    await resolve.mqtt.publish(eventDescriptor).promise()

    log.info('Lambda pushed event into MQTT successfully', eventDescriptor)
  } catch (error) {
    log.warn('Lambda can not publish event into MQTT', eventDescriptor, error)
  }
}

export default publishEvent
