import { result as mockResult } from 'aws-sdk/clients/rdsdataservice'
import createStorageAdapter from '../src/index'

describe('resolve-storage-mysql-serverless', () => {
  let storageAdapter = null

  beforeEach(() => {
    storageAdapter = createStorageAdapter({
      awsSecretStoreArn: 'awsSecretStoreArn',
      dbClusterOrInstanceArn: 'dbClusterOrInstanceArn',
      databaseName: 'event-store',
      tableName: 'events',
      region: 'us-east-1',
      skipInit: true
    })
  })

  afterEach(async () => {
    //await storageAdapter.drop()
    await storageAdapter.dispose()
    mockResult.length = 0
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

    expect(mockResult).toMatchSnapshot()
  })

  test('"loadEvents" should load events', async () => {
    await storageAdapter.loadEvents({}, () => {})

    await storageAdapter.loadEvents({ maxEventsByTimeframe: 1 }, () => {})

    await storageAdapter.loadEvents({ eventTypes: ['AAA'] }, () => {})

    await storageAdapter.loadEvents({ aggregateIds: ['id1'] }, () => {})

    await storageAdapter.loadEvents(
      {
        startTime: 1,
        finishTime: 3
      },
      () => {}
    )

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
  })
})
