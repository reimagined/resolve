import { EventstoreResourceNotExistError } from 'resolve-eventstore-base'
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
    maybeThrowResourceError,
  } = pool

  log.debug(`dropping secrets store database tables`)
  log.verbose(`secretsTableName: ${secretsTableName}`)

  const eventsTableNameAsId: string = escapeId(eventsTableName)
  const freezeTableNameAsId: string = escapeId(`${eventsTableName}-freeze`)
  const threadsTableNameAsId: string = escapeId(`${eventsTableName}-threads`)
  const snapshotsTableNameAsId: string = escapeId(snapshotsTableName)
  const secretsTableNameAsId: string = escapeId(secretsTableName)

  log.debug(`secrets store database tables are dropped`)

  const statements: string[] = [
    `DROP TABLE IF EXISTS ${freezeTableNameAsId}`,
    `DROP TABLE ${threadsTableNameAsId}`,
    `DROP TABLE ${eventsTableNameAsId}`,
    `DROP TABLE ${snapshotsTableNameAsId}`,
    `DROP TABLE ${secretsTableNameAsId}`,
  ]

  const errors: any[] = []

  log.debug(`dropping the event store`)

  for (const statement of statements) {
    try {
      log.debug(`executing query`)
      log.verbose(statement)
      await connection.execute(statement)
      log.debug(`query executed successfully`)
    } catch (error) {
      if (error != null) {
        if (/Unknown (?:Table|Index)/i.test(error.message)) {
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

  maybeThrowResourceError(errors)

  log.debug(`the event store dropped`)
}

export default drop
