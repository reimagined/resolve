import givenEvents, { BDDAggregate } from '../src/index'
import createReadModelConnector from '@resolve-js/readmodel-lite'
import { Event, EventHandlerEncryptionContext } from '@resolve-js/core'

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

describe('read model', () => {
  test('basic flow', async () => {
    const result = await givenEvents([
      { aggregateId: 'id1', type: 'TEST1' },
      { aggregateId: 'id2', type: 'TEST2' },
      { aggregateId: 'id3', type: 'TEST3' },
    ])
      .readModel({
        name: 'readModelName',
        projection: {
          Init: async (store: any): Promise<any> => {
            await store.defineTable('items', {
              indexes: { id: 'string' },
              fields: [],
            })
          },
          TEST1: async (store: any): Promise<any> => {
            await store.insert('items', { id: 1 })
          },
          TEST2: async (store: any): Promise<any> => {
            await store.insert('items', { id: 2 })
          },
          TEST3: async (store: any): Promise<any> => {
            await store.insert('items', { id: 3 })
          },
        },
        resolvers: {
          all: async (store: any, args: any, context: any): Promise<any> => {
            return {
              items: await store.find('items', {}, { id: 1 }, { id: 1 }),
              args,
              context,
            }
          },
        },
        adapter: await createReadModelConnector({
          databaseFile: ':memory:',
        }),
      })
      .all({ a: 10, b: 20 })
      .as('JWT_TOKEN')

    expect(result).toEqual({
      items: [{ id: 1 }, { id: 2 }, { id: 3 }],
      args: { a: 10, b: 20 },
      context: {
        jwt: 'JWT_TOKEN',
        secretsManager: {
          getSecret: expect.any(Function),
          setSecret: expect.any(Function),
          deleteSecret: expect.any(Function),
        },
      },
    })
  })

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
        adapter: await createReadModelConnector({
          databaseFile: ':memory:',
        }),
        encryption: async () => ({
          decrypt: decryptMock,
          encrypt: jest.fn(),
        }),
      })
      .all({})
      .as('JWT_TOKEN')

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
          adapter: createReadModelConnector({
            databaseFile: ':memory:',
          }),
        })
        .all({})
        .as('JWT_TOKEN')

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
            all: async (store: any, args: any, context: any): Promise<any> => {
              return 'OK'
            },
          },
          adapter: createReadModelConnector({
            databaseFile: ':memory:',
          }),
        })
        .all({})
        .as('JWT_TOKEN')

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
        encryption: async (event, { secretsManager }) => {
          try {
            await secretsManager.setSecret('id', 'secret')
            await secretsManager.getSecret('id')
            await secretsManager.deleteSecret('id')
          } catch (error) {
            encryptionError = error
          }

          return {}
        },
        resolvers: {
          all: async (): Promise<any> => Promise.resolve({}),
        },
        adapter: createReadModelConnector({
          databaseFile: ':memory:',
        }),
      })
      .all()
      .as('jwt')

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
      .setSecretsManager(secretsManager)
      .readModel({
        name: 'readModelName',
        projection: {
          PUSH: async (): Promise<any> => Promise.resolve(null),
        },
        encryption: async (
          event: Event,
          { secretsManager }: EventHandlerEncryptionContext
        ) => {
          await secretsManager.setSecret('id', 'secret')
          await secretsManager.getSecret('id')
          await secretsManager.deleteSecret('id')

          return {}
        },
        resolvers: {
          all: async (): Promise<any> => Promise.resolve({}),
        },
        adapter: createReadModelConnector({
          databaseFile: ':memory:',
        }),
      })
      .all()
      .as('jwt')

    expect(secretsManager.getSecret).toHaveBeenCalledWith('id')
    expect(secretsManager.setSecret).toHaveBeenCalledWith('id', 'secret')
    expect(secretsManager.deleteSecret).toHaveBeenCalledWith('id')
  })
})

