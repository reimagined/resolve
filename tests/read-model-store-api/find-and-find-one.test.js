import givenEvents from '@resolve-js/testing-tools'

import { jestTimeout, adapters, adapterFactory } from '../readmodel-test-utils'
import resolvers from './resolvers'

jest.setTimeout(jestTimeout())

// eslint-disable-next-line no-console
console.error = () => {}

describe(`${adapterFactory.name}. Read-model Store API. FindOne`, () => {
  beforeEach(adapterFactory.create('find_and_find_one'))
  afterEach(adapterFactory.destroy('find_and_find_one'))

  const adapter = adapters['find_and_find_one']

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
      `  store.defineTable({ /* ... */ fields: ['a', 'd', 'e', 'f', 'g'] })`,
      `  store.findOne should work correctly`,
    ].join('\n'),
    async () => {
      const projection = {
        Init: async (store) => {
          await store.defineTable('test', {
            indexes: { testId: 'string' },
            fields: ['a', 'd', 'e', 'f', 'g'],
          })
        },

        TEST: async (store) => {
          await store.insert('test', {
            testId: 'test-id-1',
            a: {
              b: {
                c: null,
              },
            },
            d: null,
            e: undefined,
            f: 42,
            g: 'test',
          })
          await store.insert('test', {
            testId: 'test-id-2',
          })
        },
      }

      const domain = givenEvents(events)
        .readModel({
          name: 'StoreApi',
          projection,
          resolvers,
        })
        .withAdapter(adapter)

      expect(await domain.query('find', {})).toEqual([
        {
          testId: 'test-id-1',
          a: {
            b: {
              c: null,
            },
          },
          d: null,
          e: null,
          f: 42,
          g: 'test',
        },
        {
          testId: 'test-id-2',
          a: null,
          d: null,
          e: null,
          f: null,
          g: null,
        },
      ])
      expect(await domain.query('findOne', { testId: 'test-id-1' })).toEqual({
        testId: 'test-id-1',
        a: {
          b: {
            c: null,
          },
        },
        d: null,
        e: null,
        f: 42,
        g: 'test',
      })
      expect(await domain.query('findOne', { testId: 'test-id-2' })).toEqual({
        testId: 'test-id-2',
        a: null,
        d: null,
        e: null,
        f: null,
        g: null,
      })

      expect(await domain.query('findOne', { 'a.b.c': null })).toEqual({
        testId: 'test-id-1',
        a: {
          b: {
            c: null,
          },
        },
        d: null,
        e: null,
        f: 42,
        g: 'test',
      })

      expect(await domain.query('findOne', { d: null })).toEqual({
        testId: 'test-id-1',
        a: {
          b: {
            c: null,
          },
        },
        d: null,
        e: null,
        f: 42,
        g: 'test',
      })

      try {
        await domain.query('findOne', { a: {} })
        return Promise.reject('Test failed')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    }
  )

  test(
    [
      `Projection`,
      `  store.defineTable({ /* ... */ fields: ['a', 'b'] })`,
      `  $and, $or should work correctly`,
    ].join('\n'),
    async () => {
      const projection = {
        Init: async (store) => {
          await store.defineTable('test', {
            indexes: { testId: 'string' },
            fields: ['a', 'b'],
          })
        },

        TEST: async (store) => {
          await store.insert('test', {
            testId: 'test-id-1',
            a: false,
            b: false,
          })
          await store.insert('test', {
            testId: 'test-id-2',
            a: false,
            b: true,
          })
          await store.insert('test', {
            testId: 'test-id-3',
            a: true,
            b: false,
          })
          await store.insert('test', {
            testId: 'test-id-4',
            a: true,
            b: true,
          })
          await store.insert('test', {
            testId: 'test-id-5',
            a: { c: false },
            b: { c: false },
          })
          await store.insert('test', {
            testId: 'test-id-6',
            a: { c: false },
            b: { c: true },
          })
          await store.insert('test', {
            testId: 'test-id-7',
            a: { c: true },
            b: { c: false },
          })
          await store.insert('test', {
            testId: 'test-id-8',
            a: { c: true },
            b: { c: true },
          })
        },
      }

      const domain = givenEvents(events)
        .readModel({
          name: 'StoreApi',
          projection,
          resolvers,
        })
        .withAdapter(adapter)

      expect(await domain.query('findOne', { testId: 'test-id-1' })).toEqual({
        testId: 'test-id-1',
        a: false,
        b: false,
      })
      expect(await domain.query('findOne', { testId: 'test-id-2' })).toEqual({
        testId: 'test-id-2',
        a: false,
        b: true,
      })
      expect(await domain.query('findOne', { testId: 'test-id-3' })).toEqual({
        testId: 'test-id-3',
        a: true,
        b: false,
      })
      expect(await domain.query('findOne', { testId: 'test-id-4' })).toEqual({
        testId: 'test-id-4',
        a: true,
        b: true,
      })

      expect(
        await domain.query('findOne', {
          $and: [
            {
              a: true,
            },
            {
              b: true,
            },
          ],
        })
      ).toEqual({
        testId: 'test-id-4',
        a: true,
        b: true,
      })

      expect(
        await domain.query('findOne', {
          $and: [
            {
              a: false,
            },
            {
              b: false,
            },
          ],
        })
      ).toEqual({
        testId: 'test-id-1',
        a: false,
        b: false,
      })

      expect(
        await domain.query('findOne', {
          $and: [
            {
              'a.c': true,
            },
            {
              'b.c': true,
            },
          ],
        })
      ).toEqual({
        testId: 'test-id-8',
        a: { c: true },
        b: { c: true },
      })

      expect(
        await domain.query('findOne', {
          $and: [
            {
              'a.c': false,
            },
            {
              'b.c': false,
            },
          ],
        })
      ).toEqual({
        testId: 'test-id-5',
        a: { c: false },
        b: { c: false },
      })

      expect(
        await domain.query('find', {
          $or: [
            {
              a: true,
            },
            {
              b: true,
            },
          ],
        })
      ).toEqual([
        {
          testId: 'test-id-2',
          a: false,
          b: true,
        },
        {
          testId: 'test-id-3',
          a: true,
          b: false,
        },
        {
          testId: 'test-id-4',
          a: true,
          b: true,
        },
      ])

      expect(
        await domain.query('find', {
          $or: [
            {
              'a.c': true,
            },
            {
              'b.c': true,
            },
          ],
        })
      ).toEqual([
        {
          testId: 'test-id-6',
          a: { c: false },
          b: { c: true },
        },
        {
          testId: 'test-id-7',
          a: { c: true },
          b: { c: false },
        },
        {
          testId: 'test-id-8',
          a: { c: true },
          b: { c: true },
        },
      ])

      expect(
        await domain.query('find', {
          $or: [
            {
              a: false,
            },
            {
              b: false,
            },
          ],
        })
      ).toEqual([
        {
          testId: 'test-id-1',
          a: false,
          b: false,
        },
        {
          testId: 'test-id-2',
          a: false,
          b: true,
        },
        {
          testId: 'test-id-3',
          a: true,
          b: false,
        },
      ])

      expect(
        await domain.query('find', {
          $or: [
            {
              'a.c': false,
            },
            {
              'b.c': false,
            },
          ],
        })
      ).toEqual([
        {
          testId: 'test-id-5',
          a: { c: false },
          b: { c: false },
        },
        {
          testId: 'test-id-6',
          a: { c: false },
          b: { c: true },
        },
        {
          testId: 'test-id-7',
          a: { c: true },
          b: { c: false },
        },
      ])

      expect(
        await domain.query('find', {
          $or: [
            {
              a: true,
            },
          ],
        })
      ).toEqual([
        {
          testId: 'test-id-3',
          a: true,
          b: false,
        },
        {
          testId: 'test-id-4',
          a: true,
          b: true,
        },
      ])

      expect(
        await domain.query('find', {
          $or: [
            {
              'a.c': true,
            },
          ],
        })
      ).toEqual([
        {
          testId: 'test-id-7',
          a: { c: true },
          b: { c: false },
        },
        {
          testId: 'test-id-8',
          a: { c: true },
          b: { c: true },
        },
      ])

      expect(
        await domain.query('find', {
          $or: [
            {
              a: false,
            },
          ],
        })
      ).toEqual([
        {
          testId: 'test-id-1',
          a: false,
          b: false,
        },
        {
          testId: 'test-id-2',
          a: false,
          b: true,
        },
      ])

      expect(
        await domain.query('find', {
          $or: [
            {
              'a.c': false,
            },
          ],
        })
      ).toEqual([
        {
          testId: 'test-id-5',
          a: { c: false },
          b: { c: false },
        },
        {
          testId: 'test-id-6',
          a: { c: false },
          b: { c: true },
        },
      ])
    }
  )

  test(
    [
      `Projection`,
      `  store.defineTable({ /* ... */ fields: ['a'] })`,
      `  $lt, $gt, $lte, $gte should work correctly`,
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
            testId: 'test-id-1',
            a: 1,
          })
          await store.insert('test', {
            testId: 'test-id-2',
            a: 2,
          })
          await store.insert('test', {
            testId: 'test-id-3',
            a: 3,
          })
          await store.insert('test', {
            testId: 'test-id-4',
            a: 4,
          })
          await store.insert('test', {
            testId: 'test-id-5',
            a: { b: 1 },
          })
          await store.insert('test', {
            testId: 'test-id-6',
            a: { b: 2 },
          })
          await store.insert('test', {
            testId: 'test-id-7',
            a: { b: 3 },
          })
          await store.insert('test', {
            testId: 'test-id-8',
            a: { b: 4 },
          })
        },
      }

      const domain = givenEvents(events)
        .readModel({
          name: 'StoreApi',
          projection,
          resolvers,
        })
        .withAdapter(adapter)

      expect(
        await domain.query('find', {
          $and: [{ a: { $gte: 2 } }, { a: { $lte: 3 } }],
        })
      ).toEqual([
        {
          a: 2,
          testId: 'test-id-2',
        },
        {
          a: 3,
          testId: 'test-id-3',
        },
      ])

      expect(
        await domain.query('find', {
          $and: [{ a: { $gt: 1 } }, { a: { $lt: 4 } }],
        })
      ).toEqual([
        {
          a: 2,
          testId: 'test-id-2',
        },
        {
          a: 3,
          testId: 'test-id-3',
        },
      ])
    }
  )

  test(
    [
      `Projection`,
      `  store.defineTable({ /* ... */ fields: ['a', 'b', 'c'] })`,
      `  a: true, '$or': [ { b: true }, { c: true } ] and`,
      `  a: false, '$or': [ { b: false }, { c: false } ] should throw error`,
      `Unsupported search condition format`,
    ].join('\n'),
    async () => {
      const projection = {
        Init: async (store) => {
          await store.defineTable('test', {
            indexes: { testId: 'string' },
            fields: ['a', 'b', 'c'],
          })
        },

        TEST: async (store) => {
          await store.insert('test', {
            testId: 'test-id-1',
            a: false,
            b: false,
            c: false,
          })
          await store.insert('test', {
            testId: 'test-id-2',
            a: false,
            b: false,
            c: true,
          })
          await store.insert('test', {
            testId: 'test-id-3',
            a: false,
            b: true,
            c: false,
          })
          await store.insert('test', {
            testId: 'test-id-4',
            a: false,
            b: true,
            c: true,
          })
          await store.insert('test', {
            testId: 'test-id-5',
            a: true,
            b: false,
            c: false,
          })
          await store.insert('test', {
            testId: 'test-id-6',
            a: true,
            b: false,
            c: true,
          })
          await store.insert('test', {
            testId: 'test-id-7',
            a: true,
            b: true,
            c: false,
          })
          await store.insert('test', {
            testId: 'test-id-8',
            a: true,
            b: true,
            c: true,
          })
        },
      }

      const domain = givenEvents(events)
        .readModel({
          name: 'StoreApi',
          projection,
          resolvers,
        })
        .withAdapter(adapter)

      await expect(
        domain.query('find', {
          a: true,
          $or: [{ b: true }, { c: true }],
        })
      ).rejects.toThrow(/Unsupported search condition format/)
      await expect(
        domain.query('find', {
          a: false,
          $or: [{ b: false }, { c: false }],
        })
      ).rejects.toThrow(/Unsupported search condition format/)
    }
  )
})
