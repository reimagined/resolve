import createEventStore from 'resolve-es'

import resolveStorage from '$resolve.storage'
import resolveBus from '$resolve.bus'

const storageAdapter = resolveStorage.adapter
const storageOptions = resolveStorage.options

const busAdapter = resolveBus.adapter
const busOptions = resolveBus.options

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
