import createEventStore from 'resolve-es'

const storageAdapter = require($resolve.storage.adapter)
const storageOptions = $resolve.storage.options
const busAdapter = require($resolve.bus.adapter)
const busOptions = $resolve.bus.options

const storage = storageAdapter(storageOptions)

const bus = busAdapter(busOptions)

const eventStore = createEventStore({ storage, bus })
;(async () => {
  try {
    await eventStore.init()
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    process.exit(1)
  }
})()

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
