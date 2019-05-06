# **resolve-es**

[![npm version](https://badge.fury.io/js/resolve-es.svg)](https://badge.fury.io/js/resolve-es)

Provides an event store implementation with the capability to use different [storage](../../adapters/storage-adapters) adapters to store and emit events.

## Usage

When initializing an event store, pass the following arguments:

#### `storage`  
Use a reSolve framework [adapter](../../adapters/storage-adapters)
* [resolve-storage-dynamo](../../adapters/storage-adapters/resolve-storage-dynamo)
* [resolve-storage-lite](../../adapters/storage-adapters/resolve-storage-lite)
* [resolve-storage-mongo](../../adapters/storage-adapters/resolve-storage-mongo)
* [resolve-storage-mysql](../../adapters/storage-adapters/resolve-storage-mysql)

#### `publishEvent`
The hook function after calling "eventStore.saveEvent"

### Example
```js
// Import and initializtion
import createEventStore from 'resolve-es'
import createInFileStorageAdapter from 'resolve-storage-lite'

const storage = createInFileStorageAdapter({ databaseFile: './data/event-store.db' })

const publishEvent = async (event) => {
  console.log(event) // Send event to subscribers
} 

const eventStore = createEventStore({
  storage,
  publishEvent
})

// Load events
const eventHandler = async event => {
  console.log('Event from eventstore', event)
  // Event store is waiting for event processing so overflow will not occur
  await processEvent(event)
}

const eventFilter = {
  eventTypes: ['EVENT_TYPE_1', 'EVENT_TYPE_2'], // Or null to load ALL event types
  aggregateIds: ['AGGREGATE_ID_1', 'AGGREGATE_ID_2'], // Or null to load ALL aggregate ids
  startTime: Date.now() - 10000, // Or null to load events from beginning of time
  finishTime: Date.now() + 10000 // Or null to load events to current time
}

await eventStore.loadEvents(eventFilter, eventHandler)

const latestEvent = await getLatestEvent()

// Save event
const event = {
  aggregateId: '1',
  aggregateVersion: 2,
  type: 'UserCreated',
  payload: {
    email: 'test@user.com'
  }
}

await eventStore.saveEvent(event)
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-es-readme?pixel)
