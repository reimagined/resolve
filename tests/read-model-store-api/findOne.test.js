import givenEvents from '@resolve-js/testing-tools'

import { jestTimeout, adapters, adapterFactory } from '../readmodel-test-utils'
import resolvers from './resolvers'

jest.setTimeout(jestTimeout())

// eslint-disable-next-line no-console
console.error = () => {}

describe(`${adapterFactory.name}. Read-model Store API. FindOne`, () => {
  beforeEach(adapterFactory.create('findOne'))
  afterEach(adapterFactory.destroy('findOne'))

  const adapter = adapters['findOne']

  const events = [
    {
      aggregateId: 'root',
      type: 'TEST',
      payload: {},
    },
  ]

  test(`Projection\n        store.defineTable({ /* ... */ fields: ['a', 'd', 'e', 'f', 'g'] })\n        store.findOne should work correctly`, async () => {
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
  })

  test(`Projection\n        store.defineTable({ /* ... */ fields: ['a', 'b'] })\n        $and, $or should work correctly`, async () => {
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
  })
})
