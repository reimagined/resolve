---
id: api-reference
title: API Reference
---

## Read Model Storage

### Connector Interface

The table below lists functions that a custom Read Model's connector should implement.

| Function Name             | Description                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| [connect](#connect)       | Initialises a connection to a storage.                                                    |
| [disconnect](#disconnect) | Closes the storage connection.                                                            |
| [drop](#drop)             | Removes the Read Model's data from storage.                                               |
| [dispose](#dispose)       | Forcefully disposes all unmanaged resources used by Read Models served by this connector. |

##### connect

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

##### disconnect

```js
const disconnect = async (store, readModelName) => {
  safeUnlinkSync(`${prefix}${readModelName}.lock`)
  readModels.delete(readModelName)
}
```

##### drop

```js
const drop = async (store, readModelName) => {
  safeUnlinkSync(`${prefix}${readModelName}.lock`)
  safeUnlinkSync(`${prefix}${readModelName}`)
}
```

##### dispose

```js
const dispose = async () => {
  for (const readModelName of readModels) {
    safeUnlinkSync(`${prefix}${readModelName}.lock`)
  }
  readModels.clear()
}
```

### Store Interface

The table below lists functions that you can use to communicate with a Read Model store through a `store` object.

| Function Name                                                       | Description                                                                       |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| defineTable(tableName, tableDescription)                            | Defines a new table within the store.                                             |
| find(tableName, searchExpression, fieldList, sort, skip, limit)     | Searches for data items that based on the specified expression.                   |
| findOne(tableName, searchExpression, fieldList)                     | Searches for a single data item based on the specified expression.                |
| count(tableName, searchExpression)                                  | Returns the count of items that meet the specified condition.                     |
| insert(tableName, document)                                         | Inserts an item into the specified table                                          |
| update(tableName, searchExpression, updateExpression, upsertOption) | Searches for data items and updates them based on the specified update expression |
| del(tableName, searchExpression)                                    | Deletes data items based on the specified search expression                       |

The code sample below demonstrates how to use this API to communicate with a store from a Read Model projection and resolver.

##### Projection:

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

##### Resolver:

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

const getStory = async (store, { id }) => {
  await store.waitEventCausalConsistency()
  const story = await store.findOne('Stories', { id })

  if (!story) {
    return null
  }

  const type = !story.link
    ? 'ask'
    : /^(Show HN)/.test(story.title)
    ? 'show'
    : 'story'

  Object.assign(story, { type })

  return story
}
```

## Saga API

A saga's event handler receives an object that provides access to the saga-related API. This API includes the following objects:

| Object Name                 | Description                                                                       |
| --------------------------- | --------------------------------------------------------------------------------- |
| [store](#store)             | Provides access to the saga's persistent store (similar to the Read Model store). |
| [sideEffects](#sideeffects) | Provides access to the saga's side effect functions.                              |

In addition to user-defined side effect functions, the SideEffects object contains the following default side effects:

| Function Name                       | Description                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------- |
| [executeCommand](#executecommand)   | Sends a command with the specified payload to an aggregate.                                 |
| [scheduleCommand](#schedulecommand) | Similar to `executeCommand`, but delays command execution until a specified moment in time. |

##### store

```js
Init: async ({ store }) => {
  await store.defineTable('users', {
    indexes: { id: 'string' },
    fields: ['mail']
  })
},
```

##### sideEffects

```js
await sideEffects.sendEmail(event.payload.mail, 'Confirm mail')
```

##### executeCommand

```js
await sideEffects.executeCommand({
  aggregateName: 'User',
  aggregateId: event.aggregateId,
  type: 'requestConfirmUser',
  payload: event.payload
})
```

##### scheduleCommand

```js
await sideEffects.scheduleCommand(event.timestamp + 1000 * 60 * 60 * 24 * 7, {
  aggregateName: 'User',
  aggregateId: event.aggregateId,
  type: 'forgetUser',
  payload: {}
})
```

## Client-Side API

### HTTP API

Resolve provides a standard HTTP API that allows you to send aggregate commands and query Read Models and View Models. Refer to the [Standard HTTP API](curl.md) document for more information.

#### Read Model API

You can query a Read Model from the client side by sending a POST request to the following URL:

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

The object contains the parameters that the resolver accepts.

##### Example

Use the following command to get 3 users from the [with-saga](https://github.com/reimagined/resolve/tree/master/examples/with-saga) example.

```sh
curl -X POST \
-H "Content-Type: application/json" \
-d "{\"page\":0, \"limit\":3}" \
"http://localhost:3000/api/query/default/users"
```

#### View Model API

You can query a View Model from the client side by sending a POST request to the following URL:

```
http://{host}:{port}/api/query/{viewModel}/{aggregateIds}
```

##### URL Parameters

| Name         | Description                                                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| viewModel    | The View Model name as defined in [config.app.js](https://github.com/reimagined/resolve/blob/master/examples/shopping-list/config.app.js) |
| aggregateIds | The comma-separated list of Aggregate IDs to include in the View Model. Use `*` to include all Aggregates                                 |

##### Example

Use the following command to get the current [shopping-list](https://github.com/reimagined/resolve/tree/master/examples/shopping-list) example application's state.

```sh
curl -g -X GET "http://localhost:3000/api/query/Default/shoppingLists"
```

#### Command API

You can send a command from the client side as a POST request to the following URL:

```
http://{host}:{port}/api/commands
```

The request body should have the `application/json` content type and contain a JSON representation of the command:

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
| **payload**       | object | The parameters that the command accepts               |

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

| Function Name                                     | Description                                                                                                      |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [connectViewModel](#connectviewmodel)             | Connects a React component to a reSolve View Model.                                                              |
| [connectReadModel](#connectreadmodel)             | Connects a React component to a reSolve Read Model.                                                              |
| [connectRootBasedUrls](#connectrootbasedurls)     | Fixes URLs passed to the specified props so that they take into respect the correct root folder path.            |
| [connectStaticBasedUrls](#connectstaticbasedurls) | Fixes URLs passed to the specified props so that they take into respect the correct static resource folder path. |

##### connectViewModel

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

export const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(
    {
      ...aggregateActions,
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

##### connectReadModel

```js
export const mapStateToOptions = () => ({
  readModelName: 'ShoppingLists',
  resolverName: 'all',
  resolverArgs: {}
})

export const mapStateToProps = (state, ownProps) => ({
  lists: ownProps.data
})

export const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(aggregateActions, dispatch)

export default connectReadModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(MyLists)
)
```

##### connectRootBasedUrls

```js
export default connectRootBasedUrls(['href'])(Link)
```

##### connectStaticBasedUrls

```js
export default connectStaticBasedUrls(['css', 'favicon'])(Header)
```
