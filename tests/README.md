# **Tests**

This directory contains API and integration tests for the reSolve framework.

## Read model "Stories"

#### App Config

[mdis]: # './read-model-stories-sample/config.js#app-config'

```js
const appConfig = {
  readModels: [
    {
      name: 'Stories',
      projection: 'projection.js',
      resolvers: 'resolvers.js',
      connectorName: 'default',
    },
  ],
}
```

#### Dev Config

[mdis]: # './read-model-stories-sample/config.js#dev-config'

```js
const devConfig = {
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-lite',
    options: {
      databaseFile: ':memory:',
    },
  },

  readModelConnectors: {
    default: {
      module: '@resolve-js/readmodel-lite',
      options: {
        databaseFile: ':memory:',
      },
    },
    /*
    default: {
      module: '@resolve-js/readmodel-mysql',
      options: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: 'ReadModelStoriesSample'
      }
    }
    */
  },
}
```

#### Projection

[mdis]: # './read-model-stories-sample/projection.js'

```js
const projection = {
  Init: async (store) => {
    await store.defineTable('Stories', {
      indexes: { id: 'string' },
      fields: ['text', 'version', 'active'],
    })
  },
  STORY_CREATED: async (store, event) => {
    await store.insert('Stories', {
      id: event.aggregateId,
      text: event.payload,
      active: true,
      version: 0,
    })
  },
  STORY_UPDATED: async (store, event) => {
    await store.update(
      'Stories',
      {
        id: event.aggregateId,
      },
      {
        $set: {
          text: event.payload,
        },
        $inc: {
          version: 1,
        },
      }
    )
  },
  STORY_FLAGGED_FOR_DELETION: async (store, event) => {
    await store.update(
      'Stories',
      {
        id: event.aggregateId,
      },
      {
        $unset: {
          active: true,
        },
      }
    )
  },
  STORY_DELETED: async (store, event) => {
    await store.delete('Stories', {
      id: event.aggregateId,
      active: { $ne: true },
    })
  },
}
export default projection
```

#### Resolvers

[mdis]: # './read-model-stories-sample/resolvers.js'

```js
const resolvers = {
  getStoryById: async (store, { id }) => {
    return await store.findOne('Stories', { id })
  },
  getStoriesByIds: async (store, { ids }) => {
    return await store.find('Stories', {
      $or: ids.map((storyId) => ({ id: { $eq: storyId } })),
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
        { version: { [openRange ? '$lte' : '$lt']: maxVersion } },
      ],
    })
  },

  getStoryVersionById: async (store, { id }) => {
    const { version } = await store.findOne('Stories', { id }, { version: 1 })
    return version
  },
  getCountStories: async (store) => {
    return await store.count('Stories', {})
  },
}

export default resolvers
```

## Read model "Comments"

#### App Config

[mdis]: # './read-model-comments-sample/config.js#app-config'

```js
const appConfig = {
  readModels: [
    {
      name: 'Comments',
      projection: 'projection.js',
      resolvers: 'resolvers.js',
      connectorName: 'default',
    },
  ],
}
```

#### Dev Config

[mdis]: # './read-model-comments-sample/config.js#dev-config'

```js
const devConfig = {
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-lite',
    options: {
      databaseFile: ':memory:',
    },
  },

  readModelConnectors: {
    default: {
      module: '@resolve-js/readmodel-lite',
      options: {
        databaseFile: ':memory:',
      },
    },
    /*
    default: {
      module: '@resolve-js/readmodel-mysql',
      options: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: `ReadModelCommentsSample`
      }
    }
    */
  },
}
```

#### Projection

[mdis]: # './read-model-comments-sample/projection.js'

