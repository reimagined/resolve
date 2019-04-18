# **Tests**

This directory contains API and integration tests for the reSolve framework.

## Read model "Stories"

#### Projection
[mdis]:# (./read-model-stories-sample/projection.js)
```js
const projection = {
  Init: async store => {
    await store.defineTable('Stories', {
      indexes: { id: 'string' },
      fields: ['text', 'version', 'active']
    })
  },

  STORY_CREATED: async (store, event) => {
    await store.insert('Stories', {
      id: event.aggregateId,
      text: event.payload,
      active: true,
      version: 0
    })
  },

  STORY_UPDATED: async (store, event) => {
    await store.update(
      'Stories',
      {
        id: event.aggregateId
      },
      {
        $set: {
          text: event.payload
        },
        $inc: {
          version: 1
        }
      }
    )
  },

  STORY_FLAGGED_FOR_DELETION: async (store, event) => {
    await store.update(
      'Stories',
      {
        id: event.aggregateId
      },
      {
        $unset: {
          active: true
        }
      }
    )
  },

  STORY_DELETED: async (store, event) => {
    await store.delete('Stories', {
      id: event.aggregateId,
      active: { $ne: true }
    })
  }
}

export default projection
```

#### Resolvers
[mdis]:# (./read-model-stories-sample/resolvers.js)
```js
const resolvers = {
  getStoryById: async (store, { id }) => {
    return await store.findOne('Stories', { id })
  },

  getStoriesByIds: async (store, { ids }) => {
    return await store.find('Stories', {
      $or: ids.map(storyId => ({ id: { $eq: storyId } }))
    })
  },

  getStoriesByPage: async (store, { skip, limit, ascending = true }) => {
    return await store.find(
      'Stories',
      {},
      null,
      { id: ascending ? 1 : -1 },
      skip,
      skip + limit
    )
  },

  getStoriesWithRangedVersion: async (
    store,
    { minVersion, maxVersion, openRange = false }
  ) => {
    return await store.find('Stories', {
      $and: [
        { version: { [openRange ? '$gte' : '$gt']: minVersion } },
        { version: { [openRange ? '$lte' : '$lt']: maxVersion } }
      ]
    })
  },

  getStoryVersionById: async (store, { id }) => {
    const { version } = await store.findOne('Stories', { id }, { version: 1 })
    return version
  },

  getCountStories: async store => {
    return await store.count('Stories', {})
  }
}

export default resolvers
```

## Read model "Comments"

#### Projection
[mdis]:# (./read-model-comments-sample/projection.js)
```js
const treeId = 'tree-id'

const projection = {
  Init: async store => {
    await store.defineTable('CommentsAsMap', {
      indexes: { treeId: 'string' },
      fields: ['comments']
    })

    await store.defineTable('CommentsAsList', {
      indexes: { treeId: 'string' },
      fields: ['comments', 'commentsCount']
    })

    await store.insert('CommentsAsMap', {
      treeId,
      comments: {}
    })

    await store.insert('CommentsAsList', {
      treeId,
      comments: [],
      commentsCount: 0
    })
  },

  COMMENT_CREATED: async (store, event) => {
    const {
      aggregateId,
      payload: { parentId, content }
    } = event

    await store.update(
      'CommentsAsMap',
      {
        treeId
      },
      {
        $set: {
          [`comments.${aggregateId}`]: {
            aggregateId,
            parentId,
            content,
            children: {},
            childrenCount: 0
          }
        }
      }
    )

    if (parentId != null) {
      await store.update(
        'CommentsAsMap',
        {
          treeId
        },
        {
          $set: {
            [`comments.${parentId}.children.${aggregateId}`]: true
          },
          $inc: {
            [`comments.${parentId}.childrenCount`]: 1
          }
        }
      )
    }

    const { commentsCount } = await store.findOne(
      'CommentsAsList',
      {
        treeId
      },
      {
        commentsCount: 1
      }
    )

    if (parentId != null) {
      const comments = (await store.findOne(
        'CommentsAsList',
        {
          treeId
        },
        {
          comments: 1
        }
      )).comments

      const parentIndex = comments.findIndex(
        ({ aggregateId }) => aggregateId === parentId
      )

      await store.update(
        'CommentsAsList',
        {
          treeId
        },
        {
          $set: {
            [`comments.${parentIndex}.children.${aggregateId}`]: true
          },
          $inc: {
            [`comments.${parentIndex}.childrenCount`]: 1
          }
        }
      )
    }

    await store.update(
      'CommentsAsList',
      {
        treeId
      },
      {
        $set: {
          [`comments.${commentsCount}`]: {
            aggregateId,
            parentId,
            content,
            children: {},
            childrenCount: 0
          }
        },
        $inc: {
          commentsCount: 1
        }
      }
    )
  }
}

export default projection
```

