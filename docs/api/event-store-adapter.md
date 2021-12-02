---
id: event-store-adapter
title: Event Store Adapter
description: This document describes the interface that an event store adapter should expose.
---

An event store adapter defines how the reSolve framework stores events in the underlying event store.

## Event Store Adapter Interface

An event store adapter object must expose the following functions:

| Function Name                                             | Description                                                                                         |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [`init`](#init)                                           | Initializes a database.                                                                             |
| [`drop`](#drop)                                           | Drops a database.                                                                                   |
| [`describe`](#describe)                                   | Obtain information about the event store.                                                           |
| [`dispose`](#dispose)                                     | Disconnects from a database and disposes unmanaged resources.                                       |
| [`saveEvent`](#saveevent)                                 | Saves an event to the database.                                                                     |
| [`loadEvents`](#loadEvents)                               | Gets an array of events and the next cursor from the store based on the specified filter criteria.  |
| [`getLatestEvent`](#getlatestevent)                       | Gets the latest saved event.                                                                        |
| [`freeze`](#freeze)                                       | Freezes the database.                                                                               |
| [`unfreeze`](#unfreeze)                                   | Unfreezes the database.                                                                             |
| [`loadSnapshot`](#loadsnapshot)                           | Loads a snapshot.                                                                                   |
| [`saveSnapshot`](#savesnapshot)                           | Creates or updates a snapshot.                                                                      |
| [`dropSnapshot`](#dropsnapshot)                           | Deletes a snapshot.                                                                                 |
| [`incrementalImport`](#incrementalimport)                 | Incrementally imports events.                                                                       |
| [`beginIncrementalImport`](#beginincrementalimport)       | Starts to build a batch of events to import.                                                        |
| [`pushIncrementalImport`](#pushincrementalimport)         | Adds events to an incremental import batch.                                                         |
| [`commitIncrementalImport`](#commitincrementalimport)     | Commits an incremental import batch to the event store.                                             |
| [`rollbackIncrementalImport`](#rollbackincrementalimport) | Drops an incremental import batch.                                                                  |
| [`getNextCursor`](#getnextcursor)                         | Gets the next database cursor used to traverse the data sample returned by the underlying database. |
| [`importEvents`](#importevents)                           | Gets a writable stream used to save events.                                                         |
| [`exportEvents`](#exportevents)                           | Gets a readable stream used to load events.                                                         |
| [`loadSecrets`](#loadsecrets)                             | Gets a list of secrets stored in the event store.                                                   |
| [`importSecrets`](#importsecrets)                         | Gets a writable stream used to save secrets.                                                        |
| [`exportSecrets`](exportsecrets)                          | Gets a writable stream used to load secrets.                                                        |

### `init`

Initializes the database.

#### Example

```js
import createEventStoreAdapter from '@resolve-js/eventstore-xxx'

const eventStoreAdapter = createEventStoreAdapter(options)

await eventStoreAdapter.init()
```

### `drop`

Drops the database.

#### Example

```js
await eventStoreAdapter.drop()
```

### `describe`

Obtain information about the event store.

#### Example

```js
const eventCount = await eventStoreAdapter.describe({ estimateCounts: true })).eventCount
```

#### Arguments

| Argument Name                  | Type   | Description                                                            |
| ------------------------------ | ------ | ---------------------------------------------------------------------- |
| [`options`](#describe-options) | object | Contains options that specifies what calculations should be performed. |

#### `options` {#describe-options}

Contains options that specifies what calculations should be performed. The options object has the following structure:

```js
{
  estimateCounts, // (boolean, optional) Specifies whether or not to calculate counts for events and secrets.
  calculateCursor, // (boolean, optional) Specifies whether or not to get database coursor used to traverse events.
}
```

#### Result

A promise that resolves to an object of the following structure:

```js
{
  eventCount,  // (number) The number of events in the store.
  secretCount, // (number) The number of secrets in the store.
  setSecretCount, // (number) The number of saved secrets.
  deletedSecretCount,  // (number) The number of deleted secrets.
  isFrozen,  // (boolean) Indicates if the event store is frozen.
  lastEventTimestamp,  // (number) The timestamp of the last saved event.
  cursor, // (string or null, optional) The database used to traverse the events.
  resourceNames, // (object)
}
```

### `dispose`

Disconnects from the database and disposes unmanaged resources.

#### Example

```js
await eventStoreAdapter.dispose()
```

### `saveEvent`

Saves an event to the database.

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

#### Arguments

| Argument Name | Description                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------ |
| event         | { aggregateId: string, aggregateVersion: number, type: string, timestamp: number, payload: any } |

### `loadEvents`

Gets an array of events and the next cursor from the store based on the specified filter criteria.

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

#### Arguments

| Argument Name | Type                                     | Description                                          |
| ------------- | ---------------------------------------- | ---------------------------------------------------- |
| eventFilter   | An [event filter](#event-filter) object. | Describes criteria used to filter the loaded events. |

#### Result

A `promise` that resolves to an object of the following structure:

```ts
{
  events, cursors
}
```

### `getLatestEvent`

Gets the latest saved event.

### `freeze`

Freezes the database.

#### Example

```js
await eventStoreAdapter.freeze()
```

#### Result

A `promise` that resolves after the event store has been successfully frozen.

### `unfreeze`

Unfreezes the database.

#### Example

```js
await eventStoreAdapter.unfreeze()
```

#### Result

A `promise` that resolves after the event store has been successfully unfrozen.

### `loadSnapshot`

Loads a snapshot.

#### Example

```js
const content = await eventStoreAdapter.loadSnapshot(snapshotKey)
if (content == null) {
  throw new Error('SnapshotNotFoundException')
}
```

#### Arguments

| Argument Name | Description                             |
| ------------- | --------------------------------------- |
| snapshotKey   | A unique key in the table of snapshots. |

#### Result

content: `Promise<string | null>`

### `saveSnapshot`

Creates or updates a snapshot.

#### Example

```js
await eventStoreAdapter.saveSnapshot(snapshotKey, content)
```

#### Arguments

| Argument Name | Description                             |
| ------------- | --------------------------------------- |
| snapshotKey   | A unique key in the table of snapshots. |
| content       | A snapshot in text format.              |

#### Result

A `promise` that resolves after the snapshot has been successfully saved.

### `dropSnapshot`

Deletes a snapshot.

```js
await eventStoreAdapter.dropSnapshot(snapshotKey)
```

#### Arguments

| Argument Name | Description                            |
| ------------- | -------------------------------------- |
| snapshotKey   | A unique key in the table of snapshots |

#### Result

A `promise` that resolves after the event store has been successfully deleted.

#### Example

### `incrementalImport`

Incrementally imports events.

#### Example

```js
await eventStoreAdapter.incrementalImport(events)
```

#### Arguments

| Argument Name | Description                                                                           |
| ------------- | ------------------------------------------------------------------------------------- |
| events        | An array of `{ aggregateId: string, type: string, timestamp: number, payload: any }`. |

#### Result

A `promise` that resolves on the successful import.

### `beginIncrementalImport`

Starts to build a batch of events to import.

#### Result

importId: `Promise<string>`

### `pushIncrementalImport`

Adds events to an incremental import batch.

#### Arguments

| Argument Name | Description                                                                           |
| ------------- | ------------------------------------------------------------------------------------- |
| events        | An array of `{ aggregateId: string, type: string, timestamp: number, payload: any }`. |
| importId      | A unique key of an import batch.                                                      |

#### Result

A `promise` that resolves on successful import.

### `commitIncrementalImport`

Commits an incremental import batch to the event store.

#### Arguments

| Argument Name | Description                      |
| ------------- | -------------------------------- |
| importId      | A unique key of an import batch. |

#### Result

A `promise` that resolves on successful commit.

### `rollbackIncrementalImport`

Drops an incremental import batch.

#### Result

A `promise` that resolves on successful rollback.

### `getNextCursor`

Gets an array of events and the next cursor from the store based on the specified filter criteria.

#### Arguments

| Argument Name | Description                                                |
| ------------- | ---------------------------------------------------------- |
| cursor        | string or null                                             |
| events        | events: Array<{ threadCounter: number, threadId: number }> |

#### Result

`string`

### `importEvents`

Gets a writable stream used to save events.

#### Example

```js

```

#### Arguments

| Argument Name | Description                                               |
| ------------- | --------------------------------------------------------- |
| options?      | { byteOffset: number, maintenanceMode: MAINTENANCE_MODE } |

#### Result

`ImportEventsStream`

### `exportEvents`

Gets a readable stream used to load events.

#### Example

```js

```

#### Arguments

| Argument Name | Description                                                                      |
| ------------- | -------------------------------------------------------------------------------- |
| options?      | { cursor: string or null, maintenanceMode: MAINTENANCE_MODE, bufferSize: number} |

#### Result

`ExportEventsStream`

### `loadSecrets`

Gets a list of secrets stored in the event store.

#### Example

```js

```

#### Arguments

| Argument Name | Description                                                                               |
| ------------- | ----------------------------------------------------------------------------------------- |
| filter        | { idx?: number or null, skip?: number, limit: number, ids?: Array&lt;string&gt; or null } |

#### Result

```ts
Promise<{
  idx: number | null
  secrets: Array<{
    idx: number
    id: string
    secret: string | null
  }>
```

### `importSecrets`

Gets a writable stream used to save secrets.

#### Example

```js

```

#### Arguments

| Argument Name | Description                           |
| ------------- | ------------------------------------- |
| options?      | { maintenanceMode: MAINTENANCE_MODE } |

#### Result

```ts
stream.Writable
```

### `exportSecrets`

Gets a writable stream used to load secrets.

#### Example

```js

```

#### Arguments

| Argument Name | Description                                                |
| ------------- | ---------------------------------------------------------- |
| options?      | { idx: number or null, maintenanceMode: MAINTENANCE_MODE } |

#### Result

`stream.Readable`

## Related API

### Event Filter

An event filter object is a parameter for the [`loadEvents`](#loadEvents) function that describes criteria used to filter the loaded events.. It can contain the following fields:

#### `limit (required)`

Maximum number of events to retrieve in one call.

#### `cursor`

The value that represents internal position in event-store. `loadEvents` will return events starting with this cursor. Cursors can be obtained from the previous [`loadEvents`](#loadevents) or [`saveEvent`](#saveevent) calls. `null` means the initial cursor. Cursor must be passed explicitly even if it's null.

#### `startTime` and `finishTime`

Specify the inclusive start and end of the time interval for which to load events. Specified in milliseconds elapsed since January 1, 1970 00:00:00 UTC. Bot values can be omitted to specify no lower or upper bound for the interval.

:::caution
The `startTime` and `finishTime` specified in conjunction with [`cursor`](#cursor) produces an error.
:::

#### `aggregateIds`

Array of included aggregate IDs.

#### `eventTypes`

Array of included event types.