```js
const treeId = 'tree-id'

const projection = {
  Init: async (store) => {
    await store.defineTable('CommentsAsMap', {
      indexes: { treeId: 'string' },
      fields: ['comments'],
    })

    await store.defineTable('CommentsAsList', {
      indexes: { treeId: 'string' },
      fields: ['comments', 'commentsCount'],
    })

    await store.insert('CommentsAsMap', {
      treeId,
      comments: {},
    })

    await store.insert('CommentsAsList', {
      treeId,
      comments: [],
      commentsCount: 0,
    })
  },

  COMMENT_CREATED: async (store, event) => {
    const {
      aggregateId,
      payload: { parentId, content },
    } = event

    await store.update(
      'CommentsAsMap',
      {
        treeId,
      },
      {
        $set: {
          [`comments.${aggregateId}`]: {
            aggregateId,
            parentId,
            content,
            children: {},
            childrenCount: 0,
          },
        },
      }
    )

    if (parentId != null) {
      await store.update(
        'CommentsAsMap',
        {
          treeId,
        },
        {
          $set: {
            [`comments.${parentId}.children.${aggregateId}`]: true,
          },
          $inc: {
            [`comments.${parentId}.childrenCount`]: 1,
          },
        }
      )
    }

    const { commentsCount } = await store.findOne(
      'CommentsAsList',
      {
        treeId,
      },
      {
        commentsCount: 1,
      }
    )

    if (parentId != null) {
      const comments = (
        await store.findOne(
          'CommentsAsList',
          {
            treeId,
          },
          {
            comments: 1,
          }
        )
      ).comments

      const parentIndex = comments.findIndex(
        ({ aggregateId }) => aggregateId === parentId
      )

      await store.update(
        'CommentsAsList',
        {
          treeId,
        },
        {
          $set: {
            [`comments.${parentIndex}.children.${aggregateId}`]: true,
          },
          $inc: {
            [`comments.${parentIndex}.childrenCount`]: 1,
          },
        }
      )
    }

    await store.update(
      'CommentsAsList',
      {
        treeId,
      },
      {
        $set: {
          [`comments.${commentsCount}`]: {
            aggregateId,
            parentId,
            content,
            children: {},
            childrenCount: 0,
          },
        },
        $inc: {
          commentsCount: 1,
        },
      }
    )
  },
}

export default projection
```

#### Resolvers

[mdis]: # './read-model-comments-sample/resolvers.js'

```js
const treeId = 'tree-id'

const resolvers = {
  getComments: async (store) => {
    const { comments: commentsMap } = await store.findOne('CommentsAsMap', {
      treeId,
    })

    const {
      comments: commentsList,
      commentsCount: commentsListLength,
    } = await store.findOne('CommentsAsList', {
      treeId,
    })

    return {
      commentsMap,
      commentsListLength,
      commentsList,
    }
  },
}

export default resolvers
```

## Read model custom connector API example

#### App Config

[mdis]: # './custom-readmodel-sample/config.js#app-config'

```js
const appConfig = {
  readModels: [
    {
      name: 'Counter',
      projection: 'projection.js',
      resolvers: 'resolvers.js',
      connectorName: 'default',
    },
  ],
}
```

#### Dev Config

[mdis]: # './custom-readmodel-sample/config.js#dev-config'

```js
const devConfig = {
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-lite',
    options: {
      databaseFile: ':memory:',
    },
  },

  readModelConnectors: {
    default: {
      module: 'connector.js',
      options: {
        prefix: 'read-model-database',
      },
    },
  },
}
```

#### Connector

[mdis]: # './custom-readmodel-sample/connector.js'

```js
import fs from 'fs'

const safeUnlinkSync = (filename) => {
  if (fs.existsSync(filename)) {
    fs.unlinkSync(filename)
  }
}

export default (options) => {
  const prefix = String(options.prefix)
  const readModels = new Set()
  const connect = async (readModelName) => {
    fs.writeFileSync(`${prefix}${readModelName}.lock`, true, { flag: 'wx' })
    readModels.add(readModelName)
    const store = {
      get() {
        return JSON.parse(String(fs.readFileSync(`${prefix}${readModelName}`)))
      },
      set(value) {
        fs.writeFileSync(`${prefix}${readModelName}`, JSON.stringify(value))
      },
    }
    return store
  }
  const disconnect = async (store, readModelName) => {
    safeUnlinkSync(`${prefix}${readModelName}.lock`)
    readModels.delete(readModelName)
  }
  const drop = async (store, readModelName) => {
    safeUnlinkSync(`${prefix}${readModelName}.lock`)
    safeUnlinkSync(`${prefix}${readModelName}`)
  }
  const dispose = async () => {
    for (const readModelName of readModels) {
      safeUnlinkSync(`${prefix}${readModelName}.lock`)
    }
    readModels.clear()
  }
  return {
    connect,
    disconnect,
    drop,
    dispose,
  }
}
```