#### Resolvers
[mdis]:# (./read-model-comments-sample/resolvers.js)
```js
const treeId = 'tree-id'

const resolvers = {
  getComments: async store => {
    const { comments: commentsMap } = await store.findOne('CommentsAsMap', {
      treeId
    })

    const {
      comments: commentsList,
      commentsCount: commentsListLength
    } = await store.findOne('CommentsAsList', {
      treeId
    })

    return {
      commentsMap,
      commentsListLength,
      commentsList
    }
  }
}

export default resolvers
```
## Read model custom connector API example

[mdis]:# (./custom-readmodel-sample/connector.js)
```js
export default options => {
  const prefix = String(options.prefix)
  const readModels = new Set()
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
  const disconnect = async (store, readModelName) => {
    fs.unlinkSync(`${prefix}${readModelName}.lock`)
    readModels.delete(readModelName)
  }
  const drop = async (store, readModelName) => {
    fs.unlinkSync(`${prefix}${readModelName}.lock`)
    fs.unlinkSync(`${prefix}${readModelName}`)
  }
  const dispose = async () => {
    for (const readModelName of readModels) {
      fs.unlinkSync(`${prefix}${readModelName}.lock`)
    }
    readModels.clear()
  }
  return {
    connect,
    disconnect,
    drop,
    dispose
  }
}
```

## Saga
[mdis]:# (./saga-sample/saga.js)
```js
export default {
  handlers: {
    Init: async ({ store }) => {
      await store.defineTable('users', {
        indexes: { id: 'string' },
        fields: ['mail', 'confirmed']
      })
    },
    USER_CREATED: async ({ store, executeCommand }, event) => {
      await store.insert('users', {
        id: event.aggregateId,
        mail: event.payload.mail,
        confirmed: false
      })
      await executeCommand({
        aggregateName: 'User',
        aggregateId: event.aggregateId,
        type: 'requestConfirmUser',
        payload: event.payload
      })
    },
    USER_CONFIRM_REQUESTED: async ({ sideEffects, scheduleCommand }, event) => {
      await sideEffects.sendEmail(event.payload.mail, 'Confirm mail')
      await scheduleCommand(event.timestamp + 1000 * 60 * 60 * 24 * 7, {
        aggregateName: 'User',
        aggregateId: event.aggregateId,
        type: 'forgetUser',
        payload: {}
      })
    },
    USER_CONFIRMED: async ({ store }, event) => {
      await store.update(
        'users',
        {
          id: event.aggregateId
        },
        {
          $set: { confirmed: true }
        }
      )
    },
    USER_FORGOTTEN: async ({ store }, event) => {
      await store.delete('users', {
        id: event.aggregateId
      })
    }
  },
  sideEffects: {
    sendEmail: async (mail, content) => {
      ...
    }
  }
}
```

## Read model store advanced example

[mdis]:# (./read-model-advanced-sample/projection.js#read-store-api)
```js
await store.defineTable('TestTable', {
  indexes: {
    firstIndexName: 'number',
    secondIndexName: 'string'
  },
  fields: [
    'firstFieldName',
    'secondFieldName',
    'firstJsonName',
    'secondJsonName'
  ]
})
...
await store.insert('TestTable', {
  firstIndexName: 1,
  secondIndexName: 'idx-a',
  firstFieldName: testEventContent,
  secondFieldName: 0,
  firstJsonName: { a: 1, b: 2, e: 10 },
  secondJsonName: [1, 2, 3]
})
...
await store.update(
  'TestTable',
  {
    firstIndexName: { $gt: 1 },
    secondIndexName: 'idx-a'
  },
  {
    $set: {
      'firstJsonName.f': 'inner-field',
      firstFieldName: 'outer-field',
      secondJsonName: ['outer', 'json', 'value', testEventContent]
    },
    $unset: {
      'firstJsonName.d': true
    },
    $inc: {
      'firstJsonName.e': 5,
      secondFieldName: 42
    }
  }
)
...
await store.update(
  'TestTable',
  { firstIndexName: 10 },
  {
    $set: {
      'firstJsonName.f': 'inner-field',
      firstFieldName: 'outer-field',
      secondJsonName: ['outer', 'json', 'value', testEventContent]
    }
  },
  { upsert: true }
)
...
await store.delete('TestTable', {
  firstIndexName: { $gt: 1 },
  secondIndexName: 'idx-a'
})
```


![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/tests-readme?pixel)
