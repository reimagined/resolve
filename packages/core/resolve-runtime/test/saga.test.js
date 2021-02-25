import createSagaExecutor from '../src/common/saga/index'

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

  const executeCommand = jest.fn()
  const executeQuery = jest.fn()

  const eventHandler = jest.fn()

  const domainInterop = {
    sagaDomain: {
      acquireSagasInterop: () => ({
        'test-saga': {
          name: 'test-saga',
          connectorName: 'default-connector',
          acquireResolver: () => Promise.resolve(null),
          acquireInitHandler: () => jest.fn(),
          acquireEventHandler: (store, event) => {
            switch (event.type) {
              case 'EVENT_TYPE':
                return eventHandler
              default:
                return null
            }
          },
        },
      }),
    },
  }

  const onCommandExecuted = jest.fn().mockImplementation(async () => {})
  const getVacantTimeInMillis = () => 0x7fffffff

  const sagaExecutor = createSagaExecutor({
    getVacantTimeInMillis,
    eventstoreAdapter,
    readModelConnectors,
    snapshotAdapter,
    executeCommand,
    executeQuery,
    onCommandExecuted,
    scheduler,
    domainInterop,
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

  await sagaExecutor.drop({ modelName: 'test-saga' })

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

  // TODO applyEventsResult

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
