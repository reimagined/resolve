import givenEvents from '@resolve-js/testing-tools'

import { jestTimeout, adapters, adapterFactory } from '../readmodel-test-utils'
import resolvers from './resolvers'

jest.setTimeout(jestTimeout())

const testId = 'root'

// eslint-disable-next-line no-console
console.error = () => {}

describe(`${adapterFactory.name}. Read-model Store API. Insert`, () => {
  beforeEach(adapterFactory.create('insert'))
  afterEach(adapterFactory.destroy('insert'))

  const adapter = adapters['insert']

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
      `  store.insert('test', { testId })`,
      `Resolver should return [{ testId: 'root', a: null }]`,
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
        .query('find', {})

      expect(result).toEqual([
        {
          testId: 'root',
          a: null,
        },
      ])
    }
  )

  test(
    [
      `Projection`,
      `  store.defineTable({ /* ... */ fields: ['a'] })`,
      `  store.insert('test', { testId, a: undefined })`,
      `Resolver should return [{ testId: 'root', a: null }]`,
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
            a: undefined,
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
        .query('find', {})

      expect(result).toEqual([
        {
          testId: 'root',
          a: null,
        },
      ])
    }
  )

  test(
    [
      `Projection`,
      `  store.defineTable({ /* ... */ fields: ['a'] })`,
      `  store.insert('test', { testId, a: { b: undefined } })`,
      `Resolver should return [{ testId: 'root', a: {} }]`,
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
            a: {
              b: undefined,
            },
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
        .query('find', {})

      expect(result).toEqual([
        {
          testId: 'root',
          a: {},
        },
      ])
    }
  )

  test(
    [
      `Projection`,
      `  store.defineTable({ /* ... */ fields: ['a'] })`,
      `  store.insert('test', { testId, a: { b: { c: undefined } } })`,
      `Resolver should return [{ testId: 'root', a: { b: {} } }]`,
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
            a: {
              b: {
                c: undefined,
              },
            },
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
        .query('find', {})

      expect(result).toEqual([
        {
          testId: 'root',
          a: { b: {} },
        },
      ])
    }
  )

  test(
    [
      `Projection`,
      `  store.defineTable({ /* ... */ fields: ['a'] })`,
      `  store.insert('test', { testId, a: null })`,
      `Resolver should return [{ testId: 'root', a: null }]`,
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
            a: null,
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
        .query('find', {})

      expect(result).toEqual([
        {
          testId: 'root',
          a: null,
        },
      ])
    }
  )

  test(
    [
      `Projection`,
      `  store.defineTable({ /* ... */ fields: ['a'] })`,
      `  store.insert('test', { testId, a: { b: null } })`,
      `Resolver should return [{ testId: 'root', a: { b: null } }]`,
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
            a: {
              b: null,
            },
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
        .query('find', {})

      expect(result).toEqual([
        {
          testId: 'root',
          a: {
            b: null,
          },
        },
      ])
    }
  )

  test(
    [
      `Projection`,
      `  store.defineTable({ /* ... */ fields: ['a'] })`,
      `  store.insert('test', { testId, a: { b: { c: null } } })`,
      `Resolver should return [{ testId: 'root', a: { b: { c: null} } }]`,
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
            a: {
              b: {
                c: null,
              },
            },
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
        .query('find', {})

      expect(result).toEqual([
        {
          testId: 'root',
          a: {
            b: {
              c: null,
            },
          },
        },
      ])
    }
  )
})
