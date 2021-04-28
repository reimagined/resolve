import givenEvents from '@resolve-js/testing-tools'

import { jestTimeout, adapters, adapterFactory } from '../readmodel-test-utils'

import resolvers from './resolvers'

jest.setTimeout(jestTimeout())

// eslint-disable-next-line no-console
console.error = () => {}

describe(`${adapterFactory.name}. Read-model Store API. Update. $set`, () => {
  beforeEach(adapterFactory.create('update_set_operator'))
  afterEach(adapterFactory.destroy('update_set_operator'))

  const adapter = adapters['update_set_operator']

  const events = [
    {
      aggregateId: 'root',
      type: 'TEST',
      payload: {},
    },
  ]

  test(`Projection\n        store.defineTable({ /* ... */ fields: ['a'] })\n        store.insert('test', { testId })\n        store.update('test', { testId }, { $set: { ['a']: true } } )\n      Resolver should return [{ testId: 'root', a: true }]`, async () => {
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
            $set: {
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

    expect(result).toEqual([{ testId: 'root', a: true }])
  })

  test(`Projection\n        store.defineTable({ /* ... */ fields: ['a', 'b'] })\n        store.insert('test', { testId })\n        store.update('test', { testId, a: true }, { $set: { ['a']: undefined, ['b']: undefined } } )\n      Resolver should return [{ testId: 'root', a: true, b: null }]`, async () => {
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
        })

        await store.update(
          'test',
          {
            testId,
          },
          {
            $set: {
              [`a`]: undefined, // do nothing
              [`b`]: undefined, // do nothing
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

    expect(result).toEqual([{ testId: 'root', a: true, b: null }])
  })

  test(`Projection\n        store.defineTable({ /* ... */ fields: ['a', 'b'] })\n        store.insert('test', { testId })\n        store.update('test', { testId, a: true }, { $set: { ['a']: undefined, ['b']: undefined } } )\n      Resolver should return [{ testId: 'root', a: true, b: null }]`, async () => {
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
        })

        await store.update(
          'test',
          {
            testId,
          },
          {
            $set: {
              [`a`]: null,
              [`b`]: null,
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

  test(`Projection\n        store.defineTable({ /* ... */ fields: ['a'] })\n        store.insert('test', { testId, a: {} })\n        store.update('test', { testId }, { $set: { ['a.b']: true } } )\n      Resolver should return [{ testId: 'root', a: { b: true } }]`, async () => {
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
          a: {},
        })

        await store.update(
          'test',
          {
            testId,
          },
          {
            $set: {
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

    expect(result).toEqual([{ testId: 'root', a: { b: true } }])
  })

  test(`Projection\n        store.defineTable({ /* ... */ fields: ['a'] })\n        store.insert('test', { testId, a: {} })\n        store.update('test', { testId }, { $set: { ['a.b.c']: true } } )\n      Resolver should throw error`, async () => {
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
          a: {},
        })

        await store.update(
          'test',
          {
            testId,
          },
          {
            $set: {
              [`a.b.c`]: true,
            },
          }
        )
      },
    }

    await expect(
      givenEvents(events)
        .readModel({
          name: 'StoreApi',
          projection,
          resolvers,
        })
        .withAdapter(adapter)
        .query('find', {})
    ).rejects.toThrow()
  })

  test(`Projection\n        store.defineTable({ /* ... */ fields: ['a'] })\n        store.insert('test', { testId, a: null })\n        store.update('test', { testId }, { $set: { ['a.b']: true } } )\n      Resolver should throw error`, async () => {
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
          a: null,
        })

        await store.update(
          'test',
          {
            testId,
          },
          {
            $set: {
              [`a.b`]: true,
            },
          }
        )
      },
    }

    await expect(
      givenEvents(events)
        .readModel({
          name: 'StoreApi',
          projection,
          resolvers,
        })
        .withAdapter(adapter)
        .query('find', {})
    ).rejects.toThrow()
  })
})
