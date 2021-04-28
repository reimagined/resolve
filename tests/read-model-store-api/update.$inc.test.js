import givenEvents from '@resolve-js/testing-tools'

import { jestTimeout, adapters, adapterFactory } from '../readmodel-test-utils'
import resolvers from './resolvers'

jest.setTimeout(jestTimeout())

// eslint-disable-next-line no-console
console.error = () => {}

describe(`${adapterFactory.name}. Read-model Store API. Update. $inc`, () => {
  beforeEach(adapterFactory.create('update_inc_operator'))
  afterEach(adapterFactory.destroy('update_inc_operator'))

  const adapter = adapters['update_inc_operator']

  const events = [
    {
      aggregateId: 'root',
      type: 'TEST',
      payload: {},
    },
  ]

  test(`Projection\n        store.defineTable({ /* ... */ fields: ['a'] })\n        store.insert('test', { testId, a: 0 })\n        store.update('test', { testId }, { $inc: { ['a']: 1 } } )\n      Resolver should return [{ testId: 'root', a: 1 }]`, async () => {
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
          a: 0,
        })

        await store.update(
          'test',
          {
            testId,
          },
          {
            $inc: {
              [`a`]: 1,
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

    expect(result).toEqual([{ testId: 'root', a: 1 }])
  })

  test(`Projection\n        store.defineTable({ /* ... */ fields: ['a', 'b'] })\n        store.insert('test', { testId, a: 0, b: 3 })\n        store.update('test', { testId }, { $inc: { ['a']: 1, ['b']: -1 } } )\n      Resolver should return [{ testId: 'root', a: 1, b: 2 }]`, async () => {
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
          a: 0,
          b: 3,
        })

        await store.update(
          'test',
          {
            testId,
          },
          {
            $inc: {
              [`a`]: 1,
              [`b`]: -1,
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

    expect(result).toEqual([{ testId: 'root', a: 1, b: 2 }])
  })

  test(`Projection\n        store.defineTable({ /* ... */ fields: ['a'] })\n        store.insert('test', { testId, a: undefined })\n        store.update('test', { testId }, { $inc: { ['a']: 1 } } )\n      Resolver should throw error`, async () => {
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
          a: undefined,
        })

        await store.update(
          'test',
          {
            testId,
          },
          {
            $inc: {
              [`a`]: 1,
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

  test(`Projection\n        store.defineTable({ /* ... */ fields: ['a'] })\n        store.insert('test', { testId, a: null })\n        store.update('test', { testId }, { $inc: { ['a']: 1 } } )\n      Resolver should throw error`, async () => {
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
            $inc: {
              [`a`]: 1,
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

  test(`Projection\n        store.defineTable({ /* ... */ fields: ['a'] })\n        store.insert('test', { testId, a: { b: 0 } })\n        store.update('test', { testId }, { $inc: { ['a.b']: 1 } } )\n      Resolver should return [{ testId: 'root', a: { b: 1 } }]`, async () => {
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
          a: {
            b: 0,
          },
        })

        await store.update(
          'test',
          {
            testId,
          },
          {
            $inc: {
              [`a.b`]: 1,
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

    expect(result).toEqual([{ testId: 'root', a: { b: 1 } }])
  })

  test(`Projection\n        store.defineTable({ /* ... */ fields: ['a'] })\n        store.insert('test', { testId, a: { b: 0 } })\n        store.update('test', { testId }, { $inc: { ['a.b']: 1, ['a.c']: -1 } } )\n      Resolver should return [{ testId: 'root', a: { b: 1, c: 2 } }]`, async () => {
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
          a: {
            b: 0,
            c: 3,
          },
        })

        await store.update(
          'test',
          {
            testId,
          },
          {
            $inc: {
              [`a.b`]: 1,
              [`a.c`]: -1,
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

    expect(result).toEqual([{ testId: 'root', a: { b: 1, c: 2 } }])
  })

  test(`Projection\n        store.defineTable({ /* ... */ fields: ['a'] })\n        store.insert('test', { testId })\n        store.update('test', { testId }, { $inc: { ['a']: 1 } } )\n      Resolver should throw error`, async () => {
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
            $inc: {
              [`a`]: 1,
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

  test(`Projection\n        store.defineTable({ /* ... */ fields: ['a'] })\n        store.insert('test', { testId })\n        store.update('test', { testId }, { $inc: { ['a.b']: 1 } } )\n      Resolver should throw error`, async () => {
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
            $inc: {
              [`a.b`]: 1,
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

  test(`Projection\n        store.defineTable({ /* ... */ fields: ['a'] })\n        store.insert('test', { testId, a: {} })\n        store.update('test', { testId }, { $inc: { ['a.b']: 1 } } )\n      Resolver should throw error`, async () => {
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
            $inc: {
              [`a.b`]: 1,
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

  test(`Projection\n        store.defineTable({ /* ... */ fields: ['a'] })\n        store.insert('test', { testId, a: {} })\n        store.update('test', { testId }, { $inc: { ['a.b.c']: 1 } } )\n      Resolver should throw error`, async () => {
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
            $inc: {
              [`a.b.c`]: 1,
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
