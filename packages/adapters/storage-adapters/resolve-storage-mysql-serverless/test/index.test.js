import AWS from 'aws-sdk'
import { ConcurrentError } from 'resolve-storage-base'
import createStorageAdapter from '../src/index'

AWS.config.update({
  credentials: {
    accessKeyId: 'XXXXXXXXXXXXXXX',
    secretAccessKey: 'XXXXXXXXXXXXXXX'
  },
  httpOptions: { timeout: 300000 }
})

jest.setTimeout(20000)

describe('resolve-storage-mysql-serverless', () => {
  let storageAdapter = null

  beforeEach(() => {
    storageAdapter = createStorageAdapter({
      awsSecretStoreArn: 'arn:aws:secretsmanager:us-east-1:XXXXXXXXXXXXXXX',
      dbClusterOrInstanceArn: 'arn:aws:rds:us-east-1:XXXXXXXXXXXXXXX',
      database: 'event-store',
      tableName: 'events',
      region: 'us-east-1'
    })
  })

  afterEach(async () => {
    await storageAdapter.drop()
    await storageAdapter.dispose()
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

    expect(events[0]).toMatchObject({
      type: 'AAA',
      aggregateId: 'id1',
      aggregateVersion: 1,
      timestamp: 1,
      payload: null
    })
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

    expect(events[0]).toMatchObject({
      type: 'AAA',
      aggregateId: 'id1',
      aggregateVersion: 1,
      timestamp: 1,
      payload: { index: 1 }
    })
  })

  test('"saveEvent" should throw a concurrent error', async () => {
    await storageAdapter.saveEvent({
      type: 'AAA',
      aggregateId: 'id1',
      aggregateVersion: 1,
      timestamp: 1,
      payload: { index: 1 }
    })

    try {
      await storageAdapter.saveEvent({
        type: 'AAA',
        aggregateId: 'id1',
        aggregateVersion: 1,
        timestamp: 1,
        payload: { index: 1 }
      })
      return Promise.reject(new Error('Test failed'))
    } catch (error) {
      expect(error).toBeInstanceOf(ConcurrentError)
    }
  })

  test('"saveEvent" should throw an error when a bad event', async () => {
    try {
      await storageAdapter.saveEvent({
        /* BAD_EVENT */
      })
      return Promise.reject(new Error('Test failed'))
    } catch (error) {
      expect(error.code).toEqual('BadRequestException')
    }
  })

  test('"loadEvents" should load events', async () => {
    await storageAdapter.saveEvent({
      type: 'AAA',
      aggregateId: 'id1',
      aggregateVersion: 1,
      timestamp: 1,
      payload: { index: 1 }
    })
    await storageAdapter.saveEvent({
      type: 'CCC',
      aggregateId: 'id3',
      aggregateVersion: 1,
      timestamp: 1,
      payload: { index: 2 }
    })
    await storageAdapter.saveEvent({
      type: 'BBB',
      aggregateId: 'id2',
      aggregateVersion: 1,
      timestamp: 2,
      payload: { index: 3 }
    })
    await storageAdapter.saveEvent({
      type: 'AAA',
      aggregateId: 'id2',
      aggregateVersion: 2,
      timestamp: 2,
      payload: { index: 4 }
    })
    await storageAdapter.saveEvent({
      type: 'BBB',
      aggregateId: 'id1',
      aggregateVersion: 2,
      timestamp: 3,
      payload: { index: 5 }
    })
    await storageAdapter.saveEvent({
      type: 'CCC',
      aggregateId: 'id3',
      aggregateVersion: 2,
      timestamp: 3,
      payload: { index: 6 }
    })

    let events = []
    await storageAdapter.loadEvents({}, event => {
      events.push(event)
    })

    expect(events[0]).toMatchObject({
      type: 'AAA',
      aggregateId: 'id1',
      aggregateVersion: 1,
      timestamp: 1,
      payload: { index: 1 }
    })

    expect(events[1]).toMatchObject({
      type: 'CCC',
      aggregateId: 'id3',
      aggregateVersion: 1,
      timestamp: 1,
      payload: { index: 2 }
    })

    expect(events[2]).toMatchObject({
      type: 'BBB',
      aggregateId: 'id2',
      aggregateVersion: 1,
      timestamp: 2,
      payload: { index: 3 }
    })

    expect(events[3]).toMatchObject({
      type: 'AAA',
      aggregateId: 'id2',
      aggregateVersion: 2,
      timestamp: 2,
      payload: { index: 4 }
    })

    expect(events[4]).toMatchObject({
      type: 'BBB',
      aggregateId: 'id1',
      aggregateVersion: 2,
      timestamp: 3,
      payload: { index: 5 }
    })

    expect(events[5]).toMatchObject({
      type: 'CCC',
      aggregateId: 'id3',
      aggregateVersion: 2,
      timestamp: 3,
      payload: { index: 6 }
    })

    events = []
    await storageAdapter.loadEvents({ maxEventsByTimeframe: 1 }, event => {
      events.push(event)
    })

    expect(events[0]).toMatchObject({
      type: 'AAA',
      aggregateId: 'id1',
      aggregateVersion: 1,
      timestamp: 1,
      payload: { index: 1 }
    })
    expect(events[1]).toMatchObject({
      type: 'CCC',
      aggregateId: 'id3',
      aggregateVersion: 1,
      timestamp: 1,
      payload: { index: 2 }
    })

    events = []
    await storageAdapter.loadEvents({ eventTypes: ['AAA'] }, event => {
      events.push(event)
    })

    expect(events[0]).toMatchObject({
      type: 'AAA',
      aggregateId: 'id1',
      aggregateVersion: 1,
      timestamp: 1,
      payload: { index: 1 }
    })
    expect(events[1]).toMatchObject({
      type: 'AAA',
      aggregateId: 'id2',
      aggregateVersion: 2,
      timestamp: 2,
      payload: { index: 4 }
    })

    events = []
    await storageAdapter.loadEvents({ aggregateIds: ['id1'] }, event => {
      events.push(event)
    })

    expect(events[0]).toMatchObject({
      type: 'AAA',
      aggregateId: 'id1',
      aggregateVersion: 1,
      timestamp: 1,
      payload: { index: 1 }
    })

    expect(events[1]).toMatchObject({
      type: 'BBB',
      aggregateId: 'id1',
      aggregateVersion: 2,
      timestamp: 3,
      payload: { index: 5 }
    })

    events = []
    await storageAdapter.loadEvents(
      {
        startTime: 1,
        finishTime: 3
      },
      event => {
        events.push(event)
      }
    )

    expect(events[0]).toMatchObject({
      type: 'BBB',
      aggregateId: 'id2',
      aggregateVersion: 1,
      timestamp: 2,
      payload: { index: 3 }
    })
    expect(events[1]).toMatchObject({
      type: 'AAA',
      aggregateId: 'id2',
      aggregateVersion: 2,
      timestamp: 2,
      payload: { index: 4 }
    })
  })

  test('"drop" should drop events', async () => {
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

    expect(events.length).toEqual(1)

    await storageAdapter.drop()

    events = []
    await storageAdapter.loadEvents({}, event => {
      events.push(event)
    })

    expect(events.length).toEqual(0)
  })

  test('"getLatestEvent" should get the latest event', async () => {
    await storageAdapter.saveEvent({
      type: 'AAA',
      aggregateId: 'id1',
      aggregateVersion: 1,
      timestamp: 1,
      payload: { index: 1 }
    })

    expect(await storageAdapter.getLatestEvent({})).toMatchObject({
      type: 'AAA',
      aggregateId: 'id1',
      aggregateVersion: 1,
      timestamp: 1,
      payload: { index: 1 }
    })

    await storageAdapter.saveEvent({
      type: 'BBB',
      aggregateId: 'id1',
      aggregateVersion: 2,
      timestamp: 2,
      payload: { index: 2 }
    })

    expect(await storageAdapter.getLatestEvent({})).toMatchObject({
      type: 'BBB',
      aggregateId: 'id1',
      aggregateVersion: 2,
      timestamp: 2,
      payload: { index: 2 }
    })
  })
})
