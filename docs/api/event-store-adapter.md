---
id: event-store-adapter
title: Event Store Adapter
description: Event Store adapters expose the following API that allows you to communicate with the underlying event store.
---

## Event Store Adapter API

Event Store adapters expose the following API that allows you to communicate with the underlying event store.

| Function Name                                             | Description                                                                                         |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [`init`](#init)                                           | Initializes a database.                                                                             |
| [`drop`](#drop)                                           | Drops a database.                                                                                   |
| [`describe`](#describe)                                   | Returns information about the event store.                                                          |
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

```js title="Object Structure"
{
  estimateCounts,
  calculateCursor,
}
```

| Field Name         | Type      | Description                                                                                       |
| ------------------ | --------- | ------------------------------------------------------------------------------------------------- |
| `estimateCounts?`  | `boolean` | Specifies whether or not to use estimated values for the returned `eventCount` and `secretCount`. |
| `calculateCursor?` | `boolean` | Specifies whether or not to get database cursor used to traverse events.                          |

:::info
The `estimateCounts` option is implemented for the `@resolve-js/eventstore-postgresql` adapter to optimize performance on large event stores.
If set to `true`, this option specifies that the returned `eventCount` and `secretCount` should be estimated based on metadata stored in service tables.

The default `false` value specifies that the exact number of event entries in the database is calculated at the cost of performance.
:::

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
  events, cursor
}
```

The result object contains the following fields:

| Field Name | Type                                     | Description                                              |
| ---------- | ---------------------------------------- | -------------------------------------------------------- |
| events     | An array of [`event`](event.md) objects. | The resulting filtered set of events.                    |
| cursor     | `string` or `null`                       | A database cursor used to load the next batch of events. |

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

Combine filter criteria:

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

A `promise` that resolves on the successful import.

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

A `promise` that resolves on the successful commit.

### `rollbackIncrementalImport`

Drops an incremental import batch.

```js
await eventStoreAdapter.rollbackIncrementalImport()
```

#### Result

A `promise` that resolves on the successful rollback.

### `getNextCursor`

Gets the next cursor in the event store database based on the previous cursor and an array of events obtained from it.

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
import { promisify } from 'util'
import fs from 'fs'

await promisify(pipeline)(
  fs.createReadStream('path/to/events.txt'),
  eventstoreAdapter.importEvents()
)
```

#### Arguments

| Argument Name                        | Type     | Description                     |
| ------------------------------------ | -------- | ------------------------------- |
| [`options?`](#import-events-options) | `object` | Specifies event import options. |

#### `options` {#import-events-options}

Specifies event import options.

```js title="Object Structure"
{
  byteOffset: number,
  maintenanceMode: MAINTENANCE_MODE
}
```

| Field Name      | Type                                             | Description                                                                             |
| --------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| byteOffset      | `number`                                         | A byte offset within the source of event data from which to start reading.              |
| maintenanceMode | A [`Maintenance Mode`](#maintenance-mode) value. | Defines whether or not to switch the event store to maintenance mode during the import. |

#### Result

An [Import Events Stream](#import-events-stream) object.

#### Usage

Basic import from a file:

```js
import { promisify } from 'util'
import fs from 'fs'

await promisify(pipeline)(
  fs.createReadStream('path/to/events.txt'),
  eventstoreAdapter.importEvents()
)
```

Import with a timeout:

```js
import { promisify } from 'util'
import fs from 'fs'

const exportedEventsFileName = 'path/to/events.txt'
const exportedEventsFileSize = fs.statSync(exportedEventsFileName).size

let byteOffset = 0 // Initially set to zero (the file start).
let savedEventsCount = 0

while (true) {
  const importStream = eventstoreAdapter.importEvents({
    byteOffset,
    maintenanceMode: MAINTENANCE_MODE_MANUAL,
  })

  const pipelinePromise = promisify(pipeline)(
    fs.createReadStream(exportedEventsFileName, { start: byteOffset }), // Start reading from the beginning or continue from the offset.
    importStream
  ).then(() => false)

  const timeoutPromise =
    new Promise() <
    boolean >
    ((resolve) =>
      setTimeout(() => {
        resolve(true)
      }, getInterruptingTimeout()))

  const isTimedOut = await Promise.race([timeoutPromise, pipelinePromise])

  if (isTimedOut) {
    importStream.emit('timeout') // Notify that the time is over.
    await pipelinePromise // Still need to make sure all async operations are completed.
  }

  byteOffset = importStream.byteOffset // Save byteOffset for future invocations so it can be passed to fs.createReadStream.
  savedEventsCount += importStream.savedEventsCount

  if (byteOffset >= exportedEventsFileSize) {
    break
  }
}
console.log(`Imported ${savedEventsCount} events`)
```

### `exportEvents`

Gets a readable stream used to load events.

#### Example

```js
import { promisify } from 'util'
import { pipeline } from 'stream'

await promisify(pipeline)(
  inputEventstoreAdapter.exportEvents(),
  outputEventstoreAdapter.importEvents()
)
```

#### Arguments

| Argument Name                        | Type     | Description                     |
| ------------------------------------ | -------- | ------------------------------- |
| [`options?`](#export-events-options) | `object` | Specifies event export options. |

#### `options` {#export-events-options}

Specifies event export options.

```js title="Object Structure"
{
  cursor: string or null,
  maintenanceMode: MAINTENANCE_MODE
}
```

| Field Name      | Type                                             | Description                                                                                                                                                    |
| --------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| cursor          | `string` or `null`                               | A cursor that specifies the position within the dataset from which to start reading events. If set to `null`, the events are read starting from the beginning. |
| maintenanceMode | A [`Maintenance Mode`](#maintenance-mode) value. | Defines whether or not to switch the event store to maintenance mode during the export.                                                                        |

#### Result

An [Export Events Stream](#export-events-stream) object.

#### Usage

Basic export to a file:

```js
import fs from 'fs'
import { promisify } from 'util'
import { pipeline } from 'stream'

const exportFilePath = 'exported-events.txt'
const fileStream = fs.createWriteStream(exportFilePath)
await promisify(pipeline)(eventstoreAdapter.exportEvents(), fileStream)
await fileStream.close()
```

Export with a timeout:

```js
import { promisify } from 'util'

let cursor = null
const exportBuffers = []
while (true) {
  const exportStream = eventstoreAdapter.exportEvents({ cursor })
  const tempStream = createStreamBuffer() // Some writable stream.
  const pipelinePromise = promisify(pipeline)(exportStream, tempStream).then(
    () => false
  )

  const timeoutPromise =
    new Promise() <
    boolean >
    ((resolve) =>
      setTimeout(() => {
        resolve(true)
      }, getInterruptingTimeout()))

  const isJsonStreamTimedOut = await Promise.race([
    timeoutPromise,
    pipelinePromise,
  ])

  if (isJsonStreamTimedOut) {
    exportStream.emit('timeout') // Notify that time is over.
    await pipelinePromise // Still need to make sure all async operations are completed.
  }

  cursor = exportStream.cursor // Save cursor in so it can be used on the next loop iteration if required.

  const buffer = tempStream.getBuffer().toString('utf8')

  exportBuffers.push(buffer) // Save that could be read before the timeout.
  if (exportStream.isEnd) {
    break
  }
}

// join and parse the obtained event data.
const outputEvents = exportBuffers
  .join('')
  .trim()
  .split('\n')
  .map((eventAsString) => JSON.parse(eventAsString.trim()))
```

### `importSecrets`

Gets a writable stream used to save secrets.

#### Example

```js
import { promisify } from 'util'
import { pipeline } from 'stream'
...
await promisify(pipeline)(
  inputEventstoreAdapter.exportSecrets(),
  outputEventstoreAdapter.importSecrets()
)
```

#### Arguments

| Argument Name                         | Type     | Description                      |
| ------------------------------------- | -------- | -------------------------------- |
| [`options?`](#import-secrets-options) | `object` | Specifies secret import options. |

#### `options` {#import-secrets-options}

Specifies secret import options.

```js title="Object Structure"
{
  maintenanceMode: MAINTENANCE_MODE
}
```

| Field Name      | Type                                             | Description                                                                             |
| --------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| maintenanceMode | A [`Maintenance Mode`](#maintenance-mode) value. | Defines whether or not to switch the event store to maintenance mode during the import. |

#### Result

A writable stream object. Secrets are written as single-row JSON data structures separate with the newline character (`'\n'`). The JSON structures include the following fields:

| Field Name | Description                                                                 |
| ---------- | --------------------------------------------------------------------------- |
| `secret`   | The secret value.                                                           |
| `id`       | The secret's unique identifier.                                             |
| `idx`      | An index value that is incremented for each subsequent secret in the store. |

### `exportSecrets`

Gets a writable stream used to load secrets.

#### Example

```js
import fs from 'fs'
import { promisify } from 'util'
import { pipeline } from 'stream'
...
const exportFilePath = 'exported-secrets.txt'
const fileStream = fs.createWriteStream(exportFilePath)
await promisify(pipeline)(eventstoreAdapter.exportSecrets(), fileStream)
await fileStream.close()
```

#### Arguments

| Argument Name                         | Type     | Description                      |
| ------------------------------------- | -------- | -------------------------------- |
| [`options?`](#export-secrets-options) | `object` | Specifies secret export options. |

#### `options` {#export-secrets-options}

Specifies secret export options.

```js title="Object Structure"
{
  idx: number or null,
  maintenanceMode: MAINTENANCE_MODE
}
```

| Field Name      | Type                                             | Description                                                                                                                     |
| --------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| idx             | `number` or `null`                               | The index from which to start exporting secrets. If set to `null` or `0`, the secrets are exported starting from the beginning. |
| maintenanceMode | A [`Maintenance Mode`](#maintenance-mode) value. | Defines whether or not to switch the event store to maintenance mode during the export.                                         |

#### Result

A readable stream object. Secrets are read as single-row JSON data structures separate with the newline character (`'\n'`). The JSON structures include the following fields:

| Field Name | Description                                                                 |
| ---------- | --------------------------------------------------------------------------- |
| `secret`   | The secret value.                                                           |
| `id`       | The secret's unique identifier.                                             |
| `idx`      | An index value that is incremented for each subsequent secret in the store. |

## Related Types

### Maintenance Mode

A maintenance mode option value defines whether or not to switch the event store to maintenance mode during an import and/or export operation. You can specify this option for the following operations:

- [`importEvents`](#importevents)
- [`exportEvents`](#exportevents)
- [`importSecrets`](#importsecrets)
- [`exportSecrets`](#exportsecrets)

The `@resolve-js/eventstore-base` package exports constants that are the allowed values for the maintenance mode option:

```js
import {
  MAINTENANCE_MODE_MANUAL,
  MAINTENANCE_MODE_AUTO,
} from '@resolve-js/eventstore-base'
```

These values define the following behavior.

**On Export:**

- `MAINTENANCE_MODE_AUTO` specifies that the operation should [`freeze`](#freeze) the event store at the start and [`unfreeze`](#unfreeze) it at the end of the export process.
- `MAINTENANCE_MODE_MANUAL` specifies that the operation should not do any implicit actions.

**On Import:**

- `MAINTENANCE_MODE_AUTO` - the same as on export, but also specifies that the events/secrets database table should be re-created from scratch.
- `MAINTENANCE_MODE_MANUAL` specifies that the operation should not do any implicit actions.

### Event Filter

An event filter object is a parameter for the [`loadEvents`](#loadEvents) function that describes criteria used to filter the loaded events. It can contain the following fields:

#### `limit (required)`

Maximum number of events to retrieve in one call.

#### `cursor`

The value that specifies an internal position within the event store. `loadEvents` returns events starting with this position. Cursors can be obtained from the previous [`loadEvents`](#loadevents) or [`saveEvent`](#saveevent) calls.

If this option is set to `null`, the cursor in the initial position is used. Even if the cursor is `null`, it should be be passed explicitly.

#### `startTime` and `finishTime`

Specify the inclusive start and end of the time range for which to load events. Specified in milliseconds elapsed since January 1, 1970 00:00:00 UTC. Both values can be omitted so that there is no lower and/or upper bound.

:::caution
If the `startTime` and/or `finishTime` options are specified, the [`cursor`](#cursor) should be omitted, otherwise an error will occur.
:::

#### `aggregateIds`

Array of included aggregate IDs.

#### `eventTypes`

Array of included event types.

### Import Events Stream

A writable stream object that the [`importEvents`](#importevents) function returns. This object extends the Node.js `fs.ReadStream` with the following properties:

| Property Name      | Description                                                                                                                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `byteOffset`       | A byte offset within the source of event data from which to start reading. The new offset is assigned to the property with each imported event. Use this property to resume an interrupted import process. |
| `savedEventsCount` | The number of saved events. This property is incremented as you write events to the stream.                                                                                                                |

Events are written as single-row JSON data structures separate with the newline character (`'\n'`).

### Export Events Stream

A readable stream object that the [`exportEvents`](#exportevents) function returns. This object extends the Node.js `fs.ReadStream` with the following properties:

| Property Name | Description                                                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `cursor`      | A database cursor that indicates the current position within the dataset. The `cursor` is incremented as you read the stream. |
| `isEnd`       | Indicates that all events have been read from the stream.                                                                     |

Events are read as single-row JSON data structures separate with the newline character (`'\n'`).
