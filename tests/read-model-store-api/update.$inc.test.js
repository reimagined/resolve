import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'
import givenEvents from '@resolve-js/testing-tools'

import { jestTimeout, adapters, adapterFactory } from '../readmodel-test-utils'
import resolvers from './resolvers'

jest.setTimeout(jestTimeout())

const testId = 'root'

// eslint-disable-next-line no-console
console.error = () => {}

describe(`${adapterFactory.name}. Read-model Store API. Update. $inc`, () => {
  const events = [
    {
      aggregateId: 'root',
      type: 'TEST',
      payload: {},
    },
  ]

  // beforeAll(adapterFactory.destroy('qqq'))

  beforeEach(adapterFactory.create('qqq'))
  afterEach(adapterFactory.destroy('qqq'))

  const adapter = adapters['qqq']

  test(`Projection\n        store.insert('test', { testId, key: 0 })\n        store.update('test', { testId }, { $inc: { ['key']: 1 } } )\n      Resolver should return [{ testId: 'root', key: 1 }]`, async () => {
    const projection = {
      Init: async (store) => {
        await store.defineTable('test', {
          indexes: { testId: 'string' },
          fields: ['key'],
        })
      },

      TEST: async (store, event) => {
        const { aggregateId: testId } = event

        console.log('insert')
        await store.insert('test', {
          testId,
          key: 0,
        })

        await store.update(
          'test',
          {
            testId,
          },
          {
            $inc: {
              [`key`]: 1,
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
      .query('all', {})

    expect(result).toEqual([{ testId: 'root', key: 1 }])
  })

  test(`Projection\n        store.insert('test', { testId, key: 0 })\n        store.update('test', { testId }, { $inc: { ['obj.a']: 1, ['obj.b']: -1 } } )\n      Resolver should return [{ testId: 'root', a: 1, b: 2 }]`, async () => {
    const projection = {
      Init: async (store) => {
        await store.defineTable('test', {
          indexes: { testId: 'string' },
          fields: ['a', 'b'],
        })
      },

      TEST: async (store, event) => {
        const { aggregateId: testId } = event

        console.log('insert')
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
      .query('all', {})

    expect(result).toEqual([{ testId: 'root', a: 1, b: 2 }])
  })

  test(`Projection\n        store.insert('test', { testId, key: undefined })\n        store.update('test', { testId }, { $inc: { ['key']: 1 } } )\n      Resolver should throw error`, async () => {
    const projection = {
      Init: async (store) => {
        await store.defineTable('test', {
          indexes: { testId: 'string' },
          fields: ['key'],
        })
      },

      TEST: async (store, event) => {
        const { aggregateId: testId } = event

        await store.insert('test', {
          testId,
          key: undefined,
        })

        await store.update(
          'test',
          {
            testId,
          },
          {
            $inc: {
              [`key`]: 1,
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
        .query('all', {})
    ).rejects.toThrow()
  })

  test(`Projection\n        store.insert('test', { testId, key: null })\n        store.update('test', { testId }, { $inc: { ['key']: 1 } } )\n      Resolver should throw error`, async () => {
    const projection = {
      Init: async (store) => {
        await store.defineTable('test', {
          indexes: { testId: 'string' },
          fields: ['key'],
        })
      },

      TEST: async (store, event) => {
        const { aggregateId: testId } = event

        await store.insert('test', {
          testId,
          key: null,
        })

        await store.update(
          'test',
          {
            testId,
          },
          {
            $inc: {
              [`key`]: 1,
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
        .query('all', {})
    ).rejects.toThrow()
  })

  test(`Projection\n        store.insert('test', { testId, obj: { key: 0 } })\n        store.update('test', { testId }, { $inc: { ['obj.key']: 1 } } )\n      Resolver should return [{ testId: 'root', obj: { key: 1 } }]`, async () => {
    const projection = {
      Init: async (store) => {
        await store.defineTable('test', {
          indexes: { testId: 'string' },
          fields: ['obj'],
        })
      },

      TEST: async (store, event) => {
        const { aggregateId: testId } = event

        await store.insert('test', {
          testId,
          obj: {
            key: 0,
          },
        })

        await store.update(
          'test',
          {
            testId,
          },
          {
            $inc: {
              [`obj.key`]: 1,
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
      .query('all', {})

    expect(result).toEqual([{ testId: 'root', obj: { key: 1 } }])
  })

  test(`Projection\n        store.insert('test', { testId, obj: { key: 0 } })\n        store.update('test', { testId }, { $inc: { ['obj.a']: 1, ['obj.b']: -1 } } )\n      Resolver should return [{ testId: 'root', obj: { a: 1, b: 2 } }]`, async () => {
    const projection = {
      Init: async (store) => {
        await store.defineTable('test', {
          indexes: { testId: 'string' },
          fields: ['obj'],
        })
      },

      TEST: async (store, event) => {
        const { aggregateId: testId } = event

        await store.insert('test', {
          testId,
          obj: {
            a: 0,
            b: 3,
          },
        })

        await store.update(
          'test',
          {
            testId,
          },
          {
            $inc: {
              [`obj.a`]: 1,
              [`obj.b`]: -1,
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
      .query('all', {})

    expect(result).toEqual([{ testId: 'root', obj: { a: 1, b: 2 } }])
  })

  test(`Projection\n        store.insert('test', { testId })\n        store.update('test', { testId }, { $inc: { ['key']: 1 } } )\n      Resolver should throw error`, async () => {
    const projection = {
      Init: async (store) => {
        await store.defineTable('test', {
          indexes: { testId: 'string' },
          fields: ['key'],
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
              [`key`]: 1,
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
        .query('all', {})
    ).rejects.toThrow()
  })

  test(`Projection\n        store.insert('test', { testId })\n        store.update('test', { testId }, { $inc: { ['obj.key']: 1 } } )\n      Resolver should throw error`, async () => {
    const projection = {
      Init: async (store) => {
        await store.defineTable('test', {
          indexes: { testId: 'string' },
          fields: ['obj'],
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
              [`obj.key`]: 1,
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
        .query('all', {})
    ).rejects.toThrow()
  })

  test(`Projection\n        store.insert('test', { testId, obj: {} })\n        store.update('test', { testId }, { $inc: { ['obj.key']: 1 } } )\n      Resolver should throw error`, async () => {
    const projection = {
      Init: async (store) => {
        await store.defineTable('test', {
          indexes: { testId: 'string' },
          fields: ['obj'],
        })
      },

      TEST: async (store, event) => {
        const { aggregateId: testId } = event

        await store.insert('test', {
          testId,
          obj: {},
        })

        await store.update(
          'test',
          {
            testId,
          },
          {
            $inc: {
              [`obj.key`]: 1,
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
        .query('all', {})
    ).rejects.toThrow()
  })

  test(`Projection\n        store.insert('test', { testId, deepObj: {} })\n        store.update('test', { testId }, { $inc: { ['deepObj.obj.key']: 1 } } )\n      Resolver should throw error`, async () => {
    const projection = {
      Init: async (store) => {
        await store.defineTable('test', {
          indexes: { testId: 'string' },
          fields: ['deepObj'],
        })
      },

      TEST: async (store) => {
        await store.insert('test', {
          testId,
          deepObj: {},
        })

        await store.update(
          'test',
          {
            testId,
          },
          {
            $inc: {
              [`deepObj.obj.key`]: 1,
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
        .query('all', {})
    ).rejects.toThrow()
  })
})
