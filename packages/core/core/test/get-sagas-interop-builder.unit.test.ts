import { SecretsManager } from '../src/types/core'
import { HttpError } from '../src/errors'
import { getSagasInteropBuilder } from '../src/saga/get-sagas-interop-builder'
import { SagaRuntime, SchedulerEventTypes } from '../src/saga/types'
import { SagaMeta, Monitoring } from '../src/types/runtime'
const dummyEncryption = () => Promise.resolve({})

const makeSagaMeta = (params: any): SagaMeta[] => [
  {
    encryption: params.encryption || dummyEncryption,
    name: params.name || 'empty',
    connectorName: params.connectorName || 'empty',
    sideEffects: params.sideEffects || {},
    handlers: params.handlers || {},
  },
]

const secretsManager: SecretsManager = {
  getSecret: jest.fn(),
  setSecret: jest.fn(),
  deleteSecret: jest.fn(),
}

const makeTestRuntime = (): SagaRuntime => {
  const monitoring: Monitoring = {
    error: jest.fn(),
  }
  const scheduler = {
    addEntries: jest.fn(),
    clearEntries: jest.fn(),
    executeEntries: jest.fn(),
  }
  return {
    secretsManager,
    monitoring,
    eventProperties: {},
    executeCommand: jest.fn(),
    executeQuery: jest.fn(),
    scheduler,
    uploader: {},
  }
}

const schedulerEventTypes: SchedulerEventTypes = {
  SCHEDULED_COMMAND_CREATED: 'SCHEDULED_COMMAND_CREATED',
  SCHEDULED_COMMAND_EXECUTED: 'SCHEDULED_COMMAND_EXECUTED',
  SCHEDULED_COMMAND_SUCCEEDED: 'SCHEDULED_COMMAND_SUCCEEDED',
  SCHEDULED_COMMAND_FAILED: 'SCHEDULED_COMMAND_FAILED',
}

describe('Sagas', () => {
  test('saga handlers should be called with correct arguments', async () => {
    const sagaParams = {
      name: 'dummySaga',
      handlers: { Init: jest.fn(), dummyEvent: jest.fn() },
    }

    const sagas = await getSagasInteropBuilder(
      'dummyScheduler',
      schedulerEventTypes,
      makeSagaMeta(sagaParams),
      []
    )(makeTestRuntime())

    const dummyEvent = {
      type: 'dummyEvent',
      payload: { text: 'first' },
      aggregateId: 'validAggregateId',
      aggregateVersion: 1,
      timestamp: 1,
    }

    const dummyStore = {}
    const expectedStoreAndSideEffects = expect.objectContaining({
      sideEffects: {
        scheduleCommand: expect.any(Function),
        executeCommand: expect.any(Function),
        executeQuery: expect.any(Function),
        uploader: {},
        secretsManager: {
          getSecret: expect.any(Function),
          setSecret: expect.any(Function),
          deleteSecret: expect.any(Function),
        },
        isEnabled: true,
      },
      store: dummyStore,
    })

    const initHandler = await sagas.dummySaga.acquireInitHandler(dummyStore)
    initHandler && (await initHandler())
    expect(sagaParams.handlers.Init).toBeCalledWith(expectedStoreAndSideEffects)

    const eventHandler = await sagas.dummySaga.acquireEventHandler(
      dummyStore,
      dummyEvent
    )
    eventHandler && (await eventHandler())
    expect(sagaParams.handlers.dummyEvent).toBeCalledWith(
      expectedStoreAndSideEffects,
      dummyEvent
    )
  })

  test('acquiring resolver should throw error', async () => {
    const sagaParams = {
      name: 'dummySaga',
      handlers: { Init: jest.fn(), dummyEvent: jest.fn() },
    }

    const { dummySaga } = await getSagasInteropBuilder(
      'dummyScheduler',
      schedulerEventTypes,
      makeSagaMeta(sagaParams),
      []
    )(makeTestRuntime())
    try {
      dummySaga.acquireResolver('someResolver', null, {})
      fail('acquireResolver should throw error')
    } catch (error) {
      expect(error).toEqual(expect.any(HttpError))
    }
  })

  test('side effects should be passed to event handlers', async () => {
    const sagaParams = {
      name: 'dummySaga',
      handlers: {
        dummyEvent: ({ sideEffects }: { sideEffects: any }, event: any) => {
          sideEffects.dummySideEffect(event)
        },
      },
      sideEffects: { dummySideEffect: jest.fn() },
    }

    const sagas = await getSagasInteropBuilder(
      'dummyScheduler',
      schedulerEventTypes,
      makeSagaMeta(sagaParams),
      []
    )(makeTestRuntime())

    const dummyEvent = {
      type: 'dummyEvent',
      payload: { text: 'first' },
      aggregateId: 'validAggregateId',
      aggregateVersion: 1,
      timestamp: 1,
    }

    const dummyStore = {}

    const eventHandler = await sagas.dummySaga.acquireEventHandler(
      dummyStore,
      dummyEvent
    )
    eventHandler && (await eventHandler())
    expect(sagaParams.sideEffects.dummySideEffect).toHaveBeenCalledTimes(1)
    expect(sagaParams.sideEffects.dummySideEffect).toBeCalledWith(
      dummyEvent,
      {}
    )
  })

  test('scheduler saga should be initialized correctly', async () => {
    const sagaParams = {
      name: 'dummySaga',
      handlers: { Init: jest.fn(), dummyEvent: jest.fn() },
    }

    const customSchedulerEventTypes: SchedulerEventTypes = {
      SCHEDULED_COMMAND_CREATED: 'scheduled',
      SCHEDULED_COMMAND_EXECUTED: 'executed',
      SCHEDULED_COMMAND_SUCCEEDED: 'succeeded',
      SCHEDULED_COMMAND_FAILED: 'failed',
    }

    const sagas = await getSagasInteropBuilder(
      'dummyScheduler',
      customSchedulerEventTypes,
      makeSagaMeta(sagaParams),
      [{ name: 'dummyScheduler', connectorName: 'dummySchedulerConnector' }]
    )(makeTestRuntime())

    expect(sagas).toEqual(
      expect.objectContaining({
        dummySaga: expect.any(Object),
        dummyScheduler: expect.any(Object),
      })
    )
    const { dummyScheduler: schedulerSagaInterop } = sagas
    expect(schedulerSagaInterop.name).toEqual('dummyScheduler')
    expect(schedulerSagaInterop.connectorName).toEqual(
      'dummySchedulerConnector'
    )
    const dummyStore = {
      insert: jest.fn(),
    }
    const eventHandler = await schedulerSagaInterop.acquireEventHandler(
      dummyStore,
      {
        type: 'scheduled',
        payload: { date: new Date(0), command: 'someCommand' },
        aggregateId: 'validAggregateId',
        aggregateVersion: 1,
        timestamp: 1,
      }
    )
    expect(eventHandler).not.toBeNull()
    eventHandler && (await eventHandler())
    expect(dummyStore.insert).toHaveBeenCalledWith('dummyScheduler', {
      command: 'someCommand',
      date: 0,
      taskId: 'validAggregateId',
    })
  })
})
