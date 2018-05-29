import createEventStore from 'resolve-es'

import storageAdapter from '$resolve.storageAdapter'
import busAdapter from '$resolve.busAdapter'

const createStorageAdapter = storageAdapter.module
const storageAdapterOptions = storageAdapter.options

const createBusAdapter = busAdapter.module
const busAdapterOptions = busAdapter.options

const storage = createStorageAdapter(storageAdapterOptions)

const bus = createBusAdapter(busAdapterOptions)

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
