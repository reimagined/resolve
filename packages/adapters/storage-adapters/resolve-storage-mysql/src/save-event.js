import { ConcurrentError } from 'resolve-storage-base'

// https://dev.mysql.com/doc/refman/5.5/en/error-messages-server.html#error_er_dup_entry
const ER_DUP_ENTRY = 1062

const saveEvent = async ({ tableName, connection, escapeId }, event) => {
  try {
    await connection.execute(
      `INSERT INTO ${escapeId(tableName)}
      (\`timestamp\`, \`aggregateId\`, \`aggregateVersion\`, \`type\`, \`payload\`)
      VALUES (?, ?, ?, ?, ?)`,
      [
        event.timestamp,
        event.aggregateId,
        event.aggregateVersion,
        event.type,
        event.payload != null ? event.payload : null
      ]
    )
  } catch (error) {
    if (error.errno !== ER_DUP_ENTRY) {
      throw error
    }

    throw new ConcurrentError(
      `Can not save the event because aggregate '${
        event.aggregateId
      }' is not actual at the moment. Please retry later.`
    )
  }
}

export default saveEvent
