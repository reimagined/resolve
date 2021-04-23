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

  test(`Projection\n        store.insert('test', { testId })\n      Resolver should return [{ testId: 'root', a: null }]`, async () => {
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
      .query('all', {})

    expect(result).toEqual([
      {
        testId: 'root',
        a: null,
      },
    ])
  })

  test(`Projection\n        store.insert('test', { testId, a: undefined })\n      Resolver should return [{ testId: 'root', a: null }]`, async () => {
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
      .query('all', {})

    expect(result).toEqual([
      {
        testId: 'root',
        a: null,
      },
    ])
  })

  test(`Projection\n        store.insert('test', { testId, a: { b: undefined } })\n      Resolver should return [{ testId: 'root', a: {} }]`, async () => {
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
      .query('all', {})

    expect(result).toEqual([
      {
        testId: 'root',
        a: {},
      },
    ])
  })

  test(`Projection\n        store.insert('test', { testId, a: { b: { c: undefined } } })\n      Resolver should return [{ testId: 'root', a: { b: {} } }]`, async () => {
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
      .query('all', {})

    expect(result).toEqual([
      {
        testId: 'root',
        a: { b: {} },
      },
    ])
  })

  test(`Projection\n        store.insert('test', { testId, a: null })\n      Resolver should return [{ testId: 'root', a: null }]`, async () => {
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
      .query('all', {})

    expect(result).toEqual([
      {
        testId: 'root',
        a: null,
      },
    ])
  })

  test(`Projection\n        store.insert('test', { testId, a: { b: null } })\n      Resolver should return [{ testId: 'root', a: { b: null } }]`, async () => {
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
      .query('all', {})

    expect(result).toEqual([
      {
        testId: 'root',
        a: {
          b: null,
        },
      },
    ])
  })

  test(`Projection\n        store.insert('test', { testId, a: { b: { c: null } } })\n      Resolver should return [{ testId: 'root', a: { b: { c: null} } }]`, async () => {
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
      .query('all', {})

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
  })
})
