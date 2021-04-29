import givenEvents from '../src/index'
import { Event, EventHandlerEncryptionContext } from '@resolve-js/core'
import { TestReadModel } from '../types/types'

const ProjectionError = (function (this: Error, message: string): void {
  Error.call(this)
  this.name = 'ProjectionError'
  this.message = message
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, ProjectionError)
  } else {
    this.stack = new Error().stack
  }
} as Function) as ErrorConstructor

const ResolverError = (function (this: Error, message: string): void {
  Error.call(this)
  this.name = 'ResolverError'
  this.message = message
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, ResolverError)
  } else {
    this.stack = new Error().stack
  }
} as Function) as ErrorConstructor

let errorSpy: jest.SpyInstance

beforeAll(() => {
  errorSpy = jest.spyOn(console, 'error')
  errorSpy.mockImplementation(void 0)
})

afterAll(() => {
  errorSpy.mockRestore()
})

describe('basic tests', () => {
  const readModel: TestReadModel = {
    name: 'readModelName',
    projection: {
      Init: async (store: any): Promise<any> => {
        await store.defineTable('items', {
          indexes: { id: 'string' },
          fields: ['name'],
        })
      },
      TEST1: async (store: any, { payload: { name } }): Promise<any> => {
        await store.insert('items', { id: 1, name })
      },
      TEST2: async (store: any, { payload: { name } }): Promise<any> => {
        await store.insert('items', { id: 2, name })
      },
      TEST3: async (store: any, { payload: { name } }): Promise<any> => {
        await store.insert('items', { id: 3, name })
      },
    },
    resolvers: {
      all: async (store: any, args: any, context: any): Promise<any> => {
        return {
          items: await store.find('items', {}, { id: 1, name: 1 }, { id: 1 }),
          args,
          context,
        }
      },
      get: async (store: any, { id }): Promise<any> => {
        return await store.findOne('items', { id }, { name: 1 })
      },
    },
  }

  test('valid resolver context', async () => {
    const result = await givenEvents([
      { aggregateId: 'id1', type: 'TEST1', payload: { name: 'test-1' } },
      { aggregateId: 'id2', type: 'TEST2', payload: { name: 'test-2' } },
      { aggregateId: 'id3', type: 'TEST3', payload: { name: 'test-3' } },
    ])
      .readModel(readModel)
      .query('all', { a: 10, b: 20 })
      .as('user')

    expect(result).toEqual({
      items: [
        { id: 1, name: 'test-1' },
        { id: 2, name: 'test-2' },
        { id: 3, name: 'test-3' },
      ],
      args: { a: 10, b: 20 },
      context: {
        jwt: 'user',
        secretsManager: {
          getSecret: expect.any(Function),
          setSecret: expect.any(Function),
          deleteSecret: expect.any(Function),
        },
      },
    })
  })

  test('shouldReturn assertion', async () => {
    await givenEvents([
      { aggregateId: 'id2', type: 'TEST2', payload: { name: 'test-name' } },
    ])
      .readModel(readModel)
      .query('get', { id: 2 })
      .shouldReturn({ name: 'test-name' })
  })

  test('negated shouldReturn assertion', async () => {
    await givenEvents([
      { aggregateId: 'id2', type: 'TEST2', payload: { name: 'test-name-1' } },
    ])
      .readModel(readModel)
      .query('get', { id: 2 })
      .not()
      .shouldReturn({ name: 'test-name' })
  })
})

describe('sequence tests', () => {
  const testId = 'root'

  const readModel: TestReadModel = {
    name: 'readModelSequence',
    projection: {
      Init: async (store: any): Promise<any> => {
        await store.defineTable('sequence', {
          indexes: { id: 'string' },
          fields: ['items'],
        })
        await store.insert('sequence', { id: testId, items: [] })
      },
      TEST: async (store: any, { payload: { item } }): Promise<any> => {
        const { items } = await store.findOne('sequence', {
          id: testId,
        })
        await store.update(
          'sequence',
          { id: testId },
          { $set: { items: [...items, item] } }
        )
      },
    },
    resolvers: {
      all: async (store: any): Promise<any> => {
        return await store.findOne('sequence', { id: testId })
      },
    },
  }

  test('resolver should return ["test-1", "test-2", "test-3"]', async () => {
    const result: any = await givenEvents([
      { aggregateId: 'id1', type: 'TEST', payload: { item: 'test-1' } },
      { aggregateId: 'id2', type: 'TEST', payload: { item: 'test-2' } },
      { aggregateId: 'id3', type: 'TEST', payload: { item: 'test-3' } },
    ])
      .readModel(readModel)
      .query('all', {})

    expect(result?.items).toEqual(['test-1', 'test-2', 'test-3'])
  })
})

