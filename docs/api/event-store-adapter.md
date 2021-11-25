---
id: event-store-adapter
title: Event Store Adapter
description: This document describes the interface that an event store adapter should expose.
---

An event store adapter defines how the reSolve framework stores events in the underlying event store. An event store adapter object must expose the following functions:

| Function Name                                           | Description                                                                                        |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [init](#init)                                           | Initializes a database.                                                                            |
| [drop](#drop)                                           | Drops a database.                                                                                  |
| [describe](#describe)                                   | Obtain information about the event store.                                                          |
| [dispose](#dispose)                                     | Disconnects from a database and disposes unmanaged resources.                                      |
| [saveEvent](#saveevent)                                 | Saves an event to the database.                                                                    |
| [loadEvents](#loadEvents)                               | Gets an array of events and the next cursor from the store based on the specified filter criteria. |
| [getLatestEvent](#getlatestevent)                       | Gets the latest saved event.                                                                       |
| [import](#import)                                       | Gets a writable stream used to save events.                                                        |
| [export](#export)                                       | Gets a readable stream used to load events.                                                        |
| [freeze](#freeze)                                       | Freezes the database.                                                                              |
| [unfreeze](#unfreeze)                                   | Unfreezes the database.                                                                            |
| [loadSnapshot](#loadsnapshot)                           | Loads a snapshot.                                                                                  |
| [saveSnapshot](#savesnapshot)                           | Creates or updates a snapshot.                                                                     |
| [dropSnapshot](#dropsnapshot)                           | Deletes a snapshot.                                                                                |
| [incrementalImport](#incrementalimport)                 | Incrementally imports events.                                                                      |
| [beginIncrementalImport](#beginincrementalimport)       | Starts to build a batch of events to import.                                                       |
| [pushIncrementalImport](#pushincrementalimport)         | Adds events to an incremental import batch.                                                        |
| [commitIncrementalImport](#commitincrementalimport)     | Commits an incremental import batch to the event store.                                            |
| [rollbackIncrementalImport](#rollbackincrementalimport) | Drops an incremental import batch.                                                                 |

### init

Initializes the database.

#### Example

```js
import createEventStoreAdapter from '@resolve-js/eventstore-xxx'

const eventStoreAdapter = createEventStoreAdapter(options)

await eventStoreAdapter.init()
```

### drop

Drops the database.

#### Example

```js
await eventStoreAdapter.drop()
```

### describe

Obtain information about the event store.

##### Arguments

| Argument Name | Description                                             |
| ------------- | ------------------------------------------------------- |
| options       | { estimateCounts?: boolean, calculateCursor?: boolean } |

##### Result

```ts
Promise<{
  eventCount: number
  secretCount: number
  setSecretCount: number
  deletedSecretCount: number
  isFrozen: boolean
  lastEventTimestamp: number
  cursor?: string | null
  resourceNames?: { [key: string]: string }
}>
```

#### Example

```js
const eventCount = await eventStoreAdapter.describe({ estimateCounts: true })).eventCount
```

### dispose

Disconnects from the database and disposes unmanaged resources.

#### Example

```js
await eventStoreAdapter.dispose()
```

### saveEvent

Saves an event to the database.

| Argument Name | Description                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------ |
| event         | { aggregateId: string, aggregateVersion: number, type: string, timestamp: number, payload: any } |

#### Example

```js
await eventStoreAdapter.saveEvent({
  aggregateId: 'user-id',
  aggregateVersion: 1,
  type: 'USER_CREATED',
  timestamp: Date.now(),
  payload: {
    name: 'user-name',
  },
})
```

### loadEvents

Gets an array of events and the next cursor from the store based on the specified filter criteria.

##### Arguments

| Argument Name | Description                                                                                                                                                                                                                                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventFilter   | { cursor: string or null, limit: number, eventsSizeLimit: number, eventTypes: Array&lt;string&gt;, aggregateIds: Array&lt;string&gt; } <br /> or <br /> { startTime?: number, finishTime?: number, limit: number, eventsSizeLimit: number, eventTypes: Array&lt;string&gt;, aggregateIds: Array&lt;string&gt; } |

##### Result

```ts
Promise<{
  events: Array<{
    threadId: number,
    threadCounter: number,
    aggregateId: string,
    aggregateVersion: number,
    type: string,
    timestamp: number,
    payload: any
  }>,
  cursor: string
}>
```

#### Example

```js
// Iterate through events.
let nextCursor = null
do {
  void ({ events, cursor: nextCursor } = await adapter.loadEvents({
    limit: 1,
    cursor: nextCursor,
  }))
} while (events.length > 0)

// Load evets from the specified timespan.
const { events } = await adapter.loadEvents({
  limit: Number.MAX_SAFE_INTEGER,
  startTime: Date.now() - 1000,
  endTime: Date.now(),
})

// Load events of the specified type.
const { events } = await adapter.loadEvents({
  limit: 1000,
  eventTypes: ['ITEM_CREATED'],
  cursor: null,
})

// Load events with the specified aggregate ID.
const { events } = await adapter.loadEvents({
  limit: 1000,
  aggregateIds: ['list-1'],
  cursor: null,
})
```

### getLatestEvent

Gets the latest saved event.

### import

Gets a writable stream used to save events.

##### Arguments

`void`

##### Result

`WritableStream`

### export

Gets a readable stream used to load events.

##### Arguments

`void`

##### Result

`ReadableStream`

#### Example

```js
import { pipeline as pipelineC } from 'stream'
import { promisify } from 'util'

const pipeline = promisify(pipelineC)

await pipeline(eventStoreAdapter1.import(), eventStoreAdapter2.export())
```

### freeze

Freezes the database.

##### Arguments

`void`

##### Result

`Promise<void>`

#### Example

```js
await eventStoreAdapter.freeze()
```

### unfreeze

Unfreezes the database.

##### Arguments

`void`

##### Result

`Promise<void>`

#### Example

```js
await eventStoreAdapter.unfreeze()
```

### loadSnapshot

Loads a snapshot.

##### Arguments

| Argument Name | Description                             |
| ------------- | --------------------------------------- |
| snapshotKey   | A unique key in the table of snapshots. |

##### Result

content: `Promise<string | null>`

#### Example

```js
const content = await eventStoreAdapter.loadSnapshot(snapshotKey)
if (content == null) {
  throw new Error('SnapshotNotFoundException')
}
```

### saveSnapshot

Creates or updates a snapshot.

##### Arguments

| Argument Name | Description                             |
| ------------- | --------------------------------------- |
| snapshotKey   | A unique key in the table of snapshots. |
| content       | A snapshot in text format.              |

##### Result

`Promise<void>`

#### Example

```js
await eventStoreAdapter.saveSnapshot(snapshotKey, content)
```

### dropSnapshot

Deletes a snapshot.

##### Arguments

| Argument Name | Description                            |
| ------------- | -------------------------------------- |
| snapshotKey   | A unique key in the table of snapshots |

##### Result

`Promise<void>`

#### Example

```js
await eventStoreAdapter.dropSnapshot(snapshotKey)
```

### incrementalImport

Incrementally imports events.

##### Arguments

| Argument Name | Description                                                                           |
| ------------- | ------------------------------------------------------------------------------------- |
| events        | An array of `{ aggregateId: string, type: string, timestamp: number, payload: any }`. |

##### Result

`Promise<void>`

#### Example

```js
await eventStoreAdapter.incrementalImport(events)
```

### beginIncrementalImport

Starts to build a batch of events to import.

##### Arguments

`void`

##### Result

importId: `Promise<string>`

### pushIncrementalImport

Adds events to an incremental import batch.

##### Arguments

| Argument Name | Description                                                                           |
| ------------- | ------------------------------------------------------------------------------------- |
| events        | An array of `{ aggregateId: string, type: string, timestamp: number, payload: any }`. |
| importId      | A unique key of an import batch.                                                      |

##### Result

`Promise<void>`

### commitIncrementalImport

Commits an incremental import batch to the event store.

##### Arguments

| Argument Name | Description                      |
| ------------- | -------------------------------- |
| importId      | A unique key of an import batch. |

##### Result

`Promise<void>`

### rollbackIncrementalImport

Drops an incremental import batch.

##### Arguments

`void`

##### Result

`Promise<void>`
