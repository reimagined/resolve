import createSagaExecutor, {
  schedulerName,
  schedulerEventTypes,
} from '../src/index'

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'guid'),
}))

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
  const eventstoreAdapter = {
    loadEvents: jest.fn().mockReturnValue({ events: [], cursor: null }),
    getSecretsManager: jest.fn(),
  }

  const readModelStore = {
    defineTable: jest.fn(),
    find: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  }

  const readModelConnectors = {
    'default-connector': {
      connect: jest.fn().mockReturnValue(readModelStore),
      disconnect: jest.fn(),
      drop: jest.fn(),
    },
  }

  const snapshotAdapter = {
    loadSnapshot: jest.fn(),
    saveSnapshot: jest.fn(),
  }

  const scheduler = {
    addEntries: jest.fn(),
    clearEntries: jest.fn(),
  }

  const performAcknowledge = jest
    .fn()
    .mockImplementation(async ({ event }) => event)

  const executeCommand = jest.fn()
  const executeQuery = jest.fn()

  const eventHandler = jest.fn().mockImplementation(async ({ sideEffects }) => {
    await sideEffects.scheduleCommand(100500, {
      type: 'scheduledCommand',
      aggregateName: 'Test',
      aggregateId: 'scheduledId',
      payload: 'scheduledCommand',
    })

    await sideEffects.executeCommand({
      type: 'executedCommand',
      aggregateName: 'Test',
      aggregateId: 'executedId',
      payload: 'executedCommand',
    })

    await sideEffects.executeQuery({
      modelName: 'modelName',
      resolverName: 'resolverName',
      resolverArgs: {
        arg: 'value',
      },
    })
  })

  const sagas = [
    {
      name: 'test-saga',
      connectorName: 'default-connector',
      handlers: {
        EVENT_TYPE: eventHandler,
        Init: jest.fn(),
      },
      invariantHash: 'invariantHash',
      encryption: jest.fn(() => ({})),
    },
  ]

  const onCommandExecuted = jest.fn().mockImplementation(async () => {})
  const getVacantTimeInMillis = () => 0x7fffffff

  const sagaExecutor = createSagaExecutor({
    getVacantTimeInMillis,
    eventstoreAdapter,
    readModelConnectors,
    snapshotAdapter,
    executeCommand,
    executeQuery,
    sagas,
    performAcknowledge,
    onCommandExecuted,
    scheduler,
  })

  const properties = {
    RESOLVE_SIDE_EFFECTS_START_TIMESTAMP: 0,
    'test-property': 'content',
  }

  await sagaExecutor.sendEvents({
    modelName: 'test-saga',
    events: [{ type: 'Init' }],
    getVacantTimeInMillis: () => remainingTime,
    properties,
  })

  await sagaExecutor.sendEvents({
    modelName: 'test-saga',
    events: [
      {
        type: 'EVENT_TYPE',
        aggregateId: 'aggregateId',
        aggregateVersion: 1,
        timestamp: 100,
        payload: { content: true },
      },
    ],
    getVacantTimeInMillis: () => remainingTime,
    properties,
  })

  const schedulerModelName = `${schedulerName}default-connector`
  await sagaExecutor.sendEvents({
    modelName: schedulerModelName,
    events: [{ type: 'Init' }],
    getVacantTimeInMillis: () => remainingTime,
    properties,
  })

  await sagaExecutor.sendEvents({
    modelName: schedulerModelName,
    events: [
      {
        type: schedulerEventTypes.SCHEDULED_COMMAND_CREATED,
        aggregateId: 'guid',
        payload: {
          date: 100500,
          command: {
            aggregateName: 'Test',
            aggregateId: 'scheduledId',
            type: 'scheduledCommand',
            payload: 'scheduledCommand',
          },
        },
      },
      {
        type: schedulerEventTypes.SCHEDULED_COMMAND_EXECUTED,
        aggregateId: 'guid',
        payload: {
          aggregateName: 'Test',
          aggregateId: 'scheduledId',
          type: 'scheduledCommand',
          payload: 'scheduledCommand',
        },
      },
      {
        type: schedulerEventTypes.SCHEDULED_COMMAND_SUCCEEDED,
      },
      {
        type: schedulerEventTypes.SCHEDULED_COMMAND_FAILED,
      },
    ],
    getVacantTimeInMillis: () => remainingTime,
    properties,
  })

  await sagaExecutor.drop({ modelName: 'test-saga' })

  await sagaExecutor.drop({ modelName: schedulerModelName })

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

  expect(eventstoreAdapter.loadEvents.mock.calls).toMatchSnapshot(
    'eventstoreAdapter.loadEvents'
  )
  expect(performAcknowledge.mock.calls).toMatchSnapshot('performAcknowledge')

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

  expect(scheduler.addEntries.mock.calls).toMatchSnapshot(
    'scheduler.addEntries'
  )
  expect(scheduler.clearEntries.mock.calls).toMatchSnapshot(
    'scheduler.clearEntries'
  )
})
