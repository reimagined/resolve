import {
  result as mockResult,
  connection as mockConnection,
} from 'mysql2/promise'
import createEventstoreAdapter from '../src'

// TODO: rewrite tests
describe.skip('@resolve-js/eventstore-mysql', () => {
  let eventstoreAdapter = null

  beforeEach(() => {
    eventstoreAdapter = createEventstoreAdapter({
      host: 'host',
      port: 'port',
      user: 'user',
      password: 'password',
      database: 'database',
      eventsTableName: 'eventsTableName',
    })
  })

  afterEach(async () => {
    await eventstoreAdapter.dispose()

    mockResult.length = 0

    jest.resetAllMocks()
  })

  test('"saveEvent" should save an event with empty payload', async () => {
    await eventstoreAdapter.saveEvent({
      type: 'eventType',
      aggregateId: 'aggregateId',
      aggregateVersion: 1,
      timestamp: 1,
    })

    expect(mockConnection.query.mock.calls).toMatchSnapshot()

    expect(mockResult).toMatchSnapshot()
  })

  test('"saveEvent" should save an event', async () => {
    await eventstoreAdapter.saveEvent({
      type: 'eventType',
      aggregateId: 'aggregateId',
      aggregateVersion: 1,
      timestamp: 1,
      payload: { index: 1 },
    })

    expect(mockConnection.query.mock.calls).toMatchSnapshot()

    expect(mockResult).toMatchSnapshot()
  })

  test('"loadEvents" should load events', async () => {
    const loadFilters = [
      {},
      { limit: 1 },
      { eventTypes: ['eventType'] },
      { aggregateIds: ['aggregateId'] },
      { startTime: 1, finishTime: 3 },
    ]

    for (const loadFilter of loadFilters) {
      mockConnection.query.mockReturnValueOnce([[], []])

      await eventstoreAdapter.loadEvents(loadFilter, () => {})
    }

    expect(mockConnection.query.mock.calls).toMatchSnapshot()

    expect(mockResult).toMatchSnapshot()
  })

  test('"getLatestEvent" should get the latest event', async () => {
    const loadFilters = [
      {},
      { eventTypes: ['eventType'] },
      { aggregateIds: ['aggregateId'] },
      { startTime: 1, finishTime: 3 },
    ]

    for (const loadFilter of loadFilters) {
      mockConnection.query.mockReturnValueOnce([[], []])

      await eventstoreAdapter.getLatestEvent(loadFilter)
    }

    expect(mockConnection.query.mock.calls).toMatchSnapshot()

    expect(mockResult).toMatchSnapshot()
  })

  test('"export" should return eventStream', async () => {
    mockConnection.query.mockReturnValueOnce([[], []])

    const eventStream = eventstoreAdapter.export()

    eventStream.on('data', (event) => {
      expect(JSON.parse(event)).toHaveProperty('payload')
      expect(JSON.parse(event)).toHaveProperty('aggregateVersion')
    })

    await new Promise((done) => eventStream.on('end', done))

    expect(mockConnection.query.mock.calls).toMatchSnapshot()

    expect(mockResult).toMatchSnapshot()
  })
})