#### Projection

[mdis]: # './custom-readmodel-sample/projection.js'

```js
const projection = {
  Init: async (store) => {
    await store.set(0)
  },
  INCREMENT: async (store, event) => {
    await store.set((await store.get()) + event.payload)
  },
  DECREMENT: async (store, event) => {
    await store.set((await store.get()) - event.payload)
  },
}

export default projection
```

#### Resolvers

[mdis]: # './custom-readmodel-sample/resolvers.js'

```js
const resolvers = {
  read: async (store) => {
    return await store.get()
  },
}

export default resolvers
```

## Saga

#### App Config

[mdis]: # './saga-sample/config.js#app-config'

```js
const appConfig = {
  sagas: [
    {
      name: 'UserConfirmation',
      source: 'saga.js',
      connectorName: 'default',
    },
  ],
}
```

#### Dev Config

[mdis]: # './saga-sample/config.js#dev-config'

```js
const devConfig = {
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-lite',
    options: {
      databaseFile: ':memory:',
    },
  },
  readModelConnectors: {
    default: {
      module: '@resolve-js/readmodel-lite',
      options: {
        databaseFile: ':memory:',
      },
    },
    /*
    default: {
      module: 'readmodel-mysql',
      options: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: 'SagaSample'
      }
    }
    */
  },
}
```

#### Handlers and Side Effects

[mdis]: # './saga-sample/saga.js'

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

[mdis]: # './saga-with-authorization-sample/config.js#app-config'

```js
const appConfig = {
  aggregates: [
    {
      name: 'Process',
      commands: 'process.commands.js',
    },
  ],
  sagas: [
    {
      name: 'ProcessKiller',
      source: 'saga.js',
      connectorName: 'default',
    },
  ],
}
```

#### Dev Config

[mdis]: # './saga-with-authorization-sample/config.js#dev-config'

```js
const devConfig = {
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-lite',
    options: {
      databaseFile: ':memory:',
    },
  },
  readModelConnectors: {
    default: {
      module: '@resolve-js/readmodel-lite',
      options: {
        databaseFile: ':memory:',
      },
    },
    /*
    default: {
      module: '@resolve-js/readmodel-mysql',
      options: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: 'SagaWithAuthorizationSample'
      }
    }
    */
  },
}
```

#### Aggregate Commands

[mdis]: # './saga-with-authorization-sample/process.commands.js'

```js
import jsonwebtoken from 'jsonwebtoken'

import jwtSecret from './jwt-secret'

export default {
  createProcess: () => {
    return {
      type: 'PROCESS_CREATED',
    }
  },

  killAllProcesses: () => {
    return {
      type: 'ALL_PROCESS_KILLED',
    }
  },

  killProcess: (state, command, token) => {
    const jwt = jsonwebtoken.verify(token, jwtSecret)

    if (!jwt.permissions.processes.kill) {
      throw new Error('Access denied')
    }

    return {
      type: 'PROCESS_KILLED',
    }
  },
}
```

#### Saga

[mdis]: # './saga-with-authorization-sample/saga.js'

```js
import jsonwebtoken from 'jsonwebtoken'

import jwtSecret from './jwt-secret'

export const jwt = jsonwebtoken.sign(
  {
    permissions: {
      processes: {
        kill: true,
      },
    },
  },
  jwtSecret,
  {
    noTimestamp: true,
  }
)

export default {
  handlers: {
    Init: async ({ store }) => {
      await store.defineTable('Processes', {
        indexes: { id: 'string' },
        fields: [],
      })
    },

    PROCESS_CREATED: async ({ store }, event) => {
      await store.insert('Processes', {
        id: event.aggregateId,
      })
    },

    ALL_PROCESS_KILLED: async ({ store, sideEffects }) => {
      const processes = await store.find('Processes', {})

      for (const process of processes) {
        await sideEffects.executeCommand({
          aggregateName: 'Process',
          aggregateId: process.id,
          type: 'PROCESS_KILLED',
          jwt,
        })

        await store.delete('Processes', {
          id: process.id,
        })
      }
    },
  },
}
```

