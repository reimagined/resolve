# **EventStore Adapters**

This folder contains eventstore adapters.

A eventstore adapter is an object that must contain the following functions:

- `saveEvent` - gets an event to be saved in eventstore. Returns a Promise object that is resolved when the event is stored.
- `loadEvents` - gets an array of events filtered by the first argument and a function for handling an event as the second argument. Returns a Promise object that is resolved when all the persistent events are handled.

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
import createInFileStorageAdapter from 'resolve-eventstore-lite'

const eventStorage = createInFileStorageAdapter({
  databaseFile: './data/event-store.db'
})

// Load events
const eventHandler = async event => {
  console.log('Event from eventstore', event)
  // Eventstore is waiting for event processing so overflow will not occur
  await processEvent(event)
}

const eventFilter = {
  eventTypes: ['EVENT_TYPE_1', 'EVENT_TYPE_2'], // Or null to load ALL event types
  aggregateIds: ['AGGREGATE_ID_1', 'AGGREGATE_ID_2'], // Or null to load ALL aggregate ids
  startTime: Date.now() - 10000, // Or null to load events from beginnig of time
  finishTime: Date.now() + 10000 // Or null to load events to current time
}

await eventStore.loadEvents(eventFilter, eventHandler)

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

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-eventstore-adapters-readme?pixel)
