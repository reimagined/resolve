import { result as mockResult, Client as MockClient } from 'pg'
import createStorageAdapter from '../src/index'

describe('resolve-storage-postgres index', () => {
  let storageAdapter = null

  beforeEach(() => {
    storageAdapter = createStorageAdapter({
      user: 'user',
      database: 'database',
      port: 'port',
      host: 'host',
      password: 'password',
      databaseName: 'databaseName',
      tableName: 'tableName'
    })
  })

  afterEach(async () => {
    await storageAdapter.dispose()
    mockResult.length = 0
    jest.clearAllMocks()
  })

  test('"saveEvent" should save an event with empty payload', async () => {
    await storageAdapter.saveEvent({
      type: 'AAA',
      aggregateId: 'id1',
      aggregateVersion: 1,
      timestamp: 1
    })

    let events = []
    await storageAdapter.loadEvents({}, event => {
      events.push(event)
    })

    expect(MockClient.mock).toMatchSnapshot()

    expect(mockResult).toMatchSnapshot()
  })

  test('"saveEvent" should save an event', async () => {
    await storageAdapter.saveEvent({
      type: 'AAA',
      aggregateId: 'id1',
      aggregateVersion: 1,
      timestamp: 1,
      payload: { index: 1 }
    })

    let events = []
    await storageAdapter.loadEvents({}, event => {
      events.push(event)
    })

    expect(MockClient.mock).toMatchSnapshot()

    expect(mockResult).toMatchSnapshot()
  })

  test('"loadEvents" should load events', async () => {
    await storageAdapter.loadEvents({}, () => {})

    await storageAdapter.loadEvents({ limit: 1 }, () => {})

    await storageAdapter.loadEvents({ eventTypes: ['AAA'] }, () => {})

    await storageAdapter.loadEvents({ aggregateIds: ['id1'] }, () => {})

    await storageAdapter.loadEvents(
      {
        startTime: 1,
        finishTime: 3
      },
      () => {}
    )

    expect(MockClient.mock).toMatchSnapshot()

    expect(mockResult).toMatchSnapshot()
  })

  test('"getLatestEvent" should get the latest event', async () => {
    await storageAdapter.getLatestEvent({})

    await storageAdapter.getLatestEvent({ eventTypes: ['AAA'] })

    await storageAdapter.getLatestEvent({ aggregateIds: ['id1'] })

    await storageAdapter.getLatestEvent({
      startTime: 1,
      finishTime: 3
    })

    expect(MockClient.mock).toMatchSnapshot()

    expect(mockResult).toMatchSnapshot()
  })

  test('"export" should return eventStream', done => {
    const eventStream = storageAdapter.export()

    eventStream.on('data', event => {
      expect(JSON.parse(event)).toHaveProperty('payload')
      expect(JSON.parse(event)).toHaveProperty('aggregateVersion')
    })

    eventStream.on('end', () => {
      done()
    })

    expect(MockClient.mock).toMatchSnapshot()
  })
})
