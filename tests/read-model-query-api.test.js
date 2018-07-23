// CUSTOMER-WRITTEN SAMPLE CODE FOR READ-MODEL PROJECTION AND RESOLVERS BEGINS HERE

// FILE EXAMPLE FOR `common/read-models/read-model-name.projection.js`
const projection = {
  Init: async store => {
    await store.defineTable('TestTable', {
      indexes: {
        firstIndexName: 'number',
        secondIndexName: 'string'
      },
      fields: ['firstFieldName', 'secondFieldName', 'firstJsonName', 'secondJsonName']
    })
  },

  INSERT_TEST: async (store, event) => {
    await store.insert('TestTable', {
      firstIndexName: 1,
      secondIndexName: 'idx-a',
      firstFieldName: 'content',
      secondFieldName: 0,
      firstJsonName: { a: 1, b: 2, e: 10 },
      secondJsonName: [1, 2, 3]
    })

    await store.insert('TestTable', {
      firstIndexName: 2,
      secondIndexName: 'idx-a',
      secondFieldName: 100,
      firstJsonName: { c: 3, d: 4, e: 20 }
    })

    await store.insert('TestTable', {
      firstIndexName: 3,
      secondIndexName: 'idx-b',
      secondFieldName: 200,
      secondJsonName: [3, 2, 1]
    })

    await store.insert('TestTable', {
      firstIndexName: 4,
      firstFieldName: 'text'
    })
  },

  UPDATE_TEST: async (store, event) => {
    console.log('@@UPDATE')
    await store.update(
      'TestTable',
      {
        firstIndexName: { $gt: 1 },
        secondIndexName: { $eq: 'idx-a' }
      },
      {
        $set: {
          'firstJsonName.f': 'new-inner-field',
          thirdFieldName: 'new-outer-field',
          thirdJsonName: ['new', 'outer', 'json', 'value']
        },
        $unset: {
          'firstJsonName.d': true,
          secondJsonName: true
        },
        $inc: {
          'firstJsonName.e': 5,
          secondFieldName: 42
        }
      }
    )

    await store.update(
      'TestTable',
      {
        $or: [
          {
            $and: [{ firstIndexName: { $lt: 1 } }, { secondIndexName: { $eq: 'idx-a' } }]
          },
          { secondIndexName: 'idx-b' }
        ]
      },
      {
        $set: {
          'firstJsonName.f': 'new-inner-field',
          thirdFieldName: 'new-outer-field',
          thirdJsonName: ['new', 'outer', 'json', 'value']
        }
      }
    )
  },

  UPSERT_TEST: async (store, event) => {
    console.log('@@UPSERT')
    await store.update(
      'TestTable',
      { firstIndexName: 10 },
      {
        $set: {
          'firstJsonName.f': 'new-inner-field',
          thirdFieldName: 'new-outer-field',
          thirdJsonName: ['new', 'outer', 'json', 'value']
        },
        $unset: {
          thirdFieldName: true
        }
      },
      { upsert: true }
    )
  },

  DELETE_TEST: async (store, event) => {}
}

// FILE EXAMPLE FOR `common/read-models/read-model-name.resolvers.js`
const resolvers = {
  RESOLVER_TEST: async (store, args) => {
    const simpleFind = await store.find(
      'TestTable',
      { firstIndexName: { $gte: 1 } },
      { firstJsonName: 1 },
      { secondFieldName: 1 }
    )

    return {
      simpleFind,
      args
    }
  }
}

// CUSTOMER-WRITTEN SAMPLE CODE ENDS

// THERE ARE ONLY MOCKS AND STUBS FOR TEST SHAPSHOTS PURPOSES BELOW
// DO NOT USE ANY FOLLOWING CODE FRAGMENTS IN OWN APPLICATION
describe('Read-model projection API', () => {
  const createReadModel = require('resolve-query').createReadModel
  const createAdapter = require('resolve-readmodel-memory').default

  let buildTestReadModel, events

  it('Insert and find in table', async () => {
    events.push({ type: 'INSERT_TEST', timestamp: 100 })
    const reader = buildTestReadModelReader()

    const result = await reader('RESOLVER_TEST', { x: 1, y: 2 })
    expect(result).toMatchSnapshot()
  })

  it('Update and find in table', async () => {
    events.push({ type: 'INSERT_TEST', timestamp: 100 })
    events.push({ type: 'UPDATE_TEST', timestamp: 101 })
    const reader = buildTestReadModelReader()

    const result = await reader('RESOLVER_TEST', { x: 1, y: 2 })
    expect(result).toMatchSnapshot()
  })

  it('Upsert and find in table', async () => {
    events.push({ type: 'INSERT_TEST', timestamp: 100 })
    events.push({ type: 'UPSERT_TEST', timestamp: 101 })
    const reader = buildTestReadModelReader()

    const result = await reader('RESOLVER_TEST', { x: 1, y: 2 })
    expect(result).toMatchSnapshot()
  })

  it('Delete and find in table', async () => {
    events.push({ type: 'INSERT_TEST', timestamp: 100 })
    events.push({ type: 'DELETE_TEST', timestamp: 101 })
    const reader = buildTestReadModelReader()

    const result = await reader('RESOLVER_TEST', { x: 1, y: 2 })
    expect(result).toMatchSnapshot()
  })

  beforeEach(async () => {
    events = []
    const eventStore = {
      async subscribeByEventType(eventTypes, handler, { startTime = 0 } = {}) {
        for (let event of events) {
          if (event && eventTypes.indexOf(event.type) > -1 && event.timestamp >= startTime) {
            handler(event)
            await Promise.resolve()
          }
        }

        return () => null
      }
    }
    buildTestReadModelReader = () => {
      const readModel = createReadModel({
        adapter: createAdapter(),
        projection,
        eventStore,
        resolvers
      })

      return async (resolverName, resolverArgs) => {
        let result = await readModel.read(resolverName, resolverArgs)

        const lastError = await readModel.getLastError()
        if (lastError != null) {
          result = lastError
        }

        return result
      }
    }
  })

  afterEach(async () => {
    buildTestReadModel = null
    events = null
  })
})
