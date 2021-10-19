import { TestSaga } from '../src/types'
import { stringify } from '../src/utils/format'
import givenEvents from '../src/index'
import { ambiguousEventsTimeErrorMessage } from '../src/constants'
import type { Event } from '@resolve-js/core'

let warnSpy: jest.SpyInstance
let errorSpy: jest.SpyInstance

jest.mock('colors', () => ({
  green: jest.fn((value) => value),
  red: jest.fn((value) => value),
}))

beforeAll(() => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => void 0)
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => void 0)
})

afterAll(() => {
  warnSpy.mockRestore()
  errorSpy.mockRestore()
})

let lastPreservedOrderEvent: Event

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
      await sideEffects.executeQuery({
        modelName: 'model',
        resolverName: 'test',
        resolverArgs: { test: 'test' },
        jwt: 'user',
      })
    },
    CommandQuery: async ({ sideEffects }, { aggregateId }): Promise<any> => {
      //await sideEffects.failure('error')
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
    QuerySideEffect: async ({ sideEffects }, { aggregateId }): Promise<any> => {
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
    MultipleCommands: async ({ sideEffects }): Promise<any> => {
      await sideEffects.executeCommand({
        type: 'commandA',
        aggregateName: 'command-a-aggregate',
        aggregateId: 'command-a-id',
        payload: {
          commandA: true,
        },
      })
      await sideEffects.executeCommand({
        type: 'commandB',
        aggregateName: 'command-b-aggregate',
        aggregateId: 'command-b-id',
        payload: {
          commandB: true,
        },
      })
    },
    MultipleQueries: async ({ sideEffects }): Promise<any> => {
      await sideEffects.executeQuery({
        modelName: 'modelA',
        resolverName: 'model-a-resolver',
        jwt: 'model-a-jwt',
        resolverArgs: {
          modelA: true,
        },
      })
      await sideEffects.executeQuery({
        modelName: 'modelB',
        resolverName: 'model-b-resolver',
        jwt: 'model-b-jwt',
        resolverArgs: {
          modelB: true,
        },
      })
    },
    MultipleSideEffects: async ({ sideEffects }): Promise<any> => {
      await sideEffects.email('test', 'email')
      await sideEffects.failure('side effect error')
    },
    PreservedEventOrder: async ({ sideEffects }, event): Promise<void> => {
      if (lastPreservedOrderEvent != null) {
        const {
          aggregateId,
          aggregateVersion,
          timestamp,
          payload: { order },
        } = event
        if (order <= lastPreservedOrderEvent.payload.order) {
          throw Error(
            `Broken event order!\n${JSON.stringify(
              lastPreservedOrderEvent
            )}\n${JSON.stringify(event)}`
          )
        }
        await sideEffects.executeCommand({
          type: 'success',
          aggregateId: 'aggregate-id',
          aggregateName: 'aggregate-name',
          payload: {
            order,
          },
        })
      }
      lastPreservedOrderEvent = event
    },
  },
  sideEffects: {
    failure: async (error) => {
      throw Error(error)
    },
    email: async (subject, to) => void 0,
  },
}

