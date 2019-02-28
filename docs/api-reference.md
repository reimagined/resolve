---
id: api-reference
title: API Reference
---

## Event Storage

### Adapter Interface

The table below lists functions that should be included into an implementation of a event storage adapter.

| Function Name | Description |
| ------------- | ----------- |
|               |             |

## Read Model Storage

### Adapter Interface

The table below lists functions that should be included into an implementation of a Read Model storage adapter.

| Function Name | Description |
| ------------- | ----------- |
|               |             |

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

## Client-Side API

The reSolve framework includes the client **resolve-redux** library used to connect a client React + Redux app to a reSolve-powered backend. This library provides the following HOCs:

| Function Name                                     | Description                                                                                                      |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [connectViewModel](#connectviewmodel)             | Connects a React component to a reSolve View Model.                                                              |
| [connectReadModel](#connectreadmodel)             | Connects a React component to a reSolve Read Model.                                                              |
| [connectRootBasedUrls](#connectrootbasedurls)     | Fixes URLs passed to the specified props so that they take into respect the correct root folder path.            |
| [connectStaticBasedUrls](#connectstaticbasedurls) | Fixes URLs passed to the specified props so that they take into respect the correct static resource folder path. |

### connectViewModel

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

### connectReadModel

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

### connectRootBasedUrls

```js
export default connectRootBasedUrls(['href'])(Link)
```

### connectStaticBasedUrls

```js
export default connectStaticBasedUrls(['css', 'favicon'])(Header)
```

## Commands

### Command HTTP API

A command can be sent using HTTP API.

For instance, to create a new list in the shopping list app:

```sh
$ curl -X POST http://localhost:3000/api/commands/ \
--header "Content-Type: application/json" \
--data '
{
    "aggregateName": "ShoppingList",
    "aggregateId": "12345-new-shopping-list",
    "type": "createShoppingList",
    "payload": {
        "name": "List 1"
    }
}
'
```
