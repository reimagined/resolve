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

  const queryConditions: string[] = ['1 = 1']
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

  const databaseNameAsId: string = escapeId(databaseName)
  const eventsTableAsId: string = escapeId(eventsTableName)

  if (limit !== undefined) {
    return [
      `SELECT "sortedEvents".* FROM (`,
      `  SELECT "unitedEvents".* FROM (`,
      vectorConditions
        .map(
          (threadCounter, threadId) =>
            `(${[
              `SELECT * FROM ${databaseNameAsId}.${eventsTableAsId}`,
              `WHERE (${resultQueryCondition}) AND "threadId" = ${threadId} AND "threadCounter" >= ${threadCounter}::${INT8_SQL_TYPE}`,
              `ORDER BY "threadCounter" ASC`,
              `LIMIT ${limit}`,
            ].join(' ')})`
        )
        .join(' UNION ALL \n'),
      `  ) "unitedEvents"`,
      `  ORDER BY "unitedEvents"."timestamp" ASC`,
      `  LIMIT ${+limit}`,
      `) "sortedEvents"`,
      `ORDER BY "sortedEvents"."timestamp" ASC,`,
      `"sortedEvents"."threadCounter" ASC,`,
      `"sortedEvents"."threadId" ASC`,
    ].join('\n')
  } else {
    const resultVectorConditions = `${vectorConditions
      .map(
        (threadCounter, threadId) =>
          `"threadId" = ${injectNumber(
            threadId
          )} AND "threadCounter" >= ${threadCounter}::${INT8_SQL_TYPE} `
      )
      .join(' OR ')}`

    return [
      `SELECT * FROM ${databaseNameAsId}.${eventsTableAsId}`,
      `WHERE (${resultVectorConditions}) AND (${resultQueryCondition})`,
      `ORDER BY "timestamp" ASC, "threadCounter" ASC, "threadId" ASC`,
    ].join('\n')
  }
}

export default createLoadQuery