describe('advanced', () => {
  test('using encryption', async () => {
    const decryptMock = jest.fn((val: any) => `plain_${val}`)
    const result = await givenEvents([
      { aggregateId: 'id1', type: 'PUSH', payload: { data: 'data' } },
    ])
      .readModel({
        name: 'readModelName',
        projection: {
          Init: async (store: any): Promise<any> => {
            await store.defineTable('items_2', {
              indexes: { id: 'string' },
              fields: ['data'],
            })
          },
          PUSH: async (
            store: any,
            { payload: { data } }: any,
            { decrypt }: any
          ): Promise<any> => {
            await store.insert('items_2', { id: 1, data: decrypt(data) })
          },
        },
        resolvers: {
          all: async (store: any, args: any, context: any): Promise<any> => {
            return await store.find('items_2', { id: 1 })
          },
        },
      })
      .withEncryption(async () => ({
        decrypt: decryptMock,
        encrypt: jest.fn(),
      }))
      .query('all', {})

    expect(result[0]).toEqual({
      id: 1,
      data: `plain_data`,
    })
  })

  test('throwing resolver', async () => {
    try {
      await givenEvents([])
        .readModel({
          name: 'readModelName',
          projection: {
            Init: async (store: any): Promise<any> => {
              void 0
            },
          },
          resolvers: {
            all: async (store: any, args: any, context: any): Promise<any> => {
              throw new ResolverError(`Error from resolver`)
            },
          },
        })
        .query('all', {})

      return Promise.reject('Test failed')
    } catch (error) {
      expect(error).toBeInstanceOf(ResolverError)
      expect(error.message).toEqual('Error from resolver')
    }
  })

  test('throwing projection', async () => {
    try {
      await givenEvents([])
        .readModel({
          name: 'readModelName',
          projection: {
            Init: async (store: any): Promise<any> => {
              throw new ProjectionError('Error from projection')
            },
          },
          resolvers: {
            all: async (): Promise<any> => {
              return 'OK'
            },
          },
        })
        .query('all', {})

      return Promise.reject('Test failed')
    } catch (error) {
      expect(error).toBeInstanceOf(ProjectionError)
      expect(error.message).toEqual('Error from projection')
    }
  })

  test('bug fix: default secrets manager', async () => {
    let encryptionError = null
    await givenEvents([
      { aggregateId: 'id1', type: 'PUSH', payload: { data: 'data' } },
    ])
      .readModel({
        name: 'readModelName',
        projection: {
          PUSH: async (): Promise<any> => Promise.resolve(null),
        },
        resolvers: {
          all: async (): Promise<any> => Promise.resolve({}),
        },
      })
      .withEncryption(async (event, { secretsManager }) => {
        try {
          await secretsManager.setSecret('id', 'secret')
          await secretsManager.getSecret('id')
          await secretsManager.deleteSecret('id')
        } catch (error) {
          encryptionError = error
        }

        return {}
      })
      .query('all')

    expect(encryptionError).toBeNull()
  })

  test('custom secrets manager', async () => {
    const secretsManager = {
      getSecret: jest.fn(),
      setSecret: jest.fn(),
      deleteSecret: jest.fn(),
    }

    await givenEvents([
      { aggregateId: 'id1', type: 'PUSH', payload: { data: 'data' } },
    ])
      .readModel({
        name: 'readModelName',
        projection: {
          PUSH: async (): Promise<any> => Promise.resolve(null),
        },
        resolvers: {
          all: async (): Promise<any> => Promise.resolve({}),
        },
      })
      .withEncryption(
        async (
          event: Event,
          { secretsManager }: EventHandlerEncryptionContext
        ) => {
          await secretsManager.setSecret('id', 'secret')
          await secretsManager.getSecret('id')
          await secretsManager.deleteSecret('id')

          return {}
        }
      )
      .query('all')
      .withSecretsManager(secretsManager)

    expect(secretsManager.getSecret).toHaveBeenCalledWith('id')
    expect(secretsManager.setSecret).toHaveBeenCalledWith('id', 'secret')
    expect(secretsManager.deleteSecret).toHaveBeenCalledWith('id')
  })
})
