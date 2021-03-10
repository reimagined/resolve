---
id: api-reference
title: API Reference
---

## Read Model Connector Interface

The table below lists functions a custom Read Model's connector should implement.

| Function Name             | Description                                      |
| ------------------------- | ------------------------------------------------ |
| [connect](#connect)       | Initializes a connection to storage.             |
| [disconnect](#disconnect) | Closes the storage connection.                   |
| [drop](#drop)             | Removes the Read Model's data from storage.      |
| [dispose](#dispose)       | Dispose of this connector's unmanaged resources. |

### connect

Initializes a connection to storage. An implementation should return a store object.

#### Arguments

| Argument Name | Description                                       |
| ------------- | ------------------------------------------------- |
| readModelName | A read model for which to establish a connection. |

#### Example

<!-- prettier-ignore-start -->

[mdis]:# (../tests/custom-readmodel-sample/connector.js#connect)
```js
const connect = async readModelName => {
  fs.writeFileSync(`${prefix}${readModelName}.lock`, true, { flag: 'wx' })
  readModels.add(readModelName)
  const store = {
    get() {
      return JSON.parse(String(fs.readFileSync(`${prefix}${readModelName}`)))
    },
    set(value) {
      fs.writeFileSync(`${prefix}${readModelName}`, JSON.stringify(value))
    }
  }
  return store
}
```

<!-- prettier-ignore-end -->

### disconnect

Closes the storage connection.

#### Arguments

| Argument Name | Description                   |
| ------------- | ----------------------------- |
| store         | A store object.               |
| readModelName | The read model to disconnect. |

#### Example

<!-- prettier-ignore-start -->

[mdis]:# (../tests/custom-readmodel-sample/connector.js#disconnect)
```js
const disconnect = async (store, readModelName) => {
  safeUnlinkSync(`${prefix}${readModelName}.lock`)
  readModels.delete(readModelName)
}
```

<!-- prettier-ignore-end -->

### drop

Removes the Read Model's data from storage.

#### Arguments

| Argument Name | Description                        |
| ------------- | ---------------------------------- |
| store         | A store object.                    |
| readModelName | A Read Model whose data to remove. |

#### Example

<!-- prettier-ignore-start -->

[mdis]:# (../tests/custom-readmodel-sample/connector.js#drop)
```js
const drop = async (store, readModelName) => {
  safeUnlinkSync(`${prefix}${readModelName}.lock`)
  safeUnlinkSync(`${prefix}${readModelName}`)
}
```

<!-- prettier-ignore-end -->

### dispose

Dispose of all unmanaged resources provided by this connector.

#### Example

<!-- prettier-ignore-start -->

[mdis]:# (../tests/custom-readmodel-sample/connector.js#dispose)
```js
const dispose = async () => {
  for (const readModelName of readModels) {
    safeUnlinkSync(`${prefix}${readModelName}.lock`)
  }
  readModels.clear()
}
```

<!-- prettier-ignore-end -->

## Read Model Store Interface

The table below lists functions that you can use to communicate with a Read Model store through a `store` object.

| Function Name               | Description                                        |
| --------------------------- | -------------------------------------------------- |
| [defineTable](#definetable) | Defines a new table within the store.              |
| [find](#find)               | Searches for data items.                           |
| [findOne](#findone)         | Searches for a single data item.                   |
| [count](#count)             | Returns the number of items that meet a condition. |
| [insert](#insert)           | Inserts an item into a table.                      |
| [update](#update)           | Updates data items.                                |
| [delete](#delete)           | Deletes data items.                                |

### defineTable

Defines a new table within the store.

#### Arguments

| Argument Name    | Description                                         |
| ---------------- | --------------------------------------------------- |
| tableName        | The new table's name.                               |
| tableDescription | An object that describes the new table's structure. |

#### Example

```js
Init: async store => {
  await store.defineTable('Stories', {
    indexes: { id: 'string', type: 'string' },
    fields: [
      'title',
      'text',
      'link',
      'commentCount',
      'votes',
      'createdAt',
      'createdBy',
      'createdByName'
    ]
  })
```

### find

Searches for data items based on the specified expression.

#### Arguments

| Argument Name    | Description                                 |
| ---------------- | ------------------------------------------- |
| tableName        | A table name.                               |
| searchExpression | An object that defines a search expression. |
| fieldList        | A list of fields to fetch.                  |
| sort             | A sort order.                               |
| skip             | A number of data items to skip.             |
| limit            | The maximum number of data items to fetch.  |

#### Example

```js
const getStories = async (type, store, { first, offset }) => {
  try {
    const search = type && type.constructor === String ? { type } : {}
    const skip = first || 0
    const stories = await store.find(
      'Stories',
      search,
      null,
      { createdAt: -1 },
      skip,
      offset
    )
    return Array.isArray(stories) ? stories : []
  } catch (error) {
    ...
    throw error
  }
}
```

### findOne

Searches for a data item based on the specified expression.

#### Arguments

| Argument Name    | Description                                 |
| ---------------- | ------------------------------------------- |
| tableName        | A table name.                               |
| searchExpression | An object that defines a search expression. |
| fieldList        | A list of fields to fetch.                  |

#### Example

```js
[STORY_UPVOTED]: async (store, { aggregateId, payload: { userId } }) => {
  const story = await store.findOne(
    'Stories',
    { id: aggregateId },
    { votes: 1 }
  )
  await store.update(
    'Stories',
    { id: aggregateId },
    { $set: { votes: story.votes.concat(userId) } }
  )
},
```

### count

Returns the number of items that meet the specified condition.

#### Arguments

| Argument Name    | Description                                 |
| ---------------- | ------------------------------------------- |
| tableName        | A table name.                               |
| searchExpression | An object that defines a search expression. |

#### Example

```js
const getStoryCount = async (type, store) =>
  const count = await store.count('Stories', {})
  return count
}
```

### insert

Inserts an item into the specified table.

#### Arguments

| Argument Name | Description                          |
| ------------- | ------------------------------------ |
| tableName     | A table name.                        |
| document      | An object that is an item to insert. |

#### Example

```js
[STORY_CREATED]: async (
    store, { aggregateId, timestamp, payload: { title, link, userId, userName, text } }
  ) => {
    const isAsk = link == null || link === ''
    const type = isAsk ? 'ask' : /^(Show HN)/.test(title) ? 'show' : 'story'

    const story = {
      id: aggregateId,
      type,
      title,
      text,
      link: !isAsk ? link : '',
      commentCount: 0,
      votes: [],
      createdAt: timestamp,
      createdBy: userId,
      createdByName: userName
    }

    await store.insert('Stories', story)
  },
```

### update

Searches for data items and updates them based on the specified update expression.

#### Arguments

| Argument Name    | Description                                                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------- |
| tableName        | A table name.                                                                                                               |
| searchExpression | An object that defines a search expression.                                                                                 |
| updateExpression | An object that defines an update expression.                                                                                |
| upsertOption     | A boolean value that defines whether to create a new item if an existing item meeting the specified criteria was not found. |

#### Example

```js
[STORY_UPVOTED]: async (store, { aggregateId, payload: { userId } }) => {
  const story = await store.findOne(
    'Stories',
    { id: aggregateId },
    { votes: 1 }
  )
  await store.update(
    'Stories',
    { id: aggregateId },
    { $set: { votes: story.votes.concat(userId) } }
  )
},
```

### delete

Deletes data items based on the specified search expression.

#### Arguments

| Argument Name    | Description                                 |
| ---------------- | ------------------------------------------- |
| tableName        | A table name.                               |
| searchExpression | An object that defines a search expression. |

#### Example

```js
[SHOPPING_LIST_REMOVED]: async (store, { aggregateId }) => {
  await store.delete('ShoppingLists', { id: aggregateId })
}
```

### Search Expression Operators

Search expression use operators to compare values and group expression clauses.

The following operators are supported:

**Comparison operators:**

| Operator | Description                                                           |
| -------- | --------------------------------------------------------------------- |
| \$eq     | Matches values that are equal to the specified value.                 |
| \$ne     | Matches values that are not equal to the specified value.             |
| \$lt     | Matches values that are less then the specified value.                |
| \$lte    | Matches values that are less then or equal to the specified values.   |
| \$gt     | Matches values that are greater then the specified value.             |
| \$gte    | Matches values that are greater then or equal to the specified value. |

**Logical Operators:**

| Operator | Description                                      |
| -------- | ------------------------------------------------ |
| \$and    | Joins two expressions with an AND operation.     |
| \$or     | Joins two expressions with an OR operation.      |
| \$not    | Applies a NOT operation to invert an expression. |

#### Example

```js
const data = await store.find('Entries', {
  $or: [
    { $and: [{ name: 'Second entry', id: 'id-2' }] },
    { $not: { id: { $gte: 'id-1' } } },
  ],
})
```

## Saga API

A saga's event handler receives an object that provides access to the saga-related API. This API includes the following objects:

| Object Name | Description                                                                       |
| ----------- | --------------------------------------------------------------------------------- |
| store       | Provides access to the saga's persistent store (similar to the Read Model store). |
| sideEffects | Provides access to the saga's side effect functions.                              |

In addition to user-defined side effect functions, the `SideEffects` object contains the following default side effects:

| Function Name                       | Description                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------- |
| [executeCommand](#executecommand)   | Sends a command with the specified payload to an aggregate.                                 |
| [scheduleCommand](#schedulecommand) | Similar to `executeCommand`, but delays command execution until a specified moment in time. |

The `sideEffects` object's `isEnabled` field indicates whether or not side effects are enabled for the saga.

### executeCommand

Sends a command with the specified payload to an aggregate.

#### Arguments

| Argument Name | Description                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------- |
| command       | Specifies a command object. Refer to the [Write Side](write-side#sending-a-command) article for more information. |

#### Example

<!-- prettier-ignore-start -->

[mdis]:# (../tests/saga-sample/saga.js#execute)
```js
await sideEffects.executeCommand({
  aggregateName: 'User',
  aggregateId: event.aggregateId,
  type: 'requestConfirmUser',
  payload: event.payload
})
```

<!-- prettier-ignore-end -->

### scheduleCommand

Similar to `executeCommand` but delays the command's execution until a specified moment in time.

#### Arguments

| Argument Name | Description                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------- |
| command       | Specifies a command object. Refer to the [Write Side](write-side#sending-a-command) article for more information. |

#### Example

<!-- prettier-ignore-start -->

[mdis]:# (../tests/saga-sample/saga.js#schedule)
```js
await sideEffects.scheduleCommand(
  event.timestamp + 1000 * 60 * 60 * 24 * 7,
  {
    aggregateName: 'User',
    aggregateId: event.aggregateId,
    type: 'forgetUser',
    payload: {}
  }
)
```

<!-- prettier-ignore-end -->

## Event Store Adapter API

An event store adapter defines how the reSolve framework stores events in the underlying event store. An event store adapter object must expose the following functions:

| Function Name                                           | Description                                                                                        |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [init](#init)                                           | Initializes a database.                                                                            |
| [drop](#drop)                                           | Drops a database.                                                                                  |
| [dispose](#dispose)                                     | Disconnects from a database and disposes unmanaged resources.                                      |
| [saveEvent](#saveevent)                                 | Saves an event to the database.                                                                    |
| [loadEvents](#loadEvents)                               | Gets an array of events and the next cursor from the store based on the specified filter criteria. |
| [getLatestEvent](#getlatestevent)                       | Gets the latest saved event.                                                                       |
| [import](#import)                                       | Gets a writable stream used to save events.                                                        |
| [export](#export)                                       | Gets a readable stream used to load events.                                                        |
| [freeze](#freeze)                                       | Freezes the database.                                                                              |
| [unfreeze](#unfreeze)                                   | Unfreezes the database.                                                                            |
| [isFrozen](#isfrozen)                                   | Gets a Boolean value that indicates whether the database is frozen.                                |
| [loadSnapshot](#loadsnapshot)                           | Loads a snapshot.                                                                                  |
| [saveSnapshot](#savesnapshot)                           | Creates or updates a snapshot.                                                                     |
| [dropSnapshot](#dropsnapshot)                           | Deletes a snapshot.                                                                                |
| [getSecret](#getsecret)                                 | Gets a secret.                                                                                     |
| [setSecret](#setsecret)                                 | Creates or updates a secret.                                                                       |
| [deleteSecret](#deletesecret)                           | Deletes a secret.                                                                                  |
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

| Argument Name | Description                                                                                                                                                                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventFilter   | { cursor: string or null, limit: number, eventsSizeLimit: number, eventTypes: Array<string>, aggregateIds: Array<string> } </br> or </br> { startTime?: number, endTime?: number, limit: number, eventsSizeLimit: number, eventTypes: Array<string>, aggregateIds: Array<string> } |

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
const { events, cursor: nextCursor } = await eventStoreAdapter.loadEvents(
  eventFilter
)
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

### isFrozen

Gets a Boolean value that indicates whether the database is frozen.

##### Arguments

`void`

##### Result

`Promise<boolean>`

#### Example

```js
const frozen = await eventStoreAdapter.isFrozen()
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

### getSecret

Gets a secret.

##### Arguments

| Argument Name | Description                          |
| ------------- | ------------------------------------ |
| selector      | A unique key in the table of secrets |

##### Result

secret: `Promise<string | null>`

#### Example

```js
const secret = await eventStoreAdapter.getSecret(selector)
if (secret == null) {
  throw new Error('SecretNotFoundException')
}
```

### setSecret

Creates or updates a secret.

##### Arguments

| Argument Name | Description                                           |
| ------------- | ----------------------------------------------------- |
| selector      | A unique key in the table of secrets.                 |
| secret        | A new encrypted secret value in the specified secret. |

##### Result

`Promise<void>`

#### Example

```js
await eventStoreAdapter.setSecret(selector, secret)
```

### deleteSecret

Deletes a secret.

##### Arguments

| Argument Name | Description                           |
| ------------- | ------------------------------------- |
| selector      | A unique key in the table of secrets. |

##### Result

`Promise<void>`

#### Example

```js
await eventStoreAdapter.deleteSecret(selector)
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

## reSolve Scripts

The [@resolve-js/scripts](https://github.com/reimagined/resolve/tree/master/packages/tools/scripts) package contains service scripts used to configure, build, and run reSolve applications. The package contains the following scripts:

| Script                                | Description                                                                   |
| ------------------------------------- | ----------------------------------------------------------------------------- |
| [build](#build)                       | Builds an application.                                                        |
| [start](#start)                       | Runs an application.                                                          |
| [watch](#watch)                       | Runs an application in **watch** mode. (Watch application files for changes.) |
| [runTestcafe](#runtestcafe)           | Runs TestCafe tests.                                                          |
| [merge](#merge)                       | Merges modules and application configurations into a single object.           |
| [stop](#stop)                         | Stops an application.                                                         |
| [reset](#reset)                       | Resets an application's persistent storages and snapshots.                    |
| [importEventStore](#importeventstore) | Imports events from a file to an application's event store.                   |
| [exportEventStore](#exporteventstore) | Exports events from an application's event store to a file.                   |
| [validateConfig](#validateconfig)     | Validates a configuration object.                                             |

The @resolve-js/scripts library also exports a `defaultResolveConfig` object that contains default configuration settings. This object is merged with an application's configuration objects to receive a global configuration object:

```js
// run.js
const resolveConfig = merge(defaultResolveConfig, appConfig, devConfig)
```

### build

Builds an application.

#### Example

#### build

<!-- prettier-ignore-start -->

[mdis]:# (../tests/resolve-scripts-sample/run.js#build)
```js
import {
  build,
  ...
} from '@resolve-js/scripts'
    ...
    switch (launchMode) {
    ...
      case 'build': {
        const resolveConfig = merge(baseConfig, prodConfig)
        await build(resolveConfig)
        break
      }
      ...
    }
```

<!-- prettier-ignore-end -->

### start

Runs a built application.

#### Example

<!-- prettier-ignore-start -->

[mdis]:# (../tests/resolve-scripts-sample/run.js#start)
```js
import {
  ...
  start,
  ...
} from '@resolve-js/scripts'
    ...
    switch (launchMode) {
      ...
      case 'start': {
        await start(merge(baseConfig, prodConfig))
        break
      }
      ...
    }
```

<!-- prettier-ignore-end -->

### watch

Runs an application in **watch** mode. (Watch application files for changes.)

#### Example

<!-- prettier-ignore-start -->

[mdis]:# (../tests/resolve-scripts-sample/run.js#watch)
```js
import {
  ...
  watch,
  ...
} from '@resolve-js/scripts'
    ...
    switch (launchMode) {
      ...
      case 'dev': {
        const resolveConfig = merge(baseConfig, devConfig)
        await watch(resolveConfig)
        break
      }
      ...
    }
```

<!-- prettier-ignore-end -->

### runTestcafe

Runs TestCafe tests.

#### Example

<!-- prettier-ignore-start -->

[mdis]:# (../tests/resolve-scripts-sample/run.js#runTestcafe)
```js
import {
  ...
  runTestcafe,
  ...
} from '@resolve-js/scripts'
    ...
    switch (launchMode) {
      ...
      case 'test:functional': {
        const resolveConfig = merge(baseConfig, testFunctionalConfig)
        await runTestcafe({
          resolveConfig,
          functionalTestsDir: 'test/functional',
          browser: process.argv[3]
        })
        break
      }
      ...
    }
```

<!-- prettier-ignore-end -->

### merge

Merges modules and application configs into a single object.

#### Example

<!-- prettier-ignore-start -->

[mdis]:# (../tests/resolve-scripts-sample/run.js#merge)
```js
import {
  ...
  merge,
  ...
} from '@resolve-js/scripts'
  ...
    const resolveConfig = merge(defaultResolveConfig, appConfig, devConfig)
```

<!-- prettier-ignore-end -->

### reset

Resets an application's persistent storages and snapshots.

#### Example

<!-- prettier-ignore-start -->

[mdis]:# (../tests/resolve-scripts-sample/run.js#reset)
```js
import {
  ...
  reset,
  ...
} from '@resolve-js/scripts'
    ...
    switch (launchMode) {
      ...
      case 'reset': {
        const resolveConfig = merge(baseConfig, devConfig)
        await reset(resolveConfig, {
          dropEventStore: true,
          dropEventSubscriber: true,
          dropReadModels: true,
          dropSagas: true
        })
        break
      }
      ...
    }
```

<!-- prettier-ignore-end -->

### importEventStore

Imports events from a file to an application's event store.

#### Example

<!-- prettier-ignore-start -->

[mdis]:# (../tests/resolve-scripts-sample/run.js#importEventStore)
```js
import {
  ...
  importEventStore,
  ...
} from '@resolve-js/scripts'
    ...
    switch (launchMode) {
      ...
      case 'import-event-store': {
        const resolveConfig = merge(baseConfig, devConfig)

        const importFile = process.argv[3]
        await importEventStore(resolveConfig, { importFile })
        break
      }
      ...
    }
```

<!-- prettier-ignore-end -->

### exportEventStore

Exports events from an application's event store to a file.

#### Example

<!-- prettier-ignore-start -->

[mdis]:# (../tests/resolve-scripts-sample/run.js#exportEventStore)
```js
import {
  ...
  exportEventStore,
  ...
} from '@resolve-js/scripts'
    ...
    switch (launchMode) {
      ...
      case 'export-event-store': {
        const resolveConfig = merge(baseConfig, devConfig)

        const exportFile = process.argv[3]
        await exportEventStore(resolveConfig, { exportFile })
        break
      }
      ...
    }
```

<!-- prettier-ignore-end -->

### validateConfig

Validates a configuration object.

#### Example

<!-- prettier-ignore-start -->

[mdis]:# (../tests/resolve-scripts-sample/run.js#validateConfig)
```js
import {
  ...
  validateConfig,
  ...
} from '@resolve-js/scripts'
    ...
    validateConfig(config)
```

<!-- prettier-ignore-end -->

## Client-Side API

### HTTP API

ReSolve provides a standard HTTP API that allows you to send aggregate commands, and query Read and View Models.

#### Read Model API

To query a Read Model from the client side, send a POST request to the following URL:

```
http://{host}:{port}/api/query/{readModel}/{resolver}
```

##### URL Parameters:

| Name          | Description                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **readModel** | The Read Model name as defined in [config.app.js](https://github.com/reimagined/resolve/blob/master/examples/with-saga/config.app.js) |
| **resolver**  | The name of a [resolver defined in the Read Model](#resolvers)                                                                        |

The request body should have the `application/json` content type and the following structure:

```js
{
  param1: value1,
  param2: value2,
  // ...
  paramN: valueN
}
```

The object contains parameters that the resolver accepts.

##### Example

Use the following command to get 3 users from the [with-saga](https://github.com/reimagined/resolve/tree/master/examples/with-saga) example:

```sh
curl -X POST \
-H "Content-Type: application/json" \
-d "{\"page\":0, \"limit\":3}" \
"http://localhost:3000/api/query/default/users"
```

#### View Model API

To query a View Model from the client side, send a GET request to the following URL:

```
http://{host}:{port}/api/query/{viewModel}/{aggregateIds}
```

##### URL Parameters

| Name         | Description                                                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| viewModel    | The View Model name as defined in [config.app.js](https://github.com/reimagined/resolve/blob/master/examples/shopping-list/config.app.js) |
| aggregateIds | The comma-separated list of Aggregate IDs to include in the View Model. Use `*` to include all Aggregates                                 |

##### Example

Use the following command to get the [shopping-list](https://github.com/reimagined/resolve/tree/master/examples/shopping-list) example application's state:

```sh
curl -g -X GET "http://localhost:3000/api/query/Default/shoppingLists"
```

#### Command API

You can send a command from the client side as a POST request to the following URL:

```
http://{host}:{port}/api/commands
```

The request body should have the `application/json` content type and contain the command's JSON representation.

```
{
  "aggregateName": aggregateName,
  "type": commandType,
  "aggregateId": aggregateID,
  "payload": {
    "param1": value1,
    "param2": value2,
    ...
    "paramN": valueN
  }
}
```

| Name              | Type   | Description                                           |
| ----------------- | ------ | ----------------------------------------------------- |
| **aggregateId**   | string | The ID of an aggregate that should handle the command |
| **aggregateName** | string | The aggregate's name as defined in **config.app.js**  |
| **commandType**   | string | The command type that the aggregate can handle        |
| **payload**       | object | Parameters the command accepts                        |

##### Example

Use the following command to add an item to the **shopping-list** example:

```sh
$ curl -X POST "http://localhost:3000/api/commands"
--header "Content-Type: application/json" \
--data '
{
  "aggregateName":"Todo",
  "type":"createItem",
  "aggregateId":"root-id",
  "payload": {
    "id":`date +%s`,
    "text":"Learn reSolve API"
  }
}
'
```

### Client Entry Point

The entry point is a function that is the first to be called when the client script runs. It takes a reSolve context object as a parameter.

##### client/index.js:

```js
const main = async resolveContext => {
...
}
export default main
```

The `resolveContext` object contains data used internally by reSolve client libraries to communicate with the backend.

See the [Client Application Entry Point](frontend.md#client-application-entry-point) section of the [Frontend](frontend.md) article for more information.

### @resolve-js/redux Library

The reSolve framework includes the client **@resolve-js/redux** library used to connect a client React + Redux app to a reSolve-powered backend. This library includes both React Hooks and Higher-Order Components (HOCs).

##### React Hooks:

| Function Name                                           | Description                                                                 |
| ------------------------------------------------------- | --------------------------------------------------------------------------- |
| [useReduxCommand](#usereduxcommand)                     | Creates a hook to execute a command.                                        |
| [useReduxReadModel](#usereduxreadmodel)                 | Creates a hook to query a Read Model.                                       |
| [useReduxReadModelSelector](#usereduxreadmodelselector) | Creates a hook to access a Read Model query result.                         |
| [useReduxViewModel](#usereduxviewmodel)                 | Creates a hook to receive a View Model's state updates and reactive events. |
| [useReduxViewModelSelector](#usereduxviewmodelselector) | Creates a hook to access a View Model's current state on the client.        |

##### Higher-Order Components:

| Function Name                                     | Description                                                                                        |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [connectViewModel](#connectviewmodel)             | Connects a React component to a reSolve View Model.                                                |
| [connectReadModel](#connectreadmodel)             | Connects a React component to a reSolve Read Model.                                                |
| [connectRootBasedUrls](#connectrootbasedurls)     | Fixes URLs passed to the specified props so that they use the correct root folder path.            |
| [connectStaticBasedUrls](#connectstaticbasedurls) | Fixes URLs passed to the specified props so that they use the correct static resource folder path. |

#### useReduxCommand

Creates a hook to execute a reSolve command.

##### Example

```js
const { execute: toggleItem } = useReduxCommand({
  type: 'toggleShoppingItem',
  aggregateId: shoppingListId,
  aggregateName: 'ShoppingList',
  payload: {
    id: 'shopping-list-id',
  },
})
```

#### useReduxReadModel

Creates a hook to query a reSolve Read Model

##### Example

```js
const { request: getLists, selector: allLists } = useReduxReadModel(
  {
    name: 'ShoppingLists',
    resolver: 'all',
    args: {
      filter: 'none',
    },
  },
  []
)

const { status, data } = useSelector(allLists)
```

##### useReduxReadModelSelector

Creates a hook to access the result of a Read Model query. Note that this hook provides access to data obtained through `useReduxReadModel` and does not send any requests to the server.

```js
const { request: getLists, selector: allLists } = useReduxReadModel(
  {
    name: 'ShoppingLists',
    resolver: 'all',
    args: {
      filter: 'none',
    },
  },
  [],
  {
    selectorId: 'all-user-lists',
  }
)

const { status, data } = useReduxReadModelSelector('all-user-lists')
```

##### useReduxViewModel

Creates a hook to receive a View Model's state updates and reactive events.

```js
const { connect, dispose, selector: thisList } = useReduxViewModel({
  name: 'shoppingList',
  aggregateIds: ['my-list'],
})

const { data, status } = useSelector(thisList)

useEffect(() => {
  connect()
  return () => {
    dispose()
  }
}, [])
```

##### useReduxViewModelSelector

Creates a hook to access a view model's local state. This hook queries the View Model's current state on the client and does not send any requests to the server.

```js
const { connect, dispose, selector: thisList } = useReduxViewModel(
  {
    name: 'shoppingList',
    aggregateIds: ['my-list'],
  },
  {
    selectorId: 'this-list',
  }
)

const { data, status } = useReduxViewModelSelector('this-list')
```

#### connectViewModel

Connects a React component to a reSolve View Model.

##### Example

```js
export const mapStateToOptions = (state, ownProps) => {
  const aggregateId = ownProps.match.params.id

  return {
    viewModelName: 'ShoppingList',
    aggregateIds: [aggregateId],
  }
}

export const mapStateToProps = (state, ownProps) => {
  const aggregateId = ownProps.match.params.id

  return {
    aggregateId,
  }
}

export const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      replaceUrl: routerActions.replace,
    },
    dispatch
  )

export default connectViewModel(mapStateToOptions)(
  connect(mapStateToProps, mapDispatchToProps)(ShoppingList)
)
```

#### connectReadModel

Connects a React component to a reSolve Read Model.

##### Example

```js
import { sendAggregateAction } from '@resolve-js/redux'
import { bindActionCreators } from 'redux'

export const mapStateToOptions = () => ({
  readModelName: 'ShoppingLists',
  resolverName: 'all',
  resolverArgs: {},
})

export const mapStateToProps = (state, ownProps) => ({
  lists: ownProps.data,
})

export const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      createStory: sendAggregateAction.bind(null, 'Story', 'createStory'),
    },
    dispatch
  )

export default connectReadModel(mapStateToOptions)(
  connect(mapStateToProps, mapDispatchToProps)(MyLists)
)
```

#### connectRootBasedUrls

Fixes URLs passed to the specified props and ensures they use the correct root folder path.

##### Example

```js
export default connectRootBasedUrls(['href'])(Link)
```

#### connectStaticBasedUrls

Fixes URLs passed to the specified props to correct the static resource folder path.

##### Example

```js
export default connectStaticBasedUrls(['css', 'favicon'])(Header)
```

### @resolve-js/client Library

The **@resolve-js/client** library provides an interface that you can use to communicate with the reSolve backend from JavaScript code. To initialize the client, call the library's `getClient` function:

```js
import { getClient } from '@resolve-js/client'

const main = async resolveContext => {
  const client = getClient(resolveContext)
  ...
```

The `getClient` function takes a reSolve context as a parameter and returns an initialized client object. This object exposes the following functions:

| Function Name                           | Description                                                                 |
| --------------------------------------- | --------------------------------------------------------------------------- |
| [command](#command)                     | Sends an aggregate command to the backend.                                  |
| [query](#query)                         | Queries a Read Model.                                                       |
| [getStaticAssetUrl](#getstaticasseturl) | Gets a static file's full URL.                                              |
| [getOriginPath](#getoriginpath)         | Returns an absolute URL within the application for the given relative path. |
| [subscribe](#subscribe)                 | Subscribes to View Model updates.                                           |
| [unsubscribe](#unsubscribe)             | Unsubscribes from View Model updates.                                       |

#### command

Sends an aggregate command to the backend.

##### Example

```js
client.command(
  {
    aggregateName: 'Chat',
    type: 'postMessage',
    aggregateId: userName,
    payload: message,
  },
  (err) => {
    if (err) {
      console.warn(`Error while sending command: ${err}`)
    }
  }
)
```

#### query

Queries a Read Model.

##### Example

```js
const { data } = await client.query({
  name: 'chat',
  aggregateIds: '*',
})
```

#### getStaticAssetUrl

Gets a static file's full URL.

##### Example

```js
var imagePath = client.getStaticAssetUrl('/account/image.jpg')
```

#### getOriginPath

Returns an absolute URL within the application for the given relative path.

##### Example

```js
var commandsApiPath = client.getOriginPath('/api/commands')
```

#### subscribe

Subscribes to View Model updates. Returns a promise that resolves to a **subscription** object.

##### Example

```js
const chatViewModelUpdater = (event) => {
  const eventType = event != null && event.type != null ? event.type : null
  const eventHandler = chatViewModel.projection[eventType]

  if (typeof eventHandler === 'function') {
    chatViewModelState = eventHandler(chatViewModelState, event)
  }

  setImmediate(updateUI.bind(null, chatViewModelState))
}

await client.subscribe('chat', '*', chatViewModelUpdater)
```

#### unsubscribe

Unsubscribes from View Model updates.

##### Example

```js
await client.unsubscribe(subscription)
```

### @resolve-js/react-hooks library

The **@resolve-js/react-hooks** library provides React hooks that you can use to connect React components to a reSolve backend. The following hooks are provided.

| Hook                                    | Description                                                               |
| --------------------------------------- | ------------------------------------------------------------------------- |
| [useCommand](#usecommand)               | Initializes a command that can be passed to the backend.                  |
| [useCommandBuilder](#usecommandbuilder) | Allows a component to generate commands based on input parameters.        |
| [useViewModel](#useviewmodel)           | Establishes a WebSocket connection to a reSolve View Model.               |
| [useQuery](#usequery)                   | Allows a component to send queries to a reSolve Read Model or View Model. |
| [useOriginResolver](#useoriginresolver) | Resolves a relative path to an absolute URL within the application.       |

#### useCommand

Initializes a command that can be passed to the backend.

##### Example

```js
const ShoppingList = ({
  match: {
    params: { id: aggregateId }
  }
}) => {
  const renameShoppingList = useCommand({
    type: 'renameShoppingList',
    aggregateId,
    aggregateName: 'ShoppingList',
    payload: { name: shoppingList ? shoppingList.name : '' }
  })

  ...

  const onShoppingListNamePressEnter = event => {
    if (event.charCode === 13) {
      event.preventDefault()
      renameShoppingList()
    }
  }

  ...
}
```

#### useCommandBuilder

Allows a component to generate commands based on input parameters.

##### Example

```js
const ShoppingList = ({
  match: {
    params: { id: aggregateId }
  }
}) => {
  const clearItemText = () => setItemText('')

  const createShoppingItem = useCommandBuilder(
    text => ({
      type: 'createShoppingItem',
      aggregateId,
      aggregateName: 'ShoppingList',
      payload: {
        text,
        id: Date.now().toString()
      }
    }),
    clearItemText
  )

  ...

  const onItemTextPressEnter = event => {
  if (event.charCode === 13) {
    event.preventDefault()
    createShoppingItem(itemText)
  }

  ...
}
```

#### useViewModel

Establishes a WebSocket connection to a reSolve View Model.

##### Example

```js
const ShoppingList = ({
  match: {
    params: { id: aggregateId }
  }
}) => {
  const [shoppingList, setShoppingList] = useState({
    name: '',
    id: null,
    list: []
  })

  const { connect, dispose } = useViewModel(
    'shoppingList',
    [aggregateId],
    setShoppingList
  )

  useEffect(() => {
    connect()
    return () => {
      dispose()
    }
  }, [])

  ...

  const updateShoppingListName = event => {
    setShoppingList({ ...shoppingList, name: event.target.value })
  }

  ...
}
```

#### useQuery

Allows a component to send queries to a reSolve Read Model or View Model.

##### Example

```js
const MyLists = () => {
  const getLists = useQuery(
    { name: 'ShoppingLists', resolver: 'all', args: {} },
    (error, result) => {
      setLists(result)
    }
  )

  useEffect(() => {
    getLists()
  }, [])

  ...

  onCreateSuccess={(err, result) => {
    const nextLists = { ...lists }
    nextLists.data.push({
      name: result.payload.name,
      createdAt: result.timestamp,
      id: result.aggregateId
    })
    setLists(nextLists)
  }}

  ...
}
```

#### useOriginResolver

Resolves a relative path to an absolute URL within the application.

##### Example

```js
var resolver = useOriginResolver()
var commandApiPath = resolver('/api/commands')
```

### Request Middleware

The [@resolve-js/client](#resolve-client-library) and [@resolve-js/react-hooks](#resolve-react-hooks-library) libraries allow you to use request middleware to extend the client's functionality. Middleware implements intermediate logic that can modify the response object or handle errors before they are passed to the callback function.

Use a command's or query's `middleware` option to specify middleware:

#### @resolve-js/client:

```js
client.query(
  {
    name: "MyReadModel",
    resolver: "all"
  },
  {
    middleware: {
      response: [
        // An array of middleware that runs on server response
        createMyResponseMiddleware({
          // Middleware options
        }),
        ...
      ],
      error: [
        // An array of middleware that runs when there is a server error
        createMyErrorMiddleware({
          // Middleware options
        }),
        ...
      ]
    }
  },
  (error, result) => {
    ...
  }
})
```

#### @resolve-js/react-hooks:

```js
const myQuery = useQuery(
  {
    name: 'MyReadModel',
    resolver: 'all'
  },
  {
    middleware: {
      response: [
        // An array of middleware that runs on server response
        createMyResponseMiddleware({
          // Middleware options
        }),
        ...
      ]
      error: [
        // An array of middleware that runs on server error
        createMyErrorMiddleware({
          // Middleware options
        }),
        ...
      ]
    }
  },
  (error, result) => {
    ...
  }
```

Multiple middleware functions are run in the order they are specified in the options object.

#### Available Middlewares

This section lists request middleware included into the @resolve-js/client package. The following middleware is available:

| Name                | Description                                               |
| ------------------- | --------------------------------------------------------- |
| [parseResponse]()   | Deserializes the response data if it contains valid JSON. |
| [retryOnError]()    | Retries the request if the server responds with an error. |
| [waitForResponse]() | Validates the response and retries if validation fails.   |

##### parseResponse

Deserializes the response data if it contains valid JSON. If the data is not JSON, the original string is kept. Initialized by the `createParseResponseMiddleware` factory function.

This middleware has no options. You can add it to a request as shown below:

```js
import { createParseResponseMiddleware } from '@resolve-js/client'
...

const { data } = await client.query(
  {
    name: 'articles',
    resolver: 'all'
  },
  {
    middleware: {
      response: [createParseResponseMiddleware()]
    }
  }
)
```

##### retryOnError

Retries the request if the server responds with an error. Initialized by the `createRetryOnErrorMiddleware` factory function.

The `retryOnError` middleware has the following options:

| Option Name | Description                                                          |
| ----------- | -------------------------------------------------------------------- |
| attempts    | The number of retries if the server responds with an error.          |
| errors      | An array of error codes that are allowed to trigger a retry.         |
| debug       | If set to `true`, the middleware logs errors in the browser console. |
| period      | The time between retries specified in milliseconds.                  |

You can add the `retryOnError` middleware to a request as shown below:

```js
import { createRetryOnErrorMiddleware } from '@resolve-js/client'
...

client.command(
  {
    aggregateName: 'Chat',
    type: 'postMessage',
    aggregateId: userName,
    payload: message
  },
  {
    middleware: {
      error: [
        createRetryOnErrorMiddleware({
          attempts: 3,
          errors: [500],
          debug: true,
          period: 500
        })
      ]
    }
  },
  err => {
    if (err) {
      console.warn(`Error while sending command: ${err}`)
    }
  }
)
```

##### waitForResponse

Validates the response and retries if validation fails. This allows you to check whether the response contains the latest data or wait for the Read Model to update.

Initialized by the `createWaitForResponseMiddleware` factory function.

The `waitForResponse` middleware has the following options:

| Option Name | Description                                                          |
| ----------- | -------------------------------------------------------------------- |
| attempts    | The number of retries if validation fails.                           |
| debug       | If set to `true`, the middleware logs errors in the browser console. |
| period      | The time between retries specified in milliseconds.                  |
| validator   | An async function that validates the response.                       |

You can add the `retryOnError` middleware to a request as shown below:

```js
import { createWaitForResponseMiddleware } from '@resolve-js/client'
...

const { data } = await client.query(
  {
    name: 'users',
    resolver: 'userById',
    args: {
      id: userId
    }
  },
  {
    middleware: {
      response: [
        createWaitForResponseMiddleware({
          attempts: 3,
          debug: true,
          period: 1,
          validator: async (response, confirm) => {
            if (response.ok) {
              const result = await response.json()
              if (result.data[userId]) {
                confirm(result)
              }
            }
          }
        })
      ]
    }
  }
)
```

#### Implement Custom Middleware

You can define custom middleware as follows:

```js
const myMiddleware = async (
  options, // Options passed to the factory function.
  response, // The second argument is either a response or error.
  params // Contains API you can use in your middleware implementation. See the API table below.
) => {
  // Put your middleware logic here
}

// Export the factory function.
export const createMyMiddleware = (options) =>
  waitForResponse.bind(null, options)
```

The `params` object exposes the following API:

| Field Name   | Description                                                                 |
| ------------ | --------------------------------------------------------------------------- |
| fetch        | A JavaScript fetch function you can use to perform arbitrary HTTP requests. |
| info         | An object that describes the current request.                               |
| init         | An object that is the fetch function's `init` parameter.                    |
| repeat       | A function you can call to repeat the current request.                      |
| end          | Call this function to commit the middleware execution result or error.      |
| state        | A state object passed between middleware functions.                         |
| deserializer | Returns a deserealized object from a string.                                |
| jwtProvider  | Used to get and set the JSON Web Token.                                     |
