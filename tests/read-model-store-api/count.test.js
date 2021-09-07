import givenEvents from '@resolve-js/testing-tools'

import { jestTimeout, adapters, adapterFactory } from '../readmodel-test-utils'
import resolvers from './resolvers'

jest.setTimeout(jestTimeout())

// eslint-disable-next-line no-console
console.error = () => {}

describe(`${adapterFactory.name}. Read-model Store API. Count`, () => {
  beforeEach(adapterFactory.create('count'))
  afterEach(adapterFactory.destroy('count'))

  const adapter = adapters['count']

  test(
    [
      `Projection (Event count = 20)`,
      `  store.defineTable({ /* ... */ fields: [] })`,
      `  store.insert(/* ... *//)`,
      `  store.count should return 20`,
    ].join('\n'),
    async () => {
      const eventCount = 20

      const events = []
      for (let index = 0; index < eventCount; index++) {
        events.push({
          aggregateId: `id${index}`,
          type: 'TEST',
          payload: {},
        })
      }

      const projection = {
        Init: async (store) => {
          await store.defineTable('test', {
            indexes: { testId: 'string' },
            fields: [],
          })
        },

        TEST: async (store, { aggregateId }) => {
          await store.insert('test', {
            testId: aggregateId,
          })
        },
      }

      const result = await givenEvents(events)
        .readModel({
          name: 'StoreApi',
          projection,
          resolvers,
        })
        .withAdapter(adapter)
        .query('count', {})

      expect(result).toEqual(eventCount)
    }
  )
})