describe('givenEvents tests', () => {
  test('should throw error', async () => {
    await expect(
      givenEvents([
        {
          type: 'Command',
          aggregateId: 'aggregate-id',
        },
        {
          type: 'Command',
          aggregateId: 'aggregate-id',
          timestamp: 20,
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
    ).rejects.toThrow(ambiguousEventsTimeErrorMessage)
  })
})

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

test('shouldExecuteCommand failure output should contain all executed commands', async () => {
  try {
    await givenEvents([
      {
        type: 'MultipleCommands',
        aggregateId: 'aggregate-id',
      },
    ])
      .saga(saga)
      .shouldExecuteCommand({
        type: 'commandC',
        aggregateName: 'command-c-aggregate',
        aggregateId: 'command-c-id',
        payload: {
          commandC: true,
        },
      })
  } catch (e) {
    expect(e.message).toContain(`shouldExecuteCommand assertion failed`)
    expect(e.message).toContain(
      stringify({
        type: 'commandA',
        aggregateName: 'command-a-aggregate',
        aggregateId: 'command-a-id',
        payload: {
          commandA: true,
        },
      })
    )
    expect(e.message).toContain(
      stringify({
        type: 'commandB',
        aggregateName: 'command-b-aggregate',
        aggregateId: 'command-b-id',
        payload: {
          commandB: true,
        },
      })
    )
    expect(e.message).toContain(
      stringify({
        type: 'commandC',
        aggregateName: 'command-c-aggregate',
        aggregateId: 'command-c-id',
        payload: {
          commandC: true,
        },
      })
    )
  }
})

test('shouldExecuteQuery failure output should contain all executed queries', async () => {
  try {
    await givenEvents([
      {
        type: 'MultipleQueries',
        aggregateId: 'aggregate-id',
      },
    ])
      .saga(saga)
      .shouldExecuteQuery({
        modelName: 'modelC',
        resolverName: 'model-c-resolver',
        jwt: 'model-c-jwt',
        resolverArgs: {
          modelC: true,
        },
      })
  } catch (e) {
    expect(e.message).toContain(`shouldExecuteQuery assertion failed`)
    expect(e.message).toContain(
      stringify({
        modelName: 'modelA',
        resolverName: 'model-a-resolver',
        jwt: 'model-a-jwt',
        resolverArgs: {
          modelA: true,
        },
      })
    )
    expect(e.message).toContain(
      stringify({
        modelName: 'modelB',
        resolverName: 'model-b-resolver',
        jwt: 'model-b-jwt',
        resolverArgs: {
          modelB: true,
        },
      })
    )
    expect(e.message).toContain(
      stringify({
        modelName: 'modelC',
        resolverName: 'model-c-resolver',
        jwt: 'model-c-jwt',
        resolverArgs: {
          modelC: true,
        },
      })
    )
  }
})

test('shouldExecuteSideEffect failure output should contain all executed side effects', async () => {
  try {
    await givenEvents([
      {
        type: 'MultipleSideEffects',
        aggregateId: 'aggregate-id',
      },
    ])
      .saga(saga)
      .shouldExecuteSideEffect('non-existent-side-effect', 'a', 'b')
  } catch (e) {
    expect(e.message).toContain(`shouldExecuteSideEffect assertion failed`)
    expect(e.message).toContain(
      stringify(['non-existent-side-effect', 'a', 'b'])
    )
    expect(e.message).toContain(stringify(['email', 'test', 'email']))
    expect(e.message).toContain(stringify(['failure', 'side effect error']))
  }
})

test('using mockCommandImplementation', async () => {
  const mockedCommand = jest.fn()
  const expectedCommand = {
    type: 'create',
    aggregateName: 'user',
    aggregateId: 'id',
    payload: {
      item: 'aggregate-id',
    },
  }
  await givenEvents([
    {
      type: 'Command',
      aggregateId: 'aggregate-id',
    },
  ])
    .saga(saga)
    .mockCommandImplementation('user', 'create', mockedCommand)
    .shouldExecuteCommand(expectedCommand)

  expect(mockedCommand).toHaveBeenCalledWith(expectedCommand)
})

test('using mockCommandImplementation should throw unhandled exceptions', async () => {
  const error = Error('command failure')
  const mockedCommand = jest.fn(() => {
    throw error
  })
  const expectedCommand = {
    type: 'create',
    aggregateName: 'user',
    aggregateId: 'id',
    payload: {
      item: 'aggregate-id',
    },
  }
  await expect(
    givenEvents([
      {
        type: 'Command',
        aggregateId: 'aggregate-id',
      },
    ])
      .saga(saga)
      .mockCommandImplementation('user', 'create', mockedCommand)
  ).rejects.toThrow(error)

  expect(mockedCommand).toHaveBeenCalledWith(expectedCommand)
})

test('using mockQueryImplementation', async () => {
  const mockedQuery = jest.fn()
  const expectedQuery = {
    modelName: 'model',
    resolverName: 'test',
    resolverArgs: {
      test: 'test',
    },
    jwt: 'user',
  }
  await givenEvents([
    {
      type: 'Query',
      aggregateId: 'aggregate-id',
    },
  ])
    .saga(saga)
    .mockQueryImplementation('model', 'test', mockedQuery)
    .shouldExecuteQuery(expectedQuery)

  expect(mockedQuery).toHaveBeenCalledWith(expectedQuery)
})

test('using mockQueryImplementation should throw unhandled exceptions', async () => {
  const error = Error('query failure')
  const mockedQuery = jest.fn(() => {
    throw error
  })
  const expectedQuery = {
    modelName: 'model',
    resolverName: 'test',
    resolverArgs: {
      test: 'test',
    },
    jwt: 'user',
  }
  await expect(
    givenEvents([
      {
        type: 'Query',
        aggregateId: 'aggregate-id',
      },
    ])
      .saga(saga)
      .mockQueryImplementation('model', 'test', mockedQuery)
  ).rejects.toThrow(error)

  expect(mockedQuery).toHaveBeenCalledWith(expectedQuery)
})

test('#2075: sometimes input events order broken with mocked Date.now', async () => {
  const dateMock = jest
    .spyOn(Date, 'now')
    .mockImplementation(() => Date.UTC(2016, 1, 1, 0, 0, 3, 0))

  try {
    const generateEvents = (order: number[]) =>
      order.map((index) => ({
        type: 'PreservedEventOrder',
        aggregateId: index.toString(),
        timestamp: index,
        payload: {
          order: index,
        },
      }))

    await givenEvents(generateEvents([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]))
      .saga(saga)
      .shouldExecuteCommand({
        type: 'success',
        aggregateName: 'aggregate-name',
        aggregateId: 'aggregate-id',
        payload: {
          order: 9,
        },
      })
  } catch (error) {
    dateMock.mockRestore()
    throw error
  }
})
