import givenEvents from '@resolve-js/testing-tools'

import { jestTimeout, adapters, adapterFactory } from '../readmodel-test-utils'

import resolvers from './resolvers'

jest.setTimeout(jestTimeout())

// eslint-disable-next-line no-console
console.error = () => {}

describe(`${adapterFactory.name}. Read-model Store API. Update. $unset`, () => {
  beforeEach(adapterFactory.create('update_unset_operator'))
  afterEach(adapterFactory.destroy('update_unset_operator'))

  const adapter = adapters['update_unset_operator']

  const events = [
    {
      aggregateId: 'root',
      type: 'TEST',
      payload: {},
    },
  ]

  test(`Projection\n        store.defineTable({ /* ... */ fields: ['a'] })\n        store.insert('test', { testId })\n        store.update('test', { testId }, { $unset: { ['a']: true } } )\n      Resolver should return [{ testId: 'root', a: null }]`, async () => {
    const projection = {
      Init: async (store) => {
        await store.defineTable('test', {
          indexes: { testId: 'string' },
          fields: ['a'],
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
            $unset: {
              [`a`]: true,
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
      .query('find', {})

    expect(result).toEqual([{ testId: 'root', a: null }])
  })

  test(`Projection\n        store.defineTable({ /* ... */ fields: ['a'] })\n        store.insert('test', { testId, a: 42 })\n        store.update('test', { testId }, { $unset: { ['a']: true } } )\n      Resolver should return [{ testId: 'root', a: null }]`, async () => {
    const projection = {
      Init: async (store) => {
        await store.defineTable('test', {
          indexes: { testId: 'string' },
          fields: ['a'],
        })
      },

      TEST: async (store, event) => {
        const { aggregateId: testId } = event

        await store.insert('test', {
          testId,
          a: 42,
        })

        await store.update(
          'test',
          {
            testId,
          },
          {
            $unset: {
              [`a`]: true,
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
      .query('find', {})

    expect(result).toEqual([{ testId: 'root', a: null }])
  })

  test(`Projection\n        store.defineTable({ /* ... */ fields: ['a', 'b'] })\n        store.insert('test', { testId, a: true, b: false })\n        store.update('test', { testId }, { $unset: { ['a']: true, ['b']: true } } )\n      Resolver should return [{ testId: 'root', a: null }]`, async () => {
    const projection = {
      Init: async (store) => {
        await store.defineTable('test', {
          indexes: { testId: 'string' },
          fields: ['a', 'b'],
        })
      },

      TEST: async (store, event) => {
        const { aggregateId: testId } = event

        await store.insert('test', {
          testId,
          a: true,
          b: false,
        })

        await store.update(
          'test',
          {
            testId,
          },
          {
            $unset: {
              [`a`]: true,
              [`b`]: true,
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
      .query('find', {})

    expect(result).toEqual([{ testId: 'root', a: null, b: null }])
  })

  test(`Projection\n        store.defineTable({ /* ... */ fields: ['a'] })\n        store.insert('test', { testId, a: { b: true, c: false } })\n        store.update('test', { testId }, { $unset: { ['a.b']: true } } )\n      Resolver should return [{ testId: 'root', a: { c: false } }]`, async () => {
    const projection = {
      Init: async (store) => {
        await store.defineTable('test', {
          indexes: { testId: 'string' },
          fields: ['a'],
        })
      },

      TEST: async (store, event) => {
        const { aggregateId: testId } = event

        await store.insert('test', {
          testId,
          a: { b: true, c: false },
        })

        await store.update(
          'test',
          {
            testId,
          },
          {
            $unset: {
              [`a.b`]: true,
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
      .query('find', {})

    expect(result).toEqual([{ testId: 'root', a: { c: false } }])
  })
  test(`Projection\n        store.defineTable({ /* ... */ fields: ['a'] })\n        store.insert('test', { testId, a: { b: true, c: false } })\n        store.update('test', { testId }, { $unset: { ['a.b']: true, ['a.c']: true } } )\n      Resolver should return [{ testId: 'root', a: { } }]`, async () => {
    const projection = {
      Init: async (store) => {
        await store.defineTable('test', {
          indexes: { testId: 'string' },
          fields: ['a'],
        })
      },

      TEST: async (store, event) => {
        const { aggregateId: testId } = event

        await store.insert('test', {
          testId,
          a: { b: true, c: false },
        })

        await store.update(
          'test',
          {
            testId,
          },
          {
            $unset: {
              [`a.b`]: true,
              [`a.c`]: true,
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
      .query('find', {})

    expect(result).toEqual([{ testId: 'root', a: {} }])
  })
})
