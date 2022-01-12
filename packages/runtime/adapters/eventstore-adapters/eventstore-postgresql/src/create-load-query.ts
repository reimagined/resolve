import type { CursorFilter } from '@resolve-js/eventstore-base'
import { cursorToThreadArray } from '@resolve-js/eventstore-base'
import type { AdapterPool } from './types'
import { INT8_SQL_TYPE } from './constants'

type LoadFilter = Omit<CursorFilter, 'limit'> & {
  limit?: CursorFilter['limit']
}

const createLoadQuery = (
  { escapeId, escape, eventsTableName, databaseName }: AdapterPool,
  { eventTypes, aggregateIds, cursor, limit }: LoadFilter
) => {
  const vectorConditions = cursorToThreadArray(cursor)
  const injectString = (value: any): string => `${escape(value)}`
  const injectNumber = (value: any): string => `${+value}`

  const queryConditions: string[] = []
  if (eventTypes != null) {
    if (eventTypes.length === 0) {
      return null
    }
    queryConditions.push(`"type" IN (${eventTypes.map(injectString)})`)
  }
  if (aggregateIds != null) {
    if (aggregateIds.length === 0) {
      return null
    }
    queryConditions.push(`"aggregateId" IN (${aggregateIds.map(injectString)})`)
  }

  const resultQueryCondition = queryConditions.join(' AND ')
  const resultVectorConditions = `${vectorConditions
    .map(
      (threadCounter, threadId) =>
        `"threadId" = ${injectNumber(
          threadId
        )} AND "threadCounter" >= ${threadCounter}::${INT8_SQL_TYPE} `
    )
    .join(' OR ')}`

  const resultTimestampConditions = vectorConditions
    .map(
      (threadCounter, threadId) =>
        `"threadId" = ${injectNumber(
          threadId
        )} AND "threadCounter" = ${threadCounter}::${INT8_SQL_TYPE}`
    )
    .join(' OR ')

  const databaseNameAsId: string = escapeId(databaseName)
  const eventsTableAsId: string = escapeId(eventsTableName)

  return [
    `WITH "minimalTimestamp" AS (
        SELECT MIN("timestamp") AS "value" FROM ${databaseNameAsId}.${eventsTableAsId}
        WHERE ${resultTimestampConditions}
      )`,
    `SELECT * FROM ${databaseNameAsId}.${eventsTableAsId}`,
    `WHERE "timestamp" >= (SELECT "minimalTimestamp"."value" FROM "minimalTimestamp") AND (${resultVectorConditions}) ${
      resultQueryCondition.length > 0 ? `AND (${resultQueryCondition})` : ''
    }`,
    `ORDER BY "timestamp" ASC, "threadCounter" ASC, "threadId" ASC`,
    limit !== undefined ? `LIMIT ${+limit}` : '',
  ].join('\n')
}

export default createLoadQuery