## Read model store advanced example

[mdis]: # './read-model-advanced-sample/projection.js#read-store-api'

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

[mdis]: # './saga-mock-side-effects-sample/saga.js'

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
          payload: 1,
        })
      }
    },
  },

  sideEffects: {
    getRandom: async () => {
      return Math.random()
    },
  },
}
```

#### Tests

[mdis]: # './saga-mock-side-effects-sample/saga.test.js'

```js
import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'
import givenEvents, {
  RESOLVE_SIDE_EFFECTS_START_TIMESTAMP,
} from '@resolve-js/testing-tools'

import config from './config'
import resetReadModel from '../reset-read-model'

describe('Saga', () => {
  const {
    name: sagaName,
    source: sourceModule,
    connectorName,
  } = config.sagas.find(({ name }) => name === 'UpdaterSaga')
  const {
    module: connectorModule,
    options: connectorOptions,
  } = config.readModelConnectors[connectorName]

  const createConnector = interopRequireDefault(require(connectorModule))
    .default
  const source = interopRequireDefault(require(`./${sourceModule}`)).default

  let sagaWithAdapter = null
  let adapter = null

  describe('with sideEffects.isEnabled = true', () => {
    let originalGetRandom = null

    beforeEach(async () => {
      await resetReadModel(createConnector, connectorOptions, schedulerName)
      await resetReadModel(createConnector, connectorOptions, sagaName)

      originalGetRandom = source.sideEffects.getRandom
      source.sideEffects.getRandom = jest.fn()

      adapter = createConnector(connectorOptions)
      sagaWithAdapter = {
        handlers: source.handlers,
        sideEffects: source.sideEffects,
        adapter,
        name: sagaName,
      }
    })

    afterEach(async () => {
      await resetReadModel(createConnector, connectorOptions, schedulerName)
      await resetReadModel(createConnector, connectorOptions, sagaName)

      source.sideEffects.getRandom = originalGetRandom
      originalGetRandom = null

      adapter = null
      sagaWithAdapter = null
    })

    test('success increment', async () => {
      source.sideEffects.getRandom.mockReturnValue(1)

      const result = await givenEvents([
        {
          aggregateId: 'counterId',
          type: 'UPDATE',
          payload: {},
        },
      ]).saga(sagaWithAdapter)

      expect(result.commands[0][0].type).toEqual('increment')
    })

    test('success decrement', async () => {
      source.sideEffects.getRandom.mockReturnValue(0)

      const result = await givenEvents([
        {
          aggregateId: 'counterId',
          type: 'UPDATE',
          payload: {},
        },
      ]).saga(sagaWithAdapter)

      expect(result.commands[0][0].type).toEqual('decrement')
    })
  })

  describe('with sideEffects.isEnabled = false', () => {
    beforeEach(async () => {
      await resetReadModel(createConnector, connectorOptions, schedulerName)
      await resetReadModel(createConnector, connectorOptions, sagaName)
      adapter = createConnector(connectorOptions)
      sagaWithAdapter = {
        handlers: source.handlers,
        sideEffects: source.sideEffects,
        adapter,
        name: sagaName,
      }
    })

    afterEach(async () => {
      await resetReadModel(createConnector, connectorOptions, schedulerName)
      await resetReadModel(createConnector, connectorOptions, sagaName)
      adapter = null
      sagaWithAdapter = null
    })

    test('do nothing', async () => {
      const result = await givenEvents([
        {
          aggregateId: 'counterId',
          type: 'UPDATE',
          payload: {},
        },
      ])
        .saga(sagaWithAdapter)
        .properties({
          [RESOLVE_SIDE_EFFECTS_START_TIMESTAMP]: Number.MAX_VALUE,
        })

      expect(result).toEqual({
        commands: [],
        scheduleCommands: [],
        sideEffects: [],
        queries: [],
      })
    })
  })
})
```

## Scripts

#### validateConfig

[mdis]: # './resolve-scripts-sample/run.js#validateConfig'

```js
import {
  ...
  validateConfig,
  ...
} from '@resolve-js/scripts'
    ...
    validateConfig(config)
