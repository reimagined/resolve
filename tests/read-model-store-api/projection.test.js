import givenEvents from '@resolve-js/testing-tools'

import { jestTimeout, adapters, adapterFactory } from '../readmodel-test-utils'
import resolvers from './resolvers'

jest.setTimeout(jestTimeout())

const testId = 'root'

// eslint-disable-next-line no-console
console.error = () => {}

describe(`${adapterFactory.name}. Read-model Store API. Find. Projection`, () => {
  beforeEach(adapterFactory.create('find_projection'))
  afterEach(adapterFactory.destroy('find_projection'))

  const adapter = adapters['find_projection']

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
      `  store.insert('test', { testId, a: 42 })`,
      `Resolver with projection { testId: 1 } should return [{ testId: 'root' }]`,
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
          await store.insert('test', {
            testId,
            a: 42,
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
        .query('findOneWithProjection', {
          testId,
          projection: { testId: 1 },
        })

      expect(result).toEqual({
        testId: 'root',
      })
    }
  )

  test(
    [
      `Projection`,
      `  store.defineTable({ /* ... */ fields: ['a'] })`,
      `  store.insert('test', { testId, a: 42 })`,
      `Resolver with projection { a: 1 } should return [{ a: 42 }]`,
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
          await store.insert('test', {
            testId,
            a: 42,
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
        .query('findOneWithProjection', {
          testId,
          projection: { a: 1 },
        })

      expect(result).toEqual({
        a: 42,
      })
    }
  )
})
