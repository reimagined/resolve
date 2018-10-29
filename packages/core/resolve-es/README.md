# **resolve-es**

[![npm version](https://badge.fury.io/js/resolve-es.svg)](https://badge.fury.io/js/resolve-es)

Provides an event store implementation with the capability to use different [storage](../storage-adapters) and [bus](../bus-adapters) adapters to store and emit events.

## Usage

When initializing an event store, pass the following arguments:

- `storage`  
   Use a reSolve framework [adapter](../storage-adapters)...
  _ [resolve-storage-mongo](../storage-adapters/resolve-storage-mongo)
  _ [resolve-storage-lite](../storage-adapters/resolve-storage-lite)

      	... or implement a custom storage adapter. A storage adapter is an object with the following fields:
      	* `loadEvents` - gets an array of events filtered by the first argument and a function for handling an event as the second argument. Returns a Promise object that is resolved when all the persistent events are handled. If bus involved in loading events, promise resolves with unsubscribe callback for bus, or resolves with null in another case.
      	* `saveEvent` - a function which takes an event and returns a Promise that is resolved when the event is stored. Event should contain following required fields: `aggregateId`, `aggregateVersion` and `type`. Using `saveEvent` function in custom code is not not recommended.

* `bus`  
   Use a reSolve framework [adapter](../bus-adapters)...
  _ [resolve-bus-memory](../bus-adapters/resolve-bus-memory)
  _ [resolve-bus-rabbitmq](../bus-adapters/resolve-bus-rabbitmq) \* [resolve-bus-zmq](../bus-adapters/resolve-bus-zmq)

      	... or implement a custom bus adapter. A bus adapter is an object with the following fields:
      	* `subscribe` - a function called when an event is emitted. It takes an emitted event.
      	* `publish` - a function that takes an event and publishes it.

### Example

```js
// Import and initializtion
import createEventStore from 'resolve-es'
import createInFileStorageAdapter from 'resolve-storage-lite'
import createInMemoryBusAdapter from 'resolve-bus-memory'

const eventStore = createEventStore({
  storage: createInFileStorageAdapter({ pathToFile: './event-store.db' }),
  bus: createInMemoryBusAdapter()
})

// Load events
const eventHandler = async event => {
  console.log('Event from eventstore', event)
  // Eventstore is waiting for event processing so overflow will not occur
  await processEvent(event)
}

const eventFilter = {
  skipStorage: false, // Or true to skip event loading from storage
  skipBus: false, // Or true to skip bus subscription
  eventTypes: ['EVENT_TYPE_1', 'EVENT_TYPE_2'], // Or null to load ALL event types
  aggregateIds: ['AGGREGATE_ID_1', 'AGGREGATE_ID_2'], // Or null to load ALL aggregate ids
  startTime: Date.now() - 10000, // Or null to load events from beginnig of time
  finishTime: Date.now() + 10000 // Or null to load events to current time
}

const unsubscribe = await eventStore.loadEvents(eventFilter, eventHandler)

await unsubscribe() // Or do nothing if skipBus: true

// Save event
const event = {
  aggregateId: '1',
  aggregateVersion: 2,
  type: 'UserCreated',
  payload: {
    email: 'test@user.com'
  }
}

eventStore.saveEvent(event)
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-es-readme?pixel)
