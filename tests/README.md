# **Tests**

This directory contains API and integration tests for the reSolve framework.

## Read model "Stories"

#### App Config
[mdis]:# (./read-model-stories-sample/config.js#app-config)
```js
const appConfig = {
  readModels: [
    {
      name: 'Stories',
      projection: 'projection.js',
      resolvers: 'resolvers.js',
      connectorName: 'default'
    }
  ]
}
```

#### Dev Config
[mdis]:# (./read-model-stories-sample/config.js#dev-config)
```js
const devConfig = {
  readModelConnectors: {
    default: {
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: ':memory:'
      }
    }
    /*
    default: {
      module: 'resolve-readmodel-mysql',
      options: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: 'ReadModelStoriesSample'
      }
    }
    */
    /*
    default: {
      module: 'resolve-readmodel-mongo',
      options: {
        url: 'mongodb://127.0.0.1:27017/ReadModelStoriesSample'
      }
    }
    */
  }
}
```

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

#### App Config
[mdis]:# (./read-model-comments-sample/config.js#app-config)
```js
const appConfig = {
  readModels: [
    {
      name: 'Comments',
      projection: 'projection.js',
      resolvers: 'resolvers.js',
      connectorName: 'default'
    }
  ]
}
```

#### Dev Config 
[mdis]:# (./read-model-comments-sample/config.js#dev-config)
```js
const devConfig = {
  readModelConnectors: {
    default: {
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: ':memory:'
      }
    }
    /*
    default: {
      module: 'resolve-readmodel-mysql',
      options: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: `ReadModelCommentsSample`
      }
    }
    */
    /*
    default: {
      module: 'resolve-readmodel-mongo',
      options: {
        url: 'mongodb://127.0.0.1:27017/ReadModelCommentsSample'
      }
    }
    */
  }
}
```

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

#### App Config
[mdis]:# (./custom-readmodel-sample/config.js#app-config)
```js
const appConfig = {
  readModels: [
    {
      name: 'Counter',
      projection: 'projection.js',
      resolvers: 'resolvers.js',
      connectorName: 'default'
    }
  ]
}
```

#### Dev Config
[mdis]:# (./custom-readmodel-sample/config.js#dev-config)
```js
const devConfig = {
  readModelConnectors: {
    default: {
      module: 'connector.js',
      options: {
        prefix: 'read-model-database'
      }
    }
  }
}
```

#### Connector

[mdis]:# (./custom-readmodel-sample/connector.js)
```js
import fs from 'fs'

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

#### Projection
[mdis]:# (./custom-readmodel-sample/projection.js)
```js
const projection = {
  Init: async store => {
    await store.set(0)
  },
  INCREMENT: async (store, event) => {
    await store.set((await store.get()) + event.payload)
  },
  DECREMENT: async (store, event) => {
    await store.set((await store.get()) - event.payload)
  }
}

export default projection
```

#### Resolvers
[mdis]:# (./custom-readmodel-sample/resolvers.js)
```js
const resolvers = {
  read: async store => {
    return await store.get()
  }
}

