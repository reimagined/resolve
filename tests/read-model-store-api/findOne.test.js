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

  test(`Projection\n        store.findOne should work correctly`, async () => {
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

    expect(await domain.query('all', {})).toEqual([
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
})
