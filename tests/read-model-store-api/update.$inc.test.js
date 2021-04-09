import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'
import givenEvents from '@resolve-js/testing-tools'

jest.setTimeout(1000 * 60 * 5)

const testId = 'root'

// eslint-disable-next-line no-console
console.error = () => {}

describe('Read-model Store API. Update. $inc', () => {
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

  test(`store.insert('test', { testId, key: 0 })\n      store.update('test', { testId }, { $inc: { ['key']: 1 } } )`, async () => {
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

      TEST: async (store, event) => {
        const { aggregateId: testId } = event

        await store.insert('test', {
          testId,
          key: 0,
        })

        await store.update(
          'test',
          {
            testId,
          },
          {
            $inc: {
              [`key`]: 1,
            },
          }
        )
      },
    }

    const result =
      await givenEvents(events)
        .readModel({
          name: 'StoreApi',
          projection,
          resolvers,
        })
        .withAdapter(adapter)
        .query('all', {})

    expect(result).toMatchSnapshot()
  })

  test(`store.insert('test', { testId, key: undefined })\n      store.update('test', { testId }, { $inc: { ['key']: 1 } } )`, async () => {
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

      TEST: async (store, event) => {
        const { aggregateId: testId } = event

        await store.insert('test', {
          testId,
          key: undefined,
        })

        await store.update(
          'test',
          {
            testId,
          },
          {
            $inc: {
              [`key`]: 1,
            },
          }
        )
      },
    }

    const result  =await givenEvents(events)
        .readModel({
          name: 'StoreApi',
          projection,
          resolvers,
        })
        .withAdapter(adapter)
        .query('all', {})

    expect(result).toMatchSnapshot()
  })

  test(`store.insert('test', { testId, key: null })\n      store.update('test', { testId }, { $inc: { ['key']: 1 } } )`, async () => {
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

      TEST: async (store, event) => {
        const { aggregateId: testId } = event

        await store.insert('test', {
          testId,
          key: null,
        })

        await store.update(
          'test',
          {
            testId,
          },
          {
            $inc: {
              [`key`]: 1,
            },
          }
        )
      },
    }

    const result = await givenEvents(events)
        .readModel({
          name: 'StoreApi',
          projection,
          resolvers,
        })
        .withAdapter(adapter)
        .query('all', {})


    expect(result).toMatchSnapshot()
  })

  test(`store.insert('test', { testId, obj: { key: 0 } })\n      store.update('test', { testId }, { $inc: { ['obj.key']: 1 } } )`, async () => {
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

      TEST: async (store, event) => {
        const { aggregateId: testId } = event

        await store.insert('test', {
          testId,
          obj: {
            key: 0,
          },
        })

        await store.update(
          'test',
          {
            testId,
          },
          {
            $inc: {
              [`obj.key`]: 1,
            },
          }
        )
      },
    }

    const result =
      await givenEvents(events)
        .readModel({
          name: 'StoreApi',
          projection,
          resolvers,
        })
        .withAdapter(adapter)
        .query('all', {})

    expect(result).toMatchSnapshot()
  })

  test(`store.insert('test', { testId })\n      store.update('test', { testId }, { $inc: { ['key']: 1 } } )`, async () => {
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

      TEST: async (store, event) => {
        const { aggregateId: testId } = event

        await store.insert('test', {
          testId,
        })

        await store.update(
          'test',
          {
            testId,
          },
          {
            $inc: {
              [`key`]: 1,
            },
          }
        )
      },
    }

    const result = await givenEvents(events)
      .readModel({
        name: 'StoreApi',
        projection,
        resolvers,
      })
      .withAdapter(adapter)
      .query('all', {})

    expect(result).toMatchSnapshot()
  })

  test(`store.insert('test', { testId })\n      store.update('test', { testId }, { $inc: { ['obj.key']: 1 } } )`, async () => {
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

      TEST: async (store, event) => {
        const { aggregateId: testId } = event

        await store.insert('test', {
          testId,
        })

        await store.update(
          'test',
          {
            testId,
          },
          {
            $inc: {
              [`obj.key`]: 1,
            },
          }
        )
      },
    }

    const result = await givenEvents(events)
      .readModel({
        name: 'StoreApi',
        projection,
        resolvers,
      })
      .withAdapter(adapter)
      .query('all', {})

    expect(result).toMatchSnapshot()
  })

  test(`store.insert('test', { testId, obj: {} })\n      store.update('test', { testId }, { $inc: { ['obj.key']: 1 } } )`, async () => {
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

      TEST: async (store, event) => {
        const { aggregateId: testId } = event

        await store.insert('test', {
          testId,
          obj: {},
        })

        await store.update(
          'test',
          {
            testId,
          },
          {
            $inc: {
              [`obj.key`]: 1,
            },
          }
        )
      },
    }

    const result = await givenEvents(events)
      .readModel({
        name: 'StoreApi',
        projection,
        resolvers,
      })
      .withAdapter(adapter)
      .query('all', {})

    expect(result).toMatchSnapshot()
  })

  test(`store.insert('test', { testId, deepObj: {} })\n      store.update('test', { testId }, { $inc: { ['deepObj.obj.key']: 1 } } )`, async () => {
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
          deepObj: {},
        })

        await store.update(
          'test',
          {
            testId,
          },
          {
            $inc: {
              [`deepObj.obj.key`]: 1,
            },
          }
        )
      },
    }

    const result = await givenEvents(events)
      .readModel({
        name: 'StoreApi',
        projection,
        resolvers,
      })
      .withAdapter(adapter)
      .query('all', {})

    expect(result).toMatchSnapshot()
  })
})