export default resolvers
```

## Saga

#### App Config
[mdis]:# (./saga-sample/config.js#app-config)
```js
const appConfig = {
  sagas: [
    {
      name: 'UserConfirmation',
      source: 'saga.js',
      connectorName: 'default',
      schedulerName: 'scheduler'
    }
  ]
}
```

#### Dev Config
[mdis]:# (./saga-sample/config.js#dev-config)
```js
const devConfig = {
  schedulers: {
    scheduler: {
      adapter: {
        module: 'resolve-scheduler-local',
        options: {}
      },
      connectorName: 'default'
    }
  },
  readModelConnectors: {
    default: {
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: ':memory:'
      }
    }
    /*
    default: {
      module: 'resolve-readmodel-mysql',
      options: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: 'SagaSample'
      }
    }
    */
    /*
    default: {
      module: 'resolve-readmodel-mongo',
      options: {
        url: 'mongodb://127.0.0.1:27017/SagaSample'
      }
    }
    */
  }
}
```

#### Handlers and Side Effects
[mdis]:# (./saga-sample/saga.js)
```js
export default {
  handlers: {
    Init: async ({ store }) => {
      await store.defineTable('users', {
        indexes: { id: 'string' },
        fields: ['mail']
      })
    },
    USER_CREATED: async ({ store, sideEffects }, event) => {
      await store.insert('users', {
        id: event.aggregateId,
        mail: event.payload.mail
      })
      await sideEffects.executeCommand({
        aggregateName: 'User',
        aggregateId: event.aggregateId,
        type: 'requestConfirmUser',
        payload: event.payload
      })
    },
    USER_CONFIRM_REQUESTED: async ({ sideEffects }, event) => {
      await sideEffects.sendEmail(event.payload.mail, 'Confirm mail')
      await sideEffects.scheduleCommand(
        event.timestamp + 1000 * 60 * 60 * 24 * 7,
        {
          aggregateName: 'User',
          aggregateId: event.aggregateId,
          type: 'forgetUser',
          payload: {}
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

## Saga with authorization

#### App Config
[mdis]:# (./saga-with-authorization-sample/config.js#app-config)
```js
const appConfig = {
  aggregates: [
    {
      name: 'Process',
      commands: 'process.commands.js'
    }
  ],
  sagas: [
    {
      name: 'ProcessKiller',
      source: 'saga.js',
      connectorName: 'default',
      schedulerName: 'scheduler'
    }
  ]
}
```

#### Dev Config
[mdis]:# (./saga-with-authorization-sample/config.js#dev-config)
```js
const devConfig = {
  schedulers: {
    scheduler: {
      adapter: {
        module: 'resolve-scheduler-local',
        options: {}
      },
      connectorName: 'default'
    }
  },
  readModelConnectors: {
    default: {
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: ':memory:'
      }
    }
    /*
    default: {
      module: 'resolve-readmodel-mysql',
      options: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: 'SagaWithAuthorizationSample'
      }
    }
    */
    /*
    default: {
      module: 'resolve-readmodel-mongo',
      options: {
        url: 'mongodb://127.0.0.1:27017/SagaWithAuthorizationSample'
      }
    }
    */
  }
}
```

#### Aggregate Commands
[mdis]:# (./saga-with-authorization-sample/process.commands.js)
```js
import jsonwebtoken from 'jsonwebtoken'

import jwtSecret from './jwt-secret'

export default {
  createProcess: () => {
    return {
      type: 'PROCESS_CREATED'
    }
  },

  killAllProcesses: () => {
    return {
      type: 'ALL_PROCESS_KILLED'
    }
  },

  killProcess: (state, command, jwtToken) => {
    const jwt = jsonwebtoken.verify(jwtToken, jwtSecret)

    if (!jwt.permissions.processes.kill) {
      throw new Error('Access denied')
    }

    return {
      type: 'PROCESS_KILLED'
    }
  }
}
```

#### Saga
[mdis]:# (./saga-with-authorization-sample/saga.js)
```js
import jsonwebtoken from 'jsonwebtoken'

import jwtSecret from './jwt-secret'

export const jwtToken = jsonwebtoken.sign(
  {
    permissions: {
      processes: {
        kill: true
      }
    }
  },
  jwtSecret,
  {
    noTimestamp: true
  }
)

export default {
  handlers: {
    Init: async ({ store }) => {
      await store.defineTable('Processes', {
        indexes: { id: 'string' },
        fields: []
      })
    },

    PROCESS_CREATED: async ({ store }, event) => {
      await store.insert('Processes', {
        id: event.aggregateId
      })
    },

    ALL_PROCESS_KILLED: async ({ store, sideEffects }) => {
      const processes = await store.find('Processes', {})

      for (const process of processes) {
        await sideEffects.executeCommand({
          aggregateName: 'Process',
          aggregateId: process.id,
          type: 'PROCESS_KILLED',
          jwtToken
        })

        await store.delete('Processes', {
          id: process.id
        })
      }
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

## Saga. How mock side-effects

#### Saga with side-effects
[mdis]:# (./saga-mock-side-effects-sample/saga.js)
```js
export default {
  handlers: {
    UPDATE: async ({ sideEffects }, event) => {
      if (sideEffects.isEnabled) {
        const randomCommandType =
          (await sideEffects.getRandom()) > 0.5 ? 'increment' : 'decrement'

        await sideEffects.executeCommand({
          aggregateName: 'Counter',
          aggregateId: event.aggregateId,
          type: randomCommandType,
          payload: 1
        })
      }
    }
  },

  sideEffects: {
    getRandom: async () => {
      return Math.random()
    }
  }
}
```

#### Tests
[mdis]:# (./saga-mock-side-effects-sample/saga.test.js)
```js
import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'
import givenEvents, {
  RESOLVE_SIDE_EFFECTS_START_TIMESTAMP
} from 'resolve-testing-tools'

import config from './config'

describe('Saga', () => {
  const { name, source: sourceModule, connectorName } = config.sagas.find(
    ({ name }) => name === 'UpdaterSaga'
  )
  const {
    module: connectorModule,
    options: connectorOptions
  } = config.readModelConnectors[connectorName]

  const createConnector = interopRequireDefault(require(connectorModule))
    .default
  const source = interopRequireDefault(require(`./${sourceModule}`)).default

  let sagaWithAdapter = null
  let adapter = null

  beforeEach(async () => {
    adapter = createConnector(connectorOptions)
    try {
      const connection = await adapter.connect(name)
      await adapter.drop(null, name)
      await adapter.disconnect(connection, name)
    } catch (e) {}

    sagaWithAdapter = {
      handlers: source.handlers,
      sideEffects: source.sideEffects,
      adapter
    }
  })

  afterEach(async () => {
    try {
      const connection = await adapter.connect(name)
      await adapter.drop(null, name)
      await adapter.disconnect(connection, name)
    } catch (e) {}

    adapter = null
    sagaWithAdapter = null
  })

  describe('with sideEffects.isEnabled = true', () => {
    let originalGetRandom = null

    beforeEach(() => {
      originalGetRandom = source.sideEffects.getRandom
      source.sideEffects.getRandom = jest.fn()
    })

    afterEach(() => {
      source.sideEffects.getRandom = originalGetRandom
      originalGetRandom = null
    })

    test('success increment', async () => {
      source.sideEffects.getRandom.mockReturnValue(1)

      const result = await givenEvents([
        {
          aggregateId: 'counterId',
          type: 'UPDATE',
          payload: {}
        }
      ]).saga(sagaWithAdapter)

      expect(result.commands[0][0].type).toEqual('increment')
    })

    test('success decrement', async () => {
      source.sideEffects.getRandom.mockReturnValue(0)

      const result = await givenEvents([
        {
          aggregateId: 'counterId',
          type: 'UPDATE',
          payload: {}
        }
      ]).saga(sagaWithAdapter)

      expect(result.commands[0][0].type).toEqual('decrement')
    })
  })

  describe('with sideEffects.isEnabled = false', () => {
    test('do nothing', async () => {
      const result = await givenEvents([
        {
          aggregateId: 'counterId',
          type: 'UPDATE',
          payload: {}
        }
      ])
        .saga(sagaWithAdapter)
        .properties({
          [RESOLVE_SIDE_EFFECTS_START_TIMESTAMP]: Number.MAX_VALUE
        })

      expect(result).toEqual({
        commands: [],
        scheduleCommands: [],
        sideEffects: [],
        queries: []
      })
    })
  })
})
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/tests-readme?pixel)
