import { LONG_STRING_SQL_TYPE } from './constants'

const saveSequenceOnly = async (pool, eventId, timestamp) => {
  const { databaseName, tableName, executeStatement, escapeId } = pool

  await executeStatement(
    [
      `UPDATE ${escapeId(databaseName)}.${escapeId(`${tableName}-sequence`)} `,
      `SET ${escapeId('eventId')} = ${+eventId},`,
      `${escapeId(
        'transactionId'
      )} = CAST(txid_current() AS ${LONG_STRING_SQL_TYPE}),`,
      `${escapeId('timestamp')} = ${+timestamp}`,
      `WHERE ${escapeId('key')} = 0;`
    ].join('')
  )
}

export default saveSequenceOnly
