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
  await store.waitEventCausalConsistency()
  const search = type && type.constructor === String ? { type } : {}
  const skip = first || 0
  const stories = await store.find(
    'Stories',
    search,
    null,
    { createdAt: -1 },
    skip,
    skip + offset
  )
  return Array.isArray(stories) ? stories : []
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

The code sample below demonstrates how to use this API to communicate with a store from a Read Model projection and resolver.

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

## Client-Side API

### HTTP API

Resolve provides a standard HTTP API that allows you to send aggregate commands and query Read and View Models. Refer to the [Standard HTTP API](curl.md) topic for more information.

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
| **payload**       | object | Parameters the command accepts               |

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

### Resolve-Redux Library

The reSolve framework includes the client **resolve-redux** library used to connect a client React + Redux app to a reSolve-powered backend. This library provides the following HOCs:

| Function Name                                     | Description                                                                                        |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [connectViewModel](#connectviewmodel)             | Connects a React component to a reSolve View Model.                                                |
| [connectReadModel](#connectreadmodel)             | Connects a React component to a reSolve Read Model.                                                |
| [connectRootBasedUrls](#connectrootbasedurls)     | Fixes URLs passed to the specified props so that they use the correct root folder path.            |
| [connectStaticBasedUrls](#connectstaticbasedurls) | Fixes URLs passed to the specified props so that they use the correct static resource folder path. |

#### connectViewModel

Connects a React component to a reSolve View Model.

##### Example

```js
export const mapStateToOptions = (state, ownProps) => {
  const aggregateId = ownProps.match.params.id

  return {
    viewModelName: 'ShoppingList',
    aggregateIds: [aggregateId]
  }
}

export const mapStateToProps = (state, ownProps) => {
  const aggregateId = ownProps.match.params.id

  return {
    aggregateId
  }
}

export const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      replaceUrl: routerActions.replace
    },
    dispatch
  )

export default connectViewModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(ShoppingList)
)
```

#### connectReadModel

Connects a React component to a reSolve Read Model.

##### Example

```js
import { sendAggregateAction } from 'resolve-redux'
import { bindActionCreators } from 'redux'

export const mapStateToOptions = () => ({
  readModelName: 'ShoppingLists',
  resolverName: 'all',
  resolverArgs: {}
})

export const mapStateToProps = (state, ownProps) => ({
  lists: ownProps.data
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators({
    createStory: sendAggregateAction.bind(null, 'Story', 'createStory')
  }, dispatch)

export default connectReadModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(MyLists)
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