```

#### build

[mdis]: # './resolve-scripts-sample/run.js#build'

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

#### start

[mdis]: # './resolve-scripts-sample/run.js#start'

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

#### watch

[mdis]: # './resolve-scripts-sample/run.js#watch'

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

#### runTestcafe

[mdis]: # './resolve-scripts-sample/run.js#runTestcafe'

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

#### merge

[mdis]: # './resolve-scripts-sample/run.js#merge'

```js
import {
  ...
  merge,
  ...
} from '@resolve-js/scripts'
  ...
    const resolveConfig = merge(defaultResolveConfig, appConfig, devConfig)
```

#### stop

[mdis]: # './resolve-scripts-sample/run.js#stop'

```js
import {
  ...
  stop,
  ...
} from '@resolve-js/scripts'
  ...
  try {
```

#### reset

[mdis]: # './resolve-scripts-sample/run.js#reset'

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
          dropSnapshots: true,
          dropReadModels: true,
          dropSagas: true
        })
        break
      }
      ...
    }
```

#### importEventStore

[mdis]: # './resolve-scripts-sample/run.js#importEventStore'

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

#### exportEventStore

[mdis]: # './resolve-scripts-sample/run.js#exportEventStore'

```js
import {
  ...
  exportEventStore,Scrip
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

#### eventstore-filter-events

###### initial-events

[mdis]:# (./eventstore-filter-events/docs-gen.test.js#initial-events)
```js
const initialEvents = [
  {
    type: 'LIST_CREATED',
    payload: { name: 'list-1' },
    aggregateId: 'list-1',
    aggregateVersion: 1,
  },
  {
    type: 'LIST_CREATED',
    payload: { name: 'list-2' },
    aggregateId: 'list-2',
    aggregateVersion: 1,
  },
  {
    type: 'ITEM_CREATED',
    payload: { name: 'item-1-1' },
    aggregateId: 'list-1',
    aggregateVersion: 2,
  },
  {
    type: 'ITEM_CREATED',
    payload: { name: 'item-1-2' },
    aggregateId: 'list-1',
    aggregateVersion: 3,
  },
  {
    type: 'ITEM_CREATED',
    payload: { name: 'item-2-1' },
    aggregateId: 'list-2',
    aggregateVersion: 2,
  },
]
```

###### load-events-1000

[mdis]:# (./eventstore-filter-events/docs-gen.test.js#load-events-1000)
```js
const { events } = await adapter.loadEvents({
  limit: 1000,
  cursor: null,
})
```

###### load-events-one-by-one

[mdis]:# (./eventstore-filter-events/docs-gen.test.js#load-events-one-by-one)
```js
let nextCursor = null
do {
  void ({ events, cursor: nextCursor } = await adapter.loadEvents({
    limit: 1,
    cursor: nextCursor,
  }))
} while (events.length > 0)
```

###### load-events-between-time

[mdis]:# (./eventstore-filter-events/docs-gen.test.js#load-events-between-time)
```js
const { events } = await adapter.loadEvents({
  limit: Number.MAX_SAFE_INTEGER,
  startTime: Date.now() - 1000,
  endTime: Date.now(),
})
```

###### load-events-by-types

[mdis]:# (./eventstore-filter-events/docs-gen.test.js#load-events-by-types)
```js
const { events } = await adapter.loadEvents({
  limit: 1000,
  eventTypes: ['ITEM_CREATED'],
  cursor: null,
})
```

###### load-events-by-aggregate-ids

[mdis]:# (./eventstore-filter-events/docs-gen.test.js#load-events-by-aggregate-ids)
```js
const { events } = await adapter.loadEvents({
  limit: 1000,
  aggregateIds: ['list-1'],
  cursor: null,
})
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/tests-readme?pixel)
