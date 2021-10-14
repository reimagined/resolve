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

  const resultQueryCondition = `WHERE ${
    queryConditions.length > 0 ? `${queryConditions.join(' AND ')} AND (` : ''
  }
    ${vectorConditions
      .map(
        (threadCounter, threadId) =>
          `"threadId" = ${injectNumber(
            threadId
          )} AND "threadCounter" >= ${threadCounter}::${INT8_SQL_TYPE} `
      )
      .join(' OR ')}
    ${queryConditions.length > 0 ? ')' : ''}`

  const databaseNameAsId: string = escapeId(databaseName)
  const eventsTableAsId: string = escapeId(eventsTableName)

  return [
    `SELECT * FROM ${databaseNameAsId}.${eventsTableAsId}`,
    `${resultQueryCondition}`,
    `ORDER BY "timestamp" ASC, "threadCounter" ASC, "threadId" ASC`,
    limit !== undefined ? `LIMIT ${+limit}` : '',
  ].join('\n')
}

export default createLoadQuery
