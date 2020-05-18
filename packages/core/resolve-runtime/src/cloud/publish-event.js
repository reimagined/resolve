import debugLevels from 'resolve-debug-levels'

import invokeEventBus from './invoke-event-bus'

const log = debugLevels('resolve:resolve-runtime:cloud-entry')

const publishEvent = async (resolve, event) => {
  const eventDescriptor = {
    topic: `${process.env.RESOLVE_DEPLOYMENT_ID}/${event.type}/${event.aggregateId}`,
    payload: JSON.stringify(event),
    qos: 1
  }

  await invokeEventBus(resolve.eventstoreCredentials, 'publish', { event })

  try {
    await resolve.mqtt.publish(eventDescriptor).promise()

    log.info('Lambda pushed event into MQTT successfully', eventDescriptor)
  } catch (error) {
    log.warn('Lambda can not publish event into MQTT', eventDescriptor, error)
  }
}

export default publishEvent
