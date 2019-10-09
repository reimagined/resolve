import createEventTypes from '../src/scheduler-event-types'
import createSagaExecutor from '../src/index'

let originalDateNow
beforeAll(() => {
  originalDateNow = Date.now.bind(Date)
  Date.now = () => 100500
})
afterAll(() => {
  Date.now = originalDateNow
})

test('resolve-saga', async () => {
  const remainingTime = 15 * 60 * 1000
  const eventStore = {
    loadEvents: jest.fn(),
    saveEvent: jest.fn()
  }

  const readModelStore = {
    defineTable: jest.fn(),
    find: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn()
  }

  const readModelConnectors = {
    'default-connector': {
      connect: jest.fn().mockReturnValue(readModelStore),
      disconnect: jest.fn(),
      drop: jest.fn()
    }
  }

  const snapshotAdapter = {
    loadSnapshot: jest.fn(),
    saveSnapshot: jest.fn()
  }

  const schedulerAdapterInstance = {
    addEntries: jest.fn(),
    clearEntries: jest.fn()
  }

  const schedulerAdapter = jest.fn().mockReturnValue(schedulerAdapterInstance)

  const executeCommand = jest.fn()
  const executeQuery = jest.fn()

  const eventHandler = jest.fn().mockImplementation(async ({ sideEffects }) => {
    await sideEffects.scheduleCommand(100500, {
      type: 'scheduledCommand',
      aggregateName: 'Test',
      aggregateId: 'scheduledId',
      payload: 'scheduledCommand'
    })

    await sideEffects.executeCommand({
      type: 'executedCommand',
      aggregateName: 'Test',
      aggregateId: 'executedId',
      payload: 'executedCommand'
    })

    await sideEffects.executeQuery({
      modelName: 'modelName',
      resolverName: 'resolverName',
      resolverArgs: {
        arg: 'value'
      }
    })
  })

  const sagas = [
    {
      name: 'test-saga',
      connectorName: 'default-connector',
      schedulerName: 'default-scheduler',
      handlers: {
        EVENT_TYPE: eventHandler,
        Init: jest.fn()
      },
      invariantHash: 'invariantHash'
    }
  ]

  const schedulers = [
    {
      name: 'default-scheduler',
      connectorName: 'default-connector',
      adapter: schedulerAdapter,
      invariantHash: 'invariantHash'
    }
  ]

  const sagaExecutor = createSagaExecutor({
    eventStore,
    readModelConnectors,
    snapshotAdapter,
    executeCommand,
    executeQuery,
    sagas,
    schedulers
  })

  const properties = {
    RESOLVE_SIDE_EFFECTS_START_TIMESTAMP: 0,
    'test-property': 'content'
  }

  await sagaExecutor.updateByEvents(
    'test-saga',
    [
      { type: 'Init' },
      {
        type: 'EVENT_TYPE',
        aggregateId: 'aggregateId',
        aggregateVersion: 1,
        timestamp: 100,
        payload: { content: true }
      }
    ],
    remainingTime,
    properties
  )

  const schedulerEvents = createEventTypes({
    schedulerName: 'default-scheduler'
  })

  await sagaExecutor.updateByEvents(
    'default-scheduler',
    [
      { type: 'Init' },
      {
        type: schedulerEvents.SCHEDULED_COMMAND_CREATED,
        aggregateId: 'guid',
        payload: {
          date: 100500,
          command: {
            aggregateName: 'Test',
            aggregateId: 'scheduledId',
            type: 'scheduledCommand',
            payload: 'scheduledCommand'
          }
        }
      },
      {
        type: schedulerEvents.SCHEDULED_COMMAND_EXECUTED,
        aggregateId: 'guid',
        payload: {
          aggregateName: 'Test',
          aggregateId: 'scheduledId',
          type: 'scheduledCommand',
          payload: 'scheduledCommand'
        }
      },
      {
        type: schedulerEvents.SCHEDULED_COMMAND_SUCCEEDED
      },
      {
        type: schedulerEvents.SCHEDULED_COMMAND_FAILED
      }
    ],
    remainingTime,
    properties
  )

  await sagaExecutor.drop('test-saga')

  await sagaExecutor.drop('default-scheduler')

  await sagaExecutor.dispose()

  expect(eventHandler.mock.calls).toMatchSnapshot('eventHandler')

  expect(executeCommand.mock.calls).toMatchSnapshot('executeCommand')
  expect(executeQuery.mock.calls).toMatchSnapshot('executeQuery')

  expect(readModelStore.defineTable.mock.calls).toMatchSnapshot(
    'readModelStore.defineTable'
  )
  expect(readModelStore.find.mock.calls).toMatchSnapshot('readModelStore.find')
  expect(readModelStore.insert.mock.calls).toMatchSnapshot(
    'readModelStore.insert'
  )
  expect(readModelStore.delete.mock.calls).toMatchSnapshot(
    'readModelStore.delete'
  )

  expect(eventStore.loadEvents.mock.calls).toMatchSnapshot(
    'eventStore.loadEvents'
  )
  expect(eventStore.saveEvent.mock.calls).toMatchSnapshot(
    'eventStore.saveEvent'
  )

  expect(
    readModelConnectors['default-connector'].connect.mock.calls
  ).toMatchSnapshot(`readModelConnectors['default-connector'].connect`)
  expect(
    readModelConnectors['default-connector'].disconnect.mock.calls
  ).toMatchSnapshot(`readModelConnectors['default-connector'].disconnect`)
  expect(
    readModelConnectors['default-connector'].drop.mock.calls
  ).toMatchSnapshot(`readModelConnectors['default-connector'].drop`)

  expect(snapshotAdapter.loadSnapshot.mock.calls).toMatchSnapshot(
    'snapshotAdapter.loadSnapshot'
  )
  expect(snapshotAdapter.saveSnapshot.mock.calls).toMatchSnapshot(
    'snapshotAdapter.saveSnapshot'
  )

  expect(schedulerAdapter.mock.calls).toMatchSnapshot('schedulerAdapter')

  expect(schedulerAdapterInstance.addEntries.mock.calls).toMatchSnapshot(
    'schedulerAdapterInstance.addEntries'
  )
  expect(schedulerAdapterInstance.clearEntries.mock.calls).toMatchSnapshot(
    'schedulerAdapterInstance.clearEntries'
  )
})
