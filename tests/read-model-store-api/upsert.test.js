import givenEvents from '@resolve-js/testing-tools'

import { jestTimeout, adapters, adapterFactory } from '../readmodel-test-utils'
import resolvers from './resolvers'

jest.setTimeout(jestTimeout())

const testId = 'root'

// eslint-disable-next-line no-console
console.error = () => {}

describe(`${adapterFactory.name}. Read-model Store API. Upsert`, () => {
  beforeEach(adapterFactory.create('upsert'))
  afterEach(adapterFactory.destroy('upsert'))

  const adapter = adapters['upsert']

  const events = [
    {
      aggregateId: 'root',
      type: 'TEST',
      payload: {},
    },
  ]

  test(
    [
      `Projection`,
      `  store.defineTable({ /* ... */ fields: ['a'] })`,
      `  store.update('test', { testId }, { $set: { ['a']: true } }, { upsert: true })`,
      `Resolver should return [{ testId: 'root', a: true }]`,
    ].join('\n'),
    async () => {
      const projection = {
        Init: async (store) => {
          await store.defineTable('test', {
            indexes: { testId: 'string' },
            fields: ['a'],
          })
        },

        TEST: async (store) => {
          await store.update(
            'test',
            {
              testId,
            },
            { $set: { a: true } },
            { upsert: true }
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
        .query('find', {})

      expect(result).toEqual([
        {
          testId: 'root',
          a: true,
        },
      ])
    }
  )
})
