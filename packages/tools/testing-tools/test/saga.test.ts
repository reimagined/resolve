import { TestSaga } from '../src/types'
import givenEvents from '../src/index'

let warnSpy: jest.SpyInstance
let errorSpy: jest.SpyInstance

beforeAll(() => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => void 0)
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => void 0)
})

afterAll(() => {
  warnSpy.mockRestore()
  errorSpy.mockRestore()
})

describe('basic tests', () => {
  const saga: TestSaga<{
    failure: (error: string) => Promise<void>
    email: (subject: string, to: string) => Promise<void>
  }> = {
    name: 'TEST-SAGA',
    handlers: {
      Failure: async ({ sideEffects }): Promise<any> => {
        await sideEffects.failure('error')
      },
      Command: async ({ sideEffects }, { aggregateId }): Promise<any> => {
        await sideEffects.failure('error')
        await sideEffects.executeCommand({
          type: 'create',
          aggregateName: 'user',
          aggregateId: 'id',
          payload: {
            item: aggregateId,
          },
        })
      },
      Query: async ({ sideEffects }, { aggregateId }): Promise<any> => {
        await sideEffects.failure('error')
        await sideEffects.executeQuery({
          modelName: 'model',
          resolverName: 'test',
          resolverArgs: { test: 'test' },
          jwt: 'user',
        })
      },
      CommandQuery: async ({ sideEffects }, { aggregateId }): Promise<any> => {
        await sideEffects.failure('error')
        await sideEffects.executeCommand({
          type: 'create',
          aggregateName: 'user',
          aggregateId: 'id',
          payload: {
            item: aggregateId,
          },
        })
        await sideEffects.executeQuery({
          modelName: 'model',
          resolverName: 'test',
          resolverArgs: { test: 'test' },
          jwt: 'user',
        })
      },
      SideEffect: async ({ sideEffects }, { aggregateId }): Promise<any> => {
        await sideEffects.email('test', aggregateId)
      },
      CommandSideEffect: async (
        { sideEffects },
        { aggregateId }
      ): Promise<any> => {
        await sideEffects.executeCommand({
          type: 'create',
          aggregateName: 'user',
          aggregateId: 'id',
          payload: {
            item: aggregateId,
          },
        })
        await sideEffects.email('test', aggregateId)
      },
      QuerySideEffect: async (
        { sideEffects },
        { aggregateId }
      ): Promise<any> => {
        await sideEffects.email('test', aggregateId)
        await sideEffects.executeQuery({
          modelName: 'model',
          resolverName: 'test',
          resolverArgs: { test: 'test' },
          jwt: 'user',
        })
      },
      CommandQuerySideEffect: async (
        { sideEffects },
        { aggregateId }
      ): Promise<any> => {
        await sideEffects.email('test', aggregateId)
        await sideEffects.executeCommand({
          type: 'create',
          aggregateName: 'user',
          aggregateId: 'id',
          payload: {
            item: aggregateId,
          },
        })
        await sideEffects.executeQuery({
          modelName: 'model',
          resolverName: 'test',
          resolverArgs: { test: 'test' },
          jwt: 'user',
        })
      },
    },
    sideEffects: {
      failure: async (error) => {
        throw Error(error)
      },
      email: async (subject, to) => void 0,
    },
  }

  test('side effects mocked by default', async () => {
    const result = await givenEvents([
      {
        type: 'Failure',
        aggregateId: 'aggregate-id',
      },
    ]).saga(saga)
    expect(result.sideEffects).toContainEqual(['failure', 'error'])
  })

  test('allow side effects', async () => {
    await expect(
      givenEvents([
        {
          type: 'Failure',
          aggregateId: 'aggregate-id',
        },
      ])
        .saga(saga)
        .allowSideEffects()
    ).rejects.toThrowError('error')
  })

  test('shouldExecuteCommand assertion', async () => {
    await givenEvents([
      {
        type: 'Command',
        aggregateId: 'aggregate-id',
      },
    ])
      .saga(saga)
      .shouldExecuteCommand({
        type: 'create',
        aggregateName: 'user',
        aggregateId: 'id',
        payload: {
          item: 'aggregate-id',
        },
      })
  })

  test('shouldExecuteQuery assertion', async () => {
    await givenEvents([
      {
        type: 'Query',
        aggregateId: 'aggregate-id',
      },
    ])
      .saga(saga)
      .shouldExecuteQuery({
        modelName: 'model',
        resolverName: 'test',
        resolverArgs: { test: 'test' },
        jwt: 'user',
      })
  })

  test('shouldExecuteCommand & shouldExecuteQuery simultaneously', async () => {
    await givenEvents([
      {
        type: 'CommandQuery',
        aggregateId: 'aggregate-id',
      },
    ])
      .saga(saga)
      .shouldExecuteCommand({
        type: 'create',
        aggregateName: 'user',
        aggregateId: 'id',
        payload: {
          item: 'aggregate-id',
        },
      })
      .shouldExecuteQuery({
        modelName: 'model',
        resolverName: 'test',
        resolverArgs: { test: 'test' },
        jwt: 'user',
      })
  })

  test('shouldExecuteSideEffect', async () => {
    await givenEvents([
      {
        type: 'SideEffect',
        aggregateId: 'aggregate-id',
      },
    ])
      .saga(saga)
      .shouldExecuteSideEffect('email', 'test', 'aggregate-id')
  })

  test('shouldExecuteSideEffect & shouldExecuteCommand', async () => {
    await givenEvents([
      {
        type: 'CommandSideEffect',
        aggregateId: 'aggregate-id',
      },
    ])
      .saga(saga)
      .shouldExecuteSideEffect('email', 'test', 'aggregate-id')
      .shouldExecuteCommand({
        type: 'create',
        aggregateName: 'user',
        aggregateId: 'id',
        payload: {
          item: 'aggregate-id',
        },
      })
  })

  test('shouldExecuteSideEffect & shouldExecuteQuery', async () => {
    await givenEvents([
      {
        type: 'QuerySideEffect',
        aggregateId: 'aggregate-id',
      },
    ])
      .saga(saga)
      .shouldExecuteSideEffect('email', 'test', 'aggregate-id')
      .shouldExecuteQuery({
        modelName: 'model',
        resolverName: 'test',
        resolverArgs: { test: 'test' },
        jwt: 'user',
      })
  })

  test('shouldExecuteSideEffect, shouldExecuteCommand & shouldExecuteQuery', async () => {
    await givenEvents([
      {
        type: 'CommandQuerySideEffect',
        aggregateId: 'aggregate-id',
      },
    ])
      .saga(saga)
      .shouldExecuteSideEffect('email', 'test', 'aggregate-id')
      .shouldExecuteCommand({
        type: 'create',
        aggregateName: 'user',
        aggregateId: 'id',
        payload: {
          item: 'aggregate-id',
        },
      })
      .shouldExecuteQuery({
        modelName: 'model',
        resolverName: 'test',
        resolverArgs: { test: 'test' },
        jwt: 'user',
      })
  })
})
