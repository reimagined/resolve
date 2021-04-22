import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'
import givenEvents from '@resolve-js/testing-tools'

jest.setTimeout(1000 * 60 * 5)

const testId = 'root'

// eslint-disable-next-line no-console
console.error = () => {}

describe('Read-model Store API. Update. $set', () => {
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

  test(`Projection\n        store.insert('test', { testId, obj: {} })\n        store.update('test', { testId }, { $set: { ['obj.key']: true } } )\n      Resolver should return [{ testId: 'root', obj: { key: true } }]`, async () => {
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
            $set: {
              [`obj.key`]: true,
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

    expect(result).toEqual([{ testId: 'root', obj: { key: true } }])
  })

  test(`Projection\n        store.insert('test', { testId, deepObj: {} })\n        store.update('test', { testId }, { $set: { ['deepObj.obj.key']: true } } )\n      Resolver should return [ { testId: 'root', deepObj: { obj: { key: true } } } ]`, async () => {
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

      TEST: async (store, event) => {
        const { aggregateId: testId } = event

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
            $set: {
              [`deepObj.obj.key`]: true,
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

    expect(result).toEqual([
      { testId: 'root', deepObj: { obj: { key: true } } },
    ])
  })
})
