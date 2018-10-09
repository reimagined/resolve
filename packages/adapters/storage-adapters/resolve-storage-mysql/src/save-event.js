import { ConcurrentError } from 'resolve-storage-base'

// https://dev.mysql.com/doc/refman/5.5/en/error-messages-server.html#error_er_dup_entry
const ER_DUP_ENTRY = 1062

const saveEvent = async (pool, event) => {
  try {
    await pool.connection.execute(
      `INSERT INTO ${pool.escapeId(pool.tableName)}
      (\`timestamp\`, \`aggregateId\`, \`aggregateVersion\`, \`type\`, \`payload\`)
      VALUES (?, ?, ?, ?, ?)`,
      [
        event.timestamp,
        event.aggregateId,
        event.aggregateVersion,
        event.type,
        event.payload
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
