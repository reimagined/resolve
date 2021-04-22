import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'
import givenEvents from '@resolve-js/testing-tools'

jest.setTimeout(1000 * 60 * 5)

const testId = 'root'

// eslint-disable-next-line no-console
console.error = () => {}

describe('Read-model Store API. Insert', () => {
  const createConnector = interopRequireDefault(
    require('@resolve-js/readmodel-lite')
  ).default

  const resolvers = interopRequireDefault(require(`./resolvers`)).default

  const events = [
    {
      aggregateId: 'root',
      type: 'TEST',
      payload: {},
    },
  ]

  test(`store.insert('test', { testId })`, async () => {
    const adapter = createConnector({
      databaseFile: ':memory:',
    })

    const projection = {
      Init: async (store) => {
        await store.defineTable('test', {
          indexes: { testId: 'string' },
          fields: ['key'],
        })
      },

      TEST: async (store) => {
        await store.insert('test', {
          testId,
        })
      },
    }

    expect(
      await givenEvents(events)
        .readModel({
          name: 'StoreApi',
          projection,
          resolvers,
        })
        .withAdapter(adapter)
        .query('all', {})
    ).toMatchSnapshot()
  })

  test(`store.insert('test', { testId, key: undefined })`, async () => {
    const adapter = createConnector({
      databaseFile: ':memory:',
    })

    const projection = {
      Init: async (store) => {
        await store.defineTable('test', {
          indexes: { testId: 'string' },
          fields: ['key'],
        })
      },

      TEST: async (store) => {
        await store.insert('test', {
          testId,
          key: undefined,
        })
      },
    }

    expect(
      await givenEvents(events)
        .readModel({
          name: 'StoreApi',
          projection,
          resolvers,
        })
        .withAdapter(adapter)
        .query('all', {})
    ).toMatchSnapshot()
  })

  test(`store.insert('test', { testId, obj: { key: undefined } })`, async () => {
    const adapter = createConnector({
      databaseFile: ':memory:',
    })

    const projection = {
      Init: async (store) => {
        await store.defineTable('test', {
          indexes: { testId: 'string' },
          fields: ['obj'],
        })
      },

      TEST: async (store) => {
        await store.insert('test', {
          testId,
          obj: {
            key: undefined,
          },
        })
      },
    }

    expect(
      await givenEvents(events)
        .readModel({
          name: 'StoreApi',
          projection,
          resolvers,
        })
        .withAdapter(adapter)
        .query('all', {})
    ).toMatchSnapshot()
  })

  test(`store.insert('test', { testId, deepObj: { obj: { key: undefined } } })`, async () => {
    const adapter = createConnector({
      databaseFile: ':memory:',
    })

    const projection = {
      Init: async (store) => {
        await store.defineTable('test', {
          indexes: { testId: 'string' },
          fields: ['deepObj'],
        })
      },

      TEST: async (store) => {
        await store.insert('test', {
          testId,
          deepObj: {
            obj: {
              key: undefined,
            },
          },
        })
      },
    }

    expect(
      await givenEvents(events)
        .readModel({
          name: 'StoreApi',
          projection,
          resolvers,
        })
        .withAdapter(adapter)
        .query('all', {})
    ).toMatchSnapshot()
  })

  ///

  test(`store.insert('test', { testId, key: null })`, async () => {
    const adapter = createConnector({
      databaseFile: ':memory:',
    })

    const projection = {
      Init: async (store) => {
        await store.defineTable('test', {
          indexes: { testId: 'string' },
          fields: ['key'],
        })
      },

      TEST: async (store) => {
        await store.insert('test', {
          testId,
          key: null,
        })
      },
    }

    expect(
      await givenEvents(events)
        .readModel({
          name: 'StoreApi',
          projection,
          resolvers,
        })
        .withAdapter(adapter)
        .query('all', {})
    ).toMatchSnapshot()
  })

  test(`store.insert('test', { testId, obj: { key: null } })`, async () => {
    const adapter = createConnector({
      databaseFile: ':memory:',
    })

    const projection = {
      Init: async (store) => {
        await store.defineTable('test', {
          indexes: { testId: 'string' },
          fields: ['obj'],
        })
      },

      TEST: async (store) => {
        await store.insert('test', {
          testId,
          obj: {
            key: null,
          },
        })
      },
    }

    expect(
      await givenEvents(events)
        .readModel({
          name: 'StoreApi',
          projection,
          resolvers,
        })
        .withAdapter(adapter)
        .query('all', {})
    ).toMatchSnapshot()
  })

  test(`store.insert('test', { testId, deepObj: { obj: { key: null } } })`, async () => {
    const adapter = createConnector({
      databaseFile: ':memory:',
    })

    const projection = {
      Init: async (store) => {
        await store.defineTable('test', {
          indexes: { testId: 'string' },
          fields: ['deepObj'],
        })
      },

      TEST: async (store) => {
        await store.insert('test', {
          testId,
          deepObj: {
            obj: {
              key: null,
            },
          },
        })
      },
    }

    expect(
      await givenEvents(events)
        .readModel({
          name: 'StoreApi',
          projection,
          resolvers,
        })
        .withAdapter(adapter)
        .query('all', {})
    ).toMatchSnapshot()
  })
})
