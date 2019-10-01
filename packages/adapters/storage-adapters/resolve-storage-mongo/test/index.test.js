import { result as mockResult, database as mockDatabase } from 'mongodb'
import createStorageAdapter from '../src/index'

describe('resolve-storage-mongo', () => {
  let storageAdapter = null

  beforeEach(() => {
    storageAdapter = createStorageAdapter({
      collectionName: 'collectionName',
      url: 'url'
    })
  })

  afterEach(async () => {
    await storageAdapter.dispose()

    mockResult.length = 0

    jest.resetAllMocks()
  })

  test('"saveEvent" should save an event with empty payload', async () => {
    const collection = { insertOne: jest.fn() }
    mockDatabase.collection.mockImplementationOnce(async () => collection)
    mockDatabase.collection.mockImplementationOnce((name, _, cb) => cb(name))
    mockDatabase.collection.mockImplementationOnce((name, _, cb) => cb(name))

    await storageAdapter.saveEvent({
      type: 'eventType',
      aggregateId: 'aggregateId',
      aggregateVersion: 1,
      timestamp: 1
    })

    expect(mockDatabase.collection.mock.calls).toMatchSnapshot()
    expect(collection.insertOne.mock.calls).toMatchSnapshot()

    expect(mockResult).toMatchSnapshot()
  })

  test('"saveEvent" should save an event', async () => {
    const collection = { insertOne: jest.fn() }
    mockDatabase.collection.mockImplementationOnce(async () => collection)
    mockDatabase.collection.mockImplementationOnce((name, _, cb) => cb(name))
    mockDatabase.collection.mockImplementationOnce((name, _, cb) => cb(name))

    await storageAdapter.saveEvent({
      type: 'eventType',
      aggregateId: 'aggregateId',
      aggregateVersion: 1,
      timestamp: 1,
      payload: { index: 1 }
    })

    expect(mockDatabase.collection.mock.calls).toMatchSnapshot()
    expect(collection.insertOne.mock.calls).toMatchSnapshot()

    expect(mockResult).toMatchSnapshot()
  })

  test('"loadEvents" should load events', async () => {
    const collection = { find: jest.fn() }
    mockDatabase.collection.mockImplementationOnce(async () => collection)
    mockDatabase.collection.mockImplementationOnce((name, _, cb) => cb(name))

    const cursor = {
      sort: jest.fn().mockImplementation(() => cursor),
      project: jest.fn().mockImplementation(() => cursor),
      stream: jest.fn().mockImplementation(() => cursor),
      next: jest.fn(),
      close: jest.fn()
    }
    collection.find.mockImplementation(() => cursor)

    const loadFilters = [
      {},
      { maxEventsByTimeframe: 1 },
      { eventTypes: ['eventType'] },
      { aggregateIds: ['aggregateId'] },
      { startTime: 1, finishTime: 3 }
    ]

    for (const loadFilter of loadFilters) {
      cursor.next.mockReturnValueOnce({
        type: 'eventType',
        aggregateId: 'aggregateId',
        aggregateVersion: 1,
        timestamp: 1,
        payload: JSON.stringify(loadFilter)
      })

      cursor.next.mockReturnValueOnce(null)

      await storageAdapter.loadEvents(loadFilter, () => {})
    }

    expect(mockDatabase.collection.mock.calls).toMatchSnapshot()
    expect(cursor.sort.mock.calls).toMatchSnapshot()
    expect(cursor.project.mock.calls).toMatchSnapshot()
    expect(cursor.stream.mock.calls).toMatchSnapshot()
    expect(cursor.next.mock.calls).toMatchSnapshot()
    expect(cursor.close.mock.calls).toMatchSnapshot()
    expect(collection.find.mock.calls).toMatchSnapshot()

    expect(mockResult).toMatchSnapshot()
  })

  test('"getLatestEvent" should get the latest event', async () => {
    const collection = { find: jest.fn() }
    mockDatabase.collection.mockImplementationOnce(async () => collection)
    mockDatabase.collection.mockImplementationOnce((name, _, cb) => cb(name))

    const cursor = {
      sort: jest.fn().mockImplementation(() => cursor),
      project: jest.fn().mockImplementation(() => cursor),
      skip: jest.fn().mockImplementation(() => cursor),
      limit: jest.fn().mockImplementation(() => cursor),
      toArray: jest.fn()
    }
    collection.find.mockImplementation(() => cursor)

    const loadFilters = [
      {},
      { eventTypes: ['eventType'] },
      { aggregateIds: ['aggregateId'] },
      { startTime: 1, finishTime: 3 }
    ]

    for (const loadFilter of loadFilters) {
      cursor.toArray.mockReturnValueOnce([
        {
          type: 'eventType',
          aggregateId: 'aggregateId',
          aggregateVersion: 1,
          timestamp: 1,
          payload: JSON.stringify(loadFilter)
        }
      ])

      await storageAdapter.getLatestEvent(loadFilter)
    }

    expect(mockDatabase.collection.mock.calls).toMatchSnapshot()
    expect(cursor.sort.mock.calls).toMatchSnapshot()
    expect(cursor.project.mock.calls).toMatchSnapshot()
    expect(cursor.skip.mock.calls).toMatchSnapshot()
    expect(cursor.limit.mock.calls).toMatchSnapshot()
    expect(cursor.toArray.mock.calls).toMatchSnapshot()
    expect(collection.find.mock.calls).toMatchSnapshot()

    expect(mockResult).toMatchSnapshot()
  })

  test('"export" should return eventStream', async () => {
    const collection = { find: jest.fn() }
    mockDatabase.collection.mockImplementationOnce(async () => collection)
    mockDatabase.collection.mockImplementationOnce((name, _, cb) => cb(name))

    const cursor = {
      sort: jest.fn().mockImplementation(() => cursor),
      project: jest.fn().mockImplementation(() => cursor),
      skip: jest.fn().mockImplementation(() => cursor),
      limit: jest.fn().mockImplementation(() => cursor),
      toArray: jest.fn()
    }
    collection.find.mockImplementation(() => cursor)

    cursor.toArray.mockReturnValue([])

    const eventStream = storageAdapter.export()

    eventStream.on('data', event => {
      expect(JSON.parse(event)).toHaveProperty('payload')
      expect(JSON.parse(event)).toHaveProperty('aggregateVersion')
    })

    await new Promise(done => eventStream.on('end', done))

    expect(mockDatabase.collection.mock.calls).toMatchSnapshot()
    expect(cursor.sort.mock.calls).toMatchSnapshot()
    expect(cursor.project.mock.calls).toMatchSnapshot()
    expect(cursor.skip.mock.calls).toMatchSnapshot()
    expect(cursor.limit.mock.calls).toMatchSnapshot()
    expect(cursor.toArray.mock.calls).toMatchSnapshot()
    expect(collection.find.mock.calls).toMatchSnapshot()

    expect(mockResult).toMatchSnapshot()
  })
})
