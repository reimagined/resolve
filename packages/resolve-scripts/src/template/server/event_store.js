import createEventStore from 'resolve-es'

const storageAdapter = require($resolve.storage.adapter) // eslint-disable-line
const storageOptions = $resolve.storage.options // eslint-disable-line
const busAdapter = require($resolve.bus.adapter) // eslint-disable-line
const busOptions = $resolve.bus.options // eslint-disable-line

const storage = storageAdapter(storageOptions)

const bus = busAdapter(busOptions)

const eventStore = createEventStore({ storage, bus })

// TODO. Remove. Use MQTT-Server
eventStore.subscribeOnBus = async ({ types, ids }, callback) => {
  if (Array.isArray(types) && ids === '*') {
    return await eventStore.subscribeByEventType(
      types,
      event => {
        callback(event)
      },
      {
        onlyBus: true
      }
    )
  } else if (Array.isArray(types) && Array.isArray(ids)) {
    return await eventStore.subscribeByAggregateId(
      ids,
      event => {
        types.includes(event.type) && callback(event)
      },
      { onlyBus: true }
    )
  } else {
    throw new Error('Wrong parameter for event subscription')
  }
}

export default eventStore
