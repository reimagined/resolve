import { result as mockResult } from 'aws-sdk/clients/rdsdataservice'
import createEventstoreAdapter from '../src/index'

describe('resolve-eventstore-postgres-serverless index', () => {
  let eventstoreAdapter = null

  beforeEach(() => {
    eventstoreAdapter = createEventstoreAdapter({
      awsSecretStoreArn: 'awsSecretStoreArn',
      dbClusterOrInstanceArn: 'dbClusterOrInstanceArn',
      databaseName: 'event-store',
      tableName: 'events',
      region: 'us-east-1'
    })
  })

  afterEach(async () => {
    await eventstoreAdapter.dispose()
    mockResult.length = 0
  })

  test('"saveEvent" should save an event with empty payload', async () => {
    await eventstoreAdapter.saveEvent({
      type: 'AAA',
      aggregateId: 'id1',
      aggregateVersion: 1,
      timestamp: 1
    })

    let events = []
    await eventstoreAdapter.loadEvents({}, event => {
      events.push(event)
    })

    expect(mockResult).toMatchSnapshot()
  })

  test('"saveEvent" should save an event', async () => {
    await eventstoreAdapter.saveEvent({
      type: 'AAA',
      aggregateId: 'id1',
      aggregateVersion: 1,
      timestamp: 1,
      payload: { index: 1 }
    })

    let events = []
    await eventstoreAdapter.loadEvents({}, event => {
      events.push(event)
    })

    expect(mockResult).toMatchSnapshot()
  })

  test('"loadEvents" should load events', async () => {
    await eventstoreAdapter.loadEvents({}, () => {})

    await eventstoreAdapter.loadEvents({ limit: 1 }, () => {})

    await eventstoreAdapter.loadEvents({ eventTypes: ['AAA'] }, () => {})

    await eventstoreAdapter.loadEvents({ aggregateIds: ['id1'] }, () => {})

    await eventstoreAdapter.loadEvents(
      {
        startTime: 1,
        finishTime: 3
      },
      () => {}
    )

    expect(mockResult).toMatchSnapshot()
  })

  test('"getLatestEvent" should get the latest event', async () => {
    await eventstoreAdapter.getLatestEvent({})

    await eventstoreAdapter.getLatestEvent({ eventTypes: ['AAA'] })

    await eventstoreAdapter.getLatestEvent({ aggregateIds: ['id1'] })

    await eventstoreAdapter.getLatestEvent({
      startTime: 1,
      finishTime: 3
    })

    expect(mockResult).toMatchSnapshot()
  })

  test('"export" should return eventStream', done => {
    const eventStream = eventstoreAdapter.export()

    eventStream.on('data', event => {
      expect(JSON.parse(event)).toHaveProperty('payload')
      expect(JSON.parse(event)).toHaveProperty('aggregateVersion')
    })

    eventStream.on('end', () => {
      done()
    })
  })
})
