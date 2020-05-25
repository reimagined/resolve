import { EOL } from 'os'
import getLog from './get-log'
import { EventstoreResourceNotExistError } from 'resolve-eventstore-base'

const drop = async ({
  events: { tableName, connection, database },
  escapeId
}) => {
  const log = getLog('dropEventStore')

  log.debug(`dropping events tables`)
  log.verbose(`tableName: ${tableName}`)

  const eventsTableNameAsId = escapeId(tableName)
  const freezeTableNameAsId = escapeId(`${tableName}-freeze`)
  const threadsTableNameAsId = escapeId(`${tableName}-threads`)

  const statements = [
    `DROP TABLE IF EXISTS ${freezeTableNameAsId}`,
    `DROP TABLE ${threadsTableNameAsId}`,
    `DROP TABLE ${eventsTableNameAsId}`
  ]

  const errors = []

  for (const statement of statements) {
    try {
      await connection.execute(statement)
    } catch (error) {
      if (error != null) {
        if (/Unknown table/i.test(error.message)) {
          throw new EventstoreResourceNotExistError(
            `duplicate event store resource drop detected for database ${database}`
          )
        } else {
          log.error(error.message)
          log.verbose(error.stack)
        }
        errors.push(error)
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.map(error => error.stack).join(EOL))
  }
}

export default drop
