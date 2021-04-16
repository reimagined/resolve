import {
  ExternalMethods,
  ReadModelRunStatus,
  ReadModelStatus,
  ReadModelEvent,
} from './types'
import rawExecuteStatement from './raw-execute-statement'

const status: ExternalMethods['status'] = async (pool, readModelName) => {
  const {
    escapeId,
    escapeStr,
    targetEventStore,
    rdsDataService,
    coercer,
  } = pool

  const {
    dbClusterOrInstanceArn: eventStoreClusterArn,
    awsSecretStoreArn: eventStoreSecretArn,
    databaseName: eventStoreDatabaseName,
    eventsTableName: eventStoreEventsTableName = 'events',
  } = targetEventStore

  const eventStoreDatabaseNameAsString = escapeStr(eventStoreDatabaseName)
  const eventStorePauseTableNameAsString: string = escapeStr(
    `${eventStoreEventsTableName}-pause`
  )
  const eventStoreDatabaseNameAsId = escapeId(eventStoreDatabaseName)
  const eventStoreEventsTableAsId = escapeId(eventStoreEventsTableName)

  const pauseCheckPromise = rawExecuteStatement(
    rdsDataService,
    eventStoreClusterArn,
    eventStoreSecretArn,
    coercer,
    `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE  table_schema = ${eventStoreDatabaseNameAsString}
          AND    table_name   = ${eventStorePauseTableNameAsString}
         ) AS "pauseCheck"
    `
  )

  const eventsPromise = rawExecuteStatement(
    rdsDataService,
    eventStoreClusterArn,
    eventStoreSecretArn,
    coercer,
    `SELECT "threadCounter", "threadId", "type", "timestamp", "aggregateId", "aggregateVersion", "payload"
        FROM ${eventStoreDatabaseNameAsId}.${eventStoreEventsTableAsId}
        ORDER BY "timestamp" DESC, "threadCounter" DESC, "threadId" DESC
        LIMIT 1
    `
  )

  const check = (await pauseCheckPromise) as Array<{
    pauseCheck: boolean
  }>

  let status: ReadModelRunStatus = ReadModelRunStatus.DELIVER
  if (check && check.length && check[0].pauseCheck)
    status = ReadModelRunStatus.SKIP

  const events = (await eventsPromise) as Array<{
    threadCounter: number
    threadId: number
    type: string
    timestamp: number
    aggregateId: string
    aggregateVersion: number
    payload: string
  }>

  let lastEvent: ReadModelEvent
  if (events.length) {
    let payload
    try {
      payload = JSON.parse(events[0].payload)
    } catch (error) {
      payload = {}
    }
    lastEvent = {
      threadCounter: events[0].threadCounter,
      threadId: events[0].threadId,
      type: events[0].type,
      timestamp: events[0].timestamp,
      aggregateId: events[0].aggregateId,
      aggregateVersion: events[0].aggregateVersion,
      payload,
    }
  } else {
    lastEvent = {
      type: 'Init',
    } as ReadModelEvent
  }

  const result: ReadModelStatus = {
    eventSubscriber: '',
    deliveryStrategy: 'inline-ledger',
    successEvent: lastEvent,
    failedEvent: null,
    errors: null,
    cursor: null,
    status: status,
  }
  return result
}

export default status
