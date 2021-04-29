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

  test(
    [
      `Projection`,
      `  store.defineTable({ /* ... */ fields: ['a'] })`,
      `  store.insert('test', { testId, a: 0 })`,
      `  store.update('test', { testId }, { $inc: { ['a']: 1 } } )`,
      `Resolver should return [{ testId: 'root', a: 1 }]`,
    ].join('\n'),
    async () => {
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
    }
  )

  test(
    [
      `Projection`,
      `  store.defineTable({ /* ... */ fields: ['a', 'b'] })`,
      `  store.insert('test', { testId, a: 0, b: 3 })`,
      `  store.update('test', { testId }, { $inc: { ['a']: 1, ['b']: -1 } } )`,
      `Resolver should return [{ testId: 'root', a: 1, b: 2 }]`,
    ].join('\n'),
    async () => {
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
    }
  )

  test(
    [
      `Projection`,
      `  store.defineTable({ /* ... */ fields: ['a'] })`,
      `  store.insert('test', { testId, a: undefined })`,
      `  store.update('test', { testId }, { $inc: { ['a']: 1 } } )`,
      `Resolver should throw error`,
    ].join('\n'),
    async () => {
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
    }
  )

  test(
    [
      `Projection`,
      `  store.defineTable({ /* ... */ fields: ['a'] })`,
      `  store.insert('test', { testId, a: null })`,
      `  store.update('test', { testId }, { $inc: { ['a']: 1 } } )`,
      `Resolver should throw error`,
    ].join('m'),
    async () => {
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
    }
  )

  test(
    [
      `Projection`,
      `  store.defineTable({ /* ... */ fields: ['a'] })`,
      `  store.insert('test', { testId, a: { b: 0 } })`,
      `  store.update('test', { testId }, { $inc: { ['a.b']: 1 } } )`,
      `Resolver should return [{ testId: 'root', a: { b: 1 } }]`,
    ].join('\n'),
    async () => {
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
    }
  )

  test(
    [
      `Projection`,
      `  store.defineTable({ /* ... */ fields: ['a'] })`,
      `  store.insert('test', { testId, a: { b: 0 } })`,
      `  store.update('test', { testId }, { $inc: { ['a.b']: 1, ['a.c']: -1 } } )`,
      `Resolver should return [{ testId: 'root', a: { b: 1, c: 2 } }]`,
    ].join('\n'),
    async () => {
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
    }
  )

  test(
    [
      `Projection`,
      `  store.defineTable({ /* ... */ fields: ['a'] })`,
      `  store.insert('test', { testId })`,
      `  store.update('test', { testId }, { $inc: { ['a']: 1 } } )`,
      `Resolver should throw error`,
    ].join('\n'),
    async () => {
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
    }
  )

  test(
    [
      `Projection`,
      `  store.defineTable({ /* ... */ fields: ['a'] })`,
      `  store.insert('test', { testId })`,
      `  store.update('test', { testId }, { $inc: { ['a.b']: 1 } } )`,
      `Resolver should throw error`,
    ].join('\n'),
    async () => {
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
    }
  )

  test(
    [
      `Projection`,
      `  store.defineTable({ /* ... */ fields: ['a'] })`,
      `  store.insert('test', { testId, a: {} })`,
      `  store.update('test', { testId }, { $inc: { ['a.b']: 1 } } )`,
      `Resolver should throw error`,
    ].join('\n'),
    async () => {
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
    }
  )

  test(
    [
      `Projection`,
      `  store.defineTable({ /* ... */ fields: ['a'] })`,
      `  store.insert('test', { testId, a: {} })`,
      `  store.update('test', { testId }, { $inc: { ['a.b.c']: 1 } } )`,
      `Resolver should throw error`,
    ].join('\n'),
    async () => {
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
    }
  )
})
