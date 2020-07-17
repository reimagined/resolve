# **EventStore Adapters**

This folder contains eventstore adapters.

A eventstore adapter is an object that must contain the following functions:

- `init` - init a database
- `drop` - drop a database
- `dispose` - disconnect
- `saveEvent` - gets an event to be saved in eventstore. Returns a Promise object that is resolved when the event is stored.
- `loadEvents` - gets an array of events filtered by the first argument and a function for handling an event as the second argument. Returns a Promise object that is resolved when all the persistent events are handled.
- `getLatestEvent` - get latest event
- `import` - returns writable stream for save events
- `export` - returns readable stream for load events
- `freeze` - freeze database
- `unfreeze` - unfreeze database
- `isFrozen` -  returns a boolean indicating whether the database is frozen 
- `loadSnapshot` - returns a snapshot
- `saveSnapshot` - saves a snapshot
- `dropSnapshot` - delete a snapshot
- `getSecret` - returns a secret
- `setSecret` - saves a secret
- `deleteSecret` - delete a secret
- `beginIncrementalImport` - begin accumulate events for incremental import
- `pushIncrementalImport` - accumulate events for incremental import 
- `commitIncrementalImport` - commit accumulated events to eventstore 
- `rollbackIncrementalImport` - drop accumulated events

Available adapters:

- [resolve-eventstore-lite](./resolve-eventstore-lite)  
   Used to store events in a local file.
- [resolve-eventstore-mysql](./resolve-eventstore-mysql)  
   Used to store events in a MySQL.
- [resolve-eventstore-postgresql](./resolve-eventstore-postgresql)  
  Used to store events in a PostgreSQL.
- [resolve-eventstore-postgresql-serverless](./resolve-eventstore-postgresql-serverless)  
   Used to store events in a PostgreSQL Serverless.  
   
### Example

```js
// Import and initializtion
import { Readable, pipeline as pipelineC } from 'stream'

import createInFileStorageAdapter from 'resolve-eventstore-lite'

const pipeline = promisify(pipelineC)

const eventStore = createInFileStorageAdapter({
  databaseFile: './data/event-store.db'
})

await eventStore.init()

const eventFilterByTimestamp = {
  eventTypes: ['EVENT_TYPE_1', 'EVENT_TYPE_2'], // Or null to load ALL event types
  aggregateIds: ['AGGREGATE_ID_1', 'AGGREGATE_ID_2'], // Or null to load ALL aggregate ids
  startTime: Date.now() - 10000, // Or null to load events from beginnig of time
  finishTime: Date.now() + 10000 // Or null to load events to current time
}

const eventFilterByCursor = {
  eventTypes: ['EVENT_TYPE_1', 'EVENT_TYPE_2'], // Or null to load ALL event types
  aggregateIds: ['AGGREGATE_ID_1', 'AGGREGATE_ID_2'], // Or null to load ALL aggregate ids
  limit: 100, //  You use the limit clause to constrain the number of events returned by the query.
  cursor: null // Control structure that enables traversal over the records in a database.
}

const {
  events: eventsByTimestamp,
} = await eventStore.loadEvents(eventFilterByTimestamp)

const {
  events: eventsByCursor,
  cursor: nextCursor
} = await eventStore.loadEvents(eventFilterByCursor)

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

const latestEvent = await eventStore.getLatestEvent({
  eventTypes: ['EVENT_TYPE_1', 'EVENT_TYPE_2'], // Or null to load ALL event types
  aggregateIds: ['AGGREGATE_ID_1', 'AGGREGATE_ID_2'], // Or null to load ALL aggregate ids
})

// Import-export
const eventStore1 = createInFileStorageAdapter({
  databaseFile: './data/event-store-1.db'
})

const eventStore2 = createInFileStorageAdapter({
  databaseFile: './data/event-store-2.db'
})

await pipeline(
  eventStore1.export(),
  eventStore2.import()
)

// Incremental import
try {
  const importId = await eventStore.beginIncrementalImport()
  await eventStore.pushIncrementalImport(events, importId)
  await eventStore.commitIncrementalImport(importId)
} catch (error) {
  await eventStore.rollbackIncrementalImport()
}
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-eventstore-adapters-readme?pixel)
