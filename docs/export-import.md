---
id: export-import
title: Event Export and Import
---

## Export/Import API

Each event store adapter exposes the following API used for event export and import:

| Method | Description                                                           |
| ------ | --------------------------------------------------------------------- |
| export | Returns a readable stream used to export events from an event store.  |
| import | Returns a writeable stream used to import events into an event store. |

In the code sample below, a readable stream returned by an event store's `export` method is pipelined directly into a writable stream returned by a recipient event store's `import` method.

### Example

```js
import { Readable, pipeline as pipelineC } from 'stream'

import createEventStoreAdapter from '@resolve-js/eventstore-lite'

const pipeline = promisify(pipelineC)

const eventStore1 = createEventStoreAdapter({
  databaseFile: './data/event-store-1.db',
})

const eventStore2 = createEventStoreAdapter({
  databaseFile: './data/event-store-2.db',
})

await pipeline(eventStore1.export(), eventStore2.import())
```

## Incremental import

Incremental import allows you to import into an event store only those events that do not already exist in this event store. Incremental import also skips events that are older (i.e., have an older timestamp) than the latest event in the recipient event store.

### Basic Incremental Import

To import events incrementally, pass an array of events to an event store adapter's [incrementalImport](api/event-store-adapter.md#incrementalimport) method.

The code sample below implements an API endpoint that incrementally imports events into the application's event store.

#### Example API handler

```js
import iconv from 'iconv-lite'

async function handler(req, res) {
  const bodyCharset = (
    bodyOptions.find((option) => option.startsWith('charset=')) ||
    'charset=utf-8'
  ).substring(8)

  if (bodyCharset !== 'utf-8') {
    bodyContent = iconv.decode(iconv.encode(bodyContent, 'utf-8'), bodyCharset)
  }

  const events = JSON.parse(body)

  await req.resolve.eventstoreAdapter.incrementalImport(events)
}

export default handler
```

### Advanced Incremental import

The following methods give you additional control over the incremental import process:

| Method                                                                            | Description                                         |
| --------------------------------------------------------------------------------- | --------------------------------------------------- |
| [beginIncrementalImport](api/event-store-adapter.md#beginincrementalimport)       | Starts to accumulate events for incremental import. |
| [pushIncrementalImport](api/event-store-adapter.md#pushincrementalimport)         | Accumulates events for incremental import.          |
| [commitIncrementalImport](api/event-store-adapter.md#commitincrementalimport)     | Commits the accumulated events to the event store.  |
| [rollbackIncrementalImport](api/event-store-adapter.md#rollbackincrementaiImport) | Drops the accumulated events.                       |

The code sample below demonstrates how to use advanced incremental import in a try-catch block to roll back in case of errors.

#### Example

```js
try {
  const importId = await eventStoreAdapter.beginIncrementalImport()
  await eventStoreAdapter.pushIncrementalImport(events, importId)
  await eventStoreAdapter.commitIncrementalImport(importId)
} catch (error) {
  await eventStoreAdapter.rollbackIncrementalImport()
  throw error
}
```
