---
id: event-store-adapter
title: Event Store Adapter
description: This document describes the interface that an event store adapter should expose.
---

An event store adapter defines how the reSolve framework stores events in the underlying event store.

## Event Store Adapter Interface

An event store adapter object exposes the following API:

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
| [`importSecrets`](#importsecrets)                         | Gets a writable stream used to save secrets.                                                        |
| [`exportSecrets`](#exportsecrets)                         | Gets a writable stream used to load secrets.                                                        |

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

| Argument Name | Type                         | Description      |
| ------------- | ---------------------------- | ---------------- |
| `event`       | An [event](event.md) object. | A event to save. |

### `loadEvents`

Gets an array of events and the next cursor from the store based on the specified filter criteria.

#### Example

```js
const { events, cursor } = await adapter.loadEvents({
  limit: 100,
  eventTypes: ['COMMENT_CREATED', 'COMMENT_REMOVED'],
  aggregateIds: ['9f81a98a', '063c1ed5'],
  cursor: null,
})
```

#### Arguments

| Argument Name | Type                                     | Description                                          |
| ------------- | ---------------------------------------- | ---------------------------------------------------- |
| `eventFilter` | An [event filter](#event-filter) object. | Describes criteria used to filter the loaded events. |

#### Result

A `promise` that resolves to an object of the following structure:

```ts
{
  events, cursors
}
```

The result object contains the following fields:

| Field Name | Type                                     | Description                                              |
| ---------- | ---------------------------------------- | -------------------------------------------------------- |
| events     | An array of [`event`](event.md) objects. | The resulting filtered set of events.                    |
| cursors    | `string`                                 | A database cursor used to load the next batch of events. |

The returned `cursor` points to the position within the resulting dataset past the loaded batch of events. You can use this cursor to chain together `loadEvents` calls.

:::caution
If the `startTime` and/or `finishTime` filtering criteria are specified, the returned `cursor` object is invalid and should not be used in subsequent `loadEvents` calls.
:::

#### Usage

Filter by event types:

```js
const { events, cursor } = await adapter.loadEvents({
  limit: 100,
  eventTypes: ['COMMENT_CREATED', 'COMMENT_REMOVED'],
  cursor: null,
})
```

Filter by aggregate IDs:

```js
const { events, cursor } = await adapter.loadEvents({
  limit: 100,
  aggregateIds: ['9f81a98a', '063c1ed5'],
  cursor: null,
})
```

Combine filtering criteria:

```js
const { events, cursor } = await adapter.loadEvents({
  limit: 100,
  eventTypes: ['COMMENT_CREATED', 'COMMENT_REMOVED'],
  aggregateIds: ['9f81a98a', '063c1ed5'],
  cursor: null,
})
```

Load events from the specified time range:

```js
const startTime = new Date('2021-10-15T09:00:00').getTime()
const finishTime = new Date('2021-11-20T09:30:00').getTime()

const { events } = await adapter.loadEvents({
  limit: 100,
  startTime: startTime,
  finishTime: finishTime,
})

expect(events[0].timestamp).toBeGreaterThanOrEqual(startTime)
expect(events[events.length - 1].timestamp).toBeLessThanOrEqual(finishTime)
```

Use a cursor to chain `loadEvents` calls:

```js
const result = await adapter.loadEvents({
  limit: 100,
  cursor: null,
})

expect(result.events.length).toBeGreaterThan(0)

// Use the returned cursor to load the next batch of events.
const nextResult = await adapter.loadEvents({
  limit: 100,
  cursor: result.cursor,
})

if (nextResult.events.length === 0) {
  console.log('No more events found by this filter')
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

| Argument Name | Type     | Description                             |
| ------------- | -------- | --------------------------------------- |
| `snapshotKey` | `string` | A unique key in the table of snapshots. |

#### Result

A `promise` that resolves to a `string` that is a snapshot in text format or `null` if the snapshot was not found.

### `saveSnapshot`

Creates or updates a snapshot.

#### Example

```js
await eventStoreAdapter.saveSnapshot(snapshotKey, content)
```

#### Arguments

| Argument Name | Type     | Description                             |
| ------------- | -------- | --------------------------------------- |
| `snapshotKey` | `string` | A unique key in the table of snapshots. |
| `content`     | `string` | A snapshot in text format.              |

#### Result

A `promise` that resolves after the snapshot has been successfully saved.

### `dropSnapshot`

Deletes a snapshot.

```js
await eventStoreAdapter.dropSnapshot(snapshotKey)
```

#### Arguments

| Argument Name | Type     | Description                            |
| ------------- | -------- | -------------------------------------- |
| `snapshotKey` | `string` | A unique key in the table of snapshots |

#### Result

A `promise` that resolves after the snapshot has been successfully deleted.

#### Example

### `incrementalImport`

Incrementally imports events.

#### Example

```js
await eventStoreAdapter.incrementalImport(events)
```

#### Arguments

| Argument Name | Type                                   | Description           |
| ------------- | -------------------------------------- | --------------------- |
| `events`      | An array of [event](event.md) objects. | The events to import. |

#### Result

A `promise` that resolves on the successful import.

### `beginIncrementalImport`

Starts to build a batch of events to import.

#### Example

```js
const importId = await eventStoreAdapter.beginIncrementalImport()
```

#### Result

A `promise` that resolves to a `string` that is the ID of the created import batch.

### `pushIncrementalImport`

Adds events to an incremental import batch.

#### Example

```js
await eventStoreAdapter.pushIncrementalImport(events, importId)
```

#### Arguments

| Argument Name | Type                                   | Description                      |
| ------------- | -------------------------------------- | -------------------------------- |
| `events`      | An array of [event](event.md) objects. | The events to add to the batch.  |
| `importId`    | `string`                               | A unique key of an import batch. |

#### Result

A `promise` that resolves on successful import.

### `commitIncrementalImport`

Commits an incremental import batch to the event store.

#### Example

```js
await eventStoreAdapter.commitIncrementalImport(importId)
```

#### Arguments

| Argument Name | Type     | Description                      |
| ------------- | -------- | -------------------------------- |
| `importId`    | `string` | A unique key of an import batch. |

#### Result

A `promise` that resolves on successful commit.

### `rollbackIncrementalImport`

Drops an incremental import batch.

```js
await eventStoreAdapter.rollbackIncrementalImport()
```

#### Result

A `promise` that resolves on successful rollback.

### `getNextCursor`

Gets an the next cursor in the event store database based on the previous cursor and an array of events obtained from it.

#### Arguments

| Argument Name | Type                                     | Description                                           |
| ------------- | ---------------------------------------- | ----------------------------------------------------- |
| prevCursor    | `string` or `null`                       | The previous cursor.                                  |
| events        | An array of [`event`](event.md) objects. | An array of events obtained from the previous cursor. |

#### Result

A `string` that is a new database cursor.

### `importEvents`

Gets a writable stream used to save events.

#### Example

```js
import { pipeline as pipelineC } from 'stream'
import { promisify } from 'util'

const pipeline = promisify(pipelineC)

await pipeline(eventStoreAdapter1.import(), eventStoreAdapter2.export())
```

#### Arguments

| Argument Name                        | Type     | Description                                               |
| ------------------------------------ | -------- | --------------------------------------------------------- |
| [`options?`](#import-events-options) | `object` | { byteOffset: number, maintenanceMode: MAINTENANCE_MODE } |

#### `options` {#import-events-options}

#### Result

A writable stream object.

### `exportEvents`

Gets a readable stream used to load events.

#### Example

```js
import { pipeline as pipelineC } from 'stream'
import { promisify } from 'util'

const pipeline = promisify(pipelineC)

await pipeline(eventStoreAdapter1.import(), eventStoreAdapter2.export())
```

#### Arguments

| Argument Name                        | Type     | Description                                                                      |
| ------------------------------------ | -------- | -------------------------------------------------------------------------------- |
| [`options?`](#export-events-options) | `object` | { cursor: string or null, maintenanceMode: MAINTENANCE_MODE, bufferSize: number} |

#### `options` {#export-events-options}

#### Result

A readable stream object.

### `importSecrets`

Gets a writable stream used to save secrets.

#### Example

```js

```

#### Arguments

| Argument Name                         | Type     | Description                           |
| ------------------------------------- | -------- | ------------------------------------- |
| [`options?`](#import-secrets-options) | `object` | { maintenanceMode: MAINTENANCE_MODE } |

#### `options` {#import-secrets-options}

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

| Argument Name                         | Type     | Description                                                |
| ------------------------------------- | -------- | ---------------------------------------------------------- |
| [`options?`](#export-secrets-options) | `object` | { idx: number or null, maintenanceMode: MAINTENANCE_MODE } |

#### `options` {#export-secrets-options}

#### Result

`stream.Readable`

## Types

### Maintenance Mode

A maintenance mode option value defines whether or not to automatically switch the event store to maintenance mode during an import and/or export operation. You can specify this option for the following operations:

- [`importEvents`](#importevents)
- [`exportEvents`](#exportevents)
- [`importSecrets`](#importsecrets)
- [`exportSecrets`](#exportsecrets)

The `@resolve-js/eventstore-base` package exports constants that define the possible values for the maintenance mode option:

```js
import {
  MAINTENANCE_MODE_MANUAL,
  MAINTENANCE_MODE_AUTO,
} from '@resolve-js/eventstore-base'
```

### Event Filter

An event filter object is a parameter for the [`loadEvents`](#loadEvents) function that describes criteria used to filter the loaded events.. It can contain the following fields:

#### `limit (required)`

Maximum number of events to retrieve in one call.

#### `cursor`

The value that represents internal position in event-store. `loadEvents` will return events starting with this cursor. Cursors can be obtained from the previous [`loadEvents`](#loadevents) or [`saveEvent`](#saveevent) calls. `null` means the initial cursor. Cursor must be passed explicitly even if it's null.

#### `startTime` and `finishTime`

Specify the inclusive start and end of the time range for which to load events. Specified in milliseconds elapsed since January 1, 1970 00:00:00 UTC. Both values can be omitted so that there is no lower and/or upper bound.

:::caution
The `startTime` and `finishTime` specified in conjunction with [`cursor`](#cursor) produces an error.
:::

#### `aggregateIds`

Array of included aggregate IDs.

#### `eventTypes`

Array of included event types.
