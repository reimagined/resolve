import { EventstoreResourceNotExistError } from 'resolve-eventstore-base'
import { EOL } from 'os'
import getLog from './get-log'
import { AdapterPool } from './types'

const drop = async (pool: AdapterPool): Promise<any> => {
  const log = getLog('drop')
  const {
    eventsTableName,
    snapshotsTableName,
    secretsTableName,
    connection,
    database,
    escapeId,
  } = pool

  const eventsTableNameAsId: string = escapeId(eventsTableName)
  const freezeTableNameAsId: string = escapeId(`${eventsTableName}-freeze`)
  const threadsTableNameAsId: string = escapeId(`${eventsTableName}-threads`)
  const snapshotsTableNameAsId: string = escapeId(snapshotsTableName)
  const secretsTableNameAsId: string = escapeId(secretsTableName)

  const statements: string[] = [
    `DROP TABLE IF EXISTS ${freezeTableNameAsId}`,
    `DROP TABLE ${threadsTableNameAsId}`,
    `DROP TABLE ${eventsTableNameAsId}`,
    `DROP TABLE ${snapshotsTableNameAsId}`,
    `DROP TABLE IF EXISTS ${secretsTableNameAsId}`,
  ]

  const errors: any[] = []

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
    throw new Error(errors.map((error) => error.stack).join(EOL))
  }
}

export default drop