describe('aggregate', () => {
  type AggregateState = {
    exist: boolean
    id?: string
  }
  const aggregate: BDDAggregate = {
    name: 'user',
    projection: {
      Init: (): AggregateState => ({
        exist: false,
      }),
      TEST_COMMAND_EXECUTED: (
        state: AggregateState,
        event: Event
      ): AggregateState => ({
        ...state,
        exist: true,
        id: event.aggregateId,
      }),
    },
    commands: {
      create: (state: AggregateState, command, context): any => {
        if (context.jwt !== 'valid-user') {
          throw Error('unauthorized user')
        }
        if (state.exist) {
          throw Error('aggregate already exist')
        }
        return {
          type: 'TEST_COMMAND_EXECUTED',
          payload: {},
        }
      },
      failWithCustomId: (state: AggregateState, command): any => {
        if (state.exist) {
          throw Error(`aggregate ${state.id} already exist`)
        }
        throw Error(`aggregate ${command.aggregateId} failure`)
      },
      noPayload: (): any => ({
        type: 'EVENT_WITHOUT_PAYLOAD',
      }),
    },
  }

  describe('native Jest assertions', () => {
    test('expecting success command execution', async () => {
      await expect(
        givenEvents([])
          .aggregate(aggregate)
          .command('create', {})
          .as('valid-user')
      ).resolves.toEqual({
        type: 'TEST_COMMAND_EXECUTED',
        payload: {},
      })
    })

    test('expecting business logic break', async () => {
      await expect(
        givenEvents([
          {
            type: 'TEST_COMMAND_EXECUTED',
            payload: {},
          },
        ])
          .aggregate(aggregate)
          .command('create', {})
          .as('valid-user')
      ).rejects.toThrow(`aggregate already exist`)
    })

    test('unauthorized user', async () => {
      await expect(
        givenEvents([])
          .aggregate(aggregate)
          .command('create', {})
          .as('invalid-user')
      ).rejects.toThrow(`unauthorized user`)
    })

    test('custom aggregate id within command', async () => {
      await expect(
        givenEvents([])
          .aggregate(aggregate, 'custom-id')
          .command('failWithCustomId', {})
          .as('valid-user')
      ).rejects.toThrow('aggregate custom-id failure')
    })

    test('custom aggregate id within given events', async () => {
      await expect(
        givenEvents([
          {
            type: 'TEST_COMMAND_EXECUTED',
            payload: {},
          },
        ])
          .aggregate(aggregate, 'custom-id')
          .command('failWithCustomId', {})
          .as('valid-user')
      ).rejects.toThrow(`aggregate custom-id already exist`)
    })

    test('events without payload support', async () => {
      await expect(
        givenEvents([])
          .aggregate(aggregate)
          .command('noPayload')
          .as('valid-user')
      ).resolves.toEqual({
        type: 'EVENT_WITHOUT_PAYLOAD',
      })
    })
  })

  describe('with BDD assertions', () => {
    test('expecting success command execution', () =>
      givenEvents([])
        .aggregate(aggregate)
        .command('create', {})
        .as('valid-user')
        .shouldProduceEvent({
          type: 'TEST_COMMAND_EXECUTED',
          payload: {},
        }))

    test('bug: promise not resolved in node version 12', async () => {
      jest.setTimeout(3000000)
      try {
        await givenEvents([])
          .aggregate(aggregate)
          .command('create', {})
          .as('valid-user')
          .shouldProduceEvent({
            type: 'ANOTHER_EVENT',
            payload: {},
          })
      } catch {}
    })

    test('expecting business logic break', () =>
      givenEvents([
        {
          type: 'TEST_COMMAND_EXECUTED',
          payload: {},
        },
      ])
        .aggregate(aggregate)
        .command('create', {})
        .as('valid-user')
        .shouldThrow(Error(`aggregate already exist`)))

    test('unauthorized user', () =>
      givenEvents([])
        .aggregate(aggregate)
        .command('create', {})
        .as('invalid-user')
        .shouldThrow(Error(`unauthorized user`)))

    test('custom aggregate id within command', () =>
      givenEvents([])
        .aggregate(aggregate, 'custom-id')
        .command('failWithCustomId', {})
        .as('valid-user')
        .shouldThrow(Error(`aggregate custom-id failure`)))

    test('custom aggregate id within given events', () =>
      givenEvents([
        {
          type: 'TEST_COMMAND_EXECUTED',
          payload: {},
        },
      ])
        .aggregate(aggregate, 'custom-id')
        .command('failWithCustomId', {})
        .as('valid-user')
        .shouldThrow(Error(`aggregate custom-id already exist`)))

    // FIXME: something wrong with resolve-command, fix after its relocation
    test.skip('events without payload support', () =>
      givenEvents([])
        .aggregate(aggregate)
        .command('noPayload')
        .as('valid-user')
        .shouldProduceEvent({
          type: 'EVENT_WITHOUT_PAYLOAD',
        }))
  })
})
